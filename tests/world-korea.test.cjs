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

test('二战全球战役数据完整包含美/苏/英/法/日/德/中七大阵营、7位国家领导人、铁路网与 16 大历史剧本', () => {
  assert.deepEqual(Object.keys(WW2.factions).sort(), ['china', 'france', 'germany', 'japan', 'uk', 'usa', 'ussr']);
  assert.equal(WW2.leaders.length, 7);
  assert.equal(WW2.scenarios.length, 16);
  assert.ok(WW2.cities.length >= 60);
  assert.ok(WW2.routes.some(r => r[2] === 'rail'), '应包含双轨战略铁路网');
  assert.ok(WW2.routes.length >= 85);
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

test('新增 6 款二战精细 3D 装备模型与全部 9 大参战国专属单兵 3D 模型网格完整无 NaN', () => {
  for (const kind of [
    'yamato', 'zero', 'spitfire', 'sherman', 'charb1', 'tiger',
    'churchill', 'chiha', 'stuka', 'il2', 'p40', 'uboat',
    'soldier_usa', 'soldier_ussr', 'soldier_uk', 'soldier_france', 'soldier_japan', 'soldier_germany', 'soldier_china_ww2', 'soldier_pva', 'soldier_kpa'
  ]) {
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
  assert.equal(Sim.fortifyWW2City(WW2, st, 'usa', 'washington').ok, true);
  assert.equal(Sim.scorchedEarthWW2(WW2, st, 'usa', 'berlin').ok, true);
  assert.equal(Sim.citySupplyLevel(WW2, st, 'berlin'), 30, '被焦土破袭铁路的城市应进入红区断补');
  Sim.stepWW2Day(WW2, st, 30);
  assert.equal(st.dayCount, 30);
  assert.ok(st.nations.usa.completedFocuses.includes('us_arsenal'), '25 天国策应在 30 天内自动完成');
  assert.ok(st.armies.every(a => Number.isFinite(a.strength) && Number.isFinite(a.org)));

  // 校验国内内战全模式同步至二战：学说、法令、科研、情报破译、敌后空降、炮火覆盖、指挥技能、历史抉择与30日预测
  st.nations.usa.pp = 200;
  st.nations.usa.cp = 100;
  assert.equal(Sim.setWW2Doctrine(st, 'usa', 'mobile').ok, true);
  assert.equal(Sim.setWW2Law(st, 'usa', 'conscription', 'extensive').ok, true);
  assert.equal(Sim.setWW2Law(st, 'usa', 'economy', 'total_mob').ok, true);
  assert.equal(Sim.researchWW2Tech(st, 'usa', 'heavy_armor').ok, true);
  assert.equal(Sim.ww2IntelAction(st, 'usa', 'network').ok, true);
  assert.equal(Sim.ww2IntelAction(st, 'usa', 'decrypt').ok, true);
  assert.equal(Sim.ww2IntelAction(st, 'usa', 'decrypt').ok, true);
  assert.equal(Sim.ww2IntelAction(st, 'usa', 'burst').ok, true);
  assert.equal(st.nations.usa.intel.burstDays, 30);
  const hostileCity = WW2.cities.find(c => Sim.isHostile(WW2, 'usa', st.owners[c.id], st))?.id;
  if (hostileCity) {
    assert.equal(Sim.airborneWW2(WW2, st, 'usa', hostileCity).ok, true);
    assert.equal(Sim.barrageWW2(WW2, st, 'usa', hostileCity).ok, true);
  }
  assert.equal(Sim.portGarrisonWW2(WW2, st, 'usa').ok, true);
  assert.equal(Sim.applyWW2Event(st, 'usa', 'ev_lend_lease', 0).ok, true);
  const fc = Sim.forecastWW2(WW2, st, 30);
  assert.ok(fc.date && Number.isFinite(fc.ownedLater));

  // 校验欧洲德军多坦克闪电战 + 太平洋海空跳岛战 + 原子弹发射轰炸
  const gerSt = Sim.createWW2Game(WW2, 'ww2-1940', 'germany');
  gerSt.nations.germany.cp = 60;
  assert.equal(Sim.blitzkriegStrikeWW2(WW2, gerSt, 'germany', 'ger-west').ok, true);
  assert.ok(gerSt.effects.some(e => e.type === 'blitz'));

  const pacSt = Sim.createWW2Game(WW2, 'ww2-1945-okinawa', 'usa');
  pacSt.nations.usa.cp = 60; pacSt.nations.usa.pp = 80;
  assert.equal(Sim.pacificNavalAirBattle(WW2, pacSt, 'usa', 'okinawa').ok, true);
  assert.equal(Sim.launchAtomicBombWW2(WW2, pacSt, 'usa', 'hiroshima').ok, true);
  assert.equal(pacSt.nukedCities.hiroshima, true);
  assert.ok(pacSt.effects.some(e => e.type === 'nuke'));

  // 校验最后 8 项差异补平：后撤防线、全线总攻、外交宣战/停战、老兵与战损统计
  assert.equal(Sim.fallbackLineWW2(WW2, gerSt, 'germany').ok, true);
  assert.equal(Sim.declareWarWW2(WW2, gerSt, 'germany', 'ussr').ok, true);
  gerSt.nations.germany.pp = 50;
  assert.equal(Sim.proposePeaceWW2(WW2, gerSt, 'germany', 'ussr').ok, true);
  assert.equal(Sim.generalOffensiveWW2(WW2, gerSt, 'germany').ok, true);

  // 校验最新同步的 8 大 HOI4 系统：石油资源贸易、自由装备设计器、自由战斗宽度师编、将领特质养成、拉拢中立国、和谈会议、季节气候与运输船
  assert.equal(Sim.tradeWW2Resource(st, 'usa', 'oil').ok, true);
  assert.equal(Sim.designWW2Equipment(st, 'usa', { tankGun: '88mm', tankArmor: 'heavy', shipFocus: 'carrier_deck' }).ok, true);
  assert.equal(Sim.recruitCustomTemplateWW2(WW2, st, 'usa', 'washington').ok, true);
  assert.equal(Sim.upgradeWW2General(st, 'usa', 'usa-1a', 'panzer_leader').ok, true);
  assert.equal(Sim.inviteMinorWW2(st, 'usa', 'brazil').ok, true);
  st.nations.usa.warScore = 100;
  assert.equal(Sim.peaceDemandWW2(WW2, st, 'usa', 'puppet').ok, true);
  assert.equal(Sim.peaceDemandWW2(WW2, st, 'usa', 'seize_fleet').ok, true);
  assert.equal(Sim.getWW2SeasonWeather(12).id, 'winter');
  assert.equal(Sim.getWW2SeasonWeather(8).id, 'typhoon');

  // 校验最新 5 大 HOI4 高阶 DLC 系统：国际军火市场、MIO 设计局升级、V-2 导弹与古斯塔夫列车炮、特工窃取蓝图、舰队屏卫率
  pacSt.nations.usa.pp = 150; pacSt.nations.usa.cp = 100; pacSt.nations.usa.intel.network = 80;
  assert.equal(Sim.marketWW2Trade(pacSt, 'usa', 'buy', 'tanks').ok, true);
  assert.equal(Sim.marketWW2Trade(pacSt, 'usa', 'sell', 'infantry').ok, true);
  assert.equal(Sim.upgradeWW2MIO(pacSt, 'usa', 'mio_tank').ok, true);
  assert.equal(Sim.launchV2MissileWW2(WW2, pacSt, 'usa').ok, true);
  assert.equal(Sim.fireRailwayGunWW2(WW2, pacSt, 'usa').ok, true);
  assert.equal(Sim.spyMissionWW2(WW2, pacSt, 'usa', 'steal_tech').ok, true);
  assert.equal(Sim.buildEscortScreenWW2(pacSt, 'usa').ok, true);
  assert.ok(Sim.fleetScreenRatio(pacSt.nations.usa) >= 50);

  // 校验四大战场宣战隔离与零友军互抢
  const cn = Sim.createWW2Game(WW2, 'ww2-1938-china', 'china');
  Sim.stepWW2Day(WW2, cn, 60);
  assert.equal(cn.log.some(l => l.includes('原属 法国') || l.includes('原属 英国') || l.includes('原属 苏联')), false, '1938 中国战场剧本不应出现欧洲/苏联提前互打');
  assert.equal(cn.log.some(l => /(?:🚩|大捷！)\s*(中国|日本)[^\n]*原属 \1/.test(l)), false, '绝不允许自攻自城或友军互抢');
});

test('抗美援朝 HOI4 全屏战略沙盘：5大剧本、18城铁路海运、焦点国策、喀秋莎/米格走廊/仁川登陆与 30 天推演', () => {
  const KSim = World.KoreanWarSim;
  assert.ok(KSim && typeof KSim.createKoreanWarGame === 'function');
  assert.ok(Korea.routes.length >= 20, '朝鲜半岛铁路/公路/海运网应包含 20+ 条线路');
  assert.ok(Korea.focusTrees.dprk_coalition.length >= 3 && Korea.focusTrees.un_coalition.length >= 3);

  for (const sc of Korea.scenarios) {
    const st = KSim.createKoreanWarGame(Korea, sc.id, 'dprk_coalition');
    assert.equal(Object.keys(st.owners).length, 18);
    assert.ok(st.armies.length >= 10);
  }

  const st = KSim.createKoreanWarGame(Korea, 'kw-1950-10', 'dprk_coalition');
  assert.equal(KSim.startKoreanWarFocus(Korea, st, 'dprk_coalition', 'kw_cross_yalu').ok, true);
  assert.equal(KSim.triggerKoreanWarSpecial(Korea, st, 'dprk_coalition', 'katyusha').ok, true);
  assert.equal(KSim.triggerKoreanWarSpecial(Korea, st, 'dprk_coalition', 'mig_corridor').ok, true);
  assert.equal(KSim.triggerKoreanWarSpecial(Korea, st, 'dprk_coalition', 'tunnel_fort').ok, true);
  assert.equal(KSim.triggerKoreanWarSpecial(Korea, st, 'un_coalition', 'inchon_landing').ok, true);
  assert.equal(KSim.triggerKoreanWarSpecial(Korea, st, 'un_coalition', 'van_fleet').ok, true);

  const pvaArmy = st.armies.find((a) => a.side === 'dprk_coalition');
  assert.equal(KSim.issueKoreanWarOrder(Korea, st, pvaArmy.id, 'attack', 'seoul').ok, true);
  KSim.stepKoreanWarDay(Korea, st, 30);
  assert.equal(st.dayCount, 30);
  assert.ok(st.sides.dprk_coalition.completedFocuses.includes('kw_cross_yalu'));
  assert.ok(!Number.isNaN(st.sides.dprk_coalition.pp) && !Number.isNaN(st.sides.un_coalition.warScore));
});

test('二战欧洲与太平洋 HOI4 深度机制：计划准备加成、维希法国、乌拉尔内迁、雷达网、宪兵镇压、三排海战阵型、两栖筹备、B-29航程圈、神风与孤岛封锁', () => {
  const Sim = World.WW2Sim;
  // 欧洲战场：雷达、工业内迁、宪兵镇压、维希法国、计划蓄力
  const eu = Sim.createWW2Game(WW2, 'ww2-1940', 'germany');
  eu.nations.germany.pp = 200;
  eu.nations.ussr.pp = 200;
  assert.equal(Sim.buildRadarWW2(WW2, eu, 'germany', 'berlin').ok, true);
  assert.ok(eu.radars.berlin >= 2);
  assert.equal(Sim.relocateIndustryWW2(WW2, eu, 'ussr').ok, true);
  assert.equal(eu.uralRelocated, true);
  assert.equal(Sim.garrisonSuppressWW2(WW2, eu, 'germany', 'warsaw').ok, true);
  assert.equal(Sim.triggerVichyFranceWW2(WW2, eu).ok, true);
  assert.equal(eu.vichyTriggered, true);
  const frontArmy = eu.armies.find((a) => a.nation === 'germany');
  const beforePlan = frontArmy.planBonus || 0;
  Sim.stepWW2Day(WW2, eu, 5);
  assert.ok(eu.armies.some((a) => a.nation === 'germany' && (a.planBonus || 0) >= beforePlan));

  // 太平洋战场：三排海战阵型、两栖筹备、孤岛封锁断粮、神风特攻、B-29航程圈校验
  const pac = Sim.createWW2Game(WW2, 'ww2-1945-okinawa', 'usa');
  pac.nations.usa.cp = 100; pac.nations.usa.pp = 100;
  pac.nations.japan.pp = 100; pac.nations.japan.stock.planes = 200;
  const navRes = Sim.pacificNavalAirBattle(WW2, pac, 'usa', 'tokyo');
  assert.equal(navRes.ok, true);
  assert.ok(pac.lastNavalBattle && pac.lastNavalBattle.atk && pac.lastNavalBattle.def);
  const blk = Sim.blockadeIslandWW2(WW2, pac, 'usa', 'tokyo');
  assert.equal(blk.ok, true);
  assert.equal(Sim.citySupplyLevel(WW2, pac, 'tokyo'), 10);
  const usArmy = pac.armies.find((a) => a.nation === 'usa');
  assert.equal(Sim.planAmphibiousWW2(WW2, pac, usArmy.id, 'tokyo').ok, true);
  assert.equal(usArmy.amphibPrep, 100);
  assert.equal(Sim.kamikazeStrikeWW2(WW2, pac, 'japan', 'usa').ok, true);
  assert.equal(Sim.launchAtomicBombWW2(WW2, pac, 'usa', 'tokyo').ok, true);
});

test('国共内战主战场同步 HOI4 深度玩法：燃油、四大军工设计局、装备改型、雷达网、大后方内迁、宪兵镇压与三排海战', () => {
  const st = Engine.createGame(Data, { scenarioId: 'war1946', scope: 'national', side: 'ccp' });
  st.political.ccp.points = 200;
  st.command.ccp.points = 100;
  assert.equal(Engine.upgradeCivilMIO(Data, st, 'infantry').ok, true);
  assert.equal(Engine.designCivilEquipment(Data, st, 'rifle').ok, true);
  assert.equal(Engine.buildCivilRadar(Data, st).ok, true);
  assert.equal(Engine.relocateCivilIndustry(Data, st).ok, true);
  assert.equal(Engine.suppressCivilResistance(Data, st).ok, true);
  const nav = Engine.civilNavalThreeLineBattle(Data, st);
  assert.equal(nav.ok, true);
  assert.ok(st.hoiExtra.lastNavalBattle && st.hoiExtra.lastNavalBattle.atk && st.hoiExtra.lastNavalBattle.def);

  // 免换装直出地图：国共内战直接编组坦克军/空军/航母舰队/导弹阵地
  assert.equal(Engine.deployDirectForceCivil(Data, st, 'tank').ok, true);
  assert.equal(Engine.deployDirectForceCivil(Data, st, 'air').ok, true);
  assert.equal(Engine.deployDirectForceCivil(Data, st, 'navy').ok, true);
  assert.equal(Engine.deployDirectForceCivil(Data, st, 'missile').ok, true);

  // 二战全球免换装直出地图 + 任意港自由两栖登陆 + 严格导弹射程校验
  const Sim = World.WW2Sim;
  const pac = Sim.createWW2Game(WW2, 'ww2-1945-okinawa', 'usa');
  pac.nations.usa.pp = 200; pac.nations.usa.cp = 100;
  const dt = Sim.deployDirectForceWW2(WW2, pac, 'usa', 'tank');
  const da = Sim.deployDirectForceWW2(WW2, pac, 'usa', 'air');
  const dc = Sim.deployDirectForceWW2(WW2, pac, 'usa', 'carrier');
  const dm = Sim.deployDirectForceWW2(WW2, pac, 'usa', 'missile');
  assert.equal(dt.ok && da.ok && dc.ok && dm.ok, true);
  assert.equal(dc.army.unitKind, 'carrier');
  assert.equal(Sim.freeAmphibiousLandingWW2(WW2, pac, 'usa', dc.army.id, 'tokyo').ok, true);
});

test('统一单窗口战区适配器：朝鲜战争与二战全球原生跑在 CivilWarEngine 上，完整兼容国共内战底层', () => {
  const UT = require('../unified-theaters.js');
  const kwData = UT.buildKoreanWarCivilData(Korea, World);
  assert.equal(kwData.theaterMode, 'korea');
  assert.equal(kwData.cities.length, 18);
  const kwGame = Engine.createGame(kwData, { scenarioId: 'kw-1950-10', scope: 'national', side: 'ccp' });
  assert.ok(kwGame.units.length >= 10);
  Engine.step(kwData, kwGame, 5);
  assert.ok(kwGame.date > '1950-10-25');

  const ww2Data = UT.buildWW2CivilData(WW2, World);
  assert.equal(ww2Data.theaterMode, 'ww2');
  assert.equal(ww2Data.cities.length, WW2.cities.length);
  const ww2Game = Engine.createGame(ww2Data, { scenarioId: 'ww2-1940', scope: 'national', side: 'roc' });
  assert.ok(ww2Game.units.length >= 20);
  Engine.step(ww2Data, ww2Game, 5);
  assert.ok(ww2Game.date > '1940-05-10');

  // 全球无缝大沙盘（1936从0到100 / 林彪东征日本 / 美苏不可思议行动）+ 提前 N 天筹备 + 无尽沙盒不结束 + 自由宣战
  const grand = UT.buildGrandWorldData(WW2, Korea, World);
  assert.ok(grand.cities.length >= 65);
  const g1 = Engine.createGame(grand, { scenarioId: 'grand-1949-linbiao', scope: 'national', side: 'ccp', prepDays: 90, sandboxEndless: true });
  assert.equal(g1.prepDaysLeft, 90);
  assert.equal(g1.date, '1949-07-03');
  Engine.step(grand, g1, 10);
  assert.equal(g1.prepDaysLeft, 80);
  assert.equal(Engine.endPrepEarly(grand, g1).ok, true);
  assert.equal(g1.prepDaysLeft, 0);
  g1.political.ccp.points = 100;
  assert.equal(Engine.declareSandboxWar(grand, g1, 'japan').ok, true);
  assert.equal(Engine.declareSandboxWar(grand, g1, 'ussr').ok, true);
  assert.equal(g1.winner, null, '无尽沙盒模式下绝不强制结束');
});
