import type { Station } from '../types/station'
import { getOptimalUrl } from './proxy'

const AUDIO_ID = 'radioPlayer'

export function getAudio(){
  const el = typeof window !== 'undefined' ? document.getElementById(AUDIO_ID) as HTMLAudioElement | null : null
  return el
}

export function playStation(s: Station){
  const audio = getAudio()
  if(!audio) {
    console.error('[Player] Elemento de audio no encontrado')
    return
  }
  
  if(!s.url) {
    console.error('[Player] URL de estación vacía:', s.name)
    return
  }
  
  const { url, isProxied } = getOptimalUrl(s)
  
  console.log('[Player] Reproduciendo:', s.name)
  console.log('[Player] URL original:', s.url)
  if (isProxied) {
    console.log('[Player] ⚠️  Usando proxy por CORS')
  }
  console.log('[Player] URL final:', url)
  
  audio.src = url
  
  // Manejar errores de reproducción
  audio.onerror = (e) => {
    console.error('[Player] Error al cargar stream:', e, 'URL:', url)
  }
  
  audio.oncanplay = () => {
    console.log('[Player] Stream cargado, iniciando reproducción')
  }
  
  audio.play().catch((err) => {
    console.error('[Player] Error al reproducir:', err, 'Tipo:', err?.name)
    // El error podría ser "NotAllowedError" por autoplay policy
    if(err?.name === 'NotAllowedError') {
      console.warn('[Player] Autoplay bloqueado por el navegador. El usuario debe iniciar la reproducción manualmente.')
    }
  })
}

export function togglePlay(){
  const audio = getAudio()
  if(!audio) {
    console.error('[Player] Elemento de audio no encontrado')
    return
  }
  
  if(audio.paused || !audio.src){
    console.log('[Player] Intentando reproducir...')
    audio.play().catch(err => {
      console.error('[Player] Error al reproducir:', err)
    })
  } else {
    console.log('[Player] Pausando reproducción')
    audio.pause()
  }
}

export function skipStation(nextUrl: string){
  const audio = getAudio()
  if(!audio) return
  audio.src = nextUrl
  audio.play().catch(()=>{})
}

export function setPlayingState(state:boolean){
  const audio = getAudio()
  if(!audio) return
  if(state) {
    console.log('[Player] Reproduciéndose: true')
    audio.play().catch(err => {
      console.error('[Player] Error al reproducir:', err)
    })
  } else {
    console.log('[Player] Reproduciéndose: false')
    audio.pause()
  }
}
