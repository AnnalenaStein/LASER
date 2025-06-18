# Laser Parcours Simulation mit ESP Web Serial Steuerung

Eine interaktive Laserparcours-Simulation mit der Möglichkeit, Spiegel über ein ESP32/ESP8266 Potentiometer zu steuern.

## Features

- **Interaktive Lasersimulation**: Visualisierung des Laserstrahls durch verschiedene Spiegel zum Prisma
- **Web Serial API Integration**: Direkte Verbindung zu ESP32/ESP8266 über USB
- **Mehrere Steuerungsmodi**:
  - Manuell (Slider)
  - ESP → Spiegel 6
  - ESP → Spiegel 7  
  - ESP → Beide Spiegel
- **Echtzeit-Datenvisualisierung**: Anzeige der Roh- und gemappten Werte vom ESP

## Browser-Unterstützung

Die Web Serial API wird unterstützt von:
- Chrome 89+
- Microsoft Edge 89+
- Opera 75+

**Hinweis**: Firefox unterstützt die Web Serial API noch nicht.

## Arduino Code

Hier ist der Arduino-Code für Ihren **Arduino** mit **zwei Potentiometern** zur Steuerung beider Spiegel:

```cpp
// Arduino Code für Dual-Potentiometer-Steuerung
const int POTI0_PIN = A0;  // Potentiometer für Spiegel 6 (0° bis 360°)
const int POTI1_PIN = A1;  // Potentiometer für Spiegel 7 (0° bis 360°)

unsigned long lastSend = 0;
const int SEND_INTERVAL = 50; // Sende alle 50ms (20Hz)

void setup() {
  Serial.begin(115200);
  pinMode(POTI0_PIN, INPUT);
  pinMode(POTI1_PIN, INPUT);
  
  // Warte auf Serial Verbindung
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("Arduino Dual Potentiometer Controller gestartet");
  Serial.println("Poti0 (A0) -> Spiegel 6 (0° bis 360°)");
  Serial.println("Poti1 (A1) -> Spiegel 7 (0° bis 360°)");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSend >= SEND_INTERVAL) {
    int poti0Value = analogRead(POTI0_PIN);
    int poti1Value = analogRead(POTI1_PIN);
    
    // Sende beide Werte im Format: "poti0:value,poti1:value"
    Serial.print("poti0:");
    Serial.print(poti0Value);
    Serial.print(",poti1:");
    Serial.println(poti1Value);
    
    // Alternativ: JSON Format (auskommentiert)
    // Serial.print("{\"poti0\":");
    // Serial.print(poti0Value);
    // Serial.print(",\"poti1\":");
    // Serial.print(poti1Value);
    // Serial.println("}");
    
    lastSend = currentTime;
  }
  
  delay(1);
}
```

### Einzelne Potentiometer-Tests

Falls Sie die Potentiometer einzeln testen möchten:

```cpp
// Test nur Poti0 (Spiegel 6)
void testPoti0Only() {
  int poti0Value = analogRead(POTI0_PIN);
  Serial.print("poti0:");
  Serial.println(poti0Value);
  delay(100);
}

// Test nur Poti1 (Spiegel 7)  
void testPoti1Only() {
  int poti1Value = analogRead(POTI1_PIN);
  Serial.print("poti1:");
  Serial.println(poti1Value);
  delay(100);
}
```

## Hardware Setup

1. **Zwei Potentiometer anschließen**:
   
   **Potentiometer 1 (Spiegel 6):**
   - VCC → 5V (Arduino)
   - GND → GND
   - Wiper (mittlerer Pin) → A0
   
   **Potentiometer 2 (Spiegel 7):**
   - VCC → 5V (Arduino)
   - GND → GND
   - Wiper (mittlerer Pin) → A1

2. **Wertebereiche der Potentiometer**:
   - **Poti 0 (A0)**: Steuert Spiegel 6 von 0° bis 360°
   - **Poti 1 (A1)**: Steuert Spiegel 7 von 0° bis 360°
   - **Arduino ADC**: 0-1023 (10-bit)
   - **Eine Potentiometer-Umdrehung = Eine Spiegel-Umdrehung (360°)**
   - Beide Potentiometer nutzen den vollen 360° Drehbereich

3. **Arduino programmieren**:
   - Arduino IDE verwenden
   - Arduino Uno/Nano/Mega Board wählen
   - Code hochladen

## Verwendung

1. **Browser öffnen**: Chrome, Edge oder Opera verwenden
2. **Arduino verbinden**: USB-Kabel zwischen Arduino und Computer
3. **Webseite laden**: `index.html` öffnen
4. **Arduino verbinden**: 
   - "ESP Verbinden" Button klicken
   - Entsprechenden COM-Port auswählen
5. **Steuerungsmodus wählen**:
   - Dropdown-Menü verwenden
   - Gewünschten Modus auswählen
6. **Potentiometer drehen**: Spiegel bewegen sich entsprechend

## Datenformate

Der Arduino sendet Daten für beide Potentiometer in folgenden Formaten:

### Dual-Potentiometer Format (Standard)
```
poti0:512,poti1:1023
poti0:256,poti1:768
poti0:1023,poti1:0
```

### JSON Format (Alternative)
```json
{"poti0":512,"poti1":1023}
{"poti0":256,"poti1":768}
{"poti0":1023,"poti1":0}
```

### Einzelne Potentiometer (zum Testen)
```
poti0:512
poti1:1023
```

## Wertebereiche

- **Arduino ADC**: 0-1023 (10-bit)
- **Spiegel 6**: 0° bis 360° (volle Umdrehung)
- **Spiegel 7**: 0° bis 360° (volle Umdrehung)

**1:1 Mapping**: Eine Potentiometer-Umdrehung entspricht einer Spiegel-Umdrehung (360°).

## Troubleshooting

### Arduino wird nicht erkannt
- Überprüfen Sie die USB-Verbindung
- Stellen Sie sicher, dass der richtige COM-Port ausgewählt ist
- Arduino-Treiber installieren (falls nötig)

### Browser-Unterstützung
- Verwenden Sie Chrome, Edge oder Opera
- Stellen Sie sicher, dass die neueste Version installiert ist
- HTTPS ist für Web Serial erforderlich (bei lokalen Dateien nicht nötig)

### Verbindungsfehler
- Überprüfen Sie die Baudrate (115200)
- Stellen Sie sicher, dass keine andere Software den Port verwendet
- ESP neu starten

## Dateien

- `index.html` - Hauptwebseite
- `css/style.css` - Styling
- `js/script.js` - JavaScript-Logik mit Web Serial API
- `README.md` - Diese Dokumentation

## Technische Details

- **Web Serial API** für direkte USB-Kommunikation
- **Echtzeit-Laserstrahlberechnung** mit Reflektion
- **Responsive Design** für verschiedene Bildschirmgrößen
- **Modularer Code** für einfache Erweiterungen
