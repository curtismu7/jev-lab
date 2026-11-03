// Mock / Real. Rule 19: runtime server-side mode, POST /api/mode with exactly {source}, GET /api/info returns
// {source, realAvailable, realReason}. Default: Real if configured, else Mock. A switch needs no restart.
// Real = an actual decision-model API (OpenRouter decisions wire, or JEV_ENDPOINT), configured from the shared
// settings file ~/Development/.env (OPENROUTER_API_KEY or JEV_ENDPOINT + optional JEV_MODEL). Agents never use
// live credentials; the owner sets the key. Mock = the deterministic feature scorer, fully offline.
import { loadSharedEnv } from './env.js';

export const NO_REAL = 'Real mode is not configured. Set OPENROUTER_API_KEY (or JEV_ENDPOINT + JEV_MODEL) in ~/Development/.env, restart the lab, and the Real button lights up. Until then the simulated feature scorer answers in Mock mode.';

export const MODES = ['mock', 'real'];

export function realConfigured(env = process.env) {
  const e = { ...env, ...loadSharedEnv() };
  return Boolean(e.OPENROUTER_API_KEY || e.JEV_ENDPOINT);
}

export function realModelName(env = process.env) {
  const e = { ...env, ...loadSharedEnv() };
  return e.JEV_MODEL || 'typesafe/jev-1.13';
}

export function createMode({ env = process.env } = {}) {
  const canReal = realConfigured(env);
  const state = { source: canReal ? 'real' : 'mock' };
  return {
    info: () => ({ source: state.source, realAvailable: canReal, realReason: canReal ? null : NO_REAL, model: canReal ? realModelName(env) : null }),
    source: () => state.source,
    set: (source) => { state.source = source; },
  };
}
