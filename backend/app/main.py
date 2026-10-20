from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.templates import router as templates_router
from app.api.ocr import router as ocr_router

app = FastAPI(title="OCR Mapper Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates_router, prefix="/api/v1")
app.include_router(ocr_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "OCR Mapper Backend", "version": "0.1.0"}
