#!/usr/bin/env node
// Mutation pinning: break each real-behaviour rule in a throwaway copy of server/ and require the server tests to FAIL.
// A mutation that the tests survive means a rule is not pinned. Exits 1 if any mutant survives.
//   node scripts/mutation-check.mjs [--only <label-substring>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const MUTATIONS = [
  // decisions.js: the meaning-reading features. Kill the polite-attack detection and the whole lesson collapses.
  ['injection: forget/override phrasing ignored', 'decisions.js', "const OVERRIDE = ['ignore', 'disregard', 'forget', 'pretend', 'override', 'you were told', 'act as an unrestricted', 'act as someone'];", "const OVERRIDE = [];"],
  ['injection: sensitive target ignored', 'decisions.js', "const sensitive = /\\b(system prompt|instructions|rules above|account numbers?)\\b/.test(text) ? 1 : 0;", "const sensitive = 0;"],
  ['injection: authority pressure ignored', 'decisions.js', "const authorityAbuse = count(text, AUTHORITY) && moneyish ? 1 : 0;", "const authorityAbuse = 0;"],
  ['risk: gift-card social engineering ignored', 'decisions.js', "const giftCard = /gift card/.test(text) ? 1 : 0;", "const giftCard = 0;"],
  ['risk: new-payee urgency ignored', 'decisions.js', "const newPayee = count(text, NEWPAYEE);", "const newPayee = 0;"],
  ['intent: off-topic routing ignored', 'decisions.js', "const isOff = count(text, OFFTOPIC);", "const isOff = 0;"],
  ['policy: deny line never denies', 'app.js', "(score >= th.denyAt ? 'deny' : score >= th.stepUpAt ? 'stepup' : 'allow')", "('allow')"],
  ['policy: step-up band never challenges', 'app.js', "(score >= th.denyAt ? 'deny' : score >= th.stepUpAt ? 'stepup' : 'allow')", "(score >= th.denyAt ? 'deny' : 'allow')"],
  ['policy: deny boundary off-by-one (>= becomes >)', 'app.js', "(score >= th.denyAt ? 'deny' : score >= th.stepUpAt ? 'stepup' : 'allow')", "(score > th.denyAt ? 'deny' : score >= th.stepUpAt ? 'stepup' : 'allow')"],
  ['model: override weight halved', 'decisions.js', "const score = Math.min(0.99, Math.max(0.02, 0.3 * override + 0.2 * target + 0.15 * moneyish * (override || expose ? 1 : 0) + 0.2 * authorityAbuse + 0.05 * polite * (override ? 1 : 0)));", "const score = Math.min(0.99, Math.max(0.02, 0.15 * override + 0.2 * target + 0.15 * moneyish * (override || expose ? 1 : 0) + 0.2 * authorityAbuse + 0.05 * polite * (override ? 1 : 0)));"],
  ['safety: cross-origin writes accepted', 'safety.js', "if (site && site !== 'same-origin' && site !== 'none') return res.status(403)", "if (false) return res.status(403)"],
];

export function mutantSource(source, [label, file, find, replace]) {
  if (!source.includes(find)) return null;
  return source.replace(find, replace);
}

export function runMutations({ only } = {}) {
  const results = [];
  for (const m of MUTATIONS) {
    if (only && !m[0].includes(only)) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-mut-'));
    try {
      fs.cpSync(path.join(ROOT, 'server'), path.join(dir, 'server'), { recursive: true });
      const target = path.join(dir, 'server/src', m[1]);
      const source = fs.readFileSync(target, 'utf8');
      const mutated = mutantSource(source, m);
      if (mutated === null) { results.push({ ...m, status: 'not-applied' }); continue; }
      fs.writeFileSync(target, mutated);
      const r = spawnSync('node', ['--test', 'test/*.test.js'], { cwd: path.join(dir, 'server'), encoding: 'utf8', timeout: 120_000 });
      results.push({ ...m, status: r.status !== 0 ? 'killed' : 'SURVIVED' });
    } catch (e) {
      results.push({ ...m, status: 'error', detail: e.message });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : undefined;
  const results = runMutations({ only });
  let survivors = 0;
  for (const r of results) {
    if (r.status === 'SURVIVED') survivors++;
    console.log(`${r.status.padEnd(12)} ${r[0]}`);
    if (r.detail) console.log(`             ${r.detail}`);
  }
  console.log(survivors ? `\n${survivors} mutant(s) survived — a rule is not pinned` : '\nall mutants killed');
  process.exit(survivors ? 1 : 0);
}
