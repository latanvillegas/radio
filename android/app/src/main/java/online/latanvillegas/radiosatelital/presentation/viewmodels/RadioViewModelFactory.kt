package online.latanvillegas.radiosatelital.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase

/**
 * Factory explícita para inyectar dependencias en RadioViewModel.
 */
class RadioViewModelFactory(
    private val observeStationsUseCase: ObserveStationsUseCase,
    private val searchStationsUseCase: SearchStationsUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(RadioViewModel::class.java)) {
            return RadioViewModel(
                observeStationsUseCase = observeStationsUseCase,
                searchStationsUseCase = searchStationsUseCase,
                toggleFavoriteUseCase = toggleFavoriteUseCase
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
