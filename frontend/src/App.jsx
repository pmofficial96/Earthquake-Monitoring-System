import { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RiskAnalysis from './pages/RiskAnalysis.jsx'
import SeismicGaps from './pages/SeismicGaps.jsx'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedQuake, setSelectedQuake] = useState(null)
  const [live, setLive] = useState(true)

  const navigate = (target, quake = null) => {
    setPage(target)
    if (quake) setSelectedQuake(quake)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header page={page} navigate={navigate} live={live} setLive={setLive} />
      <main style={{ padding: '0 16px 24px' }}>
        {page === 'dashboard' && <Dashboard navigate={navigate} live={live} />}
        {page === 'risk' && <RiskAnalysis selectedQuake={selectedQuake} />}
        {page === 'gaps' && <SeismicGaps />}
      </main>
    </div>
  )
}
