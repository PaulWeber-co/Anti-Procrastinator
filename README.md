# Anti Procrastinator

Minimalistischer Produktivitäts-Hub als Chrome Extension oder Webseite. Nothing Phone Dot-Matrix Design mit MVC-Architektur.

## Features

- **Echtzeituhr** mit Datum (Europe/Berlin) — umschaltbar zwischen Digital und Analog (Dot-Matrix Canvas)
- **Wetter-Widget** mit 7-Tage-Vorhersage (Open-Meteo API, kein API-Key nötig) — Light & Dark Mode
- **To-Do Liste** mit Kategorien und Kalender-Anbindung
- **Interaktiver Monatskalender** (erweiterbar, ICS-Import)
- **Pomodoro-Timer** — 25/5 Fokus-Sessions mit Dot-Ring-Fortschritt, Session-Tracking und Benachrichtigungen
- **Tägliches Motivations-Zitat** — rotierender Impuls für Produktivität
- **Fortschritts-Diagramme** (Woche / Monat / Jahr + Kategorieverteilung) — Dot-Matrix Canvas Charts
- **Planer** mit 3 Modi:
  - **Schule** — Klassen 5–13, klassenspezifische Fächer, Notentypen mit korrekter Gewichtung
  - **Universität** — Frei konfigurierbare Semester, Module, ECTS, Noten
  - **Provadis** — Informatik B.Sc. mit allen Modulen vorausgefüllt
- **Dark/Light Mode** (Nothing Dot Design) — alle Widgets theme-aware
- Persistente Datenspeicherung (localStorage / chrome.storage)
- Festes Grid-Layout — keine beweglichen Elemente, alles an der richtigen Stelle

## Schnellstart

### Als Webseite

```bash
cd NotionTemplate
python3 -m http.server 8080
# Öffne http://localhost:8080
```

Oder einfach `index.html` im Browser öffnen.

### Als Chrome Extension

1. Chrome → `chrome://extensions/`
2. **Entwicklermodus** aktivieren (oben rechts)
3. **Entpackte Erweiterung laden** → `NotionTemplate`-Ordner auswählen
4. Fertig! Jeder neue Tab zeigt Anti Procrastinator

> Die Icons sind bereits enthalten — kein zusätzlicher Setup nötig.

### Als Firefox Extension

1. Firefox → `about:debugging#/runtime/this-firefox`
2. **Temporäres Add-on laden** → `manifest.json` auswählen

### Als Edge Extension

1. Edge → `edge://extensions/`
2. **Entwicklermodus** → **Entpackte Erweiterung laden** → Ordner auswählen

## Architektur (MVC)

```
index.html          HTML-Struktur (Widget-basiertes Layout)
css/style.css       Styling & Theming (Nothing Design, abgerundete Ecken, Schatten)
js/storage.js       Speicher-Abstraktionsschicht
js/model.js         Datenlogik & Persistenz
js/view.js          DOM-Rendering
js/widgets.js       Draggable Widget-System & Layout-Persistenz
js/controller.js    Event-Handling & Steuerung
js/init.js          App-Start
```

## Datenspeicherung

| Modus | Speicherort | Persistent? |
|-------|-------------|-------------|
| Webseite | `localStorage` | Ja (bis Cache gelöscht) |
| Chrome Extension | `chrome.storage.local` | Ja (überlebt Cache-Clear) |

## Technologien

- HTML / CSS / Vanilla JavaScript (kein Build-Tool)
- Custom Dot-Matrix Canvas Charts (kein Chart.js)
- Space Grotesk + Space Mono (Google Fonts)
- Open-Meteo (Wetter-API, kein Key nötig)
