"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Label, Tag, Transformer } from "react-konva";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Field } from "@/types";

export const BOX_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export function colorFor(index: number) {
  return BOX_COLORS[index % BOX_COLORS.length];
}

interface Props {
  imageSrc: string;
  fields: Field[];
  onChange: (fields: Field[]) => void;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

export default function CanvasMapper({
  imageSrc,
  fields,
  onChange,
  selectedKey,
  onSelect,
}: Props) {
  const stageRef = useRef<KonvaStage>(null);
  const shapeRef = useRef<KonvaRect>(null);
  const trRef = useRef<KonvaTransformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const maxW = 900;
      const scale = Math.min(1, maxW / img.width);
      setSize({ width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const shape = shapeRef.current;
    if (shape) {
      tr.nodes([shape]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedKey, fields, size]);

  const pointer = () => {
    const pos = stageRef.current?.getPointerPosition();
    return { x: pos?.x ?? 0, y: pos?.y ?? 0 };
  };

  const startDraw = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target !== e.target.getStage()) return;
    onSelect(null);
    const p = pointer();
    setDragStart(p);
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const moveDraw = () => {
    if (!dragStart) return;
    const p = pointer();
    setDraft({
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    });
  };

  const endDraw = () => {
    if (!dragStart || !draft) return;
    setDragStart(null);
    setDraft(null);
    if (draft.w < 5 || draft.h < 5) return;

    const index = fields.length;
    const key = `field_${index + 1}`;
    const field: Field = {
      key,
      label: `Field ${index + 1}`,
      data_type: "string",
      box: {
        x: Math.round(draft.x),
        y: Math.round(draft.y),
        w: Math.round(draft.w),
        h: Math.round(draft.h),
      },
    };
    onChange([...fields, field]);
    onSelect(key);
  };

  const endTransform = () => {
    const shape = shapeRef.current;
    if (!shape) return;
    const id = fields.findIndex((f) => f.key === selectedKey);
    if (id < 0) return;
    const w = Math.round(shape.width() * shape.scaleX());
    const h = Math.round(shape.height() * shape.scaleY());
    shape.width(w);
    shape.height(h);
    shape.scaleX(1);
    shape.scaleY(1);
    const next = [...fields];
    next[id] = {
      ...next[id],
      box: { x: Math.round(shape.x()), y: Math.round(shape.y()), w, h },
    };
    onChange(next);
  };

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={size.width}
              height={size.height}
              listening={false}
            />
          )}

          {fields.map((f, i) => {
            const isSel = f.key === selectedKey;
            return (
              <Rect
                key={f.key}
                x={f.box.x}
                y={f.box.y}
                width={f.box.w}
                height={f.box.h}
                stroke={colorFor(i)}
                strokeWidth={isSel ? 3 : 2}
                fill={`${colorFor(i)}22`}
                draggable
                onClick={() => onSelect(f.key)}
                onTap={() => onSelect(f.key)}
                onDragEnd={(e) => {
                  const next = [...fields];
                  next[i] = {
                    ...f,
                    box: {
                      ...f.box,
                      x: Math.round(e.target.x()),
                      y: Math.round(e.target.y()),
                    },
                  };
                  onChange(next);
                }}
                onTransformEnd={endTransform}
                ref={isSel ? shapeRef : undefined}
              />
            );
          })}

          {fields.map((f, i) => (
            <Label
              key={`l-${f.key}`}
              x={f.box.x}
              y={Math.max(0, f.box.y - 20)}
              listening={false}
            >
              <Tag fill={colorFor(i)} cornerRadius={3} />
              <Text
                text={`${f.key} · ${f.data_type}`}
                fontSize={11}
                padding={4}
                fill="#ffffff"
              />
            </Label>
          ))}

          {draft && (
            <Rect
              x={draft.x}
              y={draft.y}
              width={draft.w}
              height={draft.h}
              stroke="#0f172a"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}

          <Transformer ref={trRef} rotateEnabled={false} anchorSize={8} />
        </Layer>
      </Stage>
      <p className="mt-2 text-xs text-slate-500">
        Click and drag on empty canvas to draw a field box. Drag a box to move it, select it to
        resize with handles.
      </p>
    </div>
  );
}