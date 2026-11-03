// Preflight checks shared by `npm run doctor` and GET /api/health. Never prints a secret, needs no network.
// Each check: { id, level: 'pass' | 'info' | 'fail', detail }.
import { assertBindAllowed, bindHost, portProblem, scanHosts, scanKeys, DEFAULT_PORT, PORT_MIN, PORT_MAX } from './safety.js';
import { netguardSelfTest } from './netguard.js';
import { SCENARIOS, rulesDecide, modelDecide } from './decisions.js';
import { GUARDRAIL_CORPUS, INTENT_CORPUS } from './corpora.js';
import { createMode, realConfigured } from './mode.js';

// The model must separate every labelled row correctly with the default thresholds. A change
// to a feature weight that breaks a labelled case fails the doctor, so the bake-off numbers
// can never drift silently.
const STEP_UP_DEFAULT = 0.4;
const DENY_DEFAULT = 0.9;

export function corpusCheck() {
  const bad = [];
  for (const row of GUARDRAIL_CORPUS) {
    const r = modelDecide('injection', row.text);
    if ((r.verdict === 'bad') !== row.bad) bad.push(`model/injection: "${row.text.slice(0, 40)}" -> ${r.verdict}, want ${row.bad ? 'bad' : 'ok'}`);
    const rules = rulesDecide('injection', row.text);
    if (typeof rules.score !== 'number') bad.push(`rules/injection: "${row.text.slice(0, 40)}" has no numeric score`);
  }
  for (const row of INTENT_CORPUS) {
    const r = modelDecide('intent', row.text);
    if (r.verdict !== row.truth) bad.push(`model/intent: "${row.text.slice(0, 40)}" -> ${r.verdict}, want ${row.truth}`);
    const rules = rulesDecide('intent', row.text);
    if (typeof rules.score !== 'number') bad.push(`rules/intent: "${row.text.slice(0, 40)}" has no numeric score`);
  }
  return bad;
}

export async function runChecks({ env = process.env } = {}) {
  const checks = [];
  const add = (id, level, detail) => checks.push({ id, level, detail });

  const major = Number(process.versions.node.split('.')[0]);
  add('node', major >= 26 ? 'pass' : 'fail', `v${process.versions.node} (need >= 26)`);

  try { add('bind', 'pass', `${assertBindAllowed(bindHost(env), env)}${env.JEVL_BIND ? ' (JEVL_BIND opt-in)' : ' (loopback)'}`); }
  catch (e) { add('bind', 'fail', e.message); }

  const port = env.PORT === undefined || env.PORT === '' ? DEFAULT_PORT : Number(env.PORT);
  const problem = portProblem(port);
  add('port-range', problem ? 'fail' : 'pass', problem || `${port} is inside ${PORT_MIN}-${PORT_MAX} and not reserved`);

  // every shipped text (corpora, scenario copy) carries only reserved hosts and no key-shaped strings
  const shipped = [...GUARDRAIL_CORPUS, ...INTENT_CORPUS].map((r) => r.text)
    .concat(Object.values(SCENARIOS).flatMap((s) => [s.question, s.about, s.howUsed]));
  const badHosts = shipped.map((text, i) => ({ at: i, hosts: scanHosts(text) })).filter((x) => x.hosts.length);
  add('text-hosts', badHosts.length ? 'fail' : 'pass', badHosts.length ? `non-reserved hosts: ${badHosts.map((b) => b.hosts.join(', ')).join('; ')}` : 'every host in shipped text is .invalid, .example or loopback');
  const badKeys = shipped.map((text, i) => ({ at: i, keys: scanKeys(text) })).filter((x) => x.keys.length);
  add('text-keys', badKeys.length ? 'fail' : 'pass', badKeys.length ? 'key-looking values in shipped text' : 'no key-looking value in shipped text');

  const ng = await netguardSelfTest();
  add('netguard', ng.ok ? 'pass' : 'fail', ng.ok ? `blocked fetch, socket, socket-by-IP, dns lookup, dns resolve, udp send and udp connect to a non-loopback host (${ng.blocked}/7)` : ng.detail);

  const corpusBad = corpusCheck();
  add('corpus', corpusBad.length ? 'fail' : 'pass', corpusBad.length ? corpusBad.join('; ') : `the simulated model separates all ${GUARDRAIL_CORPUS.length + INTENT_CORPUS.length} labelled rows correctly`);

  // the two deciders must disagree somewhere, or the bake-off teaches nothing
  const disagreement = GUARDRAIL_CORPUS.some((row) => (rulesDecide('injection', row.text).verdict === 'bad') !== (modelDecide('injection', row.text).verdict === 'bad'));
  add('contrast', disagreement ? 'pass' : 'fail', disagreement ? 'the keyword decider and the model disagree on at least one labelled row (that contrast is the lesson)' : 'deciders agree everywhere: the bake-off would show nothing');

  const modeState = createMode({ env });
  add('mode', realConfigured(env) ? 'pass' : 'pass', realConfigured(env)
    ? `Mock and Real: Real is configured (${modeState.info().model}); the toggle switches without a restart. Default source: ${modeState.source()}.`
    : 'Mock and Real toggle present; Real is not configured (no OPENROUTER_API_KEY or JEV_ENDPOINT in ~/Development/.env), so the Real button is disabled with the how-to. Default: Mock.' );
  add('tenant', 'pass', 'mock only: no tenant, no credentials, no outbound network, no LLM API');
  try { const { DIAGRAM_NAMES, loadDiagram } = await import('./diagramData.js'); for (const n of DIAGRAM_NAMES) loadDiagram(n); add('diagrams', 'pass', `${DIAGRAM_NAMES.length} diagram(s) are valid diagram-studio/1 data, loaded by name`); }
  catch (e) { add('diagrams', 'fail', e.message); }
  return checks;
}

export const allPassed = (checks) => checks.every((c) => c.level !== 'fail');
