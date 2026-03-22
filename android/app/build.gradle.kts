import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.kapt")
}

val appVersionProperties = Properties().apply {
    val propFile = file("app-version.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

val localSigningProperties = Properties().apply {
    val signingFile = file("../../../../.android-signing-local.env")
    if (signingFile.exists()) {
        signingFile.inputStream().use { load(it) }
    }
}

fun signingValue(key: String): String? {
    return System.getenv(key)
        ?: localSigningProperties.getProperty(key)
}

val keystorePath = signingValue("KEYSTORE_FILE")
val releaseKeyAlias = signingValue("KEY_ALIAS")
val releaseKeyPassword = signingValue("KEY_PASSWORD")
val releaseKeystoreFile = keystorePath?.let {
    if (it.startsWith("/")) file(it) else file("../../../../$it")
}
val hasReleaseSigning =
    releaseKeystoreFile != null &&
    !releaseKeyAlias.isNullOrBlank() &&
    !releaseKeyPassword.isNullOrBlank()

android {
    val supabaseUrl = System.getenv("SUPABASE_URL") ?: ""
    val supabaseAnonKey = System.getenv("SUPABASE_ANON_KEY") ?: ""

    compileSdk = 36
    namespace = "online.latanvillegas.radiosatelital"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "online.latanvillegas.radiosatelital"
        minSdk = 24
        targetSdk = 36
        versionCode = appVersionProperties.getProperty("app.versionCode", "1").toInt()
        versionName = appVersionProperties.getProperty("app.versionName", "1.0")
        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
    }
    signingConfigs {
        create("release") {
            if (hasReleaseSigning) {
                storeFile = releaseKeystoreFile
                storePassword = releaseKeyPassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
                enableV1Signing = false
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isMinifyEnabled = false
        }
        getByName("release") {
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
        kotlinOptions {
            jvmTarget = "1.8"
            freeCompilerArgs = listOf(
                "-Xno-param-assertions",
                "-Xno-call-assertions",
                "-Xno-receiver-assertions"
            )
        }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui:1.6.8")
    implementation("androidx.compose.foundation:foundation:1.6.8")
    implementation("androidx.compose.ui:ui-tooling-preview:1.6.8")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.compose.material:material-icons-extended:1.6.8")
    debugImplementation("androidx.compose.ui:ui-tooling:1.6.8")
    implementation("androidx.media:media:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-session:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.9")
    testImplementation("app.cash.turbine:turbine:1.0.0")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}