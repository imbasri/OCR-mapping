"""PaddleOCR-VL setup and lazy engine singleton."""

from __future__ import annotations

import os
import threading
from typing import Any, Optional

_pipeline: Optional[Any] = None
_lock = threading.Lock()


def _device() -> str:
    """Pick GPU when available, else CPU."""
    forced = os.getenv("OCR_DEVICE")
    if forced:
        return forced
    try:
        import paddle

        if paddle.is_compiled_with_cuda():
            return "gpu"
    except Exception:
        pass
    return "cpu"


def get_pipeline() -> Any:
    """Return the shared PaddleOCRVL pipeline, initializing it on first use."""
    global _pipeline
    if _pipeline is None:
        with _lock:
            if _pipeline is None:
                from paddleocr import PaddleOCRVL

                _pipeline = PaddleOCRVL(device=_device())
    return _pipeline
