# OCR Mapping App — AGENTS.md

## Quick navigation
- `backend/app/` — Python FastAPI engine
- `frontend/src/` — Next.js 14 (App Router, React 19, TS, Tailwind)
- `templates_storage/` — persisted template JSON files
- Run: `docker compose up --build` (ports 8000 + 3000) or see local start commands below

## Commands (root)
| Action | Command |
|---|---|
| Start both services (Docker) | `docker compose up --build` |
| Start backend only | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Start frontend only | `cd frontend && npm run dev` |
| Run backend tests | `cd backend && python -m pytest` (if present) |
| Run frontend lint | `cd frontend && npm run lint` |

## Architecture
- **Monorepo**: `frontend/` (Next.js App Router) + `backend/` (FastAPI + PaddleOCR + OpenCV)
- **Storage**: Local JSON files under `backend/templates_storage/`, path configured via `TEMPLATES_DIR` env var
- **API contract**: `POST /api/v1/templates`, `GET /api/v1/templates`, `POST /api/v1/ocr/process`
- **Box/Field format** (shared between frontend & backend): `{ x, y, w, h }` in absolute pixels (or normalized if `< 1`, then scaled)

## Backend notes
- Entry point: `backend/app/main.py` — creates FastAPI app, registers `/api/v1` routers
- API routers: `backend/app/api/templates.py`, `backend/app/api/ocr.py`
- Config: `backend/app/core/config.py` — `TEMPLATES_DIR = BASE_DIR / "templates_storage"` (overridable via env)
- PaddleOCR singleton: `backend/app/core/paddle_setup.py` — lazy-init `PaddleOCRVL(device="cpu"|"gpu")`
- Image preprocessing: `backend/app/services/image_proc.py` — grayscale + adaptive threshold + denoise
- OCR processing flow (see `ocr.py`):
  1. Load template JSON from `templates_storage/{template_id}.json`
  2. Read uploaded file, temp-save it
  3. For each field: normalize box coords (if `< 1`, treat as percentage of `image_dimensions`), scale to image pixels, crop ROI
  4. Run `pipeline.predict()` on preprocessed crop
  5. Return `{ document_name, template_id, extracted_data: { key: { value, confidence } } }`
- Coordinate normalization (critical): if any coord `< 1`, it's treated as a percentage of `ref_w`/`ref_h` from `image_dimensions`, then scaled by `img_w / ref_w`. This allows templates created with one image size to work with differently-sized uploads.

## Frontend notes
- Framework: Next.js 14 App Router, React 19, TypeScript, Tailwind CSS 4
- Key components (see `frontend/src/components/`):
  - `CanvasMapper.tsx` — interactive HTML5 Canvas via `react-konva`/`konva` for drawing/editing bounding boxes
  - `FieldSidebar.tsx` — controls for field list, selection, deletion, editing
  - `JsonViewer.tsx` — displays extracted JSON result
- API client: `frontend/src/lib/api.ts` — three functions: `listTemplates()`, `saveTemplate()`, `processOcr()`
- Type definitions: `frontend/src/types/index.ts` — `Box`, `Field`, `Template`, `ExtractionResult`
- App Router pages:
  - `frontend/src/app/page.tsx` — dashboard / template list
  - `frontend/src/app/templates/page.tsx` — template builder (upload image, draw boxes, save)
  - `frontend/src/app/process/page.tsx` — document OCR processing with template selection
- `saveTemplate` payload (from `TemplatesPage.handleSave`):
  ```json
  {
    "template_id": "<uuid>",
    "template_name": "...",
    "image_dimensions": { "width": N, "height": N },
    "fields": [{ key, label, data_type, box: { x, y, w, h } }]
  }
  ```
- Coordinate mapping: Frontend draws in *scaled* canvas space (max 900px width). Box coords are stored as absolute pixels relative to the original image dimensions. When processing OCR, the backend re-scales based on `image_dimensions` and `img_w / ref_w`.

## Common gotchas
- **Coordinate scaling**: If template was created with one image size and OCR is run on a differently-sized image, the backend scales coords using `scale = img_w / ref_w`. Ensure `image_dimensions` is set accurately when saving a template, or the OCR results will be misaligned.
- **Percentage coords**: The backend treats coords `< 1` as percentages of `image_dimensions`. If you always use absolute pixels, keep coords `>= 1`.
- **CORS**: Backend allows all origins (`allow_origins=["*"]`). Frontend calls `http://localhost:8000/api/v1/...` in dev.
- **PaddleOCR init**: First `process_ocr` call may be slow as the model downloads/loads. It's cached globally after that.
- **Temp files**: OCR endpoint writes uploaded file to a temp path and cleans up in `finally`. Ensure the uploaded file suffix is valid for PIL.

## What to avoid
- Don't modify `requirements.txt` without checking if `pip install` will break the Docker build.
- Don't change the `TEMPLATES_DIR` env var without also updating the Docker `volumes` mount or the backend will can't find saved templates.
- Don't assume OCR confidence values are always present — the `_result_fields` helper defaults to `1.0` when missing.
- Don't forget `enctype="multipart/form-data"` when submitting the OCR form (the frontend `api.ts` already uses `FormData`).

## Code discovery — codebase-memory-mcp
- Project `OCR-mapping` sudah diindex (203 nodes, 395 edges, status ready). Gunakan MCP tools sebagai pilihan pertama untuk eksplorasi kode:
  - `search_graph(name_pattern=...)` — cari fungsi/kelas/route/variabel
  - `trace_path(function_name=..., direction="inbound|outbound")` — siapa yang memanggil / dipanggil
  - `get_code_snippet(qualified_name=...)` — baca source fungsi/kelas tertentu
  - `check_index_coverage(...)` — validasi scope sebelum buat klaim ekslusif/negatif
  - `query_graph(...)` — Cypher untuk pattern multi-hop
- Jangan gunakan `codegraph` MCP di project ini — belum ada index `.codegraph/` (belum di-`init`). Mengaktifkannya tanpa index tidak berfungsi.
- `codebase-memory-mcp` tetap aktif di `opencode.jsonc` global; `codegraph` di-comment, `shadcn` di-disable.
## Structured reasoning — sequential-thinking
- MCP `sequential-thinking` aktif (`enabled: true` di `opencode.jsonc` global). Tool: `tools["sequential-thinking"].sequentialthinking()`.
- **Pakai** untuk masalah multi-step: debugging bug tak jelas, design decision dengan banyak trade-off, refactoring besar.
- **Jangan pakai** untuk tugas single-step atau path sudah jelas — overhead round-trip tidak perlu.
- Pattern singkat:
  1. `thoughtNumber: 1, totalThoughts: N` — reproduce/identify
  2. steps 2..N-1 — hypothesize, instrument, verify
  3. `thoughtNumber: N, nextThoughtNeeded: false` — fix + regression test, done
- No state antar call — semua konteks ada di conversation. Scaffolding reasoning, bukan memory engine.