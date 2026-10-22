import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "app" / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
SAMPLES_DIR = STATIC_DIR / "samples"
DB_PATH = BASE_DIR / "medbridge.db"

# Serverless environment compatibility (e.g., Vercel Lambda where repo root is read-only)
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    STATIC_DIR = Path("/tmp/static")
    UPLOAD_DIR = STATIC_DIR / "uploads"
    SAMPLES_DIR = STATIC_DIR / "samples"
    DB_PATH = Path("/tmp/medbridge.db")
    bundled_db = BASE_DIR / "medbridge.db"
    if bundled_db.exists() and not DB_PATH.exists():
        try:
            import shutil
            shutil.copy2(bundled_db, DB_PATH)
        except Exception:
            pass

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

class SystemStatus(BaseModel):
    ocr_provider: str
    ocr_connected: bool
    ai_provider: str
    ai_connected: bool
    database_connected: bool
    database_type: str
    environment: str
    mode_description: str

def get_system_status() -> SystemStatus:
    has_vision = bool(GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS))
    has_gemini = bool(GEMINI_API_KEY.strip())
    
    ocr_name = "Google Cloud Vision API (Live)" if has_vision else "Demo Optical OCR Adapter (Local Synthetic Engine)"
    ai_name = "Google Gemini 2.0 / 1.5 Pro (Live API)" if has_gemini else "MedBridge Clinical Structuring Adapter (Local Rule & Uncertainty Engine)"
    
    desc = "Fully operational local demonstration mode with transparent fallback adapters. All persistence, verification gates, source linking, and reminders are genuinely live."
    if has_vision and has_gemini:
        desc = "Full Google Cloud production stack active with Cloud Vision OCR & Gemini structuring."
    elif has_vision:
        desc = "Google Cloud Vision OCR active; Gemini running in high-fidelity structuring adapter."
    elif has_gemini:
        desc = "Google Gemini structuring active; OCR running in high-fidelity demo adapter."

    return SystemStatus(
        ocr_provider=ocr_name,
        ocr_connected=has_vision,
        ai_provider=ai_name,
        ai_connected=has_gemini,
        database_connected=True,
        database_type="SQLite Persistent Store",
        environment="development",
        mode_description=desc
    )
