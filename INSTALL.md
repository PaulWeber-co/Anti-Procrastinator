# Anti Procrastinator — Installation

## Als Webseite (localhost)

```bash
cd NotionTemplate
python3 -m http.server 8080
# Öffne http://localhost:8080
```

---

## Als Chrome Extension (New Tab Page)

### 1. Icons generieren
1. Öffne `generate-icons.html` im Browser
2. Die 3 Icons (16px, 48px, 128px) werden automatisch heruntergeladen
3. Verschiebe die Dateien in den Ordner `icons/`

### 2. Extension laden
1. Öffne Chrome → `chrome://extensions/`
2. Aktiviere oben rechts **Entwicklermodus**
3. Klicke **Entpackte Erweiterung laden**
4. Wähle den `NotionTemplate`-Ordner
5. Fertig! Jeder neue Tab zeigt jetzt Anti Procrastinator

### 3. Als Startseite setzen
1. Chrome → Einstellungen → Beim Start
2. Wähle **Bestimmte Seite oder Seiten öffnen**
3. Füge `chrome-extension://DEINE-EXTENSION-ID/index.html` ein
   (Die ID findest du unter `chrome://extensions/`)

---

## Als Safari Extension (macOS)

### 1. Xcode-Projekt erstellen
```bash
xcrun safari-web-extension-converter NotionTemplate/
```

### 2. In Xcode öffnen und bauen
1. Xcode öffnet sich automatisch
2. Klicke **Run** (▶)
3. Safari → Einstellungen → Erweiterungen → **Anti Procrastinator** aktivieren

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
| Safari Extension | `localStorage` | Ja |

Alle Daten (To-Dos, Noten, Kalender-Sync, Theme) werden automatisch gespeichert.

