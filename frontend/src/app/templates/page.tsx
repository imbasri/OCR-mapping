"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save, FileText, Plus } from "lucide-react";
import type { Template, Field } from "@/types";
import { listTemplates, saveTemplate } from "@/lib/api";
import CanvasMapper from "@/components/CanvasMapper";
import FieldSidebar from "@/components/FieldSidebar";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplName, setTplName] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listTemplates().then(setTemplates).catch((e) => setError(e.message));
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      const img = new Image();
      img.onload = () => setImgDims({ width: img.width, height: img.height });
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addField = () => {
    const key = `field_${fields.length + 1}`;
    setFields([
      ...fields,
      { key, label: `Field ${fields.length + 1}`, data_type: "string", box: { x: 0, y: 0, w: 100, h: 50 } },
    ]);
    setSelectedKey(key);
  };

  const handleSave = async () => {
    if (!tplName || !imageSrc) {
      setError("Please enter a template name and upload an image.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveTemplate({
        template_id: crypto.randomUUID(),
        template_name: tplName,
        image_dimensions: imgDims,
        fields,
      });
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Template Builder</h1>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Existing templates list */}
      {templates.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText size={16} /> Existing Templates
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.template_id}
                onClick={() => {
                  setTplName(t.template_name);
                  setFields(t.fields);
                  setImgDims(t.image_dimensions);
                  setImageSrc(null);
                }}
                className="rounded-md border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
              >
                <div className="font-medium text-slate-900">{t.template_name}</div>
                <div className="mt-1 text-xs text-slate-500">{t.fields.length} fields</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New template form */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-600">Template Name</label>
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="e.g. Invoice"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Image</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Upload size={16} />
              <span className="truncate max-w-[160px]">
                {imageSrc ? "Image uploaded" : "Upload PNG/JPG/WebP"}
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Canvas + sidebar */}
      {imageSrc && (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <CanvasMapper
              imageSrc={imageSrc}
              fields={fields}
              onChange={setFields}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
          </div>
          <FieldSidebar
            fields={fields}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            onAdd={addField}
            onDelete={(k) => setFields(fields.filter((f) => f.key !== k))}
            onEdit={(k, patch) =>
              setFields(fields.map((f) => (f.key === k ? { ...f, ...patch } : f)))
            }
          />
        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Template"}
        </button>
        <button
          onClick={addField}
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Plus size={16} /> Add Field
        </button>
      </div>
    </main>
  );
}
