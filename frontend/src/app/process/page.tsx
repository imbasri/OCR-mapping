"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, Loader2, Image as ImageIcon } from "lucide-react";
import type { Template, ExtractionResult } from "@/types";
import { listTemplates, processOcr } from "@/lib/api";
import { JsonViewer } from "@/components/JsonViewer";

export default function ProcessPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTpl, setSelectedTpl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = () => {
    listTemplates()
      .then(setTemplates)
      .catch((e) => setError(e.message));
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleProcess = async () => {
    if (!file || !selectedTpl) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await processOcr(file, selectedTpl);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Process Document</h1>
        <Link
          href="/"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Template</label>
            <select
              value={selectedTpl}
              onChange={(e) => setSelectedTpl(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.template_name}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <button onClick={loadTemplates} className="mt-2 text-xs text-blue-600 hover:underline">
                Load templates
              </button>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Document</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <FileUp size={16} />
              <span className="truncate">{file ? file.name : "Choose PNG/JPG/PDF…"}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleProcess}
              disabled={processing || !file || !selectedTpl}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : null}
              {processing ? "Processing…" : "Process"}
            </button>
          </div>
        </div>
      </section>

      {preview && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ImageIcon size={16} /> Document Preview
          </h2>
          <img src={preview} alt={file?.name ?? "document"} className="max-h-[600px] rounded-md" />
        </div>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Extracted Data (editable)
            </h2>
            <JsonViewer result={result} />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Document</h2>
            {preview && (
              <img
                src={preview}
                alt="document"
                className="max-h-[600px] rounded-md border border-slate-200"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
