package online.latanvillegas.radiosatelital.data.bootstrap

import online.latanvillegas.radiosatelital.domain.models.Station

fun defaultStations(): List<Station> {
    return listOf(
        Station(
            id = "1",
            name = "Los 40 Principales",
            url = "https://los40.streaming.media.rtve.es/los40/los40.m3u8",
            country = "Espana",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid",
            isFavorite = false,
            isGlobal = true
        ),
        Station(
            id = "2",
            name = "M80 Radio",
            url = "https://m80.streaming.media.rtve.es/m80fm/m80fm.m3u8",
            country = "Espana",
            region = "Madrid",
            district = "Centro",
            locality = "Madrid",
            isFavorite = true,
            isGlobal = true
        ),
        Station(
            id = "3",
            name = "Cadena SER",
            url = "https://cadenaser-streaming.media.rtve.es/cadenaser/cadenaser.m3u8",
            country = "Espana",
            region = "Barcelona",
            district = "Sarria",
            locality = "Barcelona",
            isFavorite = false,
            isGlobal = true
        ),
        Station(
            id = "4",
            name = "Rock FM",
            url = "https://rockfm.streaming.media.rtve.es/rockfm/rockfm.m3u8",
            country = "Espana",
            region = "Valencia",
            district = "Centro",
            locality = "Valencia",
            isFavorite = true,
            isGlobal = true
        )
    )
}
