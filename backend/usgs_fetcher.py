import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from db import Earthquake, SessionLocal
import os

USGS_API_BASE = os.getenv("USGS_API_BASE", "https://earthquake.usgs.gov/fdsnws/event/1/query")

def fetch_and_store_quakes(db: Session, start_time: datetime, min_magnitude: float = 2.5) -> int:
    """
    Fetches earthquakes from USGS and stores them in the database.
    Returns the number of new earthquakes inserted.
    """
    # USGS expects ISO-8601 format
    start_str = start_time.strftime("%Y-%m-%dT%H:%M:%S")
    
    params = {
        "format": "geojson",
        "starttime": start_str,
        "minmagnitude": min_magnitude,
    }
    
    print(f"Fetching quakes from USGS since {start_str} with magnitude >= {min_magnitude}...")
    
    try:
        response = httpx.get(USGS_API_BASE, params=params, timeout=30.0)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching data from USGS API: {e}")
        return 0

    features = data.get("features", [])
    print(f"Fetched {len(features)} earthquakes from USGS. Processing inserts...")
    
    new_count = 0
    # Process features in batches or individually
    for feature in features:
        eq_id = feature.get("id")
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        coords = geom.get("coordinates", [0, 0, 0])
        
        if not eq_id or not props or not coords:
            continue
            
        # Check if already exists in DB
        existing = db.query(Earthquake).filter(Earthquake.id == eq_id).first()
        if existing:
            continue
            
        # Convert millisecond epoch to datetime with UTC timezone
        epoch_ms = props.get("time")
        if epoch_ms is None:
            continue
        time_utc = datetime.fromtimestamp(epoch_ms / 1000.0, tz=timezone.utc)
        
        # Coordinates: longitude, latitude, depth
        lon = coords[0]
        lat = coords[1]
        depth = coords[2] if len(coords) > 2 else 0.0
        
        # Create DB record
        quake = Earthquake(
            id=eq_id,
            magnitude=float(props.get("mag") or 0.0),
            place=props.get("place", "Unknown Location"),
            latitude=float(lat),
            longitude=float(lon),
            depth_km=float(depth),
            time=time_utc
        )
        
        db.add(quake)
        new_count += 1
        
        # Commit periodically
        if new_count % 100 == 0:
            db.commit()
            
    db.commit()
    print(f"Successfully inserted {new_count} new earthquakes.")
    return new_count

def sync_recent_quakes() -> int:
    """
    Convenience function to sync quakes from the past 7 days.
    """
    db = SessionLocal()
    try:
        start_time = datetime.now(timezone.utc) - timedelta(days=7)
        return fetch_and_store_quakes(db, start_time)
    finally:
        db.close()

def sync_historical_quakes() -> int:
    """
    Convenience function to load historical earthquakes (last 2 years, magnitude >= 5.0)
    for model training.
    """
    db = SessionLocal()
    try:
        start_time = datetime.now(timezone.utc) - timedelta(days=730) # ~2 years
        return fetch_and_store_quakes(db, start_time, min_magnitude=5.0)
    finally:
        db.close()
