# jev-lab — JEV Decision Model LAB (catalog E12, Tester tier)

An agent needs fast, typed judgments; a generative LLM is seconds and prose for what should be milliseconds and a number. This lab puts two deciders side by side — a brittle keyword filter and a decision model — on the same prompt-injection, intent-routing and step-up-risk inputs, then lets the presenter drag threshold policy lines and watch the same score flip Allow / Step-up / Deny.

Follow the rulebook at `~/Development/STANDALONE-RULES.md`. This file is the app-specific contract.

## What is real and what is simulated

- **Mock mode (default when Real is not configured).** Both deciders run in-process. The "decision model" is a deterministic feature scorer (`server/src/decisions.js`) — NOT an LLM, NOT any product. Every model score is labelled SIMULATED on screen. The bake-off always runs the simulated model, even in Real mode (it is the baseline).
- **Real mode (rule 19).** The model decider calls the configured decision-model API (`OPENROUTER_API_KEY`, or `JEV_ENDPOINT` + `JEV_MODEL` from the shared `~/Development/.env`; owner sets the key, agents never use live credentials). The question definitions live in `server/src/realModel.js`, never in the request — the Real path cannot be used as a proxy to the paid key. Errors surface honestly (HTTP 502 with the message); nothing falls back to Mock silently. The header toggle switches `POST /api/mode {source}` at runtime; default source is Real if configured else Mock.
- **Corpora.** Eight hand-labelled rows per corpus. Labels were fixed before any decider ran; the app reports accuracy on those rows only and claims no benchmark.

## Non-negotiables

- Loopback bind only (`JEVL_BIND` opt-in; Docker sets it and publishes `127.0.0.1:` only). Host check + same-origin writes on everything.
- Netguard blocks every non-loopback outbound in Mock; Real mode's one fetch is the configured API only.
- No tenant, no credentials, no identifiers from other projects. Only `.invalid` / `.example` hosts in shipped text (scanned by the doctor).
- No key-looking strings in shipped text; the shared env's secret is read once, never returned, never logged.
- Node 26 only. Tests: `node --test test/*.test.js` (server), vitest (web), repo checks pin README/docs/truth.

## Module map

- `server/src/decisions.js` — scenarios, the two deciders, every feature weight (pinned by tests + mutation checks).
- `server/src/corpora.js` — the hand-labelled rows.
- `server/src/app.js` — `/api/judge`, `/api/bakeoff`, the policy mapping (allow/step-up/deny), `/api/mode`.
- `server/src/realModel.js` — the Real-mode API client (scenario-locked).
- `server/src/mode.js` + `env.js` — runtime source, realAvailable, shared-env read (existence only).
- `server/src/safety.js`, `netguard.js`, `doctor.js`, `health.js` — the standard plumbing.
- `web/src/tabs/JudgeTab.jsx`, `BakeoffTab.jsx` — the two screens. `web/src/app.css` — layout only; tokens only, no colour literals.

## Verify before claiming done

```bash
npm ci && npm test && npm run doctor && npm run mutation-check && npm run build -w web
```

Then drive the real page (port 7550): judge an attack, judge an innocent message, run both bake-offs, drag both sliders and show the same score landing in all three policy bands.
