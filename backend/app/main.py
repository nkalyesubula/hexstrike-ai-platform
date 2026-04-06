from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.database import init_db
from app.routers import auth, tools, learning, analytics
from app.services.websocket_manager import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title="HexStrike AI Educational Platform",
    description="Autonomous Penetration Testing Teaching Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Echo: {data}", client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tools.router, prefix="/api/tools", tags=["Tools"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "HexStrike AI Educational Platform API", "status": "running"}

@app.get("/health")
async def health_check():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.HEXSTRIKE_URL}/health", timeout=5)
            hexstrike_status = "connected" if resp.status_code == 200 else "error"
    except:
        hexstrike_status = "unreachable"
    
    return {
        "status": "healthy",
        "hexstrike": hexstrike_status,
        "database": "connected"
    }