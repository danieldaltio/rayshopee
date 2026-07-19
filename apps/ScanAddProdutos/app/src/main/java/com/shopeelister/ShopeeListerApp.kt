package com.shopeelister

import android.app.Application
import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.remote.gemini.GeminiService
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class ShopeeListerApp : Application() {

    @Inject lateinit var configStore: ConfigStore
    @Inject lateinit var geminiService: GeminiService

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        // Always sync Cloudinary credentials from BuildConfig to ConfigStore
        appScope.launch {
            val savedCloudName = configStore.cloudinaryCloudName.first()
            val buildCloudName = BuildConfig.CLOUDINARY_CLOUD_NAME

            if (buildCloudName.isNotBlank() && savedCloudName != buildCloudName) {
                android.util.Log.d("ShopeeListerApp", "Syncing Cloudinary credentials: $savedCloudName → $buildCloudName")
                configStore.saveCloudinaryCredentials(
                    buildCloudName,
                    BuildConfig.CLOUDINARY_API_KEY,
                    BuildConfig.CLOUDINARY_API_SECRET
                )
            }
        }

        // Initialize GeminiService (gemini-2.5-flash) — DataStore key has priority
        // over BuildConfig. Without this init, every AI button silently fails
        // because `model` stays null.
        appScope.launch {
            val savedKey = configStore.geminiKey.first()
            val buildKey = BuildConfig.GEMINI_API_KEY
            val finalKey = savedKey.ifBlank { buildKey }
            if (finalKey.isNotBlank()) {
                android.util.Log.d("ShopeeListerApp", "Initializing Gemini (saved=${savedKey.isNotBlank()}, buildConfig=${buildKey.isNotBlank()})")
                geminiService.init(finalKey)
            } else {
                android.util.Log.w("ShopeeListerApp", "Gemini key empty in both DataStore and BuildConfig — AI buttons will fail until you set it in Settings or local.properties")
            }
        }
    }
}