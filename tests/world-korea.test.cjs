'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

require('../world-map.js');
require('../korean-war-data.js');
require('../human-3d.js');

const World = globalThis.CivilWarWorld;
const Korea = globalThis.KoreanWarData;
const Human3D = globalThis.CivilWarHuman3D;

test('世界势力与地形图模块包含完整各大洲、冷战阵营与地形特征', () => {
  assert.ok(World.continents.length >= 10);
  assert.ok(World.nations.some(n => n.id === 'ussr' && n.bloc === 'socialist'));
  assert.ok(World.nations.some(n => n.id === 'usa' && n.bloc === 'western'));
  assert.ok(World.nations.some(n => n.id === 'korea' && n.clickableKorea));
  assert.ok(World.terrainFeatures.length >= 10);
});

test('抗美援朝朝鲜战争数据包含 5 大参战力量、航母/喷气机/坦克/火炮与 5 大剧本', () => {
  assert.deepEqual(Object.keys(Korea.factions).sort(), ['commonwealth', 'kpa', 'pva', 'rok', 'usa']);
  assert.ok(Korea.factions.pva.arsenal.aircraft.some(a => a.modelKind === 'jet' && a.name.includes('米格-15')));
  assert.ok(Korea.factions.usa.arsenal.navy.some(s => s.modelKind === 'carrier' && s.name.includes('埃塞克斯')));
  assert.ok(Korea.factions.usa.arsenal.aircraft.some(a => a.modelKind === 'jet' && a.name.includes('F-86')));
  assert.equal(Korea.scenarios.length, 5);
  assert.ok(Korea.cities.length >= 16);
});

test('新增 3D 航空母舰 (carrier) 与喷气战机 (jet) 网格完整无 NaN', () => {
  for (const kind of ['carrier', 'jet']) {
    const mesh = Human3D.createMesh(kind);
    assert.ok(mesh.positions.length > 60, `${kind} 应包含足够顶点`);
    assert.ok(mesh.positions.every(Number.isFinite), `${kind} 顶点不应有 NaN`);
  }
});
