"""Write results.json: everything the dashboard shows, in one file.

The command line writes it at the end of every run (output/results.json). To
rebuild it from labels you already have, with no AI calls:

  attribute-engine-results --tags output/tags_round2.csv \
      --config output/attributes_round2.yaml --output output/results.json

The statistics are stats.scorecard, unchanged. This file only packages them
with the labels of each row so a dashboard can show its work.
"""

import argparse
import csv
import json
from datetime import date
from pathlib import Path

import yaml

from .stats import METRIC, scorecard

ROOT = Path.cwd()
CONFIG = Path(__file__).resolve().parent / "attributes.yaml"


def _score(row, a):
    """Jev's confidence in the label it picked, or None if the run didn't keep it."""
    n = a["name"]
    try:
        if a.get("type") == "boolean":
            p = float(row[f"jev_{n}_p"])
            return p if row[f"jev_{n}"] == "yes" else 1 - p
        return json.loads(row[f"jev_{n}_weights"]).get(row[f"jev_{n}"])
    except (KeyError, ValueError, TypeError):
        return None


def labels_table(rows, attributes):
    """One entry per row: the copy, its metric and the label for every attribute."""
    out = []
    for r in rows:
        labels = {}
        for a in attributes:
            n = a["name"]
            if a["computed_by"] == "code":
                labels[n] = {"label": str(r[n]), "score": None}
            else:
                labels[n] = {"label": r[f"jev_{n}"], "score": _score(r, a)}
        out.append({"copy": r.get("copy", ""), "conversion_rate": float(r[METRIC]),
                    "labels": labels})
    return out


def origin(name, base_names, discovered_names):
    if name in discovered_names:
        return "found by AI"
    return "built in" if name in base_names else "you added"


def build(rows, config, base_names, discovered_names):
    attrs = config["attributes"]
    return {
        "tool": "Attribute Engine",
        "version": 1,
        "created": date.today().isoformat(),
        "metric": {"name": METRIC, "label": METRIC.replace("_", " "), "is_percent": True},
        "rows": len(rows),
        "attributes": [{
            "name": a["name"],
            "title": a.get("title") or a["name"].replace("_", " "),
            "question": a.get("question"),
            "computed_by": a["computed_by"],
            "type": a.get("type"),
            "origin": origin(a["name"], base_names, discovered_names),
        } for a in attrs],
        "scorecard": scorecard(rows, config),
        "table": labels_table(rows, attrs),
    }


def write(payload, path):
    with open(path, "w") as f:
        json.dump(payload, f, indent=1)


def main():
    parser = argparse.ArgumentParser(description="Rebuild results.json from tagged rows, no AI calls.")
    parser.add_argument("--tags", default=str(ROOT / "output/tags_round2.csv"))
    parser.add_argument("--config", default=str(ROOT / "output/attributes_round2.yaml"))
    parser.add_argument("--base", default=str(CONFIG),
                        help="the attributes you started from; anything else counts as found by AI")
    parser.add_argument("--output", default=str(ROOT / "output/results.json"))
    args = parser.parse_args()
    config = yaml.safe_load(open(args.config))
    base = {a["name"] for a in yaml.safe_load(open(args.base))["attributes"]}
    found = {a["name"] for a in config["attributes"]} - base
    rows = list(csv.DictReader(open(args.tags)))
    write(build(rows, config, base, found), args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
