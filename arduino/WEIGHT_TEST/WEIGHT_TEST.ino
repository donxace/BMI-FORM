#include <HX711.h>

// ========================================
// WEIGHT SENSOR TEST (HX711 + load cell, ESP32)
// ========================================
// Install the "HX711" library by Bogdan Necula (bogde) from the
// Arduino Library Manager first.
//
// SEQUENCE (follow the prompts in the Serial Monitor @ 115200):
// 1. Leave the platform EMPTY, then send 't' -> tare (zero).
// 2. When the sketch says "PLACE 1.5 LBS", put the 1.5 lb
//    weight on the platform, let it settle, then send 'c'
//    -> calibration factor is computed and saved in RAM.
// 3. Weight is then printed continuously in lb, kg and g.
//    Remove / re-add the 1.5 lb weight to verify the reading.
//
// Commands: t = tare, c = calibrate with 1.5 lb, r = reset
// ========================================

const int HX711_DT_PIN = 32;
const int HX711_SCK_PIN = 33;

const float CALIBRATION_WEIGHT_LBS = 1.5;
const float LBS_TO_KG = 0.45359237;

HX711 scale;

float calibrationFactor = 1.0; // raw counts per lb, set by 'c'
bool calibrated = false;

void printPrompt() {
  Serial.println();
  Serial.println("Commands: t = tare (platform EMPTY), c = calibrate (1.5 lb on platform), r = restart");
}

void tareScale() {
  Serial.println("Taring... keep the platform EMPTY.");
  scale.tare(20);
  Serial.println("Tare done.");
  Serial.println(">>> PLACE 1.5 LBS on the platform now, wait ~3s, then send 'c'.");
}

void calibrateScale() {
  Serial.println("Calibrating with 1.5 lb... keep it still.");
  float raw = scale.get_value(20); // average minus tare offset

  if (raw == 0) {
    Serial.println("No change detected. Check wiring / that the weight is on the platform.");
    return;
  }

  calibrationFactor = raw / CALIBRATION_WEIGHT_LBS;
  scale.set_scale(calibrationFactor);
  calibrated = true;

  Serial.print("Calibration factor (counts per lb): ");
  Serial.println(calibrationFactor, 2);
  Serial.println("Calibrated. Reading weight below. Remove/re-add the 1.5 lb to verify.");
}

void setup() {
  Serial.begin(115200);
  delay(500);

  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  Serial.println("Weight test starting...");

  while (!scale.is_ready()) {
    Serial.println("HX711 not found. Check DT/SCK wiring and power.");
    delay(1000);
  }

  Serial.println(">>> Make sure the platform is EMPTY, then send 't' to tare.");
  printPrompt();
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();

    if (cmd == 't') {
      tareScale();
    } else if (cmd == 'c') {
      calibrateScale();
    } else if (cmd == 'r') {
      ESP.restart();
    }
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint < 500) return;
  lastPrint = millis();

  if (!scale.is_ready()) return;

  if (!calibrated) {
    Serial.print("Raw (uncalibrated): ");
    Serial.println(scale.get_value(5), 0);
    return;
  }

  float lbs = scale.get_units(5);

  Serial.print("Weight: ");
  Serial.print(lbs, 2);
  Serial.print(" lb | ");
  Serial.print(lbs * LBS_TO_KG, 3);
  Serial.print(" kg | ");
  Serial.print(lbs * LBS_TO_KG * 1000.0, 0);
  Serial.println(" g");
}
