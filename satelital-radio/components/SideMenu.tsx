"use client"
import React, { useEffect, useState } from 'react'
import { getAvailableThemes, getTheme, getUiScaleMode, setTheme, setUiScaleMode, detectScreenSize, type ThemeName, type UiScaleMode } from '../lib/theme'
import Filters from './Filters'

type Props = {
  open: boolean
  onClose: () => void
  loading: boolean
  error: string | null
  stationsCount: number
  setQuery: (value: string) => void
  filters: {
    countries: string[]
    regions: string[]
    setCountry: (value: string) => void
    setRegion: (value: string) => void
  }
  toggleOnlyFavs: (value: boolean) => void
  onResetFilters: () => void
}

const scaleOptions: Array<{ key: UiScaleMode; label: string; hint: string }> = [
  { key: 'auto', label: 'Auto', hint: 'Detecta automaticamente' },
  { key: 'small', label: 'Pequeno', hint: 'Android compacto' },
  { key: 'medium', label: 'Medio', hint: 'Equilibrado' },
  { key: 'large', label: 'Grande', hint: 'Laptop y tablet' },
  { key: 'xlarge', label: 'Muy grande', hint: 'Lectura amplia' },
]

const themeLabels: Record<ThemeName, string> = {
  amoled: 'AMOLED',
  gold: 'Gold',
  purple: 'Purple',
  white: 'White',
  'wear-ocean': 'Ocean',
  'wear-sunset': 'Sunset',
  'wear-galaxy': 'Galaxy',
  'wear-mint': 'Mint',
  'wear-cherry': 'Cherry',
}

export default function SideMenu({ open, onClose, loading, error, stationsCount, setQuery, filters, toggleOnlyFavs, onResetFilters }: Props) {
  const themes = getAvailableThemes()
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('amoled')
  const [currentScaleMode, setCurrentScaleMode] = useState<UiScaleMode>('auto')

  useEffect(() => {
    setCurrentTheme(getTheme())
    setCurrentScaleMode(getUiScaleMode())
  }, [])

  useEffect(() => {
    if (currentScaleMode !== 'auto') return

    const handleResize = () => {
      setUiScaleMode('auto')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentScaleMode])

  const onSelectTheme = (theme: ThemeName) => {
    setTheme(theme)
    setCurrentTheme(theme)
  }

  const onSelectScaleMode = (mode: UiScaleMode) => {
    setUiScaleMode(mode)
    setCurrentScaleMode(mode)
  }

  return (
    <div className={`side-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="side-menu-content">
        <div className="settings-header">
          <div>
            <h2>Ajustes</h2>
            <p>Personaliza apariencia y filtros desde aqui.</p>
          </div>
          <button className="settings-close" onClick={onClose}>Cerrar</button>
        </div>

        <section className="settings-block">
          <div className="settings-block-head">
            <h3>Panel rapido</h3>
            <span className="settings-badge">Live</span>
          </div>
          <div className="settings-card">
            {loading ? (
              <p className="track-meta">Cargando emisoras...</p>
            ) : error ? (
              <p className="track-meta" style={{ color: '#ff6b6b' }}>{error}</p>
            ) : (
              <p className="track-meta">{stationsCount} emisoras disponibles</p>
            )}
            <div className="settings-actions-inline">
              <button className="settings-primary" id="btnInstall">Instalar app</button>
              <button className="settings-secondary" id="clearFilters" onClick={onResetFilters}>Reiniciar filtros</button>
            </div>
          </div>
        </section>

        <section className="settings-block" id="filters-panel">
          <div className="settings-block-head">
            <h3>Busqueda y filtros</h3>
          </div>
          <Filters setQuery={setQuery} filters={filters} toggleOnlyFavs={toggleOnlyFavs} />
        </section>

        <section className="settings-block">
          <div className="settings-block-head">
            <h3>Tamano de interfaz</h3>
          </div>
          <div className="settings-card settings-scale-grid">
            {scaleOptions.map(option => (
              <button
                key={option.key}
                className={`settings-chip ${currentScaleMode === option.key ? 'active' : ''}`}
                onClick={() => onSelectScaleMode(option.key)}
                aria-pressed={currentScaleMode === option.key}
              >
                <span>{option.label}</span>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <div className="settings-block-head">
            <h3>Colores de interfaz</h3>
          </div>
          <div className="settings-card settings-theme-grid">
            {themes.map(theme => (
              <button
                key={theme}
                className={`settings-theme-chip ${currentTheme === theme ? 'active' : ''}`}
                onClick={() => onSelectTheme(theme)}
                aria-pressed={currentTheme === theme}
              >
                <span className={`theme-preview theme-preview-${theme}`} aria-hidden="true" />
                <span>{themeLabels[theme]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <div className="settings-block-head">
            <h3>Redes</h3>
          </div>
          <div className="settings-card settings-links">
            <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </section>
      </div>
    </div>
  )
}
