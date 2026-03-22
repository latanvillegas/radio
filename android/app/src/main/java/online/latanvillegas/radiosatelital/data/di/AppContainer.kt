package online.latanvillegas.radiosatelital.data.di

import android.content.Context
import androidx.room.Room
import online.latanvillegas.radiosatelital.data.local.LocalStationDataSource
import online.latanvillegas.radiosatelital.data.local.RoomLocalStationDataSource
import online.latanvillegas.radiosatelital.data.local.db.AppDatabase
import online.latanvillegas.radiosatelital.data.remote.FakeRemoteStationDataSource
import online.latanvillegas.radiosatelital.data.remote.RemoteStationDataSource
import online.latanvillegas.radiosatelital.data.remote.SupabaseRemoteStationDataSource
import online.latanvillegas.radiosatelital.data.repositories.StationRepositoryImpl
import online.latanvillegas.radiosatelital.BuildConfig
import online.latanvillegas.radiosatelital.domain.repositories.StationRepository
import online.latanvillegas.radiosatelital.domain.usecases.GetFavoriteStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ObserveStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.PlayStationUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SearchStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SeedDefaultStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.SyncStationsUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ToggleFavoriteUseCase
import online.latanvillegas.radiosatelital.domain.usecases.ValidateStreamUseCase
import online.latanvillegas.radiosatelital.presentation.viewmodels.RadioViewModelFactory

/**
 * Contenedor simple de dependencias para desacoplar creación de objetos.
 */
class AppContainer(private val context: Context) {
    private val appDatabase: AppDatabase by lazy {
        Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "radio_satelital.db"
        ).fallbackToDestructiveMigration().build()
    }

    val localStationDataSource: LocalStationDataSource by lazy {
        RoomLocalStationDataSource(appDatabase.stationDao())
    }

    val remoteStationDataSource: RemoteStationDataSource by lazy {
        val supabaseUrl = BuildConfig.SUPABASE_URL
        val supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY

        if (supabaseUrl.isNotBlank() && supabaseAnonKey.isNotBlank()) {
            SupabaseRemoteStationDataSource(
                supabaseUrl = supabaseUrl,
                supabaseAnonKey = supabaseAnonKey
            )
        } else {
            FakeRemoteStationDataSource()
        }
    }

    val stationRepository: StationRepository by lazy {
        StationRepositoryImpl(
            localDataSource = localStationDataSource,
            remoteDataSource = remoteStationDataSource
        )
    }

    val playStationUseCase: PlayStationUseCase by lazy {
        PlayStationUseCase(stationRepository)
    }

    val observeStationsUseCase: ObserveStationsUseCase by lazy {
        ObserveStationsUseCase(stationRepository)
    }

    val getFavoriteStationsUseCase: GetFavoriteStationsUseCase by lazy {
        GetFavoriteStationsUseCase(stationRepository)
    }

    val validateStreamUseCase: ValidateStreamUseCase by lazy {
        ValidateStreamUseCase(stationRepository)
    }

    val searchStationsUseCase: SearchStationsUseCase by lazy {
        SearchStationsUseCase(stationRepository)
    }

    val toggleFavoriteUseCase: ToggleFavoriteUseCase by lazy {
        ToggleFavoriteUseCase(stationRepository)
    }

    val syncStationsUseCase: SyncStationsUseCase by lazy {
        SyncStationsUseCase(stationRepository)
    }

    val seedDefaultStationsUseCase: SeedDefaultStationsUseCase by lazy {
        SeedDefaultStationsUseCase(stationRepository)
    }

    val radioViewModelFactory: RadioViewModelFactory by lazy {
        RadioViewModelFactory(
            observeStationsUseCase = observeStationsUseCase,
            searchStationsUseCase = searchStationsUseCase,
            toggleFavoriteUseCase = toggleFavoriteUseCase
        )
    }
}
