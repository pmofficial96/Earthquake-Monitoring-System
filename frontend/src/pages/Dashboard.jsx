import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchFilteredQuakes, fetchStats } from '../api.js'
import MapView from '../components/MapView.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import StatsCharts from '../components/StatsCharts.jsx'

export default function Dashboard({ navigate, live }) {
  const [filters, setFilters] = useState({ days: 7, minMag: 2.5, region: 'global' })

  const { data: quakes = [], isLoading: loadingQuakes, isError } = useQuery({
    queryKey: ['quakes', filters],
    queryFn: () => fetchFilteredQuakes({
      min_mag: filters.minMag,
      region: filters.region,
      start_date: new Date(Date.now() - filters.days * 86400000).toISOString().slice(0, 10),
    }),
    refetchInterval: live ? 60000 : false, // pause when live is off
  })

  const { data: stats } = useQuery({
    queryKey: ['stats', filters.days],
    queryFn: () => fetchStats(filters.days),
    refetchInterval: live ? 120000 : false,
  })

  const handleQuakeClick = (quake) => navigate('risk', quake)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
      {/* Top row: Filter + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, height: 480 }}>
        {/* Filter panel */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Map */}
        <div className="panel" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
          {loadingQuakes && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20,25,37,0.9)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, zIndex: 500,
              color: 'var(--text-sec)',
            }}>
              ⟳ Loading earthquakes…
            </div>
          )}
          {isError && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, zIndex: 500,
              color: 'var(--red)',
            }}>
              ⚠️ Failed to load — showing cached data
            </div>
          )}
          <MapView quakes={quakes} onQuakeClick={handleQuakeClick} />

          {/* Quake count badge */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 500,
            background: 'rgba(20,25,37,0.92)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-sec)' }}>Showing </span>
            <span style={{ color: '#60A5FA', fontWeight: 600 }}>{quakes.length}</span>
            <span style={{ color: 'var(--text-sec)' }}> earthquakes</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Stats charts */}
      <StatsCharts stats={stats} />

      {/* Recent events table */}
      <div className="panel">
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🕐 Recent Earthquakes</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Location', 'Magnitude', 'Depth', 'Lat / Lon', 'Risk'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-sec)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quakes.slice(0, 20).map((q, i) => {
                const mag = q.magnitude
                const color = mag >= 7 ? '#F87171' : mag >= 5 ? '#FACC15' : mag >= 3 ? '#60A5FA' : '#4ADE80'
                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid rgba(35,42,59,0.5)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '7px 10px', color: 'var(--text-sec)', whiteSpace: 'nowrap' }} className="mono">
                      {new Date(q.time).toLocaleString()}
                    </td>
                    <td style={{ padding: '7px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.place}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: `${color}18`, color, border: `1px solid ${color}40`,
                        borderRadius: 6, padding: '2px 8px', fontWeight: 600,
                      }} className="mono">
                        M{mag.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px' }} className="mono">{q.depth_km?.toFixed(1)} km</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-sec)' }} className="mono">
                      {q.latitude?.toFixed(2)}, {q.longitude?.toFixed(2)}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {mag >= 5 ? (
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => handleQuakeClick(q)}>
                          ⚠️ Analyze
                        </button>
                      ) : (
                        <span style={{ color: 'var(--border)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
