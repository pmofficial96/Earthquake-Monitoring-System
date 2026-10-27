# GSD.md — Get Set Done
## Step-by-step setup & build checklist for Seismic Watch

This is your literal day-by-day checklist. Follow top to bottom.

---

## PHASE 0 — Environment Setup (Day 1)

### Step 1: Install Node.js
You need Node.js to run the React frontend.

**Windows:**
1. Go to https://nodejs.org
2. Download the **LTS version** (left button, currently labeled "LTS")
3. Run the installer, click Next through all defaults
4. Restart your computer (or at least your terminal)
5. Verify install — open Command Prompt / PowerShell and run:
   ```
   node -v
   npm -v
   ```
   You should see version numbers (e.g., `v20.x.x` and `10.x.x`). If you see "command not recognized," restart your PC and try again.

**Mac:**
1. Go to https://nodejs.org → download LTS macOS installer, OR
2. If you have Homebrew: `brew install node`
3. Verify: `node -v` and `npm -v` in Terminal

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Step 2: Install Python (if not already installed)
1. Go to https://python.org/downloads
2. Download Python 3.10+ (check "Add Python to PATH" during install on Windows!)
3. Verify: `python --version` or `python3 --version`

### Step 3: Create your Supabase project
1. Go to https://supabase.com → Sign up free (use GitHub login, fastest)
2. Click "New Project"
3. Name it `seismic-watch`, set a database password (SAVE THIS — you'll need it)
4. Choose the free tier region closest to you
5. Wait ~2 min for project to provision
6. Go to **Project Settings → Database → Connection String** → copy the URI (starts with `postgresql://`)
7. Save this somewhere safe — this is your `SUPABASE_DB_URL`

### Step 4: Create the database table
In Supabase dashboard → **SQL Editor** → New Query → paste and run:
```sql
CREATE TABLE earthquakes (
  id TEXT PRIMARY KEY,
  magnitude FLOAT,
  place TEXT,
  latitude FLOAT,
  longitude FLOAT,
  depth_km FLOAT,
  time TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seismic_gaps (
  region_name TEXT PRIMARY KEY,
  last_major_quake TIMESTAMPTZ,
  avg_recurrence_years FLOAT,
  gap_score FLOAT
);
```

---

## PHASE 1 — Backend (Days 2-7)

### Step 5: Set up backend folder
```bash
mkdir backend && cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install fastapi uvicorn httpx asyncpg sqlalchemy python-dotenv apscheduler scikit-learn pandas
```

### Step 6: Create `.env` file in backend folder
```
SUPABASE_DB_URL=your_connection_string_here
```

### Step 7: Build USGS fetcher (`usgs_fetcher.py`)
- Hit `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=...&minmagnitude=2.5`
- Parse the GeoJSON `features` array — each has `properties.mag`, `properties.place`, `geometry.coordinates`, `properties.time`

### Step 8: Build DB connection + insert logic (`db.py`)
- Connect to Supabase using SQLAlchemy
- Write `insert_earthquake()` function with ON CONFLICT DO NOTHING (avoid duplicate inserts)

### Step 9: Build FastAPI endpoints (`main.py`)
- Implement endpoints listed in TRD.md section 3
- Test each one at `http://localhost:8000/docs` (FastAPI auto-generates this UI)

### Step 10: Build the scheduler
- APScheduler job that calls fetcher every 5 min and inserts new data

### Step 11: Build risk_model.py
- Aftershock logistic regression (start simple, refine later)
- Seismic gap calculation function

✅ **Checkpoint**: By end of Phase 1, running `uvicorn main:app --reload` and visiting `/docs` should let you successfully fetch real earthquake data into Supabase and query it back.

---

## PHASE 2 — Frontend (Days 8-18)

### Step 12: Scaffold React app
```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-leaflet leaflet recharts @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 13: Build core components
- `MapView.jsx` — Leaflet map with quake markers
- `FilterPanel.jsx` — date range, magnitude slider, region dropdown
- `StatsCharts.jsx` — Recharts time-series + histogram
- `RiskPanel.jsx` — aftershock risk display
- `SeismicGapMap.jsx` — overdue regions overlay

### Step 14: Connect frontend to backend
- Use `react-query` to fetch from your FastAPI endpoints
- Set up polling (refetch every 30-60 sec) for live updates

### Step 15 (stretch goal): Add 3D Globe
```bash
npm install react-globe.gl
```
- Render quakes as glowing points on a 3D globe, point size = magnitude

✅ **Checkpoint**: By end of Phase 2, you have a working dashboard showing live + historical quakes, filterable, with at least one chart.

---

## PHASE 3 — Polish & Risk Features (Days 19-25)

### Step 16: Wire up aftershock risk endpoint to UI
### Step 17: Wire up seismic gap analysis to UI
### Step 18: Add loading states, error handling (USGS API down fallback)
### Step 19: Style pass — make it look clean, not default Bootstrap-y (use Tailwind properly)
### Step 20: Deploy
- Frontend → Vercel (`vercel.com` → import GitHub repo → deploy, free)
- Backend → Render.com (free tier) OR just run locally for the demo (most reliable for a live presentation)

---

## PHASE 4 — Presentation Prep (Days 26-30)

### Step 21: Prepare your narrative (see PRD.md section 8)
### Step 22: Pre-load a few "good" historical earthquake examples to demo (don't rely only on live data during presentation — what if there's no major quake that day?)
### Step 23: Practice explaining the aftershock model and seismic gap logic WITHOUT jargon overload
### Step 24: Prepare for the obvious question: **"Can this predict earthquakes?"** → Answer: "No — no system can. This identifies statistical patterns in historical data, which is fundamentally different from prediction."
### Step 25: Test the entire demo end-to-end at least twice before presentation day, on the same machine/network you'll present from

---

## Quick Reference: Daily Time Estimate
| Phase | Days | Effort |
|---|---|---|
| Setup | 1 | 1-2 hrs |
| Backend | 2-7 | 1.5-2 hrs/day |
| Frontend | 8-18 | 2 hrs/day |
| Polish | 19-25 | 1.5 hrs/day |
| Presentation prep | 26-30 | 1 hr/day |
