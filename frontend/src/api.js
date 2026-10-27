const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function fetchRecentQuakes(days = 7) {
  const res = await fetch(`${API}/quakes/recent?days=${days}`)
  if (!res.ok) throw new Error('Failed to fetch quakes')
  return res.json()
}

export async function fetchFilteredQuakes(params = {}) {
  const q = new URLSearchParams(params).toString()
  const res = await fetch(`${API}/quakes/filter?${q}`)
  if (!res.ok) throw new Error('Failed to fetch quakes')
  return res.json()
}

export async function fetchStats(days = 30) {
  const res = await fetch(`${API}/quakes/stats?days=${days}`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchAftershockRisk(eventId) {
  const res = await fetch(`${API}/risk/aftershock/${eventId}`)
  if (!res.ok) throw new Error('Failed to fetch risk')
  return res.json()
}

export async function fetchSeismicGaps() {
  const res = await fetch(`${API}/risk/seismic-gaps`)
  if (!res.ok) throw new Error('Failed to fetch seismic gaps')
  return res.json()
}

export async function triggerSync() {
  const res = await fetch(`${API}/admin/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Sync failed')
  return res.json()
}
