package online.latanvillegas.radiosatelital

import android.app.NotificationManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationManagerCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.ui.PlayerNotificationManager

class RadioForegroundService : Service() {
  companion object {
    const val actionPlay = "online.latanvillegas.radiosatelital.action.PLAY"
    const val actionPause = "online.latanvillegas.radiosatelital.action.PAUSE"
    const val actionResume = "online.latanvillegas.radiosatelital.action.RESUME"
    const val actionStop = "online.latanvillegas.radiosatelital.action.STOP"
    const val extraUrl = "stream_url"
    const val extraTitle = "stream_title"
    const val extraArtist = "stream_artist"
    const val extraNextTitle = "stream_next_title"
    const val extraPrevTitle = "stream_prev_title"

    const val stateBroadcastAction = "online.latanvillegas.radiosatelital.player.STATE"
    const val stateExtra = "state"
    const val messageExtra = "message"
    const val statePlaying = "playing"
    const val statePaused = "paused"
    const val stateBuffering = "buffering"
    const val stateError = "error"
    const val stateStopped = "stopped"

    const val commandBroadcastAction = "online.latanvillegas.radiosatelital.player.COMMAND"
    const val commandExtra = "command"
    const val commandNext = "next"
    const val commandPrevious = "previous"

    private const val channelId = "radio_playback_channel"
    private const val channelName = "Reproduccion en vivo"
    private const val notificationId = 10001
  }

  private lateinit var player: ExoPlayer
  private lateinit var mediaSession: MediaSession
  private lateinit var notificationManager: PlayerNotificationManager

  private var currentTitle = "Radio Satelital"
  private var currentArtist = "En vivo"
  private var currentQueueHint = ""

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()

    player = ExoPlayer.Builder(this).build().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(C.USAGE_MEDIA)
          .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
          .build(),
        true
      )
      playWhenReady = true
    }

    player.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
        when (playbackState) {
          Player.STATE_BUFFERING -> broadcastState(stateBuffering, "Conectando...")
          Player.STATE_READY -> {
            if (player.isPlaying) broadcastState(statePlaying, "En vivo")
            else broadcastState(statePaused, "Pausado")
          }
          Player.STATE_ENDED -> broadcastState(stateStopped, "Detenido")
        }
      }

      override fun onIsPlayingChanged(isPlaying: Boolean) {
        if (isPlaying) broadcastState(statePlaying, "En vivo")
        else broadcastState(statePaused, "Pausado")
      }

      override fun onPlayerError(error: PlaybackException) {
        broadcastState(stateError, error.message ?: "Error de reproduccion")
      }
    })

    mediaSession = MediaSession.Builder(this, player).build()

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
      .build().apply {
      setUseNextAction(false)
      setUsePreviousAction(false)
        setUseFastForwardAction(false)
        setUseRewindAction(false)
        setMediaSessionToken(mediaSession.sessionCompatToken)
        setPlayer(player)
      }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      actionPlay -> {
        val url = intent.getStringExtra(extraUrl)
        val title = intent.getStringExtra(extraTitle)
        val artist = intent.getStringExtra(extraArtist)
          val nextTitle = intent.getStringExtra(extraNextTitle)
          val prevTitle = intent.getStringExtra(extraPrevTitle)

        if (!url.isNullOrBlank()) {
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
        player.stop()
        broadcastState(stateStopped, "Detenido")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
      }

      else -> {
        if (!player.isPlaying && player.mediaItemCount > 0) {
          player.play()
        }
      }
    }

    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? {
    return null
  }

  override fun onDestroy() {
    notificationManager.setPlayer(null)
    mediaSession.release()
    player.release()
    NotificationManagerCompat.from(this).cancel(notificationId)
    super.onDestroy()
  }

  private fun broadcastState(state: String, message: String) {
    val intent = Intent(stateBroadcastAction).apply {
      putExtra(stateExtra, state)
      putExtra(messageExtra, message)
    }
    sendBroadcast(intent)
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
