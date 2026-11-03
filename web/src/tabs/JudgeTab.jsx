// One text in, two verdicts out: keyword rules vs the decision model (simulated in Mock mode, the real API in
// Real mode), with the policy outcome each lands on under the current thresholds. The feature breakdown shows
// WHY the model scored what it scored - no black box.
import { useState } from "react";
import { POLICY_LABELS, POLICY_DETAIL } from "../lib/policy.js";

const FEATURE_LABELS = {
  override: "override phrasing", expose: "expose attempts", sensitive: "sensitive targets",
  authorityAbuse: "authority pressure", polite: "politeness", money: "money signals",
  urgency: "urgency", newPayee: "new payee", giftCard: "gift cards", isBalance: "balance words",
  isTransfer: "transfer words", isOff: "off-topic", greeting: "greeting",
};

function Verdict({ r, scenario }) {
  const isChoice = scenario === "intent";
  const label = isChoice ? r.verdict.replace("_", " ") : r.verdict;
  const pct = Math.round(r.score * 100);
  return (
    <div className="verdict" data-decider={r.decider} data-testid={`verdict-${r.decider}`}>
      <h4>{r.decider === "rules" ? "Keyword rules" : r.real ? "Decision model (Real API)" : "Decision model (SIMULATED)"}</h4>
      <p className="verdict__line">
        <span className="pill" data-policy={r.policy}>{POLICY_LABELS[r.policy] ?? "—"}</span>{" "}
        <strong data-testid={`${r.decider}-verdict`}>{label}</strong>{" "}
        <span className="muted">score {r.score.toFixed(2)} ({pct}%)</span>
      </p>
      <div className="meter" role="img" aria-label={`score ${r.score.toFixed(2)}`}>
        <div className="meter__fill" data-policy={r.policy} style={{ width: `${pct}%` }} />
      </div>
      {r.matched ? <p className="muted">phrase hit: “{r.matched}”</p> : null}
      {r.features ? (
        <ul className="features" aria-label="model features">
          {Object.entries(r.features).filter(([, v]) => v > 0).map(([k, v]) => (
            <li key={k}>{FEATURE_LABELS[k] ?? k}: {v}</li>
          ))}
        </ul>
      ) : null}
      <p className="muted small">{POLICY_DETAIL[r.policy]}</p>
    </div>
  );
}

export default function JudgeTab({ catalog, scenario, onScenario, thresholds, setThresholds, onJudge, result, busy, error }) {
  const scenarios = catalog?.scenarios ?? [];
  const current = scenarios.find((s) => s.key === (result?.scenario ?? scenario)) ?? scenarios[0];
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    onJudge(current.key, text);
  };
  return (
    <section aria-label="Judge one input" className="stack">
      <div className="scenario-pick" role="group" aria-label="Which question to answer">
        {scenarios.map((s) => (
          <button key={s.key} type="button" className="chip" aria-pressed={current.key === s.key} data-testid={`pick-${s.key}`} onClick={() => onScenario(s.key)}>
            {s.label ?? s.key}
          </button>
        ))}
      </div>
      <p className="muted">{current?.question}</p>
      <form onSubmit={submit} className="stack">
        <div className="field">
          <label htmlFor="judge-text">Text to judge</label>
          <textarea id="judge-text" rows="3" maxLength="300" value={text} onChange={(e) => setText(e.target.value)} data-testid="judge-text" />
        </div>
        <div className="slider-row">
          <label htmlFor="stepup">Step-up at {thresholds.stepUpAt.toFixed(2)}</label>
          <input id="stepup" type="range" min="0" max="1" step="0.05" value={thresholds.stepUpAt}
            onChange={(e) => setThresholds((t) => ({ ...t, stepUpAt: Number(e.target.value) }))} data-testid="stepup-slider" />
          <label htmlFor="deny">Deny at {thresholds.denyAt.toFixed(2)}</label>
          <input id="deny" type="range" min="0" max="1" step="0.05" value={thresholds.denyAt}
            onChange={(e) => setThresholds((t) => ({ ...t, denyAt: Number(e.target.value) }))} data-testid="deny-slider" />
        </div>
        <button type="submit" className="btn primary" disabled={busy} data-testid="judge-run">Judge with both deciders</button>
      </form>
      {error ? <p className="alert" role="alert">{error}</p> : null}
      {result ? (
        <div className="compare" data-testid="judge-result">
          <Verdict r={result.rules} scenario={result.scenario} />
          <Verdict r={result.model} scenario={result.scenario} />
        </div>
      ) : (
        <p className="muted" role="status">Pick a scenario, paste a customer message, and both deciders answer the same question.</p>
      )}
      {current ? <p className="muted small">{current.about}</p> : null}
    </section>
  );
}
