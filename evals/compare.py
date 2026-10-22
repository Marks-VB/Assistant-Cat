import argparse, json, sys
ap = argparse.ArgumentParser()
ap.add_argument("--baseline", required=True)
ap.add_argument("--current", required=True)
ap.add_argument("--max-drop", type=float, default=0.03)
args = ap.parse_args()
base, cur = (json.load(open(p)) for p in (args.baseline, args.current))
drop = base["success_rate"] - cur["success_rate"]
cost_up = cur["cost_per_task"] / base["cost_per_task"] - 1
failed = [msg for cond, msg in [
    (drop > args.max_drop, f"success caiu {drop:.1%}"),
    (cost_up > 0.20, f"custo subiu {cost_up:.1%}"),
    (cur["invalid_tool_rate"] > 0.02, "tool inválida > 2%"),
] if cond]
print({"drop": drop, "cost_up": cost_up, "failed": failed})
sys.exit(1 if failed else 0)
