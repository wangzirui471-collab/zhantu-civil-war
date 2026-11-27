const assert = require('node:assert/strict');
const { test } = require('node:test');

const Human3D = require('../human-3d.js');

test('兵力与重装备按统帅指定比例换算：5000人/兵、5坦克/标、3飞机/标、1舰/标', () => {
  assert.equal(Human3D.iconCount(0), 0);
  assert.equal(Human3D.iconCount(1), 1);
  assert.equal(Human3D.iconCount(5_000), 1);
  assert.equal(Human3D.iconCount(5_001), 2);
  assert.equal(Human3D.iconCount(25_000), 5);

  assert.equal(Human3D.tankIcons(0), 0);
  assert.equal(Human3D.tankIcons(1), 1);
  assert.equal(Human3D.tankIcons(5), 1);
  assert.equal(Human3D.tankIcons(6), 2);
  assert.equal(Human3D.regimentCount(10), 2);

  assert.equal(Human3D.airIcons(0), 0);
  assert.equal(Human3D.airIcons(3), 1);
  assert.equal(Human3D.airIcons(7), 3);
  assert.equal(Human3D.airRegiments(9), 3);

  const totals = Human3D.troopTotals([
    { id: 'nw3', side: 'ccp', city: 'yixian', strength: 18_000 },
    { id: 'nw3-d1', parent: 'nw3', side: 'ccp', city: 'yixian', strength: 9_000 },
    { id: 'nw3-d2', parent: 'nw3', side: 'ccp', city: 'yixian', strength: 9_000 },
    { id: 'r1', side: 'roc', city: 'yixian', strength: 5_000 },
  ]);
  assert.equal(totals.get('yixian|ccp'), 18_000);
  assert.equal(totals.get('yixian|roc'), 5_000);
});

test('海军舰艇按 1:1 精确换算舰队与海域图标', () => {
  const idle = Human3D.fleetIcons({ warships: 3, zones: {} });
  assert.equal(idle.total, 3);
  assert.equal(idle.reserve, 3);
  assert.equal(idle.zones.size, 0);

  const deployed = Human3D.fleetIcons({
    warships: 4,
    zones: {
      黄海: { mission: 'raid', strength: 3 },
      台湾海峡: { mission: 'patrol', strength: 1 },
    },
  });
  assert.equal(deployed.reserve, 0);
  assert.equal(deployed.zones.get('黄海') + deployed.zones.get('台湾海峡'), 4);
});

test('同城纵队分别计算兵模，分驻两地的下属不重复算入驻地', () => {
  const local = Human3D.formationStrengthByCity([
    { id: 'a', city: 'jinzhou', strength: 15000 },
    { id: 'a1', parent: 'a', city: 'jinzhou', strength: 10000 },
    { id: 'a2', parent: 'a', city: 'tashan', strength: 5000 },
    { id: 'b', city: 'jinzhou', strength: 5000 },
  ]);
  assert.equal(Human3D.iconCount(local.get('a|jinzhou')), 2);
  assert.equal(Human3D.iconCount(local.get('a|tashan')), 1);
  assert.equal(Human3D.iconCount(local.get('b|jinzhou')), 1);
});

test('支援重装备与全套战术/城内休整/夜间宿营动作一一映射', () => {
  const state = {
    units: [
      { id: 'u1', side: 'ccp', city: 'jinzhou', strength: 20_000, branch: 'mobile', support: { artillery: 40, armor: 28 } },
    ],
  };
  const icons = Human3D.supportIcons(state);
  assert.ok(icons.get('jinzhou|ccp').armor >= 5);
  assert.ok(icons.get('jinzhou|ccp').artillery >= 12);

  assert.equal(Human3D.orderAction({ order: { type: 'move', target: 'jinzhou', route: ['yixian', 'jinzhou'] } }), 'march');
  assert.equal(Human3D.orderAction({ order: { type: 'advance', target: 'jinzhou', route: ['yixian', 'jinzhou'] } }, true), 'fire');
  assert.equal(Human3D.orderAction({ order: { type: 'siege', target: 'changchun', route: ['dehui', 'changchun'] } }, true), 'siege');
  assert.equal(Human3D.orderAction({ order: { type: 'defend', target: 'tashan', route: ['tashan'] } }, false), 'defend');
  assert.equal(Human3D.orderAction({ order: { type: 'entrench', target: 'tashan', route: ['tashan'] } }, false), 'entrench');
  assert.equal(Human3D.orderAction({ order: { type: 'intercept', target: 'heishan', route: ['heishan'] } }, false), 'intercept');
  assert.equal(Human3D.orderAction({ order: { type: 'rest', target: 'shenyang', route: ['shenyang'] } }, false, false), 'rest');
  assert.equal(Human3D.orderAction({ order: { type: 'rest', target: 'shenyang', route: ['shenyang'] } }, false, true), 'sleep');
  assert.equal(Human3D.orderAction({ order: { type: 'hold', target: 'shenyang' } }, false, true), 'sleep');
  assert.equal(Human3D.orderAction({}, false, true), 'sleep');
  assert.equal(Human3D.orderAction({ order: { type: 'bombard', target: 'shenyang' } }, false), 'bombard');
  assert.equal(Human3D.equipmentAction('march'), 'march');
  assert.equal(Human3D.equipmentAction('siege'), 'fire');
  assert.equal(Human3D.equipmentAction('rest'), 'idle');
});

test('三维人物、精细军舰、各系地方军阀战服与全动作网格完整无坏值无穿地', () => {
  for (const kind of ['human', 'artillery', 'tank', 'aircraft', 'ship']) {
    const mesh = Human3D.createMesh(kind);
    assert.ok(mesh.positions.length >= 900, kind + ' 模型顶点数应充足精细');
    assert.equal(mesh.positions.length, mesh.normals.length);
    assert.equal(mesh.indices.length % 3, 0);
    for (let i = 0; i < mesh.positions.length; i++) {
      assert.ok(Number.isFinite(mesh.positions[i]), kind + ' 顶点坐标必须有限');
      assert.ok(Number.isFinite(mesh.normals[i]), kind + ' 法线必须有限');
    }
  }
  const shipMesh = Human3D.createMesh('ship');
  assert.ok(shipMesh.indices.length / 3 >= 700, '精细军舰三角面数应远超旧粗糙模型');

  // 遍历各派系战服与全部动作帧，验证无 NaN 且无穿入地面以下
  const variants = [
    ['ccp', 'dongye'], ['ccp', 'huaye'], ['ccp', 'xibeiye'],
    ['roc', 'huzongnan'], ['roc', 'us'], ['roc', 'qingma'], ['roc', 'ningma'],
    ['roc', 'xinjiang'], ['roc', 'xizang'], ['roc', 'dianxi'], ['roc', 'chuanxi'],
    ['roc', 'guixi'], ['roc', 'yuejun'], ['roc', 'jinsui'],
  ];
  const actions = ['idle', 'march', 'fire', 'siege', 'defend', 'entrench', 'intercept', 'rest', 'sleep'];
  for (const [side, variant] of variants) {
    for (const action of actions) {
      const built = Human3D.buildKindScene('human', side, action, 1.25, variant);
      assert.ok(built.tris > 400, `${variant}/${action} 三角面充足`);
      let minY = Infinity;
      for (let i = 0; i < built.data.length; i += 11) {
        assert.ok(Number.isFinite(built.data[i]) && Number.isFinite(built.data[i + 1]) && Number.isFinite(built.data[i + 2]));
        if (built.data[i + 1] < minY) minY = built.data[i + 1];
      }
      assert.ok(minY >= -0.025, `${variant}/${action} 不得穿入地面以下，实际 minY=${minY}`);
    }
  }
});
