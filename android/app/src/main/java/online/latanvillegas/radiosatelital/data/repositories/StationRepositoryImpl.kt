package online.latanvillegas.radiosatelital.data.repositories

import kotlinx.coroutines.flow.Flow
import online.latanvillegas.radiosatelital.data.local.InMemoryLocalStationDataSource
import online.latanvillegas.radiosatelital.data.local.LocalStationDataSource
import online.latanvillegas.radiosatelital.data.remote.FakeRemoteStationDataSource
import online.latanvillegas.radiosatelital.data.remote.RemoteStationDataSource
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StreamValidationResult
import online.latanvillegas.radiosatelital.domain.repositories.StationRepository

/**
 * Implementación de StationRepository que combina fuentes locales y remotas.
 * Implementa patrón de Repository con fallback a datos locales.
 */
class StationRepositoryImpl(
    private val localDataSource: LocalStationDataSource = InMemoryLocalStationDataSource(sampleStations()),
    private val remoteDataSource: RemoteStationDataSource = FakeRemoteStationDataSource()
) : StationRepository {
    
    override fun getAllStationsFlow(): Flow<List<Station>> {
        return localDataSource.observeStations()
    }

    override fun getGlobalStationsFlow(): Flow<List<Station>> {
        return remoteDataSource.observeGlobalStations()
    }

    override suspend fun getStationById(id: String): Station? {
        return localDataSource.getById(id)
    }

    override suspend fun insertStation(station: Station): String {
        localDataSource.upsert(station)
        return station.id
    }

    override suspend fun updateStation(station: Station) {
        localDataSource.upsert(station)
    }

    override suspend fun deleteStation(id: String) {
        localDataSource.deleteById(id)
    }

    override fun getFavoriteStationsFlow(): Flow<List<Station>> {
        return localDataSource.observeFavoriteStations()
    }

    override suspend fun toggleFavorite(id: String, isFavorite: Boolean) {
        val station = localDataSource.getById(id) ?: return
        localDataSource.upsert(station.copy(isFavorite = isFavorite))
    }

    override suspend fun validateStream(url: String): StreamValidationResult {
        // TODO: Implementar validación de stream
        return StreamValidationResult(
            isValid = url.isNotEmpty() && (url.startsWith("http://") || url.startsWith("https://"))
        )
    }

    override suspend fun searchStations(query: String): List<Station> {
        return localDataSource.search(query)
    }

    override suspend fun syncWithRemote() {
        val remoteStations = remoteDataSource.fetchGlobalStations()
        remoteStations.forEach { station ->
            localDataSource.upsert(station)
        }

        val globalStations = localDataSource.getSnapshot().filter { it.isGlobal }
        remoteDataSource.upsertStations(globalStations)
    }

    /**
     * Datos de ejemplo para desarrollo.
     */
    companion object {
        private fun sampleStations(): List<Station> {
        return listOf(
            Station(
                id = "1",
                name = "Los 40 Principales",
                url = "https://los40.streaming.media.rtve.es/los40/los40.m3u8",
                country = "España",
                region = "Madrid",
                district = "Centro",
                locality = "Madrid",
                isFavorite = false
            ),
            Station(
                id = "2",
                name = "M80 Radio",
                url = "https://m80.streaming.media.rtve.es/m80fm/m80fm.m3u8",
                country = "España",
                region = "Madrid",
                district = "Centro",
                locality = "Madrid",
                isFavorite = true
            ),
            Station(
                id = "3",
                name = "Cadena SER",
                url = "https://cadenaser-streaming.media.rtve.es/cadenaser/cadenaser.m3u8",
                country = "España",
                region = "Barcelona",
                district = "Sarrià",
                locality = "Barcelona",
                isFavorite = false
            ),
            Station(
                id = "4",
                name = "Rock FM",
                url = "https://rockfm.streaming.media.rtve.es/rockfm/rockfm.m3u8",
                country = "España",
                region = "Valencia",
                district = "Centro",
                locality = "Valencia",
                isFavorite = true
            )
        )
    }
    }
}
