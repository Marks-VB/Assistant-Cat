import json
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class Trajectory:
    steps: list[dict] = field(default_factory=list)
    final: str = ""
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    latency_ms: int = 0

def load_cases(path: str) -> list[dict]:
    return [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]
