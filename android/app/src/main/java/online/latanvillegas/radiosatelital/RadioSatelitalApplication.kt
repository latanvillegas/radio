package online.latanvillegas.radiosatelital

import android.app.Application
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import online.latanvillegas.radiosatelital.data.bootstrap.StationsAssetLoader
import online.latanvillegas.radiosatelital.data.di.AppContainer
import online.latanvillegas.radiosatelital.data.sync.SyncScheduler

class RadioSatelitalApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    val appContainer: AppContainer by lazy {
        AppContainer(this)
    }

    override fun onCreate() {
        super.onCreate()
        bootstrapDataSync()
        scheduleBackgroundSync()
    }

    private fun bootstrapDataSync() {
        applicationScope.launch {
            seedLocalStationsIfEmpty()
            appContainer.syncStationsUseCase()
        }
    }

    private suspend fun seedLocalStationsIfEmpty() {
        val currentStations = appContainer.localStationDataSource.getSnapshot()
        if (currentStations.isNotEmpty()) {
            return
        }
        val stations = StationsAssetLoader.loadDefaultStations(this)
        appContainer.seedDefaultStationsUseCase(stations)
    }

    private fun scheduleBackgroundSync() {
        SyncScheduler.schedule(this)
    }
}
