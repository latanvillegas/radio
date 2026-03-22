package online.latanvillegas.radiosatelital.data.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import online.latanvillegas.radiosatelital.RadioSatelitalApplication

/**
 * Worker encargado de sincronizar estaciones con backend remoto.
 */
class StationSyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val app = applicationContext as RadioSatelitalApplication
        return app.appContainer.syncStationsUseCase()
            .fold(
                onSuccess = { Result.success() },
                onFailure = { Result.retry() }
            )
    }
}
