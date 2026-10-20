"use client";

import { useEffect, useState } from "react";
import { listTemplates } from "@/lib/api";
import type { Template } from "@/types";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function Page() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">OCR Templates</h1>
      <p className="text-slate-600">
        Select a template to manage or create a new one, or go to the process page to extract data from documents.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FileText size={16} /> Manage Templates
        </Link>
        <Link
          href="/process"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Process Document
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && templates.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.template_id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{t.template_name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t.fields.length} fields
                  </div>
                </div>
                <Link
                  href="/process"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Use
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && templates.length === 0 && (
        <p className="mt-6 text-slate-500">No templates found. Create one to get started.</p>
      )}
    </div>
  );
}