#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "HUAWEI-3j74";
const char* password = "dxp2jzb9";

const char* rfidScanUrl =
  "http://192.168.1.22:3000/personnel/rfid/scan";

const char* readingUrl =
  "http://192.168.1.22:3000/bmi-assessments/reading";

const char* sessionStatusUrl =
  "http://192.168.1.22:3000/bmi-assessments/session/status";

// ========================================
// SEQUENCE
// ========================================
// 1. Hold BOOT to fake an RFID tap -> the Measurement page's
//    Automatic mode identifies the personnel via
//    /personnel/rfid/latest.
// 2. Admin presses "Start Measurement" on the website -> the
//    board polls /bmi-assessments/session/status and only then
//    starts prompting for input.
// 3. Type a height value into the Serial Monitor and press
//    Enter -> it's posted to /bmi-assessments/reading right
//    away and appears on the Measurement page within ~1s.
//    Then type a weight value and press Enter -> same thing,
//    posted the instant it's captured instead of waiting for
//    both values.
// ========================================

// ---- STEP 1: FAKE RFID TAP (NO READER WIRED UP YET) ----
// Swap FAKE_RFID_UID for any other rfid_uid already seeded in
// the personnel table to identify a different person.

const int RFID_BUTTON_PIN = 0; // BOOT button on most ESP32 dev boards
const char* FAKE_RFID_UID = "RFID-125421521"; // Reyes, Carlo D. - PAT

const unsigned long RFID_DEBOUNCE_MS = 200;

unsigned long rfidCandidateSince = 0;
bool rfidCandidateState = false;
bool rfidLastSentPressed = false;

// ---- STEP 2: SERIAL HEIGHT/WEIGHT INPUT ----

enum ReadingInputStage {
  WAITING_FOR_HEIGHT,
  WAITING_FOR_WEIGHT,
};

ReadingInputStage readingStage = WAITING_FOR_HEIGHT;
float pendingHeight = 0;

// ---- SESSION STATE (SET BY THE ADMIN ON THE WEBSITE) ----

bool sessionActive = false;

const unsigned long SESSION_POLL_INTERVAL_MS = 1000;
unsigned long lastSessionCheck = 0;

void connectToWiFi() {
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void sendFakeRfidScan() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(rfidScanUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"rfid_uid\":\"" + String(FAKE_RFID_UID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("FAKE RFID TAP");
  Serial.println(json);
  Serial.println("================================");

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println(http.getString());

  http.end();
}

void handleFakeRfidButton() {
  bool pressedNow = (digitalRead(RFID_BUTTON_PIN) == LOW);

  if (pressedNow != rfidCandidateState) {
    rfidCandidateState = pressedNow;
    rfidCandidateSince = millis();
  }

  bool debounced =
    (millis() - rfidCandidateSince) >= RFID_DEBOUNCE_MS;

  // Send once per press (rising edge), not repeatedly while held.
  if (debounced &&
      rfidCandidateState &&
      !rfidLastSentPressed) {

    sendFakeRfidScan();
    rfidLastSentPressed = true;

  } else if (debounced && !rfidCandidateState) {

    rfidLastSentPressed = false;
  }
}

bool fetchSessionActive() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;

  http.begin(sessionStatusUrl);

  int responseCode = http.GET();
  bool active = false;

  if (responseCode == 200) {
    String body = http.getString();
    active = body.indexOf("\"active\":true") >= 0;
  }

  http.end();

  return active;
}

void handleSessionPolling() {
  if (millis() - lastSessionCheck < SESSION_POLL_INTERVAL_MS) {
    return;
  }

  lastSessionCheck = millis();

  bool active = fetchSessionActive();

  if (active && !sessionActive) {

    sessionActive = true;
    readingStage = WAITING_FOR_HEIGHT;

    Serial.println();
    Serial.println("================================");
    Serial.println("Measurement session started by admin.");
    Serial.println("================================");

    promptForHeight();

  } else if (!active && sessionActive) {

    sessionActive = false;
    readingStage = WAITING_FOR_HEIGHT;

    Serial.println();
    Serial.println("================================");
    Serial.println("Measurement session ended.");
    Serial.println("Waiting for admin to start a new session...");
    Serial.println("================================");
  }
}

void promptForHeight() {
  Serial.println();
  Serial.println("Enter HEIGHT in cm, then press Enter:");
}

void promptForWeight() {
  Serial.println("Enter WEIGHT in kg, then press Enter:");
}

// Posts a single field (height or weight) as soon as it's
// captured, so the Measurement page's 1s poll can display it
// live instead of waiting for the full height+weight cycle.
void sendReading(const char* fieldName, float value) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(readingUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"";
  json += fieldName;
  json += "\":";
  json += String(value, 1);
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.print("Sending live reading (");
  Serial.print(fieldName);
  Serial.println(")...");
  Serial.println(json);

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println(http.getString());
  Serial.println("================================");

  http.end();
}

void handleSerialInput() {
  if (!Serial.available()) {
    return;
  }

  String line = Serial.readStringUntil('\n');
  line.trim();

  if (line.length() == 0) {
    return;
  }

  if (readingStage == WAITING_FOR_HEIGHT) {
    pendingHeight = line.toFloat();

    Serial.print("Height set to: ");
    Serial.println(pendingHeight, 1);

    sendReading("height", pendingHeight);

    readingStage = WAITING_FOR_WEIGHT;
    promptForWeight();

  } else {
    float pendingWeight = line.toFloat();

    Serial.print("Weight set to: ");
    Serial.println(pendingWeight, 1);

    sendReading("weight", pendingWeight);

    readingStage = WAITING_FOR_HEIGHT;
    promptForHeight();
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(RFID_BUTTON_PIN, INPUT_PULLUP);

  connectToWiFi();

  Serial.println();
  Serial.println(
    "Hold BOOT to fake an RFID tap (" +
    String(FAKE_RFID_UID) + ")."
  );

  Serial.println("Waiting for admin to start a measurement session...");
}

void loop() {
  handleFakeRfidButton();
  handleSessionPolling();

  if (sessionActive) {
    handleSerialInput();
  }

  delay(20);
}
