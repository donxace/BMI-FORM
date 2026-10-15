#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ========================================
// HEIGHT + RFID + LCD (one ESP32)
// ========================================
// RC522 RFID reader + HC-SR04 ultrasonic height sensor + 16x2 I2C LCD on the
// same board. The weight scale (HX711) stays on its own board (BMI_MAIN).
//
// The LCD tells the person being measured what to do (tap card, stand
// under the sensor, hold still, height saved) and shows maintenance info
// while idle (WiFi name, board IP, server offline, test mode).
//
// DEBUG SWITCHES - flip any time from the Serial Monitor (115200 baud,
// send the letter + Enter, even while readings are printing):
//   w -> WiFi ON/OFF
//        ON : connects to WiFi and the local BMI server. Card taps go to
//             /personnel/rfid/scan; height goes to /bmi-assessments/reading
//             while the admin has a measurement session running.
//        OFF: TEST MODE. No WiFi, no server. Card UIDs and heights are only
//             printed, so you can check the readings on their own.
//   d -> live readout ON/OFF (distance + height twice a second)
//   c -> calibrate: with NOTHING under the sensor, measures the distance to
//        the floor and uses it as the mount height (saved to flash)
//   s -> status (WiFi, server, session, mount height, RC522)
//   n -> pick a WiFi network: lists what the board can see, type the
//        number + Enter, then the password + Enter (saved to flash)
//   f -> forget the saved WiFi network (back to the default below)
//   server 192.168.1.33 -> IP of the PC running BMI-FORM (saved to flash)
// These are only the boot defaults:
bool useWifi = true;
bool debugLive = true;

// Default network the first time; a network picked with 'n' (or at boot)
// is saved and used from then on.
const char* DEFAULT_SSID = "ssf";
const char* DEFAULT_PASSWORD = "";

// The PC running `npm run dev` in BMI-FORM: its IP on the SAME WiFi as the
// board (Windows: `ipconfig`). Change it any time with "server <ip>".
const char* DEFAULT_SERVER_IP = "172.20.10.3";
const int SERVER_PORT = 3000;
String SERVER; // "http://<ip>:3000", built in setup()

// ========================================
// SEQUENCE (WiFi ON)
// ========================================
// 1. Tap an RFID card -> the Measurement page's Automatic mode identifies
//    the personnel via /personnel/rfid/latest (an unknown card shows up
//    there too, so it can be assigned on the Personnel page).
// 2. Admin presses "Start Measurement" -> this board polls
//    /bmi-assessments/session/status and starts measuring height.
// 3. Stand straight under the sensor -> once the height holds steady it's
//    posted once; step away and the next person can be measured.
// ========================================

// ---- RC522 RFID (SPI) ----
#define SS_PIN   22
#define RST_PIN  2
#define SCK_PIN  18
#define MOSI_PIN 23
#define MISO_PIN 19

MFRC522 rfid(SS_PIN, RST_PIN);
bool rfidOk = false;
const unsigned long SAME_CARD_IGNORE_MS = 3000; // a card held on the reader posts once
String lastCardUid = "";
unsigned long lastCardAt = 0;

// ---- HC-SR04 ULTRASONIC ----
#define TRIG_PIN 5
#define ECHO_PIN 4

// Sensor mounted 197 cm above the platform, pointing straight down.
// 'c' replaces this with the measured floor distance (saved to flash).
const float DEFAULT_MOUNT_HEIGHT_CM = 197.0;
float mountHeightCm = DEFAULT_MOUNT_HEIGHT_CM;

// Speed of sound in cm/us, round trip halved below. 0.0346 is ~25 C;
// a 5 C error changes a 40 cm echo by only ~0.1 cm.
const float SOUND_CM_PER_US = 0.0346;
const unsigned long ECHO_TIMEOUT_US = 25000; // ~430 cm, past the floor
const float MIN_VALID_DISTANCE_CM = 2.0;     // HC-SR04 blind zone

const float MIN_PERSON_HEIGHT_CM = 90.0;     // shorter = nobody there
const float MAX_PERSON_HEIGHT_CM = 195.0;    // head would be in the blind zone

const int PINGS_PER_SAMPLE = 5;              // median of 5 kills stray echoes
const unsigned long PING_GAP_MS = 60;        // HC-SR04 needs ~60 ms between pings
const int HEIGHT_WINDOW = 6;                 // samples that must agree (~2 s)
const float HEIGHT_STABLE_CM = 1.0;          // max spread across the window

float heightWindow[HEIGHT_WINDOW];
int heightCount = 0;
int heightIndex = 0;
bool heightPosted = false;                   // posted for the person standing there
float postedHeight = 0;
float liveDist = -1;                         // latest sample, for the LCD
float liveHeight = -1;
bool personPresent = false;
bool tooClose = false;

// ---- 16x2 I2C LCD ----
const int LCD_SDA_PIN = 21;
const int LCD_SCL_PIN = 17;
LiquidCrystal_I2C* lcd = nullptr;            // created once the address is found
bool lcdOk = false;
String lcdLine[2];
unsigned long lcdHoldUntil = 0;              // a message (card, height) stays this long
unsigned long lastLcdUpdate = 0;

bool serverOk = true;                        // last session poll reached the server
String lastResponseBody = "";

// What the website currently holds for this session (GET reading/latest).
// The weight comes from the scale board (BMI_MAIN); it is shown here once
// it reaches the website. -1 = not received yet.
float siteHeight = -1;
float siteWeight = -1;
unsigned long lastSampleAt = 0;
const unsigned long SAMPLE_INTERVAL_MS = 350;

Preferences prefs;

// ---- SESSION STATE (SET BY THE ADMIN ON THE WEBSITE) ----
bool sessionActive = false;
const unsigned long SESSION_POLL_INTERVAL_MS = 1000;
unsigned long lastSessionCheck = 0;

// ========================================
// WIFI
// ========================================

// ---- network choice (same idea as the VITALYZE sketches) ----
const unsigned long WIFI_ATTEMPT_MS = 12000;       // one attempt gets this long
const int WIFI_MAX_ATTEMPTS = 2;                   // then fall back to test mode
const unsigned long WIFI_PICK_WAIT_MS = 10000;     // time to type a network number
const unsigned long WIFI_PASSWORD_WAIT_MS = 60000; // time to type the password

String activeSsid;
String activePassword;
bool pickedNetwork = false; // typed in, so save it once it connects

void loadSavedWiFi() {
  Preferences p;
  p.begin("wifi", true);
  activeSsid = p.getString("ssid", DEFAULT_SSID);
  activePassword = p.getString("pass", DEFAULT_PASSWORD);
  p.end();
}

void saveWiFi() {
  Preferences p;
  p.begin("wifi", false);
  p.putString("ssid", activeSsid);
  p.putString("pass", activePassword);
  p.end();
  Serial.println("Saved this network in the board's memory.");
}

void forgetSavedWiFi() {
  Preferences p;
  p.begin("wifi", false);
  p.clear();
  p.end();
  loadSavedWiFi();
  Serial.print("Saved network erased. Default is now \"");
  Serial.print(activeSsid);
  Serial.println("\".");
}

const char* wifiStatusText(wl_status_t s) {
  switch (s) {
    case WL_NO_SSID_AVAIL: return "network not found (out of range, or 5 GHz only: the ESP32 needs 2.4 GHz)";
    case WL_CONNECT_FAILED: return "connection failed (check the password)";
    case WL_CONNECTION_LOST: return "connection lost";
    case WL_DISCONNECTED: return "the router did not accept the board (wrong password?)";
    default: return "unknown";
  }
}

// One typed line, or gotLine = false when nothing came in time.
// Not trimmed: a WiFi password may start or end with a space.
String readSerialLine(unsigned long timeoutMs, bool& gotLine) {
  String line = "";
  gotLine = false;
  unsigned long startedAt = millis();
  while (millis() - startedAt < timeoutMs) {
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') {
        delay(30); // swallow the second char of "Both NL & CR"
        while (Serial.available() && (Serial.peek() == '\n' || Serial.peek() == '\r')) Serial.read();
        gotLine = true;
        return line;
      }
      line += c;
    }
    delay(10);
  }
  return line;
}

// Lists the 2.4 GHz networks the board can hear, then asks for a number.
void scanAndPickNetwork() {
  Serial.println();
  Serial.println("Scanning for WiFi networks...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  int found = WiFi.scanNetworks();
  if (found <= 0) {
    Serial.println("No networks found. Move closer to the router.");
    WiFi.scanDelete();
    return;
  }
  bool seen = false;
  for (int i = 0; i < found; i++) {
    String name = WiFi.SSID(i);
    bool ours = name == activeSsid;
    seen = seen || ours;
    Serial.print(i + 1); Serial.print(". ");
    Serial.print(name.length() ? name : String("(hidden)"));
    Serial.print("  "); Serial.print(WiFi.RSSI(i)); Serial.print(" dBm");
    Serial.print(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "  open" : "  secured");
    Serial.println(ours ? "   <-- in use" : "");
  }
  if (!seen) {
    Serial.print("\""); Serial.print(activeSsid);
    Serial.println("\" is NOT in the list (name is case-sensitive; must be 2.4 GHz).");
  }

  while (Serial.available()) Serial.read();
  lcdShow("Please wait...", "Starting up");
  Serial.print("Type the NUMBER of the network + Enter, or wait ");
  Serial.print(WIFI_PICK_WAIT_MS / 1000);
  Serial.print(" s to keep \""); Serial.print(activeSsid); Serial.println("\".");
  bool got;
  String answer = readSerialLine(WIFI_PICK_WAIT_MS, got);
  answer.trim();
  int n = answer.toInt();
  if (!got || n < 1 || n > found || WiFi.SSID(n - 1).length() == 0) {
    Serial.println("Keeping the current network.");
    WiFi.scanDelete();
    return;
  }
  String chosen = WiFi.SSID(n - 1);
  String pass = "";
  if (WiFi.encryptionType(n - 1) != WIFI_AUTH_OPEN) {
    Serial.print("Password for \""); Serial.print(chosen); Serial.println("\" + Enter:");
    pass = readSerialLine(WIFI_PASSWORD_WAIT_MS, got);
    if (!got) {
      Serial.println("No password entered. Keeping the current network.");
      WiFi.scanDelete();
      return;
    }
  }
  WiFi.scanDelete();
  activeSsid = chosen;
  activePassword = pass;
  pickedNetwork = true;
  Serial.print("Using \""); Serial.print(activeSsid); Serial.println("\".");
}

bool connectToWiFi() {
  WiFi.persistent(false);
  for (int attempt = 1; attempt <= WIFI_MAX_ATTEMPTS; attempt++) {
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(activeSsid.c_str(), activePassword.length() ? activePassword.c_str() : nullptr);
    lcdShow("Please wait...", "Starting up");
    Serial.print("Connecting to \""); Serial.print(activeSsid);
    Serial.print("\" ("); Serial.print(attempt); Serial.print("/"); Serial.print(WIFI_MAX_ATTEMPTS); Serial.print(") ");
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_ATTEMPT_MS) {
      delay(250);
      Serial.print(".");
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("WiFi connected! ESP32 IP: ");
      Serial.print(WiFi.localIP());
      Serial.print(" | signal ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      if (pickedNetwork) { saveWiFi(); pickedNetwork = false; }
      lcdFlash("Connected", "", 2000);
      return true;
    }
    Serial.print("Could not connect: ");
    Serial.println(wifiStatusText(WiFi.status()));
  }
  pickedNetwork = false;
  return false;
}

void setWifi(bool on) {
  if (on) {
    scanAndPickNetwork();
    if (!connectToWiFi()) {
      Serial.println("Could not connect - falling back to TEST MODE ('w' to retry).");
      setWifi(false);
      lcdFlash("Not available", "Please see admin", 4000);
      return;
    }
    useWifi = true;
    sessionActive = false; // wait for the admin to start a session
    resetHeight();
    Serial.print("WiFi ON: server ");
    Serial.println(SERVER);
    Serial.println("Tap a card any time. Waiting for admin to start a measurement session...");
  } else {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    useWifi = false;
    sessionActive = true; // test mode measures without a session
    resetHeight();
    Serial.println("WiFi OFF: TEST MODE - readings are printed only, nothing is sent.");
  }
}

// POSTs a JSON body; returns the HTTP code (negative = no connection).
int postJson(const String& path, const String& json) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected - not sent.");
    return -1;
  }
  HTTPClient http;
  http.begin(String(SERVER) + path);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(json);
  Serial.print("POST ");
  Serial.print(path);
  Serial.print(" ");
  Serial.print(json);
  Serial.print(" -> HTTP ");
  Serial.println(code);
  lastResponseBody = code > 0 ? http.getString() : "";
  if (code > 0) Serial.println(lastResponseBody);
  http.end();
  return code;
}

// ========================================
// SESSION
// ========================================

bool fetchSessionActive(bool* reachable) {
  *reachable = false;
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(String(SERVER) + "/bmi-assessments/session/status");
  int code = http.GET();
  bool active = false;
  if (code == 200) {
    *reachable = true;
    active = http.getString().indexOf("\"active\":true") >= 0;
  }
  http.end();
  return active;
}

void handleSessionPolling() {
  if (millis() - lastSessionCheck < SESSION_POLL_INTERVAL_MS) return;
  lastSessionCheck = millis();

  bool reachable;
  bool active = fetchSessionActive(&reachable);
  serverOk = reachable;
  if (!reachable) return; // keep the last known state through a blip

  if (active) fetchLatestReading();

  if (active && !sessionActive) {
    sessionActive = true;
    resetHeight();
    siteHeight = siteWeight = -1;
    lcdFlash("Measurement", "starting...", 2000);
    Serial.println();
    Serial.println("================================");
    Serial.println("Measurement session started by admin.");
    Serial.println("Stand straight under the sensor...");
    Serial.println("================================");
  } else if (!active && sessionActive) {
    sessionActive = false;
    resetHeight();
    siteHeight = siteWeight = -1;
    Serial.println();
    Serial.println("================================");
    Serial.println("Measurement session ended. Waiting for the next one...");
    Serial.println("================================");
  }
}

// Number field of a flat JSON reply; -1 when missing or null.
float jsonNumber(const String& body, const String& key) {
  String k = "\"" + key + "\":";
  int i = body.indexOf(k);
  if (i < 0) return -1;
  i += k.length();
  if (body.startsWith("null", i)) return -1;
  return body.substring(i).toFloat();
}

// Reads what the website holds for this session, so the weight from the
// scale board appears on this LCD as soon as the website has it.
void fetchLatestReading() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(SERVER + "/bmi-assessments/reading/latest");
  int code = http.GET();
  if (code == 200) {
    String body = http.getString(); // {"height":170.2,"weight":65.3,"received_at":...}
    float h = jsonNumber(body, "height");
    float w = jsonNumber(body, "weight");
    siteHeight = h;
    if (w > 0 && fabsf(w - siteWeight) >= 0.05) {
      Serial.print("Weight on the website: ");
      Serial.print(w, 1);
      Serial.println(" kg");
      lcdFlash("Weight received", String(w, 1) + " kg", 4000);
    }
    siteWeight = w;
  }
  http.end();
}

// ========================================
// RFID
// ========================================

String readCardUid() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();
  return uid;
}

void handleRfid() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = readCardUid();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (uid == lastCardUid && millis() - lastCardAt < SAME_CARD_IGNORE_MS) return;
  lastCardUid = uid;
  lastCardAt = millis();

  Serial.println();
  Serial.println("================================");
  Serial.print("CARD TAPPED: ");
  Serial.println(uid);
  // A 7-byte UID with colons is too wide for the LCD: drop the colons.
  String shownUid = uid;
  if (shownUid.length() > 16) shownUid.replace(":", "");

  if (useWifi) {
    int code = postJson("/personnel/rfid/scan", "{\"rfid_uid\":\"" + uid + "\"}");
    if (code == 200 || code == 201) {
      // Reply: {"rfid_uid":..., "personnel":{...,"rank":"PAT","surname":"Reyes",...} | null, ...}
      int p = lastResponseBody.indexOf("\"personnel\":");
      if (p < 0 || lastResponseBody.substring(p + 12, p + 16) == "null") {
        lcdFlash("Card not found", "Please see admin", 5000);
      } else {
        String name = jsonField(lastResponseBody, "rank", p) + " " + jsonField(lastResponseBody, "surname", p);
        name.trim();
        lcdFlash("Welcome!", name.length() ? name : String("ID card accepted"), 5000);
      }
    } else {
      lcdFlash("Card not read", "Please tap again", 5000);
    }
  } else {
    Serial.println("(test mode - not sent)");
    lcdFlash("Card read", "(setup mode)", 3000);
  }
  Serial.println("================================");
}

// Value of a string field in a flat JSON reply, searched from position `from`.
String jsonField(const String& body, const String& key, int from) {
  String k = "\"" + key + "\":\"";
  int i = body.indexOf(k, from);
  if (i < 0) return "";
  i += k.length();
  int j = body.indexOf('"', i);
  return j < 0 ? "" : body.substring(i, j);
}

// ========================================
// HEIGHT
// ========================================

float pingOnceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long us = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);
  if (us == 0) return -1;
  float cm = us * SOUND_CM_PER_US / 2.0;
  return cm < MIN_VALID_DISTANCE_CM ? -1 : cm;
}

// Median of several pings; -1 if most pings got no echo.
float measureDistanceCm() {
  float v[PINGS_PER_SAMPLE];
  int n = 0;
  for (int i = 0; i < PINGS_PER_SAMPLE; i++) {
    float d = pingOnceCm();
    if (d > 0) v[n++] = d;
    if (i < PINGS_PER_SAMPLE - 1) delay(PING_GAP_MS);
  }
  if (n < (PINGS_PER_SAMPLE + 1) / 2) return -1;
  for (int i = 1; i < n; i++) { // insertion sort, n <= 5
    float k = v[i]; int j = i - 1;
    while (j >= 0 && v[j] > k) { v[j + 1] = v[j]; j--; }
    v[j + 1] = k;
  }
  return v[n / 2];
}

void resetHeight() {
  heightCount = 0;
  heightIndex = 0;
  heightPosted = false;
}

void handleHeight() {
  if (millis() - lastSampleAt < SAMPLE_INTERVAL_MS) return;
  lastSampleAt = millis();

  float dist = measureDistanceCm();
  float height = dist > 0 ? mountHeightCm - dist : -1;
  liveDist = dist;
  liveHeight = height;
  tooClose = dist > 0 && height > MAX_PERSON_HEIGHT_CM;
  personPresent = dist > 0 && height >= MIN_PERSON_HEIGHT_CM && !tooClose;

  if (debugLive) {
    Serial.print("Live: distance ");
    if (dist > 0) { Serial.print(dist, 1); Serial.print(" cm | height "); Serial.print(height, 1); Serial.println(" cm"); }
    else Serial.println("NO ECHO (check wiring/power, or something is too close)");
  }

  // Nobody under the sensor (or a bad echo): ready for the next person.
  if (dist <= 0 || height < MIN_PERSON_HEIGHT_CM) {
    if (heightPosted) Serial.println("Stepped away - ready for the next person.");
    resetHeight();
    return;
  }
  if (height > MAX_PERSON_HEIGHT_CM) {
    Serial.println("Too close to the sensor (over 195 cm or hand under it) - ignored.");
    return;
  }
  if (heightPosted) return; // one post per person

  heightWindow[heightIndex] = height;
  heightIndex = (heightIndex + 1) % HEIGHT_WINDOW;
  if (heightCount < HEIGHT_WINDOW) heightCount++;
  if (heightCount < HEIGHT_WINDOW) return;

  float lo = heightWindow[0], hi = heightWindow[0], sum = 0;
  for (int i = 0; i < HEIGHT_WINDOW; i++) {
    float h = heightWindow[i];
    if (h < lo) lo = h;
    if (h > hi) hi = h;
    sum += h;
  }
  if (hi - lo > HEIGHT_STABLE_CM) return; // still moving

  float stable = sum / HEIGHT_WINDOW;
  heightPosted = true;
  postedHeight = stable;
  Serial.println();
  Serial.println("================================");
  Serial.print(">>> HEIGHT STABLE: ");
  Serial.print(stable, 1);
  Serial.print(" cm (spread ");
  Serial.print(hi - lo, 1);
  Serial.println(" cm)");
  if (useWifi) {
    int code = postJson("/bmi-assessments/reading", "{\"height\":" + String(stable, 1) + "}");
    if (code == 200 || code == 201) lcdFlash("Height saved!", String(stable, 1) + " cm", 4000);
    else {
      heightPosted = false; // try again on the next stable window
      lcdFlash("Please wait...", "Saving height", 3000);
    }
  } else {
    Serial.println("(test mode - not sent)");
    lcdFlash("Height (test)", String(stable, 1) + " cm", 4000);
  }
  Serial.println("================================");
}

// Nothing under the sensor: the floor distance IS the mount height.
void calibrateMount() {
  Serial.println("Calibrating - keep the space under the sensor EMPTY...");
  lcdShow("Calibrating...", "Keep area EMPTY");
  lcdHoldUntil = millis() + 3000;
  float sum = 0;
  int n = 0;
  for (int i = 0; i < 10; i++) {
    float d = measureDistanceCm();
    if (d > 0) { sum += d; n++; }
    delay(100);
  }
  if (n < 6) {
    Serial.println("Calibration failed: too few echoes from the floor. Mount height unchanged.");
    lcdFlash("Calibrate FAILED", "No floor echo", 4000);
    return;
  }
  float floorCm = sum / n;
  if (fabsf(floorCm - DEFAULT_MOUNT_HEIGHT_CM) > 25) {
    Serial.print("Measured ");
    Serial.print(floorCm, 1);
    Serial.println(" cm - that is far from 197 cm, is something under the sensor? Not saved.");
    lcdFlash("Calibrate FAILED", "Got " + String(floorCm, 1) + " cm", 4000);
    return;
  }
  mountHeightCm = floorCm;
  prefs.putFloat("mount", mountHeightCm);
  Serial.print("Mount height set to ");
  Serial.print(mountHeightCm, 1);
  Serial.println(" cm (saved).");
  lcdFlash("Calibrated OK", "Mount " + String(mountHeightCm, 1) + " cm", 4000);
  resetHeight();
}

// ========================================
// LCD (16x2, I2C)
// ========================================

void setupLcd() {
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  const byte addresses[] = {0x27, 0x3F}; // the two common PCF8574 backpacks
  for (byte a : addresses) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      lcd = new LiquidCrystal_I2C(a, 16, 2);
      lcd->init();
      lcd->backlight();
      lcdOk = true;
      Serial.printf("LCD found at 0x%02X\n", a);
      return;
    }
  }
  Serial.println("LCD NOT found (SDA=21, SCL=17, address 0x27/0x3F) - running without it.");
}

String fit16(String s) {
  if (s.length() > 16) s = s.substring(0, 16);
  while (s.length() < 16) s += ' ';
  return s;
}

// Writes only the rows that changed, so the screen never flickers.
void lcdShow(const String& top, const String& bottom) {
  if (!lcdOk) return;
  String rows[2] = {fit16(top), fit16(bottom)};
  for (int i = 0; i < 2; i++) {
    if (rows[i] != lcdLine[i]) {
      lcd->setCursor(0, i);
      lcd->print(rows[i]);
      lcdLine[i] = rows[i];
    }
  }
}

// A message that stays up for `ms` before the normal screen returns.
void lcdFlash(const String& top, const String& bottom, unsigned long ms) {
  lcdShow(top, bottom);
  lcdHoldUntil = millis() + ms;
}

// The normal screen, picked from the current state (called from loop()).
void updateLcd() {
  if (!lcdOk) return;
  if ((long)(millis() - lcdHoldUntil) < 0) return; // a message is still up
  if (millis() - lastLcdUpdate < 250) return;
  lastLcdUpdate = millis();

  if (!useWifi) {
    if (liveDist > 0) lcdShow("Setup mode", "Height " + String(liveHeight, 1) + " cm");
    else lcdShow("Setup mode", "Please see admin");
    return;
  }
  if (WiFi.status() != WL_CONNECTED) { lcdShow("Please wait...", "Reconnecting"); return; }
  if (!serverOk) { lcdShow("System offline", "Please see admin"); return; }
  if (!sessionActive) {
    // Second row alternates between the two things the person needs to know.
    bool second = (millis() / 3000) % 2;
    lcdShow("Tap your ID card", second ? "Wait for admin" : "to begin");
    return;
  }
  if (tooClose) { lcdShow("Too close to", "the sensor"); return; }
  if (personPresent && !heightPosted) {
    lcdShow("Hold still...", "Height " + String(liveHeight, 1) + " cm");
    return;
  }

  // Use the website's values: they are what gets saved, and the weight
  // only exists there (it comes from the scale board).
  float h = siteHeight > 0 ? siteHeight : (heightPosted ? postedHeight : -1);
  float w = siteWeight;
  if (h > 0 && w > 0) {
    float m = h / 100.0;
    lcdShow(String(h, 1) + "cm  " + String(w, 1) + "kg", "BMI " + String(w / (m * m), 1));
  } else if (h > 0) {
    lcdShow("Height " + String(h, 1) + "cm", "Now step on scale");
  } else if (w > 0) {
    lcdShow("Weight " + String(w, 1) + "kg", "Stand under here");
  } else {
    lcdShow("Stand under the", "sensor, stand up");
  }
}

// ========================================
// WIFI WATCHDOG
// ========================================

unsigned long wifiLostAt = 0;
unsigned long lastWifiRetry = 0;

// Reconnects in the background if the network drops while running.
void handleWifiWatchdog() {
  if (!useWifi) return;
  if (WiFi.status() == WL_CONNECTED) {
    if (wifiLostAt) Serial.println("WiFi back.");
    wifiLostAt = 0;
    return;
  }
  if (!wifiLostAt) {
    wifiLostAt = lastWifiRetry = millis();
    Serial.println("WiFi lost. Reconnecting...");
    return;
  }
  if (millis() - lastWifiRetry >= 10000) {
    lastWifiRetry = millis();
    WiFi.disconnect();
    WiFi.begin(activeSsid.c_str(), activePassword.length() ? activePassword.c_str() : nullptr);
  }
}

// ========================================
// SERIAL COMMANDS
// ========================================

void printStatus() {
  Serial.println();
  Serial.println("---------- STATUS ----------");
  Serial.print("Mode: "); Serial.println(useWifi ? "WiFi ON (sending to server)" : "TEST MODE (print only)");
  Serial.print("Network: \""); Serial.print(activeSsid); Serial.println("\" ('n' to change)");
  Serial.print("Server: "); Serial.print(SERVER); Serial.println(" ('server <ip>' to change)");
  if (useWifi) {
    Serial.print("WiFi: "); Serial.println(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : String("disconnected"));
    bool reachable;
    bool active = fetchSessionActive(&reachable);
    Serial.print("Server "); Serial.print(SERVER); Serial.println(reachable ? ": reachable" : ": NOT reachable");
    if (reachable) { Serial.print("Session: "); Serial.println(active ? "active" : "not started"); }
  }
  Serial.print("Mount height: "); Serial.print(mountHeightCm, 1); Serial.println(" cm");
  Serial.print("RC522: "); Serial.println(rfidOk ? "OK" : "NOT detected");
  Serial.print("LCD: "); Serial.println(lcdOk ? "OK" : "NOT detected (SDA=21, SCL=17)");
  Serial.println("----------------------------");
}

void handleSerialInput() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line == "w") setWifi(!useWifi);
  else if (line == "d") { debugLive = !debugLive; Serial.print("Live readout "); Serial.println(debugLive ? "ON" : "OFF"); }
  else if (line == "c") calibrateMount();
  else if (line == "s") printStatus();
  else if (line == "n") {
    scanAndPickNetwork();
    if (pickedNetwork) setWifi(true); // connect to the newly chosen network
  }
  else if (line == "f") forgetSavedWiFi();
  else if (line.startsWith("server ")) {
    String ip = line.substring(7);
    ip.trim();
    IPAddress check;
    if (!check.fromString(ip)) { Serial.println("Not an IP address, e.g.  server 192.168.1.33"); return; }
    setServerIp(ip);
    prefs.putString("server", ip);
    Serial.print("Server set to "); Serial.print(SERVER); Serial.println(" (saved).");
  }
  else if (line.length()) Serial.println("Commands: w = WiFi on/off, n = pick network, f = forget network, server <ip>, d = live readout, c = calibrate (empty), s = status");
}

void setServerIp(const String& ip) {
  SERVER = "http://" + ip + ":" + String(SERVER_PORT);
}

// ========================================

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("Booting HEIGHT_RFID...");

  setupLcd();
  lcdShow("BMI Measurement", "Please wait...");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(50);
  byte ver = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  rfidOk = !(ver == 0x00 || ver == 0xFF);
  Serial.print("RC522 firmware: 0x");
  Serial.print(ver, HEX);
  Serial.println(rfidOk ? " (OK)" : " - NOT responding, check wiring and 3.3V");
  if (!rfidOk) { lcdShow("Card reader off", "Please see admin"); delay(2500); }

  prefs.begin("height", false);
  mountHeightCm = prefs.getFloat("mount", DEFAULT_MOUNT_HEIGHT_CM);
  Serial.print("Mount height: ");
  Serial.print(mountHeightCm, 1);
  Serial.println(" cm ('c' to calibrate with the space EMPTY)");

  setServerIp(prefs.getString("server", DEFAULT_SERVER_IP));
  loadSavedWiFi();
  Serial.print("Server: ");
  Serial.println(SERVER);

  Serial.println("Commands (+Enter): w = WiFi on/off, n = pick network, f = forget network, server <ip>, d = live readout, c = calibrate, s = status");

  // Apply the boot default through the same path as the 'w' command.
  bool wantWifi = useWifi;
  useWifi = !wantWifi;
  setWifi(wantWifi);
}

void loop() {
  handleSerialInput();
  handleWifiWatchdog();
  if (useWifi) handleSessionPolling();
  if (rfidOk) handleRfid();          // card taps work with or without a session
  if (sessionActive) handleHeight(); // test mode keeps sessionActive = true
  updateLcd();
  delay(1);
}
