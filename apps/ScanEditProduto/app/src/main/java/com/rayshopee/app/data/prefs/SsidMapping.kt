package com.rayshopee.app.data.prefs

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Mapeamento `SSID → URL` persistido em SharedPreferences.
 *
 * Resolve o problema clássico: o vendedor usa o app em casa, no trabalho, e no
 * café. Cada Wi-Fi tem um IP diferente pro servidor RayShopee (DHCP). Sem
 * mapping, ele precisa reconfigurar toda vez. Com mapping, o app **lembra**:
 *
 *  - VivoDM  → http://192.168.15.8:3003
 *  - Casa-2.4G → http://192.168.1.50:3003
 *  - Cafe_WiFi → http://10.0.0.100:3003
 *
 * ## Como funciona
 *
 *  1. Quando [com.rayshopee.core.network.NetworkDiscovery] acha um server na
 *     LAN, o ViewModel chama [autoSave] com o SSID atual + URL encontrada.
 *  2. Próxima vez que conectar nesse SSID, [resolveForCurrentSsid] retorna
 *     a URL salva ANTES do scan (instantâneo).
 *  3. User pode apagar/forget uma mapping via Settings.
 *
 * **Privacidade:** SSID fica no device, não sai dele. Sem servidor de
 * telemetria. Apaga quando user limpa dados do app.
 *
 * **Adicionado em 2026-07-18 (Sprint 1.5).**
 */
@Singleton
open class SsidMapping @Inject constructor(
    @ApplicationContext context: Context
) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _mappings = MutableStateFlow(loadAll())
    /** Todas as mappings `SSID → URL` (read-only flow). */
    val mappings: StateFlow<Map<String, String>> = _mappings.asStateFlow()

    /**
     * Retorna a URL salva pra um SSID, ou null se nunca foi mapeado.
     */
    fun urlFor(ssid: String?): String? {
        if (ssid.isNullOrBlank()) return null
        return _mappings.value[ssid]
    }

    /**
     * Salva (ou sobrescreve) a mapping `ssid → url`.
     * Ignora SSID vazio ou URL inválida.
     */
    fun save(ssid: String, url: String) {
        if (ssid.isBlank()) return
        val normalizedUrl = url.trim().removeSuffix("/")
        if (normalizedUrl.isBlank()) return
        prefs.edit().putString(ssid, normalizedUrl).apply()
        _mappings.value = loadAll()
    }

    /**
     * Apaga a mapping de um SSID.
     */
    fun forget(ssid: String) {
        if (ssid.isBlank()) return
        prefs.edit().remove(ssid).apply()
        _mappings.value = loadAll()
    }

    /**
     * Apaga TODAS as mappings.
     */
    fun clearAll() {
        prefs.edit().clear().apply()
        _mappings.value = emptyMap()
    }

    /**
     * Helper: auto-save baseado em descoberta (chamado pelo ViewModel quando
     * NetworkDiscovery acha um server). Faz nada se o URL já tá salvo.
     */
    fun autoSave(ssid: String?, url: String?) {
        if (ssid.isNullOrBlank() || url.isNullOrBlank()) return
        val normalizedUrl = url.trim().removeSuffix("/")
        if (urlFor(ssid) == normalizedUrl) return
        save(ssid, normalizedUrl)
    }

    private fun loadAll(): Map<String, String> {
        @Suppress("UNCHECKED_CAST")
        return (prefs.all as Map<String, Any?>)
            .filterValues { it is String && it.isNotBlank() }
            .mapValues { (it.value as String).trim().removeSuffix("/") }
    }

    companion object {
        private const val PREFS_NAME = "rayshopee_ssid_mappings"
    }
}
