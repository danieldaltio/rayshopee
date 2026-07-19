package com.rayshopee.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.rayshopee.app.ui.screens.OrdersScreenRefactored
import com.rayshopee.app.ui.theme.RayShopeeTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RayShopeeTheme {
                OrdersScreenRefactored()
            }
        }
    }
}