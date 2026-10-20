import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMPLATES_DIR = Path(os.getenv("TEMPLATES_DIR", BASE_DIR / "templates_storage"))
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
