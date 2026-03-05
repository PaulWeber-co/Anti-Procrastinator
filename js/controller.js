/**
 * CONTROLLER — Verbindet Model & View, Event-Handling
 */
const Controller = {
  currentFilter: 'all',
  selectedDate: null,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),

  // ── Initialisierung ──

  init() {
    this._initTheme();
    this._initClock();
    this._initWeather();
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
    View.renderLineChart(Model.getWeeklyData());
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
      // Charts muessen nach Theme-Wechsel neu gerendert werden
      View.renderLineChart(Model.getWeeklyData());
      View.renderDonutChart(Model.getCategoryData());
    });
  },

  // ── Uhr ──

  _initClock() {
    View.updateClock();
    setInterval(() => View.updateClock(), 1000);
  },

  // ── Wetter ──

  _initWeather() {
    const cached = Model.getCachedWeather();
    if (cached) {
      View.displayWeather(cached);
    } else {
      this._fetchWeather();
    }
  },

  async _fetchWeather() {
    try {
      // Zuerst IP-basierte Standortermittlung
      let city = 'Berlin';
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.city) city = geoData.city;
        }
      } catch (e) {
        // Fallback auf Berlin
      }

      const res = await fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=j1');
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      const current = data.current_condition[0];

      const weather = {
        temp: current.temp_C,
        desc: (current.lang_de && current.lang_de[0])
          ? current.lang_de[0].value
          : current.weatherDesc[0].value,
        city: city,
      };

      Model.cacheWeather(weather);
      View.displayWeather(weather);
    } catch (e) {
      View.displayWeather(null);
    }
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
};

