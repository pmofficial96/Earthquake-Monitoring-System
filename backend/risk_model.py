import math
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from db import Earthquake, SeismicGap
from sklearn.linear_model import LogisticRegression

# Earth's radius in kilometers
EARTH_RADIUS_KM = 6371.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the Earth in kilometers.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
        
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def get_regional_aftershock_rate(db: Session, lat: float, lon: float, radius_km: float = 100.0) -> float:
    """
    Calculate the ratio of historical quakes in the region that were followed by aftershocks.
    """
    # Simple bounding box to pre-filter quakes before calculating exact distance
    lat_delta = radius_km / 111.0 # 1 degree lat is ~111km
    lon_delta = radius_km / (111.0 * math.cos(math.radians(lat))) if math.cos(math.radians(lat)) != 0 else 180.0
    
    # Query all quakes of mag >= 5.0 in the bounding box
    candidates = db.query(Earthquake).filter(
        Earthquake.magnitude >= 5.0,
        Earthquake.latitude.between(lat - lat_delta, lat + lat_delta),
        Earthquake.longitude.between(lon - lon_delta, lon + lon_delta)
    ).all()
    
    mainshocks = [c for c in candidates if haversine_distance(lat, lon, c.latitude, c.longitude) <= radius_km]
    
    if not mainshocks:
        return 0.15 # Default historical rate if region has no mainshocks
        
    # Bounding box for ALL potential aftershocks in the region (within the radius + 50km)
    broader_lat_delta = (radius_km + 50.0) / 111.0
    broader_lon_delta = (radius_km + 50.0) / (111.0 * math.cos(math.radians(lat))) if math.cos(math.radians(lat)) != 0 else 180.0
    
    all_as_candidates = db.query(Earthquake).filter(
        Earthquake.magnitude >= 4.0,
        Earthquake.latitude.between(lat - broader_lat_delta, lat + broader_lat_delta),
        Earthquake.longitude.between(lon - broader_lon_delta, lon + broader_lon_delta)
    ).all()
    
    aftershock_successes = 0
    for ms in mainshocks:
        # Check in memory if any candidate is within 50km and 7 days after ms
        has_aftershock = False
        for ac in all_as_candidates:
            if ac.id == ms.id:
                continue
            time_diff = ac.time - ms.time
            if 0 <= time_diff.days < 7:
                if haversine_distance(ms.latitude, ms.longitude, ac.latitude, ac.longitude) <= 50.0:
                    has_aftershock = True
                    break
        if has_aftershock:
            aftershock_successes += 1
            
    return aftershock_successes / len(mainshocks)

def calculate_aftershock_probability(db: Session, event_id: str) -> dict:
    """
    Estimate probability of aftershock following a major quake.
    Uses trained Logistic Regression if data is sufficient; otherwise falls back to a physical formula.
    """
    quake = db.query(Earthquake).filter(Earthquake.id == event_id).first()
    if not quake:
        return {"error": "Earthquake not found"}
        
    mag = quake.magnitude
    depth = quake.depth_km
    lat = quake.latitude
    lon = quake.longitude
    
    # Calculate regional rate
    reg_rate = get_regional_aftershock_rate(db, lat, lon)
    
    # Check if we have enough data in DB to train Logistic Regression
    # We limit to the 100 most recent mainshocks to avoid database query storms
    historical_mainshocks = db.query(Earthquake).filter(Earthquake.magnitude >= 5.0).order_by(Earthquake.time.desc()).limit(100).all()
    
    trained_model = False
    probability = 0.5 # Default fallback
    
    if len(historical_mainshocks) >= 20:
        try:
            # Build dataset
            features = []
            labels = []
            
            for ms in historical_mainshocks:
                # Find if aftershock occurred - query localized box
                as_candidates = db.query(Earthquake).filter(
                    Earthquake.magnitude >= 4.0,
                    Earthquake.id != ms.id,
                    Earthquake.time.between(ms.time, ms.time + pd.Timedelta(days=7)),
                    Earthquake.latitude.between(ms.latitude - 1.0, ms.latitude + 1.0),
                    Earthquake.longitude.between(ms.longitude - 1.0, ms.longitude + 1.0)
                ).all()
                
                has_as = 1 if any(haversine_distance(ms.latitude, ms.longitude, ac.latitude, ac.longitude) <= 50.0 for ac in as_candidates) else 0
                
                # Get historical rate for that mainshock's position
                ms_reg_rate = get_regional_aftershock_rate(db, ms.latitude, ms.longitude)
                
                features.append([ms.magnitude, ms.depth_km, ms_reg_rate])
                labels.append(has_as)
                
            X = np.array(features)
            y = np.array(labels)
            
            # If we have both classes represented, we can fit
            if len(np.unique(y)) > 1:
                clf = LogisticRegression()
                clf.fit(X, y)
                
                # Predict probability for the input event
                prob_arr = clf.predict_proba([[mag, depth, reg_rate]])
                probability = float(prob_arr[0][1])
                trained_model = True
        except Exception as e:
            print(f"Failed to train logistic regression: {e}. Falling back to default formula.")
            
    if not trained_model:
        # Fallback physics-based statistical formula
        z = -5.0 + (1.2 * mag) - (0.05 * depth) + (2.0 * reg_rate)
        probability = 1.0 / (1.0 + math.exp(-z))
        
    # Standard output formatting
    return {
        "event_id": event_id,
        "magnitude": mag,
        "depth_km": depth,
        "latitude": lat,
        "longitude": lon,
        "regional_aftershock_rate": round(reg_rate, 4),
        "aftershock_probability": round(probability, 4),
        "model_trained": trained_model
    }

def analyze_seismic_gaps(db: Session) -> list:
    """
    Identify regions that are overdue for a major earthquake.
    Groups events into 5-degree grid cells as region indicators.
    """
    # Fetch all earthquakes of magnitude >= 5.0
    quakes = db.query(Earthquake).filter(Earthquake.magnitude >= 5.0).order_by(Earthquake.time.asc()).all()
    
    if not quakes:
        return []
        
    # Group by grid cell: (rounded_lat, rounded_lon)
    regions = {}
    for q in quakes:
        # 5-degree grid rounding
        grid_lat = int(round(q.latitude / 5.0) * 5)
        grid_lon = int(round(q.longitude / 5.0) * 5)
        region_key = (grid_lat, grid_lon)
        
        if region_key not in regions:
            regions[region_key] = []
        regions[region_key].append(q)
        
    results = []
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Empty existing table
    db.query(SeismicGap).delete()
    
    for region_key, rqs in regions.items():
        if len(rqs) < 3:
            # Not enough history to determine a recurrence interval
            continue
            
        lat, lon = region_key
        region_name = f"Grid Box ({lat}N, {lon}E)"
        
        # Calculate time intervals between successive major quakes
        intervals_years = []
        for i in range(1, len(rqs)):
            delta = rqs[i].time - rqs[i-1].time
            intervals_years.append(delta.days / 365.25)
            
        avg_recurrence = sum(intervals_years) / len(intervals_years)
        
        # Calculate time elapsed since the last major quake
        last_quake = rqs[-1]
        years_since_last = (current_time - last_quake.time).days / 365.25
        
        # Gap score: time elapsed / average recurrence interval
        gap_score = years_since_last / avg_recurrence if avg_recurrence > 0 else 0.0
        
        # Save to DB
        sg = SeismicGap(
            region_name=region_name,
            last_major_quake=last_quake.time,
            avg_recurrence_years=float(avg_recurrence),
            gap_score=float(gap_score)
        )
        db.add(sg)
        
        results.append({
            "region_name": region_name,
            "latitude": lat,
            "longitude": lon,
            "last_major_quake": last_quake.time,
            "avg_recurrence_years": round(avg_recurrence, 2),
            "years_since_last": round(years_since_last, 2),
            "gap_score": round(gap_score, 4)
        })
        
    db.commit()
    
    # Sort by gap_score descending (most overdue first)
    results.sort(key=lambda x: x["gap_score"], reverse=True)
    return results
