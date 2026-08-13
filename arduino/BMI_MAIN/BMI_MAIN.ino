#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "ITSD Network2026";
const char* password = "$A$@2026";

const char* serverUrl =
  "http://192.168.1.34:3000/bmi-assessments/esp32";

void setup() {
  Serial.begin(115200);

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

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverUrl);

    http.addHeader(
      "Content-Type",
      "application/json"
    );

    String json = R"({
      "rfid_uid": "RFID001",
      "height": 170,
      "weight": 65,
      "waist": 80,
      "hip": 95,
      "wrist": 17
    })";

    Serial.println();
    Serial.println("Sending measurement...");

    int responseCode = http.POST(json);

    Serial.print("HTTP Response: ");
    Serial.println(responseCode);

    String response = http.getString();

    Serial.println("Server response:");
    Serial.println(response);

    http.end();

  } else {

    Serial.println("WiFi disconnected!");

  }

  delay(10000);
}