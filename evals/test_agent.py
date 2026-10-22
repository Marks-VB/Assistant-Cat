import pytest
from evals.harness import Trajectory, load_cases

@pytest.mark.parametrize("case", load_cases("evals/tasks.jsonl"), ids=lambda c: c["id"])
def test_task(case, agent, record_property):
    result: Trajectory = agent.run(
        case["input"],
        fixtures=case.get("fixtures", []),
        max_steps=case.get("max_steps", 12),
    )
    record_property("cost_usd", result.cost_usd)
    record_property("latency_ms", result.latency_ms)
    record_property("steps", len(result.steps))

    assert result.final, "agente não produziu resposta final"
    assert len(result.steps) <= case.get("max_steps", 12), "estourou o orçamento de passos"

    called = [s["tool"] for s in result.steps if s.get("type") == "tool_call"]
    for tool in case.get("expected_tools", []):
        assert tool in called, f"tool esperada não chamada: {tool}"
    for tool in case.get("forbidden_tools", []):
        assert tool not in called, f"tool proibida chamada: {tool}"

    for text in case.get("must_contain", []):
        assert text.lower() in result.final.lower(), f"faltou: {text}"
    for text in case.get("must_not_contain", []):
        assert text.lower() not in result.final.lower(), f"vazou: {text}"

    if case.get("checks") == ["tests_pass"]:
        assert agent.last_test_exit_code == 0
