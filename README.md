# OCR Mapping App

Intelligent Document OCR & Visual Template Mapper.

## Architecture

- **Backend**: Python FastAPI + PaddleOCR-VL (PaddleOCR 3.x) + OpenCV
- **Frontend**: Next.js 14 (App Router, TypeScript) + Tailwind + react-konva
- **Storage**: Local JSON files in `backend/templates_storage/`

## Quick Start (Docker)

```bash
docker compose up --build
# Backend:  http://localhost:8000
# Frontend: http://localhost:3000
```

## Quick Start (Local)

### Backend
```bash
cd backend
pip install paddlepaddle -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/templates` | Save a template |
| GET  | `/api/v1/templates` | List all templates |
| POST | `/api/v1/ocr/process` | Process document with template (multipart form-data) |

## Workflow

1. Open the frontend → upload a sample document image
2. Draw bounding boxes around each field on the canvas
3. Assign key/label/data_type to each box
4. Save the template
5. Upload new documents → process with the saved template
6. Review extracted JSON, override values manually if needed
7. Export / copy the cleaned JSON
