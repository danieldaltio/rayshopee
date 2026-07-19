package com.rayshopee.app.data.repository

/**
 * Sinaliza que uma escrita (updatePrice/Stock/Cost) **falhou de rede** mas a
 * alteração foi **salva localmente** em `PendingActionEntity` e enfileirada
 * via `SyncWorker` pra sincronizar quando a conexão voltar.
 *
 * A UI deve tratar isso como soft-state ("salvo offline"), NÃO como erro —
 * o vendedor não pode pensar que perdeu a edição.
 *
 * O WorkManager, ao contrário, chama `updateX(fromQueue = true)` para
 * diferenciar e não criar pendência duplicada.
 */
class OfflineQueuedException(cause: Throwable) : Exception(
    "Update saved to local pending queue; will sync when connection returns",
    cause
)
