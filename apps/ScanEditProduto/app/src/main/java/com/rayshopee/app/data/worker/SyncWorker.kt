package com.rayshopee.app.data.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.rayshopee.app.data.local.AppDatabase
import com.rayshopee.app.data.repository.ProductRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val db: AppDatabase,
    private val repository: ProductRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val pendingActions = db.productDao().getAllPendingActions()
            if (pendingActions.isEmpty()) {
                return Result.success()
            }

            var allSuccess = true
            for (action in pendingActions) {
                val result = when (action.actionType) {
                    "UPDATE_PRICE" -> repository.updatePrice(action.itemId, action.variationId, action.value)
                    "UPDATE_STOCK" -> repository.updateStock(action.itemId, action.variationId, action.value.toInt())
                    "UPDATE_COST" -> repository.updateCost(action.itemId, action.variationId, action.value)
                    else -> Result.failure(Exception("Unknown action type"))
                }

                if (result.isSuccess) {
                    db.productDao().deletePendingAction(action.id)
                } else {
                    allSuccess = false
                }
            }

            if (allSuccess) Result.success() else Result.retry()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
