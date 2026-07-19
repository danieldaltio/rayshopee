# =========================================================================
# ScanEditProduto — ProGuard / R8 rules
# =========================================================================
# Adicionado em 2026-07-18 (P10 resolvido) — ativar isMinifyEnabled = true
# Cobre: Hilt, Retrofit + OkHttp, kotlinx-serialization, MLKit, CameraX, Room
#
# Validação após ativar:
#   ./gradlew assembleRelease
#   # instalar em device e rodar smoke test: scan + 3 updates (price/stock/cost)
# =========================================================================


# ---------- Atributos globais ----------
# Mantém anotações em runtime (Hilt, kotlinx-serialization, Retrofit, Room)
-keepattributes *Annotation*
# Mantém assinatura de generics (Retrofit usa)
-keepattributes Signature
# Mantém InnerClasses (Hilt generated)
-keepattributes InnerClasses
# Mantém informações de linha (stack trace útil em crash)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile


# =========================================================================
# Hilt / Dagger
# =========================================================================
# Hilt gera classes prefixed com Hilt_, não ofuscar
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.lifecycle.HiltViewModel { *; }
# Mantém entry points anotados
-keep @dagger.hilt.android.AndroidEntryPoint class * { *; }
-keep @dagger.hilt.android.HiltAndroidApp class * { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }
-keep @dagger.assisted.AssistedInject class * { *; }
# Hilt-Work
-keep class androidx.hilt.work.** { *; }
-keep @androidx.hilt.work.HiltWorker class * { *; }


# =========================================================================
# Retrofit + OkHttp
# =========================================================================
# Retrofit usa reflexão nos parâmetros de método
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
# OkHttp 5 — não ofusca
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**


# =========================================================================
# kotlinx-serialization
# =========================================================================
# Crítico: kotlinx-serialization usa o nome da propriedade para serializar.
# Ofuscação quebra o JSON.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
# Mantém a classe do serializer (gerado pelo plugin)
-keep,includedescriptorclasses class com.rayshopee.app.data.model.**$$serializer { *; }
-keepclassmembers class com.rayshopee.app.data.model.** {
    *** Companion;
}
-keepclasseswithmembers class com.rayshopee.app.data.model.** {
    kotlinx.serialization.KSerializer serializer(...);
}
# Anotações @Serializable
-keep @kotlinx.serialization.Serializable class * { *; }


# =========================================================================
# MLKit (Barcode Scanning)
# =========================================================================
# MLKit usa reflection em alguns lugares
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_barcode.** { *; }
-dontwarn com.google.mlkit.**
# Mantém métodos anotados (modelo carrega classes com reflection)
-keepclassmembers class * {
    @com.google.mlkit.* <methods>;
}


# =========================================================================
# CameraX
# =========================================================================
# CameraX não tem reflection agressiva, mas vamos garantir
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**


# =========================================================================
# Room
# =========================================================================
# Room gera impl XXX_Impl das DAOs/Database — manter
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }
-keepclassmembers @androidx.room.Entity class * { *; }
# Room runtime
-dontwarn androidx.room.paging.**


# =========================================================================
# :rayshopee-core
# =========================================================================
# Mantém o que o core expõe (interfaces + DTOs compartilhados)
-keep class com.rayshopee.core.network.** { *; }
-keep class com.rayshopee.core.network.NetworkPreferences { *; }


# =========================================================================
# WorkManager + Hilt-Work
# =========================================================================
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.CoroutineWorker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }


# =========================================================================
# Hilt + KSP (mantém o que KSP gera)
# =========================================================================
-keep class **_Factory { *; }
-keep class **_HiltModules$* { *; }
-keep class **_HiltComponents$* { *; }
-keep class **_GeneratedInjector { *; }
-keep class Hilt_* { *; }
-keep class dagger.hilt.internal.aggregatedroot.codegen.** { *; }
-keep class dagger.hilt.internal.processedrootsentinel.** { *; }
-dontwarn dagger.hilt.internal.aggregatedroot.codegen.**


# =========================================================================
# Misc
# =========================================================================
# Enum values — kotlinx-serialization usa valueOf
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
# Suppress warning de classes não encontradas (referenciadas em manifest mas não em código)
-dontwarn com.rayshopee.app.R$*
