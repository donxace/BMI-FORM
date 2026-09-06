// Simple ESP32 Test Code (Blink)
#define LED_PIN 2

void setup() {
  // Initialize the digital pin as an output
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH); // Turn the LED on
  delay(1000);                 // Wait for a second
  digitalWrite(LED_PIN, LOW);  // Turn the LED off
  delay(1000);                 // Wait for a second
}
