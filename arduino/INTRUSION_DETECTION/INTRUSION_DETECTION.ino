#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "HUAWEI-3j74";
const char* password = "dxp2jzb9";

const char* serverUrl =
  "http://192.168.1.22:3000/intrusion-detection/event";

// ========================================
// TEST MODE (NO LASER MODULE YET)
// ========================================
// The laser/receiver module isn't wired up yet, so this sketch
// uses the ESP32 dev board's onboard BOOT button (GPIO0) to
// simulate the beam being broken. Press and hold BOOT to send
// "triggered", release to send "clear" - lets you test the full
// ESP32 -> backend -> website pipeline with nothing but the bare
// microcontroller and a USB cable.
//
// The BOOT button pulls the pin LOW when pressed (it's wired to
// 3V3 through an internal/board pull-up when idle).
//
// ----------------------------------------------------------
// SWAPPING IN THE REAL SENSOR LATER
// ----------------------------------------------------------
// When the laser + receiver module is wired up (receiver OUT ->
// a free GPIO, e.g. GPIO34), just change TRIGGER_PIN below, set
// TRIGGER_PIN_MODE to INPUT (no internal pull-up needed for most
// receiver boards), and change ACTIVE_LOW to match your module's
// output polarity (most LM393 receiver boards go HIGH when the
// beam is broken, so ACTIVE_LOW would be false).
// ========================================

const int TRIGGER_PIN = 0;              // BOOT button on most ESP32 dev boards
const int TRIGGER_PIN_MODE = INPUT_PULLUP;
const bool ACTIVE_LOW = true;           // pressed/broken reads LOW

const char* sensor_id = "TEST-BUTTON";

// Debounce so a single flicker doesn't spam the server.
const unsigned long DEBOUNCE_MS = 50;

bool lastSentTriggered = false;
bool candidateState = false;
unsigned long candidateSince = 0;
bool hasSentInitialState = false;

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

bool readTriggered() {
  int reading = digitalRead(TRIGGER_PIN);
  bool pinIsLow = (reading == LOW);

  return ACTIVE_LOW ? pinIsLow : !pinIsLow;
}

void sendStatus(bool triggered) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"status\":\"" + String(triggered ? "triggered" : "clear") + "\",";
  json += "\"sensor_id\":\"" + String(sensor_id) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(triggered ? "TRIGGERED - INTRUSION!" : "Clear.");
  Serial.println(json);
  Serial.println("================================");

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);

  if (responseCode >= 200 && responseCode < 300) {
    Serial.println("Server acknowledged status update.");
  } else {
    Serial.println("Request failed. Will retry on next change.");
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIGGER_PIN, TRIGGER_PIN_MODE);

  connectToWiFi();

  Serial.println();
  Serial.println("TEST MODE: press and hold BOOT to simulate an intrusion.");
}

void loop() {

  bool triggeredNow = readTriggered();

  // ========================================
  // DEBOUNCE STATE CHANGES
  // ========================================

  if (triggeredNow != candidateState) {
    candidateState = triggeredNow;
    candidateSince = millis();
  }

  bool debounced =
    (millis() - candidateSince) >= DEBOUNCE_MS;

  if (debounced &&
      (candidateState != lastSentTriggered || !hasSentInitialState)) {

    sendStatus(candidateState);

    lastSentTriggered = candidateState;
    hasSentInitialState = true;
  }

  delay(20);
}
