"use client"
import React from 'react'
import { setTheme } from '../lib/theme'

type Props = {
  open: boolean
  onClose: () => void
}

export default function SideMenu({ open, onClose }: Props){
  const themes = ['amoled','gold','purple','white','wear-ocean','wear-sunset','wear-galaxy','wear-mint','wear-cherry']

  return (
    <div className={`side-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div style={{padding:16}}>
        <button onClick={onClose}>Cerrar</button>
        <h3>Tema</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {themes.map(t=> (
            <button key={t} className="sec-btn" onClick={()=>{setTheme(t)}}>{t}</button>
          ))}
        </div>

        <h3 style={{marginTop:16}}>Redes</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <a href="https://twitter.com">Twitter</a>
          <a href="https://github.com">GitHub</a>
        </div>
      </div>
    </div>
  )
}
