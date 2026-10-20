import type { Template, ExtractionResult } from "@/types";

const BASE = "http://localhost:8000/api/v1";

export async function listTemplates(): Promise<Template[]> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error(`listTemplates: ${res.status}`);
  return res.json();
}

export async function saveTemplate(tpl: Template): Promise<Template> {
  const res = await fetch(`${BASE}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tpl),
  });
  if (!res.ok) throw new Error(`saveTemplate: ${res.status}`);
  return res.json();
}

export async function processOcr(
  file: File,
  templateId: string
): Promise<ExtractionResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("template_id", templateId);
  const res = await fetch(`${BASE}/ocr/process`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`processOcr: ${res.status}`);
  return res.json();
}
