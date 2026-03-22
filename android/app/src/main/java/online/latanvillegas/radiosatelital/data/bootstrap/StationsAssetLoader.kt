package online.latanvillegas.radiosatelital.data.bootstrap

import android.content.Context
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StationStatus
import org.json.JSONArray

object StationsAssetLoader {
    private const val DEFAULT_STATIONS_ASSET = "default_stations.json"

    fun loadDefaultStations(context: Context): List<Station> {
        return runCatching {
            val json = context.assets.open(DEFAULT_STATIONS_ASSET).bufferedReader().use { it.readText() }
            parseStations(json)
        }.getOrElse {
            defaultStations()
        }
    }

    private fun parseStations(rawJson: String): List<Station> {
        val arr = JSONArray(rawJson)
        return buildList {
            for (index in 0 until arr.length()) {
                val item = arr.optJSONObject(index) ?: continue
                add(
                    Station(
                        id = item.optString("id", ""),
                        name = item.optString("name", ""),
                        url = item.optString("url", ""),
                        country = item.optString("country", ""),
                        region = item.optString("region", ""),
                        district = item.optString("district", ""),
                        locality = item.optString("locality", ""),
                        imageUrl = item.optString("imageUrl", null),
                        isFavorite = item.optBoolean("isFavorite", false),
                        isGlobal = item.optBoolean("isGlobal", true),
                        status = item.optString("status", StationStatus.ACTIVE.name).toStationStatus()
                    )
                )
            }
        }
    }

    private fun String.toStationStatus(): StationStatus {
        return runCatching { StationStatus.valueOf(this) }.getOrDefault(StationStatus.ACTIVE)
    }
}
