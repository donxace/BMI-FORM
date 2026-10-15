#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_SHT31.h> // Your perfectly working SHT31 Library

// ========================================
// SAFETY MONITOR (INTRUSION + SMOKE + TEMPERATURE)
// ========================================
// Real-sensor version of INTRUSION_DETECTION + ENVIRONMENT_MONITORING
// on one ESP32:
//   - Laser/LDR beam break  -> POST /intrusion-detection/event
//                              (Intrusion Detection page)
//   - SHT31 + MQ-2          -> POST /environment-monitoring/reading
//                              (Smoke & Temperature page)
//   - Buzzer + SIM800L SMS still work on their own, with or without
//     WiFi/website: the alarm never waits on the network.
//
// WiFi + server are the same as BMI_MAIN. If the PC running the
// backend gets a new IP, change SERVER_BASE here and in BMI_MAIN.
// ========================================

const char* ssid = "ssf";
const char* password = "dxp2jzb9";

const String SERVER_BASE = "http://172.20.10.3:3000";
const String INTRUSION_URL = SERVER_BASE + "/intrusion-detection/event";
const String ENVIRONMENT_URL = SERVER_BASE + "/environment-monitoring/reading";

const char* INTRUSION_SENSOR_ID = "LASER-01";
const char* ENVIRONMENT_SENSOR_ID = "ENV-01";

// Pin Definitions
#define MQ2_PIN 34
#define LDR_PIN 35
#define BUZZER_PIN 25

// Threshold Configuration
// (the backend uses the same smoke/temperature values, so the website
// shows an alert exactly when the buzzer goes off)
#define MQ2_THRESHOLD 1200
#define TEMP_HIGH_LIMIT 40.0
#define HUMID_LOW_LIMIT 20.0
#define LDR_THRESHOLD 2000      // Laser beam broken drops light level/increases reading

// Global SMS Rate Limiting Variables (5 minutes = 300,000 ms)
const unsigned long SMS_INTERVAL = 300000;
unsigned long lastAlertTime = 0;
bool climateOrSmokeAnomalyActive = false;

// Non-blocking timer for Serial Monitor logging (2 seconds = 2000 ms)
const unsigned long SERIAL_LOG_INTERVAL = 2000;
unsigned long lastSerialLogTime = 0;

// State tracking for the Laser/LDR edge trigger
bool laserWasBroken = false;

// Default Emergency Destination Number (Change to your phone number)
const String EMERGENCY_PHONE = "+639171234567";

Adafruit_SHT31 sht31 = Adafruit_SHT31();
bool sensorOK = false;

// ========================================
// WEBSITE REPORTING
// ========================================
// Environment readings go out every 3s (and immediately when the
// alert state flips). Intrusion goes out on every beam break/restore;
// a failed POST is retried every 2s until the website has it.
const unsigned long ENV_SEND_INTERVAL = 3000;
unsigned long lastEnvSendTime = 0;
bool lastSentAnomaly = false;

const unsigned long INTRUSION_RETRY_INTERVAL = 2000;
unsigned long lastIntrusionAttempt = 0;
bool intrusionReported = false;       // has the website got ANY state yet
bool lastReportedIntrusion = false;

// Short HTTP timeout so a dead server can't stall the alarm loop.
const uint16_t HTTP_TIMEOUT_MS = 3000;

const unsigned long WIFI_CONNECT_TIMEOUT = 15000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;
unsigned long lastWifiRetry = 0;
bool wifiWasConnected = false;

// Blocking beeps, only used for short status signals (boot / WiFi joined).
void beep(int times, unsigned long onMs, unsigned long offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(onMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) {
      delay(offMs);
    }
  }
}

// 5 fast beeps each time WiFi goes from disconnected to connected
// (first connect at boot, and every reconnect after a drop).
void checkWiFiJoined() {
  bool connected = (WiFi.status() == WL_CONNECTED);
  if (connected && !wifiWasConnected) {
    beep(5, 60, 60);
  }
  wifiWasConnected = connected;
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi \"");
  Serial.print(ssid);
  Serial.print("\"");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_CONNECT_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected! ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi not connected yet. Alarm runs offline; retrying in the background.");
  }

  checkWiFiJoined();
}

// Non-blocking: called every loop, only nudges the radio every 10s.
void maintainWiFi(unsigned long currentMillis) {
  checkWiFiJoined();

  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  if (currentMillis - lastWifiRetry >= WIFI_RETRY_INTERVAL) {
    lastWifiRetry = currentMillis;
    Serial.println("[WIFI] Disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }
}

// Returns true when the backend answered 2xx.
bool postJson(const String& url, const String& json) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(json);
  http.end();

  Serial.print("[WEB] POST ");
  Serial.print(url);
  Serial.print(" -> ");
  Serial.println(responseCode);

  return responseCode >= 200 && responseCode < 300;
}

void reportIntrusion(bool broken, unsigned long currentMillis) {
  if (intrusionReported && broken == lastReportedIntrusion) {
    return; // website already has this state
  }
  if (currentMillis - lastIntrusionAttempt < INTRUSION_RETRY_INTERVAL && lastIntrusionAttempt != 0) {
    return;
  }
  lastIntrusionAttempt = currentMillis;

  String json = "{";
  json += "\"status\":\"" + String(broken ? "triggered" : "clear") + "\",";
  json += "\"sensor_id\":\"" + String(INTRUSION_SENSOR_ID) + "\"";
  json += "}";

  if (postJson(INTRUSION_URL, json)) {
    intrusionReported = true;
    lastReportedIntrusion = broken;
  }
}

void reportEnvironment(float temp, float humid, int mq2Value, bool isSensorError) {
  String json = "{";
  // On a sensor error temperature/humidity are left out, so the
  // website keeps the last good value instead of showing garbage.
  if (!isSensorError) {
    json += "\"temperature\":" + String(temp, 1) + ",";
    json += "\"humidity\":" + String(humid, 1) + ",";
  }
  json += "\"smoke_level\":" + String(mq2Value) + ",";
  json += "\"sensor_id\":\"" + String(ENVIRONMENT_SENSOR_ID) + "\"";
  json += "}";

  postJson(ENVIRONMENT_URL, json);
}

// ========================================
// SIM800L
// ========================================

// Echo whatever the modem says for waitMs (shows OK/ERROR in the monitor).
void drainGSM(unsigned long waitMs) {
  unsigned long start = millis();
  while (millis() - start < waitMs) {
    while (Serial2.available()) {
      Serial.write(Serial2.read());
    }
  }
}

void initGSM() {
  Serial.println("Initializing SIM800L...");
  Serial2.println("AT");
  drainGSM(1000);
  Serial2.println("AT+CMGF=1"); // SMS text mode
  drainGSM(1000);
  Serial.println();
}

void sendSMS(const String& number, const String& message) {
  Serial.println("\n[GSM] Sending SMS to " + number);
  Serial2.println("AT+CMGF=1");
  drainGSM(500);
  Serial2.println("AT+CMGS=\"" + number + "\"");
  drainGSM(500);
  Serial2.print(message);
  Serial2.write(26); // Ctrl+Z sends the message
  drainGSM(5000);
  Serial.println("\n[GSM] SMS command finished.");
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17); // SIM800L EVB V2 Pins (RX2=16, TX2=17)

  pinMode(BUZZER_PIN, OUTPUT);
  beep(2, 150, 150); // boot signal

  Serial.println("\n=== INITIALIZING SAFETY MONITOR SYSTEM ===");

  // Initialize I2C Communication using your working pins
  Wire.begin(21, 22);

  // Detect sensor at default address 0x44, try 0x45 if needed
  sensorOK = sht31.begin(0x44);
  if (!sensorOK) {
    sensorOK = sht31.begin(0x45);
  }

  if (sensorOK) {
    Serial.println("SUCCESS: SHT3x Climate Sensor Linked.");
  } else {
    Serial.println("CRITICAL ERROR: SHT3x Not Detected! Live climate monitoring disabled.");
  }

  connectToWiFi();

  Serial.println("Waiting 5s for SIM800L network registration...");
  delay(5000);
  initGSM();
}

void loop() {
  unsigned long currentMillis = millis();

  maintainWiFi(currentMillis);

  // 1. READ ALL SENSORS
  int mq2Value = analogRead(MQ2_PIN);
  int ldrValue = analogRead(LDR_PIN);

  float temp = NAN;
  float humid = NAN;
  bool isSensorError = true;

  // Only pull I2C registers if sensor initialized cleanly
  if (sensorOK) {
    temp = sht31.readTemperature();
    humid = sht31.readHumidity();
    if (!isnan(temp) && !isnan(humid)) {
      isSensorError = false;
    }
  }

  // Evaluate Emergency Conditions
  bool smokeDetected = (mq2Value > MQ2_THRESHOLD);
  bool tempAnomaly = (!isSensorError && (temp > TEMP_HIGH_LIMIT || humid < HUMID_LOW_LIMIT));
  bool motionDetected = (ldrValue > LDR_THRESHOLD);

  // 2. LIVE VIEW ON SERIAL MONITOR (Runs every 2 seconds asynchronously)
  if (currentMillis - lastSerialLogTime >= SERIAL_LOG_INTERVAL) {
    Serial.println("\n===== LIVE SENSOR VIEW =====");
    if (isSensorError) {
      Serial.println("Temperature:  [SENSOR ERROR / NAN]");
      Serial.println("Humidity:     [SENSOR ERROR / NAN]");
    } else {
      Serial.print("Temperature: "); Serial.print(temp, 1); Serial.print(" C (Limit: >"); Serial.print(TEMP_HIGH_LIMIT, 0); Serial.println(" C)");
      Serial.print("Humidity:    "); Serial.print(humid, 0); Serial.print(" % (Limit: <"); Serial.print(HUMID_LOW_LIMIT); Serial.println(" %)");
    }
    Serial.print("Gas / Smoke: "); Serial.print(mq2Value); Serial.print(" (Limit: >"); Serial.print(MQ2_THRESHOLD); Serial.println(")");
    Serial.print("Laser LDR:   "); Serial.print(ldrValue); Serial.print(" (Threshold: "); Serial.print(LDR_THRESHOLD); Serial.println(")");
    Serial.print("Alert State: "); Serial.println(climateOrSmokeAnomalyActive ? "⚠️ CRITICAL ANOMALY ACTIVE" : "✅ SYSTEM SECURE");
    Serial.print("WiFi:        "); Serial.println(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "DISCONNECTED");
    Serial.println("=============================");
    lastSerialLogTime = currentMillis;
  }

  // 3. CRITICAL ALERT BUZZER & STATE LOGIC (Smoke or Climate Shift)
  if (smokeDetected || tempAnomaly) {
    digitalWrite(BUZZER_PIN, HIGH);
    climateOrSmokeAnomalyActive = true;
  } else {
    if (climateOrSmokeAnomalyActive) {
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("\n[SYSTEM EVENT] Climate/Gas secure. Resetting alert timers.");
      lastAlertTime = 0;
      climateOrSmokeAnomalyActive = false;
    }
  }

  // 4. MOTION DETECTED SINGLE BEEP LOGIC
  if (motionDetected) {
    if (!laserWasBroken) {
      if (!climateOrSmokeAnomalyActive) {
        Serial.println("\n[SYSTEM EVENT] Laser breached! Emitting single alert beep.");
        digitalWrite(BUZZER_PIN, HIGH);
        delay(200);
        digitalWrite(BUZZER_PIN, LOW);
      }
      laserWasBroken = true;
    }
  } else {
    laserWasBroken = false;
  }

  // 5. AUTOMATIC RATE-LIMITED OUTBOUND EMERGENCY SMS (Smoke/Climate Only)
  if (climateOrSmokeAnomalyActive) {
    if (lastAlertTime == 0 || (currentMillis - lastAlertTime >= SMS_INTERVAL)) {
      String alertMsg = "SYSTEM ALERT!\n";
      if (smokeDetected) alertMsg += "- Gas/Smoke Detected! (Val: " + String(mq2Value) + ")\n";
      if (tempAnomaly) alertMsg += "- Climate Shift! T: " + String(temp, 1) + "C, H: " + String(humid, 0) + "%\n";

      sendSMS(EMERGENCY_PHONE, alertMsg);
      lastAlertTime = currentMillis;
    }
  }

  // 6. REPORT TO WEBSITE (after the buzzer/SMS, so the alarm never waits on WiFi)
  reportIntrusion(laserWasBroken, currentMillis);

  if (climateOrSmokeAnomalyActive != lastSentAnomaly ||
      currentMillis - lastEnvSendTime >= ENV_SEND_INTERVAL) {
    reportEnvironment(temp, humid, mq2Value, isSensorError);
    lastEnvSendTime = currentMillis;
    lastSentAnomaly = climateOrSmokeAnomalyActive;
  }

  delay(50);
}
