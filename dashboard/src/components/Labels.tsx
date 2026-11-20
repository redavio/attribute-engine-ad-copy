import { useState } from "react";
import type { Results } from "../types";
import { fmt, label, names, ui } from "./ui";

/** How each ad was labeled, with the model's confidence. */
export default function Labels({ res }: { res: Results }) {
  const { titleOf } = names(res);
  const m = res.metric;
  const columns = res.attributes.map((a) => a.name);
  const [all, setAll] = useState(false);
  const rows = all ? res.table : res.table.slice(0, 10);
  const scored = res.table.some((row) => Object.values(row.labels).some((l) => l.score != null));
  return (
    <section className="overflow-x-auto pb-1" data-shot="3">
      <p className={ui.help}>
        How each ad was labeled.{scored && " The small number under each label is the model's confidence, from 0 to 1, for the label it picked."}
      </p>
      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>Ad copy</th>
            <th className={ui.th}>{label(m.label)}</th>
            {columns.map((c) => <th key={c} className={ui.th}>{titleOf(c)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className={`${ui.cell} min-w-[320px] max-w-[380px]`}>{row.copy}</td>
              <td className={ui.td}>{fmt(row.conversion_rate, m)}</td>
              {columns.map((c) => (
                <td key={c} className={ui.td}>
                  {row.labels[c] ? label(row.labels[c].label) : "–"}
                  {row.labels[c]?.score != null && <span className={`block text-xs ${ui.muted}`}>{row.labels[c].score!.toFixed(2)}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {res.table.length > rows.length && (
        <button type="button" className={ui.pill} onClick={() => setAll(true)}>Show all {res.table.length} ads</button>
      )}
    </section>
  );
}
