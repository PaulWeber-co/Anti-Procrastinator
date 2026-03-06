/**
 * STORAGE — Abstraktionslayer für persistente Datenspeicherung.
 * Nutzt chrome.storage.local in Extensions (sync-fähig, persistent).
 * Fällt auf localStorage zurück in normalen Browsern.
 */
const Storage = {
  _isExtension: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,
  _cache: {},
  _ready: false,
  _readyCallbacks: [],

  /**
   * Muss beim App-Start aufgerufen werden.
   * Lädt alle Daten aus chrome.storage in den lokalen Cache.
   */
  init(callback) {
    if (this._isExtension) {
      var self = this;
      chrome.storage.local.get(null, function(items) {
        self._cache = items || {};
        self._ready = true;
        self._readyCallbacks.forEach(function(cb) { cb(); });
        self._readyCallbacks = [];
        if (callback) callback();
      });
    } else {
      this._ready = true;
      if (callback) callback();
    }
  },

  /**
   * Wert lesen (synchron aus Cache / localStorage).
   */
  get(key) {
    if (this._isExtension) {
      var val = this._cache[key];
      return val !== undefined ? val : null;
    }
    return localStorage.getItem(key);
  },

  /**
   * Wert speichern (synchron in Cache + async in chrome.storage).
   */
  set(key, value) {
    if (this._isExtension) {
      this._cache[key] = value;
      var obj = {};
      obj[key] = value;
      chrome.storage.local.set(obj);
    } else {
      localStorage.setItem(key, value);
    }
  },

  /**
   * Wert entfernen.
   */
  remove(key) {
    if (this._isExtension) {
      delete this._cache[key];
      chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  },
};

