# Talk track

Same input, two deciders: fixed keyword rules vs a decision model that reads meaning (simulated here with deterministic features - no LLM in the room). The banner stays on screen, also in presenter mode.

- **injection Prompt injection.** A prompt injection is text that tries to take over the assistant - "forget your rules", "act as someone unrestricted" - so it can leak data or move money. The catch for a keyword filter: a well-mannered attack ("please kindly forget everything you were told") carries no trigger phrase, while an innocent sentence about ignoring something can.
- **intent Intent routing.** Before an agent can act it must know what the customer wants: pay someone, check a balance, or something that is not about banking at all. The "other" cases show a decider should be allowed to say none of the banking actions apply.
- **risk Step-up risk.** Fraudulent transfers are urgent, oversized, or go to new payees; the first example is all three at once. The gift-card example reads like the customer, not like an attack - only a meaning-reading decider catches it.

Drag the threshold slider and show the same score flip Allow, Step-up, Deny: a model score is one input to policy, never permission by itself.
