(() => {
  'use strict';

  const BaseCivilData = globalThis.CivilWarData;
  let Data = BaseCivilData;
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
  const baseRegions = { national: '全国', northeast: '东北战区', north: '华北战区', east: '华东战区',
    central: '中原战区', south: '华南战区', southwest: '西南战区', northwest: '西北战区', taiwan: '台湾' };
  const regions = { ...baseRegions };
  const commands = {
    advance: '进攻', support: '支援牵制', siege: '围城', defend: '守阵地', entrench: '挖战壕',
    intercept: '围点打援', move: '行军', rest: '城内休整', hold: '原地待命', bombard: '战略轰炸',
  };
  const enemyCommands = new Set(['advance', 'support', 'siege', 'intercept', 'bombard']);
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
  const recruitmentInfo = meta.recruitmentKinds || {};
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
  let scenariosById = new Map(Data.scenarios.map((scenario) => [scenario.id, scenario]));
  let citiesById = new Map(Data.cities.map((city) => [city.id, city]));
  let leadersById = new Map((Data.leaders || []).map((leader) => [leader.id, leader]));
  let groupsById = new Map((Data.groups || []).map((group) => [group.id, group]));
  let currentTheaterMode = 'civil'; // civil | korea | ww2
  const priorityScenarios = ['war1946', 'liaoshen', 'huaihai', 'pingjin', 'jinzhou', 'tashan', 'siping'];
  const scenarioMarks = { liaoshen: '辽', northwest: '西', huaihai: '淮', pingjin: '平', jinzhou: '锦', tashan: '塔', siping: '四', changchun: '长', full: '全' };
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
  let civilDrawFront = false;
  const dialog = $('dialog');
  const map = CivilWarMap.mount($('map'), Data, {
    selectCity: (city) => selectCity(city, true),
    selectGlobalInfo: (hit) => {
      if (!hit?.item) return;
      if (hit.kind === 'deployment') {
        const d = hit.item;
        showDialog('全球战略布兵情报 · ' + d.name,
          '<div class="hoi-cipher-box" style="display:grid;gap:6px;font-size:12.5px;">'
          + '<p style="margin:0;"><b>部队番号：</b>' + escape(d.name) + '</p>'
          + '<p style="margin:0;"><b>驻地港口/城市：</b>' + escape(d.city) + ' · <b>兵种构成：</b>' + escape(d.kind) + '</p>'
          + '<p style="margin:0;"><b>主官：</b>' + escape(d.commander) + ' · <b>总兵力：</b>' + format(d.strength) + ' 人</p>'
          + '<p class="subtext" style="margin:4px 0 0;line-height:1.55;">' + escape(d.note) + '</p>'
          + '</div><div class="dialog-actions"><button type="button" onclick="document.getElementById(\'dialog\').close()">关闭</button></div>');
      } else if (hit.kind === 'city') {
        const c = hit.item;
        const kindText = c.port ? '重要战略军港/海港' : (c.vp >= 14 ? '大国首都/战略中枢' : '全球重要城市/交通枢纽');
        notify('🌍 ' + c.name + '（' + kindText + ' · 战略价值 ' + (c.vp || 5) + '）');
      }
    },
    selectUnit: (unit) => selectUnit(unit, false),
    toggleUnit,
    quickOrder,
    canOrder: permitted,
    previewCity,
    openBattle: (cityId) => openBattleModal(cityId),
    drawFrontCancel() {
      civilDrawFront = false;
      renderBattlePlansBar();
    },
    drawFrontOrder(city) {
      civilDrawFront = false;
      if (selectedUnits.size || selectedUnit) {
        issue('advance', city);
      } else {
        applyMapTool('pincer', city);
      }
      renderBattlePlansBar();
    },
    selectBox(ids) {
      const roots = [...new Set(ids.map((id) => topUnit(state.units.find((u) => u.id === id))?.id).filter(Boolean))].slice(0, 24);
      if (!roots.length) return;
      selectedUnits = new Set(roots);
      selectedUnit = roots[0];
      pane = 'army';
      setMapHelp();
      render();
      notify('框选已编入 ' + roots.length + ' 支部队，右键目标城镇即可统一下达进攻/机动指令。');
    },
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
  let preview3DRenderer = null;
  try { preview3DRenderer = globalThis.CivilWarHuman3D?.createRenderer?.() || null; } catch { preview3DRenderer = null; }

  function writeStore(next) {
    Object.assign(store, next);
    if (storeBackend) {
      void storeBackend.write(storageKey, next).then((saved) => {
        if (!saved) notify('IndexedDB 不可用或空间不足，当前浏览器备用存储也可能受限；建议导出存档。');
      }).catch(() => notify('存档写入失败，请立即导出存档备份。'));
      return true;
    }
    try { localStorage.setItem(storageKey, JSON.stringify(next)); return true; }
    catch { return false; }
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

  function saveAuto() { /* 当前版本不产生自动存档 */ }

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
      && (!state.group || state.scope !== 'theater' || unit.group === state.group);
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
    notify(selectedUnits.size > 1 ? '已选 ' + selectedUnits.size + ' 支部队，可统一下令；不同出发城会形成多路进攻。'
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
      + '</tbody></table><p>全国现役兵力变化 · ' + escape(short.ccp) + ' ' + format(current.ccpStrength - initial.ccpStrength)
      + ' 人，' + escape(short.roc) + ' ' + format(current.rocStrength - initial.rocStrength) + ' 人。</p>'
      + '<button id="continue-national" class="gold" type="button">继续全国战局</button>');
    $('continue-national').onclick = () => { dialog.close(); changeScope('national'); };
  }

  // 全局画面与游戏参数设置（跨三大战区实时生效）
  globalThis.GameSettings = globalThis.GameSettings || {
    modelScale: 1.0,
    maxModelsMacro: 4,
    labelScale: 1.0,
    uiFontScale: 1.0,
    audioVolume: 0.85,
    showRangeRings: true,
  };

  function applyUiFontScale() {
    const scale = Math.max(0.9, Math.min(1.3, Number(globalThis.GameSettings?.uiFontScale) || 1.0));
    document.documentElement.style.fontSize = Math.round(scale * 16) + 'px';
    document.body.style.fontSize = Math.round(scale * 13) + 'px';
  }

  function openSettingsDialog() {
    const gs = globalThis.GameSettings;
    if (!Number.isFinite(gs.uiFontScale)) gs.uiFontScale = 1.0;
    const body = showDialog('⚙ 画面与游戏参数设置（三战区实时生效）',
      '<div class="hoi-cipher-box">'
      + '<header><strong style="color:#f5e1b0;">🎖️ 地图兵模与视觉参数</strong></header>'
      + '<div style="display:grid;gap:10px;margin-top:8px;">'
      + '<label style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><span>界面字号缩放：<b id="set-font-v">' + Math.round(gs.uiFontScale * 100) + '%</b></span>'
      + '<input type="range" id="set-ui-font" min="0.90" max="1.30" step="0.05" value="' + gs.uiFontScale + '" style="width:220px;"></label>'
      + '<label style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><span>3D 兵模大小缩放：<b id="set-scale-v">' + gs.modelScale.toFixed(2) + '×</b></span>'
      + '<input type="range" id="set-model-scale" min="0.6" max="1.8" step="0.05" value="' + gs.modelScale + '" style="width:220px;"></label>'
      + '<label style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><span>宏观视角每纵队最大兵模数：<b id="set-max-v">' + gs.maxModelsMacro + '</b></span>'
      + '<input type="range" id="set-max-macro" min="1" max="8" step="1" value="' + gs.maxModelsMacro + '" style="width:220px;"></label>'
      + '<label style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><span>战争音效音量：<b id="set-vol-v">' + Math.round(gs.audioVolume * 100) + '%</b></span>'
      + '<input type="range" id="set-audio-vol" min="0" max="1" step="0.05" value="' + gs.audioVolume + '" style="width:220px;"></label>'
      + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="set-range-rings" ' + (gs.showRangeRings ? 'checked' : '') + '> 显示 B-29 航程圈与红色导弹射程圈</label>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
      + '<button type="button" class="gold" id="set-reset-btn">↩️ 恢复默认参数</button>'
      + '<button type="button" id="set-close-btn">✔ 完成并应用</button>'
      + '</div></div>');
    const sync = () => { applyUiFontScale(); render(); };
    body.querySelector('#set-ui-font').oninput = (ev) => {
      gs.uiFontScale = Number(ev.target.value);
      body.querySelector('#set-font-v').textContent = Math.round(gs.uiFontScale * 100) + '%';
      sync();
    };
    body.querySelector('#set-model-scale').oninput = (ev) => {
      gs.modelScale = Number(ev.target.value);
      body.querySelector('#set-scale-v').textContent = gs.modelScale.toFixed(2) + '×';
      sync();
    };
    body.querySelector('#set-max-macro').oninput = (ev) => {
      gs.maxModelsMacro = Number(ev.target.value);
      body.querySelector('#set-max-v').textContent = String(gs.maxModelsMacro);
      sync();
    };
    body.querySelector('#set-audio-vol').oninput = (ev) => {
      gs.audioVolume = Number(ev.target.value);
      body.querySelector('#set-vol-v').textContent = Math.round(gs.audioVolume * 100) + '%';
    };
    body.querySelector('#set-range-rings').onchange = (ev) => {
      gs.showRangeRings = Boolean(ev.target.checked);
      sync();
    };
    body.querySelector('#set-reset-btn').onclick = () => {
      Object.assign(gs, { modelScale: 1.0, maxModelsMacro: 4, labelScale: 1.0, uiFontScale: 1.0, audioVolume: 0.85, showRangeRings: true });
      applyUiFontScale();
      openSettingsDialog();
      sync();
    };
    body.querySelector('#set-close-btn').onclick = () => dialog.close();
  }

  function unitTerm(side = state?.player) {
    const tm = Data?.theaterMode || 'civil';
    if (tm === 'ww2') return side === 'roc' ? '装甲军/师团' : '集团军/方面军';
    if (tm === 'korea') return side === 'ccp' ? '军/兵团' : '集团军/师';
    return side === 'roc' ? '整编师/军' : '纵队/军';
  }

  function renderScenarios() {
    const sc = scenariosById.get(state.scenarioId) || Data.scenarios[0];
    const sideLabel = sides[state.player] || state.player;
    const ownUnits = Engine.activeUnits(state).filter((u) => !u.parent && u.side === state.player);
    const list = priorityScenarios.map((id) => scenariosById.get(id)).filter(Boolean);
    const prepHtml = (state.prepDaysLeft || 0) > 0
      ? '<div style="margin:4px 0;padding:4px 6px;border-radius:4px;background:#3a3016;border:1px solid #d4b054;color:#ffe79e;font-size:11px;">⏳ 战前筹备期：剩 <b>' + state.prepDaysLeft + '</b> 天开战 <button type="button" id="rail-end-prep" style="font-size:10px;padding:1px 5px;margin-left:4px;">⚡ 提前开战</button></div>'
      : '';
    const endlessBadge = state.sandboxEndless ? '<span style="font-size:10px;color:#7ee094;white-space:nowrap;">♾️ 无尽沙盒</span>' : '<span style="font-size:10px;color:#7ee094;white-space:nowrap;">● 进行中</span>';
    $('scenario-list').innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;"><span style="font-size:10px;color:#c9bc95;">当前存档</span>' + endlessBadge + '</div>'
      + '<div class="lock-title" style="display:block;word-break:break-word;">' + escape(sc?.title || '全面内战') + '</div>'
      + '<div style="word-break:break-word;"><b>锁定阵营：</b>' + escape(sideLabel) + '</div>'
      + '<div><b>当前日期：</b>' + fmtDate(state.date) + ' · ' + escape(unitTerm()) + ' ' + ownUnits.length + ' 支</div>'
      + prepHtml
      + '<div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap;">'
      + '<button type="button" id="rail-sandbox-war" style="flex:1;font-size:10.5px;padding:3px 5px;" title="HOI4 自由跨国宣战（东征日本 / 美苏开战 / 称霸全球）">🌍 自由宣战</button>'
      + '<button type="button" id="rail-continue-endless" style="flex:1;font-size:10.5px;padding:3px 5px;" title="开启无尽模式，统一后不结束">♾️ 无尽模式</button>'
      + '</div>'
      + '<div style="color:#a8b8a4;font-size:10.5px;margin-top:3px;">已锁定当前战役，请点击上方「退出重选」切换战役。</div>'
      + '<div hidden aria-hidden="true">' + list.map((s) => '<button type="button" data-scenario="' + escape(s.id) + '" aria-pressed="' + (state.scenarioId === s.id) + '"></button>').join('') + '</div>';
    $('rail-end-prep')?.addEventListener('click', () => {
      if (action('endPrepEarly', [])) { WarAudio.bugle(); saveAuto(true); render(); notify('⚡ 已提前结束筹备期，全线正式开战！'); }
    });
    $('rail-continue-endless')?.addEventListener('click', () => {
      if (action('continueSandboxMode', [])) { WarAudio.click(); saveAuto(true); render(); notify('♾️ 无尽自由沙盒已开启：统一或任务完成后永不强制结束！'); }
    });
    $('rail-sandbox-war')?.addEventListener('click', openSandboxWarDialog);
  }

  function openSandboxWarDialog() {
    // 二战/大沙盒里玩家属于同盟或轴心，不能对本阵营盟友宣战。
    const allies = currentTheaterMode === 'civil' ? []
      : (state.player === 'ccp' ? ['usa', 'ussr', 'uk'] : ['germany']);
    const targets = [
      ['japan', '🇯🇵 对日本宣战（东征冲绳/东京）'],
      ['ussr', '☭ 对苏联宣战（冷战不可思议行动）'],
      ['usa', '🇺🇸 对美国宣战（进军珍珠港/太平洋）'],
      ['germany', '🇩🇪 对德国宣战（决战柏林/欧洲）'],
      ['uk', '🇬🇧 对英国宣战（进攻伦敦/新加坡）'],
    ].filter(([tag]) => !allies.includes(tag));
    const body = showDialog('🌍 HOI4 自由外交宣战与全球跨国征服',
      '<div class="hoi-cipher-box">'
      + '<header><strong style="color:#f5e1b0;">🔥 制造战争借口并自由宣战（每次 20 政点 · 自动开启无尽沙盒）</strong></header>'
      + '<p class="subtext" style="margin:4px 0;">无论你刚统一中国想东征日本，还是打完二战想开启美苏冷战热战，都可以直接对任意目标宣战或一键升格至无缝全球大沙盘！</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">'
      + targets.map(([tag, label]) => '<button type="button" class="gold" data-sw-target="' + tag + '">' + label + '</button>').join('')
      + '<button type="button" class="gold" id="sw-goto-grand">🌍 立即切入《1949 林彪东征日本》全球大图</button>'
      + '</div></div>');
    body.querySelectorAll('[data-sw-target]').forEach((b) => b.onclick = () => {
      if (currentTheaterMode === 'civil') {
        launchUnifiedTheater('grand', b.dataset.swTarget === 'ussr' ? 'grand-1945-unthinkable' : 'grand-1949-linbiao', state.player, { prepDays: 0, sandboxEndless: true });
        return;
      }
      if (action('declareSandboxWar', [b.dataset.swTarget])) {
        WarAudio.bugle(); saveAuto(true); render(); dialog.close();
        notify('🔥 已正式向目标大国宣战！全球战火重燃！');
      }
    });
    body.querySelector('#sw-goto-grand')?.addEventListener('click', () => {
      launchUnifiedTheater('grand', 'grand-1949-linbiao', 'ccp', { prepDays: 0, sandboxEndless: true });
    });
  }

  let selfProclaimed = false;

  function renderHeader() {
    $('player-name').textContent = sides[state.player];
    $('player-dot').className = 'dot ' + state.player;
    const flagEl = $('hoi-flag-badge');
    if (flagEl) {
      flagEl.className = 'hoi-flag-badge ' + state.player;
      flagEl.textContent = state.player === 'ccp' ? '★' : '☀';
    }
    const selfBanner = $('self-banner');
    if (selfBanner) selfBanner.hidden = !selfProclaimed;
    const group = groupsById.get(state.group);
    $('scope-label').textContent = group && state.scope === 'theater' ? group.name
      : state.scope === 'national' ? '全国指挥' : regions[area()] || '战区指挥';
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
    if ($('night-toggle')) {
      $('night-toggle').setAttribute('aria-pressed', String(Boolean(state.nightMode)));
      $('night-toggle').textContent = state.nightMode ? '☀️ 切换白昼' : '🌙 夜间宿营';
    }
    if ($('hoi-hud-stats')) {
      const side = state.player;
      const pp = Math.round(state.political?.[side]?.points ?? 0);
      const ws = Math.round(valueOf(state.warSupport, side, 60));
      const mp = Math.round((state.economy?.[side]?.manpower ?? 0) / 1000);
      const rifles = Math.round(state.stock?.[side]?.infantry ?? 0);
      const rifleDelta = rifles - 200;
      const rifleClass = rifleDelta >= 0 ? 'surplus' : 'deficit';
      const supRatio = Math.round((supplyView?.ration?.[side] ?? 1) * 100);
      const cipher = state.cipher?.[side] || { decrypt: 0, activeDays: 0 };
      const cipherLabel = cipher.activeDays > 0 ? '📡 破译生效 ' + cipher.activeDays + '天' : '📡 破译 ' + Math.round(cipher.decrypt ?? 0) + '%';
      const fuelVal = Math.round(Engine.ensureCivilHoi?.(state)?.[side]?.fuel ?? 85);
      const nextHudHtml =
        '<button type="button" class="hoi-stat-pill" data-open-panel="economy" title="兵源人力储备">👥 人力 <b>' + mp + 'k</b></button>'
        + '<button type="button" class="hoi-stat-pill ' + rifleClass + '" data-open-panel="production" title="枪炮库存盈余/缺口">🔫 枪炮 <b>' + (rifleDelta >= 0 ? '+' : '') + format(rifles) + '</b></button>'
        + '<button type="button" class="hoi-stat-pill" data-open-panel="economy" title="机械化与海空石油燃油储备">🛢️ 燃油 <b>' + fuelVal + '%</b></button>'
        + '<button type="button" class="hoi-stat-pill' + (supRatio < 70 ? ' deficit' : '') + '" data-open-panel="supply" title="全军补给覆盖率与机动化">📦 补给 <b>' + supRatio + '%</b></button>'
        + '<button type="button" class="hoi-stat-pill" data-open-panel="politics" title="政治点数 / 军心支持度">🏛️ 政治 <b>' + pp + '</b> · ' + ws + '%</button>'
        + '<button type="button" class="hoi-stat-pill' + (cipher.activeDays > 0 ? ' surplus' : '') + '" data-open-panel="intel" title="隐蔽战线情报网与电台密码破译">' + cipherLabel + '</button>';
      if ($('hoi-hud-stats').dataset.lastHtml !== nextHudHtml) {
        $('hoi-hud-stats').dataset.lastHtml = nextHudHtml;
        $('hoi-hud-stats').innerHTML = nextHudHtml;
      }
    }
    $('brief-settings').setAttribute('aria-pressed', Object.keys(pauseLabels).some((key) => pausePreferences[key]));
    document.querySelectorAll('[data-speed]').forEach((item) => item.setAttribute('aria-pressed', Number(item.dataset.speed) === speed));
  }

  function renderGeneralDock() {
    const dock = $('general-dock');
    if (!dock) return;
    const units = Engine.activeUnits(state).filter(u => !u.parent && u.side === state.player && permitted(u));
    if (!units.length) { dock.innerHTML = ''; return; }
    const byGroup = new Map();
    for (const u of units) {
      const key = u.group || u.area || 'main';
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(u);
    }
    const groups = [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    dock.innerHTML = groups.map(([key, list]) => {
      const leadUnit = list.find(u => u.leader && leadersById.get(u.leader)) || list[0];
      const leader = leadUnit?.leader ? leadersById.get(leadUnit.leader) : null;
      const grp = groupsById.get(key);
      const title = leader?.name || grp?.name || (regions[key] || '主力集团');
      const total = list.reduce((s, u) => s + u.strength, 0);
      const active = list.every(u => selectedUnits.has(u.id)) && list.length > 0;
      const img = leader && globalThis.CivilWarPortraits?.[leader.id];
      const avatar = img ? '<img src="' + img + '" alt="' + escape(title) + '">'
        : '<span class="gen-monogram">' + escape(title.slice(0, 1)) + '</span>';
      return '<button type="button" class="gen-card" data-gen-group="' + escape(key) + '" aria-pressed="' + active
        + '" title="点击一键框选该集团军全部 ' + list.length + ' 支纵队/军（共 ' + format(total) + ' 人）">'
        + avatar + '<div><strong>' + escape(title) + '</strong><small>' + list.length + '/24 · '
        + Math.round(total / 1000) + 'k</small></div></button>';
    }).join('');
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
      + '<p class="territory-status">民心 / 战争支持 · ' + escape(short.ccp) + ' ' + format(valueOf(state.warSupport, 'ccp', 82))
      + ' · ' + escape(short.roc) + ' ' + format(valueOf(state.warSupport, 'roc', 58)) + '</p>'
      + '<p class="territory-status">稳定 ' + format(valueOf(state.stability, state.player, 60))
      + ' · 科研 ' + format(state.research?.[state.player]?.points ?? 0)
      + ' · 指挥 ' + format(state.command?.[state.player]?.points ?? 0) + '</p>';
    $('resources').innerHTML = resourceTiles(state.economy[state.player]);
  }

  function unitRow(unit) {
    const own = unit.side === state.player;
    const display = own ? format(unit.strength) : '约 ' + format(Math.round(unit.strength / 100) * 100);
    const commander = leadersById.get(unit.leader)?.name;
    const divCount = state.units.filter((child) => child.parent === unit.id && child.strength > 0).length;
    const metaText = (commander ? commander + ' · ' : '') + (divCount ? divCount + '师 · ' : '') + display + '人';
    return '<button class="unit-row ' + (own ? '' : 'enemy') + '" type="button" data-unit="' + escape(unit.id)
      + '" aria-pressed="' + (unit.id === selectedUnit) + '" title="' + escape(unit.name + (commander ? ' · 司令 ' + commander : ''))
      + '"><span><b class="dot ' + unit.side
      + '"></b><strong>' + escape(unit.name) + '</strong></span><small>' + escape(metaText) + '</small></button>';
  }

  function unitRows(units, empty) {
    return units.length ? units.map(unitRow).join('') : '<p class="empty">' + escape(empty) + '</p>';
  }

  function battlePanel(cityId) {
    const battle = state.battles?.[cityId];
    if (!battle) return '';
    const ratio = typeof battle.lastRatio === 'number' ? battle.lastRatio.toFixed(2) : '—';
    return '<div class="card battle-card"><h3>' + (battle.phase ? escape(battle.phase) + ' · ' : '') + '第 ' + format(battle.days) + ' 天</h3>'
      + '<p>' + escape(short[battle.side] || battle.side) + '进攻 · 优势比 ' + ratio
      + ' · 进攻方向 ' + format(battle.attackDirections || 1)
      + ' · 前线 ' + format(battle.engagedUnitIds?.length || 0) + ' 支 / 预备 ' + format(battle.reserveUnitIds?.length || 0) + ' 支'
      + ' · 累计伤亡 ' + format((battle.attackerCasualties || 0) + (battle.defenderCasualties || 0)) + ' 人'
      + (battle.weather ? ' · 天气 ' + escape(battle.weather) : '')
      + (battle.tactic ? ' · 战术 ' + escape(battle.tactic) : '') + '</p>'
      + '<p class="subtext">组织度耗尽的一方将退出战斗；守军只有在没有退路时才会被歼灭。进攻方被击退后会原地整补，想再攻需重新下令。</p></div>';
  }

  function renderBattleHud() {
    const hud = $('battle-hud');
    const battles = Object.entries(state.battles || {}).map(([city, battle]) => ({ city, battle }))
      .sort((a, b) => b.battle.days - a.battle.days || a.city.localeCompare(b.city));
    if (!battles.length) { hud.hidden = true; hud.innerHTML = ''; return; }
    hud.hidden = false;
    const selected = battles.find((item) => item.city === selectedCity) || battles[0];
    const { city, battle } = selected;
    const isAttacker = battle.side === state.player;
    const playerInBattle = isAttacker || battle.defendingSide === state.player;
    const parents = new Set(state.units.map((unit) => unit.parent).filter(Boolean));
    const fieldUnits = state.units.filter((unit) => !parents.has(unit.id) && unit.strength > 0);
    const attackers = fieldUnits.filter((unit) => unit.side === battle.side && unit.order?.target === city
      && ['advance', 'siege'].includes(unit.order.type));
    const defenders = fieldUnits.filter((unit) => unit.side === battle.defendingSide && unit.city === city);
    const strength = (units) => units.reduce((sum, unit) => sum + unit.strength, 0);
    const displayStrength = (value, side) => side === state.player ? format(value)
      : '约 ' + format(Math.round(value / 500) * 500);
    const posture = battle.postureBySide?.[state.player] || 'balanced';
    const postures = isAttacker
      ? [['balanced', '均衡'], ['assault', '全线突击'], ['envelop', '多路包围'], ['cautious', '谨慎推进']]
      : [['balanced', '均衡'], ['hold', '坚守阵地']];
    const command = state.command?.[state.player] || {};
    const ability = commandInfo.barrage || { cost: 30 };
    const cooldown = Number(command.cooldowns?.barrage) || 0;
    const shortage = (Number(command.points) || 0) < ability.cost;
    const artilleryReady = typeof meta.canBarrage === 'function'
      ? meta.canBarrage(Data, state, city, state.player)
      : attackers.some((unit) => unit.branch === 'artillery' || unit.profile === 'artillery');
    const barrageText = !isAttacker ? '炮火准备 · 攻方行动'
      : cooldown > 0 ? '炮火准备 · 冷却 ' + cooldown + ' 天'
        : shortage ? '炮火准备 · 需 ' + ability.cost + ' 点'
          : !artilleryReady ? '炮火准备 · 无炮兵' : '炮火准备';
    const ratio = Number(battle.lastRatio) || 1;
    const attackShare = Math.max(8, Math.min(92, ratio / (1 + ratio) * 100));
    const rawBubble = Number.isFinite(battle.bubbleScore) ? battle.bubbleScore : Math.round(attackShare);
    const bubble = Math.max(1, Math.min(99, isAttacker ? rawBubble : 100 - rawBubble));
    const mods = battle.modifiers || {};
    const modChips = [
      mods.terrain ? ['地形 +' + mods.terrain + '%', isAttacker ? 'neg' : 'pos'] : null,
      mods.river ? ['跨河 ' + mods.river + '%', isAttacker ? 'neg' : 'pos'] : null,
      mods.fort ? ['要塞/战壕 +' + mods.fort + '%', isAttacker ? 'neg' : 'pos'] : null,
      mods.multidir ? ['多路包围 +' + mods.multidir + '%', isAttacker ? 'pos' : 'neg'] : null,
      mods.encircled ? ['包饺子断粮 ' + mods.encircled + '%', isAttacker ? 'pos' : 'neg'] : null,
      mods.planning ? ['计划加成 +' + mods.planning + '%', isAttacker ? 'pos' : 'neg'] : null,
    ].filter(Boolean).map(([text, cls]) => '<span class="hoi-mod-chip ' + cls + '">' + escape(text) + '</span>').join('');
    const lowOrgDefender = !isAttacker && defenders.find(u => valueOf(u, 'org', 100) < 40);
    hud.innerHTML = '<div class="battle-hud-head"><strong>' + escape(cityName(city)) + ' · ' + (battle.phase ? escape(battle.phase) : '交战中')
      + '</strong><span class="hoi-bubble-pill ' + (bubble >= 50 ? 'win' : 'lose') + '">' + bubble + '</span><small>第 ' + format(battle.days) + ' 日 · ' + (isAttacker ? '我方进攻' : '我方防守') + '</small></div>'
      + (battles.length > 1 ? '<div class="battle-hud-picker" aria-label="选择战场">' + battles.map((item) =>
        '<button type="button" data-battle-focus="' + escape(item.city) + '" aria-pressed="' + (item.city === city) + '">'
          + escape(cityName(item.city)) + ' · ' + format(item.battle.days) + '日</button>').join('') + '</div>' : '')
      + '<div class="battle-hud-facts"><span>攻方 <b>' + escape(short[battle.side]) + '</b></span><span>进攻方向 <b>'
      + format(battle.attackDirections || 1) + '</b></span><span>攻守比 <b>' + ratio.toFixed(2) + ' : 1</b></span>'
      + '<span>累计减员 <b>' + format((battle.attackerCasualties || 0) + (battle.defenderCasualties || 0)) + ' 人</b></span>'
      + (battle.weather ? '<span>' + escape(battle.weather) + '</span>' : '') + '</div>'
      + (modChips ? '<div class="hoi-mod-row">' + modChips + '</div>' : '')
      + (lowOrgDefender ? '<div class="unit-actions"><button type="button" class="gold" data-battle-cycle="' + escape(city) + '">🔄 车轮战换防（撤出低组织度部队）</button></div>' : '')
      + '<div class="battle-hud-meter" role="img" aria-label="当前攻守比"><i style="width:' + attackShare + '%"></i></div>'
      + '<div class="battle-hud-strength"><div><span>攻方兵力 · 前线 ' + format(battle.engagedUnitIds?.length || 0)
      + ' 支 / 预备 ' + format(battle.reserveUnitIds?.length || 0) + ' 支</span><strong>'
      + displayStrength(strength(attackers), battle.side) + ' 人</strong></div><div><span>守方兵力 · 当前守军</span><strong>'
      + displayStrength(strength(defenders), battle.defendingSide) + ' 人</strong></div></div>'
      + '<div class="battle-hud-controls">' + postures.map(([id, label]) => '<button type="button" data-battle-posture="'
        + id + '" data-battle-city="' + escape(city) + '" aria-pressed="' + (posture === id) + '"' + (!playerInBattle ? ' disabled' : '')
        + '>' + label + '</button>').join('')
      + '<button type="button" data-battle-action="barrage" data-battle-city="' + escape(city) + '" title="需目标周边有炮兵；削弱守军防御 5 天；消耗指挥点 ' + ability.cost + '"'
        + (!isAttacker || cooldown > 0 || shortage || !artilleryReady ? ' disabled' : '') + '>' + barrageText + '</button>'
      + '<button type="button" class="gold" data-battle-modal="' + escape(city) + '">⚔ 战况详情</button>'
      + '<button type="button" data-battle-focus="' + escape(city) + '">定位战场</button></div>'
      + '<p class="battle-hud-note">' + (isAttacker
        ? '可从远处下令；部队沿道路逐站集结，铁路会加快行军。抵达阵地后可多方向进攻，预备队会接替前线。'
        : '坚守姿态提高防御；己方兵力按编制精确显示，敌军兵力为估算。') + '</p>';
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
    const buildings = state.buildings?.[city.id] || {};
    const construction = (state.construction || []).filter(job => job.city === city.id);
    const constructionRows = construction.map(job => {
      const label = meta.buildingKinds?.[job.kind]?.name || job.kind;
      const percent = Math.max(0, Math.min(100, 100 * (1 - job.remaining / Math.max(1, job.days))));
      return '<div class="build-project"><div><span>' + escape(label) + '</span><small>还需 ' + format(job.remaining) + ' 天</small></div>'
        + '<i><b style="width:' + percent + '%"></b></i></div>';
    }).join('');
    const recruiting = (state.recruitment || []).filter(job => job.city === city.id);
    const recruitmentRows = recruiting.map(job => {
      const label = recruitmentInfo[job.kind]?.name || job.kind;
      const percent = Math.max(0, Math.min(100, 100 * (1 - job.remaining / Math.max(1, job.days))));
      return '<div class="build-project"><div><span>新编' + escape(label) + '</span><small>训练中 · ' + format(job.remaining) + ' 天</small></div>'
        + '<i><b style="width:' + percent + '%"></b></i></div>';
    }).join('');
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
      + '<section class="industry-card"><header><strong>工业与建设</strong><span>军工厂 ' + format(buildings.militaryFactory || 0)
      + ' · 民用工厂 ' + format(buildings.civilianFactory || 0) + '</span></header>'
      + (constructionRows || '<p class="subtext">本城暂无建设项目。</p>')
      + (state.owners[city.id] === state.player ? '<div class="industry-actions">'
        + '<button type="button" data-build-building="militaryFactory">建军工厂</button>'
        + '<button type="button" data-build-building="civilianFactory">建民用工厂</button></div>' : '')
      + '</section>'
      + '<section class="industry-card recruit-card"><header><strong>征兵与整编</strong><span>兵员储备 '
      + format(state.economy?.[state.player]?.manpower || 0) + '</span></header>'
      + (recruitmentRows || '<p class="subtext">本城暂无新军训练。</p>')
      + (state.owners[city.id] === state.player ? '<div class="industry-actions recruit-actions">'
        + Object.entries(recruitmentInfo).map(([kind, definition]) => '<button type="button" data-recruit-branch="' + escape(kind)
          + '" title="' + escape(definition.days + ' 天训练；兵员 ' + definition.manpower + '，军械 ' + definition.arms
            + '，需要相应兵种装备库存') + '">募' + escape(definition.name) + '</button>').join('')
        + '</div><p class="subtext">征募会消耗兵员与对应枪炮库存；训练完成后部队列入本城驻军，可直接下令。</p>' : '')
      + '</section>'
      + fortPanel(city)
      + '<div class="card"><h3>HOI4 战区特种战术</h3>'
      + ((state.scorched?.[city.id] ?? 0) > 0 ? '<p class="subtext" style="color:#ff8a7a;">🔥 当前处于焦土/铁路瘫痪状态（剩余 ' + state.scorched[city.id] + ' 天，补给减半）</p>' : '')
      + '<div class="unit-actions">'
      + (state.owners[city.id] === state.player
        ? '<button type="button" data-scorched-city="' + escape(city.id) + '" title="撤退前花 15 政治点炸毁铁路与工事，令敌军占领后 15 天断补">💣 焦土炸桥（15点）</button>'
        : '<button type="button" data-sabotage-city="' + escape(city.id) + '" title="花 15 指挥/政治点破袭敌占铁路，瘫痪敌军补给 10 天">🔧 铁路破袭（15点）</button>'
          + '<button type="button" class="gold" data-airborne-city="' + escape(city.id) + '" title="花 25 指挥点突袭敌后节点：空城直接夺占，有守军则重创组织度并断路">'
          + (state.player === 'ccp' ? '⚡ 武工队穿插奇袭' : '🪂 空降兵敌后奇袭') + '（25点）</button>')
      + '</div></div>'
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
    const currentSide = state.leaderTransfers?.[leader.id] || leader.side;
    const image = portrait?.file ? '<img src="' + escape(portrait.file) + '" alt="' + escape(leader.name) + '历史照片">'
      : '<span class="portrait-placeholder" aria-hidden="true">' + escape(leader.name[0]) + '</span>';
    return '<div class="card leader-card">' + image + '<div><h3>' + escape(leader.name) + '</h3><p>'
      + escape(leader.role || '') + '</p><p>' + sideTag(currentSide)
      + (currentSide !== leader.side ? ' · 原属 ' + escape(short[leader.side] || leader.side) : '')
      + '</p><p>' + escape(leader.bio || '') + '</p>'
      + (portrait ? sourceLink(portrait.source, portrait.credit || '照片出处') + '<br>' : '')
      + sourceLink(leader.source, '人物史料') + '</div></div>';
  }

  function renderTree(army) {
    function hasManualAssignment(unit) {
      return Boolean(unit.manualAssignment || state.units.some(child => child.parent === unit.id && hasManualAssignment(child)));
    }
    function rows(unit, depth) {
      const name = unit.parent ? unit.name.split(' · ').at(-1) : unit.name;
      const personnel = unit.side === state.player ? format(unit.strength) : '约 ' + format(Math.round(unit.strength / 100) * 100);
      const profile = equipmentTypes[unit.profile || unit.branch || 'infantry']?.[0] || '步兵装备';
      return '<tr><td><button data-unit="' + escape(unit.id) + '" type="button" style="--depth:' + depth
        + '" aria-pressed="' + (selectedUnit === unit.id) + '">' + escape(name.replace('（模拟）', '')) + '</button></td><td><small>'
        + escape(profile.replace('装备', '')) + '</small></td><td>' + personnel + '</td><td><small>'
        + escape(cityName(unit.city)) + ' · ' + escape(unit.order ? (commands[unit.order.type] || '行动') : '待命')
        + (unit.parent && unit.side === state.player ? (hasManualAssignment(unit) || unit.order && !unit.automatedOrder
          ? ' · 手动' : army.autoUnassigned || army.delegated ? ' · 自动' : ' · 待命') : '')
        + '</small></td></tr>'
        + state.units.filter((child) => child.parent === unit.id && child.strength > 0).map((child) => rows(child, depth + 1)).join('');
    }
    return '<table class="formation-table"><thead><tr><th>纵队 / 师 / 团</th><th>装备</th><th>兵力</th><th>位置与任务</th></tr></thead><tbody>'
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
      + '<span>司令官<strong>' + escape(leader.name) + '</strong>'
      + (traits.length ? '<small>' + escape(traits.map((trait) => trait.name).join('/')) + ' · 等级 '
        + format(leaderLevelOf(state, leader.id)) + '</small>' : '') + '</span></button>' : '';
    const divisions = root ? state.units.filter((child) => child.parent === root.id && child.strength > 0) : [];
    const figureIcons = globalThis.CivilWarHuman3D?.iconCount(unit.strength) || Math.ceil(unit.strength / 5000);
    const tanks = globalThis.CivilWarHuman3D?.unitTanks(unit) || 0;
    const tankIcons = globalThis.CivilWarHuman3D?.tankIcons(tanks) || 0;
    const divisionSummary = divisions.length
      ? '下辖 ' + divisions.length + ' 个师/旅：' + divisions.map((d) =>
        d.name.split(' · ').at(-1).replace('（模拟）', '') + '（'
        + (own ? format(d.strength) : '约' + format(Math.round(d.strength / 100) * 100)) + '人）').join('、')
      : '';
    return '<button class="link-button" type="button" data-back-roster>‹ 返回部队名册</button>'
      + '<div class="card"><div class="city-title"><h3 style="font-size:17px">' + escape(unit.name) + '</h3>'
      + sideTag(unit.side) + '</div><p>' + escape(cityName(unit.city)) + ' · ' + escape(orderLabel)
      + (state.nightMode && (!unit.order || ['hold', 'rest'].includes(unit.order.type)) ? ' · 夜间宿营中' : '') + '</p>'
      + '<div class="unit-headline">' + portrait + '<canvas id="unit-3d-preview" width="110" height="110" data-side="'
      + escape(unit.side) + '" data-group="' + escape(unit.group || '') + '" data-kind="'
      + (unit.profile === 'artillery' || unit.branch === 'artillery' ? 'artillery'
        : unit.profile === 'mobile' || unit.branch === 'armor' ? 'tank' : 'human')
      + '" style="width:72px;height:72px;border-radius:6px;border:1px solid #4e5e52;background:#1a241f;flex-shrink:0;" title="3D 实时兵模预览"></canvas>'
      + '<div class="unit-readout"><span>现役兵力 <strong>' + strength + '</strong> / ' + format(unit.maxStrength)
      + ' 人（地图 ' + format(figureIcons) + ' 兵标' + (tankIcons ? ' · 约 ' + format(tankIcons) + ' 坦克标' : '') + '）</span>'
      + (leader ? '<span>现任主官：' + escape(leader.name + '（' + (leader.role || '司令官') + '）') + '</span>' : '<span>现任主官：暂缺（可任命）</span>')
      + (group ? '<span>派系与军服：' + escape(group.name) + '</span>' : '')
      + (divisionSummary ? '<span>' + escape(divisionSummary) + '</span>' : '')
      + '<span>粮食 ' + format(unit.food) + '% · 装备 ' + format(unit.equipment) + '%</span>'
      + '<span>弹药 ' + percent(valueOf(unit, 'ammo', 100)) + ' · 油料 ' + percent(valueOf(unit, 'fuel', 100))
      + ' · 医疗 ' + percent(valueOf(unit, 'medical', 100)) + '</span>'
      + '<span>士气 ' + format(valueOf(unit, 'morale', 70)) + ' · 老兵 ' + format(valueOf(unit, 'veteran', 0))
      + ' 级 · 组织 ' + format(valueOf(unit, 'org', 100))
      + (valueOf(unit, 'wounded', 0) > 0 ? ' · 伤员 ' + format(unit.wounded) + ' 回补中' : '') + '</span>'
      + (design ? '<span>编制 ' + escape(design.name) + ' · 宽 ' + (stats?.width ?? 0).toFixed(1)
        + ' · 装 ' + (stats?.armor ?? 0) + ' · 穿 ' + (stats?.piercing ?? 0) + '</span>' : '')
      + (own ? '' : '<span>情报水平 ' + format(intelLevel) + '</span>')
      + '</div></div>'
      + (allowed ? '<button type="button" class="link-button" data-delegate="' + escape(root?.id) + '">'
        + (root?.delegated ? '收回司令员指挥权' : '委托司令员指挥') + '</button>'
        + (unit.parent ? '<button type="button" class="link-button" data-release-ai="' + escape(unit.id)
          + '">交给 AI 安排此部队</button>' : '')
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
      + [['player', '当前阵营'], ['all', '全部阵营'], ['ccp', short.ccp], ['roc', short.roc]].map((item) => option(...item, rosterSide)).join('')
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
    const previewCanvas = $('unit-3d-preview');
    if (previewCanvas && preview3DRenderer) {
      const pctx = previewCanvas.getContext('2d');
      const side = previewCanvas.dataset.side || 'ccp';
      const kind = previewCanvas.dataset.kind || 'human';
      const group = previewCanvas.dataset.group || '';
      const u = inspectUnit();
      const act = globalThis.CivilWarHuman3D?.orderAction(u, Boolean(u && state.battles?.[u.city]), Boolean(state.nightMode)) || 'idle';
      pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      pctx.drawImage(preview3DRenderer.frame(side, true, performance.now(), kind, act === 'bombard' ? 'idle' : act, group), 0, 0, previewCanvas.width, previewCanvas.height);
    }
  }

  function render() {
    supplyView = typeof Engine.supplyReading === 'function' ? Engine.supplyReading(Data, state) : null;
    renderHeader();
    renderLedger();
    renderInspector();
    renderCommandDeck();
    renderBattleHud();
    const outliner = $('hoi-theaters');
    if (outliner) {
      const theaterKeys = Data.regions ? Object.keys(Data.regions) : ['northeast', 'north', 'east', 'central', 'northwest', 'south'];
      const activeBattles = Object.keys(state.battles || {});
      const html = theaterKeys.map((reg) => {
        const regUnits = Engine.activeUnits(state).filter((u) => !u.parent && u.side === state.player && citiesById.get(u.city)?.region === reg);
        const regBattles = activeBattles.filter((cid) => citiesById.get(cid)?.region === reg).length;
        const pressed = state.scope === 'theater' && area() === reg;
        const rawName = regions[reg] || reg;
        const displayName = /战区|战场|战线|海峡|群岛|本土/.test(rawName) ? rawName : (rawName + '战区');
        return '<button type="button" class="hoi-theater-card" data-hoi-theater="' + reg + '" aria-pressed="' + pressed + '">'
          + '<div><strong>' + escape(displayName) + '</strong><small>'
          + regUnits.length + ' 支' + escape(unitTerm()) + '</small></div>'
          + '<span class="hoi-theater-badge ' + (regBattles ? 'fight' : 'calm') + '">'
          + (regBattles ? '⚔ ' + regBattles + '战' : '平稳') + '</span></button>';
      }).join('');
      if (outliner.dataset.lastHtml !== html) {
        outliner.dataset.lastHtml = html;
        outliner.innerHTML = html;
      }
    }
    renderBattlePlansBar();
    renderGeneralDock();
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
    if (running) timer = setInterval(() => tick(speed), speed === 5 ? 160 : speed === 3 ? 330 : 620);
    renderHeader();
  }

  function tick(days) {
    const winner = state.winner;
    let openEventId = null;
    for (let elapsed = 0; elapsed < days && !state.winner; elapsed++) {
      const seen = state.eventSequence ?? state.log.at(-1)?.seq ?? 0;
      Engine.step(Data, state, 1);
      const entries = state.log.filter((entry) => (entry.seq || 0) > seen);
      if (tutorial?.step === 2) {
        const result = entries.find((entry) => entry.city === 'jinzhou'
          && (entry.type === 'battle-end' || entry.type === 'capture' || entry.phase === 'cleared'));
        if (result) { tutorial.entry = result; tutorial.step = 3; setRun(false); }
      }
      if (state.pendingEvent?.id && !tutorial && !dialog.open) {
        openEventId = state.pendingEvent.id;
        setRun(false);
        saveAuto(true);
        break;
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
    if (openEventId) openEventClipboard(openEventId);
  }

  function setInspectorOpen(open) {
    const panel = document.querySelector('.inspector');
    if (!panel) return;
    panel.classList.toggle('is-hidden', !open);
    panel.classList.toggle('is-open', Boolean(open));
    $('mobile-inspector')?.setAttribute('aria-expanded', String(Boolean(open)));
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
    setInspectorOpen(true);
    render();
    if (jump) map.jump(unit.city);
  }

  let pendingMapTool = null;
  const mapToolInfo = {
    pincer: { label: '🔄 钳形包抄', hint: '【地图直点模式】点击任意敌城：自动调集多方向纵队钳形合围 + 侧翼牵制！' },
    scorched: { label: '💣 焦土炸桥', hint: '【地图直点模式】点击己方城镇（15 政治点）：撤退前炸毁铁路与工事，令敌军 15 天断补！' },
    sabotage: { label: '🔧 铁路破袭', hint: '【地图直点模式】点击敌占城镇（15 点）：派游击破袭队切断敌方铁路补给 10 天！' },
    airborne: { label: '⚡ 敌后奇袭', hint: '【地图直点模式】点击敌后城镇（25 指挥点）：空城直接夺占，有守军则重创组织度并断路！' },
    barrage: { label: '🎯 炮火准备', hint: '【地图直点模式】点击交战/敌占城镇（30 指挥点）：集中重炮轰击，削弱守军防御 5 天！' },
  };

  function setMapTool(tool) {
    pendingMapTool = pendingMapTool === tool ? null : tool;
    if (pendingMapTool) pendingOrder = undefined;
    document.querySelector('.map-workspace')?.classList.toggle('is-targeting', Boolean(pendingMapTool));
    setMapHelp();
    renderBattlePlansBar();
  }

  function applyMapTool(tool, city) {
    if (tool === 'scorched') {
      if (action('scorchedEarth', [city])) { WarAudio.artillery(); saveAuto(true); notify(cityName(city) + ' 已实施焦土炸桥（铁路瘫痪 15 天）！'); }
    } else if (tool === 'sabotage') {
      if (action('sabotageRail', [city])) { WarAudio.artillery(); saveAuto(true); notify(cityName(city) + ' 铁路破袭成功（敌军补给中断 10 天）！'); }
    } else if (tool === 'airborne') {
      if (action('airborneInfiltrate', [city])) { WarAudio.bugle(); saveAuto(true); notify('对 ' + cityName(city) + ' 的敌后奇袭行动已执行！'); }
    } else if (tool === 'barrage') {
      if (action('commandAbility', ['barrage', { city }])) { WarAudio.artillery(); saveAuto(true); notify('已对 ' + cityName(city) + ' 发动炮火准备！'); }
    } else if (tool === 'pincer') {
      if (state.owners[city] === state.player) { notify('钳形包抄请选择敌方城镇！'); return; }
      const pool = selectedUnits.size > 1
        ? [...selectedUnits].map((id) => state.units.find((u) => u.id === id)).filter((u) => permitted(u))
        : Engine.activeUnits(state).filter((u) => !u.parent && permitted(u));
      const targetObj = citiesById.get(city);
      const sorted = pool.slice().sort((a, b) => {
        const ca = citiesById.get(a.city), cb = citiesById.get(b.city);
        const da = ca && targetObj ? Math.hypot(ca.lon - targetObj.lon, ca.lat - targetObj.lat) : 99;
        const db = cb && targetObj ? Math.hypot(cb.lon - targetObj.lon, cb.lat - targetObj.lat) : 99;
        return da - db;
      });
      // Pick up to 4 units preferring distinct origin cities for true HOI4 pincer!
      const picked = [];
      const usedOrigins = new Set();
      for (const u of sorted) {
        if (picked.length >= 4) break;
        if (!usedOrigins.has(u.city) || picked.length < 2) {
          if (Engine.previewOrder(Data, state, u.id, 'advance', city)?.ok) {
            picked.push(u);
            usedOrigins.add(u.city);
          }
        }
      }
      if (!picked.length) { notify('周边暂无可直达 ' + cityName(city) + ' 的己方纵队。'); return; }
      const before = { state: Engine.snapshot(state), timeline: structuredClone(timeline) };
      let issued = 0;
      picked.forEach((u, idx) => {
        // Last flank unit pins with support-attack if >= 3 units, others advance to encircle!
        const cmd = picked.length >= 3 && idx === picked.length - 1 ? 'support' : 'advance';
        const res = Timeline.apply(timeline, Engine, Data, state, 'order', [u.id, cmd, city]);
        if (res?.ok !== false) issued += 1;
      });
      if (state.battles?.[city]) Timeline.apply(timeline, Engine, Data, state, 'setBattlePosture', [city, 'envelop']);
      if (issued) {
        undoStack.push(before);
        if (undoStack.length > undoLimit) undoStack.shift();
        selectedUnits = new Set(picked.map((u) => u.id));
        selectedUnit = picked[0].id;
        saveAuto(true);
        notify('🔄 钳形包抄就绪！已从 ' + usedOrigins.size + ' 个方向调动 ' + issued + ' 支纵队合围 ' + cityName(city) + '（按空格开始推演）！');
      }
    }
    pendingMapTool = null;
    document.querySelector('.map-workspace')?.classList.remove('is-targeting');
    setMapHelp();
    render();
  }

  function rebuildAppIndexes(nextData) {
    Data = nextData;
    scenariosById = new Map(Data.scenarios.map((scenario) => [scenario.id, scenario]));
    citiesById = new Map(Data.cities.map((city) => [city.id, city]));
    leadersById = new Map((Data.leaders || []).map((leader) => [leader.id, leader]));
    groupsById = new Map((Data.groups || []).map((group) => [group.id, group]));
    cityConnected.clear();
    for (const [a, b] of (Data.links || [])) {
      if (!cityConnected.has(a)) cityConnected.set(a, []);
      if (!cityConnected.has(b)) cityConnected.set(b, []);
      cityConnected.get(a).push(b);
      cityConnected.get(b).push(a);
    }
    if (Data.sideMeta) {
      sides.ccp = Data.sideMeta.ccp.name;
      sides.roc = Data.sideMeta.roc.name;
      short.ccp = Data.sideMeta.ccp.short;
      short.roc = Data.sideMeta.roc.short;
    } else {
      sides.ccp = '中国共产党'; sides.roc = '中国国民党';
      short.ccp = '共产党'; short.roc = '国民党';
    }
    for (const k of Object.keys(regions)) delete regions[k];
    Object.assign(regions, Data.regions ? { national: '全部战区', ...Data.regions } : baseRegions);
    const secSel = $('sector-select');
    if (secSel) secSel.innerHTML = Object.entries(regions).map((item) => option(...item)).join('');
    const legend = document.querySelector('.map-legend');
    if (legend) {
      legend.innerHTML = '<span><b class="dot ccp"></b>' + escape(short.ccp) + '</span>'
        + '<span><b class="dot roc"></b>' + escape(short.roc) + '</span>'
        + '<span><i></i>铁路</span><span><i class="attack-key"></i>进攻路线</span>'
        + '<span><i class="shell-key"></i>炮火</span><span><i class="supply-key"></i>补给缺口</span><span><i class="sea-key"></i>海运</span>';
    }
  }

  function launchUnifiedTheater(mode, scenarioId, playerSide = 'ccp', opts = {}) {
    const UT = globalThis.UnifiedTheaters;
    let nextData = BaseCivilData;
    if (mode === 'korea' && UT) nextData = UT.buildKoreanWarCivilData(globalThis.KoreanWarData, globalThis.CivilWarWorld) || BaseCivilData;
    else if (mode === 'ww2' && UT) nextData = UT.buildWW2CivilData(globalThis.WW2Data, globalThis.CivilWarWorld) || BaseCivilData;
    else if (mode === 'grand' && UT) nextData = UT.buildGrandWorldData(globalThis.WW2Data, globalThis.KoreanWarData, globalThis.CivilWarWorld) || BaseCivilData;
    currentTheaterMode = mode;
    rebuildAppIndexes(nextData);
    const sc = scenariosById.get(scenarioId) || Data.scenarios[0];
    const prepDays = Math.max(0, Math.floor(Number(opts.prepDays) || 0));
    const sandboxEndless = opts.sandboxEndless !== false;
    const created = Engine.createGame(Data, {
      scenarioId: sc.id, scope: 'national', side: playerSide, historyMode: 'dynamic', goal: 'mainland',
      prepDays, sandboxEndless,
    });
    if (sc.overrides) Object.assign(created.owners, sc.overrides);
    for (const u of created.units) {
      if (created.owners[u.city] !== u.side) {
        const home = Data.cities.find((c) => created.owners[c.id] === u.side && c.region === u.area)?.id
          || Data.cities.find((c) => created.owners[c.id] === u.side)?.id;
        if (home) u.city = home;
      }
    }
    const focusObj = citiesById.get(sc.focus) || Data.cities[0];
    const view = mode === 'korea'
      ? { lon: 127.0, lat: 37.8, zoom: 76 }
      : (mode === 'ww2' || mode === 'grand')
        ? { lon: focusObj?.lon ?? 14, lat: focusObj?.lat ?? 48, zoom: sc.ww2Theater === 'pacific' ? 16 : 26 }
        : { lon: 105, lat: 35, zoom: 12 };
    setRun(false);
    selectedUnits.clear();
    selectedUnit = null;
    selectedCity = sc.focus || Data.cities[0]?.id || null;
    pendingOrder = null;
    tutorial = undefined;
    recentBrief = null;
    map.setData(Data, view);
    setActive(created, Timeline.create(created, Engine), false);
    if (dialog.open) dialog.close();
    WarAudio.bugle();
    notify('⚔ 已进入【' + (Data.theaterTitle || '国共内战') + ' · ' + sc.title + '】' + (prepDays > 0 ? '（提前 ' + prepDays + ' 天入场筹备！）' : '') + (sandboxEndless ? ' · ♾️ 无尽自由沙盒' : ''));
  }

  function openUnifiedCampaignLobby(defaultEra = 'ww2', opts = {}) {
    const UT = globalThis.UnifiedTheaters;
    const kwData = UT?.buildKoreanWarCivilData(globalThis.KoreanWarData, globalThis.CivilWarWorld);
    const ww2Data = UT?.buildWW2CivilData(globalThis.WW2Data, globalThis.CivilWarWorld);
    const grandData = UT?.buildGrandWorldData(globalThis.WW2Data, globalThis.KoreanWarData, globalThis.CivilWarWorld);
    let era = defaultEra || 'ww2';
    let pickedSide = 'ccp';
    let pickedPrep = 0;
    let sandboxEndless = true;

    const renderEraHtml = () => {
      const ds = era === 'korea' ? kwData : era === 'ww2' ? ww2Data : era === 'grand' ? grandData : BaseCivilData;
      const sideA = ds?.sideMeta?.ccp?.name || '中国共产党';
      const sideB = ds?.sideMeta?.roc?.name || '中国国民党';
      const list = (ds?.scenarios || []).slice(0, 16);
      return '<div class="hoi-start-tabs" style="margin-bottom:8px;">'
        + '<button type="button" data-uni-era="ww2" aria-pressed="' + (era === 'ww2') + '">🌐 第二次世界大战 (1939–1945)</button>'
        + '<button type="button" data-uni-era="civil" aria-pressed="' + (era === 'civil') + '">🇨🇳 国共内战 / 解放战争 (1945–1950)</button>'
        + '<button type="button" data-uni-era="korea" aria-pressed="' + (era === 'korea') + '">🇰🇵 抗美援朝 · 朝鲜战争 (1950–1953)</button>'
        + '<button type="button" data-uni-era="grand" aria-pressed="' + (era === 'grand') + '">🌍 全球无尽大沙盒 (从0到100)</button>'
        + '</div>'
        + '<div class="hoi-cipher-box" style="margin-bottom:8px;"><header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="color:#f5e1b0;">🎖️ 1. 选择想玩的战区、阵营与入场时间（不再强制进入锦州战役）</strong>'
        + '<button type="button" id="lobby-tutorial-btn" class="link-button" style="font-size:11.5px;color:#ffd980;">⚑ 首次游玩？点此开启锦州新手引导</button></header>'
        + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;align-items:center;">'
        + '<button type="button" data-uni-side="ccp" aria-pressed="' + (pickedSide === 'ccp') + '" class="gold">★ ' + escape(sideA) + '</button>'
        + '<button type="button" data-uni-side="roc" aria-pressed="' + (pickedSide === 'roc') + '">✠ ' + escape(sideB) + '</button>'
        + '<label style="margin-left:auto;font-size:11.5px;color:#ffe699;display:inline-flex;align-items:center;gap:5px;cursor:pointer;">'
        + '<input type="checkbox" id="uni-endless-chk" ' + (sandboxEndless ? 'checked' : '') + '> ♾️ 无尽沙盒（统一后不结束，继续跨国征战）</label>'
        + '</div>'
        + '<div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;align-items:center;">'
        + '<span style="font-size:11.5px;color:#dfd4b4;">⏳ 提前多久进入该战役：</span>'
        + [[0, '当日直接开战'], [30, '提前 30 天'], [90, '提前 90 天 (3个月)'], [180, '提前 180 天 (半年)'], [365, '提前 365 天 (1年从零备战)']].map(([d, lbl]) =>
          '<button type="button" data-uni-prep="' + d + '" aria-pressed="' + (pickedPrep === d) + '" style="font-size:11px;padding:3px 7px;">' + lbl + '</button>').join('')
        + '</div></div>'
        + '<div class="hoi-doctrine-grid">'
        + list.map((sc) => '<article class="hoi-doctrine-card"><strong style="color:#ffe494;">' + escape(sc.title) + '</strong>'
          + '<p class="subtext" style="margin:3px 0;">📅 ' + escape(sc.date) + ' · ' + escape((sc.summary || '').slice(0, 62)) + '</p>'
          + '<button type="button" class="gold" data-uni-launch="' + escape(sc.id) + '" style="width:100%;font-size:11.5px;">⚔ 进入主战场开始指挥</button></article>').join('')
        + '</div>';
    };

    const titleText = opts.isStartup
      ? '⚔ 战图 · 开局战区选择（二战 / 国共内战 / 朝鲜战争 / 全球沙盒）'
      : '⚔ 战图 · 统一世界大沙盘开局大厅（HOI4 高自由度模式）';
    const body = showDialog(titleText, '<div id="uni-lobby-wrap">' + renderEraHtml() + '</div>');
    const bind = () => {
      const wrap = body.querySelector('#uni-lobby-wrap');
      if (!wrap) return;
      wrap.querySelectorAll('[data-uni-era]').forEach((b) => b.onclick = () => { era = b.dataset.uniEra; wrap.innerHTML = renderEraHtml(); bind(); });
      wrap.querySelectorAll('[data-uni-side]').forEach((b) => b.onclick = () => { pickedSide = b.dataset.uniSide; wrap.innerHTML = renderEraHtml(); bind(); });
      wrap.querySelectorAll('[data-uni-prep]').forEach((b) => b.onclick = () => { pickedPrep = Number(b.dataset.uniPrep); wrap.innerHTML = renderEraHtml(); bind(); });
      wrap.querySelector('#uni-endless-chk')?.addEventListener('change', (ev) => { sandboxEndless = Boolean(ev.target.checked); });
      wrap.querySelector('#lobby-tutorial-btn')?.addEventListener('click', () => startTutorial(true));
      wrap.querySelectorAll('[data-uni-launch]').forEach((b) => b.onclick = () => launchUnifiedTheater(era, b.dataset.uniLaunch, pickedSide, { prepDays: pickedPrep, sandboxEndless }));
    };
    bind();
  }

  function renderBattlePlansBar() {
    const bar = $('hoi-battle-plans');
    if (!bar || !state) return;
    const airLabel = state.player === 'ccp' ? '⚡ 武工奇袭' : '🪂 空降奇袭';
    // 已去除与底栏作战命令重复的【支援牵制/守港/后撤】，保持悬浮战略工具条精简无重复！
    bar.innerHTML =
      '<button type="button" class="hoi-bp-btn" data-bp-quick="drawfront" aria-pressed="' + civilDrawFront + '" title="HOI4 手绘进攻战线：点此按钮后在地图上按住左键拖向敌城，松手即刻吹号全线突击">' + (civilDrawFront ? '✏️ 正在画线(拖动)' : '✏️ 画进攻战线') + '</button>'
      + '<button type="button" class="hoi-bp-btn" data-map-tool="pincer" aria-pressed="' + (pendingMapTool === 'pincer') + '" title="HOI4 地图直接包抄：点此后再点地图上任意敌城，自动从多方向调兵钳形合围">🔄 钳形包抄</button>'
      + '<span class="hoi-bp-sep"></span>'
      + '<button type="button" class="hoi-bp-btn" data-map-tool="scorched" aria-pressed="' + (pendingMapTool === 'scorched') + '" title="HOI4 撤退焦土：点此后再点己方城镇（15 政治点），炸毁铁路与工事 15 天">💣 焦土</button>'
      + '<button type="button" class="hoi-bp-btn" data-map-tool="sabotage" aria-pressed="' + (pendingMapTool === 'sabotage') + '" title="地图直接铁路破袭：点此后再点敌占城镇（15 点），瘫痪敌军补给 10 天">🔧 破袭</button>'
      + '<button type="button" class="hoi-bp-btn" data-map-tool="airborne" aria-pressed="' + (pendingMapTool === 'airborne') + '" title="地图直接敌后奇袭（25 指挥点）：空城直接夺占，有守军则重创组织度并断路">' + airLabel + '</button>'
      + '<button type="button" class="hoi-bp-btn" data-map-tool="barrage" aria-pressed="' + (pendingMapTool === 'barrage') + '" title="地图直接炮火准备/喀秋莎齐射（30 指挥点）：重创目标守军">🎯 炮火/导弹</button>'
      + '<button type="button" class="hoi-bp-btn" data-bp-quick="camp" title="军队高自由度部署：指定距离（15/30/50/80km）与方向在城外构筑野战营地">⛺ 城外扎营</button>'
      + '<button type="button" class="hoi-bp-btn" data-bp-quick="artfire" title="炮兵按真实公里射程跨距开炮：查看射程内敌城公里数并实施压制/反炮兵轰击">🎯 按距开炮</button>'
      + '<button type="button" class="hoi-bp-btn" data-bp-quick="realwar" title="真实战争自由玩法：战场天气预报、伏击/夜战/强行军姿态、敌后游击起义、紧急空投合编与阵前劝降起义">🎖️ 实战指挥</button>'
      + '<button type="button" class="hoi-bp-btn" data-bp-quick="blitz" title="同步二战模式：装甲闪电总攻，选定/前线主力全线高速突击">⚡ 闪电战</button>'
      + '<button type="button" class="hoi-bp-btn" data-bp-quick="naval3" title="同步二战模式：发动 HOI4 三排海战阵型决战">🚢 三排海战</button>'
      + '<span class="hoi-bp-sep"></span>'
      + '<button type="button" class="hoi-bp-btn exec" data-bp-quick="exec" title="开始/暂停推演（空格键）">' + (running ? '⏸ 暂停' : '▶ 执行') + '</button>';
  }

  function selectCity(city, useOrder = false, jump = false) {
    if (!citiesById.has(city)) return;
    if (useOrder && pendingMapTool) {
      applyMapTool(pendingMapTool, city);
      return;
    }
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
    setInspectorOpen(true);
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
    $('map-help').textContent = pendingMapTool
      ? (mapToolInfo[pendingMapTool]?.hint || '点击目标城镇执行战术（ESC 取消）')
      : pendingOrder
        ? (pendingOrder === 'bombard' ? '战略轰炸 · 点击空军半径内敌城' : enemyCommands.has(pendingOrder)
          ? '战役命令 · 点击任一可达敌城，部队会沿陆路逐站推进；铁路可加快调动'
          : '命令目标 · 点击有己方陆路通道的城镇')
        : selectedUnits.size > 1 ? '已选 ' + selectedUnits.size + ' 支 · 右键进攻 · Ctrl+右键支援牵制 · 或点下方「🔄 钳形包抄」'
          : permitted(inspectUnit()) ? '右键敌城进攻 · Ctrl+右键支援牵制（不占格） · Shift+左键框选多军'
            : '点击部队牌或将领头像选中 · 右键敌城进攻 · Ctrl+右键牵制';
  }

  function issue(type, target) {
    const group = [...selectedUnits].filter((id) => permitted(state.units.find((unit) => unit.id === id)));
    const recipients = group.length > 1 ? group : [selectedUnit];
    let commandWarnings = 0;
    if (recipients.length > 1) {
      const before = { state: Engine.snapshot(state), timeline: structuredClone(timeline) };
      const failures = [];
      let issued = 0;
      for (const unitId of recipients) {
        const result = Timeline.apply(timeline, Engine, Data, state, 'order', [unitId, type, target]);
        if (result?.ok === false) failures.push(result.error);
        else issued += 1;
      }
      if (!issued) { notify(failures[0] || '所选部队没有可执行的命令。'); return; }
      undoStack.push(before);
      if (undoStack.length > undoLimit) undoStack.shift();
      lastActionResult = { ok: true, issued, failures };
      commandWarnings = failures.length;
    } else if (!action('order', [selectedUnit, type, target])) return;
    if (tutorial?.step === 1 && target === 'jinzhou' && ['advance', 'siege'].includes(type)) {
      tutorial.step = 2;
      tutorial.start = state.date;
    }
    if (['advance', 'siege', 'support', 'pin'].includes(type)) WarAudio.bugle();
    else WarAudio.click();
    pendingOrder = undefined;
    setMapHelp();
    saveAuto(true);
    render();
    const message = recipients.length > 1 ? '已向 ' + recipients.length + ' 支部队下达' + commands[type] + '命令。'
      : commands[type] + '命令已下达。';
    notify(commandWarnings ? message + '另有 ' + commandWarnings + ' 支无法执行。' : message);
  }

  function previewCity(city, _screen, draggedUnit) {
    const battle = state.battles?.[city];
    if (battle && !pendingOrder && !draggedUnit) {
      const score = battle.side === state.player ? (battle.bubbleScore ?? 55) : (100 - (battle.bubbleScore ?? 55));
      const m = battle.modifiers || {};
      const parts = [cityName(city) + ' 激战 · 胜率 ' + score + '%'];
      if (m.terrain) parts.push('地形 +' + m.terrain + '%');
      if (m.river) parts.push('跨河 ' + m.river + '%');
      if (m.fort) parts.push('工事 +' + m.fort + '%');
      if (m.encircled) parts.push('包饺子 ' + m.encircled + '%');
      return parts.join(' · ');
    }
    const unit = draggedUnit ? state.units.find((item) => item.id === draggedUnit) : inspectUnit();
    if (!permitted(unit)) return '';
    const type = pendingOrder || (state.owners[city] === state.player ? 'move' : 'advance');
    const preview = !draggedUnit || draggedUnit === selectedUnit ? orderPreviews[city]?.[type]
      : Engine.previewOrder(Data, state, unit.id, type, city);
    if (!preview) return '';
    return cityName(city) + ' · ' + commands[type] + ' · ' + (preview.ok
      ? (preview.days ? '约 ' + preview.days + ' 天' : '可在当前位置执行') : preview.error);
  }

  function quickOrder(target, unitId, mods = {}) {
    if (pendingMapTool) { setMapTool(null); notify('已取消地图战术瞄准。'); return; }
    if (unitId && unitId !== selectedUnit) selectUnit(unitId, false);
    const unit = inspectUnit();
    if (!permitted(unit)) { notify('先点击地图上的己方部队牌或底部将领头像。'); return; }
    const isEnemy = state.owners[target] !== state.player;
    const type = pendingOrder
      || (isEnemy && mods.ctrl ? 'support' : isEnemy && mods.alt ? 'siege' : isEnemy ? 'advance' : 'move');
    issue(type, target);
  }

  function chooseCommand(type) {
    const unit = inspectUnit();
    if (!permitted(unit)) { notify('先点击地图上的己方纵队/军标牌，或在部队名册中选择。'); return; }
    if (type === 'hold') { issue(type, unit.city); return; }
    if (type === 'rest' && state.owners[unit.city] === state.player) {
      issue('rest', unit.city);
      return;
    }
    if ((type === 'entrench' || type === 'defend') && pendingOrder === type && state.owners[unit.city] === state.player) {
      issue(type, unit.city);
      return;
    }
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
      ? '已选 ' + count + ' 支纵队：点战术命令再点城镇可协同行动'
      : pendingOrder ? '已选「' + commands[pendingOrder] + '」：点击目标城镇，或点「就地执行」'
        : unit && permitted(unit) ? '5000人/兵 · 5坦/标（估算）· 3机/标 · 1舰/标'
          : '直接点击地图上的任一纵队/军即可单独调遣（Ctrl 多选）';
    const commandButton = (type) => '<button type="button" data-command="' + type + '" data-deck-command="' + type
      + '" aria-pressed="' + (pendingOrder === type) + '">' + commands[type] + '</button>';
    const canHere = pendingOrder && ['defend', 'entrench', 'rest'].includes(pendingOrder)
      && unit && permitted(unit) && state.owners[unit.city] === state.player;
    $('command-bar').innerHTML = ['advance', 'support', 'siege', 'defend', 'entrench', 'intercept', 'move', 'rest', 'hold'].map(commandButton).join('')
      + '<button type="button" data-hoi-port title="钢4钓鱼执法：派兵专守己方沿海港口并挖战壕">⚓ 守港口</button>'
      + '<button type="button" data-hoi-fallback title="钢4后撤线：主动撤往黄河/山地城镇挖壕固守">↩️ 后撤线</button>'
      + '<button type="button" data-command="bombard" data-deck-command="bombard" aria-pressed="'
      + (pendingOrder === 'bombard') + '"' + (unit && permitted(unit) && (state.airWar?.[state.player]?.planes ?? 0) >= 10
        ? '' : ' disabled') + '>轰炸</button>'
      + (canHere ? '<button type="button" class="gold" data-deck-here>就地' + commands[pendingOrder] + '</button>' : '')
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
    setInspectorOpen(false);
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
    const skipButton = $('tutorial-skip');
    if (skipButton) skipButton.hidden = true;
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
    const startDate = checkpoint?.date || scenario.date;
    let pickedSide = state.player || 'ccp';
    const previewState = Engine.createGame(Data, { scenarioId: scenario.id, date: startDate, side: pickedSide });
    const previewStats = Engine.stats(Data, previewState);
    const factionProfiles = {
      ccp: {
        leader: '毛泽东 · 朱德',
        portrait: globalThis.CivilWarPortraits?.mao || globalThis.CivilWarPortraits?.linbiao || '',
        flag: 'linear-gradient(135deg,#9f1c1c 0%,#c73030 65%,#e4b84b 100%)',
        emblem: '★',
        doctrine: '灵活机动运动战 · 人民战争',
        spirits: [
          ['🌾', '土地改革支前', '解放区兵员动员加快，军心士气恢复 +18%'],
          ['⭐', '三大纪律八项注意', '占领区顺从度稳步提升，后方补给畅通'],
          ['⚔️', '集中优势兵力', '多方向包围歼灭时火力与缴获大幅提升'],
        ],
        brief: '依托东北、华北与华东解放区巩固后方，通过土改与诉苦运动壮大主力纵队，灵活截断铁路干线、实施“包饺子”歼灭战，从战略防御转向全面大反攻。',
      },
      roc: {
        leader: '蒋介石 · 陈诚',
        portrait: globalThis.CivilWarPortraits?.chiang || globalThis.CivilWarPortraits?.duyuming || '',
        flag: 'linear-gradient(135deg,#183a7a 0%,#2656a8 55%,#b82929 55%,#c73535 100%)',
        emblem: '☀',
        doctrine: '重点进攻 · 铁路据点固守',
        spirits: [
          ['🛡️', '美械整编主力', '重炮与机械化火力强劲，初期拥有制空与海运优势'],
          ['⚠️', '陆军派系与腐败', '中央军与地方派系协同受阻（需耗陆军经验逐步改革）'],
          ['💸', '后方法币通胀', '战时财政承压，需稳控金融与铁路动脉'],
        ],
        brief: '凭借初期兵力、空军、海军海运与美械整编师优势，控制全国主要大城市与铁路干线。须协调东北、华北、华中与西北各路集团，避免主力被孤立合围。',
      },
    };
    const renderDossier = (side) => {
      const p = factionProfiles[side];
      const cities = previewStats[side];
      const troops = previewStats[side + 'Strength'];
      const rifles = Math.round(previewState.stock?.[side]?.infantry ?? 0);
      return '<div class="hoi-parchment-3col">'
        + '<section class="hoi-parchment"><h4>阵营档案 · ' + escape(sides[side]) + '</h4>'
        + '<p><b>最高统帅：</b>' + escape(p.leader) + '</p>'
        + '<p><b>控制城镇：</b>' + format(cities) + ' 座</p>'
        + '<p><b>开局兵力：</b>约 ' + format(troops) + ' 人</p>'
        + '<p><b>步枪储备：</b>' + format(rifles) + ' 批</p>'
        + '<p><b>军事学说：</b>' + escape(p.doctrine) + '</p></section>'
        + '<section class="hoi-parchment"><h4>民族精神徽章（悬停查看）</h4><div class="hoi-emblem-grid">'
        + p.spirits.map(([ico, name, tip]) => '<div class="hoi-emblem" title="' + escape(name + '：' + tip)
          + '"><b>' + ico + '</b><span>' + escape(name) + '</span></div>').join('')
        + '</div></section>'
        + '<section class="hoi-parchment"><h4>' + escape(scenario.title) + ' · 战役简史</h4>'
        + '<p>' + escape(checkpoint?.summary || scenario.summary) + '</p>'
        + '<p style="margin-top:6px;">' + escape(p.brief) + '</p></section></div>';
    };
    const tabsHtml = '<div class="hoi-start-tabs">' + Data.scenarios.map((item) =>
      '<button type="button" data-hoi-scenario="' + escape(item.id) + '" aria-pressed="' + (item.id === scenario.id) + '">'
      + escape(item.title) + ' · ' + escape(item.date.slice(0, 7)) + '</button>').join('') + '</div>';
    const factionCardsHtml = '<div class="hoi-faction-row">' + ['ccp', 'roc'].map((side) => {
      const p = factionProfiles[side];
      const img = p.portrait ? '<img class="hoi-faction-portrait" src="' + p.portrait + '" alt="' + escape(p.leader) + '">'
        : '<div class="hoi-faction-portrait" style="display:grid;place-items:center;font-size:28px;color:#e6cf9b;">' + p.emblem + '</div>';
      return '<button type="button" class="hoi-faction-card' + (side === pickedSide ? ' is-active' : '') + '" data-hoi-side="' + side + '">'
        + '<div class="hoi-faction-flag" style="background:' + p.flag + '">' + p.emblem + '</div>'
        + img + '<strong>' + escape(sides[side]) + '</strong><small>' + escape(p.leader) + '</small></button>';
    }).join('') + '</div>';
    const initScope = (['full', 'war1946'].includes(scenario.id) || scenario.defaultScope === 'national') ? 'national' : 'theater';
    const initDiff = state.difficulty || 'normal';
    const initGoal = scenario.defaultGoal || state.goal;
    const body = showDialog('选择剧本与统帅阵营 · ' + scenario.title,
      tabsHtml + factionCardsHtml + '<div id="hoi-dossier-slot">' + renderDossier(pickedSide) + '</div>'
      + '<form id="start-form" style="margin-top:8px;">'
      + '<div class="hoi-start-switches">'
      + '<div class="hoi-seg-group"><span>指挥范围</span><div class="hoi-seg-pills">'
      + '<button type="button" data-seg-field="scope" data-seg-val="theater" aria-pressed="' + (initScope === 'theater') + '">战区指挥</button>'
      + '<button type="button" data-seg-field="scope" data-seg-val="national" aria-pressed="' + (initScope === 'national') + '">全国总览</button>'
      + '</div></div>'
      + '<div class="hoi-seg-group"><span>游戏难度</span><div class="hoi-seg-pills">'
      + '<button type="button" data-seg-field="difficulty" data-seg-val="normal" aria-pressed="' + (initDiff === 'normal') + '">普通</button>'
      + '<button type="button" data-seg-field="difficulty" data-seg-val="hard" aria-pressed="' + (initDiff === 'hard') + '">困难 +15%</button>'
      + '<button type="button" data-seg-field="difficulty" data-seg-val="devil" aria-pressed="' + (initDiff === 'devil') + '">魔鬼 +35%</button>'
      + '</div></div>'
      + '<div class="hoi-seg-group"><span>推演模式</span><div class="hoi-seg-pills">'
      + '<button type="button" data-seg-field="historyMode" data-seg-val="historical" aria-pressed="' + (state.historyMode === 'historical') + '">历史进程</button>'
      + '<button type="button" data-seg-field="historyMode" data-seg-val="dynamic" aria-pressed="' + (state.historyMode === 'dynamic') + '">动态推演</button>'
      + '</div></div>'
      + '<div class="hoi-seg-group"><span>战略目标</span><div class="hoi-seg-pills">'
      + '<button type="button" data-seg-field="goal" data-seg-val="mainland" aria-pressed="' + (initGoal === 'mainland') + '">统一大陆</button>'
      + '<button type="button" data-seg-field="goal" data-seg-val="all" aria-pressed="' + (initGoal === 'all') + '">大陆及台湾</button>'
      + '</div></div>'
      + '<div class="hoi-seg-group"><span>开局日期</span><input required type="date" name="date" min="1945-08-15" max="1951-12-31" value="' + startDate + '"></div>'
      + '</div>'
      + '<div class="hoi-hidden-form">'
      + '<select name="scenario">' + Data.scenarios.map((item) => option(item.id, item.title, scenario.id)).join('') + '</select>'
      + '<select name="side">' + Object.entries(sides).map((item) => option(...item, pickedSide)).join('') + '</select>'
      + '<select name="scope">' + option('theater', '当前战区', initScope) + option('national', '全国', initScope) + '</select>'
      + '<select name="difficulty">' + option('normal', '普通', initDiff) + option('hard', '困难', initDiff) + option('devil', '魔鬼', initDiff) + '</select>'
      + '<select name="historyMode">' + option('historical', '历史事件优先', state.historyMode) + option('dynamic', '随局势推演', state.historyMode) + '</select>'
      + '<select name="goal">' + option('mainland', '统一大陆', initGoal) + option('all', '统一大陆及台湾', initGoal) + '</select>'
      + '</div>'
      + '<div class="dialog-actions" style="margin-top:10px;"><button class="gold" type="submit" style="min-width:170px;font-size:15px;padding:10px 24px;letter-spacing:.08em;">⚔ 开始指挥</button>'
      + '<button type="button" id="back-scenarios">全部战役列表</button></div></form>');
    const form = body.querySelector('form');
    const syncSide = (side) => {
      pickedSide = side;
      form.elements.side.value = side;
      body.querySelectorAll('[data-hoi-side]').forEach((el) => el.classList.toggle('is-active', el.dataset.hoiSide === side));
      const slot = body.querySelector('#hoi-dossier-slot');
      if (slot) slot.innerHTML = renderDossier(side);
    };
    body.querySelectorAll('[data-seg-field]').forEach((btn) => {
      btn.onclick = () => {
        const field = btn.dataset.segField, val = btn.dataset.segVal;
        if (form.elements[field]) form.elements[field].value = val;
        body.querySelectorAll('[data-seg-field="' + field + '"]').forEach((el) =>
          el.setAttribute('aria-pressed', String(el.dataset.segVal === val)));
      };
    });
    body.querySelectorAll('[data-hoi-side]').forEach((btn) => { btn.onclick = () => syncSide(btn.dataset.hoiSide); });
    body.querySelectorAll('[data-hoi-scenario]').forEach((btn) => { btn.onclick = () => chooseScenario(btn.dataset.hoiScenario); });
    form.elements.side.addEventListener('change', () => syncSide(form.elements.side.value));
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

  function openEventClipboard(eventId) {
    const catalog = meta.interactiveEventsCatalog || [];
    const ev = catalog.find((item) => item.id === eventId) || catalog[0];
    if (!ev) return;
    const alreadyResolved = (state.resolvedChoiceEvents || []).includes(ev.id);
    const html = '<div class="hoi-clipboard-wrap"><div class="hoi-clip-metal" aria-hidden="true"></div>'
      + '<article class="hoi-clipboard">'
      + '<h3>' + escape(ev.title) + '</h3>'
      + '<p class="hoi-clip-body">' + escape(ev.body) + '</p>'
      + '<div class="hoi-clip-footer">'
      + '<div class="hoi-clip-photo"><div class="hoi-clip-photo-art">📜 战地电报档案<br><small>' + escape(ev.date) + '</small></div>'
      + '<span>' + escape(ev.photoCaption || '前线统帅部急电') + '</span></div>'
      + '<div class="hoi-clip-choices">'
      + ev.choices.map((ch, idx) => '<button type="button" class="hoi-clip-btn" data-event-id="' + escape(ev.id)
        + '" data-event-choice="' + idx + '" title="' + escape(ch.effectText || '') + '"' + (alreadyResolved ? ' disabled' : '') + '>'
        + '<span>' + escape(ch.label) + '</span>'
        + '<small>' + escape(alreadyResolved ? '已颁布' : (ch.effectText || '')) + '</small></button>').join('')
      + (alreadyResolved ? '<p class="subtext" style="color:#4a3c28;margin:4px 0 0;">（该历史抉择已在本局颁布，不可重复领取加成）</p>' : '')
      + '</div></div></article></div>';
    showDialog('战地密电与战略抉择', html);
  }

  function openBattleModal(cityId) {
    const battle = state.battles?.[cityId];
    if (!battle) { selectCity(cityId, false, true); return; }
    const city = citiesById.get(cityId);
    const isAttacker = battle.side === state.player;
    const parents = new Set(state.units.map((u) => u.parent).filter(Boolean));
    const fieldUnits = state.units.filter((u) => !parents.has(u.id) && u.strength > 0);
    const attackers = fieldUnits.filter((u) => u.side === battle.side && u.order?.target === cityId
      && ['advance', 'siege'].includes(u.order.type));
    const defenders = fieldUnits.filter((u) => u.side === battle.defendingSide && u.city === cityId);
    const engagedIds = new Set(battle.engagedUnitIds || []);
    const reserveIds = new Set(battle.reserveUnitIds || []);
    const ratio = Number(battle.lastRatio) || 1;
    const rawBubble = Number.isFinite(battle.bubbleScore) ? battle.bubbleScore : Math.round(ratio / (1 + ratio) * 100);
    const bubble = Math.max(1, Math.min(99, isAttacker ? rawBubble : 100 - rawBubble));
    const leadOf = (list) => {
      const u = list.find((item) => item.leader && leadersById.get(item.leader)) || list[0];
      const l = u?.leader ? leadersById.get(u.leader) : null;
      return {
        name: l?.name || (u ? u.name : '前线指挥官'),
        img: l && globalThis.CivilWarPortraits?.[l.id],
        traits: (l?.traits || []).slice(0, 2).join(' · ') || '野战指挥',
      };
    };
    const atkLead = leadOf(attackers);
    const defLead = leadOf(defenders);
    const divRow = (u) => {
      const org = Math.round(valueOf(u, 'org', 100));
      const hp = Math.round(Math.min(100, (u.strength / Math.max(1, u.maxStrength || u.strength)) * 100));
      return '<div class="hoi-div-bar-row"><div class="hoi-dual-bars" title="绿条：组织度 ' + org + '% · 橙条：兵力 ' + hp + '%">'
        + '<span class="org"><i style="width:' + org + '%"></i></span>'
        + '<span class="hp"><i style="width:' + hp + '%"></i></span></div>'
        + '<strong>' + escape(u.name) + '</strong>'
        + '<small>' + format(u.strength) + '人 · 组' + org + '%</small></div>';
    };
    const renderSide = (title, lead, list, side) => {
      const total = list.reduce((s, u) => s + u.strength, 0);
      const engaged = list.filter((u) => !reserveIds.has(u.id) || engagedIds.has(u.id));
      const reserves = list.filter((u) => reserveIds.has(u.id) && !engagedIds.has(u.id));
      const avatar = lead.img ? '<img src="' + lead.img + '" alt="' + escape(lead.name) + '">'
        : '<span class="gen-monogram">' + escape(lead.name.slice(0, 1)) + '</span>';
      return '<section class="hoi-battle-side ' + side + '"><header class="hoi-battle-gen">' + avatar
        + '<div><strong>' + escape(title + ' · ' + lead.name) + '</strong><small>'
        + escape(lead.traits) + ' · 总兵力 ' + format(total) + ' 人</small></div></header>'
        + '<div class="hoi-battle-list">' + (engaged.length ? engaged.map(divRow).join('') : '<p class="empty">暂无投入部队</p>') + '</div>'
        + (reserves.length ? '<div class="hoi-battle-reserves"><b>预备队列（' + reserves.length + ' 支）：</b>'
          + reserves.map((u) => escape(u.name)).join('、') + '</div>' : '')
        + '</section>';
    };
    const terrainNames = { plain: '平原', hill: '丘陵', mountain: '山地', port: '港口', city: '城市', river: '河网', highland: '高原', plateau: '高原', marsh: '沼泽' };
    const mods = battle.modifiers || {};
    const modLine = [
      city?.terrain ? '地形：' + (terrainNames[city.terrain] || city.terrain) : null,
      battle.weather ? '天气：' + battle.weather : null,
      '进攻方向：' + (battle.attackDirections || 1),
      mods.fort ? '工事 +' + mods.fort + '%' : null,
      mods.river ? '跨河 ' + mods.river + '%' : null,
      mods.encircled ? '包饺子断补 ' + mods.encircled + '%' : null,
    ].filter(Boolean).join(' · ');
    const armorBadge = battle.armorStatus === 'atk-shield'
      ? '<span class="hoi-shield-badge gold" title="攻方装甲高于守方穿甲：受伤 -45%，对敌组织度伤害 +35%">🛡️ 攻方装甲金盾</span>'
      : battle.armorStatus === 'def-shield'
        ? '<span class="hoi-shield-badge gold" title="守方装甲高于攻方穿甲：受伤 -45%，反击组织度伤害 +35%">🛡️ 守方装甲金盾</span>'
        : battle.armorStatus === 'pierced'
          ? '<span class="hoi-shield-badge pierced" title="双方装甲均已被反坦克火力击穿">💥 装甲已击穿</span>' : '';
    const tacticStrip = battle.atkTactic ? '<div class="hoi-tactic-strip">'
      + '<span>攻方战术卡：<b>' + escape(battle.atkTactic) + '</b></span>'
      + '<b class="' + (battle.tacticCounter === 'atk' ? 'win' : battle.tacticCounter === 'def' ? 'lose' : '') + '">'
      + (battle.tacticCounter === 'atk' ? '⚔ 攻方克制 (+12%)' : battle.tacticCounter === 'def' ? '🛡️ 守方反制 (+12%)' : '⚖ 势均力敌') + '</b>'
      + '<span>守方战术卡：<b>' + escape(battle.defTactic) + '</b></span></div>' : '';
    const lowOrgDef = !isAttacker && defenders.find((u) => valueOf(u, 'org', 100) < 45);
    const html = '<div class="hoi-battle-banner"><div><h3>⚔ ' + escape(cityName(cityId)) + ' 争夺战 · 第 ' + format(battle.days) + ' 天' + armorBadge + '</h3>'
      + '<small>' + escape(modLine) + '</small></div>'
      + '<span class="hoi-bubble-pill ' + (bubble >= 50 ? 'win' : 'lose') + '" style="font-size:18px;padding:4px 12px;">' + bubble + '</span></div>'
      + tacticStrip
      + '<div class="hoi-battle-sides">'
      + renderSide('攻方 · ' + short[battle.side], atkLead, attackers, battle.side)
      + renderSide('守方 · ' + short[battle.defendingSide], defLead, defenders, battle.defendingSide)
      + '</div>'
      + '<div class="dialog-actions">'
      + (lowOrgDef ? '<button type="button" class="gold" data-modal-cycle="' + escape(cityId) + '">🔄 车轮战换防（撤出低组织度部队）</button>' : '')
      + '<button type="button" data-locate-city="' + escape(cityId) + '">定位到战场</button>'
      + '<button type="button" data-politics-close>关闭战况窗口</button></div>';
    showDialog('陆战态势 · ' + cityName(cityId), html);
  }

  function historicalEvents() {
    const future = (Data.events || []).filter((event) => event.date >= state.date);
    const clips = (meta.interactiveEventsCatalog || []).filter((e) => e.side === 'both' || e.side === state.player);
    const clipHtml = clips.length ? '<div class="card"><h3>战地抉择电报（HOI4 夹纸板）</h3><p class="subtext">以下历史节点将在对应日期自动弹出暂停，也可在此随时调阅并下达方略：</p><div class="dialog-actions" style="flex-wrap:wrap;justify-content:flex-start;">'
      + clips.map((e) => '<button type="button" data-open-event-clip="' + escape(e.id) + '">📋 ' + escape(e.title) + '</button>').join('')
      + '</div></div>' : '';
    const body = showDialog('历史事件', '<div class="dialog-actions"><button type="button" data-history-setting="historical" aria-pressed="'
      + (state.historyMode === 'historical') + '">按历史节点</button><button type="button" data-history-setting="dynamic" aria-pressed="'
      + (state.historyMode === 'dynamic') + '">随战局推演</button></div>'
      + clipHtml
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
    const body = showDialog('兵种与军械 · 3D 兵模图鉴', choices.length ? '<p>选定纵队、师或团后换装。费用从本阵营的军械和财政中扣除。</p>'
      + '<div style="display:flex;align-items:center;gap:12px;margin:6px 0 8px;padding:8px;border-radius:6px;border:1px solid #4e5e52;background:#1c2620;">'
      + '<canvas id="gear-3d-preview" width="140" height="140" style="width:92px;height:92px;border-radius:6px;background:#151d19;border:1px solid #59695a;flex-shrink:0;"></canvas>'
      + '<div style="font-size:12px;color:var(--dim);line-height:1.5;"><strong style="color:#f5e1b0;display:block;margin-bottom:3px;">高清 3D 兵模实时预览</strong>地图拉远时自动切为清爽 2D 部队牌，在此可随时检视当前部队的步兵、重炮与坦克三维建模细节。</div></div>'
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
      const gearCanvas = $('gear-3d-preview');
      if (gearCanvas && preview3DRenderer) {
        const gctx = gearCanvas.getContext('2d');
        const kind = profile === 'artillery' ? 'artillery' : profile === 'mobile' ? 'tank' : 'human';
        const drawSpin = (t) => {
          if (!document.body.contains(gearCanvas) || !dialog.open) return;
          gctx.clearRect(0, 0, gearCanvas.width, gearCanvas.height);
          gctx.drawImage(preview3DRenderer.frame(unit.side, true, t, kind, kind === 'human' ? 'march' : 'march', unit.group || ''), 0, 0, gearCanvas.width, gearCanvas.height);
          requestAnimationFrame(drawSpin);
        };
        requestAnimationFrame(drawSpin);
      }
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
      + '<div class="card"><h3>下命令</h3><p>选中部队后，可以右键任一可达敌城或拖动部队牌到目标；远程进攻会沿己方陆路逐站推进，铁路路段更快。'
      + '也可以先选底部命令再点目标。围城直接打目标；围点打援则先行军到目标外围。</p></div>'
      + '<div class="card"><h3>作战计划</h3><p>Ctrl 多选部队后点底部的「编成计划」，先选<strong>作战决心</strong>：'
      + '突击目标、守备战线、沿战线进攻或后撤至战线，并指定目标与战线。'
      + '统一预览后一键执行，执行中可暂停、撤销或交给司令员。</p></div>'
      + '<div class="card"><h3>组织度与战役</h3><p>部队牌底部的小条是组织度。进攻与防守按日消耗组织度，'
      + '组织度先耗尽的一方退出战斗：守军通常撤退而不是被全歼，只有在没有退路时才会成建制被俘。'
      + '被击退的进攻部队会原地整补并结束当前命令；准备好后可重新下令。驻防和补给充足的部队每天恢复组织度。</p></div>'
      + '<div class="card"><h3>政治与决议</h3><p>顶部「政治决议」用政治点执行策反、整军、空运补给与动员。'
      + '战争支持度会随城镇得失升降，支持度崩溃又丢掉首都时，这一方可能停战。</p></div>'
      + '<div class="card"><h3>国防与建设</h3><p>顶部「国防建设」有国策、科研、生产、编制、空军、海军、指挥与情报八个页签：'
      + '国策按天推进；科研解锁装备型号与装甲营；生产把工厂分到装备线与运输船，城镇详情可建设军工厂和民用工厂；'
      + '编制设计营级模板并指派给部队；空军切换制空/近距支援/遮断/空投；'
      + '海军决定渡海运力；指挥点可下强行军、死守与炮火准备；情报页处理抵抗、法令与外交。</p></div>'
      + '<div class="card"><h3>后勤补给</h3><p>顶部「后勤补给」查看后方库存、铁路与车队运输瓶颈、各城镇补给覆盖，'
      + '并在地图上标出缺口。弹药、油料、医疗物资分别计算，补给越差，部队战斗力与整补越慢。</p></div>'
      + '<div class="card"><h3>工事与编制</h3><p>城镇面板的「修筑工事」由驻军工兵施工，可修战壕、掩体、障碍、'
      + '碉堡、固定炮位与补给站。部队面板的「调整编制」可分配装甲、炮兵、工兵、医护和运输支援。</p></div>'
      + '<div class="card"><h3>看战局</h3><p>空格暂停或继续。滚轮缩放，拖动空白处平移。通过工具栏选择战区和地图图层。'
      + '战报会列出伤亡、伤员、俘虏和缴获，左侧的「变化」会显示两方从开局至今的城镇归属变化。</p></div></div>');
  }

  function startTutorial(required = false) {
    $('dialog-close').disabled = required;
    showDialog('锦州第一局 · 新手必修', '<p>先学习选部队、进攻和查看战报。教程完成后，可从左侧选择1946年全面内战或其他剧本。当前版本不保存进度，刷新后需要重新学习。</p>'
      + '<button type="button" id="tutorial-start" class="gold">开始锦州引导</button>');
    const skipButton = $('tutorial-skip');
    skipButton.hidden = !required;
    skipButton.onclick = () => {
      $('dialog-close').disabled = false;
      skipButton.hidden = true;
      tutorial = undefined;
      if (dialog.open) dialog.close();
      render();
      notify('已跳过新手教程。可从左侧「战役剧本」选择想玩的剧本，需要时点顶部「⚑ 锦州引导」随时重开。');
    };
    $('tutorial-start').onclick = () => {
      if (state.date > timeline.origin.date || timeline.commands.length) saveSlot();
      $('dialog-close').disabled = false;
      skipButton.hidden = true;
      const fresh = Engine.createGame(Data, { scenarioId: 'jinzhou', side: 'ccp',
        scope: 'theater', historyMode: 'dynamic', goal: 'mainland' });
      setActive(fresh, Timeline.create(fresh, Engine));
      tutorial = { step: 0, required };
      render();
    };
  }

  function renderTutorial() {
    const card = $('tutorial-card');
    card.hidden = !tutorial;
    if (!tutorial) { card.replaceChildren(); return; }
    const [title, guidance, button] = tutorialSteps[tutorial.step];
    card.innerHTML = '<header><span class="tutorial-step">锦州第一局 · ' + (tutorial.step + 1) + ' / '
      + tutorialSteps.length + '</span>' + (tutorial.required ? '' : '<button type="button" class="link-button" data-tutorial-skip>跳过</button>') + '</header>'
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
      + '<tr><td>枪炮库存增加</td><td colspan="2">步兵装备 ' + format(record.captured.infantry ?? 0)
      + ' · 火炮 ' + format(record.captured.artillery ?? 0) + ' · 装甲 ' + format(record.captured.armor ?? 0) + '</td></tr>'
      + '<tr><td>缴获油料 / 医疗</td><td>' + format(record.captured.fuel) + ' / '
      + format(record.captured.medical) + '</td><td>—</td></tr>'
      + '<tr><td>士气变化</td><td>' + (record.moraleAttack >= 0 ? '+' : '') + record.moraleAttack
      + '</td><td>' + (record.moraleDefend >= 0 ? '+' : '') + record.moraleDefend + '</td></tr>'
      + '<tr><td>民心 / 战争支持</td><td>' + ((record.supportAttack ?? 0) >= 0 ? '+' : '') + (record.supportAttack ?? 0).toFixed(2)
      + '</td><td>' + ((record.supportDefend ?? 0) >= 0 ? '+' : '') + (record.supportDefend ?? 0).toFixed(2) + '</td></tr>'
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
    showDialog('全国野战军与地方军阀派系', '<p>各地方军阀均着国军制式军服并佩戴地域特色装具，列明司令官、总兵力及各军下辖师旅建制。</p>'
      + '<div class="detail-grid">' + [...groupsById.values()].map((group) => {
        const corps = Engine.activeUnits(state).filter((unit) => !unit.parent && unit.group === group.id);
        const count = corps.length;
        const totalMen = corps.reduce((sum, u) => sum + u.strength, 0);
        const totalDivs = corps.reduce((sum, u) => sum + state.units.filter((c) => c.parent === u.id && c.strength > 0).length, 0);
        const commanders = [...new Set(corps.map((u) => leadersById.get(u.leader)?.name).filter(Boolean))].slice(0, 4).join('、');
        return '<article class="card"><h3>' + escape(group.name) + '</h3><p>' + escape(group.summary) + '</p><p>'
          + escape(regions[group.region] || '') + ' · 在役 <strong>' + count + '</strong> 个纵队/军（共 ' + totalDivs + ' 个师/旅 · '
          + format(totalMen) + ' 人）' + (commanders ? '<br><small>主要将领：' + escape(commanders) + '</small>' : '')
          + '</p>' + (corps.length ? '<p class="subtext">' + escape(corps.slice(0, 5).map((u) => u.name + ' ' + format(u.strength) + '人').join(' · ')) + '</p>' : '')
          + '<div class="dialog-actions">'
          + (count ? '<button type="button" data-group-roster="' + escape(group.id) + '">查看各军编制</button>' : '')
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
    if (typeof Engine.supplyReading !== 'function') { showDialog('后勤补给', '<p>当前版本不支持补给网络。</p>'); return; }
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
    const eqStock = state.stock?.[side] || {};
    const prodLines = state.production?.[side]?.lines || {};
    const eqList = [
      { ico: '🔫', name: '步兵步枪', cur: Math.round(eqStock.infantry ?? 0), need: 220, daily: Math.round((prodLines.infantry || 30) * 0.45) },
      { ico: '💣', name: '牵引火炮', cur: Math.round(eqStock.artillery ?? 0), need: 60, daily: Math.round((prodLines.artillery || 15) * 0.22) },
      { ico: '🚜', name: '装甲坦克', cur: Math.round(eqStock.armor ?? 0), need: 20, daily: Math.round((prodLines.armor || 5) * 0.12) },
      { ico: '✈️', name: '作战飞机', cur: Math.round(state.airWar?.[side]?.planes ?? eqStock.air ?? 0), need: 30, daily: Math.round((prodLines.air || 5) * 0.1) },
      { ico: '🚢', name: '运输船队', cur: Math.round(state.navy?.[side]?.transports ?? 0), need: 15, daily: Math.round((prodLines.naval || 5) * 0.08) },
      { ico: '⚓', name: '海军军舰', cur: Math.round(state.navy?.[side]?.warships ?? 0), need: 8, daily: Math.round((prodLines.naval || 5) * 0.04) },
    ];
    const eqHtml = '<h3 style="margin:6px 0 6px;">军械与装备库存（包饺子缴获实时入库）</h3><div class="hoi-logi-list">'
      + eqList.map((item) => {
        const diff = item.cur - item.need;
        const pct = Math.max(8, Math.min(100, Math.round((item.cur / Math.max(1, item.need * 2)) * 100)));
        const cls = diff >= 0 ? 'surplus' : 'deficit';
        return '<div class="hoi-logi-row"><span class="hoi-logi-name">' + item.ico + ' ' + escape(item.name) + '</span>'
          + '<div class="hoi-logi-bar"><i class="' + cls + '" style="width:' + pct + '%"></i></div>'
          + '<span class="hoi-logi-badge ' + cls + '">' + format(item.cur) + ' (' + (diff >= 0 ? '+' : '') + format(diff) + ')</span>'
          + '<small style="color:var(--dim);">日产 +' + item.daily + '</small></div>';
      }).join('') + '</div>';
    const motorCur = state.motorization?.[side] || 'horse';
    const motorCatalog = meta.motorizationLevels || {
      horse: { name: '🐴 马车运粮', desc: '零油料消耗，常规补给半径' },
      truck: { name: '🚚 单卡车机动', desc: '补给覆盖 +12%' },
      heavy: { name: '🚛 双卡车重装', desc: '补给覆盖 +24%' },
    };
    const motorHtml = '<h3 style="margin:6px 0 4px;">HOI4 补给枢纽机动化级别</h3><div class="hoi-motor-bar">'
      + Object.entries(motorCatalog).map(([id, m]) => '<button type="button" data-motor-level="' + id
        + '" aria-pressed="' + (motorCur === id) + '" title="' + escape(m.desc) + '">' + escape(m.name) + '</button>').join('')
      + '</div>';
    showDialog('后勤补给与装备库存', motorHtml + eqHtml
      + '<p>库存通过铁路干线和公路车队送到前线补给站，再分发给部队；不在铁路线上的驻军仍可沿陆路获得补给。'
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
      + '<div><h3>运输瓶颈</h3><table class="dialog-table"><thead><tr><th>运输段</th><th>运量</th><th>容量</th>'
      + '<th>紧张度</th></tr></thead><tbody>' + bottleneckRows + '</tbody></table></div></div>'
      + '<p class="roster-label">补给覆盖</p><table class="dialog-table"><thead><tr><th>驻军城镇</th><th>兵力</th>'
      + '<th>通路</th><th>弹药</th><th>覆盖</th></tr></thead><tbody>' + (coverageRows || '<tr><td colspan="5">暂无驻军。</td></tr>')
      + '</tbody></table><div class="dialog-actions"><button type="button" data-supply-overlay>在地图显示补给</button>'
      + '<button type="button" data-supply-close>关闭</button></div>');
  }

  function evaluateDefectTier(unit) {
    const player = state.player;
    const politics = state.political?.[player] ?? { points: 0, cooldowns: {} };
    const cooldown = politics.cooldowns?.defect ?? 0;
    const nearby = cityConnected.get(unit.city) || [];
    const contact = nearby.some((id) => state.owners[id] === player) || state.battles?.[unit.city]?.side === player;
    const surrounded = nearby.length > 0 && nearby.every((id) => state.owners[id] !== unit.side);
    const groupName = groupsById.get(unit.group)?.name || '';
    const isBeipingStyle = surrounded && (
      state.capitals?.[unit.side] === unit.city
      || (unit.name || '').includes('剿总')
      || groupName.includes('剿总')
    );
    if (!contact) {
      return { key: 'blocked', label: '无法招降（需兵临城下）', contact: false, surrounded, isBeipingStyle, canAttempt: false, reason: 'no-contact', rank: 0 };
    }
    if ((politics.points ?? 0) < 30) {
      return { key: 'blocked', label: '政治点不足', contact: true, surrounded, isBeipingStyle, canAttempt: false, reason: 'no-points', rank: 1 };
    }
    if (cooldown > 0) {
      return { key: 'blocked', label: '需等待 ' + cooldown + ' 天', contact: true, surrounded, isBeipingStyle, canAttempt: false, reason: 'cooldown', cooldown, rank: 1 };
    }
    let unfavorable = 0;
    if ((unit.food ?? 100) >= 40) unfavorable += 1;
    if ((valueOf(state.warSupport, player, 60) - valueOf(state.warSupport, unit.side, 60)) <= 0) unfavorable += 1;
    if ((unit.morale ?? 70) >= 65) unfavorable += 1;
    if (!surrounded) unfavorable += 1;
    if (unfavorable >= 3) {
      return { key: 'low', label: '低', contact: true, surrounded, isBeipingStyle, canAttempt: true, reason: 'ok', rank: 2 };
    }
    if (unfavorable >= 1) {
      return { key: 'mid', label: '中', contact: true, surrounded, isBeipingStyle, canAttempt: true, reason: 'ok', rank: 3 };
    }
    return { key: 'high', label: '高', contact: true, surrounded, isBeipingStyle, canAttempt: true, reason: 'ok', rank: 4 };
  }

  function renderDefectCards() {
    const enemies = Engine.activeUnits(state).filter((u) => !u.parent && u.side !== state.player && u.strength > 0);
    const buckets = new Map();
    for (const u of enemies) {
      const key = u.leader ? 'leader:' + u.leader : (u.group ? 'group:' + u.group : 'unit:' + u.id);
      if (!buckets.has(key)) buckets.set(key, { key, leaderId: u.leader || '', groupId: u.group || '', units: [] });
      const bucket = buckets.get(key);
      if (!bucket.groupId && u.group) bucket.groupId = u.group;
      bucket.units.push(u);
    }
    const groups = [...buckets.values()].map((bucket) => {
      const evaluated = bucket.units.map((u) => ({ unit: u, tier: evaluateDefectTier(u) }));
      evaluated.sort((a, b) => (b.tier.rank - a.tier.rank) || (b.unit.strength - a.unit.strength));
      const bestTier = evaluated[0]?.tier || { key: 'blocked', label: '无法招降（需兵临城下）', rank: 0, isBeipingStyle: false };
      const totalStrength = bucket.units.reduce((sum, u) => sum + (u.strength || 0), 0);
      const cities = [...new Set(bucket.units.map((u) => cityName(u.city)).filter(Boolean))];
      const leaderName = leadersById.get(bucket.leaderId)?.name || '';
      const groupName = groupsById.get(bucket.groupId)?.name || '';
      const title = leaderName && groupName
        ? leaderName + '系 · ' + groupName
        : (leaderName ? leaderName + '所部' : (groupName || bucket.units[0]?.name || '敌方部队'));
      const hasBeipingStyle = evaluated.some((item) => item.tier.isBeipingStyle);
      return { ...bucket, evaluated, bestTier, totalStrength, cities, leaderName, groupName, title, hasBeipingStyle };
    }).sort((a, b) => (b.bestTier.rank - a.bestTier.rank) || (b.totalStrength - a.totalStrength));

    const cardsHtml = groups.length
      ? groups.map((g) => {
        const shown = g.evaluated.slice(0, 4);
        const extra = g.evaluated.length - shown.length;
        const cityList = g.cities.slice(0, 4).join(' / ') + (g.cities.length > 4 ? ' 等' : '');
        const rowsHtml = shown.map(({ unit, tier }) => {
          const btnText = tier.key === 'high' || tier.key === 'mid' || tier.key === 'low' ? '招降' : '招降';
          return '<li class="defect-unit-row"><div class="defect-unit-meta"><strong>' + escape(unit.name)
            + '</strong><span>' + format(unit.strength) + ' 人 · ' + escape(cityName(unit.city)) + '</span></div>'
            + '<div class="defect-unit-act"><span class="defect-tier is-' + escape(tier.key) + '">' + escape(tier.label) + '</span>'
            + '<button type="button" class="defect-recruit-btn" data-defect-unit="' + escape(unit.id) + '">' + btnText + '</button></div></li>';
        }).join('') + (extra > 0 ? '<li class="defect-unit-more">等 ' + g.evaluated.length + ' 个军</li>' : '');
        return '<article class="card defect-faction-card" data-defect-group="' + escape(g.key) + '">'
          + '<header class="defect-faction-head"><div><h4>' + escape(g.title) + '</h4>'
          + '<p class="defect-faction-sub">' + g.evaluated.length + ' 个军 · ' + format(g.totalStrength) + ' 人'
          + (cityList ? ' · ' + escape(cityList) : '') + '</p></div>'
          + '<span class="defect-tier is-' + escape(g.bestTier.key) + '">' + escape(g.bestTier.label) + '</span></header>'
          + (g.hasBeipingStyle ? '<p class="defect-beiping-note">可争取和平改编，城市可能一并移交</p>' : '')
          + '<ul class="defect-unit-list">' + rowsHtml + '</ul></article>';
      }).join('')
      : '<p class="subtext">当前战场暂无可策反的敌方主力部队。</p>';

    return '<section class="defect-panel-section" id="defect-panel-section">'
      + '<header class="defect-panel-head"><h3>兵临城下 · 招降与起义 <small>策反 · 30 政治点 · 冷却 8 天</small></h3>'
      + '<p class="subtext">与己方接战或被围的敌军才可能倒戈；成功者整建制改编，主官随之易帜。</p></header>'
      + '<div class="defect-panel-grid">' + cardsHtml + '</div></section>';
  }

  function openDefectUnitConfirm(unitId) {
    const unit = (state.units || []).find((u) => u.id === unitId && !u.parent && !u.inactive && u.side !== state.player && u.strength > 0);
    if (!unit) {
      notify('目标部队已不存在或不再属于敌方。');
      return;
    }
    const tier = evaluateDefectTier(unit);
    if (tier.reason === 'no-contact') {
      notify('无法招降（需兵临城下）');
      return;
    }
    if (tier.reason === 'cooldown' || tier.reason === 'no-points') {
      action('decide', ['defect', { unitId: unit.id }]);
      return;
    }
    const leaderName = leadersById.get(unit.leader)?.name || groupsById.get(unit.group)?.name || unit.name;
    const groupName = groupsById.get(unit.group)?.name || '';
    const html = '<div id="defect-confirm-box" style="display:grid;gap:10px;">'
      + '<section class="hoi-cipher-box">'
      + '<p style="margin:0 0 6px;font-size:13px;"><b>招降对象：</b>' + escape(unit.name)
      + (leaderName && leaderName !== unit.name ? '（主官：' + escape(leaderName) + '）' : '')
      + (groupName ? ' · ' + escape(groupName) : '') + '</p>'
      + '<p style="margin:0 0 6px;font-size:12px;">驻地：<b>' + escape(cityName(unit.city)) + '</b> · 兵力：<b>' + format(unit.strength) + ' 人</b> · 预估把握：<span class="defect-tier is-' + escape(tier.key) + '">' + escape(tier.label) + '</span></p>'
      + '<p style="margin:0 0 4px;font-size:12px;">预计代价：<b>30 政治点</b> · 冷却时间：<b>8 天</b></p>'
      + '<p class="subtext" style="margin:0;color:#ffbe85;">若失败政治点不退，且同样进入 8 天冷却；一次仅对单个军发起策反。</p>'
      + (tier.isBeipingStyle ? '<p class="defect-beiping-note" style="margin-top:6px;">可争取和平改编，城市可能一并移交</p>' : '')
      + '</section>'
      + '<div class="dialog-actions">'
      + '<button type="button" id="defect-confirm-back">返回政局面板</button>'
      + '<button type="button" class="gold" id="defect-confirm-go">确认招降（消耗 30 政治点）</button>'
      + '</div></div>';
    const body = showDialog('确认发起招降', html);
    body.querySelector('#defect-confirm-back')?.addEventListener('click', () => politicsPanel());
    body.querySelector('#defect-confirm-go')?.addEventListener('click', () => {
      const ok = action('decide', ['defect', { unitId: unit.id }]);
      if (ok) {
        if (lastActionResult?.success === true) {
          notify('招降成功：' + leaderName + ' 所部归入' + sides[state.player]);
        } else if (lastActionResult?.success === false) {
          notify('招降未成，' + leaderName + ' 仍在观望（政治点已消耗）');
        }
        saveAuto(true);
        render();
      }
      politicsPanel();
    });
  }

  function politicsTargets(kind) {
    if (kind === 'defect') return '';
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
    const roots = tree.filter((item) => !(item.requires && item.requires.length));
    const cols = roots.map((root) => {
      const chain = [root];
      let next = tree.find((item) => (item.requires ?? []).includes(root.id));
      while (next) {
        chain.push(next);
        const curId = next.id;
        next = tree.find((item) => (item.requires ?? []).includes(curId));
      }
      return chain;
    });
    const renderNode = (item) => {
      const done = focus.done?.includes(item.id);
      const current = focus.current === item.id;
      const locked = (item.requires ?? []).some((id) => !focus.done?.includes(id));
      const pct = done ? 100 : current ? Math.min(100, Math.round((focus.progress ?? 0) / item.days * 100)) : 0;
      return '<article class="hoi-focus-node ' + (done ? 'done' : current ? 'active' : locked ? 'locked' : '') + '">'
        + '<header style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><h3 style="margin:0;font-size:13px;">'
        + escape(item.name) + '</h3><span class="plan-status is-' + (done ? 'done' : current ? 'active' : 'draft') + '">'
        + (done ? '已完成' : current ? (focus.progress ?? 0) + '/' + item.days + '天' : locked ? '需前置' : item.days + '天')
        + '</span></header><p class="subtext" style="margin:4px 0;">' + escape(item.desc) + '</p>'
        + '<div class="progress"><i style="width:' + pct + '%"></i></div>'
        + '<div class="unit-actions"><button type="button" data-focus="' + item.id + '"'
        + (done || current || locked ? ' disabled' : '') + '>开始推进</button></div></article>';
    };
    return '<p class="subtext">钢4分支国策树：每次推进一项，按天自动完成并立刻获得工厂、装备或改革加成。</p>'
      + '<div class="hoi-focus-tree">' + cols.map((col) => '<div class="hoi-focus-col">' + col.map(renderNode).join('') + '</div>').join('') + '</div>';
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
    const labels = { infantry: '步兵装备', artillery: '火炮', armor: '装甲装备', air: '航空装备', naval: '舰艇与运输船' };
    const controlledValue = Data.cities.filter(city => state.owners[city.id] === side)
      .reduce((sum, city) => sum + (Number(city.value) || 1), 0);
    const militaryFactories = Data.cities.reduce((sum, city) => sum + (state.owners[city.id] === side
      ? Number(state.buildings?.[city.id]?.militaryFactory) || 0 : 0), 0);
    const civilianFactories = Data.cities.reduce((sum, city) => sum + (state.owners[city.id] === side
      ? Number(state.buildings?.[city.id]?.civilianFactory) || 0 : 0), 0);
    const projects = (state.construction || []).filter(job => job.side === side).length;
    return '<p class="subtext">基础产能随控制区变化；军工厂增加装备产量，民用工厂增加财政并加快施工。选择城镇后可在地图详情直接开建。产线比例总和不超过 100。</p>'
      + '<div class="stat-line">' + statChips({ '基础工厂': Math.max(2, Math.round(controlledValue / 9)),
        '军工厂': militaryFactories, '民用工厂': civilianFactories, '建设项目': projects }) + '</div>'
      + '<form id="production-form" class="card"><div class="production-grid">'
      + Object.entries(labels).map(([key, label]) => {
        const eff = Math.round((state.prodEff?.[side]?.[key] ?? 0.55) * 100);
        return '<label>' + label + ' <small style="color:#8de67a;">效率 ' + eff + '%</small><input type="number" min="0" max="100" name="'
          + key + '" value="' + (production.lines?.[key] ?? 0) + '"><span class="hoi-eff-bar"><i style="width:' + eff + '%"></i></span></label>';
      }).join('')
      + '</div><div class="unit-actions"><button class="gold" type="submit">保存分配</button></div></form>'
      + '<table class="dialog-table"><thead><tr><th>储备</th><th>数量</th></tr></thead><tbody>'
      + Object.entries(labels).filter(([key]) => key !== 'naval').map(([key, label]) =>
        '<tr><td>' + label + '</td><td>' + format(stock[key] ?? 0) + '</td></tr>').join('')
      + '<tr><td>运输船</td><td>' + format(state.navy?.[side]?.transports ?? 0) + '</td></tr>'
      + '<tr><td>军舰</td><td>' + format(state.navy?.[side]?.warships ?? 0) + '</td></tr>'
      + '</tbody></table>';
  }

  function designForm() {
    const draft = defenseDraft ?? {
      name: '新编制', infantry: 9, artillery: 1, armor: 0, motorized: 0, antiAir: 0, antiTank: 0, support: { engineer: true, artillery: true },
    };
    const presets = meta.divisionPresets ?? [];
    const supSlots = Object.entries(supportInfo2).slice(0, 5).map(([key, label]) =>
      '<div class="hoi-slot ' + (draft.support?.[key] ? 'sup' : 'empty') + '">' + escape(label.replace('连', '')) + '</div>').join('');
    const batItems = [];
    for (let i = 0; i < (draft.infantry || 0); i++) batItems.push(['步兵', '']);
    for (let i = 0; i < (draft.artillery || 0); i++) batItems.push(['炮兵', 'art']);
    for (let i = 0; i < (draft.armor || 0); i++) batItems.push(['装甲', 'arm']);
    for (let i = 0; i < (draft.motorized || 0); i++) batItems.push(['摩托', 'arm']);
    for (let i = 0; i < (draft.antiAir || 0); i++) batItems.push(['防空', 'art']);
    for (let i = 0; i < (draft.antiTank || 0); i++) batItems.push(['战防', 'art']);
    while (batItems.length < 15) batItems.push(['＋', 'empty']);
    const visualGrid = '<div class="hoi-div-visual"><div><div class="hoi-div-col-label">支援连 (5格)</div><div class="hoi-div-slots">'
      + supSlots + '</div></div><div><div class="hoi-div-col-label">主力营编成网格（钢4 5×3 示意）</div><div class="hoi-div-battalions">'
      + batItems.slice(0, 15).map(([txt, cls]) => '<div class="hoi-slot ' + cls + '">' + txt + '</div>').join('')
      + '</div></div></div>';
    return (presets.length ? '<div class="hoi-preset-row">' + presets.map((p) =>
      '<button type="button" data-design-preset="' + escape(p.id) + '" title="' + escape(p.desc) + '">一键套用：' + escape(p.name) + '</button>').join('') + '</div>' : '')
      + visualGrid
      + '<form id="design-form" class="card"><h3>' + (draft.id ? '编辑「' + escape(draft.name) + '」' : '新建编制') + '</h3>'
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
    const airReg = force.region || 'all';
    const airRegions = [['all', '全国统筹'], ['northeast', '东北战区'], ['north', '华北战区'], ['east', '华东战区'],
      ['central', '中原战区'], ['northwest', '西北战区'], ['south', '华南战区']];
    return '<p class="subtext">可选择战区集中投放空中力量（指定战区内支援与后勤打击效果 +45%），并支持 HOI4「后勤打击」专项轰炸敌方铁路与补给车队。</p>'
      + '<div class="hoi-motor-bar">' + airRegions.map(([rk, rl]) => '<button type="button" data-air-region="' + rk
        + '" aria-pressed="' + (airReg === rk) + '">' + escape(rl) + '</button>').join('') + '</div>'
      + '<p class="subtext">机场来自价值 5 以上的城镇，共 ' + bases + ' 处。机队每日补充，也会因敌方制空而损失。</p>'
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

  function doctrineBody() {
    const side = state.player;
    const current = state.doctrine?.[side] || 'mobile';
    const xp = Math.round(state.armyXp?.[side] ?? 0);
    const catalog = meta.doctrineCatalog || {};
    return '<p class="subtext">HOI4 四大陆军学说路线：决定部队攻防倾向、组织度韧性与战壕强度。当前陆军经验 <b>' + xp + '</b> 点（切换学说需 25 点）。</p>'
      + '<div class="hoi-doctrine-grid">' + Object.values(catalog).map((doc) => {
        const active = current === doc.id;
        return '<article class="hoi-doctrine-card' + (active ? ' active' : '') + '"><header style="display:flex;justify-content:space-between;align-items:center;"><h3 style="margin:0;font-size:13px;">'
          + escape(doc.name) + '</h3><span class="plan-status is-' + (active ? 'active' : 'draft') + '">'
          + (active ? '现行学说' : '25 经验') + '</span></header><p class="subtext" style="margin:0;">'
          + escape(doc.desc) + '</p><div class="unit-actions"><button type="button" class="' + (active ? '' : 'gold')
          + '" data-doctrine="' + escape(doc.id) + '"' + (active || xp < 25 ? ' disabled' : '') + '>'
          + (active ? '已确立' : '确立此学说') + '</button></div></article>';
      }).join('') + '</div>';
  }

  function navalMissionRows(side) {
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
    return seaRows;
  }

  function navyBody() {
    const side = state.player;
    const navy = state.navy?.[side] ?? {};
    const hoi = Engine.ensureCivilHoi?.(state);
    const tf = hoi?.[side]?.taskForce || { name: '海防特混分队', dd: 12, ca: 2, bb: 0, cv: 0, ss: 2 };
    const lb = hoi?.lastNavalBattle;
    const threeRow = (title, f, lost) => '<div style="padding:7px;border-radius:5px;border:1px solid #6b5b3c;background:#18211d;margin:6px 0;">'
      + '<strong style="color:#ffe494;font-size:12px;">' + escape(title) + '</strong>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:5px;text-align:center;font-size:11px;">'
      + '<div style="padding:4px;border-radius:4px;background:#1f2e28;border:1px solid #4c7061;"><b>第1排·屏卫排</b><br>🚢 驱逐 DD: <b>' + f.dd + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.dd + ')</span>' : '') + '<br>🦈 潜艇 SS: <b>' + f.ss + '</b></div>'
      + '<div style="padding:4px;border-radius:4px;background:#262c22;border:1px solid #7d704a;"><b>第2排·主力战列</b><br>⚓ 战列 BB: <b>' + f.bb + '</b><br>🛥 巡洋 CA: <b>' + f.ca + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.ca + ')</span>' : '') + '</div>'
      + '<div style="padding:4px;border-radius:4px;background:#2e2420;border:1px solid #96644c;"><b>第3排·航空支援</b><br>🛩 航母 CV: <b>' + f.cv + '</b></div>'
      + '</div></div>';
    return '<p class="subtext">渡海进攻需要运输船（每 1500 人占 1 艘），并与二战同级同步 HOI4 三排海战阵型决战。</p>'
      + '<div class="stat-line">' + statChips({
        '运输船': Math.floor(navy.transports ?? 0), '军舰': Math.floor(navy.warships ?? 0),
        '单次投送上限': format(Math.floor((navy.transports ?? 0) * 1500)) + ' 人',
      }) + '</div>'
      + threeRow('本方特混舰队：' + tf.name, tf, null)
      + '<div style="margin:6px 0;"><button type="button" class="gold" data-civil-naval-battle>🚢✈️ 发动 HOI4 三排海战决战（20 指挥点）</button></div>'
      + (lb ? '<div class="hoi-cipher-box"><strong style="color:#ffe494;">⚔️ 最近三排海战战报（' + escape(lb.date) + ' · 沿岸炮击 -' + lb.shoreBombard + '% · 胜方：' + escape(short[lb.winner]) + '）</strong>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' + threeRow('攻方：' + lb.atk.name, lb.atk, lb.atk.lost) + threeRow('守方：' + lb.def.name, lb.def, lb.def.lost) + '</div></div>' : '')
      + '<div class="card"><h3>选择海域任务</h3><p class="subtext">巡逻 8、护航 6、破交 6、登陆准备 12 舰队点；运输船按半点计算。先选任务再点执行，撤销选择未部署。</p><div class="sea-zone-grid">' + navalMissionRows(side) + '</div><button type="button" data-naval-save>执行海军部署</button></div>';
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
    const cipher = state.cipher?.[side] ?? { network: 0, decrypt: 0, activeDays: 0 };
    const decryptPct = Math.round(cipher.decrypt ?? 0);
    const cipherBox = '<div class="hoi-cipher-box"><header style="display:flex;justify-content:space-between;align-items:center;">'
      + '<strong style="color:#f5e1b0;">🕵️ 隐蔽战线情报网 & 电台密码破译</strong>'
      + '<span class="plan-status is-' + (cipher.activeDays > 0 ? 'active' : 'draft') + '">'
      + (cipher.activeDays > 0 ? '决战破译生效中 · 剩 ' + cipher.activeDays + ' 天' : '渗透 ' + Math.round(cipher.network ?? 0) + '% · 破译 ' + decryptPct + '%')
      + '</span></header><div class="hoi-cipher-bar"><i style="width:' + Math.min(100, decryptPct) + '%"></i></div>'
      + '<p class="subtext" style="margin:0;">情报网渗透可直接削弱敌军工事/堑壕防御（最高 -25%）；破译达 100% 后可一键激活 15 天「破译决战电文」（全军攻防 +15%、敌方工事减半）。</p>'
      + '<div class="unit-actions">'
      + '<button type="button" data-spy-network' + (politicalPoints < 20 ? ' disabled' : '') + '>🕵️ 扩大情报网（20 政治点）</button>'
      + '<button type="button" class="gold" data-cipher-break' + (decryptPct < 100 ? ' disabled' : '') + '>📡 激活破译决战电文（需 100%）</button>'
      + '</div></div>';
    return cipherBox + '<div class="stat-line">' + statChips({
      '情报水平': Math.round(intel.level), '情报点': Math.round(intel.points),
      '稳定度': stability, '我方沦陷城镇': occupied, '抵抗较高': resistance,
      '战争支持': Math.round(state.warSupport?.[side] ?? 0),
    }) + '</div><div class="foreign-grid">' + foreignStatus + '</div><div class="card"><h3>外部势力影响（简化推演）</h3>'
      + '<p class="subtext">美国援助/禁运与外交压力；苏联 1945—46 年东北影响、装备援助；日本仅模拟投降后遗留武器，非日本参战。</p></div>'
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
    if (tab === 'doctrine') return doctrineBody();
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
    const tabs = [['focus', '国策'], ['doctrine', '学说'], ['tech', '科研'], ['production', '生产'], ['design', '编制'],
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
    const cards = Object.entries(decisionInfo).filter(([kind]) => kind !== 'defect').map(([kind, info]) => {
      const cooldown = politics.cooldowns?.[kind] ?? 0;
      const disabled = Boolean(cooldown) || politics.points < info.cost;
      return '<article class="card decision-card"><div><h3>' + escape(info.name) + ' <small>' + info.cost
        + ' 点</small></h3><p>' + escape(info.hint) + '</p>' + politicsTargets(kind) + '</div>'
        + '<button type="button" data-decide="' + escape(kind) + '"' + (disabled ? ' disabled' : '') + '>'
        + (cooldown ? cooldown + ' 天后' : politics.points < info.cost ? '点数不足' : '执行') + '</button></article>';
    }).join('');
    const defectSectionHtml = renderDefectCards();
    const spirits = state.spirits?.[side] ?? [];
    const xp = Math.round(state.armyXp?.[side] ?? 0);
    const spiritHtml = '<h3 style="margin:8px 0 4px;">民族精神与陆军改革（当前陆军经验 ' + xp + ' 点）</h3><div class="hoi-spirit-grid">'
      + spirits.map((sp) => {
        const active = sp.tier > 0;
        const canReform = !sp.good && active && (sp.costType === 'xp' ? xp >= sp.cost : politics.points >= sp.cost);
        return '<article class="hoi-spirit-card ' + (sp.good ? 'buff' : active ? 'debuff' : '') + '"><header><h4>'
          + escape(sp.name) + (sp.maxTier > 1 ? '（' + sp.tier + '/' + sp.maxTier + '级）' : '') + '</h4>'
          + '<span class="plan-status is-' + (sp.good ? 'active' : active ? 'draft' : 'done') + '">'
          + (sp.good ? '增益' : active ? '负面' : '已消除') + '</span></header><p class="subtext">' + escape(sp.desc) + '</p>'
          + (!sp.good && active ? '<div class="unit-actions"><button type="button" class="gold" data-reform-spirit="' + escape(sp.id) + '"'
            + (canReform ? '' : ' disabled') + '>改革消除（' + sp.cost + (sp.costType === 'xp' ? ' 陆军经验' : ' 政治点') + '）</button></div>' : '')
          + '</article>';
      }).join('') + '</div>';
    const hired = new Set(state.advisors?.[side] ?? []);
    const advisors = meta.advisorCatalog ?? [];
    const advisorHtml = '<h3 style="margin:8px 0 4px;">内阁军事参谋（' + hired.size + ' / 3）</h3><div class="hoi-spirit-grid">'
      + advisors.map((adv) => {
        const isHired = hired.has(adv.id);
        const canHire = !isHired && hired.size < 3 && politics.points >= adv.cost;
        return '<article class="hoi-spirit-card ' + (isHired ? 'buff' : '') + '"><header><h4>' + escape(adv.name)
          + '</h4><span class="plan-status is-' + (isHired ? 'active' : 'draft') + '">' + (isHired ? '已任职' : adv.cost + ' 政治点')
          + '</span></header><p class="subtext">' + escape(adv.desc) + '</p>'
          + (!isHired ? '<div class="unit-actions"><button type="button" data-hire-advisor="' + escape(adv.id) + '"'
            + (canHire ? '' : ' disabled') + '>任命参谋</button></div>' : '') + '</article>';
      }).join('') + '</div>';
    const timedCatalog = (meta.timedDecisionsCatalog || []).filter((d) => d.side === 'both' || d.side === side);
    const activeDecs = state.activeDecisions?.[side] || [];
    const catDefs = [
      ['mobilize', '🎖️ 军事动员'],
      ['economy', '🏭 经济后勤'],
      ['faction', '🤝 派系协调'],
      ['campaign', '🚂 战役行动'],
    ];
    const timedHtml = '<h3 style="margin:10px 0 6px;">HOI4 分类限时决议（附倒计时进度）</h3>' + catDefs.map(([catKey, catTitle]) => {
      const items = timedCatalog.filter((d) => d.category === catKey);
      if (!items.length) return '';
      return '<details open class="hoi-dec-group"><summary>' + catTitle + ' <span>' + items.length + ' 项</span></summary><div class="hoi-dec-body">'
        + items.map((d) => {
          const runningDec = activeDecs.find((a) => a.id === d.id);
          const totalDays = runningDec ? (runningDec.total || runningDec.days || d.days || 1) : 1;
          const pct = runningDec ? Math.max(5, Math.min(100, Math.round(((totalDays - runningDec.remaining) / totalDays) * 100))) : 0;
          const canLaunch = !runningDec && politics.points >= d.cost;
          return '<div class="hoi-dec-row"><div><strong>' + escape(d.name) + '</strong><small>' + escape(d.desc) + '</small>'
            + (runningDec ? '<div class="hoi-dec-prog"><i style="width:' + pct + '%"></i><span>剩余 ' + runningDec.remaining + ' 天</span></div>' : '')
            + '</div><button type="button" class="' + (canLaunch ? 'gold' : '') + '" data-timed-decision="' + escape(d.id) + '"'
            + (canLaunch ? '' : ' disabled') + '>' + (runningDec ? '执行中 ' + runningDec.remaining + '天' : d.cost + ' 点 · ' + d.days + '天') + '</button></div>';
        }).join('') + '</div></details>';
    }).join('');
    showDialog('政治与内阁 · 民族精神与限时决议', '<p>政治点随控制城镇每日增长；陆军经验在战斗与挖壕守线中积累，可用于消除「陆军派系与腐败」等负面状态。</p>'
      + '<div class="politics-head"><div><span>政治点</span><strong>' + format(politics.points) + '</strong></div>'
      + '<div><span>陆军经验</span><strong>' + format(xp) + '</strong></div>'
      + '<div><span>民心 / 战争支持</span><strong>' + format(support) + '</strong></div>'
      + '<div><span>首都</span><strong>' + escape(cityName(capital)) + '</strong></div></div>'
      + timedHtml + spiritHtml + advisorHtml + defectSectionHtml + '<h3 style="margin:10px 0 4px;">战时即时指令决议</h3>'
      + cards + '<div class="dialog-actions"><button type="button" class="gold" onclick="document.getElementById(\'groups\').click()">查看地方军阀与派系</button><button type="button" data-politics-close>关闭</button></div>');
  }

  function economy() {
    const rows = { recruit: '征兵补充', industry: '装备生产', supply: '粮秣调配' };
    const side = state.player;
    const h = Engine.ensureCivilHoi?.(state)?.[side] || { fuel: 85, mio: { infantry: 1, artillery: 1, armor: 1, naval_air: 1 }, equipMod: { rifle: 0, artillery: 0, tank: 0 }, relocated: false };
    const hoiExtraHtml = '<div class="hoi-cipher-box" style="margin-top:8px;">'
      + '<header style="display:flex;justify-content:space-between;align-items:center;"><strong style="color:#f5e1b0;">🏭 HOI4 同步：石油燃油 · 四大军工设计局 (MIO) · 装备改型 · 雷达与内迁</strong>'
      + '<span class="plan-status is-active">🛢️ 燃油 ' + Math.round(h.fuel) + '%</span></header>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">'
      + '<button type="button" data-civil-mio="infantry">🔫 步兵兵工局 Lv.' + h.mio.infantry + ' (+15政)</button>'
      + '<button type="button" data-civil-mio="artillery">💣 重炮设计局 Lv.' + h.mio.artillery + ' (+15政)</button>'
      + '<button type="button" data-civil-mio="armor">🚜 装甲设计局 Lv.' + h.mio.armor + ' (+15政)</button>'
      + '<button type="button" data-civil-mio="naval_air">⚓ 海空造船局 Lv.' + h.mio.naval_air + ' (+15政)</button>'
      + '</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">'
      + '<button type="button" class="gold" data-civil-eq="rifle">🔧 步枪 Mk.' + (h.equipMod.rifle + 1) + ' (15政)</button>'
      + '<button type="button" class="gold" data-civil-eq="artillery">🔧 重炮 Mk.' + (h.equipMod.artillery + 1) + ' (15政)</button>'
      + '<button type="button" class="gold" data-civil-eq="tank">🔧 装甲 Mk.' + (h.equipMod.tank + 1) + ' (15政)</button>'
      + '<button type="button" data-civil-radar>📡 建本土防空雷达(15政)</button>'
      + '<button type="button" data-civil-relocate ' + (h.relocated ? 'disabled' : '') + '>🏭 大后方工业内迁(20政)</button>'
      + '<button type="button" data-civil-suppress>👮 宪兵治安镇压(10政)</button>'
      + '</div></div>';
    const body = showDialog('经济与后勤（已同步 HOI4 军工/燃油/设计局）', '<div class="detail-grid">'
      + ['ccp', 'roc'].map((s) => '<div>' + sideTag(s) + '<dl class="resources">'
        + resourceTiles(state.economy[s]) + '</dl></div>').join('') + '</div>' + hoiExtraHtml + '<form id="policy-form" class="card">'
      + '<h3>' + sides[state.player] + ' · 统帅分配</h3><div class="form-grid">'
      + Object.entries(rows).map(([key, label]) => '<label>' + label + '<select name="' + key + '">'
        + [['low', '低'], ['normal', '均衡'], ['high', '优先']].map((item) => option(...item, state.policies[key])).join('') + '</select></label>').join('')
      + '</div><div class="dialog-actions"><button type="submit" class="gold">执行分配</button>'
      + '<button type="button" onclick="document.getElementById(\'defense\').click()">国策 / 科研 / 军工生产 / 师编制</button></div></form>');
    body.querySelectorAll('[data-civil-mio]').forEach((b) => b.onclick = () => {
      if (action('upgradeCivilMIO', [b.dataset.civilMio])) { WarAudio.click(); saveAuto(true); render(); economy(); }
    });
    body.querySelectorAll('[data-civil-eq]').forEach((b) => b.onclick = () => {
      if (action('designCivilEquipment', [b.dataset.civilEq])) { WarAudio.click(); saveAuto(true); render(); economy(); }
    });
    body.querySelector('[data-civil-radar]')?.addEventListener('click', () => {
      if (action('buildCivilRadar', [selectedCity])) { WarAudio.click(); saveAuto(true); render(); economy(); }
    });
    body.querySelector('[data-civil-relocate]')?.addEventListener('click', () => {
      if (action('relocateCivilIndustry', [])) { WarAudio.click(); saveAuto(true); render(); economy(); }
    });
    body.querySelector('[data-civil-suppress]')?.addEventListener('click', () => {
      if (action('suppressCivilResistance', [])) { WarAudio.click(); saveAuto(true); render(); economy(); }
    });
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
    const body = showDialog('局势预测', '<p>从当前日期复制战局，按月推演两方城市、兵员及胜负。当前战局不会被预测修改。</p>'
      + '<label class="field">预测跨度<select id="forecast-months"><option value="3">未来 3 个月</option>'
      + '<option value="6">未来 6 个月</option><option value="12">未来 12 个月</option></select></label>'
      + '<div class="dialog-actions"><button id="run-forecast" type="button" class="gold">开始推演</button>'
      + '<button id="plan-forecast" type="button"' + (permitted(inspectUnit()) ? '' : ' disabled') + '>预演所选部队的命令</button>'
      + '<button id="compare-forecast" type="button">并排比较两套方案</button></div>'
      + '<div id="forecast-output" aria-live="polite"></div>');
    const calc = (input, title) => {
      const result = Engine.forecast(Data, input, Number($('forecast-months').value));
      $('forecast-output').innerHTML = '<p class="roster-label">' + escape(title) + '</p><table class="dialog-table"><thead><tr>'
        + '<th>日期</th><th>' + escape(short.ccp) + ' · 城市 / 兵员 / 粮食</th><th>' + escape(short.roc) + ' · 城市 / 兵员 / 粮食</th><th>易手 / 结局</th>'
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
    const body = showDialog('更换接管阵营', '<p>当前日期和双方此前的行动记录会继续保留在本次战局中。</p>'
      + '<div class="dialog-actions"><button type="button" data-control-side="ccp">接管' + escape(sides.ccp) + '</button>'
      + '<button type="button" data-control-side="roc">接管' + escape(sides.roc) + '</button></div>');
    body.querySelectorAll('[data-control-side]').forEach((item) => {
      item.disabled = state.player === item.dataset.controlSide;
      item.onclick = () => {
        selfProclaimed = false;
        action('setSide', [item.dataset.controlSide]);
        pendingOrder = undefined;
        selectedUnit = undefined;
        selectedUnits = new Set();
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

  function openDefectDialog() {
    const curSide = state.player;
    const otherSide = curSide === 'ccp' ? 'roc' : 'ccp';
    const curScopeText = state.scope === 'national' ? '全国指挥' : (regions[area()] || area() || '地方战区');
    const curGroupObj = state.group ? groupsById.get(state.group) : null;
    const curGroupText = curGroupObj ? ('已锁定派系：' + curGroupObj.name) : '未锁定特定派系';

    // 统计目标阵营中当前有存活在役 root 单位的派系，供方案 b 选用
    const availableGroups = [];
    const seenGroup = new Set();
    for (const u of state.units || []) {
      if (u.parent || u.inactive || !(u.strength > 0) || u.side !== otherSide || !u.group) continue;
      if (seenGroup.has(u.group)) continue;
      seenGroup.add(u.group);
      const g = groupsById.get(u.group);
      availableGroups.push({ id: u.group, name: g?.name || u.group });
    }
    const areaOptions = Object.entries(regions).filter(([k]) => k !== 'national');

    let choice = 'join';
    let pickedGroup = availableGroups[0]?.id || '';
    let pickedArea = (state.area && regions[state.area] && state.area !== 'national') ? state.area : (areaOptions[0]?.[0] || 'northeast');

    const consequenceText = '叛变不会移动任何部队与城镇。你的原部队将转为 AI 指挥，你本人接管对方阵营全部部队。若要真正带走部队与地盘，需要引擎支持，当前版本不支持。';

    const showStep1 = () => {
      const html = '<div id="defect-step1" style="display:grid;gap:10px;">'
        + '<section class="hoi-cipher-box">'
        + '<header><strong style="color:#f5e1b0;">1. 当前身份现状</strong></header>'
        + '<p style="margin:5px 0 3px;font-size:12px;">当前阵营：<b>' + escape(sides[curSide]) + '</b> · 指挥范围：<b>' + escape(curScopeText) + '</b> · ' + escape(curGroupText) + '</p>'
        + '<p class="subtext" style="margin:0;color:#ffe49c;">明确说明：当前可带走的是「指挥权限」，不是部队本身。</p>'
        + '</section>'
        + '<section class="hoi-cipher-box">'
        + '<header><strong style="color:#f5e1b0;">2. 选择叛变 / 自立方案（单选）</strong></header>'
        + '<div style="display:grid;gap:7px;margin-top:6px;font-size:12px;">'
        + '<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">'
        + '<input type="radio" name="defect-choice" value="join" ' + (choice === 'join' ? 'checked' : '') + '>'
        + '<span><b>a. 投靠对方阵营</b>（转投 ' + escape(sides[otherSide]) + '，接管对方全国指挥权）</span></label>'
        + '<label style="display:flex;gap:8px;align-items:flex-start;cursor:' + (availableGroups.length ? 'pointer' : 'not-allowed') + ';opacity:' + (availableGroups.length ? '1' : '0.55') + ';">'
        + '<input type="radio" name="defect-choice" value="group" ' + (choice === 'group' ? 'checked' : '') + (availableGroups.length ? '' : ' disabled') + '>'
        + '<span><b>b. 只带一个派系自立</b>（转投 ' + escape(sides[otherSide]) + ' 并锁定单一派系指挥）'
        + (availableGroups.length
          ? '<br><select id="defect-group-sel" style="margin-top:4px;font-size:11.5px;">'
            + availableGroups.map((g) => '<option value="' + escape(g.id) + '"' + (g.id === pickedGroup ? ' selected' : '') + '>' + escape(g.name) + '</option>').join('')
            + '</select>'
          : '<br><small class="subtext">对方阵营当前无可锁定的独立派系部队</small>')
        + '</span></label>'
        + '<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">'
        + '<input type="radio" name="defect-choice" value="theater" ' + (choice === 'theater' ? 'checked' : '') + '>'
        + '<span><b>c. 只守一个战区自立</b>（锁定单个战区并转投 ' + escape(sides[otherSide]) + '）'
        + '<br><select id="defect-area-sel" style="margin-top:4px;font-size:11.5px;">'
        + areaOptions.map(([k, v]) => '<option value="' + escape(k) + '"' + (k === pickedArea ? ' selected' : '') + '>' + escape(v) + '</option>').join('')
        + '</select></span></label>'
        + '<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">'
        + '<input type="radio" name="defect-choice" value="self" ' + (choice === 'self' ? 'checked' : '') + '>'
        + '<span><b>d. 自立（名义自立 · 自成一派）</b>（锁定所选战区并转投 ' + escape(sides[otherSide]) + '，顶栏挂出「自成一派 · 不听调遣」）'
        + '<br><small style="color:#ffbe85;">名义自立：不与任何一方停战，实际仍会被双方攻击。</small></span></label>'
        + '</div></section>'
        + '<section class="hoi-cipher-box" style="border-color:#a85648;background:#2d1f1d;">'
        + '<header><strong style="color:#ffb3a3;">3. 后果告知</strong></header>'
        + '<p style="margin:5px 0 0;font-size:12px;line-height:1.55;color:#f3dfd8;">' + consequenceText + '</p>'
        + '</section>'
        + '<div class="dialog-actions"><button type="button" id="defect-cancel">取消</button>'
        + '<button type="button" class="gold" id="defect-next">下一步：确认交接</button></div>'
        + '</div>';
      const body = showDialog('率部叛变 / 自立门户', html);
      body.querySelectorAll('input[name="defect-choice"]').forEach((r) => {
        r.onchange = () => { choice = r.value; };
      });
      body.querySelector('#defect-group-sel')?.addEventListener('change', (ev) => { pickedGroup = ev.target.value; });
      body.querySelector('#defect-area-sel')?.addEventListener('change', (ev) => { pickedArea = ev.target.value; });
      body.querySelector('#defect-cancel').onclick = () => dialog.close();
      body.querySelector('#defect-next').onclick = () => showStep2();
    };

    const showStep2 = () => {
      const loseUnits = (state.units || []).filter((u) => !u.parent && !u.inactive && u.strength > 0 && u.side === curSide).length;
      const loseCities = Object.values(state.owners || {}).filter((o) => o === curSide).length;
      const gainUnits = (state.units || []).filter((u) => !u.parent && !u.inactive && u.strength > 0 && u.side === otherSide).length;
      const planLabel = choice === 'join'
        ? ('投靠 ' + sides[otherSide])
        : choice === 'group'
          ? ('只带派系「' + (groupsById.get(pickedGroup)?.name || pickedGroup) + '」自立并转投 ' + sides[otherSide])
          : choice === 'self'
            ? ('名义自立（锁定战区「' + (regions[pickedArea] || pickedArea) + '」并转投 ' + sides[otherSide] + '）')
            : ('只守战区「' + (regions[pickedArea] || pickedArea) + '」自立并转投 ' + sides[otherSide]);
      const html = '<div id="defect-step2" style="display:grid;gap:10px;">'
        + '<section class="hoi-cipher-box" style="border-color:#d4a64a;">'
        + '<header><strong style="color:#ffe49c;">二次确认 · 指挥权交接清单</strong></header>'
        + '<p style="margin:6px 0;font-size:13px;color:#fff4d4;"><b>你将失去 ' + loseUnits + ' 个军、' + loseCities + ' 座城镇的指挥权，转而接管 ' + gainUnits + ' 个军</b></p>'
        + '<p class="subtext" style="margin:4px 0;">所选方案：' + escape(planLabel) + '</p>'
        + (choice === 'self' ? '<p style="margin:4px 0;font-size:12px;color:#ffbe85;">名义自立：不与任何一方停战，实际仍会被双方攻击。</p>' : '')
        + '<p class="subtext" style="margin:4px 0;">' + consequenceText + '</p>'
        + '</section>'
        + '<div class="dialog-actions"><button type="button" id="defect-back">返回重选</button>'
        + '<button type="button" class="gold" id="defect-confirm">确认叛变</button></div>'
        + '</div>';
      const body = showDialog('率部叛变 / 自立门户', html);
      body.querySelector('#defect-back').onclick = () => showStep1();
      body.querySelector('#defect-confirm').onclick = () => {
        if (choice === 'theater' || choice === 'self') {
          action('setScope', ['theater', pickedArea]);
          action('setSide', [otherSide]);
          selfProclaimed = (choice === 'self');
        } else if (choice === 'group' && pickedGroup) {
          action('setSide', [otherSide]);
          action('setGroup', [pickedGroup]);
          selfProclaimed = false;
        } else {
          action('setSide', [otherSide]);
          selfProclaimed = false;
        }
        pendingOrder = undefined;
        selectedUnit = undefined;
        selectedUnits = new Set();
        rosterSide = 'player';
        rosterGroup = '';
        rosterPage = 0;
        setMapHelp();
        dialog.close();
        saveAuto(true);
        render();
        notify('已叛变，现接管 ' + sides[state.player] + ' 阵营');
      };
    };

    showStep1();
  }

  function saveSlot() { notify('当前版本不保存进度'); return false; }

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
    const names = [...leadersById.values()].filter((leader) =>
      (state.leaderTransfers?.[leader.id] || leader.side) === unit.side);
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
    else if (d.releaseAi) {
      if (action('releaseToAI', [d.releaseAi])) {
        saveAuto(true); render(); notify('该部队已交给司令员自动安排。');
      }
    }
    else if (d.appoint) appoint(d.appoint);
    else if (d.leader) { const leader = leadersById.get(d.leader); if (leader) showDialog(leader.name, leaderCard(leader)); }
    else if (d.gearUnit !== undefined) gear();
    else if (d.buildBuilding) {
      const kind = d.buildBuilding;
      if (action('buildBuilding', [selectedCity, kind])) {
        saveAuto(true);
        render();
        notify(cityName(selectedCity) + '已加入' + (meta.buildingKinds?.[kind]?.name || '建设项目') + '施工队列。');
      }
    }
    else if (d.recruitBranch) {
      if (action('recruitArmy', [selectedCity, d.recruitBranch])) {
        saveAuto(true);
        render();
        notify(cityName(selectedCity) + '已开始训练新编' + (recruitmentInfo[d.recruitBranch]?.name || '部队') + '。');
      }
    }
    else if (d.forts) fortsPanel(d.forts);
    else if (d.scorchedCity) {
      if (action('scorchedEarth', [d.scorchedCity])) {
        saveAuto(true); render(); notify('已实施焦土炸桥：铁路与后勤瘫痪 15 天！');
      }
    }
    else if (d.sabotageCity) {
      if (action('sabotageRail', [d.sabotageCity])) {
        saveAuto(true); render(); notify('铁路破袭成功：敌军该节点补给中断 10 天！');
      }
    }
    else if (d.airborneCity) {
      if (action('airborneInfiltrate', [d.airborneCity])) {
        saveAuto(true); render(); notify('敌后奇袭行动完成！');
      }
    }
    else if (d.formation) formationPanel(d.formation);
    else if (d.defenseDesign) defensePanel('design', { unitId: d.defenseDesign });
    else if (d.defenseCommand !== undefined) defensePanel('command');
    else if (d.stageReport !== undefined) stageReport();
    else if (d.clearGroup !== undefined) { rosterGroup = ''; renderInspector(); }
  };
  $('battle-hud').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const d = button.dataset;
    if (d.battleFocus) {
      selectCity(d.battleFocus, false, true);
    } else if (d.battleModal) {
      openBattleModal(d.battleModal);
    } else if (d.battlePosture) {
      const city = d.battleCity;
      if (action('setBattlePosture', [city, d.battlePosture])) {
        saveAuto(true);
        render();
        notify('已切换为「' + ({ balanced: '均衡', assault: '全线突击', envelop: '多路包围', cautious: '谨慎推进', hold: '坚守阵地' }[d.battlePosture]) + '」。');
      }
    } else if (d.battleAction === 'barrage') {
      const city = d.battleCity;
      if (action('commandAbility', ['barrage', { city }])) {
        saveAuto(true);
        render();
        notify(cityName(city) + '方向炮火准备已下达。');
      }
    }
  });
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
    else if (d.defectUnit) {
      openDefectUnitConfirm(d.defectUnit);
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
    else if (d.timedDecision) {
      if (action('launchTimedDecision', [d.timedDecision])) {
        saveAuto(true); render(); notify('限时决议已启动，正在按日推进倒计时。'); politicsPanel();
      }
    }
    else if (d.eventChoice !== undefined && d.eventId) {
      if (action('resolveEventChoice', [d.eventId, Number(d.eventChoice)])) {
        saveAuto(true); dialog.close(); render(); notify('战略抉择已颁布并生效。');
      }
    }
    else if (d.openEventClip) openEventClipboard(d.openEventClip);
    else if (d.modalCycle) {
      const city = d.modalCycle;
      const low = Engine.activeUnits(state).find((u) => !u.parent && u.side === state.player && u.city === city && valueOf(u, 'org', 100) < 45);
      const safe = (cityConnected.get(city) || []).find((cid) => state.owners[cid] === state.player);
      if (low && safe && action('order', [low.id, 'move', safe])) {
        saveAuto(true); render(); openBattleModal(city);
        notify('车轮战换防：已将低组织度部队 ' + low.name + ' 撤往 ' + cityName(safe) + ' 休整。');
      } else {
        notify('暂无可安全撤出的后方友城或低组织度守军。');
      }
    }
    else if (d.reformSpirit) {
      if (action('reformSpirit', [d.reformSpirit])) {
        saveAuto(true); render(); notify('改革推进成功，负面民族精神已削弱。'); politicsPanel();
      }
    }
    else if (d.hireAdvisor) {
      if (action('hireAdvisor', [d.hireAdvisor])) {
        saveAuto(true); render(); notify('军事参谋已任命进入内阁。'); politicsPanel();
      }
    }
    else if (d.designPreset) {
      if (action('applyDivisionPreset', [d.designPreset])) {
        saveAuto(true); render(); notify('已套用经典师编制模板。'); defensePanel('design');
      }
    }
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
    else if (d.airRegion) {
      if (action('setAirRegion', [d.airRegion])) { saveAuto(true); render(); notify('空军战区指派已更新。'); defensePanel('air'); }
    }
    else if (d.doctrine) {
      if (action('setDoctrine', [d.doctrine])) { saveAuto(true); render(); notify('陆军学说已确立！'); defensePanel('doctrine'); }
    }
    else if (d.motorLevel) {
      if (action('setMotorization', [d.motorLevel])) { saveAuto(true); render(); notify('补给枢纽机动化级别已切换。'); logisticsPanel(); }
    }
    else if (d.spyNetwork !== undefined) {
      if (action('buildSpyNetwork', [])) { saveAuto(true); render(); notify('隐蔽战线情报网已扩大！'); defensePanel('intel'); }
    }
    else if (d.cipherBreak !== undefined) {
      if (action('activateCipherBreak', [])) { saveAuto(true); render(); notify('📡 破译决战电文已激活（15 天全军攻防 +15%）！'); defensePanel('intel'); }
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
    else if (d.civilNavalBattle !== undefined) {
      if (action('civilNavalThreeLineBattle', [])) {
        WarAudio.artillery();
        saveAuto(true);
        render();
        notify('🚢✈️ HOI4 三排海战决战已结算，战报已刷新！');
        defensePanel('navy');
      }
    }
    else if (d.navalSave !== undefined) {
      const selectors = [...document.querySelectorAll('[data-sea-zone]')];
      const before = { state: Engine.snapshot(state), timeline: structuredClone(timeline) };
      let changed = 0;
      const failures = [];
      for (const selector of selectors) {
        const zone = selector.dataset.seaZone;
        const current = state.seaZones?.[zone]?.[state.player]?.mission ?? '';
        if (selector.value === current) continue;
        const result = Timeline.apply(timeline, Engine, Data, state, 'setNavalMission', [zone, selector.value]);
        if (result.ok) changed += 1;
        else failures.push(zone + '：' + result.error);
      }
      if (changed) {
        undoStack.push(before);
        if (undoStack.length > undoLimit) undoStack.shift();
        saveAuto(true);
        render();
        defensePanel('navy');
      }
      notify(failures.length ? (changed ? '部分部署成功；' : '') + failures.join('；') : changed ? '海军海域任务已更新。' : '海域任务没有变化。');
    }
    else if (d.groupRoster || d.groupControl) {
      const group = groupsById.get(d.groupRoster || d.groupControl);
      if (!group) return;
      if (d.groupControl && typeof Engine.setGroup === 'function') {
        const wasCurrent = state.group === group.id;
        if (state.player !== group.side) action('setSide', [group.side]);
        action('setGroup', [wasCurrent ? null : group.id]);
        if (!wasCurrent) changeScope('theater', group.region);
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
  $('new-game').onclick = () => openUnifiedCampaignLobby(currentTheaterMode);
  $('mobile-scenarios').onclick = () => openUnifiedCampaignLobby(currentTheaterMode);
  $('all-scenarios').onclick = () => openUnifiedCampaignLobby(currentTheaterMode);
  $('change-side').onclick = switchSide;
  $('defect-btn').onclick = openDefectDialog;
  $('territory-report').onclick = territoryReport;
  $('save-menu').onclick = saves;
  $('economy').onclick = economy;
  $('plans').onclick = plansPanel;
  $('supply').onclick = logisticsPanel;
  $('politics').onclick = politicsPanel;
  $('defense').onclick = () => defensePanel('focus');
  $('air-command').onclick = () => defensePanel('air');
  $('navy-command').onclick = () => defensePanel('navy');
  $('gear').onclick = gear;
  $('history-mode').onclick = historicalEvents;
  $('help').onclick = guide;
  $('tutorial-open').onclick = () => startTutorial(false);
  dialog.addEventListener('cancel', (event) => { if ($('dialog-close').disabled) event.preventDefault(); });
  // 必修教学期间只开放地图、教学卡片与战报操作，完成后恢复全部菜单。
  document.addEventListener('click', (event) => {
    if (!tutorial?.required) return;
    if (event.target.closest('#tutorial-card, #dialog, #map, #command-bar, #pause, #step')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    notify('请先完成当前新手教程。');
  }, true);
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
    setInspectorOpen(inspector.classList.contains('is-hidden') || !inspector.classList.contains('is-open'));
  };
  if ($('global-view')) {
    $('global-view').onclick = () => {
      map.worldView();
      const s = map.globalSummary?.() || {};
      notify('已切至全球战略视角：展示全球 ' + (s.cities || '500+') + ' 座重大城市与 ' + (s.ports || '100+') + ' 座重要港口，以及 ' + (s.deployments || 20) + ' 支全球战略集群布兵态势（点「全国」可一键返回主战场）。');
    };
  }
  $('national-view').onclick = () => changeScope('national');
  $('theater-view').onclick = () => changeScope('theater', citiesById.get(selectedCity)?.region);
  if ($('night-toggle')) {
    $('night-toggle').onclick = () => {
      if (action('setNightMode', [!state.nightMode])) {
        saveAuto(true);
        render();
        notify(state.nightMode ? '已切入夜间视图：驻城待命与休整部队转入篝火帐篷宿营姿态。' : '已切回白昼视图。');
      }
    };
  }
  $('detail-view').onclick = () => map.detail(inspectUnit()?.city || selectedCity);
  $('map-expand').onclick = (event) => {
    const expanded = document.querySelector('.workspace').classList.toggle('map-expanded');
    event.currentTarget.setAttribute('aria-pressed', String(expanded));
    event.currentTarget.textContent = expanded ? '恢复面板' : '展开地图';
    event.currentTarget.title = expanded ? '恢复两侧面板' : '展开地图，隐藏两侧面板';
  };
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
    else if (args.hoiPort !== undefined) {
      const ids = selectedUnits.size ? [...selectedUnits] : (selectedUnit ? [selectedUnit] : []);
      if (action('portGarrisonOrder', [ids])) { saveAuto(true); render(); notify('已派兵专守己方沿海港口并挖战壕。'); }
    }
    else if (args.hoiFallback !== undefined) {
      const ids = selectedUnits.size ? [...selectedUnits] : (selectedUnit ? [selectedUnit] : []);
      if (action('fallbackLineOrder', [ids, []])) { saveAuto(true); render(); notify('已依托黄河/山地建立后撤防线并掘壕固守。'); }
    }
    else if (args.deckHere !== undefined && pendingOrder && inspectUnit()) issue(pendingOrder, inspectUnit().city);
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
  $('hoi-hud-stats')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-open-panel]');
    if (!btn) return;
    if (btn.dataset.openPanel === 'politics') politicsPanel();
    else if (btn.dataset.openPanel === 'production') defensePanel('production');
    else if (btn.dataset.openPanel === 'economy') economy();
    else if (btn.dataset.openPanel === 'supply') logisticsPanel();
    else if (btn.dataset.openPanel === 'intel') defensePanel('intel');
  });
  function openWorldMapPanel(initialMode = 'hybrid', selectedId = 'china') {
    const World = globalThis.CivilWarWorld;
    if (!World) { notify('世界态势图模块未加载。'); return; }
    let mode = initialMode;
    let picked = selectedId;
    const legendHtml = Object.values(World.blocs).map((b) =>
      '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#ded6be;"><i style="width:10px;height:10px;border-radius:2px;background:' + b.color + ';border:1px solid ' + b.border + ';display:inline-block;"></i>' + escape(b.name) + '</span>').join('');
    const body = showDialog('🌍 1946–1953 世界势力与全球地形态势图',
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">'
      + '<div class="hoi-seg-pills">'
      + '<button type="button" data-wm-mode="factions" aria-pressed="' + (mode === 'factions') + '">冷战势力范围</button>'
      + '<button type="button" data-wm-mode="terrain" aria-pressed="' + (mode === 'terrain') + '">全球地形图</button>'
      + '<button type="button" data-wm-mode="hybrid" aria-pressed="' + (mode === 'hybrid') + '">势力 + 地形叠加</button>'
      + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button type="button" class="gold" id="wm-open-ww2">🌐 启动《二战全球战役》HOI4 沙盘</button>'
      + '<button type="button" class="gold" id="wm-open-korea">🇰🇵 启动《抗美援朝》HOI4 全屏沙盘</button>'
      + '</div>'
      + '</div>'
      + '<canvas id="world-map-canvas" width="940" height="450" style="width:100%;height:auto;border-radius:5px;border:1px solid #8f7a52;cursor:pointer;display:block;"></canvas>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0;">' + legendHtml + '</div>'
      + '<div id="wm-dossier" class="hoi-parchment" style="margin-top:4px;"></div>');
    dialog.classList.add('hoi-ww2-full');

    const canvas = body.querySelector('#world-map-canvas');
    const dossier = body.querySelector('#wm-dossier');
    let hitBoxes = [];
    const renderDossier = (nid) => {
      const n = World.nations.find((x) => x.id === nid) || World.nations[0];
      const b = World.blocs[n.bloc] || {};
      dossier.innerHTML = '<h4>' + escape(n.name) + ' · 首都/枢纽：' + escape(n.capital) + '（' + escape(b.name || '') + '）</h4>'
        + '<p>' + escape(n.summary) + '</p>'
        + (n.clickableKorea ? '<div style="margin-top:6px;"><button type="button" class="gold" id="wm-korea-inline">⚔ 进入朝鲜战争参战国编制与 3D 武器/航母库</button></div>' : '');
      dossier.querySelector('#wm-korea-inline')?.addEventListener('click', () => openKoreanWarPanel('pva', 'carrier'));
    };
    const redraw = () => {
      hitBoxes = World.renderWorldCanvas(canvas, mode, picked);
      renderDossier(picked);
    };
    redraw();
    body.querySelectorAll('[data-wm-mode]').forEach((btn) => {
      btn.onclick = () => {
        mode = btn.dataset.wmMode;
        body.querySelectorAll('[data-wm-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        redraw();
      };
    });
    body.querySelector('#wm-open-korea').onclick = () => openKoreanWarPanel('pva', 'carrier');
    body.querySelector('#wm-open-ww2')?.addEventListener('click', () => openWW2LeaderSelect('china_united', 'all'));
    canvas.onclick = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      const hit = hitBoxes.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (hit) {
        picked = hit.id;
        redraw();
        if (hit.nation.clickableKorea) notify('已选中朝鲜半岛：可点击下方按钮进入《抗美援朝》参战国与航母/喷气机武器库。');
      }
    };
  }

  let kwState = null;
  let kwTimer = null;
  let kwUndoStack = [];
  let kwSpeed = 1;

  function openKoreanWarPanel(factionId = 'pva', previewKind = 'carrier', initialTab = 'sim', scenarioId = null) {
    const Korea = globalThis.KoreanWarData;
    const KSim = globalThis.CivilWarWorld?.KoreanWarSim;
    if (!Korea || !KSim) { notify('朝鲜战争数据或沙盘引擎未加载。'); return; }
    if (kwTimer) { clearInterval(kwTimer); kwTimer = null; }
    const f = Korea.factions[factionId] || Korea.factions.pva;
    const desiredSide = f.side === 'un_coalition' ? 'un_coalition' : 'dprk_coalition';
    if (!kwState || (scenarioId && kwState.scenarioId !== scenarioId)) {
      kwState = KSim.createKoreanWarGame(Korea, scenarioId || 'kw-1950-10', desiredSide);
      kwUndoStack = [];
    } else if (factionId) {
      kwState.player = desiredSide;
    }
    const st = kwState;
    let curTab = initialTab;
    let selectedArmy = st.armies.find((a) => a.side === st.player && a.strength > 0)?.id || null;
    let selectedKwCity = null;
    let show3D = true;
    let kwZoom = 1;
    let drawFrontMode = false;
    let drawnArrow = null;

    const pushKwUndo = () => {
      kwUndoStack.push(JSON.stringify(st));
      if (kwUndoStack.length > 25) kwUndoStack.shift();
    };

    const sideTabs = '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px;">'
      + '<div style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:4px;background:rgba(20,27,23,0.92);border:1px solid #9c8659;font-size:12px;color:#ffe699;">'
      + '<span>🔒 <b>本局锁定阵营：</b>' + f.flag + ' ' + escape(f.name) + ' · 最高统帅：' + escape(f.commander) + '</span>'
      + '<span style="color:#a8b8a4;font-size:11px;">（选定后全程坚守本阵营）</span></div>'
      + '<div style="display:flex;gap:5px;flex-wrap:wrap;">'
      + '<button type="button" id="kw-switch-side" style="font-size:11.5px;">🎖️ 结束本局 / 换阵营重开</button>'
      + '<button type="button" id="kw-audio-btn" aria-pressed="' + ww2AudioOn + '" style="font-size:11.5px;">' + (ww2AudioOn ? '🔊 战争音效:开' : '🔇 战争音效:关') + '</button>'
      + '<button type="button" class="gold" id="kw-goto-ww2" style="font-size:11.5px;">🌐 切至二战全球</button>'
      + '</div></div>';

    const mainTabs = '<div class="hoi-start-tabs" style="margin-bottom:5px;">'
      + [['sim', '⚔️ 朝鲜战场沙盘'], ['focus', '🏛️ 焦点国策树'], ['arsenal', '🎖️ 参战国编制与 3D 武器库']].map(([k, l]) =>
        '<button type="button" data-kw-tab="' + k + '" aria-pressed="' + (curTab === k) + '" style="font-size:11.5px;">' + l + '</button>').join('')
      + '</div>';

    const scTabs = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px;">'
      + Korea.scenarios.map((sc) => '<button type="button" data-kw-sc="' + sc.id + '" aria-pressed="' + (st.scenarioId === sc.id) + '" style="font-size:11px;padding:3px 8px;">📜 ' + escape(sc.date.slice(0, 7)) + ' ' + escape(sc.title.split('（')[0]) + '</button>').join('')
      + '</div>';

    const scaleIcons = (n, per) => Math.max(1, Math.ceil(n / per));
    const corpsRows = f.corps.map((c) => '<tr><td><strong>' + escape(c.name) + '</strong></td><td>' + escape(c.commander)
      + '</td><td>' + format(c.strength) + ' 人（' + scaleIcons(c.strength, 5000) + '兵标）</td><td>'
      + escape(c.divisions.join('、')) + '</td><td>' + escape(c.role) + '</td></tr>').join('');
    const equipTable = (title, list, cols, per) => '<h4 style="margin:10px 0 4px;color:#f4dfaa;">' + title + '</h4>'
      + '<table class="dialog-table"><thead><tr>' + cols.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
      + list.map((item) => '<tr><td><strong>' + escape(item.name) + '</strong></td><td>' + format(item.qty)
        + (per ? '（' + scaleIcons(item.qty, per) + '标）' : '') + '</td><td>' + escape(item.caliber || item.armor || item.speed || item.class || '')
        + (item.gun ? ' / ' + escape(item.gun) : '') + '</td><td>' + escape(item.role) + '</td></tr>').join('') + '</tbody></table>';
    const previewTabs = [
      ['carrier', '🚢 埃塞克斯航母'], ['battleship', '⚓ 密苏里战列舰'], ['mig15', '✈️ 苏式米格-15'],
      ['f86', '✈️ 美军 F-86佩刀'], ['b29', '🛫 B-29轰炸机'], ['t34', '🚜 苏式 T-34/85'],
      ['m26', '🚜 美军 M26潘兴'], ['katyusha', '🚀 BM-13喀秋莎'], ['artillery', '💣 155/122重炮'], ['human', '🎖️ 步兵兵模'],
    ];
    const sovietActionBar = '<div class="hoi-cipher-box" style="margin:6px 0 10px;"><header style="display:flex;justify-content:space-between;align-items:center;">'
      + '<strong style="color:#f5e1b0;">🇷🇺 历史苏械配置与苏联空军/重炮支援调用（可同步支援国内内战主战场）</strong>'
      + '<span class="plan-status is-active">第64航空军 · 60个苏械师援华</span></header>'
      + '<div class="unit-actions">'
      + '<button type="button" class="gold" data-soviet-aid="mig_corridor">✈️ 调用米格-15机群（25政点）</button>'
      + '<button type="button" class="gold" data-soviet-aid="katyusha_salvo">🚀 喀秋莎火箭炮齐射（25指点）</button>'
      + '<button type="button" data-soviet-aid="soviet_armor_aid">🚜 换装苏械步炮坦（35政点）</button>'
      + '</div></div>';

    const arsenalHtml = sovietActionBar
      + '<div style="display:grid;grid-template-columns:255px minmax(0,1fr);gap:12px;align-items:start;margin:6px 0 10px;">'
      + '<div style="padding:8px;border-radius:6px;border:1px solid #8f7a52;background:#161d19;text-align:center;">'
      + '<canvas id="kw-3d-canvas" width="235" height="235" style="width:100%;height:auto;border-radius:4px;background:#101715;display:block;"></canvas>'
      + '<div style="display:flex;justify-content:center;gap:6px;margin:6px 0 4px;">'
      + '<button type="button" id="kw-act-toggle" style="font-size:11px;padding:3px 9px;">🔥 切换作战/开火姿态</button></div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;justify-content:center;">'
      + previewTabs.map(([k, lbl]) => '<button type="button" data-kw-model="' + k + '" aria-pressed="' + (previewKind === k)
        + '" style="font-size:10.5px;padding:3px 6px;">' + lbl + '</button>').join('')
      + '</div></div>'
      + '<div class="hoi-parchment">'
      + '<h4>' + escape(f.name) + ' · 最高统帅：' + escape(f.commander) + '</h4>'
      + '<p><b>峰值参战总兵力：</b>' + format(f.totalPeakPersonnel) + ' 人（首批投入 ' + format(f.initialEntryPersonnel) + ' 人）</p>'
      + '<p><b>核心作战学说：</b>' + escape(f.doctrine) + '</p>'
      + '<p><b>步兵主战轻武器：</b>' + escape(f.arsenal.infantryWeapons.join(' · ')) + '</p>'
      + '<p style="margin-top:4px;">' + escape(f.summary) + '</p>'
      + '</div></div>'
      + '<h4 style="margin:6px 0 4px;color:#f4dfaa;">核心军/师级作战编制（按 5,000 人 = 1 兵标换算）</h4>'
      + '<table class="dialog-table"><thead><tr><th>部队番号</th><th>主官</th><th>兵力 / 图标</th><th>下辖师/团</th><th>作战定位</th></tr></thead><tbody>' + corpsRows + '</tbody></table>'
      + equipTable('⚓ 航空母舰与海军舰艇（1 舰 = 1 标）', f.arsenal.navy, ['舰级名称', '数量 / 标', '舰种', '任务定位'], 1)
      + equipTable('✈️ 喷气战机与作战飞机（3 机 = 1 标）', f.arsenal.aircraft, ['机型', '数量 / 标', '极速', '作战角色'], 3)
      + equipTable('🚜 坦克与装甲车辆（5 辆 = 1 标）', f.arsenal.tanks, ['车型', '数量 / 标', '装甲 / 主炮', '作战角色'], 5)
      + equipTable('💣 重炮、火箭炮与火炮', f.arsenal.artillery, ['火炮型号', '数量', '口径', '火力定位'], 0);

    const body = showDialog('🇰🇵 抗美援朝 · 朝鲜战争（1950–1953）HOI4 全屏战略指挥室',
      sideTabs + mainTabs
      + '<div id="kw-hud-bar" class="hoi-ww2-topbar"></div>'
      + '<div id="kw-tab-sim" ' + (curTab === 'sim' ? '' : 'hidden') + '>'
      + scTabs
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:5px;">'
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;">'
      + '<button type="button" id="kw-draw-front" class="gold" aria-pressed="false" style="font-size:11px;">✏️ 画进攻战线</button>'
      + '<button type="button" id="kw-3d-toggle" aria-pressed="true" style="font-size:11px;">🎖️ 3D兵模</button>'
      + '<button type="button" id="kw-ai-toggle" aria-pressed="' + Boolean(st.aiDelegate) + '" style="font-size:11px;">🤖 委任AI</button>'
      + '<button type="button" id="kw-undo-btn" style="font-size:11px;">↩️ 撤回</button>'
      + '</div>'
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;">'
      + '<button type="button" id="kw-play-btn" class="gold" style="font-size:11px;">▶ 自动</button>'
      + [1, 2, 3, 5].map((sp) => '<button type="button" data-kw-spd="' + sp + '" aria-pressed="' + (kwSpeed === sp) + '" style="font-size:11px;">' + sp + '×</button>').join('')
      + '<button type="button" id="kw-step-1" style="font-size:11px;">+1天</button>'
      + '<button type="button" id="kw-step-7" style="font-size:11px;">+7天</button>'
      + '</div></div>'
      + '<div class="hoi-ww2-stage">'
      + '<canvas id="kw-map-canvas" width="1240" height="470" style="width:100%;height:auto;display:block;cursor:pointer;"></canvas>'
      + '<div id="kw-general-dock" class="hoi-ww2-gen-overlay"></div>'
      + '</div>'
      + '<div id="kw-cmd-panel" style="display:grid;grid-template-columns:1.35fr 1fr;gap:8px;margin-top:6px;"></div>'
      + '</div>'
      + '<div id="kw-tab-focus" ' + (curTab === 'focus' ? '' : 'hidden') + '></div>'
      + '<div id="kw-tab-arsenal" ' + (curTab === 'arsenal' ? '' : 'hidden') + '>' + arsenalHtml + '</div>');
    dialog.classList.add('hoi-ww2-full');

    const hudBar = body.querySelector('#kw-hud-bar');
    const mapCanvas = body.querySelector('#kw-map-canvas');
    const genDock = body.querySelector('#kw-general-dock');
    const cmdPanel = body.querySelector('#kw-cmd-panel');
    const focusPanel = body.querySelector('#kw-tab-focus');
    let hits = { cityHits: [], armyHits: [] };

    const renderHud = () => {
      const s = st.sides[st.player];
      const owned = Object.values(st.owners).filter((o) => o === st.player).length;
      const totalStr = st.armies.filter((a) => a.side === st.player && a.strength > 0).reduce((sum, a) => sum + a.strength, 0);
      hudBar.innerHTML = '<div><strong style="font-size:13.5px;color:#ffe69b;">' + s.flag + ' ' + escape(s.name) + '</strong>'
        + ' · <span style="color:#d6ceb5;">' + escape(st.scenarioTitle) + '</span> · <b style="color:#ffe69b;">' + globalThis.CivilWarWorld.WW2Sim.formatDate(st.date) + '</b></div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:5px;">'
        + '<span class="hoi-ww2-stat-chip">🏛政 <b>' + Math.floor(s.pp) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">🎖指 <b>' + Math.floor(s.cp) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">✈️制空 <b>' + Math.round(s.airPower) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">⚓制海 <b>' + Math.round(s.navalPower) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">🏆战分 <b>' + Math.floor(s.warScore) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">👥兵 <b>' + format(totalStr) + '</b>(' + owned + '/18城)</span>'
        + '<span class="hoi-ww2-stat-chip">🚜<b>' + s.stock.tanks + '</b> 💣<b>' + s.stock.artillery + '</b> ✈️<b>' + s.stock.planes + '</b> ⚓<b>' + s.stock.ships + '</b></span>'
        + '</div>';
    };

    const renderFocusTab = () => {
      const s = st.sides[st.player];
      const list = Korea.focusTrees?.[st.player] || [];
      const rootFo = list[0], branches = list.slice(1);
      const card = (fo) => {
        if (!fo) return '';
        const done = s.completedFocuses.includes(fo.id);
        const act = s.activeFocus?.id === fo.id;
        return '<article class="hoi-focus-node ' + (done ? 'is-done' : act ? 'is-active' : '') + '">'
          + '<strong style="color:#f6e2b0;font-size:12.5px;">' + (done ? '✔ ' : act ? '⏳ ' : '★ ') + escape(fo.name) + '（' + fo.days + '天）</strong>'
          + '<p class="subtext" style="margin:4px 0;font-size:11px;">' + escape(fo.desc) + '</p>'
          + '<button type="button" data-kw-focus="' + fo.id + '" ' + (done ? 'disabled' : '') + ' style="font-size:11px;width:100%;">' + (done ? '已完成国策' : act ? '推进中（剩' + s.activeFocus.left + '天）' : '启动此国策') + '</button></article>';
      };
      focusPanel.innerHTML = '<div class="hoi-focus-tree-wrap">'
        + '<svg class="hoi-focus-tree-svg" viewBox="0 0 800 260" preserveAspectRatio="none">'
        + '<line x1="400" y1="95" x2="245" y2="155" stroke="#bfa260" stroke-width="2.2" stroke-dasharray="5,4"/>'
        + '<line x1="400" y1="95" x2="555" y2="155" stroke="#bfa260" stroke-width="2.2" stroke-dasharray="5,4"/>'
        + '<line x1="365" y1="195" x2="435" y2="195" stroke="#e06c55" stroke-width="1.8" stroke-dasharray="4,3"/>'
        + '<text x="400" y="186" fill="#f09c84" font-size="10" text-anchor="middle">⚔ 战略分支</text>'
        + '</svg>'
        + '<div style="position:relative;z-index:1;text-align:center;color:#f5dfaa;font-weight:700;font-size:12.5px;margin-bottom:4px;">⭐ 朝鲜战场 HOI4 国家焦点树（' + escape(s.short) + '）</div>'
        + '<div class="hoi-focus-row">' + card(rootFo) + '</div>'
        + '<div class="hoi-focus-row">' + branches.map(card).join('') + '</div>'
        + '</div>';
      focusPanel.querySelectorAll('[data-kw-focus]').forEach((b) => b.onclick = () => {
        const r = KSim.startKoreanWarFocus(Korea, st, st.player, b.dataset.kwFocus);
        if (!r.ok) notify(r.error); else { WarAudio.click(); redrawAll(); }
      });
    };

    const renderCmdPanel = () => {
      const myArmies = st.armies.filter((a) => a.side === st.player && a.strength > 0);
      genDock.innerHTML = myArmies.map((a) => '<button type="button" class="hoi-ww2-gen-card" data-kw-pick-army="' + a.id + '" aria-pressed="' + (a.id === selectedArmy)
        + '"><span>🎖️</span><span><b>' + escape(a.commander) + '</b> · ' + Math.round(a.strength / 1000) + 'K (' + escape(Korea.cities.find((c) => c.id === a.city)?.name || a.city) + ')</span></button>').join('');
      genDock.querySelectorAll('[data-kw-pick-army]').forEach((b) => b.onclick = () => {
        selectedArmy = b.dataset.kwPickArmy; WarAudio.click(); redrawAll();
      });
      const selA = st.armies.find((a) => a.id === selectedArmy && a.strength > 0) || myArmies[0];
      if (selA) selectedArmy = selA.id;
      const orderDesc = selA ? (selA.order === 'attack' ? '⚔️ 进攻 ' + (Korea.cities.find((c) => c.id === selA.target)?.name || selA.target)
        : selA.order === 'move' ? '🚂 调动 ' + (Korea.cities.find((c) => c.id === selA.target)?.name || selA.target) : '🛡 驻防/掘壕') : '未选中';
      cmdPanel.innerHTML = '<div class="hoi-cipher-box" style="margin:0;">'
        + '<header><strong style="color:#f5e1b0;">🎖️ 军团指挥与朝鲜战区特色决战指令</strong></header>'
        + (selA ? '<p class="subtext" style="margin:4px 0;">当前选中：<b>' + escape(selA.name) + '</b>（' + escape(selA.commander) + '）· 兵力 ' + format(selA.strength) + ' · 组织度 ' + Math.round(selA.org) + '% · ' + orderDesc + '</p>' : '')
        + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;">'
        + '<button type="button" class="gold" data-kw-spec="katyusha" style="font-size:11px;">🚀 喀秋莎齐射(20指)</button>'
        + '<button type="button" class="gold" data-kw-spec="mig_corridor" style="font-size:11px;">✈️ 米格走廊截击(20政)</button>'
        + '<button type="button" class="gold" data-kw-spec="inchon_landing" style="font-size:11px;">🚢 航母两栖登陆(25指)</button>'
        + '<button type="button" data-kw-spec="tunnel_fort" style="font-size:11px;">⛰️ 上甘岭坑道网(15政)</button>'
        + '<button type="button" data-kw-spec="van_fleet" style="font-size:11px;">💣 范佛里特重炮(20指)</button>'
        + '</div></div>'
        + '<div class="hoi-cipher-box" style="margin:0;max-height:112px;overflow:auto;">'
        + '<header><strong style="color:#f5e1b0;">📜 朝鲜战区实时战报</strong></header>'
        + '<div style="font-size:11px;line-height:1.45;margin-top:4px;">' + st.log.slice(-6).reverse().map((l) => '<div>' + escape(l) + '</div>').join('') + '</div></div>';
      cmdPanel.querySelectorAll('[data-kw-spec]').forEach((b) => b.onclick = () => {
        pushKwUndo();
        const k = b.dataset.kwSpec;
        const r = KSim.triggerKoreanWarSpecial(Korea, st, st.player, k, selectedKwCity);
        if (!r.ok) notify(r.error);
        else {
          if (k === 'katyusha' || k === 'van_fleet' || k === 'inchon_landing') WarAudio.artillery();
          else WarAudio.bugle();
          redrawAll();
        }
      });
    };

    const redrawAll = () => {
      renderHud();
      if (curTab === 'sim' && mapCanvas) {
        hits = KSim.renderKoreanWarCanvas(mapCanvas, Korea, st, {
          selectedArmy, selectedCity: selectedKwCity, show3D, zoom: kwZoom, renderer3D: preview3DRenderer, drawnArrow, now: Date.now(),
        });
        renderCmdPanel();
      } else if (curTab === 'focus') {
        renderFocusTab();
      }
    };
    redrawAll();

    // 滚轮缩放 + 右键直下进攻命令（与国共内战底层操控一致）
    mapCanvas?.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      kwZoom = Math.max(1, Math.min(2.6, kwZoom * (ev.deltaY < 0 ? 1.15 : 0.87)));
      redrawAll();
    }, { passive: false });
    mapCanvas?.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      const cHit = hits.cityHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (cHit && selectedArmy) {
        pushKwUndo();
        const r = KSim.issueKoreanWarOrder(Korea, st, selectedArmy, 'attack', cHit.id);
        if (r.ok) { WarAudio.bugle(); notify('⚔ 右键快捷命令：向 ' + cHit.city.name + ' 发起进攻/铁路机动！'); redrawAll(); }
        else notify(r.error);
      }
    });
    body.querySelector('#kw-switch-side')?.addEventListener('click', () => {
      const nextFac = st.player === 'dprk_coalition' ? 'usa' : 'pva';
      kwState = null;
      openKoreanWarPanel(nextFac, previewKind, 'sim', st.scenarioId);
      notify('已结束上一局，重新开启新阵营抗美援朝战役！');
    });

    // 拖拽手绘进攻战线箭头
    body.querySelector('#kw-draw-front')?.addEventListener('click', (ev) => {
      drawFrontMode = !drawFrontMode;
      ev.currentTarget.setAttribute('aria-pressed', String(drawFrontMode));
      ev.currentTarget.textContent = drawFrontMode ? '✏️ 正在画线(拖动)' : '✏️ 画进攻战线';
      WarAudio.click();
    });
    mapCanvas?.addEventListener('mousedown', (ev) => {
      if (!drawFrontMode) return;
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      drawnArrow = { x1: x, y1: y, x2: x, y2: y };
      redrawAll();
    });
    mapCanvas?.addEventListener('mousemove', (ev) => {
      if (!drawFrontMode || !drawnArrow) return;
      const rect = mapCanvas.getBoundingClientRect();
      drawnArrow.x2 = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      drawnArrow.y2 = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      redrawAll();
    });
    mapCanvas?.addEventListener('mouseup', () => {
      if (!drawFrontMode || !drawnArrow) return;
      const endX = drawnArrow.x2, endY = drawnArrow.y2;
      const nearCity = hits.cityHits.slice().sort((a, b) => Math.hypot(a.x + 16 - endX, a.y + 12 - endY) - Math.hypot(b.x + 16 - endX, b.y + 12 - endY))[0];
      if (nearCity && selectedArmy) {
        pushKwUndo();
        const r = KSim.issueKoreanWarOrder(Korea, st, selectedArmy, 'attack', nearCity.id);
        if (r.ok) { WarAudio.bugle(); notify('⚔ 手绘进攻箭头已下达：向 ' + nearCity.city.name + ' 发起突击！'); }
        else notify(r.error);
      }
      drawnArrow = null; drawFrontMode = false;
      const btn = body.querySelector('#kw-draw-front');
      if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '✏️ 画进攻战线'; }
      redrawAll();
    });
    mapCanvas?.addEventListener('click', (ev) => {
      if (drawFrontMode) return;
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      const aHit = hits.armyHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (aHit && aHit.army.side === st.player) { selectedArmy = aHit.id; WarAudio.click(); redrawAll(); return; }
      const cHit = hits.cityHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (cHit) {
        selectedKwCity = cHit.id;
        if (selectedArmy) {
          pushKwUndo();
          const r = KSim.issueKoreanWarOrder(Korea, st, selectedArmy, 'attack', cHit.id);
          if (r.ok) { WarAudio.bugle(); notify('已向 ' + cHit.city.name + ' 下达进攻/铁路机动指令！'); }
          else notify(r.error);
        }
        redrawAll();
      }
    });

    body.querySelectorAll('[data-kw-faction]').forEach((btn) => btn.onclick = () => openKoreanWarPanel(btn.dataset.kwFaction, previewKind, curTab, st.scenarioId));
    body.querySelectorAll('[data-kw-sc]').forEach((btn) => btn.onclick = () => openKoreanWarPanel(f.id, previewKind, 'sim', btn.dataset.kwSc));
    body.querySelectorAll('[data-kw-tab]').forEach((btn) => btn.onclick = () => {
      curTab = btn.dataset.kwTab;
      body.querySelectorAll('[data-kw-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      body.querySelector('#kw-tab-sim').hidden = curTab !== 'sim';
      body.querySelector('#kw-tab-focus').hidden = curTab !== 'focus';
      body.querySelector('#kw-tab-arsenal').hidden = curTab !== 'arsenal';
      redrawAll();
    });
    body.querySelector('#kw-audio-btn')?.addEventListener('click', (ev) => {
      ww2AudioOn = !ww2AudioOn;
      ev.currentTarget.setAttribute('aria-pressed', String(ww2AudioOn));
      ev.currentTarget.textContent = ww2AudioOn ? '🔊 战争音效:开' : '🔇 战争音效:关';
      if ($('global-audio-toggle')) { $('global-audio-toggle').setAttribute('aria-pressed', String(ww2AudioOn)); $('global-audio-toggle').textContent = ww2AudioOn ? '🔊 音效' : '🔇 静音'; }
      if (ww2AudioOn) WarAudio.click();
    });
    body.querySelector('#kw-goto-ww2')?.addEventListener('click', () => openWW2LeaderSelect('roosevelt', 'all'));
    body.querySelector('#kw-3d-toggle')?.addEventListener('click', (ev) => { show3D = !show3D; ev.currentTarget.setAttribute('aria-pressed', String(show3D)); redrawAll(); });
    body.querySelector('#kw-ai-toggle')?.addEventListener('click', (ev) => { st.aiDelegate = !st.aiDelegate; ev.currentTarget.setAttribute('aria-pressed', String(st.aiDelegate)); });
    body.querySelector('#kw-undo-btn')?.addEventListener('click', () => {
      if (!kwUndoStack.length) { notify('当前没有可撤回的步骤。'); return; }
      kwState = JSON.parse(kwUndoStack.pop());
      openKoreanWarPanel(f.id, previewKind, curTab, kwState.scenarioId);
    });
    body.querySelectorAll('[data-kw-spd]').forEach((b) => b.onclick = () => {
      kwSpeed = Number(b.dataset.kwSpd);
      body.querySelectorAll('[data-kw-spd]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#kw-step-1')?.addEventListener('click', () => { pushKwUndo(); KSim.stepKoreanWarDay(Korea, st, 1); redrawAll(); });
    body.querySelector('#kw-step-7')?.addEventListener('click', () => { pushKwUndo(); KSim.stepKoreanWarDay(Korea, st, 7); redrawAll(); });
    body.querySelector('#kw-play-btn')?.addEventListener('click', (ev) => {
      if (kwTimer) { clearInterval(kwTimer); kwTimer = null; ev.currentTarget.textContent = '▶ 自动'; }
      else {
        ev.currentTarget.textContent = '⏸ 暂停';
        kwTimer = setInterval(() => {
          if (!dialog.open || !document.body.contains(mapCanvas)) { clearInterval(kwTimer); kwTimer = null; return; }
          KSim.stepKoreanWarDay(Korea, st, kwSpeed);
          redrawAll();
        }, 420);
      }
    });

    // 武器库 3D 展示台与主战场苏援按钮
    let activeModel = previewKind;
    let combatPose = false;
    body.querySelector('#kw-act-toggle')?.addEventListener('click', (ev) => {
      combatPose = !combatPose;
      ev.currentTarget.textContent = combatPose ? '🛑 切回静态检视' : '🔥 切换作战/开火姿态';
    });
    body.querySelectorAll('[data-soviet-aid]').forEach((btn) => {
      btn.onclick = () => {
        const kind = btn.dataset.sovietAid;
        const targetCity = state.owners[selectedCity] !== state.player ? selectedCity
          : (Object.keys(state.battles || {})[0] || Data.cities.find((c) => state.owners[c.id] !== state.player)?.id);
        if (action('callSovietSupport', [kind, targetCity])) {
          if (kind === 'katyusha_salvo') WarAudio.artillery(); else WarAudio.bugle();
          saveAuto(true); render();
          notify(kind === 'mig_corridor' ? '✈️ 苏联米格-15 机群已入列掩护米格走廊！'
            : kind === 'katyusha_salvo' ? '🚀 苏式喀秋莎火箭炮齐射已覆盖 ' + cityName(targetCity) + '！'
              : '🚜 苏械步枪、122mm 榴弹炮与 T-34/85 坦克已入库！');
        }
      };
    });
    body.querySelectorAll('[data-kw-model]').forEach((btn) => {
      btn.onclick = () => {
        activeModel = btn.dataset.kwModel;
        body.querySelectorAll('[data-kw-model]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      };
    });
    const kwCanvas = body.querySelector('#kw-3d-canvas');
    if (kwCanvas && preview3DRenderer) {
      const kctx = kwCanvas.getContext('2d');
      const renderSide = f.side === 'dprk_coalition' ? 'ccp' : 'roc';
      const spin = (t) => {
        if (!document.body.contains(kwCanvas) || !dialog.open) return;
        kctx.clearRect(0, 0, kwCanvas.width, kwCanvas.height);
        const orbit = (t * 0.00055) % (Math.PI * 2);
        const act = combatPose ? 'attack' : (activeModel === 'mig15' || activeModel === 'f86' || activeModel === 'b29' ? 'march' : 'idle');
        kctx.drawImage(preview3DRenderer.frame(renderSide, true, t, activeModel, act, '', orbit), 0, 0, kwCanvas.width, kwCanvas.height);
        requestAnimationFrame(spin);
      };
      requestAnimationFrame(spin);
    }
  }

  let ww2State = null;
  let ww2Timer = null;
  let ww2UndoStack = [];
  let ww2Speed = 1;
  let ww2AudioOn = true;

  // 纯离线 WebAudio 战争音效合成器（军号/炮火/核爆警报/黄铜点击，零外部文件依赖）
  const WarAudio = (() => {
    let ctx = null;
    const ensure = () => {
      if (!ww2AudioOn) return null;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    };
    const tone = (freq, dur, type = 'triangle', vol = 0.08, delay = 0, endFreq = null) => {
      const c = ensure();
      if (!c) return;
      const now = c.currentTime + delay;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(now); osc.stop(now + dur + 0.02);
    };
    return {
      click: () => tone(520, 0.055, 'triangle', 0.04, 0, 310),
      bugle: () => { tone(392, 0.16, 'sawtooth', 0.05, 0); tone(523, 0.18, 'sawtooth', 0.06, 0.14); tone(659, 0.32, 'sawtooth', 0.06, 0.30); },
      artillery: () => { tone(135, 0.36, 'sawtooth', 0.09, 0, 36); tone(95, 0.45, 'sine', 0.11, 0.06, 28); },
      nuke: () => {
        // 防空警报 + 2.3秒后低频核爆震撼轰鸣
        tone(440, 0.85, 'sawtooth', 0.06, 0, 780);
        tone(780, 0.90, 'sawtooth', 0.05, 0.85, 420);
        tone(110, 1.8, 'sawtooth', 0.13, 2.25, 24);
        tone(68, 2.1, 'sine', 0.16, 2.28, 20);
      },
    };
  })();

  dialog.addEventListener('close', () => {
    dialog.classList.remove('hoi-ww2-full');
    if (ww2Timer) { clearInterval(ww2Timer); ww2Timer = null; }
    if (kwTimer) { clearInterval(kwTimer); kwTimer = null; }
  });

  function openWW2LeaderSelect(leaderId = 'roosevelt', theaterFilter = 'all') {
    const WW2 = globalThis.WW2Data;
    if (!WW2 || !WW2.leaders) { notify('二战领导人与战役模块未加载。'); return; }
    if (ww2Timer) { clearInterval(ww2Timer); ww2Timer = null; }
    let pickedLeader = WW2.leaders.find((l) => l.id === leaderId) || WW2.leaders[0];
    let filter = theaterFilter;

    const renderLobby = () => {
      const fac = WW2.factions[pickedLeader.nation];
      const recSet = new Set(pickedLeader.recommended || []);
      const filteredScenarios = WW2.scenarios.filter((s) => filter === 'all' || s.theaterTag === filter)
        .sort((a, b) => Number(recSet.has(b.id)) - Number(recSet.has(a.id)));

      const leaderCards = WW2.leaders.map((l) => {
        const f = WW2.factions[l.nation];
        const active = l.id === pickedLeader.id;
        return '<button type="button" data-ww2-pick-leader="' + l.id + '" aria-pressed="' + active + '" '
          + 'style="display:flex;align-items:center;gap:10px;text-align:left;padding:8px 10px;width:100%;border-radius:6px;'
          + 'border:1px solid ' + (active ? '#f0cf7b' : 'rgba(156,134,89,0.35)') + ';background:' + (active ? 'rgba(92,72,26,0.55)' : 'rgba(20,26,22,0.85)') + ';">'
          + '<span style="width:42px;height:42px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none;'
          + 'background:' + l.accent + ';border:2px solid #ecd08b;color:#fff8e3;font-weight:700;font-size:12px;">' + escape(l.monogram) + '</span>'
          + '<span style="min-width:0;"><strong style="display:block;color:#f7e4b2;font-size:13px;">' + f.flag + ' ' + escape(l.name) + '</strong>'
          + '<small style="display:block;color:#c9c2ad;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escape(f.short + ' · ' + l.trait) + '</small></span></button>';
      }).join('');

      const filterBar = [['all', '🌍 全部16大战役'], ['europe', '🇪🇺 欧洲大战(6)'], ['china', '🇨🇳 中国战场(4)'], ['pacific', '⚓ 太平洋战场(4)'], ['africa', '🏜️ 非洲战场(2)']]
        .map(([k, lbl]) => '<button type="button" data-ww2-filter="' + k + '" aria-pressed="' + (filter === k) + '" style="font-size:11px;padding:3px 8px;">' + lbl + '</button>').join('');

      const scCards = filteredScenarios.map((sc) => {
        const isRec = recSet.has(sc.id);
        return '<article class="hoi-doctrine-card" style="padding:8px 10px;display:flex;flex-direction:column;justify-content:space-between;gap:6px;'
          + (isRec ? 'border-color:#e8c772;' : '') + '">'
          + '<div><div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">'
          + '<strong style="color:#f6e2b0;font-size:12.5px;">' + escape(sc.title) + '</strong>'
          + (isRec ? '<span class="plan-status is-active" style="font-size:10px;">★ 推荐</span>' : '') + '</div>'
          + '<div class="subtext" style="font-size:11px;margin:2px 0;">开战日期：' + escape(sc.date) + '</div>'
          + '<p class="subtext" style="margin:0;font-size:11.5px;line-height:1.45;">' + escape(sc.summary) + '</p></div>'
          + '<button type="button" class="gold" data-ww2-launch="' + sc.id + '" style="font-size:11.5px;padding:4px 8px;width:100%;">⚔ 率领 ' + escape(fac.short) + ' 投入此战</button>'
          + '</article>';
      }).join('');

      const body = showDialog('🎖️ 第二次世界大战（1937–1945）· 选择国家领导人与历史战役',
        '<div style="display:grid;grid-template-columns:285px minmax(0,1fr);gap:14px;align-items:start;">'
        + '<div style="display:flex;flex-direction:column;gap:6px;">'
        + '<div class="subtext" style="color:#f0d89a;font-weight:600;">第一步：选择你要扮演的国家领导人</div>'
        + leaderCards
        + '</div>'
        + '<div>'
        + '<div class="hoi-parchment" style="margin-bottom:10px;padding:10px 12px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">'
        + '<h4 style="margin:0;">' + fac.flag + ' ' + escape(pickedLeader.name) + ' · ' + escape(pickedLeader.title) + '</h4>'
        + '<button type="button" id="ww2-lobby-arsenal" style="font-size:11.5px;padding:3px 9px;">🎖️ 先检视 ' + escape(fac.short) + ' 3D 武器库</button>'
        + '</div>'
        + '<p style="margin:4px 0;font-style:italic;color:#4a3c22;">' + escape(pickedLeader.quote) + '</p>'
        + '<p style="margin:2px 0;font-size:12px;"><b>领导人特质：</b>' + escape(pickedLeader.trait) + ' · <b>民/军/坞：</b>' + fac.industry.civ + '/' + fac.industry.mil + '/' + fac.industry.dock + ' · <b>峰值兵力：</b>' + format(fac.peakPersonnel) + ' 人</p>'
        + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;margin-bottom:8px;">'
        + '<span class="subtext" style="color:#f0d89a;font-weight:600;">第二步：选择你要指挥的历史战役（共 16 场四大战场大战）</span>'
        + '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + filterBar + '</div>'
        + '</div>'
        + '<div class="hoi-doctrine-grid" style="max-height:430px;overflow:auto;padding-right:4px;">' + scCards + '</div>'
        + '</div></div>');

      body.querySelectorAll('[data-ww2-pick-leader]').forEach((b) => b.onclick = () => {
        pickedLeader = WW2.leaders.find((l) => l.id === b.dataset.ww2PickLeader) || pickedLeader;
        renderLobby();
      });
      body.querySelectorAll('[data-ww2-filter]').forEach((b) => b.onclick = () => {
        filter = b.dataset.ww2Filter;
        renderLobby();
      });
      body.querySelectorAll('[data-ww2-launch]').forEach((b) => b.onclick = () => {
        openWW2CampaignPanel(b.dataset.ww2Launch, pickedLeader.nation, 'sim');
      });
      body.querySelector('#ww2-lobby-arsenal')?.addEventListener('click', () => {
        openWW2CampaignPanel(pickedLeader.recommended[0] || WW2.scenarios[0].id, pickedLeader.nation, 'arsenal');
      });
    };
    renderLobby();
  }

  function openWW2CampaignPanel(scenarioId = null, playerId = null, activeTab = 'sim', previewKind = null) {
    const WW2 = globalThis.WW2Data;
    const World = globalThis.CivilWarWorld;
    if (!WW2 || !World?.WW2Sim) { notify('二战全球战役模块未加载。'); return; }
    const Sim = World.WW2Sim;
    if (ww2Timer) { clearInterval(ww2Timer); ww2Timer = null; }
    if (!ww2State || (scenarioId && ww2State.scenarioId !== scenarioId)) {
      const scId = scenarioId || ww2State?.scenarioId || 'ww2-1941-barbarossa';
      const pId = playerId || ww2State?.player || 'usa';
      ww2State = Sim.createWW2Game(WW2, scId, pId);
      ww2UndoStack = [];
    } else if (playerId && ww2State.player !== playerId) {
      // 与国内内战一致：局内无缝换边，完整保留当前战局日期、战线与部队进度！
      ww2State.player = playerId;
    }
    const st = ww2State;
    const fac = WW2.factions[st.player] || WW2.factions.usa;
    const ns = st.nations[st.player];
    let selectedArmy = st.armies.find((a) => a.nation === st.player && a.strength > 0)?.id || null;
    let selectedCityId = st.armies.find((a) => a.id === selectedArmy)?.city || 'london';
    let mapLayer = 'ww2';
    let showRail = true;
    let showSupply = false;
    let show3D = true;
    let showAirRange = true;
    let drawFrontMode = false;
    let drawnArrow = null;
    let pendingOrderMode = 'attack'; // attack | support | siege | intercept
    const pushWW2Undo = () => {
      ww2UndoStack.push(JSON.stringify(st));
      if (ww2UndoStack.length > 20) ww2UndoStack.shift();
    };
    let mapZoom = 1;
    let curTab = activeTab;
    const defaultModelByNation = { usa: 'soldier_usa', ussr: 'soldier_ussr', uk: 'soldier_uk', france: 'soldier_france', japan: 'soldier_japan', germany: 'soldier_germany', china: 'soldier_china_ww2' };
    let activeModel = previewKind || defaultModelByNation[st.player] || 'soldier_usa';
    let combatPose = false;

    const nationPills = Object.values(WW2.factions).map((f) =>
      '<button type="button" data-ww2-nation="' + f.id + '" aria-pressed="' + (f.id === st.player) + '">'
      + f.flag + ' ' + escape(f.short) + '</button>').join('');
    const theaterPills = Object.values(WW2.theaters).map((t) =>
      '<button type="button" data-ww2-th="' + t.id + '" aria-pressed="' + (t.id === st.theater) + '" style="font-size:11px;padding:3px 7px;">'
      + escape(t.name) + '</button>').join('');

    const modelButtons = [
      [defaultModelByNation[st.player] || 'soldier_usa', '🎖️ 本国专属单兵'],
      ['soldier_usa', '🇺🇸 美军大兵'], ['soldier_ussr', '☭ 苏联红军'], ['soldier_uk', '🇬🇧 英国托米'],
      ['soldier_france', '🇫🇷 法国步兵'], ['soldier_japan', '🇯🇵 日本陆军'], ['soldier_germany', '🇩🇪 德军步兵'],
      ['soldier_china_ww2', '🇨🇳 中国抗日兵'], ['soldier_pva', '★ 志愿军'], ['soldier_kpa', '🇰🇵 人民军'],
      ['yamato', '🚢 大和号战列舰'], ['carrier', '🚢 埃塞克斯航母'], ['battleship', '⚓ 黎塞留/衣阿华'], ['uboat', '🦈 德国U-VII潜艇'],
      ['zero', '✈️ 日本零式战机'], ['spitfire', '✈️ 英国喷火/P-51'], ['stuka', '🦅 德国斯图卡'], ['il2', '✈️ 苏联伊尔-2'], ['p40', '🦈 中国飞虎P-40'], ['b29', '🛫 B-29轰炸机'],
      ['sherman', '🚜 美军M4谢尔曼'], ['t34', '🚜 苏式T-34/85'], ['churchill', '🚜 英国丘吉尔坦'], ['charb1', '🚜 法军夏尔B1'], ['chiha', '🚜 日本九七坦'],
      ['tiger', '🚜 德军虎式重坦'], ['katyusha', '🚀 苏式喀秋莎'], ['m26', '🚜 美军M26潘兴'],
    ];

    const tabButtons = [
      ['sim', '⚔ 战场沙盘'],
      ['politics', '🏛️ 政局学说'],
      ['economy', '🏭 产线科研'],
      ['arsenal', '🎖️ 师编与3D'],
      ['supply', '🚂 后勤铁路'],
      ['airnavy', '✈️⚓ 海空指挥'],
      ['intel', '🕵️ 情报历史'],
    ];

    const lockedLeader = WW2.leaders.find((l) => l.nation === st.player);
    const body = showDialog('🌐 第二次世界大战（1937–1945）HOI4 全屏战略指挥室',
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;margin-bottom:5px;">'
      + '<div style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:4px;background:rgba(20,27,23,0.92);border:1px solid #9c8659;font-size:12px;color:#ffe699;">'
      + '<span>🔒 <b>本局锁定阵营：</b>' + fac.flag + ' ' + escape(fac.name) + (lockedLeader ? ' · 统帅：' + escape(lockedLeader.name) : '') + '</span>'
      + '<span style="color:#a8b8a4;font-size:11px;">（选定战役领导人后锁定阵营，右键敌城可直接下令）</span></div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<button type="button" id="ww2-audio-toggle" aria-pressed="' + ww2AudioOn + '" style="font-size:11px;padding:4px 8px;">' + (ww2AudioOn ? '🔊 战争音效:开' : '🔇 音效:关') + '</button>'
      + '<button type="button" class="gold" id="ww2-back-lobby" style="font-size:11.5px;padding:4px 9px;">🎖️ 结束本局 / 重选战役领导人</button>'
      + '</div></div>'
      + '<div class="hoi-seg-pills" style="margin-bottom:5px;flex-wrap:wrap;">'
      + tabButtons.map(([k, lbl]) => '<button type="button" data-ww2-tab="' + k + '" aria-pressed="' + (curTab === k) + '" style="font-size:11.5px;padding:4px 9px;">' + lbl + '</button>').join('')
      + '</div>'
      + '<div id="ww2-hud-bar" class="hoi-ww2-topbar"></div>'
      + '<div id="ww2-tab-sim" ' + (curTab === 'sim' ? '' : 'hidden') + '>'
      + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;margin-bottom:5px;">'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + theaterPills + '</div>'
      + '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'
      + '<button type="button" class="gold" id="ww2-draw-front" aria-pressed="false" title="开启后在地图上按住左键拖拽，直接画出 HOI4 弧形进攻箭头并下令！">✏️ 画进攻战线</button>'
      + '<button type="button" id="ww2-rail-toggle" aria-pressed="true" style="font-size:11px;padding:3px 6px;">🛤️ 铁路</button>'
      + '<button type="button" id="ww2-supply-toggle" aria-pressed="false" style="font-size:11px;padding:3px 6px;">🚂 补给</button>'
      + '<button type="button" id="ww2-3d-toggle" aria-pressed="true" style="font-size:11px;padding:3px 6px;">🎖️ 3D兵模</button>'
      + '<button type="button" id="ww2-airrange-toggle" aria-pressed="true" style="font-size:11px;padding:3px 6px;">🛫 航程圈</button>'
      + '<button type="button" id="ww2-night-toggle" aria-pressed="' + Boolean(st.nightMode) + '" style="font-size:11px;padding:3px 6px;">🌙 夜间</button>'
      + '<button type="button" id="ww2-layer-toggle" style="font-size:11px;padding:3px 6px;">🗺️ 地形</button>'
      + '<button type="button" id="ww2-ai-toggle" aria-pressed="' + Boolean(st.aiDelegate) + '" style="font-size:11px;padding:3px 6px;">🤖 委任AI</button>'
      + '<button type="button" id="ww2-undo-btn" style="font-size:11px;padding:3px 6px;">↩️ 撤回</button>'
      + '<button type="button" id="ww2-forecast-btn" style="font-size:11px;padding:3px 6px;">⚑ 预测</button>'
      + '<button type="button" id="ww2-zoom-in" style="font-size:11px;padding:3px 5px;">＋</button>'
      + '<button type="button" id="ww2-zoom-out" style="font-size:11px;padding:3px 5px;">－</button>'
      + '<button type="button" class="gold" id="ww2-play" style="font-size:11.5px;padding:3px 9px;">▶ 自动</button>'
      + [1, 2, 3, 5].map((sp) => '<button type="button" data-ww2-spd="' + sp + '" aria-pressed="' + (ww2Speed === sp) + '" style="font-size:10.5px;padding:2px 5px;">' + sp + '×</button>').join('')
      + '<button type="button" id="ww2-step1" style="font-size:11px;padding:3px 6px;">+1天</button>'
      + '<button type="button" id="ww2-step7" style="font-size:11px;padding:3px 6px;">+7天</button>'
      + '</div></div>'
      + '<div class="hoi-ww2-stage">'
      + '<canvas id="ww2-map-canvas" width="1240" height="490" style="width:100%;height:auto;cursor:crosshair;display:block;"></canvas>'
      + '<div id="ww2-general-dock" class="hoi-ww2-gen-overlay"></div>'
      + '</div>'
      + '<div id="ww2-cmd-panel" style="display:grid;grid-template-columns:1.35fr 1fr;gap:8px;margin-top:6px;"></div>'
      + '</div>'
      + '<div id="ww2-tab-sub" ' + (curTab === 'sim' || curTab === 'arsenal' ? 'hidden' : '') + '></div>'
      + '<div id="ww2-tab-arsenal" ' + (curTab === 'arsenal' ? '' : 'hidden') + '></div>');
    dialog.classList.add('hoi-ww2-full');

    const hudBar = body.querySelector('#ww2-hud-bar');
    const mapCanvas = body.querySelector('#ww2-map-canvas');
    const genDock = body.querySelector('#ww2-general-dock');
    const cmdPanel = body.querySelector('#ww2-cmd-panel');
    const subPanel = body.querySelector('#ww2-tab-sub');
    const arsenalBox = body.querySelector('#ww2-tab-arsenal');
    let hits = { cityHits: [], armyHits: [] };

    const renderHud = () => {
      const ownedCities = Object.values(st.owners).filter((o) => o === st.player).length;
      const myArmies = st.armies.filter((a) => a.nation === st.player && a.strength > 0);
      const totalStr = myArmies.reduce((s, a) => s + a.strength, 0);
      const weather = Sim.getWW2SeasonWeather(st.date.m);
      hudBar.innerHTML = '<div><strong style="font-size:13.5px;color:#ffe69b;">' + fac.flag + ' ' + escape(fac.name) + '</strong>'
        + ' · <span style="color:#d6ceb5;">' + escape(st.scenarioTitle) + '</span> · <b style="color:#ffe69b;">' + Sim.formatDate(st.date) + '</b> · ' + escape(weather.name) + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:5px;">'
        + '<span class="hoi-ww2-stat-chip">🏛政 <b>' + Math.floor(ns.pp) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">🎖指 <b>' + Math.floor(ns.cp) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip" style="border-color:' + (ns.fuel < 25 ? '#e04f42' : '') + ';">🛢️油 <b>' + Math.round(ns.fuel) + '%</b></span>'
        + '<span class="hoi-ww2-stat-chip">🚢船 <b>' + ns.convoys + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">🏆战分 <b>' + Math.floor(ns.warScore || 0) + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">🏭工 <b>' + ns.civ + '/' + ns.mil + '/' + ns.dock + '</b></span>'
        + '<span class="hoi-ww2-stat-chip">👥兵 <b>' + format(totalStr) + '</b>(' + ownedCities + '城)</span>'
        + '<span class="hoi-ww2-stat-chip">🚜<b>' + ns.stock.tanks + '</b> 💣<b>' + ns.stock.artillery + '</b> ✈️<b>' + ns.stock.planes + '</b> ⚓<b>' + ns.stock.ships + '</b></span>'
        + '</div>';
    };

    const renderSubTab = () => {
      if (curTab === 'sim' || curTab === 'arsenal') return;
      if (curTab === 'politics') {
        const focuses = Sim.ww2FocusTrees[st.player] || [];
        const allies = Object.values(WW2.factions).filter((f) => f.id !== st.player && !Sim.isHostile(WW2, st.player, f.id, st));
        const rootFo = focuses[0];
        const branchFos = focuses.slice(1);
        const renderFocusNode = (fo) => {
          if (!fo) return '';
          const done = ns.completedFocuses.includes(fo.id);
          const act = ns.activeFocus?.id === fo.id;
          return '<article class="hoi-focus-node ' + (done ? 'is-done' : act ? 'is-active' : '') + '">'
            + '<strong style="color:#f6e2b0;font-size:12.5px;">' + (done ? '✔ ' : act ? '⏳ ' : '★ ') + escape(fo.name) + '（' + fo.days + '天）</strong>'
            + '<p class="subtext" style="margin:4px 0;font-size:11px;">' + escape(fo.desc) + '</p>'
            + '<button type="button" data-ww2-focus="' + fo.id + '" ' + (done ? 'disabled' : '') + ' style="font-size:11px;width:100%;">' + (done ? '已完成国策' : act ? '推进中（剩' + ns.activeFocus.left + '天）' : '启动此国策') + '</button></article>';
        };
        subPanel.innerHTML = '<div class="hoi-focus-tree-wrap" style="margin-bottom:8px;">'
          + '<svg class="hoi-focus-tree-svg" viewBox="0 0 800 260" preserveAspectRatio="none">'
          + '<line x1="400" y1="95" x2="245" y2="155" stroke="#bfa260" stroke-width="2.2" stroke-dasharray="5,4"/>'
          + '<line x1="400" y1="95" x2="555" y2="155" stroke="#bfa260" stroke-width="2.2" stroke-dasharray="5,4"/>'
          + '<line x1="365" y1="195" x2="435" y2="195" stroke="#e06c55" stroke-width="1.8" stroke-dasharray="4,3"/>'
          + '<text x="400" y="186" fill="#f09c84" font-size="10" text-anchor="middle">⚔ 战略分支</text>'
          + '</svg>'
          + '<div style="position:relative;z-index:1;text-align:center;color:#f5dfaa;font-weight:700;font-size:12.5px;margin-bottom:4px;">⭐ HOI4 国家焦点树（National Focus Tree）</div>'
          + '<div class="hoi-focus-row">' + renderFocusNode(rootFo) + '</div>'
          + '<div class="hoi-focus-row">' + branchFos.map(renderFocusNode).join('') + '</div>'
          + '</div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">📘 四大陆军学说路线（切换消耗 25 政点）</strong></header>'
          + '<div class="hoi-doctrine-grid" style="margin-top:6px;">'
          + Object.values(Sim.ww2Doctrines).map((doc) => '<article class="hoi-doctrine-card" style="' + (ns.doctrineId === doc.id ? 'border-color:#f0cf7b;' : '') + '">'
            + '<strong style="color:#f6e2b0;">' + escape(doc.name) + '</strong><p class="subtext" style="margin:4px 0;">' + escape(doc.desc) + '</p>'
            + '<button type="button" data-ww2-doc="' + doc.id + '" aria-pressed="' + (ns.doctrineId === doc.id) + '" style="font-size:11px;">' + (ns.doctrineId === doc.id ? '✔ 当前执行' : '切换此学说 (25政)') + '</button></article>').join('')
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">📜 征兵与经济动员法令（每次 20 政点） · 同盟租借法案</strong></header>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">'
          + [['limited', '志愿/有限征兵'], ['extensive', '广泛征兵 (+600K)'], ['all_adults', '全民总动员 (+1200K)']].map(([v, l]) =>
            '<button type="button" data-ww2-law="conscription:' + v + '" aria-pressed="' + (ns.laws.conscription === v) + '" style="font-size:11.5px;">' + l + '</button>').join('')
          + [['civ_eco', '民用经济'], ['war_eco', '战时经济 (军工+10)'], ['total_mob', '总体战动员 (军工+18)']].map(([v, l]) =>
            '<button type="button" data-ww2-law="economy:' + v + '" aria-pressed="' + (ns.laws.economy === v) + '" style="font-size:11.5px;">' + l + '</button>').join('')
          + allies.map((al) => '<button type="button" class="gold" data-ww2-ll="' + al.id + '" style="font-size:11.5px;">🚢 租借援助' + escape(al.short) + ' (20政)</button>').join('')
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🕊️ 外交宣战/停战调停 · 📊 全球战损俘虏与缴获榜</strong></header>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;">'
          + Object.values(WW2.factions).filter((f) => f.id !== st.player).map((f) => {
            const atWar = Sim.isHostile(WW2, st.player, f.id, st);
            return atWar
              ? '<button type="button" data-ww2-peace="' + f.id + '" style="font-size:11px;">🕊️ 与' + escape(f.short) + '停战(30政)</button>'
              : '<button type="button" data-ww2-war="' + f.id + '" style="font-size:11px;">⚔ 向' + escape(f.short) + '宣战</button>';
          }).join('')
          + '</div>'
          + '<table class="dialog-table"><thead><tr><th>参战国</th><th>累计伤亡</th><th>俘虏敌军</th><th>缴获坦克/火炮</th></tr></thead><tbody>'
          + Object.values(WW2.factions).map((f) => '<tr><td><strong>' + f.flag + ' ' + escape(f.short) + '</strong></td><td>'
            + format(st.stats?.casualties?.[f.id] || 0) + '</td><td>' + format(st.stats?.pow?.[f.id] || 0) + '</td><td>'
            + (st.stats?.capturedTanks?.[f.id] || 0) + ' 坦 / ' + (st.stats?.capturedGuns?.[f.id] || 0) + ' 炮</td></tr>').join('')
          + '</tbody></table></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">⭐ 将领特质养成（15指点） · 🤝 拉拢中立国入盟（25政点） · 🕊️ 和谈会议（战分 ' + Math.floor(ns.warScore || 0) + '）</strong></header>'
          + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0;">'
          + Object.values(Sim.ww2GeneralTraits).map((tr) => '<button type="button" data-ww2-trait="' + tr.id + '" title="' + escape(tr.desc) + '" style="font-size:11px;">⭐ ' + escape(tr.name) + '</button>').join('')
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0;">'
          + Sim.ww2NeutralMinors.map((m) => {
            const joined = ns.alliedMinors.includes(m.id);
            return '<button type="button" data-ww2-minor="' + m.id + '" ' + (joined ? 'disabled' : '') + ' title="' + escape(m.bonusDesc) + '" style="font-size:11px;">' + (joined ? '✔ ' : '🤝 拉拢') + escape(m.name) + '</button>';
          }).join('')
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">'
          + '<button type="button" class="gold" data-ww2-peace-demand="annex_city">🕊️ 和谈割让敌城(20战分)</button>'
          + '<button type="button" class="gold" data-ww2-peace-demand="puppet">👑 设立傀儡附庸(25战分)</button>'
          + '<button type="button" data-ww2-peace-demand="reparations">🏭 索取战争赔款(15战分)</button>'
          + '<button type="button" data-ww2-peace-demand="seize_fleet">⚓ 瓜分战败舰队(15战分)</button>'
          + '</div></div>';
        subPanel.querySelectorAll('[data-ww2-focus]').forEach((b) => b.onclick = () => { const r = Sim.startWW2Focus(st, st.player, b.dataset.ww2Focus); if (!r.ok) notify(r.error); else redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-doc]').forEach((b) => b.onclick = () => { const r = Sim.setWW2Doctrine(st, st.player, b.dataset.ww2Doc); if (!r.ok) notify(r.error); else { notify('陆军学说已更新！'); redrawAll(); } });
        subPanel.querySelectorAll('[data-ww2-law]').forEach((b) => b.onclick = () => { const [k, v] = b.dataset.ww2Law.split(':'); const r = Sim.setWW2Law(st, st.player, k, v); if (!r.ok) notify(r.error); else { notify('国家法令已生效！'); redrawAll(); } });
        subPanel.querySelectorAll('[data-ww2-ll]').forEach((b) => b.onclick = () => { const r = Sim.lendLeaseWW2(WW2, st, st.player, b.dataset.ww2Ll); if (!r.ok) notify(r.error); else { notify('租借法案船队已启航！'); redrawAll(); } });
        subPanel.querySelectorAll('[data-ww2-war]').forEach((b) => b.onclick = () => { const r = Sim.declareWarWW2(WW2, st, st.player, b.dataset.ww2War); if (!r.ok) notify(r.error); else redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-peace]').forEach((b) => b.onclick = () => { const r = Sim.proposePeaceWW2(WW2, st, st.player, b.dataset.ww2Peace); if (!r.ok) notify(r.error); else redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-trait]').forEach((b) => b.onclick = () => { const r = Sim.upgradeWW2General(st, st.player, selectedArmy, b.dataset.ww2Trait); if (!r.ok) notify(r.error); else { notify('将领已晋升新特质！'); redrawAll(); } });
        subPanel.querySelectorAll('[data-ww2-minor]').forEach((b) => b.onclick = () => { const r = Sim.inviteMinorWW2(st, st.player, b.dataset.ww2Minor); if (!r.ok) notify(r.error); else { notify('中立国已正式加入我方阵营！'); redrawAll(); } });
        subPanel.querySelectorAll('[data-ww2-peace-demand]').forEach((b) => b.onclick = () => { const r = Sim.peaceDemandWW2(WW2, st, st.player, b.dataset.ww2PeaceDemand, selectedCityId); if (!r.ok) notify(r.error); else { notify('和谈条款已签字生效！'); redrawAll(); } });
      } else if (curTab === 'economy') {
        const ps = ns.prodShare;
        subPanel.innerHTML = '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🛢️ 战略资源贸易与石油燃料（当前油料 ' + Math.round(ns.fuel) + '% · 石油 ' + ns.resources.oil + ' · 钢铁 ' + ns.resources.steel + ' · 运输船 ' + ns.convoys + '）</strong></header>'
          + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">'
          + '<button type="button" class="gold" data-ww2-trade="oil">🛢️ 2民工进口战略石油 (+24油 / +28%燃料)</button>'
          + '<button type="button" data-ww2-trade="steel">⚙️ 2民工进口战略钢铁 (+30钢 / 增产坦炮)</button>'
          + '<button type="button" data-ww2-mkt="buy:tanks">🛒 军火市场购60坦(22政)</button>'
          + '<button type="button" data-ww2-mkt="buy:planes">🛒 购60战机(22政)</button>'
          + '<button type="button" data-ww2-mkt="sell:infantry">💰 卖200步械(+2民工/+18政)</button>'
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🏭 军工研发设计局（MIO · 每级消耗 18 指点永久提战力）</strong></header>'
          + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">'
          + (Sim.ww2MIOByNation[st.player] || []).map((m) => {
            const lv = ns.mioLevels?.[m.id] || 1;
            return '<button type="button" data-ww2-mio="' + m.id + '" ' + (lv >= 5 ? 'disabled' : '') + ' style="font-size:11.5px;">🏭 ' + escape(m.name) + ' (Lv.' + lv + (lv < 5 ? ' → 升级' : ' 满级') + ')</button>';
          }).join('')
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🏭 军工产线产能分配（当前军工 ' + ns.mil + ' 座）</strong></header>'
          + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px;">'
          + [['infantry', '🔫 步兵军械'], ['artillery', '💣 压制火炮'], ['tanks', '🚜 主战坦克'], ['planes', '✈️ 作战飞机']].map(([k, lbl]) =>
            '<div class="hoi-doctrine-card"><strong>' + lbl + '</strong><div class="subtext">权重：<b>' + ps[k] + '%</b> · 库存 ' + ns.stock[k] + '</div>'
            + '<div style="display:flex;gap:4px;margin-top:4px;"><button type="button" data-ww2-prod="' + k + ':+10" style="font-size:11px;">+10%</button>'
            + '<button type="button" data-ww2-prod="' + k + ':-10" style="font-size:11px;">-10%</button></div></div>').join('')
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🔬 二战军事科研树（消耗政点/科研经费突破）</strong></header>'
          + '<div class="hoi-doctrine-grid" style="margin-top:6px;">'
          + Sim.ww2TechCatalog.map((t) => {
            const done = ns.techs.includes(t.id);
            return '<article class="hoi-doctrine-card" style="' + (done ? 'border-color:#74d68c;' : '') + '">'
              + '<strong style="color:#f6e2b0;">' + (done ? '✔ ' : '🔬 ') + escape(t.name) + '</strong>'
              + '<p class="subtext" style="margin:4px 0;">' + escape(t.desc) + '</p>'
              + '<button type="button" data-ww2-tech="' + t.id + '" ' + (done ? 'disabled' : '') + ' style="font-size:11px;">' + (done ? '已列装全军' : '立项研发 (' + t.cost + '政)') + '</button></article>';
          }).join('') + '</div></div>';
        subPanel.querySelectorAll('[data-ww2-trade]').forEach((b) => b.onclick = () => {
          const r = Sim.tradeWW2Resource(st, st.player, b.dataset.ww2Trade);
          if (!r.ok) notify(r.error); else { notify('战略资源船队已抵港！'); redrawAll(); }
        });
        subPanel.querySelectorAll('[data-ww2-mkt]').forEach((b) => b.onclick = () => {
          const [m, it] = b.dataset.ww2Mkt.split(':');
          const r = Sim.marketWW2Trade(st, st.player, m, it);
          if (!r.ok) notify(r.error); else { notify('国际军火市场交易已成交！'); redrawAll(); }
        });
        subPanel.querySelectorAll('[data-ww2-mio]').forEach((b) => b.onclick = () => {
          const r = Sim.upgradeWW2MIO(st, st.player, b.dataset.ww2Mio);
          if (!r.ok) notify(r.error); else { notify('军工设计局晋升成功！'); redrawAll(); }
        });
        subPanel.querySelectorAll('[data-ww2-prod]').forEach((b) => b.onclick = () => {
          const [k, d] = b.dataset.ww2Prod.split(':');
          ns.prodShare[k] = Math.max(5, Math.min(75, (ns.prodShare[k] || 25) + Number(d)));
          redrawAll();
        });
        subPanel.querySelectorAll('[data-ww2-tech]').forEach((b) => b.onclick = () => {
          const r = Sim.researchWW2Tech(st, st.player, b.dataset.ww2Tech);
          if (!r.ok) notify(r.error); else { notify('科研突破成功，新装备已入库！'); redrawAll(); }
        });
      } else if (curTab === 'supply') {
        const myCities = WW2.cities.filter((c) => st.owners[c.id] === st.player);
        subPanel.innerHTML = '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🚂 补给枢纽机动化级别（与国内战场同款三档）</strong></header>'
          + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">'
          + [[0, '🐎 马车骡马运补 (基础)'], [1, '🚚 单卡车机动运补 (补给+12%)'], [2, '🚛 双卡车全机械化运补 (补给+24%)']].map(([lv, lbl]) =>
            '<button type="button" data-ww2-motor="' + lv + '" aria-pressed="' + (ns.supplyMotor === lv) + '">' + lbl + '</button>').join('')
          + '</div></div>'
          + '<h4 style="margin:8px 0 4px;color:#f4dfaa;">本国控制城市铁路补给与要塞清单（共 ' + myCities.length + ' 座）</h4>'
          + '<table class="dialog-table"><thead><tr><th>城市</th><th>地形</th><th>补给度</th><th>要塞</th><th>操作</th></tr></thead><tbody>'
          + myCities.map((c) => {
            const sup = Sim.citySupplyLevel(WW2, st, c.id);
            return '<tr><td><strong>' + escape(c.name) + '</strong>' + (c.port ? ' ⚓' : '') + '</td><td>' + escape(c.terrain)
              + '</td><td>' + sup + '%</td><td>' + (st.forts[c.id] || 0) + ' 级</td>'
              + '<td><button type="button" data-ww2-fort-city="' + c.id + '" style="font-size:11px;padding:2px 6px;">🏰 筑要塞(15政)</button></td></tr>';
          }).join('') + '</tbody></table>';
        subPanel.querySelectorAll('[data-ww2-motor]').forEach((b) => b.onclick = () => { ns.supplyMotor = Number(b.dataset.ww2Motor); notify('补给枢纽运力档位已切换！'); redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-fort-city]').forEach((b) => b.onclick = () => { const r = Sim.fortifyWW2City(WW2, st, st.player, b.dataset.ww2FortCity); if (!r.ok) notify(r.error); else redrawAll(); });
      } else if (curTab === 'airnavy') {
        const myTF = st.taskForces?.[st.player] || { name: ns.short + '特混舰队', cv: 2, bb: 2, ca: 4, dd: 16, ss: 6 };
        const lb = st.lastNavalBattle;
        const navalLineHtml = (title, tf, lost) => '<div style="padding:8px;border-radius:5px;border:1px solid #6b5b3c;background:#18211d;">'
          + '<strong style="color:#ffe494;font-size:12px;">' + escape(title) + '</strong>'
          + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px;text-align:center;font-size:11px;">'
          + '<div style="padding:5px;border-radius:4px;background:#1f2e28;border:1px solid #4c7061;"><b>第1排·屏卫排</b><br>🚢 驱逐 DD: <b>' + tf.dd + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.dd + ')</span>' : '') + '<br>🦈 潜艇 SS: <b>' + tf.ss + '</b></div>'
          + '<div style="padding:5px;border-radius:4px;background:#262c22;border:1px solid #7d704a;"><b>第2排·主力战列</b><br>⚓ 战列 BB: <b>' + tf.bb + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.bb + ')</span>' : '') + '<br>🛥 巡洋 CA: <b>' + tf.ca + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.ca + ')</span>' : '') + '</div>'
          + '<div style="padding:5px;border-radius:4px;background:#2e2420;border:1px solid #96644c;"><b>第3排·航母航空</b><br>🛩 航母 CV: <b>' + tf.cv + '</b>' + (lost ? ' <span style="color:#ff8470;">(-' + lost.cv + ')</span>' : '') + '<br>' + (tf.cv > 4 ? '<span style="color:#ffb76b;">⚠ 超载惩罚</span>' : '✅ 调度正常') + '</div>'
          + '</div></div>';
        subPanel.innerHTML = '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">✈️ 战区空军任务、防空雷达网与 B-29 航程（战机 ' + ns.stock.planes + ' · 制空 ' + ns.airPower + '）</strong></header>'
          + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">'
          + [['air_superiority', '✈️ 夺取制空权'], ['cas', '🎯 近距对地支援 (+18%攻)'], ['strat_bomb', '💣 战略轰炸工业'], ['logistic', '🚂 后勤铁路绞杀']].map(([k, l]) =>
            '<button type="button" data-ww2-air="' + k + '" aria-pressed="' + (ns.airMission === k) + '">' + l + '</button>').join('')
          + '<button type="button" class="gold" id="ww2-build-radar-sub">📡 建设本土防空雷达网(15政)</button>'
          + '</div></div>'
          + '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">⚓ HOI4 三排海战阵型与特混舰队（' + escape(myTF.name) + ' · 屏卫率 ' + Sim.fleetScreenRatio(ns) + '%）</strong></header>'
          + '<div style="margin:6px 0;">' + navalLineHtml('本国主力特混舰队：' + myTF.name, myTF, null) + '</div>'
          + (lb ? '<div style="margin:6px 0;padding:8px;border:1px solid #b59758;border-radius:5px;background:#121a1f;">'
            + '<div style="color:#ffe494;font-weight:700;margin-bottom:6px;">⚔️ 最近一次三排海空决战战报：' + escape(lb.cityName) + ' 海域（' + lb.date + '）· 战列舰岸轰 -' + lb.shoreBombard + '% · 胜方：' + escape(WW2.factions[lb.winner]?.short || lb.winner) + '</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
            + navalLineHtml('攻方：' + lb.atk.name + ' (屏卫 ' + lb.atk.screenPct + '%)', lb.atk, lb.atk.lost)
            + navalLineHtml('守方：' + lb.def.name + ' (屏卫 ' + lb.def.screenPct + '%)', lb.def, lb.def.lost)
            + '</div></div>' : '<p class="subtext" style="margin:4px 0;">在战场沙盘点击【🚢✈️ 海空跳岛战】即可触发三排海战阵型实机结算与战损明细！</p>')
          + '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">'
          + [['strike_force', '🚢 航母特混主力决战'], ['convoy_raid', '🦈 潜艇破交封锁'], ['escort', '🛡 两栖登陆护航']].map(([k, l]) =>
            '<button type="button" data-ww2-navy="' + k + '" aria-pressed="' + (ns.navalMission === k) + '">' + l + '</button>').join('')
          + '<button type="button" class="gold" id="ww2-build-screen">⚓ 建造6艘屏卫驱逐舰(15政)</button>'
          + '<button type="button" class="gold" id="ww2-blockade-sub">🦈 潜艇孤岛封锁断粮(15指)</button>'
          + '<button type="button" class="gold" id="ww2-kamikaze-sub">🌸 神风特攻突袭(25政/80机)</button>'
          + '<button type="button" id="ww2-port-guard-sub">⚓ 一键沿海港口专守</button>'
          + '</div></div>';
        subPanel.querySelectorAll('[data-ww2-air]').forEach((b) => b.onclick = () => { ns.airMission = b.dataset.ww2Air; redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-navy]').forEach((b) => b.onclick = () => { ns.navalMission = b.dataset.ww2Navy; redrawAll(); });
        subPanel.querySelector('#ww2-build-radar-sub')?.addEventListener('click', () => { const r = Sim.buildRadarWW2(WW2, st, st.player, selectedCityId); if (!r.ok) notify(r.error); else { WarAudio.click(); notify('📡 防空雷达站已建成！'); redrawAll(); } });
        subPanel.querySelector('#ww2-build-screen')?.addEventListener('click', () => { const r = Sim.buildEscortScreenWW2(st, st.player); if (!r.ok) notify(r.error); else { if (st.taskForces?.[st.player]) st.taskForces[st.player].dd += 6; notify('屏卫驱逐舰编队已入列！'); redrawAll(); } });
        subPanel.querySelector('#ww2-blockade-sub')?.addEventListener('click', () => { const r = Sim.blockadeIslandWW2(WW2, st, st.player, selectedCityId); if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🦈 孤岛海运封锁已生效！'); redrawAll(); } });
        subPanel.querySelector('#ww2-kamikaze-sub')?.addEventListener('click', () => { const r = Sim.kamikazeStrikeWW2(WW2, st, st.player); if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🌸 神风特攻队已重创敌主力舰队！'); redrawAll(); } });
        subPanel.querySelector('#ww2-port-guard-sub')?.addEventListener('click', () => { const r = Sim.portGarrisonWW2(WW2, st, st.player); if (!r.ok) notify(r.error); else { notify('沿海各港驻军已转入掘壕死守！'); redrawAll(); } });
      } else if (curTab === 'intel') {
        subPanel.innerHTML = '<div class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🕵️ 隐蔽战线情报网 & 无线电密码破译（La Résistance）</strong></header>'
          + '<p class="subtext" style="margin:4px 0;">情报网强度：<b>' + ns.intel.network + '%</b>（削弱敌方堑壕） · 密码破译进度：<b>' + ns.intel.cipher + '%</b> · 决战爆发剩余：<b>' + ns.intel.burstDays + ' 天</b></p>'
          + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
          + '<button type="button" data-ww2-intel="network">🕵️ 潜伏建网 (15政)</button>'
          + '<button type="button" data-ww2-intel="decrypt">📻 破译敌军密码 (20政)</button>'
          + '<button type="button" class="gold" data-ww2-intel="burst">⚡ 开启30天破译决战爆发 (攻防+15%)</button>'
          + '<button type="button" data-ww2-spy="steal_tech">🕵️ 特工窃取科研蓝图(20政/35网)</button>'
          + '<button type="button" data-ww2-spy="sabotage_factory">💣 特工炸毁敌重水军工(20政)</button>'
          + '<button type="button" data-ww2-spy="incite_revolt">🔥 策反敌后大起义(20政)</button>'
          + '<button type="button" id="ww2-hist-mode">📜 当前：' + (st.historyMode === 'historical' ? '历史推演模式' : '动态沙盒模式') + '（点此切换）</button>'
          + '</div>' + (ns.exileGov ? '<p style="color:#ffd86b;margin:4px 0 0;">🏛️ 当前处于【流亡政府】状态，依托盟友继续指挥流亡精锐部队作战！</p>' : '') + '</div>'
          + '<h4 style="margin:8px 0 4px;color:#f4dfaa;">📜 二战互动历史抉择事件</h4>'
          + '<div class="hoi-doctrine-grid">'
          + Sim.ww2HistoricalEvents.map((ev) => {
            const done = ns.eventsDone.includes(ev.id);
            return '<article class="hoi-doctrine-card"><strong style="color:#f6e2b0;">' + escape(ev.title) + '</strong>'
              + '<p class="subtext" style="margin:4px 0;">' + escape(ev.desc) + '</p>'
              + (done ? '<span class="plan-status is-active">✔ 已完成抉择</span>'
                : '<div style="display:flex;flex-direction:column;gap:4px;">'
                  + ev.choices.map((ch, idx) => '<button type="button" data-ww2-ev="' + ev.id + ':' + idx + '" style="font-size:11px;text-align:left;">▸ ' + escape(ch.label) + '</button>').join('')
                  + '</div>')
              + '</article>';
          }).join('') + '</div>';
        subPanel.querySelectorAll('[data-ww2-intel]').forEach((b) => b.onclick = () => { const r = Sim.ww2IntelAction(st, st.player, b.dataset.ww2Intel); if (!r.ok) notify(r.error); else redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-spy]').forEach((b) => b.onclick = () => { const r = Sim.spyMissionWW2(WW2, st, st.player, b.dataset.ww2Spy); if (!r.ok) notify(r.error); else { notify('王牌特工行动已圆满完成！'); redrawAll(); } });
        subPanel.querySelector('#ww2-hist-mode')?.addEventListener('click', () => { st.historyMode = st.historyMode === 'historical' ? 'dynamic' : 'historical'; redrawAll(); });
        subPanel.querySelectorAll('[data-ww2-ev]').forEach((b) => b.onclick = () => { const [eid, idx] = b.dataset.ww2Ev.split(':'); const r = Sim.applyWW2Event(st, st.player, eid, Number(idx)); if (!r.ok) notify(r.error); else { notify('历史抉择已生效！'); redrawAll(); } });
      }
    };

    const renderCmdPanel = () => {
      const myArmies = st.armies.filter((a) => a.nation === st.player && a.strength > 0);
      genDock.innerHTML = myArmies.map((a) => '<button type="button" class="hoi-ww2-gen-card" data-ww2-pick-army="' + a.id + '" aria-pressed="' + (a.id === selectedArmy)
        + '"><span>🎖️</span><span><b>' + escape(a.commander) + '</b> · ' + Math.round(a.strength / 1000) + 'K (' + escape(WW2.cities.find((c) => c.id === a.city)?.name || a.city) + ')</span></button>').join('');
      genDock.querySelectorAll('[data-ww2-pick-army]').forEach((b) => b.onclick = () => {
        selectedArmy = b.dataset.ww2PickArmy;
        const aObj = st.armies.find((x) => x.id === selectedArmy);
        if (aObj) selectedCityId = aObj.city;
        redrawAll();
      });

      const selA = st.armies.find((a) => a.id === selectedArmy && a.strength > 0);
      const selCityObj = WW2.cities.find((c) => c.id === selectedCityId);
      const selSup = selectedCityId ? Sim.citySupplyLevel(WW2, st, selectedCityId) : 100;
      const logLines = st.log.slice(-6).reverse().map((l) => '<li style="margin:2px 0;">' + escape(l) + '</li>').join('');

      cmdPanel.innerHTML = '<div class="hoi-cipher-box" style="margin:0;">'
        + '<header style="display:flex;justify-content:space-between;align-items:center;"><strong style="color:#f5e1b0;">🎖️ 集团军全套战术命令（与国内内战 100% 同步）</strong>'
        + '<span class="subtext">' + (selCityObj ? escape(selCityObj.name) + ' · 补给 ' + selSup + '%' : '') + '</span></header>'
        + (selA ? '<p class="subtext" style="margin:4px 0;"><b>' + escape(selA.name) + '</b>（' + escape(selA.commander) + '）· 兵 ' + format(selA.strength) + ' · 坦 ' + selA.tanks + ' · 炮 ' + selA.artillery
          + ' · 组织度 ' + Math.round(selA.org) + '% · 堑壕 ' + selA.entrench.toFixed(1) + ' · <span style="color:#6ed4ff;">计划 +' + Math.round(selA.planBonus || 0) + '%</span> · 两栖筹备 ' + Math.round(selA.amphibPrep || 0) + '%</p>'
          + '<div class="unit-actions" style="margin-bottom:5px;">'
          + '<button type="button" data-ww2-mode="attack" aria-pressed="' + (pendingOrderMode === 'attack') + '">⚔ 强攻</button>'
          + '<button type="button" data-ww2-mode="support" aria-pressed="' + (pendingOrderMode === 'support') + '">🤝 牵制</button>'
          + '<button type="button" data-ww2-mode="siege" aria-pressed="' + (pendingOrderMode === 'siege') + '">🏰 围城</button>'
          + '<button type="button" data-ww2-mode="intercept" aria-pressed="' + (pendingOrderMode === 'intercept') + '">🎯 围点打援</button>'
          + '<button type="button" data-ww2-army-cmd="defend">🛡 掘壕</button>'
          + '<button type="button" data-ww2-army-cmd="rest">🏕 休整</button>'
          + '<button type="button" id="ww2-fallback-btn">↩️ 后撤防线</button>'
          + '<button type="button" id="ww2-all-atk-btn">⚔ 全线总攻</button>'
          + '<button type="button" data-ww2-skill="force_march">⚡ 强行军(15指)</button>'
          + '<button type="button" data-ww2-skill="last_stand">🛡 死守(15指)</button>'
          + '</div>' : '')
        + '<div class="unit-actions">'
        + '<button type="button" class="gold" id="ww2-blitz-btn" title="欧洲多坦克装甲闪电突击（需要400+坦克与20指点）">⚡ 装甲闪电战(20指)</button>'
        + '<button type="button" class="gold" id="ww2-navalair-btn" title="太平洋航母海战 + 舰载机空战 + 跳岛封锁（20指点）">🚢✈️ 海空跳岛战(20指)</button>'
        + '<button type="button" class="gold" id="ww2-nuke-btn" style="border-color:#ff7b54;" title="B-29 起飞投掷原子弹：飞行轨迹 + 强光闪爆 + 冲击波与蘑菇云（35政点）">☢️ 发射原子弹(35政)</button>'
        + '<button type="button" class="gold" id="ww2-v2-btn" title="发射超音速 V-2 弹道导弹远程轰击敌城（20政点）">🚀 V-2导弹(20政)</button>'
        + '<button type="button" class="gold" id="ww2-railgun-btn" title="800mm 古斯塔夫重型列车炮摧毁 2 级要塞（20指点）">🚂 列车炮(20指)</button>'
        + '<button type="button" class="gold" id="ww2-free-land-btn" title="选中我方部队或航母舰队后，想在哪个敌方沿海港口登陆就能直接抢滩登陆（15指点）">⚓ 任意港自由登陆(15指)</button>'
        + '<button type="button" data-ww2-direct="tank" title="免换装直接编组独立重装坦克军出现在地图上（15政点）">🚜 直出坦克军(15政)</button>'
        + '<button type="button" data-ww2-direct="air" title="直接派遣独立空军联队出现在地图上（15政点）">✈️ 直出空军联队(15政)</button>'
        + '<button type="button" data-ww2-direct="carrier" title="直接派遣航母特混舰队停驻港口/出击（15政点）">🚢 直出航母舰队(15政)</button>'
        + '<button type="button" data-ww2-direct="missile" title="直接部署远程导弹发射旅并显示红色射程圈（15政点）">🚀 部署导弹旅(15政)</button>'
        + '<button type="button" id="ww2-fortify-btn">🏰 筑要塞(15政)</button>'
        + '<button type="button" id="ww2-radar-btn">📡 建雷达(15政)</button>'
        + '<button type="button" id="ww2-suppress-btn">👮 宪兵镇压(10政)</button>'
        + '<button type="button" id="ww2-relocate-btn">🏭 工业内迁(20政)</button>'
        + '<button type="button" id="ww2-amphib-btn">⚓ 两栖筹备(15指)</button>'
        + '<button type="button" id="ww2-blockade-btn">🦈 孤岛封锁(15指)</button>'
        + '<button type="button" id="ww2-kamikaze-btn">🌸 神风特攻(25政)</button>'
        + '<button type="button" id="ww2-scorch-btn">🔥 炸铁路(15政)</button>'
        + '<button type="button" id="ww2-airborne-btn">🪂 敌后空降(25指)</button>'
        + '<button type="button" id="ww2-barrage-btn">💣 炮火覆盖(20指)</button>'
        + '<button type="button" id="ww2-portguard-btn">⚓ 港口专守</button>'
        + '<button type="button" data-ww2-recruit="armor">🚜 新编装甲军</button>'
        + '</div></div>'
        + '<div class="hoi-cipher-box" style="margin:0;">'
        + '<header style="display:flex;justify-content:space-between;"><strong style="color:#f5e1b0;">📜 实时全球战报</strong>'
        + '<span class="subtext">学说：' + escape(ns.doctrine) + '</span></header>'
        + '<ul style="margin:4px 0 0;padding-left:16px;font-size:11.5px;color:#dfd7c0;max-height:92px;overflow:auto;">' + logLines + '</ul>'
        + '</div>';

      cmdPanel.querySelectorAll('[data-ww2-mode]').forEach((b) => b.onclick = () => { pendingOrderMode = b.dataset.ww2Mode; redrawAll(); });
      cmdPanel.querySelectorAll('[data-ww2-army-cmd]').forEach((b) => b.onclick = () => { if (selectedArmy) { Sim.issueWW2Order(WW2, st, selectedArmy, b.dataset.ww2ArmyCmd); redrawAll(); } });
      cmdPanel.querySelectorAll('[data-ww2-skill]').forEach((b) => b.onclick = () => { const r = Sim.commandSkillWW2(st, st.player, selectedArmy, b.dataset.ww2Skill); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelector('#ww2-fallback-btn')?.addEventListener('click', () => { pushWW2Undo(); const r = Sim.fallbackLineWW2(WW2, st, st.player); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelector('#ww2-all-atk-btn')?.addEventListener('click', () => { pushWW2Undo(); const r = Sim.generalOffensiveWW2(WW2, st, st.player); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelector('#ww2-blitz-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.blitzkriegStrikeWW2(WW2, st, st.player, selectedArmy, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.bugle(); notify('⚡ 装甲闪电战已发动，多坦克集群高速穿插！'); redrawAll(); startFxLoop(); }
      });
      cmdPanel.querySelector('#ww2-navalair-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.pacificNavalAirBattle(WW2, st, st.player, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🚢✈️ 太平洋航母海空决战与跳岛封锁打响！'); redrawAll(); startFxLoop(); }
      });
      cmdPanel.querySelector('#ww2-nuke-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.launchAtomicBombWW2(WW2, st, st.player, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.nuke(); notify('☢️ B-29 原子弹已起飞发射，准备迎接核闪爆与蘑菇云！'); redrawAll(); startFxLoop(); }
      });
      cmdPanel.querySelector('#ww2-v2-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.launchV2MissileWW2(WW2, st, st.player, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🚀 V-2 弹道导弹已点火升空！'); redrawAll(); startFxLoop(); }
      });
      cmdPanel.querySelector('#ww2-free-land-btn')?.addEventListener('click', () => {
        pushWW2Undo();
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.freeAmphibiousLandingWW2(WW2, st, st.player, selectedArmy, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('⚓ 自由两栖登陆已发动！'); redrawAll(); startFxLoop(); }
      });
      cmdPanel.querySelectorAll('[data-ww2-direct]').forEach((b) => b.onclick = () => {
        pushWW2Undo();
        const r = Sim.deployDirectForceWW2(WW2, st, st.player, b.dataset.ww2Direct, selectedCityId);
        if (!r.ok) notify(r.error); else { selectedArmy = r.army.id; WarAudio.bugle(); notify('⚔️ ' + r.army.name + ' 已免换装直出地图，可自由调用！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-railgun-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.fireRailwayGunWW2(WW2, st, st.player, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🚂 800mm 古斯塔夫列车炮已轰塌敌城要塞！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-radar-btn')?.addEventListener('click', () => {
        const r = Sim.buildRadarWW2(WW2, st, st.player, selectedCityId);
        if (!r.ok) notify(r.error); else { WarAudio.click(); notify('📡 防空雷达网已建成！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-suppress-btn')?.addEventListener('click', () => {
        const r = Sim.garrisonSuppressWW2(WW2, st, st.player, selectedCityId);
        if (!r.ok) notify(r.error); else { WarAudio.click(); notify('👮 装甲宪兵已镇压占领区抵抗！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-relocate-btn')?.addEventListener('click', () => {
        const r = Sim.relocateIndustryWW2(WW2, st, st.player);
        if (!r.ok) notify(r.error); else { WarAudio.click(); notify('🏭 乌拉尔/大后方工业内迁完成！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-amphib-btn')?.addEventListener('click', () => {
        const r = Sim.planAmphibiousWW2(WW2, st, selectedArmy, selectedCityId);
        if (!r.ok) notify(r.error); else { WarAudio.bugle(); notify('⚓ 两栖登陆筹备 100% + 战列舰岸轰就绪！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-blockade-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : null;
        const r = Sim.blockadeIslandWW2(WW2, st, st.player, tgt);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🦈 孤岛海运补给已彻底封锁！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-kamikaze-btn')?.addEventListener('click', () => {
        const r = Sim.kamikazeStrikeWW2(WW2, st, st.player);
        if (!r.ok) notify(r.error); else { WarAudio.artillery(); notify('🌸 神风特攻队已重创敌特混舰队！'); redrawAll(); }
      });
      cmdPanel.querySelector('#ww2-fortify-btn')?.addEventListener('click', () => { const r = Sim.fortifyWW2City(WW2, st, st.player, selectedCityId); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelector('#ww2-scorch-btn')?.addEventListener('click', () => { const r = Sim.scorchedEarthWW2(WW2, st, st.player, selectedCityId); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelector('#ww2-airborne-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : WW2.cities.find((c) => Sim.isHostile(WW2, st.player, st.owners[c.id], st))?.id;
        const r = Sim.airborneWW2(WW2, st, st.player, tgt); if (!r.ok) notify(r.error); else redrawAll();
      });
      cmdPanel.querySelector('#ww2-barrage-btn')?.addEventListener('click', () => {
        const tgt = Sim.isHostile(WW2, st.player, st.owners[selectedCityId], st) ? selectedCityId : WW2.cities.find((c) => Sim.isHostile(WW2, st.player, st.owners[c.id], st))?.id;
        const r = Sim.barrageWW2(WW2, st, st.player, tgt); if (!r.ok) notify(r.error); else redrawAll();
      });
      cmdPanel.querySelector('#ww2-portguard-btn')?.addEventListener('click', () => { const r = Sim.portGarrisonWW2(WW2, st, st.player); if (!r.ok) notify(r.error); else redrawAll(); });
      cmdPanel.querySelectorAll('[data-ww2-recruit]').forEach((b) => b.onclick = () => {
        const r = Sim.recruitWW2Division(WW2, st, st.player, selectedCityId, b.dataset.ww2Recruit);
        if (!r.ok) notify(r.error); else { selectedArmy = r.id; notify('新编集团军已完成部署！'); redrawAll(); }
      });
    };

    const renderArsenal = () => {
      const equipTbl = (title, list, cols) => '<h4 style="margin:8px 0 4px;color:#f4dfaa;">' + title + '</h4>'
        + '<table class="dialog-table"><thead><tr>' + cols.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
        + list.map((it) => '<tr><td><strong>' + escape(it.name) + '</strong></td><td>' + format(it.qty) + '</td><td>'
          + escape(it.caliber || (it.armor ? it.armor + ' / ' + it.gun : it.speed || it.class || ('软' + it.soft + '/硬' + it.hard))) + '</td><td>'
          + escape(it.role) + '</td></tr>').join('') + '</tbody></table>';
      const tpl = ns.customTemplate;
      const stp = Sim.templateStats(tpl);
      const ed = ns.equipDesign;
      arsenalBox.innerHTML = '<div class="hoi-cipher-box" style="margin-bottom:8px;"><header><strong style="color:#f5e1b0;">🔧 自由装备设计器（10指点定型改装） & 📐 自由师编网格（当前 ' + stp.width + ' 战斗宽度）</strong></header>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px;">'
        + '<div><div class="subtext" style="margin-bottom:4px;">坦克/战机/战舰核心部件：</div><div style="display:flex;flex-wrap:wrap;gap:4px;">'
        + [['tankGun:75mm', '75mm炮'], ['tankGun:88mm', '88mm反坦炮'], ['tankGun:122mm', '122mm重炮'], ['tankArmor:sloped', '倾斜甲'], ['tankArmor:heavy', '重型复合甲'], ['planeRole:cas_heavy', '重型对地强击'], ['planeRange:long_range', '副油箱远程'], ['shipFocus:carrier_deck', '装甲航母甲板']].map(([kv, lbl]) => {
          const [k, v] = kv.split(':');
          return '<button type="button" data-ww2-design="' + kv + '" aria-pressed="' + (ed[k] === v) + '" style="font-size:10.5px;padding:2px 6px;">' + lbl + '</button>';
        }).join('') + '</div></div>'
        + '<div><div class="subtext" style="margin-bottom:4px;">步' + tpl.inf + ' · 炮' + tpl.art + ' · 坦' + tpl.tank + ' · 支援' + tpl.support + ' → <b>' + stp.width + ' 宽</b>（兵' + Math.round(stp.str / 1000) + 'K / 坦' + stp.tanks + '）</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:4px;">'
        + [['inf', '步兵营'], ['art', '炮兵营'], ['tank', '坦克营'], ['support', '工兵/防空连']].map(([k, l]) =>
          '<button type="button" data-ww2-tpl="' + k + ':+1" style="font-size:10.5px;padding:2px 5px;">+' + l + '</button>'
          + '<button type="button" data-ww2-tpl="' + k + ':-1" style="font-size:10.5px;padding:2px 5px;">-' + l + '</button>').join('')
        + '<button type="button" class="gold" id="ww2-tpl-recruit" style="font-size:11px;padding:2px 8px;">➕ 按' + stp.width + '宽成军</button>'
        + '</div></div></div></div>'
        + '<div style="display:grid;grid-template-columns:265px minmax(0,1fr);gap:12px;align-items:start;">'
        + '<div style="padding:8px;border-radius:6px;border:1px solid #8f7a52;background:#161d19;text-align:center;">'
        + '<canvas id="ww2-3d-canvas" width="245" height="235" style="width:100%;height:auto;border-radius:4px;background:#101715;display:block;"></canvas>'
        + '<div style="margin:6px 0;"><button type="button" id="ww2-3d-pose" style="font-size:11px;padding:3px 9px;">🔥 切换作战/开火姿态</button></div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">'
        + modelButtons.map(([k, l]) => '<button type="button" data-ww2-model="' + k + '" aria-pressed="' + (activeModel === k) + '" style="font-size:10.5px;padding:3px 6px;">' + l + '</button>').join('')
        + '</div></div>'
        + '<div class="hoi-parchment">'
        + '<h4>' + fac.flag + ' ' + escape(fac.name) + ' · 最高统帅：' + escape(fac.leader) + '</h4>'
        + '<p><b>峰值总兵力：</b>' + format(fac.peakPersonnel) + ' 人 · <b>名将团：</b>' + escape(fac.commanders.join(' · ')) + '</p>'
        + '<p><b>核心作战学说：</b>' + escape(fac.doctrine) + '</p>'
        + '<p><b>民族精神：</b>' + escape(fac.spirits.join(' | ')) + '</p>'
        + '<p style="margin-top:4px;">' + escape(fac.summary) + '</p>'
        + '</div></div>'
        + equipTbl('⚓ 航空母舰、战列舰与主力舰艇', fac.arsenal.navy, ['舰级', '数量', '舰种', '战略定位'])
        + equipTbl('✈️ 二战王牌战斗机、强击机与战略轰炸机', fac.arsenal.aircraft, ['机型', '总产量/编配', '极速', '制空/轰炸角色'])
        + equipTbl('🚜 主战坦克、重型坦克与坦克歼击车', fac.arsenal.tanks, ['车型', '产量', '装甲 / 主炮', '战场角色'])
        + equipTbl('💣 野战火炮、重型榴弹炮、反坦炮与火箭炮', fac.arsenal.artillery, ['火炮型号', '产量', '口径', '火力定位'])
        + equipTbl('🔫 步兵主战轻武器与反坦克武器', fac.arsenal.infantryWeapons, ['武器型号', '产量', '软/硬攻', '班排定位']);

      arsenalBox.querySelectorAll('[data-ww2-design]').forEach((b) => b.onclick = () => {
        const [k, v] = b.dataset.ww2Design.split(':');
        const r = Sim.designWW2Equipment(st, st.player, { [k]: v });
        if (!r.ok) notify(r.error); else { notify('新武器设计方案已定型列装！'); redrawAll(); }
      });
      arsenalBox.querySelectorAll('[data-ww2-tpl]').forEach((b) => b.onclick = () => {
        const [k, d] = b.dataset.ww2Tpl.split(':');
        ns.customTemplate[k] = Math.max(0, Math.min(12, (ns.customTemplate[k] || 0) + Number(d)));
        redrawAll();
      });
      arsenalBox.querySelector('#ww2-tpl-recruit')?.addEventListener('click', () => {
        const r = Sim.recruitCustomTemplateWW2(WW2, st, st.player, selectedCityId);
        if (!r.ok) notify(r.error); else { selectedArmy = r.id; notify('自定义 ' + r.width + ' 宽精锐军已成军部署！'); redrawAll(); }
      });
      arsenalBox.querySelector('#ww2-3d-pose')?.addEventListener('click', (ev) => {
        combatPose = !combatPose;
        ev.currentTarget.textContent = combatPose ? '🛑 切回静态检视' : '🔥 切换作战/开火姿态';
      });
      arsenalBox.querySelectorAll('[data-ww2-model]').forEach((btn) => btn.onclick = () => {
        activeModel = btn.dataset.ww2Model;
        arsenalBox.querySelectorAll('[data-ww2-model]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      });
      const c3d = arsenalBox.querySelector('#ww2-3d-canvas');
      if (c3d && preview3DRenderer) {
        const gctx = c3d.getContext('2d');
        const sideKey = st.player === 'ussr' ? 'ccp' : 'roc';
        const spin = (t) => {
          if (!document.body.contains(c3d) || !dialog.open) return;
          gctx.clearRect(0, 0, c3d.width, c3d.height);
          const orbit = (t * 0.00055) % (Math.PI * 2);
          const act = combatPose ? 'attack' : (['zero', 'spitfire', 'b29', 'mig15', 'f86'].includes(activeModel) ? 'march' : 'idle');
          gctx.drawImage(preview3DRenderer.frame(sideKey, true, t, activeModel, act, '', orbit), 0, 0, c3d.width, c3d.height);
          requestAnimationFrame(spin);
        };
        requestAnimationFrame(spin);
      }
    };

    let fxLoopRunning = false;
    const startFxLoop = () => {
      if (fxLoopRunning) return;
      fxLoopRunning = true;
      const tickFx = () => {
        if (!dialog.open || !document.body.contains(mapCanvas) || curTab !== 'sim' || !(st.effects && st.effects.length)) {
          fxLoopRunning = false;
          return;
        }
        hits = Sim.renderWW2Canvas(mapCanvas, WW2, st, {
          theater: st.theater, layer: mapLayer, zoom: mapZoom,
          showRail, showSupply, show3D, showAirRange, renderer3D: preview3DRenderer, drawnArrow, nowMs: Date.now(),
          selectedArmy, selectedCity: selectedCityId,
        });
        requestAnimationFrame(tickFx);
      };
      requestAnimationFrame(tickFx);
    };

    const redrawAll = () => {
      renderHud();
      if (curTab === 'sim') {
        hits = Sim.renderWW2Canvas(mapCanvas, WW2, st, {
          theater: st.theater, layer: mapLayer, zoom: mapZoom,
          showRail, showSupply, show3D, showAirRange, renderer3D: preview3DRenderer, drawnArrow, nowMs: Date.now(),
          selectedArmy, selectedCity: selectedCityId,
        });
        renderCmdPanel();
        if (st.effects && st.effects.length) startFxLoop();
      } else if (curTab === 'arsenal') {
        renderArsenal();
      } else {
        renderSubTab();
      }
    };

    redrawAll();

    body.querySelector('#ww2-audio-toggle')?.addEventListener('click', (ev) => {
      ww2AudioOn = !ww2AudioOn;
      ev.currentTarget.setAttribute('aria-pressed', String(ww2AudioOn));
      ev.currentTarget.textContent = ww2AudioOn ? '🔊 战争音效:开' : '🔇 音效:关';
      if (ww2AudioOn) WarAudio.click();
    });
    body.querySelector('#ww2-draw-front')?.addEventListener('click', (ev) => {
      drawFrontMode = !drawFrontMode;
      drawnArrow = null;
      ev.currentTarget.setAttribute('aria-pressed', String(drawFrontMode));
      ev.currentTarget.textContent = drawFrontMode ? '✏️ 正在画线(拖动)' : '✏️ 画进攻战线';
      notify(drawFrontMode ? '✏️ 手绘战线模式已开启：在地图上按住左键从我方前沿拖向敌城即可画出进攻箭头！' : '已切回常规点选模式。');
      redrawAll();
    });
    mapCanvas.addEventListener('mousedown', (ev) => {
      if (!drawFrontMode) return;
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      drawnArrow = { x1: x, y1: y, x2: x, y2: y };
      redrawAll();
    });
    mapCanvas.addEventListener('mousemove', (ev) => {
      if (!drawFrontMode || !drawnArrow) return;
      const rect = mapCanvas.getBoundingClientRect();
      drawnArrow.x2 = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      drawnArrow.y2 = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      redrawAll();
    });
    mapCanvas.addEventListener('mouseup', () => {
      if (!drawFrontMode || !drawnArrow) return;
      const endX = drawnArrow.x2, endY = drawnArrow.y2;
      const nearCity = hits.cityHits.slice().sort((a, b) => Math.hypot(a.x + 16 - endX, a.y + 12 - endY) - Math.hypot(b.x + 16 - endX, b.y + 12 - endY))[0];
      if (nearCity && selectedArmy) {
        pushWW2Undo();
        const r = Sim.issueWW2Order(WW2, st, selectedArmy, 'attack', nearCity.id);
        if (r.ok) { WarAudio.bugle(); notify('⚔ 手绘进攻箭头已下达：集团军向 ' + nearCity.city.name + ' 全线突击！'); }
        else notify(r.error);
      }
      drawnArrow = null;
      drawFrontMode = false;
      const btn = body.querySelector('#ww2-draw-front');
      if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '✏️ 画进攻战线'; }
      redrawAll();
    });

    body.querySelector('#ww2-back-lobby').onclick = () => {
      const curLeader = WW2.leaders.find((l) => l.nation === st.player)?.id || 'roosevelt';
      openWW2LeaderSelect(curLeader, 'all');
    };
    body.querySelectorAll('[data-ww2-nation]').forEach((btn) => btn.onclick = () => openWW2CampaignPanel(st.scenarioId, btn.dataset.ww2Nation, curTab));
    body.querySelectorAll('[data-ww2-th]').forEach((btn) => btn.onclick = () => {
      st.theater = btn.dataset.ww2Th; mapZoom = 1;
      body.querySelectorAll('[data-ww2-th]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      redrawAll();
    });
    body.querySelectorAll('[data-ww2-tab]').forEach((btn) => btn.onclick = () => {
      curTab = btn.dataset.ww2Tab;
      body.querySelectorAll('[data-ww2-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      body.querySelector('#ww2-tab-sim').hidden = curTab !== 'sim';
      body.querySelector('#ww2-tab-arsenal').hidden = curTab !== 'arsenal';
      body.querySelector('#ww2-tab-sub').hidden = (curTab === 'sim' || curTab === 'arsenal');
      redrawAll();
    });
    body.querySelector('#ww2-3d-toggle')?.addEventListener('click', (ev) => {
      show3D = !show3D;
      ev.currentTarget.setAttribute('aria-pressed', String(show3D));
      redrawAll();
    });
    body.querySelector('#ww2-airrange-toggle')?.addEventListener('click', (ev) => {
      showAirRange = !showAirRange;
      ev.currentTarget.setAttribute('aria-pressed', String(showAirRange));
      redrawAll();
    });
    body.querySelector('#ww2-ai-toggle')?.addEventListener('click', (ev) => {
      st.aiDelegate = !st.aiDelegate;
      ev.currentTarget.setAttribute('aria-pressed', String(st.aiDelegate));
      notify(st.aiDelegate ? '🤖 已将本国集团军委任总参谋部 AI 自动协同推进！' : '已收回手动总指挥权。');
    });
    body.querySelector('#ww2-undo-btn')?.addEventListener('click', () => {
      if (!ww2UndoStack.length) { notify('当前没有可撤回的上一步操作。'); return; }
      ww2State = JSON.parse(ww2UndoStack.pop());
      openWW2CampaignPanel(null, null, curTab);
      notify('↩️ 已撤回上一步二战操作。');
    });
    body.querySelectorAll('[data-ww2-spd]').forEach((b) => b.onclick = () => {
      ww2Speed = Number(b.dataset.ww2Spd);
      body.querySelectorAll('[data-ww2-spd]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#ww2-night-toggle')?.addEventListener('click', (ev) => {
      st.nightMode = !st.nightMode;
      ev.currentTarget.setAttribute('aria-pressed', String(st.nightMode));
      redrawAll();
    });
    body.querySelector('#ww2-forecast-btn')?.addEventListener('click', () => {
      const fc = Sim.forecastWW2(WW2, st, 30);
      notify(`⚑ 30日推演预测（至 ${fc.date}）：我方控制 ${fc.ownedLater} 城（${fc.cityDelta >= 0 ? '+' : ''}${fc.cityDelta}），兵力 ${format(fc.strLater)}（${fc.strDelta >= 0 ? '+' : ''}${format(fc.strDelta)}）`);
    });
    body.querySelector('#ww2-rail-toggle').onclick = (ev) => {
      showRail = !showRail;
      ev.currentTarget.setAttribute('aria-pressed', String(showRail));
      redrawAll();
    };
    body.querySelector('#ww2-supply-toggle').onclick = (ev) => {
      showSupply = !showSupply;
      ev.currentTarget.setAttribute('aria-pressed', String(showSupply));
      redrawAll();
    };
    body.querySelector('#ww2-layer-toggle').onclick = (ev) => {
      mapLayer = mapLayer === 'ww2' ? 'terrain' : mapLayer === 'terrain' ? 'contour' : 'ww2';
      ev.currentTarget.textContent = mapLayer === 'terrain' ? '🗺️ 地形浮雕' : mapLayer === 'contour' ? '🗺️ 等高线' : '🗺️ 势力范围';
      redrawAll();
    };
    mapCanvas.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      const cHit = hits.cityHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (cHit && selectedArmy) {
        pushWW2Undo();
        const r = Sim.issueWW2Order(WW2, st, selectedArmy, pendingOrderMode || 'attack', cHit.id);
        if (r.ok) { WarAudio.bugle(); notify('⚔ 右键快捷命令：已向 ' + cHit.city.name + ' 下达进攻/铁路机动指令！'); redrawAll(); }
        else notify(r.error);
      }
    });
    body.querySelector('#ww2-zoom-in').onclick = () => { mapZoom = Math.min(3.2, mapZoom * 1.3); redrawAll(); };
    body.querySelector('#ww2-zoom-out').onclick = () => { mapZoom = Math.max(1, mapZoom / 1.3); redrawAll(); };
    body.querySelector('#ww2-step1').onclick = () => { pushWW2Undo(); Sim.stepWW2Day(WW2, st, 1); redrawAll(); };
    body.querySelector('#ww2-step7').onclick = () => { pushWW2Undo(); Sim.stepWW2Day(WW2, st, 7); redrawAll(); };
    body.querySelector('#ww2-play').onclick = (ev) => {
      if (ww2Timer) {
        clearInterval(ww2Timer); ww2Timer = null;
        ev.currentTarget.textContent = '▶ 自动';
      } else {
        ev.currentTarget.textContent = '⏸ 暂停';
        ww2Timer = setInterval(() => {
          if (!dialog.open || !document.body.contains(mapCanvas)) { clearInterval(ww2Timer); ww2Timer = null; return; }
          Sim.stepWW2Day(WW2, st, Math.max(1, Math.min(3, Math.ceil(ww2Speed / 2))));
          redrawAll();
        }, Math.max(120, Math.round(520 / ww2Speed)));
      }
    };
    mapCanvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      mapZoom = ev.deltaY < 0 ? Math.min(3.2, mapZoom * 1.15) : Math.max(1, mapZoom / 1.15);
      redrawAll();
    }, { passive: false });
    mapCanvas.onclick = (ev) => {
      const rect = mapCanvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (mapCanvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (mapCanvas.height / rect.height);
      const aHit = hits.armyHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (aHit && aHit.army.nation === st.player) {
        selectedArmy = aHit.id;
        selectedCityId = aHit.army.city;
        redrawAll();
        return;
      }
      const cHit = hits.cityHits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (cHit) {
        selectedCityId = cHit.id;
        if (selectedArmy) {
          const res = Sim.issueWW2Order(WW2, st, selectedArmy, pendingOrderMode, cHit.id);
          if (res.ok) notify('已向 ' + cHit.city.name + ' 下达集团军作战/铁路机动指令！');
          else notify(res.error);
        }
        redrawAll();
      }
    };
  }

  $('game-settings-btn')?.addEventListener('click', openSettingsDialog);
  $('hoi-quick-deploy')?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-quick-deploy]');
    if (!btn) return;
    if (action('deployDirectForceCivil', [btn.dataset.quickDeploy, selectedCity])) {
      WarAudio.bugle();
      saveAuto(true);
      render();
      notify('⚔️ 特种机动力量已免换装直出地图，随时可点选自由调动！');
    }
  });
  $('global-audio-toggle')?.addEventListener('click', (ev) => {
    ww2AudioOn = !ww2AudioOn;
    ev.currentTarget.setAttribute('aria-pressed', String(ww2AudioOn));
    ev.currentTarget.textContent = ww2AudioOn ? '🔊 音效' : '🔇 静音';
    if (ww2AudioOn) WarAudio.click();
  });
  $('world-map-btn')?.addEventListener('click', () => openWorldMapPanel('hybrid', 'china'));
  $('ww2-campaign-btn')?.addEventListener('click', () => openUnifiedCampaignLobby('ww2'));
  $('korean-war-btn')?.addEventListener('click', () => openUnifiedCampaignLobby('korea'));
  $('hoi-theaters')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-hoi-theater]');
    if (!btn) return;
    changeScope('theater', btn.dataset.hoiTheater);
  });
  $('hoi-battle-plans')?.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    const d = btn.dataset;
    if (d.mapTool) {
      setMapTool(d.mapTool);
      if (pendingMapTool) notify(mapToolInfo[pendingMapTool].hint);
    } else if (d.bpCmd) {
      chooseCommand(d.bpCmd);
    } else if (d.bpQuick === 'drawfront') {
      civilDrawFront = !civilDrawFront;
      map.setDrawFront(civilDrawFront);
      renderBattlePlansBar();
      WarAudio.click();
      notify(civilDrawFront ? '✏️ 手绘战线已开启：在地图上按住左键从前沿拖向目标城镇，松手即刻吹号突击！' : '已退出手绘战线模式。');
    } else if (d.bpQuick === 'camp') {
      const u = inspectUnit() || Engine.activeUnits(state).find((x) => !x.parent && x.side === state.player && permitted(x));
      if (!u) { notify('请先点击选择一支己方部队。'); return; }
      const cName = cityName(u.city);
      let pickedDist = u.camp?.distKm || 50;
      let pickedDir = 'enemy';
      const dirOpts = [['enemy', '🎯 自动朝向最近敌城'], ['0', '⬆ 正北'], ['45', '↗ 东北'], ['90', '➡ 正东'], ['135', '↘ 东南'], ['180', '⬇ 正南'], ['225', '↙ 西南'], ['270', '⬅ 正西'], ['315', '↖ 西北']];
      const body = showDialog('⛺ 军队城外自由扎营部署',
        '<div class="hoi-cipher-box">'
        + '<header><strong style="color:#f5e1b0;">当前部队：' + escape(u.name) + '（驻地：' + escape(cName) + (u.camp ? ' · 已在城外 ' + u.camp.distKm + 'km' : ' · 城内') + '）</strong></header>'
        + '<p class="subtext" style="margin:6px 0;">可自由将部队前出至城外指定公里数构筑野战营地（防空/防炮减伤 +25%、阵地警戒 +10%，同时拉近炮兵射程！）。</p>'
        + '<div style="margin:8px 0;"><b>1. 选择距城距离：</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">'
        + [[0, '回城驻防 (0 km)'], [15, '城外 15 km'], [30, '城外 30 km'], [50, '城外 50 km'], [80, '城外 80 km']].map(([km, lbl]) =>
          '<button type="button" data-camp-dist="' + km + '" aria-pressed="' + (pickedDist === km) + '">' + lbl + '</button>').join('')
        + '</div></div>'
        + '<div style="margin:8px 0;"><b>2. 选择部署方位：</b><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;">'
        + dirOpts.map(([val, lbl]) => '<button type="button" data-camp-dir="' + val + '" aria-pressed="' + (pickedDir === val) + '" style="font-size:11px;padding:3px 7px;">' + lbl + '</button>').join('')
        + '</div></div>'
        + '<button type="button" class="gold" id="camp-confirm-btn" style="width:100%;margin-top:8px;">⛺ 立即执行野战扎营部署</button>'
        + '</div>');
      body.querySelectorAll('[data-camp-dist]').forEach((b) => b.onclick = () => {
        pickedDist = Number(b.dataset.campDist);
        body.querySelectorAll('[data-camp-dist]').forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.campDist) === pickedDist)));
      });
      body.querySelectorAll('[data-camp-dir]').forEach((b) => b.onclick = () => {
        pickedDir = b.dataset.campDir;
        body.querySelectorAll('[data-camp-dir]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.campDir === pickedDir)));
      });
      body.querySelector('#camp-confirm-btn').onclick = () => {
        const dirArg = pickedDir === 'enemy' ? 'enemy' : Number(pickedDir);
        if (action('setFieldCamp', [u.id, pickedDist, dirArg])) {
          WarAudio.click(); saveAuto(true); render(); dialog.close();
          notify(pickedDist > 0 ? '⛺ ' + u.name + ' 已前出至 ' + cName + ' 城外 ' + pickedDist + ' km 构筑野战营地！' : '⛺ ' + u.name + ' 已返回 ' + cName + ' 城内驻防。');
        }
      };
    } else if (d.bpQuick === 'artfire') {
      const u = inspectUnit() || Engine.activeUnits(state).find((x) => !x.parent && x.side === state.player && permitted(x));
      if (!u) { notify('请先点击选择一支己方部队。'); return; }
      const fromCity = citiesById.get(u.city);
      const fromLon = u.camp?.lon ?? fromCity?.lon ?? 0;
      const fromLat = u.camp?.lat ?? fromCity?.lat ?? 0;
      const maxRange = Engine.unitArtilleryRangeKm ? Engine.unitArtilleryRangeKm(u) : 60;
      const distFn = Engine.haversineKm || ((a, b, c, d2) => Math.hypot((c - a) * 90, (d2 - b) * 111));
      const enemyTargets = Data.cities
        .filter((c) => state.owners[c.id] !== u.side)
        .map((c) => ({ c, dist: Math.round(distFn(fromLon, fromLat, c.lon, c.lat)) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10);
      let fireMode = 'suppress';
      const body = showDialog('🎯 炮兵 / 远程火力按射程跨距开炮',
        '<div class="hoi-cipher-box">'
        + '<header><strong style="color:#f5e1b0;">开火部队：' + escape(u.name) + ' · 当前最大射程：<span style="color:#ffd866;">' + maxRange + ' km</span>（每次 10 指挥点）</strong></header>'
        + '<p class="subtext" style="margin:5px 0;">部队当前位于 ' + escape(cityName(u.city)) + (u.camp ? ' 城外 ' + u.camp.distKm + 'km 营地' : ' 城内') + '。若目标略超射程，可先点「⛺ 城外扎营」向敌方前出 50–80 km！</p>'
        + '<div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap;">'
        + [['suppress', '💥 覆盖压制'], ['counter', '🎯 反炮兵火力'], ['creeping', '🔥 徐进弹幕']].map(([m, lbl]) =>
          '<button type="button" data-art-mode="' + m + '" aria-pressed="' + (fireMode === m) + '">' + lbl + '</button>').join('')
        + '</div>'
        + '<div style="display:grid;gap:5px;max-height:260px;overflow:auto;">'
        + enemyTargets.map(({ c, dist }) => {
          const inRange = dist <= maxRange;
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:4px;border:1px solid ' + (inRange ? '#c8a355' : '#4a554c') + ';background:' + (inRange ? '#2b3324' : '#1d231f') + ';">'
            + '<span><b>' + escape(c.name) + '</b> · 距离 <b>' + dist + ' km</b> ' + (inRange ? '<span style="color:#7ee094;">✔ 射程内</span>' : '<span style="color:#ff9482;">✘ 超出 ' + (dist - maxRange) + 'km</span>') + '</span>'
            + '<button type="button" class="' + (inRange ? 'gold' : '') + '" data-art-tgt="' + escape(c.id) + '" ' + (inRange ? '' : 'disabled') + '>🎯 开炮</button></div>';
        }).join('')
        + '</div></div>');
      body.querySelectorAll('[data-art-mode]').forEach((b) => b.onclick = () => {
        fireMode = b.dataset.artMode;
        body.querySelectorAll('[data-art-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.artMode === fireMode)));
      });
      body.querySelectorAll('[data-art-tgt]').forEach((b) => b.onclick = () => {
        if (action('artilleryFire', [u.id, b.dataset.artTgt, fireMode])) {
          WarAudio.artillery(); saveAuto(true); render(); dialog.close();
          notify('🎯 炮火齐射已命中 ' + cityName(b.dataset.artTgt) + '！敌军组织度与工事遭受重创！');
        }
      });
    } else if (d.bpQuick === 'realwar') {
      if (Engine.updateBattlefieldWeather && !state.weatherSummary) Engine.updateBattlefieldWeather(Data, state);
      const u = inspectUnit() || Engine.activeUnits(state).find((x) => !x.parent && x.side === state.player && permitted(x));
      const enemyCity = (selectedCity && state.owners[selectedCity] !== state.player)
        ? citiesById.get(selectedCity)
        : Data.cities.find((c) => state.owners[c.id] !== state.player && (cityConnected.get(c.id) || []).some((n) => state.owners[n] === state.player))
          || Data.cities.find((c) => state.owners[c.id] !== state.player);
      const wx = state.weatherSummary || { name: '☀️ 晴朗', desc: '视野开阔，空军与装甲集群正常发挥' };
      const wxRows = Object.entries(state.weather || {}).slice(0, 6).map(([rk, w]) =>
        '<span style="padding:2px 6px;border-radius:4px;background:#222c26;border:1px solid #4c5d50;font-size:11px;">' + escape(regions[rk] || rk) + '：' + escape(w.name) + '</span>').join('');
      const body = showDialog('🎖️ 真实战争自由指挥所（天时 · 战术 · 敌后 · 后勤 · 攻心）',
        '<div style="display:grid;gap:10px;">'
        + '<section class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🌦️ 当前主战区气象：' + escape(wx.name) + '</strong></header>'
        + '<p class="subtext" style="margin:4px 0;">' + escape(wx.desc) + '</p>'
        + '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">' + wxRows + '</div></section>'
        + '<section class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🥷 1. 野战战术姿态自由切换' + (u ? '（当前：' + escape(u.name) + '）' : '') + '</strong></header>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">'
        + [['normal', '常规作战'], ['ambush', '🥷 隐蔽埋伏(+35%反杀)'], ['feint', '🎭 佯攻诱敌'], ['forced_march', '⚡ 强行军(+55%速)'], ['night_infiltrate', '🌙 夜战渗透(避空袭)']].map(([st, lbl]) =>
          '<button type="button" data-rw-stance="' + st + '" aria-pressed="' + ((u?.tacticalStance || 'normal') === st) + '">' + lbl + '</button>').join('')
        + '</div></section>'
        + '<section class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🔥 2. 敌后游击破袭与秘密侦察' + (enemyCity ? '（目标：' + escape(enemyCity.name) + '）' : '') + '</strong></header>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">'
        + '<button type="button" data-rw-guer="recon">🔭 敌后秘密侦察 (8指)</button>'
        + '<button type="button" data-rw-guer="raid_supply">💣 炸毁敌后铁路油库 (15指)</button>'
        + '<button type="button" class="gold" data-rw-guer="uprising">🔥 发动敌后武装起义 (25指)</button>'
        + '</div></section>'
        + '<section class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">📦 3. 战地紧急后勤与灵活拆合编</strong></header>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">'
        + '<button type="button" data-rw-logi="airdrop">🪂 孤军紧急空投粮弹 (8指)</button>'
        + '<button type="button" data-rw-logi="merge">🔧 同城残部战地合编</button>'
        + '<button type="button" data-rw-logi="detach">⚡ 抽调 25% 兵力组穿插支队</button>'
        + '</div></section>'
        + '<section class="hoi-cipher-box"><header><strong style="color:#f5e1b0;">🕊️ 4. 攻心劝降与局部停火谈判</strong></header>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">'
        + '<button type="button" class="gold" data-rw-dip="persuade">📢 阵前劝降起义 (15政 · 需合围或敌组织度<50%)</button>'
        + '<button type="button" data-rw-dip="truce">🤝 秘密谈判局部休战 30 天 (25政)</button>'
        + '</div></section>'
        + '</div>');
      body.querySelectorAll('[data-rw-stance]').forEach((b) => b.onclick = () => {
        if (!u) { notify('请先选中一支己方部队。'); return; }
        if (action('setTacticalStance', [u.id, b.dataset.rwStance])) { WarAudio.click(); saveAuto(true); render(); dialog.close(); notify('🎖️ ' + u.name + ' 已切换战术姿态！'); }
      });
      body.querySelectorAll('[data-rw-guer]').forEach((b) => b.onclick = () => {
        if (!enemyCity) { notify('请先点击一座敌方城镇作为敌后目标。'); return; }
        if (action('guerrillaOperation', [b.dataset.rwGuer, enemyCity.id])) { WarAudio.bugle(); saveAuto(true); render(); dialog.close(); }
      });
      body.querySelectorAll('[data-rw-logi]').forEach((b) => b.onclick = () => {
        if (action('fieldLogisticsAction', [b.dataset.rwLogi, u?.id || null])) { WarAudio.click(); saveAuto(true); render(); dialog.close(); }
      });
      body.querySelectorAll('[data-rw-dip]').forEach((b) => b.onclick = () => {
        if (action('warDiplomacyAction', [b.dataset.rwDip, enemyCity?.id || null])) { WarAudio.click(); saveAuto(true); render(); dialog.close(); }
      });
    } else if (d.bpQuick === 'blitz') {
      const targetEnemy = (selectedCity && state.owners[selectedCity] !== state.player) ? selectedCity
        : Data.cities.find((c) => state.owners[c.id] !== state.player && (cityConnected.get(c.id) || []).some((n) => state.owners[n] === state.player))?.id;
      if (targetEnemy) { applyMapTool('pincer', targetEnemy); WarAudio.bugle(); }
      else notify('未找到相邻敌城，请先点击敌方前线城镇。');
    } else if (d.bpQuick === 'naval3') {
      if (action('civilNavalThreeLineBattle', [])) { WarAudio.artillery(); saveAuto(true); render(); defensePanel('navy'); }
    } else if (d.bpQuick === 'port') {
      const ids = selectedUnits.size ? [...selectedUnits] : selectedUnit ? [selectedUnit] : [];
      if (action('portGarrisonOrder', [ids])) { saveAuto(true); render(); notify('⚓ 已下达死守沿海港口并挖战壕指令！'); }
    } else if (d.bpQuick === 'fallback') {
      const ids = selectedUnits.size ? [...selectedUnits] : selectedUnit ? [selectedUnit] : [];
      if (action('fallbackLineOrder', [ids])) { saveAuto(true); render(); notify('↩️ 已依托河山建立后撤防线并掘壕固守！'); }
    } else if (d.bpQuick === 'exec') {
      setRun(!running);
      renderBattlePlansBar();
    }
  });
  document.querySelector('#sys-menu')?.addEventListener('click', (event) => {
    if (event.target.closest('button')) event.currentTarget.open = false;
  });
  $('inspector-close')?.addEventListener('click', () => setInspectorOpen(false));
  $('tab-city')?.addEventListener('click', () => setInspectorOpen(true));
  $('tab-army')?.addEventListener('click', () => setInspectorOpen(true));
  $('general-dock')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-gen-group]');
    if (!btn) return;
    const key = btn.dataset.genGroup;
    const members = Engine.activeUnits(state).filter((u) => !u.parent && u.side === state.player && permitted(u) && (u.group || u.area || 'main') === key);
    if (!members.length) return;
    selectedUnits = new Set(members.map((u) => u.id));
    selectedUnit = members[0].id;
    selectedCity = members[0].city;
    pane = 'army';
    setMapHelp();
    render();
    map.jump(members[0].city);
    notify('已一键选中该集团军共 ' + members.length + ' 支纵队/军，可直接统一下达作战指令。');
  });
  $('battle-hud')?.addEventListener('click', (event) => {
    const cycleBtn = event.target.closest('[data-battle-cycle]');
    if (!cycleBtn) return;
    const city = cycleBtn.dataset.battleCycle;
    const neighbors = (cityConnected.get(city) || []).filter((id) => state.owners[id] === state.player);
    if (!neighbors.length) { notify('已被合围，无相邻己方城镇可供换防撤出！'); return; }
    const defenders = Engine.activeUnits(state).filter((u) => !u.parent && u.side === state.player && u.city === city)
      .sort((a, b) => valueOf(a, 'org', 100) - valueOf(b, 'org', 100));
    const low = defenders[0];
    if (!low) return;
    if (action('order', [low.id, 'rest', neighbors[0]])) {
      saveAuto(true); render();
      notify('车轮战换防：' + low.name + ' 撤往' + cityName(neighbors[0]) + '休整回组织度！');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!dialog.open && !event.target.closest('input,select,textarea')) {
      const fMap = { F1: ['layer', 'situation'], F2: ['layer', 'terrain'], F3: ['overlay', 'supply'], F4: ['layer', 'faction'] };
      if (fMap[event.key]) {
        event.preventDefault();
        const [kind, val] = fMap[event.key];
        document.querySelector('[data-' + kind + '="' + val + '"]')?.click();
        return;
      }
    }
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
    if (event.error) notify('操作遇到问题，请检查当前操作。');
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
      scenarioId: 'war1946', scope: 'national', side: 'ccp', historyMode: 'dynamic', goal: 'mainland',
    });
    setActive(initial, restored?.timeline || Timeline.create(initial, Engine), false);
  }
  restoreSavedGame().catch(() => {
    const initial = Engine.createGame(Data, {
      scenarioId: 'war1946', scope: 'national', side: 'ccp', historyMode: 'dynamic', goal: 'mainland',
    });
    setActive(initial, Timeline.create(initial, Engine), false);
  }).then(() => openUnifiedCampaignLobby('ww2', { isStartup: true }));
})();



