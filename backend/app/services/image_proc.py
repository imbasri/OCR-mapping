"""OpenCV preprocessing for cropped ROI regions."""

import cv2
import numpy as np


def preprocess_crop(crop: np.ndarray) -> np.ndarray:
    """
    Grayscale + adaptive threshold + mild deskew.
    Returns a clean BGR/gray image ready for OCR.
    """
    # Grayscale
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

    # Adaptive threshold (handles uneven lighting)
    th = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )

    return th
