const assert = require('node:assert/strict');
const { test } = require('node:test');
require('../engine.js');

const engine = globalThis.CivilWarEngine;

const board = {
  cities: [
    { id: 'rear', name: '后方', region: 'north', terrain: 'rail', value: 6 },
    { id: 'hub', name: '枢纽', region: 'north', terrain: 'rail', value: 7 },
    { id: 'front', name: '前线', region: 'north', terrain: 'plain', value: 4 },
    { id: 'flank', name: '侧翼', region: 'north', terrain: 'mountain', value: 2 },
    { id: 'far', name: '远镇', region: 'south', terrain: 'plain', value: 2 },
  ],
  links: [['rear', 'hub'], ['hub', 'front'], ['front', 'flank'], ['flank', 'far']],
  routeTypes: { 'hub|rear': 'rail', 'front|hub': 'rail', 'flank|front': 'land', 'far|flank': 'land' },
  units: [
    { id: 'main', name: '主力军', side: 'ccp', city: 'front', strength: 24_000, equipment: 86 },
    { id: 'second', name: '预备军', side: 'ccp', city: 'hub', strength: 12_000, equipment: 71 },
    { id: 'enemy', name: '守备军', side: 'roc', city: 'flank', strength: 6_000, equipment: 57 },
  ],
  anchors: [{ date: '1947-01-01', ccp: ['rear', 'hub', 'front'], roc: ['flank', 'far'] }],
  scenarios: [{ id: 'start', date: '1947-01-01', focus: 'front', area: 'north' }],
  events: [],
};

function create(options = {}) {
  return engine.createGame(board, { scenarioId: 'start', side: 'ccp', goal: 'all',
    scope: 'national', historyMode: 'dynamic', ...options });
}

function unit(state, id) {
  return state.units.find(member => member.id === id);
}

test('作战计划可编入多支部队，统一预览后一键执行', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main', 'second'], target: 'far', mode: 'advance' });
  assert.equal(made.ok, true);
  assert.deepEqual(made.plan.units, ['main', 'second']);
  assert.equal(made.plan.status, 'draft');

  const preview = engine.previewPlan(board, state, made.plan.id);
  assert.equal(preview.ok, true);
  assert.equal(preview.total, 2);
  assert.equal(preview.ready, 2);
  const mainRow = preview.rows.find(row => row.unitId === 'main');
  assert.equal(mainRow.type, 'advance');
  assert.equal(mainRow.target, 'flank');
  assert.equal(preview.rows.find(row => row.unitId === 'second').type, 'move');

  const run = engine.executePlan(board, state, made.plan.id);
  assert.equal(run.ok, true);
  assert.equal(run.applied.length, 2);
  assert.equal(unit(state, 'main').order.type, 'advance');
  assert.equal(unit(state, 'second').order.type, 'move');
  assert.ok(state.units.filter(member => member.orderPlan === made.plan.id).length > 0);
  assert.equal(state.plans[0].status, 'active');

  const paused = engine.pausePlan(board, state, made.plan.id);
  assert.equal(paused.ok, true);
  assert.ok(paused.stopped > 0);
  assert.equal(unit(state, 'main').order, undefined);
  assert.equal(state.plans[0].status, 'paused');
  assert.equal(engine.removePlan(state, made.plan.id).ok, true);
  assert.equal(state.plans.length, 0);
});

test('计划可改目标与编成，非本方或不可指挥部队被拒绝', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main'], target: 'flank' });
  assert.equal(engine.updatePlan(board, state, made.plan.id, { target: 'far', mode: 'siege',
    name: '西路钳击', units: ['main', 'second'] }).ok, true);
  assert.equal(state.plans[0].target, 'far');
  assert.equal(state.plans[0].mode, 'siege');
  assert.equal(state.plans[0].name, '西路钳击');
  assert.deepEqual(state.plans[0].units, ['main', 'second']);
  assert.equal(engine.updatePlan(board, state, made.plan.id, { target: 'nowhere' }).ok, false);
  assert.equal(engine.createPlan(board, state, { units: ['enemy'], target: 'front' }).ok, false);
  assert.equal(engine.createPlan(board, state, { units: [], target: 'front' }).ok, false);

  engine.setSide(state, 'roc');
  assert.equal(engine.executePlan(board, state, made.plan.id).ok, false);
});

test('委任计划后司令员按补给与战况重新下令', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main'], target: 'far' });
  engine.executePlan(board, state, made.plan.id);
  assert.equal(engine.delegatePlan(state, made.plan.id, true).ok, true);
  assert.equal(state.plans[0].delegated, true);

  engine.step(board, state, 9);
  assert.ok(state.log.some(entry => entry.action === 'plan-execute' || entry.action === 'plan-delegate'));

  for (const member of state.units.filter(item => item.side === 'ccp')) {
    member.ammo = 5;
    member.fuel = 5;
  }
  state.logistics.ccp.ammo = 0;
  state.logistics.ccp.fuel = 0;
  engine.step(board, state, 8);
  assert.ok(state.log.some(entry => entry.action === 'plan-rest'), '补给不足时应记录就地整补');
});

test('铁路沿线补给充足，远离枢纽的部队按距离递减', () => {
  const state = create();
  const reading = engine.supplyReading(board, state);
  assert.equal(reading.cities.front.ccp, 1);
  assert.ok(reading.cities.rear.ccp >= 0.9);
  assert.equal(reading.cities.far.ccp, 0);
  assert.ok(reading.stocks.ccp.ammo > 0);

  engine.step(board, state, 12);
  assert.equal(unit(state, 'main').ammo, 100);
  assert.equal(unit(state, 'main').fuel, 100);
  assert.equal(unit(state, 'main').medical, 100);
});

test('多支部队共用一段铁路时标出运输瓶颈', () => {
  const crowded = {
    ...board,
    units: [...board.units,
      { id: 'a2', name: '加强军', side: 'ccp', city: 'front', strength: 30_000 },
      { id: 'a3', name: '第二梯队', side: 'ccp', city: 'front', strength: 30_000 },
      { id: 'a4', name: '第三梯队', side: 'ccp', city: 'front', strength: 30_000 },
      { id: 'a5', name: '第四梯队', side: 'ccp', city: 'front', strength: 30_000 },
    ],
  };
  const state = engine.createGame(crowded, { scenarioId: 'start', side: 'ccp', scope: 'national',
    historyMode: 'dynamic', goal: 'all' });
  const reading = engine.supplyReading(crowded, state);
  assert.ok(reading.bottlenecks.length > 0);
  const edge = reading.bottlenecks[0];
  assert.equal(edge.side, 'ccp');
  assert.ok(edge.load > edge.capacity);
  assert.ok(reading.coverage.ccp.front < 1);
  assert.ok(reading.coverage.ccp.front > 0.3);
});

test('剧本物资紧张会让库存与弹药下降，正常剧本不受影响', () => {
  const scarce = create({ supply: { ccp: 0.06 } });
  const normal = create();
  engine.step(board, scarce, 40);
  engine.step(board, normal, 40);
  assert.ok(unit(scarce, 'main').ammo < 60, '紧张剧本弹药应下降：' + unit(scarce, 'main').ammo);
  assert.equal(unit(normal, 'main').ammo, 100);
  assert.ok(scarce.logistics.ccp.ammo <= normal.logistics.ccp.ammo);
});

test('工事需要工兵驻军与经费，按天数完工并提高防守', () => {
  const state = create();
  assert.equal(engine.buildFort(board, state, 'front', 'trench').ok, true);
  const work = state.works[0];
  assert.equal(work.kind, 'trench');
  assert.ok(work.due > state.date);
  const arms = state.economy.ccp.arms;
  assert.equal(engine.buildFort(board, state, 'front', 'trench').ok, false, '同类工事不应重复施工');
  assert.equal(engine.buildFort(board, state, 'far', 'trench').ok, false, '不能在敌城施工');

  engine.step(board, state, work.days);
  assert.equal(state.forts.front.trench, 1);
  assert.equal(state.works.length, 0);
  assert.ok(state.log.some(entry => entry.type === 'works' && entry.city === 'front'));
  assert.ok(engine.metadata.fortLevel(state, 'front', 'trench') === 1);

  for (const member of state.units.filter(member => member.side === 'ccp')) {
    member.support = { ...engine.metadata.unitSupport(member), engineer: 2 };
  }
  assert.equal(engine.buildFort(board, state, 'front', 'bunker').ok, false, '工兵不足应被拒绝');
  assert.ok(state.economy.ccp.arms < arms + 1);
});

test('师团支援编制可调整，并影响战力与伤亡', () => {
  const state = create();
  const before = engine.metadata.supportFactor(unit(state, 'main'), true);
  assert.ok(before > 0.99 && before < 1.03);
  const result = engine.setSupport(board, state, 'main', 'medical', 92);
  assert.equal(result.ok, true);
  const leaves = state.units.filter(member => member.parent === 'main');
  assert.ok(leaves.length > 0);
  assert.ok(leaves.every(member => member.support.medical === 92));
  assert.ok(engine.metadata.supportFactor(unit(state, 'main'), true) > before);
  assert.equal(engine.setSupport(board, state, 'main', 'medical', 140).ok, false);
  assert.equal(engine.setSupport(board, state, 'main', 'nonsense', 10).ok, false);
  engine.setSide(state, 'roc');
  assert.equal(engine.setSupport(board, state, 'main', 'medical', 10).ok, false);
});

test('战报记录伤亡、伤员、俘虏与缴获，并累计士气与老兵经验', () => {
  const state = create();
  assert.equal(engine.order(board, state, 'main', 'advance', 'flank').ok, true);
  engine.step(board, state, 10);
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'flank');
  assert.ok(ended, '应产生战斗结束记录');
  const record = ended.aftermath;
  assert.equal(record.result, 'capture');
  assert.ok(record.attackerCasualties > 0);
  assert.ok(record.defenderCasualties > 0);
  assert.ok(record.wounded > 0);
  assert.ok(record.prisoners > 0);
  assert.ok(record.captured.arms > 0);
  assert.ok(state.tally.ccp.battles >= 1);
  assert.equal(state.tally.ccp.wins, 1);
  assert.ok(state.tally.roc.casualties > 0);
  const main = unit(state, 'main');
  assert.ok(main.morale > 70);
  assert.ok(main.veteran > 0);
  assert.ok(state.log.some(entry => entry.type === 'capture' && entry.city === 'flank'));
});

test('旧存档补齐补给、工事与编制字段后可继续推演', () => {
  const state = create();
  engine.step(board, state, 3);
  const legacy = engine.snapshot(state);
  delete legacy.logistics;
  delete legacy.forts;
  delete legacy.plans;
  delete legacy.tally;
  delete legacy.supplyScarcity;
  delete legacy.air;
  for (const member of legacy.units) {
    delete member.ammo;
    delete member.fuel;
    delete member.medical;
    delete member.morale;
    delete member.veteran;
    delete member.support;
  }
  engine.prepare(board, legacy);
  assert.ok(legacy.logistics.ccp.ammo > 0);
  assert.deepEqual(legacy.plans, []);
  assert.ok(legacy.units.every(member => member.ammo === 100 && member.support.engineer > 0));
  engine.step(board, legacy, 3);
  assert.ok(legacy.date > state.date);
});

test('作战计划可设战线，部队先集结再向目标推进', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main', 'second'], target: 'far', mode: 'advance', front: 'hub' });
  assert.equal(made.ok, true);
  assert.equal(state.plans[0].front, 'hub');
  const preview = engine.previewPlan(board, state, made.plan.id);
  const main = preview.rows.find(row => row.unitId === 'main');
  assert.equal(main.assembly, true);
  assert.equal(main.type, 'move');
  assert.equal(main.target, 'hub');
  const second = preview.rows.find(row => row.unitId === 'second');
  assert.equal(second.staging, true);
  assert.equal(second.target, 'front');

  assert.equal(engine.executePlan(board, state, made.plan.id).ok, true);
  engine.step(board, state, 4);
  assert.equal(unit(state, 'main').city, 'hub');
  const after = engine.previewPlan(board, state, made.plan.id).rows.find(row => row.unitId === 'main');
  assert.equal(after.assembly, undefined);
  assert.equal(engine.updatePlan(board, state, made.plan.id, { front: null }).ok, true);
  assert.equal(state.plans[0].front, null);
  assert.equal(engine.updatePlan(board, state, made.plan.id, { front: 'nowhere' }).ok, false);
});

test('步兵纳入支援编制，调整后计入防守战力', () => {
  const state = create();
  assert.ok(engine.metadata.supportKeys.includes('infantry'));
  assert.equal(engine.metadata.supportKinds.infantry, '步兵');
  const before = engine.metadata.supportFactor(unit(state, 'main'), true);
  assert.equal(engine.setSupport(board, state, 'main', 'infantry', 80).ok, true);
  assert.equal(unit(state, 'main').support.infantry, 80);
  assert.ok(engine.metadata.supportFactor(unit(state, 'main'), true) > before);
  assert.equal(engine.setSupport(board, state, 'main', 'infantry', -1).ok, false);
});

test('补给通路区分铁路、公路与本地，侦察与空中支援为剧本参数', () => {
  const state = create();
  const reading = engine.supplyReading(board, state);
  assert.equal(reading.transport.ccp.front, 'rail');
  assert.equal(reading.transport.ccp.hub, 'local');
  assert.equal(reading.transport.ccp.flank, undefined);
  assert.equal(typeof state.recon.ccp, 'number');
  assert.equal(typeof state.air.roc, 'number');
  const scarce = create({ supply: { ccp: 0.5 } });
  assert.equal(engine.supplyReading(board, scarce).transport.ccp.front, 'rail');
});

test('计划达成目标后自动标记完成并记录战况', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main'], target: 'flank' });
  assert.equal(engine.executePlan(board, state, made.plan.id).ok, true);
  engine.step(board, state, 12);
  assert.equal(state.owners.flank, 'ccp');
  assert.equal(state.plans[0].status, 'done');
  assert.ok(state.log.some(entry => entry.action === 'plan-done' && entry.city === 'flank'));
});

test('战斗伤员在己方城镇逐步回补，士气与老兵写入战报', () => {
  const state = create();
  assert.equal(engine.order(board, state, 'main', 'advance', 'flank').ok, true);
  engine.step(board, state, 10);
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'flank');
  assert.equal(ended.aftermath.moraleAttack, 7);
  assert.equal(ended.aftermath.moraleDefend, -14);
  assert.equal(ended.aftermath.experience, 'ccp');
  const main = unit(state, 'main');
  const wounded = main.wounded;
  assert.ok(wounded > 0, '战后应留下伤员');
  const strength = main.strength;
  engine.step(board, state, 8);
  assert.ok(unit(state, 'main').wounded < wounded, '伤员应逐步归队');
  assert.ok(unit(state, 'main').strength >= strength);
});

test('存档时间线可回放作战计划、工事与编制指令', () => {
  const Timeline = require('../timeline.js');
  const state = create();
  const line = Timeline.create(state, engine);
  engine.step(board, state, 1);
  assert.equal(Timeline.apply(line, engine, board, state, 'buildFort', ['hub', 'trench']).ok, true);
  assert.equal(Timeline.apply(line, engine, board, state, 'setSupport', ['second', 'medical', 60]).ok, true);
  const made = Timeline.apply(line, engine, board, state, 'createPlan', [{ units: ['main', 'second'], target: 'far' }]);
  assert.equal(made.ok, true);
  const planId = state.plans[0].id;
  assert.equal(Timeline.apply(line, engine, board, state, 'executePlan', [planId]).ok, true);
  engine.step(board, state, 14);
  assert.equal(state.forts.hub.trench, 1);

  const restored = Timeline.parse(Timeline.serialize(state, line));
  const replayed = Timeline.branch(restored.timeline, engine, board, state.date, state.date);
  assert.equal(replayed.state.forts.hub.trench, 1);
  assert.equal(replayed.state.plans.length, 1);
  assert.equal(replayed.state.plans[0].id, planId);
  assert.equal(replayed.state.units.find(unit => unit.id === 'second').support.medical, 60);
  assert.deepEqual(replayed.state.owners, state.owners);
  assert.equal(replayed.state.units.find(unit => unit.id === 'main').city,
    state.units.find(unit => unit.id === 'main').city);
});

test('四项功能的中文名与显示接口齐全', () => {  const meta = engine.metadata;
  assert.equal(Object.keys(meta.fortKinds).length, 6);
  assert.equal(meta.fortKinds.trench.name, '战壕');
  assert.equal(meta.fortKinds.depot.name, '补给站');
  assert.equal(meta.planModes.advance, '进攻');
  assert.equal(meta.planModes.intercept, '围点打援');
  assert.equal(meta.supplyGoods.ammo, '弹药');
  for (const key of meta.supportKeys) assert.ok(meta.supportKinds[key].length > 0);
  const state = create();
  const reading = engine.supplyReading(board, state);
  assert.ok(reading.cities.rear.roc === 0);
  assert.ok(Object.hasOwn(reading.stocks, 'roc'));
});
