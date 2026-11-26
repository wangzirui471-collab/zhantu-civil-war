const { test } = require('node:test');
const assert = require('node:assert/strict');
const Timeline = require('../timeline.js');

const engine = {
  snapshot: structuredClone,
  step(data, state, days) {
    const date = new Date(`${state.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    state.date = date.toISOString().slice(0, 10);
    state.progress += days;
  },
  setSide(state, side) { state.player = side; },
  setPolicy(state, key, value) { state[key] = value; },
};

test('branches replay orders and preserve the original timeline', () => {
  const initial = { date: '1948-10-01', player: 'ccp', progress: 0 };
  const timeline = Timeline.create(initial, engine);
  const state = structuredClone(initial);
  engine.step(null, state, 2);
  Timeline.apply(timeline, engine, null, state, 'setSide', ['roc']);
  engine.step(null, state, 2);
  Timeline.apply(timeline, engine, null, state, 'setPolicy', ['food', 20]);
  const branch = Timeline.branch(timeline, engine, null, '1948-10-03', state.date);
  assert.deepEqual(branch.state, { date: '1948-10-03', player: 'roc', progress: 2 });
  assert.equal(branch.timeline.commands.length, 1);
  assert.equal(timeline.commands.length, 2);
  assert.equal(state.food, 20);
});

test('save round-trip retains date, state, and the history origin', () => {
  const state = { date: '1948-10-01', player: 'ccp', progress: 0 };
  const timeline = Timeline.create(state, engine);
  const result = Timeline.parse(Timeline.serialize(state, timeline));
  assert.deepEqual(result, { state, timeline });
  assert.throws(() => Timeline.parse('{}'), /存档/);
  assert.throws(() => Timeline.branch(timeline, engine, null, '1947-01-01', state.date), /日期/);
});
