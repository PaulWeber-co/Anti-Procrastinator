/**
 * CONTROLLER — Verbindet Model & View, Event-Handling
 */
const Controller = {
  currentFilter: 'all',
  selectedDate: null,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calendarExpanded: false,
  chartRange: 'week',

  // Pomodoro state
  pomoRunning: false,
  pomoMode: 'work', // 'work', 'break', 'longBreak'
  pomoRemaining: 25 * 60,
  pomoInterval: null,

  // ── Initialisierung ──

  init() {
    this._initTheme();
    this._initClock();
    this._initClockToggle();
    this._initWeather();
    this._initStudienplan();
    this._initCalendarExpand();
    this._initChartRange();
    this._initICSImport();
    this._initPomodoro();
    this._initQuote();
    this._bindTodoEvents();
    this._bindFilterEvents();
    this._bindCalendarNav();
    this._setDefaultDate();
    this.renderAll();
  },

  // ── Komplett-Render ──

  renderAll() {
    const todos = Model.getFilteredTodos(this.currentFilter, this.selectedDate);
    View.renderTodos(todos, this.selectedDate);
    this._bindTodoItemEvents();

    View.renderCalendar(
      this.calYear,
      this.calMonth,
      Model.getTasksByDate(),
      Model.todayStr(),
      this.selectedDate
    );
    this._bindCalendarDayEvents();

    View.renderStats(Model.getStats());
    View.renderLineChart(Model.getChartData(this.chartRange));
    View.renderDonutChart(Model.getCategoryData());
  },

  // ── Theme ──

  _initTheme() {
    const theme = Model.getTheme();
    View.applyTheme(theme);

    View.el('themeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      Model.setTheme(next);
      View.applyTheme(next);
      // Charts müssen nach Theme-Wechsel neu gerendert werden
      View.renderLineChart(Model.getChartData(this.chartRange));
      View.renderDonutChart(Model.getCategoryData());
      View.renderAnalogClock();
      this._renderPomoState();
    });
  },

  // ── Uhr ──

  _initClock() {
    var self = this;
    var clockMode = Model.getClockMode();
    View.setClockMode(clockMode);

    View.updateClock();
    setInterval(function() {
      View.updateClock();
      if (Model.getClockMode() === 'analog') {
        View.renderAnalogClock();
      }
    }, 1000);
  },

  _initClockToggle() {
    var self = this;
    View.el('clockToggle').addEventListener('click', function() {
      var current = Model.getClockMode();
      var next = current === 'digital' ? 'analog' : 'digital';
      Model.setClockMode(next);
      View.setClockMode(next);
    });
  },

  // ── Pomodoro Timer ──

  _initPomodoro() {
    var self = this;
    var stats = Model.getPomoStats();

    this.pomoMode = 'work';
    this.pomoRemaining = Model.POMO_WORK;
    this.pomoRunning = false;

    this._renderPomoState();

    View.el('pomoStart').addEventListener('click', function() {
      if (!self.pomoRunning) {
        self.pomoRunning = true;
        self._startPomoTimer();
        self._renderPomoState();
      }
    });

    View.el('pomoPause').addEventListener('click', function() {
      if (self.pomoRunning) {
        self.pomoRunning = false;
        clearInterval(self.pomoInterval);
        self.pomoInterval = null;
        self._renderPomoState();
      }
    });

    View.el('pomoReset').addEventListener('click', function() {
      self.pomoRunning = false;
      clearInterval(self.pomoInterval);
      self.pomoInterval = null;
      self.pomoMode = 'work';
      self.pomoRemaining = Model.POMO_WORK;
      self._renderPomoState();
    });
  },

  _startPomoTimer() {
    var self = this;
    if (this.pomoInterval) clearInterval(this.pomoInterval);

    this.pomoInterval = setInterval(function() {
      if (!self.pomoRunning) return;

      self.pomoRemaining--;

      if (self.pomoRemaining <= 0) {
        clearInterval(self.pomoInterval);
        self.pomoInterval = null;
        self.pomoRunning = false;

        if (self.pomoMode === 'work') {
          // Session abgeschlossen
          var stats = Model.addPomoSession();
          // Nächster Modus: nach 4 Sessions → lange Pause
          if (stats.sessions % 4 === 0) {
            self.pomoMode = 'longBreak';
            self.pomoRemaining = Model.POMO_LONG_BREAK;
          } else {
            self.pomoMode = 'break';
            self.pomoRemaining = Model.POMO_BREAK;
          }
          self._pomoNotify('Fokus-Session abgeschlossen!');
        } else {
          // Pause vorbei → zurück zu Arbeit
          self.pomoMode = 'work';
          self.pomoRemaining = Model.POMO_WORK;
          self._pomoNotify('Pause vorbei — weiter geht\'s!');
        }

        self._renderPomoState();
        return;
      }

      self._renderPomoState();
    }, 1000);
  },

  _renderPomoState() {
    var stats = Model.getPomoStats();
    View.renderPomodoro({
      mode: this.pomoMode,
      remaining: this.pomoRemaining,
      running: this.pomoRunning,
      sessions: stats.sessions,
      totalMinutes: stats.totalMinutes,
    });
  },

  _pomoNotify(msg) {
    // Titel blinken lassen
    var origTitle = document.title;
    document.title = '🍅 ' + msg;
    setTimeout(function() { document.title = origTitle; }, 5000);

    // Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Anti Procrastinator', { body: msg });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  },

  // ── Daily Quote ──

  _initQuote() {
    var quote = Model.getDailyQuote();
    View.displayQuote(quote);
  },
  // ── Wetter ──

  WMO_DESCRIPTIONS: {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bedeckt',
    45: 'Nebel',
    48: 'Nebel mit Reif',
    51: 'Leichter Nieselregen',
    53: 'Nieselregen',
    55: 'Starker Nieselregen',
    61: 'Leichter Regen',
    63: 'Regen',
    65: 'Starker Regen',
    71: 'Leichter Schneefall',
    73: 'Schneefall',
    75: 'Starker Schneefall',
    80: 'Regenschauer',
    81: 'Starke Regenschauer',
    82: 'Heftige Regenschauer',
    85: 'Schneeschauer',
    86: 'Starke Schneeschauer',
    95: 'Gewitter',
    96: 'Gewitter mit Hagel',
    99: 'Gewitter mit starkem Hagel',
  },

  _initWeather() {
    const cached = Model.getCachedWeather();
    if (cached && cached.dailyMax) {
      View.displayWeather(cached);
    } else {
      this._fetchWeather();
    }
  },

  async _fetchWeather() {
    try {
      const coords = await this._getCoordinates();
      const url = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude=' + coords.lat
        + '&longitude=' + coords.lon
        + '&current=temperature_2m,weather_code'
        + '&daily=temperature_2m_max,temperature_2m_min,weather_code'
        + '&forecast_days=7'
        + '&timezone=Europe%2FBerlin';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API responded with ' + res.status);
      const data = await res.json();

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const desc = this.WMO_DESCRIPTIONS[code] || 'Unbekannt';

      const weather = {
        temp: temp,
        desc: desc,
        city: coords.city,
        dailyMax: data.daily.temperature_2m_max.map(function(t) { return Math.round(t); }),
        dailyMin: data.daily.temperature_2m_min.map(function(t) { return Math.round(t); }),
        dailyCodes: data.daily.weather_code,
        dailyDates: data.daily.time,
      };

      Model.cacheWeather(weather);
      View.displayWeather(weather);
    } catch (e) {
      console.warn('Wetter konnte nicht geladen werden:', e);
      View.displayWeather(null);
    }
  },

  _getCoordinates() {
    return new Promise(function(resolve) {
      var fallback = { lat: 52.52, lon: 13.41, city: 'Berlin' };
      var resolved = false;

      function done(coords) {
        if (!resolved) {
          resolved = true;
          resolve(coords);
        }
      }

      // Timeout: nach 3s Fallback verwenden
      setTimeout(function() { done(fallback); }, 3000);

      // Versuch 1: Browser Geolocation API
      if (navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              done({
                lat: pos.coords.latitude.toFixed(2),
                lon: pos.coords.longitude.toFixed(2),
                city: 'Mein Standort',
              });
            },
            function() {
              // Versuch 2: IP-basierte Geolocation
              fetch('https://ipapi.co/json/')
                .then(function(r) { return r.json(); })
                .then(function(d) {
                  if (d.latitude && d.longitude) {
                    done({ lat: d.latitude, lon: d.longitude, city: d.city || 'Unbekannt' });
                  } else {
                    done(fallback);
                  }
                })
                .catch(function() { done(fallback); });
            },
            { timeout: 2000 }
          );
        } catch (e) {
          done(fallback);
        }
      } else {
        // Kein Geolocation — IP-Fallback
        fetch('https://ipapi.co/json/')
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d.latitude && d.longitude) {
              done({ lat: d.latitude, lon: d.longitude, city: d.city || 'Unbekannt' });
            } else {
              done(fallback);
            }
          })
          .catch(function() { done(fallback); });
      }
    });
  },

  // ── To-Do Events ──

  _bindTodoEvents() {
    View.el('todoAdd').addEventListener('click', () => this._addTodo());
    View.el('todoInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._addTodo();
    });
  },

  _addTodo() {
    const input = View.el('todoInput');
    const text = input.value.trim();
    if (!text) return;

    const date = View.el('todoDate').value || null;
    const category = View.el('todoCategory').value;
    const points = View.el('todoPoints').value;

    Model.addTodo(text, date, category, points);
    input.value = '';
    this.renderAll();
  },

  _bindTodoItemEvents() {
    document.querySelectorAll('.todo-checkbox').forEach(cb => {
      cb.addEventListener('click', () => {
        Model.toggleTodo(cb.dataset.id);
        this.renderAll();
      });
    });

    document.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        Model.deleteTodo(btn.dataset.id);
        this.renderAll();
      });
    });
  },

  // ── Filter Events ──

  _bindFilterEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        View.setActiveFilter(btn);
        this.currentFilter = btn.dataset.filter;
        const todos = Model.getFilteredTodos(this.currentFilter, this.selectedDate);
        View.renderTodos(todos, this.selectedDate);
        this._bindTodoItemEvents();
      });
    });
  },

  // ── Kalender Expand ──

  _initCalendarExpand() {
    var self = this;
    View.el('calExpandBtn').addEventListener('click', function() {
      self.calendarExpanded = !self.calendarExpanded;
      var calWidget = document.getElementById('calendarCard');
      if (self.calendarExpanded) {
        calWidget.classList.add('widget-expanded');
      } else {
        calWidget.classList.remove('widget-expanded');
      }
      self._renderCalendar();
    });
  },

  // ── Chart Zeitraum ──

  _initChartRange() {
    var self = this;
    document.querySelectorAll('.chart-range-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.chart-range-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        self.chartRange = btn.dataset.range;
        View.renderLineChart(Model.getChartData(self.chartRange));
      });
    });
  },

  // ── Kalender Sync ──

  _initICSImport() {
    var self = this;

    // Sync-Button öffnet Modal
    View.el('calSyncBtn').addEventListener('click', function() {
      self._openSyncModal();
    });

    View.el('calSyncClose').addEventListener('click', function() {
      View.el('calSyncOverlay').classList.remove('visible');
    });

    View.el('calSyncOverlay').addEventListener('click', function(e) {
      if (e.target === View.el('calSyncOverlay')) {
        View.el('calSyncOverlay').classList.remove('visible');
      }
    });

    // URL speichern + sync
    View.el('syncUrlSave').addEventListener('click', function() {
      var url = View.el('syncUrlInput').value.trim();
      if (!url) return;
      Model.setSyncUrl(url);
      self._syncFromUrl(url);
    });

    // Datei-Import (Click + Drag&Drop)
    var dropZone = View.el('syncDropZone');
    var fileInput = View.el('calIcsFile');

    dropZone.addEventListener('click', function() {
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (file) self._importFile(file);
      fileInput.value = '';
    });

    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('sync-drop-active');
    });

    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('sync-drop-active');
    });

    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('sync-drop-active');
      var file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.ics')) {
        self._importFile(file);
      }
    });

    // Clear sync events
    View.el('syncClearBtn').addEventListener('click', function() {
      Model.clearSyncEvents();
      self._updateSyncStatus();
      self.renderAll();
    });

    // Vorhandene URL laden
    var savedUrl = Model.getSyncUrl();
    if (savedUrl) {
      // Auto-Sync alle 15 Minuten
      var elapsed = Date.now() - Model.getLastSyncTime();
      if (elapsed > 900000) {
        this._syncFromUrl(savedUrl);
      }
      setInterval(function() {
        self._syncFromUrl(Model.getSyncUrl());
      }, 900000);
    }
  },

  _openSyncModal() {
    var overlay = View.el('calSyncOverlay');
    var urlInput = View.el('syncUrlInput');
    urlInput.value = Model.getSyncUrl();
    this._updateSyncStatus();
    overlay.classList.add('visible');
  },

  _updateSyncStatus() {
    var statusEl = View.el('syncUrlStatus');
    var eventsSection = View.el('syncEventsSection');
    var eventsCount = View.el('syncEventsCount');
    var url = Model.getSyncUrl();
    var syncEvents = Model.getSyncEvents();
    var lastSync = Model.getLastSyncTime();

    if (url) {
      var timeStr = lastSync > 0
        ? new Date(lastSync).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '--';
      statusEl.textContent = 'Verbunden — Letzte Sync: ' + timeStr;
      statusEl.className = 'sync-url-status sync-connected';
    } else {
      statusEl.textContent = '';
      statusEl.className = 'sync-url-status';
    }

    if (syncEvents.length > 0) {
      eventsSection.classList.remove('sync-hidden');
      eventsCount.textContent = syncEvents.length + ' Termine synchronisiert';
    } else {
      eventsSection.classList.add('sync-hidden');
    }
  },

  _syncFromUrl(url) {
    var self = this;
    var statusEl = View.el('syncUrlStatus');
    statusEl.textContent = 'Synchronisiere...';
    statusEl.className = 'sync-url-status sync-loading';

    // CORS-Proxy nötig für externe URLs
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

    fetch(proxyUrl)
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function(text) {
        var count = Model.syncFromICS(text);
        self._updateSyncStatus();
        self.renderAll();
      })
      .catch(function(err) {
        console.warn('Sync fehlgeschlagen:', err);
        statusEl.textContent = 'Sync fehlgeschlagen — prüfe die URL';
        statusEl.className = 'sync-url-status sync-error';
      });
  },

  _importFile(file) {
    var self = this;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var text = ev.target.result;
      var events = Model.parseICS(text);
      if (events.length === 0) {
        View.el('syncUrlStatus').textContent = 'Keine Termine in der Datei gefunden.';
        return;
      }
      var count = Model.importICSEvents(events);
      View.el('syncUrlStatus').textContent = count + ' Termin(e) als Aufgaben importiert.';
      self._updateSyncStatus();
      self.renderAll();
    };
    reader.readAsText(file);
  },

  // ── Kalender Navigation ──

  _bindCalendarNav() {
    View.el('calPrev').addEventListener('click', () => {
      this.calMonth--;
      if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
      this._renderCalendar();
    });

    View.el('calNext').addEventListener('click', () => {
      this.calMonth++;
      if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
      this._renderCalendar();
    });
  },

  _renderCalendar() {
    View.renderCalendar(
      this.calYear,
      this.calMonth,
      Model.getTasksByDate(),
      Model.todayStr(),
      this.selectedDate
    );
    this._bindCalendarDayEvents();
  },

  _bindCalendarDayEvents() {
    document.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const dateStr = dayEl.dataset.date;
        if (this.selectedDate === dateStr) {
          this.selectedDate = null;
        } else {
          this.selectedDate = dateStr;
          View.el('todoDate').value = dateStr;
        }
        this._renderCalendar();
        const todos = Model.getFilteredTodos(this.currentFilter, this.selectedDate);
        View.renderTodos(todos, this.selectedDate);
        this._bindTodoItemEvents();
      });
    });
  },

  // ── Standarddatum ──

  _setDefaultDate() {
    View.el('todoDate').value = Model.todayStr();
  },

  // ── Planer ──

  activeTab: 0,

  _initStudienplan() {
    var self = this;

    View.el('studienplanBtn').addEventListener('click', function() {
      self._openPlaner();
    });

    View.el('studienplanClose').addEventListener('click', function() {
      View.hideStudienplan();
    });

    View.el('studienplanOverlay').addEventListener('click', function(e) {
      if (e.target === View.el('studienplanOverlay')) {
        View.hideStudienplan();
      }
    });

    // Modus-Auswahl Buttons
    document.querySelectorAll('.planer-mode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = btn.dataset.mode;
        Model.setPlanerMode(mode);
        self.activeTab = 0;
        self._renderPlaner();
      });
    });

    // Modus ändern
    View.el('planerReset').addEventListener('click', function() {
      self._showConfirm('Modus ändern? Alle bisherigen Daten werden gelöscht.', function() {
        Model.resetPlaner();
        View.el('studienplanBody').innerHTML = '';
        View.el('planerTitle').textContent = 'Planer';
        View.el('studienplanSummary').textContent = '';
        self.activeTab = 0;
        View.showPlanerModeSelect();
      });
    });

    // Zeitraum hinzufügen
    View.el('planerAddPeriod').addEventListener('click', function() {
      var data = Model.addPeriod();
      self.activeTab = data.length - 1;
      self._renderPlaner();
    });
  },

  _openPlaner() {
    var mode = Model.getPlanerMode();
    if (mode) {
      this._renderPlaner();
    } else {
      View.showPlanerModeSelect();
    }
    View.showStudienplan();
  },

  _renderPlaner() {
    var self = this;
    var mode = Model.getPlanerMode();
    if (!mode) { View.showPlanerModeSelect(); return; }

    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.bachelor;
    var data = Model.getPlanerData();
    var grades = Model.getGrades();

    // Clamp active tab
    if (self.activeTab >= data.length) self.activeTab = Math.max(0, data.length - 1);

    View.showPlanerContent(mode);
    View.renderPlanerTabs(data, self.activeTab, mode);
    View.renderPlaner(data, grades, mode, self.activeTab);
    View.renderPlanerStats(Model.getPlanerStats(), mode);

    // ── Tab clicks ──
    document.querySelectorAll('.sp-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        self.activeTab = parseInt(tab.dataset.tabIdx);
        self._renderPlaner();
      });
    });

    // ── Common events ──

    // Edit name/prof fields
    document.querySelectorAll('.sp-card-name, .sp-card-sub').forEach(function(input) {
      input.addEventListener('change', function() {
        Model.updateModule(parseInt(input.dataset.period), parseInt(input.dataset.mod), input.dataset.field, input.value);
      });
    });

    // Delete module
    document.querySelectorAll('.sp-card-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Model.deleteModule(parseInt(btn.dataset.period), parseInt(btn.dataset.mod));
        self._renderPlaner();
      });
    });

    // Delete period
    document.querySelectorAll('.sp-period-del-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self._showConfirm(config.periodLabel + ' löschen?', function() {
          Model.deletePeriod(parseInt(btn.dataset.periodDel));
          self._renderPlaner();
        });
      });
    });

    // Add module
    document.querySelectorAll('.sp-add-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Model.addModule(parseInt(btn.dataset.addMod));
        self._renderPlaner();
      });
    });

    if (config.isSchule) {
      // ── SCHUL: Quick-add grade buttons ──
      document.querySelectorAll('.sp-qa-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var wrap = btn.closest('.sp-quick-add');
          var pi = parseInt(wrap.dataset.period);
          var mi = parseInt(wrap.dataset.mod);
          var type = wrap.dataset.type;
          var grade = parseInt(btn.dataset.grade);
          Model.addSchulNote(pi, mi, type, grade);
          self._renderPlaner();
        });
      });

      // Noten-Pills klicken zum Löschen
      document.querySelectorAll('.sp-pill').forEach(function(pill) {
        pill.addEventListener('click', function() {
          var pi = parseInt(pill.dataset.period);
          var mi = parseInt(pill.dataset.mod);
          var type = pill.dataset.type;
          var ni = parseInt(pill.dataset.noteIdx);
          Model.removeSchulNote(pi, mi, type, ni);
          self._renderPlaner();
        });
      });

    } else {
      // ── UNI: Grade edit, status cycle, ECTS/Pruefung edits ──

      // Status cycle button
      document.querySelectorAll('.sp-status-cycle').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var moduleId = btn.dataset.module;
          var current = btn.dataset.current;
          var next = current === 'offen' ? 'bestanden' : (current === 'bestanden' ? 'nicht-bestanden' : 'offen');
          var gradeInput = document.querySelector('.sp-grade-edit[data-module="' + moduleId + '"]');
          var grade = gradeInput ? gradeInput.value : '';
          Model.saveGrade(moduleId, grade, next);
          self._renderPlaner();
        });
      });

      // Grade input
      document.querySelectorAll('.sp-grade-edit').forEach(function(input) {
        input.addEventListener('change', function() {
          var moduleId = input.dataset.module;
          var statusBtn = document.querySelector('.sp-status-cycle[data-module="' + moduleId + '"]');
          var status = statusBtn ? statusBtn.dataset.current : 'offen';
          Model.saveGrade(moduleId, input.value, status);
          self._renderPlaner();
        });
      });

      // ECTS, Pruefung edits
      document.querySelectorAll('.sp-ects-edit, .sp-pruef-edit').forEach(function(input) {
        input.addEventListener('change', function() {
          var pi = parseInt(input.dataset.period);
          var mi = parseInt(input.dataset.mod);
          var field = input.dataset.field;
          var val = field === 'points' ? parseInt(input.value) || 5 : input.value;
          Model.updateModule(pi, mi, field, val);
          self._renderPlaner();
        });
      });
    }
  },

  _refreshPlaner() {
    this._renderPlaner();
  },

  // ── Confirm Modal (confirm() funktioniert nicht in Extensions) ──

  _confirmCallback: null,

  _showConfirm: function(text, onOk) {
    var self = this;
    var overlay = View.el('confirmOverlay');
    View.el('confirmText').textContent = text;
    overlay.classList.remove('sync-hidden');
    overlay.classList.add('visible');
    self._confirmCallback = onOk;

    // Event-Listener einmal binden (alte entfernen)
    var okBtn = View.el('confirmOk');
    var cancelBtn = View.el('confirmCancel');
    var newOk = okBtn.cloneNode(true);
    var newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newOk.addEventListener('click', function() {
      overlay.classList.remove('visible');
      overlay.classList.add('sync-hidden');
      if (self._confirmCallback) self._confirmCallback();
      self._confirmCallback = null;
    });

    newCancel.addEventListener('click', function() {
      overlay.classList.remove('visible');
      overlay.classList.add('sync-hidden');
      self._confirmCallback = null;
    });
  },
};







































