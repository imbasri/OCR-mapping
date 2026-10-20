"use client";

import { useState } from "react";
import type { ExtractionResult } from "@/types";

export function JsonViewer({
  result,
  onValueChange,
}: {
  result: ExtractionResult;
  onValueChange?: (key: string, value: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(result.extracted_data).map(([k, v]) => [k, v.value])
    )
  );

  const handleInput = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    onValueChange?.(key, val);
  };

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-semibold text-slate-700">Extraction Result</h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {result.document_name}
          {result.template_id && ` • ${result.template_id}`}
        </div>
      </div>

      {Object.keys(result.extracted_data).length === 0 && (
        <p className="text-sm text-slate-400">No data yet</p>
      )}

      <div className="space-y-4">
        {Object.entries(result.extracted_data).map(([key, { value, confidence }]) => {
          const pct = confidence <= 1 ? confidence * 100 : confidence;
          return (
          <div key={key} className="flex items-baseline gap-3">
            <label className="w-24 text-sm text-slate-600 font-medium shrink-0">{key}</label>
            <input
              type="text"
              value={values[key] ?? value}
              onChange={(e) => handleInput(key, e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="w-32 text-right shrink-0">
              <div className="text-xs text-slate-500">{Math.round(pct)}%</div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${
                    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
