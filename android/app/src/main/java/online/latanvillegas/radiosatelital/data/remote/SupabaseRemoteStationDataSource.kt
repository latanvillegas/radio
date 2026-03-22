package online.latanvillegas.radiosatelital.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.withContext
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.domain.models.StationStatus
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

/**
 * Implementación remota usando REST API de Supabase.
 */
class SupabaseRemoteStationDataSource(
    private val supabaseUrl: String,
    private val supabaseAnonKey: String,
    private val httpClient: OkHttpClient = OkHttpClient()
) : RemoteStationDataSource {

    private val remoteStationsState = MutableStateFlow<List<Station>>(emptyList())

    override fun observeGlobalStations(): Flow<List<Station>> = remoteStationsState

    override suspend fun fetchGlobalStations(): List<Station> = withContext(Dispatchers.IO) {
        if (supabaseUrl.isBlank() || supabaseAnonKey.isBlank()) {
            return@withContext emptyList()
        }

        val request = Request.Builder()
            .url("${supabaseUrl.trimEnd('/')}/rest/v1/stations?select=*")
            .header("apikey", supabaseAnonKey)
            .header("Authorization", "Bearer $supabaseAnonKey")
            .build()

        val response = httpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            return@withContext emptyList()
        }

        val jsonBody = response.body?.string().orEmpty()
        val parsed = parseStations(jsonBody)
        remoteStationsState.value = parsed
        parsed
    }

    override suspend fun upsertStations(stations: List<Station>) = withContext(Dispatchers.IO) {
        if (supabaseUrl.isBlank() || supabaseAnonKey.isBlank() || stations.isEmpty()) {
            remoteStationsState.value = stations
            return@withContext
        }

        val payload = JSONArray().apply {
            stations.forEach { put(it.toJson()) }
        }

        val request = Request.Builder()
            .url("${supabaseUrl.trimEnd('/')}/rest/v1/stations")
            .header("apikey", supabaseAnonKey)
            .header("Authorization", "Bearer $supabaseAnonKey")
            .header("Prefer", "resolution=merge-duplicates")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        httpClient.newCall(request).execute().close()
        remoteStationsState.value = stations
    }

    private fun parseStations(rawJson: String): List<Station> {
        return runCatching {
            val arr = JSONArray(rawJson)
            buildList {
                for (index in 0 until arr.length()) {
                    val item = arr.optJSONObject(index) ?: continue
                    add(item.toStation())
                }
            }
        }.getOrDefault(emptyList())
    }

    private fun JSONObject.toStation(): Station {
        return Station(
            id = optString("id", ""),
            name = optString("name", ""),
            url = optString("url", ""),
            country = optString("country", ""),
            region = optString("region", ""),
            district = optString("district", ""),
            locality = optString("locality", ""),
            imageUrl = optString("image_url", null),
            isFavorite = optBoolean("is_favorite", false),
            isGlobal = optBoolean("is_global", true),
            status = optString("status", StationStatus.ACTIVE.name).toStationStatus()
        )
    }

    private fun Station.toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("name", name)
            put("url", url)
            put("country", country)
            put("region", region)
            put("district", district)
            put("locality", locality)
            put("image_url", imageUrl)
            put("is_favorite", isFavorite)
            put("is_global", isGlobal)
            put("status", status.name)
        }
    }

    private fun String.toStationStatus(): StationStatus {
        return runCatching { StationStatus.valueOf(this) }.getOrDefault(StationStatus.ACTIVE)
    }
}
