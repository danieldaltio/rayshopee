package com.rayshopee.app.util

import android.content.Context
import android.content.SharedPreferences
import android.media.AudioManager
import android.media.ToneGenerator
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Feedback sonoro (bip) para ações do app.
 *
 * Usa [ToneGenerator] — sem precisar de arquivos de áudio em `res/raw/`,
 * latência baixa (~50ms), zero footprint no APK.
 *
 * Tons escolhidos:
 *  - **scan**: TONE_PROP_BEEP — beep único curto (~100ms). Satisfatório.
 *  - **edit**: TONE_PROP_ACK — dois beeps (~250ms). "Ok, confirmadão".
 *  - **error**: TONE_PROP_NACK — tom longo. Distinguível no ruído.
 *
 * Estado `isMuted` é persistido em SharedPreferences — a preferência
 * sobrevive a restart do app. Exposto como [StateFlow] pra UI reagir.
 *
 * Erros de áudio (volume zerado, hardware ocupado) são silenciosamente
 * ignorados — o bip é cosmético, não pode quebrar o fluxo do app.
 */
@Singleton
open class BeepPlayer @Inject constructor(
    @ApplicationContext context: Context
) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _isMuted = MutableStateFlow(prefs.getBoolean(KEY_MUTED, false))
    /** `true` quando o usuário silenciou os bips. Persistido em disco. */
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    /** Bip de "scan de código de barras bem-sucedido". Curto, agudo. */
    fun playScan() {
        play(ToneGenerator.TONE_PROP_BEEP, 120)
    }

    /** Bip de "edição salva com sucesso" (preço, estoque, custo). Tom duplo. */
    fun playEdit() {
        play(ToneGenerator.TONE_PROP_ACK, 250)
    }

    /** Bip de "erro". Tom longo e grave. */
    fun playError() {
        play(ToneGenerator.TONE_PROP_NACK, 400)
    }

    /** Alterna o estado de mute e persiste. */
    fun toggleMuted() {
        setMuted(!_isMuted.value)
    }

    /** Define o estado de mute e persiste em SharedPreferences. */
    fun setMuted(muted: Boolean) {
        _isMuted.value = muted
        prefs.edit().putBoolean(KEY_MUTED, muted).apply()
    }

    private fun play(toneType: Int, durationMs: Int) {
        if (_isMuted.value) return
        try {
            // volume 80/100 — audível mas não agressivo
            ToneGenerator(AudioManager.STREAM_MUSIC, 80)
                .also { tg ->
                    tg.startTone(toneType, durationMs)
                    // Libera o recurso depois do tom tocar (não bloqueia a UI)
                    Thread {
                        Thread.sleep(durationMs + 50L)
                        tg.release()
                    }.start()
                }
        } catch (_: RuntimeException) {
            // ToneGenerator pode falhar em devices bugados — silencioso.
        }
    }

    companion object {
        private const val PREFS_NAME = "rayshopee_prefs"
        private const val KEY_MUTED = "beep_muted"
    }
}