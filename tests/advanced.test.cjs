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
  engine.step(board, state, 20);
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'flank');
  assert.ok(ended, '应产生战斗结束记录');
  const record = ended.aftermath;
  assert.equal(record.result, 'capture');
  assert.ok(record.days >= 2, '战役应持续多日');
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
  engine.step(board, state, 20);
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'flank');
  assert.ok(ended, '应产生战斗结束记录');
  assert.equal(ended.aftermath.moraleAttack, 7);
  assert.equal(ended.aftermath.moraleDefend, -14);
  assert.equal(ended.aftermath.experience, 'ccp');
  const main = unit(state, 'main');
  const wounded = main.wounded;
  assert.ok(wounded > 0, '战后应留下伤员');
  const leaf = state.units.find(member => member.id === 'main-d1-r1');
  assert.ok(leaf, '应能定位到团级部队');
  leaf.strength = 3000;
  leaf.wounded = 600;
  const strength = leaf.strength;
  engine.step(board, state, 8);
  const after = state.units.find(member => member.id === 'main-d1-r1');
  assert.ok(after.wounded < 600, '伤员应逐步归队');
  assert.ok(after.strength > strength, '归队伤员应补充兵力');
});

test('存档时间线可回放作战计划、工事与编制指令', () => {
  const Timeline = require('../timeline.js');
  const state = create();
  const line = Timeline.create(state, engine);
  engine.step(board, state, 1);
  assert.equal(Timeline.apply(line, engine, board, state, 'buildFort', ['hub', 'trench']).ok, true);
  assert.equal(Timeline.apply(line, engine, board, state, 'setSupport', ['second', 'medical', 60]).ok, true);
  const made = Timeline.apply(line, engine, board, state, 'createPlan', [{ units: ['main', 'second'], target: 'flank' }]);
  assert.equal(made.ok, true);
  const planId = made.plan.id;
  const execute = Timeline.apply(line, engine, board, state, 'executePlan', [planId]);
  assert.equal(execute.ok, true, execute.error);
  engine.step(board, state, 14);
  assert.equal(state.forts.hub.trench, 1);

  const restored = Timeline.parse(Timeline.serialize(state, line));
  const replayed = Timeline.branch(restored.timeline, engine, board, state.date, state.date);
  assert.equal(replayed.state.forts.hub.trench, 1);
  const replayedPlan = replayed.state.plans.find(plan => plan.id === planId);
  assert.ok(replayedPlan);
  assert.equal(replayed.state.plans.filter(plan => !plan.aiGenerated).length, 1);
  assert.equal(replayed.state.units.find(unit => unit.id === 'second').support.medical, 60);
  assert.deepEqual(replayed.state.owners, state.owners);
  assert.equal(replayed.state.units.find(unit => unit.id === 'main').city,
    state.units.find(unit => unit.id === 'main').city);
});

test('守备战线：部队按最近的战线城镇布防', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main', 'second'], target: 'far',
    stance: 'hold', line: ['front', 'hub'] });
  assert.equal(made.ok, true);
  assert.equal(state.plans[0].stance, 'hold');
  assert.deepEqual(state.plans[0].line, ['front', 'hub']);
  const preview = engine.previewPlan(board, state, made.plan.id);
  assert.ok(preview.rows.every(row => row.ok));
  const mainRow = preview.rows.find(row => row.unitId === 'main');
  const secondRow = preview.rows.find(row => row.unitId === 'second');
  assert.equal(mainRow.type, 'defend');
  assert.equal(mainRow.target, 'front');
  assert.equal(secondRow.target, 'hub');
  assert.equal(engine.executePlan(board, state, made.plan.id).ok, true);
  assert.equal(unit(state, 'main').order.type, 'defend');
  engine.step(board, state, 3);
  assert.equal(state.plans[0].status, 'active', '守备计划不应自动结束');
});

test('沿战线进攻与后撤：先到战线再按决心行动', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main', 'second'], target: 'far',
    stance: 'push', line: ['front'] });
  const preview = engine.previewPlan(board, state, made.plan.id);
  const mainRow = preview.rows.find(row => row.unitId === 'main');
  const secondRow = preview.rows.find(row => row.unitId === 'second');
  assert.equal(mainRow.type, 'advance');
  assert.equal(mainRow.target, 'flank');
  assert.equal(secondRow.type, 'move');
  assert.equal(secondRow.target, 'front');

  const back = engine.createPlan(board, state, { units: ['main'], target: 'flank',
    stance: 'fallback', line: ['rear'] });
  assert.equal(engine.previewPlan(board, state, back.plan.id).rows[0].type, 'move');
  assert.equal(engine.previewPlan(board, state, back.plan.id).rows[0].target, 'rear');
});

test('战线可自动取当前边境城镇', () => {
  const state = create();
  const made = engine.createPlan(board, state, { units: ['main'], target: 'flank',
    stance: 'hold', autoLine: true });
  assert.equal(state.plans[0].autoLine, true);
  assert.deepEqual(state.plans[0].line, []);
  const preview = engine.previewPlan(board, state, made.plan.id);
  assert.equal(preview.rows[0].ok, true);
  assert.equal(preview.rows[0].target, 'front');
  assert.equal(engine.updatePlan(board, state, made.plan.id, { line: ['hub'] }).ok, true);
  assert.equal(state.plans[0].autoLine, false);
  assert.deepEqual(state.plans[0].line, ['hub']);
});

test('组织度在战斗中消耗、驻防时恢复并影响战力', () => {
  const state = create();
  assert.equal(unit(state, 'main').org, 100);
  engine.order(board, state, 'main', 'advance', 'flank');
  engine.step(board, state, 10);
  assert.ok(state.battles.flank, '应处于多日战役中');
  assert.ok(state.battles.flank.days >= 2, '战役应跨多日');
  const stressed = state.units.filter(member => member.strength > 0 && member.org < 95);
  assert.ok(stressed.length > 0, '战斗应消耗组织度');
  engine.step(board, state, 24);
  const leaf = state.units.find(member => member.id === 'main-d1-r1');
  leaf.org = 40;
  engine.step(board, state, 1);
  assert.ok(leaf.org > 40, '驻防应恢复组织度');

  const strong = { ...leaf, org: 100 };
  const weak = { ...leaf, org: 20 };
  assert.ok(engine.metadata.power([strong], false) > engine.metadata.power([weak], false),
    '组织度低时战力应更弱');
});

test('同等兵力的进攻会被击退，守军撤退而非全歼', () => {
  const equal = {
    ...board,
    units: [
      { id: 'main', name: '主力军', side: 'ccp', city: 'front', strength: 24_000, equipment: 86 },
      { id: 'enemy', name: '守备军', side: 'roc', city: 'flank', strength: 24_000, equipment: 86 },
    ],
  };
  const state = engine.createGame(equal, { scenarioId: 'start', side: 'ccp', goal: 'all',
    scope: 'national', historyMode: 'dynamic' });
  engine.order(equal, state, 'main', 'defend', 'front');
  engine.order(equal, state, 'main', 'advance', 'flank');
  engine.step(equal, state, 8);
  assert.ok(state.battles.flank, '战役应仍在进行');
  engine.step(equal, state, 24);
  const ended = state.log.find(entry => entry.type === 'battle-end' && entry.city === 'flank');
  assert.ok(ended, '应产生战斗结束记录');
  assert.equal(ended.result, 'repelled');
  assert.equal(state.owners.flank, 'roc');
  assert.ok(ended.aftermath.days >= 2);
  const enemy = state.units.find(member => member.id === 'enemy');
  assert.ok(enemy.strength > 12_000, '守军应以撤退保存兵力，而不是被整体歼灭');
  assert.ok(ended.aftermath.attackerCasualties < 24_000 * 0.25, '多日战役不应一次打光');
});

test('AI 会在边境空虚时派驻驻军', () => {
  const wide = {
    cities: [
      { id: 'a', name: '甲', region: 'north', terrain: 'plain', value: 4 },
      { id: 'b', name: '乙', region: 'north', terrain: 'plain', value: 4 },
      { id: 'c', name: '丙', region: 'north', terrain: 'plain', value: 3 },
      { id: 'd', name: '丁', region: 'north', terrain: 'plain', value: 3 },
    ],
    links: [['a', 'b'], ['b', 'c'], ['c', 'd']],
    units: [
      { id: 'mine', name: '我军', side: 'ccp', city: 'a', strength: 20_000 },
      { id: 'e1', name: '敌军一', side: 'roc', city: 'c', strength: 24_000 },
      { id: 'e2', name: '敌军二', side: 'roc', city: 'c', strength: 24_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['a'], roc: ['b', 'c', 'd'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'a', area: 'north' }],
    events: [],
  };
  const state = engine.createGame(wide, { scenarioId: 's', side: 'ccp', scope: 'national',
    historyMode: 'dynamic', goal: 'all' });
  engine.step(wide, state, 30);
  const garrisoned = state.units.some(unit => unit.garrison === 'b' || (unit.city === 'b' && unit.side === 'roc'));
  assert.ok(garrisoned, 'AI 应派兵驻守边境空城');
});

test('政治点与决议：动员、整军、空运与冷却', () => {
  const state = create();
  state.political.ccp.points = 120;
  const manpower = state.economy.ccp.manpower;
  assert.equal(engine.decide(board, state, 'mobilize').ok, true);
  assert.ok(state.economy.ccp.manpower > manpower);
  assert.equal(engine.decide(board, state, 'mobilize').ok, false, '冷却中应被拒绝');
  assert.equal(engine.decide(board, state, 'reorganize', { city: 'front' }).ok, true);
  assert.equal(engine.decide(board, state, 'airlift', { city: 'front' }).ok, true);
  const leaf = state.units.find(member => member.id === 'main-d1-r1');
  assert.ok(leaf.ammo >= 100);
  state.political.ccp.points = 0;
  assert.equal(engine.decide(board, state, 'reorganize', { city: 'front' }).ok, false, '政治点不足应被拒绝');
  assert.equal(engine.decide(board, state, 'reorganize', { city: 'far' }).ok, false, '不能在敌方城镇整军');
});

test('策反需要接战条件，成功后敌军起义归入本方', () => {
  const state = create();
  state.political.ccp.points = 200;
  const enemy = state.units.find(member => member.id === 'enemy');
  enemy.city = 'far';
  assert.equal(engine.decide(board, state, 'defect', { unitId: 'enemy' }).ok, false, '不接战不能策反');
  enemy.city = 'flank';
  let success = false;
  for (let offset = 0; offset < 40 && !success; offset += 1) {
    state.date = new Date(Date.parse(state.date) + 86_400_000).toISOString().slice(0, 10);
    state.political.ccp.cooldowns = {};
    state.political.ccp.points = 200;
    const result = engine.decide(board, state, 'defect', { unitId: 'enemy' });
    assert.equal(result.ok, true);
    success = result.success;
  }
  assert.ok(success, '多次尝试后应能策反成功');
  assert.equal(state.units.find(member => member.id === 'enemy').side, 'ccp');
  assert.ok(state.log.some(entry => entry.type === 'defect'));
});

test('首都失守且支持度崩溃时停战，1951 年底也会结算', () => {
  const state = create();
  state.capitals.ccp = 'rear';
  state.owners.rear = 'roc';
  state.warSupport.ccp = 20;
  engine.step(board, state, 1);
  assert.equal(state.winner, 'roc');
  assert.equal(state.endReason, 'capitulation');

  const late = engine.createGame(board, { date: '1951-12-30', side: 'ccp', goal: 'all',
    scope: 'national', historyMode: 'dynamic' });
  late.warSupport = { ccp: 60, roc: 60 };
  engine.step(board, late, 3);
  assert.equal(late.endReason, 'timeout');
  assert.equal(late.winner, 'ccp');
});

test('师级编制设计器：编成影响战力、宽度与补给', () => {
  const state = create();
  const base = engine.metadata.unitDesignStats(state, unit(state, 'main'));
  assert.ok(Math.abs(base.attack - 1) < 0.001 && Math.abs(base.defense - 1) < 0.001);
  const made = engine.createDesign(state, { name: '火炮师', infantry: 6, artillery: 5 });
  assert.equal(made.ok, true);
  const stats = engine.metadata.designStats(state, 'ccp', made.design);
  assert.ok(stats.attack > base.attack);
  assert.ok(stats.width > base.width);
  const before = engine.metadata.power([unit(state, 'main')], false, state);
  assert.equal(engine.assignDesign(state, 'main', made.design.id).ok, true);
  assert.equal(unit(state, 'main').design, made.design.id);
  const after = engine.metadata.power([unit(state, 'main')], false, state);
  assert.ok(after > before);
  assert.equal(engine.assignDesign(state, 'enemy', made.design.id).ok, false);
  assert.equal(engine.createDesign(state, { name: '空师', infantry: 0, artillery: 0 }).ok, false);
});

test('装甲营受科研解锁，科研点消耗并提升战力', () => {
  const state = create();
  assert.equal(engine.createDesign(state, { name: '装甲师', infantry: 6, armor: 3 }).ok, false);
  state.research.ccp.points = 240;
  assert.equal(engine.researchTech(state, 'armor').ok, true);
  assert.equal(state.research.ccp.levels.armor, 1);
  assert.ok(state.research.ccp.points < 240);
  const made = engine.createDesign(state, { name: '装甲师', infantry: 6, armor: 3 });
  assert.equal(made.ok, true);
  const stats = engine.metadata.designStats(state, 'ccp', made.design);
  assert.ok(stats.armor > 0);
  assert.ok(stats.piercing > 2);
  const before = engine.metadata.power([unit(state, 'main')], false, state);
  assert.equal(engine.assignDesign(state, 'main', made.design.id).ok, true);
  assert.ok(engine.metadata.power([unit(state, 'main')], false, state) > before);
});

test('空军任务可切换，飞行会累计损失并影响空中支援', () => {
  const state = create();
  const before = state.air.ccp;
  assert.equal(engine.setAirMission(state, 'cas').ok, true);
  assert.equal(state.airWar.ccp.mission, 'cas');
  engine.step(board, state, 3);
  assert.ok(state.airWar.ccp.losses > 0);
  assert.ok(state.airWar.ccp.planes > 0);
  assert.equal(engine.setAirMission(state, 'nope').ok, false);
  assert.ok(typeof state.air.ccp === 'number');
  assert.ok(before >= 0);
});

test('指挥技能消耗指挥点，强行军缩短行军、死守加强防守', () => {
  const plain = create();
  const buffed = create();
  assert.equal(engine.commandAbility(board, buffed, 'forcedMarch', { unitId: 'main' }).ok, true);
  assert.ok(buffed.command.ccp.points < plain.command.ccp.points);
  assert.equal(engine.order(board, plain, 'main', 'move', 'hub').ok, true);
  assert.equal(engine.order(board, buffed, 'main', 'move', 'hub').ok, true);
  assert.ok(unit(buffed, 'main').orderDays <= unit(plain, 'main').orderDays);
  const leaf = buffed.units.find(member => member.id === 'main-d1-r1');
  const defenseBefore = engine.metadata.power([leaf], true, plain);
  assert.equal(engine.commandAbility(board, plain, 'lastStand', { unitId: 'main' }).ok, true);
  assert.ok(engine.metadata.power([leaf], true, plain) > defenseBefore);
});

test('将领经验与特质提升所辖部队战力', () => {
  const state = create();
  unit(state, 'main').leader = 'general';
  const leaf = state.units.find(member => member.id === 'main-d1-r1');
  const before = engine.metadata.power([leaf], false, state);
  state.leadersXp.general = { xp: 480 };
  assert.ok(engine.metadata.power([leaf], false, state) > before);
});

test('国策按天推进并在完成后生效', () => {
  const state = create();
  const before = state.economy.ccp.manpower;
  assert.equal(engine.startFocus(state, 'land-reform').ok, true);
  engine.step(board, state, 31);
  assert.equal(state.focus.ccp.done.includes('land-reform'), true);
  assert.ok(state.economy.ccp.manpower > before);
  assert.equal(engine.startFocus(state, 'arsenal').ok, false, '前置国策未完成');
});

test('生产线分配产能后装备储备增长', () => {
  const state = create();
  const before = state.stock.ccp.infantry;
  assert.equal(engine.setProduction(state, { infantry: 60, artillery: 20 }).ok, true);
  engine.step(board, state, 5);
  assert.ok(state.stock.ccp.infantry > before);
  assert.equal(engine.setProduction(state, { infantry: 0, artillery: 0, armor: 0, air: 0, naval: 0 }).ok, false);
});

test('渡海登陆需要运输船，登陆后消耗运输能力', () => {
  const seaBoard = {
    cities: [
      { id: 'mainland', name: '大陆港', region: 'east', terrain: 'port', value: 5 },
      { id: 'island', name: '海岛', region: 'taiwan', terrain: 'port', value: 4 },
    ],
    links: [['mainland', 'island']],
    routeTypes: { 'island|mainland': 'maritime' },
    units: [
      { id: 'army', name: '登陆军', side: 'ccp', city: 'mainland', strength: 12_000 },
      { id: 'garrison', name: '守军', side: 'roc', city: 'island', strength: 3_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['mainland'], roc: ['island'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'mainland', area: 'east' }],
    events: [],
  };
  const state = engine.createGame(seaBoard, { scenarioId: 's', side: 'ccp', scope: 'national',
    historyMode: 'dynamic', goal: 'all' });
  state.navy.ccp.transports = 0;
  assert.equal(engine.order(seaBoard, state, 'army', 'advance', 'island').ok, false);
  state.navy.ccp.transports = 24;
  assert.equal(engine.order(seaBoard, state, 'army', 'advance', 'island').ok, true);
  engine.step(seaBoard, state, 24);
  assert.equal(state.owners.island, 'ccp');
  assert.ok(state.navy.ccp.transports < 24);
});

test('占领抵抗会累积并在无人驻守时引发反抗', () => {
  const state = create();
  state.owners.front = 'roc';
  state.occupation.front = { resistance: 99, compliance: 0 };
  engine.step(board, state, 3);
  assert.equal(state.owners.front, 'ccp');
  assert.ok(state.log.some(entry => entry.type === 'revolt' && entry.city === 'front'));
});

test('情报、外交与法令消耗资源并生效', () => {
  const state = create();
  const intel = state.intel.ccp.level;
  assert.equal(engine.intelOperation(state, 'recon').ok, true);
  assert.ok(state.intel.ccp.level > intel);
  state.political.ccp.points = 120;
  assert.equal(engine.setLaw(state, 'conscription', 'limited').ok, true);
  assert.equal(state.laws.ccp.conscription, 'limited');
  assert.equal(engine.setLaw(state, 'conscription', 'bogus').ok, false);
  const stock = state.stock.ccp.infantry;
  assert.equal(engine.diplomacyAction(state, 'aid').ok, true);
  assert.ok(state.stock.ccp.infantry > stock);
});

test('低战争支持时可以提议停战并停止推演', () => {
  const state = create();
  state.political.ccp.points = 120;
  state.warSupport.ccp = 30;
  state.warSupport.roc = 30;
  assert.equal(engine.diplomacyAction(state, 'ceasefire').ok, true);
  assert.equal(state.ceasefire, true);
  const date = state.date;
  engine.step(board, state, 2);
  assert.equal(state.date, date);
});

test('旧存档缺少海域字段时，全国推进仍能重建舰队状态并计算 AI 战线', () => {
  const state = create({ side: 'roc' });
  delete state.seaZones;
  for (const side of ['ccp', 'roc']) delete state.navy[side].zones;

  assert.doesNotThrow(() => engine.step(board, state, 1));
  assert.ok(state.seaZones);
  assert.ok(state.navy.ccp.zones);
  assert.ok(Array.isArray(state.aiFronts.ccp));
});

test('AI 自动战线计划会约束进攻方向，避免绕开计划目标抢攻弱点', () => {
  const data = {
    cities: [
      { id: 'base', name: '前沿基地', region: 'north', terrain: 'plain', value: 4 },
      { id: 'objective', name: '计划目标', region: 'north', terrain: 'plain', value: 8 },
      { id: 'weak', name: '薄弱侧翼', region: 'north', terrain: 'plain', value: 2 },
    ],
    links: [['base', 'objective'], ['base', 'weak']],
    routeTypes: { 'base|objective': 'land', 'base|weak': 'land' },
    units: [
      { id: 'ai-force', name: '自动战线部队', side: 'roc', city: 'base', strength: 60_000 },
      { id: 'objective-guard', name: '目标守军', side: 'ccp', city: 'objective', strength: 54_000 },
      { id: 'weak-guard', name: '侧翼守军', side: 'ccp', city: 'weak', strength: 1_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['objective', 'weak'], roc: ['base'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'base', area: 'north' }],
    events: [],
  };
  const state = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
  engine.step(data, state, 7);
  const plan = state.plans.find(item => item.side === 'roc' && item.aiGenerated && item.status === 'active');
  const force = state.units.find(unit => unit.id === 'ai-force');
  assert.ok(plan);
  assert.equal(plan.target, 'objective');
  assert.ok(force.order, 'AI 应按计划保持进攻或集结命令');
  assert.notEqual(force.order.target, 'weak', '弱侧翼不应绕开自动战线计划成为进攻目标');
});

test('AI 空军会轰炸范围内的敌方工业节点并留下战报', () => {
  const data = {
    cities: [
      { id: 'roc-base', name: '空军基地', region: 'north', lon: 120, lat: 31, terrain: 'plain', value: 6 },
      { id: 'ccp-hub', name: '敌方枢纽', region: 'north', lon: 121, lat: 31, terrain: 'rail', value: 8 },
    ],
    links: [], routeTypes: {},
    units: [
      { id: 'roc-garrison', name: '基地守军', side: 'roc', city: 'roc-base', strength: 20_000 },
      { id: 'ccp-garrison', name: '枢纽守军', side: 'ccp', city: 'ccp-hub', strength: 20_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['ccp-hub'], roc: ['roc-base'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'ccp-hub', area: 'north' }],
    events: [],
  };
  const state = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
  const control = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
  state.airWar.roc.planes = 300;
  control.airWar.roc.planes = 0;
  engine.step(data, state, 12);
  engine.step(data, control, 12);
  assert.ok(state.log.some(entry => entry.type === 'air-strike' && entry.action === 'strategic-bombing'));
  assert.ok(state.economy.ccp.treasury < control.economy.ccp.treasury,
    '轰炸应降低敌方经济储备：' + state.economy.ccp.treasury + ' / ' + control.economy.ccp.treasury);
});

test('AI 会为被合围且补给不足的守军转入空投补给', () => {
  const data = {
    cities: [
      { id: 'pocket', name: '孤立据点', region: 'north', terrain: 'plain', value: 3 },
      { id: 'west', name: '西侧敌城', region: 'north', terrain: 'plain', value: 2 },
      { id: 'east', name: '东侧敌城', region: 'north', terrain: 'plain', value: 2 },
    ],
    links: [['pocket', 'west'], ['pocket', 'east']],
    routeTypes: { 'pocket|west': 'land', 'east|pocket': 'land' },
    units: [
      { id: 'isolated', name: '孤立守军', side: 'roc', city: 'pocket', strength: 10_000 },
      { id: 'west-army', name: '西侧围军', side: 'ccp', city: 'west', strength: 8_000 },
      { id: 'east-army', name: '东侧围军', side: 'ccp', city: 'east', strength: 8_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['west', 'east'], roc: ['pocket'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'pocket', area: 'north' }],
    events: [],
  };
  const state = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
  const control = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
  for (const current of [state, control]) {
    for (const unit of current.units.filter(member => member.side === 'roc')) {
      unit.ammo = 15;
      unit.fuel = 15;
      unit.food = 15;
    }
  }
  state.airWar.roc.planes = 120;
  control.airWar.roc.planes = 0;
  engine.step(data, state, 1);
  engine.step(data, control, 1);
  assert.equal(state.airWar.roc.mission, 'airdrop');
  assert.ok(engine.supplyReading(data, state).coverage.roc.pocket
    > engine.supplyReading(data, control).coverage.roc.pocket, '空投任务应提高被围守军的补给覆盖');
});

test('旧版与新版舰队存档字段双向迁移时保留海域任务', () => {
  const legacy = create();
  legacy.seaZones = {};
  legacy.navy.ccp.zones = { 黄海: { mission: 'invasion', assigned: 12 } };
  engine.step(board, legacy, 0);
  assert.equal(legacy.seaZones['黄海'].ccp.mission, 'invasion');

  const current = create();
  current.navy.ccp.zones = {};
  current.seaZones = { 黄海: { ccp: { mission: 'patrol', strength: 20 } } };
  engine.step(board, current, 0);
  assert.equal(current.navy.ccp.zones['黄海'].mission, 'patrol');
});

test('海军任务可以撤销，并同步清除两种存档结构', () => {
  const state = create();
  state.navy.ccp.warships = 20;
  state.player = 'ccp';
  assert.equal(engine.setNavalMission(state, '黄海', 'patrol').ok, true);
  assert.equal(engine.setNavalMission(state, '黄海', '').ok, true);
  assert.equal(state.navy.ccp.zones['黄海'], undefined);
  assert.equal(state.seaZones['黄海']?.ccp, undefined);
});

test('玩家控制的破交与护航任务会改变海运补给能力', () => {
  const raider = create();
  raider.navy.ccp.warships = 30;
  raider.navy.ccp.transports = 24;
  assert.equal(engine.setNavalMission(raider, '黄海', 'raid').ok, true);
  const enemyConvoys = raider.convoy.roc;
  engine.step(board, raider, 1);
  assert.ok(raider.convoy.roc < enemyConvoys);

  const escort = create();
  escort.navy.ccp.warships = 30;
  escort.navy.ccp.transports = 24;
  escort.convoy.ccp = 0.5;
  assert.equal(engine.setNavalMission(escort, '黄海', 'escort').ok, true);
  engine.step(board, escort, 1);
  assert.ok(escort.convoy.ccp > 0.5);
});

test('登陆准备会抵消两栖进攻惩罚并提升准备充分的登陆战', () => {
  const seaBoard = {
    cities: [
      { id: 'mainland', name: '大陆港', lon: 120, lat: 30, region: 'east', terrain: 'port', value: 5 },
      { id: 'island', name: '海岛', lon: 121, lat: 30, region: 'taiwan', terrain: 'port', value: 4 },
    ], links: [['mainland', 'island']], routeTypes: { 'island|mainland': 'maritime' },
    units: [
      { id: 'army', name: '登陆军', side: 'ccp', city: 'mainland', strength: 18_000 },
      { id: 'garrison', name: '守军', side: 'roc', city: 'island', strength: 18_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['mainland'], roc: ['island'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'mainland', area: 'east' }], events: [],
  };
  const ratio = (prepared) => {
    const state = engine.createGame(seaBoard, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
    state.navy.ccp.transports = 24;
    state.navy.ccp.warships = 24;
    if (prepared) {
      assert.equal(engine.setNavalMission(state, '黄海', 'invasion').ok, true);
      state.navy.ccp.invasion = 1;
    }
    assert.equal(engine.order(seaBoard, state, 'army', 'advance', 'island').ok, true);
    for (const member of state.units.filter(member => member.id === 'army' || member.id.startsWith('army-'))) {
      member.orderDays = 0;
    }
    engine.step(seaBoard, state, 1);
    return state.battles.island.lastRatio;
  };

  assert.ok(ratio(true) > ratio(false));
});

test('AI 在海军登陆准备与制海优势成立时能建立登陆计划', () => {
  const seaBoard = {
    cities: [
      { id: 'mainland', name: '大陆港', region: 'east', terrain: 'port', value: 5 },
      { id: 'island', name: '海岛', region: 'taiwan', terrain: 'port', value: 4 },
    ],
    links: [['mainland', 'island']],
    routeTypes: { 'island|mainland': 'maritime' },
    units: [
      { id: 'army', name: '登陆军', side: 'ccp', city: 'mainland', strength: 12_000 },
      { id: 'garrison', name: '守军', side: 'roc', city: 'island', strength: 3_000 },
    ],
    anchors: [{ date: '1947-01-01', ccp: ['mainland'], roc: ['island'] }],
    scenarios: [{ id: 's', date: '1947-01-01', focus: 'mainland', area: 'east' }],
    events: [],
  };
  const state = engine.createGame(seaBoard, { scenarioId: 's', side: 'roc', scope: 'national',
    historyMode: 'dynamic', goal: 'all' });
  state.navy.ccp.transports = 24;
  state.navy.ccp.warships = 24;
  state.navy.ccp.zones['黄海'] = { mission: 'invasion', assigned: 12 };
  state.seaZones['黄海'] = { ccp: { mission: 'invasion', strength: 36 } };

  assert.doesNotThrow(() => engine.step(seaBoard, state, 1));
  assert.ok(state.plans.some(plan => plan.side === 'ccp' && plan.aiGenerated && plan.invasion));
  assert.equal(state.units.find(member => member.id === 'army').order.target, 'island');
});

test('无效的对日援助请求不会扣除政治点或增加冷却', () => {
  const state = create();
  state.political.ccp.points = 100;
  const result = engine.foreignAction(state, 'japan', 'request-aid');
  assert.equal(result.ok, false);
  assert.equal(state.political.ccp.points, 100);
  assert.equal(state.foreignActionCooldowns.ccp['japan:request-aid'], undefined);
});

test('未签租借条约时援助请求不扣除政治点或进入冷却', () => {
  const state = create();
  state.political.ccp.points = 100;
  state.treaties.ccp.lendLease = false;
  const result = engine.foreignAction(state, 'ussr', 'lend-lease');
  assert.equal(result.ok, false);
  assert.equal(state.political.ccp.points, 100);
  assert.equal(state.foreignActionCooldowns.ccp['ussr:lend-lease'], undefined);
});

test('美国、苏联与东北日械影响按战后阶段和城镇控制变化', () => {
  const data = {
    cities: [
      { id: 'nanjing', name: '南京', region: 'east', terrain: 'plain', value: 8 },
      { id: 'harbin', name: '哈尔滨', region: 'northeast', terrain: 'plain', value: 5 },
    ],
    links: [['nanjing', 'harbin']],
    routeTypes: { 'harbin|nanjing': 'land' },
    units: [],
    anchors: [{ date: '1945-08-01', ccp: ['harbin'], roc: ['nanjing'] }],
    scenarios: [{ id: 's', date: '1945-08-01', focus: 'harbin', area: 'northeast' }],
    events: [],
  };
  const make = date => engine.createGame(data, { date, scenarioId: 's', side: 'ccp', historyMode: 'dynamic' });
  const early = make('1945-08-14');
  const earlyStock = early.stock.ccp.infantry;
  engine.step(data, early, 1);
  assert.equal(early.date, '1945-08-15');
  assert.ok(early.foreign.ussr.support > 0, '苏联影响应在东北阶段出现');
  assert.ok(early.foreign.japan.stock > 0, '日本投降后遗留装备应进入早期库存');
  assert.ok(early.stock.ccp.infantry > earlyStock);

  const american = make('1945-12-31');
  engine.step(data, american, 1);
  assert.equal(american.date, '1946-01-01');
  assert.ok(american.foreign.usa.support > 0, '美国援助应从战后援助阶段开始');

  const late = make('1948-12-31');
  late.foreign.usa.support = 0.5;
  late.foreign.ussr.support = 0.4;
  late.foreign.japan.stock = 50;
  engine.step(data, late, 1);
  assert.equal(late.foreign.usa.support, 0.49, '1949 年后美国援助强度应开始回落');
  assert.equal(late.foreign.ussr.support, 0.388);
  assert.equal(late.foreign.japan.stock, 50, '日本遗留装备不应继续增加');
});

test('高程网格会提高山地守军在战斗中的地形优势', () => {
  const makeBoard = (elevation, targetLongitude = 121) => {
    const samples = Buffer.alloc(8);
    for (let offset = 0; offset < 4; offset += 1) samples.writeInt16LE(elevation, offset * 2);
    return {
      cities: [
        { id: 'a', name: '进攻出发地', lon: 120, lat: 31, region: 'north', terrain: 'plain', value: 4 },
        { id: 'b', name: '山地守点', lon: targetLongitude, lat: 31, region: 'north', terrain: 'plain', value: 4 },
      ],
      links: [['a', 'b']], routeTypes: { 'a|b': 'land' }, geography: { grids: [
        { west: 120, north: 31, step: 1, width: 2, height: 2, samples: samples.toString('base64') },
      ] },
      units: [
        { id: 'attacker', name: '攻方', side: 'ccp', city: 'a', strength: 18_000 },
        { id: 'defender', name: '守方', side: 'roc', city: 'b', strength: 18_000 },
      ],
      anchors: [{ date: '1947-01-01', ccp: ['a'], roc: ['b'] }],
      scenarios: [{ id: 's', date: '1947-01-01', focus: 'a', area: 'north' }], events: [],
    };
  };
  const firstBattleRecord = (data) => {
    const state = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
    assert.equal(engine.order(data, state, 'attacker', 'advance', 'b').ok, true);
    for (const member of state.units.filter(member => member.id === 'attacker' || member.id.startsWith('attacker-'))) {
      member.orderDays = 0;
    }
    for (let day = 0; day < 20; day += 1) {
      engine.step(data, state, 1);
      if (state.battles?.b) return { ...state.battles.b, log: state.log };
    }
    assert.fail('未能启动战斗');
  };

  const plain = firstBattleRecord(makeBoard(0));
  const mountain = firstBattleRecord(makeBoard(3200));
  assert.ok(plain.lastRatio > mountain.lastRatio);
  const movementDays = elevation => {
    const data = makeBoard(elevation);
    const state = engine.createGame(data, { scenarioId: 's', side: 'ccp', historyMode: 'dynamic', goal: 'all' });
    const preview = engine.previewOrder(data, state, 'attacker', 'advance', 'b');
    assert.equal(preview.ok, true);
    return preview.days;
  };
  assert.ok(movementDays(3200) > movementDays(0), '高程网格应增加山地行军时间');
  assert.equal(plain.log.find(entry => entry.type === 'battle-start')?.period, plain.period);
  const night = firstBattleRecord(makeBoard(0, 121));
  const day = firstBattleRecord(makeBoard(0, 60));
  assert.equal(night.period, '夜战');
  assert.equal(day.period, '昼战');
  assert.ok(day.lastRatio > night.lastRatio, '夜战应让进攻方的战斗比率略低');
});

test('战斗阶段按日期和经度确定昼夜，并稳定复现夜战标签', () => {
  const city = { id: 'night-test', lon: 121, lat: 31 };
  const dates = Array.from({ length: 8 }, (_, day) => new Date(Date.UTC(1947, 0, day + 1)).toISOString().slice(0, 10));
  const periods = dates.map(date => engine.metadata.battlePeriod(date, city));
  assert.ok(periods.includes('夜战'));
  assert.ok(periods.includes('昼战'));
  assert.equal(engine.metadata.battlePeriod(dates[0], city), engine.metadata.battlePeriod(dates[0], city));
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
