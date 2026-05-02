import type { Station } from '../types/station'

const PROXY_SERVICES = {
  allorigins: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  corsanywhere: (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
}

// URLs que sabemos que necesitan proxy (basado en test del 2026-05-02)
const NEEDS_PROXY = [
  'eu1.lhdserver.es',
  '27433.live.streamtheworld.com',
  'strcdn.klm99.com',
  'sonic-us.streaming-chile.com',
  'radioenhd.com',
  'ss.redradios.net',
  'edge01.radiohdvivo.com',
  'vigo-copesedes-rrcast.flumotion.com',
  'us10a.serverse.com',
  'streaming5.locucionar.com',
  'streaming.servicioswebmx.com',
]

export function shouldUseProxy(station: Station): boolean {
  try {
    const url = new URL(station.url)
    return NEEDS_PROXY.some(domain => url.hostname.includes(domain))
  } catch {
    return false
  }
}

export function getProxiedUrl(station: Station, proxyService: 'allorigins' | 'corsanywhere' = 'allorigins'): string {
  if (!shouldUseProxy(station)) {
    return station.url
  }

  const proxier = PROXY_SERVICES[proxyService]
  return proxier(station.url)
}

export function getOptimalUrl(station: Station): { url: string; isProxied: boolean } {
  const needsProxy = shouldUseProxy(station)
  
  if (needsProxy) {
    return {
      url: getProxiedUrl(station, 'allorigins'),
      isProxied: true,
    }
  }

  return {
    url: station.url,
    isProxied: false,
  }
}
