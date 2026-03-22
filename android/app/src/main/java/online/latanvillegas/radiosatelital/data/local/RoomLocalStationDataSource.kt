package online.latanvillegas.radiosatelital.data.local

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import online.latanvillegas.radiosatelital.data.local.db.StationDao
import online.latanvillegas.radiosatelital.data.local.db.toDomain
import online.latanvillegas.radiosatelital.data.local.db.toEntity
import online.latanvillegas.radiosatelital.domain.models.Station

/**
 * Data source local respaldado por Room.
 */
class RoomLocalStationDataSource(
    private val stationDao: StationDao
) : LocalStationDataSource {

    override fun observeStations(): Flow<List<Station>> {
        return stationDao.observeStations().map { entities -> entities.map { it.toDomain() } }
    }

    override fun observeFavoriteStations(): Flow<List<Station>> {
        return stationDao.observeFavoriteStations().map { entities -> entities.map { it.toDomain() } }
    }

    override suspend fun getById(id: String): Station? {
        return stationDao.getById(id)?.toDomain()
    }

    override suspend fun upsert(station: Station) {
        stationDao.upsert(station.toEntity())
    }

    override suspend fun deleteById(id: String) {
        stationDao.deleteById(id)
    }

    override suspend fun search(query: String): List<Station> {
        return stationDao.search(query).map { it.toDomain() }
    }

    override suspend fun getSnapshot(): List<Station> {
        return stationDao.getSnapshot().map { it.toDomain() }
    }
}
