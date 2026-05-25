package com.shopeelister

import android.app.Application
import com.shopeelister.data.local.ConfigStore
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
    }
}