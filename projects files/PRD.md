# Product Requirements Document (PRD)
## Project: Seismic Watch — Real-Time Earthquake Monitoring & Risk Analysis

### 1. Problem Statement
Earthquake data is publicly available (via USGS) but raw and hard to interpret for non-experts. Most student/hobby projects just plot points on a map — they don't help anyone understand **risk** or **patterns**. This project turns raw seismic data into an interpretable, visual, and slightly predictive tool.

### 2. Goals
- Display real-time global earthquake activity on an interactive map/globe.
- Store historical earthquake data for trend analysis.
- Provide an "aftershock risk" estimate after a major quake.
- Identify "seismic gap" regions — areas overdue for activity based on history.
- Be fully free to build, run, and demo (no paid APIs/services).

### 3. Non-Goals (explicitly out of scope)
- This is **not** an early-warning system and makes **no claim** to predict exact future earthquakes (scientifically not possible — be upfront about this in presentation/Q&A).
- Not a commercial/production-grade alert system — no SMS/push notifications to real users.
- No mobile app — web dashboard only.

### 4. Target Users
- Presentation audience: professors, peers (this is an academic demo, not a real product)
- Hypothetical end users: students, researchers, curious public wanting to explore seismic data

### 5. Core Features (MVP)
| # | Feature | Priority |
|---|---|---|
| 1 | Fetch live earthquake data from USGS API | Must-have |
| 2 | Store data in PostgreSQL (Supabase) | Must-have |
| 3 | Interactive 2D map with quake markers (size=magnitude, color=depth) | Must-have |
| 4 | Filter by date range, magnitude, region | Must-have |
| 5 | Magnitude-over-time chart / frequency histogram | Must-have |
| 6 | Aftershock risk estimator (statistical, not deep learning) | Should-have |
| 7 | Seismic gap analysis view (overdue regions) | Should-have |
| 8 | 3D rotating globe visualization | Nice-to-have |
| 9 | Live polling/auto-refresh for new quakes | Nice-to-have |

### 6. Success Criteria (for grading/demo)
- Live data successfully fetched and displayed without manual refresh
- At least one analytical feature (aftershock risk OR seismic gap) works on real historical data, not fake/mock numbers
- App runs end-to-end live during presentation without crashing
- You can clearly explain the statistical method behind the risk estimate (no black-box claims)

### 7. Key Risks
| Risk | Mitigation |
|---|---|
| USGS API rate limits/downtime during demo | Cache last-fetched data in Supabase as fallback |
| Aftershock model looks like "predicting earthquakes" (overclaiming) | Frame clearly as "statistical likelihood based on historical aftershock patterns near similar past events" |
| Supabase free tier limits | Use only a rolling window of recent + sample historical data, not all global data ever |

### 8. Presentation Narrative (the "story")
1. Open with: "Can we predict earthquakes?" → No, but we can understand patterns.
2. Show live map populating in real time.
3. Pick a real past major earthquake → show aftershock risk estimate the model would have given.
4. Show seismic gap map → "these regions are statistically overdue."
5. Close with the disclaimer/ethics point: this is descriptive/statistical, not predictive in the deterministic sense — important to say this explicitly, examiners respect that intellectual honesty.
