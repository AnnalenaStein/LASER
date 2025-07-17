document.addEventListener('DOMContentLoaded', function () {

    // Finde alle nötigen Elemente
    const mirrors = document.querySelectorAll('.mirror');
    const laser = document.getElementById('laser1');
    const prism = document.getElementById('prism1');
    const beamsContainer = document.getElementById('beams-container');

    // Tutorial-Status Variablen
    let tutorialStep = 0;
    let laserEnabled = true;
    let tutorialActive = false;
    let mirror6Correct = false;
    let mirror7Correct = false;


    // Test-Klick um Tutorial zu starten (ohne ProtoPie)
    document.addEventListener('click', function (event) {
        if (!tutorialActive && tutorialStep === 0) {
            console.log('[Test] Klick erkannt - Tutorial startet');
            startTutorial();
        }
    });

    // document.addEventListener('keydown', function (event) {
    //     if (event.key === 'q' || event.key === 'a') {
    //         rotateMirror('mirror6', event.key === 'q' ? +1 : -1);
    //         checkMirror6Alignment(); // ✅ prüft nach jeder Drehung
    //     }
    // });


    // Tutorial starten
    function startTutorial() {
        console.log('[DEBUG] startTutorial() wird ausgeführt');
        console.log('[DEBUG] tutorialActive:', tutorialActive, 'tutorialStep:', tutorialStep);

        tutorialActive = true;
        tutorialStep = 0;

        const overlay = document.getElementById('start-overlay');
        if (overlay) {
            overlay.style.visibility = 'hidden';
            console.log('[DEBUG] Overlay versteckt');
        }

        showStep1(); // <<<<<<<<<<<<<< direkt testen
    }



    // Schritt 1: Erklärungstext
    function showStep1() {
        tutorialStep = 1;
        console.log('[DEBUG] showStep1() aufgerufen');

        showTutorialText(
            `Laserlicht wird im gleichen Winkel reflektiert:<br>
            <strong>Einfallswinkel = Ausfallswinkel</strong>`,
            4000,
            showStep2,
            'top-right'
        );
    }


    // Schritt 2: Erste Spiegelanweisung
    function showStep2() {
        tutorialStep = 2;
        showTutorialText(
            'Stelle den Spiegel so ein, dass der Laser zum nächsten Spiegel trifft.',
            3000,
            showStep3,
            'top-right'
        );
    }

    // Schritt 3: Spotlight auf rechten Spiegel (keine Pfeile mehr)
    function showStep3() {
        tutorialStep = 3;
        laserEnabled = true;
        if (laser) laser.style.opacity = '1';
        calculateLaserPath();

        // Spotlight auf Mirror6 (rechten bewegbaren Spiegel)
        createSpotlight('mirror6');

        // Text rechts vom Spiegel
        showMirrorText(
            'Drehe diesen Spiegel',
            3000,
            'mirror6'
        );
    }

    // Schritt 4: Laser-Erklärung (wird ausgelöst wenn Mirror6 bewegt wird)
    function showStep4() {
        if (tutorialStep !== 3) return;
        tutorialStep = 4;

        showTutorialText(
            'Bei einem Laser haben alle Lichtteilchen dieselbe Farbe, Richtung und Schwingung.<br><br>Das macht den Strahl stark und präzise.',
            4000,
            showStep5,
            'top-right'
        );
    }

    // Schritt 5: Zusatzinfo
    function showStep5() {
        tutorialStep = 5;
        showTutorialText(
            'So stark, dass er Metall schneiden oder Daten durch Glasfasern senden kann.',
            3000,
            null,
            'top-right'
        );
    }

    // Schritt 6: Zweiter Spiegel (wird ausgelöst wenn Mirror6 korrekt)
    function showStep6() {
        tutorialStep = 6;

        // Entferne Spotlight von Mirror6
        removeSpotlight('mirror6');

        // Spotlight auf Mirror7 (linken bewegbaren Spiegel)
        createSpotlight('mirror7');

        // Text rechts vom Spiegel
        showMirrorText(
            'Lenke den Strahl auf das Prisma',
            3000,
            'mirror7'
        );
    }

    // Schritt 7: Erfolg
    function showStep7() {
        tutorialStep = 7;

        // Entferne alle Spotlights
        removeSpotlight('mirror7');

        showTutorialText(
            'Super!',
            2000,
            completeTutorial,
            'top-right'
        );
    }

    // Tutorial beenden
    function completeTutorial() {
        tutorialActive = false;
        console.log('[Tutorial] Abgeschlossen!');
    }

    // Allgemeine Funktion für Tutorial-Texte
    function showTutorialText(text, duration, callback, position = 'top-right') {
        // Entferne vorhandene Texte
        const existingTexts = document.querySelectorAll('.tutorial-text');
        existingTexts.forEach(text => text.remove());

        // Erstelle Text-Element
        const textElement = document.createElement('div');
        textElement.className = 'tutorial-text';
        textElement.innerHTML = text;

        // Styling für den Text - HALBE GRÖßE mit Noway-Medium
        textElement.style.position = 'fixed';
        textElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        textElement.style.color = '#fff';
        textElement.style.padding = '8px 12px';
        textElement.style.borderRadius = '4px';
        textElement.style.fontSize = '12px'; // Geändert von '9px' auf '12px'
        textElement.style.fontFamily = "'Noway-Medium', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        textElement.style.fontWeight = 'normal';
        textElement.style.textAlign = 'left';
        textElement.style.lineHeight = '1.3';
        textElement.style.maxWidth = '150px';
        textElement.style.zIndex = '2000';
        textElement.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
        textElement.style.animation = 'fadeInText 0.5s ease-in';

        // Positionierung je nach Parameter
        if (position === 'top-right') {
            textElement.style.top = '10px'; // Reduziert von 20px
            textElement.style.right = '10px'; // Reduziert von 20px
        } else if (position === 'mirror-right') {
            // Position wird dynamisch gesetzt
        }

        // Füge Text zum DOM hinzu
        document.body.appendChild(textElement);

        // Entferne Text nach angegebener Zeit und rufe Callback auf
        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.style.animation = 'fadeOutText 0.5s ease-out';
                setTimeout(() => {
                    textElement.remove();
                    if (callback) callback();
                }, 500);
            }
        }, duration);

        return textElement;
    }

    // Spezielle Funktion für Spiegel-bezogene Texte
    function showMirrorText(text, duration, mirrorId, callback) {
        const mirror = document.getElementById(mirrorId);
        if (!mirror) return;

        const textElement = showTutorialText(text, duration, callback, 'mirror-right');

        // Positioniere rechts vom Spiegel - mit reduziertem Abstand
        const mirrorRect = mirror.getBoundingClientRect();
        textElement.style.left = `${mirrorRect.right + 15}px`; // Reduziert von 30px
        textElement.style.top = `${mirrorRect.top - 5}px`; // Reduziert von -10px
    }

    // Spotlight erstellen - KLEINERES Design
    function createSpotlight(mirrorId) {
        const mirror = document.getElementById(mirrorId);
        if (!mirror) return;

        // Entferne vorhandene Spotlights
        const existingSpotlights = document.querySelectorAll('.spotlight');
        existingSpotlights.forEach(spot => spot.remove());

        const spotlight = document.createElement('div');
        spotlight.className = 'spotlight';
        spotlight.style.position = 'absolute';
        spotlight.style.width = '120px';
        spotlight.style.height = '120px';
        spotlight.style.borderRadius = '50%';

        // HELLERES weißes Licht - Intensität erhöht
        spotlight.style.background = `
            radial-gradient(circle, 
                rgba(255, 255, 255, 0.7) 0%,    /* Erhöht von 0.4 auf 0.7 */
                rgba(255, 255, 255, 0.5) 40%,   /* Erhöht von 0.2 auf 0.5 */
                rgba(255, 255, 255, 0.3) 60%,   /* Erhöht von 0.1 auf 0.3 */
                rgba(255, 255, 255, 0.15) 80%,  /* Erhöht von 0.05 auf 0.15 */
                transparent 100%
            )
        `;

        spotlight.style.border = '2px solid rgba(255, 255, 255, 0.6)'; /* Erhöht von 1px/0.3 auf 2px/0.6 */
        spotlight.style.boxShadow = `
            0 0 40px rgba(255, 255, 255, 0.8),    /* Erhöht von 20px/0.4 auf 40px/0.8 */
            inset 0 0 30px rgba(255, 255, 255, 0.4) /* Erhöht von 15px/0.1 auf 30px/0.4 */
        `;
        spotlight.style.zIndex = '100';
        spotlight.style.animation = 'flashlightPulse 2s ease-in-out infinite';
        spotlight.style.pointerEvents = 'none';
        spotlight.style.filter = 'brightness(1.3)'; /* Zusätzliche Helligkeit */

        // Positioniere den Spotlight über dem Spiegel
        const mirrorRect = mirror.getBoundingClientRect();
        const spotlightSize = 120;

        spotlight.style.left = `${mirrorRect.left + mirrorRect.width / 2 - spotlightSize / 2}px`;
        spotlight.style.top = `${mirrorRect.top + mirrorRect.height / 2 - spotlightSize / 2}px`;

        document.body.appendChild(spotlight);
    }

    function removeSpotlight(mirrorId) {
        const mirror = document.getElementById(mirrorId);
        if (!mirror) return;

        // Finde Spotlight in Nähe des Spiegels (basierend auf Position)
        const spotlights = document.querySelectorAll('.spotlight');
        spotlights.forEach(spotlight => {
            const rect = spotlight.getBoundingClientRect();
            const mirrorRect = mirror.getBoundingClientRect();

            const dx = rect.left - mirrorRect.left;
            const dy = rect.top - mirrorRect.top;

            // Wenn Spotlight ungefähr über dem Spiegel liegt – löschen
            if (Math.abs(dx) < 150 && Math.abs(dy) < 150) {
                spotlight.remove();
            }
        });
    }


    // Schritt 4: Laser-Erklärung (wird ausgelöst wenn Mirror6 bewegt wird)
    function showStep4() {
        if (tutorialStep !== 3) return;
        tutorialStep = 4;

        showTutorialText(
            'Bei einem Laser haben alle Lichtteilchen dieselbe Farbe, Richtung und Schwingung.<br><br>Das macht den Strahl stark und präzise.',
            4000,
            showStep5,
            'top-right'
        );
    }

    // Schritt 5: Zusatzinfo
    function showStep5() {
        tutorialStep = 5;
        showTutorialText(
            'So stark, dass er Metall schneiden oder Daten durch Glasfasern senden kann.',
            3000,
            null,
            'top-right'
        );
    }

    // Schritt 6: Zweiter Spiegel (wird ausgelöst wenn Mirror6 korrekt)
    function showStep6() {
        tutorialStep = 6;

        // Entferne Spotlight von Mirror6
        removeSpotlight('mirror6');

        // Spotlight auf Mirror7 (linken bewegbaren Spiegel)
        createSpotlight('mirror7');

        // Text rechts vom Spiegel
        showMirrorText(
            'Lenke den Strahl auf das Prisma',
            3000,
            'mirror7'
        );
    }

    // Schritt 7: Erfolg
    function showStep7() {
        tutorialStep = 7;

        // Entferne alle Spotlights
        removeSpotlight('mirror7');

        showTutorialText(
            'Super!',
            2000,
            completeTutorial,
            'top-right'
        );
    }

    // Tutorial beenden
    function completeTutorial() {
        tutorialActive = false;
        console.log('[Tutorial] Abgeschlossen!');
    }

    // Allgemeine Funktion für Tutorial-Texte
    function showTutorialText(text, duration, callback, position = 'top-right') {
        // Entferne vorhandene Texte
        const existingTexts = document.querySelectorAll('.tutorial-text');
        existingTexts.forEach(text => text.remove());

        // Erstelle Text-Element
        const textElement = document.createElement('div');
        textElement.className = 'tutorial-text';
        textElement.innerHTML = text;

        // Styling für den Text - HALBE GRÖßE mit Noway-Medium
        textElement.style.position = 'fixed';
        textElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        textElement.style.color = '#fff';
        textElement.style.padding = '8px 12px';
        textElement.style.borderRadius = '4px';
        textElement.style.fontSize = '12px'; // Geändert von '9px' auf '12px'
        textElement.style.fontFamily = "'Noway-Medium', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        textElement.style.fontWeight = 'normal';
        textElement.style.textAlign = 'left';
        textElement.style.lineHeight = '1.3';
        textElement.style.maxWidth = '150px';
        textElement.style.zIndex = '2000';
        textElement.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
        textElement.style.animation = 'fadeInText 0.5s ease-in';

        // Positionierung je nach Parameter
        if (position === 'top-right') {
            textElement.style.top = '10px'; // Reduziert von 20px
            textElement.style.right = '10px'; // Reduziert von 20px
        } else if (position === 'mirror-right') {
            // Position wird dynamisch gesetzt
        }

        // Füge Text zum DOM hinzu
        document.body.appendChild(textElement);

        // Entferne Text nach angegebener Zeit und rufe Callback auf
        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.style.animation = 'fadeOutText 0.5s ease-out';
                setTimeout(() => {
                    textElement.remove();
                    if (callback) callback();
                }, 500);
            }
        }, duration);

        return textElement;
    }

    // Spezielle Funktion für Spiegel-bezogene Texte
    function showMirrorText(text, duration, mirrorId, callback) {
        const mirror = document.getElementById(mirrorId);
        if (!mirror) return;

        const textElement = showTutorialText(text, duration, callback, 'mirror-right');

        // Positioniere rechts vom Spiegel - mit reduziertem Abstand
        const mirrorRect = mirror.getBoundingClientRect();
        textElement.style.left = `${mirrorRect.right + 15}px`; // Reduziert von 30px
        textElement.style.top = `${mirrorRect.top - 5}px`; // Reduziert von -10px
    }

    // Spotlight erstellen - KLEINERES Design
    function createSpotlight(mirrorId) {
        const mirror = document.getElementById(mirrorId);
        if (!mirror) return;

        // Entferne vorhandene Spotlights
        const existingSpotlights = document.querySelectorAll('.spotlight');
        existingSpotlights.forEach(spot => spot.remove());

        const spotlight = document.createElement('div');
        spotlight.className = 'spotlight';
        spotlight.style.position = 'absolute';
        spotlight.style.width = '120px';
        spotlight.style.height = '120px';
        spotlight.style.borderRadius = '50%';

        // HELLERES weißes Licht - Intensität erhöht
        spotlight.style.background = `
            radial-gradient(circle, 
                rgba(255, 255, 255, 0.7) 0%,    /* Erhöht von 0.4 auf 0.7 */
                rgba(255, 255, 255, 0.5) 40%,   /* Erhöht von 0.2 auf 0.5 */
                rgba(255, 255, 255, 0.3) 60%,   /* Erhöht von 0.1 auf 0.3 */
                rgba(255, 255, 255, 0.15) 80%,  /* Erhöht von 0.05 auf 0.15 */
                transparent 100%
            )
        `;

        spotlight.style.border = '2px solid rgba(255, 255, 255, 0.6)'; /* Erhöht von 1px/0.3 auf 2px/0.6 */
        spotlight.style.boxShadow = `
            0 0 40px rgba(255, 255, 255, 0.8),    /* Erhöht von 20px/0.4 auf 40px/0.8 */
            inset 0 0 30px rgba(255, 255, 255, 0.4) /* Erhöht von 15px/0.1 auf 30px/0.4 */
        `;
        spotlight.style.zIndex = '100';
        spotlight.style.animation = 'flashlightPulse 2s ease-in-out infinite';
        spotlight.style.pointerEvents = 'none';
        spotlight.style.filter = 'brightness(1.3)'; /* Zusätzliche Helligkeit */

        // Positioniere den Spotlight über dem Spiegel
        const mirrorRect = mirror.getBoundingClientRect();
        const spotlightSize = 120;

        spotlight.style.left = `${mirrorRect.left + mirrorRect.width / 2 - spotlightSize / 2}px`;
        spotlight.style.top = `${mirrorRect.top + mirrorRect.height / 2 - spotlightSize / 2}px`;

        document.body.appendChild(spotlight);
    }

    // Rotationspfeile erstellen - ENTFERNT
    function createRotationArrows(mirrorId) {
        // Pfeile sind nicht mehr gewünscht - Funktion leer lassen
        // aber nicht löschen, da sie noch aufgerufen wird
    }

    // Rotationspfeile entfernen
    function removeRotationArrows() {
        // Pfeile sind nicht mehr vorhanden - Funktion leer lassen
    }

    // Web Serial Variablen
    let port = null;
    let reader = null;
    let isConnected = false;
    let currentControlMode = 'esp-both'; // Automatisch auf ESP-Steuerung für beide Spiegel setzen

    // Virtuelle Werte für die Spiegelwinkel (da keine UI-Elemente mehr vorhanden)
    let mirror6Angle = 180;
    let mirror7Angle = 180;

    let mirror6Aligned = false;
    let mirror7Aligned = false;

    let MIRROR_SIGNAL_TOLERANCE = 2;


    // Socket.IO mit Fehlerbehandlung
    let socket;
    try {
        socket = io('http://localhost:9981', {
            timeout: 2000,
            autoConnect: false
        });

        socket.on('connect', () => {
            console.log('✅ Socket.IO verbunden');
        });

        socket.on('connect_error', (error) => {
            console.log('❌ Socket.IO nicht verfügbar - verwende Fallback-Modus');
        });

        socket.on('ppMessage', (data) => {
            console.log('[Socket.IO] Nachricht empfangen:', data);

            if (!data || typeof data !== 'object') return;

            const { messageId } = data;
            console.log('[Socket.IO] messageId:', messageId);

            if (messageId === "show") {
                const startOverlay = document.getElementById('start-overlay');
                if (startOverlay) startOverlay.style.visibility = 'hidden';

                if (!tutorialActive && tutorialStep === 0) {
                    console.log('[Socket] Starte Tutorial durch show');
                    startTutorial();
                }
            }

            else if (messageId === "hide") {
                const startOverlay = document.getElementById('start-overlay');
                if (startOverlay) startOverlay.style.visibility = 'visible';
            }
        });

        // Versuche zu verbinden
        socket.connect();
    } catch (error) {
        console.log('Socket.IO nicht verfügbar - Fallback-Modus aktiv');
        // Erstelle dummy socket
        socket = {
            emit: (event, data) => console.log(`[Fallback] Socket emit: ${event}`, data),
            on: () => { },
            connect: () => { },
            disconnect: () => { }
        };
    }

    socket.on('protopie', function (data) {
        console.log('[Socket.io] Nachricht empfangen:', data);

        if (data && data.type === 'protopie') {
            if (data.action === 'show') {
                console.log('[ProtoPie] show empfangen - Tutorial startet (erzwungen)');
                tutorialActive = false;
                tutorialStep = 0;
                startTutorial();
            }

            if (data.action === 'hide') {
                console.log('[ProtoPie] hide empfangen - Laser wird eingeschaltet');
                laserEnabled = true;
                if (laser) {
                    laser.style.opacity = '1';
                }
                calculateLaserPath();
            }
        }
    });


    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) startOverlay.style.visibility = 'visible'; // Schwarzbild bleibt oben

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

    // TEST-FUNKTIONALITÄT: Tastatur-Steuerung für Tests ohne Hardware
    window.addEventListener('keydown', function (event) {
        // Nur im Test-Modus (wenn Tutorial nicht aktiv ist)
        if (tutorialActive) {
            switch (event.key.toLowerCase()) {
                case 'l':
                    console.log('🔦 [TEST] Laser manuell eingeschaltet');
                    laserEnabled = true;
                    if (laser) laser.style.opacity = '1';
                    calculateLaserPath();
                    break;
                case 'q':
                    mirror6Angle = (mirror6Angle + 5) % 360;
                    setMirror6Angle(mirror6Angle);
                    console.log(`🔄 [TEST] Mirror6: ${mirror6Angle}°`);
                    break;
                case 'a':
                    mirror6Angle = (mirror6Angle - 5 + 360) % 360;
                    setMirror6Angle(mirror6Angle);
                    console.log(`🔄 [TEST] Mirror6: ${mirror6Angle}°`);
                    break;
                case 'w':
                    mirror7Angle = (mirror7Angle + 5) % 360;
                    setMirror7Angle(mirror7Angle);
                    console.log(`🔄 [TEST] Mirror7: ${mirror7Angle}°`);
                    break;
                case 's':
                    mirror7Angle = (mirror7Angle - 5 + 360) % 360;
                    setMirror7Angle(mirror7Angle);
                    console.log(`🔄 [TEST] Mirror7: ${mirror7Angle}°`);
                    break;
                case 't':
                    console.log('🎯 [TEST] Tutorial manuell gestartet');
                    startTutorial();
                    break;
            }
        }
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

        // Bottom mirrors positioning - linker Spiegel um halbe Spiegellänge nach rechts verschoben
        const bottomPositions = [
            { left: containerWidth * 0.30, top: containerHeight * 0.18 }, // Mirror 5 (nicht drehbar, links)
            { left: containerWidth * 0.49, top: containerHeight * 0.18 }, // Mirror 6 (drehbar, mitte)
            { left: containerWidth * 0.125, top: containerHeight * 0.18 }  // Mirror 7 (drehbar) - ein bisschen mehr nach rechts (von 0.13 auf 0.15)
        ];

        const bottomMirrors = document.querySelectorAll('.bottom-mirrors .mirror');
        bottomMirrors.forEach((mirror, index) => {
            if (index < bottomPositions.length) {
                mirror.style.left = `${bottomPositions[index].left}px`;
                mirror.style.top = `${bottomPositions[index].top}px`;
            }
        });

        // Positioniere den Laserpointer und setze initial auf ausgeschaltet
        const laserPointer = document.getElementById('laser1');
        if (laserPointer) {
            // Zurück zur ursprünglichen Position auf der rechten Seite
            laserPointer.style.right = '60px';
            laserPointer.style.top = '50vh'; // Zwischen den Spiegelreihen
            laserPointer.style.transform = `translate(0, -50%)`;

            // Laser initial ausgeschaltet (transparent)
            laserPointer.style.opacity = laserEnabled ? '1' : '0.3';

            // Anpassung des Winkels, um den Laser auf den rechten oberen Spiegel zu richten
            const verticalOffset = containerHeight * 0.14 - topPositions[3].top;
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
        mirrorData['mirror4'].angle = 172; // Angepasster Winkel für Spiegel 4

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

        if (mirror.dataset) {
            mirror.dataset.angle = angle.toString();
        }

        if (mirrorData[mirror.id]) {
            mirrorData[mirror.id].angle = angle;
        }
    }

    // Calculate and draw laser path - nur wenn Laser eingeschaltet ist
    function calculateLaserPath() {
        // Entferne vorhandene Laserstrahlen
        while (beamsContainer.firstChild) {
            beamsContainer.removeChild(beamsContainer.firstChild);
        }

        // Wenn Laser ausgeschaltet ist, keine Strahlen zeichnen
        if (!laserEnabled) {
            return;
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
        const maxSegments = 20;
        let segmentCount = 0;

        while (!pathComplete && segmentCount < maxSegments) {
            let nextIntersection = findNextIntersection(start, direction);

            if (nextIntersection) {
                drawLaserSegment(start, nextIntersection.point);

                if (nextIntersection.type === 'prism') {
                    pathComplete = true;
                    // Prisma getroffen - Tutorial-Schritt 7 auslösen
                    if (tutorialStep >= 6) {
                        showStep7();

                        // ✅ NEU: Signal an ProtoPie senden
                        if (socket && socket.connected) {
                            socket.emit('ppMessage', {
                                messageId: 'mirror7Aligned',
                                fromName: 'Laser Tutorial',
                                timestamp: Date.now()
                            });
                            console.log('✅ Signal "mirror7Aligned" an ProtoPie gesendet');
                        }
                    }
                    // Erfolgreich-Animation für das Prisma
                    prism.style.boxShadow = '0 0 20px 10px rgba(255, 100, 100, 1)';
                    setTimeout(() => {
                        prism.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
                    }, 1000);
                } else {
                    direction = reflectDirection(direction, nextIntersection.angle);
                    start = nextIntersection.point;
                }
            } else {
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

    // Prüfe ob Web Serial API verfügbar ist und starte automatische Verbindung
    function checkWebSerialSupport() {
        if (!('serial' in navigator)) {
            console.log('Web Serial API wird von diesem Browser nicht unterstützt.');
            return false;
        }
        // Starte automatische Verbindung nach kurzer Verzögerung
        setTimeout(autoConnectToESP, 1000);
        return true;
    }

    // Automatische ESP Verbindung ohne Benutzerinteraktion
    async function autoConnectToESP() {
        try {
            // Versuche, zuvor verwendete Ports zu finden
            const ports = await navigator.serial.getPorts();

            if (ports.length > 0) {
                // Verwende den ersten verfügbaren Port
                port = ports[0];
                await port.open({ baudRate: 115200 });
                isConnected = true;
                console.log('Automatisch mit ESP verbunden');
                startReading();
            } else {
                console.log('Kein zuvor verwendeter Port gefunden.');
                // Nicht mehr automatisch nach Port fragen
            }
        } catch (error) {
            console.log('ESP-Verbindung fehlgeschlagen - Test-Modus verfügbar');
            // Weniger aggressiv versuchen
            setTimeout(autoConnectToESP, 15000);
        }
    }

    // Port-Verbindung anfordern (falls nötig)
    async function requestPortConnection() {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            isConnected = true;
            console.log('ESP erfolgreich verbunden');
            startReading();
        } catch (error) {
            console.error('Verbindung fehlgeschlagen:', error);
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
            isConnected = false;
            // Versuche Wiederverbindung nach 3 Sekunden
            setTimeout(autoConnectToESP, 3000);
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

            // Verarbeite die Werte - ESP Steuerung ist immer aktiv
            if (poti0Value !== null && !isNaN(poti0Value)) {
                applyESPControlToMirrors(poti0Value, poti1Value);
            } else if (poti1Value !== null && !isNaN(poti1Value)) {
                applyESPControlToMirrors(poti0Value, poti1Value);
            }

        } catch (error) {
            console.error('Fehler beim Verarbeiten der ESP Daten:', error);
        }
    }

    // ESP Steuerung auf Spiegel anwenden
    function applyESPControlToMirrors(poti0Value, poti1Value) {
        // Potentiometer-Zuweisung getauscht:
        // Poti1 steuert Mirror6, Poti0 steuert Mirror7

        if (poti1Value !== null && !isNaN(poti1Value)) {
            const angle6 = mapValueToMirror6Range(poti1Value); // jetzt von Poti1
            setMirror6Angle(angle6);
        }

        if (poti0Value !== null && !isNaN(poti0Value)) {
            const angle7 = mapValueToMirror7Range(poti0Value); // jetzt von Poti0
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

    //hilfsfunktion für protopie
    function sendSignalToProtoPie(signalName) {
        window.postMessage(
            {
                type: 'protopie',
                action: 'send',
                name: signalName
            },
            '*'
        );

        // Socket.IO Nachricht senden (mit Fallback)
        if (socket && socket.emit) {
            socket.emit("ppMessage", {
                messageId: signalName,
                fromName: "web app",
                timestamp: Date.now(),
            });
        }
    }

    // Hilfsfunktionen um Spiegel zu setzen
    function setMirror6Angle(angle) {
        angle = ((angle % 360) + 360) % 360;
        mirror6Angle = angle;
        applyMirrorAngle(document.getElementById('mirror6'), angle);

        // Tutorial-Schritt 4 auslösen (Laser-Erklärung)
        if (tutorialStep === 3) {
            showStep4();
        }

        // Nur berechnen wenn Laser eingeschaltet ist
        if (laserEnabled) {
            calculateLaserPath();
        }

        // Prüfe ob Spiegel korrekt eingestellt (um 180°)
        if (Math.abs(angle - 180) <= 5 && !mirror6Correct) {
            mirror6Correct = true;
            console.log('[Mirror6] Korrekt eingestellt!');

            // Tutorial-Schritt 6 auslösen (zweiter Spiegel)
            if (tutorialStep >= 4) {
                showStep6();
            }

            checkMirror6Alignment();

        } else if (Math.abs(angle - 180) > 5) {
            mirror6Correct = false;
        }
    }

    function checkMirror6Alignment() {
        const mirror6 = document.getElementById('mirror6');
        if (!mirror6) return;

        const angle = parseInt(mirror6.dataset.angle);
        if (angle === 180) {
            console.log('✅ Mirror6 korrekt ausgerichtet');

            if (socket && socket.connected) {
                socket.emit('ppMessage', {
                    messageId: 'mirror6Aligned',
                    fromName: 'Laser Tutorial',
                    timestamp: Date.now()
                });
            }
        }
    }


    function setMirror7Angle(angle) {
        angle = ((angle % 360) + 360) % 360;
        mirror7Angle = angle;
        applyMirrorAngle(document.getElementById('mirror7'), angle);

        // Nur berechnen wenn Laser eingeschaltet ist
        if (laserEnabled) {
            calculateLaserPath();
        }

        // Prüfe ob Spiegel korrekt eingestellt
        if (Math.abs(angle - 180) <= 5 && !mirror7Correct) {
            mirror7Correct = true;
            console.log('[Mirror7] Korrekt eingestellt!');
            checkMirror7Alignment();
        } else if (Math.abs(angle - 180) > 5) {
            mirror7Correct = false;
        }
    }

    function checkMirror7Alignment() {
        const mirror7 = document.getElementById('mirror7');
        if (!mirror7) return;

        const angle = parseInt(mirror7.dataset.angle);
        if (angle === 180) {
            console.log('✅ Mirror7 korrekt ausgerichtet');

            if (socket && socket.connected) {
                socket.emit('ppMessage', {
                    messageId: 'mirror7Aligned',
                    fromName: 'Laser Tutorial',
                    timestamp: Date.now()
                });
            }
        }
    }

    // Fenster-Resize-Behandlung
    window.addEventListener('resize', function () {
        setupMirrors();
    });

    // Initialisierung - Laser bleibt ausgeschaltet
    checkWebSerialSupport();
    setupMirrors();

    // Zeige Testbefehle in der Konsole
    console.log(`
    🎮 TEST-BEFEHLE (nur ohne Tutorial aktiv):
    • T = Tutorial starten
    • L = Laser einschalten
    • Q/A = Mirror6 drehen (+/-)
    • W/S = Mirror7 drehen (+/-)
    • Klick = Tutorial starten (wenn inaktiv)
    `);
});
