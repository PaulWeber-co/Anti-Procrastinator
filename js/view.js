/**
 * VIEW — DOM-Manipulation & Rendering
 */
const View = {
  CATEGORIES: {
    arbeit: 'Arbeit',
    persoenlich: 'Persönlich',
    gesundheit: 'Gesundheit',
    lernen: 'Lernen',
  },

  CATEGORY_COLORS: {
    arbeit: 'accent',
    persoenlich: 'purple',
    gesundheit: 'green',
    lernen: 'orange',
  },

  MONTH_NAMES: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],

  DAY_NAMES: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],

  charts: { line: null, donut: null },

  // ── Referenzen ──

  el(id) {
    return document.getElementById(id);
  },

  // ── Uhr ──

  updateClock() {
    const n = new Date();
    const timeOpts = { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOpts = { timeZone: 'Europe/Berlin', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.el('clock').textContent = n.toLocaleTimeString('de-DE', timeOpts);
    this.el('clockDate').textContent = n.toLocaleDateString('de-DE', dateOpts);
  },

  // ── Wetter ──

  displayWeather(data) {
    if (!data) {
      this.el('weatherTemp').textContent = '--';
      this.el('weatherDesc').textContent = 'Nicht verfügbar';
      this.el('weatherIcon').textContent = '--';
      return;
    }
    this.el('weatherTemp').textContent = data.temp + ' C';
    this.el('weatherDesc').textContent = data.desc + ' / ' + data.city;
    this.el('weatherIcon').textContent = data.temp + '\u00B0';
  },

  // ── Theme ──

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.el('themeToggle').textContent = theme === 'light' ? 'Dark' : 'Light';
  },

  // ── Stats ──

  renderStats(stats) {
    this.el('statTotal').textContent = stats.total;
    this.el('statDone').textContent = stats.done;
    this.el('statOpen').textContent = stats.open;
    this.el('statRate').textContent = stats.rate + '%';
    this.el('statPoints').textContent = stats.earnedPoints + ' / ' + stats.totalPoints;
  },

  // ── To-Do Liste ──

  renderTodos(todos, selectedDate) {
    const ul = this.el('todoList');

    if (todos.length === 0) {
      ul.innerHTML = '<div class="todo-empty"><div class="todo-empty-icon">--</div>Keine Aufgaben' +
        (selectedDate ? ' für diesen Tag' : '') + '</div>';
      return;
    }

    ul.innerHTML = todos.map(t => {
      const catLabel = this.CATEGORIES[t.category] || t.category;
      const dateLabel = t.date ? this._formatDateDE(t.date) : '';
      const pointsDots = this._renderPointsDots(t.points || 1);

      return '<li class="todo-item">' +
        '<div class="todo-checkbox ' + (t.completed ? 'checked' : '') + '" data-id="' + t.id + '"></div>' +
        '<div class="todo-content">' +
          '<div class="todo-text ' + (t.completed ? 'completed' : '') + '">' + this._escapeHtml(t.text) + '</div>' +
          '<div class="todo-meta">' +
            '<span class="todo-tag tag-' + t.category + '">' + catLabel + '</span>' +
            '<span class="todo-points">' + pointsDots + '</span>' +
            (dateLabel ? '<span class="todo-date-label">' + dateLabel + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<button class="todo-delete" data-id="' + t.id + '">x</button>' +
      '</li>';
    }).join('');
  },

  _renderPointsDots(points) {
    let dots = '';
    for (let i = 0; i < points; i++) {
      dots += '<span class="point-dot"></span>';
    }
    return dots;
  },

  // ── Kalender ──

  renderCalendar(year, month, tasksByDate, todayStr, selectedDate) {
    this.el('calMonthLabel').textContent = this.MONTH_NAMES[month] + ' ' + year;
    const grid = this.el('calendarGrid');
    grid.innerHTML = '';

    // Wochentag-Header
    this.DAY_NAMES.forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-day-header';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Vormonat
    for (let i = startWeekday - 1; i >= 0; i--) {
      grid.appendChild(this._createDayEl(daysInPrevMonth - i, true, null, [], false, false));
    }

    // Aktueller Monat
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const tasks = tasksByDate[dateStr] || [];
      grid.appendChild(this._createDayEl(d, false, dateStr, tasks, dateStr === todayStr, dateStr === selectedDate));
    }

    // Nächster Monat
    const totalCells = startWeekday + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      grid.appendChild(this._createDayEl(i, true, null, [], false, false));
    }
  },

  _createDayEl(day, isOther, dateStr, tasks, isToday, isSelected) {
    const el = document.createElement('div');
    el.className = 'calendar-day';
    if (isOther) el.classList.add('other-month');
    if (isToday) el.classList.add('today');
    if (isSelected) el.classList.add('selected');
    if (dateStr) el.setAttribute('data-date', dateStr);

    const num = document.createElement('span');
    num.textContent = day;
    el.appendChild(num);

    if (tasks.length > 0) {
      // Dots für kompakte Ansicht
      const dots = document.createElement('div');
      dots.className = 'calendar-dots';
      const uniqueCats = [...new Set(tasks.map(t => t.category))].slice(0, 4);
      uniqueCats.forEach(cat => {
        const dot = document.createElement('div');
        dot.className = 'calendar-dot dot-' + (cat || 'default');
        dots.appendChild(dot);
      });
      el.appendChild(dots);

      // Task-Liste für Expanded-Ansicht
      const taskList = document.createElement('div');
      taskList.className = 'cal-task-list';
      const maxShow = 3;
      tasks.slice(0, maxShow).forEach(t => {
        const taskEl = document.createElement('div');
        taskEl.className = 'cal-task cal-task-' + (t.category || 'default');
        if (t.completed) taskEl.classList.add('cal-task-done');
        taskEl.textContent = t.text;
        taskList.appendChild(taskEl);
      });
      if (tasks.length > maxShow) {
        const more = document.createElement('div');
        more.className = 'cal-task-more';
        more.textContent = '+' + (tasks.length - maxShow) + ' mehr';
        taskList.appendChild(more);
      }
      el.appendChild(taskList);
    }

    return el;
  },

  // ── Charts ──

  renderLineChart(weeklyData) {
    const colors = this._getChartColors();
    const ctx = this.el('lineChart').getContext('2d');

    if (this.charts.line) this.charts.line.destroy();

    this.charts.line = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weeklyData.labels,
        datasets: [
          {
            label: 'Abschlussrate',
            data: weeklyData.completionData,
            borderColor: colors.accent,
            backgroundColor: colors.accentLight,
            borderWidth: 2,
            pointBackgroundColor: colors.accent,
            pointBorderColor: colors.accent,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Story Points',
            data: weeklyData.pointsData,
            borderColor: colors.green,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: colors.green,
            pointBorderColor: colors.green,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: false,
            borderDash: [4, 3],
            yAxisID: 'y1',
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: colors.textSecondary,
              font: { family: 'Space Mono, monospace', size: 10 },
              boxWidth: 12,
              boxHeight: 2,
              padding: 12,
              usePointStyle: false,
            },
          },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.text,
            bodyColor: colors.textSecondary,
            borderColor: colors.border,
            borderWidth: 1,
            titleFont: { family: 'Space Mono, monospace', weight: '600' },
            bodyFont: { family: 'Space Grotesk, sans-serif' },
            padding: 10,
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) return ' ' + context.parsed.y + '% erledigt';
                return ' ' + context.parsed.y + ' Punkte';
              },
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            position: 'left',
            ticks: {
              color: colors.textSecondary,
              font: { family: 'Space Mono, monospace', size: 10 },
              callback: function(v) { return v + '%'; },
              stepSize: 25,
            },
            grid: { color: colors.grid, drawBorder: false },
            border: { display: false },
          },
          y1: {
            min: 0,
            position: 'right',
            ticks: {
              color: colors.textSecondary,
              font: { family: 'Space Mono, monospace', size: 10 },
              callback: function(v) { return v + 'pt'; },
              stepSize: 1,
            },
            grid: { display: false },
            border: { display: false },
          },
          x: {
            ticks: { color: colors.textSecondary, font: { family: 'Space Mono, monospace', size: 10 } },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  },

  renderDonutChart(categoryData) {
    const colors = this._getChartColors();
    const ctx = this.el('donutChart').getContext('2d');

    if (this.charts.donut) this.charts.donut.destroy();

    const hasData = Object.values(categoryData).some(v => v > 0);

    // Farben aus CSS-Variablen
    const s = getComputedStyle(document.documentElement);
    const donutColors = [
      s.getPropertyValue('--donut-1').trim(),
      s.getPropertyValue('--donut-2').trim(),
      s.getPropertyValue('--donut-3').trim(),
      s.getPropertyValue('--donut-4').trim(),
    ];

    this.charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Arbeit', 'Persönlich', 'Gesundheit', 'Lernen'],
        datasets: [{
          data: hasData ? Object.values(categoryData) : [1, 1, 1, 1],
          backgroundColor: donutColors,
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textSecondary,
              font: { family: 'Space Mono, monospace', size: 10 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.text,
            bodyColor: colors.textSecondary,
            borderColor: colors.border,
            borderWidth: 1,
            titleFont: { family: 'Space Mono, monospace', weight: '600' },
            bodyFont: { family: 'Space Grotesk, sans-serif' },
            padding: 10,
            callbacks: {
              label: function(context) {
                if (!hasData) return ' Keine Daten';
                return ' ' + context.parsed + ' Tasks';
              },
            },
          },
        },
      },
    });
  },

  _getChartColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      accent: s.getPropertyValue('--accent').trim(),
      green: s.getPropertyValue('--green').trim(),
      orange: s.getPropertyValue('--orange').trim(),
      purple: s.getPropertyValue('--purple').trim(),
      text: s.getPropertyValue('--text').trim(),
      textSecondary: s.getPropertyValue('--text-secondary').trim(),
      grid: s.getPropertyValue('--chart-grid').trim(),
      accentLight: s.getPropertyValue('--accent-light').trim(),
      border: s.getPropertyValue('--border').trim(),
      cardBg: s.getPropertyValue('--bg-card').trim(),
    };
  },

  // ── Filter aktiv setzen ──

  setActiveFilter(filterBtn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    filterBtn.classList.add('active');
  },

  // ── Hilfsfunktionen ──

  _formatDateDE(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  _escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  // ── Planer ──

  renderPlaner(data, grades, mode) {
    var body = this.el('studienplanBody');
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    var self = this;
    var html = '';
    var periodLabel = config.periodLabel;
    var isSchule = config.isSchule || false;

    data.forEach(function(period, idx) {
      var pStats = Model.getPeriodStats(idx);
      var isComplete = Model.isPeriodComplete(idx);
      var isOpen = !isComplete;

      var statusBadge = '';
      var statusClass = '';
      if (isComplete) {
        statusBadge = '<span class="sp-sem-badge sp-sem-badge-done">' + (pStats.avg !== null ? pStats.avg.toFixed(1) : '--') + '</span>';
        statusClass = ' sp-semester-done';
      } else if (pStats.completed > 0) {
        var info = pStats.completed + ' / ' + pStats.total;
        statusBadge = '<span class="sp-sem-badge sp-sem-badge-partial">' + info + '</span>';
        statusClass = ' sp-semester-partial';
      } else {
        statusBadge = '<span class="sp-sem-badge sp-sem-badge-open">' + (config.hasEcts ? pStats.total + ' ECTS' : pStats.total + ' Fächer') + '</span>';
      }

      html += '<div class="sp-semester' + statusClass + '" data-semester="' + idx + '">';
      html += '<div class="sp-semester-header" data-semester-toggle="' + idx + '">'
        + '<div class="sp-semester-header-left">'
          + '<span class="sp-chevron' + (isOpen ? ' sp-chevron-open' : '') + '"></span>'
          + '<span class="sp-semester-num">' + period.period + '</span>'
          + '<span class="sp-semester-label">' + periodLabel + ' ' + period.period + '</span>'
          + '<span class="sp-sem-ects">' + pStats.completed + ' / ' + pStats.total + (config.hasEcts ? ' ECTS' : ' Fächer') + '</span>'
        + '</div>'
        + '<div class="sp-semester-header-right">'
          + statusBadge
          + '<button class="sp-period-delete" data-period-del="' + idx + '" title="' + periodLabel + ' löschen">x</button>'
        + '</div>'
        + '</div>';

      html += '<div class="sp-semester-content' + (isOpen ? ' sp-content-open' : '') + '">';

      if (isSchule) {
        // ── SCHUL-MODUS: Fächer mit Notentypen ──
        html += '<div class="sp-schule-list">';
        period.modules.forEach(function(mod, mi) {
          var schnitt = Model.calcSchulFachSchnitt(mod);
          var schnittStr = schnitt !== null ? schnitt.toFixed(1) : '--';
          var schnittClass = '';
          if (schnitt !== null) {
            if (schnitt <= 2.5) schnittClass = ' sp-schnitt-gut';
            else if (schnitt <= 3.5) schnittClass = ' sp-schnitt-ok';
            else if (schnitt <= 4.5) schnittClass = ' sp-schnitt-warn';
            else schnittClass = ' sp-schnitt-schlecht';
          }

          html += '<div class="sp-fach-card">';
          html += '<div class="sp-fach-header">';
          html += '<div class="sp-fach-header-left">';
          html += '<input type="text" class="sp-fach-name-input" data-period="' + idx + '" data-mod="' + mi + '" data-field="name" value="' + self._escapeAttr(mod.name) + '">';
          html += '<input type="text" class="sp-fach-lehrer-input" data-period="' + idx + '" data-mod="' + mi + '" data-field="prof" value="' + self._escapeAttr(mod.prof || '') + '" placeholder="Lehrkraft">';
          html += '</div>';
          html += '<div class="sp-fach-header-right">';
          html += '<span class="sp-fach-schnitt' + schnittClass + '">' + schnittStr + '</span>';
          html += '<button class="sp-mod-delete" data-period="' + idx + '" data-mod="' + mi + '" title="Fach löschen">x</button>';
          html += '</div>';
          html += '</div>';

          // Notentypen
          html += '<div class="sp-noten-grid">';
          Model.SCHULE_NOTE_TYPES.forEach(function(type) {
            var noten = (mod.noten && mod.noten[type.key]) || [];
            var typeAvg = noten.length > 0 ? (noten.reduce(function(s,v){return s+v;},0) / noten.length).toFixed(1) : '--';

            html += '<div class="sp-noten-type">';
            html += '<div class="sp-noten-type-header">';
            html += '<span class="sp-noten-type-label">' + type.label + ' <span class="sp-noten-weight">(x' + type.weight + ')</span></span>';
            html += '<span class="sp-noten-type-avg">' + typeAvg + '</span>';
            html += '</div>';
            html += '<div class="sp-noten-chips">';

            noten.forEach(function(note, ni) {
              var noteClass = 'sp-note-chip';
              if (note <= 2) noteClass += ' sp-note-gut';
              else if (note <= 3) noteClass += ' sp-note-ok';
              else if (note <= 4) noteClass += ' sp-note-warn';
              else noteClass += ' sp-note-schlecht';
              html += '<span class="' + noteClass + '" data-period="' + idx + '" data-mod="' + mi + '" data-type="' + type.key + '" data-note-idx="' + ni + '">' + note + '</span>';
            });

            html += '<button class="sp-note-add-btn" data-period="' + idx + '" data-mod="' + mi + '" data-type="' + type.key + '" title="Note hinzufügen">+</button>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div>';

          html += '</div>';
        });
        html += '</div>';
      } else {
        // ── UNI-MODUS: Tabelle wie bisher ──
        html += '<table class="sp-table">';
        html += '<thead><tr>'
          + '<th class="sp-th-name">Modul</th>'
          + '<th class="sp-th-prof">Verantwortlich</th>'
          + (config.hasEcts ? '<th class="sp-th-ects">ECTS</th>' : '')
          + '<th class="sp-th-pruef">Prüfung</th>'
          + '<th class="sp-th-note">Note</th>'
          + '<th class="sp-th-status">Status</th>'
          + '<th class="sp-th-del"></th>'
          + '</tr></thead><tbody>';

        period.modules.forEach(function(mod, mi) {
          var entry = grades[mod.id] || {};
          var gradeVal = entry.grade || '';
          var status = entry.status || 'offen';
          var statusCls = 'sp-status-offen';
          if (status === 'bestanden') statusCls = 'sp-status-bestanden';
          else if (status === 'nicht-bestanden') statusCls = 'sp-status-nb';
          var rowClass = status === 'bestanden' ? ' sp-row-done' : '';
          var wabClass = mod.isWab ? ' sp-row-wab' : '';
          var wabLabel = mod.isWab ? '<span class="sp-wab-label">WAB</span>' : '';

          html += '<tr class="sp-module-row' + rowClass + wabClass + '">'
            + '<td class="sp-td-name">' + wabLabel + '<input type="text" class="sp-name-input' + (mod.isWab ? ' sp-name-wab' : '') + '" data-period="' + idx + '" data-mod="' + mi + '" data-field="name" value="' + self._escapeAttr(mod.name) + '"></td>'
            + '<td class="sp-td-prof"><input type="text" class="sp-prof-input" data-period="' + idx + '" data-mod="' + mi + '" data-field="prof" value="' + self._escapeAttr(mod.prof || '') + '" placeholder="--"></td>'
            + (config.hasEcts ? '<td class="sp-td-ects"><input type="number" class="sp-ects-input" data-period="' + idx + '" data-mod="' + mi + '" data-field="points" value="' + (mod.points || 5) + '" min="1" max="30"></td>' : '')
            + '<td class="sp-td-pruef"><input type="text" class="sp-pruef-input" data-period="' + idx + '" data-mod="' + mi + '" data-field="pruefung" value="' + self._escapeAttr(mod.pruefung || '') + '" placeholder="--"></td>'
            + '<td class="sp-td-note"><input type="number" class="sp-grade-input" data-module="' + mod.id + '" value="' + gradeVal + '" min="' + config.gradeMin + '" max="' + config.gradeMax + '" step="' + config.gradeStep + '" placeholder="--"></td>'
            + '<td class="sp-td-status"><select class="sp-status-select ' + statusCls + '" data-module="' + mod.id + '">'
              + '<option value="offen"' + (status === 'offen' ? ' selected' : '') + '>Offen</option>'
              + '<option value="bestanden"' + (status === 'bestanden' ? ' selected' : '') + '>Bestanden</option>'
              + '<option value="nicht-bestanden"' + (status === 'nicht-bestanden' ? ' selected' : '') + '>Nicht best.</option>'
            + '</select></td>'
            + '<td class="sp-td-del"><button class="sp-mod-delete" data-period="' + idx + '" data-mod="' + mi + '" title="Löschen">x</button></td>'
            + '</tr>';
        });

        html += '</tbody></table>';
      }

      html += '<button class="sp-add-module-btn" data-add-mod="' + idx + '">+ ' + (isSchule ? 'Fach' : 'Modul') + ' hinzufügen</button>';
      html += '</div></div>';
    });

    body.innerHTML = html;
  },

  renderPlanerStats(stats, mode) {
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    this.el('spAverage').textContent = stats.gradedPoints > 0 ? stats.average.toFixed(2) : '--';
    var pointsStr = stats.completedPoints + ' / ' + stats.totalPoints;
    this.el('spEctsComplete').textContent = pointsStr;
    var suffix = config.hasEcts ? ' ECTS' : (config.isSchule ? ' Fächer benotet' : ' Fächer');
    this.el('studienplanSummary').textContent = pointsStr + suffix;
    this.el('planerPointsLabel').textContent = config.pointsLabel;
    var pct = stats.totalPoints > 0 ? Math.round((stats.completedPoints / stats.totalPoints) * 100) : 0;
    this.el('spProgressFill').className = 'sp-progress-fill';
    this.el('spProgressFill').style.width = pct + '%';
  },

  showPlanerModeSelect() {
    this.el('planerModeSelect').classList.remove('sync-hidden');
    this.el('studienplanBody').classList.add('sync-hidden');
    this.el('planerFooter').classList.add('sync-hidden');
  },

  showPlanerContent(mode) {
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    this.el('planerTitle').textContent = config.label;
    this.el('planerModeSelect').classList.add('sync-hidden');
    this.el('studienplanBody').classList.remove('sync-hidden');
    this.el('planerFooter').classList.remove('sync-hidden');
  },

  showStudienplan() {
    this.el('studienplanOverlay').classList.add('visible');
  },

  hideStudienplan() {
    this.el('studienplanOverlay').classList.remove('visible');
  },
};



















