import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const DEPTH_COLORS = ['#4ADE80', '#FACC15', '#F87171']
const DEPTH_LABELS = ['Shallow (<70km)', 'Intermediate (70-300km)', 'Deep (>300km)']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-sec)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value?.toFixed?.(p.name === 'avg_magnitude' ? 2 : 0) ?? p.value}</b></p>
      ))}
    </div>
  )
}

export default function StatsCharts({ stats }) {
  if (!stats) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="panel skeleton" style={{ height: 200 }} />
        ))}
      </div>
    )
  }

  const { daily_trends = [], depth_distribution = {}, magnitude_distribution = {}, total_count = 0 } = stats

  const depthData = [
    { name: DEPTH_LABELS[0], value: depth_distribution.shallow || 0 },
    { name: DEPTH_LABELS[1], value: depth_distribution.intermediate || 0 },
    { name: DEPTH_LABELS[2], value: depth_distribution.deep || 0 },
  ]

  const magData = Object.entries(magnitude_distribution)
    .map(([k, v]) => ({ mag: `M${k}`, count: v }))
    .sort((a, b) => parseFloat(a.mag.slice(1)) - parseFloat(b.mag.slice(1)))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>

      {/* Trend chart */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600 }}>📈 Daily Earthquake Trend</h3>
          <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{total_count} total</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={daily_trends} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" tick={{ fill: '#9AA3B2', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fill: '#9AA3B2', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="Count" stroke="#60A5FA" fill="url(#grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Depth pie */}
      <div className="panel">
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🔵 Depth Distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={depthData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
              {depthData.map((_, i) => <Cell key={i} fill={DEPTH_COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n.length > 20 ? n.slice(0, 18) + '…' : n]} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 10, color: 'var(--text-sec)', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
          {depthData.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: DEPTH_COLORS[i], flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{DEPTH_LABELS[i].split(' ')[0]}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Magnitude histogram */}
      <div className="panel">
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📊 Magnitude Distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={magData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mag" tick={{ fill: '#9AA3B2', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9AA3B2', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" radius={[3, 3, 0, 0]}>
              {magData.map((d, i) => {
                const mag = parseFloat(d.mag.slice(1))
                const color = mag >= 7 ? '#F87171' : mag >= 5 ? '#FACC15' : mag >= 3 ? '#60A5FA' : '#4ADE80'
                return <Cell key={i} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
