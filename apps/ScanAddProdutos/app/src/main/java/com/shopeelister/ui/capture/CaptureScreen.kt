package com.shopeelister.ui.capture

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.shopeelister.util.ImageUtils
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.shopeelister.ui.components.LoadingOverlay
import java.io.File

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CaptureScreen(
    ean: String,
    query: String = "",
    onDataReady: (ean: String, imagePath: String) -> Unit,
    onBack: () -> Unit,
    viewModel: CaptureViewModel = hiltViewModel()
) {
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)
    val state by viewModel.state.collectAsState()
    val product by viewModel.product.collectAsState()

    LaunchedEffect(Unit) {
        if (!cameraPermission.status.isGranted) {
            cameraPermission.launchPermissionRequest()
        }
    }

    // When product is ready, navigate
    LaunchedEffect(product) {
        product?.let {
            onDataReady(it.ean, state.photoPath)
        }
    }

    Box(Modifier.fillMaxSize()) {
        if (cameraPermission.status.isGranted) {
            CameraCaptureContent(
                ean = ean,
                query = query,
                onPhotoTaken = { bitmap, file ->
                    viewModel.onPhotoTaken(bitmap, file)
                    viewModel.searchProduct(name = query, ean = ean)
                },
                onBack = onBack
            )
        } else {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "Permissão de câmera necessária",
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }

        LoadingOverlay(
            visible = state.isLoading,
            message = if (ean.isNotBlank() && query.isNotBlank()) "Buscando: $query ($ean)..."
            else if (ean.isNotBlank()) "Buscando por EAN: $ean..."
            else if (query.isNotBlank()) "Buscando por: $query..."
            else "Identificando produto pela foto..."
        )

        state.error?.let { error ->
            Snackbar(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                Text(error)
            }
        }
    }
}

@OptIn(ExperimentalGetImage::class)
@Composable
private fun CameraCaptureContent(
    ean: String,
    query: String,
    onPhotoTaken: (Bitmap, File) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                    scaleType = PreviewView.ScaleType.FIT_CENTER
                }
                
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    
                    val preview = Preview.Builder()
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .build()
                        .also {
                            it.setSurfaceProvider(previewView.surfaceProvider)
                        }
                    
                    val capture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                        .setJpegQuality(95)
                        .build()
                    imageCapture = capture

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            capture
                        )
                    } catch (_: Exception) {}
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Camera guide overlay
        CameraGuideOverlay()

        // Back button
        IconButton(
            onClick = onBack,
            modifier = Modifier
                .padding(16.dp)
                .statusBarsPadding()
        ) {
            Icon(Icons.Default.ArrowBack, "Voltar", tint = MaterialTheme.colorScheme.onBackground)
        }

        // Info text
        if (ean.isNotBlank() || query.isNotBlank()) {
            val labels = mutableListOf<String>()
            if (ean.isNotBlank()) labels.add("EAN: $ean")
            if (query.isNotBlank()) labels.add("Busca: $query")
            val label = labels.joinToString(" | ")
            
            Text(
                text = label,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 64.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.primary)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                style = MaterialTheme.typography.labelLarge
            )
        }

        // Capture button
        IconButton(
            onClick = {
                val capture = imageCapture ?: return@IconButton
                val file = File(context.filesDir, "photo_${System.currentTimeMillis()}.jpg")
                val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()

                capture.takePicture(
                    outputOptions,
                    ContextCompat.getMainExecutor(context),
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                            val bitmap = ImageUtils.loadScaledBitmap(file.absolutePath)
                            if (bitmap != null) {
                                onPhotoTaken(bitmap, file)
                            }
                        }
                        override fun onError(exc: ImageCaptureException) {}
                    }
                )
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .size(72.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary)
        ) {
            Icon(
                Icons.Default.CameraAlt,
                "Capturar",
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
}

@Composable
private fun CameraGuideOverlay() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        val guideColor = Color.White.copy(alpha = 0.6f)
        
        Canvas(modifier = Modifier.fillMaxSize()) {
            val centerX = size.width / 2
            val centerY = size.height / 2
            val boxWidth = size.width * 0.85f
            val boxHeight = size.height * 0.6f
            
            // Guide rectangle (dashed)
            val left = centerX - boxWidth / 2
            val top = centerY - boxHeight / 2
            val right = centerX + boxWidth / 2
            val bottom = centerY + boxHeight / 2
            
            // Corner brackets
            val cornerLength = 40.dp.toPx()
            val strokeWidth = 3.dp.toPx()
            
            // Top-left corner
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(left, top), androidx.compose.ui.geometry.Offset(left + cornerLength, top), strokeWidth)
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(left, top), androidx.compose.ui.geometry.Offset(left, top + cornerLength), strokeWidth)
            
            // Top-right corner
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(right, top), androidx.compose.ui.geometry.Offset(right - cornerLength, top), strokeWidth)
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(right, top), androidx.compose.ui.geometry.Offset(right, top + cornerLength), strokeWidth)
            
            // Bottom-left corner
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(left, bottom), androidx.compose.ui.geometry.Offset(left + cornerLength, bottom), strokeWidth)
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(left, bottom), androidx.compose.ui.geometry.Offset(left, bottom - cornerLength), strokeWidth)
            
            // Bottom-right corner
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(right, bottom), androidx.compose.ui.geometry.Offset(right - cornerLength, bottom), strokeWidth)
            drawLine(guideColor, androidx.compose.ui.geometry.Offset(right, bottom), androidx.compose.ui.geometry.Offset(right, bottom - cornerLength), strokeWidth)
            
            // Rule of thirds - vertical lines
            val thirdX1 = left + boxWidth / 3
            val thirdX2 = right - boxWidth / 3
            drawLine(guideColor.copy(alpha = 0.3f), androidx.compose.ui.geometry.Offset(thirdX1, top), androidx.compose.ui.geometry.Offset(thirdX1, bottom), 1.dp.toPx())
            drawLine(guideColor.copy(alpha = 0.3f), androidx.compose.ui.geometry.Offset(thirdX2, top), androidx.compose.ui.geometry.Offset(thirdX2, bottom), 1.dp.toPx())
            
            // Rule of thirds - horizontal lines
            val thirdY1 = top + boxHeight / 3
            val thirdY2 = bottom - boxHeight / 3
            drawLine(guideColor.copy(alpha = 0.3f), androidx.compose.ui.geometry.Offset(left, thirdY1), androidx.compose.ui.geometry.Offset(right, thirdY1), 1.dp.toPx())
            drawLine(guideColor.copy(alpha = 0.3f), androidx.compose.ui.geometry.Offset(left, thirdY2), androidx.compose.ui.geometry.Offset(right, thirdY2), 1.dp.toPx())
            
            // Center crosshair
            val crossSize = 15.dp.toPx()
            drawLine(guideColor.copy(alpha = 0.4f), androidx.compose.ui.geometry.Offset(centerX - crossSize, centerY), androidx.compose.ui.geometry.Offset(centerX + crossSize, centerY), 1.5.dp.toPx())
            drawLine(guideColor.copy(alpha = 0.4f), androidx.compose.ui.geometry.Offset(centerX, centerY - crossSize), androidx.compose.ui.geometry.Offset(centerX, centerY + crossSize), 1.5.dp.toPx())
        }
        
        // Text hint
        Text(
            text = "Enquadre o produto dentro da área",
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 100.dp)
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color.Black.copy(alpha = 0.5f))
                .padding(horizontal = 16.dp, vertical = 8.dp),
            color = Color.White,
            style = MaterialTheme.typography.labelMedium
        )
    }
}
