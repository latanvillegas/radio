package online.latanvillegas.radiosatelital.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase

/**
 * Estado de la interfaz de usuario para la pantalla de radio.
 */
data class RadioUiState(
    val isLoading: Boolean = false,
    val stations: List<Station> = emptyList(),
    val currentStation: Station? = null,
    val isPlaying: Boolean = false,
    val errorMessage: String? = null,
    val searchQuery: String = ""
)

/**
 * ViewModel para gestionar la lógica de la pantalla de radio.
 * Implementa MVVM + Clean Architecture.
 */
class RadioViewModel(
    private val observeStationsUseCase: ObserveStationsUseCase,
    private val searchStationsUseCase: SearchStationsUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RadioUiState())
    val uiState: StateFlow<RadioUiState> = _uiState.asStateFlow()

    private val _isFavoritesOnly = MutableStateFlow(false)
    val isFavoritesOnly: StateFlow<Boolean> = _isFavoritesOnly.asStateFlow()

    init {
        loadStations()
    }

    /**
     * Carga todas las estaciones.
     */
    private fun loadStations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                observeStationsUseCase().collect { stations ->
                    _uiState.value = _uiState.value.copy(
                        stations = stations,
                        isLoading = false,
                        errorMessage = null
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Error desconocido"
                )
            }
        }
    }

    /**
     * Reproduce una estación seleccionada.
     */
    fun playStation(station: Station) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(
                    currentStation = station,
                    isPlaying = true,
                    errorMessage = null
                )
                // Aquí iría la lógica real de reproducción
                // audioManager.play(station.url)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isPlaying = false,
                    errorMessage = e.message ?: "Error al reproducir"
                )
            }
        }
    }

    /**
     * Pausa la reproducción actual.
     */
    fun pauseStation() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPlaying = false)
        }
    }

    /**
     * Busca estaciones por nombre.
     */
    fun searchStations(query: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                searchQuery = query,
                isLoading = true
            )
            try {
                searchStationsUseCase(query)
                    .onSuccess { results ->
                        _uiState.value = _uiState.value.copy(
                            stations = results,
                            isLoading = false
                        )
                    }
                    .onFailure { throwable ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = throwable.message
                        )
                    }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message
                )
            }
        }
    }

    /**
     * Alterna el estado de favorito de una estación.
     */
    fun toggleFavorite(stationId: String) {
        viewModelScope.launch {
            try {
                val station = _uiState.value.stations.find { it.id == stationId }
                if (station != null) {
                    toggleFavoriteUseCase(stationId, !station.isFavorite)
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = e.message ?: "Error al actualizar favorito"
                )
            }
        }
    }

    /**
     * Limpia el mensaje de error.
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
