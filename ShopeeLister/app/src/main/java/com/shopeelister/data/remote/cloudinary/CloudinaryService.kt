package com.shopeelister.data.remote.cloudinary

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.shopeelister.data.local.ConfigStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * CloudinaryService — Background removal via Cloudinary signed upload.
 *
 * Uses Cloudinary's Upload API directly with a signed request (SHA-1).
 * The signature is generated locally using the api_secret from ConfigStore.
 * No backend proxy needed — the upload goes straight to Cloudinary.
 *
 * Flow:
 *  1. Generate SHA-1 signature from params + api_secret
 *  2. POST multipart/form-data to https://api.cloudinary.com/v1_1/{cloud}/image/upload
 *     with background_removal=cloudinary_ai
 *  3. The returned secure_url already has the background removed
 *  4. Download the processed image as Bitmap
 */
@Singleton
class CloudinaryService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val configStore: ConfigStore
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(120, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .build()

    // Kept for compatibility with ShopeeListerApp
    internal fun init(cloudName: String, apiKey: String, apiSecret: String) {
        android.util.Log.d(TAG, "init() called — credentials stored in ConfigStore")
    }

    /**
     * Remove background from [bitmap] using Cloudinary's AI.
     * Returns the processed Bitmap with transparent background, or null on failure.
     */
    suspend fun removeBackground(bitmap: Bitmap): Bitmap? = withContext(Dispatchers.IO) {
        try {
            // Read credentials from ConfigStore
            val cloudName = configStore.cloudinaryCloudName.first()
            val apiKey = configStore.cloudinaryApiKey.first()
            val apiSecret = configStore.cloudinaryApiSecret.first()

            android.util.Log.d(TAG, "Credentials — cloud=$cloudName, key=${apiKey.take(6)}...")

            if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
                android.util.Log.e(TAG, "Cloudinary credentials not configured! Go to Settings.")
                return@withContext null
            }

            // Convert bitmap to PNG bytes
            val imageBytes = bitmapToBytes(bitmap)
            android.util.Log.d(TAG, "Image size: ${imageBytes.size} bytes (${bitmap.width}x${bitmap.height})")

            // Generate signed upload parameters
            val timestamp = (System.currentTimeMillis() / 1000).toString()
            val folder = "shopeelister-bg"

            // Parameters that must be signed (sorted alphabetically)
            val paramsToSign = sortedMapOf(
                "background_removal" to "cloudinary_ai",
                "folder" to folder,
                "timestamp" to timestamp
            )

            val signature = generateSignature(paramsToSign, apiSecret)
            android.util.Log.d(TAG, "Signature generated: ${signature.take(12)}...")

            // Build multipart upload request
            val uploadUrl = "https://api.cloudinary.com/v1_1/$cloudName/image/upload"

            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", "image.png",
                    imageBytes.toRequestBody("image/png".toMediaType()))
                .addFormDataPart("api_key", apiKey)
                .addFormDataPart("timestamp", timestamp)
                .addFormDataPart("signature", signature)
                .addFormDataPart("background_removal", "cloudinary_ai")
                .addFormDataPart("folder", folder)
                .build()

            val request = Request.Builder()
                .url(uploadUrl)
                .post(requestBody)
                .build()

            android.util.Log.d(TAG, "Uploading to Cloudinary...")

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()

            android.util.Log.d(TAG, "Upload response: ${response.code}")

            if (!response.isSuccessful || responseBody == null) {
                android.util.Log.e(TAG, "Upload failed: ${response.code} — ${responseBody?.take(300)}")
                return@withContext null
            }

            val json = JSONObject(responseBody)

            if (json.has("error")) {
                val errorMsg = json.getJSONObject("error").optString("message", "Unknown error")
                android.util.Log.e(TAG, "Cloudinary error: $errorMsg")
                return@withContext null
            }

            val secureUrl = json.optString("secure_url", "")
            val publicId = json.optString("public_id", "")
            val version = json.optString("version", "")
            android.util.Log.d(TAG, "Upload OK! public_id=$publicId")
            
            // Construct the transformation URL: e_background_removal
            // Example: https://res.cloudinary.com/dcudjmopb/image/upload/v12345/shopeelister-bg/abc.png
            // Target: https://res.cloudinary.com/dcudjmopb/image/upload/e_background_removal/v12345/shopeelister-bg/abc.png
            val transformedUrl = "https://res.cloudinary.com/$cloudName/image/upload/e_background_removal/v$version/$publicId.png"
            
            android.util.Log.d(TAG, "Transformed URL=$transformedUrl")

            // The image uploaded with background_removal=cloudinary_ai
            // is processed asynchronously by Cloudinary. The secure_url points
            // to the original image initially. We request the transformed URL,
            // which will block or return an error until ready.
            // Download it with retry (may take a few seconds to process)
            return@withContext downloadWithRetry(transformedUrl, maxRetries = 10, delayMs = 4000L)

        } catch (e: Exception) {
            android.util.Log.e(TAG, "removeBackground error: ${e.message}", e)
            null
        }
    }

    /**
     * Generate Cloudinary signature (SHA-1).
     * Params sorted alphabetically, joined as key=value&..., then api_secret appended.
     */
    private fun generateSignature(params: Map<String, String>, apiSecret: String): String {
        val stringToSign = params.entries
            .joinToString("&") { "${it.key}=${it.value}" } + apiSecret

        val md = MessageDigest.getInstance("SHA-1")
        val digest = md.digest(stringToSign.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    /**
     * Download image from [url] with retry logic.
     * Cloudinary's background_removal processing can take a few seconds.
     */
    private suspend fun downloadWithRetry(url: String, maxRetries: Int, delayMs: Long): Bitmap? {
        repeat(maxRetries) { attempt ->
            try {
                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val bytes = response.body?.bytes()
                    if (bytes != null && bytes.isNotEmpty()) {
                        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        if (bitmap != null) {
                            android.util.Log.d(TAG, "Downloaded on attempt ${attempt + 1}: ${bytes.size} bytes, ${bitmap.width}x${bitmap.height}")
                            return bitmap
                        }
                    }
                }

                android.util.Log.w(TAG, "Attempt ${attempt + 1}/$maxRetries failed (${response.code}). Retrying in ${delayMs}ms...")
            } catch (e: Exception) {
                android.util.Log.w(TAG, "Attempt ${attempt + 1}/$maxRetries error: ${e.message}")
            }

            if (attempt < maxRetries - 1) {
                kotlinx.coroutines.delay(delayMs)
            }
        }

        android.util.Log.e(TAG, "All $maxRetries download attempts failed.")
        return null
    }

    private fun bitmapToBytes(bitmap: Bitmap): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        return stream.toByteArray()
    }

    companion object {
        private const val TAG = "CloudinaryService"
    }
}