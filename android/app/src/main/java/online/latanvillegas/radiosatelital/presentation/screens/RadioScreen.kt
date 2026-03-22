package online.latanvillegas.radiosatelital.presentation.screens

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import online.latanvillegas.radiosatelital.domain.models.Station
import online.latanvillegas.radiosatelital.presentation.viewmodels.RadioViewModel

/**
 * Pantalla principal de radio con lista de estaciones.
 */
@Composable
fun RadioScreen(
    viewModel: RadioViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        RadioScreenHeader()

        // Search bar
        SearchBar(
            query = uiState.searchQuery,
            onQueryChange = { viewModel.searchStations(it) },
            modifier = Modifier.padding(16.dp)
        )

        // Loading indicator
        if (uiState.isLoading) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.scrim.copy(alpha = 0.32f)),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator()
            }
        } else {
            // Estaciones list
            StationsList(
                stations = uiState.stations,
                currentStation = uiState.currentStation,
                isPlaying = uiState.isPlaying,
                onPlayClick = { viewModel.playStation(it) },
                onPauseClick = { viewModel.pauseStation() },
                onFavoriteClick = { viewModel.toggleFavorite(it.id) },
                modifier = Modifier.weight(1f)
            )

            // Error message
            val errorMessage = uiState.errorMessage
            if (errorMessage != null) {
                ErrorSnackBar(
                    message = errorMessage,
                    onDismiss = { viewModel.clearError() }
                )
            }
        }
    }
}

@Composable
private fun RadioScreenHeader() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primary)
            .padding(16.dp)
    ) {
        Text(
            text = "📻 Radio Satelital",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onPrimary
        )
        Text(
            text = "Selecciona una estación",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var textFieldValue by remember {
        mutableStateOf(TextFieldValue(query))
    }

    OutlinedTextField(
        value = textFieldValue,
        onValueChange = {
            textFieldValue = it
            onQueryChange(it.text)
        },
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp),
        placeholder = { Text("Buscar estación...") },
        singleLine = true,
        shape = MaterialTheme.shapes.medium,
        colors = TextFieldDefaults.colors(
            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    )
}

@Composable
private fun StationsList(
    stations: List<Station>,
    currentStation: Station?,
    isPlaying: Boolean,
    onPlayClick: (Station) -> Unit,
    onPauseClick: () -> Unit,
    onFavoriteClick: (Station) -> Unit,
    modifier: Modifier = Modifier
) {
    if (stations.isEmpty()) {
        Column(
            modifier = modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("No hay estaciones disponibles")
        }
    } else {
        LazyColumn(modifier = modifier) {
            items(stations) { station ->
                StationItem(
                    station = station,
                    isCurrentStation = currentStation?.id == station.id,
                    isPlaying = isPlaying && currentStation?.id == station.id,
                    onPlayClick = { onPlayClick(station) },
                    onPauseClick = onPauseClick,
                    onFavoriteClick = { onFavoriteClick(station) }
                )
                HorizontalDivider()
            }
        }
    }
}

@Composable
private fun StationItem(
    station: Station,
    isCurrentStation: Boolean,
    isPlaying: Boolean,
    onPlayClick: () -> Unit,
    onPauseClick: () -> Unit,
    onFavoriteClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onPlayClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = station.name,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "${station.country} - ${station.region}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Play/Pause button
            if (isCurrentStation) {
                IconButton(
                    onClick = { if (isPlaying) onPauseClick() else onPlayClick() }
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "Pausar" else "Reproducir",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            } else {
                IconButton(onClick = { onPlayClick() }) {
                    Text("Play", fontWeight = FontWeight.Medium)
                }
            }

            // Favorite button
            IconButton(onClick = { onFavoriteClick() }) {
                Text(
                    text = if (station.isFavorite) "Fav" else "Add"
                )
            }
        }
    }
}

@Composable
private fun ErrorSnackBar(
    message: String,
    onDismiss: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.error)
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.onError,
            style = MaterialTheme.typography.bodySmall
        )
        TextButton(onClick = onDismiss) {
            Text("OK", color = MaterialTheme.colorScheme.onError)
        }
    }
}
