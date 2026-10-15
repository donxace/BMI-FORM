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
//        ON : WiFi, weight posted to the Measurement page.
//        OFF: TEST MODE: scale only. No WiFi, no API, no website.
//             Prints ">>> STABLE: xx kg" when the weight settles.
//   d -> live readout ON/OFF (kg, lb, spread twice a second)
// These are only the boot defaults:
bool useWifi = true;
bool debugLive = true;

const char* ssid = "ssf";
const char* password = ""; // your WiFi password (kept out of GitHub, set before flashing)

const char* readingUrl =
  "http://172.20.10.3:3000/bmi-assessments/reading";

// ========================================
// SEQUENCE
// ========================================
// Step on the HX711 load cell -> once the reading is stable it's
// posted automatically to /bmi-assessments/reading (no typing).
//
// WEIGHT SENSOR (HX711 on DT=GPIO15, SCK=GPIO5):
//   Calibration is fixed in code; the zero point is saved to
//   flash, so a reboot with someone on the scale is harmless.
//   t -> re-zero with the platform EMPTY (saved to flash)
// ========================================

// ---- HX711 LOAD CELL ----

const int HX711_DT_PIN = 15;
const int HX711_SCK_PIN = 5;

// Counts per kg. Rescaled twice from live reads against this user's actual
// weight: 26900.0 -> 26028.6 (board read 68.7 at the actual 71 kg) ->
// 24751.0 (board read 71.1 at the actual 74.77 kg: 26028.6 * 71.1 / 74.77).
const float CALIBRATION_VALUE = 24751.0;
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

// ---- WIFI CONNECTION (scan, pick, retry, watchdog) ----
// Ported from VITALYZE/arduino/VITALS_COMBINED_MAIN/VITALS_COMBINED_MAIN.ino —
// a bare WiFi.begin() then waiting forever gave no visibility into *why* a
// connection failed (wrong password vs. out of range vs. 5 GHz-only router),
// so this scans first, lets you pick + save a network, retries a few times
// with a clear reason on each failure, and a watchdog in loop() recovers a
// connection that drops while running instead of just going silent.

const unsigned long WIFI_ATTEMPT_MS = 12000;         // one attempt gets this long
const int WIFI_MAX_ATTEMPTS = 3;                     // then the board restarts
const unsigned long WIFI_RECONNECT_AFTER_MS = 10000; // lost this long -> reconnect
const unsigned long WIFI_RESTART_AFTER_MS = 60000;   // lost this long -> restart
const unsigned long WIFI_PICK_WAIT_MS = 10000;       // time to type a network number
const unsigned long WIFI_PASSWORD_WAIT_MS = 60000;   // time to type the password

// ESP32-C3 boards often cannot join a router at full transmit power; this
// board is an ESP32-S3, which keeps full power (lowering it would only
// shorten its range), but the switch is kept so the sketch still behaves
// if it's ever retargeted at a C3.
//
// NOTE: tried lowering this to WIFI_POWER_11dBm against "HMS PON" when it
// rejected the board outright (strong -63 dBm signal, verified-correct
// password, still refused) -- made no difference, so TX power was not the
// cause there. Left at full power; see the connection log / network admin
// for that network's actual cause (MAC filtering, WPA3-only/PMF-required,
// or a client limit are the next things to check).
#ifdef CONFIG_IDF_TARGET_ESP32C3
const wifi_power_t WIFI_TX_POWER = WIFI_POWER_8_5dBm;
#else
const wifi_power_t WIFI_TX_POWER = WIFI_POWER_19_5dBm;
#endif

// The network in use: the saved one, else the ssid/password at the top.
String activeSsid;
String activePassword;
bool pickedThisBoot = false; // typed in now, so save it once it connects

Preferences wifiPrefs;

void loadSavedWiFi() {
  activeSsid = ssid;
  activePassword = password;

  wifiPrefs.begin("wifi", false);
  String savedSsid = wifiPrefs.getString("ssid", "");

  if (savedSsid.length() > 0) {
    activeSsid = savedSsid;
    activePassword = wifiPrefs.getString("pass", "");
  }

  wifiPrefs.end();
}

void saveWiFi() {
  wifiPrefs.begin("wifi", false);
  wifiPrefs.putString("ssid", activeSsid);
  wifiPrefs.putString("pass", activePassword);
  wifiPrefs.end();

  Serial.println("Saved this network in the board's memory.");
}

void forgetSavedWiFi() {
  wifiPrefs.begin("wifi", false);
  wifiPrefs.clear();
  wifiPrefs.end();
}

// An open network has no password: begin() wants nullptr for that.
void beginWiFi() {
  WiFi.begin(activeSsid.c_str(), activePassword.length() > 0 ? activePassword.c_str() : nullptr);
}

const char* wifiStatusText(wl_status_t status) {
  switch (status) {
    case WL_NO_SSID_AVAIL: return "network not found (out of range, or 5 GHz only: the ESP32 needs 2.4 GHz)";
    case WL_CONNECT_FAILED: return "connection failed (check the password)";
    case WL_CONNECTION_LOST: return "connection lost";
    case WL_DISCONNECTED: return "the router did not accept the board (wrong password, or transmit power: see WIFI_TX_POWER)";
    default: return "unknown";
  }
}

// Reads one typed line. gotLine is false when nothing was entered in time.
// Not trimmed: a WiFi password may legitimately start or end with a space.
String readSerialLine(unsigned long timeoutMs, bool& gotLine) {
  String line = "";
  gotLine = false;

  unsigned long startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    while (Serial.available()) {
      char c = Serial.read();

      if (c == '\n' || c == '\r') {
        // "Both NL & CR" sends two: swallow the second so it does not answer
        // the next question with an empty line.
        delay(30);

        while (Serial.available() && (Serial.peek() == '\n' || Serial.peek() == '\r')) {
          Serial.read();
        }

        gotLine = true;
        return line;
      }

      line += c;
    }

    delay(10);
  }

  return line;
}

// Lists every 2.4 GHz network the board can see, strongest first, and marks
// the one in use. If yours is missing here, the board cannot hear it (too far,
// or the router is 5 GHz only), so no password or code change will help. The
// results stay in memory for the caller; free them with WiFi.scanDelete().
int scanVisibleNetworks() {
  Serial.println();
  Serial.println("Scanning for WiFi networks...");

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  int found = WiFi.scanNetworks();

  if (found <= 0) {
    Serial.println("No networks found. Check the antenna / move closer to the router.");
    WiFi.scanDelete();
    return 0;
  }

  bool ourNetworkSeen = false;

  Serial.print(found);
  Serial.println(" network(s) found:");

  for (int i = 0; i < found; i++) {
    String name = WiFi.SSID(i);
    bool isOurs = name == activeSsid;

    ourNetworkSeen = ourNetworkSeen || isOurs;

    Serial.print(i + 1);
    Serial.print(". ");
    Serial.print(name.length() > 0 ? name : String("(hidden)"));
    Serial.print("  ");
    Serial.print(WiFi.RSSI(i));
    Serial.print(" dBm  ch ");
    Serial.print(WiFi.channel(i));
    Serial.print(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "  open" : "  secured");
    Serial.println(isOurs ? "   <-- in use" : "");
  }

  if (!ourNetworkSeen) {
    Serial.print("\"");
    Serial.print(activeSsid);
    Serial.println("\" is NOT in the list: check the name (it is case-sensitive) and that the router broadcasts 2.4 GHz.");
  }

  Serial.println();
  return found;
}

// Asks which network to use. Returns true when one was chosen and its
// password entered (activeSsid / activePassword are then set).
bool pickNetwork(int found) {
  while (Serial.available()) {
    Serial.read(); // ignore anything typed before the question
  }

  Serial.print("Type the NUMBER of the network to use and press Enter, or wait ");
  Serial.print(WIFI_PICK_WAIT_MS / 1000);
  Serial.print(" s to keep \"");
  Serial.print(activeSsid);
  Serial.println("\".");

  bool gotLine;
  String answer = readSerialLine(WIFI_PICK_WAIT_MS, gotLine);
  answer.trim();

  if (!gotLine || answer.length() == 0) {
    Serial.println("Keeping the current network.");
    return false;
  }

  int number = answer.toInt();

  if (number < 1 || number > found) {
    Serial.println("That is not a number in the list. Keeping the current network.");
    return false;
  }

  String chosen = WiFi.SSID(number - 1);

  if (chosen.length() == 0) {
    Serial.println("Hidden networks cannot be chosen from the list. Keeping the current network.");
    return false;
  }

  String typedPassword = "";

  if (WiFi.encryptionType(number - 1) != WIFI_AUTH_OPEN) {
    Serial.print("Password for \"");
    Serial.print(chosen);
    Serial.println("\" (type it and press Enter; it is not shown back):");

    typedPassword = readSerialLine(WIFI_PASSWORD_WAIT_MS, gotLine);

    if (!gotLine) {
      Serial.println("No password entered. Keeping the current network.");
      return false;
    }
  }

  activeSsid = chosen;
  activePassword = typedPassword;
  pickedThisBoot = true;

  Serial.print("Using \"");
  Serial.print(activeSsid);
  Serial.println("\".");

  return true;
}

bool tryConnectWiFi() {
  // Drop whatever state is left over, then come up as a plain station with
  // WiFi power-saving off (power-saving makes joining and replies slow).
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.setTxPower(WIFI_TX_POWER);
  beginWiFi();
  WiFi.setTxPower(WIFI_TX_POWER); // some core versions only apply it once started

  unsigned long startedAt = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < WIFI_ATTEMPT_MS) {
    delay(250);
    Serial.print(".");
  }

  return WiFi.status() == WL_CONNECTED;
}

// Scans, offers a pick, then tries to connect with retries. As a last resort
// (all WIFI_MAX_ATTEMPTS failed) restarts the board for a clean WiFi driver —
// unattended kiosk hardware self-heals instead of sitting dead.
void connectToWiFi() {
  WiFi.persistent(false); // do not rewrite the flash on every connect

  loadSavedWiFi();

  int found = scanVisibleNetworks();

  if (found > 0) {
    pickNetwork(found);
  }

  WiFi.scanDelete(); // free the scan results

  for (int attempt = 1; attempt <= WIFI_MAX_ATTEMPTS; attempt++) {
    Serial.print("Connecting to \"");
    Serial.print(activeSsid);
    Serial.print("\" (");
    Serial.print(attempt);
    Serial.print("/");
    Serial.print(WIFI_MAX_ATTEMPTS);
    Serial.print(") ");

    if (tryConnectWiFi()) {
      Serial.println();
      Serial.println("WiFi connected!");

      Serial.print("ESP32 IP: ");
      Serial.println(WiFi.localIP());

      Serial.print("Signal: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");

      // Only a network that actually worked is remembered.
      if (pickedThisBoot) {
        saveWiFi();
      }

      return;
    }

    Serial.println();
    Serial.print("Could not connect: ");
    Serial.println(wifiStatusText(WiFi.status()));
  }

  // Show what the board can see right now, so the log says why it failed.
  scanVisibleNetworks();
  WiFi.scanDelete();

  Serial.println("Restarting to try again with a clean WiFi driver...");
  delay(500);
  ESP.restart();
}

unsigned long wifiLostSince = 0;
unsigned long lastWifiReconnectAt = 0;

// Called from loop() while useWifi is on: recovers a connection that
// dropped while running, and restarts the board if it stays down too long.
void handleWiFiWatchdog() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiLostSince = 0;
    return;
  }

  if (wifiLostSince == 0) {
    wifiLostSince = millis();
    lastWifiReconnectAt = millis();

    Serial.println("WiFi lost. Trying to reconnect...");
    return;
  }

  if (millis() - wifiLostSince >= WIFI_RESTART_AFTER_MS) {
    Serial.println("WiFi still down after 60 s. Restarting...");
    delay(200);
    ESP.restart();
  }

  if (millis() - lastWifiReconnectAt >= WIFI_RECONNECT_AFTER_MS) {
    lastWifiReconnectAt = millis();

    Serial.println("Retrying WiFi...");
    WiFi.disconnect();
    WiFi.setTxPower(WIFI_TX_POWER);
    beginWiFi();
  }
}

void setWifi(bool on) {
  if (on) {
    connectToWiFi(); // scans, offers a pick, connects with retries (restarts the board if it can't)
    useWifi = true;
    weightLocked = false;
    promptForWeight();
  } else {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    useWifi = false;
    weightLocked = false;
    Serial.println("WiFi OFF: offline weight test.");
    promptForWeight();
  }
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

// Posts the weight as soon as it's captured, so the Measurement
// page's 1s poll can display it live.
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

  if (line == "wifi forget") {
    forgetSavedWiFi();
    Serial.println("Saved WiFi network erased.");
    if (useWifi) {
      setWifi(true); // reconnect now, will prompt for a fresh pick
    }
    return;
  }

  if (line == "wifi") {
    setWifi(true); // rescans and lets you pick again
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
    Serial.println("HX711 NOT detected (check DT=GPIO15, SCK=GPIO5, VCC, GND). Weight disabled.");
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

  setupScale();

  Serial.println();
  Serial.println("Commands (+Enter): w = WiFi on/off, d = live readout on/off, t = re-zero (platform EMPTY), wifi = pick network, wifi forget = erase saved network");

  // Apply the boot defaults through the same path as the 'w' command.
  bool wantWifi = useWifi;
  useWifi = !wantWifi;
  setWifi(wantWifi);
}

void loop() {
  serviceScale();      // keep the HX711 filter fed on every pass
  handleSerialInput(); // 't' re-zero works any time

  if (useWifi) {
    handleWiFiWatchdog();
  }

  handleWeightReading();

  delay(1);
}
