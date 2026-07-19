package com.rayshopee.app.data.prefs

import android.content.Context
import android.content.SharedPreferences
import com.rayshopee.core.network.NetworkPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementação de [NetworkPreferences] para ScanEditProduto usando SharedPreferences.
 *
 * Persiste a URL configurada pelo usuário (ex.: ngrok) em
 * `SharedPreferences("app_prefs", MODE_PRIVATE)` na chave `"base_url"` —
 * mesmo padrão usado pelo PedidosEditProduto
 * ([com.rayshopee.app.data.prefs.SharedPrefsNetworkPreferences] lá),
 * unificando os 3 apps RayShopee sob a mesma convenção.
 *
 * **Migração para :rayshopee-core:** esta classe substitui qualquer leitura/escrita
 * direta de SharedPrefs que o app fazia antes. O
 * [com.rayshopee.core.network.NetworkConfig] passa a ser o único ponto de acesso
 * à URL, e este impl é o "backend de persistência" que ele usa.
 *
 * **Por que `withContext(Dispatchers.IO)`?** SharedPrefs `commit()` é bloqueante e
 * `apply()` é fire-and-forget — ambos podem travar a thread se o arquivo for grande
 * ou se houver contenção. Como o contrato de [NetworkPreferences] é `suspend`,
 * despachar pra IO é o default seguro.
 *
 * **Thread-safety:** SharedPrefs é thread-safe internamente, e nosso acesso é
 * serializado via `withContext`. Sem necessidade de Mutex aqui.
 *
 * **Criado em:** 2026-07-02 (Sessão 4 — completar migração do ScanEditProduto
 * que ficou com MissingBinding de NetworkPreferences após Sessão 2).
 */
@Singleton
class SharedPrefsNetworkPreferences @Inject constructor(
    @ApplicationContext context: Context
) : NetworkPreferences {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    override suspend fun getUserUrls(): List<String> = withContext(Dispatchers.IO) {
        prefs.getString(KEY_BASE_URL, null)
            ?.split(",")
            ?.map { it.trim().removeSuffix("/") }
            ?.filter { it.isNotBlank() }
            ?: emptyList()
    }

    override suspend fun setUserUrls(urls: List<String>) = withContext(Dispatchers.IO) {
        val normalized = urls
            .map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
        val joined = normalized.joinToString(",")
        val current = prefs.getString(KEY_BASE_URL, null)
        if (joined.isBlank()) {
            // Apagar — só escreve se já tinha valor (evita no-op write no disco).
            if (current != null) prefs.edit().remove(KEY_BASE_URL).apply()
        } else {
            // Escrever — só se mudou (evita re-escrita desnecessária).
            if (current != joined) prefs.edit().putString(KEY_BASE_URL, joined).apply()
        }
        Unit
    }

    companion object {
        // Mesmo padrão do PedidosEditProduto — unifica os 3 apps RayShopee.
        private const val PREFS_NAME = "app_prefs"
        private const val KEY_BASE_URL = "base_url"
    }
}