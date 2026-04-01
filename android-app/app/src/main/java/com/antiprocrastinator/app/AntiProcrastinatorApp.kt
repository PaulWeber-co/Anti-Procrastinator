package com.antiprocrastinator.app

import android.app.Application
import com.antiprocrastinator.app.data.local.PreferenceManager

class AntiProcrastinatorApp : Application() {
    lateinit var preferenceManager: PreferenceManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferenceManager = PreferenceManager(this)
    }

    companion object {
        lateinit var instance: AntiProcrastinatorApp
            private set
    }
}

