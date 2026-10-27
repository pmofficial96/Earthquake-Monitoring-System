# Technical Requirements Document (TRD)
## Project: Seismic Watch

### 1. Architecture Overview
```
[USGS API] → [FastAPI backend: fetch + process] → [Supabase PostgreSQL]
                                                          ↓
                                          [FastAPI REST endpoints]
                                                          ↓
                              [React frontend: map, charts, globe]
```

### 2. Tech Stack Details

#### Backend
- **Language**: Python 3.10+
- **Framework**: FastAPI (async, auto-generates API docs at `/docs`)
- **HTTP client**: `httpx` or `requests` to call USGS API
- **DB driver**: `asyncpg` or `psycopg2` + `SQLAlchemy` (ORM) to talk to Supabase Postgres
- **Scheduler**: `APScheduler` to poll USGS every 1-5 minutes for new quakes
- **ML (optional)**: `scikit-learn` for the aftershock risk logistic regression model
- **Env management**: `python-dotenv` for storing Supabase connection string securely

#### Database (Supabase PostgreSQL)
Free tier supports up to 500MB storage — plenty for earthquake records.

**Table: `earthquakes`**
| Column | Type | Notes |
|---|---|---|
| id | text (primary key) | USGS event ID |
| magnitude | float | |
| place | text | location description |
| latitude | float | |
| longitude | float | |
| depth_km | float | |
| time | timestamptz | when it occurred |
| fetched_at | timestamptz | when your system pulled it |

**Table: `seismic_gaps`** (precomputed/derived, optional)
| Column | Type |
|---|---|
| region_name | text |
| last_major_quake | timestamptz |
| avg_recurrence_years | float |
| gap_score | float |

#### Frontend
- **Framework**: React (via Vite, faster than create-react-app)
- **Map**: Leaflet.js + `react-leaflet` for 2D map
- **3D Globe**: Three.js (optional stretch feature) or `react-globe.gl` (wraps Three.js, easier)
- **Charts**: Recharts for time-series and histograms
- **State/data fetching**: `axios` or native `fetch`, `react-query` (TanStack Query) for caching API calls
- **Styling**: Tailwind CSS

#### Hosting (all free)
- Frontend → Vercel (auto-deploys from GitHub)
- Backend → Render.com free tier (sleeps after inactivity — fine for demo, just wake it up beforehand) OR run locally on your laptop during the live presentation for reliability
- Database → Supabase (free tier, always-on)

### 3. API Endpoints (Backend)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/quakes/recent?days=7` | Get recent quakes |
| GET | `/quakes/filter?min_mag=4&region=asia` | Filtered query |
| GET | `/quakes/stats` | Aggregated stats for charts |
| GET | `/risk/aftershock/{event_id}` | Aftershock probability for a given quake |
| GET | `/risk/seismic-gaps` | List of overdue regions |
| POST | `/admin/sync` | Manually trigger USGS sync (for demo control) |

### 4. Aftershock Risk Model (keep it simple, explainable)
Don't use deep learning — it's overkill and hard to defend. Use a transparent statistical approach:
1. Pull historical USGS data for mainshocks (magnitude ≥ 5.0) over past ~20 years.
2. For each, check: was there a quake of magnitude ≥ 4.0 within 50km and 7 days after?
3. Train a **Logistic Regression** on features: [mainshock magnitude, depth, historical aftershock rate in that region] → probability of aftershock.
4. This is explainable in Q&A: "It's a logistic regression on historical patterns, not a black box."

### 5. Seismic Gap Logic (no ML needed — pure stats)
1. Group historical quakes by region/fault zone.
2. Calculate average time between major quakes (recurrence interval) historically.
3. Compare to time since last major quake in that region.
4. `gap_score = time_since_last / avg_recurrence_interval` — score > 1 means "overdue."

### 6. Data Flow
1. APScheduler job runs every 5 min → calls USGS API → parses GeoJSON response
2. New records inserted into Supabase `earthquakes` table (skip duplicates by `id`)
3. Frontend polls backend `/quakes/recent` every 30-60 sec → updates map/charts
4. Risk endpoints computed on-demand or cached hourly

### 7. Environment Variables (.env — never commit this file)
```
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
USGS_API_BASE=https://earthquake.usgs.gov/fdsnws/event/1/query
```

### 8. Non-Functional Requirements
- App should handle USGS API being temporarily down (fallback to last cached data in DB)
- Frontend should load initial view in under 3 seconds
- No paid services anywhere in the stack
