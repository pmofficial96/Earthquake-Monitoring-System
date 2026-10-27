# 🌍 Seismic Watch — Real-Time Earthquake Monitoring & Risk Analysis

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://frontend-three-teal-87.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-pmofficial96-181717?style=for-the-badge&logo=github)](https://github.com/pmofficial96/Earthquake-Monitoring-System)

> **🌐 Live App:** [https://frontend-three-teal-87.vercel.app](https://frontend-three-teal-87.vercel.app)

A full-stack web application that fetches live earthquake data from the USGS API, visualises it on an interactive dark-mode map, and provides statistical aftershock risk estimates and seismic gap analysis.

---

## 🗂️ Project Structure

```
summer internship project/
├── backend/          # FastAPI + SQLite server
│   ├── main.py       # API routes + scheduler
│   ├── db.py         # Database models
│   ├── usgs_fetcher.py  # USGS data sync
│   ├── risk_model.py    # Aftershock + seismic gap logic
│   └── requirements.txt
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── pages/    # Dashboard, RiskAnalysis, SeismicGaps
│   │   └── components/ # Header, MapView, FilterPanel, StatsCharts
│   └── package.json
└── projects files/   # PRD, TRD, GSD, UIUX docs
```

---

## 🚀 How to Run (Two Terminals)

### Terminal 1 — Backend (FastAPI)

```bash
cd backend

# First time only: create virtual environment and install dependencies
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The backend will be live at **http://localhost:8000**  
API docs (Swagger UI) available at **http://localhost:8000/docs**

> On first startup the backend automatically fetches the last 7 days of earthquakes + 2 years of historical data (M≥5.0) for model training. This may take ~30 seconds.

---

### Terminal 2 — Frontend (React + Vite)

```bash
cd frontend

# First time only
npm install

# Start the dev server
npm run dev
```

The frontend will be live at **http://localhost:5173**

---

## ⚙️ Environment Variables (Optional)

The backend defaults to a local **SQLite** database (`seismic_watch.db`).  
To use a Supabase PostgreSQL database instead, create `backend/.env`:

```env
SUPABASE_DB_URL=postgresql://user:password@host:5432/dbname
```

---

## 📊 Features

| Feature | Description |
|---|---|
| **Live Map** | Interactive dark map with colour-coded earthquake markers (size = magnitude, colour = depth) |
| **Filter Panel** | Filter by magnitude, date range, and region (Global / US / Asia / Europe) |
| **Stats Charts** | Daily frequency trends, depth distribution, magnitude histogram |
| **Aftershock Risk** | Logistic Regression model (falls back to statistical formula) — shows probability gauge |
| **Seismic Gap Analysis** | Identifies regions statistically overdue for a major quake using historical recurrence intervals |
| **Auto-refresh** | Frontend polls every 60 seconds; backend syncs from USGS every 5 minutes |

---

## 📡 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /quakes/recent?days=7` | Recent earthquakes |
| `GET /quakes/filter` | Filtered earthquakes |
| `GET /quakes/stats?days=30` | Aggregated stats for charts |
| `GET /risk/aftershock/{event_id}` | Aftershock probability for a specific event |
| `GET /risk/seismic-gaps` | Seismic gap analysis results |
| `POST /admin/sync` | Manually trigger USGS data sync |

---

## ⚠️ Important Disclaimer

This tool shows **statistical likelihood** based on historical aftershock patterns — it does **not** predict exact future earthquakes. No system can do this. Results are for academic/research purposes only.

---

## 🛠️ Tech Stack

**Backend**: Python · FastAPI · SQLAlchemy · SQLite · scikit-learn · pandas · APScheduler  
**Frontend**: React · Vite · Leaflet · Recharts · TanStack Query  
**Data Source**: [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/fdsnws/event/1/)
