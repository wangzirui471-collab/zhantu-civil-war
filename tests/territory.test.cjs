const assert = require('node:assert/strict');
const { test } = require('node:test');
require('../map.js');
require('../engine.js');
require('../data.js');
const { territoryNodes, nearestTerritory } = globalThis.CivilWarMap;

test('势力范围按城镇归属变化，敌方驻军不会被当作占领派系', () => {
  const data = { cities: [{id:'a',lon:100,lat:30},{id:'b',lon:101,lat:30}] };
  const state = { owners: {a:'ccp',b:'roc'}, units:[
    {city:'b',side:'ccp',group:'dongye',strength:40000},
    {city:'b',side:'roc',group:'guixi',strength:10000},
  ] };
  let nodes = territoryNodes(data, state, true);
  assert.equal(nearestTerritory(100, 30, nodes).owner, 'ccp');
  assert.equal(nearestTerritory(101, 30, nodes).group, 'guixi');
  assert.equal(nearestTerritory(120, 40, nodes), null);
  state.owners.a = 'roc';
  nodes = territoryNodes(data, state, true);
  assert.equal(nearestTerritory(100, 30, nodes).owner, 'roc');
});

test('全面内战开局为1946年6月26日，旧1945和辽沈剧本仍可进入', () => {
  const data = globalThis.CivilWarData, engine = globalThis.CivilWarEngine;
  const state = engine.createGame(data, {scenarioId:'war1946',scope:'national',side:'ccp',historyMode:'dynamic'});
  assert.equal(state.date, '1946-06-26');
  assert.equal(state.scope, 'national');
  assert.equal(state.owners.xuanhuadian, 'ccp');
  assert.ok(state.units.some(unit => unit.id === 'central-area' && unit.strength > 0));
  assert.ok(data.scenarios.some(item => item.id === 'full' && item.date === '1945-08-15'));
  assert.ok(data.scenarios.some(item => item.id === 'liaoshen' && item.date === '1948-09-12'));
});
