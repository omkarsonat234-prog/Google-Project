"""
MedBridge FastAPI Service Entrypoint
Provides entrypoint for Vercel Services, ASGI servers, and local execution.
"""
from app.main import app

# Export app instance for Vercel / Uvicorn (main:app)
__all__ = ["app"]
