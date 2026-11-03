// Builds content-pack.json for the Learning Hub from the scenario data, so the pack cannot drift from the app.
//   node scripts/build-content-pack.mjs        (writes content-pack.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scenarios } = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/scenarios.json'), 'utf8'));
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const tryCard = (s) => ({ id: `try-${s.key}`, label: s.label, description: s.question, group: 'try-it', action: { type: 'route', href: '/#/judge' } });
const src = (id, title, use) => ({ id, title, url: `https://www.rfc-editor.org/rfc/${id}`, kind: 'standard', use, status: 'read', checked: '2026-11-03' });

export function buildPack() {
  return {
    schema: 'demo-content-pack/1',
    id: 'jev-lab',
    title: 'JEV Decision Model LAB',
    version,
    demo: { id: 'jev-lab', name: 'JEV Decision Model LAB', catalog: 'D110', baseUrl: 'http://localhost:7550', doctor: '/api/health', tags: ['jev', 'decision-model', 'guardrail', 'prompt-injection', 'intent', 'step-up-risk', 'threshold-policy', 'mock', 'simulated'] },
    glossary: [
      { id: 'system-one', term: 'System One (decision model)', definition: 'A small model that answers a typed question with a typed answer - a choice, a confidence, or P(yes) - in milliseconds. Classified, routed and gated judgments, not prose.', aliases: ['fast thinking'] },
      { id: 'system-two', term: 'System Two (generative LLM)', definition: 'A large language model. Best at explaining, drafting and planning; seconds and prose for what should be milliseconds and a number.', aliases: ['slow thinking', 'LLM'] },
      { id: 'noul', term: 'P(yes) question', definition: 'A decision-model question whose answer is a probability that the text has the asked property. The guardrail and risk scenarios use it.', aliases: ['score question'] },
      { id: 'choice', term: 'Choice question', definition: 'A decision-model question whose answer is one of the listed criteria, with a confidence. The intent-routing scenario uses it.' },
      { id: 'threshold-policy', term: 'Threshold policy', definition: "The policy that maps a score to an outcome: allow below the step-up line, challenge between the lines, deny at or above the deny line. The thresholds are policy, not the model's." },
      { id: 'false-alarm', term: 'False alarm', definition: 'A fine message a keyword filter blocks. Costs the customer an extra step - the price of a brittle filter.' },
      { id: 'missed-attack', term: 'Missed attack', definition: 'A hostile message a filter lets through. It reaches the tool. The two mistake kinds cost different things.' },
      { id: 'simulated', term: 'SIMULATED model', definition: "This lab's decision model is a deterministic feature scorer, not a neural network or an API. Every score is labelled SIMULATED; the lab makes no claims about any product." },
    ],
    cards: scenarios.map(tryCard),
    sources: [
      src('draft-ietf-oauth-agentic-clients', 'Agentic client access (draft)', 'The delegation context this lab sits beside'),
    ],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(path.join(ROOT, 'content-pack.json'), JSON.stringify(buildPack(), null, 2) + '\n');
  console.log('content-pack.json written');
}
