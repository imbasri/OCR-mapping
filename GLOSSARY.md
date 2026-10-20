# Glossary

## Template
A JSON definition mapping field keys to bounding box coordinates on a reference document image.

## Field
A single key-value extraction target with metadata (key, label, data_type, box).

## ROI (Region of Interest)
A rectangular crop of the source image defined by (x, y, w, h) in pixels.

## PaddleOCR-VL
Vision-language OCR model (PaddleOCR 3.x) used for text extraction from cropped regions.

## Template ID
UUID identifier for a saved template.

## Image Dimensions
The width/height of the reference image used when creating the template; used to validate and normalize coordinates.

## Extraction Result
The OCR output for one field: value + confidence.

## Draught Survey
The primary target document type: a barge draught survey report with handwritten and printed form fields.

