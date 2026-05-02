"use client"
import React, { useState } from 'react'
import ThemeInitializer from '../components/ThemeInitializer'
import Player from '../components/Player'
import StationGrid from '../components/StationGrid'
import SideMenu from '../components/SideMenu'
import BottomNav from '../components/BottomNav'
import useStations from '../hooks/useStations'
import { Heart, Menu, Search, Settings } from 'lucide-react'

export default function Page() {
  const { stations, currentStation, playStation, nextStation, prevStation, toggleFavorite, setQuery, filters, toggleOnlyFavs, onlyFavs, loading, error } = useStations()
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(open => !open)
  const openMenu = () => setMenuOpen(true)
  const focusSearch = () => {
    setMenuOpen(true)
    document.getElementById('filters-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => document.getElementById('station-search')?.focus(), 150)
  }
  const toggleFavorites = () => toggleOnlyFavs(!onlyFavs)
  const focusCountry = () => {
    setMenuOpen(true)
    document.getElementById('filters-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => document.getElementById('country-filter')?.focus(), 150)
  }
  const showAllStations = () => {
    setQuery('')
    filters.setCountry('')
    filters.setRegion('')
    toggleOnlyFavs(false)
    document.getElementById('station-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <ThemeInitializer />
      <div className="container">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-mark">
            <div>
              <h1 className="site-title">SATELITAL</h1>
              <p className="site-subtitle">WAVE PLAYER V9.5</p>
            </div>
          </div>
          <div className="header-actions header-icon-actions">
            <button className="sec-btn header-icon-btn" onClick={toggleMenu} aria-label="Menú">
              <Menu size={20} strokeWidth={2.2} />
            </button>
            <button className="sec-btn header-icon-btn" onClick={focusSearch} aria-label="Búsqueda">
              <Search size={20} strokeWidth={2.2} />
            </button>
            <button className={`sec-btn header-icon-btn ${onlyFavs ? 'active' : ''}`} onClick={toggleFavorites} aria-label="Favoritos" aria-pressed={onlyFavs}>
              <Heart size={20} strokeWidth={2.2} fill={onlyFavs ? '#6200EE' : 'none'} />
            </button>
            <button className="sec-btn header-icon-btn" onClick={openMenu} aria-label="Configuración">
              <Settings size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="left-col">
          <Player currentStation={currentStation} onNextStation={nextStation} onPrevStation={prevStation} />
        </aside>
        <main className="right-col">
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
            <StationGrid stations={stations} playStation={playStation} toggleFavorite={toggleFavorite} />
          )}
        </main>
      </div>
      <BottomNav onMusic={() => document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} onFavorites={toggleFavorites} onCountry={focusCountry} onMyRadios={showAllStations} favoritesActive={onlyFavs} />
      <SideMenu
        open={menuOpen}
        onClose={()=>setMenuOpen(false)}
        loading={loading}
        error={error}
        stationsCount={stations.length}
        setQuery={setQuery}
        filters={filters}
        toggleOnlyFavs={toggleOnlyFavs}
        onResetFilters={showAllStations}
      />
      </div>
    </>
  )
}
