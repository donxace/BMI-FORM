#include <WiFi.h>
#include <HTTPClient.h>
#include <HX711_ADC.h>
#include <Preferences.h>

// ========================================
// DEBUG SWITCHES
// ========================================
// Both can be flipped at any time from the Serial Monitor
// (send the letter + Enter, even while readings are printing):
//   w -> WiFi ON/OFF
//        ON : WiFi, website session, RFID tap, weight/height posted
//             to the Measurement page.
//        OFF: TEST MODE: scale only. No WiFi, no API, no website.
//             Prints ">>> STABLE: xx kg" when the weight settles.
//   d -> live readout ON/OFF (kg, lb, spread twice a second)
// These are only the boot defaults:
bool useWifi = true;
bool debugLive = true;

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
//    Then step on the HX711 load cell -> once the reading is
//    stable it's posted automatically (no typing).
//
// WEIGHT SENSOR (HX711 on DT=GPIO4, SCK=GPIO5):
//   Calibration is fixed in code; the zero point is saved to
//   flash, so a reboot with someone on the scale is harmless.
//   t -> re-zero with the platform EMPTY (saved to flash)
// ========================================

// ---- HX711 LOAD CELL ----

const int HX711_DT_PIN = 4;
const int HX711_SCK_PIN = 5;

// Counts per kg, fitted on a real 72 kg person.
const float CALIBRATION_VALUE = -26900.0;
const unsigned long SCALE_STABILIZING_MS = 2000;
const int SCALE_SAMPLES_IN_USE = 8;     // smoothing inside HX711_ADC

const float MIN_WEIGHT_KG = 2.0;        // ignore anything lighter
const float STABLE_RANGE_KG = 0.30;     // max spread across window (body sway)
const int WEIGHT_WINDOW = 8;            // readings (~0.8s @ 10 SPS)

HX711_ADC scale(HX711_DT_PIN, HX711_SCK_PIN);
Preferences prefs;

const unsigned long AUTO_TARE_SETTLE_MS = 2000; // steady time before auto re-zero

bool weightLocked = false;
float lockedWeight = 0; // weight that was posted for this step-on
bool scaleAvailable = false;
bool scaleNewData = false;
float weightWindow[WEIGHT_WINDOW];
int weightCount = 0;
int weightIndex = 0;

const unsigned long WEIGHT_COLLECT_MS = 3000; // pick the steadiest window within this time
bool collectingWeight = false;
const float COLLECT_DRIFT_KG = 1.0;           // abort if the load changes this much
unsigned long collectStart = 0;
float collectAvg = 0;
float bestSpread = 0;
float bestWeight = 0;

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

// Gives up after 15s so a bad network can't freeze the scale.
bool connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > 15000) {
      Serial.println();
      Serial.println("WiFi connect timed out.");
      return false;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

void setWifi(bool on) {
  if (on) {
    if (!connectToWiFi()) {
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
      useWifi = false;
      Serial.println("WiFi stays OFF (test mode).");
      return;
    }
    useWifi = true;
    sessionActive = false; // wait for the admin to start a session
    readingStage = WAITING_FOR_HEIGHT;
    weightLocked = false;
    Serial.println("WiFi ON: hold BOOT to fake an RFID tap (" +
                   String(FAKE_RFID_UID) + ").");
    Serial.println("Waiting for admin to start a measurement session...");
  } else {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    useWifi = false;
    sessionActive = true;
    readingStage = WAITING_FOR_WEIGHT;
    weightLocked = false;
    Serial.println("WiFi OFF: offline weight test.");
  }
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
  collectingWeight = false;
  weightCount = 0;
  weightIndex = 0;
  Serial.println("Step on the scale and stand still...");
}

void tareScale() {
  Serial.println("Taring... keep the platform EMPTY.");
  scale.tareNoDelay(); // completion is saved in loop()
}

// Non-blocking: update() takes a sample when the HX711 has one
// ready, we keep a rolling window of readings, and post once the
// last WEIGHT_WINDOW readings agree within STABLE_RANGE_KG.
void handleWeightReading() {
  if (!scaleNewData) {
    return;
  }
  scaleNewData = false;

  weightWindow[weightIndex] = scale.getData();
  weightIndex = (weightIndex + 1) % WEIGHT_WINDOW;
  if (weightCount < WEIGHT_WINDOW) weightCount++;

  if (weightCount < WEIGHT_WINDOW) {
    return;
  }

  float minW = weightWindow[0], maxW = weightWindow[0], sum = 0;
  for (int i = 0; i < WEIGHT_WINDOW; i++) {
    float w = weightWindow[i];
    if (w < minW) minW = w;
    if (w > maxW) maxW = w;
    sum += w;
  }

  float avg = sum / WEIGHT_WINDOW;

  if (debugLive) {
    // Live readout twice a second (toggle with 'd').
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint >= 500) {
      lastPrint = millis();
      Serial.print("Live: ");
      Serial.print(avg, 3);
      Serial.print(" kg | ");
      Serial.print(avg / 0.45359237, 2);
      Serial.print(" lb | spread ");
      Serial.print(maxW - minW, 3);
      Serial.println(" kg");
    }
  }

  // Stepped off after a posted weight: the reading dropped to under
  // half of it and has held steady (load-cell creep can leave a few
  // kg behind, so "empty" can't mean a fixed threshold). Wait for
  // AUTO_TARE_SETTLE_MS of steadiness, then re-zero (same as 't').
  static unsigned long emptySince = 0;
  bool steppedOff = weightLocked &&
                    avg < lockedWeight * 0.5 &&
                    (maxW - minW) <= STABLE_RANGE_KG;

  if (steppedOff) {
    if (emptySince == 0) emptySince = millis();

    if (millis() - emptySince >= AUTO_TARE_SETTLE_MS) {
      Serial.print("Stepped off (residual ");
      Serial.print(avg, 2);
      Serial.println(" kg): auto re-zero (t).");
      scale.tareNoDelay(); // completion is saved in serviceScale()
      weightLocked = false; // ready for the next person
      emptySince = 0;
    }
    return;
  }
  emptySince = 0;

  if (avg < MIN_WEIGHT_KG) {
    collectingWeight = false; // stepped off before we finished
    return; // nothing on the scale (or still settling after step-off)
  }

  // Stepping off (or on someone else) mid-collection: the average
  // drifts away from where collection began, so throw it away rather
  // than posting the steadiest window of a different load.
  if (collectingWeight && fabsf(avg - collectAvg) > COLLECT_DRIFT_KG) {
    collectingWeight = false;
    return;
  }

  if ((maxW - minW) > STABLE_RANGE_KG) {
    return; // still moving; stay locked if already posted (sway)
  }

  if (weightLocked) {
    return; // already posted for this step-on; wait for platform to clear
  }

  // First stable window opens a short collection period; every
  // later stable window competes and the one with the smallest
  // spread (the steadiest) is what gets posted, not the first.
  float spread = maxW - minW;

  if (!collectingWeight) {
    collectingWeight = true;
    collectStart = millis();
    collectAvg = avg;
    bestSpread = spread;
    bestWeight = avg;
    Serial.println("Weight settling, picking the steadiest reading...");
    return;
  }

  if (spread < bestSpread) {
    bestSpread = spread;
    bestWeight = avg;
  }

  if (millis() - collectStart < WEIGHT_COLLECT_MS) {
    return;
  }

  collectingWeight = false;
  weightLocked = true;
  lockedWeight = bestWeight;

  Serial.print("Weight stable: ");
  Serial.print(bestWeight, 1);
  Serial.print(" kg (spread ");
  Serial.print(bestSpread, 3);
  Serial.println(" kg)");

  if (useWifi) {
    sendReading("weight", bestWeight);
  }
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

  if (line == "w") {
    setWifi(!useWifi);
    return;
  }

  if (line == "d") {
    debugLive = !debugLive;
    Serial.print("Live readout ");
    Serial.println(debugLive ? "ON" : "OFF");
    return;
  }

  if (line == "t") {
    if (!scaleAvailable) {
      Serial.println("HX711 not detected - cannot tare.");
    } else {
      tareScale();
    }
    return;
  }

  if (readingStage == WAITING_FOR_HEIGHT) {
    pendingHeight = line.toFloat();

    Serial.print("Height set to: ");
    Serial.println(pendingHeight, 1);

    sendReading("height", pendingHeight);

    readingStage = WAITING_FOR_WEIGHT;
    promptForWeight();
  }
}

// The zero point is saved in flash so a reboot with someone on the
// scale keeps the old zero instead of re-taring their weight away.
void setupScale() {
  scale.begin();
  scale.setSamplesInUse(SCALE_SAMPLES_IN_USE); // before start()

  prefs.begin("scale", false);
  bool hasTare = prefs.isKey("tare");

  Serial.println("Starting HX711 (platform must be EMPTY on first boot)...");
  scale.start(SCALE_STABILIZING_MS, !hasTare);

  if (scale.getTareTimeoutFlag() || scale.getSignalTimeoutFlag()) {
    scaleAvailable = false;
    Serial.println("HX711 NOT detected (check DT=GPIO4, SCK=GPIO5, VCC, GND). Weight disabled.");
    return;
  }

  if (hasTare) {
    scale.setTareOffset(prefs.getLong("tare", 0));
  } else {
    prefs.putLong("tare", scale.getTareOffset());
  }
  scale.setCalFactor(CALIBRATION_VALUE);
  scaleAvailable = true;
  Serial.println("Scale ready. 't' = re-zero (platform EMPTY).");
}

// Must run on every pass so the HX711_ADC filter stays current.
void serviceScale() {
  if (!scaleAvailable) {
    return;
  }

  if (scale.update()) {
    scaleNewData = true;
  }

  if (scale.getTareStatus()) {
    prefs.putLong("tare", scale.getTareOffset());
    weightCount = 0;
    weightIndex = 0;
    Serial.println("Tare complete (saved).");
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("Booting BMI_MAIN...");

  pinMode(RFID_BUTTON_PIN, INPUT_PULLUP);

  setupScale();

  Serial.println();
  Serial.println("Commands (+Enter): w = WiFi on/off, d = live readout on/off, t = re-zero (platform EMPTY)");

  // Apply the boot defaults through the same path as the 'w' command.
  bool wantWifi = useWifi;
  useWifi = !wantWifi;
  setWifi(wantWifi);
}

void loop() {
  if (useWifi) {
    handleFakeRfidButton();
    handleSessionPolling();
  }

  serviceScale();      // keep the HX711 filter fed on every pass
  handleSerialInput(); // 't' re-zero works any time

  // Weight and height are independent: the scale posts to the
  // form whenever a session is active and someone stands still.
  if (sessionActive) {
    handleWeightReading();
  }

  delay(1);
}
