package online.latanvillegas.radiosatelital

import android.app.NotificationManager
import android.app.Notification
import android.app.NotificationChannel
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.audiofx.Equalizer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player.COMMAND_SEEK_TO_NEXT
import androidx.media3.common.Player.COMMAND_SEEK_TO_PREVIOUS
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession.ConnectionResult
import androidx.media3.session.MediaSession.ControllerInfo
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import androidx.media3.session.MediaSession
import androidx.media3.ui.PlayerNotificationManager
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import online.latanvillegas.radiosatelital.observability.PlaybackTelemetry
import online.latanvillegas.radiosatelital.streaming.PlaybackRecoveryPolicy
import org.json.JSONArray
import kotlin.random.Random

@UnstableApi
class RadioForegroundService : MediaSessionService() {
  companion object {
    const val actionPlay = "online.latanvillegas.radiosatelital.action.PLAY"
    const val actionPause = "online.latanvillegas.radiosatelital.action.PAUSE"
    const val actionResume = "online.latanvillegas.radiosatelital.action.RESUME"
    const val actionStop = "online.latanvillegas.radiosatelital.action.STOP"
    const val actionSetVolume = "online.latanvillegas.radiosatelital.action.SET_VOLUME"
    const val actionSetEqEnabled = "online.latanvillegas.radiosatelital.action.SET_EQ_ENABLED"
    const val actionSetEqBand = "online.latanvillegas.radiosatelital.action.SET_EQ_BAND"
    const val actionResetEq = "online.latanvillegas.radiosatelital.action.RESET_EQ"
    const val extraUrl = "stream_url"
    const val extraTitle = "stream_title"
    const val extraArtist = "stream_artist"
    const val extraNextTitle = "stream_next_title"
    const val extraPrevTitle = "stream_prev_title"
    const val extraVolume = "stream_volume"
    const val extraEqEnabled = "eq_enabled"
    const val extraEqBand = "eq_band"
    const val extraEqLevel = "eq_level"

    const val stateBroadcastAction = "online.latanvillegas.radiosatelital.player.STATE"
    const val stateExtra = "state"
    const val messageExtra = "message"
    const val payloadExtra = "payload"
    const val statePlaying = "playing"
    const val statePaused = "paused"
    const val stateBuffering = "buffering"
    const val stateError = "error"
    const val stateStopped = "stopped"

    const val commandBroadcastAction = "online.latanvillegas.radiosatelital.player.COMMAND"
    const val commandExtra = "command"
    const val commandNext = "next"
    const val commandPrevious = "previous"
    const val commandSeekTo = "seek_to"

    private const val channelId = "radio_playback_channel"
    private const val channelName = "Reproduccion en vivo"
    private const val notificationId = 10001

    private const val customActionNext = "radio.custom.next"
    private const val customActionPrev = "radio.custom.prev"

    private const val prefsName = "radio_native_player"
    private const val keyVolume = "volume"
    private const val keyEqEnabled = "eq_enabled"
    private const val keyEqBandLevels = "eq_band_levels"

    // Buffer profile tuned for live radio: quick start + resilient rebuffering.
    private const val minBufferMs = 15_000
    private const val maxBufferMs = 60_000
    private const val bufferForPlaybackMs = 900
    private const val bufferForPlaybackAfterRebufferMs = 2_500

    // Conservative network timeouts to keep streams alive on unstable networks.
    private const val streamConnectTimeoutMs = 12_000
    private const val streamReadTimeoutMs = 25_000

    // If a station remains buffering too long, restart playback proactively.
    private const val bufferingWatchdogTimeoutMs = 18_000L
  }

  private lateinit var player: ExoPlayer
  private lateinit var mediaSession: MediaSession
  private lateinit var notificationManager: PlayerNotificationManager
  private lateinit var audioManager: AudioManager
  private lateinit var prefs: android.content.SharedPreferences
  private lateinit var telemetry: PlaybackTelemetry

  private var audioFocusRequest: AudioFocusRequest? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var reconnectAttempt = 0
  private val mainHandler = Handler(Looper.getMainLooper())
  private var reconnectRunnable: Runnable? = null
  private var bufferingWatchdogRunnable: Runnable? = null
  private var currentUrl: String = ""
  private var currentVolume: Float = 1f
  private var playRequestedAtMs: Long = 0L
  private var startupLatencyTracked = false

  private var equalizer: Equalizer? = null
  private var eqEnabled = true

  private val noisyAudioReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY && player.isPlaying) {
        player.pause()
        broadcastState(statePaused, "Pausado por cambio de audio")
      }
    }
  }

  private val audioFocusListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    when (focusChange) {
      AudioManager.AUDIOFOCUS_GAIN -> {
        player.volume = currentVolume
        if (player.playWhenReady && player.playbackState == Player.STATE_READY && !player.isPlaying) {
          player.play()
        }
      }
      AudioManager.AUDIOFOCUS_LOSS,
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        if (player.isPlaying) {
          player.pause()
          broadcastState(statePaused, "Pausado por otra app")
        }
      }
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        player.volume = (currentVolume * 0.35f).coerceAtLeast(0.05f)
      }
    }
  }

  private var currentTitle = "Radio Satelital"
  private var currentArtist = "En vivo"
  private var currentQueueHint = ""
  private val customActionReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      when (intent?.action) {
        customActionPrev -> broadcastCommand(commandPrevious)
        customActionNext -> broadcastCommand(commandNext)
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    prefs = getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    telemetry = PlaybackTelemetry(this)
    audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    eqEnabled = prefs.getBoolean(keyEqEnabled, true)
    currentVolume = prefs.getFloat(keyVolume, 1f).coerceIn(0f, 1f)
    wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "radio_satelital:stream_wakelock")
      .apply { setReferenceCounted(false) }

    registerReceiver(noisyAudioReceiver, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY))

    val httpDataSourceFactory = DefaultHttpDataSource.Factory()
      .setAllowCrossProtocolRedirects(true)
      .setConnectTimeoutMs(streamConnectTimeoutMs)
      .setReadTimeoutMs(streamReadTimeoutMs)
      .setUserAgent("RadioSatelital/9.5 (Android)")

    val loadControl = DefaultLoadControl.Builder()
      .setBufferDurationsMs(
        minBufferMs,
        maxBufferMs,
        bufferForPlaybackMs,
        bufferForPlaybackAfterRebufferMs
      )
      .setPrioritizeTimeOverSizeThresholds(true)
      .build()

    player = ExoPlayer.Builder(this)
      .setLoadControl(loadControl)
      .setMediaSourceFactory(DefaultMediaSourceFactory(httpDataSourceFactory))
      .build().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(C.USAGE_MEDIA)
          .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
          .build(),
        true
      )
      setWakeMode(C.WAKE_MODE_NETWORK)
      setHandleAudioBecomingNoisy(true)
      playWhenReady = true
      volume = currentVolume
    }

    player.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
        when (playbackState) {
          Player.STATE_BUFFERING -> {
            telemetry.trackBuffering()
            broadcastState(stateBuffering, "Conectando...")
            scheduleBufferingWatchdog()
          }
          Player.STATE_READY -> {
            telemetry.trackReady()
            cancelBufferingWatchdog()
            if (!startupLatencyTracked && playRequestedAtMs > 0L) {
              telemetry.trackStartupLatency(SystemClock.elapsedRealtime() - playRequestedAtMs)
              startupLatencyTracked = true
            }
            if (player.isPlaying) broadcastState(statePlaying, "En vivo")
            else broadcastState(statePaused, "Pausado")
          }
          Player.STATE_ENDED -> {
            cancelBufferingWatchdog()
            broadcastState(stateStopped, "Detenido")
          }
        }

        if (playbackState == Player.STATE_READY || playbackState == Player.STATE_BUFFERING) {
          cancelReconnect()
        }
      }

      override fun onIsPlayingChanged(isPlaying: Boolean) {
        if (isPlaying) {
          acquireWakeLock()
          broadcastState(statePlaying, "En vivo")
        } else {
          releaseWakeLock()
          broadcastState(statePaused, "Pausado")
        }
      }

      override fun onPlayerError(error: PlaybackException) {
        cancelBufferingWatchdog()
        telemetry.trackError(error.message)
        broadcastState(stateError, error.message ?: "Error de reproduccion")
        scheduleReconnect(error)
      }

      override fun onAudioSessionIdChanged(audioSessionId: Int) {
        attachEqualizer(audioSessionId)
      }
    })

    mediaSession = MediaSession.Builder(this, player)
      .setCallback(object : MediaSession.Callback {
        override fun onConnect(
          session: MediaSession,
          controller: ControllerInfo
        ): ConnectionResult {
          val result = super.onConnect(session, controller)
          val buttons = listOf(
            CommandButton.Builder()
              .setDisplayName("Anterior")
              .setSessionCommand(SessionCommand(customActionPrev, android.os.Bundle.EMPTY))
              .setIconResId(android.R.drawable.ic_media_previous)
              .build(),
            CommandButton.Builder()
              .setDisplayName("Siguiente")
              .setSessionCommand(SessionCommand(customActionNext, android.os.Bundle.EMPTY))
              .setIconResId(android.R.drawable.ic_media_next)
              .build()
          )
          return ConnectionResult.AcceptedResultBuilder(session)
            .setAvailablePlayerCommands(
              result.availablePlayerCommands.buildUpon()
                .add(COMMAND_SEEK_TO_NEXT)
                .add(COMMAND_SEEK_TO_PREVIOUS)
                .build()
            )
            .setAvailableSessionCommands(
              result.availableSessionCommands.buildUpon()
                .add(SessionCommand(customActionPrev, android.os.Bundle.EMPTY))
                .add(SessionCommand(customActionNext, android.os.Bundle.EMPTY))
                .build()
            )
            .setCustomLayout(buttons)
            .setMediaButtonPreferences(buttons)
            .build()
        }

        override fun onCustomCommand(
          session: MediaSession,
          controller: ControllerInfo,
          customCommand: SessionCommand,
          args: android.os.Bundle
        ): ListenableFuture<SessionResult> {
          when (customCommand.customAction) {
            customActionPrev -> {
              broadcastCommand(commandPrevious)
            }
            customActionNext -> {
              broadcastCommand(commandNext)
            }
          }
          return Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
        }

      })
      .build()

    notificationManager = PlayerNotificationManager.Builder(this, notificationId, channelId)
      .setMediaDescriptionAdapter(object : PlayerNotificationManager.MediaDescriptionAdapter {
        override fun getCurrentContentTitle(player: Player): CharSequence {
          return currentTitle
        }

        override fun createCurrentContentIntent(player: Player) =
          packageManager.getLaunchIntentForPackage(packageName)?.let {
            android.app.PendingIntent.getActivity(
              this@RadioForegroundService,
              0,
              it,
              android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
          }

        override fun getCurrentContentText(player: Player): CharSequence {
          return currentArtist
        }

        override fun getCurrentSubText(player: Player): CharSequence? {
          return currentQueueHint.ifBlank { null }
        }

        override fun getCurrentLargeIcon(
          player: Player,
          callback: PlayerNotificationManager.BitmapCallback
        ) = null
      })
      .setNotificationListener(object : PlayerNotificationManager.NotificationListener {
        override fun onNotificationPosted(
          notificationId: Int,
          notification: Notification,
          ongoing: Boolean
        ) {
          if (ongoing) {
            startForeground(notificationId, notification)
          } else {
            stopForeground(STOP_FOREGROUND_DETACH)
          }
        }

        override fun onNotificationCancelled(notificationId: Int, dismissedByUser: Boolean) {
          stopSelf()
        }
      })
      .setCustomActionReceiver(object : PlayerNotificationManager.CustomActionReceiver {
        override fun createCustomActions(
          context: Context,
          instanceId: Int
        ): MutableMap<String, NotificationCompat.Action> {
          val prevIntent = Intent(customActionPrev).setPackage(packageName)
          val nextIntent = Intent(customActionNext).setPackage(packageName)

          val prevPending = android.app.PendingIntent.getBroadcast(
            context,
            2001,
            prevIntent,
            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
          )
          val nextPending = android.app.PendingIntent.getBroadcast(
            context,
            2002,
            nextIntent,
            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
          )

          return mutableMapOf(
            customActionPrev to NotificationCompat.Action(
              android.R.drawable.ic_media_previous,
              "Anterior",
              prevPending
            ),
            customActionNext to NotificationCompat.Action(
              android.R.drawable.ic_media_next,
              "Siguiente",
              nextPending
            )
          )
        }

        override fun getCustomActions(player: Player): MutableList<String> {
          return mutableListOf(customActionPrev, customActionNext)
        }

        override fun onCustomAction(player: Player, action: String, intent: Intent) {
          when (action) {
            customActionPrev -> broadcastCommand(commandPrevious)
            customActionNext -> broadcastCommand(commandNext)
          }
        }
      })
      .build().apply {
      setUseNextAction(false)
      setUsePreviousAction(false)
      setUseNextActionInCompactView(false)
      setUsePreviousActionInCompactView(false)
        setUseFastForwardAction(false)
        setUseRewindAction(false)
        setMediaSessionToken(mediaSession.sessionCompatToken)
        setPlayer(player)
      }

    ContextCompat.registerReceiver(
      this,
      customActionReceiver,
      IntentFilter().apply {
        addAction(customActionPrev)
        addAction(customActionNext)
      },
      ContextCompat.RECEIVER_NOT_EXPORTED
    )
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    super.onStartCommand(intent, flags, startId)

    when (intent?.action) {
      actionPlay -> {
        val url = intent.getStringExtra(extraUrl)
        val title = intent.getStringExtra(extraTitle)
        val artist = intent.getStringExtra(extraArtist)
          val nextTitle = intent.getStringExtra(extraNextTitle)
          val prevTitle = intent.getStringExtra(extraPrevTitle)

        if (!url.isNullOrBlank()) {
          if (!requestAudioFocus()) {
            broadcastState(stateError, "No se pudo tomar audio focus")
            return START_STICKY
          }

          playRequestedAtMs = SystemClock.elapsedRealtime()
          startupLatencyTracked = false
          cancelReconnect()
          cancelBufferingWatchdog()
          reconnectAttempt = 0
          currentUrl = url
          currentTitle = if (title.isNullOrBlank()) "Radio Satelital" else title
          currentArtist = if (artist.isNullOrBlank()) "En vivo" else artist
            currentQueueHint = buildQueueHint(prevTitle, nextTitle)
          broadcastState(stateBuffering, "Conectando...")
          player.setMediaItem(MediaItem.fromUri(url))
          player.prepare()
          player.playWhenReady = true
        }
      }

      actionPause -> {
        player.pause()
        broadcastState(statePaused, "Pausado")
      }

      actionResume -> {
        player.play()
        broadcastState(statePlaying, "En vivo")
      }

      actionStop -> {
        cancelReconnect()
        cancelBufferingWatchdog()
        abandonAudioFocus()
        player.stop()
        currentUrl = ""
        broadcastState(stateStopped, "Detenido")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
      }

      actionSetVolume -> {
        val nextVolume = intent.getFloatExtra(extraVolume, currentVolume).coerceIn(0f, 1f)
        setPlayerVolume(nextVolume)
      }

      actionSetEqEnabled -> {
        val enabled = intent.getBooleanExtra(extraEqEnabled, true)
        eqEnabled = enabled
        prefs.edit().putBoolean(keyEqEnabled, enabled).apply()
        applyEqualizerSettings()
        broadcastState(statePlaying, if (enabled) "Ecualizador activo" else "Ecualizador inactivo")
      }

      actionSetEqBand -> {
        val band = intent.getIntExtra(extraEqBand, -1)
        val level = intent.getIntExtra(extraEqLevel, 0)
        setEqualizerBandLevel(band, level)
      }

      actionResetEq -> {
        resetEqualizerBands()
      }

      else -> {
        if (!player.isPlaying && player.mediaItemCount > 0) {
          requestAudioFocus()
          player.play()
        }
      }
    }

    return START_STICKY
  }

  override fun onGetSession(controllerInfo: ControllerInfo): MediaSession {
    return mediaSession
  }

  override fun onDestroy() {
    cancelReconnect()
    cancelBufferingWatchdog()
    releaseWakeLock()
    abandonAudioFocus()
    runCatching { unregisterReceiver(noisyAudioReceiver) }
    runCatching { unregisterReceiver(customActionReceiver) }
    runCatching { equalizer?.release() }
    equalizer = null
    notificationManager.setPlayer(null)
    mediaSession.release()
    player.release()
    NotificationManagerCompat.from(this).cancel(notificationId)
    super.onDestroy()
  }

  private fun broadcastState(state: String, message: String, payload: String? = null) {
    val intent = Intent(stateBroadcastAction).apply {
      putExtra(stateExtra, state)
      putExtra(messageExtra, message)
      if (!payload.isNullOrBlank()) putExtra(payloadExtra, payload)
    }
    sendBroadcast(intent)
  }

  private fun broadcastCommand(command: String, seekPositionMs: Long? = null) {
    val intent = Intent(commandBroadcastAction).apply {
      putExtra(commandExtra, command)
      if (seekPositionMs != null) putExtra("position_ms", seekPositionMs)
    }
    sendBroadcast(intent)
  }

  private fun requestAudioFocus(): Boolean {
    val attrs = android.media.AudioAttributes.Builder()
      .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
      .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()

    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attrs)
        .setOnAudioFocusChangeListener(audioFocusListener)
        .setWillPauseWhenDucked(false)
        .build()
      audioFocusRequest = req
      audioManager.requestAudioFocus(req)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(
        audioFocusListener,
        AudioManager.STREAM_MUSIC,
        AudioManager.AUDIOFOCUS_GAIN
      )
    }

    return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
  }

  private fun abandonAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
      audioFocusRequest = null
    } else {
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(audioFocusListener)
    }
  }

  private fun scheduleReconnect(error: PlaybackException? = null) {
    if (currentUrl.isBlank()) return

    val maxAttempts = if (PlaybackRecoveryPolicy.isNonRecoverablePlaybackError(error)) 2 else 6
    if (reconnectAttempt >= maxAttempts) return

    cancelReconnect()
    val reason = PlaybackRecoveryPolicy.reconnectReason(error)
    val baseDelayMs = PlaybackRecoveryPolicy.computeReconnectDelay(reason, reconnectAttempt)
    val jitterMs = Random.nextLong(0L, 750L)
    val delayMs = baseDelayMs + jitterMs
    reconnectAttempt += 1
    telemetry.trackReconnectAttempt(reconnectAttempt, delayMs, reason)
    broadcastState(stateError, "Reintentando en ${delayMs / 1000}s...")

    reconnectRunnable = Runnable {
      if (currentUrl.isBlank()) return@Runnable
      player.setMediaItem(MediaItem.fromUri(currentUrl))
      player.prepare()
      player.playWhenReady = true
    }.also {
      mainHandler.postDelayed(it, delayMs)
    }
  }

  private fun cancelReconnect() {
    reconnectRunnable?.let { mainHandler.removeCallbacks(it) }
    reconnectRunnable = null
  }

  private fun scheduleBufferingWatchdog() {
    cancelBufferingWatchdog()
    bufferingWatchdogRunnable = Runnable {
      if (player.playbackState == Player.STATE_BUFFERING && currentUrl.isNotBlank()) {
        telemetry.trackStallRescue(bufferingWatchdogTimeoutMs)
        broadcastState(stateError, "Reconectando por buffering prolongado...")
        reconnectAttempt = 0
        restartCurrentStream()
      }
    }.also { mainHandler.postDelayed(it, bufferingWatchdogTimeoutMs) }
  }

  private fun cancelBufferingWatchdog() {
    bufferingWatchdogRunnable?.let { mainHandler.removeCallbacks(it) }
    bufferingWatchdogRunnable = null
  }

  private fun restartCurrentStream() {
    if (currentUrl.isBlank()) return
    player.stop()
    player.clearMediaItems()
    player.setMediaItem(MediaItem.fromUri(currentUrl))
    player.prepare()
    player.playWhenReady = true
  }

  private fun acquireWakeLock() {
    wakeLock?.let {
      if (!it.isHeld) {
        it.acquire(20 * 60 * 1000L)
      }
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.let {
      if (it.isHeld) {
        it.release()
      }
    }
  }

  private fun setPlayerVolume(next: Float) {
    currentVolume = next.coerceIn(0f, 1f)
    player.volume = currentVolume
    prefs.edit().putFloat(keyVolume, currentVolume).apply()
    broadcastState(statePlaying, "Volumen ${"%.0f".format(currentVolume * 100)}%")
  }

  private fun attachEqualizer(audioSessionId: Int) {
    if (audioSessionId <= 0) return
    runCatching { equalizer?.release() }
    equalizer = runCatching { Equalizer(0, audioSessionId) }.getOrNull()
    applyEqualizerSettings()
  }

  private fun applyEqualizerSettings() {
    val eq = equalizer ?: return
    eq.enabled = eqEnabled
    if (!eqEnabled) return

    val levels = loadEqLevels(eq.numberOfBands.toInt())
    for (band in 0 until eq.numberOfBands.toInt()) {
      val raw = levels.getOrElse(band) { 0 }
      val min = eq.bandLevelRange[0].toInt()
      val max = eq.bandLevelRange[1].toInt()
      val clamped = raw.coerceIn(min, max)
      eq.setBandLevel(band.toShort(), clamped.toShort())
    }
  }

  private fun setEqualizerBandLevel(band: Int, level: Int) {
    val eq = equalizer ?: return
    if (band < 0 || band >= eq.numberOfBands.toInt()) return

    val min = eq.bandLevelRange[0].toInt()
    val max = eq.bandLevelRange[1].toInt()
    val clamped = level.coerceIn(min, max)
    eq.setBandLevel(band.toShort(), clamped.toShort())

    val levels = loadEqLevels(eq.numberOfBands.toInt()).toMutableList()
    while (levels.size < eq.numberOfBands.toInt()) levels.add(0)
    levels[band] = clamped
    saveEqLevels(levels)
  }

  private fun resetEqualizerBands() {
    val eq = equalizer ?: return
    val levels = MutableList(eq.numberOfBands.toInt()) { 0 }
    saveEqLevels(levels)
    applyEqualizerSettings()
    broadcastState(statePlaying, "Ecualizador restablecido")
  }

  private fun loadEqLevels(expectedBands: Int): List<Int> {
    val raw = prefs.getString(keyEqBandLevels, null) ?: return List(expectedBands) { 0 }
    return runCatching {
      val arr = JSONArray(raw)
      List(expectedBands) { idx -> if (idx < arr.length()) arr.getInt(idx) else 0 }
    }.getOrElse { List(expectedBands) { 0 } }
  }

  private fun saveEqLevels(levels: List<Int>) {
    val arr = JSONArray()
    levels.forEach { arr.put(it) }
    prefs.edit().putString(keyEqBandLevels, arr.toString()).apply()
  }

  private fun buildQueueHint(prevTitle: String?, nextTitle: String?): String {
    val prev = prevTitle?.trim().orEmpty()
    val next = nextTitle?.trim().orEmpty()
    if (prev.isEmpty() && next.isEmpty()) return ""
    if (prev.isEmpty()) return "Siguiente: $next"
    if (next.isEmpty()) return "Anterior: $prev"
    return "Anterior: $prev  •  Siguiente: $next"
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        channelId,
        channelName,
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Mantiene la reproduccion activa en segundo plano"
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }

      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }
}
