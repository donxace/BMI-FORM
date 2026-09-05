#include <WiFi.h>

// =============================
// WiFi
// =============================
const char* ssid = "HUAWEI-3j74";
const char* password = "dxp2jzb9";

// =============================
// Ultrasonic Sensor
// =============================
#define TRIG_PIN 2
#define ECHO_PIN 5

void setup() {
  Serial.begin(115200);
  delay(2000);

  // =============================
  // Ultrasonic setup
  // =============================
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);

  // =============================
  // WiFi setup
  // =============================
  Serial.println();
  Serial.println("==============================");
  Serial.println("ESP32-C3 WiFi + HEIGHT SENSOR");
  Serial.println("==============================");

  Serial.println("Setting WiFi mode...");
  WiFi.mode(WIFI_STA);

  Serial.println("Starting WiFi connection...");
  WiFi.begin(ssid, password);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi CONNECTED!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } 
  else {
    Serial.println("WiFi CONNECTION FAILED!");
  }
}

float getDistanceCM() {
  // Send trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  // No echo
  if (duration == 0) {
    return -1;
  }

  // Convert time to distance
  float distance = duration * 0.0343 / 2;

  return distance;
}

void loop() {

  // =============================
  // HEIGHT MEASUREMENT
  // =============================

  float distance = getDistanceCM();

  if (distance > 0) {

    // Change this to your sensor's mounting height
    float sensorHeight = 200.0;

    float height = sensorHeight - distance;

    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");

    Serial.print("Height: ");
    Serial.print(height);
    Serial.println(" cm");

  } 
  else {
    Serial.println("No ultrasonic reading");
  }

  // =============================
  // WiFi status
  // =============================

  if (WiFi.status() == WL_CONNECTED) {

    Serial.print("WiFi: Connected | RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

  } 
  else {

    Serial.println("WiFi disconnected. Reconnecting...");

    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }

  Serial.println("------------------------------");

  delay(2000);
}