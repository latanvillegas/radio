package online.latanvillegas.radiosatelital.streaming

import androidx.media3.common.PlaybackException

object PlaybackRecoveryPolicy {

    const val unknownCode = -1

    fun reconnectReason(error: PlaybackException?): String {
        return reconnectReasonFromCode(error?.errorCode ?: unknownCode)
    }

    fun reconnectReasonFromCode(code: Int): String {
        if (code == unknownCode) return "unknown"
        return when (code) {
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT,
            PlaybackException.ERROR_CODE_TIMEOUT -> "network"
            PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS,
            PlaybackException.ERROR_CODE_IO_INVALID_HTTP_CONTENT_TYPE -> "server"
            PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED,
            PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED,
            PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED,
            PlaybackException.ERROR_CODE_PARSING_MANIFEST_UNSUPPORTED -> "parsing"
            else -> "other"
        }
    }

    fun computeReconnectDelay(reason: String, attempt: Int): Long {
        val safeAttempt = attempt.coerceAtLeast(0)
        return when (reason) {
            "network" -> (750L * (1 shl safeAttempt)).coerceAtMost(12_000L)
            "server" -> (1500L * (1 shl safeAttempt)).coerceAtMost(25_000L)
            "parsing" -> (4000L * (1 shl safeAttempt)).coerceAtMost(45_000L)
            else -> (1000L * (1 shl safeAttempt)).coerceAtMost(30_000L)
        }
    }

    fun isNonRecoverablePlaybackError(error: PlaybackException?): Boolean {
        return isNonRecoverableCode(error?.errorCode ?: unknownCode)
    }

    fun isNonRecoverableCode(code: Int): Boolean {
        return code == PlaybackException.ERROR_CODE_DECODING_FAILED ||
            code == PlaybackException.ERROR_CODE_DECODING_FORMAT_UNSUPPORTED ||
            code == PlaybackException.ERROR_CODE_AUDIO_TRACK_INIT_FAILED ||
            code == PlaybackException.ERROR_CODE_AUDIO_TRACK_WRITE_FAILED
    }
}
