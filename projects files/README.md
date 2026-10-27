# 🌍 Seismic Watch — Real-Time Earthquake Monitoring & Risk Analysis

A real-time earthquake monitoring dashboard that pulls live data from USGS, stores historical patterns in PostgreSQL (via Supabase), and goes beyond simple mapping by analyzing **aftershock risk** and **seismic gaps** — not just "here's a map of earthquakes."

## Why This Project Is Different
Most earthquake dashboards just plot pins on a map. This project adds an analytical layer:
- **Aftershock Risk Predictor** — estimates probability of aftershocks following a major quake based on historical patterns near that location.
- **Seismic Gap Analysis** — flags regions that are statistically "overdue" for a major earthquake based on historical frequency vs. time since last major event.
- **Live 3D Globe Visualization** — quakes rendered as glowing points on a rotating 3D Earth, sized by magnitude, colored by depth.

## Tech Stack
| Layer | Tool |
|---|---|
| Data Source | USGS Earthquake API (free, no key) |
| Database | PostgreSQL via Supabase (free tier) |
| Backend | Python + FastAPI |
| Frontend | React + Three.js (3D globe) + Leaflet (2D map fallback) + Recharts (graphs) |
| Hosting | Vercel (frontend) + Render (backend) — both free tier |
| ML (optional) | scikit-learn (Logistic Regression / Random Forest for aftershock risk) |

## Project Structure
```
earthquake-monitor/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── usgs_fetcher.py      # Pulls live data from USGS
│   ├── db.py                 # Supabase/PostgreSQL connection
│   ├── risk_model.py        # Aftershock + seismic gap logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── GSD.md
│   ├── UIUX.md
│   └── SKILL.md
└── README.md
```

## Quick Start
1. Install Node.js (see GSD.md — Setup section)
2. Create a free Supabase project → copy connection string
3. `cd backend && pip install -r requirements.txt`
4. `cd frontend && npm install && npm run dev`
5. Backend: `uvicorn main:app --reload`

## Documents in This Repo
- **PRD.md** — what the product does and why (Product Requirements)
- **TRD.md** — how it's built technically (Technical Requirements)
- **GSD.md** — step-by-step setup & build checklist (Get Set Done)
- **UIUX.md** — screens, layout, design decisions
- **SKILL.md** — skills you'll learn/demonstrate, useful for your presentation/viva

## License
Free for academic/educational use.
