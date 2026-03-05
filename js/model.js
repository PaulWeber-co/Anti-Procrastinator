/**
 * MODEL — Datenlogik & localStorage-Persistenz
 */
const Model = {
  STORAGE_KEYS: {
    todos: 'ht_todos',
    theme: 'ht_theme',
    weather: 'ht_weather',
    weatherTime: 'ht_weather_time',
  },

  // ── To-Do Daten ──

  getTodos() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.todos) || '[]');
  },

  saveTodos(todos) {
    localStorage.setItem(this.STORAGE_KEYS.todos, JSON.stringify(todos));
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

  getCategoryData() {
    const todos = this.getTodos();
    const counts = { arbeit: 0, persoenlich: 0, gesundheit: 0, lernen: 0 };
    todos.forEach(t => {
      if (counts.hasOwnProperty(t.category)) counts[t.category]++;
    });
    return counts;
  },

  getTasksByDate() {
    const todos = this.getTodos();
    const map = {};
    todos.forEach(t => {
      if (t.date) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });
    return map;
  },

  // ── Theme ──

  getTheme() {
    return localStorage.getItem(this.STORAGE_KEYS.theme) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(this.STORAGE_KEYS.theme, theme);
  },

  // ── Wetter (Cache) ──

  getCachedWeather() {
    const cached = localStorage.getItem(this.STORAGE_KEYS.weather);
    const cachedTime = localStorage.getItem(this.STORAGE_KEYS.weatherTime);
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 1800000) {
      return JSON.parse(cached);
    }
    return null;
  },

  cacheWeather(data) {
    localStorage.setItem(this.STORAGE_KEYS.weather, JSON.stringify(data));
    localStorage.setItem(this.STORAGE_KEYS.weatherTime, Date.now().toString());
  },

  // ── Hilfsfunktionen ──

  todayStr() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  },

  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },
};

