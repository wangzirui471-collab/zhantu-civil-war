const assert = require('node:assert/strict');
const { test } = require('node:test');
require('../engine.js');

const engine = globalThis.CivilWarEngine;

const data = {
  cities: [
    { id: 'a', name: '甲城', region: 'north', terrain: 'plain', value: 4 },
    { id: 'b', name: '乙城', region: 'north', terrain: 'plain', value: 2 },
    { id: 'c', name: '丙城', region: 'south', terrain: 'mountain', value: 3 },
    { id: 'd', name: '丁城', region: 'south', terrain: 'plain', value: 2 },
    { id: 'taipei', name: '台北', region: 'taiwan', terrain: 'plain', value: 2 },
  ],
  links: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'taipei']],
  units: [
    { id: 'first', name: '第一军', side: 'ccp', city: 'a', strength: 24_000, group: 'north' },
    { id: 'second', name: '第二军', side: 'ccp', city: 'c', strength: 22_000, group: 'south' },
    { id: 'opponent', name: '对方第一军', side: 'roc', city: 'taipei', strength: 1_000, group: 'south' },
    { id: 'reserve', name: '后备军', side: 'ccp', city: 'a', from: '1947-02-10', strength: 5_000 },
  ],
  scenarios: [
    { id: 'start', date: '1947-01-01', focus: 'a', area: 'north' },
    { id: 'later', date: '1947-01-08', focus: 'a', area: 'north', overrides: { b: 'roc' } },
  ],
  events: [
    { id: 'change', date: '1947-01-07', title: '交接', city: 'b', side: 'ccp' }
  ],
  anchors: [
    { date: '1947-01-01', ccp: ['a', 'c'], roc: ['b', 'd', 'taipei'] },
    { date: '1947-01-07', ccp: ['b'], roc: [] },
  ],
};

function getEngine() {
  assert.ok(engine, 'engine.js 需公开 CivilWarEngine');
  return engine;
}

function create(options = {}) {
  return getEngine().createGame(data, { scenarioId: 'start', historyMode: 'dynamic', ...options });
}

test('场景可初始化归属，历史锚点在场景覆盖之前应用', () => {
  assert.equal(create().owners.b, 'roc');
  assert.equal(create({ date: '1947-01-08' }).owners.b, 'ccp');
  assert.equal(create({ scenarioId: 'later' }).owners.b, 'roc');
  assert.equal(create({ scenarioId: 'later', date: '1947-01-09' }).owners.b, 'ccp');
});

test('分师、团后全国统计保持原始兵力，保留同一部队谱系', () => {
  const api = getEngine();
  const state = create();
  const army = state.units.find(unit => unit.id === 'first');
  const divisions = state.units.filter(unit => unit.parent === army.id);
  assert.ok(divisions.length >= 2);
  assert.equal(divisions.reduce((sum, unit) => sum + unit.strength, 0), 24_000);
  for (const division of divisions) {
    assert.equal(division.group, 'north');
    const regiments = state.units.filter(unit => unit.parent === division.id);
    assert.ok(regiments.length >= 2);
    assert.equal(regiments.reduce((sum, unit) => sum + unit.strength, 0), division.strength);
  }
  assert.deepEqual(api.stats(data, state), { ccp: 2, roc: 3, ccpStrength: 46_000, rocStrength: 1_000 });
});

test('师团接受独立命令，所属军可以继续指挥其他部队', () => {
  const api = getEngine();
  const state = create();
  const division = state.units.find(unit => unit.parent === 'first');
  const regiment = state.units.find(unit => unit.parent === division.id);
  assert.equal(api.order(data, state, 'opponent', 'advance', 'd').ok, false);
  assert.equal(api.order(data, state, 'first', 'advance', 'd').ok, false);
  assert.equal(api.order(data, state, 'first', 'move', 'b').ok, false);
  assert.equal(api.order(data, state, 'first', 'hold').ok, true);
  assert.equal(api.order(data, state, regiment.id, 'advance', 'b').ok, true);
  api.step(data, state, 20);
  assert.equal(state.owners.b, 'ccp');
  assert.equal(armyRegiments(state, 'first').filter(unit => unit.city === 'b').length, 1);
});

function armyRegiments(state, id) {
  const divisions = state.units.filter(unit => unit.parent === id).map(unit => unit.id);
  return state.units.filter(unit => divisions.includes(unit.parent));
}

test('战区模式继续让其他战区自行运作', () => {
  const api = getEngine();
  const state = create({ scope: 'theater' });
  api.step(data, state, 35);
  assert.ok(state.log.some(entry => entry.city === 'd' && entry.side === 'ccp'));
  assert.equal(state.units.find(unit => unit.id === 'first').delegated, false);
});

test('军和师持续显示下属部队正在执行的共同命令', () => {
  const api = getEngine();
  const state = create();
  api.order(data, state, 'first', 'advance', 'b');
  api.step(data, state, 1);
  const army = state.units.find(unit => unit.id === 'first');
  const division = state.units.find(unit => unit.parent === army.id);
  assert.deepEqual(army.order, { type: 'advance', target: 'b' });
  assert.deepEqual(division.order, army.order);
  api.step(data, state, 5);
  assert.equal(army.order, undefined);
  assert.equal(army.city, 'b');
});

test('地图预览复用实际命令路径，显示多段耗时并保持存档原样', () => {
  const api = getEngine();
  const board = {
    ...data,
    anchors: [{ date: '1947-01-01', ccp: ['a', 'b', 'c'], roc: ['d', 'taipei'] }],
  };
  const state = api.createGame(board, { scenarioId: 'start', historyMode: 'dynamic', goal: 'all' });
  const before = api.snapshot(state);
  const previews = api.previewOrders(board, state, 'first');
  assert.deepEqual(previews.c.move, { ok: true, days: 8, route: ['a', 'b', 'c'] });
  assert.equal(previews.d.advance.ok, false);
  assert.equal(previews.b.siege.ok, false);
  assert.equal(previews.b.intercept.ok, false);
  assert.deepEqual(previews.c.move, api.previewOrder(board, state, 'first', 'move', 'c'));
  assert.deepEqual(state, before);
  assert.equal(api.order(board, state, 'first', 'advance', 'd').error, previews.d.advance.error);

  assert.equal(api.order(board, state, 'first', 'move', 'c').ok, true);
  api.step(board, state, 7);
  assert.equal(state.units.find(unit => unit.id === 'first').city, 'b');
  api.step(board, state, 1);
  assert.ok(state.log.some(entry => entry.type === 'operation' && entry.phase === 'arrival' && entry.city === 'c'));
});

test('战斗结束与易手按顺序记录附近部队，旧档沿用单调编号', () => {
  const api = getEngine();
  const board = {
    ...data,
    units: [data.units[0], data.units[1], { ...data.units[2], city: 'b' }],
    events: [],
  };
  const state = api.createGame(board, { scenarioId: 'start', historyMode: 'dynamic', goal: 'all' });
  delete state.eventSequence;
  delete state.log[0].seq;
  assert.equal(api.order(board, state, 'first', 'advance', 'b').ok, true);
  api.step(board, state, 5);
  const started = state.log.find(entry => entry.type === 'battle-start' && entry.city === 'b');
  const capture = state.log.find(entry => entry.type === 'capture' && entry.city === 'b');
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'b');
  assert.ok(started.seq < capture.seq && capture.seq < ended.seq);
  assert.equal(ended.result, 'capture');
  assert.ok(capture.nearbyUnits.some(unit => unit.id === 'first' && unit.side === 'ccp' && unit.strength > 0));
  assert.ok(capture.nearbyUnits.some(unit => unit.id === 'opponent' && unit.side === 'roc' && unit.strength > 0));
  for (let i = 0; i < 263; i += 1) api.order(board, state, 'first', 'hold');
  assert.equal(state.log.length, 260);
  assert.ok(state.log[0].seq > started.seq);
  assert.equal(state.log.at(-1).seq, state.eventSequence);
});

test('调动途中路径失效时记录撤销原因', () => {
  const api = getEngine();
  const board = {
    ...data,
    anchors: [{ date: '1947-01-01', ccp: ['a', 'b', 'c'], roc: ['d', 'taipei'] }],
    events: [{ id: 'block', date: '1947-01-02', title: '线路中断', city: 'b', side: 'roc' }],
  };
  const state = api.createGame(board, { scenarioId: 'start', historyMode: 'historical', goal: 'all' });
  assert.equal(api.order(board, state, 'first', 'move', 'c').ok, true);
  api.step(board, state, 3);
  assert.ok(state.log.some(entry => entry.type === 'operation' && entry.phase === 'cleared'
    && entry.reason === 'route-broken' && entry.unitId === 'first'));
});

test('整补预演会在指定日期重新验证命令，预测不改写正式局势', () => {
  const api = getEngine();
  const baseline = create({ goal: 'all' });
  const training = api.snapshot(baseline);
  assert.equal(api.order(data, training, 'first', 'hold').ok, true);
  const saved = api.snapshot(training);
  const result = api.forecast(data, training, 2, { afterDays: 7, unitId: 'first', type: 'advance', target: 'b' });
  const deferred = result[0].highlights.find(entry => entry.phase === 'deferred');
  assert.equal(deferred.date, '1947-01-08');
  assert.equal(deferred.error, undefined);
  assert.equal(typeof result[0].ccpFood, 'number');
  assert.equal(result[1].date, '1947-03-01');
  assert.deepEqual(training, saved);
  assert.equal(baseline.owners.b, 'roc');
});

test('失守后没有相邻己方城镇的部队退出战斗', () => {
  const api = getEngine();
  const isolated = {
    ...data,
    units: [...data.units, { id: 'pocket', name: '被围部队', side: 'roc', city: 'b', strength: 700 }],
  };
  const state = api.createGame(isolated, { scenarioId: 'start', historyMode: 'dynamic', goal: 'all' });
  assert.equal(api.order(isolated, state, 'first', 'advance', 'b').ok, true);
  api.step(isolated, state, 6);
  assert.equal(state.owners.b, 'ccp');
  assert.equal(state.units.find(unit => unit.id === 'pocket').strength, 0);
  assert.equal(state.owners.d, 'roc');
});

test('战役委任可接管己方部队', () => {
  const api = getEngine();
  const state = create();
  assert.equal(api.order(data, state, 'first', 'hold').ok, true);
  api.setDelegated(state, 'first', true);
  assert.equal(state.units.find(unit => unit.id === 'first').delegated, true);
  api.step(data, state, 28);
  assert.equal(state.owners.b, 'ccp');
});

test('委任军向指定目标优先行军', () => {
  const api = getEngine();
  const state = create({ goal: 'all', scope: 'theater' });
  assert.equal(api.setDelegated(state, 'second', true, 'taipei').ok, true);
  assert.equal(state.units.find(unit => unit.id === 'second').delegateTarget, 'taipei');
  api.step(data, state, 28);
  const army = state.units.find(unit => unit.id === 'second');
  assert.equal(army.city, 'taipei');
  assert.equal(state.owners.b, 'roc');
});

test('谱系控制只允许操作同谱系部队，其余友军由电脑指挥', () => {
  const api = getEngine();
  const state = create({ goal: 'all' });
  assert.equal(api.order(data, state, 'second', 'hold').ok, true);
  assert.equal(api.setGroup(state, 'north').ok, true);
  assert.equal(api.order(data, state, 'first', 'hold').ok, true);
  assert.equal(api.order(data, state, 'second', 'hold').ok, false);
  api.step(data, state, 28);
  assert.ok(state.log.some(entry => entry.side === 'ccp' && entry.type === 'capture'));
  api.setSide(state, 'roc');
  assert.equal(state.group, null);
});

test('任命同阵营将领会同步下属编制并避免同时任职', () => {
  const api = getEngine();
  const roster = {
    ...data,
    leaders: [{ id: 'general', side: 'ccp' }, { id: 'rival', side: 'roc' }],
    units: [{ ...data.units[0], leader: 'general' }, ...data.units.slice(1)],
  };
  const state = api.createGame(roster, { scenarioId: 'start' });
  const first = state.units.find(unit => unit.id === 'first');
  const second = state.units.find(unit => unit.id === 'second');
  const secondDivision = state.units.find(unit => unit.parent === 'second');
  assert.equal(api.setLeader(roster, state, 'first', 'general').ok, true);
  assert.equal(api.setLeader(roster, state, 'second', 'general').ok, false);
  assert.equal(api.setLeader(roster, state, 'first', 'rival').ok, false);
  assert.equal(api.setLeader(roster, state, secondDivision.id, 'general').ok, false);
  assert.equal(api.setLeader(roster, state, 'opponent', null).ok, false);
  assert.equal(api.setLeader(roster, state, 'first', null).ok, true);
  assert.equal(first.leader, null);
  assert.ok(armyRegiments(state, 'first').every(unit => unit.leader === null));

  api.setGroup(state, 'north');
  assert.equal(api.setLeader(roster, state, 'second', 'general').ok, false);
  api.setGroup(state, 'south');
  assert.equal(api.setLeader(roster, state, 'second', 'general').ok, true);
  assert.equal(second.leader, 'general');
  assert.equal(secondDivision.leader, 'general');
  assert.ok(armyRegiments(state, 'second').every(unit => unit.leader === 'general'));
});

test('机动换装消耗军械并加快调动，旧存档仍支持换装', () => {
  const api = getEngine();
  const board = { ...data, anchors: [{ ...data.anchors[0], ccp: ['a', 'b', 'c'] }] };
  board.anchors[0].roc = ['d', 'taipei'];
  const normal = api.createGame(board, { scenarioId: 'start', historyMode: 'dynamic' });
  const mobile = api.snapshot(normal);
  for (const unit of mobile.units) {
    delete unit.profile;
    delete unit.branch;
  }
  const arms = mobile.economy.ccp.arms;
  assert.equal(api.setEquipment(board, mobile, 'first', 'mobile').ok, true);
  assert.ok(mobile.economy.ccp.arms < arms);
  assert.equal(mobile.units.find(unit => unit.id === 'first').profile, 'mobile');
  assert.ok(armyRegiments(mobile, 'first').every(unit => unit.profile === 'mobile'));
  assert.equal(api.setEquipment(board, mobile, 'opponent', 'mobile').ok, false);
  mobile.economy.ccp.arms = 0;
  assert.equal(api.setEquipment(board, mobile, 'first', 'artillery').ok, false);

  api.order(board, normal, 'first', 'move', 'b');
  api.order(board, mobile, 'first', 'move', 'b');
  api.step(board, normal, 1);
  api.step(board, mobile, 1);
  assert.equal(normal.units.find(unit => unit.id === 'first').city, 'a');
  assert.equal(mobile.units.find(unit => unit.id === 'first').city, 'b');
  assert.ok(mobile.log.some(entry => entry.type === 'operation' && entry.city === 'b'));
});

test('跨海运输按线路增加耗时，岛内铁路按普通速度行进', () => {
  const api = getEngine();
  const board = {
    ...data,
    cities: [...data.cities, { id: 'port', name: '港城', region: 'taiwan', terrain: 'plain', value: 2 }],
    links: [...data.links, ['taipei', 'port']],
    routeTypes: { 'd|taipei': 'maritime', 'port|taipei': 'rail' },
  };
  const state = api.createGame(board, { scenarioId: 'start', side: 'roc', historyMode: 'dynamic', goal: 'all' });
  const army = state.units.find(unit => unit.id === 'opponent');
  assert.equal(api.order(board, state, army.id, 'move', 'port').ok, true);
  api.step(board, state, 3);
  assert.equal(army.city, 'port');
  assert.equal(api.order(board, state, army.id, 'move', 'd').ok, true);
  api.step(board, state, 6);
  assert.equal(army.city, 'taipei');
  api.step(board, state, 3);
  assert.equal(army.city, 'd');
});

test('围城需要准备数日并能独立完成攻占', () => {
  const api = getEngine();
  const state = create({ goal: 'all' });
  assert.equal(api.order(data, state, 'first', 'siege', 'a').ok, false);
  assert.equal(api.order(data, state, 'first', 'siege', 'b').ok, true);
  api.step(data, state, 6);
  assert.equal(state.owners.b, 'roc');
  api.step(data, state, 10);
  assert.equal(state.owners.b, 'ccp');
  assert.ok(state.log.some(entry => entry.type === 'capture' && entry.city === 'b'
    && entry.previousSide === 'roc'));
  assert.ok(state.log.some(entry => entry.type === 'operation' && entry.city === 'b'));
});

test('围点打援可削弱进入目标城镇的援军，保留目标城镇原有归属', () => {
  const api = getEngine();
  const board = {
    ...data,
    units: [data.units[0], { ...data.units[2], city: 'd', strength: 4_800 }],
    anchors: [{ date: '1947-01-01', ccp: ['a'], roc: ['b', 'c', 'd', 'taipei'] }],
    events: [],
  };
  const state = api.createGame(board, { scenarioId: 'start', historyMode: 'dynamic', goal: 'all' });
  assert.equal(api.order(board, state, 'first', 'intercept', 'b').ok, true);
  api.setSide(state, 'roc');
  assert.equal(api.order(board, state, 'opponent', 'move', 'b').ok, true);
  api.step(board, state, 10);
  assert.equal(state.owners.b, 'roc');
  assert.ok(api.stats(board, state).rocStrength < 4_800);
  assert.ok(state.log.some(entry => entry.type === 'intercept' && entry.city === 'b'));
});

test('局内切换历史模式并停用指定事件，匹配历史锚点一并停用', () => {
  const api = getEngine();
  const switched = create();
  const muted = create();
  api.step(data, switched, 1);
  api.step(data, muted, 1);
  assert.equal(api.setHistoryMode(switched, 'historical').ok, true);
  assert.equal(api.setHistoryMode(muted, 'historical').ok, true);
  assert.equal(api.setHistoricalEvent(muted, 'change', false).ok, true);
  api.step(data, switched, 5);
  api.step(data, muted, 5);
  assert.equal(switched.owners.b, 'ccp');
  assert.equal(muted.owners.b, 'roc');
  assert.ok(muted.log.some(entry => entry.eventId === 'change' && entry.type === 'reference'));
});

test('动态模式记录历史参照，只有历史模式在当日应用锚点', () => {
  const api = getEngine();
  const dynamic = create();
  const historical = create({ historyMode: 'historical' });
  api.step(data, dynamic, 6);
  api.step(data, historical, 6);
  assert.equal(dynamic.owners.b, 'roc');
  assert.equal(historical.owners.b, 'ccp');
  assert.equal(dynamic.log.some(entry => entry.eventId === 'change'), true);
  assert.equal(historical.log.some(entry => entry.eventId === 'change'), true);
});

test('历史模式沿用玩家攻占的城市，其他城市仍按历史节点易手', () => {
  const api = getEngine();
  const history = {
    ...data,
    events: [{ id: 'transfer', date: '1947-01-08', title: '交接', city: 'b', side: 'roc' }],
    anchors: [data.anchors[0], { date: '1947-01-08', ccp: ['d'], roc: ['b'] }],
  };
  const baseline = api.createGame(history, { scenarioId: 'start', historyMode: 'historical', goal: 'all' });
  const state = api.snapshot(baseline);
  assert.equal(api.order(history, state, 'first', 'advance', 'b').ok, true);
  api.step(history, state, 6);
  assert.equal(state.owners.b, 'ccp');

  const saved = api.snapshot(state);
  api.step(history, saved, 1);
  api.step(history, baseline, 7);
  assert.equal(saved.owners.b, 'ccp');
  assert.equal(saved.owners.d, 'ccp');
  assert.equal(baseline.owners.b, 'roc');
  assert.ok(saved.log.some(entry => entry.type === 'divergence' && entry.eventId === 'transfer'));
});

test('玩家直接守住的城市保留模拟战果', () => {
  const api = getEngine();
  const history = {
    ...data,
    units: [data.units[0], data.units[1], { ...data.units[2], city: 'b', strength: 24_000 }],
    events: [],
    anchors: [data.anchors[0], { date: '1947-01-20', ccp: [], roc: ['a'] }],
  };
  const state = api.createGame(history, { scenarioId: 'start', historyMode: 'historical', goal: 'all' });
  assert.equal(api.order(history, state, 'first', 'defend', 'a').ok, true);
  api.step(history, state, 19);
  assert.ok(state.log.some(entry => entry.type === 'battle-end' && entry.result === 'repelled' && entry.city === 'a'));
  assert.equal(state.owners.a, 'ccp');
  assert.ok(state.log.some(entry => entry.type === 'divergence' && entry.city === 'a'));
});

test('预测按月推进并保留当前存档，JSON 复原后结果一致', () => {
  const api = getEngine();
  const state = create();
  const before = JSON.parse(JSON.stringify(state));
  const series = api.forecast(data, state, 3);
  assert.deepEqual(series.map(entry => entry.date), ['1947-02-01', '1947-03-01', '1947-04-01']);
  for (const entry of series) {
    assert.ok(Number.isInteger(entry.changed) && entry.changed >= 0);
    assert.equal(entry.ccp + entry.roc, 5);
    assert.ok(entry.ccpFood >= 0 && entry.rocFood >= 0);
    assert.ok(Array.isArray(entry.highlights));
  }
  assert.deepEqual(state, before);
  assert.deepEqual(series, api.forecast(data, before, 3));
});

test('大陆目标与含台湾目标分别判断胜利，日期可以越过 1950 年', () => {
  const api = getEngine();
  const isolated = { ...data, links: [], anchors: [data.anchors[0]] };
  const mainland = api.createGame(isolated, { date: '1951-01-01', goal: 'mainland' });
  const all = api.createGame(isolated, { date: '1951-01-01', goal: 'all' });
  for (const state of [mainland, all]) {
    state.owners.b = 'ccp';
    state.owners.d = 'ccp';
    api.step(isolated, state, 1);
    assert.equal(state.date, '1951-01-02');
  }
  assert.equal(mainland.winner, 'ccp');
  assert.equal(all.winner, null);
  all.owners.taipei = 'ccp';
  api.step(isolated, all, 1);
  assert.equal(all.winner, 'ccp');
});

test('后备部队在其日期进入，阵营切换后可以操作另一方', () => {
  const api = getEngine();
  const state = create({ goal: 'all' });
  assert.equal(state.units.some(unit => unit.id === 'reserve'), false);
  api.step(data, state, 40);
  assert.ok(state.units.some(unit => unit.id === 'reserve'));
  api.setSide(state, 'roc');
  api.setScope(state, 'theater');
  assert.equal(state.player, 'roc');
  assert.equal(state.scope, 'theater');
  assert.equal(api.order(data, state, 'opponent', 'defend').ok, true);
});

test('动态模式改编继承原有谱系人力和驻地', () => {
  const api = getEngine();
  const lineage = {
    ...data,
    units: [
      { ...data.units[0], until: '1947-01-05' },
      ...data.units.slice(1),
      { ...data.units[0], id: 'new', city: 'b', strength: 30_000, from: '1947-01-05' },
    ],
  };
  const state = api.createGame(lineage, { scenarioId: 'start', historyMode: 'dynamic' });
  api.step(lineage, state, 4);
  assert.equal(api.stats(lineage, state).ccpStrength, 46_000);
  const newArmy = api.activeUnits(state).find(unit => unit.id === 'new');
  assert.equal(newArmy.city, 'a');
  assert.equal(newArmy.strength, 24_000);
  assert.equal(api.activeUnits(state).some(unit => unit.id === 'first'), false);
});

test('征兵政策会影响补充，停驻补给会消耗粮食储备', () => {
  const api = getEngine();
  const high = create();
  const low = create();
  for (const state of [high, low]) {
    const regiment = armyRegiments(state, 'first')[0];
    regiment.strength -= 500;
    state.economy.ccp.food = 8_000;
  }
  api.setPolicy(high, 'recruit', 'high');
  api.setPolicy(low, 'recruit', 'low');
  api.step(data, high, 7);
  api.step(data, low, 7);
  assert.ok(api.stats(data, high).ccpStrength > api.stats(data, low).ccpStrength);
  assert.ok(high.economy.ccp.food < 8_000);
});
