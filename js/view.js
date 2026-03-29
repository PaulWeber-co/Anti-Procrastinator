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

  // ── Referenzen ──

  el(id) {
    return document.getElementById(id);
  },

  // ── Uhr (Digital) ──

  updateClock() {
    const n = new Date();
    const timeOpts = { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOpts = { timeZone: 'Europe/Berlin', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.el('clock').textContent = n.toLocaleTimeString('de-DE', timeOpts);
    this.el('clockDate').textContent = n.toLocaleDateString('de-DE', dateOpts);
  },

  // ── Uhr (Analog — Nothing Dot-Matrix) ──

  setClockMode(mode) {
    var digital = this.el('clockDigital');
    var canvas = this.el('analogClock');
    if (mode === 'analog') {
      digital.style.display = 'none';
      canvas.style.display = 'block';
      this.renderAnalogClock();
    } else {
      digital.style.display = '';
      canvas.style.display = 'none';
    }
  },

  renderAnalogClock() {
    var canvas = this.el('analogClock');
    if (!canvas || canvas.style.display === 'none') return;

    var size = Math.min(canvas.parentElement.clientWidth - 20, 180);
    if (size < 80) size = 140;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = (size + 28) * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = (size + 28) + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var s = getComputedStyle(document.documentElement);
    var textColor = s.getPropertyValue('--text').trim();
    var mutedColor = s.getPropertyValue('--text-muted').trim();
    var bgColor = s.getPropertyValue('--bg-card').trim();
    var dotBg = s.getPropertyValue('--dot-color').trim() || 'rgba(128,128,128,0.1)';

    var cx = size / 2;
    var cy = size / 2;
    var radius = (size / 2) - 8;

    ctx.clearRect(0, 0, size, size + 28);

    // Dot Grid Hintergrund (subtle)
    var dotSize = 3;
    var dotStep = 7;
    for (var gx = 0; gx < size; gx += dotStep) {
      for (var gy = 0; gy < size; gy += dotStep) {
        var dist = Math.sqrt((gx - cx) * (gx - cx) + (gy - cy) * (gy - cy));
        if (dist < radius + 4) {
          ctx.fillStyle = dotBg;
          ctx.fillRect(gx, gy, dotSize - 1, dotSize - 1);
        }
      }
    }

    // Ziffern als Dots (12 Positionen)
    for (var i = 1; i <= 12; i++) {
      var angle = (i * 30 - 90) * Math.PI / 180;
      var nx = cx + Math.cos(angle) * (radius - 2);
      var ny = cy + Math.sin(angle) * (radius - 2);
      var dotR = (i % 3 === 0) ? 4 : 2.5;
      ctx.fillStyle = (i % 3 === 0) ? textColor : mutedColor;
      ctx.fillRect(nx - dotR / 2, ny - dotR / 2, dotR, dotR);
    }

    // Aktuelle Zeit (Europe/Berlin)
    var now = new Date();
    var berlinStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var parts = berlinStr.split(':');
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);
    var seconds = parseInt(parts[2]);

    // Stundenzeiger (Dot-Linie)
    var hAngle = ((hours % 12) * 30 + minutes * 0.5 - 90) * Math.PI / 180;
    this._drawDotHand(ctx, cx, cy, hAngle, radius * 0.5, 4, textColor);

    // Minutenzeiger (Dot-Linie)
    var mAngle = (minutes * 6 + seconds * 0.1 - 90) * Math.PI / 180;
    this._drawDotHand(ctx, cx, cy, mAngle, radius * 0.72, 3, textColor);

    // Sekundenzeiger (dünne Dot-Linie)
    var sAngle = (seconds * 6 - 90) * Math.PI / 180;
    this._drawDotHand(ctx, cx, cy, sAngle, radius * 0.8, 2, mutedColor);

    // Mittelpunkt
    ctx.fillStyle = textColor;
    ctx.fillRect(cx - 3, cy - 3, 6, 6);

    // Datum unterhalb
    var dateStr = now.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: 'short' }).toUpperCase();
    ctx.font = '600 9px "Space Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, cx, size + 16);
  },

  _drawDotHand(ctx, cx, cy, angle, length, dotSize, color) {
    var step = dotSize + 2;
    var numDots = Math.floor(length / step);
    ctx.fillStyle = color;
    for (var d = 1; d <= numDots; d++) {
      var dist = d * step;
      var x = cx + Math.cos(angle) * dist;
      var y = cy + Math.sin(angle) * dist;
      var s = dotSize * (0.7 + 0.3 * (d / numDots));
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  },

  // ── Wetter ──

  WMO_ICONS: {
    0:  '.',     1:  '..',    2:  '.:',    3:  '::',
    45: '~~',    48: '~~',
    51: './',    53: '//',    55: '//',
    61: '//',    63: '///',   65: '///',
    71: '**',    73: '**',    75: '***',
    80: './',    81: '//',    82: '//!',
    85: '**',    86: '***',
    95: '!/',    96: '!//',   99: '!//',
  },

  DAY_ABBR: ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'],

  displayWeather(data) {
    if (!data) {
      this.el('weatherTempBig').textContent = '--°';
      this.el('weatherHi').textContent = 'H:--°';
      this.el('weatherLo').textContent = 'L:--°';
      this.el('weatherCity').textContent = 'Nicht verfügbar';
      this.el('weatherDesc').textContent = '--';
      this.el('weatherForecast').innerHTML = '';
      return;
    }

    this.el('weatherTempBig').textContent = data.temp + '°';
    this.el('weatherCity').textContent = data.city;
    this.el('weatherDesc').textContent = data.desc;

    if (data.dailyMax && data.dailyMin) {
      this.el('weatherHi').textContent = 'H:' + data.dailyMax[0] + '°';
      this.el('weatherLo').textContent = 'L:' + data.dailyMin[0] + '°';
    } else {
      this.el('weatherHi').textContent = 'H:--°';
      this.el('weatherLo').textContent = 'L:--°';
    }

    // 7-Tage-Vorhersage
    if (data.dailyMax && data.dailyMin && data.dailyCodes && data.dailyDates) {
      var forecastEl = this.el('weatherForecast');
      var today = new Date();
      var todayStr = today.toISOString().split('T')[0];
      var html = '';

      for (var i = 0; i < data.dailyDates.length && i < 7; i++) {
        var d = new Date(data.dailyDates[i] + 'T00:00:00');
        var dayLabel = this.DAY_ABBR[d.getDay()];
        var icon = this.WMO_ICONS[data.dailyCodes[i]] || '::';
        var isToday = data.dailyDates[i] === todayStr;

        html += '<div class="weather-forecast-day' + (isToday ? ' today' : '') + '">';
        html += '<span class="weather-day-label">' + dayLabel + '</span>';
        html += '<span class="weather-day-icon">' + icon + '</span>';
        html += '<span class="weather-day-temp">' + data.dailyMax[i] + '°</span>';
        html += '<span class="weather-day-range">' + data.dailyMin[i] + '°</span>';
        html += '</div>';
      }

      forecastEl.innerHTML = html;
    }
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
  },

  // ── Daily Quote ──

  displayQuote(quote) {
    if (!quote) return;
    this.el('quoteText').textContent = '„' + quote.text + '"';
    this.el('quoteAuthor').textContent = '— ' + quote.author;
  },

  // ── Pomodoro ──

  renderPomodoro(state) {
    var timeEl = this.el('pomoTime');
    var labelEl = this.el('pomoLabel');
    var modeEl = this.el('pomoModeIndicator');
    var sessionsEl = this.el('pomoSessions');
    var totalMinEl = this.el('pomoTotalMin');
    var dotsEl = this.el('pomoDots');

    // Format time
    var mins = Math.floor(state.remaining / 60);
    var secs = state.remaining % 60;
    timeEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    // Mode label
    if (state.mode === 'work') {
      modeEl.textContent = 'FOCUS';
      modeEl.className = 'pomo-mode-indicator pomo-mode-work';
      labelEl.textContent = state.running ? 'Fokus-Zeit...' : 'Bereit';
    } else if (state.mode === 'break') {
      modeEl.textContent = 'PAUSE';
      modeEl.className = 'pomo-mode-indicator pomo-mode-break';
      labelEl.textContent = state.running ? 'Kurze Pause...' : 'Pause bereit';
    } else {
      modeEl.textContent = 'LANG';
      modeEl.className = 'pomo-mode-indicator pomo-mode-long';
      labelEl.textContent = state.running ? 'Lange Pause...' : 'Lange Pause bereit';
    }

    // Stats
    sessionsEl.textContent = state.sessions;
    totalMinEl.textContent = state.totalMinutes;

    // Session dots (max 8)
    var dotsHtml = '';
    for (var i = 0; i < 8; i++) {
      dotsHtml += '<span class="pomo-session-dot' + (i < state.sessions ? ' pomo-dot-filled' : '') + '"></span>';
    }
    dotsEl.innerHTML = dotsHtml;

    // Render ring
    this._renderPomoRing(state);
  },

  _renderPomoRing(state) {
    var canvas = this.el('pomoRing');
    if (!canvas) return;
    var size = 120;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var s = getComputedStyle(document.documentElement);
    var textColor = s.getPropertyValue('--text').trim();
    var dotBg = s.getPropertyValue('--dot-color').trim() || 'rgba(128,128,128,0.1)';

    var cx = size / 2;
    var cy = size / 2;
    var radius = 50;
    var totalTime = state.mode === 'work' ? Model.POMO_WORK : (state.mode === 'break' ? Model.POMO_BREAK : Model.POMO_LONG_BREAK);
    var progress = 1 - (state.remaining / totalTime);
    var dotCount = 40;

    for (var i = 0; i < dotCount; i++) {
      var angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      var filled = (i / dotCount) <= progress;

      ctx.fillStyle = filled ? textColor : dotBg;
      ctx.globalAlpha = filled ? (0.5 + 0.5 * progress) : 0.4;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
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

      return '<li class="todo-item">' +
        '<div class="todo-checkbox ' + (t.completed ? 'checked' : '') + '" data-id="' + t.id + '"></div>' +
        '<div class="todo-content">' +
          '<div class="todo-text ' + (t.completed ? 'completed' : '') + '">' + this._escapeHtml(t.text) + '</div>' +
          '<div class="todo-meta">' +
            '<span class="todo-tag tag-' + t.category + '">' + catLabel + '</span>' +
            (dateLabel ? '<span class="todo-date-label">' + dateLabel + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<button class="todo-delete" data-id="' + t.id + '">x</button>' +
      '</li>';
    }).join('');
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

  // ── Charts (Dot-Matrix Canvas) ──

  DOT_SIZE: 4,
  DOT_GAP: 2,

  /**
   * Setup HiDPI canvas
   */
  _setupCanvas(canvas) {
    var container = canvas.parentElement;
    var w = container.clientWidth;
    var h = container.clientHeight;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  },

  /**
   * Dot-Matrix Area Chart (replaces Chart.js line chart)
   */
  renderLineChart(weeklyData) {
    var canvas = this.el('lineChart');
    if (!canvas) return;
    var setup = this._setupCanvas(canvas);
    var ctx = setup.ctx;
    var W = setup.w;
    var H = setup.h;
    var ds = this.DOT_SIZE;
    var dg = this.DOT_GAP;
    var step = ds + dg;

    var s = getComputedStyle(document.documentElement);
    var textColor = s.getPropertyValue('--text').trim();
    var mutedColor = s.getPropertyValue('--text-muted').trim();
    var dotBg = s.getPropertyValue('--dot-color').trim() || 'rgba(255,255,255,0.06)';
    var bgColor = s.getPropertyValue('--bg-input').trim();

    // Draw background
    ctx.fillStyle = bgColor;
    _roundRect(ctx, 0, 0, W, H, 12);

    var labels = weeklyData.labels;
    var values = weeklyData.completionData;
    var count = values.length;
    if (count === 0) return;

    // Layout
    var padLeft = 36;
    var padRight = 12;
    var padTop = 30;
    var padBottom = 28;
    var chartW = W - padLeft - padRight;
    var chartH = H - padTop - padBottom;

    // Grid dimensions
    var cols = Math.floor(chartW / step);
    var rows = Math.floor(chartH / step);

    // Title / legend
    ctx.font = '600 9px "Space Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'left';
    ctx.fillText('ABSCHLUSSRATE', padLeft, 14);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    var maxVal = Math.max.apply(null, values);
    ctx.fillText(maxVal + '%', W - padRight, 14);

    // Y-axis labels
    ctx.font = '400 8px "Space Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'right';
    for (var yi = 0; yi <= 4; yi++) {
      var yPct = yi * 25;
      var yRow = rows - Math.round((yPct / 100) * rows);
      var yPos = padTop + yRow * step + ds / 2;
      ctx.fillText(yPct + '%', padLeft - 4, yPos + 3);
    }

    // Interpolate data to fill columns
    var colValues = [];
    for (var c = 0; c < cols; c++) {
      var dataIdx = (c / (cols - 1)) * (count - 1);
      var lo = Math.floor(dataIdx);
      var hi = Math.min(lo + 1, count - 1);
      var frac = dataIdx - lo;
      colValues.push(values[lo] + (values[hi] - values[lo]) * frac);
    }

    // Draw dot grid
    for (var r = 0; r < rows; r++) {
      for (var ci = 0; ci < cols; ci++) {
        var px = padLeft + ci * step;
        var py = padTop + r * step;
        var rowFromBottom = rows - 1 - r;
        var threshold = (colValues[ci] / 100) * (rows - 1);

        if (rowFromBottom <= threshold) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.7 + 0.3 * (1 - rowFromBottom / rows);
          ctx.fillRect(px, py, ds, ds);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = dotBg;
          ctx.fillRect(px, py, ds, ds);
        }
      }
    }

    // X-axis labels
    ctx.font = '400 8px "Space Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'center';
    for (var li = 0; li < labels.length; li++) {
      var lx = padLeft + (li / (labels.length - 1)) * (cols - 1) * step + ds / 2;
      ctx.fillText(labels[li], lx, H - 8);
    }
  },

  /**
   * Dot-Matrix Category Bars (replaces Chart.js donut)
   */
  renderDonutChart(categoryData) {
    var canvas = this.el('donutChart');
    if (!canvas) return;
    var setup = this._setupCanvas(canvas);
    var ctx = setup.ctx;
    var W = setup.w;
    var H = setup.h;
    var ds = this.DOT_SIZE;
    var dg = this.DOT_GAP;
    var step = ds + dg;

    var s = getComputedStyle(document.documentElement);
    var textColor = s.getPropertyValue('--text').trim();
    var mutedColor = s.getPropertyValue('--text-muted').trim();
    var dotBg = s.getPropertyValue('--dot-color').trim() || 'rgba(255,255,255,0.06)';
    var bgColor = s.getPropertyValue('--bg-input').trim();

    // Background
    ctx.fillStyle = bgColor;
    _roundRect(ctx, 0, 0, W, H, 12);

    var cats = [
      { key: 'arbeit',      label: 'ARBEIT',      val: categoryData.arbeit || 0 },
      { key: 'persoenlich',  label: 'PERSOENLICH', val: categoryData.persoenlich || 0 },
      { key: 'gesundheit',  label: 'GESUNDHEIT',  val: categoryData.gesundheit || 0 },
      { key: 'lernen',      label: 'LERNEN',      val: categoryData.lernen || 0 },
    ];

    var total = cats.reduce(function(s, c) { return s + c.val; }, 0);
    if (total === 0) total = 1;

    var padLeft = 90;
    var padRight = 40;
    var padTop = 28;
    var padBottom = 12;
    var barAreaW = W - padLeft - padRight;
    var barAreaH = H - padTop - padBottom;
    var maxCols = Math.floor(barAreaW / step);
    var barRows = 3;
    var catGap = Math.floor((barAreaH - cats.length * barRows * step) / (cats.length + 1));
    if (catGap < 4) catGap = 4;

    // Title
    ctx.font = '600 9px "Space Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'left';
    ctx.fillText('KATEGORIEN', 12, 16);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(total + ' TASKS', W - padRight, 16);

    // Draw bars
    cats.forEach(function(cat, i) {
      var barY = padTop + catGap + i * (barRows * step + catGap);
      var filledCols = Math.round((cat.val / total) * maxCols);
      if (cat.val > 0 && filledCols === 0) filledCols = 1;

      // Label
      ctx.font = '600 8px "Space Mono", monospace';
      ctx.fillStyle = mutedColor;
      ctx.textAlign = 'right';
      ctx.fillText(cat.label, padLeft - 8, barY + barRows * step / 2 + 3);

      // Count
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.fillText(cat.val.toString(), padLeft + maxCols * step + 6, barY + barRows * step / 2 + 4);

      // Dot bar
      for (var r = 0; r < barRows; r++) {
        for (var c = 0; c < maxCols; c++) {
          var dx = padLeft + c * step;
          var dy = barY + r * step;
          if (c < filledCols) {
            ctx.fillStyle = textColor;
            ctx.globalAlpha = 0.6 + 0.4 * (1 - c / maxCols);
            ctx.fillRect(dx, dy, ds, ds);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = dotBg;
            ctx.fillRect(dx, dy, ds, ds);
          }
        }
      }
    });
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

  /**
   * Renders the tab bar for periods/semesters
   */
  renderPlanerTabs(data, activeIdx, mode) {
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    var tabsEl = this.el('spTabs');
    var html = '';
    data.forEach(function(period, idx) {
      var pStats = Model.getPeriodStats(idx);
      var isComplete = Model.isPeriodComplete(idx);
      var tabClass = 'sp-tab';
      if (idx === activeIdx) tabClass += ' sp-tab-active';
      if (isComplete) tabClass += ' sp-tab-done';
      else if (pStats.completed > 0) tabClass += ' sp-tab-partial';

      var label = config.isSchule ? ('Kl. ' + period.period) : (period.period);
      html += '<button class="' + tabClass + '" data-tab-idx="' + idx + '">';
      html += '<span class="sp-tab-num">' + label + '</span>';
      if (isComplete) html += '<span class="sp-tab-check">✓</span>';
      html += '</button>';
    });
    tabsEl.innerHTML = html;
  },

  /**
   * Main render: renders content for the active period
   */
  renderPlaner(data, grades, mode, activeIdx) {
    var body = this.el('studienplanBody');
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    var self = this;
    var isSchule = config.isSchule || false;

    if (!data[activeIdx]) { body.innerHTML = '<div class="sp-empty">Kein Zeitraum ausgewählt</div>'; return; }
    var period = data[activeIdx];
    var pStats = Model.getPeriodStats(activeIdx);
    var idx = activeIdx;
    var html = '';

    // Period header with stats
    var periodLabel = config.isSchule ? ('Klasse ' + period.period) : (config.periodLabel + ' ' + period.period);
    html += '<div class="sp-period-head">';
    html += '<div class="sp-period-head-left">';
    html += '<span class="sp-period-title">' + periodLabel + '</span>';
    html += '<span class="sp-period-info">' + pStats.completed + ' / ' + pStats.total + (config.hasEcts ? ' ECTS' : ' Fächer');
    if (pStats.avg !== null) html += ' · Ø ' + pStats.avg.toFixed(1);
    html += '</span>';
    html += '</div>';
    html += '<button class="sp-period-del-btn" data-period-del="' + idx + '" title="Löschen">✕</button>';
    html += '</div>';

    if (isSchule) {
      // ═══ SCHUL-MODUS ═══
      html += '<div class="sp-cards">';
      if (period.modules.length === 0) {
        html += '<div class="sp-empty-hint">Noch keine Fächer eingetragen.<br>Klicke unten auf <strong>+ Fach hinzufügen</strong>, um deine Fächer anzulegen.</div>';
      }
      period.modules.forEach(function(mod, mi) {
        var schnitt = Model.calcSchulFachSchnitt(mod);
        var schnittStr = schnitt !== null ? schnitt.toFixed(1) : '--';
        var schnittClass = 'sp-grade-neutral';
        if (schnitt !== null) {
          if (schnitt <= 2.0) schnittClass = 'sp-grade-great';
          else if (schnitt <= 3.0) schnittClass = 'sp-grade-good';
          else if (schnitt <= 4.0) schnittClass = 'sp-grade-ok';
          else schnittClass = 'sp-grade-bad';
        }

        html += '<div class="sp-card">';
        html += '<div class="sp-card-top">';
        html += '<div class="sp-card-name-wrap">';
        html += '<input type="text" class="sp-card-name" data-period="' + idx + '" data-mod="' + mi + '" data-field="name" value="' + self._escapeAttr(mod.name) + '">';
        html += '<input type="text" class="sp-card-sub" data-period="' + idx + '" data-mod="' + mi + '" data-field="prof" value="' + self._escapeAttr(mod.prof || '') + '" placeholder="Lehrkraft">';
        html += '</div>';
        html += '<div class="sp-card-avg ' + schnittClass + '">' + schnittStr + '</div>';
        html += '<button class="sp-card-del" data-period="' + idx + '" data-mod="' + mi + '">✕</button>';
        html += '</div>';

        // Noten-Bereich
        Model.SCHULE_NOTE_TYPES.forEach(function(type) {
          var noten = (mod.noten && mod.noten[type.key]) || [];
          html += '<div class="sp-noten-row">';
          html += '<span class="sp-noten-label">' + type.shortLabel + ' <span class="sp-noten-weight-tag">×' + type.weight + '</span></span>';
          html += '<div class="sp-noten-pills">';
          noten.forEach(function(note, ni) {
            var pillClass = 'sp-pill';
            if (note <= 2) pillClass += ' sp-pill-gut';
            else if (note <= 3) pillClass += ' sp-pill-ok';
            else if (note <= 4) pillClass += ' sp-pill-warn';
            else pillClass += ' sp-pill-schlecht';
            html += '<span class="' + pillClass + '" data-period="' + idx + '" data-mod="' + mi + '" data-type="' + type.key + '" data-note-idx="' + ni + '">' + note + '</span>';
          });
          html += '</div>';
          html += '<div class="sp-quick-add" data-period="' + idx + '" data-mod="' + mi + '" data-type="' + type.key + '">';
          for (var g = 1; g <= 6; g++) {
            html += '<button class="sp-qa-btn" data-grade="' + g + '">' + g + '</button>';
          }
          html += '</div>';
          html += '</div>';
        });

        html += '</div>'; // .sp-card
      });
      html += '</div>'; // .sp-cards

    } else {
      // ═══ UNI / PROVADIS MODUS ═══
      html += '<div class="sp-cards">';
      if (period.modules.length === 0) {
        html += '<div class="sp-empty-hint">Noch keine Module eingetragen.<br>Klicke unten auf <strong>+ Modul hinzufügen</strong>, um deine Module anzulegen.</div>';
      }
      period.modules.forEach(function(mod, mi) {
        var entry = grades[mod.id] || {};
        var gradeVal = entry.grade || '';
        var status = entry.status || 'offen';
        var statusClass = 'sp-status-offen';
        var statusLabel = 'OFFEN';
        if (status === 'bestanden') { statusClass = 'sp-status-bestanden'; statusLabel = '✓ BESTANDEN'; }
        else if (status === 'nicht-bestanden') { statusClass = 'sp-status-nb'; statusLabel = '✗ NICHT BEST.'; }

        var cardClass = 'sp-card';
        if (status === 'bestanden') cardClass += ' sp-card-done';
        if (mod.isWab) cardClass += ' sp-card-wab';

        html += '<div class="' + cardClass + '">';
        html += '<div class="sp-card-top">';
        html += '<div class="sp-card-name-wrap">';
        if (mod.isWab) html += '<span class="sp-wab-tag">WAB</span>';
        html += '<input type="text" class="sp-card-name" data-period="' + idx + '" data-mod="' + mi + '" data-field="name" value="' + self._escapeAttr(mod.name) + '">';
        html += '<input type="text" class="sp-card-sub" data-period="' + idx + '" data-mod="' + mi + '" data-field="prof" value="' + self._escapeAttr(mod.prof || '') + '" placeholder="Dozent">';
        html += '</div>';
        html += '<button class="sp-card-del" data-period="' + idx + '" data-mod="' + mi + '">✕</button>';
        html += '</div>';

        html += '<div class="sp-card-meta">';
        if (config.hasEcts) {
          html += '<div class="sp-meta-item"><span class="sp-meta-label">ECTS</span><input type="number" class="sp-meta-input sp-ects-edit" data-period="' + idx + '" data-mod="' + mi + '" data-field="points" value="' + (mod.points || 5) + '" min="1" max="30"></div>';
        }
        html += '<div class="sp-meta-item"><span class="sp-meta-label">Prüfung</span><input type="text" class="sp-meta-input sp-pruef-edit" data-period="' + idx + '" data-mod="' + mi + '" data-field="pruefung" value="' + self._escapeAttr(mod.pruefung || '') + '" placeholder="--"></div>';
        html += '<div class="sp-meta-item"><span class="sp-meta-label">Note</span><input type="number" class="sp-meta-input sp-grade-edit" data-module="' + mod.id + '" value="' + gradeVal + '" min="' + config.gradeMin + '" max="' + config.gradeMax + '" step="' + config.gradeStep + '" placeholder="--"></div>';
        html += '</div>';

        // Status row with cycle button
        html += '<div class="sp-card-status-row">';
        html += '<button class="sp-status-cycle ' + statusClass + '" data-module="' + mod.id + '" data-current="' + status + '">' + statusLabel + '</button>';
        html += '</div>';

        html += '</div>'; // .sp-card
      });
      html += '</div>'; // .sp-cards
    }

    // Add module button
    html += '<button class="sp-add-btn" data-add-mod="' + idx + '">+ ' + (isSchule ? 'Fach' : 'Modul') + ' hinzufügen</button>';

    body.innerHTML = html;
  },

  renderPlanerStats(stats, mode) {
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    var avgEl = this.el('spAverage');
    var ectsEl = this.el('spEctsComplete');
    var summaryEl = this.el('studienplanSummary');
    var pointsLabelEl = this.el('planerPointsLabel');
    var progressEl = this.el('spProgressFill');

    if (avgEl) avgEl.textContent = stats.gradedPoints > 0 ? stats.average.toFixed(2) : '--';
    var pointsStr = stats.completedPoints + '/' + stats.totalPoints;
    if (ectsEl) ectsEl.textContent = pointsStr;
    var suffix = config.hasEcts ? ' ECTS' : (config.isSchule ? ' Fächer' : ' Fächer');
    if (summaryEl) summaryEl.textContent = pointsStr + suffix;
    if (pointsLabelEl) pointsLabelEl.textContent = config.hasEcts ? 'ECTS' : 'Fächer';
    var pct = stats.totalPoints > 0 ? Math.round((stats.completedPoints / stats.totalPoints) * 100) : 0;
    if (progressEl) { progressEl.style.width = pct + '%'; }
  },

  showPlanerModeSelect() {
    this.el('planerModeSelect').classList.remove('sync-hidden');
    this.el('studienplanBody').classList.add('sync-hidden');
    var tabsWrap = this.el('spTabsWrap');
    if (tabsWrap) tabsWrap.classList.add('sync-hidden');
  },

  showPlanerContent(mode) {
    var config = Model.PLANER_MODES[mode] || Model.PLANER_MODES.uni;
    this.el('planerTitle').textContent = config.label;
    this.el('planerModeSelect').classList.add('sync-hidden');
    this.el('studienplanBody').classList.remove('sync-hidden');
    var tabsWrap = this.el('spTabsWrap');
    if (tabsWrap) tabsWrap.classList.remove('sync-hidden');
  },

  showStudienplan() {
    this.el('studienplanOverlay').classList.add('visible');
  },

  hideStudienplan() {
    this.el('studienplanOverlay').classList.remove('visible');
  },
};

function _roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
