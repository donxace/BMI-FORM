#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================
// COMBINED TEST RIG — PRACTICE BOARD, DUAL-SERVER
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
// This is a practice/testing rig, so — purely for convenience —
// it talks to BOTH the BMI-FORM backend (port 3000) and the
// VITALYZE backend (port 3001) from the one board, instead of
// needing two separate rigs:
//
//   - /personnel/rfid/scan and /environment-monitoring/reading
//     exist under the same path on both backends, so those go
//     out to both servers every time.
//   - Height/weight readings and session polling use each
//     backend's own base path — "bmi-assessments" on BMI-FORM,
//     "vital-sign-assessments" on VITALYZE — since that's what
//     each one actually calls it.
//   - Intrusion detection only exists on BMI-FORM's backend
//     (VITALYZE has no such module), so it stays BMI-only.
//
// ----------------------------------------------------------
// SERIAL MENU (type a number into the Serial Monitor, Enter)
// ----------------------------------------------------------
// Temperature and smoke-level readings are automatic — they
// post to the Environment Monitoring page every few seconds on
// their own and aren't part of the menu. Everything else that
// needs a fake trigger is picked by number instead:
//
//   1  -> fake RFID card tap (personnel/rfid/scan) using
//         FAKE_RFID_UID, a card already assigned to someone —
//         for testing identification/login. Sent to both
//         servers.
//   2  -> trigger intrusion alert (also spikes the next few
//         environment readings, to simulate an intrusion
//         coinciding with a break-in/fire). BMI-FORM only.
//   3  -> clear intrusion alert. BMI-FORM only.
//   4  -> fake RFID card tap using BLANK_RFID_UID, a UID no one
//         is assigned to yet — for testing the admin Personnel
//         page's "Provision Card" flow (option 1's UID is
//         already claimed, so it can't be used for this). Sent
//         to both servers.
//
// ----------------------------------------------------------
// SEQUENCE FOR THE BMI/VITALS FLOW
// ----------------------------------------------------------
// 1. Type "1" + Enter to fake an RFID scan -> Measurement
//    page's Automatic mode (or the Login page) identifies the
//    card, on either site.
// 2. Admin presses "Start Measurement" on either website -> this
//    board polls both session/status endpoints and prompts for
//    input as soon as either one reports active.
// 3. Type a height value into the Serial Monitor and press
//    Enter, then a weight value and press Enter -> both post to
//    BOTH backends' reading endpoints and auto-fill whichever
//    Measurement page is running a session.
//    (While a measurement session is active, typed lines go to
//    height/weight instead of the menu above.)
// ============================================================

// ---- WIFI ----

const char* ssid = "HMS PON";
const char* password = "itsdhms@2026";

// ---- SERVER ENDPOINTS ----
// Same machine, two backends: BMI-FORM on 3000, VITALYZE on 3001.

const char* bmiServerIP = "192.168.1.32";
const int bmiServerPort = 3000;

const char* vitalsServerIP = "192.168.1.32";
const int vitalsServerPort = 3001;

String rfidScanUrlBmi =
  "http://" + String(bmiServerIP) + ":" + String(bmiServerPort) + "/personnel/rfid/scan";
String rfidScanUrlVitals =
  "http://" + String(vitalsServerIP) + ":" + String(vitalsServerPort) + "/personnel/rfid/scan";

String readingUrlBmi =
  "http://" + String(bmiServerIP) + ":" + String(bmiServerPort) + "/bmi-assessments/reading";
String readingUrlVitals =
  "http://" + String(vitalsServerIP) + ":" + String(vitalsServerPort) + "/vital-sign-assessments/reading";

String sessionStatusUrlBmi =
  "http://" + String(bmiServerIP) + ":" + String(bmiServerPort) + "/bmi-assessments/session/status";
String sessionStatusUrlVitals =
  "http://" + String(vitalsServerIP) + ":" + String(vitalsServerPort) + "/vital-sign-assessments/session/status";

String intrusionEventUrl =
  "http://" + String(bmiServerIP) + ":" + String(bmiServerPort) + "/intrusion-detection/event";

String environmentReadingUrlBmi =
  "http://" + String(bmiServerIP) + ":" + String(bmiServerPort) + "/environment-monitoring/reading";
String environmentReadingUrlVitals =
  "http://" + String(vitalsServerIP) + ":" + String(vitalsServerPort) + "/environment-monitoring/reading";

// ---- SHARED HTTP POST HELPER ----
// Every "send to both servers" call funnels through here so the
// WiFi check + response logging only needs writing once.

void postJsonTo(const String& url, const String& json, const char* serverLabel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(json);

  Serial.print("  [");
  Serial.print(serverLabel);
  Serial.print("] HTTP ");
  Serial.print(responseCode);
  Serial.print(" - ");
  Serial.println(http.getString());

  http.end();
}

// ---- STEP 1: FAKE RFID TAP ----
// Swap FAKE_RFID_UID for any other rfid_uid already seeded in
// the personnel table to identify a different person.

const char* FAKE_RFID_UID = "RFID-1001"; // Reyes, Carlo D. - PAT (seeded in bmi_monitoring.personnel)

// A UID that deliberately does NOT exist in either personnel table
// yet, for testing the admin Personnel page's "Provision Card"
// flow. FAKE_RFID_UID can't be reused for that — it's already
// claimed, so the provision auto-fill would just keep reporting it
// as already assigned. Pick a fresh one here if this one ever gets
// provisioned on both sides.
const char* BLANK_RFID_UID = "RFID-BLANK-TEST";

void sendFakeRfidScan(const char* uid, const char* label) {
  String json = "{\"rfid_uid\":\"" + String(uid) + "\"}";

  Serial.println();
  Serial.println("================================");
  Serial.print("FAKE RFID TAP (");
  Serial.print(label);
  Serial.println(") -> both servers");
  Serial.println(json);

  postJsonTo(rfidScanUrlBmi, json, "BMI-FORM :3000");
  postJsonTo(rfidScanUrlVitals, json, "VITALYZE :3001");

  Serial.println("================================");
}

// ---- STEP 2/3: SESSION + SERIAL HEIGHT/WEIGHT INPUT ----

enum ReadingInputStage {
  WAITING_FOR_HEIGHT,
  WAITING_FOR_WEIGHT,
};

ReadingInputStage readingStage = WAITING_FOR_HEIGHT;
float pendingHeight = 0;

bool sessionActive = false;

const unsigned long SESSION_POLL_INTERVAL_MS = 1000;
unsigned long lastSessionCheck = 0;

// Polls one session/status endpoint; used for both backends.
bool fetchSessionActive(const String& url) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;

  http.begin(url);

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

  // A session on EITHER site is enough to start prompting — the
  // reading gets posted to both regardless (see sendReading below).
  bool active =
    fetchSessionActive(sessionStatusUrlBmi) ||
    fetchSessionActive(sessionStatusUrlVitals);

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

    printMenu();
  }
}

void sendReading(float heightCm, float weightKg) {
  String json = "{";
  json += "\"height\":" + String(heightCm, 1) + ",";
  json += "\"weight\":" + String(weightKg, 1);
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("Sending live reading -> both servers...");
  Serial.println(json);

  postJsonTo(readingUrlBmi, json, "BMI-FORM :3000");
  postJsonTo(readingUrlVitals, json, "VITALYZE :3001");

  Serial.println("================================");
}

void handleHeightWeightLine(const String& line) {
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

    sendReading(pendingHeight, pendingWeight);

    readingStage = WAITING_FOR_HEIGHT;
    promptForHeight();
  }
}

// ---- INTRUSION DETECTION (menu options 2/3, BMI-FORM only — ----
// ---- VITALYZE has no intrusion-detection module) --------------

const char* INTRUSION_SENSOR_ID = "TEST-BUTTON";

bool intrusionActive = false;

void sendIntrusionStatus(bool triggered) {
  String json = "{";
  json += "\"status\":\"" + String(triggered ? "triggered" : "clear") + "\",";
  json += "\"sensor_id\":\"" + String(INTRUSION_SENSOR_ID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(triggered ? "TRIGGERED - INTRUSION! (menu option 2)" : "Clear. (menu option 3)");
  Serial.println(json);

  postJsonTo(intrusionEventUrl, json, "BMI-FORM :3000");

  Serial.println("================================");
}

// ---- ENVIRONMENT MONITORING (automatic, boosted while intrusion is active) ----

const char* ENV_SENSOR_ID = "ENV-01";

const float ROOM_TEMP_C = 28.0;
const int CLEAN_AIR_LEVEL = 300;

const unsigned long ENV_SEND_INTERVAL_MS = 3000;
unsigned long lastEnvSendAt = 0;

float readFakeTemperature() {
  if (intrusionActive) {
    // Simulated fire/overheat condition.
    return 55.0 + random(0, 150) / 10.0; // ~55.0 - 70.0 C
  }

  // Small random jitter around room temperature.
  return ROOM_TEMP_C + random(-20, 21) / 10.0; // +/- 2.0 C
}

int readFakeSmokeLevel() {
  if (intrusionActive) {
    // Simulated smoke condition.
    return 2000 + random(0, 1000); // 2000 - 3000
  }

  // Small random jitter around a clean-air baseline.
  return CLEAN_AIR_LEVEL + random(-50, 51);
}

void sendEnvironmentReading() {
  float temperatureC = readFakeTemperature();
  int smokeLevel = readFakeSmokeLevel();

  String json = "{";
  json += "\"temperature\":" + String(temperatureC, 1) + ",";
  json += "\"smoke_level\":" + String(smokeLevel) + ",";
  json += "\"sensor_id\":\"" + String(ENV_SENSOR_ID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(
    intrusionActive
      ? "SIMULATED ENVIRONMENT ALERT (intrusion active) -> both servers"
      : "Sending normal environment reading -> both servers..."
  );
  Serial.println(json);

  postJsonTo(environmentReadingUrlBmi, json, "BMI-FORM :3000");
  postJsonTo(environmentReadingUrlVitals, json, "VITALYZE :3001");

  Serial.println("================================");
}

void handleEnvironmentTimer() {
  if (millis() - lastEnvSendAt < ENV_SEND_INTERVAL_MS) {
    return;
  }

  lastEnvSendAt = millis();

  sendEnvironmentReading();
}

// ---- SERIAL MENU (numbers 1-4, only outside a measurement session) ----

void printMenu() {
  Serial.println();
  Serial.println("================================");
  Serial.println("SERIAL MENU - type a number, then Enter:");
  Serial.println("  1) Simulate RFID tap (known personnel) -> both servers");
  Serial.print("  2) Trigger intrusion alert (BMI-FORM only)");
  Serial.println(intrusionActive ? "  [already triggered]" : "");
  Serial.print("  3) Clear intrusion alert (BMI-FORM only)");
  Serial.println(intrusionActive ? "" : "  [already clear]");
  Serial.println("  4) Simulate BLANK card tap (Provision Card testing) -> both servers");
  Serial.println("(Temperature/smoke readings post automatically every 3s, to both servers.)");
  Serial.println("================================");
}

void handleMenuLine(const String& line) {
  if (line == "1") {
    sendFakeRfidScan(FAKE_RFID_UID, "menu option 1, known personnel");

  } else if (line == "2") {
    if (intrusionActive) {
      Serial.println("Intrusion is already triggered.");
    } else {
      intrusionActive = true;
      sendIntrusionStatus(true);
    }

  } else if (line == "3") {
    if (!intrusionActive) {
      Serial.println("Intrusion is already clear.");
    } else {
      intrusionActive = false;
      sendIntrusionStatus(false);
    }

  } else if (line == "4") {
    sendFakeRfidScan(BLANK_RFID_UID, "menu option 4, blank card");

  } else {
    Serial.println("Unknown option.");
  }

  printMenu();
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

  if (sessionActive) {
    handleHeightWeightLine(line);
  } else {
    handleMenuLine(line);
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

  randomSeed(analogRead(0));

  connectToWiFi();

  Serial.println();
  Serial.println("================================");
  Serial.println("COMBINED TEST RIG READY (dual-server: BMI-FORM :3000 + VITALYZE :3001)");
  Serial.println("Sending environment readings every 3s regardless.");
  Serial.println("Waiting for admin to start a measurement session on either site...");
  Serial.println("================================");

  printMenu();
}

void loop() {
  handleSessionPolling();
  handleSerialInput();
  handleEnvironmentTimer();

  delay(20);
}
