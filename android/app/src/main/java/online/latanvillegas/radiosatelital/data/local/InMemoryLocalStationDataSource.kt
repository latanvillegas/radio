package online.latanvillegas.radiosatelital.data.local

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import online.latanvillegas.radiosatelital.domain.models.Station

/**
 * Implementación temporal en memoria para desarrollo local.
 */
class InMemoryLocalStationDataSource(
    initialStations: List<Station> = emptyList()
) : LocalStationDataSource {

    private val stationsState = MutableStateFlow(initialStations)

    override fun observeStations(): Flow<List<Station>> = stationsState

    override fun observeFavoriteStations(): Flow<List<Station>> {
        return stationsState.map { stations -> stations.filter { it.isFavorite } }
    }

    override suspend fun getById(id: String): Station? {
        return stationsState.value.find { it.id == id }
    }

    override suspend fun upsert(station: Station) {
        val current = stationsState.value
        val index = current.indexOfFirst { it.id == station.id }
        stationsState.value = if (index >= 0) {
            current.toMutableList().also { it[index] = station }
        } else {
            current + station
        }
    }

    override suspend fun deleteById(id: String) {
        stationsState.value = stationsState.value.filterNot { it.id == id }
    }

    override suspend fun search(query: String): List<Station> {
        return stationsState.value.filter { station ->
            station.name.contains(query, ignoreCase = true) ||
            station.country.contains(query, ignoreCase = true) ||
            station.region.contains(query, ignoreCase = true)
        }
    }

    override suspend fun getSnapshot(): List<Station> = stationsState.value
}
