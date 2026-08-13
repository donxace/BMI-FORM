#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "HMS PON";
const char* password = "itsdhms@2026";

const char* serverUrl =
  "http://192.168.1.187:3000/bmi-assessments/esp32";

// ========================================
// MANUAL MEASUREMENT VALUES
// ========================================

float height = 170;
float weight = 65;
float waist  = 80;
float hip    = 95;
float wrist  = 17;

// RFID stays fixed
const char* rfid_uid = "RFID001";

bool sentSuccessfully = false;

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

  // ========================================
  // ALREADY SENT SUCCESSFULLY
  // ========================================

  if (sentSuccessfully) {
    delay(1000);
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverUrl);

    http.addHeader(
      "Content-Type",
      "application/json"
    );

    // ========================================
    // CREATE JSON
    // ========================================

    String json = "{";
    json += "\"rfid_uid\":\"" + String(rfid_uid) + "\",";
    json += "\"height\":" + String(height, 1) + ",";
    json += "\"weight\":" + String(weight, 1) + ",";
    json += "\"waist\":" + String(waist, 1) + ",";
    json += "\"hip\":" + String(hip, 1) + ",";
    json += "\"wrist\":" + String(wrist, 1);
    json += "}";

    Serial.println();
    Serial.println("================================");
    Serial.println("Sending measurement...");
    Serial.println(json);
    Serial.println("================================");

    int responseCode = http.POST(json);

    Serial.print("HTTP Response: ");
    Serial.println(responseCode);

    String response = http.getString();

    Serial.println("Server response:");
    Serial.println(response);

    // ========================================
    // ONLY STOP AFTER SUCCESS
    // ========================================

    if (responseCode >= 200 && responseCode < 300) {

      sentSuccessfully = true;

      Serial.println();
      Serial.println("================================");
      Serial.println("SUCCESS!");
      Serial.println("Measurement saved.");
      Serial.println("No more measurements will be sent.");
      Serial.println("================================");

    } else {

      Serial.println();
      Serial.println("Request failed.");
      Serial.println("Will try again...");
    }

    http.end();

  } else {

    Serial.println("WiFi disconnected!");
  }

  delay(5000);
}
