import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIAGRAM_NAMES, loadDiagram } from '../src/diagramData.js';

test('diagrams load by name from diagram-studio/1 data', () => {
  assert.ok(DIAGRAM_NAMES.length >= 1);
  for (const n of DIAGRAM_NAMES) {
    const d = loadDiagram(n);
    assert.equal(d.schema, 'diagram-studio/1');
    assert.ok(d.nodes.length > 0);
  }
});
