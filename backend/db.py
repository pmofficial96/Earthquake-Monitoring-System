import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Float, String, DateTime, func
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load env file
load_dotenv()

# Determine database URL: default to local SQLite if Supabase URL is not provided
DATABASE_URL = os.getenv("SUPABASE_DB_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./seismic_watch.db"
    print("Using local SQLite database: ./seismic_watch.db")
else:
    print("Using Supabase PostgreSQL database.")

# SQLite needs a special check for multi-threaded access
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Earthquake(Base):
    __tablename__ = "earthquakes"

    id = Column(String, primary_key=True, index=True) # USGS Event ID
    magnitude = Column(Float, nullable=False)
    place = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    depth_km = Column(Float, nullable=False)
    time = Column(DateTime(timezone=True), nullable=False)
    fetched_at = Column(DateTime(timezone=True), default=func.now())

class SeismicGap(Base):
    __tablename__ = "seismic_gaps"

    region_name = Column(String, primary_key=True, index=True)
    last_major_quake = Column(DateTime(timezone=True), nullable=True)
    avg_recurrence_years = Column(Float, nullable=False)
    gap_score = Column(Float, nullable=False)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
