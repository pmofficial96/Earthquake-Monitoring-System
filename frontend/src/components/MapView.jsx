import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Fix for magnitude-to-colour/size
export const magColor = (mag) => {
  if (mag >= 7) return '#F87171'   // red
  if (mag >= 5) return '#FACC15'   // yellow
  if (mag >= 3) return '#60A5FA'   // blue
  return '#4ADE80'                  // green
}

export const magRadius = (mag) => Math.max(4, mag * 3.5)

export default function MapView({ quakes, onQuakeClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    })

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(mapInstanceRef.current)
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !quakes?.length) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    quakes.forEach(q => {
      const color = magColor(q.magnitude)
      const r = magRadius(q.magnitude)

      const circle = L.circleMarker([q.latitude, q.longitude], {
        radius: r,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.5,
      }).addTo(mapInstanceRef.current)

      const time = new Date(q.time).toLocaleString()
      circle.bindPopup(`
        <div style="min-width:180px">
          <div style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:600;margin-bottom:6px">
            M${q.magnitude.toFixed(1)} — ${q.place}
          </div>
          <div style="font-size:12px;color:#9AA3B2;margin-bottom:8px">${time}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
            <span style="color:#9AA3B2">Depth</span><span style="font-family:'JetBrains Mono',monospace">${q.depth_km?.toFixed(1)} km</span>
            <span style="color:#9AA3B2">Lat</span><span style="font-family:'JetBrains Mono',monospace">${q.latitude?.toFixed(3)}</span>
            <span style="color:#9AA3B2">Lon</span><span style="font-family:'JetBrains Mono',monospace">${q.longitude?.toFixed(3)}</span>
          </div>
          <div id="popup-btn-${q.id}" style="margin-top:10px">
            <button 
              onclick="window.__quakePopupCallback && window.__quakePopupCallback('${q.id}')"
              style="
                background:#1d4ed8;color:#fff;border:none;padding:6px 12px;
                border-radius:6px;font-size:12px;cursor:pointer;width:100%;
                font-family:'Inter',sans-serif;font-weight:500;
              "
            >⚠️ Analyze Risk</button>
          </div>
        </div>
      `)

      markersRef.current.push(circle)
    })

    // Global callback for popup button
    window.__quakePopupCallback = (id) => {
      const q = quakes.find(x => x.id === id)
      if (q && onQuakeClick) onQuakeClick(q)
    }
  }, [quakes, onQuakeClick])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}
    />
  )
}
