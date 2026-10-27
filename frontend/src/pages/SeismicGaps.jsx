import { useQuery } from '@tanstack/react-query'
import { fetchSeismicGaps } from '../api.js'

const GapBar = ({ score }) => {
  const pct = Math.min(score / 2, 1) * 100 // normalize 0-2 to 0-100%
  const color = score >= 1.5 ? '#F87171' : score >= 1.0 ? '#FACC15' : '#4ADE80'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color,
          borderRadius: 3,
          boxShadow: `0 0 6px ${color}80`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color, minWidth: 32, textAlign: 'right' }}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

export default function SeismicGaps() {
  const { data: gaps = [], isLoading, isError } = useQuery({
    queryKey: ['seismicGaps'],
    queryFn: fetchSeismicGaps,
    staleTime: 5 * 60 * 1000,
  })

  const top20 = gaps.slice(0, 20)
  const overdue = gaps.filter(g => g.gap_score >= 1.0).length
  const critical = gaps.filter(g => g.gap_score >= 1.5).length

  return (
    <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000, margin: '0 auto' }}>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>🔴 Seismic Gap Analysis</h2>
        <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 2 }}>
          Regions where time since the last major quake exceeds the historical average recurrence interval.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Regions Analyzed', value: gaps.length, color: '#60A5FA', icon: '🌐' },
          { label: 'Overdue (score ≥ 1.0)', value: overdue, color: '#FACC15', icon: '⏳' },
          { label: 'Critical (score ≥ 1.5)', value: critical, color: '#F87171', icon: '🚨' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading ? '—' : value}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-sec)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600 }}>Top Overdue Regions</h3>
          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
            {[
              { label: '● Critical (≥1.5)', color: '#F87171' },
              { label: '● Overdue (≥1.0)', color: '#FACC15' },
              { label: '● Normal (<1.0)', color: '#4ADE80' },
            ].map(({ label, color }) => (
              <span key={label} style={{ color }}>{label}</span>
            ))}
          </div>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, borderRadius: 6 }} />
            ))}
          </div>
        )}

        {isError && (
          <p style={{ color: 'var(--red)', fontSize: 13 }}>⚠️ Failed to load seismic gap data.</p>
        )}

        {!isLoading && !isError && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Region', 'Last Major Quake', 'Avg Recurrence', 'Years Since Last', 'Gap Score'].map(h => (
                  <th key={h} style={{
                    padding: '6px 10px', textAlign: 'left',
                    color: 'var(--text-sec)', fontWeight: 500, whiteSpace: 'nowrap',
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top20.map((g, i) => {
                const color = g.gap_score >= 1.5 ? '#F87171' : g.gap_score >= 1.0 ? '#FACC15' : '#4ADE80'
                return (
                  <tr key={g.region_name}
                    style={{ borderBottom: '1px solid rgba(35,42,59,0.5)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '8px 10px', color: 'var(--text-sec)' }} className="mono">
                      {i + 1}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                      {g.region_name}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-sec)' }} className="mono">
                      {g.last_major_quake ? new Date(g.last_major_quake).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }} className="mono">
                      {g.avg_recurrence_years?.toFixed(2)} yrs
                    </td>
                    <td style={{ padding: '8px 10px' }} className="mono">
                      {g.years_since_last?.toFixed(1)} yrs
                    </td>
                    <td style={{ padding: '8px 10px', minWidth: 160 }}>
                      <GapBar score={g.gap_score} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Explanation */}
      <div style={{
        background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)',
        borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#9AA3B2',
      }}>
        📐 <strong style={{ color: '#60A5FA' }}>How Gap Score Works:</strong> For each region, we divide the time elapsed since the last major quake (M≥5.0) by the historical average recurrence interval. A score of 1.0 means the region is exactly at its historical average. A score &gt; 1.0 indicates the region is "overdue." This is a statistical concept — it does not guarantee an imminent earthquake.
      </div>
    </div>
  )
}
