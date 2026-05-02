"use client"
import React, { useState } from 'react'
import Player from '../components/Player'
import StationGrid from '../components/StationGrid'
import SideMenu from '../components/SideMenu'
import Filters from '../components/Filters'
import useStations from '../hooks/useStations'

export default function Page() {
  const { stations, currentStation, playStation, toggleFavorite, setQuery, filters, toggleOnlyFavs, loading, error } = useStations()
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(open => !open)
  const resetFilters = () => {
    setQuery('')
    filters.setCountry('')
    filters.setRegion('')
    toggleOnlyFavs(false)
  }

  return (
    <div className="container">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-mark">
            <div>
              <h1 className="site-title">SATELITAL</h1>
              <p className="site-subtitle">WAVE PLAYER V9.5</p>
            </div>
          </div>
          <button id="btnOptions" className="sec-btn" onClick={toggleMenu} aria-label="Abrir menú">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="left-col">
          <Player currentStation={currentStation} />
          <div className="glass-panel mini-form">
            <div className="panel-head-small">
              <h3>Panel rápido</h3>
            </div>
            {loading ? (
              <p className="track-meta">Cargando emisoras...</p>
            ) : error ? (
              <p className="track-meta" style={{ color: '#ff6b6b' }}>{error}</p>
            ) : (
              <p className="track-meta">{stations.length} emisoras disponibles</p>
            )}
          </div>
        </aside>
        <main className="right-col">
          {!error && !loading && (
            <Filters setQuery={setQuery} filters={filters} toggleOnlyFavs={toggleOnlyFavs} />
          )}
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Conectando con Firebase...</p>
            </div>
          )}
          {error && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
              <p><strong>{error}</strong></p>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                Verifica que las variables NEXT_PUBLIC_FIREBASE_* estén configuradas en .env.local
              </p>
            </div>
          )}
          {!loading && !error && stations.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No hay emisoras disponibles</p>
            </div>
          )}
          {!loading && !error && (
            <StationGrid stations={stations} playStation={playStation} toggleFavorite={toggleFavorite} onResetFilters={resetFilters} />
          )}
        </main>
      </div>
      <SideMenu open={menuOpen} onClose={()=>setMenuOpen(false)} />
    </div>
  )
}
