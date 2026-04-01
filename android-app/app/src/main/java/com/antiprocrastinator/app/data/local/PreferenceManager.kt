package com.antiprocrastinator.app.data.local

import android.content.Context
import android.content.SharedPreferences
import com.antiprocrastinator.app.data.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.time.LocalDate

class PreferenceManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("anti_procrastinator", Context.MODE_PRIVATE)
    private val gson = Gson()

    // ── To-Do Operations ──

    fun getTodos(): List<Todo> {
        val json = prefs.getString("todos", "[]") ?: "[]"
        return try {
            gson.fromJson(json, object : TypeToken<List<Todo>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    fun saveTodos(todos: List<Todo>) {
        prefs.edit().putString("todos", gson.toJson(todos)).apply()
    }

    // ── Theme ──

    fun isDarkMode(): Boolean = prefs.getBoolean("dark_mode", false)
    fun setDarkMode(dark: Boolean) = prefs.edit().putBoolean("dark_mode", dark).apply()

    // ── Planer ──

    fun getPlanerMode(): PlanerMode? {
        val mode = prefs.getString("planer_mode", null) ?: return null
        return try { PlanerMode.valueOf(mode) } catch (e: Exception) { null }
    }

    fun setPlanerMode(mode: PlanerMode?) {
        prefs.edit().putString("planer_mode", mode?.name).apply()
    }

    fun getPlanerData(): List<PlanerPeriod> {
        val json = prefs.getString("planer_data", "[]") ?: "[]"
        return try {
            gson.fromJson(json, object : TypeToken<List<PlanerPeriod>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    fun savePlanerData(data: List<PlanerPeriod>) {
        prefs.edit().putString("planer_data", gson.toJson(data)).apply()
    }

    // ── Weather Cache ──

    fun getCachedWeather(): WeatherData? {
        val json = prefs.getString("weather_cache", null) ?: return null
        val time = prefs.getLong("weather_cache_time", 0)
        if (System.currentTimeMillis() - time > 1800000) return null
        return try { gson.fromJson(json, WeatherData::class.java) } catch (e: Exception) { null }
    }

    fun cacheWeather(data: WeatherData) {
        prefs.edit()
            .putString("weather_cache", gson.toJson(data))
            .putLong("weather_cache_time", System.currentTimeMillis())
            .apply()
    }

    // ── Today Completed Count (für Haptik-Intensität) ──

    fun getTodayCompletedCount(): Int {
        val savedDate = prefs.getString("haptic_date", "")
        val today = LocalDate.now().toString()
        return if (savedDate == today) prefs.getInt("haptic_count", 0) else 0
    }

    fun incrementTodayCompleted() {
        val today = LocalDate.now().toString()
        val savedDate = prefs.getString("haptic_date", "")
        val count = if (savedDate == today) prefs.getInt("haptic_count", 0) else 0
        prefs.edit()
            .putString("haptic_date", today)
            .putInt("haptic_count", count + 1)
            .apply()
    }
}

