'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

require('../world-map.js');
require('../ww2-data.js');
require('../korean-war-data.js');
require('../human-3d.js');
require('../data.js');
require('../engine.js');

const World = globalThis.CivilWarWorld;
const WW2 = globalThis.WW2Data;
const Korea = globalThis.KoreanWarData;
const Human3D = globalThis.CivilWarHuman3D;
const Data = globalThis.CivilWarData;
const Engine = globalThis.CivilWarEngine;

test('世界势力与地形图模块包含完整各大洲、冷战阵营与地形特征', () => {
  assert.ok(World.continents.length >= 10);
  assert.ok(World.nations.some(n => n.id === 'ussr' && n.bloc === 'socialist'));
  assert.ok(World.nations.some(n => n.id === 'usa' && n.bloc === 'western'));
  assert.ok(World.nations.some(n => n.id === 'korea' && n.clickableKorea));
  assert.ok(World.terrainFeatures.length >= 10);
});

test('抗美援朝朝鲜战争数据包含 6 大参战与支援力量（含苏联第64航空军）及 5 大剧本', () => {
  assert.deepEqual(Object.keys(Korea.factions).sort(), ['commonwealth', 'kpa', 'pva', 'rok', 'usa', 'ussr']);
  assert.ok(Korea.factions.pva.arsenal.aircraft.some(a => a.modelKind === 'jet' && a.name.includes('米格-15')));
  assert.ok(Korea.factions.ussr.arsenal.aircraft.some(a => a.modelKind === 'mig15'));
  assert.ok(Korea.factions.usa.arsenal.navy.some(s => s.modelKind === 'carrier' && s.name.includes('埃塞克斯')));
  assert.equal(Korea.scenarios.length, 5);
  assert.ok(Korea.cities.length >= 16);
});

test('全部 8 款朝鲜战争精细 3D 装备模型（航母/战列舰/米格15/F86/B29/T34/潘兴/喀秋莎）网格完整无 NaN', () => {
  for (const kind of ['carrier', 'battleship', 'mig15', 'f86', 'b29', 't34', 'm26', 'katyusha']) {
    const mesh = Human3D.createMesh(kind);
    assert.ok(mesh.positions.length > 100, `${kind} 应包含足够精细顶点`);
    assert.ok(mesh.positions.every(Number.isFinite), `${kind} 顶点不应有 NaN`);
  }
});

test('共方/志愿军可调用苏联米格-15 机群、喀秋莎火箭炮齐射与苏械步炮坦换装', () => {
  const state = Engine.createGame(Data, { scenarioId: 'liaoshen', side: 'ccp', historyMode: 'dynamic' });
  state.political.ccp.points = 100;
  state.command.ccp.points = 50;
  const planesBefore = state.airWar.ccp.planes;
  assert.equal(Engine.callSovietSupport(Data, state, 'mig_corridor').ok, true);
  assert.equal(state.airWar.ccp.planes, planesBefore + 18);

  const enemyCity = Data.cities.find(c => state.owners[c.id] === 'roc')?.id;
  assert.equal(Engine.callSovietSupport(Data, state, 'katyusha_salvo', enemyCity).ok, true);

  const armorBefore = state.stock.ccp.armor;
  assert.equal(Engine.callSovietSupport(Data, state, 'soviet_armor_aid').ok, true);
  assert.equal(state.stock.ccp.armor, armorBefore + 35);
});

test('二战全球战役数据完整包含美/苏/英/法/日/德/中七大阵营全兵种武器与 8 大历史剧本', () => {
  assert.deepEqual(Object.keys(WW2.factions).sort(), ['china', 'france', 'germany', 'japan', 'uk', 'usa', 'ussr']);
  assert.equal(WW2.scenarios.length, 8);
  assert.ok(WW2.cities.length >= 50);
  assert.ok(WW2.routes.length >= 70);
  for (const fac of Object.values(WW2.factions)) {
    assert.ok(fac.arsenal.infantryWeapons.length >= 3, `${fac.id} 步兵武器`);
    assert.ok(fac.arsenal.artillery.length >= 2, `${fac.id} 火炮`);
    assert.ok(fac.arsenal.tanks.length >= 3, `${fac.id} 坦克`);
    assert.ok(fac.arsenal.aircraft.length >= 2, `${fac.id} 飞机`);
    // 中国抗日战区海军基本为空白，只保留 1 项内河/布雷编制。
    assert.ok(fac.arsenal.navy.length >= (fac.id === 'china' ? 1 : 2), `${fac.id} 海军`);
    assert.ok(fac.corps.length >= 4, `${fac.id} 集团军编制`);
  }
});

test('新增 6 款二战精细 3D 装备模型（大和号/零战/喷火/谢尔曼/夏尔B1/虎式）网格完整无 NaN', () => {
  for (const kind of ['yamato', 'zero', 'spitfire', 'sherman', 'charb1', 'tiger']) {
    const mesh = Human3D.createMesh(kind);
    assert.ok(mesh.positions.length > 100, `${kind} 应包含足够精细顶点`);
    assert.ok(mesh.positions.every(Number.isFinite), `${kind} 顶点不应有 NaN`);
  }
});

test('HOI4 二战全球沙盘引擎：选国开局、焦点国策、编组新军、租借法案与 30 天多国交战推演无报错', () => {
  const Sim = World.WW2Sim;
  for (const sc of WW2.scenarios) {
    const st = Sim.createWW2Game(WW2, sc.id, 'usa');
    assert.equal(st.scenarioId, sc.id);
    assert.ok(st.armies.length >= 24);
  }
  const st = Sim.createWW2Game(WW2, 'ww2-1941-barbarossa', 'usa');
  assert.equal(Sim.startWW2Focus(st, 'usa', 'us_arsenal').ok, true);
  assert.equal(Sim.recruitWW2Division(WW2, st, 'usa', 'washington', 'armor').ok, true);
  assert.equal(Sim.lendLeaseWW2(WW2, st, 'usa', 'ussr').ok, true);
  Sim.stepWW2Day(WW2, st, 30);
  assert.equal(st.dayCount, 30);
  assert.ok(st.nations.usa.completedFocuses.includes('us_arsenal'), '25 天国策应在 30 天内自动完成');
  assert.ok(st.armies.every(a => Number.isFinite(a.strength) && Number.isFinite(a.org)));

  // 校验四大战场宣战隔离与零友军互抢
  const cn = Sim.createWW2Game(WW2, 'ww2-1938-china', 'china');
  Sim.stepWW2Day(WW2, cn, 60);
  assert.equal(cn.log.some(l => l.includes('原属 法国') || l.includes('原属 英国') || l.includes('原属 苏联')), false, '1938 中国战场剧本不应出现欧洲/苏联提前互打');
  assert.equal(cn.log.some(l => /(?:🚩|大捷！)\s*(中国|日本)[^\n]*原属 \1/.test(l)), false, '绝不允许自攻自城或友军互抢');
});
