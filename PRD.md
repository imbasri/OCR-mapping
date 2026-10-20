# Product Requirement Document (PRD)
## Intelligent Document OCR & Visual Template Mapper

---

## 1. Executive Summary
A application that combines a **Next.js Visual Template Mapper Interface** with a **Python (FastAPI + PaddleOCR) Processing Engine**. 

The system enables users to visually label and define bounding box coordinates for standard form fields (Key-Value pairs and Table Cells) on document templates. By performing targeted region-of-interest (ROI) extraction based on saved templates, the system drastically improves PaddleOCR accuracy for handwritten and printed text, outputting clean, standardized JSON data.

---

## 2. Project Architecture & Folder Structure

The project is structured as a monorepo containing two separate core services: `frontend` and `backend`.

```text
ocr-mapper-app/
├── README.md
├── PRD.md
├── docker-compose.yml
├── frontend/                   # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router Pages
│   │   │   ├── page.tsx        # Dashboard / Document List
│   │   │   ├── templates/      # Template List & Creation
│   │   │   └── process/        # Document OCR Processing
│   │   ├── components/         # UI Components
│   │   │   ├── CanvasMapper.tsx# Interactive Bounding Box Annotation Tool
│   │   │   ├── FieldSidebar.tsx# Key-Value Input & Form Fields Controls
│   │   │   └── JsonViewer.tsx  # Extracted Result Inspector
│   │   ├── lib/                # API Clients & Utilities
│   │   └── types/              # TypeScript Types
│   ├── package.json
│   └── tailwind.config.js
└── backend/                    # Python FastAPI Engine
    ├── app/
    │   ├── api/                # Endpoints (v1)
    │   │   ├── templates.py    # Template Management API
    │   │   └── ocr.py          # OCR Engine Endpoints
    │   ├── core/               # App Configuration & PaddleOCR Setup
    │   ├── services/
    │   │   ├── ocr_engine.py   # PaddleOCR Cropping & Extraction Logic
    │   │   └── image_proc.py   # OpenCV Preprocessing (Grayscale, Deskew)
    │   └── models/             # Pydantic Schemas & DB Models
    ├── templates_storage/      # Saved Template JSON Files / Storage
    ├── requirements.txt
    └── main.py                 # FastAPI Application Entry
```

---

## 3. Product Goals & Key Features

### 3.1. Goals
* **High Accuracy on Handwriting:** Solve low-accuracy issues in dense forms by scoping OCR to exact bounding boxes.
* **Reusable Templates:** Define field locations once per document type (e.g., *Draught Survey Report*) and reuse across unlimited uploads.
* **Deterministic Output:** Produce predictable, clean JSON outputs mapped directly to predefined domain keys.

### 3.2. Core Features

#### Feature 1: Template Builder & Visual Bounding Box Mapper (Frontend)
* Upload sample document images (PNG, JPG, WebP, PDF converted to image).
* Interactive HTML5 Canvas tool to draw, resize, and position bounding boxes over form fields.
* Assign field metadata to each box:
  * `Key` (e.g., `barge_name`, `displacement_initial`)
  * `Label` (e.g., "Barge Name")
  * `Data Type` (`string`, `number`, `date`, `table`)
* Save mapping templates with a distinct name (e.g., `PROVISIONAL_DRAUGHT_SURVEY_V1`).

#### Feature 2: Targeted ROI Extraction Engine (Backend)
* Read stored template coordinates (X, Y, Width, Height) in absolute or percentage units.
* Perform image normalization and OpenCV pre-processing on the cropped region.
* Feed region crops into PaddleOCR (`lang="en"`, handwriting/angle detection enabled).
* Structure and return JSON data matching the template definition.

#### Feature 3: Template Management & Batch OCR
* Select an existing template to process new incoming documents of the same type.
* Preview extracted values side-by-side with the uploaded document image for verification.
* Manual override / inline correction of OCR results on the frontend.

---

## 4. Technical Stack

| Area | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router), React, TypeScript | Main UI Application |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Shadcn UI | Dashboard & Forms |
| **Interactive Canvas** | HTML5 Canvas / `konva` / `react-konva` | Bounding Box Mapper |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn | REST API Service |
| **OCR & CV Engine** | PaddleOCR, PyTorch/PaddlePaddle, OpenCV | Visual Crop & Text Extraction |
| **Storage** | SQLite / PostgreSQL / Local JSON Storage | Metadata & Template Storage |

---

## 5. Data Specifications & API Contracts

### 5.1. Template Schema (`TemplateJSON`)

```json
{
  "template_id": "tpl_draught_survey_001",
  "template_name": "Provisional Draught Survey Barge",
  "image_dimensions": {
    "width": 1200,
    "height": 1600
  },
  "fields": [
    {
      "key": "barge_name",
      "label": "Barge Name",
      "data_type": "string",
      "box": {
        "x": 190,
        "y": 70,
        "w": 350,
        "h": 30
      }
    },
    {
      "key": "displacement_initial",
      "label": "Displacement Initial",
      "data_type": "number",
      "box": {
        "x": 680,
        "y": 830,
        "w": 140,
        "h": 30
      }
    }
  ]
}
```

### 5.2. API Endpoints Specification

#### 1. Save Template
* **`POST /api/v1/templates`**
* **Payload:** Template JSON Object
* **Response:** `{ "status": "success", "template_id": "tpl_draught_survey_001" }`

#### 2. Get All Templates
* **`GET /api/v1/templates`**
* **Response:** `[ { "template_id": "...", "template_name": "..." } ]`

#### 3. Process Document with Template
* **`POST /api/v1/ocr/process`**
* **Form-Data:** 
  * `file`: File (Image/PDF)
  * `template_id`: string
* **Response:**
```json
{
  "document_name": "survey_march_2024.jpg",
  "template_id": "tpl_draught_survey_001",
  "extracted_data": {
    "barge_name": {
      "value": "BG. GOLDEN WAY 2503",
      "confidence": 0.945
    },
    "displacement_initial": {
      "value": "6.222,813",
      "confidence": 0.912
    }
  }
}
```

---

## 6. Execution Roadmap

1. **Phase 1: Backend Setup**
   * Set up FastAPI boilerplates and folder structure.
   * Integrate OpenCV crop logic with PaddleOCR engine.
2. **Phase 2: Frontend Canvas Mapper**
   * Build React Canvas annotation tool in Next.js to select regions and output `(x, y, w, h)` bounding boxes.
   * Implement template creation forms and local/API saving.
3. **Phase 3: Integration & Testing**
   * Connect Next.js file uploader to FastAPI OCR endpoint.
   * Run tests on target documents (*Draught Survey Barge Report*) to measure accuracy improvements.