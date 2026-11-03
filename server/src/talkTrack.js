// The talk track is generated from the scenario data, so docs/talk-track.md and the presenter view cannot drift from it.
// `npm run talk-track` writes the file; a test fails when the committed copy differs.
import { SCENARIOS } from './decisions.js';

export const TALK_INTRO = 'Same input, two deciders: fixed keyword rules vs a decision model that reads meaning (simulated here with deterministic features - no LLM in the room). The banner stays on screen, also in presenter mode.';
export const TALK_OUTRO = 'Drag the threshold slider and show the same score flip Allow, Step-up, Deny: a model score is one input to policy, never permission by itself.';

export const talkLines = () => Object.values(SCENARIOS).map((s) => ({ id: s.key, title: s.label ?? s.key, say: s.about }));

export function renderTalkTrackMarkdown() {
  return `# Talk track\n\n${TALK_INTRO}\n\n${talkLines().map((l) => `- **${l.id} ${l.title}.** ${l.say}`).join('\n')}\n\n${TALK_OUTRO}\n`;
}
