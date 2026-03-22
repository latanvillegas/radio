package online.latanvillegas.radiosatelital.data.remote

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import online.latanvillegas.radiosatelital.domain.models.Station

/**
 * Implementación remota temporal. Reemplazar por Supabase API.
 */
class FakeRemoteStationDataSource : RemoteStationDataSource {

    private val remoteStationsState = MutableStateFlow<List<Station>>(emptyList())

    override fun observeGlobalStations(): Flow<List<Station>> = remoteStationsState

    override suspend fun fetchGlobalStations(): List<Station> = remoteStationsState.value

    override suspend fun upsertStations(stations: List<Station>) {
        remoteStationsState.value = stations
    }
}
