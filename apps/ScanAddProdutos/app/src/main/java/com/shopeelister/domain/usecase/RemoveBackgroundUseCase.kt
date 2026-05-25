package com.shopeelister.domain.usecase

import android.graphics.Bitmap
import com.shopeelister.data.remote.cloudinary.CloudinaryService
import javax.inject.Inject

class RemoveBackgroundUseCase @Inject constructor(
    private val cloudinaryService: CloudinaryService
) {
    suspend operator fun invoke(bitmap: Bitmap): Bitmap? {
        return try {
            cloudinaryService.removeBackground(bitmap)
        } catch (_: Exception) {
            null
        }
    }
}
