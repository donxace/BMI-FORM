#include <HX711_ADC.h>
#include <Preferences.h>

// ========================================
// CONTINUOUS WEIGHT READER (HX711 + load cell, ESP32)
// ========================================
// Standalone: no WiFi, no API, no website. Serial Monitor @ 115200.
// Uses HX711_ADC (Olav Kallhovd): update() never blocks.
//
// Wiring: HX711 DT -> GPIO 4, SCK -> GPIO 5.
//
// Output: one line whenever the weight changes by >= PRINT_DELTA_KG,
// plus a heartbeat every HEARTBEAT_MS. Each line ends with
// STABLE or MOVING.
//
// Commands:
//   t = tare (platform EMPTY) - saved to flash, survives reboot
// ========================================

const int HX711_DOUT_PIN = 4;
const int HX711_SCK_PIN = 5;

// Counts per kg. Fitted on a real 72 kg person (board showed 130 kg at
// -14900). Light loads (<5 kg) read low on this scale; ignore them.
const float CALIBRATION_VALUE = -26900.0;

const unsigned long STABILIZING_TIME_MS = 2000;
const int SAMPLES_IN_USE = 8;               // fewer = faster response, more = smoother
const float PRINT_DELTA_KG = 0.02;          // print only when weight moves this much
const unsigned long HEARTBEAT_MS = 1000;    // ...or at least this often
const float STABLE_RANGE_KG = 0.03;         // spread over recent readings to be STABLE
const float ZERO_DEADBAND_KG = 0.03;        // show 0 below this
const float LBS_PER_KG = 2.20462262;
const int HISTORY = 6;                      // readings used for the stable check

HX711_ADC LoadCell(HX711_DOUT_PIN, HX711_SCK_PIN);
Preferences prefs;

float history[HISTORY];
int historyCount = 0;
int historyIndex = 0;

bool isStable() {
  if (historyCount < HISTORY) return false;
  float lo = history[0], hi = history[0];
  for (int i = 1; i < HISTORY; i++) {
    if (history[i] < lo) lo = history[i];
    if (history[i] > hi) hi = history[i];
  }
  return (hi - lo) <= STABLE_RANGE_KG;
}

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println();
  Serial.println("Continuous weight reader starting...");

  LoadCell.begin();
  LoadCell.setSamplesInUse(SAMPLES_IN_USE); // must be set before start()
  // The zero point is saved in flash, so a reboot with something on
  // the platform keeps the old zero instead of re-taring the load away.
  prefs.begin("weight", false);
  bool hasTare = prefs.isKey("tare");
  LoadCell.start(STABILIZING_TIME_MS, !hasTare); // first boot only: tare now

  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, check wiring and pins (DT=GPIO4, SCK=GPIO5).");
    while (1) delay(1000);
  }

  if (hasTare) {
    LoadCell.setTareOffset(prefs.getLong("tare", 0));
  } else {
    prefs.putLong("tare", LoadCell.getTareOffset());
  }
  LoadCell.setCalFactor(CALIBRATION_VALUE);
  Serial.println("Startup complete. Keep the platform EMPTY at power-up. 't' = tare.");
}

void loop() {
  static float lastPrinted = -1000;
  static unsigned long lastPrintMs = 0;

  // update() returns true when a new conversion was processed.
  if (LoadCell.update()) {
    float kg = LoadCell.getData();
    if (fabs(kg) < ZERO_DEADBAND_KG) kg = 0;

    history[historyIndex] = kg;
    historyIndex = (historyIndex + 1) % HISTORY;
    if (historyCount < HISTORY) historyCount++;

    unsigned long now = millis();
    if (fabs(kg - lastPrinted) >= PRINT_DELTA_KG || now - lastPrintMs >= HEARTBEAT_MS) {
      Serial.print(kg, 2);
      Serial.print(" kg | ");
      Serial.print(kg * LBS_PER_KG, 2);
      Serial.print(" lb | ");
      Serial.println(isStable() ? "STABLE" : "MOVING");
      lastPrinted = kg;
      lastPrintMs = now;
    }
  }

  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 't') LoadCell.tareNoDelay();
  }

  if (LoadCell.getTareStatus()) {
    historyCount = 0;
    historyIndex = 0;
    prefs.putLong("tare", LoadCell.getTareOffset());
    Serial.println("Tare complete (saved)");
  }
}
