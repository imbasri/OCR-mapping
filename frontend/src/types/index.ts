export interface Box { x: number; y: number; w: number; h: number; }
export interface Field { key: string; label: string; data_type: string; box: Box; }
export interface Template {
  template_id: string;
  template_name: string;
  image_dimensions: { width: number; height: number };
  fields: Field[];
}
export interface ExtractionResult {
  document_name: string;
  template_id: string;
  extracted_data: Record<string, { value: string; confidence: number }>;
}