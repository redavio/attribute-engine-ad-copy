import type { Results } from "../types";
import { fmt, label, lift, names, ui } from "./ui";

/** Every attribute value tested against the rest, with significance. */
export default function Scorecard({ res }: { res: Results }) {
  const { titleOf, originOf } = names(res);
  const m = res.metric;
  const na = <span className={ui.muted}>n/a</span>;
  const notes = [...new Map(res.scorecard.filter((r) => r.note).map((r) => [r.attribute, r.note])).entries()];
  return (
    <section className="overflow-x-auto pb-1" data-shot="2">
      <p className={ui.help}>Each value vs every other row. A negative correlation means it goes with a lower {m.label}.</p>
      <table className={ui.table}>
        <thead>
          <tr>
            {["Attribute", "Value", "With it", "The rest", "Lift", "Correlation", "P-value", "Significant", "Found by"].map((h) => (
              <th key={h} className={ui.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {res.scorecard.map((r) => {
            const td = `${ui.td} ${r.significant && (r.correlation ?? 0) > 0 ? "bg-brand/10" : ""}`;
            return (
              <tr key={`${r.attribute}|${r.value}`}>
                <td className={`${td} font-medium`}>{titleOf(r.attribute)}</td>
                <td className={td}>{r.value ? label(r.value) : na}</td>
                <td className={td}>{r.mean_with != null ? `${fmt(r.mean_with, m)} (${r.n_with})` : na}</td>
                <td className={td}>{r.mean_rest != null ? `${fmt(r.mean_rest, m)} (${r.n_rest})` : na}</td>
                <td className={td}>{lift(r, m) ?? na}</td>
                <td className={td}>{r.correlation != null ? r.correlation.toFixed(2) : na}</td>
                <td className={td}>{r.p_adjusted != null ? r.p_adjusted.toPrecision(2) : na}</td>
                <td className={`${td} ${r.significant ? "font-medium text-brand" : ""}`}>{r.significant ? "Yes" : "No"}</td>
                <td className={td}>{r.kind === "number" ? "measured by code" : originOf(r.attribute)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {notes.map(([attr, note]) => (
        <p key={attr} className={ui.help}><span className="font-medium">{titleOf(attr)}:</span> {note}</p>
      ))}
      <p className={`${ui.help} text-xs`}>
        (n) is rows in each group. Correlation runs from -1 to 1. P-value is adjusted for testing many values at once; below 0.05 is significant.
      </p>
    </section>
  );
}
