package online.latanvillegas.radiosatelital.streaming

import androidx.media3.common.PlaybackException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackRecoveryPolicyTest {

    @Test
    fun reconnectReason_mapsKnownCategories() {
        assertEquals("network", PlaybackRecoveryPolicy.reconnectReasonFromCode(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT))
        assertEquals("server", PlaybackRecoveryPolicy.reconnectReasonFromCode(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS))
        assertEquals("parsing", PlaybackRecoveryPolicy.reconnectReasonFromCode(PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED))
        assertEquals("unknown", PlaybackRecoveryPolicy.reconnectReasonFromCode(PlaybackRecoveryPolicy.unknownCode))
    }

    @Test
    fun computeReconnectDelay_appliesCapsPerReason() {
        assertEquals(750L, PlaybackRecoveryPolicy.computeReconnectDelay("network", 0))
        assertEquals(12000L, PlaybackRecoveryPolicy.computeReconnectDelay("network", 6))

        assertEquals(1500L, PlaybackRecoveryPolicy.computeReconnectDelay("server", 0))
        assertEquals(25000L, PlaybackRecoveryPolicy.computeReconnectDelay("server", 6))

        assertEquals(4000L, PlaybackRecoveryPolicy.computeReconnectDelay("parsing", 0))
        assertEquals(45000L, PlaybackRecoveryPolicy.computeReconnectDelay("parsing", 6))

        assertEquals(1000L, PlaybackRecoveryPolicy.computeReconnectDelay("other", 0))
        assertEquals(30000L, PlaybackRecoveryPolicy.computeReconnectDelay("other", 6))
    }

    @Test
    fun nonRecoverableError_identifiesDecoderAndAudioTrackFailures() {
        assertTrue(PlaybackRecoveryPolicy.isNonRecoverableCode(PlaybackException.ERROR_CODE_DECODING_FAILED))
        assertTrue(PlaybackRecoveryPolicy.isNonRecoverableCode(PlaybackException.ERROR_CODE_AUDIO_TRACK_INIT_FAILED))
        assertFalse(PlaybackRecoveryPolicy.isNonRecoverableCode(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED))
        assertFalse(PlaybackRecoveryPolicy.isNonRecoverableCode(PlaybackRecoveryPolicy.unknownCode))
    }
}
