
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   21
#define RST_PIN  22
#define SCK_PIN  18
#define MISO_PIN 19
#define MOSI_PIN 23

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\nESP32 + RC522 Diagnostic");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(100);

  // Check RC522 firmware
  byte version = rfid.PCD_ReadRegister(
    MFRC522::VersionReg
  );

  Serial.print("RC522 Firmware Version: 0x");
  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("ERROR: RC522 not responding.");
    Serial.println("Check wiring and 3.3V power.");
  } else {
    Serial.println("RC522 detected successfully!");
    Serial.println("Scan an RFID card.");
  }
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    Serial.println("Card detected, but UID read failed.");
    return;
  }

  Serial.print("Card UID: ");

  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      Serial.print("0");
    }
    Serial.print(rfid.uid.uidByte[i], HEX);
    Serial.print(" ");
  }

  Serial.println();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}