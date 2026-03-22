package online.latanvillegas.radiosatelital.domain.repositories

import kotlinx.coroutines.flow.Flow
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StreamValidationResult

/**
 * Repository interface para gestionar estaciones de radio.
 * Define contratos sin depender de implementaciones específicas.
 */
interface StationRepository {
    /**
     * Obtiene todas las estaciones locales como Flow.
     */
    fun getAllStationsFlow(): Flow<List<Station>>

    /**
     * Obtiene todas las estaciones globales (de Supabase) como Flow.
     */
    fun getGlobalStationsFlow(): Flow<List<Station>>

    /**
     * Obtiene una estación por ID.
     */
    suspend fun getStationById(id: String): Station?

    /**
     * Inserta una nueva estación localmente.
     */
    suspend fun insertStation(station: Station): String

    /**
     * Actualiza una estación existente.
     */
    suspend fun updateStation(station: Station)

    /**
     * Elimina una estación por ID.
     */
    suspend fun deleteStation(id: String)

    /**
     * Obtiene estaciones favoritas.
     */
    fun getFavoriteStationsFlow(): Flow<List<Station>>

    /**
     * Marca una estación como favorita.
     */
    suspend fun toggleFavorite(id: String, isFavorite: Boolean)

    /**
     * Valida un stream de URL.
     */
    suspend fun validateStream(url: String): StreamValidationResult

    /**
     * Busca estaciones por nombre.
     */
    suspend fun searchStations(query: String): List<Station>

    /**
     * Sincroniza estaciones con servidor remoto.
     */
    suspend fun syncWithRemote()
}
