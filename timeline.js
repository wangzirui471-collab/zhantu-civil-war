(function (root) {
  'use strict';

  const actions = new Set(['order', 'setSide', 'setScope', 'setPolicy', 'setDelegated', 'setGroup', 'setLeader',
    'setEquipment', 'setHistoryMode', 'setHistoricalEvent',
    'createPlan', 'updatePlan', 'executePlan', 'pausePlan', 'delegatePlan', 'removePlan',
    'buildFort', 'setSupport', 'decide']);
  const usesData = new Set(['order', 'setLeader', 'setEquipment', 'createPlan', 'updatePlan', 'executePlan',
    'pausePlan', 'buildFort', 'setSupport', 'decide']);
  const day = 86400000;
  const toTime = (value) => Date.parse(value + 'T00:00:00Z');
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(toTime(value)) && new Date(toTime(value)).toISOString().slice(0, 10) === value;

  function create(state, engine) {
    return { origin: engine.snapshot(state), commands: [] };
  }

  function run(engine, data, state, name, args) {
    if (!actions.has(name) || typeof engine[name] !== 'function') throw new Error('无法识别存档中的指令。');
    return usesData.has(name) ? engine[name](data, state, ...args) : engine[name](state, ...args);
  }

  function apply(timeline, engine, data, state, name, args) {
    const result = run(engine, data, state, name, args);
    if (result !== false && result?.ok !== false) {
      timeline.commands.push({ date: state.date, name, args: structuredClone(args) });
    }
    return result;
  }

  function advance(engine, data, state, date) {
    while (state.date < date) {
      const remaining = Math.round((toTime(date) - toTime(state.date)) / day);
      const previous = state.date;
      engine.step(data, state, Math.min(30, remaining));
      if (state.date <= previous) throw new Error('存档已结算，无法回放到该日期。');
    }
  }

  function branch(timeline, engine, data, date, latest) {
    if (!validDate(date) || date < timeline.origin.date || date > latest) {
      throw new Error('请选择这局已经经历的日期。');
    }
    const state = engine.snapshot(timeline.origin);
    const commands = timeline.commands.filter((command) => command.date <= date);
    for (const command of commands) {
      advance(engine, data, state, command.date);
      run(engine, data, state, command.name, command.args);
    }
    advance(engine, data, state, date);
    return { state, timeline: { origin: engine.snapshot(timeline.origin), commands: structuredClone(commands) } };
  }

  function serialize(state, timeline) {
    return JSON.stringify({ format: 'civil-war-map', version: 1, state, timeline });
  }

  function parse(raw) {
    let save;
    try { save = JSON.parse(raw); } catch { throw new Error('无法读取存档。'); }
    const { state, timeline } = save || {};
    if (save?.format !== 'civil-war-map' || save.version !== 1 || !validDate(state?.date)
      || !validDate(timeline?.origin?.date) || timeline.origin.date > state.date
      || !Array.isArray(timeline.commands)) throw new Error('存档格式不正确。');
    let previous = timeline.origin.date;
    for (const item of timeline.commands) {
      if (!validDate(item?.date) || item.date < previous || item.date > state.date
        || !actions.has(item.name) || !Array.isArray(item.args)) throw new Error('存档指令记录不完整。');
      previous = item.date;
    }
    return { state, timeline };
  }

  const timeline = { create, apply, branch, serialize, parse };
  if (typeof module !== 'undefined') module.exports = timeline;
  root.CivilWarTimeline = timeline;
})(globalThis);
