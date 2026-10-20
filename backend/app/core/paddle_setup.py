"""PaddleOCR (PP-OCRv6) setup and lazy engine singleton."""

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
    """Return the shared PaddleOCR (PP-OCRv6) pipeline, initializing it on first use."""
    global _pipeline
    if _pipeline is None:
        with _lock:
            if _pipeline is None:
                from paddleocr import PaddleOCR

                _pipeline = PaddleOCR(
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False,
                    engine="paddle",
                )
    return _pipeline
