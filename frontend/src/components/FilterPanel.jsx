export default function FilterPanel({ filters, onChange }) {
  const { days, minMag, maxMag, region } = filters

  const label = (text) => (
    <label style={{ fontSize: 11, color: 'var(--text-sec)', display: 'block', marginBottom: 4 }}>
      {text}
    </label>
  )

  const input = (props) => (
    <input
      {...props}
      style={{
        width: '100%', background: '#0B0F19', border: '1px solid var(--border)',
        borderRadius: 7, padding: '6px 10px', color: 'var(--text)',
        fontSize: 13, fontFamily: 'inherit',
        outline: 'none',
      }}
    />
  )

  const select = (props, children) => (
    <select
      {...props}
      style={{
        width: '100%', background: '#0B0F19', border: '1px solid var(--border)',
        borderRadius: 7, padding: '6px 10px', color: 'var(--text)',
        fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
      }}
    >
      {children}
    </select>
  )

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Filters
      </h2>

      <div>
        {label(`Time Range — Last ${days} days`)}
        <input
          type="range" min="1" max="30" value={days}
          onChange={e => onChange({ ...filters, days: +e.target.value })}
          style={{ width: '100%', accentColor: '#60A5FA' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-sec)', marginTop: 2 }}>
          <span>1d</span><span>15d</span><span>30d</span>
        </div>
      </div>

      <div>
        {label('Min Magnitude')}
        <input
          type="range" min="0" max="9" step="0.5" value={minMag}
          onChange={e => onChange({ ...filters, minMag: +e.target.value })}
          style={{ width: '100%', accentColor: '#FACC15' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-sec)', marginTop: 2 }}>
          <span>0</span><span>M{minMag}</span><span>9+</span>
        </div>
      </div>

      <div>
        {label('Region')}
        {select({ value: region, onChange: e => onChange({ ...filters, region: e.target.value }) }, [
          <option key="global" value="global">🌍 Global</option>,
          <option key="us" value="us">🇺🇸 United States</option>,
          <option key="asia" value="asia">🌏 Asia</option>,
          <option key="europe" value="europe">🌍 Europe</option>,
        ])}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 4 }}>
        <p style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Magnitude Legend
        </p>
        {[
          { label: 'M 7+', color: '#F87171', desc: 'Major' },
          { label: 'M 5–7', color: '#FACC15', desc: 'Strong' },
          { label: 'M 3–5', color: '#60A5FA', desc: 'Moderate' },
          { label: 'M &lt; 3', color: '#4ADE80', desc: 'Minor' },
        ].map(({ label, color, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span className="mono" style={{ fontSize: 11 }}>{label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-sec)', marginLeft: 'auto' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
