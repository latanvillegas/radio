# 📐 Architecture Documentation - Radio Satelital (Native Android)

## 📋 Tabla de Contenidos

- [Overview](#overview)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Module Structure](#module-structure)
- [Patterns & Best Practices](#patterns--best-practices)
- [Testing Strategy](#testing-strategy)
- [Dependency Graph](#dependency-graph)

---

## 🎯 Overview

**Radio Satelital** implementa una arquitectura de **Clean Architecture** con tres capas claramente separadas:

```
┌─────────────────────────────────────────────────┐
│         PRESENTATION LAYER                       │
│  (Jetpack Compose, ViewModels, Screens)         │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         DOMAIN LAYER                            │
│  (Models, Repositories, UseCases)               │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         DATA LAYER                              │
│  (Room Local, Supabase Remote, Mappers)         │
└─────────────────────────────────────────────────┘
```

### Beneficios:

✅ **Testability** - Cada capa es testeable independientemente  
✅ **Maintainability** - Cambios en una capa no afectan otras  
✅ **Reusability** - Domain layer es independiente del framework  
✅ **Scalability** - Fácil agregar nuevas features  

---

## 🏗️ Architecture Layers

### 1. Presentation Layer

**Responsabilidad**: Mostrar datos al usuario e capturar interacciones.

**Estructura**:
```
presentation/
├── screens/
│   ├── RadioScreen.kt          # Pantalla principal de estaciones
│   ├── FavoritesScreen.kt      # Pantalla de favoritos
│   └── PlayerScreen.kt         # Pantalla del reproductor
├── components/
│   ├── StationCard.kt          # Componente de tarjeta de estación
│   ├── PlayButton.kt           # Botón de reproducción
│   └── SearchBar.kt            # Barra de búsqueda
└── viewmodels/
    ├── RadioViewModel.kt       # ViewModel principal
    ├── PlayerViewModel.kt      # ViewModel del reproductor
    └── SearchViewModel.kt      # ViewModel de búsqueda
```

**Tech Stack**:
- Jetpack Compose (UI framework)
- ViewModel (state management)
- StateFlow (reactive streams)
- Navigation Compose (routing)

**Key Responsibilities**:
- Renderizar UI components
- Capturar user interactions
- Observar cambios de state desde ViewModels
- Mantener estado de UI (selecciones, scroll position, etc)

### 2. Domain Layer

**Responsabilidad**: Contiene la lógica de negocio pura, independiente de Android.

**Estructura**:
```
domain/
├── models/
│   ├── Station.kt              # Data class principal
│   └── StreamValidationResult.kt
├── repositories/
│   └── StationRepository.kt    # Interface del repositorio
└── usecases/
    ├── PlayStationUseCase.kt
    ├── GetFavoritesUseCase.kt
    └── ValidateStreamUseCase.kt
```

**Tech Stack**:
- Pure Kotlin (sin dependencias Android)
- Coroutines (async operations)
- Flow (reactive patterns)

**Key Responsibilities**:
- Definir modelos de dominio
- Establecer contratos (interfaces) de repositorios
- Implementar lógica de negocio en UseCases
- Validar reglas de negocio

### 3. Data Layer

**Responsabilidad**: Gestionar datos desde múltiples fuentes (local y remota).

**Estructura**:
```
data/
├── local/
│   ├── RoomDatabase.kt         # SQLite database setup
│   ├── StationDao.kt           # Data access object
│   └── LocalDataSource.kt      # Local operations
├── remote/
│   ├── SupabaseClient.kt       # Supabase configuration
│   ├── StationApiService.kt    # HTTP endpoints
│   └── RemoteDataSource.kt     # Remote operations
├── mappers/
│   └── StationMapper.kt        # DTO ↔ Domain models
└── repositories/
    └── StationRepositoryImpl.kt # Implementación del repository
```

**Tech Stack**:
- Room (SQLite database)
- Retrofit (HTTP client)
- Supabase Kotlin Client (Backend)
- OkHttp (Interceptors, security)

**Key Responsibilities**:
- Acceder a datos locales (Room)
- Acceder a datos remotos (Supabase API)
- Cachear datos (offline support)
- Mapear DTOs a domain models
- Sincronizar datos entre fuentes

---

## 🔄 Data Flow

### Flujo de Lectura (Get Stations)

```
UI (RadioScreen)
    ↓ (subscribeToFlow)
ViewModel.stationFlow (StateFlow<List<Station>>)
    ↓ (observedBy)
Repository.getAllStationsFlow()
    ↓ (combineFlows)
LocalDataSource.getAllStations() + RemoteDataSource.getStations()
    ↓
Room Database / Supabase API
```

**Código de ejemplo**:

```kotlin
// En ViewModel
val stationsFlow: StateFlow<List<Station>> = 
    stationRepository.getAllStationsFlow()
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

// En UI
@Composable
fun RadioScreen(viewModel: RadioViewModel) {
    val stations by viewModel.stationsFlow.collectAsState()
    StationsList(stations)
}
```

### Flujo de Escritura (Save Station)

```
UI (SaveButton)
    ↓ (click)
ViewModel.insertStation(station)
    ↓
UseCase.insertStationUseCase(station)
    ↓
Repository.insertStation(station)
    ↓
LocalDataSource.insertStation(station)  +  RemoteDataSource.insertStation(station)
    ↓
Room INSERT  +  Supabase INSERT
    ↓
Success/Error → Back to ViewModel (flow emitted)
```

---

## 📦 Module Structure

```
android/app/src/main/java/online/latanvillegas/radiosatelital/
│
├── presentation/
│   ├── screens/
│   │   ├── RadioScreen.kt
│   │   ├── FavoritesScreen.kt
│   │   └── PlayerScreen.kt
│   ├── components/
│   │   ├── StationCard.kt
│   │   └── ...
│   └── viewmodels/
│       ├── RadioViewModel.kt
│       └── ...
│
├── domain/
│   ├── models/
│   │   ├── Station.kt
│   │   └── ...
│   ├── repositories/
│   │   └── StationRepository.kt
│   └── usecases/
│       ├── PlayStationUseCase.kt
│       └── ...
│
└── data/
    ├── local/
    │   ├── RoomDatabase.kt
    │   └── ...
    ├── remote/
    │   ├── SupabaseClient.kt
    │   └── ...
    ├── mappers/
    │   └── StationMapper.kt
    └── repositories/
        └── StationRepositoryImpl.kt
```

---

## 🎯 Patterns & Best Practices

### 1. MVVM Pattern

```kotlin
// ViewModel expone UI state como StateFlow
class RadioViewModel(repository: StationRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(RadioUiState())
    val uiState: StateFlow<RadioUiState> = _uiState.asStateFlow()
}

// UI observa cambios
@Composable
fun RadioScreen(viewModel: RadioViewModel) {
    val uiState by viewModel.uiState.collectAsState()
}
```

### 2. Repository Pattern

```kotlin
// Domain: Interface (contrato)
interface StationRepository {
    fun getAllStationsFlow(): Flow<List<Station>>
    suspend fun insertStation(station: Station): String
}

// Data: Implementación (múltiples fuentes)
class StationRepositoryImpl(
    localDataSource: LocalDataSource,
    remoteDataSource: RemoteDataSource
) : StationRepository {
    override fun getAllStationsFlow() = flowOf(
        localDataSource.getAll().combine(
            remoteDataSource.getAll()
        ) { local, remote -> local + remote }
    )
}
```

### 3. Use Case Pattern

```kotlin
// Pure business logic
class PlayStationUseCase(repository: StationRepository) {
    suspend operator fun invoke(stationId: String): Result<Station> {
        return try {
            val station = repository.getStationById(stationId)
            Result.success(station ?: throw Exception("Not found"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 4. Dependency Injection (Hilt)

```kotlin
// Define dependencies
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideStationRepository(): StationRepository {
        return StationRepositoryImpl(...)
    }
}

// Inject in ViewModel
class RadioViewModel @Inject constructor(
    private val stationRepository: StationRepository
) : ViewModel()
```

---

## ✅ Testing Strategy

### Unit Tests (Domain + ViewModel)

```kotlin
class RadioViewModelTest {
    @Test
    fun testPlayStation() = runTest {
        val viewModel = RadioViewModel(fakeRepository)
        viewModel.playStation(testStation)
        
        assert(viewModel.uiState.value.isPlaying)
    }
}
```

**Herramientas**:
- JUnit 4 (testing framework)
- MockK (mocking)
- Turbine (Flow testing)
- Coroutines Test (runTest)

### Integration Tests (Data Layer)

```kotlin
@RunWith(AndroidJUnit4::class)
class StationDaoTest {
    @Test
    fun testInsertAndRetrieve() {
        val station = createTestStation()
        dao.insert(station)
        
        val retrieved = dao.getById(station.id)
        assert(retrieved.name == station.name)
    }
}
```

### UI Tests (Espresso/Compose)

```kotlin
@RunWith(AndroidJUnit4::class)
class RadioScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun testStationListDisplayed() {
        composeTestRule.setContent {
            RadioScreen(viewModel)
        }
        
        composeTestRule.onNodeWithText("Test Radio").assertIsDisplayed()
    }
}
```

---

## 🔗 Dependency Graph

```
MainActivity
    ↓ injects
RadioViewModel
    ├─ injects → StationRepository (interface)
    │               ↓ implemented by
    │           StationRepositoryImpl
    │               ├─ LocalDataSource (Room)
    │               └─ RemoteDataSource (Supabase)
    │
    └─ injects → PlayStationUseCase
```

---

## 🚀 Flujo de Agregar Nueva Feature

1. **Domain Layer**: Define modelo y repository interface
2. **Data Layer**: Implanta donde guardar datos (Room / Supabase)
3. **Presentation**: Crea ViewModel y Screen con Compose
4. **Tests**: Escribe tests en cada capa
5. **Integration**: Conecta todo con Dependency Injection

**Ejemplo - Agregar Rating a Estaciones**:

```kotlin
// 1. Domain Model
data class Station(
    // ... existing fields
    val rating: Float = 0f
)

// 2. Repository
interface StationRepository {
    suspend fun rateStation(stationId: String, rating: Float)
}

// 3. UseCase
class RateStationUseCase(repository: StationRepository) {
    suspend operator fun invoke(id: String, rating: Float) { ... }
}

// 4. ViewModel
fun rateStation(stationId: String, rating: Float) {
    viewModelScope.launch {
        repository.rateStation(stationId, rating)
    }
}

// 5. UI
Button(onClick = { viewModel.rateStation(id, 4f) }) {
    Text("⭐⭐⭐⭐")
}

// 6. Tests
@Test
fun testRateStation() { ... }
```

---

## 📊 Code Metrics & Quality

Este proyecto incluye:

- **Detekt**: Control de estándares Kotlin (700+ reglas)
- **Unit Tests**: Cobertura >70% en capas críticas
- **CI/CD**: GitHub Actions para build automático

---

**Última actualización**: 2026-03-21  
**Versión de Arquitectura**: 1.0  
**Stack**: Kotlin + Jetpack Compose + Room + Supabase
