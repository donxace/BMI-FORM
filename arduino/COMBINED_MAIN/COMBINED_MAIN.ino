#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================
// COMBINED TEST RIG
// ============================================================
// Merges BMI_MAIN.ino, INTRUSION_DETECTION.ino, and
// ENVIRONMENT_MONITORING.ino into a single sketch, so one bare
// ESP32 (no sensors wired up yet) can exercise every page on
// the website. RFID.ino is NOT merged in here — it's a stock
// MFRC522 library example for when a real SPI card reader gets
// wired up, and doesn't use WiFi/HTTP at all, so it can't share
// this sketch's loop(). Swap FAKE_RFID_UID's send call for real
// reader output when that hardware arrives.
//
// ----------------------------------------------------------
// ONE BUTTON, THREE JOBS
// ----------------------------------------------------------
// All three source sketches used the onboard BOOT button
// (GPIO0) as their fake trigger, so this rig gives it two
// gestures instead of one:
//
//   - Quick tap   (released before LONG_PRESS_MS)
//       -> fake RFID card tap (personnel/rfid/scan)
//   - Press and hold (past LONG_PRESS_MS)
//       -> intrusion "triggered" AND a simulated smoke/fire
//          spike, both clearing the moment you let go
//
// ----------------------------------------------------------
// SEQUENCE FOR THE BMI FLOW
// ----------------------------------------------------------
// 1. Quick-tap BOOT to fake an RFID scan -> Measurement page's
//    Automatic mode (or the Login page) identifies the card.
// 2. Admin presses "Start Measurement" on the website -> this
//    board polls /bmi-assessments/session/status and only then
//    prompts for input.
// 3. Type a height value into the Serial Monitor and press
//    Enter, then a weight value and press Enter -> both post to
//    /bmi-assessments/reading and auto-fill the Measurement page.
// ============================================================

// ---- WIFI ----

const char* ssid = "HUAWEI-3j74";
const char* password = "dxp2jzb9";

// ---- SERVER ENDPOINTS ----

const char* rfidScanUrl =
  "http://192.168.1.8:3000/personnel/rfid/scan";

const char* bmiReadingUrl =
  "http://192.168.1.8:3000/bmi-assessments/reading";

const char* sessionStatusUrl =
  "http://192.168.1.8:3000/bmi-assessments/session/status";

const char* intrusionEventUrl =
  "http://192.168.1.8:3000/intrusion-detection/event";

const char* environmentReadingUrl =
  "http://192.168.1.8:3000/environment-monitoring/reading";

// ---- SHARED BUTTON ----

const int BUTTON_PIN = 0; // BOOT button on most ESP32 dev boards
const unsigned long DEBOUNCE_MS = 50;
const unsigned long LONG_PRESS_MS = 600;

bool buttonRawPressed = false;
unsigned long buttonChangeAt = 0;

bool buttonDebounced = false;
unsigned long pressStartAt = 0;
bool longPressFired = false;

bool isAlertHeld() {
  return buttonDebounced && longPressFired;
}

// ---- STEP 1: FAKE RFID TAP ----
// Swap FAKE_RFID_UID for any other rfid_uid already seeded in
// the personnel table to identify a different person.

const char* FAKE_RFID_UID = "RFID-125421521"; // Reyes, Carlo D. - PAT

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
  Serial.println("FAKE RFID TAP (quick press)");
  Serial.println(json);
  Serial.println("================================");

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println(http.getString());

  http.end();
}

// ---- STEP 2/3: BMI SESSION + SERIAL HEIGHT/WEIGHT INPUT ----

enum ReadingInputStage {
  WAITING_FOR_HEIGHT,
  WAITING_FOR_WEIGHT,
};

ReadingInputStage readingStage = WAITING_FOR_HEIGHT;
float pendingHeight = 0;

bool sessionActive = false;

const unsigned long SESSION_POLL_INTERVAL_MS = 1000;
unsigned long lastSessionCheck = 0;

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

void promptForHeight() {
  Serial.println();
  Serial.println("Enter HEIGHT in cm, then press Enter:");
}

void promptForWeight() {
  Serial.println("Enter WEIGHT in kg, then press Enter:");
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

void sendBmiReading(float heightCm, float weightKg) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(bmiReadingUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"height\":" + String(heightCm, 1) + ",";
  json += "\"weight\":" + String(weightKg, 1);
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("Sending live reading...");
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

    readingStage = WAITING_FOR_WEIGHT;
    promptForWeight();

  } else {
    float pendingWeight = line.toFloat();

    Serial.print("Weight set to: ");
    Serial.println(pendingWeight, 1);

    sendBmiReading(pendingHeight, pendingWeight);

    readingStage = WAITING_FOR_HEIGHT;
    promptForHeight();
  }
}

// ---- INTRUSION DETECTION (long press = triggered) ----

const char* INTRUSION_SENSOR_ID = "TEST-BUTTON";

void sendIntrusionStatus(bool triggered) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(intrusionEventUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"status\":\"" + String(triggered ? "triggered" : "clear") + "\",";
  json += "\"sensor_id\":\"" + String(INTRUSION_SENSOR_ID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(triggered ? "TRIGGERED - INTRUSION! (long press)" : "Clear.");
  Serial.println(json);

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println("================================");

  http.end();
}

// ---- ENVIRONMENT MONITORING (periodic, boosted while held) ----

const char* ENV_SENSOR_ID = "ENV-01";

const float ROOM_TEMP_C = 28.0;
const int CLEAN_AIR_LEVEL = 300;

const unsigned long ENV_SEND_INTERVAL_MS = 3000;
unsigned long lastEnvSendAt = 0;

float readFakeTemperature() {
  if (isAlertHeld()) {
    // Simulated fire/overheat condition.
    return 55.0 + random(0, 150) / 10.0; // ~55.0 - 70.0 C
  }

  // Small random jitter around room temperature.
  return ROOM_TEMP_C + random(-20, 21) / 10.0; // +/- 2.0 C
}

int readFakeSmokeLevel() {
  if (isAlertHeld()) {
    // Simulated smoke condition.
    return 2000 + random(0, 1000); // 2000 - 3000
  }

  // Small random jitter around a clean-air baseline.
  return CLEAN_AIR_LEVEL + random(-50, 51);
}

void sendEnvironmentReading() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  float temperatureC = readFakeTemperature();
  int smokeLevel = readFakeSmokeLevel();

  HTTPClient http;

  http.begin(environmentReadingUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"temperature\":" + String(temperatureC, 1) + ",";
  json += "\"smoke_level\":" + String(smokeLevel) + ",";
  json += "\"sensor_id\":\"" + String(ENV_SENSOR_ID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(
    isAlertHeld()
      ? "SIMULATED ENVIRONMENT ALERT (long press)"
      : "Sending normal environment reading..."
  );
  Serial.println(json);

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println("================================");

  http.end();
}

void handleEnvironmentTimer() {
  if (millis() - lastEnvSendAt < ENV_SEND_INTERVAL_MS) {
    return;
  }

  lastEnvSendAt = millis();

  sendEnvironmentReading();
}

// ---- SHARED BUTTON STATE MACHINE ----

void handleButton() {
  bool rawPressed = (digitalRead(BUTTON_PIN) == LOW);

  if (rawPressed != buttonRawPressed) {
    buttonRawPressed = rawPressed;
    buttonChangeAt = millis();
  }

  bool settled = (millis() - buttonChangeAt) >= DEBOUNCE_MS;

  if (!settled) {
    return;
  }

  // Just pressed.
  if (buttonRawPressed && !buttonDebounced) {
    buttonDebounced = true;
    pressStartAt = millis();
    longPressFired = false;
  }

  // Crossed the long-press threshold while still held.
  if (buttonDebounced &&
      !longPressFired &&
      (millis() - pressStartAt) >= LONG_PRESS_MS) {

    longPressFired = true;
    sendIntrusionStatus(true);
  }

  // Just released.
  if (!buttonRawPressed && buttonDebounced) {
    buttonDebounced = false;

    if (longPressFired) {
      sendIntrusionStatus(false);
    } else {
      sendFakeRfidScan();
    }
  }
}

// ---- SETUP / LOOP ----

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

void setup() {
  Serial.begin(115200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  randomSeed(analogRead(0));

  connectToWiFi();

  Serial.println();
  Serial.println("================================");
  Serial.println("COMBINED TEST RIG READY");
  Serial.print("Quick-tap BOOT  -> fake RFID tap (");
  Serial.print(FAKE_RFID_UID);
  Serial.println(")");
  Serial.println("Hold BOOT       -> intrusion triggered + environment alert");
  Serial.println("Release         -> intrusion clear, environment back to normal");
  Serial.println("Sending environment readings every 3s regardless.");
  Serial.println("Waiting for admin to start a measurement session...");
  Serial.println("================================");
}

void loop() {
  handleButton();
  handleSessionPolling();

  if (sessionActive) {
    handleSerialInput();
  }

  handleEnvironmentTimer();

  delay(20);
}
