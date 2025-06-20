document.addEventListener('DOMContentLoaded', function () {
    // Finde alle nötigen Elemente
    const mirrors = document.querySelectorAll('.mirror');
    const laser = document.getElementById('laser1');
    const prism = document.getElementById('prism1');
    const beamsContainer = document.getElementById('beams-container');
    const mirror6Slider = document.getElementById('mirror6-angle');
    const mirror7Slider = document.getElementById('mirror7-angle');
    const mirror6Value = document.getElementById('mirror6-angle-value');
    const mirror7Value = document.getElementById('mirror7-angle-value');
    const resetButton = document.getElementById('reset-button');

    // Web Serial Elemente
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const connectionStatus = document.getElementById('connection-status');
    const controlMode = document.getElementById('control-mode');
    const espDataGroup = document.getElementById('esp-data-group');
    const espRawValue = document.getElementById('esp-raw-value');
    const espMappedValue = document.getElementById('esp-mapped-value');

    // Web Serial Variablen
    let port = null;
    let reader = null;
    let isConnected = false;
    let currentControlMode = 'manual';

    // Erstelle ein Objekt für Spiegeldaten
    const mirrorData = {};
    mirrors.forEach(mirror => {
        const id = mirror.id;
        mirrorData[id] = {
            element: mirror,
            angle: parseInt(mirror.dataset.angle),
            isRotatable: mirror.classList.contains('rotatable')
        };
    });

    // Positioniere die Spiegel an festen Positionen
    function setupMirrors() {
        const containerWidth = document.querySelector('.container').offsetWidth;
        const containerHeight = document.querySelector('.container').offsetHeight;

        // Top mirrors positioning (4 Spiegel oben)
        const topPositions = [
            { left: containerWidth * 0.15, top: containerHeight * 0.1 },
            { left: containerWidth * 0.35, top: containerHeight * 0.1 },
            { left: containerWidth * 0.55, top: containerHeight * 0.1 },
            { left: containerWidth * 0.75, top: containerHeight * 0.1 }
        ];

        const topMirrors = document.querySelectorAll('.top-mirrors .mirror');
        topMirrors.forEach((mirror, index) => {
            if (index < topPositions.length) {
                mirror.style.left = `${topPositions[index].left}px`;
                mirror.style.top = `${topPositions[index].top}px`;
            }
        });

        // Berechne die Zwischenräume für die unteren Spiegel
        // Diese sollen zwischen den oberen Spiegeln platziert werden
        const bottomPositions = [
            { left: containerWidth * 0.30, top: containerHeight * 0.3 }, // Zwischen Spiegel 1 und 2
            { left: containerWidth * 0.50, top: containerHeight * 0.3 }, // Zwischen Spiegel 2 und 3
            { left: containerWidth * 0.10, top: containerHeight * 0.3 }  // Zwischen Spiegel 3 und 4
        ];

        const bottomMirrors = document.querySelectorAll('.bottom-mirrors .mirror');
        bottomMirrors.forEach((mirror, index) => {
            if (index < bottomPositions.length) {
                mirror.style.left = `${bottomPositions[index].left}px`;
                mirror.style.top = `${bottomPositions[index].top}px`;
            }
        });

        // Positioniere den Laserpointer in der vertikalen Mitte auf der rechten Seite
        const laserPointer = document.getElementById('laser1');
        if (laserPointer) {
            // Platziere den Laserpointer in der Mitte des Bildschirms (vertikal) und rechts
            laserPointer.style.right = '60px';
            laserPointer.style.top = `${containerHeight / 2}px`;
            laserPointer.style.transform = `translate(0, -50%)`;  // Zentriere vertikal

            // Anpassung des Winkels, um den Laser auf den rechten oberen Spiegel zu richten
            const verticalOffset = containerHeight / 2 - topPositions[3].top;
            const horizontalDistance = containerWidth - 60 - topPositions[3].left;
            const angle = Math.atan2(-verticalOffset, -horizontalDistance) * (180 / Math.PI);
            laserPointer.style.transform = `translateY(-50%) rotate(${angle}deg)`;
        }

        // Positioniere das Prisma
        const prism = document.getElementById('prism1');
        if (prism) {
            prism.style.left = '60px';
            prism.style.top = '70%';
        }

        // Spezielle Winkel für Spiegel 4, damit er auf Spiegel 5 (linken unteren) zielt
        mirrorData['mirror4'].angle = 170; // Angepasster Winkel für Spiegel 4

        // Wende die Rotationswinkel auf alle Spiegel an
        mirrors.forEach(mirror => {
            if (mirrorData[mirror.id]) {
                applyMirrorAngle(mirror, mirrorData[mirror.id].angle);
            }
        });
    }

    // Wende einen Rotationswinkel auf einen Spiegel an
    function applyMirrorAngle(mirror, angle) {
        // Für die rotierbaren Spiegel müssen wir die bestehende CSS Transform berücksichtigen
        if (mirror.id === 'mirror6') {
            mirror.style.transform = `rotateX(-45deg) rotateZ(-2deg) rotate(${angle}deg)`;
        } else if (mirror.id === 'mirror7') {
            mirror.style.transform = `rotateX(-45deg) rotateZ(2deg) rotate(${angle}deg)`;
        } else {
            // Für andere Spiegel, behalte den normalen Rotate
            mirror.style.transform = `rotate(${angle}deg)`;
        }

        if (mirrorData[mirror.id]) {
            mirrorData[mirror.id].angle = angle;
        }
    }

    // Calculate and draw laser path
    function calculateLaserPath() {
        // Entferne vorhandene Laserstrahlen
        while (beamsContainer.firstChild) {
            beamsContainer.removeChild(beamsContainer.firstChild);
        }

        // Startpunkt: Laser
        const laserRect = laser.getBoundingClientRect();
        let start = {
            x: laserRect.left,
            y: laserRect.top + laserRect.height / 2
        };

        // Initiale Richtung des Lasers - zum rechten oberen Spiegel (#mirror4)
        const targetMirror = document.getElementById('mirror4');
        const targetRect = targetMirror.getBoundingClientRect();
        const targetCenter = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
        };

        const dx = targetCenter.x - start.x;
        const dy = targetCenter.y - start.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        let direction = {
            x: dx / magnitude,
            y: dy / magnitude
        };

        // Erstelle Segmente, bis der Laser den Bildschirm verlässt oder das Prisma trifft
        let pathComplete = false;
        const maxSegments = 20; // Sicherheitsgrenze
        let segmentCount = 0;

        while (!pathComplete && segmentCount < maxSegments) {
            // Finde Schnittpunkt mit nächstem Spiegel oder Prisma
            let nextIntersection = findNextIntersection(start, direction);

            if (nextIntersection) {
                // Zeichne Lasersegment
                drawLaserSegment(start, nextIntersection.point);

                // Wenn wir das Prisma getroffen haben, beenden wir die Schleife
                if (nextIntersection.type === 'prism') {
                    pathComplete = true;
                    // Erfolgreich-Animation für das Prisma
                    prism.style.boxShadow = '0 0 20px 10px rgba(255, 100, 100, 1)';
                    setTimeout(() => {
                        prism.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
                    }, 1000);
                } else {
                    // Reflektiere die Richtung am Spiegel
                    direction = reflectDirection(direction, nextIntersection.angle);
                    // Setze Startpunkt für nächstes Segment
                    start = nextIntersection.point;
                }
            } else {
                // Kein Schnittpunkt gefunden, Laser verlässt den Bildschirm
                const screenEnd = extrapolateToScreenEdge(start, direction);
                drawLaserSegment(start, screenEnd);
                pathComplete = true;
            }

            segmentCount++;
        }
    }

    // Finde den nächsten Schnittpunkt mit einem Spiegel oder dem Prisma
    function findNextIntersection(start, direction) {
        let closestIntersection = null;
        let minDistance = Infinity;

        // Prüfe Schnittpunkte mit allen Spiegeln
        mirrors.forEach(mirror => {
            const rect = mirror.getBoundingClientRect();
            const mirrorCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            const mirrorAngle = mirrorData[mirror.id].angle * Math.PI / 180;

            // Berechne Schnittpunkt mit der Spiegellinie
            const intersection = calculateMirrorIntersection(
                start, direction, mirrorCenter, mirrorAngle
            );

            if (intersection) {
                const dx = intersection.x - start.x;
                const dy = intersection.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Wenn der Schnittpunkt in Richtung des Laserstrahls liegt und näher ist
                // als bisherige Schnittpunkte, aktualisieren wir den nächsten Schnittpunkt
                if (distance > 5 && // Minimale Distanz, um zu vermeiden, dass wir denselben Spiegel wiederholt treffen
                    distance < minDistance) {
                    minDistance = distance;
                    closestIntersection = {
                        point: intersection,
                        angle: mirrorAngle,
                        type: 'mirror',
                        mirror: mirror
                    };
                }
            }
        });

        // Prüfe Schnittpunkt mit Prisma
        const prismRect = prism.getBoundingClientRect();
        const prismIntersection = calculatePrismIntersection(
            start, direction, prismRect
        );

        if (prismIntersection) {
            const dx = prismIntersection.x - start.x;
            const dy = prismIntersection.y - start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5 && distance < minDistance) {
                minDistance = distance;
                closestIntersection = {
                    point: prismIntersection,
                    type: 'prism'
                };
            }
        }

        return closestIntersection;
    }

    // Vereinfachte Berechnung eines Schnittpunkts mit einem Spiegel
    function calculateMirrorIntersection(start, direction, mirrorCenter, mirrorAngle) {
        // Normale des Spiegels berechnen (senkrecht zur Spiegelfläche)
        const normal = {
            x: Math.cos(mirrorAngle + Math.PI / 2),
            y: Math.sin(mirrorAngle + Math.PI / 2)
        };

        // Richtungsvektor des Spiegels
        const mirrorDir = {
            x: Math.cos(mirrorAngle),
            y: Math.sin(mirrorAngle)
        };

        // Parameter für die Geradengleichung des Lasers
        const laserDirMag = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const normalizedLaserDir = {
            x: direction.x / laserDirMag,
            y: direction.y / laserDirMag
        };

        // Berechne den Nenner für die Schnittpunktberechnung
        const denom = normalizedLaserDir.x * mirrorDir.y - normalizedLaserDir.y * mirrorDir.x;

        // Wenn der Nenner nahe null ist, sind die Linien parallel
        if (Math.abs(denom) < 0.0001) {
            return null;
        }

        // Berechne Parameter für den Schnittpunkt
        const c1 = mirrorCenter.x - start.x;
        const c2 = mirrorCenter.y - start.y;
        const s = (c1 * mirrorDir.y - c2 * mirrorDir.x) / denom;
        const t = (c1 * normalizedLaserDir.y - c2 * normalizedLaserDir.x) / denom;

        // Prüfe, ob der Schnittpunkt auf dem Spiegel liegt
        if (s >= 0 && Math.abs(t) <= 40) { // 40 ist etwa die Hälfte der Spiegellänge
            return {
                x: start.x + normalizedLaserDir.x * s,
                y: start.y + normalizedLaserDir.y * s
            };
        }

        return null;
    }

    // Vereinfachte Berechnung eines Schnittpunkts mit dem Prisma
    function calculatePrismIntersection(start, direction, prismRect) {
        // Vereinfachung: Behandle das Prisma als Dreieck
        const lines = [
            // Obere Kante (Dreieckspitze)
            {
                start: { x: prismRect.left + prismRect.width / 2, y: prismRect.top },
                end: { x: prismRect.right, y: prismRect.bottom }
            },
            // Rechte Kante
            {
                start: { x: prismRect.right, y: prismRect.bottom },
                end: { x: prismRect.left, y: prismRect.bottom }
            },
            // Linke Kante
            {
                start: { x: prismRect.left, y: prismRect.bottom },
                end: { x: prismRect.left + prismRect.width / 2, y: prismRect.top }
            }
        ];

        let closestIntersection = null;
        let minDistance = Infinity;

        lines.forEach(line => {
            const intersection = lineIntersection(
                start,
                { x: start.x + direction.x * 2000, y: start.y + direction.y * 2000 },
                line.start,
                line.end
            );

            if (intersection) {
                const dx = intersection.x - start.x;
                const dy = intersection.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check if intersection is in the right direction
                const dotProduct = dx * direction.x + dy * direction.y;

                if (dotProduct > 0 && distance < minDistance) {
                    minDistance = distance;
                    closestIntersection = intersection;
                }
            }
        });

        return closestIntersection;
    }

    // Hilfsfunktion: Schnittpunkt zweier Linien
    function lineIntersection(p1, p2, p3, p4) {
        const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (d === 0) return null;

        const a = ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / d;
        const b = ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / d;

        // Prüfen, ob Schnittpunkt auf beiden Liniensegmenten liegt
        const t1 = ((p2.x - p1.x) !== 0) ? (a - p1.x) / (p2.x - p1.x) : (b - p1.y) / (p2.y - p1.y);
        const t2 = ((p4.x - p3.x) !== 0) ? (a - p3.x) / (p4.x - p3.x) : (b - p3.y) / (p4.y - p3.y);

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            return { x: a, y: b };
        }

        return null;
    }

    // Reflektiere die Richtung an einem Spiegel
    function reflectDirection(direction, mirrorAngle) {
        // Normale des Spiegels (senkrecht zur Spiegelfläche)
        const normal = {
            x: Math.cos(mirrorAngle + Math.PI / 2),
            y: Math.sin(mirrorAngle + Math.PI / 2)
        };

        // Berechne reflektierte Richtung: d - 2(d•n)n
        const dot = direction.x * normal.x + direction.y * normal.y;
        return {
            x: direction.x - 2 * dot * normal.x,
            y: direction.y - 2 * dot * normal.y
        };
    }

    // Extrapoliere einen Punkt bis zum Bildschirmrand
    function extrapolateToScreenEdge(start, direction) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Berechne Schnittpunkte mit allen vier Rändern
        const intersections = [];

        // Oberer Rand
        if (Math.abs(direction.y) > 0.0001) {
            intersections.push({
                x: start.x + direction.x * ((0 - start.y) / direction.y),
                y: 0
            });
        }

        // Rechter Rand
        if (Math.abs(direction.x) > 0.0001) {
            intersections.push({
                x: width,
                y: start.y + direction.y * ((width - start.x) / direction.x)
            });
        }

        // Unterer Rand
        if (Math.abs(direction.y) > 0.0001) {
            intersections.push({
                x: start.x + direction.x * ((height - start.y) / direction.y),
                y: height
            });
        }

        // Linker Rand
        if (Math.abs(direction.x) > 0.0001) {
            intersections.push({
                x: 0,
                y: start.y + direction.y * ((0 - start.x) / direction.x)
            });
        }

        // Finde gültigen Schnittpunkt mit minimalem Abstand
        let validPoint = null;
        let minDistance = Infinity;

        intersections.forEach(point => {
            if (point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height) {
                const dx = point.x - start.x;
                const dy = point.y - start.y;
                const dotProduct = dx * direction.x + dy * direction.y;

                if (dotProduct > 0) { // Nur in Richtung des Laserstrahls
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        validPoint = point;
                    }
                }
            }
        });

        return validPoint || { x: start.x + direction.x * 2000, y: start.y + direction.y * 2000 };
    }

    // Zeichne ein Laserstrahlen-Segment
    function drawLaserSegment(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const beam = document.createElement('div');
        beam.className = 'laser-beam';
        beam.style.left = `${start.x}px`;
        beam.style.top = `${start.y}px`;
        beam.style.width = `${length}px`;
        beam.style.height = '2px';
        beam.style.transform = `rotate(${angle}deg)`;

        beamsContainer.appendChild(beam);
    }

    // ==================== WEB SERIAL API FUNKTIONEN ====================

    // Prüfe ob Web Serial API verfügbar ist
    function checkWebSerialSupport() {
        if (!('serial' in navigator)) {
            alert('Web Serial API wird von diesem Browser nicht unterstützt. Verwenden Sie Chrome/Edge 89+ oder Opera 75+.');
            connectButton.disabled = true;
            return false;
        }
        return true;
    }

    // ESP Verbindung herstellen
    async function connectToESP() {
        try {
            // Bitte um Auswahl eines seriellen Ports
            port = await navigator.serial.requestPort();

            // Port öffnen mit 115200 Baud Rate (Standard für ESP32/ESP8266)
            await port.open({ baudRate: 115200 });

            isConnected = true;
            updateConnectionStatus('connected');

            // Startet das Lesen der Daten
            startReading();

        } catch (error) {
            console.error('Fehler beim Verbinden:', error);
            updateConnectionStatus('error');
            if (error.name === 'NotFoundError') {
                alert('Kein Port ausgewählt.');
            } else {
                alert('Verbindungsfehler: ' + error.message);
            }
        }
    }

    // ESP Verbindung trennen
    async function disconnectFromESP() {
        try {
            if (reader) {
                await reader.cancel();
                reader = null;
            }

            if (port) {
                await port.close();
                port = null;
            }

            isConnected = false;
            updateConnectionStatus('disconnected');

        } catch (error) {
            console.error('Fehler beim Trennen:', error);
        }
    }

    // Verbindungsstatus aktualisieren
    function updateConnectionStatus(status) {
        connectionStatus.className = status;
        connectButton.disabled = isConnected;
        disconnectButton.disabled = !isConnected;

        switch (status) {
            case 'connected':
                connectionStatus.textContent = 'Verbunden';
                espDataGroup.style.display = 'block';
                break;
            case 'disconnected':
                connectionStatus.textContent = 'Nicht verbunden';
                espDataGroup.style.display = 'none';
                break;
            case 'error':
                connectionStatus.textContent = 'Verbindungsfehler';
                espDataGroup.style.display = 'none';
                break;
        }
    }

    // Daten vom ESP lesen
    async function startReading() {
        try {
            reader = port.readable.getReader();
            let buffer = '';

            while (isConnected) {
                const { value, done } = await reader.read();
                if (done) break;

                // Konvertiere Uint8Array zu String
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;

                // Verarbeite komplette Zeilen (getrennt durch \n)
                let lines = buffer.split('\n');
                buffer = lines.pop(); // Behalte unvollständige Zeile im Buffer

                for (let line of lines) {
                    if (line.trim()) {
                        processESPData(line.trim());
                    }
                }
            }
        } catch (error) {
            console.error('Fehler beim Lesen:', error);
            if (isConnected) {
                updateConnectionStatus('error');
            }
        } finally {
            if (reader) {
                reader.releaseLock();
                reader = null;
            }
        }
    }

    // ESP Daten verarbeiten
    function processESPData(data) {
        try {
            // Erwartetes Format für zwei Potis: "poti0:1023,poti1:2048" oder JSON: {"poti0":1023,"poti1":2048}
            let poti0Value = null;
            let poti1Value = null;

            if (data.startsWith('{')) {
                // JSON Format
                const parsed = JSON.parse(data);
                poti0Value = parsed.poti0 || parsed.mirror6;
                poti1Value = parsed.poti1 || parsed.mirror7;
            } else if (data.includes(',')) {
                // Format: "poti0:1023,poti1:2048"
                const parts = data.split(',');
                parts.forEach(part => {
                    if (part.includes(':')) {
                        const [key, value] = part.split(':');
                        if (key.trim() === 'poti0') poti0Value = parseInt(value);
                        if (key.trim() === 'poti1') poti1Value = parseInt(value);
                    }
                });
            } else if (data.includes(':')) {
                // Einzelner Wert "poti0:value" oder "poti1:value"
                const parts = data.split(':');
                const key = parts[0].trim();
                const value = parseInt(parts[1]);
                if (key === 'poti0') poti0Value = value;
                if (key === 'poti1') poti1Value = value;
            }

            // Verarbeite die Werte
            if (poti0Value !== null && !isNaN(poti0Value)) {
                updateESPDisplay(poti0Value, poti1Value);
                applyESPControlToMirrors(poti0Value, poti1Value);
            } else if (poti1Value !== null && !isNaN(poti1Value)) {
                updateESPDisplay(poti0Value, poti1Value);
                applyESPControlToMirrors(poti0Value, poti1Value);
            }

        } catch (error) {
            console.error('Fehler beim Verarbeiten der ESP Daten:', error);
        }
    }

    // ESP Anzeige aktualisieren
    function updateESPDisplay(poti0Value, poti1Value) {
        let displayText = 'Roh: ';
        if (poti0Value !== null) displayText += `Poti0:${poti0Value}`;
        if (poti1Value !== null) {
            if (poti0Value !== null) displayText += ', ';
            displayText += `Poti1:${poti1Value}`;
        }
        espRawValue.textContent = displayText;

        // Zeige gemappte Winkel für beide Potis
        let mappedText = 'Winkel: ';
        if (poti0Value !== null) {
            const angle6 = mapValueToMirror6Range(poti0Value);
            mappedText += `S6:${angle6}°`;
        }
        if (poti1Value !== null) {
            if (poti0Value !== null) mappedText += ', ';
            const angle7 = mapValueToMirror7Range(poti1Value);
            mappedText += `S7:${angle7}°`;
        }
        espMappedValue.textContent = mappedText;
    }

    // ESP Steuerung auf Spiegel anwenden
    function applyESPControlToMirrors(poti0Value, poti1Value) {
        console.log(`applyESPControlToMirrors: poti0=${poti0Value}, poti1=${poti1Value}, mode=${currentControlMode}`);

        if (currentControlMode === 'manual') {
            console.log('Mode is manual, returning');
            return;
        }

        // Immer beide Spiegel direkt mit ihren entsprechenden Potis steuern
        if (poti0Value !== null && !isNaN(poti0Value)) {
            const angle6 = mapValueToMirror6Range(poti0Value);
            console.log(`Setting Mirror 6 to angle: ${angle6} (from poti0: ${poti0Value})`);
            setMirror6Angle(angle6);
        }

        if (poti1Value !== null && !isNaN(poti1Value)) {
            const angle7 = mapValueToMirror7Range(poti1Value);
            console.log(`Setting Mirror 7 to angle: ${angle7} (from poti1: ${poti1Value})`);
            setMirror7Angle(angle7);
        }
    }

    // Mapping-Funktionen für die verschiedenen Winkelbereiche
    // Eine Poti-Umdrehung = Eine Spiegel-Umdrehung (360°)
    // Invertiert für richtige Drehrichtung: Rechts drehen = Spiegel dreht rechts
    function mapValueToMirror6Range(rawValue) {
        // Arduino Wert (0-1023) invertiert auf 360°-0° mappen
        const normalizedValue = Math.max(0, Math.min(1023, rawValue));
        return Math.round(360 - (normalizedValue / 1023) * 360);
    }

    function mapValueToMirror7Range(rawValue) {
        // Arduino Wert (0-1023) invertiert auf 360°-0° mappen
        const normalizedValue = Math.max(0, Math.min(1023, rawValue));
        return Math.round(360 - (normalizedValue / 1023) * 360);
    }

    // Hilfsfunktionen um Spiegel zu setzen
    function setMirror6Angle(angle) {
        // Normalisiere Winkel auf 0-360° Bereich
        angle = ((angle % 360) + 360) % 360;
        mirror6Slider.value = angle;
        mirror6Value.textContent = `${angle}°`;
        applyMirrorAngle(document.getElementById('mirror6'), angle);
        calculateLaserPath();
    }

    function setMirror7Angle(angle) {
        // Normalisiere Winkel auf 0-360° Bereich
        angle = ((angle % 360) + 360) % 360;
        mirror7Slider.value = angle;
        mirror7Value.textContent = `${angle}°`;
        applyMirrorAngle(document.getElementById('mirror7'), angle);
        calculateLaserPath();
    }

    // ==================== EVENT LISTENERS ====================

    // Web Serial Event Listeners
    connectButton.addEventListener('click', connectToESP);
    disconnectButton.addEventListener('click', disconnectFromESP);

    controlMode.addEventListener('change', function () {
        currentControlMode = this.value;

        // Slider deaktivieren/aktivieren je nach Modus
        const isManual = currentControlMode === 'manual';
        mirror6Slider.disabled = !isManual && (currentControlMode.includes('mirror6') || currentControlMode === 'esp-both');
        mirror7Slider.disabled = !isManual && (currentControlMode.includes('mirror7') || currentControlMode === 'esp-both');
    });

    // Event-Listener für die Schieberegler
    mirror6Slider.addEventListener('input', function () {
        if (currentControlMode === 'manual' || !currentControlMode.includes('mirror6')) {
            const angle = parseInt(this.value);
            mirror6Value.textContent = `${angle}°`;
            applyMirrorAngle(document.getElementById('mirror6'), angle);
            calculateLaserPath();
        }
    });

    mirror7Slider.addEventListener('input', function () {
        if (currentControlMode === 'manual' || !currentControlMode.includes('mirror7')) {
            const angle = parseInt(this.value);
            mirror7Value.textContent = `${angle}°`;
            applyMirrorAngle(document.getElementById('mirror7'), angle);
            calculateLaserPath();
        }
    });

    // Reset-Button
    resetButton.addEventListener('click', function () {
        mirror6Slider.value = 180;
        mirror7Slider.value = 180;
        mirror6Value.textContent = '180°';
        mirror7Value.textContent = '180°';
        applyMirrorAngle(document.getElementById('mirror6'), 180);
        applyMirrorAngle(document.getElementById('mirror7'), 180);
        calculateLaserPath();
    });

    // Fenster-Resize-Behandlung
    window.addEventListener('resize', function () {
        setupMirrors();
        calculateLaserPath();
    });

    // Initialisierung
    checkWebSerialSupport();
    setupMirrors();
    calculateLaserPath();
});
