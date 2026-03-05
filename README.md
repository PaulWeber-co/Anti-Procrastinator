# Habit Tracker

Eine minimalistische Habit-Tracker Web-App im Notion-Stil mit MVC-Architektur.

## Features

- Echtzeituhr (Europe/Berlin Zeitzone)
- Wetter-Widget mit automatischer Standorterkennung via IP
- To-Do Liste mit Kategorien, Datumszuweisung und Story Points
- Interaktiver Monatskalender mit Task-Indikatoren
- Fortschritts-Diagramme (Abschlussrate + Story Points, Kategorieverteilung)
- Statistik-Karten (Gesamt, Erledigt, Offen, Rate, Punkte)
- Dark/Light Mode
- Lokale Datenspeicherung (localStorage)
- Responsive Design

## Architektur (MVC)

```
index.html          HTML-Struktur (View-Template)
css/style.css       Styling & Theming
js/model.js         Datenlogik & localStorage-Persistenz
js/view.js          DOM-Manipulation & Rendering
js/controller.js    Event-Handling & Verbindung Model/View
```

## Nutzung

```bash
open index.html
```

## Technologien

- HTML / CSS / JavaScript (kein Build-Tool)
- Chart.js (CDN)
- Inter Font (Google Fonts)
- wttr.in (Wetter-API, kein Key noetig)
- ipapi.co (IP-basierte Standorterkennung)
