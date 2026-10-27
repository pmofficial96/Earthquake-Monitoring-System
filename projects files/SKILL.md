# SKILL.md — Skills Demonstrated in This Project

Use this as your cheat sheet for the presentation/viva — examiners often ask "what did YOU learn/do" — this maps every part of the project to a skill so you can answer confidently.

### 1. Backend Development
- Built a REST API using **FastAPI** (Python) — async request handling, automatic OpenAPI docs
- Integrated a **third-party public API** (USGS) — handling pagination, rate limits, GeoJSON parsing
- Implemented a **background scheduler** (APScheduler) for periodic live data syncing

### 2. Database Design
- Designed a **relational schema** in PostgreSQL (via Supabase) for time-series geospatial data
- Used **ON CONFLICT / upsert** logic to avoid duplicate data on repeated syncs
- Wrote SQL queries for filtering, aggregation (GROUP BY region, time-windowed queries)

### 3. Data Science / Statistics
- Computed **recurrence intervals** and built a **seismic gap score** (descriptive statistics, no ML needed — shows you know when NOT to over-engineer with ML)
- Built a **Logistic Regression model** (scikit-learn) for aftershock risk — explainable ML, feature engineering (magnitude, depth, historical regional rate)
- Understand the difference between **prediction vs. statistical likelihood** — important conceptual clarity for Q&A

### 4. Frontend Development
- Built a **React** single-page app with component-based architecture
- Used **Leaflet.js / react-globe.gl** for geospatial visualization (2D map + optional 3D globe)
- Used **Recharts** for time-series and histogram data visualization
- Implemented **polling-based live updates** (client-side data fetching patterns)
- Applied **Tailwind CSS** for a clean, custom design system (not default Bootstrap look)

### 5. Systems & DevOps
- Used **environment variables** for secure credential management (never hardcoding DB passwords)
- Deployed using **free-tier cloud services** (Vercel, Render, Supabase) — understands modern deployment pipelines
- Used **Git/GitHub** for version control throughout development

### 6. Domain Knowledge (Seismology Basics — be ready to explain simply)
- **Magnitude**: logarithmic scale (Richter-like) — each whole number = ~32x more energy released
- **Depth**: shallow quakes (<70km) usually cause more surface damage than deep ones, even at similar magnitude
- **Aftershock**: smaller quake following a mainshock in the same region, statistically common after magnitude 5+ events
- **Seismic gap theory**: real (if debated) concept in seismology — regions along active faults that haven't had a major quake in longer than their historical average are considered higher risk

### 7. Soft Skills / Project Management
- Used a structured planning approach (PRD → TRD → GSD → UIUX docs) before writing code — shows process maturity, not just "vibe coding"
- Scoped a free, no-budget tech stack — resourcefulness without relying on paid tools
- Built in fallback/error handling for live demo reliability (cached data if live API fails)

---

## Likely Viva Questions & Quick Answers

**Q: Can this actually predict earthquakes?**
A: No — no current system can deterministically predict earthquakes. This tool computes statistical likelihoods based on historical patterns (aftershock rates, recurrence intervals), which is fundamentally different from prediction.

**Q: Why PostgreSQL/Supabase instead of MongoDB or Firebase?**
A: The data is inherently relational and benefits from structured queries (filtering by time range, magnitude, region) — PostgreSQL handles this better than a document store, and Supabase gives a free, managed Postgres instance with minimal setup.

**Q: Why logistic regression and not a neural network for aftershock risk?**
A: The dataset is relatively small and the relationship between features (magnitude, depth, historical rate) and aftershock occurrence is reasonably linear/interpretable. Logistic regression is explainable — I can show exactly which factors drove a prediction, which matters more here than squeezing out marginal accuracy gains from a black-box model.

**Q: What was the hardest technical challenge?**
A: (Personalize this once you've actually built it — e.g., handling USGS API pagination, or designing the seismic gap scoring logic, or syncing live data without duplicate inserts.)

**Q: What would you improve with more time?**
A: Incorporate real population density data for impact estimation, refine the aftershock model with more historical training data, add user accounts to save custom regions of interest.
