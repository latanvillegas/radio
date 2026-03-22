package online.latanvillegas.radiosatelital

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import online.latanvillegas.radiosatelital.presentation.screens.RadioScreen
import online.latanvillegas.radiosatelital.presentation.viewmodels.RadioViewModel

class MainActivity : ComponentActivity() {
  private val appContainer by lazy {
    (application as RadioSatelitalApplication).appContainer
  }

  private val radioViewModel: RadioViewModel by viewModels {
    appContainer.radioViewModelFactory
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
          RadioScreen(viewModel = radioViewModel)
        }
      }
    }
  }
}
