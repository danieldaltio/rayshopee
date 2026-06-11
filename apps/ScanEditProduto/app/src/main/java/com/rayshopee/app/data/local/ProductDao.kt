package com.rayshopee.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface ProductDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity)

    @Query("SELECT * FROM products WHERE itemId = :itemId LIMIT 1")
    suspend fun getProductByItemId(itemId: String): ProductEntity?

    @Query("SELECT * FROM products WHERE barcode = :barcode LIMIT 1")
    suspend fun getProductByBarcode(barcode: String): ProductEntity?

    @Query("UPDATE products SET variations = :variationsJson WHERE itemId = :itemId")
    suspend fun updateProductVariations(itemId: String, variationsJson: String)

    // Pending Actions

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPendingAction(action: PendingActionEntity)

    @Query("SELECT * FROM pending_actions ORDER BY createdAt ASC")
    suspend fun getAllPendingActions(): List<PendingActionEntity>

    @Query("DELETE FROM pending_actions WHERE id = :actionId")
    suspend fun deletePendingAction(actionId: Long)
}
