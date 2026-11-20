import type { Results } from "../types";
import { fmt, label, lift, names, ui } from "./ui";

/** The ad copy traits that go with a higher result, as cards. */
export default function Summary({ res }: { res: Results }) {
  const { titleOf, originOf } = names(res);
  const card = res.scorecard;
  const m = res.metric;
  const wins = card.filter((r) => r.significant && r.kind === "group" && (r.correlation ?? 0) > 0);
  const rest = [...new Set(card.filter((r) => !card.some((x) => x.attribute === r.attribute && x.significant)).map((r) => r.attribute))];
  return (
    <section className="overflow-x-auto pb-1" data-shot="1">
      <h2 className="mt-2 text-lg font-semibold">{wins.length ? `What goes with a higher ${m.label}` : "Nothing stood out clearly"}</h2>
      <div className="mb-5 mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {wins.map((r) => (
          <div key={`${r.attribute}|${r.value}`} className="rounded-xl bg-brand/10 p-3.5">
            <div className={`text-xs ${ui.muted}`}>
              {titleOf(r.attribute)}{" "}
              <span className="ml-1.5 rounded-full border border-zinc-300 px-1.5 py-px text-xs dark:border-zinc-600">{originOf(r.attribute)}</span>
            </div>
            <div className="my-1 text-2xl font-semibold">{label(r.value!)}</div>
            <div className="mt-0.5 text-xs">{fmt(r.mean_with!, m)} vs {fmt(r.mean_rest!, m)} for the rest</div>
            <div className={`mt-0.5 text-xs ${ui.muted}`}>{lift(r, m)}, {r.n_with} of {res.rows} ads</div>
          </div>
        ))}
      </div>
      {rest.length > 0 && <p className={ui.help}>No clear difference: {rest.map(titleOf).join(", ")}.</p>}
      <p className={ui.help}>These are correlations, not causes. Small samples only catch big effects, so treat these as ideas to test.</p>
    </section>
  );
}
