package online.latanvillegas.radiosatelital.domain.usecases

import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.repositories.StationRepository

/**
 * UseCase para observar estaciones en tiempo real.
 */
class ObserveStationsUseCase(private val stationRepository: StationRepository) {
    operator fun invoke() = stationRepository.getAllStationsFlow()
}

/**
 * UseCase para reproducir una estación.
 * Encapsula la lógica de negocio de reproducción.
 */
class PlayStationUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(stationId: String): Result<Station> {
        return try {
            val station = stationRepository.getStationById(stationId)
            if (station != null) {
                Result.success(station)
            } else {
                Result.failure(IllegalArgumentException("Estación no encontrada"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * UseCase para obtener estaciones favoritas.
 */
class GetFavoriteStationsUseCase(private val stationRepository: StationRepository) {
    operator fun invoke() = stationRepository.getFavoriteStationsFlow()
}

/**
 * UseCase para validar un stream antes de guardarlo.
 */
class ValidateStreamUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(url: String): Result<Boolean> {
        return try {
            val result = stationRepository.validateStream(url)
            if (result.isValid) {
                Result.success(true)
            } else {
                Result.failure(IllegalArgumentException(result.errorMessage ?: "Stream inválido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * UseCase para buscar estaciones por texto libre.
 */
class SearchStationsUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(query: String): Result<List<Station>> {
        return try {
            Result.success(stationRepository.searchStations(query))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * UseCase para alternar estado favorito de una estación.
 */
class ToggleFavoriteUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(stationId: String, isFavorite: Boolean): Result<Unit> {
        return try {
            stationRepository.toggleFavorite(stationId, isFavorite)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * UseCase para sincronizar con backend remoto.
 */
class SyncStationsUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(): Result<Unit> {
        return try {
            stationRepository.syncWithRemote()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

/**
 * UseCase para sembrar estaciones iniciales cuando la base local esta vacia.
 */
class SeedDefaultStationsUseCase(private val stationRepository: StationRepository) {
    suspend operator fun invoke(stations: List<Station>): Result<Unit> {
        return try {
            stations.forEach { station ->
                stationRepository.insertStation(station)
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
