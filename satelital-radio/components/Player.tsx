"use client"
import React from 'react'
import usePlayer from '../hooks/usePlayer'
import type { Station } from '../types/station'

type Props = {
  currentStation: Station | null
}

export default function Player({ currentStation }: Props){
  const { isPlaying, togglePlay, secondsElapsed } = usePlayer()

  return (
    <div className="player-section glass-panel">
      <div className="player-waves-container parallax">
        <svg className="waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,30 C300,90 900,0 1200,30 L1200,120 L0,120 Z" fill="var(--accent)" />
        </svg>
      </div>

      <div className="player-info">
        <span className={`status-indicator ${isPlaying ? 'live' : ''}`}>{isPlaying ? 'EN VIVO' : 'SIN SEÑAL / CAMBIANDO...'}</span>
        <h2 className="track-title">{currentStation?.name || 'Radio Satelital'}</h2>
        <div className="track-meta">{currentStation?.country || 'Selecciona una emisora'} • {currentStation?.region || '—'}</div>
      </div>

      <div className="now-playing-container">
        <p className="track-artist">{currentStation?.name || 'Sin reproducción'}</p>
      </div>

      <div className="custom-controls">
        <div className={`timer-text ${isPlaying ? 'live' : ''}`}>{new Date(secondsElapsed * 1000).toISOString().substring(14, 19)}</div>
        <div className="control-group">
          <button className="sec-btn" onClick={()=>{}} aria-label="Anterior">⏮</button>
          <button className="play-btn" onClick={togglePlay} aria-pressed={isPlaying} id="playBtn">{isPlaying? '⏸':'▶'}</button>
          <button className="sec-btn" onClick={()=>{}} aria-label="Siguiente">⏭</button>
        </div>
      </div>

      <audio id="radioPlayer" crossOrigin="anonymous" />
    </div>
  )
}
