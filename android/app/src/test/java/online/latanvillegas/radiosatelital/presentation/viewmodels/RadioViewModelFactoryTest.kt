package online.latanvillegas.radiosatelital.presentation.viewmodels

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase
import org.junit.After
import org.junit.Before
import org.junit.Assert.assertNotNull
import org.junit.Test

/**
 * Tests para RadioViewModelFactory.
 * Verifica que el factory cree correctamente instancias de RadioViewModel.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class RadioViewModelFactoryTest {

    private val testDispatcher = StandardTestDispatcher()

    private val fakeRepository = FakeStationRepository()

    private val radioViewModelFactory = RadioViewModelFactory(
        observeStationsUseCase = ObserveStationsUseCase(fakeRepository),
        searchStationsUseCase = SearchStationsUseCase(fakeRepository),
        toggleFavoriteUseCase = ToggleFavoriteUseCase(fakeRepository)
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun testFactoryCreatesValidViewModel() {
        val viewModel = radioViewModelFactory.create(RadioViewModel::class.java)
        assertNotNull(viewModel)
    }

    @Test
    fun testFactoryCreateMultipleInstancesAreDifferent() {
        val viewModel1 = radioViewModelFactory.create(RadioViewModel::class.java)
        val viewModel2 = radioViewModelFactory.create(RadioViewModel::class.java)

        // Cada instancia debe ser diferente
        assert(viewModel1 !== viewModel2)
    }

    @Test
    fun testCreatedViewModelHasInitialState() = runTest {
        val viewModel = radioViewModelFactory.create(RadioViewModel::class.java)
        advanceUntilIdle()
        val state = viewModel.uiState.value

        // Verificar que el estado inicial es válido
        assert(!state.isPlaying)
        assert(state.currentStation == null)
        assert(state.errorMessage == null)
    }

    @Test
    fun testViewModelFromFactoryIsFullyFunctional() = runTest {
        val viewModel = radioViewModelFactory.create(RadioViewModel::class.java)
        
        val testStation = Station(
            id = "factory-test",
            name = "Factory Test Station",
            url = "https://factory-test.com/stream",
            country = "Spain",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid"
        )

        // Verificar que el viewModel funciona
        viewModel.playStation(testStation)
        advanceUntilIdle()
        val state = viewModel.uiState.value
        
        assert(state.currentStation?.id == testStation.id)
        assert(state.isPlaying)
    }
}
