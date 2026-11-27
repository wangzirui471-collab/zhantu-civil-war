'use strict';
const assert = require('node:assert/strict');
require('../data.js');
require('../engine.js');
const D = globalThis.CivilWarData, E = globalThis.CivilWarEngine;
const rounds = Number(process.env.PLAYTEST_ROUNDS || 100), days = Number(process.env.PLAYTEST_DAYS || 14);
const initialSeed = Number(process.env.PLAYTEST_SEED || 20261127) >>> 0;
let random = initialSeed;
const pick = (array) => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return array[random % array.length]; };
const results = [], failures = [];
for (let i = 0; i < rounds; i++) {
  const scenario = D.scenarios[i % D.scenarios.length], side = Math.floor(i / D.scenarios.length) % 2 ? 'roc' : 'ccp';
  const difficulty = ['normal', 'hard', 'devil'][(i + Math.floor(i / D.scenarios.length)) % 3];
  try {
    const state = E.createGame(D, { scenarioId: scenario.id, side, difficulty, historyMode: i % 2 ? 'historical' : 'dynamic' });
    assert.equal(state.scenarioId, scenario.id); assert(state.units.some(u => u.side === side && !u.inactive));
    let orders = 0, attacks = 0, moves = 0;
    for (let day = 0; day < days && !state.winner && !state.ceasefire; day++) {
      if (day % 3 === 0) {
        const roots = E.activeUnits(state).filter(u => u.side === side && !u.parent && u.strength > 0);
        const shuffled = [...roots];
        for (let attempt = 0; attempt < Math.min(15, shuffled.length); attempt++) {
          const unit = pick(shuffled); const links = D.links.filter(pair => pair.includes(unit.city)).map(pair => pair[0] === unit.city ? pair[1] : pair[0]);
          if (!links.length) continue;
          const enemy = links.filter(city => state.owners[city] !== side), friendly = links.filter(city => state.owners[city] === side);
          const options = enemy.length && (i + day) % 3 !== 0 ? enemy : friendly;
          if (!options.length) continue;
          const target = pick(options), type = state.owners[target] === side ? 'move' : 'advance';
          const action = E.order(D, state, unit.id, type, target);
          if (action.ok) { orders++; if(type==='advance') attacks++; else moves++; break; }
        }
      }
      if(day===0) assert(E.setAirMission(state,pick(['superiority','cas','interdiction','airdrop'])).ok);
      if(day===1) E.setNavalMission(state,'黄海',pick(['patrol','escort','raid']));
      E.step(D,state,1);
      assert(/^\d{4}-\d\d-\d\d$/.test(state.date));
      assert(D.cities.every(city => ['ccp','roc'].includes(state.owners[city.id])));
      for (const u of E.activeUnits(state)) {
        assert(Number.isFinite(u.strength) && u.strength >= 0, 'invalid troop strength '+u.id);
        assert(Number.isFinite(u.food) && u.food >= 0 && u.food <= 100, 'invalid food '+u.id);
      }
      for (const camp of ['ccp','roc']) for(const key of ['food','arms','manpower'])
        assert(Number.isFinite(state.economy[camp][key]) && state.economy[camp][key]>=0, `invalid ${camp}.${key}`);
    }
    results.push({round:i+1,scenario:scenario.id,side,difficulty,days:Math.round((Date.parse(state.date)-Date.parse(scenario.date))/86400000),orders,attacks,moves,winner:state.winner||null});
  } catch(error) { failures.push({round:i+1,scenario:scenario.id,side,difficulty,error:error.stack}); }
}
console.log(JSON.stringify({seed:initialSeed,requested:rounds,completed:results.length,failures,daysPerGame:days,totalOrders:results.reduce((n,r)=>n+r.orders,0),totalAttacks:results.reduce((n,r)=>n+r.attacks,0),totalMoves:results.reduce((n,r)=>n+r.moves,0),byScenario:Object.fromEntries(D.scenarios.map(s=>[s.id,results.filter(r=>r.scenario===s.id).length])),results}, null, 2));
if(failures.length || results.length!==rounds)process.exitCode=1;
