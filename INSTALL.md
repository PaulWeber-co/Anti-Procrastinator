# Anti Procrastinator — Installation

## Als Webseite (einfachste Variante)

```bash
cd NotionTemplate
python3 -m http.server 8080
# Öffne http://localhost:8080
```

Alternativ: `index.html` direkt im Browser öffnen.

---

## Als Chrome Extension (New Tab Page)

1. Öffne Chrome → `chrome://extensions/`
2. Aktiviere oben rechts **Entwicklermodus**
3. Klicke **Entpackte Erweiterung laden**
4. Wähle den `NotionTemplate`-Ordner
5. Fertig! Jeder neue Tab zeigt jetzt Anti Procrastinator

> **Keine Icons generieren nötig** — die Icons sind bereits im Repository enthalten.

### Optional: Als Startseite setzen

1. Chrome → Einstellungen → Beim Start
2. Wähle **Bestimmte Seite oder Seiten öffnen**
3. Füge `chrome-extension://DEINE-EXTENSION-ID/index.html` ein
   (Die ID findest du unter `chrome://extensions/`)

---

## Als Firefox Extension

1. Öffne Firefox → `about:debugging#/runtime/this-firefox`
2. Klicke **Temporäres Add-on laden...**
3. Wähle die `manifest.json` im `NotionTemplate`-Ordner

---

## Als Edge Extension

1. Öffne Edge → `edge://extensions/`
2. Aktiviere **Entwicklermodus**
3. Klicke **Entpackte Erweiterung laden**
4. Wähle den `NotionTemplate`-Ordner

---

## Datenspeicherung

| Modus | Speicherort | Persistent? |
|-------|-------------|-------------|
| Webseite (localhost) | `localStorage` | Ja (bis Cache gelöscht) |
| Chrome Extension | `chrome.storage.local` | Ja (bleibt auch bei Cache-Clear) |

Alle Daten (To-Dos, Noten, Kalender-Sync, Theme) werden automatisch gespeichert.
