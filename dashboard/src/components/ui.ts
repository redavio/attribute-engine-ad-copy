import type { Metric, Results, ScoreRow } from "../types";

// Display helpers and shared Tailwind classes for every view.
export const label = (s: string) => s.replace(/_/g, " ");
export const fmt = (v: number, m: Metric) =>
  m.is_percent ? `${(v * 100).toFixed(1)}%` : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
export const lift = (r: ScoreRow, m: Metric) =>
  r.lift == null
    ? null
    : `${r.lift >= 0 ? "+" : ""}${m.is_percent ? `${(r.lift * 100).toFixed(1)} pts` : fmt(r.lift, m)}${
        r.lift_pct != null ? ` (${r.lift_pct >= 0 ? "+" : ""}${Math.round(r.lift_pct * 100)}%)` : ""
      }`;

export function names(res: Results) {
  const byName = Object.fromEntries(res.attributes.map((a) => [a.name, a]));
  return {
    titleOf: (n: string) => byName[n]?.title ?? label(n),
    originOf: (n: string) => byName[n]?.origin ?? "",
  };
}

export const ui = {
  muted: "text-zinc-500 dark:text-zinc-400",
  help: "my-3 text-sm text-zinc-500 dark:text-zinc-400",
  table: "mb-4 mt-2 w-full border-collapse text-sm",
  th: "border-b border-zinc-200 px-2 py-2 text-left align-bottom font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
  cell: "border-b border-zinc-200 px-2 py-2 align-top dark:border-zinc-700",
  td: "whitespace-nowrap border-b border-zinc-200 px-2 py-2 align-top dark:border-zinc-700",
  pill: "rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
};
