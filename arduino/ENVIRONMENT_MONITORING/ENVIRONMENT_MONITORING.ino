#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "HUAWEI-3j74";
const char* password = "dxp2jzb9";

const char* readingUrl =
  "http://192.168.1.22:3000/environment-monitoring/reading";

// ========================================
// TEST MODE (NO SMOKE/TEMPERATURE SENSOR YET)
// ========================================
// No real smoke (e.g. MQ-2) or temperature (e.g. DHT22) sensor
// is wired up yet, so this sketch sends fake readings so the
// Smoke & Temperature page on the website has something to
// display and can be tested end-to-end.
//
// - Normal conditions: temperature drifts around ROOM_TEMP_C,
//   smoke_level drifts around CLEAN_AIR_LEVEL.
// - Hold the onboard BOOT button (GPIO0) to simulate an alert:
//   temperature and smoke_level jump into the "danger" range
//   the backend treats as smoke_detected/high_temperature.
//
// ----------------------------------------------------------
// SWAPPING IN REAL SENSORS LATER
// ----------------------------------------------------------
// Replace readFakeTemperature()/readFakeSmokeLevel() with real
// sensor reads (e.g. dht.readTemperature() for a DHT22 on a
// digital pin, or analogRead() for an MQ-2 on an ADC pin). The
// WiFi/POST/threshold logic on the backend stays the same.
// ========================================

const int ALERT_BUTTON_PIN = 0; // BOOT button on most ESP32 dev boards

const char* SENSOR_ID = "ENV-01";

const float ROOM_TEMP_C = 28.0;
const int CLEAN_AIR_LEVEL = 300;

const unsigned long SEND_INTERVAL_MS = 3000;
unsigned long lastSendAt = 0;

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

bool alertButtonHeld() {
  return digitalRead(ALERT_BUTTON_PIN) == LOW;
}

float readFakeTemperature() {
  if (alertButtonHeld()) {
    // Simulated fire/overheat condition.
    return 55.0 + random(0, 150) / 10.0; // ~55.0 - 70.0 C
  }

  // Small random jitter around room temperature.
  return ROOM_TEMP_C + random(-20, 21) / 10.0; // +/- 2.0 C
}

int readFakeSmokeLevel() {
  if (alertButtonHeld()) {
    // Simulated smoke condition.
    return 2000 + random(0, 1000); // 2000 - 3000
  }

  // Small random jitter around a clean-air baseline.
  return CLEAN_AIR_LEVEL + random(-50, 51);
}

void sendReading(float temperatureC, int smokeLevel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    return;
  }

  HTTPClient http;

  http.begin(readingUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"temperature\":" + String(temperatureC, 1) + ",";
  json += "\"smoke_level\":" + String(smokeLevel) + ",";
  json += "\"sensor_id\":\"" + String(SENSOR_ID) + "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println(
    alertButtonHeld()
      ? "SIMULATED ALERT READING"
      : "Sending normal reading..."
  );
  Serial.println(json);

  int responseCode = http.POST(json);

  Serial.print("HTTP Response: ");
  Serial.println(responseCode);
  Serial.println(http.getString());
  Serial.println("================================");

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(ALERT_BUTTON_PIN, INPUT_PULLUP);

  randomSeed(analogRead(0));

  connectToWiFi();

  Serial.println();
  Serial.println("Sending fake smoke/temperature readings every 3s.");
  Serial.println("Hold BOOT to simulate a smoke/fire alert.");
}

void loop() {
  if (millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();

    float temperatureC = readFakeTemperature();
    int smokeLevel = readFakeSmokeLevel();

    sendReading(temperatureC, smokeLevel);
  }

  delay(20);
}
