# ProGuard & R8 Configuration for RG Basket

# ==============================================================================
# Play Console Stack Trace & Line Numbers (Enables de-obfuscation with mapping.txt)
# ==============================================================================
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Preserve reflection, annotations, and generic signatures
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# ==============================================================================
# Capacitor Core & Plugin Reflection
# ==============================================================================
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Keep all classes that extend Capacitor Plugin and their public methods
-keep class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# Preserve Capacitor annotations and annotated plugin methods
-keep @interface com.getcapacitor.annotation.*
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.ActivityCallback public *;
    @com.getcapacitor.annotation.PermissionCallback public *;
}

# ==============================================================================
# WebView JavaScript Interface (MainActivity AndroidPrint)
# ==============================================================================
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.rgbasket.app.MainActivity$* { *; }
-keepclassmembers class com.rgbasket.app.MainActivity$* { *; }

# ==============================================================================
# Google Play Services, Firebase & Credentials
# ==============================================================================
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }
-keep class androidx.credentials.** { *; }

# ==============================================================================
# Cordova Compatibility (if used by Capacitor)
# ==============================================================================
-dontwarn org.apache.cordova.**
-keep class org.apache.cordova.** { *; }
