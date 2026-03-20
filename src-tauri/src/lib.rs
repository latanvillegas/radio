use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{IpAddr, Ipv4Addr};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use url::Url;

#[derive(Debug, Serialize, Deserialize)]
struct CustomStation {
    name: String,
    url: String,
    country: String,
    region: String,
    district: Option<String>,
    caserio: Option<String>,
    isCustom: bool,
}

#[derive(Debug, Deserialize)]
struct NewCustomStation {
    name: String,
    url: String,
    country: String,
    region: String,
    district: Option<String>,
    caserio: Option<String>,
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo obtener app_data_dir: {e}"))?;

    fs::create_dir_all(&dir).map_err(|e| format!("No se pudo crear carpeta de datos: {e}"))?;

    dir.push("radio_satelital.db");
    Ok(dir)
}

fn open_db(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(path).map_err(|e| format!("No se pudo abrir SQLite: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS custom_stations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            country TEXT NOT NULL,
            region TEXT NOT NULL,
            district TEXT,
            caserio TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, url)
        )",
        [],
    )
    .map_err(|e| format!("No se pudo crear tabla custom_stations: {e}"))?;

    Ok(conn)
}

fn is_private_or_local_host(host: &str) -> bool {
    let h = host.trim().to_ascii_lowercase();
    if h.is_empty() {
        return true;
    }

    if h == "localhost" || h.ends_with(".local") {
        return true;
    }

    if let Ok(ip) = h.parse::<IpAddr>() {
        return match ip {
            IpAddr::V4(v4) => {
                v4.is_private()
                    || v4.is_loopback()
                    || v4.is_link_local()
                    || v4.is_unspecified()
                    || v4 == Ipv4Addr::new(0, 0, 0, 0)
            }
            IpAddr::V6(v6) => {
                v6.is_loopback()
                    || v6.is_unspecified()
                    || v6.is_unique_local()
                    || v6.is_unicast_link_local()
            }
        };
    }

    false
}

fn validate_public_stream_url(raw: &str) -> Result<String, String> {
    let parsed = Url::parse(raw).map_err(|_| "La URL no es válida".to_string())?;
    let scheme = parsed.scheme();
    if scheme != "http" && scheme != "https" {
        return Err("La URL debe usar http o https".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "La URL debe tener host".to_string())?;
    if is_private_or_local_host(host) {
        return Err("La URL debe apuntar a un host público".to_string());
    }

    Ok(parsed.to_string())
}

#[tauri::command]
fn list_custom_stations(app: AppHandle) -> Result<Vec<CustomStation>, String> {
    let conn = open_db(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT name, url, country, region, district, caserio
             FROM custom_stations
             ORDER BY created_at DESC",
        )
        .map_err(|e| format!("No se pudo preparar consulta: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(CustomStation {
                name: row.get(0)?,
                url: row.get(1)?,
                country: row.get(2)?,
                region: row.get(3)?,
                district: row.get(4)?,
                caserio: row.get(5)?,
                isCustom: true,
            })
        })
        .map_err(|e| format!("No se pudo leer radios: {e}"))?;

    let stations: Result<Vec<CustomStation>, _> = rows.collect();
    stations.map_err(|e| format!("No se pudo mapear radios: {e}"))
}

#[tauri::command]
fn add_custom_station(app: AppHandle, station: NewCustomStation) -> Result<(), String> {
    let name = station.name.trim();
    let url = validate_public_stream_url(station.url.trim())?;
    let country = station.country.trim();
    let region = station.region.trim();

    if name.is_empty() || country.is_empty() || region.is_empty() {
        return Err("Nombre, URL, país y región son obligatorios".to_string());
    }

    let conn = open_db(&app)?;
    conn.execute(
        "INSERT OR IGNORE INTO custom_stations (name, url, country, region, district, caserio)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            name,
            url,
            country,
            region,
            station.district.map(|v| v.trim().to_string()).filter(|v| !v.is_empty()),
            station.caserio.map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
        ],
    )
    .map_err(|e| format!("No se pudo guardar la radio: {e}"))?;

    Ok(())
}

#[tauri::command]
fn delete_custom_station(app: AppHandle, name: String, url: String) -> Result<(), String> {
    let conn = open_db(&app)?;
    conn.execute(
        "DELETE FROM custom_stations WHERE name = ?1 AND url = ?2",
        params![name.trim(), url.trim()],
    )
    .map_err(|e| format!("No se pudo eliminar la radio: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_custom_stations,
            add_custom_station,
            delete_custom_station
        ])
        .run(tauri::generate_context!())
        .expect("error while running Radio Satelital desktop app");
}