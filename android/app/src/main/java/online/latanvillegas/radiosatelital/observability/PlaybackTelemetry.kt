package online.latanvillegas.radiosatelital.observability

import android.content.Context
import android.util.Log

class PlaybackTelemetry(context: Context) {

    companion object {
        private const val tag = "PlaybackTelemetry"
        private const val prefsName = "playback_telemetry"
        private const val keyBufferingEvents = "buffering_events"
        private const val keyPlaybackErrors = "playback_errors"
        private const val keyReconnectAttempts = "reconnect_attempts"
        private const val keyReadyEvents = "ready_events"
        private const val keyLastError = "last_error"
    }

    private val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)

    fun trackBuffering() {
        increment(keyBufferingEvents)
    }

    fun trackReady() {
        increment(keyReadyEvents)
    }

    fun trackError(message: String?) {
        increment(keyPlaybackErrors)
        prefs.edit().putString(keyLastError, message ?: "unknown").apply()
        Log.e(tag, "Playback error: ${message ?: "unknown"}")
    }

    fun trackReconnectAttempt(attempt: Int, delayMs: Long) {
        increment(keyReconnectAttempts)
        Log.w(tag, "Reconnect attempt=$attempt delayMs=$delayMs")
    }

    fun snapshot(): Map<String, Any> {
        return mapOf(
            keyBufferingEvents to prefs.getInt(keyBufferingEvents, 0),
            keyReadyEvents to prefs.getInt(keyReadyEvents, 0),
            keyPlaybackErrors to prefs.getInt(keyPlaybackErrors, 0),
            keyReconnectAttempts to prefs.getInt(keyReconnectAttempts, 0),
            keyLastError to (prefs.getString(keyLastError, "none") ?: "none")
        )
    }

    private fun increment(key: String) {
        val current = prefs.getInt(key, 0)
        prefs.edit().putInt(key, current + 1).apply()
    }
}
