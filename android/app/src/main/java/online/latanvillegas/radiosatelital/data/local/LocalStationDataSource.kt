package online.latanvillegas.radiosatelital.data.local

import kotlinx.coroutines.flow.Flow
import online.latanvillegas.radiosatelital.domain.models.Station

/**
 * Contrato de acceso a estaciones locales.
 */
interface LocalStationDataSource {
    fun observeStations(): Flow<List<Station>>
    fun observeFavoriteStations(): Flow<List<Station>>
    suspend fun getById(id: String): Station?
    suspend fun upsert(station: Station)
    suspend fun deleteById(id: String)
    suspend fun search(query: String): List<Station>
    suspend fun getSnapshot(): List<Station>
}
