"use client"
import React from 'react'
import StationCard from './StationCard'
import type { Station } from '../types/station'

type Props = {
  stations: Station[]
  playStation: (station: Station) => void
  toggleFavorite: (station: Station) => void
  onResetFilters: () => void
}

export default function StationGrid({ stations, playStation, toggleFavorite, onResetFilters }: Props){
  return (
    <div className="glass-panel">
      <div className="panel-head station-panel-head">
        <h3>Frecuencias</h3>
        <div className="header-actions">
          <button className="btn-text" id="btnInstall">INSTALAR APP</button>
          <button className="btn-text" id="clearFilters" onClick={onResetFilters}>RESET</button>
          <input className="input-dark search-input" placeholder="Buscar emisora..." />
        </div>
      </div>
      <div className="station-grid">
        {stations.map(s=> (
          <StationCard key={`${s.name}-${s.url}`} station={s} onPlay={playStation} onToggleFav={toggleFavorite} />
        ))}
      </div>
    </div>
  )
}
