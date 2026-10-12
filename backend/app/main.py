import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import UPLOAD_DIR, SAMPLES_DIR, STATIC_DIR
from .models.database import init_db
from .services.sample_prescriptions import generate_sample_images

from .routes import (
    prescriptions,
    medications,
    schedules,
    reminders,
    caregivers,
    audit,
    demo,
    system,
    auth
)
from .routes import followups, ipd, sugar, wound_care, patient_history, formulary

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database and synthetic sample prescription images
    init_db()
    generate_sample_images()
    # Seed formulary dataset
    try:
        from .routes.formulary import seed_formulary
        seed_formulary()
    except Exception:
        pass
    yield
    # Shutdown logic if any

app = FastAPI(
    title="MedBridge — Clinical Medication & Patient Management API",
    description=(
        "Safety-first, source-linked prescription processing, uncertainty verification gate, "
        "medication schedule engine, IPD/OPD formulary, diabetes tracker, wound care, "
        "doctor follow-ups, discharge summaries, and full patient history management."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for prescription image display
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")

# ── Core Prescription Routers ──
app.include_router(prescriptions.router)
app.include_router(medications.router)
app.include_router(schedules.router)
app.include_router(reminders.router)
app.include_router(caregivers.router)
app.include_router(audit.router)
app.include_router(demo.router)
app.include_router(system.router)
app.include_router(auth.router)

# ── New Clinical Feature Routers ──
app.include_router(followups.router)
app.include_router(ipd.router)
app.include_router(sugar.router)
app.include_router(wound_care.router)
app.include_router(patient_history.router)
app.include_router(formulary.router)

@app.get("/")
def root():
    return {
        "service": "MedBridge Backend API v2",
        "tagline": "Complete clinical medication & patient care management.",
        "status": "online",
        "documentation": "/docs",
        "new_features": [
            "Doctor Follow-up Scheduling",
            "IPD Records & Discharge Summaries",
            "OPD/IPD Medicine Formulary with Syringe Specs",
            "Dietary Restrictions per Medicine",
            "Diabetes & Blood Sugar Tracker (ADA 2024)",
            "Preprandial/Postprandial Meal Notifications",
            "Wound Dressing Reminders (Trauma & Surgical)",
            "Full Patient Medical History"
        ]
    }
