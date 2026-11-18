// Shape of results.json, written by the engine (attribute_engine/export.py).

export interface Metric {
  name: string;
  label: string;
  is_percent: boolean;
}

export interface Attribute {
  name: string;
  title: string;
  question: string | null;
  computed_by: "code" | "jev";
  type: "number" | "choice" | "boolean" | null;
  origin: "built in" | "found by AI" | "you added";
}

/** One attribute value vs every other row (stats.scorecard). */
export interface ScoreRow {
  attribute: string;
  kind: "group" | "number";
  value: string | null;
  n_with: number | null;
  mean_with: number | null;
  n_rest: number | null;
  mean_rest: number | null;
  lift: number | null;
  lift_pct: number | null;
  correlation: number | null;
  p_adjusted: number | null;
  significant: boolean;
  note?: string;
}

export interface LabeledRow {
  copy: string;
  conversion_rate: number;
  labels: Record<string, { label: string; score: number | null }>;
}

export interface Results {
  tool: string;
  version: number;
  created: string;
  metric: Metric;
  rows: number;
  attributes: Attribute[];
  scorecard: ScoreRow[];
  table: LabeledRow[];
}
