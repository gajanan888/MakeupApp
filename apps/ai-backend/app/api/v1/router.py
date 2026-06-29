from fastapi import APIRouter

from app.api.v1.endpoints import face_detection, health, landmarks, face_shape, skin_tone, beauty, recommend, simulation


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(face_detection.router)
api_router.include_router(landmarks.router)
api_router.include_router(face_shape.router)
api_router.include_router(skin_tone.router)
api_router.include_router(beauty.router)
api_router.include_router(recommend.router)
api_router.include_router(simulation.router)

