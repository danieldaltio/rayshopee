package com.shopeelister.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.shopeelister.ui.capture.CaptureScreen
import com.shopeelister.ui.confirm.ConfirmScreen
import com.shopeelister.ui.editor.EditorScreen
import com.shopeelister.ui.home.HomeScreen
import com.shopeelister.ui.scanner.ScannerScreen
import com.shopeelister.ui.settings.SettingsScreen
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object Routes {
    const val HOME = "home"
    const val SCANNER = "scanner?query={query}"
    const val CAPTURE = "capture?ean={ean}&query={query}"
    const val EDITOR = "editor?ean={ean}&imagePath={imagePath}&query={query}"
    const val CONFIRM = "confirm"
    const val SETTINGS = "settings"

    fun scanner(query: String = "") = "scanner?query=$query"
    fun capture(ean: String = "", query: String = "") = "capture?ean=$ean&query=$query"
    fun editor(ean: String, imagePath: String = "", query: String = ""): String {
        val safeEan = if (ean.isBlank()) "none" else URLEncoder.encode(ean, StandardCharsets.UTF_8.toString())
        val safePath = if (imagePath.isBlank()) "none" else URLEncoder.encode(imagePath, StandardCharsets.UTF_8.toString())
        val safeQuery = if (query.isBlank()) "none" else URLEncoder.encode(query, StandardCharsets.UTF_8.toString())
        return "editor?ean=$safeEan&imagePath=$safePath&query=$safeQuery"
    }
}

@Composable
fun NavGraph() {
    val nav = rememberNavController()

    NavHost(navController = nav, startDestination = Routes.HOME) {
        composable(Routes.HOME) {
            HomeScreen(
                onScanBarcode = { query -> nav.navigate(Routes.scanner(query)) },
                onTakePhoto = { nav.navigate(Routes.capture()) },
                onTakePhotoWithQuery = { query -> nav.navigate(Routes.capture("", query)) },
                onSettings = { nav.navigate(Routes.SETTINGS) }
            )
        }

        composable(
            Routes.SCANNER,
            arguments = listOf(navArgument("query") { defaultValue = "" })
        ) { entry ->
            val query = entry.arguments?.getString("query") ?: ""
            ScannerScreen(
                onBarcodeScanned = { ean ->
                    nav.navigate(Routes.capture(ean, query)) {
                        popUpTo(Routes.SCANNER) { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() }
            )
        }

        composable(
            Routes.CAPTURE,
            arguments = listOf(
                navArgument("ean") { defaultValue = "" },
                navArgument("query") { defaultValue = "" }
            )
        ) { entry ->
            val ean = entry.arguments?.getString("ean") ?: ""
            val query = entry.arguments?.getString("query") ?: ""
            CaptureScreen(
                ean = ean,
                query = query,
                onDataReady = { resultEan, imagePath ->
                    nav.navigate(Routes.editor(resultEan, imagePath, query)) {
                        popUpTo(Routes.HOME)
                    }
                },
                onBack = { nav.popBackStack() }
            )
        }

        composable(
            Routes.EDITOR,
            arguments = listOf(
                navArgument("ean") { defaultValue = "none" },
                navArgument("imagePath") { defaultValue = "none" },
                navArgument("query") { defaultValue = "none" }
            )
        ) { entry ->
            val encodedEan = entry.arguments?.getString("ean") ?: "none"
            val encodedPath = entry.arguments?.getString("imagePath") ?: "none"
            val encodedQuery = entry.arguments?.getString("query") ?: "none"
            
            val ean = if (encodedEan == "none") "" else URLDecoder.decode(encodedEan, StandardCharsets.UTF_8.toString())
            val imagePath = if (encodedPath == "none") "" else URLDecoder.decode(encodedPath, StandardCharsets.UTF_8.toString())
            val query = if (encodedQuery == "none") "" else URLDecoder.decode(encodedQuery, StandardCharsets.UTF_8.toString())
            
            EditorScreen(
                ean = ean,
                imagePath = imagePath,
                query = query,
                onPublish = { nav.navigate(Routes.CONFIRM) },
                onBack = { nav.popBackStack() }
            )
        }

        composable(Routes.CONFIRM) {
            ConfirmScreen(
                onDone = {
                    nav.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() }
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(onBack = { nav.popBackStack() })
        }
    }
}
