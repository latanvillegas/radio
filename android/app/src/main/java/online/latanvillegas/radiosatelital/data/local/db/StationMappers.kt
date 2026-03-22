package online.latanvillegas.radiosatelital.data.local.db

import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StationStatus

fun StationEntity.toDomain(): Station {
    return Station(
        id = id,
        name = name,
        url = url,
        country = country,
        region = region,
        district = district,
        locality = locality,
        imageUrl = imageUrl,
        isFavorite = isFavorite,
        isGlobal = isGlobal,
        status = status.toStationStatus()
    )
}

fun Station.toEntity(): StationEntity {
    return StationEntity(
        id = id,
        name = name,
        url = url,
        country = country,
        region = region,
        district = district,
        locality = locality,
        imageUrl = imageUrl,
        isFavorite = isFavorite,
        isGlobal = isGlobal,
        status = status.name
    )
}

private fun String.toStationStatus(): StationStatus {
    return runCatching { StationStatus.valueOf(this) }.getOrDefault(StationStatus.ACTIVE)
}
