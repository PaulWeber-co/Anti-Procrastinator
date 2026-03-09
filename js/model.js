/**
 * MODEL — Datenlogik & Storage-Persistenz
 * Nutzt den Storage-Layer (chrome.storage in Extensions, localStorage im Browser).
 */
const Model = {
  STORAGE_KEYS: {
    todos: 'ht_todos',
    theme: 'ht_theme',
    weather: 'ht_weather',
    weatherTime: 'ht_weather_time',
    grades: 'ht_grades',
    customNames: 'ht_custom_names',
    syncUrl: 'ht_sync_url',
    syncEvents: 'ht_sync_events',
    syncTime: 'ht_sync_time',
    planerMode: 'ht_planer_mode',
    planerData: 'ht_planer_data',
  },

  // ── To-Do Daten ──

  getTodos() {
    return JSON.parse(Storage.get(this.STORAGE_KEYS.todos) || '[]');
  },

  saveTodos(todos) {
    Storage.set(this.STORAGE_KEYS.todos, JSON.stringify(todos));
  },

  addTodo(text, date, category, points) {
    const todos = this.getTodos();
    const todo = {
      id: this._uid(),
      text,
      date: date || null,
      category,
      points: parseInt(points) || 1,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    this.saveTodos(todos);
    return todo;
  },

  toggleTodo(id) {
    const todos = this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos(todos);
    }
    return todos;
  },

  deleteTodo(id) {
    const todos = this.getTodos().filter(t => t.id !== id);
    this.saveTodos(todos);
    return todos;
  },

  // ── Filter ──

  getFilteredTodos(filter, selectedDate) {
    let list = this.getTodos();

    if (selectedDate) {
      list = list.filter(t => t.date === selectedDate);
    }

    switch (filter) {
      case 'today':
        list = list.filter(t => t.date === this.todayStr());
        break;
      case 'open':
        list = list.filter(t => !t.completed);
        break;
      case 'done':
        list = list.filter(t => t.completed);
        break;
    }

    return list.sort((a, b) => a.completed - b.completed || new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Statistiken ──

  getStats() {
    const todos = this.getTodos();
    const total = todos.length;
    const done = todos.filter(t => t.completed).length;
    const open = total - done;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalPoints = todos.reduce((sum, t) => sum + (t.points || 1), 0);
    const earnedPoints = todos.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 1), 0);
    return { total, done, open, rate, totalPoints, earnedPoints };
  },

  getWeeklyData() {
    const todos = this.getTodos();
    const labels = [];
    const completionData = [];
    const pointsData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('de-DE', { weekday: 'short' });
      labels.push(dayLabel);

      const dayTodos = todos.filter(t => t.date === dateStr);
      const completed = dayTodos.filter(t => t.completed).length;
      const total = dayTodos.length;
      completionData.push(total > 0 ? Math.round((completed / total) * 100) : 0);

      const dayPoints = dayTodos.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 1), 0);
      pointsData.push(dayPoints);
    }

    return { labels, completionData, pointsData };
  },

  getMonthlyData() {
    const todos = this.getTodos();
    const labels = [];
    const completionData = [];
    const pointsData = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.getDate() + '.' + (d.getMonth() + 1);
      labels.push(dayLabel);

      const dayTodos = todos.filter(t => t.date === dateStr);
      const completed = dayTodos.filter(t => t.completed).length;
      const total = dayTodos.length;
      completionData.push(total > 0 ? Math.round((completed / total) * 100) : 0);

      const dayPoints = dayTodos.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 1), 0);
      pointsData.push(dayPoints);
    }

    return { labels, completionData, pointsData };
  },

  getYearlyData() {
    const todos = this.getTodos();
    const labels = [];
    const completionData = [];
    const pointsData = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      labels.push(monthNames[month]);

      const monthTodos = todos.filter(t => {
        if (!t.date) return false;
        const td = new Date(t.date + 'T00:00:00');
        return td.getFullYear() === year && td.getMonth() === month;
      });

      const completed = monthTodos.filter(t => t.completed).length;
      const total = monthTodos.length;
      completionData.push(total > 0 ? Math.round((completed / total) * 100) : 0);

      const monthPoints = monthTodos.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 1), 0);
      pointsData.push(monthPoints);
    }

    return { labels, completionData, pointsData };
  },

  getChartData(range) {
    switch (range) {
      case 'month': return this.getMonthlyData();
      case 'year': return this.getYearlyData();
      default: return this.getWeeklyData();
    }
  },

  // ── ICS Import ──

  parseICS(icsText) {
    const events = [];
    const vevents = icsText.split('BEGIN:VEVENT');

    for (let i = 1; i < vevents.length; i++) {
      const block = vevents[i].split('END:VEVENT')[0];
      const summary = this._icsField(block, 'SUMMARY');
      const dtstart = this._icsField(block, 'DTSTART');
      const description = this._icsField(block, 'DESCRIPTION');

      if (summary && dtstart) {
        const date = this._icsParseDate(dtstart);
        if (date) {
          events.push({
            text: summary.replace(/\\n/g, ' ').replace(/\\,/g, ','),
            date: date,
            description: description || '',
          });
        }
      }
    }
    return events;
  },

  _icsField(block, field) {
    // Handle folded lines and various field formats (DTSTART;VALUE=DATE:, DTSTART:, etc.)
    const regex = new RegExp('(?:^|\\n)' + field + '[^:]*:([^\\r\\n]+)', 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : null;
  },

  _icsParseDate(dtStr) {
    // Formats: 20260305, 20260305T120000, 20260305T120000Z
    const clean = dtStr.replace(/[^0-9T]/g, '');
    if (clean.length >= 8) {
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      const d = clean.substring(6, 8);
      return y + '-' + m + '-' + d;
    }
    return null;
  },

  importICSEvents(events) {
    let imported = 0;
    events.forEach(ev => {
      this.addTodo(ev.text, ev.date, 'arbeit', 1);
      imported++;
    });
    return imported;
  },

  // ── Kalender Sync ──

  getSyncUrl() {
    return Storage.get(this.STORAGE_KEYS.syncUrl) || '';
  },

  setSyncUrl(url) {
    Storage.set(this.STORAGE_KEYS.syncUrl, url || '');
  },

  getSyncEvents() {
    return JSON.parse(Storage.get(this.STORAGE_KEYS.syncEvents) || '[]');
  },

  saveSyncEvents(events) {
    Storage.set(this.STORAGE_KEYS.syncEvents, JSON.stringify(events));
    Storage.set(this.STORAGE_KEYS.syncTime, Date.now().toString());
  },

  getLastSyncTime() {
    var t = Storage.get(this.STORAGE_KEYS.syncTime);
    return t ? parseInt(t) : 0;
  },

  clearSyncEvents() {
    Storage.remove(this.STORAGE_KEYS.syncEvents);
    Storage.remove(this.STORAGE_KEYS.syncTime);
    Storage.remove(this.STORAGE_KEYS.syncUrl);
  },

  syncFromICS(icsText) {
    var events = this.parseICS(icsText);
    // Sync-Events separat speichern (überschreibt alte)
    var syncEvents = events.map(function(ev) {
      return { text: ev.text, date: ev.date, category: 'arbeit', synced: true };
    });
    this.saveSyncEvents(syncEvents);
    return syncEvents.length;
  },

  // Tasks + Sync-Events zusammenführen für Kalenderansicht
  getTasksByDate() {
    const todos = this.getTodos();
    const syncEvents = this.getSyncEvents();
    const map = {};

    todos.forEach(t => {
      if (t.date) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });

    syncEvents.forEach(ev => {
      if (ev.date) {
        if (!map[ev.date]) map[ev.date] = [];
        map[ev.date].push({
          id: 'sync_' + ev.date + '_' + ev.text.substring(0, 10),
          text: ev.text,
          date: ev.date,
          category: ev.category || 'arbeit',
          completed: false,
          synced: true,
        });
      }
    });

    return map;
  },

  getCategoryData() {
    const todos = this.getTodos();
    const counts = { arbeit: 0, persoenlich: 0, gesundheit: 0, lernen: 0 };
    todos.forEach(t => {
      if (Object.prototype.hasOwnProperty.call(counts, t.category)) counts[t.category]++;
    });
    return counts;
  },

  // ── Theme ──

  getTheme() {
    return Storage.get(this.STORAGE_KEYS.theme) || 'light';
  },

  setTheme(theme) {
    Storage.set(this.STORAGE_KEYS.theme, theme);
  },

  // ── Wetter (Cache) ──

  getCachedWeather() {
    const cached = Storage.get(this.STORAGE_KEYS.weather);
    const cachedTime = Storage.get(this.STORAGE_KEYS.weatherTime);
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 1800000) {
      return JSON.parse(cached);
    }
    return null;
  },

  cacheWeather(data) {
    Storage.set(this.STORAGE_KEYS.weather, JSON.stringify(data));
    Storage.set(this.STORAGE_KEYS.weatherTime, Date.now().toString());
  },

  // ── Hilfsfunktionen ──

  todayStr() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  },

  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // ── Planer (generisch: Schule / Uni / Provadis) ──

  PLANER_MODES: {
    schule: { label: 'Schulplaner', periodLabel: 'Klasse', pointsLabel: 'Fächer bestanden', gradeMin: 1, gradeMax: 6, gradeStep: 1, hasEcts: false, bestNote: 1, isSchule: true },
    uni: { label: 'Studienplan', periodLabel: 'Semester', pointsLabel: 'ECTS abgeschlossen', gradeMin: 1.0, gradeMax: 5.0, gradeStep: 0.1, hasEcts: true, bestNote: 1.0, isSchule: false },
    provadis: { label: 'Studienplan Provadis', periodLabel: 'Semester', pointsLabel: 'ECTS abgeschlossen', gradeMin: 1.0, gradeMax: 5.0, gradeStep: 0.1, hasEcts: true, bestNote: 1.0, isSchule: false },
  },

  // ── Schul-Fächer nach Klassenstufe ──
  // Fächer die in jeder Klasse vorkommen
  SCHULE_FAECHER_CORE: [
    'Deutsch', 'Mathematik', 'Englisch', 'Sport', 'Religion/Ethik',
  ],

  // Zusätzliche Fächer je Klassenstufe
  SCHULE_FAECHER_BY_KLASSE: {
    5:  ['Geschichte', 'Geographie', 'Biologie', 'Musik', 'Kunst', 'Natur und Technik'],
    6:  ['Geschichte', 'Geographie', 'Biologie', 'Musik', 'Kunst', 'Natur und Technik', '2. Fremdsprache (Latein/Französisch)'],
    7:  ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Musik', 'Kunst', '2. Fremdsprache (Latein/Französisch)', 'Informatik'],
    8:  ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Chemie', 'Musik', 'Kunst', '2. Fremdsprache (Latein/Französisch)', 'Informatik'],
    9:  ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Chemie', 'Sozialkunde', 'Musik', 'Kunst', '2. Fremdsprache (Latein/Französisch)', 'Informatik', 'Wirtschaft und Recht'],
    10: ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Chemie', 'Sozialkunde', 'Musik', 'Kunst', '2. Fremdsprache (Latein/Französisch)', 'Informatik', 'Wirtschaft und Recht'],
    11: ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Chemie', 'Sozialkunde', 'Musik', 'Kunst', 'Informatik', 'Wirtschaft und Recht', 'W-Seminar', 'P-Seminar'],
    12: ['Geschichte', 'Geographie', 'Biologie', 'Physik', 'Chemie', 'Sozialkunde', 'Musik', 'Kunst', 'Informatik', 'Wirtschaft und Recht', 'W-Seminar', 'P-Seminar'],
    13: ['Geschichte', 'Biologie', 'Physik', 'Chemie', 'Sozialkunde', 'W-Seminar', 'P-Seminar'],
  },

  // ── Noten-Typen für Schule ──
  // Schulaufgabe (groß, zählt doppelt), Ex (klein, zählt halb so viel), Mündlich
  // Gewichtung: Schulaufgabe : Ex : Mündlich = 2 : 1 : 1
  SCHULE_NOTE_TYPES: [
    { key: 'schulaufgabe', label: 'Schulaufgaben', shortLabel: 'SA', weight: 2 },
    { key: 'ex', label: 'Exen', shortLabel: 'Ex', weight: 1 },
    { key: 'muendlich', label: 'Mündliche Noten', shortLabel: 'Mdl', weight: 1 },
  ],

  PROVADIS_DATA: [
    { period: 1, modules: [
      { name: 'Mathematik 1', points: 5, pruefung: '90-min Klausur', prof: 'Prof. Dr. Volker Scheidemann' },
      { name: 'Lerntechniken und wissenschaftliches Arbeiten', points: 5, pruefung: 'Klausur (70%) + Gruppenpräsentation (30%)', prof: 'Prof. Dr. Marcus Frenz' },
      { name: 'Grundlagen der Informatik', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Programmierung', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Programmierung WAB', points: 5, pruefung: 'Präsentation/Kolloquium', prof: '', isWab: true },
      { name: 'Business English', points: 5, pruefung: 'Klausur / mündliche Prüfung', prof: '' },
    ]},
    { period: 2, modules: [
      { name: 'Mathematik 2', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Theoretische Informatik', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Algorithmen und Datenstrukturen', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Algorithmen und Datenstrukturen WAB', points: 5, pruefung: 'WAB Kolloquium', prof: '', isWab: true },
      { name: 'Fortgeschrittene Programmierung', points: 5, pruefung: 'Klausur / Programmierprojekt', prof: '' },
      { name: 'Kommunikationskompetenz', points: 5, pruefung: 'Präsentation / Projektarbeit', prof: '' },
    ]},
    { period: 3, modules: [
      { name: 'Informationssicherheit', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Datenmodellierung und Datenbanken', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Datenmodellierung und Datenbanken WAB', points: 5, pruefung: 'WAB Kolloquium', prof: '', isWab: true },
      { name: 'Netze und Verteilte Systeme', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Betriebssysteme', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Projektmanagement', points: 5, pruefung: 'Projektarbeit / Präsentation', prof: '' },
    ]},
    { period: 4, modules: [
      { name: 'Agiles Software-Engineering und Softwaretechnik', points: 5, pruefung: 'Projekt', prof: '' },
      { name: 'Agiles Software-Engineering WAB', points: 5, pruefung: 'WAB Kolloquium', prof: '', isWab: true },
      { name: 'Technische Informatik und Rechnerarchitekturen / XaaS', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Human-Computer-Interaction', points: 5, pruefung: 'Projekt / Präsentation', prof: '' },
      { name: 'Data Analytics und Big Data', points: 5, pruefung: 'Klausur / Projekt', prof: '' },
      { name: 'Interkulturelle Kompetenz und heterogene Teams', points: 5, pruefung: 'Präsentation / Gruppenarbeit', prof: '' },
    ]},
    { period: 5, modules: [
      { name: 'Projektpraktikum', points: 5, pruefung: 'Projekt', prof: '' },
      { name: 'Projektpraktikum WAB', points: 5, pruefung: 'Kolloquium', prof: '', isWab: true },
      { name: 'Software-Anwendungsarchitekturen und Microservice APIs', points: 5, pruefung: 'Projekt / Klausur', prof: '' },
      { name: 'Maschinelles Lernen und Artificial Intelligence', points: 5, pruefung: 'Klausur / Projekt', prof: '' },
      { name: 'Betriebswirtschaftslehre und IT-Service-Management', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Wahlpflichtfach 1', points: 5, pruefung: 'Klausur / Projekt', prof: '' },
    ]},
    { period: 6, modules: [
      { name: 'New Trends in IT und Management der Digitalen Transformation', points: 5, pruefung: 'Projekt / Präsentation', prof: '' },
      { name: 'Recht und Datenschutz', points: 5, pruefung: 'Klausur', prof: '' },
      { name: 'Bachelor Thesis', points: 12, pruefung: 'Abschlussarbeit', prof: '' },
      { name: 'Bachelor-Thesis Kolloquium', points: 3, pruefung: 'Verteidigung', prof: '' },
      { name: 'Wahlpflichtfach 2', points: 5, pruefung: 'Klausur / Projekt', prof: '' },
    ]},
  ],

  getPlanerMode() {
    return Storage.get(this.STORAGE_KEYS.planerMode) || null;
  },

  setPlanerMode(mode) {
    Storage.set(this.STORAGE_KEYS.planerMode, mode);
    // Immer neu initialisieren — nach resetPlaner() sind Daten leer
    var existing = this.getPlanerData();
    if (!existing || existing.length === 0) {
      this._initPlanerData(mode);
    }
  },

  resetPlaner() {
    Storage.remove(this.STORAGE_KEYS.planerMode);
    Storage.remove(this.STORAGE_KEYS.planerData);
    Storage.remove(this.STORAGE_KEYS.grades);
  },

  getPlanerData() {
    return JSON.parse(Storage.get(this.STORAGE_KEYS.planerData) || '[]');
  },

  savePlanerData(data) {
    Storage.set(this.STORAGE_KEYS.planerData, JSON.stringify(data));
  },

  _initPlanerData(mode) {
    var data;
    if (mode === 'provadis') {
      data = this.PROVADIS_DATA.map(function(p, pi) {
        return {
          period: p.period,
          modules: p.modules.map(function(m, mi) {
            return { id: 'p' + pi + '_m' + mi, name: m.name, points: m.points, pruefung: m.pruefung, prof: m.prof, isWab: m.isWab || false };
          })
        };
      });
    } else if (mode === 'schule') {
      // Standard: Klasse 5-10, Benutzer kann später Klassen hinzufügen/entfernen
      data = [];
      for (var k = 5; k <= 10; k++) {
        var faecher = this._getSchulFaecherForKlasse(k);
        data.push({
          period: k,
          modules: faecher.map(function(name, fi) {
            return {
              id: 'k' + k + '_m' + fi,
              name: name,
              points: 1,
              pruefung: '',
              prof: '',
              // Schulnoten-Felder: Arrays für mehrere Noten pro Typ
              noten: { schulaufgabe: [], ex: [], muendlich: [] }
            };
          })
        });
      }
    } else {
      data = [];
      for (var s = 1; s <= 6; s++) {
        data.push({
          period: s,
          modules: [
            { id: 'u' + s + '_m0', name: 'Modul 1', points: 5, pruefung: 'Klausur', prof: '' },
            { id: 'u' + s + '_m1', name: 'Modul 2', points: 5, pruefung: 'Klausur', prof: '' },
            { id: 'u' + s + '_m2', name: 'Modul 3', points: 5, pruefung: 'Klausur', prof: '' },
          ]
        });
      }
    }
    this.savePlanerData(data);
  },

  _getSchulFaecherForKlasse(klasse) {
    var core = this.SCHULE_FAECHER_CORE.slice();
    var extra = this.SCHULE_FAECHER_BY_KLASSE[klasse] || this.SCHULE_FAECHER_BY_KLASSE[10];
    return core.concat(extra);
  },

  addPeriod() {
    var data = this.getPlanerData();
    var mode = this.getPlanerMode();
    var config = this.PLANER_MODES[mode] || this.PLANER_MODES.uni;
    var nextNum = data.length > 0 ? data[data.length - 1].period + 1 : 1;
    var prefix = mode === 'schule' ? 'k' : (mode === 'provadis' ? 'p' : 'u');

    if (config.isSchule) {
      // Für Schule: Fächer der nächsten Klasse laden
      var faecher = this._getSchulFaecherForKlasse(nextNum);
      data.push({
        period: nextNum,
        modules: faecher.map(function(name, fi) {
          return {
            id: prefix + nextNum + '_m' + fi + '_' + Date.now(),
            name: name,
            points: 1,
            pruefung: '',
            prof: '',
            noten: { schulaufgabe: [], ex: [], muendlich: [] }
          };
        })
      });
    } else {
      data.push({
        period: nextNum,
        modules: [
          { id: prefix + nextNum + '_m0', name: 'Neues Modul', points: 5, pruefung: 'Klausur', prof: '' }
        ]
      });
    }
    this.savePlanerData(data);
    return data;
  },

  addModule(periodIdx) {
    var data = this.getPlanerData();
    var mode = this.getPlanerMode();
    if (!data[periodIdx]) return data;
    var mCount = data[periodIdx].modules.length;
    var prefix = mode === 'schule' ? 'k' : (mode === 'provadis' ? 'p' : 'u');
    var id = prefix + periodIdx + '_m' + mCount + '_' + Date.now();
    var newMod = {
      id: id,
      name: mode === 'schule' ? 'Neues Fach' : 'Neues Modul',
      points: mode === 'schule' ? 1 : 5,
      pruefung: mode === 'schule' ? '' : 'Klausur',
      prof: ''
    };
    if (mode === 'schule') {
      newMod.noten = { schulaufgabe: [], ex: [], muendlich: [] };
    }
    data[periodIdx].modules.push(newMod);
    this.savePlanerData(data);
    return data;
  },

  deleteModule(periodIdx, moduleIdx) {
    var data = this.getPlanerData();
    if (data[periodIdx] && data[periodIdx].modules[moduleIdx]) {
      var modId = data[periodIdx].modules[moduleIdx].id;
      data[periodIdx].modules.splice(moduleIdx, 1);
      // Note löschen
      var grades = this.getGrades();
      delete grades[modId];
      Storage.set(this.STORAGE_KEYS.grades, JSON.stringify(grades));
    }
    this.savePlanerData(data);
    return data;
  },

  deletePeriod(periodIdx) {
    var data = this.getPlanerData();
    if (data[periodIdx]) {
      var grades = this.getGrades();
      data[periodIdx].modules.forEach(function(m) { delete grades[m.id]; });
      Storage.set(this.STORAGE_KEYS.grades, JSON.stringify(grades));
      data.splice(periodIdx, 1);
    }
    this.savePlanerData(data);
    return data;
  },

  updateModule(periodIdx, moduleIdx, field, value) {
    var data = this.getPlanerData();
    if (data[periodIdx] && data[periodIdx].modules[moduleIdx]) {
      data[periodIdx].modules[moduleIdx][field] = value;
    }
    this.savePlanerData(data);
  },

  updatePeriodNumber(periodIdx, newNum) {
    var data = this.getPlanerData();
    if (data[periodIdx]) {
      data[periodIdx].period = parseInt(newNum) || data[periodIdx].period;
    }
    this.savePlanerData(data);
  },

  getGrades() {
    return JSON.parse(Storage.get(this.STORAGE_KEYS.grades) || '{}');
  },

  saveGrade(moduleId, grade, status) {
    var grades = this.getGrades();
    grades[moduleId] = { grade: parseFloat(grade) || null, status: status || 'offen' };
    Storage.set(this.STORAGE_KEYS.grades, JSON.stringify(grades));
  },

  getPlanerStats() {
    var mode = this.getPlanerMode();
    var config = this.PLANER_MODES[mode] || this.PLANER_MODES.uni;

    // Schul-Modus hat eigene Berechnung
    if (config.isSchule) {
      return this.getSchulGesamtSchnitt();
    }

    var data = this.getPlanerData();
    var grades = this.getGrades();
    var totalPoints = 0;
    var completedPoints = 0;
    var weightedSum = 0;
    var gradedPoints = 0;

    data.forEach(function(period) {
      period.modules.forEach(function(mod) {
        var pts = config.hasEcts ? (mod.points || 5) : 1;
        totalPoints += pts;
        var entry = grades[mod.id];
        if (entry && entry.status === 'bestanden') {
          completedPoints += pts;
          if (entry.grade && entry.grade > 0) {
            weightedSum += entry.grade * pts;
            gradedPoints += pts;
          }
        }
      });
    });

    var average = gradedPoints > 0 ? (weightedSum / gradedPoints) : 0;
    return { totalPoints: totalPoints, completedPoints: completedPoints, average: average, gradedPoints: gradedPoints };
  },

  isPeriodComplete(periodIdx) {
    var mode = this.getPlanerMode();
    var config = this.PLANER_MODES[mode] || this.PLANER_MODES.uni;

    if (config.isSchule) {
      return this.isSchulPeriodComplete(periodIdx);
    }

    var data = this.getPlanerData();
    var grades = this.getGrades();
    var period = data[periodIdx];
    if (!period) return false;
    return period.modules.length > 0 && period.modules.every(function(m) {
      var e = grades[m.id];
      return e && e.status === 'bestanden';
    });
  },

  getPeriodStats(periodIdx) {
    var mode = this.getPlanerMode();
    var config = this.PLANER_MODES[mode] || this.PLANER_MODES.uni;

    if (config.isSchule) {
      return this.getSchulPeriodStats(periodIdx);
    }

    var data = this.getPlanerData();
    var grades = this.getGrades();
    var period = data[periodIdx];
    if (!period) return { total: 0, completed: 0, avg: null };
    var total = 0, completed = 0, wSum = 0, gPts = 0;
    period.modules.forEach(function(m) {
      var pts = config.hasEcts ? (m.points || 5) : 1;
      total += pts;
      var e = grades[m.id];
      if (e && e.status === 'bestanden') {
        completed += pts;
        if (e.grade > 0) { wSum += e.grade * pts; gPts += pts; }
      }
    });
    return { total: total, completed: completed, avg: gPts > 0 ? wSum / gPts : null };
  },

  // ── Schul-Noten Verwaltung ──

  addSchulNote(periodIdx, moduleIdx, noteType, value) {
    var data = this.getPlanerData();
    if (!data[periodIdx] || !data[periodIdx].modules[moduleIdx]) return data;
    var mod = data[periodIdx].modules[moduleIdx];
    if (!mod.noten) mod.noten = { schulaufgabe: [], ex: [], muendlich: [] };
    var grade = parseInt(value);
    if (grade >= 1 && grade <= 6) {
      mod.noten[noteType].push(grade);
    }
    this.savePlanerData(data);
    return data;
  },

  removeSchulNote(periodIdx, moduleIdx, noteType, noteIdx) {
    var data = this.getPlanerData();
    if (!data[periodIdx] || !data[periodIdx].modules[moduleIdx]) return data;
    var mod = data[periodIdx].modules[moduleIdx];
    if (mod.noten && mod.noten[noteType]) {
      mod.noten[noteType].splice(noteIdx, 1);
    }
    this.savePlanerData(data);
    return data;
  },

  /**
   * Berechnet den gewichteten Schnitt eines Schul-Fachs.
   * Schulaufgaben zählen doppelt (Gewicht 2), Exen und Mündlich je Gewicht 1.
   * Alle Noten innerhalb eines Typs werden zuerst gemittelt, dann gewichtet.
   */
  calcSchulFachSchnitt(mod) {
    if (!mod.noten) return null;
    var types = this.SCHULE_NOTE_TYPES;
    var totalWeight = 0;
    var weightedSum = 0;

    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      var arr = mod.noten[t.key] || [];
      if (arr.length > 0) {
        var avg = arr.reduce(function(s, v) { return s + v; }, 0) / arr.length;
        weightedSum += avg * t.weight;
        totalWeight += t.weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : null;
  },

  /**
   * Berechnet Schul-Statistiken für eine Klasse (period).
   */
  getSchulPeriodStats(periodIdx) {
    var data = this.getPlanerData();
    var period = data[periodIdx];
    if (!period) return { total: 0, completed: 0, avg: null };

    var total = period.modules.length;
    var completed = 0;
    var sumAvg = 0;
    var countAvg = 0;

    var self = this;
    period.modules.forEach(function(mod) {
      var schnitt = self.calcSchulFachSchnitt(mod);
      if (schnitt !== null) {
        completed++;
        sumAvg += schnitt;
        countAvg++;
      }
    });

    return {
      total: total,
      completed: completed,
      avg: countAvg > 0 ? sumAvg / countAvg : null
    };
  },

  /**
   * Gesamt-Schnitt über alle Schul-Fächer aller Klassen.
   */
  getSchulGesamtSchnitt() {
    var data = this.getPlanerData();
    var sumAvg = 0;
    var countAvg = 0;
    var totalFaecher = 0;
    var completedFaecher = 0;

    var self = this;
    data.forEach(function(period) {
      period.modules.forEach(function(mod) {
        totalFaecher++;
        var schnitt = self.calcSchulFachSchnitt(mod);
        if (schnitt !== null) {
          completedFaecher++;
          sumAvg += schnitt;
          countAvg++;
        }
      });
    });

    return {
      totalPoints: totalFaecher,
      completedPoints: completedFaecher,
      average: countAvg > 0 ? sumAvg / countAvg : 0,
      gradedPoints: countAvg
    };
  },

  isSchulPeriodComplete(periodIdx) {
    var data = this.getPlanerData();
    var period = data[periodIdx];
    if (!period || period.modules.length === 0) return false;
    var self = this;
    return period.modules.every(function(mod) {
      return self.calcSchulFachSchnitt(mod) !== null;
    });
  },

  // ── Legacy compat ──
  getCustomNames() {
    return JSON.parse(Storage.get(this.STORAGE_KEYS.customNames) || '{}');
  },
  saveCustomName(key, value) {
    var names = this.getCustomNames();
    if (value && value.trim()) { names[key] = value.trim(); } else { delete names[key]; }
    Storage.set(this.STORAGE_KEYS.customNames, JSON.stringify(names));
  },
};




