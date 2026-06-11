package com.rayshopee.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_actions")
data class PendingActionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val actionType: String, // "UPDATE_PRICE", "UPDATE_STOCK", "UPDATE_COST"
    val itemId: String,
    val variationId: String,
    val value: Double, // Can hold Double for Price/Cost, or Int (cast to Double) for Stock
    val createdAt: Long = System.currentTimeMillis()
)
