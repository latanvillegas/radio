"use client"
import { useEffect } from 'react'
import { initializeThemeSettings } from '../lib/theme'

export default function ThemeInitializer() {
  useEffect(() => {
    initializeThemeSettings()
  }, [])

  return null
}
