# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.mlkit.* <methods>;
}
-dontwarn com.google.mlkit.**