package online.latanvillegas.radiosatelital.presentation.viewmodels

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.usecases.GetFavoriteStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * Tests de construcción de RadioViewModel durante la migración a Hilt.
 * Evita depender del factory legado para no introducir warnings deprecados.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class RadioViewModelFactoryTest {

    private val testDispatcher = StandardTestDispatcher()
    private val fakeRepository = FakeStationRepository()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createViewModel(): RadioViewModel {
        return RadioViewModel(
            observeStationsUseCase = ObserveStationsUseCase(fakeRepository),
            getFavoriteStationsUseCase = GetFavoriteStationsUseCase(fakeRepository),
            searchStationsUseCase = SearchStationsUseCase(fakeRepository),
            toggleFavoriteUseCase = ToggleFavoriteUseCase(fakeRepository)
        )
    }

    @Test
    fun testCreateViewModelHasValidInitialState() = runTest {
        val viewModel = createViewModel()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assert(!state.isPlaying)
        assert(state.currentStation == null)
        assert(state.errorMessage == null)
    }

    @Test
    fun testCreateViewModelCanPlayStation() = runTest {
        val viewModel = createViewModel()
        val station = Station(
            id = "factory-test",
            name = "Factory Test Station",
            url = "https://factory-test.com/stream",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid"
        )

        viewModel.playStation(station)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assert(state.currentStation?.id == station.id)
        assert(state.isPlaying)
    }
}
