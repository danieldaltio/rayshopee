package com.shopeelister.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkScheme = darkColorScheme(
    primary = ShopeeOrange,
    onPrimary = TextPrimary,
    primaryContainer = ShopeeOrangeDark,
    secondary = ShopeeOrangeLight,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceContainer,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    error = Error,
    outline = TextSecondary
)

@Composable
fun ShopeeListerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkScheme,
        typography = Typography,
        content = content
    )
}
