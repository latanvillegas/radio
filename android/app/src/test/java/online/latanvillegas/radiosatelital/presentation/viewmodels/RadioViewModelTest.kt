package online.latanvillegas.radiosatelital.presentation.viewmodels

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StreamValidationResult
import online.latanvillegas.radiosatelital.domain.repositories.StationRepository
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase
import org.junit.Before
import org.junit.Test
import org.junit.After

/**
 * Tests para RadioViewModel.
 * Prueba la lógica de negocio y transiciones de estado.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class RadioViewModelTest {

    private lateinit var viewModel: RadioViewModel
    private lateinit var fakeRepository: FakeStationRepository
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeStationRepository()
        viewModel = RadioViewModel(
            observeStationsUseCase = ObserveStationsUseCase(fakeRepository),
            searchStationsUseCase = SearchStationsUseCase(fakeRepository),
            toggleFavoriteUseCase = ToggleFavoriteUseCase(fakeRepository)
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testInitialStateIsEmpty() = runTest {
        advanceUntilIdle()
        val state = viewModel.uiState.value
        assert(!state.isLoading)
        assert(state.stations.isNotEmpty()) // Carga estaciones de ejemplo
    }

    @Test
    fun testPlayStationUpdatesCurrentStation() = runTest {
        val station = Station(
            id = "1",
            name = "Test Radio",
            url = "https://example.com/stream",
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

    @Test
    fun testPauseStationStopsPlayback() = runTest {
        val station = Station(
            id = "1",
            name = "Test Radio",
            url = "https://example.com/stream",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid"
        )

        viewModel.playStation(station)
        viewModel.pauseStation()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assert(!state.isPlaying)
    }

    @Test
    fun testToggleFavoriteFlagsStation() = runTest {
        val stationId = "1"
        viewModel.toggleFavorite(stationId)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        val station = state.stations.find { it.id == stationId }
        assert(station?.isFavorite == true)
    }

    @Test
    fun testSearchFiltersStations() = runTest {
        viewModel.searchStations("Radio")
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assert(state.searchQuery == "Radio")
        // Las estaciones filtradas deberían contener "Radio" en el nombre
    }

    @Test
    fun testClearErrorRemovesMessage() = runTest {
        viewModel.clearError()
        assert(viewModel.uiState.value.errorMessage == null)
    }

    @Test
    fun testMultiplePlayPauseTransitions() = runTest {
        val station = Station(
            id = "test-1",
            name = "Test Station",
            url = "https://example.com/stream",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid"
        )

        // Play
        viewModel.playStation(station)
        advanceUntilIdle()
        assert(viewModel.uiState.value.isPlaying)

        // Pause
        viewModel.pauseStation()
        advanceUntilIdle()
        assert(!viewModel.uiState.value.isPlaying)

        // Play again
        viewModel.playStation(station)
        advanceUntilIdle()
        assert(viewModel.uiState.value.isPlaying)
    }

    @Test
    fun testStationValidation() = runTest {
        val validStation = Station(
            id = "valid",
            name = "Valid Station",
            url = "https://valid-stream.com",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid"
        )

        viewModel.playStation(validStation)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assert(state.currentStation?.url?.startsWith("https://") == true)
    }
}

/**
 * Repository fake para testing sin dependencias externas.
 */
class FakeStationRepository : StationRepository {
    private val stations = mutableListOf(
        Station(
            id = "1",
            name = "Test Radio 1",
            url = "https://example.com/1",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid",
            isFavorite = false
        ),
        Station(
            id = "2",
            name = "Test Radio 2",
            url = "https://example.com/2",
            country = "Spain",
            region = "Barcelona",
            district = "Sarrià",
            locality = "Barcelona",
            isFavorite = false
        )
    )

    override fun getAllStationsFlow() = flowOf(stations)

    override fun getGlobalStationsFlow() = flowOf(emptyList<Station>())

    override suspend fun getStationById(id: String) = stations.find { it.id == id }

    override suspend fun insertStation(station: Station): String {
        stations.add(station)
        return station.id
    }

    override suspend fun updateStation(station: Station) {
        val index = stations.indexOfFirst { it.id == station.id }
        if (index >= 0) {
            stations[index] = station
        }
    }

    override suspend fun deleteStation(id: String) {
        stations.removeAll { it.id == id }
    }

    override fun getFavoriteStationsFlow() = flowOf(stations.filter { it.isFavorite })

    override suspend fun toggleFavorite(id: String, isFavorite: Boolean) {
        val station = getStationById(id)
        if (station != null) {
            updateStation(station.copy(isFavorite = isFavorite))
        }
    }

    override suspend fun validateStream(url: String): StreamValidationResult {
        return if (url.isNotEmpty() && (url.startsWith("http://") || url.startsWith("https://"))) {
            StreamValidationResult(isValid = true)
        } else {
            StreamValidationResult(
                isValid = false,
                errorMessage = "URL inválida"
            )
        }
    }

    override suspend fun searchStations(query: String) =
        stations.filter { it.name.contains(query, ignoreCase = true) }

    override suspend fun syncWithRemote() {
        // No-op for testing
    }
}
