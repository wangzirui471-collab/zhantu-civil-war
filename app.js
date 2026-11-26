(() => {
  'use strict';

  const Data = globalThis.CivilWarData;
  const Engine = globalThis.CivilWarEngine;
  const Timeline = globalThis.CivilWarTimeline;
  const SaveStore = globalThis.CivilWarSaveStore;
  const Portraits = globalThis.CivilWarPortraits || {};
  const $ = (id) => document.getElementById(id);
  if (!Data || !Engine || !Timeline) {
    $('latest-event').textContent = '游戏数据未加载。请将 index.html 和同目录文件一起保留后重新打开。';
    return;
  }

  const sides = { ccp: '中国共产党', roc: '中国国民党' };
  const short = { ccp: '共产党', roc: '国民党' };
  const regions = { national: '全国', northeast: '东北战区', north: '华北战区', east: '华东战区',
    central: '中原战区', south: '华南战区', southwest: '西南战区', northwest: '西北战区', taiwan: '台湾' };
  const commands = { advance: '进攻', defend: '布防', move: '调动', siege: '围城', intercept: '围点打援', hold: '原地待命', bombard: '战略轰炸' };
  const enemyCommands = new Set(['advance', 'siege', 'intercept', 'bombard']);
  const equipmentTypes = {
    infantry: ['步兵装备', '消耗补给较少，适合驻防和日常行动。'],
    artillery: ['炮兵装备', '在围城时提供火力加成。'],
    mobile: ['机动装备', '调动更快，能加强对援军的拦截。'],
    mixed: ['混合装备', '通过编制表查看各下属部队装备。'],
  };
  const routeNames = { rail: '铁路', maritime: '海运', land: '陆路' };
  const terrainName = { urban: '城市', hill: '丘陵', mountain: '山地', port: '港口', plain: '平原', rail: '车站' };
  const meta = Engine.metadata || {};
  const fortInfo = meta.fortKinds || {};
  const supportInfo = meta.supportKinds || {};
  const supportOrder = meta.supportKeys || [];
  const planModeNames = meta.planModes || {};
  const planStanceNames = meta.planStances || {};
  const decisionInfo = meta.decisionKinds || {};
  const goodsNames = meta.supplyGoods || {};
  const techInfo = meta.techLines || {};
  const airMissionInfo = meta.airMissions || {};
  const focusTree = meta.focusTrees || {};
  const commandInfo = meta.commandAbilities || {};
  const battalionInfo = meta.designBattalions || {};
  const supportInfo2 = meta.designSupports || {};
  const intelOpInfo = meta.intelOps || {};
  const diplomacyInfo = meta.diplomacyOps || {};
  const lawText = meta.lawNames || {};
  const designStatsOf = meta.designStats || (() => null);
  const unitDesignOf = meta.unitDesign || (() => null);
  const leaderLevelOf = meta.leaderLevel || (() => 1);
  const leaderTraitsOf = meta.leaderTraits || (() => []);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const planStatusNames = { draft: '待执行', active: '执行中', paused: '已暂停', done: '已达成' };
  const transportNames = { rail: '铁路', road: '公路', sea: '海运', local: '本地' };
  const scenariosById = new Map(Data.scenarios.map((scenario) => [scenario.id, scenario]));
  const citiesById = new Map(Data.cities.map((city) => [city.id, city]));
  const leadersById = new Map((Data.leaders || []).map((leader) => [leader.id, leader]));
  const groupsById = new Map((Data.groups || []).map((group) => [group.id, group]));
  const priorityScenarios = ['liaoshen', 'huaihai', 'pingjin', 'jinzhou', 'tashan', 'siping', 'changchun'];
  const scenarioMarks = { liaoshen: '辽', huaihai: '淮', pingjin: '平', jinzhou: '锦', tashan: '塔', siping: '四', changchun: '长', full: '全' };
  const stageTargets = new Map([['liaoshen', ['jinzhou', 'tashan', 'shenyang', 'changchun']]]);
  const historyFamily = (id) => ({ jinzhou: 'liaoshen', tashan: 'liaoshen', changchun: 'liaoshen' }[id] || id);
  const storageKey = 'civil-war-map-v1';
  const checkpointById = new Map((Data.historyCheckpoints || []).map((point) => [point.id, point]));
  const pauseLabels = { capture: '城镇易手', battle: '战斗开始', arrival: '我方部队抵达' };
  const tutorialSteps = [
    ['选中部队', '地图上的第三纵队可以接手这次演练。点它的部队牌，右侧会显示编制和人数。', '选中第三纵队'],
    ['下达命令', '地图会标出可进攻和可调动的城镇。右键锦州，或在底部选择进攻后点击锦州。', '选择进攻'],
    ['推进时间', '观察部队牌下方的行动状态，推进到锦州出现本次行动的战报。', '推进到战报'],
    ['查看结果', '打开战报查看城镇归属、附近部队和结果，然后继续接管战局。', '查看锦州战报'],
    ['转到塔山', '从当前日期转到塔山。你的兵力、城镇归属和时间都沿用这局进度。', '前往塔山'],
  ];
  const numbers = new Intl.NumberFormat('zh-CN');
  const format = (value) => numbers.format(Math.round(Number(value) || 0));
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cityName = (id) => citiesById.get(id)?.name || id || '未定';
  const sourceLink = (value, label = '查看史料') => /^https?:\/\//i.test(value || '')
    ? '<a href="' + escape(value) + '" target="_blank" rel="noreferrer">' + escape(label) + '</a>' : '';
  const sideTag = (side, name = short[side] || '未定') => '<span class="unit-side"><b class="dot '
    + escape(side) + '"></b>' + escape(name) + '</span>';
  const fmtDate = (date) => date.replaceAll('-', '.');
  const cityConnected = new Map();
  for (const [a, b] of Data.links) {
    for (const [key, other] of [[a, b], [b, a]]) {
      if (!cityConnected.has(key)) cityConnected.set(key, []);
      cityConnected.get(key).push(other);
    }
  }
  const routeType = (a, b) => Data.routeTypes?.[[a, b].sort().join('|')] || 'land';

  let state;
  let timeline;
  let selectedCity;
  let selectedUnit;
  let selectedUnits = new Set();
  let pendingOrder;
  let pane = 'city';
  let rosterSide = 'player';
  let rosterRegion = 'current';
  let rosterGroup = '';
  let rosterPage = 0;
  let running = false;
  let speed = 1;
  let timer;
  let toastTimer;
  let saveDay = '';
  let orderPreviews = {};
  let tutorial;
  let stack;
  let recentBrief;
  let fortCity;
  let supplyView;
  const undoStack = [];
  const undoLimit = 24;
  let pausePreferences;
  try { pausePreferences = JSON.parse(localStorage.getItem(storageKey + '-auto-pause') || '{}') || {}; }
  catch { pausePreferences = {}; }
  const dialog = $('dialog');
  const map = CivilWarMap.mount($('map'), Data, {
    selectCity: (city) => selectCity(city, true),
    selectUnit: (unit) => selectUnit(unit, false),
    toggleUnit,
    quickOrder,
    canOrder: permitted,
    previewCity,
    selectStack(city, units, region) {
      if (units.length === 1 && !region) { selectUnit(units[0], false); return; }
      stack = { city, units, region };
      selectedCity = city;
      selectedUnit = pendingOrder = undefined;
      pane = 'army';
      setMapHelp();
      render();
      $('inspector-body').closest('aside').classList.add('is-open');
      $('mobile-inspector').setAttribute('aria-expanded', 'true');
    },
  });

  function loadStore() {
    try {
      const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { auto: typeof store.auto === 'string' ? store.auto : '', slots: Array.isArray(store.slots) ? store.slots : [] };
    } catch { return { auto: '', slots: [] }; }
  }
  const store = loadStore();
  const storeBackend = SaveStore?.create?.();

  function writeStore(next) {
    let localSaved = false;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); localSaved = true; } catch { /* IndexedDB 仍可保存。 */ }
    Object.assign(store, next);
    if (storeBackend) { void storeBackend.write(storageKey, next); return true; }
    return localSaved;
  }

  function validateSave(raw) {
    const result = Timeline.parse(raw);
    for (const item of [result.state, result.timeline.origin]) {
      if (!Object.hasOwn(sides, item.player) || !Array.isArray(item.units) || !Array.isArray(item.log) || !item.owners
        || !item.policies || !item.economy?.ccp || !item.economy?.roc
        || !Object.values(item.owners).every((side) => Object.hasOwn(sides, side))
        || !Object.hasOwn(item.owners, 'jinzhou') || !Object.hasOwn(item.owners, 'beiping')
        || item.units.some((unit) => !citiesById.has(unit.city) || !Object.hasOwn(sides, unit.side)
          || typeof unit.name !== 'string' || !Number.isFinite(unit.strength))) {
        throw new Error('存档缺少地图或部队数据。');
      }
      if (Data.cities.some((city) => !Object.hasOwn(item.owners, city.id))) {
        const baseline = Engine.createGame(Data, { date: item.date, scenarioId: item.scenarioId, side: item.player }).owners;
        for (const city of Data.cities) {
          if (Object.hasOwn(item.owners, city.id)) continue;
          const neighbors = (cityConnected.get(city.id) || []).map((id) => item.owners[id]).filter(Boolean);
          item.owners[city.id] = neighbors.length && neighbors.every((side) => side === neighbors[0])
            ? neighbors[0] : baseline[city.id];
        }
      }
      item.historicalEvents ||= {};
      Engine.prepare?.(Data, item);
    }
    return result;
  }

  function saveAuto(force = false) {
    if (!state || (!force && state.date === saveDay)) return;
    if (writeStore({ ...store, auto: Timeline.serialize(state, timeline) })) saveDay = state.date;
  }

  function notify(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3300);
  }

  function inspectUnit() { return state.units.find((unit) => unit.id === selectedUnit); }
  function scenarioNow() { return scenariosById.get(state.scenarioId); }
  function area() { return state.area || citiesById.get(selectedCity)?.region || 'northeast'; }
  function permitted(unit) {
    return unit && !state.winner && !unit.inactive && unit.strength > 0 && unit.side === state.player
      && (state.scope === 'national' || unit.area === state.area || citiesById.get(unit.city)?.region === state.area)
      && (!state.group || unit.group === state.group);
  }
  function topUnit(unit) {
    let army = unit;
    while (army?.parent) army = state.units.find((member) => member.id === army.parent);
    return army;
  }

  function valueOf(unit, key, fallback) {
    return Number.isFinite(unit?.[key]) ? unit[key] : fallback;
  }

  function percent(value) {
    return format(value) + '%';
  }

  function toggleUnit(unitId) {
    const unit = state.units.find((item) => item.id === unitId);
    const root = topUnit(unit);
    if (!root || !permitted(root)) { notify('只能编入当前可指挥的部队。'); return; }
    if (selectedUnits.has(root.id)) selectedUnits.delete(root.id);
    else {
      if (selectedUnits.size >= 12) { notify('一个计划最多编入 12 支部队。'); return; }
      selectedUnits.add(root.id);
    }
    selectedUnit = root.id;
    pane = 'army';
    setMapHelp();
    render();
    notify(selectedUnits.size > 1 ? '已选 ' + selectedUnits.size + ' 支部队，可点「编成计划」统一下令。'
      : selectedUnits.size ? '已选 1 支部队。' : '已清空编队。');
  }

  function armyLabel(unit) {
    return unit.name.replace('（模拟）', '') + ' · ' + cityName(unit.city);
  }

  function supportLine(unit) {
    const support = meta.unitSupport ? meta.unitSupport(unit) : unit.support || {};
    return supportOrder.map((key) => (supportInfo[key] || key).slice(0, 1) + ' ' + format(support[key] || 0)).join(' · ');
  }

  function stage() {
    const scenario = scenarioNow();
    const checkpoint = checkpointById.get(timeline.origin.checkpointId);
    if (!scenario || scenario.id === 'full' || !checkpoint && timeline.origin.date !== scenario.date) return null;
    const targets = checkpoint ? [checkpoint.city] : stageTargets.get(scenario.id) || [scenario.focus];
    const allOwned = targets.every((id) => state.owners[id] === state.player);
    const defended = targets.every((id) => timeline.origin.owners[id] === state.player);
    const since = state.log.reduce((latest, item) =>
      item.type === 'capture' && targets.includes(item.city) && item.date > latest ? item.date : latest, timeline.origin.date);
    const days = Math.round((Date.parse(state.date) - Date.parse(since)) / 86400000);
    return { title: (defended ? '守住' : '控制') + targets.map(cityName).join('、'),
      complete: allOwned && (!defended || days >= 7), defended, days, targets };
  }

  function stageReport() {
    const progress = stage();
    if (!progress) return;
    const initial = Engine.stats(Data, timeline.origin);
    const current = Engine.stats(Data, state);
    showDialog('阶段战报', '<p>' + escape(progress.title) + ' · ' + (progress.complete ? '已达成' : '进行中')
      + '</p><table class="dialog-table"><thead><tr><th>城镇</th><th>开局归属</th><th>当前归属</th></tr></thead><tbody>'
      + progress.targets.map((id) => '<tr><td>' + escape(cityName(id)) + '</td><td>'
        + escape(short[timeline.origin.owners[id]]) + '</td><td>' + escape(short[state.owners[id]]) + '</td></tr>').join('')
      + '</tbody></table><p>全国现役兵力变化 · 共产党 ' + format(current.ccpStrength - initial.ccpStrength)
      + ' 人，国民党 ' + format(current.rocStrength - initial.rocStrength) + ' 人。</p>'
      + '<button id="continue-national" class="gold" type="button">继续全国战局</button>');
    $('continue-national').onclick = () => { dialog.close(); changeScope('national'); };
  }

  function renderScenarios() {
    const list = priorityScenarios.map((id) => scenariosById.get(id)).filter(Boolean);
    $('scenario-list').innerHTML = list.map((scenario) => '<button class="scenario-card" type="button" data-scenario="'
      + escape(scenario.id) + '" aria-pressed="' + (state.scenarioId === scenario.id) + '"><span class="scenario-symbol">'
      + escape(scenarioMarks[scenario.id] || '战') + '</span><div><strong>' + escape(scenario.title)
      + '</strong><small>' + fmtDate(scenario.date) + '</small></div><span aria-hidden="true">›</span></button>').join('');
  }

  function renderHeader() {
    $('player-name').textContent = sides[state.player];
    $('player-dot').className = 'dot ' + state.player;
    const group = groupsById.get(state.group);
    $('scope-label').textContent = group?.name || (state.scope === 'national' ? '全国指挥' : regions[area()] || '战区指挥');
    $('date').textContent = fmtDate(state.date);
    $('date').dateTime = state.date;
    $('clock-label').textContent = state.winner
      ? (state.endReason === 'capitulation' || state.endReason === 'ceasefire' ? '已停战'
        : state.endReason === 'timeout' ? '已休战' : '已统一')
      : running ? '运行中' : '已暂停';
    $('pause').textContent = running ? 'Ⅱ' : '▶';
    $('pause').disabled = Boolean(state.winner);
    $('step').disabled = Boolean(state.winner);
    $('map-tag').textContent = state.scope === 'national' ? '全国战局' : regions[area()] || '地方战区';
    $('map-title').textContent = scenarioNow()?.title || '自订战局';
    $('sector-select').value = state.scope === 'national' ? 'national' : area();
    $('national-view').setAttribute('aria-pressed', state.scope === 'national');
    $('theater-view').setAttribute('aria-pressed', state.scope === 'theater');
    const latest = recentBrief || state.log.at(-1);
    $('latest-event').textContent = state.winner ? sides[state.winner] + '达成统一目标。'
      : (latest?.text || '请选择部队或城镇。');
    $('brief-settings').setAttribute('aria-pressed', Object.keys(pauseLabels).some((key) => pausePreferences[key]));
    document.querySelectorAll('[data-speed]').forEach((item) => item.setAttribute('aria-pressed', Number(item.dataset.speed) === speed));
  }

  function resourceTiles(economy) {
    return Object.entries({ treasury: '财政', food: '粮食', arms: '军械', manpower: '兵员储备' })
      .map(([key, label]) => '<div><dt>' + label + '</dt><dd>' + format(economy[key]) + '</dd></div>').join('');
  }

  function renderLedger() {
    const stats = Engine.stats(Data, state);
    const cityCount = stats.ccp + stats.roc || 1;
    $('standings').innerHTML = ['ccp', 'roc'].map((side) => '<div class="standing">' + sideTag(side)
      + '<em>' + format(stats[side]) + ' 城 · ' + (side === state.player ? '' : '约 ')
      + format(side === state.player ? stats[side + 'Strength'] : Math.round(stats[side + 'Strength'] / 1000) * 1000)
      + ' 人</em></div>').join('') + '<div class="standing-bar" aria-hidden="true"><i style="width:'
      + (stats.ccp * 100 / cityCount) + '%"></i></div>'
      + '<p class="territory-status">' + escape(regions[area()] || '') + ' · 我方 '
      + Data.cities.filter((city) => city.region === area() && state.owners[city.id] === state.player).length + ' 城 / '
      + Data.cities.filter((city) => city.region === area()).length + ' 城</p>'
      + '<p class="territory-status">战争支持 · 共产党 ' + format(valueOf(state.warSupport, 'ccp', 82))
      + ' · 国民党 ' + format(valueOf(state.warSupport, 'roc', 58)) + '</p>'
      + '<p class="territory-status">稳定 ' + format(valueOf(state.stability, state.player, 60))
      + ' · 科研 ' + format(state.research?.[state.player]?.points ?? 0)
      + ' · 指挥 ' + format(state.command?.[state.player]?.points ?? 0) + '</p>';
    $('resources').innerHTML = resourceTiles(state.economy[state.player]);
  }

  function unitRow(unit) {
    const own = unit.side === state.player;
    const display = own ? format(unit.strength) : '约 ' + format(Math.round(unit.strength / 100) * 100);
    return '<button class="unit-row ' + (own ? '' : 'enemy') + '" type="button" data-unit="' + escape(unit.id)
      + '" aria-pressed="' + (unit.id === selectedUnit) + '" title="' + escape(unit.name) + '"><span><b class="dot ' + unit.side
      + '"></b><strong>' + escape(unit.name) + '</strong></span><small>' + display + ' 人 · 组织 '
      + format(valueOf(unit, 'org', 100)) + '</small></button>';
  }

  function unitRows(units, empty) {
    return units.length ? units.map(unitRow).join('') : '<p class="empty">' + escape(empty) + '</p>';
  }

  function battlePanel(cityId) {
    const battle = state.battles?.[cityId];
    if (!battle) return '';
    const ratio = typeof battle.lastRatio === 'number' ? battle.lastRatio.toFixed(2) : '—';
    return '<div class="card battle-card"><h3>围攻第 ' + format(battle.days) + ' 天</h3>'
      + '<p>' + escape(short[battle.side] || battle.side) + '进攻 · 优势比 ' + ratio
      + ' · 进攻方向 ' + format(battle.attackDirections || 1)
      + ' · 累计伤亡 ' + format((battle.attackerCasualties || 0) + (battle.defenderCasualties || 0)) + ' 人'
      + (battle.weather ? ' · 天气 ' + escape(battle.weather) : '')
      + (battle.tactic ? ' · 战术 ' + escape(battle.tactic) : '') + '</p>'
      + '<p class="subtext">组织度耗尽的一方将退出战斗；守军只有在没有退路时才会被歼灭。</p></div>';
  }

  function fortPanel(city) {
    const forts = state.forts?.[city.id] || {};
    const works = (state.works || []).filter((work) => work.city === city.id);
    const levels = Object.entries(forts).filter(([, level]) => Number(level) > 0)
      .map(([kind, level]) => escape(fortInfo[kind]?.name || kind) + ' ' + format(level) + ' 级').join(' · ');
    const own = state.owners[city.id] === state.player;
    const reading = supplyView || (typeof Engine.supplyReading === 'function' ? Engine.supplyReading(Data, state) : null);
    const owner = state.owners[city.id];
    const coverage = reading?.coverage?.[owner]?.[city.id] ?? reading?.cities?.[city.id]?.[owner];
    return '<div class="card"><h3>工事与补给</h3><p>' + (levels || '尚未修筑工事。') + '</p>'
      + (coverage !== undefined ? '<p class="subtext">补给覆盖 ' + Math.round(coverage * 100) + '%'
        + (coverage < 0.5 ? ' · 缺口较大' : coverage < 0.75 ? ' · 略有缺口' : ' · 通畅') + '</p>' : '')
      + (state.occupation?.[city.id]
        ? '<p class="subtext">抵抗 ' + Math.round(state.occupation[city.id].resistance ?? 0)
          + ' · 顺从 ' + Math.round(state.occupation[city.id].compliance ?? 0) + '</p>' : '')
      + (works.length ? '<p class="subtext">施工中：' + works.map((work) =>
        escape(fortInfo[work.kind]?.name || work.kind) + '（' + escape(work.due) + ' 完工）').join('、') + '</p>' : '')
      + (own ? '<button type="button" class="link-button" data-forts="' + escape(city.id) + '">修筑工事</button>' : '')
      + '</div>';
  }

  function cityInspector() {
    const city = citiesById.get(selectedCity);
    if (!city) return '<p class="empty">选择地图中的城市或车站以查看驻军。</p>';
    const units = Engine.activeUnits(state).filter((unit) => unit.city === city.id);
    const activeParents = new Set(state.units.map((unit) => unit.parent).filter(Boolean));
    const combat = units.filter((unit) => !activeParents.has(unit.id));
    const strength = (side) => combat.filter((unit) => unit.side === side).reduce((sum, unit) => sum + unit.strength, 0);
    const own = strength(state.player);
    const other = strength(state.player === 'ccp' ? 'roc' : 'ccp');
    const stationed = units.filter((unit) => !unit.parent || !units.some((parent) => parent.id === unit.parent));
    const neighbors = cityConnected.get(city.id) || [];
    const linked = neighbors.map((target) => '<button data-city="' + escape(target)
      + '" type="button">' + escape(cityName(target)) + ' <small>' + routeNames[routeType(city.id, target)] + '</small></button>').join('');
    const nearby = Engine.activeUnits(state).filter((unit) => !unit.parent && permitted(unit) && neighbors.includes(unit.city)).slice(0, 4);
    const scenario = scenarioNow()?.focus === city.id && scenarioNow().id !== 'liaoshen'
      ? scenarioNow() : Data.scenarios.find((item) => item.focus === city.id && item.id !== 'liaoshen');
    const progress = stage();
    const checkpoints = [...checkpointById.values()].filter((point) => point.city === city.id
      || point.related?.includes(city.id)).sort((a, b) => Number(b.city === city.id) - Number(a.city === city.id)
        || a.date.localeCompare(b.date));
    return '<div class="city-title"><h3>' + escape(city.name) + '</h3>' + sideTag(state.owners[city.id])
      + (state.capitals?.[state.owners[city.id]] === city.id ? '<span class="capital-tag">首都</span>' : '') + '</div>'
      + '<p class="city-meta">' + escape(city.province || regions[city.region] || city.region) + ' · ' + escape(terrainName[city.terrain] || '城市')
      + ' · 城市价值 ' + format(city.value) + (city.river ? ' · 渡口' : '') + '</p>'
      + battlePanel(city.id)
      + '<div class="sector-summary"><div><span>己方驻军</span><strong>' + format(own)
      + '</strong></div><div><span>对方估算</span><strong>' + format(Math.round(other / 100) * 100) + '</strong></div></div>'
      + fortPanel(city)
      + (progress && (progress.targets.includes(city.id) || city.id === scenarioNow()?.focus)
        ? '<div class="card"><h3>剧本目标</h3><p>' + escape(progress.title)
          + (progress.defended ? ' · 至少 7 天' : '') + '</p><button type="button" class="link-button" data-stage-report>'
          + (progress.complete ? '目标已达成 · 查看战报' : '查看阶段战报') + '</button></div>' : '')
      + '<p class="roster-label">驻扎部队</p>' + unitRows(stationed, '当前没有驻军。')
      + (nearby.length ? '<p class="roster-label">附近可调部队</p>' + unitRows(nearby, '') : '')
      + (checkpoints.length ? '<p class="roster-label">历史日期</p>' + checkpointButtons(checkpoints, 3) : '')
      + '<p class="roster-label">交通连接</p><div class="unit-actions">' + (linked || '<span class="empty">无</span>') + '</div>'
      + (city.detail ? '<p class="subtext">' + escape(city.detail) + ' ' + sourceLink(city.source, '地名史料') + '</p>' : '')
      + (scenario ? '<button class="link-button" type="button" data-history="' + escape(scenario.id) + '">战役资料</button>' : '')
      + '<button type="button" class="link-button" data-find-city>查找城镇</button>';
  }

  function leaderCard(leader) {
    const portrait = Portraits[leader.name];
    const image = portrait?.file ? '<img src="' + escape(portrait.file) + '" alt="' + escape(leader.name) + '历史照片">'
      : '<span class="portrait-placeholder" aria-hidden="true">' + escape(leader.name[0]) + '</span>';
    return '<div class="card leader-card">' + image + '<div><h3>' + escape(leader.name) + '</h3><p>'
      + escape(leader.role || '') + '</p><p>' + escape(leader.bio || '') + '</p>'
      + (portrait ? sourceLink(portrait.source, portrait.credit || '照片出处') + '<br>' : '')
      + sourceLink(leader.source, '人物史料') + '</div></div>';
  }

  function renderTree(army) {
    function rows(unit, depth) {
      const name = unit.parent ? unit.name.split(' · ').at(-1) : unit.name;
      const personnel = unit.side === state.player ? format(unit.strength) : '约 ' + format(Math.round(unit.strength / 100) * 100);
      const profile = equipmentTypes[unit.profile || unit.branch || 'infantry']?.[0] || '步兵装备';
      return '<tr><td><button data-unit="' + escape(unit.id) + '" type="button" style="--depth:' + depth
        + '" aria-pressed="' + (selectedUnit === unit.id) + '">' + escape(name.replace('（模拟）', '')) + '</button></td><td><small>'
        + escape(profile.replace('装备', '')) + '</small></td><td>' + personnel + '</td></tr>'
        + state.units.filter((child) => child.parent === unit.id && child.strength > 0).map((child) => rows(child, depth + 1)).join('');
    }
    return '<table class="formation-table"><thead><tr><th>纵队 / 师 / 团</th><th>装备</th><th>兵力</th></tr></thead><tbody>'
      + rows(army, 0) + '</tbody></table>';
  }

  function unitInspector(unit) {
    const leader = leadersById.get(unit.leader);
    const group = groupsById.get(unit.group);
    const allowed = permitted(unit);
    const root = topUnit(unit);
    const own = unit.side === state.player;
    const intelLevel = state.intel?.[state.player]?.level ?? 35;
    const estimate = () => {
      const rounded = Math.round(unit.strength / 100) * 100;
      const spread = Math.round(rounded * (100 - intelLevel) / 200 / 100) * 100;
      return spread >= 100
        ? '约 ' + format(Math.max(0, rounded - spread)) + '–' + format(rounded + spread)
        : '约 ' + format(rounded);
    };
    const strength = own ? format(unit.strength) : estimate();
    const orderLabel = unit.order ? (commands[unit.order.type] || '行动') + ' · ' + cityName(unit.order.target)
      + (unit.orderDays > 0 ? ' · 约 ' + unit.orderDays + ' 天' : '') : '待命';
    const photo = leader && Portraits[leader.name];
    const design = unitDesignOf(state, unit);
    const stats = design ? designStatsOf(state, unit.side, design) : null;
    const traits = leader ? leaderTraitsOf(state, leader.id) : [];
    const portrait = leader ? '<button class="commander-chip" type="button" data-leader="' + escape(leader.id) + '">'
      + (photo ? '<img src="' + escape(photo.file) + '" alt="' + escape(leader.name) + '">' : '')
      + '<span>指挥官<strong>' + escape(leader.name) + '</strong>'
      + (traits.length ? '<small>' + escape(traits.map((trait) => trait.name).join('/')) + ' · 等级 '
        + format(leaderLevelOf(state, leader.id)) + '</small>' : '') + '</span></button>' : '';
    return '<button class="link-button" type="button" data-back-roster>‹ 返回部队名册</button>'
      + '<div class="card"><div class="city-title"><h3 style="font-size:17px">' + escape(unit.name) + '</h3>'
      + sideTag(unit.side) + '</div><p>' + escape(cityName(unit.city)) + ' · ' + escape(orderLabel) + '</p>'
      + '<div class="unit-headline">' + portrait + '<div class="unit-readout"><span>现役 <strong>' + strength + '</strong> / ' + format(unit.maxStrength)
      + '</span><span>粮食 ' + format(unit.food) + '% · 装备 ' + format(unit.equipment) + '%</span>'
      + '<span>弹药 ' + percent(valueOf(unit, 'ammo', 100)) + ' · 油料 ' + percent(valueOf(unit, 'fuel', 100))
      + ' · 医疗 ' + percent(valueOf(unit, 'medical', 100)) + '</span>'
      + '<span>士气 ' + format(valueOf(unit, 'morale', 70)) + ' · 老兵 ' + format(valueOf(unit, 'veteran', 0))
      + ' 级 · 组织 ' + format(valueOf(unit, 'org', 100))
      + (valueOf(unit, 'wounded', 0) > 0 ? ' · 伤员 ' + format(unit.wounded) + ' 回补中' : '') + '</span>'
      + (design ? '<span>编制 ' + escape(design.name) + ' · 宽 ' + (stats?.width ?? 0).toFixed(1)
        + ' · 装 ' + (stats?.armor ?? 0) + ' · 穿 ' + (stats?.piercing ?? 0) + '</span>' : '')
      + (own ? '' : '<span>情报水平 ' + format(intelLevel) + '</span>')
      + (group ? '<span>' + escape(group.name) + '</span>' : '') + '</div></div>'
      + (allowed ? '<button type="button" class="link-button" data-delegate="' + escape(root?.id) + '">'
        + (root?.delegated ? '收回司令员指挥权' : '委托司令员指挥') + '</button>'
        + (root?.id === unit.id && typeof Engine.setLeader === 'function'
          ? '<button type="button" class="link-button" data-appoint="' + escape(unit.id) + '">任命将领</button>' : '')
        + '<button type="button" class="link-button" data-gear-unit>换装</button>'
        + (typeof Engine.setSupport === 'function'
          ? '<button type="button" class="link-button" data-formation="' + escape(root?.id ?? unit.id) + '">调整支援</button>' : '')
        + (typeof Engine.assignDesign === 'function'
          ? '<button type="button" class="link-button" data-defense-design="' + escape(root?.id ?? unit.id)
            + '">编制设计</button>' : '')
        + (typeof Engine.commandAbility === 'function'
          ? '<button type="button" class="link-button" data-defense-command="1">指挥技能</button>' : '')
        : '') + '</div>'
      + (root ? renderTree(root) : '')
      + '<div class="card support-card"><h3>支援编制</h3><p class="support-line">' + escape(supportLine(unit)) + '</p>'
      + '<p class="subtext">营级编制决定战斗宽度、装甲、穿甲与补给；支援连影响工事、减员与机动。</p></div>'
      + '<p class="subtext">师团人数为游戏推演。</p>';
  }

  function option(value, label, selected) {
    return '<option value="' + escape(value) + '"' + (value === selected ? ' selected' : '') + '>' + escape(label) + '</option>';
  }

  function armyInspector() {
    if (inspectUnit()) return unitInspector(inspectUnit());
    if (stack) {
      const ids = new Set(stack.units);
      const units = Engine.activeUnits(state).filter((unit) => ids.has(unit.id));
      return '<div class="city-title"><h3>' + escape(regions[stack.region] || cityName(stack.city))
        + '</h3></div><p class="roster-label">' + (stack.region ? '战区部队' : '同处部队') + '</p>'
        + unitRows(units, '这批部队已经转移。') + '<button type="button" class="link-button" data-back-roster>返回部队名册</button>';
    }
    const relevant = Engine.activeUnits(state).filter((unit) => !unit.parent
      && (rosterSide === 'all' || unit.side === (rosterSide === 'player' ? state.player : rosterSide))
      && (rosterRegion === 'all' || unit.area === (rosterRegion === 'current' ? area() : rosterRegion))
      && (!rosterGroup || unit.group === rosterGroup));
    const size = 12;
    const pages = Math.max(1, Math.ceil(relevant.length / size));
    rosterPage = Math.min(rosterPage, pages - 1);
    return '<div class="filters"><select id="roster-side" aria-label="阵营筛选">'
      + [['player', '当前阵营'], ['all', '全部阵营'], ['ccp', '共产党'], ['roc', '国民党']].map((item) => option(...item, rosterSide)).join('')
      + '</select><select id="roster-region" aria-label="战区筛选">' + option('current', '当前战区', rosterRegion)
      + option('all', '全国', rosterRegion) + Object.entries(regions).filter(([id]) => id !== 'national')
        .map((item) => option(...item, rosterRegion)).join('') + '</select></div>'
      + (rosterGroup ? '<p class="roster-label">' + escape(groupsById.get(rosterGroup)?.name || rosterGroup)
        + ' <button type="button" class="link-button" data-clear-group>取消筛选</button></p>' : '')
      + '<div class="unit-grid">' + unitRows(relevant.slice(rosterPage * size, (rosterPage + 1) * size), '这一范围内暂无编入的部队。') + '</div>'
      + (pages > 1 ? '<div class="roster-pages"><button data-roster-page="-1" type="button"' + (rosterPage === 0 ? ' disabled' : '')
        + '>上一页</button><span>第 ' + (rosterPage + 1) + ' / ' + pages + ' 页</span><button data-roster-page="1" type="button"'
        + (rosterPage === pages - 1 ? ' disabled' : '') + '>下一页</button></div>' : '');
  }

  function renderInspector() {
    const body = $('inspector-body');
    $('tab-city').setAttribute('aria-pressed', pane === 'city');
    $('tab-army').setAttribute('aria-pressed', pane === 'army');
    body.innerHTML = pane === 'army' ? armyInspector() : cityInspector();
  }

  function render() {
    supplyView = typeof Engine.supplyReading === 'function' ? Engine.supplyReading(Data, state) : null;
    renderHeader();
    renderLedger();
    renderInspector();
    renderCommandDeck();
    const unit = inspectUnit();
    orderPreviews = permitted(unit) ? Engine.previewOrders(Data, state, unit.id) : {};
    const plans = (state.plans || []).filter((plan) => plan.side === state.player
      && (plan.status === 'active' || plan.status === 'paused'))
      .map((plan) => ({
        ...plan,
        resolvedLine: typeof meta.resolvePlanLine === 'function'
          ? meta.resolvePlanLine(Data, state, plan) : plan.line,
      }));
    map.update(state, { city: selectedCity, unit: selectedUnit, command: pendingOrder, previews: orderPreviews,
      units: [...selectedUnits], plans, supply: supplyView,
      guideUnit: tutorial?.step === 0 ? 'nw3' : undefined });
    renderTutorial();
  }

  function setRun(next) {
    running = Boolean(next) && !state.winner;
    clearInterval(timer);
    if (running) timer = setInterval(() => tick(speed), speed === 3 ? 330 : 620);
    renderHeader();
  }

  function tick(days) {
    const winner = state.winner;
    for (let elapsed = 0; elapsed < days && !state.winner; elapsed++) {
      const seen = state.eventSequence ?? state.log.at(-1)?.seq ?? 0;
      Engine.step(Data, state, 1);
      const entries = state.log.filter((entry) => (entry.seq || 0) > seen);
      if (tutorial?.step === 2) {
        const result = entries.find((entry) => entry.city === 'jinzhou'
          && (entry.type === 'battle-end' || entry.type === 'capture' || entry.phase === 'cleared'));
        if (result) { tutorial.entry = result; tutorial.step = 3; setRun(false); }
      }
      const local = entries.filter(importantBrief);
      if (local.length) recentBrief = local.at(-1);
      const pause = local.find((entry) => pausePreferences[briefKind(entry)]);
      if (pause) {
        setRun(false);
        recentBrief = pause;
        notify('已自动暂停 · ' + pause.text);
        saveAuto(true);
        break;
      }
      if (tutorial?.step === 3 && !running) break;
    }
    if (state.winner) {
      setRun(false);
      if (!winner) notify(sides[state.winner] + '达成统一目标。');
    }
    if (Number(state.date.slice(-2)) % 4 === 0 || state.winner) saveAuto();
    render();
  }

  function selectUnit(unitId, jump = true) {
    const unit = state.units.find((item) => item.id === unitId);
    if (!unit) return;
    pendingOrder = undefined;
    selectedUnit = unitId;
    selectedUnits = new Set();
    stack = undefined;
    selectedCity = unit.city;
    pane = 'army';
    if (tutorial?.step === 0 && unit.id === 'nw3') tutorial.step = 1;
    setMapHelp();
    render();
    if (jump) map.jump(unit.city);
  }

  function selectCity(city, useOrder = false, jump = false) {
    if (!citiesById.has(city)) return;
    if (useOrder && pendingOrder && selectedUnit) {
      issue(pendingOrder, city);
      return;
    }
    selectedCity = city;
    stack = undefined;
    selectedUnit = undefined;
    selectedUnits = new Set();
    pendingOrder = undefined;
    pane = 'city';
    setMapHelp();
    render();
    if (jump) map.jump(city);
  }

  let lastActionResult = null;

  function action(key, args) {
    const before = { state: Engine.snapshot(state), timeline: structuredClone(timeline) };
    const result = Timeline.apply(timeline, Engine, Data, state, key, args);
    lastActionResult = result;
    if (result?.ok === false) { notify(result.error); return false; }
    undoStack.push(before);
    if (undoStack.length > undoLimit) undoStack.shift();
    return true;
  }

  function undo() {
    const entry = undoStack.pop();
    if (!entry) { notify('没有可撤销的操作。'); return; }
    state = entry.state;
    timeline = entry.timeline;
    pendingOrder = undefined;
    selectedUnit = undefined;
    selectedUnits = new Set();
    stack = undefined;
    fortCity = undefined;
    setMapHelp();
    render();
    saveAuto(true);
    notify('已撤销上一步。');
  }

  function setMapHelp() {
    $('map-help').textContent = pendingOrder
      ? (pendingOrder === 'bombard' ? '战略轰炸 · 点击 18 度范围内敌城' : enemyCommands.has(pendingOrder) ? '命令目标 · 点击相邻敌城或隔海目标' : '命令目标 · 点击有己方通路的城镇')
      : selectedUnits.size > 1 ? '已选 ' + selectedUnits.size + ' 支 · 点「编成计划」统一目标'
        : permitted(inspectUnit()) ? '浅蓝为调动 · 暖色为进攻 · 悬停查看时间 · Ctrl 点击多选'
          : '点击部队牌选中 · 右键或拖到城镇下令 · 滚轮缩放';
  }

  function issue(type, target) {
    if (!action('order', [selectedUnit, type, target])) return;
    if (tutorial?.step === 1 && target === 'jinzhou' && ['advance', 'siege'].includes(type)) {
      tutorial.step = 2;
      tutorial.start = state.date;
    }
    pendingOrder = undefined;
    setMapHelp();
    saveAuto(true);
    render();
    notify(commands[type] + '命令已下达。');
  }

  function previewCity(city, _screen, draggedUnit) {
    const unit = draggedUnit ? state.units.find((item) => item.id === draggedUnit) : inspectUnit();
    if (!permitted(unit)) return '';
    const type = pendingOrder || (state.owners[city] === state.player ? 'move' : 'advance');
    const preview = !draggedUnit || draggedUnit === selectedUnit ? orderPreviews[city]?.[type]
      : Engine.previewOrder(Data, state, unit.id, type, city);
    if (!preview) return '';
    return cityName(city) + ' · ' + commands[type] + ' · ' + (preview.ok
      ? (preview.days ? '约 ' + preview.days + ' 天' : '可在当前位置执行') : preview.error);
  }

  function quickOrder(target, unitId) {
    if (unitId && unitId !== selectedUnit) selectUnit(unitId, false);
    const unit = inspectUnit();
    if (!permitted(unit)) { notify('先点击地图上的己方部队牌。'); return; }
    const type = pendingOrder || (state.owners[target] === state.player ? 'move' : 'advance');
    issue(type, target);
  }

  function chooseCommand(type) {
    if (!permitted(inspectUnit())) { notify('先点击地图上的己方部队牌，或在部队名册中选择。'); return; }
    if (type === 'hold') { issue(type, inspectUnit().city); return; }
    pendingOrder = pendingOrder === type ? undefined : type;
    setMapHelp();
    render();
  }

  function renderCommandDeck() {
    const unit = inspectUnit();
    const count = selectedUnits.size;
    $('deck-unit').textContent = unit
      ? unit.name + ' · ' + cityName(unit.city) + (count > 1 ? '（编队 ' + count + ' 支）' : '')
      : '作战命令';
    $('deck-hint').textContent = count > 1
      ? '已选 ' + count + ' 支部队：点「编成计划」统一指定战线与目标'
      : pendingOrder ? '已选' + commands[pendingOrder] + '，点击地图目标'
        : unit && permitted(unit) ? '点选命令再选城镇，或右键直接下令 · Ctrl 点击多选'
          : '在地图上点击己方部队牌，可向纵队、师、团下令';
    $('command-bar').innerHTML = Object.entries(commands).map(([type, label]) => '<button type="button" data-command="'
      + type + '" data-deck-command="' + type + '" aria-pressed="' + (pendingOrder === type) + '">'
      + label + '</button>').join('')
      + '<button type="button" data-command="bombard" data-deck-command="bombard" aria-pressed="' + (pendingOrder === 'bombard') + '"'
      + (unit && permitted(unit) && (state.airWar?.[state.player]?.planes ?? 0) >= 10 ? '' : ' disabled') + '>战略轰炸</button>'
      + '<button type="button" data-deck-plan' + (count > 1 || unit ? '' : ' disabled') + '>编成计划</button>'
      + (count > 1 ? '<button type="button" data-deck-clear>清空编队</button>' : '')
      + '<button type="button" data-deck-undo' + (undoStack.length ? '' : ' disabled') + '>撤销</button>'
      + '<button type="button" data-deck-target' + (pendingOrder ? '' : ' disabled') + '>选目标</button>'
      + '<button type="button" data-deck-cancel' + (pendingOrder ? '' : ' disabled') + '>取消</button>';
  }

  function changeScope(scope, region) {
    if (scope === 'theater' && region && citiesById.get(selectedCity)?.region !== region) {
      selectedCity = Data.cities.filter((city) => city.region === region).sort((a, b) => b.value - a.value)[0]?.id || selectedCity;
      selectedUnit = undefined;
      selectedUnits = new Set();
      pendingOrder = undefined;
      pane = 'city';
    }
    action('setScope', [scope, region || area()]);
    if (scope === 'national') rosterRegion = 'all';
    else rosterRegion = 'current';
    rosterPage = 0;
    setMapHelp();
    saveAuto(true);
    render();
    map.focus(scope === 'national' ? 'national' : area(), selectedCity);
  }

  function setActive(data, history, persist = true) {
    state = data;
    timeline = history;
    tutorial = stack = recentBrief = undefined;
    setRun(false);
    pendingOrder = undefined;
    selectedUnits = new Set();
    fortCity = undefined;
    rosterGroup = '';
    rosterPage = 0;
    rosterSide = 'player';
    rosterRegion = state.scope === 'national' ? 'all' : 'current';
    pane = 'city';
    selectedCity = citiesById.has(state.entryCity) ? state.entryCity : scenarioNow()?.focus || Data.cities[0]?.id;
    selectedUnit = undefined;
    saveDay = '';
    if (dialog.open) dialog.close();
    setMapHelp();
    renderScenarios();
    render();
    map.focus(state.scope === 'national' ? 'national' : area(), selectedCity);
    if (persist) saveAuto(true);
  }

  function showDialog(title, html) {
    setRun(false);
    $('dialog-title').textContent = title;
    $('dialog-body').innerHTML = html;
    if (!dialog.open) dialog.showModal();
    return $('dialog-body');
  }

  function listScenarios() {
    showDialog('选择战役或日期', '<p>选择剧本后可以换边、调整开局日期及历史事件模式。</p><div class="detail-grid">'
      + Data.scenarios.map((scenario) => '<article class="card"><h3>' + escape(scenario.title)
        + '</h3><p>' + fmtDate(scenario.date) + '</p><p>' + escape(scenario.summary)
        + '</p><div class="dialog-actions"><button type="button" data-start-choice="' + escape(scenario.id)
        + '">设置开局</button><button type="button" class="link-button" data-history="' + escape(scenario.id)
        + '">历史资料</button></div></article>').join('') + '</div>');
  }

  function chooseScenario(id, checkpoint) {
    const scenario = scenariosById.get(id) || Data.scenarios[0];
    const body = showDialog(scenario.title, '<p>' + escape(checkpoint?.summary || scenario.summary) + '</p><form id="start-form"><div class="form-grid">'
      + '<label>剧本<select name="scenario">' + Data.scenarios.map((item) => option(item.id, item.title, scenario.id)).join('') + '</select></label>'
      + '<label>开局日期<input required type="date" name="date" min="1945-08-15" max="1951-12-31" value="' + (checkpoint?.date || scenario.date) + '"></label>'
      + '<label>接管阵营<select name="side">' + Object.entries(sides).map((item) => option(...item, state.player)).join('') + '</select></label>'
      + '<label>指挥范围<select name="scope">' + option('theater', '当前战区', scenario.id === 'full' ? 'national' : 'theater') + option('national', '全国', scenario.id === 'full' ? 'national' : 'theater') + '</select></label>'
      + '<label>事件<select name="historyMode">' + option('historical', '历史事件优先', state.historyMode) + option('dynamic', '随局势推演', state.historyMode) + '</select></label>'
      + '<label>统一目标<select name="goal">' + option('mainland', '统一大陆', state.goal) + option('all', '统一大陆及台湾', state.goal) + '</select></label>'
      + '</div><div class="dialog-actions"><button class="gold" type="submit">接管并开始</button><button type="button" id="back-scenarios">返回剧本列表</button></div></form>');
    const form = body.querySelector('form');
    form.elements.scenario.addEventListener('change', () => chooseScenario(form.elements.scenario.value));
    $('back-scenarios').onclick = listScenarios;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const options = Object.fromEntries(new FormData(form));
      options.scenarioId = options.scenario;
      const exactPoint = options.date === checkpoint?.date ? checkpoint : undefined;
      if (exactPoint) options.area = citiesById.get(exactPoint.city)?.region;
      const created = Engine.createGame(Data, options);
      if (exactPoint) {
        created.entryCity = exactPoint.city;
        created.checkpointId = exactPoint.id;
        Object.assign(created.owners, exactPoint.overrides || {});
        const unitById = new Map(created.units.map((unit) => [unit.id, unit]));
        for (const position of exactPoint.deployments || []) {
          const historicalUnit = unitById.get(position.unitId);
          if (!historicalUnit || historicalUnit.side !== position.side || created.owners[position.city] !== position.side) continue;
          for (const unit of created.units) {
            let root = unit;
            while (root.parent && unitById.has(root.parent)) root = unitById.get(root.parent);
            if (root !== historicalUnit) continue;
            unit.city = position.city;
            unit.area = citiesById.get(position.city).region;
          }
        }
      }
      if (state.date > timeline.origin.date || timeline.commands.length) saveSlot();
      setActive(created, Timeline.create(created, Engine));
      if (exactPoint && created.scope === 'theater') map.jump(exactPoint.city);
      const here = created.owners[scenario.focus];
      if (here) notify('已接管' + sides[created.player] + '。');
    });
  }

  function checkpointButtons(points, limit = points.length) {
    return '<div class="checkpoint-list">' + points.slice(0, limit).map((point) => '<button type="button" data-checkpoint="'
      + escape(point.id) + '"><small>' + escape(point.date) + '</small>' + escape(point.title) + '</button>').join('') + '</div>';
  }

  function openCheckpoint(id) {
    const point = checkpointById.get(id);
    if (!point) return;
    const deployments = point.deployments || [];
    showDialog(point.title, '<p>' + escape(point.date + ' · ' + cityName(point.city)) + '</p><p>' + escape(point.summary)
      + '</p><p>' + sourceLink(point.source, '史料出处') + '</p>'
      + (deployments.length ? '<table class="dialog-table"><thead><tr><th>史料所载部队</th><th>地点</th><th>阵营</th></tr></thead><tbody>'
        + deployments.map((unit) => '<tr><td>' + escape(unit.name) + ' ' + sourceLink(unit.source, '出处') + '</td><td>'
          + escape(cityName(unit.city)) + '</td><td>' + escape(short[unit.side]) + '</td></tr>').join('') + '</tbody></table>' : '')
      + '<p>已核实的位置用于调整部分开局部队，其他部署和人数沿用游戏模型。</p><div class="dialog-actions">'
      + '<button class="gold" type="button" data-play-checkpoint="' + escape(id) + '">从该日期接管</button>'
      + '<button type="button" data-locate-city="' + escape(point.city) + '">定位地图</button></div>');
  }

  function history(id) {
    const scenario = scenariosById.get(id);
    if (scenario) {
      const events = (Data.events || []).filter((item) => item.city === scenario.focus || item.scenario === scenario.id);
      const layerId = historyFamily(id);
      const layers = (Data.battleLayers || []).filter((layer) => layer.id === layerId
        || (layerId === 'huaihai' && layer.id === 'xuzhou-line'));
      const checkpoints = [...checkpointById.values()].filter((point) => historyFamily(point.scenarioId) === layerId);
      showDialog(scenario.title + ' · 历史资料', '<p>' + fmtDate(scenario.date) + ' · ' + escape(cityName(scenario.focus))
        + '</p><p>' + escape(scenario.summary) + '</p><p>' + sourceLink(scenario.source, '原始资料') + '</p>'
        + (checkpoints.length ? '<h3>关键日期</h3>' + checkpointButtons(checkpoints) : '')
        + layers.map((layer) => '<details class="card"><summary>' + escape(layer.name) + '</summary><div class="stack">'
          + layer.paths.map((route) => '<button type="button" data-locate-city="' + escape(route.points.at(-1))
            + '">' + escape(route.label) + '</button>').join('') + sourceLink(layer.source, '标注出处') + '</div></details>').join('')
        + events.map((item) => '<article class="card"><h3>' + escape(item.date + ' · ' + item.title)
          + '</h3><p>' + escape(item.detail) + ' ' + sourceLink(item.source, '出处') + '</p></article>').join('')
        + '<div class="dialog-actions"><button type="button" class="gold" data-start-choice="' + escape(scenario.id)
        + '">从这里开局</button><button type="button" data-open-archive>全部档案</button></div>');
      return;
    }
    showDialog('战史档案', '<p>游戏的城市归属、兵力和战报包含推演结果。历史资料以各条出处为准。</p>'
      + '<div class="stack">' + Data.scenarios.map((item) => '<button type="button" data-history="' + escape(item.id)
        + '">' + escape(item.title) + ' · ' + item.date + '</button>').join('') + '</div>'
      + '<details class="card"><summary>将领档案</summary><div class="detail-grid">'
      + [...leadersById.values()].map(leaderCard).join('') + '</div></details>'
      + '<details class="card"><summary>数据说明与参考资料</summary><div class="stack">'
      + (Data.notes || []).map((item) => '<p>' + escape(item) + '</p>').join('')
      + '<p>高程用于生成地形图和等高线。省界是现代地理参照，历史城镇、控制范围及路线采用剧本数据。</p>'
      + (globalThis.CivilWarGeography?.sources || []).map((item) => sourceLink(item.url, item.title)).join('')
      + (Data.sources || []).map((item) => sourceLink(item.url, item.title)).join('') + '</div></details>');
  }

  function territoryReport() {
    const changes = Data.cities.filter((city) => state.owners[city.id] !== timeline.origin.owners[city.id]);
    const last = new Map();
    for (const entry of state.log) {
      if (entry.city && entry.side && (entry.type === 'capture' || entry.previousSide)) last.set(entry.city, entry);
    }
    const total = Engine.stats(Data, state);
    const initial = Engine.stats(Data, timeline.origin);
    const sideRows = ['ccp', 'roc'].map((side) => {
      const delta = total[side] - initial[side];
      return '<tr><td>' + sideTag(side) + '</td><td>' + initial[side] + '</td><td>' + total[side]
        + '</td><td>' + (delta >= 0 ? '+' : '') + delta + '</td></tr>';
    }).join('');
    const nodes = changes.map((city) => {
      const entry = state.cityRecords?.[city.id] || last.get(city.id);
      const date = entry ? '<button type="button" class="link-button" data-city-report="' + escape(city.id) + '">'
        + escape(entry.date) + '</button>' : '—';
      return '<tr><td><button type="button" class="link-button" data-locate-city="' + escape(city.id)
        + '">' + escape(city.name) + '</button></td><td>' + escape(short[timeline.origin.owners[city.id]])
        + '</td><td>' + escape(short[state.owners[city.id]]) + '</td><td>' + date + '</td></tr>';
    });
    showDialog('城镇归属变化', '<p>这是全国地图的城镇控制数。驻军人数与城镇控制分开计算。</p><table class="dialog-table"><thead><tr>'
      + '<th>阵营</th><th>开局</th><th>当前</th><th>变化</th></tr></thead><tbody>' + sideRows + '</tbody></table>'
      + (nodes.length ? '<table class="dialog-table"><thead><tr><th>城镇</th><th>开局归属</th><th>当前归属</th><th>最近记录'
        + '</th></tr></thead><tbody>' + nodes.join('') + '</tbody></table>' : '<p>当前归属和本局开局一致。</p>'));
  }

  function historicalEvents() {
    const future = (Data.events || []).filter((event) => event.date >= state.date);
    const body = showDialog('历史事件', '<div class="dialog-actions"><button type="button" data-history-setting="historical" aria-pressed="'
      + (state.historyMode === 'historical') + '">按历史节点</button><button type="button" data-history-setting="dynamic" aria-pressed="'
      + (state.historyMode === 'dynamic') + '">随战局推演</button></div>'
      + '<div class="card"><h3>后续事件</h3><p>勾选的节点在历史模式中生效。你已改写的战果会优先保留。</p>'
      + '<label class="field">选择时段<select id="events-window"></select></label><div id="event-options"></div></div>');
    const selector = body.querySelector('#events-window');
    const groups = new Map();
    for (const event of future) {
      const key = event.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    }
    selector.innerHTML = Array.from(groups.keys(), (month) => option(month, month.replace('-', ' 年 ') + ' 月')).join('');
    selector.disabled = !groups.size;
    const rows = body.querySelector('#event-options');
    const updateEvents = () => {
      const items = groups.get(selector.value) || [];
      rows.innerHTML = items.length ? items.map((item) => '<label class="event-row"><span>'
        + escape(item.date + ' · ' + item.title) + '</span><input type="checkbox" aria-label="' + escape(item.title)
        + '" data-event-check="' + escape(item.id) + '"' + (state.historicalEvents?.[item.id] === false ? '' : ' checked') + '></label>').join('')
        : '<p>这个开局日期之后暂无校录史实节点。</p>';
    };
    selector.onchange = updateEvents;
    updateEvents();
    rows.onchange = (event) => {
      const box = event.target;
      if (!box.dataset.eventCheck) return;
      if (action('setHistoricalEvent', [box.dataset.eventCheck, box.checked])) saveAuto(true);
    };
    body.querySelectorAll('[data-history-setting]').forEach((button) => {
      button.onclick = () => {
        action('setHistoryMode', [button.dataset.historySetting]);
        saveAuto(true);
        body.querySelectorAll('[data-history-setting]').forEach((item) =>
          item.setAttribute('aria-pressed', item.dataset.historySetting === state.historyMode));
        notify(state.historyMode === 'historical' ? '历史节点已启用。' : '战局将按当前局势推演。');
      };
    });
  }

  function gear() {
    const active = Engine.activeUnits(state).filter((unit) => !unit.parent && permitted(unit));
    const selected = permitted(inspectUnit()) ? inspectUnit() : active[0];
    const choices = selected?.parent ? [selected, ...active] : active;
    const body = showDialog('兵种与军械', choices.length ? '<p>选定纵队、师或团后换装。费用从本阵营的军械和财政中扣除。</p>'
      + '<form><label class="field">换装部队<select name="unit">'
      + choices.map((unit) => option(unit.id, unit.name + ' · ' + cityName(unit.city), selected?.id)).join('')
      + '</select></label><p id="unit-gear-current" class="roster-label"></p><div class="gear-options">'
      + Object.entries(equipmentTypes).filter(([id]) => id !== 'mixed').map(([id, [label, detail]]) => '<article class="card"><div><h3>'
        + label + '</h3><p>' + detail + '</p></div><button type="submit" name="profile" value="' + id + '">换用</button></article>').join('')
      + '</div></form>' : '<p>请选择有己方可控部队的战区。</p>');
    const form = body.querySelector('form');
    if (!form) return;
    const update = () => {
      const unit = state.units.find((item) => item.id === form.elements.unit.value);
      const profile = unit.profile || unit.branch || 'infantry';
      $('unit-gear-current').textContent = '现用' + equipmentTypes[profile][0] + ' · 军械库存 ' + format(state.economy[state.player].arms);
      body.querySelectorAll('[name="profile"]').forEach((button) => { button.disabled = button.value === profile; });
    };
    form.elements.unit.onchange = update;
    update();
    form.onsubmit = (event) => {
      event.preventDefault();
      const id = form.elements.unit.value;
      const profile = event.submitter?.value;
      if (profile && action('setEquipment', [id, profile])) {
        saveAuto(true);
        update();
        render();
        notify('已换用' + equipmentTypes[profile][0] + '。');
      }
    };
  }

  function guide() {
    showDialog('作战操作', '<div class="stack"><div class="card"><h3>选部队</h3><p>点击地图上带番号和兵力的部队牌。'
      + '右侧直接展开纵队、师和团，点击任意一行可切换指挥对象。按住 Ctrl 或 Shift 点击可多选。</p></div>'
      + '<div class="card"><h3>下命令</h3><p>选中后，右键相邻敌城进攻，右键己方城镇调动。'
      + '也可以拖动部队牌到目标，或先选底部的命令再点击地图。围城和围点打援均需选相邻敌城。</p></div>'
      + '<div class="card"><h3>作战计划</h3><p>Ctrl 多选部队后点底部的「编成计划」，先选<strong>作战决心</strong>：'
      + '突击目标、守备战线、沿战线进攻或后撤至战线，并指定目标与战线。'
      + '统一预览后一键执行，执行中可暂停、撤销或交给司令员。</p></div>'
      + '<div class="card"><h3>组织度与战役</h3><p>部队牌底部的小条是组织度。进攻与防守按日消耗组织度，'
      + '组织度先耗尽的一方退出战斗：守军通常撤退而不是被全歼，只有在没有退路时才会成建制被俘。'
      + '驻防和补给充足的部队每天恢复组织度。</p></div>'
      + '<div class="card"><h3>政治与决议</h3><p>顶部「政治决议」用政治点执行策反、整军、空运补给与动员。'
      + '战争支持度会随城镇得失升降，支持度崩溃又丢掉首都时，这一方可能停战。</p></div>'
      + '<div class="card"><h3>国防与建设</h3><p>顶部「国防建设」有国策、科研、生产、编制、空军、海军、指挥与情报八个页签：'
      + '国策按天推进；科研解锁装备型号与装甲营；生产把工厂分到四条装备线与运输船；'
      + '编制设计营级模板并指派给部队；空军切换制空/近距支援/遮断/空投；'
      + '海军决定渡海运力；指挥点可下强行军、死守与炮火准备；情报页处理抵抗、法令与外交。</p></div>'
      + '<div class="card"><h3>铁路补给</h3><p>顶部「铁路补给」查看后方库存、运输瓶颈与各城镇补给覆盖，'
      + '并在地图上标出缺口。弹药、油料、医疗物资分别计算，补给越差，部队战斗力与整补越慢。</p></div>'
      + '<div class="card"><h3>工事与编制</h3><p>城镇面板的「修筑工事」由驻军工兵施工，可修战壕、掩体、障碍、'
      + '碉堡、固定炮位与补给站。部队面板的「调整编制」可分配装甲、炮兵、工兵、医护和运输支援。</p></div>'
      + '<div class="card"><h3>看战局</h3><p>空格暂停或继续。滚轮缩放，拖动空白处平移。通过工具栏选择战区和地图图层。'
      + '战报会列出伤亡、伤员、俘虏和缴获，左侧的「变化」会显示两方从开局至今的城镇归属变化。</p></div></div>');
  }

  function startTutorial() {
    showDialog('锦州第一局', '<p>练习选中第三纵队、下达命令、推进到锦州战报，再从同一局转到塔山。引导可随时跳过。</p>'
      + '<button type="button" id="tutorial-start" class="gold">开始锦州引导</button>');
    $('tutorial-start').onclick = () => {
      if (state.date > timeline.origin.date || timeline.commands.length) saveSlot();
      const fresh = Engine.createGame(Data, { scenarioId: 'jinzhou', side: 'ccp',
        scope: 'theater', historyMode: 'dynamic', goal: 'mainland' });
      setActive(fresh, Timeline.create(fresh, Engine));
      tutorial = { step: 0 };
      render();
    };
  }

  function renderTutorial() {
    const card = $('tutorial-card');
    card.hidden = !tutorial;
    if (!tutorial) { card.replaceChildren(); return; }
    const [title, guidance, button] = tutorialSteps[tutorial.step];
    card.innerHTML = '<header><span class="tutorial-step">锦州第一局 · ' + (tutorial.step + 1) + ' / '
      + tutorialSteps.length + '</span><button type="button" class="link-button" data-tutorial-skip>跳过</button></header>'
      + '<h3>' + title + '</h3><p>' + guidance + '</p><button type="button" class="gold" data-tutorial-next>'
      + button + '</button>';
  }

  function tutorialNext() {
    if (tutorial.step === 0) { selectUnit('nw3'); return; }
    if (tutorial.step === 1) {
      if (inspectUnit()?.id !== 'nw3') selectUnit('nw3');
      if (pendingOrder !== 'advance') chooseCommand('advance');
      return;
    }
    if (tutorial.step === 2) {
      setRun(false);
      tick(18);
      if (tutorial?.step === 2) {
        const fallback = state.log.slice().reverse().find((entry) => entry.city === 'jinzhou'
          && entry.date >= tutorial.start && entry.type !== 'reference');
        if (fallback) { tutorial.entry = fallback; tutorial.step = 3; renderTutorial(); }
        else notify('锦州行动仍在进行，请查看部队状态后继续推进。');
      }
      return;
    }
    if (tutorial.step === 3) {
      const report = tutorial.entry;
      tutorial.step = 4;
      renderTutorial();
      showBrief(report);
      return;
    }
    tutorial = undefined;
    selectCity('tashan', false, true);
    notify('已转到塔山，继续当前战局。');
  }

  function briefKind(entry) {
    if (entry.previousSide && entry.previousSide !== entry.side) return 'capture';
    if (entry.type === 'battle-start') return 'battle';
    if (entry.phase === 'arrival' && entry.side === state.player) return 'arrival';
    return '';
  }

  function importantBrief(entry) {
    if (!briefKind(entry) && !['battle-end', 'divergence', 'intercept', 'victory'].includes(entry.type)
      && entry.phase !== 'cleared') return false;
    return state.scope === 'national' || entry.side === state.player || entry.previousSide === state.player
      || entry.defendingSide === state.player || citiesById.get(entry.city)?.region === area();
  }

  function configurePauses() {
    const body = showDialog('战报自动暂停', '<p>勾选后，相关事件会在当天结束时暂停。战区视角优先提醒本方或当前战区。</p>'
      + Object.entries(pauseLabels).map(([id, name]) => '<label class="event-row"><span>' + name
        + '</span><input type="checkbox" data-pause-kind="' + id + '"' + (pausePreferences[id] ? ' checked' : '')
        + ' aria-label="' + name + '"></label>').join(''));
    body.onchange = (event) => {
      const key = event.target.dataset.pauseKind;
      if (!key) return;
      pausePreferences[key] = event.target.checked;
      try { localStorage.setItem(storageKey + '-auto-pause', JSON.stringify(pausePreferences)); } catch { /* 保留本次设置 */ }
      renderHeader();
    };
  }

  function aftermathTable(record) {
    if (!record) return '';
    const name = (side) => short[side] || '未定';
    return '<h3>战斗后果</h3><table class="dialog-table"><thead><tr><th>项目</th><th>进攻方 '
      + escape(name(record.side)) + '</th><th>守方 ' + escape(name(record.defendingSide)) + '</th></tr></thead><tbody>'
      + '<tr><td>投入兵力</td><td>' + format(record.attackerStrength) + '</td><td>' + format(record.defenderStrength) + '</td></tr>'
      + '<tr><td>进攻方向</td><td colspan="2">' + format(record.attackDirections || 1) + ' 个</td></tr>'
      + '<tr><td>阵亡与减员</td><td>' + format(record.attackerCasualties) + '</td><td>' + format(record.defenderCasualties) + '</td></tr>'
      + '<tr><td>伤员（回补）</td><td colspan="2">' + format(record.wounded) + '</td></tr>'
      + '<tr><td>俘虏</td><td>' + format(record.prisoners) + '</td><td>—</td></tr>'
      + '<tr><td>缴获军械</td><td>' + format(record.captured.arms) + '</td><td>—</td></tr>'
      + '<tr><td>缴获油料 / 医疗</td><td>' + format(record.captured.fuel) + ' / '
      + format(record.captured.medical) + '</td><td>—</td></tr>'
      + '<tr><td>士气变化</td><td>' + (record.moraleAttack >= 0 ? '+' : '') + record.moraleAttack
      + '</td><td>' + (record.moraleDefend >= 0 ? '+' : '') + record.moraleDefend + '</td></tr>'
      + '<tr><td>老兵经验</td><td colspan="2">'
      + escape(short[record.experience] || '') + ' +0.5 级</td></tr></tbody></table>';
  }

  function showBrief(entry) {
    if (!entry) { showLog(); return; }
    const forces = Array.isArray(entry.nearbyUnits) ? entry.nearbyUnits : [];
    showDialog('战况简报', '<h3>' + escape(entry.date + ' · ' + (entry.city ? cityName(entry.city) : '全国')) + '</h3>'
      + '<p>' + escape(entry.text) + '</p>'
      + (entry.previousSide ? '<p>城镇归属 · ' + escape(short[entry.previousSide]) + ' → ' + escape(short[entry.side]) + '</p>' : '')
      + (entry.fort ? '<p class="subtext">守方工事加成 +' + Math.round(entry.fort * 100) + '%'
        + (entry.obstacle ? ' · 障碍削弱进攻 −' + (entry.obstacle * 100).toFixed(1) + '%' : '') + '</p>' : '')
      + aftermathTable(entry.aftermath)
      + (forces.length ? '<table class="dialog-table"><thead><tr><th>附近部队</th><th>位置</th><th>当时兵力</th></tr></thead><tbody>'
        + forces.map((unit) => '<tr><td>' + escape(unit.name) + ' · ' + escape(short[unit.side]) + '</td><td>'
          + escape(cityName(unit.city)) + '</td><td>' + (unit.side === state.player ? format(unit.strength)
            : '约 ' + format(Math.round(unit.strength / 100) * 100)) + '</td></tr>').join('') + '</tbody></table>' : '')
      + '<div class="dialog-actions">' + (entry.city ? '<button class="gold" type="button" data-locate-city="'
        + escape(entry.city) + '">定位城镇</button>' : '') + '<button type="button" data-open-log>返回全部记录</button></div>');
  }

  function regionalGroups() {
    const current = state.group;
    showDialog('地方派系', '<p>派系标记沿用部队和将领的历史关联。可查看归属并筛选部队。</p>'
      + '<div class="detail-grid">' + [...groupsById.values()].map((group) => {
        const count = Engine.activeUnits(state).filter((unit) => !unit.parent && unit.group === group.id).length;
        return '<article class="card"><h3>' + escape(group.name) + '</h3><p>' + escape(group.summary) + '</p><p>'
          + escape(regions[group.region] || '') + ' · 在役部队 ' + count + ' 支</p><div class="dialog-actions">'
          + (count ? '<button type="button" data-group-roster="' + escape(group.id) + '">查看部队</button>' : '')
          + (count && typeof Engine.setGroup === 'function' ? '<button type="button" data-group-control="'
            + escape(group.id) + '">' + (current === group.id ? '接管阵营全局' : '接管此派系') + '</button>' : '')
          + sourceLink(group.source, '史料') + '</div></article>';
      }).join('') + '</div>');
  }

  function planSummary(plan) {
    if (typeof Engine.previewPlan !== 'function') return '<p class="empty">引擎不支持计划预览。</p>';
    const preview = Engine.previewPlan(Data, state, plan.id);
    const rows = preview.rows.map((row) => {
      const unit = state.units.find((member) => member.id === row.unitId);
      const detail = row.ok
        ? commands[row.type] + ' ' + cityName(row.target) + (row.days ? ' · 约 ' + row.days + ' 天' : '')
        : row.error;
      return '<li><span>' + escape(unit?.name || row.unitId) + '</span><em>' + escape(detail) + '</em></li>';
    }).join('');
    return '<p class="subtext">' + escape(planStanceNames[plan.stance] || planStanceNames.spearhead)
      + ' · ' + escape(planModeNames[plan.mode] || plan.mode) + ' · ' + escape(cityName(plan.target))
      + (plan.line?.length ? ' · 战线 ' + plan.line.length + ' 城' : plan.autoLine ? ' · 自动战线' : '')
      + (plan.front ? ' · 集结 ' + escape(cityName(plan.front)) : '')
      + (plan.autoLine || plan.line?.length ? ' · 战线 ' + (plan.autoLine ? '自动' : escape(plan.line.map(cityName).join('、'))) : '')
      + ' · ' + plan.units.length + ' 支部队' + (preview.days ? ' · 约 ' + preview.days + ' 天' : '')
      + (preview.ok ? '' : ' · 暂不可执行') + '</p><ul class="plan-units">' + rows + '</ul>';
  }

  function plansPanel() {
    const plans = (state.plans || []).filter((plan) => plan.side === state.player)
      .sort((a, b) => String(b.created).localeCompare(String(a.created)));
    const cards = plans.map((plan) => '<article class="card plan-card"><header><h3>' + escape(plan.name)
      + '</h3><span class="plan-status is-' + escape(plan.status) + '">'
      + escape(planStatusNames[plan.status] || plan.status)
      + (plan.delegated ? ' · 司令员' : '') + '</span></header>'
      + planSummary(plan)
      + '<div class="unit-actions">'
      + (plan.status === 'active'
        ? '<button type="button" data-plan-pause="' + escape(plan.id) + '">暂停</button>'
        : '<button type="button" class="gold" data-plan-run="' + escape(plan.id) + '">执行</button>')
      + '<button type="button" data-plan-delegate="' + escape(plan.id) + '">'
      + (plan.delegated ? '收回指挥权' : '委任司令员') + '</button>'
      + '<button type="button" data-plan-edit="' + escape(plan.id) + '">编辑</button>'
      + '<button type="button" data-plan-locate="' + escape(plan.target) + '">定位目标</button>'
      + '<button type="button" data-plan-remove="' + escape(plan.id) + '">撤销</button>'
      + '</div></article>').join('');
    showDialog('作战计划', '<p>作战计划把多支部队绑定在同一个目标上：执行时按各自位置分配接敌或行军命令，'
      + '可随时暂停、撤销，也可以交给司令员按补给和战况继续调整。</p>'
      + (plans.length ? cards : '<p class="empty">还没有作战计划。在地图上按住 Ctrl 点击部队牌多选，'
        + '再点底部的「编成计划」。</p>')
      + '<div class="dialog-actions"><button class="gold" type="button" data-plan-new>新建计划</button>'
      + '<button type="button" data-plan-close>关闭</button></div>');
  }

  function planEditor(planId) {
    const plan = planId ? (state.plans || []).find((item) => item.id === planId && item.side === state.player) : null;
    const units = Engine.activeUnits(state).filter((member) => !member.parent && permitted(member))
      .sort((a, b) => b.strength - a.strength);
    const current = plan ? plan.units
      : selectedUnits.size ? [...selectedUnits]
        : selectedUnit && topUnit(inspectUnit()) ? [topUnit(inspectUnit()).id] : [];
    const selected = new Set(current);
    const target = plan?.target || (selectedUnit ? inspectUnit().city : selectedCity)
      || scenarioNow()?.focus || Data.cities[0]?.id;
    const stance = plan?.stance || 'spearhead';
    const autoLine = plan ? plan.autoLine !== false : true;
    const lineChosen = new Set(plan?.line || []);
    const border = Data.cities.filter((city) => state.owners[city.id] === state.player
      && (cityConnected.get(city.id) || []).some((id) => state.owners[id] !== state.player))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    const rows = units.length ? units.map((unit) => '<label class="event-row"><span>' + escape(armyLabel(unit))
      + ' · ' + format(unit.strength) + ' 人</span><input type="checkbox" name="units" value="' + escape(unit.id) + '"'
      + (selected.has(unit.id) ? ' checked' : '') + ' aria-label="' + escape(unit.name) + '"></label>').join('')
      : '<p class="empty">当前指挥范围内没有可编入的部队。</p>';
    const lineRows = border.length ? border.map((city) => '<label class="event-row"><span>'
      + escape(city.name) + ' · ' + escape(regions[city.region] || '') + '</span><input type="checkbox" name="line" value="'
      + escape(city.id) + '"' + (lineChosen.has(city.id) ? ' checked' : '') + ' aria-label="' + escape(city.name) + '"></label>').join('')
      : '<p class="empty">当前没有与敌相邻的己方城镇。</p>';
    const body = showDialog(plan ? '编辑作战计划' : '新建作战计划', '<form id="plan-form">'
      + '<label class="field">计划名称<input name="name" maxlength="40" placeholder="留空则按目标自动命名" value="'
      + escape(plan?.name || '') + '"></label>'
      + '<div class="form-grid">' + citySelect('target', '目标城镇', target)
      + '<label>作战决心<select name="stance">'
      + Object.entries(planStanceNames).map(([id, label]) => option(id, label, stance)).join('')
      + '</select></label><label>作战方式<select name="mode">'
      + Object.entries(planModeNames).map(([id, label]) => option(id, label, plan?.mode || 'advance')).join('')
      + '</select></label><label>战线<select name="lineMode">'
      + option('auto', '自动取当前边境城镇', autoLine ? 'auto' : 'manual')
      + option('manual', '手动选择战线城镇', autoLine ? 'auto' : 'manual') + '</select></label>'
      + '<label>集结城镇（突击用）<select name="front">'
      + option('', '不设集结，直接向目标推进', plan?.front || '')
      + Data.cities.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')).map((city) =>
        option(city.id, city.name + ' · ' + (regions[city.region] || city.region), plan?.front || '')).join('')
      + '</select></label></div>'
      + '<div class="line-picker" id="line-picker"' + (autoLine ? ' hidden' : '') + '>'
      + '<p class="roster-label">战线城镇（守备 / 沿战线进攻 / 后撤用）</p>' + lineRows + '</div>'
      + '<p class="roster-label">编入部队</p><div class="plan-picker">' + rows + '</div>'
      + '<div class="dialog-actions"><button class="gold" type="submit">' + (plan ? '保存计划' : '建立计划')
      + '</button><button type="button" data-plan-back>返回列表</button></div></form>');
    const form = body.querySelector('form');
    form.elements.lineMode.onchange = () => {
      body.querySelector('#line-picker').hidden = form.elements.lineMode.value === 'auto';
    };
    form.elements.stance.onchange = () => {
      body.querySelector('#line-picker').hidden = form.elements.stance.value === 'spearhead'
        || form.elements.lineMode.value === 'auto';
    };
    form.onsubmit = (event) => {
      event.preventDefault();
      const settings = new FormData(form);
      const unitsPicked = settings.getAll('units');
      if (!unitsPicked.length) { notify('请至少选择一支部队。'); return; }
      const config = { name: String(settings.get('name') || '').trim(),
        target: settings.get('target'), mode: settings.get('mode'), units: unitsPicked,
        stance: settings.get('stance'), autoLine: settings.get('lineMode') === 'auto',
        line: settings.getAll('line'), front: settings.get('front') || null };
      if (plan) {
        if (!action('updatePlan', [plan.id, config])) return;
        notify('作战计划已更新。');
      } else {
        if (!action('createPlan', [config])) return;
        notify('作战计划已建立，可在列表中执行。');
      }
      selectedUnits = new Set(unitsPicked.map((id) => topUnit(state.units.find((member) => member.id === id))?.id)
        .filter(Boolean));
      saveAuto(true);
      render();
      plansPanel();
    };
  }

  function fortsPanel(cityId) {
    fortCity = cityId || selectedCity;
    const current = state.forts?.[fortCity] || {};
    const works = (state.works || []).filter((work) => work.city === fortCity);
    const cards = Object.entries(fortInfo).map(([kind, info]) => {
      const level = Math.min(info.tier, Number(current[kind]) || 0);
      const pending = works.find((work) => work.kind === kind);
      const effect = [];
      if (info.defense) effect.push('防守 +' + Math.round(info.defense * 100) + '% / 级');
      if (info.attack) effect.push('敌军进攻 −' + (info.attack * 100).toFixed(1) + '% / 级');
      if (info.siege) effect.push('反围城 +' + Math.round(info.siege * 100) + '% / 级');
      if (info.supply) effect.push('补给覆盖上限 +' + Math.round(info.supply * 100) + '%');
      return '<article class="card fort-card"><div><h3>' + escape(info.name) + ' <small>' + level + ' / '
        + info.tier + '</small></h3><p>' + escape(effect.join(' · ')) + '</p><p class="subtext">军械 '
        + info.cost.arms + ' · 财政 ' + info.cost.treasury + ' · 约 ' + info.days + ' 天'
        + (pending ? ' · 施工至 ' + escape(pending.due) : '') + '</p></div><button type="button" data-fort-build="'
        + escape(kind) + '"' + (level >= info.tier || pending ? ' disabled' : '') + '>'
        + (level >= info.tier ? '已满级' : pending ? '施工中' : '修筑') + '</button></article>';
    }).join('');
    showDialog('工事与阵地', '<p>' + escape(cityName(fortCity))
      + ' · 由驻军工兵施工。工兵支援越高，工期越短；成果按等级提高防守、反围城或补给能力。</p>'
      + '<div class="fort-list">' + cards + '</div>'
      + '<div class="dialog-actions"><button type="button" data-fort-close>关闭</button></div>');
  }

  function formationPanel(unitId) {
    const root = topUnit(state.units.find((item) => item.id === unitId));
    if (!root || !permitted(root)) { notify('只能调整当前可指挥部队的编制。'); return; }
    const support = meta.unitSupport ? meta.unitSupport(root) : root.support || {};
    const emphasis = {
      infantry: '步兵是攻防主力，决定部队的基本战力。',
      armor: '装甲兵提高进攻与突破能力。',
      artillery: '炮兵提高进攻与围城火力，消耗更多弹药。',
      engineer: '工兵加快工事修筑，并削弱敌军障碍。',
      medical: '医护减少战斗减员，缩短整补。',
      transport: '运输兵改善机动与补给领取。',
    };
    const rows = supportOrder.map((key) => '<label class="support-row"><span><strong>'
      + escape(supportInfo[key] || key) + '</strong><small>' + escape(emphasis[key] || '') + '</small></span>'
      + '<input type="range" min="0" max="100" step="2" name="' + escape(key) + '" value="'
      + format(support[key] || 0) + '" aria-label="' + escape(supportInfo[key] || key) + '">'
      + '<output>' + format(support[key] || 0) + '</output></label>').join('');
    const body = showDialog('部队编制与支援', '<p>' + escape(root.name) + ' · ' + escape(cityName(root.city))
      + '</p><p class="subtext">支援兵种按部队统一编配。提高编制要消耗军械与财政，降低不退还。</p>'
      + '<form id="support-form">' + rows
      + '<div class="dialog-actions"><button class="gold" type="submit">确认调整</button>'
      + '<button type="button" data-support-close>取消</button></div></form>');
    const form = body.querySelector('form');
    form.oninput = (event) => {
      const output = event.target.nextElementSibling;
      if (output) output.textContent = event.target.value;
    };
    form.onsubmit = (event) => {
      event.preventDefault();
      const settings = new FormData(form);
      let changed = 0;
      for (const key of supportOrder) {
        const value = Number(settings.get(key));
        if (!Number.isFinite(value) || Math.abs(value - (support[key] || 0)) < 1) continue;
        if (!action('setSupport', [root.id, key, value])) return;
        changed += 1;
      }
      saveAuto(true);
      render();
      notify(changed ? '编制已调整。' : '编制没有变化。');
      formationPanel(root.id);
    };
  }

  function logisticsPanel() {
    if (typeof Engine.supplyReading !== 'function') { showDialog('铁路补给', '<p>当前版本不支持补给网络。</p>'); return; }
    const reading = Engine.supplyReading(Data, state);
    const side = state.player;
    const stock = reading.stocks[side];
    const scarcity = valueOf(state.supplyScarcity, side, 1);
    const stockRows = Object.entries(goodsNames).map(([key, name]) => '<tr><td>' + escape(name) + '</td><td>'
      + format(stock[key]) + '</td><td>' + (scarcity < 0.7 ? '产能受限' : '正常') + '</td></tr>').join('');
    const units = Engine.activeUnits(state).filter((unit) => !unit.parent && unit.strength > 0 && unit.side === side);
    const cities = new Map();
    for (const unit of units) {
      const row = cities.get(unit.city) || { strength: 0, count: 0, ammo: 0 };
      row.strength += unit.strength;
      row.count += 1;
      row.ammo += valueOf(unit, 'ammo', 100);
      cities.set(unit.city, row);
    }
    const coverageRows = [...cities.entries()].map(([city, row]) => ({ city, coverage: reading.coverage[side]?.[city] ?? 0,
      via: reading.transport?.[side]?.[city] ?? 'local', ...row, ammo: row.ammo / row.count }))
      .sort((a, b) => a.coverage - b.coverage || b.strength - a.strength)
      .slice(0, 14).map((row) => '<tr><td>' + escape(cityName(row.city)) + '</td><td>' + format(row.strength)
        + '</td><td>' + escape(transportNames[row.via] || '本地') + '</td><td>' + format(row.ammo)
        + '%</td><td class="coverage-cell">' + Math.round(row.coverage * 100)
        + '%' + (row.coverage < 0.5 ? '<b class="shortage-mark">缺口</b>' : '') + '</td></tr>').join('');
    const bottlenecks = reading.bottlenecks.filter((item) => item.side === side);
    const bottleneckRows = bottlenecks.length ? bottlenecks.map((item) => '<tr><td>'
      + escape(cityName(item.cities[0]) + ' — ' + cityName(item.cities[1])) + '</td><td>' + format(item.load)
      + '</td><td>' + format(item.capacity) + '</td><td>' + Math.round(item.severity * 100) + '%</td></tr>').join('')
      : '<tr><td colspan="4">当前没有运输瓶颈。</td></tr>';
    showDialog('铁路补给', '<p>后方库存经铁路送到车站与补给站，再分发到前线部队。'
      + '覆盖越低、运输越紧张，部队的弹药、油料与医疗物资补充越慢。</p>'
      + (state.supplyReport?.[side]
        ? '<p class="subtext">最近一日：到货 ' + format(state.supplyReport[side].delivered)
          + ' 点 · 补给缺口 ' + state.supplyReport[side].shortages + ' 城 · 瓶颈 '
          + state.supplyReport[side].bottlenecks + ' 段。</p>' : '')
      + '<div class="logistics-grid"><div><h3>' + escape(short[side]) + ' 后方库存</h3><table class="dialog-table">'
      + '<thead><tr><th>物资</th><th>库存</th><th>产能</th></tr></thead><tbody>' + stockRows + '</tbody></table>'
      + '<p class="subtext">物资系数 ' + scarcity.toFixed(2) + '；后方产量随驻军规模与城市产值增长。可用率 '
      + Math.round((reading.ration?.[side] ?? 1) * 100) + '%。侦察 '
      + format(valueOf(state.recon, side, 34)) + ' · 空中支援 ' + format(valueOf(state.air, side, 16)) + '。</p></div>'
      + '<div><h3>运输瓶颈</h3><table class="dialog-table"><thead><tr><th>铁路段</th><th>运量</th><th>容量</th>'
      + '<th>紧张度</th></tr></thead><tbody>' + bottleneckRows + '</tbody></table></div></div>'
      + '<p class="roster-label">补给覆盖</p><table class="dialog-table"><thead><tr><th>驻军城镇</th><th>兵力</th>'
      + '<th>通路</th><th>弹药</th><th>覆盖</th></tr></thead><tbody>' + (coverageRows || '<tr><td colspan="5">暂无驻军。</td></tr>')
      + '</tbody></table><div class="dialog-actions"><button type="button" data-supply-overlay>在地图显示补给</button>'
      + '<button type="button" data-supply-close>关闭</button></div>');
  }

  function politicsTargets(kind) {
    if (kind === 'defect') {
      const enemies = Engine.activeUnits(state).filter((unit) => !unit.parent && unit.side !== state.player
        && unit.strength > 0).sort((a, b) => b.strength - a.strength).slice(0, 40);
      return '<label class="field">策反对象<select name="unit">'
        + enemies.map((unit) => option(unit.id, unit.name + ' · ' + cityName(unit.city), '')).join('')
        + '</select></label>';
    }
    if (kind === 'reorganize' || kind === 'airlift') {
      const garrisoned = new Set(Engine.activeUnits(state)
        .filter((unit) => unit.side === state.player && unit.strength > 0).map((unit) => unit.city));
      const cities = Data.cities.filter((city) => state.owners[city.id] === state.player)
        .sort((a, b) => (Number(garrisoned.has(b.id)) - Number(garrisoned.has(a.id)))
          || a.name.localeCompare(b.name, 'zh-CN'));
      return '<label class="field">目标城镇<select name="city">'
        + cities.map((city) => option(city.id, city.name + ' · ' + (regions[city.region] || city.region)
          + (garrisoned.has(city.id) ? '（有驻军）' : ''), '')).join('')
        + '</select></label>';
    }
    return '';
  }

  let defenseDraft = null;

  function statChips(record) {
    return Object.entries(record).map(([name, value]) => '<span class="stat-chip"><b>' + escape(name) + '</b>'
      + escape(typeof value === 'number' ? Math.round(value * 100) / 100 : value) + '</span>').join('');
  }

  function designComposition(design) {
    return Object.entries(battalionInfo).filter(([key]) => (design?.[key] ?? 0) > 0)
      .map(([key, label]) => label.replace('营', '') + '×' + design[key]).join(' · ')
      + (Object.entries(supportInfo2).filter(([key]) => design?.support?.[key]).length
        ? ' · ' + Object.entries(supportInfo2).filter(([key]) => design?.support?.[key])
          .map(([, label]) => label.replace('连', '')).join('/') : '');
  }

  function focusBody() {
    const side = state.player;
    const focus = state.focus?.[side] ?? { done: [], current: null, progress: 0 };
    const tree = focusTree[side] ?? [];
    return '<p class="subtext">国策按天推进，完成时立刻生效；灰色表示前置未完成。</p><div class="defense-cards">'
      + tree.map((item) => {
        const done = focus.done?.includes(item.id);
        const current = focus.current === item.id;
        const locked = (item.requires ?? []).some((id) => !focus.done?.includes(id));
        return '<article class="card defense-card"><header><h3>' + escape(item.name) + '</h3><span class="plan-status is-'
          + (done ? 'done' : current ? 'active' : 'draft') + '">'
          + (done ? '已完成' : current ? '进行中 ' + (focus.progress ?? 0) + '/' + item.days : locked ? '需前置' : '未开始')
          + '</span></header><p class="subtext">' + escape(item.desc) + '</p>'
          + '<div class="progress"><i style="width:' + (done ? 100 : current ? Math.min(100, Math.round((focus.progress ?? 0) / item.days * 100)) : 0) + '%"></i></div>'
          + '<div class="unit-actions"><button type="button" data-focus="' + item.id + '"'
          + (done || current || locked ? ' disabled' : '') + '>开始推进</button></div></article>';
      }).join('') + '</div>';
  }

  function techBody() {
    const side = state.player;
    const research = state.research?.[side] ?? { points: 0, levels: {} };
    const rows = Object.entries(techInfo).map(([key, line]) => {
      const level = research.levels?.[key] ?? 0;
      const maxed = level >= line.max;
      const cost = maxed ? 0 : line.costs[level];
      const can = !maxed && research.points >= cost;
      return '<article class="card defense-card"><header><h3>' + escape(line.name) + ' ' + (roman[level] ?? '')
        + '</h3><span class="plan-status is-draft">' + (maxed ? '已满级' : '需要 ' + cost + ' 点') + '</span></header>'
        + '<p class="subtext">' + escape(line.effect) + ' · 等级 ' + level + '/' + line.max + '</p>'
        + '<div class="level-dots">' + Array.from({ length: line.max }, (_, index) =>
          '<i' + (index < level ? ' class="on"' : '') + '></i>').join('') + '</div>'
        + '<div class="unit-actions"><button type="button" data-tech="' + key + '"' + (can ? '' : ' disabled')
        + '>研究 ' + (roman[Math.min(level + 1, line.max)] ?? '') + '</button></div></article>';
    }).join('');
    return '<p class="subtext">科研点 ' + format(research.points) + '，随控制城镇、稳定度与法令增长。</p>'
      + '<div class="defense-cards">' + rows + '</div>';
  }

  function productionBody() {
    const side = state.player;
    const production = state.production?.[side] ?? { lines: {} };
    const stock = state.stock?.[side] ?? {};
    const labels = { infantry: '步兵装备', artillery: '火炮', armor: '装甲装备', air: '航空装备', naval: '运输船' };
    return '<p class="subtext">工厂数按控制城镇价值折算。产线比例总和不超过 100，比例越高产出越多。</p>'
      + '<form id="production-form" class="card"><div class="production-grid">'
      + Object.entries(labels).map(([key, label]) => '<label>' + label + '<input type="number" min="0" max="100" name="'
        + key + '" value="' + (production.lines?.[key] ?? 0) + '"></label>').join('')
      + '</div><div class="unit-actions"><button class="gold" type="submit">保存分配</button></div></form>'
      + '<table class="dialog-table"><thead><tr><th>储备</th><th>数量</th></tr></thead><tbody>'
      + Object.entries(labels).filter(([key]) => key !== 'naval').map(([key, label]) =>
        '<tr><td>' + label + '</td><td>' + format(stock[key] ?? 0) + '</td></tr>').join('')
      + '<tr><td>运输船</td><td>' + format(state.navy?.[side]?.transports ?? 0) + '</td></tr>'
      + '</tbody></table>';
  }

  function designForm() {
    const draft = defenseDraft ?? {
      name: '新编制', infantry: 8, artillery: 2, armor: 0, motorized: 0, antiAir: 0, antiTank: 0, support: {},
    };
    return '<form id="design-form" class="card"><h3>' + (draft.id ? '编辑「' + escape(draft.name) + '」' : '新建编制') + '</h3>'
      + '<label class="field">名称<input name="name" maxlength="20" value="' + escape(draft.name) + '"></label>'
      + '<div class="battalion-grid">' + Object.entries(battalionInfo).map(([key, label]) =>
        '<label>' + label + '<input type="number" min="0" max="12" name="' + key + '" value="' + (draft[key] ?? 0) + '"></label>').join('')
      + '</div><div class="support-grid">' + Object.entries(supportInfo2).map(([key, label]) =>
        '<label class="event-row"><span>' + label + '</span><input type="checkbox" name="support-' + key + '"'
        + (draft.support?.[key] ? ' checked' : '') + '></label>').join('')
      + '</div><div class="dialog-actions"><button class="gold" type="submit">'
      + (draft.id ? '保存修改' : '创建编制') + '</button>'
      + (defenseDraft ? '<button type="button" data-design-cancel>取消编辑</button>' : '')
      + '</div></form>';
  }

  function designBody(unitId) {
    const side = state.player;
    const designs = state.designs?.[side] ?? [];
    const armies = Engine.activeUnits(state).filter((unit) => !unit.parent && unit.side === side);
    const current = unitId ? state.units.find((unit) => unit.id === unitId) : null;
    const cards = designs.map((design) => {
      const stats = designStatsOf(state, side, design);
      const assigned = armies.filter((army) => army.design === design.id).length;
      return '<article class="card defense-card"><header><h3>' + escape(design.name) + '</h3>'
        + '<span class="plan-status is-draft">' + assigned + ' 支在用</span></header>'
        + '<p class="subtext">' + escape(designComposition(design)) + '</p>'
        + '<p class="stat-line">' + statChips({
          '攻': stats.attack, '防': stats.defense, '宽': stats.width,
          '装': stats.armor, '穿': stats.piercing, '补': stats.supply,
        }) + '</p><div class="unit-actions"><button type="button" data-design-edit="'
        + escape(design.id) + '">载入编辑</button></div></article>';
    }).join('');
    return '<p class="subtext">营级编成派生战斗宽度、装甲、穿甲、速度与补给消耗；换编制要消耗军械。</p>'
      + '<div class="defense-cards">' + cards + '</div>' + designForm()
      + (armies.length ? '<div class="card"><h3>指派编制</h3><div class="form-grid">'
        + '<label>部队<select id="design-unit">' + armies.map((army) =>
          option(army.id, army.name + ' · ' + cityName(army.city), current?.id ?? armies[0].id)).join('') + '</select></label>'
        + '<label>编制<select id="design-pick">' + designs.map((design) =>
          option(design.id, design.name, designs[0]?.id)).join('') + '</select></label></div>'
        + '<div class="unit-actions"><button type="button" data-design-assign>指派</button></div></div>' : '');
  }

  function airBody() {
    const side = state.player;
    const force = state.airWar?.[side] ?? {};
    const bases = Data.cities.filter((city) => state.owners[city.id] === side
      && (Number(city.value) || 0) >= 5).length;
    return '<p class="subtext">机场来自价值 5 以上的城镇，共 ' + bases + ' 处。机队每日补充，也会因敌方制空而损失。</p>'
      + '<div class="stat-line">' + statChips({
        '机队': Math.round(force.planes ?? 0), '机场容量': 24 + bases * 18,
        '空中支援': state.air?.[side] ?? 0, '累计损失': Math.round(force.losses ?? 0),
      }) + '</div><div class="defense-cards">' + Object.entries(airMissionInfo).map(([id, mission]) =>
        '<article class="card defense-card"><header><h3>' + escape(mission.name) + '</h3><span class="plan-status is-'
        + (force.mission === id ? 'active' : 'draft') + '">' + (force.mission === id ? '执行中' : '待命')
        + '</span></header><p class="subtext">' + escape(mission.hint) + ' 支援系数 ' + mission.support
        + '，日损耗 ' + (mission.attrition * 100).toFixed(1) + '%。</p>'
        + '<div class="unit-actions"><button type="button" data-air-mission="' + id + '"'
        + (force.mission === id ? ' disabled' : '') + '>选择</button></div></article>').join('') + '</div>';
  }

  function navyBody() {
    const side = state.player;
    const navy = state.navy?.[side] ?? {};
    return '<p class="subtext">渡海进攻需要运输船：每 1500 人占 1 艘。运输船由「生产」里的运输船产线产出，国策也能增加。</p>'
      + '<div class="stat-line">' + statChips({
        '运输船': Math.floor(navy.transports ?? 0), '军舰': Math.floor(navy.warships ?? 0),
        '单次投送上限': format(Math.floor((navy.transports ?? 0) * 1500)) + ' 人',
      }) + '</div><p class="subtext">用法：在海岸城镇集结部队，选中后右键隔海敌城。登陆会承受滩头惩罚并消耗运输船；运输船不足时命令会被拒绝。</p>';
  }

  function commandBody() {
    const side = state.player;
    const command = state.command?.[side] ?? { points: 0, cooldowns: {} };
    const armies = Engine.activeUnits(state).filter((unit) => unit.side === side);
    const enemyCities = Data.cities.filter((city) => state.owners[city.id] !== side);
    return '<p class="subtext">指挥点每日增长；技能有冷却，对指定部队或城镇生效。</p>'
      + '<div class="stat-line">' + statChips({ '指挥点': Math.round(command.points ?? 0) }) + '</div>'
      + '<div class="defense-cards">' + Object.entries(commandInfo).map(([id, ability]) => {
        const cooldown = command.cooldowns?.[id] ?? 0;
        const target = id === 'barrage'
          ? '<label class="field">目标城镇<select name="command-city">'
            + enemyCities.slice(0, 80).map((city) => option(city.id, city.name, '')).join('') + '</select></label>'
          : '<label class="field">目标部队<select name="command-unit">'
            + armies.map((unit) => option(unit.id, unit.name + ' · ' + cityName(unit.city), '')).join('') + '</select></label>';
        return '<article class="card defense-card"><header><h3>' + escape(ability.name) + '</h3>'
          + '<span class="plan-status is-draft">' + (cooldown ? cooldown + ' 天后' : ability.cost + ' 点')
          + '</span></header><p class="subtext">' + escape(ability.hint) + '</p>' + target
          + '<div class="unit-actions"><button type="button" data-command="' + id + '"'
          + (cooldown || command.points < ability.cost ? ' disabled' : '') + '>执行</button></div></article>';
      }).join('') + '</div>';
  }

  function intelBody() {
    const side = state.player;
    const intel = state.intel?.[side] ?? { level: 35, points: 0 };
    const laws = state.laws?.[side] ?? {};
    const stability = Math.round(valueOf(state.stability, side, 60));
    const occupied = Data.cities.filter((city) => state.owners[city.id] !== side
      && state.coreOwners?.[city.id] === side).length;
    const resistance = Object.values(state.occupation ?? {}).filter((record) => (record.resistance ?? 0) > 50).length;
    const foreignNames = { usa: '美国', ussr: '苏联', japan: '日本' };
    const politicalPoints = state.political?.[side]?.points ?? 0;
    const foreignStatus = Object.entries(foreignNames).map(([id, label]) => {
      const actor = state.foreign?.[id] ?? {};
      const relation = Math.round((actor.support ?? 0) * 100);
      const cooldowns = state.externalCooldowns?.[side] ?? {};
      const actions = id === 'japan'
        ? '<p class="subtext">投降后装备记录 ' + Math.round(actor.stock ?? 0) + ' · 仅作战后初期影响</p>'
        : '<div class="unit-actions">'
          + '<button type="button" data-foreign="' + id + '" data-foreign-action="request-aid"'
          + (cooldowns[id + ':request-aid'] || politicalPoints < 45 ? ' disabled' : '') + '>援助（45）</button>'
          + '<button type="button" data-foreign="' + id + '" data-foreign-action="pressure"'
          + (cooldowns[id + ':pressure'] || politicalPoints < 35 ? ' disabled' : '') + '>施压（35）</button>'
          + '<button type="button" data-foreign="' + id + '" data-foreign-action="embargo"'
          + (cooldowns[id + ':embargo'] || politicalPoints < 40 ? ' disabled' : '') + '>禁运（40）</button></div>';
      return '<article class="card defense-card foreign-card"><header><h3>' + label + '</h3><span class="plan-status is-draft">'
        + '影响 ' + relation + '</span></header><p class="subtext">'
        + (id === 'usa' ? '扶蒋援助、调停与撤援政策。'
          : id === 'ussr' ? '东北进驻、移交部分日械与政治压力。'
            : '战败后留下的武器装备，仅限战后初期影响。')
        + '</p>' + actions + '</article>';
    }).join('');
    const seaZones = ['东北外海', '黄海', '东海', '台湾海峡', '珠江口'];
    const seaRows = seaZones.map(zone => {
      const own = state.seaZones?.[zone]?.[side]?.mission ?? '';
      return '<label>' + zone + '<select data-sea-zone="' + zone + '">'
        + option('', '未部署', own)
        + option('patrol', '巡逻/制海', own)
        + option('escort', '护航', own)
        + option('raid', '破交', own)
        + option('invasion', '登陆准备', own)
        + '</select></label>';
    }).join('');
    return '<div class="stat-line">' + statChips({
      '情报水平': Math.round(intel.level), '情报点': Math.round(intel.points),
      '稳定度': stability, '我方沦陷城镇': occupied, '抵抗较高': resistance,
      '战争支持': Math.round(state.warSupport?.[side] ?? 0),
    }) + '</div><div class="foreign-grid">' + foreignStatus + '</div><div class="card"><h3>外部势力影响（简化推演）</h3>'
      + '<p class="subtext">美国援助/禁运与外交压力；苏联 1945—46 年东北影响、装备援助；日本仅模拟投降后遗留武器，非日本参战。</p></div>'
      + '<div class="card"><h3>海域任务</h3><div class="sea-zone-grid">' + seaRows + '</div>'
      + '<button type="button" data-naval-save>执行海军部署</button>'
      + '<p class="subtext">巡逻提高制海，护航降低海运补给成本，破交压低对方运输，登陆准备积累滩头优势。</p></div>'
      + '<div class="defense-cards">' + Object.entries(intelOpInfo).map(([id, op]) =>
        '<article class="card defense-card"><header><h3>' + escape(op.name) + '</h3><span class="plan-status is-draft">'
        + op.cost + ' 点</span></header><p class="subtext">' + escape(op.hint) + '</p>'
        + '<div class="unit-actions"><button type="button" data-intel="' + id + '"'
        + (intel.points < op.cost || intel.cooldowns?.[id] ? ' disabled' : '') + '>执行</button></div></article>').join('')
      + '</div><div class="card"><h3>法令与稳定度</h3><div class="form-grid">'
      + Object.entries({ conscription: '征兵法令', economy: '经济法令' }).map(([kind, label]) =>
        '<label>' + label + '<select name="law-' + kind + '">'
        + Object.keys(meta.lawFactors?.[kind] ?? {}).map((value) => option(value, lawText[value] ?? value, laws[kind])).join('')
        + '</select></label>').join('')
      + '</div><div class="unit-actions"><button type="button" data-law="conscription">更换征兵法令</button>'
      + '<button type="button" data-law="economy">更换经济法令</button></div></div>'
      + '<div class="card"><h3>外交</h3><label>外部国家<select name="diplomacy-actor">'
      + option('usa', '美国', side === 'roc' ? 'usa' : 'ussr')
      + option('ussr', '苏联', side === 'ccp' ? 'ussr' : 'usa')
      + '</select></label><div class="unit-actions">'
      + Object.entries(diplomacyInfo).map(([id, op]) => '<button type="button" data-diplomacy="' + id + '"'
        + (state.diplomacy?.[side]?.cooldowns?.[id] ? ' disabled' : '') + '>' + escape(op.name)
        + '（' + op.cost + ' 点）</button>').join('')
      + '</div><p class="subtext">停战需要双方战争支持都低于 45；停战后战局结束。</p></div>';
  }

  function defenseBody(tab, unitId) {
    if (tab === 'tech') return techBody();
    if (tab === 'production') return productionBody();
    if (tab === 'design') return designBody(unitId);
    if (tab === 'air') return airBody();
    if (tab === 'navy') return navyBody();
    if (tab === 'command') return commandBody();
    if (tab === 'intel') return intelBody();
    return focusBody();
  }

  function defensePanel(tab = 'focus', options = {}) {
    const current = tab || 'focus';
    const tabs = [['focus', '国策'], ['tech', '科研'], ['production', '生产'], ['design', '编制'],
      ['air', '空军'], ['navy', '海军'], ['command', '指挥'], ['intel', '情报']];
    const body = showDialog('国防与建设', '<div class="defense-tabs">' + tabs.map(([id, label]) =>
      '<button type="button" data-defense-tab="' + id + '" aria-pressed="' + (current === id) + '">' + label + '</button>').join('')
      + '</div><div id="defense-body">' + defenseBody(current, options.unitId) + '</div>');
    const productionForm = body.querySelector('#production-form');
    if (productionForm) {
      productionForm.onsubmit = (event) => {
        event.preventDefault();
        const settings = new FormData(productionForm);
        const lines = Object.fromEntries(['infantry', 'artillery', 'armor', 'air', 'naval']
          .map((key) => [key, Number(settings.get(key)) || 0]));
        if (action('setProduction', [lines])) {
          saveAuto(true);
          render();
          notify('生产分配已保存。');
          defensePanel('production');
        }
      };
    }
    const designFormEl = body.querySelector('#design-form');
    if (designFormEl) {
      designFormEl.onsubmit = (event) => {
        event.preventDefault();
        const settings = new FormData(designFormEl);
        const config = { name: String(settings.get('name') || '新编制').trim(), support: {} };
        for (const key of Object.keys(battalionInfo)) config[key] = Number(settings.get(key)) || 0;
        for (const key of Object.keys(supportInfo2)) config.support[key] = Boolean(settings.get('support-' + key));
        const ok = defenseDraft?.id
          ? action('updateDesign', [defenseDraft.id, config])
          : action('createDesign', [config]);
        if (!ok) return;
        defenseDraft = null;
        saveAuto(true);
        render();
        notify('编制已保存。');
        defensePanel('design');
      };
    }
    return body;
  }

  function politicsPanel() {
    const side = state.player;
    const politics = state.political?.[side] ?? { points: 0, cooldowns: {} };
    const support = valueOf(state.warSupport, side, 60);
    const capital = state.capitals?.[side];
    const cards = Object.entries(decisionInfo).map(([kind, info]) => {
      const cooldown = politics.cooldowns?.[kind] ?? 0;
      const disabled = Boolean(cooldown) || politics.points < info.cost;
      return '<article class="card decision-card"><div><h3>' + escape(info.name) + ' <small>' + info.cost
        + ' 点</small></h3><p>' + escape(info.hint) + '</p>' + politicsTargets(kind) + '</div>'
        + '<button type="button" data-decide="' + escape(kind) + '"' + (disabled ? ' disabled' : '') + '>'
        + (cooldown ? cooldown + ' 天后' : politics.points < info.cost ? '点数不足' : '执行') + '</button></article>';
    }).join('');
    showDialog('政治与决议', '<p>政治点随控制城镇每日增长。决议有冷却，战争支持度低于 25 又丢掉首都时可能停战。</p>'
      + '<div class="politics-head"><div><span>政治点</span><strong>' + format(politics.points) + '</strong></div>'
      + '<div><span>战争支持</span><strong>' + format(support) + '</strong></div>'
      + '<div><span>首都</span><strong>' + escape(cityName(capital)) + '</strong></div></div>'
      + cards + '<div class="dialog-actions"><button type="button" data-politics-close>关闭</button></div>');
  }

  function economy() {
    const rows = { recruit: '征兵补充', industry: '装备生产', supply: '粮秣调配' };    const body = showDialog('经济与后勤', '<div class="detail-grid">'
      + ['ccp', 'roc'].map((side) => '<div>' + sideTag(side) + '<dl class="resources">'
        + resourceTiles(state.economy[side]) + '</dl></div>').join('') + '</div><form id="policy-form" class="card">'
      + '<h3>' + sides[state.player] + ' · 统帅分配</h3><div class="form-grid">'
      + Object.entries(rows).map(([key, label]) => '<label>' + label + '<select name="' + key + '">'
        + [['low', '低'], ['normal', '均衡'], ['high', '优先']].map((item) => option(...item, state.policies[key])).join('') + '</select></label>').join('')
      + '</div><button type="submit" class="gold">执行分配</button></form>');
    body.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      for (const [key, value] of new FormData(event.currentTarget)) action('setPolicy', [key, value]);
      saveAuto(true);
      render();
      dialog.close();
      notify('资源分配已更新。');
    });
  }

  function forecast() {
    const body = showDialog('局势预测', '<p>从当前日期复制战局，按月推演两方城市、兵员及胜负。正式存档照常保留。</p>'
      + '<label class="field">预测跨度<select id="forecast-months"><option value="3">未来 3 个月</option>'
      + '<option value="6">未来 6 个月</option><option value="12">未来 12 个月</option></select></label>'
      + '<div class="dialog-actions"><button id="run-forecast" type="button" class="gold">开始推演</button>'
      + '<button id="plan-forecast" type="button"' + (permitted(inspectUnit()) ? '' : ' disabled') + '>预演所选部队的命令</button>'
      + '<button id="compare-forecast" type="button">并排比较两套方案</button></div>'
      + '<div id="forecast-output" aria-live="polite"></div>');
    const calc = (input, title) => {
      const result = Engine.forecast(Data, input, Number($('forecast-months').value));
      $('forecast-output').innerHTML = '<p class="roster-label">' + escape(title) + '</p><table class="dialog-table"><thead><tr>'
        + '<th>日期</th><th>共产党 · 城市 / 兵员 / 粮食</th><th>国民党 · 城市 / 兵员 / 粮食</th><th>易手 / 结局</th>'
        + '</tr></thead><tbody>' + result.map((row) => '<tr><td>' + row.date + '</td><td>' + row.ccp + ' / '
          + format(row.ccpStrength) + ' / ' + format(row.ccpFood) + '</td><td>' + row.roc + ' / '
          + format(row.rocStrength) + ' / ' + format(row.rocFood) + '</td><td>'
          + (row.winner ? escape(short[row.winner]) + '达成统一' : row.changed + ' 城') + '</td></tr>').join('') + '</tbody></table>';
    };
    body.querySelector('#run-forecast').onclick = () => calc(state, '延续当前命令');
    body.querySelector('#compare-forecast').onclick = () => compareForecast(Number($('forecast-months').value));
    body.querySelector('#plan-forecast').onclick = () => {
      if ($('forecast-order')) return;
      const form = document.createElement('form');
      form.id = 'forecast-order';
      form.className = 'card';
      form.innerHTML = '<div class="form-grid"><label>预演命令<select name="type">'
        + Object.entries(commands).map(([type, label]) => option(type, label, 'advance')).join('')
        + '</select></label>' + citySelect('target', '目标城镇') + '</div><button type="submit">执行预演</button>';
      $('forecast-output').before(form);
      form.onsubmit = (event) => {
        event.preventDefault();
        const input = Engine.snapshot(state);
        const settings = new FormData(form);
        const outcome = Engine.order(Data, input, selectedUnit, settings.get('type'), settings.get('target'));
        if (!outcome.ok) { notify(outcome.error); return; }
        calc(input, '预演 · ' + commands[settings.get('type')] + ' ' + cityName(settings.get('target')));
      };
    };
  }

  function compareForecast(months) {
    const units = Engine.activeUnits(state).filter((unit) => permitted(unit) && (!unit.parent || unit.id === selectedUnit));
    const chosen = units.find((unit) => unit.id === selectedUnit) || units.find((unit) =>
      Engine.previewOrder(Data, state, unit.id, 'advance', scenarioNow()?.focus).ok) || units[0];
    const target = scenarioNow()?.focus || selectedCity;
    const panel = (key, name, initial) => '<fieldset><legend>' + name + '</legend><label class="field">方案<select name="'
      + key + '-mode">' + option('baseline', '延续当前命令', initial) + option('now', '立即执行命令', initial)
      + option('rest', '先整补再执行', initial) + '</select></label><div data-plan-fields="' + key + '">'
      + '<label class="field">命令<select name="' + key + '-type">'
      + Object.entries(commands).map(([id, label]) => option(id, label, 'advance')).join('') + '</select></label>'
      + citySelect(key + '-target', '目标', target) + '<label class="field" data-rest-field>整补时间<select name="' + key
      + '-days">' + option(7, '7 天', 7) + option(14, '14 天', 7) + option(28, '28 天', 7) + '</select></label></div></fieldset>';
    const body = showDialog('并排预测', '<p>两套方案从同一个存档时点起算，统一按月比较。选择整补会先让选定部队驻防，到期再按当时局势校验命令。</p>'
      + '<form class="comparison-form"><label class="field">比较部队<select name="unit"' + (units.length ? '' : ' disabled') + '>'
      + units.map((unit) => option(unit.id, unit.name + ' · ' + cityName(unit.city), chosen?.id)).join('')
      + '</select></label><div class="comparison-settings">' + panel('a', '方案 A', 'baseline')
      + panel('b', '方案 B', units.length ? 'rest' : 'baseline') + '</div><div class="dialog-actions">'
      + '<button class="gold" type="submit" id="calculate-comparison">比较未来 ' + months + ' 个月</button>'
      + '<button type="button" id="back-forecast">返回单次预测</button></div></form><div id="comparison-output" aria-live="polite"></div>');
    const form = body.querySelector('form');
    const update = () => {
      for (const key of ['a', 'b']) {
        const mode = form.elements[key + '-mode'].value;
        const fields = form.querySelector('[data-plan-fields=' + key + ']');
        fields.hidden = mode === 'baseline';
        fields.querySelector('[data-rest-field]').hidden = mode !== 'rest';
      }
    };
    form.onchange = update;
    update();
    $('back-forecast').onclick = forecast;
    const cell = (row) => '<td class="comparison-cell">' + ['ccp', 'roc'].map((side) => '<strong>' + short[side]
      + '</strong><small>' + row[side] + ' 城 · ' + format(row[side + 'Strength']) + ' 人 · 粮食 '
      + format(row[side + 'Food']) + '</small>').join('') + '<p>本月易手 ' + row.changed + ' 城</p>'
      + (row.highlights.length ? '<details class="comparison-events"><summary>主要变化</summary>'
        + row.highlights.map((entry) => '<p>' + escape(entry.text) + '</p>').join('') + '</details>' : '') + '</td>';
    form.onsubmit = (event) => {
      event.preventDefault();
      const settings = new FormData(form);
      const simulations = [];
      for (const key of ['a', 'b']) {
        const board = Engine.snapshot(state);
        const mode = settings.get(key + '-mode');
        let planned;
        if (mode !== 'baseline') {
          const unitId = settings.get('unit');
          const type = settings.get(key + '-type');
          const targetCity = settings.get(key + '-target');
          const result = mode === 'now' ? Engine.order(Data, board, unitId, type, targetCity)
            : Engine.order(Data, board, unitId, 'hold');
          if (!result.ok) { notify('方案 ' + key.toUpperCase() + ' · ' + result.error); return; }
          if (mode === 'rest') planned = { afterDays: Number(settings.get(key + '-days')), unitId, type, target: targetCity };
        }
        simulations.push(Engine.forecast(Data, board, months, planned));
      }
      $('comparison-output').innerHTML = '<table class="dialog-table comparison-table"><thead><tr><th>日期</th><th>方案 A</th><th>方案 B</th>'
        + '</tr></thead><tbody>' + simulations[0].map((row, index) => '<tr><td>' + row.date + '</td>'
          + cell(row) + cell(simulations[1][index]) + '</tr>').join('') + '</tbody></table>';
    };
  }

  function citySelect(name, title, chosen = selectedCity) {
    const lookup = Data.cities.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    return '<label>' + escape(title) + '<select name="' + escape(name) + '">'
      + lookup.map((city) => option(city.id, city.name + ' · ' + (regions[city.region] || city.region), chosen)).join('') + '</select></label>';
  }

  function cityPicker(order = false) {
    const body = showDialog(order ? '选择命令目标' : '定位地图城镇',
      '<form><div class="form-grid">' + citySelect('target', '城镇') + '</div><button class="gold" type="submit">'
      + (order ? '下达命令' : '查看城镇') + '</button></form>');
    body.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const city = new FormData(event.currentTarget).get('target');
      dialog.close();
      selectCity(city, order, true);
    };
  }

  function switchSide() {
    const body = showDialog('更换接管阵营', '<p>当前日期和双方此前的行动记录会随存档继续。</p>'
      + '<div class="dialog-actions"><button type="button" data-control-side="ccp">接管中国共产党</button>'
      + '<button type="button" data-control-side="roc">接管中国国民党</button></div>');
    body.querySelectorAll('[data-control-side]').forEach((item) => {
      item.disabled = state.player === item.dataset.controlSide;
      item.onclick = () => {
        action('setSide', [item.dataset.controlSide]);
        pendingOrder = undefined;
        selectedUnit = undefined;
        rosterSide = 'player';
        rosterGroup = '';
        rosterPage = 0;
        setMapHelp();
        dialog.close();
        saveAuto(true);
        render();
      };
    });
  }

  function saveSlot() {
    const name = (scenarioNow()?.title || '自订战局') + ' · ' + state.date + ' · ' + short[state.player];
    const raw = Timeline.serialize(state, timeline);
    if (store.slots[0]?.raw === raw) return true;
    return writeStore({ ...store, slots: [{ name, raw }, ...store.slots].slice(0, 6) });
  }

  function downloadSave() {
    const url = URL.createObjectURL(new Blob([Timeline.serialize(state, timeline)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '战图-' + state.date + '-' + state.player + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function saves() {
    const body = showDialog('存档与时间线', '<p>浏览器自动保存当前战局。可手动保留多个进度，也可导出为文件。</p>'
      + '<div class="dialog-actions"><button type="button" id="slot-save" class="gold">保存当前进度</button>'
      + '<button type="button" id="export-save">导出文件</button><button type="button" id="import-save">导入文件</button></div>'
      + '<div class="stack" style="margin-top:11px">' + store.slots.map((slot, i) =>
        '<button type="button" data-load-slot="' + i + '">' + escape(slot.name) + '</button>').join('') + '</div>'
      + '<form class="card" id="branch-form"><h3>从过去另开时间线</h3><div class="form-grid"><label>回到日期'
      + '<input name="date" required type="date" min="' + timeline.origin.date + '" max="' + state.date
      + '" value="' + timeline.origin.date + '"></label></div><button type="submit">创建存档分支</button></form>');
    $('slot-save').onclick = () => { const saved = saveSlot(); saves(); notify(saved ? '进度已保存。' : '浏览器存档空间不可用，可导出文件。'); };
    $('export-save').onclick = downloadSave;
    $('import-save').onclick = () => $('import-file').click();
    body.querySelectorAll('[data-load-slot]').forEach((item) => {
      item.onclick = () => {
        try {
          const restored = validateSave(store.slots[Number(item.dataset.loadSlot)].raw);
          setActive(restored.state, restored.timeline);
          notify('进度已载入。');
        } catch (error) { notify(error.message); }
      };
    });
    $('branch-form').onsubmit = (event) => {
      event.preventDefault();
      try {
        const date = new FormData(event.currentTarget).get('date');
        const branch = Timeline.branch(timeline, Engine, Data, date, state.date);
        const saved = saveSlot();
        setActive(branch.state, branch.timeline);
        notify(saved ? '已建立存档分支。原进度可从存档中载入。' : '已建立存档分支。浏览器存档空间不可用。');
      } catch (error) { notify(error.message); }
    };
  }

  function showLog() {
    const tally = state.tally?.[state.player];
    const tallyBlock = tally && tally.battles ? '<div class="card tally-card"><h3>累计战果 · '
      + escape(short[state.player]) + '</h3><div class="tally-grid">'
      + [['交战', tally.battles], ['获胜', tally.wins], ['伤亡', tally.casualties], ['伤员', tally.wounded],
        ['俘虏', tally.prisoners], ['缴获军械', tally.captured]]
        .map(([name, value]) => '<div><span>' + name + '</span><strong>' + format(value) + '</strong></div>').join('')
      + '</div></div>' : '';
    const body = showDialog('战况记录', tallyBlock + '<label class="field">筛选记录<select id="brief-filter">'
      + '<option value="recent">重要简报</option><option value="all">全部记录</option><option value="capture">城镇易手</option>'
      + '</select></label><div class="record-list" id="brief-list"></div>');
    const update = () => {
      const mode = $('brief-filter').value;
      $('brief-list').innerHTML = state.log.map((entry, index) => ({ entry, index })).reverse()
        .filter(({ entry }) => mode === 'all' || (mode === 'capture' ? briefKind(entry) === 'capture' : importantBrief(entry)))
        .map(({ entry, index }) => '<button class="record-button" data-brief-index="' + index
          + '" type="button"><time>' + escape(entry.date) + '</time><span>' + escape(entry.text) + '</span></button>').join('')
        || '<p>推进时间后，战报会显示在这里。</p>';
    };
    body.querySelector('select').onchange = update;
    update();
  }

  function delegate(unitId) {
    const unit = state.units.find((member) => member.id === unitId);
    if (!unit || !permitted(unit)) return;
    if (unit.delegated) {
      if (action('setDelegated', [unitId, false])) { saveAuto(true); render(); }
      return;
    }
    const body = showDialog('委托司令员', '<p>' + escape(unit.name) + '</p><form><div class="form-grid">'
      + citySelect('target', '重点目标') + '</div><div class="dialog-actions">'
      + '<button type="submit" class="gold">按目标委托</button><button type="button" id="delegate-auto">由司令员决策</button></div></form>');
    function assign(target) {
      if (action('setDelegated', [unitId, true, target])) {
        saveAuto(true);
        dialog.close();
        render();
        notify('部队已交由司令员指挥。');
      }
    }
    body.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      assign(new FormData(event.currentTarget).get('target'));
    };
    $('delegate-auto').onclick = () => assign(null);
  }

  function appoint(unitId) {
    const unit = state.units.find((member) => member.id === unitId);
    if (!permitted(unit) || typeof Engine.setLeader !== 'function') return;
    const names = [...leadersById.values()].filter((leader) => leader.side === unit.side);
    const body = showDialog('任命将领', '<p>' + escape(unit.name) + '</p><form><div class="form-grid">'
      + '<label>指挥官<select name="leader">' + option('', '解除当前任命', unit.leader || '')
      + names.map((leader) => option(leader.id, leader.name + ' · ' + (leader.role || ''), unit.leader)).join('')
      + '</select></label></div><button class="gold" type="submit">确认任命</button></form>');
    body.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const leader = new FormData(event.currentTarget).get('leader') || null;
      if (action('setLeader', [unitId, leader])) {
        saveAuto(true);
        dialog.close();
        render();
        notify(leader ? '已任命' + leadersById.get(leader).name + '。' : '已解除将领任命。');
      }
    };
  }

  $('scenario-list').onclick = (event) => {
    const item = event.target.closest('[data-scenario]');
    if (item) chooseScenario(item.dataset.scenario);
  };
  $('inspector-body').onclick = (event) => {
    const item = event.target.closest('button');
    if (!item) return;
    const d = item.dataset;
    if (d.unit) selectUnit(d.unit);
    else if (d.rosterPage !== undefined) { rosterPage += Number(d.rosterPage); renderInspector(); }
    else if (d.city) selectCity(d.city, false, true);
    else if (d.history) history(d.history);
    else if (d.checkpoint) openCheckpoint(d.checkpoint);
    else if (d.backRoster !== undefined) { stack = selectedUnit = pendingOrder = undefined; setMapHelp(); render(); }
    else if (d.findCity !== undefined) cityPicker();
    else if (d.delegate) delegate(d.delegate);
    else if (d.appoint) appoint(d.appoint);
    else if (d.leader) { const leader = leadersById.get(d.leader); if (leader) showDialog(leader.name, leaderCard(leader)); }
    else if (d.gearUnit !== undefined) gear();
    else if (d.forts) fortsPanel(d.forts);
    else if (d.formation) formationPanel(d.formation);
    else if (d.defenseDesign) defensePanel('design', { unitId: d.defenseDesign });
    else if (d.defenseCommand !== undefined) defensePanel('command');
    else if (d.stageReport !== undefined) stageReport();
    else if (d.clearGroup !== undefined) { rosterGroup = ''; renderInspector(); }
  };
  $('inspector-body').onchange = (event) => {
    if (event.target.id === 'roster-side') rosterSide = event.target.value;
    else if (event.target.id === 'roster-region') rosterRegion = event.target.value;
    else return;
    rosterPage = 0;
    renderInspector();
  };
  $('dialog-body').addEventListener('click', (event) => {
    const d = event.target.closest('button')?.dataset;
    if (!d) return;
    if (d.startChoice) chooseScenario(d.startChoice);
    else if (d.checkpoint) openCheckpoint(d.checkpoint);
    else if (d.playCheckpoint) {
      const point = checkpointById.get(d.playCheckpoint);
      if (point) chooseScenario(point.scenarioId, point);
    }
    else if (d.briefIndex !== undefined) showBrief(state.log[Number(d.briefIndex)]);
    else if (d.cityReport) showBrief(state.cityRecords?.[d.cityReport] || state.log.slice().reverse()
      .find((entry) => entry.city === d.cityReport && briefKind(entry) === 'capture'));
    else if (d.openLog !== undefined) showLog();
    else if (d.history) history(d.history);
    else if (d.locateCity) { dialog.close(); selectCity(d.locateCity, false, true); }
    else if (d.openArchive !== undefined) history();
    else if (d.planNew !== undefined) planEditor();
    else if (d.planEdit) planEditor(d.planEdit);
    else if (d.planBack !== undefined) plansPanel();
    else if (d.planClose !== undefined) dialog.close();
    else if (d.planLocate) { dialog.close(); selectCity(d.planLocate, false, true); }
    else if (d.planRun) {
      if (action('executePlan', [d.planRun])) {
        saveAuto(true);
        render();
        notify('作战计划已执行。');
        plansPanel();
      }
    }
    else if (d.planPause) {
      if (action('pausePlan', [d.planPause])) {
        saveAuto(true);
        render();
        notify('作战计划已暂停。');
        plansPanel();
      }
    }
    else if (d.planDelegate) {
      const plan = (state.plans || []).find((item) => item.id === d.planDelegate);
      if (plan && action('delegatePlan', [plan.id, !plan.delegated])) {
        saveAuto(true);
        render();
        notify(plan.delegated ? '已交给司令员按局势调整。' : '已收回计划指挥权。');
        plansPanel();
      }
    }
    else if (d.planRemove) {
      if (action('removePlan', [d.planRemove])) {
        saveAuto(true);
        render();
        notify('作战计划已撤销。');
        plansPanel();
      }
    }
    else if (d.fortBuild) {
      if (action('buildFort', [fortCity, d.fortBuild])) {
        saveAuto(true);
        render();
        notify('已开工修筑，完工后自动生效。');
        fortsPanel(fortCity);
      }
    }
    else if (d.fortClose !== undefined || d.supportClose !== undefined || d.supplyClose !== undefined) dialog.close();
    else if (d.supplyOverlay !== undefined) {
      const toggle = document.querySelector('[data-overlay=supply]');
      if (toggle) toggle.setAttribute('aria-pressed', 'true');
      map.overlay('supply', true);
      dialog.close();
      notify('地图已显示补给覆盖与运输瓶颈。');
    }
    else if (d.decide) {
      const card = event.target.closest('.decision-card');
      const city = card?.querySelector('select[name=city]')?.value;
      const unitId = card?.querySelector('select[name=unit]')?.value;
      if (action('decide', [d.decide, { city, unitId }])) {
        saveAuto(true);
        render();
        const info = decisionInfo[d.decide];
        if (d.decide === 'defect') {
          notify(lastActionResult?.success ? '策反成功，对方部队宣布起义。' : '策反未成，对方仍在观望。');
        } else {
          notify((info?.name || '决议') + '已执行。');
        }
        politicsPanel();
      }
    }
    else if (d.politicsClose !== undefined) dialog.close();
    else if (d.defenseTab) defensePanel(d.defenseTab);
    else if (d.focus) {
      if (action('startFocus', [d.focus])) { saveAuto(true); render(); defensePanel('focus'); }
    }
    else if (d.tech) {
      if (action('researchTech', [d.tech])) { saveAuto(true); render(); defensePanel('tech'); }
    }
    else if (d.airMission) {
      if (action('setAirMission', [d.airMission])) { saveAuto(true); render(); defensePanel('air'); }
    }
    else if (d.designEdit) {
      const design = (state.designs?.[state.player] ?? []).find((item) => item.id === d.designEdit);
      if (design) {
        defenseDraft = { ...design, support: { ...(design.support ?? {}) } };
        defensePanel('design');
      }
    }
    else if (d.designCancel !== undefined) { defenseDraft = null; defensePanel('design'); }
    else if (d.designAssign !== undefined) {
      const unitId = $('design-unit')?.value;
      const designId = $('design-pick')?.value;
      if (unitId && designId && action('assignDesign', [unitId, designId])) {
        saveAuto(true);
        render();
        notify('编制已指派。');
        defensePanel('design', { unitId });
      }
    }
    else if (d.command) {
      const card = event.target.closest('.defense-card');
      const unitId = card?.querySelector('select[name=command-unit]')?.value;
      const city = card?.querySelector('select[name=command-city]')?.value;
      if (action('commandAbility', [d.command, { unitId, city }])) {
        saveAuto(true);
        render();
        notify('指挥技能已下达。');
        defensePanel('command');
      }
    }
    else if (d.intel) {
      if (action('intelOperation', [d.intel])) {
        saveAuto(true);
        render();
        notify('情报行动已完成。');
        defensePanel('intel');
      }
    }
    else if (d.law) {
      const value = document.querySelector('select[name=law-' + d.law + ']')?.value;
      if (value && action('setLaw', [d.law, value])) {
        saveAuto(true);
        render();
        notify('法令已更新。');
        defensePanel('intel');
      }
    }
    else if (d.diplomacy) {
      const actor = document.querySelector('[name=diplomacy-actor]')?.value || (state.player === 'ccp' ? 'ussr' : 'usa');
      if (action('diplomacyAction', [d.diplomacy, actor])) {
        saveAuto(true);
        render();
        notify(d.diplomacy === 'ceasefire' ? '双方接受调停，战争结束。'
          : (diplomacyInfo[d.diplomacy]?.name ?? '外交行动') + '已完成。');
        defensePanel('intel');
      }
    }
    else if (d.foreign && d.foreignAction) {
      if (action('foreignAction', [d.foreign, d.foreignAction])) {
        saveAuto(true);
        render();
        notify('已通过' + ({ usa: '美国', ussr: '苏联', japan: '日本' }[d.foreign] || d.foreign) + '渠道执行外交行动。');
        defensePanel('intel');
      }
    }
    else if (d.navalSave !== undefined) {
      const selectors = [...document.querySelectorAll('[data-sea-zone]')];
      const before = { state: Engine.snapshot(state), timeline: structuredClone(timeline) };
      let changed = 0;
      for (const selector of selectors) {
        const zone = selector.dataset.seaZone;
        const current = state.seaZones?.[zone]?.[state.player]?.mission ?? '';
        if (selector.value === current) continue;
        const result = Timeline.apply(timeline, Engine, Data, state, 'setNavalMission', [zone, selector.value]);
        if (result.ok) changed += 1;
        else notify(result.error);
      }
      if (changed) {
        undoStack.push(before);
        if (undoStack.length > undoLimit) undoStack.shift();
        saveAuto(true);
        render();
        notify('海军海域任务已更新。');
        defensePanel('navy');
      }
    }
    else if (d.groupRoster || d.groupControl) {
      const group = groupsById.get(d.groupRoster || d.groupControl);
      if (!group) return;
      if (d.groupControl && typeof Engine.setGroup === 'function') {
        const wasCurrent = state.group === group.id;
        if (state.player !== group.side) action('setSide', [group.side]);
        action('setGroup', [wasCurrent ? null : group.id]);
        if (!wasCurrent) changeScope('national');
        saveAuto(true);
      }
      rosterGroup = group.id;
      rosterSide = 'all';
      rosterRegion = 'all';
      pane = 'army';
      selectedUnit = undefined;
      rosterPage = 0;
      dialog.close();
      render();
    }
  });

  $('pause').onclick = () => setRun(!running);
  $('step').onclick = () => { setRun(false); tick(1); };
  document.querySelectorAll('[data-speed]').forEach((item) => {
    item.onclick = () => { speed = Number(item.dataset.speed); setRun(running); };
  });
  $('new-game').onclick = listScenarios;
  $('mobile-scenarios').onclick = listScenarios;
  $('all-scenarios').onclick = listScenarios;
  $('change-side').onclick = switchSide;
  $('territory-report').onclick = territoryReport;
  $('save-menu').onclick = saves;
  $('economy').onclick = economy;
  $('plans').onclick = plansPanel;
  $('supply').onclick = logisticsPanel;
  $('politics').onclick = politicsPanel;
  $('defense').onclick = () => defensePanel('focus');
  $('gear').onclick = gear;
  $('history-mode').onclick = historicalEvents;
  $('help').onclick = guide;
  $('tutorial-open').onclick = startTutorial;
  $('tutorial-card').onclick = (event) => {
    const button = event.target.closest('button');
    if (!button || !tutorial) return;
    if (button.hasAttribute('data-tutorial-skip')) { tutorial = undefined; render(); }
    else if (button.hasAttribute('data-tutorial-next')) tutorialNext();
  };
  $('forecast').onclick = forecast;
  $('groups').onclick = regionalGroups;
  $('archive').onclick = () => history();
  $('show-log').onclick = showLog;
  $('brief-settings').onclick = configurePauses;
  $('latest-event').onclick = () => showBrief(recentBrief || state.log.at(-1));
  $('dialog-close').onclick = () => dialog.close();
  $('tab-city').onclick = () => { pane = 'city'; renderInspector(); };
  $('tab-army').onclick = () => { pane = 'army'; renderInspector(); };
  $('mobile-inspector').onclick = () => {
    const inspector = $('inspector-body').closest('aside');
    $('mobile-inspector').setAttribute('aria-expanded', inspector.classList.toggle('is-open'));
  };
  $('national-view').onclick = () => changeScope('national');
  $('theater-view').onclick = () => changeScope('theater', citiesById.get(selectedCity)?.region);
  $('find-city').onclick = () => cityPicker();
  $('sector-select').innerHTML = Object.entries(regions).map((item) => option(...item)).join('');
  $('sector-select').onchange = (event) => {
    const region = event.target.value;
    changeScope(region === 'national' ? 'national' : 'theater', region === 'national' ? undefined : region);
  };
  $('command-bar').onclick = (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const args = button.dataset;
    if (args.command) chooseCommand(args.command);
    else if (args.deckPlan !== undefined) planEditor();
    else if (args.deckClear !== undefined) { selectedUnits = new Set(); render(); }
    else if (args.deckUndo !== undefined) undo();
    else if (args.deckTarget !== undefined) cityPicker(true);
    else if (args.deckCancel !== undefined) { pendingOrder = undefined; setMapHelp(); render(); }
  };
  document.querySelectorAll('[data-layer]').forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll('[data-layer]').forEach((item) => item.setAttribute('aria-pressed', item === button));
      map.layer(button.dataset.layer);
    };
  });
  document.querySelectorAll('[data-overlay]').forEach((button) => {
    button.onclick = () => {
      const next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', next);
      map.overlay(button.dataset.overlay, next);
    };
  });
  $('zoom-in').onclick = () => map.zoom(1.25);
  $('zoom-out').onclick = () => map.zoom(.8);
  $('map-reset').onclick = () => map.focus(state.scope === 'national' ? 'national' : area(), selectedCity);
  $('import-file').onchange = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = validateSave(await file.text());
      setActive(result.state, result.timeline);
      notify('已导入存档。');
    } catch (error) { notify(error.message); }
  };
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !dialog.open
      && !event.target.closest('input,select,textarea')) {
      event.preventDefault();
      undo();
      return;
    }
    if (event.code === 'Space' && !dialog.open && !event.target.closest('button,input,select,textarea')) {
      event.preventDefault();
      setRun(!running);
    }
  });
  window.addEventListener('pagehide', () => saveAuto(true));
  window.addEventListener('error', (event) => {
    if (event.error) notify('操作遇到问题，请在存档菜单保留当前进度。');
  });

  async function restoreSavedGame() {
    const saved = storeBackend ? await storeBackend.load(storageKey) : loadStore();
    Object.assign(store, saved);
    let restored;
    if (store.auto) {
      try { restored = validateSave(store.auto); }
      catch { notify('旧存档无法读取，已载入默认剧本。'); }
    }
    const initial = restored?.state || Engine.createGame(Data, {
      scenarioId: 'liaoshen', scope: 'theater', side: 'ccp', historyMode: 'dynamic', goal: 'mainland',
    });
    setActive(initial, restored?.timeline || Timeline.create(initial, Engine), false);
  }
  restoreSavedGame().catch(() => {
    const initial = Engine.createGame(Data, {
      scenarioId: 'liaoshen', scope: 'theater', side: 'ccp', historyMode: 'dynamic', goal: 'mainland',
    });
    setActive(initial, Timeline.create(initial, Engine), false);
  });
})();



