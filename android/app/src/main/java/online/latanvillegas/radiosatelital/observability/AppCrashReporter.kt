package online.latanvillegas.radiosatelital.observability

import android.content.Context
import android.util.Log

class AppCrashReporter(context: Context) {

    companion object {
        private const val tag = "AppCrashReporter"
        private const val prefsName = "app_crash_reporter"
        private const val keyLastCrashMessage = "last_crash_message"
        private const val keyLastCrashThread = "last_crash_thread"
        private const val keyCrashCount = "crash_count"
    }

    private val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)

    fun install() {
        val previousHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            runCatching {
                val message = throwable.message ?: throwable.javaClass.simpleName
                val crashCount = prefs.getInt(keyCrashCount, 0) + 1
                prefs.edit()
                    .putString(keyLastCrashMessage, message)
                    .putString(keyLastCrashThread, thread.name)
                    .putInt(keyCrashCount, crashCount)
                    .apply()
                Log.e(tag, "Uncaught exception on thread=${thread.name}: $message", throwable)
            }
            previousHandler?.uncaughtException(thread, throwable)
        }
    }

    fun snapshot(): Map<String, Any> {
        return mapOf(
            "crash_count" to prefs.getInt(keyCrashCount, 0),
            "last_crash_message" to (prefs.getString(keyLastCrashMessage, "none") ?: "none"),
            "last_crash_thread" to (prefs.getString(keyLastCrashThread, "none") ?: "none")
        )
    }
}
