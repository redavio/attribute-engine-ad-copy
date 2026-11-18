import { useEffect, useState } from "react";
import { BRAND } from "./brand";
import type { Metric, Results, ScoreRow } from "./types";

const label = (s: string) => s.replace(/_/g, " ");
const fmt = (v: number, m: Metric) =>
  m.is_percent ? `${(v * 100).toFixed(1)}%` : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
const lift = (r: ScoreRow, m: Metric) =>
  r.lift == null
    ? null
    : `${r.lift >= 0 ? "+" : ""}${m.is_percent ? `${(r.lift * 100).toFixed(1)} pts` : fmt(r.lift, m)}${
        r.lift_pct != null ? ` (${r.lift_pct >= 0 ? "+" : ""}${Math.round(r.lift_pct * 100)}%)` : ""
      }`;

const VIEWS = { results: "Results", attributes: "Every attribute", labels: "Labels" } as const;
type View = keyof typeof VIEWS;

export default function App() {
  const [res, setRes] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>(() => {
    const v = new URLSearchParams(location.search).get("view");
    return v && v in VIEWS ? (v as View) : "results";
  });

  useEffect(() => {
    const src = new URLSearchParams(location.search).get("src") || "results.json";
    fetch(src)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Couldn't load ${src}.`))))
      .then(setRes)
      .catch((e) => setError(e.message));
  }, []);

  const open = (file: File) =>
    file.text().then((t) => {
      try {
        setRes(JSON.parse(t));
        setError("");
      } catch {
        setError("That file isn't an Ad Copy Analyzer results file.");
      }
    });

  return (
    <div className="page">
      <header>
        <div>
          <h1>{BRAND.logo && <img src={BRAND.logo} alt="" className="logo" />}{BRAND.name} <span className="muted">· Results</span></h1>
          {res && <p className="muted">{res.rows} ads, {res.attributes.length} attributes, metric: {res.metric.label}. Run on {res.created}.</p>}
        </div>
        <label className="file">
          Open results file
          <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
        </label>
      </header>
      {error && <p className="note">{error} Run attribute-engine, then open output/results.json here.</p>}
      {res && (
        <>
          <nav>
            {(Object.keys(VIEWS) as View[]).map((v) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{VIEWS[v]}</button>
            ))}
          </nav>
          {view === "results" && <Summary res={res} />}
          {view === "attributes" && <Scorecard res={res} />}
          {view === "labels" && <Labels res={res} />}
        </>
      )}
    </div>
  );
}

function useNames(res: Results) {
  const byName = Object.fromEntries(res.attributes.map((a) => [a.name, a]));
  return {
    titleOf: (n: string) => byName[n]?.title ?? label(n),
    originOf: (n: string) => byName[n]?.origin ?? "",
  };
}

function Summary({ res }: { res: Results }) {
  const { titleOf, originOf } = useNames(res);
  const card = res.scorecard;
  const m = res.metric;
  const wins = card.filter((r) => r.significant && r.kind === "group" && (r.correlation ?? 0) > 0);
  const rest = [...new Set(card.filter((r) => !card.some((x) => x.attribute === r.attribute && x.significant)).map((r) => r.attribute))];
  return (
    <section data-shot="1">
      <h2>{wins.length ? `What goes with a higher ${m.label}` : "Nothing stood out clearly"}</h2>
      <div className="cards">
        {wins.map((r) => (
          <div key={`${r.attribute}|${r.value}`} className="card win">
            <div className="muted small">{titleOf(r.attribute)} <span className="tag">{originOf(r.attribute)}</span></div>
            <div className="big">{label(r.value!)}</div>
            <div className="small">
              {fmt(r.mean_with!, m)} vs {fmt(r.mean_rest!, m)} for the rest
            </div>
            <div className="muted small">{lift(r, m)}, {r.n_with} of {res.rows} ads</div>
          </div>
        ))}
      </div>
      {rest.length > 0 && <p className="help">No clear difference: {rest.map(titleOf).join(", ")}.</p>}
      <p className="help">These are correlations, not causes. Small samples only catch big effects, so treat these as ideas to test.</p>
    </section>
  );
}

function Scorecard({ res }: { res: Results }) {
  const { titleOf, originOf } = useNames(res);
  const m = res.metric;
  const na = <span className="muted">n/a</span>;
  const notes = [...new Map(res.scorecard.filter((r) => r.note).map((r) => [r.attribute, r.note])).entries()];
  return (
    <section data-shot="2">
      <p className="help">Each value vs every other row. A negative correlation means it goes with a lower {m.label}.</p>
      <table>
        <thead>
          <tr>
            {["Attribute", "Value", "With it", "The rest", "Lift", "Correlation", "P-value", "Significant", "Found by"].map((h) => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {res.scorecard.map((r) => (
            <tr key={`${r.attribute}|${r.value}`} className={r.significant && (r.correlation ?? 0) > 0 ? "win" : ""}>
              <td className="strong">{titleOf(r.attribute)}</td>
              <td>{r.value ? label(r.value) : na}</td>
              <td>{r.mean_with != null ? `${fmt(r.mean_with, m)} (${r.n_with})` : na}</td>
              <td>{r.mean_rest != null ? `${fmt(r.mean_rest, m)} (${r.n_rest})` : na}</td>
              <td>{lift(r, m) ?? na}</td>
              <td>{r.correlation != null ? r.correlation.toFixed(2) : na}</td>
              <td>{r.p_adjusted != null ? r.p_adjusted.toPrecision(2) : na}</td>
              <td className={r.significant ? "yes" : ""}>{r.significant ? "Yes" : "No"}</td>
              <td>{r.kind === "number" ? "measured by code" : originOf(r.attribute)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {notes.map(([attr, note]) => (
        <p key={attr} className="help"><span className="strong">{titleOf(attr)}:</span> {note}</p>
      ))}
      <p className="help small">(n) is rows in each group. Correlation runs from -1 to 1. P-value is adjusted for testing many values at once; below 0.05 is significant.</p>
    </section>
  );
}

function Labels({ res }: { res: Results }) {
  const { titleOf } = useNames(res);
  const m = res.metric;
  const columns = res.attributes.map((a) => a.name);
  const [all, setAll] = useState(false);
  const rows = all ? res.table : res.table.slice(0, 10);
  const scored = res.table.some((row) => Object.values(row.labels).some((l) => l.score != null));
  return (
    <section data-shot="3">
      <p className="help">
        How each ad was labeled.{scored && " The small number under each label is the model's confidence, from 0 to 1, for the label it picked."}
      </p>
      <table>
        <thead>
          <tr>
            <th>Ad copy</th>
            <th>{label(m.label)}</th>
            {columns.map((c) => <th key={c}>{titleOf(c)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="copy">{row.copy}</td>
              <td>{fmt(row.conversion_rate, m)}</td>
              {columns.map((c) => (
                <td key={c}>
                  {row.labels[c] ? label(row.labels[c].label) : "–"}
                  {row.labels[c]?.score != null && <span className="score">{row.labels[c].score!.toFixed(2)}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {res.table.length > rows.length && (
        <button className="more" onClick={() => setAll(true)}>Show all {res.table.length} ads</button>
      )}
    </section>
  );
}
