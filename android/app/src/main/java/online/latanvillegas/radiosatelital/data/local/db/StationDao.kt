package online.latanvillegas.radiosatelital.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface StationDao {
    @Query("SELECT * FROM stations ORDER BY name ASC")
    fun observeStations(): Flow<List<StationEntity>>

    @Query("SELECT * FROM stations WHERE is_favorite = 1 ORDER BY name ASC")
    fun observeFavoriteStations(): Flow<List<StationEntity>>

    @Query("SELECT * FROM stations WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): StationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(station: StationEntity)

    @Query("DELETE FROM stations WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query(
        """
        SELECT * FROM stations
        WHERE name LIKE '%' || :query || '%'
           OR country LIKE '%' || :query || '%'
           OR region LIKE '%' || :query || '%'
        ORDER BY name ASC
        """
    )
    suspend fun search(query: String): List<StationEntity>

    @Query("SELECT * FROM stations")
    suspend fun getSnapshot(): List<StationEntity>
}
