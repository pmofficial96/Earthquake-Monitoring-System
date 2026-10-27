from fastapi import FastAPI, Depends, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import pandas as pd

from db import init_db, get_db, Earthquake, SeismicGap
from usgs_fetcher import sync_recent_quakes, fetch_and_store_quakes, sync_historical_quakes
from risk_model import calculate_aftershock_probability, analyze_seismic_gaps
from apscheduler.schedulers.background import BackgroundScheduler

app = FastAPI(title="Seismic Watch API", description="Real-Time Earthquake Monitoring & Risk Analysis API")

# Configure CORS so frontend can call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()

def scheduled_sync():
    print(f"Scheduled sync triggered at {datetime.now()}")
    try:
        sync_recent_quakes()
    except Exception as e:
        print(f"Error during scheduled sync: {e}")

@app.on_event("startup")
def startup_event():
    # Initialize DB (creates tables if they don't exist)
    init_db()
    print("Database tables initialized.")

    # Run initial sync in background on startup if db is empty
    db = next(get_db())
    try:
        count = db.query(func.count(Earthquake.id)).scalar()
        if count == 0:
            print("Database is empty. Triggering initial data sync...")
            # Sync last 3 days of quakes (fast startup) and some historical quakes
            sync_recent_quakes()
            sync_historical_quakes()
    finally:
        db.close()

    # Start APScheduler to sync every 5 minutes
    scheduler.add_job(scheduled_sync, "interval", minutes=5)
    scheduler.start()
    print("Background scheduler started (sync interval: 5 minutes).")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("Background scheduler shut down.")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Seismic Watch API. Visit /docs for documentation."}

@app.get("/quakes/recent")
def get_recent_quakes(days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    """
    Get recent earthquakes occurred within the last N days.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    quakes = db.query(Earthquake).filter(Earthquake.time >= cutoff).order_by(Earthquake.time.desc()).all()
    return quakes

@app.get("/quakes/filter")
def filter_quakes(
    min_mag: float = Query(2.5, description="Minimum magnitude"),
    max_mag: Optional[float] = Query(None, description="Maximum magnitude"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    region: str = Query("global", description="Predefined region: global, us, asia, europe"),
    db: Session = Depends(get_db)
):
    """
    Filter earthquakes with advanced options.
    """
    query = db.query(Earthquake).filter(Earthquake.magnitude >= min_mag)
    
    if max_mag is not None:
        query = query.filter(Earthquake.magnitude <= max_mag)
        
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.filter(Earthquake.time >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
            
    if end_date:
        try:
            # Set to end of the day
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            query = query.filter(Earthquake.time <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")

    # Apply region bounding box filters
    if region == "us":
        # Continental US approximately
        query = query.filter(
            Earthquake.latitude.between(24.0, 50.0),
            Earthquake.longitude.between(-125.0, -66.0)
        )
    elif region == "asia":
        # General East/South Asia bounding box
        query = query.filter(
            Earthquake.latitude.between(0.0, 60.0),
            Earthquake.longitude.between(60.0, 150.0)
        )
    elif region == "europe":
        query = query.filter(
            Earthquake.latitude.between(35.0, 70.0),
            Earthquake.longitude.between(-10.0, 40.0)
        )

    quakes = query.order_by(Earthquake.time.desc()).all()
    return quakes

@app.get("/quakes/stats")
def get_quake_stats(days: int = Query(30, ge=1, le=120), db: Session = Depends(get_db)):
    """
    Aggregate earthquake stats for dashboard charts:
    - Time-series frequency and average magnitude
    - Depth-distribution categories
    - Magnitude frequency (for histogram)
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # 1. Fetch quakes in the cutoff range
    quakes = db.query(Earthquake).filter(Earthquake.time >= cutoff).all()
    
    if not quakes:
        return {
            "daily_trends": [],
            "depth_distribution": {"shallow": 0, "intermediate": 0, "deep": 0},
            "magnitude_distribution": {}
        }
        
    # Process trends locally with pandas for ease and flexibility
    df = pd.DataFrame([{
        "time": q.time.date(),
        "magnitude": q.magnitude,
        "depth": q.depth_km
    } for q in quakes])
    
    # Daily trend grouping
    daily = df.groupby("time").agg(
        count=("magnitude", "count"),
        avg_magnitude=("magnitude", "mean")
    ).reset_index()
    
    # Fill in date gaps if needed, but simple list of existing days is fine for charting
    daily["time"] = daily["time"].astype(str)
    daily_list = daily.to_dict(orient="records")
    
    # Depth grouping
    # Shallow: < 70km, Intermediate: 70-300km, Deep: > 300km
    shallow = int((df["depth"] < 70).sum())
    intermediate = int(((df["depth"] >= 70) & (df["depth"] <= 300)).sum())
    deep = int((df["depth"] > 300).sum())
    
    # Magnitude distribution (rounded to nearest 0.5)
    df["mag_bin"] = (df["magnitude"] * 2).round() / 2
    mag_bins = df["mag_bin"].value_counts().sort_index().to_dict()
    # Convert keys to strings for JSON compatibility
    mag_dist = {str(k): int(v) for k, v in mag_bins.items()}
    
    return {
        "daily_trends": daily_list,
        "depth_distribution": {
            "shallow": shallow,
            "intermediate": intermediate,
            "deep": deep
        },
        "magnitude_distribution": mag_dist,
        "total_count": len(quakes)
    }

@app.get("/risk/aftershock/{event_id}")
def get_aftershock_risk(event_id: str, db: Session = Depends(get_db)):
    """
    Get estimated aftershock probability for a specific earthquake.
    """
    result = calculate_aftershock_probability(db, event_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/risk/seismic-gaps")
def get_seismic_gaps(db: Session = Depends(get_db)):
    """
    Analyze and return regions overdue for a major earthquake.
    """
    return analyze_seismic_gaps(db)

@app.post("/admin/sync")
def trigger_sync(
    days: int = Query(1, ge=1, le=30, description="Number of past days to sync"),
    min_mag: float = Query(2.5, description="Minimum magnitude to fetch"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Manually trigger data synchronization from USGS.
    Runs in the background so the request returns immediately.
    """
    start_time = datetime.now(timezone.utc) - timedelta(days=days)
    
    if background_tasks:
        background_tasks.add_task(fetch_and_store_quakes, db, start_time, min_mag)
        return {"status": "Sync started in background"}
    else:
        new_count = fetch_and_store_quakes(db, start_time, min_mag)
        return {"status": "Sync complete", "new_records": new_count}
