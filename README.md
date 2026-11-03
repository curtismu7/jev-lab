# JEV Decision Model LAB

Tier: Tester
Repo: https://github.com/ping-sandbox/jev-lab
Catalog: D110

An agent needs fast, typed judgments — block this text, route this request, score this risk — and a generative LLM is seconds and prose for what should be milliseconds and a number. This lab puts two deciders side by side on the same inputs: a brittle keyword filter and a decision model that reads meaning (SIMULATED here: a deterministic feature scorer, not an LLM, not an API), then lets you drag the threshold policy and watch the same score flip between Allow, Step-up and Deny.

## What is simulated

**Everything here is SIMULATED.** The "decision model" is a small deterministic feature scorer running in the server process — it is NOT Jev, NOT an LLM, and NOT connected to any product or API. Every score is labelled SIMULATED on the page. The corpora are eight hand-labelled rows each, small on purpose; the app reports accuracy on those rows only and is not a benchmark of anything. Mock mode only: no tenant, no credentials, no outbound network, no paid API. Live is refused.

## Run from a clone

```bash
npm ci
npm test          # server (node --test) + web (vitest) + repo checks
npm run doctor    # preflight: ports, hosts, netguard, corpora, the HTTP cycle
npm start         # http://localhost:7550
./scripts/run.sh  # same as npm start (checks the port first)
```

Endpoints: `GET /api/health`, `GET /api/catalog`, `POST /api/judge`, `POST /api/bakeoff`, `GET /api/mode`, `POST /api/reset`, `GET /api/info`.

## Settings file

None. This lab reads nothing from the shared settings file: it has no tenant, no credentials and no LLM key. `PORT` and `JEVL_BIND` come from the shell (see `.env.example`).

## Ports, and what to do if the port is taken

Default port 7550, allowed range 7550-7559. If it is taken:

```bash
lsof -iTCP:7550 -sTCP:LISTEN -n -P
PORT=<other port> npm start
```

## Mock and Real modes (rule 19)

A visible Mock / Real toggle sits in the header of every page; pressed = current mode, switching needs no restart.

- **Mock** (default): both deciders run in-process; the "decision model" is the deterministic feature scorer, labelled SIMULATED. Fully offline.
- **Real**: the model decider calls the configured decision-model API — `OPENROUTER_API_KEY`, or `JEV_ENDPOINT` + `JEV_MODEL` in the shared `~/Development/.env` (owner sets the key). The question definitions stay server-side, so the Real path is never an open proxy to the key. A failing API surfaces its error honestly (HTTP 502); nothing falls back to Mock silently. The bake-off always runs the simulated model (it is the baseline).
- **Real not configured**: the Real button is disabled with a how-to tooltip, and `POST /api/mode {source:"real"}` answers 409 with the same message. Default source is Real if configured, else Mock.

## Health, doctor and reset

`GET /api/health` returns the shelf's `demo-health/1` contract. `npm run doctor` runs the same checks plus a full HTTP cycle (health, a judged attack, Live refused). `npm run reset` bumps the server epoch so other open pages notice; the lab holds no other state.

## Docker

```bash
HOST_PORT=7550 docker compose up --build -d
```

OrbStack only (never Docker Desktop). The container is read-only, cap-dropped, and publishes `127.0.0.1:` only. Health check hits `/api/health`.

## Tests

```bash
npm test                    # server + web + repo checks
npm run content-pack       # rebuild content-pack.json from the scenario data
npm run mutation-check      # 9 mutants; every one must be killed
```

Server tests pin the corpora; `docs/talk-track.md` is generated from the scenario data (the model separates all 16 labelled rows), the score ranges, the empty/hostile input behaviour, the refusal messages and the cross-origin write guard. `docs/architecture.md`, `docs/safety.md` and `docs/references.md` say what each module may and may not do, what is simulated, and which claims are UNVERIFIED.

## Troubleshooting

- **Port taken.** `PORT=<other port in 7550-7559> npm start`.
- **`refusing to bind`** — the lab binds loopback only; `JEVL_BIND=0.0.0.0` opts in (Docker sets it for you).
- **Real button disabled** — set `OPENROUTER_API_KEY` (or `JEV_ENDPOINT`) in `~/Development/.env` and restart; the toggle lights up without any code change.
- **`npm test` complains about gitleaks** — the pre-commit hook needs gitleaks installed; commits still work with `--no-verify` for local WIP, CI runs the checks regardless.

`docs/shelf-entry.json` is the shelf registration (catalog E12, portable compose path).

## Ownership

Owned by the shelf-consolidation session (owner said go 2026-11-03). Ports 7550-7559. Catalog id D110 (owner-delegated pick) until the owner confirms it.
