"use client"
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import usePlayer from '../hooks/usePlayer'
import type { Station } from '../types/station'
import { Maximize2, Minimize2, Pause, Play, Radio, SkipBack, SkipForward, Volume2, X } from 'lucide-react'

type Props = {
  currentStation: Station | null
  onNextStation: () => void
  onPrevStation: () => void
}

type PlayerMode = 'mini' | 'card' | 'full' | 'bubble'

function Equalizer({ isPlaying, variant = 'mini' }: { isPlaying: boolean; variant?: 'mini' | 'card' | 'full' }) {
  return (
    <div className={`eq-group eq-group-${variant} ${isPlaying ? 'is-playing' : 'is-paused'}`} aria-hidden="true">
      <span className="eq-bar eq-bar-1" />
      <span className="eq-bar eq-bar-2" />
      <span className="eq-bar eq-bar-3" />
    </div>
  )
}

function StationArtwork({ station, isPlaying, size = 'mini' }: { station: Station | null; isPlaying: boolean; size?: 'mini' | 'card' | 'full' }) {
  const hasLogo = Boolean(station?.logoUrl)
  return (
    <div className={`station-artwork station-artwork-${size} ${isPlaying ? 'is-playing' : 'is-paused'}`}>
      <span className="artwork-ring artwork-ring-1" />
      <span className="artwork-ring artwork-ring-2" />
      <span className="artwork-ring artwork-ring-3" />
      <div className="station-artwork-core">
        {hasLogo ? (
          <img className="station-artwork-image" src={station!.logoUrl} alt={station?.name || 'Radio'} />
        ) : (
          <Radio size={size === 'mini' ? 20 : size === 'card' ? 54 : 72} strokeWidth={2} />
        )}
      </div>
    </div>
  )
}

function ControlButton({
  onClick,
  ariaLabel,
  children,
  variant = 'default',
}: {
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'ghost'
}) {
  return (
    <button
      type="button"
      className={`player-icon-btn player-icon-btn-${variant}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

export default function Player({ currentStation, onNextStation, onPrevStation }: Props) {
  const { isPlaying, togglePlay, secondsElapsed } = usePlayer()
  const [mode, setMode] = useState<PlayerMode>('mini')
  const [volume, setVolume] = useState(0.8)
  const [showVolume, setShowVolume] = useState(false)

  useEffect(() => {
    const audio = document.getElementById('radioPlayer') as HTMLAudioElement | null
    if (!audio) return

    audio.volume = volume

    const handleError = (event: Event) => {
      console.error('[Player UI] Error de audio:', (event.target as HTMLAudioElement)?.error?.message)
    }

    const handleLoadstart = () => {
      console.log('[Player UI] Iniciando carga de stream...')
    }

    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadstart)

    return () => {
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadstart)
    }
  }, [volume])

  const handleVolumeChange = (value: number) => {
    const audio = document.getElementById('radioPlayer') as HTMLAudioElement | null
    if (audio) {
      audio.volume = value
    }
    setVolume(value)
  }

  const stationName = currentStation?.name || 'Radio Satelital'
  const stationMeta = currentStation?.country || currentStation?.region || 'Selecciona una emisora'
  const timeLabel = new Date(secondsElapsed * 1000).toISOString().substring(14, 19)
  const playingClass = isPlaying ? 'is-playing' : 'is-paused'

  return (
    <>
      <div className={`radio-player-root ${mode === 'bubble' ? 'radio-player-root-bubble' : ''}`} id="player-section">
        {mode === 'mini' && (
          <motion.div
            className={`player-mini-bar glass-panel rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${playingClass}`}
            onClick={() => setMode('card')}
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="player-mini-main">
              <StationArtwork station={currentStation} isPlaying={isPlaying} size="mini" />
              <div className="player-mini-copy">
                <span className="player-mini-title">{stationName}</span>
                <span className="player-mini-subtitle">{stationMeta}</span>
              </div>
            </div>

            <Equalizer isPlaying={isPlaying} variant="mini" />

            <div className="player-mini-actions">
              <ControlButton onClick={onPrevStation} ariaLabel="Anterior">
                <SkipBack size={18} strokeWidth={2.2} />
              </ControlButton>
              <ControlButton onClick={togglePlay} ariaLabel={isPlaying ? 'Pausar' : 'Reproducir'} variant="primary">
                {isPlaying ? <Pause size={18} strokeWidth={2.4} /> : <Play size={18} strokeWidth={2.4} />}
              </ControlButton>
              <ControlButton onClick={onNextStation} ariaLabel="Siguiente">
                <SkipForward size={18} strokeWidth={2.2} />
              </ControlButton>
              <div className="player-volume-wrap" onClick={(event) => event.stopPropagation()}>
                <ControlButton onClick={() => setShowVolume((value) => !value)} ariaLabel="Volumen" variant="ghost">
                  <Volume2 size={18} strokeWidth={2.1} />
                </ControlButton>
                {showVolume && (
                  <div className="player-volume-popover">
                    <Volume2 size={16} strokeWidth={2.1} className="player-volume-icon" aria-hidden="true" />
                    <input
                      className="volume-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(event) => handleVolumeChange(Number(event.target.value))}
                      aria-label="Volumen"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'bubble' && (
          <motion.button
            type="button"
            className="player-bubble"
            drag
            dragMomentum={false}
            whileTap={{ scale: 0.96 }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMode('card')}
            aria-label="Abrir reproductor"
          >
            <span className={`player-bubble-rings ${playingClass}`}>
              <span className="player-bubble-ring" />
              <span className="player-bubble-ring player-bubble-ring-2" />
            </span>
            <span className={`player-bubble-core ${playingClass}`}>
              <Radio size={22} strokeWidth={2.2} />
            </span>
          </motion.button>
        )}

        <AnimatePresence>
          {mode === 'card' && (
            <motion.div
              className="player-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMode('mini')}
            >
              <motion.div
                className={`player-card-modal glass-panel rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${playingClass}`}
                initial={{ scale: 0.92, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 24 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button" className="player-close-btn" onClick={() => setMode('mini')} aria-label="Cerrar reproductor">
                  <X size={18} strokeWidth={2.4} />
                </button>

                <div className="player-card-header">
                  <StationArtwork station={currentStation} isPlaying={isPlaying} size="card" />
                  <div className="player-card-text">
                    <span className={`status-indicator ${isPlaying ? 'live' : ''}`}>{isPlaying ? 'EN VIVO' : 'LISTO'}</span>
                    <h2 className="player-card-title">{stationName}</h2>
                    <p className="player-card-meta">{stationMeta}</p>
                    <p className="player-card-submeta">{timeLabel}</p>
                  </div>
                </div>

                <Equalizer isPlaying={isPlaying} variant="card" />

                <div className="player-card-controls">
                  <ControlButton onClick={onPrevStation} ariaLabel="Anterior">
                    <SkipBack size={24} strokeWidth={2.2} />
                  </ControlButton>
                  <ControlButton onClick={togglePlay} ariaLabel={isPlaying ? 'Pausar' : 'Reproducir'} variant="primary">
                    {isPlaying ? <Pause size={24} strokeWidth={2.4} /> : <Play size={24} strokeWidth={2.4} />}
                  </ControlButton>
                  <ControlButton onClick={onNextStation} ariaLabel="Siguiente">
                    <SkipForward size={24} strokeWidth={2.2} />
                  </ControlButton>
                </div>

                <div className="player-card-footer">
                  <div className="player-volume-inline">
                    <Volume2 size={18} strokeWidth={2.1} className="player-volume-icon" aria-hidden="true" />
                    <input
                      className="volume-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(event) => handleVolumeChange(Number(event.target.value))}
                      aria-label="Volumen"
                    />
                  </div>
                  <div className="player-mode-actions">
                    <button type="button" className="player-secondary-btn" onClick={() => setMode('bubble')}>
                      Burbuja
                    </button>
                    <button type="button" className="player-secondary-btn" onClick={() => setMode('full')}>
                      <Maximize2 size={16} strokeWidth={2.2} />
                      Pantalla completa
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === 'full' && (
            <motion.div
              className={`player-fullscreen ${playingClass}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="player-full-background" aria-hidden="true">
                <span className="player-full-orb player-full-orb-1" />
                <span className="player-full-orb player-full-orb-2" />
                <span className="player-full-orb player-full-orb-3" />
              </div>

              <div className="player-full-shell">
                <button type="button" className="player-close-btn player-close-btn-light" onClick={() => setMode('card')} aria-label="Salir de pantalla completa">
                  <Minimize2 size={18} strokeWidth={2.4} />
                </button>

                <StationArtwork station={currentStation} isPlaying={isPlaying} size="full" />
                <div className="player-full-copy">
                  <span className={`status-indicator ${isPlaying ? 'live' : ''}`}>{isPlaying ? 'EN VIVO' : 'LISTO'}</span>
                  <h2 className="player-full-title">{stationName}</h2>
                  <p className="player-full-meta">{stationMeta}</p>
                  <p className="player-full-submeta">{timeLabel}</p>
                </div>

                <Equalizer isPlaying={isPlaying} variant="full" />

                <div className="player-full-controls">
                  <ControlButton onClick={onPrevStation} ariaLabel="Anterior">
                    <SkipBack size={28} strokeWidth={2.2} />
                  </ControlButton>
                  <ControlButton onClick={togglePlay} ariaLabel={isPlaying ? 'Pausar' : 'Reproducir'} variant="primary">
                    {isPlaying ? <Pause size={28} strokeWidth={2.4} /> : <Play size={28} strokeWidth={2.4} />}
                  </ControlButton>
                  <ControlButton onClick={onNextStation} ariaLabel="Siguiente">
                    <SkipForward size={28} strokeWidth={2.2} />
                  </ControlButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio
        id="radioPlayer"
        crossOrigin="anonymous"
        preload="none"
      />
    </>
  )
}
