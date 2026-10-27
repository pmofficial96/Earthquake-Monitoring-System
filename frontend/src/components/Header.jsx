import { useState } from 'react'
import { triggerSync } from '../api.js'

const NavItem = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 8,
      background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
      color: active ? '#60A5FA' : 'var(--text-sec)',
      border: active ? '1px solid rgba(96,165,250,0.25)' : '1px solid transparent',
      cursor: 'pointer', fontSize: 13, fontWeight: 500,
      transition: 'all 0.15s',
    }}
  >
    <span style={{ fontSize: 15 }}>{icon}</span> {label}
  </button>
)

export default function Header({ page, navigate, live, setLive }) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try { await triggerSync() } catch (e) { /* ignore */ }
    setTimeout(() => setSyncing(false), 2000)
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px',
      background: 'rgba(20,25,37,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🌍</span>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Seismic Watch</h1>
          <p style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: -1 }}>Real-Time Earthquake Monitoring</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 4 }}>
        <NavItem label="Dashboard" icon="🗺️" active={page === 'dashboard'} onClick={() => navigate('dashboard')} />
        <NavItem label="Aftershock Risk" icon="⚠️" active={page === 'risk'} onClick={() => navigate('risk')} />
        <NavItem label="Seismic Gaps" icon="🔴" active={page === 'gaps'} onClick={() => navigate('gaps')} />
      </nav>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pulse" style={{
            width: 8, height: 8, borderRadius: '50%',
            background: live ? 'var(--green)' : '#555',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>
            {live ? 'Live' : 'Paused'}
          </span>
        </div>

        <button className="btn btn-ghost" onClick={() => setLive(l => !l)} style={{ fontSize: 12 }}>
          {live ? '⏸ Pause' : '▶ Resume'}
        </button>

        <button className="btn btn-primary" onClick={handleSync} disabled={syncing} style={{ fontSize: 12 }}>
          {syncing ? '⟳ Syncing…' : '⟳ Sync Now'}
        </button>
      </div>
    </header>
  )
}
