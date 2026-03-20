package online.latanvillegas.radiosatelital

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

class MainActivity : TauriActivity() {
  private val notificationPermissionRequestCode = 1001
  private var hostWebView: WebView? = null

  private val nativePlayerStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      when (intent?.action) {
        RadioForegroundService.stateBroadcastAction -> {
          val state = intent.getStringExtra(RadioForegroundService.stateExtra) ?: return
          val message = intent.getStringExtra(RadioForegroundService.messageExtra) ?: ""
          dispatchNativeStateToJs(state, message)
        }

        RadioForegroundService.commandBroadcastAction -> {
          val command = intent.getStringExtra(RadioForegroundService.commandExtra) ?: return
          dispatchNativeCommandToJs(command)
        }
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    requestNotificationPermissionIfNeeded()
    startRadioForegroundService()
    attachNativeBridgeIfPossible()

    val filter = IntentFilter().apply {
      addAction(RadioForegroundService.stateBroadcastAction)
      addAction(RadioForegroundService.commandBroadcastAction)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(nativePlayerStateReceiver, filter, RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(nativePlayerStateReceiver, filter)
    }
  }

  override fun onDestroy() {
    runCatching { unregisterReceiver(nativePlayerStateReceiver) }
    super.onDestroy()
    if (isFinishing) {
      stopService(Intent(this, RadioForegroundService::class.java))
    }
  }

  private fun requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
        != PackageManager.PERMISSION_GRANTED
      ) {
        ActivityCompat.requestPermissions(
          this,
          arrayOf(Manifest.permission.POST_NOTIFICATIONS),
          notificationPermissionRequestCode
        )
      }
    }
  }

  private fun startRadioForegroundService() {
    val serviceIntent = Intent(this, RadioForegroundService::class.java)
    ContextCompat.startForegroundService(this, serviceIntent)
  }

  private fun attachNativeBridgeIfPossible() {
    val webView = findHostWebView() ?: return
    hostWebView = webView
    webView.settings.javaScriptEnabled = true
    webView.addJavascriptInterface(NativePlayerBridge(), "AndroidNativePlayer")
  }

  private fun findHostWebView(): WebView? {
    val root = findViewById<View>(android.R.id.content) ?: return null
    return findWebViewInTree(root)
  }

  private fun findWebViewInTree(view: View): WebView? {
    if (view is WebView) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val found = findWebViewInTree(view.getChildAt(i))
        if (found != null) return found
      }
    }
    return null
  }

  private fun dispatchNativeStateToJs(state: String, message: String) {
    val webView = hostWebView ?: return
    val stateJson = JSONObject.quote(state)
    val messageJson = JSONObject.quote(message)

    val script = """
      window.dispatchEvent(new CustomEvent('native-player-state', {
        detail: { state: $stateJson, message: $messageJson }
      }));
    """.trimIndent()

    webView.post {
      webView.evaluateJavascript(script, null)
    }
  }

  private fun dispatchNativeCommandToJs(command: String) {
    val webView = hostWebView ?: return
    val commandJson = JSONObject.quote(command)

    val script = """
      window.dispatchEvent(new CustomEvent('native-player-command', {
        detail: { command: $commandJson }
      }));
    """.trimIndent()

    webView.post {
      webView.evaluateJavascript(script, null)
    }
  }

  private inner class NativePlayerBridge {
    @JavascriptInterface
    fun play(url: String, title: String?, artist: String?, prevTitle: String?, nextTitle: String?) {
      val intent = Intent(this@MainActivity, RadioForegroundService::class.java).apply {
        action = RadioForegroundService.actionPlay
        putExtra(RadioForegroundService.extraUrl, url)
        putExtra(RadioForegroundService.extraTitle, title ?: "Radio Satelital")
        putExtra(RadioForegroundService.extraArtist, artist ?: "En vivo")
        putExtra(RadioForegroundService.extraPrevTitle, prevTitle ?: "")
        putExtra(RadioForegroundService.extraNextTitle, nextTitle ?: "")
      }
      ContextCompat.startForegroundService(this@MainActivity, intent)
    }

    @JavascriptInterface
    fun pause() {
      val intent = Intent(this@MainActivity, RadioForegroundService::class.java).apply {
        action = RadioForegroundService.actionPause
      }
      startService(intent)
    }

    @JavascriptInterface
    fun resume() {
      val intent = Intent(this@MainActivity, RadioForegroundService::class.java).apply {
        action = RadioForegroundService.actionResume
      }
      startService(intent)
    }

    @JavascriptInterface
    fun stop() {
      val intent = Intent(this@MainActivity, RadioForegroundService::class.java).apply {
        action = RadioForegroundService.actionStop
      }
      startService(intent)
    }
  }
}
