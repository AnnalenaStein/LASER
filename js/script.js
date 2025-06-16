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

        // Bottom mirrors positioning (3 Spiegel unten, versetzt)
        const bottomPositions = [
            { left: containerWidth * 0.25, top: containerHeight * 0.5 },
            { left: containerWidth * 0.45, top: containerHeight * 0.5 }, // Drehbar
            { left: containerWidth * 0.65, top: containerHeight * 0.5 }  // Drehbar
        ];

        const bottomMirrors = document.querySelectorAll('.bottom-mirrors .mirror');
        bottomMirrors.forEach((mirror, index) => {
            if (index < bottomPositions.length) {
                mirror.style.left = `${bottomPositions[index].left}px`;
                mirror.style.top = `${bottomPositions[index].top}px`;
            }
        });

        // Positioniere den Laserpointer
        const laserPointer = document.getElementById('laser1');
        if (laserPointer) {
            laserPointer.style.right = '60px';
            laserPointer.style.top = '30%';
        }

        // Positioniere das Prisma
        const prism = document.getElementById('prism1');
        if (prism) {
            prism.style.left = '60px';
            prism.style.top = '70%';
        }

        // Wende die Rotationswinkel auf alle Spiegel an
        mirrors.forEach(mirror => {
            if (mirrorData[mirror.id]) {
                applyMirrorAngle(mirror, mirrorData[mirror.id].angle);
            }
        });
    }

    // Wende einen Rotationswinkel auf einen Spiegel an
    function applyMirrorAngle(mirror, angle) {
        mirror.style.transform = `rotate(${angle}deg)`;
        if (mirrorData[mirror.id]) {
            mirrorData[mirror.id].angle = angle;
        }
    }

    // Laserstrahl ausrichten auf den ersten Spiegel der oberen Reihe
    function adjustLaserBeam() {
        const laser = document.getElementById('laser1');
        const mirror1 = document.getElementById('mirror1');
        const beam = document.getElementById('beam1');

        if (laser && mirror1 && beam) {
            const laserRect = laser.getBoundingClientRect();
            const mirrorRect = mirror1.getBoundingClientRect();

            // Berechne Winkel und Distanz zwischen Laser und Spiegel
            const dx = mirrorRect.left + mirrorRect.width / 2 - (laserRect.left + 15);
            const dy = mirrorRect.top + mirrorRect.height / 2 - (laserRect.top + 30);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Setze Länge und Winkel des Laserstrahls
            beam.style.height = `${distance}px`;
            beam.style.transform = `rotate(${angle}deg)`;
            beam.style.top = `${laserRect.top + 30 - window.scrollY}px`;
            beam.style.right = `${window.innerWidth - laserRect.left - 15}px`;
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

        // Initiale Richtung des Lasers (nach links)
        let direction = { x: -1, y: 0 };

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
                // Zeichne ein letztes Segment bis zum Rand
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

    // Event-Listener für die Schieberegler
    mirror6Slider.addEventListener('input', function () {
        const angle = parseInt(this.value);
        mirror6Value.textContent = `${angle}°`;
        applyMirrorAngle(document.getElementById('mirror6'), angle);
        calculateLaserPath();
    });

    mirror7Slider.addEventListener('input', function () {
        const angle = parseInt(this.value);
        mirror7Value.textContent = `${angle}°`;
        applyMirrorAngle(document.getElementById('mirror7'), angle);
        calculateLaserPath();
    });

    // Reset-Button
    resetButton.addEventListener('click', function () {
        mirror6Slider.value = -135;
        mirror7Slider.value = -45;
        mirror6Value.textContent = '-135°';
        mirror7Value.textContent = '-45°';
        applyMirrorAngle(document.getElementById('mirror6'), -135);
        applyMirrorAngle(document.getElementById('mirror7'), -45);
        calculateLaserPath();
    });

    // Fenster-Resize-Behandlung
    window.addEventListener('resize', function () {
        setupMirrors();
        calculateLaserPath();
    });

    // Initialisierung
    setupMirrors();
    calculateLaserPath();
});