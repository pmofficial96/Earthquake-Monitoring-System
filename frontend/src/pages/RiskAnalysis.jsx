import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRecentQuakes, fetchAftershockRisk } from '../api.js'

const GaugeArc = ({ probability }) => {
  const pct = Math.min(Math.max(probability, 0), 1)
  const angle = pct * 180 - 90 // -90 to +90 degrees
  const color = pct >= 0.7 ? '#F87171' : pct >= 0.4 ? '#FACC15' : '#4ADE80'

  // SVG arc
  const r = 70, cx = 90, cy = 90
  const startAngle = Math.PI
  const endAngle = startAngle + pct * Math.PI
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
  const largeArc = pct > 0.5 ? 1 : 0

  return (
    <svg width="180" height="100" viewBox="0 0 180 100">
      {/* Background arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--border)" strokeWidth={12} strokeLinecap="round"
      />
      {/* Filled arc */}
      {pct > 0 && (
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 18) * Math.cos(startAngle + pct * Math.PI)}
        y2={cy + (r - 18) * Math.sin(startAngle + pct * Math.PI)}
        stroke={color} strokeWidth={3} strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={5} fill={color} />

      {/* Percentage text */}
      <text x={cx} y={cy - 14} textAnchor="middle" fill={color}
        style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#9AA3B2"
        style={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
        probability
      </text>
    </svg>
  )
}

export default function RiskAnalysis({ selectedQuake }) {
  const [selectedId, setSelectedId] = useState(selectedQuake?.id || '')

  const { data: recentQuakes = [] } = useQuery({
    queryKey: ['recentQuakes'],
    queryFn: () => fetchRecentQuakes(14),
  })

  const majorQuakes = recentQuakes.filter(q => q.magnitude >= 4.5)

  const { data: risk, isLoading, isError } = useQuery({
    queryKey: ['risk', selectedId],
    queryFn: () => fetchAftershockRisk(selectedId),
    enabled: !!selectedId,
  })

  const selectedQuakeData = selectedQuake?.id === selectedId
    ? selectedQuake
    : recentQuakes.find(q => q.id === selectedId)

  const prob = risk?.aftershock_probability ?? 0
  const probColor = prob >= 0.7 ? '#F87171' : prob >= 0.4 ? '#FACC15' : '#4ADE80'
  const probLabel = prob >= 0.7 ? 'High Risk' : prob >= 0.4 ? 'Moderate Risk' : 'Low Risk'

  return (
    <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>⚠️ Aftershock Risk Analysis</h2>
          <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 2 }}>
            Statistical likelihood of aftershocks based on historical patterns — not a prediction.
          </p>
        </div>
      </div>

      {/* Quake selector */}
      <div className="panel">
        <label style={{ fontSize: 12, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>
          Select a recent major earthquake to analyze:
        </label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            width: '100%', background: '#0B0F19', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
            fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">— Choose an earthquake —</option>
          {majorQuakes.map(q => (
            <option key={q.id} value={q.id}>
              M{q.magnitude.toFixed(1)} — {q.place} ({new Date(q.time).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {selectedId && (
        <div className="slide-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Gauge */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {isLoading ? (
              <div className="skeleton" style={{ width: 180, height: 120, borderRadius: 8 }} />
            ) : isError ? (
              <p style={{ color: 'var(--red)', fontSize: 13 }}>⚠️ Could not compute risk for this event.</p>
            ) : (
              <>
                <GaugeArc probability={prob} />
                <div style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: `${probColor}18`, color: probColor,
                  border: `1px solid ${probColor}40`, fontWeight: 600, fontSize: 14,
                }}>
                  {probLabel}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-sec)', textAlign: 'center', maxWidth: 240 }}>
                  {risk?.model_trained
                    ? '🤖 Logistic Regression model trained on historical aftershock data'
                    : '📐 Statistical formula (insufficient local data for ML model)'}
                </p>
              </>
            )}
          </div>

          {/* Details */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Event Details</h3>

            {selectedQuakeData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Location', value: selectedQuakeData.place },
                  { label: 'Magnitude', value: `M${selectedQuakeData.magnitude?.toFixed(1)}`, mono: true },
                  { label: 'Depth', value: `${selectedQuakeData.depth_km?.toFixed(1)} km`, mono: true },
                  { label: 'Time', value: new Date(selectedQuakeData.time).toLocaleString(), mono: true },
                  { label: 'Coordinates', value: `${selectedQuakeData.latitude?.toFixed(3)}, ${selectedQuakeData.longitude?.toFixed(3)}`, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--text-sec)', fontSize: 12, minWidth: 90 }}>{label}</span>
                    <span className={mono ? 'mono' : ''} style={{ fontSize: 12 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {risk && (
              <div style={{ marginTop: 4 }}>
                <h4 style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>Risk Inputs</h4>
                <div style={{ background: '#0B0F19', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-sec)' }}>Regional aftershock rate</span>
                    <span className="mono">{(risk.regional_aftershock_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-sec)' }}>Mainshock magnitude</span>
                    <span className="mono">M{risk.magnitude?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)',
        borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#9AA3B2',
      }}>
        ⚠️ <strong style={{ color: '#FACC15' }}>Important:</strong> This tool shows statistical likelihood based on historical aftershock patterns — it does <em>not</em> predict exact future earthquakes. No system can do this. Use responsibly.
      </div>
    </div>
  )
}
