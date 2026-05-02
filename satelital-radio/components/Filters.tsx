"use client"
import React, { useState } from 'react'

type Props = {
  setQuery: (value: string) => void
  filters: {
    countries: string[]
    regions: string[]
    setCountry: (value: string) => void
    setRegion: (value: string) => void
  }
  toggleOnlyFavs: (value: boolean) => void
}

export default function Filters({ setQuery, filters, toggleOnlyFavs }: Props){
  const [q, setQ] = useState('')

  return (
    <div className="glass-panel filters">
      <div className="panel-head">
        <h3>Filtros</h3>
      </div>
      <div className="filter-row">
        <div className="form-group">
          <input className="input-dark search-input" placeholder="Buscar emisora" value={q} onChange={(e)=>{setQ(e.target.value); setQuery(e.target.value)}} />
        </div>
        <div className="form-group">
          <select className="input-dark" onChange={(e)=>filters.setCountry(e.target.value)}>
        <option value="">Todos los países</option>
        {filters.countries.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <select className="input-dark" onChange={(e)=>filters.setRegion(e.target.value)}>
        <option value="">Todas las regiones</option>
        {filters.regions.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <label className="switch-label">
        <input type="checkbox" id="favoritesToggle" onChange={(e)=>toggleOnlyFavs(e.target.checked)} /> Prioridad Favoritos
      </label>
    </div>
  )
}
