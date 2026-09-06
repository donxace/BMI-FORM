#include <Wire.h>
#include <Adafruit_SHT31.h>

// ============================================================
// ESP32 SERVER ROOM SECURITY SYSTEM
// ============================================================
//
// MQ-2        -> GPIO 34
// LDR         -> GPIO 35
// Laser       -> GPIO 26
// Buzzer      -> GPIO 25
//
// SHT3X:
// SDA         -> GPIO 21
// SCL         -> GPIO 22
//
// SIM800L:
// TXD         -> ESP32 GPIO 16 (RX2)
// RXD         -> ESP32 GPIO 17 (TX2)
// GND         -> Common GND
// VDD         -> ESP32 3.3V logic reference
// 5VIN        -> External 5V supply
//
// Serial Monitor -> 115200
// SIM800L UART   -> 9600
// ============================================================


// ============================================================
// PIN DEFINITIONS
// ============================================================

#define MQ2_PIN       34
#define LDR_PIN       35
#define LASER_PIN     26
#define BUZZER_PIN    25

#define SIM800_RX     16
#define SIM800_TX     17

#define SHT31_SDA     21
#define SHT31_SCL     22


// ============================================================
// SENSOR THRESHOLDS
// ============================================================

// MQ-2
#define SMOKE_THRESHOLD       250
#define SMOKE_VERY_BAD        500
#define SMOKE_CRITICAL        800

// Laser / LDR
#define LDR_THRESHOLD         100

// Temperature
#define TEMP_LOW_BAD          18.0
#define TEMP_GOOD_MAX         27.0
#define TEMP_BAD_MAX          30.0
#define TEMP_VERY_BAD_MAX     35.0

// Humidity
#define HUM_LOW_BAD           30.0
#define HUM_GOOD_MAX          60.0
#define HUM_BAD_MAX           70.0
#define HUM_VERY_BAD_MAX      80.0


// ============================================================
// TIMING
// ============================================================

#define SMOKE_CONFIRM_TIME    5000UL
#define SMOKE_ALARM_TIME      30000UL


// ============================================================
// PHONE NUMBERS
// ============================================================

const char *phoneNumbers[] = {
  "09974339872",
  "09760721613"
};

const int phoneCount = 2;


// ============================================================
// OBJECTS
// ============================================================

HardwareSerial SIM800(2);

Adafruit_SHT31 sht31 = Adafruit_SHT31();


// ============================================================
// STATES
// ============================================================

// Smoke
bool smokeCondition = false;
bool smokeAlertSent = false;
bool smokeAlarmActive = false;

unsigned long smokeStartTime = 0;
unsigned long smokeAlarmStart = 0;


// Motion
bool motionDetected = false;


// Temperature
bool temperatureBad = false;
bool temperatureAlertSent = false;


// Humidity
bool humidityBad = false;
bool humidityAlertSent = false;


// ============================================================
// BUZZER
// ============================================================

void buzzerOn() {

  // ESP32 Arduino Core 3.x LEDC
  ledcWriteTone(BUZZER_PIN, 2000);
}


void buzzerOff() {

  ledcWriteTone(BUZZER_PIN, 0);
}


// ============================================================
// SEND AT COMMAND
// ============================================================

void sendATCommand(String command, unsigned long waitTime = 1000) {

  SIM800.println(command);

  unsigned long start = millis();

  while (millis() - start < waitTime) {

    while (SIM800.available()) {

      Serial.write(SIM800.read());
    }
  }
}


// ============================================================
// SEND SMS TO ONE NUMBER
// ============================================================

bool sendSMS(const char *number, String message) {

  Serial.println();
  Serial.println("================================");
  Serial.print("Sending SMS to: ");
  Serial.println(number);


  // Set SMS text mode
  SIM800.println("AT+CMGF=1");

  delay(500);


  // Select recipient
  SIM800.print("AT+CMGS=\"");
  SIM800.print(number);
  SIM800.println("\"");


  unsigned long start = millis();

  bool promptReceived = false;


  // Wait for >
  while (millis() - start < 5000) {

    if (SIM800.available()) {

      char c = SIM800.read();

      Serial.write(c);

      if (c == '>') {

        promptReceived = true;

        break;
      }
    }
  }


  if (!promptReceived) {

    Serial.println();
    Serial.println("ERROR: SIM800L did not give SMS prompt.");

    return false;
  }


  // Send message
  SIM800.print(message);

  delay(300);


  // CTRL + Z
  SIM800.write(26);


  Serial.println();
  Serial.println("Waiting for SMS confirmation...");


  start = millis();

  bool sent = false;


  while (millis() - start < 15000) {

    if (SIM800.available()) {

      String response = SIM800.readString();

      Serial.println(response);


      if (response.indexOf("+CMGS:") >= 0 ||
          response.indexOf("OK") >= 0) {

        sent = true;

        break;
      }
    }
  }


  if (sent) {

    Serial.println("Message Sent");

  }
  else {

    Serial.println("Message Failed");
  }


  return sent;
}


// ============================================================
// SEND SMS TO ALL NUMBERS
// ============================================================

void sendSMSAll(String message) {

  for (int i = 0; i < phoneCount; i++) {

    sendSMS(phoneNumbers[i], message);

    delay(1000);
  }
}


// ============================================================
// MQ-2 STATUS
// ============================================================

String getSmokeStatus(int value) {

  if (value < SMOKE_THRESHOLD) {

    return "GOOD";
  }


  if (value < SMOKE_VERY_BAD) {

    return "BAD";
  }


  if (value < SMOKE_CRITICAL) {

    return "VERY BAD";
  }


  return "CRITICAL";
}


// ============================================================
// TEMPERATURE STATUS
// ============================================================

String getTemperatureStatus(float temp) {

  if (temp < TEMP_LOW_BAD) {

    return "BAD";
  }


  if (temp <= TEMP_GOOD_MAX) {

    return "GOOD";
  }


  if (temp <= TEMP_BAD_MAX) {

    return "BAD";
  }


  if (temp <= TEMP_VERY_BAD_MAX) {

    return "VERY BAD";
  }


  return "CRITICAL";
}


// ============================================================
// HUMIDITY STATUS
// ============================================================

String getHumidityStatus(float humidity) {

  if (humidity < HUM_LOW_BAD) {

    return "BAD";
  }


  if (humidity <= HUM_GOOD_MAX) {

    return "GOOD";
  }


  if (humidity <= HUM_BAD_MAX) {

    return "BAD";
  }


  if (humidity <= HUM_VERY_BAD_MAX) {

    return "VERY BAD";
  }


  return "CRITICAL";
}


// ============================================================
// LASER STATUS
// ============================================================

String getLaserStatus(int ldrValue) {

  if (ldrValue >= LDR_THRESHOLD) {

    return "CLEAR";
  }


  return "BLOCKED";
}


// ============================================================
// OVERALL STATUS
// ============================================================

String getOverallStatus(
  int smokeValue,
  float temperature,
  float humidity,
  int ldrValue
) {

  bool danger = false;


  // Smoke
  if (smokeValue >= SMOKE_THRESHOLD) {

    danger = true;
  }


  // Temperature
  if (getTemperatureStatus(temperature) != "GOOD") {

    danger = true;
  }


  // Humidity
  if (getHumidityStatus(humidity) != "GOOD") {

    danger = true;
  }


  // Laser / motion
  if (ldrValue < LDR_THRESHOLD) {

    danger = true;
  }


  if (danger) {

    return "ALERT";
  }


  return "NORMAL";
}


// ============================================================
// SEND SMOKE ALERT
// ============================================================

void sendSmokeAlert(int smokeValue) {

  String severity = getSmokeStatus(smokeValue);


  String message = "";

  message += "SMOKE/GAS ALERT\n";

  message += "MQ-2 Value: ";
  message += String(smokeValue);

  message += "\nThreshold: ";
  message += String(SMOKE_THRESHOLD);

  message += "\nStatus: ";
  message += severity;


  if (smokeValue >= SMOKE_CRITICAL) {

    message += "\nLevel: CRITICAL";

  }
  else if (smokeValue >= SMOKE_VERY_BAD) {

    message += "\nLevel: VERY BAD";

  }
  else {

    message += "\nLevel: BAD";
  }


  sendSMSAll(message);
}


// ============================================================
// SEND TEMPERATURE ALERT
// ============================================================

void sendTemperatureAlert(float temperature) {

  String status = getTemperatureStatus(temperature);


  String message = "";

  message += "TEMPERATURE ALERT\n";

  message += "Temperature: ";
  message += String(temperature, 1);
  message += " C\n";

  message += "Status: ";
  message += status;

  message += "\nSafe Range: 18-27 C";


  sendSMSAll(message);
}


// ============================================================
// SEND HUMIDITY ALERT
// ============================================================

void sendHumidityAlert(float humidity) {

  String status = getHumidityStatus(humidity);


  String message = "";

  message += "HUMIDITY ALERT\n";

  message += "Humidity: ";
  message += String(humidity, 1);
  message += " %\n";

  message += "Status: ";
  message += status;

  message += "\nSafe Range: 30-60 %";


  sendSMSAll(message);
}


// ============================================================
// CHECK INCOMING SMS
// ============================================================

void checkIncomingSMS() {

  if (!SIM800.available()) {

    return;
  }


  String incoming = "";


  while (SIM800.available()) {

    incoming += (char)SIM800.read();

    delay(2);
  }


  if (incoming.length() == 0) {

    return;
  }


  Serial.println();
  Serial.println("================================");
  Serial.println("SIM800L DATA:");
  Serial.println(incoming);
  Serial.println("================================");


  // ==========================================================
  // STATUS COMMAND
  // ==========================================================

  if (incoming.indexOf("STATUS") >= 0 ||
      incoming.indexOf("status") >= 0) {


    // Read current values
    int smokeValue = analogRead(MQ2_PIN);

    int ldrValue = analogRead(LDR_PIN);


    float temperature = sht31.readTemperature();

    float humidity = sht31.readHumidity();


    String laserStatus = getLaserStatus(ldrValue);

    String smokeStatus = getSmokeStatus(smokeValue);

    String tempStatus = getTemperatureStatus(temperature);

    String humStatus = getHumidityStatus(temperature);


    // Correct humidity status
    humStatus = getHumidityStatus(humidity);


    String overall;


    if (!isnan(temperature) && !isnan(humidity)) {

      overall = getOverallStatus(
        smokeValue,
        temperature,
        humidity,
        ldrValue
      );

    }
    else {

      overall = "SENSOR ERROR";
    }


    String message = "";


    message += "SERVER ROOM STATUS\n\n";


    // MQ2
    message += "MQ-2: ";
    message += String(smokeValue);

    message += " (";
    message += smokeStatus;
    message += ")\n";


    message += "Smoke Threshold: ";
    message += String(SMOKE_THRESHOLD);

    message += "\n\n";


    // Temperature
    if (!isnan(temperature)) {

      message += "Temperature: ";
      message += String(temperature, 1);
      message += " C (";
      message += tempStatus;
      message += ")\n";

    }
    else {

      message += "Temperature: SENSOR ERROR\n";
    }


    // Humidity
    if (!isnan(humidity)) {

      message += "Humidity: ";
      message += String(humidity, 1);
      message += " % (";
      message += humStatus;
      message += ")\n";

    }
    else {

      message += "Humidity: SENSOR ERROR\n";
    }


    message += "\n";


    // LDR
    message += "LDR: ";
    message += String(ldrValue);
    message += "\n";


    // Laser
    message += "Laser: ";
    message += laserStatus;
    message += "\n";


    // Motion
    message += "Motion: ";

    if (motionDetected) {

      message += "DETECTED";

    }
    else {

      message += "CLEAR";
    }


    message += "\n\n";


    // Smoke alarm
    message += "Smoke Alarm: ";

    if (smokeAlarmActive) {

      message += "ACTIVE";

    }
    else {

      message += "OFF";
    }


    message += "\n";


    // Overall
    message += "Overall: ";
    message += overall;


    // ========================================================
    // FIND SMS SENDER
    // ========================================================

    int cmtPosition = incoming.indexOf("+CMT:");

    String sender = "";


    if (cmtPosition >= 0) {

      int firstQuote =
        incoming.indexOf("\"", cmtPosition);


      if (firstQuote >= 0) {

        int secondQuote =
          incoming.indexOf(
            "\"",
            firstQuote + 1
          );


        if (secondQuote >= 0) {

          sender = incoming.substring(
            firstQuote + 1,
            secondQuote
          );
        }
      }
    }


    // ========================================================
    // REPLY TO SENDER
    // ========================================================

    if (sender.length() > 0) {

      sendSMS(
        sender.c_str(),
        message
      );

    }
    else {

      Serial.println(
        "Could not determine SMS sender."
      );
    }
  }
}


// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(1000);


  Serial.println();
  Serial.println("========================================");
  Serial.println("ESP32 SERVER ROOM SECURITY SYSTEM");
  Serial.println("========================================");


  // ==========================================================
  // SENSOR PINS
  // ==========================================================

  pinMode(MQ2_PIN, INPUT);

  pinMode(LDR_PIN, INPUT);


  // Laser
  pinMode(LASER_PIN, OUTPUT);

  digitalWrite(
    LASER_PIN,
    HIGH
  );


  // ==========================================================
  // BUZZER
  // ==========================================================

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );


  // ESP32 Arduino Core 3.x
  ledcAttach(
    BUZZER_PIN,
    2000,
    8
  );


  // Start with buzzer OFF
  buzzerOff();


  // ==========================================================
  // SHT3X
  // ==========================================================

  Wire.begin(
    SHT31_SDA,
    SHT31_SCL
  );


  if (!sht31.begin(0x44)) {

    Serial.println(
      "ERROR: SHT3X NOT FOUND!"
    );

  }
  else {

    Serial.println(
      "SHT3X OK"
    );
  }


  // ==========================================================
  // SIM800L
  // ==========================================================

  SIM800.begin(
    9600,
    SERIAL_8N1,
    SIM800_RX,
    SIM800_TX
  );


  delay(2000);


  Serial.println(
    "Initializing SIM800L..."
  );


  sendATCommand(
    "AT",
    1000
  );


  sendATCommand(
    "ATE0",
    1000
  );


  sendATCommand(
    "AT+CMGF=1",
    1000
  );


  // Incoming SMS directly to ESP32
  sendATCommand(
    "AT+CNMI=2,2,0,0,0",
    1000
  );


  Serial.println();
  Serial.println(
    "System Ready."
  );

  Serial.println(
    "========================================"
  );
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  unsigned long currentMillis = millis();


  // ==========================================================
  // READ SENSORS
  // ==========================================================

  int smokeValue =
    analogRead(MQ2_PIN);


  int ldrValue =
    analogRead(LDR_PIN);


  float temperature =
    sht31.readTemperature();


  float humidity =
    sht31.readHumidity();


  // ==========================================================
  // LASER / MOTION DETECTION
  // ==========================================================

  motionDetected =
    (ldrValue < LDR_THRESHOLD);


  // ==========================================================
  // SERIAL MONITOR
  // ==========================================================

  Serial.println();
  Serial.println("----------------------------------------");


  // MQ2
  Serial.print("MQ-2: ");
  Serial.print(smokeValue);

  Serial.print(" | Status: ");

  Serial.println(
    getSmokeStatus(smokeValue)
  );


  // LDR
  Serial.print("LDR: ");
  Serial.print(ldrValue);

  Serial.print(" | Threshold: ");
  Serial.print(LDR_THRESHOLD);

  Serial.print(" | Laser: ");


  if (motionDetected) {

    Serial.println(
      "BLOCKED / MOTION"
    );

  }
  else {

    Serial.println(
      "CLEAR"
    );
  }


  // ==========================================================
  // TEMPERATURE
  // ==========================================================

  if (!isnan(temperature)) {

    Serial.print(
      "Temperature: "
    );

    Serial.print(
      temperature,
      1
    );

    Serial.print(
      " C | Status: "
    );

    Serial.println(
      getTemperatureStatus(
        temperature
      )
    );

  }
  else {

    Serial.println(
      "Temperature: SENSOR ERROR"
    );
  }


  // ==========================================================
  // HUMIDITY
  // ==========================================================

  if (!isnan(humidity)) {

    Serial.print(
      "Humidity: "
    );

    Serial.print(
      humidity,
      1
    );

    Serial.print(
      " % | Status: "
    );

    Serial.println(
      getHumidityStatus(
        humidity
      )
    );

  }
  else {

    Serial.println(
      "Humidity: SENSOR ERROR"
    );
  }


  // ==========================================================
  // MOTION SERIAL CONFIRMATION
  // ==========================================================
  //
  // NO SMS IS SENT HERE.
  //
  // Every time the beam is blocked, the Serial Monitor
  // confirms the motion detection.
  // ==========================================================

  if (motionDetected) {

    Serial.println();
    Serial.println(
      "!!! MOTION DETECTED !!!"
    );

    Serial.print(
      "LDR Value: "
    );

    Serial.println(
      ldrValue
    );

    Serial.print(
      "Threshold: "
    );

    Serial.println(
      LDR_THRESHOLD
    );

    Serial.println(
      "Laser: BLOCKED"
    );

    Serial.println(
      "BUZZER: ON"
    );
  }


  // ==========================================================
  // SMOKE DETECTION
  // ==========================================================

  if (smokeValue >= SMOKE_THRESHOLD) {


    if (!smokeCondition) {

      smokeCondition = true;

      smokeStartTime =
        currentMillis;


      Serial.println();

      Serial.println(
        "Smoke/Gas detected."
      );

      Serial.println(
        "Starting confirmation timer..."
      );
    }


    // Confirm smoke for 5 seconds
    if (
      (currentMillis - smokeStartTime >=
       SMOKE_CONFIRM_TIME)
      &&
      !smokeAlertSent
    ) {


      Serial.println();

      Serial.println(
        "!!! SMOKE/GAS CONFIRMED !!!"
      );


      sendSmokeAlert(
        smokeValue
      );


      smokeAlertSent = true;


      smokeAlarmActive = true;


      smokeAlarmStart =
        currentMillis;
    }

  }
  else {

    // Smoke returned to normal

    smokeCondition = false;

    smokeStartTime = 0;

    smokeAlertSent = false;
  }


  // ==========================================================
  // SMOKE ALARM TIMER
  // ==========================================================

  if (smokeAlarmActive) {


    if (
      currentMillis -
      smokeAlarmStart >=
      SMOKE_ALARM_TIME
    ) {

      smokeAlarmActive = false;


      Serial.println(
        "Smoke alarm timer finished."
      );
    }
  }


  // ==========================================================
  // TEMPERATURE ALERT
  // ==========================================================

  if (!isnan(temperature)) {


    String tempStatus =
      getTemperatureStatus(
        temperature
      );


    bool currentTemperatureBad =
      (tempStatus != "GOOD");


    if (currentTemperatureBad) {


      if (!temperatureBad) {

        temperatureBad = true;


        if (!temperatureAlertSent) {


          Serial.println();

          Serial.println(
            "!!! TEMPERATURE ALERT !!!"
          );


          sendTemperatureAlert(
            temperature
          );


          temperatureAlertSent = true;
        }
      }

    }
    else {

      temperatureBad = false;

      temperatureAlertSent = false;
    }
  }


  // ==========================================================
  // HUMIDITY ALERT
  // ==========================================================

  if (!isnan(humidity)) {


    String humidityStatus =
      getHumidityStatus(
        humidity
      );


    bool currentHumidityBad =
      (humidityStatus != "GOOD");


    if (currentHumidityBad) {


      if (!humidityBad) {

        humidityBad = true;


        if (!humidityAlertSent) {


          Serial.println();

          Serial.println(
            "!!! HUMIDITY ALERT !!!"
          );


          sendHumidityAlert(
            humidity
          );


          humidityAlertSent = true;
        }
      }

    }
    else {

      humidityBad = false;

      humidityAlertSent = false;
    }
  }


  // ==========================================================
  // BUZZER CONTROL
  // ==========================================================
  //
  // MOTION:
  //     Laser blocked -> BUZZER ON
  //
  // SMOKE:
  //     Confirmed smoke -> BUZZER ON
  //     For 30 seconds
  //
  // NORMAL:
  //     BUZZER OFF
  //
  // Motion does NOT send SMS.
  // ==========================================================

  if (
    smokeAlarmActive ||
    motionDetected
  ) {

    buzzerOn();

  }
  else {

    buzzerOff();
  }


  // ==========================================================
  // CHECK INCOMING SMS
  // ==========================================================

  checkIncomingSMS();


  // ==========================================================
  // LOOP DELAY
  // ==========================================================

  delay(500);
}