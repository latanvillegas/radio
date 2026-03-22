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
        private const val keyStartupLatencyMs = "startup_latency_ms"
        private const val keyStartupSamples = "startup_samples"
        private const val keyStallRescues = "stall_rescues"
        private const val keyLastReconnectReason = "last_reconnect_reason"
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

    fun trackReconnectAttempt(attempt: Int, delayMs: Long, reason: String = "unknown") {
        increment(keyReconnectAttempts)
        prefs.edit().putString(keyLastReconnectReason, reason).apply()
        Log.w(tag, "Reconnect attempt=$attempt delayMs=$delayMs reason=$reason")
    }

    fun trackStartupLatency(latencyMs: Long) {
        val sanitized = latencyMs.coerceAtLeast(0L)
        val total = prefs.getLong(keyStartupLatencyMs, 0L) + sanitized
        val samples = prefs.getInt(keyStartupSamples, 0) + 1
        prefs.edit()
            .putLong(keyStartupLatencyMs, total)
            .putInt(keyStartupSamples, samples)
            .apply()
        Log.i(tag, "Startup latency=${sanitized}ms")
    }

    fun trackStallRescue(timeoutMs: Long) {
        increment(keyStallRescues)
        Log.w(tag, "Stall rescue triggered after ${timeoutMs}ms")
    }

    fun snapshot(): Map<String, Any> {
        return mapOf(
            keyBufferingEvents to prefs.getInt(keyBufferingEvents, 0),
            keyReadyEvents to prefs.getInt(keyReadyEvents, 0),
            keyPlaybackErrors to prefs.getInt(keyPlaybackErrors, 0),
            keyReconnectAttempts to prefs.getInt(keyReconnectAttempts, 0),
            keyLastError to (prefs.getString(keyLastError, "none") ?: "none"),
            keyStallRescues to prefs.getInt(keyStallRescues, 0),
            keyLastReconnectReason to (prefs.getString(keyLastReconnectReason, "none") ?: "none"),
            "startup_latency_avg_ms" to computeAvgStartupLatency()
        )
    }

    private fun computeAvgStartupLatency(): Long {
        val samples = prefs.getInt(keyStartupSamples, 0)
        if (samples <= 0) return 0L
        return prefs.getLong(keyStartupLatencyMs, 0L) / samples
    }

    private fun increment(key: String) {
        val current = prefs.getInt(key, 0)
        prefs.edit().putInt(key, current + 1).apply()
    }
}
