from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import tempfile
import os
import json
from pathlib import Path
import numpy as np
import cv2
from PIL import Image
import io

from app.core.config import TEMPLATES_DIR
from app.core.paddle_setup import get_pipeline
from app.services.image_proc import preprocess_crop

router = APIRouter()


def _result_fields(res) -> tuple[str, float]:
    """Extract (text, confidence) from a PaddleOCR (PP-OCRv6) result item.

    PaddleOCR.predict() returns list of dicts like:
    { "rec_texts": [...], "rec_scores": [...], "rec_boxes": [...] }

    For backwards compatibility, also accept old PaddleOCR-VL dict/object formats.
    """
    # PP-OCRv6 standard format
    if isinstance(res, dict) and "rec_texts" in res:
        rec_texts = res.get("rec_texts", [""])
        rec_scores = res.get("rec_scores", [1.0])
        text = rec_texts[0] if rec_texts else ""
        conf = float(rec_scores[0]) if rec_scores else 1.0
        return (text, conf)

    # Backward compatibility: PaddleOCR-VL dict/object
    if isinstance(res, dict):
        return (
            str(res.get("text", "")),
            float(res.get("confidence", res.get("score", 1.0)) or 1.0),
        )

    text = getattr(res, "text", None)
    if text is None and hasattr(res, "preds"):
        text = res.preds
    if text is None:
        text = str(res)
    conf = getattr(res, "confidence", None)
    if conf is None:
        conf = getattr(res, "score", 1.0)
    return (str(text), float(conf or 1.0))


@router.post("/ocr/process")
def process_ocr(
    file: UploadFile = File(...),
    template_id: str = ...,
):
    """Process an uploaded document with a saved template using PaddleOCR (PP-OCRv6)."""

    template_path = TEMPLATES_DIR / f"{template_id}.json"
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")

    template = json.loads(template_path.read_text())

    suffix = Path(file.filename).suffix or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        pipeline = get_pipeline()

        img = Image.open(tmp_path).convert("RGB")
        img_w, img_h = img.size

        img_dims = template.get("image_dimensions", {})
        ref_w = float(img_dims.get("width", img_w))
        ref_h = img_h  # ponytail: scale only on width, height scales proportionally
        scale = img_w / ref_w if ref_w else 1.0

        extracted = {}
        for field in template.get("fields", []):
            key = field.get("key", "")
            box = field.get("box", {})
            x = float(box.get("x", 0))
            y = float(box.get("y", 0))
            w = float(box.get("w", 0))
            h = float(box.get("h", 0))

            # Normalize: if coords look like percentages, scale to pixels
            if x < 1:
                x *= ref_w * scale
            if y < 1:
                y *= ref_h * scale
            if w < 1:
                w *= ref_w * scale
            if h < 1:
                h *= ref_h * scale
            x *= scale
            y *= scale
            w *= scale
            h *= scale

            x1 = int(max(0, min(x, img_w)))
            y1 = int(max(0, min(y, img_h)))
            x2 = int(max(0, min(x + w, img_w)))
            y2 = int(max(0, min(y + h, img_h)))
            if x2 <= x1 or y2 <= y1:
                extracted[key] = {"value": "", "confidence": 0.0}
                continue

            crop = np.array(img.crop((x1, y1, x2, y2)))  # RGB
            crop_bgr = cv2.cvtColor(crop, cv2.COLOR_RGB2BGR)
            processed = preprocess_crop(crop_bgr)

            buf = io.BytesIO()
            Image.fromarray(processed).save(buf, format="PNG")
            buf.seek(0)

            results = list(pipeline.predict(buf.read()))
            if results:
                text, conf = _result_fields(results[0])
            else:
                text, conf = "", 0.0
            extracted[key] = {"value": text, "confidence": conf}

        return {
            "document_name": file.filename,
            "template_id": template_id,
            "extracted_data": extracted,
        }

    finally:
        Path(tmp_path).unlink(missing_ok=True)
