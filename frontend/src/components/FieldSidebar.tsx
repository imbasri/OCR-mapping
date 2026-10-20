"use client";

import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Field } from "@/types";
import { colorFor } from "./CanvasMapper";

const TYPES = ["string", "number", "date", "table"];

interface Props {
  fields: Field[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onAdd: () => void;
  onDelete: (key: string) => void;
  onEdit: (key: string, patch: Partial<Field>) => void;
}

export default function FieldSidebar({
  fields,
  selectedKey,
  onSelect,
  onAdd,
  onDelete,
  onEdit,
}: Props) {
  const sel = fields.find((f) => f.key === selectedKey) ?? null;

  return (
    <aside className="flex w-72 shrink-0 flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Fields</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto py-2">
        {fields.length === 0 && (
          <li className="px-4 py-3 text-xs text-slate-400">
            No fields yet. Draw a box on the canvas.
          </li>
        )}
        {fields.map((f, i) => (
          <li key={f.key}>
            <button
              onClick={() => onSelect(f.key)}
              className={clsx(
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50",
                f.key === selectedKey && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <span
                className="h-3 w-3 rounded-sm border"
                style={{
                  backgroundColor: `${colorFor(i)}33`,
                  borderColor: colorFor(i),
                }}
              />
              <span className="flex-1 truncate">{f.label || f.key}</span>
              <span className="text-xs text-slate-400">{f.data_type}</span>
            </button>
          </li>
        ))}
      </ul>

      {sel && (
        <div className="space-y-3 border-t border-slate-200 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Key</label>
            <input
              value={sel.key}
              onChange={(e) => onEdit(sel.key, { key: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
            <input
              value={sel.label}
              onChange={(e) => onEdit(sel.key, { label: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
            <select
              value={sel.data_type}
              onChange={(e) => onEdit(sel.key, { data_type: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onDelete(sel.key)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </aside>
  );
}
