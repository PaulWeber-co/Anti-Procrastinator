package com.antiprocrastinator.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.antiprocrastinator.app.navigation.SwipeNavigation
import com.antiprocrastinator.app.ui.theme.AntiProcrastinatorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AntiProcrastinatorTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SwipeNavigation()
                }
            }
        }
    }
}

