# Anti Procrastinator

Minimalistischer Produktivitäts-Hub als Chrome Extension oder Webseite. Notion-inspiriertes Design mit MVC-Architektur.

## Features

- Echtzeituhr mit Datum (Europe/Berlin)
- Wetter-Widget (Open-Meteo API, kein API-Key nötig)
- To-Do Liste mit Kategorien, Kalender-Anbindung und Story Points
- Interaktiver Monatskalender (erweiterbar, ICS-Import)
- Fortschritts-Diagramme (Woche / Monat / Jahr + Kategorieverteilung)
- **Planer** mit 3 Modi:
  - **Schule** — Klassen 5–13, klassenspezifische Fächer, Notentypen (Schulaufgaben, Exen, Mündlich) mit korrekter Gewichtung
  - **Universität** — Frei konfigurierbare Semester, Module, ECTS, Noten
  - **Provadis** — Informatik B.Sc. mit allen Modulen vorausgefüllt
- Dark/Light Mode (Nothing Dot Design)
- Persistente Datenspeicherung (localStorage / chrome.storage)

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
index.html          HTML-Struktur
css/style.css       Styling & Theming (Nothing Dot Design)
js/storage.js       Speicher-Abstraktionsschicht
js/model.js         Datenlogik & Persistenz
js/view.js          DOM-Rendering
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
- Chart.js (lokal eingebunden)
- Space Grotesk + Space Mono (Google Fonts)
- Open-Meteo (Wetter-API, kein Key nötig)
