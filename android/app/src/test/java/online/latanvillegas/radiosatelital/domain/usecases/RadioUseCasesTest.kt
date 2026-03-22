package online.latanvillegas.radiosatelital.domain.usecases

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StreamValidationResult
import online.latanvillegas.radiosatelital.domain.repositories.StationRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RadioUseCasesTest {

    @Test
    fun searchStationsUseCase_returnsFilteredResults() = runBlocking {
        val repository = FakeUseCaseStationRepository()
        val useCase = SearchStationsUseCase(repository)

        val result = useCase("uno")

        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrThrow().size)
        assertEquals("1", result.getOrThrow().first().id)
    }

    @Test
    fun toggleFavoriteUseCase_updatesFavoriteFlag() = runBlocking {
        val repository = FakeUseCaseStationRepository()
        val useCase = ToggleFavoriteUseCase(repository)

        val result = useCase("1", true)

        assertTrue(result.isSuccess)
        val station = repository.getStationById("1")
        assertTrue(station?.isFavorite == true)
    }

    @Test
    fun validateStreamUseCase_returnsFailureForInvalidUrl() = runBlocking {
        val repository = FakeUseCaseStationRepository()
        val useCase = ValidateStreamUseCase(repository)

        val result = useCase("invalid-url")

        assertTrue(result.isFailure)
    }

    @Test
    fun syncStationsUseCase_callsRepository() = runBlocking {
        val repository = FakeUseCaseStationRepository()
        val useCase = SyncStationsUseCase(repository)

        val result = useCase()

        assertTrue(result.isSuccess)
        assertTrue(repository.syncCalled)
    }

    @Test
    fun playStationUseCase_failsForUnknownId() = runBlocking {
        val repository = FakeUseCaseStationRepository()
        val useCase = PlayStationUseCase(repository)

        val result = useCase("missing")

        assertTrue(result.isFailure)
        assertFalse(result.isSuccess)
    }
}

private class FakeUseCaseStationRepository : StationRepository {
    private val stations = mutableListOf(
        Station(
            id = "1",
            name = "Radio Uno",
            url = "https://example.com/uno",
            country = "Chile",
            region = "Metropolitana",
            district = "Centro",
            locality = "Santiago",
            isFavorite = false
        ),
        Station(
            id = "2",
            name = "Radio Dos",
            url = "https://example.com/dos",
            country = "Chile",
            region = "Valparaiso",
            district = "Vina",
            locality = "Vina del Mar",
            isFavorite = false
        )
    )

    var syncCalled: Boolean = false

    override fun getAllStationsFlow(): Flow<List<Station>> = flowOf(stations)

    override fun getGlobalStationsFlow(): Flow<List<Station>> = flowOf(emptyList())

    override suspend fun getStationById(id: String): Station? = stations.find { it.id == id }

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

    override fun getFavoriteStationsFlow(): Flow<List<Station>> = flowOf(stations.filter { it.isFavorite })

    override suspend fun toggleFavorite(id: String, isFavorite: Boolean) {
        val station = getStationById(id) ?: return
        updateStation(station.copy(isFavorite = isFavorite))
    }

    override suspend fun validateStream(url: String): StreamValidationResult {
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            StreamValidationResult(isValid = true)
        } else {
            StreamValidationResult(isValid = false, errorMessage = "Invalid URL")
        }
    }

    override suspend fun searchStations(query: String): List<Station> {
        return stations.filter { it.name.contains(query, ignoreCase = true) }
    }

    override suspend fun syncWithRemote() {
        syncCalled = true
    }
}
