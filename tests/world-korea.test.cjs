'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

require('../world-map.js');
require('../korean-war-data.js');
require('../human-3d.js');
require('../data.js');
require('../engine.js');

const World = globalThis.CivilWarWorld;
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
