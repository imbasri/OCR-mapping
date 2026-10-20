from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import json
from pathlib import Path

from app.core.config import TEMPLATES_DIR

router = APIRouter()


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float


class Field(BaseModel):
    key: str
    label: str
    data_type: str
    box: Box


class TemplateJSON(BaseModel):
    template_name: str
    image_dimensions: dict = Field(default_factory=dict)
    fields: List[Field]


class TemplateInfo(BaseModel):
    template_id: str
    template_name: str


def _save_template(template: TemplateJSON) -> str:
    template_id = str(uuid.uuid4())
    file_path = TEMPLATES_DIR / f"{template_id}.json"
    file_path.write_text(template.model_dump_json())
    return template_id


def _load_template(template_id: str) -> TemplateJSON | None:
    file_path = TEMPLATES_DIR / f"{template_id}.json"
    if not file_path.exists():
        return None
    return TemplateJSON.model_validate_json(file_path.read_text())


def _list_templates() -> List[TemplateInfo]:
    results: List[TemplateInfo] = []
    if not TEMPLATES_DIR.exists():
        return results
    for p in sorted(TEMPLATES_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text())
            results.append(
                TemplateInfo(
                    template_id=p.stem, template_name=data.get("template_name", p.stem)
                )
            )
        except json.JSONDecodeError:
            continue
    return results


@router.post("/templates", response_model=TemplateInfo, status_code=201)
def save_template(template: TemplateJSON):
    template_id = _save_template(template)
    return TemplateInfo(template_id=template_id, template_name=template.template_name)


@router.get("/templates", response_model=List[TemplateInfo])
def get_templates():
    return _list_templates()
