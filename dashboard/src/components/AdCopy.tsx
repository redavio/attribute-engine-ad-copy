import { useState } from "react";
import type { Results } from "../types";
import Labels from "./Labels";
import Scorecard from "./Scorecard";
import Summary from "./Summary";

export const VIEWS = { results: "Results", attributes: "Every attribute", labels: "Labels" } as const;
export type View = keyof typeof VIEWS;

/**
 * The whole Ad Copy Analyzer screen for one results.json: a one-line summary, then Results /
 * Every attribute / Labels. Takes the result as props and loads nothing itself, so any app can
 * render it (this repo's dashboard reads results.json; a hosted app can pass the same object).
 */
export default function AdCopy({ res, initialView = "results" }: { res: Results; initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {res.rows} ads, {res.attributes.length} attributes, metric: {res.metric.label}. Run on {res.created}.
      </p>
      <nav className="mb-2 mt-4 flex flex-wrap gap-1.5">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              view === v
                ? "border-brand bg-brand text-white"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {VIEWS[v]}
          </button>
        ))}
      </nav>
      {view === "results" && <Summary res={res} />}
      {view === "attributes" && <Scorecard res={res} />}
      {view === "labels" && <Labels res={res} />}
    </div>
  );
}
