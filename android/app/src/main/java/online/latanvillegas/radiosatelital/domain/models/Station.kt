package online.latanvillegas.radiosatelital.domain.models

/**
 * Modelo de dominio para una estación de radio.
 * Representa los datos esenciales de una estación.
 */
data class Station(
    val id: String,
    val name: String,
    val url: String,
    val country: String,
    val region: String,
    val district: String,
    val locality: String,
    val imageUrl: String? = null,
    val isFavorite: Boolean = false,
    val isGlobal: Boolean = false,
    val status: StationStatus = StationStatus.ACTIVE
)

/**
 * Estados posibles de una estación.
 */
enum class StationStatus {
    ACTIVE,
    INACTIVE,
    PENDING_MODERATION,
    REJECTED
}

/**
 * Resultado de la validación de un stream.
 */
data class StreamValidationResult(
    val isValid: Boolean,
    val errorMessage: String? = null,
    val bitrate: Int? = null,
    val format: String? = null
)
