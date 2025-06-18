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

## ESP32/ESP8266 Code

Hier ist ein einfacher Arduino-Code für Ihren ESP, um Potentiometer-Werte zu senden:

```cpp
// ESP32/ESP8266 Code für Potentiometer-Steuerung
const int POTI_PIN = A0;  // Für ESP8266 oder GPIO 36 für ESP32
unsigned long lastSend = 0;
const int SEND_INTERVAL = 50; // Sende alle 50ms (20Hz)

void setup() {
  Serial.begin(115200);
  pinMode(POTI_PIN, INPUT);
  
  // Warte auf Serial Verbindung
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("ESP Potentiometer Controller gestartet");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSend >= SEND_INTERVAL) {
    int potiValue = analogRead(POTI_PIN);
    
    // Sende in einfachem Format
    Serial.print("poti:");
    Serial.println(potiValue);
    
    // Alternativ: JSON Format
    // Serial.print("{\"poti\":");
    // Serial.print(potiValue);
    // Serial.println("}");
    
    lastSend = currentTime;
  }
  
  delay(1);
}
```

## Hardware Setup

1. **Potentiometer anschließen**:
   - VCC → 3.3V (ESP32/ESP8266)
   - GND → GND
   - Wiper (mittlerer Pin) → A0 (ESP8266) oder GPIO 36 (ESP32)

2. **ESP programmieren**:
   - Arduino IDE verwenden
   - Entsprechende Board-Unterstützung installieren
   - Code hochladen

## Verwendung

1. **Browser öffnen**: Chrome, Edge oder Opera verwenden
2. **ESP verbinden**: USB-Kabel zwischen ESP und Computer
3. **Webseite laden**: `index.html` öffnen
4. **ESP verbinden**: 
   - "ESP Verbinden" Button klicken
   - Entsprechenden COM-Port auswählen
5. **Steuerungsmodus wählen**:
   - Dropdown-Menü verwenden
   - Gewünschten Modus auswählen
6. **Potentiometer drehen**: Spiegel bewegen sich entsprechend

## Datenformate

Der ESP kann Daten in verschiedenen Formaten senden:

### Einfaches Format
```
poti:1023
poti:2048
poti:4095
```

### JSON Format  
```json
{"poti":1023}
{"value":2048}
{"angle":4095}
```

### Nur Wert
```
1023
2048
4095
```

## Wertebereiche

- **ESP ADC**: 0-4095 (12-bit)
- **Spiegel 6**: -170° bis 0°
- **Spiegel 7**: -90° bis 90°

Die Werte werden automatisch zwischen den Bereichen gemappt.

## Troubleshooting

### ESP wird nicht erkannt
- Überprüfen Sie die USB-Verbindung
- Stellen Sie sicher, dass der richtige COM-Port ausgewählt ist
- ESP-Treiber installieren (falls nötig)

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
