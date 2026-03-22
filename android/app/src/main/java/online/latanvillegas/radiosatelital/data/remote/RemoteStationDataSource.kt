package online.latanvillegas.radiosatelital.data.remote

import kotlinx.coroutines.flow.Flow
import online.latanvillegas.radiosatelital.domain.models.Station

/**
 * Contrato para fuente remota de estaciones globales.
 */
interface RemoteStationDataSource {
    fun observeGlobalStations(): Flow<List<Station>>
    suspend fun fetchGlobalStations(): List<Station>
    suspend fun upsertStations(stations: List<Station>)
}
