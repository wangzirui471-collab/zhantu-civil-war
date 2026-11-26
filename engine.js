(() => {
  'use strict';

  const sides = ['ccp', 'roc'];
  const levels = { low: 0.65, normal: 1, high: 1.45 };
  const sideNames = { ccp: '共产党', roc: '国民政府' };
  const equipmentProfiles = {
    infantry: { name: '步兵装备', days: 0, attack: 1, defense: 1, siege: 1, screen: 1, upkeep: 1, cost: 0.025 },
    artillery: { name: '炮兵装备', days: 1, attack: 1.08, defense: 0.96, siege: 1.35, screen: 0.86, upkeep: 1.18, cost: 0.06 },
    mobile: { name: '机动装备', days: -2, attack: 1.03, defense: 0.96, siege: 0.82, screen: 1.3, upkeep: 1.13, cost: 0.045 },
  };
  const hostileOrders = new Set(['advance', 'siege', 'intercept']);
  const targetOrders = ['advance', 'move', 'defend', 'siege', 'intercept', 'bombard'];
  const supportKinds = { infantry: '步兵', armor: '装甲', artillery: '炮兵', engineer: '工兵', medical: '医护', transport: '运输' };
  const supportKeys = Object.keys(supportKinds);
  const supportBase = {
    infantry: { infantry: 34, armor: 6, artillery: 16, engineer: 12, medical: 16, transport: 20 },
    artillery: { infantry: 24, armor: 4, artillery: 34, engineer: 10, medical: 12, transport: 16 },
    mobile: { infantry: 26, armor: 28, artillery: 12, engineer: 8, medical: 12, transport: 26 },
  };
  const fortKinds = {
    trench: { name: '战壕', days: 4, tier: 3, defense: 0.05, cost: { arms: 16, treasury: 10 } },
    bunker: { name: '掩体', days: 6, tier: 3, defense: 0.06, cost: { arms: 24, treasury: 14 } },
    obstacle: { name: '障碍', days: 3, tier: 3, defense: 0.03, attack: 0.035, cost: { arms: 12, treasury: 8 } },
    pillbox: { name: '碉堡', days: 7, tier: 3, defense: 0.07, cost: { arms: 32, treasury: 20 } },
    gun: { name: '固定炮位', days: 8, tier: 3, defense: 0.05, siege: 0.06, cost: { arms: 38, treasury: 24 } },
    depot: { name: '补给站', days: 5, tier: 2, supply: 0.25, cost: { arms: 20, treasury: 28 } },
  };
  const supplyGoods = { ammo: '弹药', fuel: '油料', medical: '医疗物资' };
  const planModes = { advance: '进攻', siege: '围城', intercept: '围点打援', defend: '布防', move: '调动' };
  const dayMillis = 86_400_000;
  const baseDate = '1945-08-15';
  const indexes = new WeakMap();
  const terrainCache = new WeakMap();

  function index(data) {
    if (indexes.has(data)) return indexes.get(data);

    const cities = new Map(data.cities.map(city => [city.id, city]));
    const neighbors = new Map(data.cities.map(city => [city.id, []]));
    for (const [from, to] of data.links ?? []) {
      neighbors.get(from)?.push(to);
      neighbors.get(to)?.push(from);
    }
    const events = new Map();
    for (const event of data.events ?? []) {
      if (!events.has(event.date)) events.set(event.date, []);
      events.get(event.date).push(event);
    }
    const anchors = [...(data.anchors ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const strength = (data.units ?? []).reduce((sum, unit) => sum + (Number(unit.strength) || 0), 0);
    const result = {
      cities, neighbors, events, anchors, routeTypes: data.routeTypes ?? {}, data,
      bombardRange: Math.max(18, Math.min(30, Math.sqrt(data.cities.length) * 1.1)),
      resourceScale: Math.max(1, strength / 100_000),
    };
    indexes.set(data, result);
    return result;
  }

  function shiftDays(date, days) {
    return new Date(Date.parse(date) + days * dayMillis).toISOString().slice(0, 10);
  }

  function shiftMonths(date, months) {
    const original = new Date(date);
    const year = original.getUTCFullYear();
    const month = original.getUTCMonth() + months;
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(original.getUTCDate(), last))).toISOString().slice(0, 10);
  }

  function normalizeDate(date, fallback) {
    if (typeof date !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(date) || !Number.isFinite(Date.parse(date))) {
      return fallback;
    }
    return new Date(date).toISOString().slice(0, 10) === date ? date : fallback;
  }

  function addLog(state, text, type, fields = {}) {
    const previous = state.eventSequence ?? state.log.at(-1)?.seq ?? state.log.length;
    state.eventSequence = previous + 1;
    const entry = { date: state.date, text, type, ...fields, seq: state.eventSequence };
    state.log.push(entry);
    if (state.log.length > 260) state.log.splice(0, state.log.length - 260);
    return entry;
  }

  function snapshot(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function strengthShare(total, index, parts) {
    return Math.floor(total / parts) + Number(index < total % parts);
  }

  function profileFor(unit) {
    if (Object.hasOwn(equipmentProfiles, unit.profile)) return equipmentProfiles[unit.profile];
    if (Object.hasOwn(equipmentProfiles, unit.branch)) return equipmentProfiles[unit.branch];
    return equipmentProfiles.infantry;
  }

  function initialBranch(seed) {
    if (Object.hasOwn(equipmentProfiles, seed.branch)) return seed.branch;
    if (/炮兵/.test(seed.name)) return 'artillery';
    if (/骑兵|装甲|机械化/.test(seed.name)) return 'mobile';
    return 'infantry';
  }

  function num(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function unitAmmo(unit) { return num(unit.ammo, 100); }
  function unitFuel(unit) { return num(unit.fuel, 100); }
  function unitMedical(unit) { return num(unit.medical, 100); }
  function unitMorale(unit) { return num(unit.morale, 70); }
  function unitVeteran(unit) { return num(unit.veteran, 0); }
  function unitOrg(unit) { return num(unit.org, 100); }
  function unitBranch(unit) {
    const branch = unit.branch ?? unit.profile;
    return Object.hasOwn(supportBase, branch) ? branch : 'infantry';
  }
  function unitSupport(unit) {
    const base = supportBase[unitBranch(unit)];
    const own = unit.support;
    if (!own) return base;
    const copy = { ...base };
    for (const key of supportKeys) if (Number.isFinite(own[key])) copy[key] = own[key];
    return copy;
  }
  function clampValue(value, min, max) { return Math.max(min, Math.min(max, value)); }

  // 支援兵种按与基础编制的差额计分，满编时严格为 1，旧存档与旧战局平衡不受影响。
  function supportFactor(unit, defend) {
    const base = supportBase[unitBranch(unit)];
    const own = unitSupport(unit);
    const weights = defend
      ? { infantry: 0.0020, engineer: 0.0026, medical: 0.0016, artillery: 0.0012, armor: 0.0016, transport: 0.0006 }
      : { infantry: 0.0016, armor: 0.0030, artillery: 0.0026, transport: 0.0008, engineer: 0.0006, medical: 0.0003 };
    let total = 0;
    for (const key of supportKeys) total += (own[key] - base[key]) * weights[key];
    return clampValue(1 + total, 0.72, 1.34);
  }

  function unitFortDefense(unit, state) {
    const forts = state.forts?.[unit.city];
    if (!forts) return 0;
    let defense = 0;
    for (const [kind, level] of Object.entries(forts)) {
      const definition = fortKinds[kind];
      if (!definition || !definition.defense) continue;
      defense += definition.defense * Math.min(definition.tier, Number(level) || 0);
    }
    return Math.min(0.42, defense);
  }

  function unitFortAttack(unit, state) {
    const forts = state.forts?.[unit.city];
    if (!forts || !forts.obstacle) return 0;
    return Math.min(0.14, fortKinds.obstacle.attack * Math.min(fortKinds.obstacle.tier, Number(forts.obstacle) || 0));
  }

  function createArmy(state, map, seed) {
    if (!map.cities.has(seed.city) || !sides.includes(seed.side)) return;

    const size = Math.max(0, Math.round(Number(seed.strength) || 0));
    const capacity = Math.max(size, Math.round(Number(seed.maxStrength) || size));
    const start = map.cities.get(seed.city);
    const city = state.owners[seed.city] === seed.side
      ? start
      : closestFriendly(map, state, seed.city, seed.side) ?? start;
    const branch = initialBranch(seed);
    const base = supportBase[branch];
    const equipment = Number(seed.equipment) || 70;
    const trim = Math.round((equipment - 71) / 8);
    const army = {
      id: seed.id, name: seed.name, side: seed.side, city: city.id, leader: seed.leader ?? null,
      strength: size, maxStrength: capacity, food: seed.food ?? 100, equipment,
      area: city.region ?? seed.area, group: seed.group ?? null, level: 'army', delegated: false,
      delegateTarget: null, branch, profile: seed.profile ?? branch,
      design: state.designs?.[seed.side]?.[0]?.id ?? null,
      ammo: 100, fuel: 100, medical: 100, morale: 70, veteran: 0, wounded: 0, org: 100,
      support: {
        infantry: base.infantry,
        armor: clampValue(base.armor + trim, 0, 100), artillery: clampValue(base.artillery + trim, 0, 100),
        engineer: base.engineer, medical: base.medical, transport: base.transport,
      },
    };
    state.units.push(army);
    for (let divisionIndex = 0; divisionIndex < 2; divisionIndex += 1) {
      const divisionSize = strengthShare(size, divisionIndex, 2);
      const divisionCapacity = strengthShare(capacity, divisionIndex, 2);
      const division = {
        ...army, id: army.id + '-d' + (divisionIndex + 1), parent: army.id,
        name: army.name + ' · ' + (divisionIndex + 1) + '师（模拟）',
        strength: divisionSize, maxStrength: divisionCapacity, level: 'division', modeled: true,
        support: { ...army.support },
      };
      state.units.push(division);
      for (let regimentIndex = 0; regimentIndex < 3; regimentIndex += 1) {
        const regimentSize = strengthShare(divisionSize, regimentIndex, 3);
        state.units.push({
          ...division, id: division.id + '-r' + (regimentIndex + 1), parent: division.id,
          name: division.name.replace('（模拟）', '') + ' · ' + (regimentIndex + 1) + '团（模拟）',
          strength: regimentSize, maxStrength: strengthShare(divisionCapacity, regimentIndex, 3), level: 'regiment',
          support: { ...division.support },
        });
      }
    }
    return army;
  }

  function startingEconomy(map, data, state, side) {
    const owned = data.cities.filter(city => state.owners[city.id] === side);
    const value = owned.reduce((sum, city) => sum + (Number(city.value) || 1), 0);
    const cities = Math.max(owned.length, 1);
    const armySize = state.units.filter(unit => unit.side === side && unit.level === 'army')
      .reduce((sum, unit) => sum + unit.strength, 0);
    const supplyBase = Math.max(cities * 180, armySize * 0.32);
    return {
      treasury: Math.round((value * 60 + 450) * map.resourceScale),
      food: Math.round(supplyBase),
      arms: Math.round(supplyBase * 0.5),
      manpower: Math.round(supplyBase * 0.65),
    };
  }

  function createGame(data, options = {}) {
    const map = index(data);
    const scenarios = data.scenarios ?? [];
    const chosenScenario = scenarios.find(scenario => scenario.id === options.scenarioId)
      ?? scenarios.find(scenario => scenario.date === options.date)
      ?? scenarios[0];
    const date = normalizeDate(options.date, chosenScenario?.date ?? baseDate);
    const player = sides.includes(options.side) ? options.side : 'ccp';
    const owners = Object.fromEntries(data.cities.map(city => [
      city.id, city.owner === 'ccp' || city.side === 'ccp' || city.initialOwner === 'ccp' ? 'ccp' : 'roc',
    ]));
    for (const anchor of map.anchors) {
      if (anchor.date > date) break;
      for (const side of sides) {
        for (const id of anchor[side] ?? []) {
          if (map.cities.has(id)) owners[id] = side;
        }
      }
    }
    const overrides = chosenScenario?.date === date ? chosenScenario.overrides : null;
    for (const [id, side] of Object.entries(overrides ?? {})) {
      if (map.cities.has(id) && sides.includes(side)) owners[id] = side;
    }

    const state = {
      date, player, scenarioId: chosenScenario?.id ?? null, group: null,
      scope: options.scope === 'theater' ? 'theater' : 'national',
      area: options.area ?? chosenScenario?.area ?? map.cities.get(chosenScenario?.focus)?.region
        ?? data.cities[0]?.region ?? null,
      historyMode: options.historyMode === 'dynamic' ? 'dynamic' : 'historical',
      goal: options.goal === 'all' ? 'all' : 'mainland',
      owners, units: [], economy: {},
      coreOwners: {},
      policies: { recruit: 'normal', industry: 'normal', supply: 'normal' },
      historicalEvents: {},
      plans: [], forts: {}, works: [], logistics: null, battles: {},
      capitals: {}, warSupport: { ccp: 82, roc: 58 },
      foreign: {
        usa: { support: 0, embargo: 0, pressure: 0 },
        ussr: { support: 0, pressure: 0, equipment: 0 },
        japan: { stock: 0, equipment: 0 },
      },
      seaZones: {}, convoy: { ccp: 1, roc: 1 },
      aiFronts: { ccp: [], roc: [] },
      supplyScarcity: {
        ccp: 1, roc: 0.82,
        ...(data.supply?.scarcity ?? {}), ...(chosenScenario?.supply ?? {}), ...(options.supply ?? {}),
      },
      air: { ccp: 16, roc: 54, ...(data.supply?.air ?? {}), ...(chosenScenario?.air ?? {}) },
      recon: { ccp: 34, roc: 46, ...(data.supply?.recon ?? {}), ...(chosenScenario?.recon ?? {}) },
      tally: { ccp: emptyTally(), roc: emptyTally() },
      log: [], eventSequence: 0, winner: null,
    };
    state.coreOwners = { ...owners };
    ensureSystems(state);
    for (const seed of data.units ?? []) {
      if ((!seed.from || seed.from <= date) && (!seed.until || date < seed.until)) createArmy(state, map, seed);
    }
    for (const side of sides) state.economy[side] = startingEconomy(map, data, state, side);
    for (const side of sides) {
      const preferred = data.capitals?.[side];
      const owned = data.cities.filter(city => state.owners[city.id] === side);
      const capital = preferred && state.owners[preferred] === side
        ? map.cities.get(preferred)
        : owned.slice().sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
      state.capitals[side] = capital?.id ?? null;
    }
    ensurePolitics(state);
    ensureLogistics(state);
    if (options.group) setGroup(state, options.group);
    addLog(state, chosenScenario?.title ?? '战局开始', 'start');
    return state;
  }

  function unitTree(state) {
    const byId = new Map();
    const children = new Map();
    const combat = [];
    for (const unit of state.units) {
      byId.set(unit.id, unit);
      if (!unit.parent) continue;
      if (!children.has(unit.parent)) children.set(unit.parent, []);
      children.get(unit.parent).push(unit);
    }
    const armies = [];
    for (const unit of state.units) {
      if (!unit.parent) armies.push(unit);
      if (!children.has(unit.id)) combat.push(unit);
    }
    return { byId, children, combat, armies };
  }

  function activeUnits(state) {
    return state.units.filter(unit => unit.strength > 0 && !unit.inactive);
  }

  function leaves(unit, tree) {
    const children = tree.children.get(unit.id);
    return children ? children.flatMap(child => leaves(child, tree)) : [unit];
  }

  function descendants(unit, tree) {
    const children = tree.children.get(unit.id);
    return children ? children.flatMap(child => [child, ...descendants(child, tree)]) : [];
  }

  function aggregate(map, state, tree) {
    for (let offset = state.units.length - 1; offset >= 0; offset -= 1) {
      const unit = state.units[offset];
      const children = tree.children.get(unit.id);
      if (!children) continue;
      const garrisons = new Map();
      let strength = 0;
      let food = 0;
      let equipment = 0;
      let ammo = 0;
      let fuel = 0;
      let medical = 0;
      let morale = 0;
      let veteran = 0;
      let wounded = 0;
      let org = 0;
      const support = Object.fromEntries(supportKeys.map(key => [key, 0]));
      for (const child of children) {
        if (child.strength <= 0) continue;
        strength += child.strength;
        food += child.food * child.strength;
        equipment += child.equipment * child.strength;
        ammo += unitAmmo(child) * child.strength;
        fuel += unitFuel(child) * child.strength;
        medical += unitMedical(child) * child.strength;
        morale += unitMorale(child) * child.strength;
        veteran += unitVeteran(child) * child.strength;
        wounded += num(child.wounded, 0);
        org += unitOrg(child) * child.strength;
        const memberSupport = unitSupport(child);
        for (const key of supportKeys) support[key] += memberSupport[key] * child.strength;
        garrisons.set(child.city, (garrisons.get(child.city) ?? 0) + child.strength);
      }
      unit.strength = strength;
      if (strength === 0) {
        unit.food = 0;
        unit.equipment = 0;
        unit.wounded = 0;
        clearOrder(unit);
        continue;
      }
      unit.food = Math.round(food / strength);
      unit.equipment = Math.round(equipment / strength);
      unit.ammo = Math.round(ammo / strength);
      unit.fuel = Math.round(fuel / strength);
      unit.medical = Math.round(medical / strength);
      unit.morale = Math.round(morale / strength);
      unit.veteran = Math.round(veteran / strength * 10) / 10;
      unit.wounded = wounded;
      unit.org = Math.round(org / strength);
      unit.support = Object.fromEntries(supportKeys.map(key => [key, Math.round(support[key] / strength)]));
      let leadingCity = unit.city;
      for (const [city, garrison] of garrisons) {
        if (garrison > (garrisons.get(leadingCity) ?? 0)) leadingCity = city;
      }
      unit.city = leadingCity;
      unit.area = map.cities.get(leadingCity)?.region ?? unit.area;
      summarizeOrder(unit, children);
    }
  }

  function setSide(state, side) {
    if (sides.includes(side) && state.player !== side) {
      state.player = side;
      state.group = null;
    }
    return state;
  }

  function setGroup(state, id) {
    if (id !== null && !state.units.some(unit =>
      !unit.parent && unit.side === state.player && unit.group === id && unit.strength > 0)) {
      return { ok: false, error: '该谱系在当前阵营没有在役部队。' };
    }
    state.group = id;
    return { ok: true };
  }

  function setScope(state, scope, area) {
    if (scope === 'theater' || scope === 'national') state.scope = scope;
    if (typeof area === 'string') state.area = area;
    return state;
  }

  function setPolicy(state, key, value) {
    if (!Object.hasOwn(state.policies, key)) return state;
    if (Object.hasOwn(levels, value) || typeof value === 'boolean' || Number.isFinite(value)) {
      state.policies[key] = value;
    }
    return state;
  }

  function setHistoryMode(state, mode) {
    if (mode !== 'historical' && mode !== 'dynamic') return { ok: false, error: '请选择有效的事件模式。' };
    state.historyMode = mode;
    return { ok: true };
  }

  function setHistoricalEvent(state, eventId, enabled) {
    if (typeof eventId !== 'string' || !eventId || typeof enabled !== 'boolean') {
      return { ok: false, error: '请选择有效的史实节点。' };
    }
    state.historicalEvents ??= {};
    if (enabled) delete state.historicalEvents[eventId];
    else state.historicalEvents[eventId] = false;
    return { ok: true };
  }

  function policyLevel(state, side, key) {
    let value = 1;
    if (side === state.player) {
      const policy = state.policies[key];
      if (typeof policy === 'number') value = Math.max(0.35, Math.min(2, policy > 3 ? policy / 100 : policy));
      else if (typeof policy === 'boolean') value = policy ? levels.high : levels.low;
      else value = levels[policy] ?? 1;
    }
    const law = state.laws?.[side];
    if (law) {
      if (key === 'recruit') value *= lawFactors.conscription[law.conscription] ?? 1;
      if (key === 'industry') value *= lawFactors.economy[law.economy] ?? 1;
    }
    return value;
  }

  function canCommand(state, unit) {
    return unit?.side === state.player && (!state.group || unit.group === state.group)
      && unit.strength > 0 && !unit.inactive;
  }

  function assignLeader(tree, unit, leaderId) {
    unit.leader = leaderId;
    for (const child of tree.children.get(unit.id) ?? []) assignLeader(tree, child, leaderId);
  }

  function setLeader(data, state, unitId, leaderId) {
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    const tree = unitTree(state);
    const unit = tree.byId.get(unitId);
    if (!canCommand(state, unit) || unit.parent) {
      return { ok: false, error: '请选择当前可指挥的在役军级部队。' };
    }
    if (leaderId !== null) {
      const leader = (data.leaders ?? []).find(candidate => candidate.id === leaderId && candidate.side === unit.side);
      if (!leader) return { ok: false, error: '请选择当前阵营的将领。' };
      const conflict = tree.armies.find(army => army !== unit && army.leader === leaderId
        && army.strength > 0 && !army.inactive);
      if (unit.leader !== leaderId && conflict) {
        return { ok: false, error: '该将领仍在' + conflict.name + '任职。' };
      }
    }
    assignLeader(tree, unit, leaderId);
    return { ok: true };
  }

  function summarizeProfiles(state, tree) {
    for (let offset = state.units.length - 1; offset >= 0; offset -= 1) {
      const unit = state.units[offset];
      const children = tree.children.get(unit.id)?.filter(child => child.strength > 0);
      if (!children?.length) continue;
      const first = children[0].profile ?? children[0].branch ?? 'infantry';
      unit.profile = children.every(child => (child.profile ?? child.branch ?? 'infantry') === first) ? first : 'mixed';
    }
  }

  function setEquipment(data, state, unitId, profile) {
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    if (!Object.hasOwn(equipmentProfiles, profile)) return { ok: false, error: '请选择有效的装备类型。' };
    const tree = unitTree(state);
    const unit = tree.byId.get(unitId);
    if (!canCommand(state, unit)) return { ok: false, error: '请选择当前可指挥的在役部队。' };
    const recipients = leaves(unit, tree).filter(member => member.strength > 0
      && (member.profile ?? member.branch ?? 'infantry') !== profile);
    if (!recipients.length) return { ok: true };
    const strength = recipients.reduce((sum, member) => sum + member.strength, 0);
    const arms = Math.ceil(strength * equipmentProfiles[profile].cost);
    const treasury = Math.ceil(arms / 4);
    const economy = state.economy[unit.side];
    if (economy.arms < arms || economy.treasury < treasury) {
      return { ok: false, error: '换装需要军械 ' + arms + '、财政 ' + treasury + '。' };
    }
    economy.arms -= arms;
    economy.treasury -= treasury;
    for (const member of recipients) member.profile = profile;
    summarizeProfiles(state, tree);
    addLog(state, unit.name + '完成换装，现使用' + equipmentProfiles[profile].name + '。', 'operation',
      { city: unit.city, side: unit.side, unitId, profile, action: 'equipment' });
    return { ok: true };
  }

  function setDelegated(state, unitId, delegated, targetCity) {
    const tree = unitTree(state);
    let unit = tree.byId.get(unitId);
    while (unit?.parent) unit = tree.byId.get(unit.parent);
    if (!canCommand(state, unit)) return { ok: false, error: '只能委任当前可指挥的部队。' };
    const assigned = Boolean(delegated);
    const target = assigned ? targetCity === undefined ? unit.delegateTarget ?? null : targetCity : null;
    if (target !== null && !Object.hasOwn(state.owners, target)) {
      return { ok: false, error: '请选择有效的委任目标。' };
    }
    if (unit.delegated === assigned && unit.delegateTarget === target) return { ok: true };
    unit.delegated = assigned;
    unit.delegateTarget = target;
    for (const member of leaves(unit, tree)) {
      if (assigned || member.automatedOrder) clearOrder(member);
    }
    refreshOrders(state, tree);
    return { ok: true };
  }

  function friendlyPaths(map, state, from, side, to) {
    const previous = new Map([[from, null]]);
    const queue = [from];
    for (let offset = 0; offset < queue.length; offset += 1) {
      for (const neighbor of map.neighbors.get(queue[offset]) ?? []) {
        if (state.owners[neighbor] !== side || previous.has(neighbor)) continue;
        previous.set(neighbor, queue[offset]);
        if (neighbor === to) return previous;
        queue.push(neighbor);
      }
    }
    return previous;
  }

  function pathTo(previous, to) {
    if (!previous.has(to)) return null;
    const route = [to];
    let from = previous.get(to);
    while (from !== null) {
      route.push(from);
      from = previous.get(from);
    }
    return route.reverse();
  }

  function friendlyRoute(map, state, from, to, side) {
    return from === to ? [from] : pathTo(friendlyPaths(map, state, from, side, to), to);
  }

  function closestFriendly(map, state, start, side) {
    const previous = new Set([start]);
    const queue = [start];
    for (let offset = 0; offset < queue.length; offset += 1) {
      const city = queue[offset];
      if (state.owners[city] === side) return map.cities.get(city);
      for (const neighbor of map.neighbors.get(city) ?? []) {
        if (previous.has(neighbor)) continue;
        previous.add(neighbor);
        queue.push(neighbor);
      }
    }
    return Array.from(map.cities.values()).find(city => state.owners[city.id] === side) ?? null;
  }

  function terrainAt(data, lon, lat) {
    if (!data?.geography?.grids?.length) return null;
    if (!terrainCache.has(data)) {
      const grids = data.geography.grids.map(grid => {
        const binary = typeof atob === 'function' ? atob(grid.samples) : Buffer.from(grid.samples, 'base64').toString('binary');
        const values = new Int16Array(grid.width * grid.height);
        for (let index = 0; index < values.length; index += 1) {
          values[index] = binary.charCodeAt(index * 2) | binary.charCodeAt(index * 2 + 1) << 8;
        }
        return { ...grid, values };
      });
      terrainCache.set(data, grids);
    }
    const grids = terrainCache.get(data);
    const grid = [...grids].reverse().find(item => lon >= item.west && lon <= item.west + (item.width - 1) * item.step
      && lat <= item.north && lat >= item.north - (item.height - 1) * item.step);
    if (!grid) return null;
    const col = clampValue(Math.round((lon - grid.west) / grid.step), 0, grid.width - 1);
    const row = clampValue(Math.round((grid.north - lat) / grid.step), 0, grid.height - 1);
    const elevation = grid.values[row * grid.width + col];
    if (elevation < -1) return { elevation: 0, terrain: 'marsh' };
    const samples = [
      grid.values[row * grid.width + Math.max(0, col - 1)],
      grid.values[row * grid.width + Math.min(grid.width - 1, col + 1)],
      grid.values[Math.max(0, row - 1) * grid.width + col],
      grid.values[Math.min(grid.height - 1, row + 1) * grid.width + col],
    ].filter(value => value >= 0);
    const relief = samples.length ? Math.max(...samples) - Math.min(...samples) : 0;
    const category = elevation > 2800 ? 'mountain' : elevation > 1400 ? 'highland'
      : relief > 650 ? 'rough' : elevation < 100 ? 'plain' : 'hill';
    return { elevation, relief, terrain: category };
  }

  function routeTerrain(data, from, to) {
    const a = data.cities.find(city => city.id === from);
    const b = data.cities.find(city => city.id === to);
    if (!a || !b) return { rough: false, crossing: false, ground: 'plain' };
    const samples = [];
    const count = Math.max(2, Math.ceil(Math.hypot(a.lon - b.lon, a.lat - b.lat) * 3));
    for (let step = 0; step <= count; step += 1) {
      const ratio = step / count;
      const value = terrainAt(data, a.lon + (b.lon - a.lon) * ratio, a.lat + (b.lat - a.lat) * ratio);
      if (value) samples.push(value);
    }
    if (!samples.length) {
      const river = Boolean(b.river) || (['yangtze', 'yellow-river'].includes(a.riverSystem)
        && a.riverSystem === b.riverSystem);
      const rough = /mountain|plateau|岭|山|高原/.test(a.terrain ?? '')
        || /mountain|plateau|岭|山|高原/.test(b.terrain ?? '');
      return { rough, crossing: river, ground: rough ? 'mountain' : 'plain' };
    }
    const mountain = samples.filter(item => item.terrain === 'mountain' || item.terrain === 'highland').length;
    const rough = samples.filter(item => item.terrain === 'rough').length;
    const avgRelief = samples.reduce((sum, item) => sum + item.relief, 0) / samples.length;
    const ground = mountain / samples.length > 0.2 ? 'mountain' : rough / samples.length > 0.3 || avgRelief > 500 ? 'rough' : 'plain';
    const midpoint = samples[Math.floor(samples.length / 2)];
    const crossing = Boolean(b.river || (midpoint && midpoint.relief > 900 && midpoint.elevation < 900));
    return { rough: ground !== 'plain', crossing, ground, elevation: Math.round(samples.reduce((sum, item) => sum + item.elevation, 0) / samples.length) };
  }

  function deploymentDays(map, type, unit, target, from = unit.city, state) {
    const city = map.cities.get(target);
    const sampled = state ? routeTerrain(map.data, from, target) : null;
    const terrain = city?.terrain ?? '';
    const rough = sampled ? sampled.rough : /mountain|plateau|岭|山|高原/.test(terrain);
    const routeType = map.routeTypes[[from, target].sort().join('|')];
    const maritime = routeType ? routeType === 'maritime' : isTaiwan(city) !== isTaiwan(map.cities.get(from));
    const distance = { advance: 5, siege: 12, intercept: 2, bombard: 2 }[type] ?? 3;
    const crossing = map.data ? routeTerrain(map.data, from, target).crossing : Boolean(city?.river);
    let days = distance + profileFor(unit).days + (rough ? 2 : 0)
      + (maritime ? 3 : 0) + (crossing && type !== 'bombard' ? 2 : 0) + (unit.food < 40 ? 2 : 0);
    if (state) {
      const design = unitDesignStats(state, unit);
      const leader = leaderBonus(state, unit);
      days /= Math.max(0.6, design.speed * leader.speed);
      if (buffValue(state, unit, 'forcedMarch')) days /= 1.35;
      if (maritime && hostileOrders.has(type)) days += 4;
    }
    return Math.max(1, Math.round(days));
  }

  function clearOrder(unit) {
    delete unit.order;
    delete unit.orderDays;
    delete unit.automatedOrder;
    delete unit.orderUnit;
    delete unit.orderPlan;
    delete unit.seaAssault;
  }

  function summarizeOrder(unit, children) {
    const active = children.filter(child => child.strength > 0);
    const first = active[0]?.order;
    if (!first || !active.every(child => child.order?.type === first.type
      && (first.type === 'hold' || child.order?.target === first.target))) {
      clearOrder(unit);
      return;
    }

    unit.order = { type: first.type, target: first.type === 'hold' ? unit.city : first.target };
    unit.automatedOrder = active.every(child => child.automatedOrder);
    unit.orderDays = Math.max(...active.map(child => child.orderDays ?? 0));
  }

  function refreshOrders(state, tree) {
    for (let offset = state.units.length - 1; offset >= 0; offset -= 1) {
      const unit = state.units[offset];
      const children = tree.children.get(unit.id);
      if (children) summarizeOrder(unit, children);
    }
  }

  function assignOrder(map, state, unit, type, target, automated = false, orderUnit = unit.id, route) {
    unit.order = { type, target };
    unit.automatedOrder = automated;
    delete unit.garrison;
    if (automated) delete unit.orderUnit;
    else unit.orderUnit = orderUnit;
    const firstStop = (type === 'move' || type === 'defend' || type === 'bombard')
      ? (route ?? friendlyRoute(map, state, unit.city, target, unit.side))?.[1]
      : target;
    unit.orderDays = type === 'hold' || !firstStop ? 0 : deploymentDays(map, type, unit, firstStop, unit.city, state);
  }

  function commandContext(data, state, unitId) {
    const map = index(data);
    const tree = unitTree(state);
    const unit = tree.byId.get(unitId);
    const members = canCommand(state, unit) ? leaves(unit, tree).filter(member => member.strength > 0) : [];
    const routes = new Map();
    const estimates = new Map();
    return { map, state, tree, unit, members, routes, estimates };
  }

  function plannedRoute(context, type, member, destination) {
    const { map, state, routes } = context;
    if (type === 'hold') return [member.city];
    if (type === 'bombard') {
      if ((state.airWar?.[member.side]?.planes ?? 0) <= 0) return null;
      const target = map.cities.get(destination);
      const bases = [...map.cities.values()].filter(city => state.owners[city.id] === member.side
        && (Number(city.value) || 0) >= 5);
      const inRange = bases.some(base => target && Math.hypot(base.lon - target.lon, (base.lat - target.lat) * 1.25) <= map.bombardRange);
      return inRange ? [member.city, destination] : null;
    }
    if (hostileOrders.has(type)) {
      if (map.neighbors.get(member.city)?.includes(destination)) return [member.city, destination];
      if (seaLink(map, member.city, destination)) return [member.city, destination];
      return null;
    }
    if (!routes.has(member.city)) routes.set(member.city, friendlyPaths(map, state, member.city, member.side));
    return pathTo(routes.get(member.city), destination);
  }

  function estimateDays(context, type, member, route) {
    const key = [type, member.profile ?? member.branch, member.food < 40, route[0], route.at(-1)].join('|');
    if (!context.estimates.has(key)) {
      let days = 0;
      for (let offset = 1; offset < route.length; offset += 1) {
        days += deploymentDays(context.map, offset === 1 ? type : 'move', member, route[offset], route[offset - 1], context.state);
      }
      context.estimates.set(key, days);
    }
    return context.estimates.get(key);
  }

  function validateOrder(context, type, target) {
    const { state, map, unit, members } = context;
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    if (!members.length) return { ok: false, error: '只能向当前可指挥的在役部队下令。' };
    if (!targetOrders.includes(type) && type !== 'hold' && type !== 'bombard') {
      return { ok: false, error: '无法识别此命令。' };
    }
    const destination = type === 'hold' ? unit.city : target ?? unit.city;
    if (type === 'bombard') {
      const targetCity = map.cities.get(destination);
      if (!targetCity || state.owners[destination] === unit.side) return { ok: false, error: '请选择敌方城镇。' };
      if ((state.airWar?.[unit.side]?.mission ?? '') === 'airdrop') return { ok: false, error: '空军正在执行空投补给，不能同时战略轰炸。' };
      const bases = [...map.cities.values()].filter(city => state.owners[city.id] === unit.side
        && (Number(city.value) || 0) >= 5);
      const inRange = bases.some(base => Math.hypot(base.lon - targetCity.lon, (base.lat - targetCity.lat) * 1.25) <= 18);
      if (!inRange) return { ok: false, error: '目标超出空军作战半径。' };
      if ((state.airWar?.[unit.side]?.planes ?? 0) < 10) return { ok: false, error: '可用机队不足。' };
      return { ok: true, days: 1, route: [unit.city, destination], recipients: members.map(member => ({ member, route: [member.city, destination] })), destination };
    }
    if (type !== 'hold' && !map.cities.has(destination)) return { ok: false, error: '请选择有效城市。' };
    if ((type === 'move' || type === 'defend') && state.owners[destination] !== unit.side) {
      return { ok: false, error: '调动与布防需要友方城市。' };
    }
    if (hostileOrders.has(type) && state.owners[destination] === unit.side) {
      return { ok: false, error: '目标已由本方控制，请使用调动。' };
    }
    const recipients = [];
    let days = -1;
    let route;
    for (const member of members) {
      const routeForMember = type === 'bombard' ? [member.city, destination]
        : plannedRoute(context, type, member, destination);
      if (!routeForMember) continue;
      recipients.push({ member, route: routeForMember });
      const time = estimateDays(context, type, member, routeForMember);
      if (time > days) {
        days = time;
        route = routeForMember;
      }
    }
    if (!recipients.length) return {
      ok: false, error: hostileOrders.has(type) ? '目标须与出发城市相邻，或隔海可渡。' : '没有可用的友方通路。',
    };
    if (hostileOrders.has(type)) {
      for (const { member } of recipients) {
        if (!seaLink(map, member.city, destination)) continue;
        const need = Math.ceil(member.strength / 1500);
        const have = state.navy?.[member.side]?.transports ?? 0;
        if (have < need) {
          return { ok: false, error: '渡海进攻需要运输船 ' + need + '，当前只有 ' + Math.floor(have) + '。' };
        }
      }
    }

    return { ok: true, days, route, recipients, destination };
  }

  function publicPreview({ recipients, destination, ...result }) {
    return result;
  }

  function previewOrder(data, state, unitId, type, target) {
    return publicPreview(validateOrder(commandContext(data, state, unitId), type, target));
  }

  function previewOrders(data, state, unitId) {
    const context = commandContext(data, state, unitId);
    const previews = Object.create(null);
    for (const city of data.cities) {
      previews[city.id] = Object.fromEntries(targetOrders.map(type => [
        type, publicPreview(validateOrder(context, type, city.id)),
      ]));
    }
    return previews;
  }

  function order(data, state, unitId, type, target) {
    const context = commandContext(data, state, unitId);
    const result = validateOrder(context, type, target);
    if (!result.ok) return result;
    const { map, tree, unit } = context;
    const { recipients, destination } = result;
    for (const { member, route } of recipients) {
      assignOrder(map, state, member, type, type === 'hold' ? member.city : destination, false, unit.id, route);
      if (type === 'advance' && seaLink(map, member.city, destination)) member.seaAssault = true;
      else delete member.seaAssault;
    }
    refreshOrders(state, tree);
    if (type === 'bombard') {
      for (const plan of state.plans ?? []) {
        if (plan.side === unit.side && plan.status === 'active' && plan.units.includes(unit.id)) plan.prep = 10;
      }
    }
    if (type === 'hold' || type === 'defend' && recipients.every(({ member }) => member.city === destination)) {
      addLog(state, unit.name + (type === 'hold' ? '已转入驻防。' : '已完成布防。'), 'operation',
        { city: destination, side: unit.side, unitId, action: type, phase: 'completed' });
    }
    return { ok: true };
  }

  function emptyTally() {
    return { battles: 0, wins: 0, casualties: 0, wounded: 0, prisoners: 0, captured: 0 };
  }

  function leafStrength(state, side) {
    const parents = new Set(state.units.map(unit => unit.parent).filter(Boolean));
    let total = 0;
    for (const unit of state.units) {
      if (parents.has(unit.id) || (side && unit.side !== side)) continue;
      total += num(unit.strength, 0);
    }
    return total / 1000;
  }

  function ensureLogistics(state) {
    state.logistics ??= {};
    for (const side of sides) {
      const previous = state.logistics[side];
      if (previous && Number.isFinite(previous.ammo)) continue;
      const factor = Math.max(0, (num(state.supplyScarcity?.[side], 1) * 0.75 + 0.25));
      const strength = leafStrength(state, side);
      state.logistics[side] = { ammo: strength * 26 * factor, fuel: strength * 13 * factor,
        medical: strength * 7.5 * factor };
    }
    state.forts ??= {};
    state.works ??= [];
    state.plans ??= [];
    state.battles ??= {};
    state.tally ??= { ccp: emptyTally(), roc: emptyTally() };
    for (const side of sides) state.tally[side] = { ...emptyTally(), ...(state.tally[side] ?? {}) };
    state.supplyScarcity ??= { ccp: 1, roc: 0.82 };
    state.air ??= { ccp: 16, roc: 54 };
    state.recon ??= { ccp: 34, roc: 46 };
    for (const unit of state.units) {
      unit.ammo = num(unit.ammo, 100);
      unit.fuel = num(unit.fuel, 100);
      unit.medical = num(unit.medical, 100);
      unit.morale = num(unit.morale, 70);
      unit.veteran = num(unit.veteran, 0);
      unit.wounded = num(unit.wounded, 0);
      unit.org = num(unit.org, 100);
      const base = supportBase[unitBranch(unit)];
      if (!unit.support) unit.support = { ...base };
      else for (const key of supportKeys) unit.support[key] = num(unit.support[key], base[key]);
    }
    return state;
  }

  function prepare(data, state) {
    index(data);
    ensureLogistics(state);
    ensurePolitics(state);
    ensureSystems(state);
    state.coreOwners ??= { ...state.owners };
    state.terrainData = data;
    for (const unit of state.units) {
      if (!map_has(data, unit.city)) unit.city = data.cities[0]?.id ?? unit.city;
    }
    return state;
  }

  function map_has(data, id) {
    return (data.cities ?? []).some(city => city.id === id);
  }

  function approachValue(current, target, step) {
    return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
  }

  function railDegree(map, city) {
    let count = 0;
    for (const neighbor of map.neighbors.get(city) ?? []) {
      if (map.routeTypes[[city, neighbor].sort().join('|')] === 'rail') count += 1;
    }
    return count;
  }

  function linkType(map, a, b) {
    return map.routeTypes[[a, b].sort().join('|')] ?? 'land';
  }

  function supplyNetwork(map, state, side) {
    const cost = new Map();
    const parent = new Map();
    const via = new Map();
    const done = new Set();
    const queue = [];
    let fallback = null;
    for (const city of map.cities.values()) {
      if (state.owners[city.id] !== side) continue;
      const outlets = railDegree(map, city.id);
      const depot = (state.forts?.[city.id]?.depot ?? 0) > 0;
      if (depot || outlets >= 2 || city.terrain === 'rail' || (Number(city.value) || 0) >= 5) {
        cost.set(city.id, 0);
        parent.set(city.id, null);
        via.set(city.id, 'local');
        queue.push(city.id);
      } else if (!fallback || (Number(city.value) || 0) > (Number(fallback.value) || 0)) {
        fallback = city;
      }
    }
    if (!queue.length && fallback) {
      cost.set(fallback.id, 0);
      parent.set(fallback.id, null);
      via.set(fallback.id, 'local');
      queue.push(fallback.id);
    }
    while (queue.length) {
      let pick = 0;
      for (let offset = 1; offset < queue.length; offset += 1) {
        if ((cost.get(queue[offset]) ?? Infinity) < (cost.get(queue[pick]) ?? Infinity)) pick = offset;
      }
      const city = queue.splice(pick, 1)[0];
      if (done.has(city)) continue;
      done.add(city);
      for (const neighbor of map.neighbors.get(city) ?? []) {
        if (state.owners[neighbor] !== side || done.has(neighbor)) continue;
        const type = linkType(map, city, neighbor);
        const sea = state.seaZones?.[[city, neighbor].sort().join('|')];
        const zone = map.cities.get(city)?.region;
        const ownMission = state.navy?.[side]?.zones?.[zone]?.mission;
        const enemySide = side === 'ccp' ? 'roc' : 'ccp';
        const enemyMission = state.navy?.[enemySide]?.zones?.[zone]?.mission;
        const escort = (sea?.[side]?.mission === 'escort' || ownMission === 'escort') ? 0.7 : 1;
        const raided = (sea?.[enemySide]?.mission === 'raid' || enemyMission === 'raid') ? 1.8 : 1;
        const convoy = clampValue(1.2 - (1 - (state.convoy?.[side] ?? 1)) * 1.4, 0.25, 1.25);
        const ownPatrol = num(state.navy?.[side]?.patrol, 0) > 0;
        const enemyPatrol = num(state.navy?.[enemySide]?.patrol, 0) > 0;
        const patrolControl = ownMission === 'patrol' || ownPatrol ? 0.8
          : enemyMission === 'patrol' || enemyPatrol ? 1.25 : 1;
        const weight = (type === 'rail' ? 1 : type === 'maritime' ? 6 * escort * raided * convoy * patrolControl : 3);
        const next = (cost.get(city) ?? Infinity) + weight;
        if (next < (cost.get(neighbor) ?? Infinity)) {
          cost.set(neighbor, next);
          parent.set(neighbor, city);
          via.set(neighbor, type === 'rail' ? 'rail' : type === 'maritime' ? 'sea' : 'road');
          queue.push(neighbor);
        }
      }
    }
    return { cost, parent, via };
  }

  function supplyCoverage(step) {
    if (step === undefined) return 0;
    if (step <= 2) return 1;
    if (step <= 5) return 0.9;
    if (step <= 8) return 0.7;
    if (step <= 12) return 0.45;
    return 0.2;
  }

  function supplyEdges(map, state, network, unit) {
    const edges = [];
    let city = unit.city;
    let hops = 0;
    while (network.parent.get(city) != null && hops < 40) {
      const from = network.parent.get(city);
      const key = [city, from].sort().join('|');
      if (linkType(map, city, from) === 'rail') edges.push(key);
      city = from;
      hops += 1;
    }
    return edges;
  }

  function supplyPlan(map, state, side, units) {
    const network = supplyNetwork(map, state, side);
    const loads = new Map();
    const routes = new Map();
    for (const unit of units) {
      const edges = supplyEdges(map, state, network, unit);
      routes.set(unit.id, edges);
      const weight = unit.strength / 1000 * 1.15;
      for (const key of edges) loads.set(key, (loads.get(key) ?? 0) + weight);
    }
    const severity = new Map();
    const bottlenecks = [];
    for (const [key, load] of loads) {
      const [a, b] = key.split('|');
      const outlets = (railDegree(map, a) + railDegree(map, b)) / 2;
      const capacity = 52 + outlets * 14;
      const ratio = load / capacity;
      severity.set(key, Math.max(0, ratio - 0.85));
      if (ratio > 1) bottlenecks.push({ edge: key, cities: [a, b], load: Math.round(load),
        capacity: Math.round(capacity), side, severity: Math.round(ratio * 100) / 100 });
    }
    return { network, routes, severity, bottlenecks };
  }

  function unitSupplyNeed(unit, state) {
    const base = unit.strength / 1000;
    const active = hostileOrders.has(unit.order?.type) || unit.order?.type === 'move';
    const mobile = unitBranch(unit) === 'mobile';
    const factor = state ? unitDesignStats(state, unit).supply : 1;
    return {
      ammo: base * (active ? 1.25 : 0.45) * factor,
      fuel: base * (active ? 0.72 : 0.22) * (mobile ? 1.7 : 1) * factor,
      medical: (base * 0.18 + 0.05) * factor,
    };
  }

  function pocketFactor(map, state, city, side) {
    const neighbors = map.neighbors.get(city) ?? [];
    if (neighbors.some(id => state.owners[id] === side)) return 1;
    return (state.forts?.[city]?.depot ?? 0) > 0 ? 0.75 : 0.5;
  }

  function supplyStep(data, map, state, combat) {
    ensureLogistics(state);
    const living = combat.filter(unit => unit.strength > 0 && !unit.inactive);
    const report = { ccp: null, roc: null };
    for (const side of sides) {
      const units = living.filter(unit => unit.side === side);
      const logistics = state.logistics[side];
      const owned = data.cities.filter(city => state.owners[city.id] === side);
      const value = owned.reduce((sum, city) => sum + (Number(city.value) || 1), 0);
      const strength = units.reduce((sum, unit) => sum + unit.strength, 0) / 1000;
      const industry = policyLevel(state, side, 'industry');
      const scarcity = num(state.supplyScarcity?.[side], 1);
      const plan = supplyPlan(map, state, side, units);
      logistics.ammo += (strength * 0.85 * industry + value * 0.12) * scarcity;
      logistics.fuel += (strength * 0.42 * industry + value * 0.06) * scarcity;
      logistics.medical += (strength * 0.22 + value * 0.05) * scarcity;

      const wants = [];
      const total = { ammo: 0, fuel: 0, medical: 0 };
      for (const unit of units) {
        const depot = (state.forts?.[unit.city]?.depot ?? 0) > 0 ? 1 : 0;
        const step = plan.network.cost.get(unit.city);
        let coverage = supplyCoverage(step);
        if (depot) coverage = Math.min(1, coverage + 0.25);
        let penalty = 0;
        for (const edge of plan.routes.get(unit.id) ?? []) penalty += plan.severity.get(edge) ?? 0;
        coverage *= clampValue(1 - penalty * 0.1, 0.35, 1);
        const pocket = pocketFactor(map, state, unit.city, side);
        coverage *= pocket;
        if (state.owners[unit.city] !== side) coverage *= 0.5;
        const enemySide = side === 'ccp' ? 'roc' : 'ccp';
        if (state.airWar?.[enemySide]?.mission === 'interdiction') {
          coverage *= 1 - 0.18 * (num(state.air?.[enemySide], 0) / 100);
        }
        coverage *= 1 - Math.min(0.35, num(state.interdiction?.[enemySide], 0));
        if (state.airWar?.[side]?.mission === 'airdrop' && pocket < 1) coverage = Math.min(1, coverage + 0.15);
        const need = unitSupplyNeed(unit, state);
        const want = { ammo: need.ammo * coverage, fuel: need.fuel * coverage, medical: need.medical * coverage };
        for (const good of ['ammo', 'fuel', 'medical']) total[good] += want[good];
        wants.push({ unit, need, want, coverage });
      }
      const ratio = {};
      for (const good of ['ammo', 'fuel', 'medical']) {
        ratio[good] = total[good] > 0 ? clampValue(logistics[good] / total[good], 0, 1) : 1;
      }
      let delivered = 0;
      const shortfalls = new Map();
      for (const { unit, need, want, coverage } of wants) {
        let effective = 0;
        for (const good of ['ammo', 'fuel', 'medical']) {
          const paid = want[good] * ratio[good];
          logistics[good] -= paid;
          delivered += paid;
          effective += need[good] > 0 ? paid / need[good] : coverage;
        }
        effective = clampValue(effective / 3, 0, 1);
        const target = Math.round(100 * effective);
        unit.ammo = approachValue(unitAmmo(unit), target, effective > 0.7 ? 9 : 5);
        unit.fuel = approachValue(unitFuel(unit), target, effective > 0.7 ? 9 : 5);
        unit.medical = approachValue(unitMedical(unit), target, effective > 0.7 ? 7 : 4);
        if (effective < 0.35) shortfalls.set(unit.city, (shortfalls.get(unit.city) ?? 0) + 1);
      }
      for (const good of ['ammo', 'fuel', 'medical']) logistics[good] = Math.max(0, logistics[good]);
      report[side] = { shortages: shortfalls.size, bottlenecks: plan.bottlenecks.length,
        delivered: Math.round(delivered) };
    }
    return report;
  }

  function supplyReading(data, state) {
    ensureLogistics(state);
    const map = index(data);
    const tree = unitTree(state);
    const living = tree.combat.filter(unit => unit.strength > 0 && !unit.inactive);
    const reading = { cities: {}, stocks: {}, bottlenecks: [], coverage: {}, transport: {} };
    for (const side of sides) {
      const units = living.filter(unit => unit.side === side);
      const plan = supplyPlan(map, state, side, units);
      reading.stocks[side] = {
        ammo: Math.round(state.logistics[side].ammo), fuel: Math.round(state.logistics[side].fuel),
        medical: Math.round(state.logistics[side].medical),
      };
      reading.bottlenecks.push(...plan.bottlenecks);
      reading.coverage[side] = {};
      reading.transport[side] = {};
      const need = { ammo: 0, fuel: 0, medical: 0 };
      for (const unit of units) {
        const one = unitSupplyNeed(unit, state);
        need.ammo += one.ammo;
        need.fuel += one.fuel;
        need.medical += one.medical;
      }
      // 库存只够几天时，覆盖会整体下调，地图上能看到后方枯竭造成的缺口。
      let ration = 1;
      for (const good of ['ammo', 'fuel', 'medical']) {
        if (need[good] <= 0) continue;
        ration = Math.min(ration, clampValue(state.logistics[side][good] / need[good] / 6, 0.2, 1));
      }
      reading.ration ??= {};
      reading.ration[side] = ration;
      for (const unit of units) {
        const step = plan.network.cost.get(unit.city);
        let coverage = supplyCoverage(step);
        let penalty = 0;
        for (const edge of plan.routes.get(unit.id) ?? []) penalty += plan.severity.get(edge) ?? 0;
        coverage *= clampValue(1 - penalty * 0.1, 0.35, 1);
        coverage *= ration;
        const pocket = pocketFactor(map, state, unit.city, side);
        coverage *= pocket;
        const enemySide = side === 'ccp' ? 'roc' : 'ccp';
        if (state.airWar?.[enemySide]?.mission === 'interdiction') {
          coverage *= 1 - 0.18 * (num(state.air?.[enemySide], 0) / 100);
        }
        coverage *= 1 - Math.min(0.35, num(state.interdiction?.[enemySide], 0));
        if (state.airWar?.[side]?.mission === 'airdrop' && pocket < 1) coverage = Math.min(1, coverage + 0.15);
        if (!reading.coverage[side][unit.city] || reading.coverage[side][unit.city] < coverage) {
          reading.coverage[side][unit.city] = coverage;
        }
        reading.transport[side][unit.city] = plan.network.via.get(unit.city) ?? 'local';
      }
      for (const city of data.cities) {
        const step = plan.network.cost.get(city.id);
        const coverage = supplyCoverage(step);
        if (!reading.cities[city.id]) reading.cities[city.id] = {};
        reading.cities[city.id][side] = coverage;
      }
    }
    return reading;
  }

  function fortLevel(state, city, kind) {
    return Math.min(fortKinds[kind]?.tier ?? 0, Number(state.forts?.[city]?.[kind]) || 0);
  }

  function engineerSupport(units) {
    if (!units.length) return 0;
    const total = units.reduce((sum, unit) => sum + unit.strength, 0);
    if (!total) return 0;
    return units.reduce((sum, unit) => sum + unitSupport(unit).engineer * unit.strength, 0) / total / 100;
  }

  function buildFort(data, state, cityId, kind) {
    ensureLogistics(state);
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    const definition = fortKinds[kind];
    if (!definition) return { ok: false, error: '无法识别此工事。' };
    if (!map_has(data, cityId)) return { ok: false, error: '请选择有效城镇。' };
    if (state.owners[cityId] !== state.player) return { ok: false, error: '只能在己方城镇修筑工事。' };
    const tree = unitTree(state);
    const local = tree.combat.filter(unit => unit.city === cityId && unit.side === state.player && unit.strength > 0
      && canCommand(state, unit));
    if (!local.length) return { ok: false, error: '需要本方可指挥部队驻在城中，才能派出工兵。' };
    const engineers = engineerSupport(local);
    if (engineers < 0.1) return { ok: false, error: '驻军工兵支援不足，无法施工。' };
    const level = fortLevel(state, cityId, kind);
    if (level >= definition.tier) return { ok: false, error: definition.name + '已修到最高等级。' };
    if (state.works.some(item => item.city === cityId && item.kind === kind)) {
      return { ok: false, error: '该类工事正在施工。' };
    }
    const economy = state.economy[state.player];
    const cost = { arms: Math.ceil(definition.cost.arms * (1 + level * 0.35)),
      treasury: Math.ceil(definition.cost.treasury * (1 + level * 0.35)) };
    if (economy.arms < cost.arms || economy.treasury < cost.treasury) {
      return { ok: false, error: '施工需要军械 ' + cost.arms + '、财政 ' + cost.treasury + '。' };
    }
    economy.arms -= cost.arms;
    economy.treasury -= cost.treasury;
    const days = Math.max(1, Math.round(definition.days * (1.4 - engineers)));
    const work = { id: 'w' + (state.works.length + 1) + '-' + cityId + '-' + kind, city: cityId, side: state.player,
      kind, level: level + 1, due: shiftDays(state.date, days), days, cost };
    state.works.push(work);
    addLog(state, (map_name(data, cityId)) + '开工修筑' + definition.name + '，预计 ' + days + ' 天后完成。', 'works',
      { city: cityId, side: state.player, kind, level: level + 1, due: work.due });
    return { ok: true, work };
  }

  function map_name(data, cityId) {
    return (data.cities ?? []).find(city => city.id === cityId)?.name ?? cityId;
  }

  function completeWorks(data, state) {
    ensureLogistics(state);
    if (!state.works.length) return;
    const done = [];
    const pending = [];
    for (const work of state.works) {
      if (work.due > state.date) { pending.push(work); continue; }
      done.push(work);
      state.forts[work.city] ??= {};
      state.forts[work.city][work.kind] = Math.max(Number(state.forts[work.city][work.kind]) || 0, work.level);
      state.economy[work.side] ??= state.economy[state.player];
      addLog(state, map_name(data, work.city) + '的' + (fortKinds[work.kind]?.name ?? work.kind) + '完工。', 'works',
        { city: work.city, side: work.side, kind: work.kind, level: work.level });
    }
    state.works = pending;
    return done;
  }

  function setSupport(data, state, unitId, kind, level) {
    ensureLogistics(state);
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    if (!Object.hasOwn(supportKinds, kind)) return { ok: false, error: '无法识别此支援兵种。' };
    const value = Math.round(Number(level));
    if (!Number.isFinite(value) || value < 0 || value > 100) return { ok: false, error: '支援兵力需在 0 到 100 之间。' };
    const tree = unitTree(state);
    const unit = tree.byId.get(unitId);
    if (!canCommand(state, unit)) return { ok: false, error: '只能调整当前可指挥部队的编制。' };
    const target = unit.parent ? tree.byId.get(unit.parent) : unit;
    if (!target) return { ok: false, error: '请选择有效部队。' };
    const current = unitSupport(target)[kind];
    if (Math.abs(value - current) < 1) return { ok: true };
    const economy = state.economy[state.player];
    const arms = Math.ceil(Math.abs(value - current) * target.strength / 4200);
    const treasury = Math.ceil(arms / 3);
    if (value > current && (economy.arms < arms || economy.treasury < treasury)) {
      return { ok: false, error: '扩编需要军械 ' + arms + '、财政 ' + treasury + '。' };
    }
    if (value > current) {
      economy.arms -= arms;
      economy.treasury -= treasury;
    }
    for (const member of descendants(target, tree)) member.support = { ...unitSupport(member), [kind]: value };
    target.support = { ...unitSupport(target), [kind]: value };
    addLog(state, target.name + '的' + supportKinds[kind] + '支援调整为 ' + value + '。', 'operation',
      { city: target.city, side: target.side, unitId: target.id, action: 'support', kind, level: value });
    return { ok: true };
  }

  function economyStep(data, map, state, combat) {
    const value = { ccp: 0, roc: 0 };
    const stationed = { ccp: 0, roc: 0 };
    for (const city of data.cities) value[state.owners[city.id]] += Number(city.value) || 1;
    for (const unit of combat) {
      if (unit.strength <= 0 || unit.inactive) continue;
      stationed[unit.side] += unit.strength / 1000;
    }
    for (const side of sides) {
      const economy = state.economy[side];
      const production = value[side] * map.resourceScale;
      const industry = policyLevel(state, side, 'industry');
      const recruit = policyLevel(state, side, 'recruit');
      const supply = policyLevel(state, side, 'supply');
      economy.treasury += production * 3.4 - production * (industry * 0.85 + recruit * 0.6);
      // 就地筹粮随驻军规模增长，避免大军在己方腹地因固定产量而自行崩溃。
      economy.food += (production * 2.1 + stationed[side] * 1.15) * supply;
      economy.arms += production * industry * 0.62;
      economy.manpower += production * recruit * 1.15;
    }

    for (const unit of combat) {
      if (unit.strength <= 0 || unit.inactive) continue;
      const economy = state.economy[unit.side];
      const supply = policyLevel(state, unit.side, 'supply');
      const mobilized = hostileOrders.has(unit.order?.type) || unit.order?.type === 'move';
      const need = unit.strength * (mobilized ? 0.006 : 0.0035) * profileFor(unit).upkeep;
      const accessible = state.owners[unit.city] === unit.side;
      const delivered = accessible ? Math.min(need * supply, economy.food) : 0;
      economy.food -= delivered;
      unit.food = Math.round(Math.max(0, Math.min(100, unit.food + (delivered / need - 0.68) * 12)));
      if (unit.food < 15) {
        unit.strength = Math.max(0, unit.strength - Math.max(1, Math.round(unit.strength * 0.006)));
      }
      if (mobilized) {
        // 行军途中缓慢恢复组织度，投入进攻的部队不休整。
        if (!hostileOrders.has(unit.order?.type) && unit.strength > 0) {
          unit.org = Math.round(Math.min(100, unitOrg(unit) + 4));
        }
        continue;
      }
      if (unit.food < 40 || !accessible || unit.strength === 0) continue;

      // 驻防部队恢复组织度；被围攻的守军无法整补。
      const besieged = state.battles?.[unit.city] && state.battles[unit.city].side !== unit.side;
      if (!besieged) {
        unit.org = Math.round(Math.min(100, unitOrg(unit) + 9));
      }
      if (num(unit.wounded, 0) > 0) {
        const rate = accessible ? 0.09 : 0.02;
        const room = Math.max(0, (Number(unit.maxStrength) || 0) - unit.strength);
        const restored = Math.max(0, Math.min(unit.wounded, Math.max(1, Math.round(unit.wounded * rate)), room));
        if (restored > 0) {
          unit.strength += restored;
          unit.wounded -= restored;
        }
      }

      const recruit = policyLevel(state, unit.side, 'recruit');
      const stock = state.stock?.[unit.side];
      const spare = stock ? Math.floor(stock.infantry / 0.35) : Number.POSITIVE_INFINITY;
      const additions = Math.floor(Math.min(
        unit.maxStrength - unit.strength, economy.manpower, spare,
        Math.max(1, unit.maxStrength * 0.008 * recruit), economy.arms * 4, economy.treasury * 4,
      ));
      unit.strength += additions;
      if (stock && additions > 0) stock.infantry = Math.max(0, stock.infantry - additions * 0.35);
      economy.manpower -= additions;
      economy.arms -= additions * 0.25;
      economy.treasury -= additions * 0.25;
      const renewal = unit.equipment < 100 ? Math.min(unit.strength * 0.0015, economy.arms) : 0;
      unit.equipment = Math.min(100, unit.equipment + (renewal / unit.strength) * 500);
      economy.arms -= renewal;
    }
    for (const side of sides) {
      const economy = state.economy[side];
      for (const key of Object.keys(economy)) economy[key] = Math.max(0, Math.round(economy[key]));
    }
  }

  function groupByCity(units) {
    const cities = new Map();
    for (const unit of units) {
      if (unit.strength <= 0 || unit.inactive) continue;
      if (!cities.has(unit.city)) cities.set(unit.city, []);
      cities.get(unit.city).push(unit);
    }
    return cities;
  }

  function nearestFront(map, state, origin, side) {
    const visited = new Set([origin]);
    const queue = [origin];
    for (let offset = 0; offset < queue.length; offset += 1) {
      const city = queue[offset];
      const links = map.neighbors.get(city) ?? [];
      if (links.some(neighbor => state.owners[neighbor] !== side)) return city;
      for (const neighbor of links) {
        if (visited.has(neighbor) || state.owners[neighbor] !== side) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    return null;
  }

  function hash(input) {
    let value = 0;
    for (let i = 0; i < input.length; i += 1) value = (Math.imul(value, 31) + input.charCodeAt(i)) >>> 0;
    return value;
  }

  function battlePeriod(date, city) {
    const timestamp = Date.parse(String(date) + 'T00:00:00Z');
    const day = Number.isFinite(timestamp) ? Math.floor(timestamp / dayMillis) : 0;
    const longitude = Number.isFinite(Number(city?.lon)) ? Number(city.lon) : 105;
    // 用经度划分地方时区，再按四日战斗节奏轮换昼夜，保证存档回放结果一致。
    const localCycle = ((day + Math.floor(longitude / 30)) % 4 + 4) % 4;
    return localCycle < 2 ? '夜战' : '昼战';
  }

  function distancesTo(map, target) {
    const distances = new Map([[target, 0]]);
    const queue = [target];
    for (let offset = 0; offset < queue.length; offset += 1) {
      const city = queue[offset];
      for (const neighbor of map.neighbors.get(city) ?? []) {
        if (distances.has(neighbor)) continue;
        distances.set(neighbor, distances.get(city) + 1);
        queue.push(neighbor);
      }
    }
    return distances;
  }

  function planById(state, planId) {
    return (state.plans ?? []).find(plan => plan.id === planId) ?? null;
  }

  const planStances = { spearhead: '突击目标', hold: '守备战线', push: '沿战线进攻', fallback: '后撤至战线' };
  const specialOrders = ['bombard'];
  const commandKinds = [...targetOrders, 'hold', ...specialOrders];

  const designBattalions = { infantry: '步兵营', artillery: '炮兵营', armor: '装甲营', motorized: '摩托化营', antiAir: '防空营', antiTank: '反坦克营' };
  const designSupports = { engineer: '工兵连', recon: '侦察连', medical: '医疗连', logistics: '后勤连', signal: '通信连' };
  const designDefaults = {
    infantry: { infantry: 8, artillery: 2, armor: 0, motorized: 0, antiAir: 0, antiTank: 0 },
    artillery: { infantry: 7, artillery: 4, armor: 0, motorized: 0, antiAir: 0, antiTank: 0 },
    mobile: { infantry: 6, artillery: 1, armor: 2, motorized: 2, antiAir: 0, antiTank: 0 },
  };
  const techLines = {
    infantry: { name: '步兵武器', max: 5, costs: [50, 90, 140, 200, 280], effect: '攻防 +4%／级' },
    artillery: { name: '炮兵', max: 5, costs: [55, 95, 150, 210, 290], effect: '进攻与围城 +5%／级' },
    armor: { name: '装甲', max: 5, costs: [70, 120, 180, 250, 340], effect: '装甲与进攻 +4%／级，1 级解锁装甲营' },
    logistics: { name: '后勤', max: 4, costs: [45, 80, 130, 190], effect: '补给消耗 −3%／级' },
    medical: { name: '医疗', max: 4, costs: [40, 75, 120, 175], effect: '战斗减员 −3%／级' },
    air: { name: '航空', max: 4, costs: [60, 105, 160, 230], effect: '空中支援 +6%／级' },
  };
  const airMissions = {
    superiority: { name: '争夺制空', support: 1, attrition: 0.004, hint: '稳定争夺制空权，提供常规空中支援。' },
    cas: { name: '近距支援', support: 1.35, attrition: 0.009, hint: '直接支援地面进攻，进攻加成更高，但损失更大。' },
    interdiction: { name: '空中遮断', support: 0.75, attrition: 0.007, hint: '打击敌方运输线，降低对方补给覆盖。' },
    airdrop: { name: '空投补给', support: 0.4, attrition: 0.006, hint: '向被围城镇空投物资，提高守军补给。' },
  };
  const focusTrees = {
    ccp: [
      { id: 'land-reform', name: '土地改革', days: 30, effect: { manpower: 0.12, warSupport: 4 }, desc: '动员农民，兵员与战争支持提升。' },
      { id: 'production-drive', name: '大生产运动', days: 30, effect: { food: 0.15, stock: { infantry: 120 } }, desc: '后方自给，粮食与步兵装备增加。' },
      { id: 'army-reform', name: '三查三整', days: 35, effect: { org: 6 }, desc: '整训部队，组织度恢复更快。' },
      { id: 'arsenal', name: '军工建设', days: 35, requires: ['production-drive'], effect: { arms: 0.2, stock: { artillery: 80 } }, desc: '扩建兵工，军械与火炮产量提高。' },
      { id: 'railway-war', name: '破袭战', days: 40, requires: ['army-reform'], effect: { interdiction: 0.15 }, desc: '袭扰铁路，削弱敌军补给。' },
      { id: 'river-crossing', name: '渡江准备', days: 40, requires: ['land-reform'], effect: { transports: 6, naval: 1, river: 1 }, desc: '征集船只，提升渡海与渡河能力。' },
    ],
    roc: [
      { id: 'us-aid', name: '争取美援', days: 30, effect: { stock: { infantry: 160, artillery: 60 }, treasury: 0.1 }, desc: '获得装备与财政援助。' },
      { id: 'currency', name: '币制改革', days: 30, effect: { treasury: 0.25, warSupport: -3 }, desc: '财政增加，但民心受损。' },
      { id: 'reorganization', name: '整编部队', days: 35, effect: { org: 6 }, desc: '整编提高组织度恢复。' },
      { id: 'yangtze', name: '长江防线', days: 40, requires: ['reorganization'], effect: { forts: 2 }, desc: '沿江修筑工事。' },
      { id: 'taiwan', name: '经营台湾', days: 35, requires: ['currency'], effect: { stock: { infantry: 100 }, food: 0.1 }, desc: '巩固后方基地。' },
      { id: 'air-force', name: '空军整备', days: 40, requires: ['us-aid'], effect: { air: 12 }, desc: '扩充机队。' },
    ],
  };
  const commandAbilities = {
    forcedMarch: { name: '强行军', cost: 20, cooldown: 8, hint: '指定部队 7 天内行军更快。', days: 7 },
    lastStand: { name: '死守', cost: 25, cooldown: 10, hint: '指定部队 7 天内防守更强。', days: 7 },
    barrage: { name: '炮火准备', cost: 30, cooldown: 10, hint: '削弱目标城镇 5 天内的防守。', days: 5 },
  };
  const leaderTraitPool = [
    { id: 'offensive', name: '攻势', attack: 0.05 },
    { id: 'defensive', name: '坚守', defense: 0.06 },
    { id: 'mobile', name: '机动', speed: 0.08 },
    { id: 'logistics', name: '后勤', supply: -0.06 },
  ];

  function emptyLevels() {
    return { infantry: 0, artillery: 0, armor: 0, logistics: 0, medical: 0, air: 0 };
  }

  function normalizeDesign(design) {
    const record = design ?? {};
    const branch = record.branch ?? 'infantry';
    const base = designDefaults[branch] ?? designDefaults.infantry;
    const result = {
      id: String(record.id ?? ''),
      name: String(record.name ?? '标准师').slice(0, 20),
      branch,
      infantry: clampValue(Math.round(num(record.infantry, base.infantry)), 0, 12),
      artillery: clampValue(Math.round(num(record.artillery, base.artillery)), 0, 8),
      armor: clampValue(Math.round(num(record.armor, base.armor)), 0, 6),
      motorized: clampValue(Math.round(num(record.motorized, base.motorized)), 0, 8),
      antiAir: clampValue(Math.round(num(record.antiAir, base.antiAir)), 0, 4),
      antiTank: clampValue(Math.round(num(record.antiTank, base.antiTank)), 0, 4),
      support: {},
    };
    for (const key of Object.keys(designSupports)) result.support[key] = Boolean(record.support?.[key]);
    return result;
  }

  function designCost(design) {
    const d = normalizeDesign(design);
    return Math.round(d.infantry * 4 + d.artillery * 10 + d.armor * 26 + d.motorized * 7
      + d.antiAir * 8 + d.antiTank * 9 + Object.values(d.support).filter(Boolean).length * 6);
  }

  function deriveLine(map, state, side, target) {
    const region = map.cities.get(target)?.region;
    const own = [...map.cities.values()].filter(city => state.owners[city.id] === side);
    const border = own.filter(city => (map.neighbors.get(city.id) ?? []).some(id => state.owners[id] !== side));
    const pool = border.length ? border : own;
    const regional = pool.filter(city => city.region === region);
    return (regional.length ? regional : pool)
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .slice(0, 8)
      .map(city => city.id);
  }

  function resolveLine(map, state, plan) {
    const line = (plan.line ?? []).filter(id => map.cities.has(id) && state.owners[id] === plan.side);
    if (line.length) return line;
    if (plan.autoLine) return deriveLine(map, state, plan.side, plan.target);
    return [];
  }

  function planUnits(data, state, plan, distances) {
    const map = index(data);
    const tree = unitTree(state);
    const stance = plan.stance ?? 'spearhead';
    const line = stance === 'spearhead' ? [] : resolveLine(map, state, plan);
    const lineDistance = new Map();
    const nearestLine = (unit) => {
      let best = null;
      let bestDistance = Infinity;
      for (const city of line) {
        if (!lineDistance.has(city)) lineDistance.set(city, distancesTo(map, city));
        const distance = lineDistance.get(city).get(unit.city);
        if (distance === undefined || distance >= bestDistance) continue;
        bestDistance = distance;
        best = city;
      }
      return best ? { city: best, distance: bestDistance } : null;
    };
    const wanted = distances ?? distancesTo(map, plan.target);
    const rows = [];
    for (const unitId of plan.units ?? []) {
      const root = tree.byId.get(unitId);
      if (!root || root.side !== plan.side || root.strength <= 0 || root.inactive) {
        rows.push({ unitId, ok: false, error: '该部队已不在役。' });
        continue;
      }
      if (!canCommand(state, root)) {
        rows.push({ unitId, ok: false, error: '该部队当前不可指挥。' });
        continue;
      }
      if (stance !== 'spearhead') {
        const pick = nearestLine(root);
        if (!pick) {
          rows.push({ unitId, ok: false, error: '没有可用的战线城镇。' });
          continue;
        }
        const context = commandContext(data, state, root.id);
        if (stance === 'hold') {
          const preview = validateOrder(context, 'defend', pick.city);
          rows.push(preview.ok
            ? { unitId, ok: true, type: 'defend', target: pick.city, days: preview.days, route: preview.route, line: pick.city }
            : { unitId, ok: false, error: preview.error });
          continue;
        }
        if (stance === 'fallback') {
          const preview = validateOrder(context, 'move', pick.city);
          rows.push(preview.ok
            ? { unitId, ok: true, type: 'move', target: pick.city, days: preview.days, route: preview.route, line: pick.city }
            : { unitId, ok: false, error: preview.error });
          continue;
        }
        // 沿战线进攻：先到战线，再向目标方向接敌。
        if (root.city !== pick.city) {
          const preview = validateOrder(context, 'move', pick.city);
          rows.push(preview.ok
            ? { unitId, ok: true, type: 'move', target: pick.city, days: preview.days, route: preview.route,
              line: pick.city, staging: true }
            : { unitId, ok: false, error: preview.error });
          continue;
        }
        const here = wanted.get(root.city) ?? Infinity;
        const adjacent = (map.neighbors.get(root.city) ?? []).filter(id => state.owners[id] !== root.side);
        const advancing = adjacent.filter(id => (wanted.get(id) ?? Infinity) < here);
        const options = (advancing.length ? advancing : adjacent)
          .sort((a, b) => (wanted.get(a) ?? Infinity) - (wanted.get(b) ?? Infinity));
        const enemy = options[0];
        const preview = validateOrder(context, enemy ? 'advance' : 'defend', enemy ?? root.city);
        rows.push(preview.ok
          ? { unitId, ok: true, type: enemy ? 'advance' : 'defend', target: enemy ?? root.city,
            days: preview.days, route: preview.route, line: pick.city }
          : { unitId, ok: false, error: preview.error });
        continue;
      }
      const distance = wanted.get(root.city);
      if (distance === undefined) {
        rows.push({ unitId, ok: false, error: '与目标之间没有通路。' });
        continue;
      }
      if (plan.front && root.city !== plan.front && state.owners[plan.front] === root.side) {
        const preview = validateOrder(commandContext(data, state, root.id), 'move', plan.front);
        rows.push(preview.ok
          ? { unitId, ok: true, type: 'move', target: plan.front, days: preview.days, route: preview.route, assembly: true }
          : { unitId, ok: false, error: '无法向集结城镇移动：' + preview.error });
        continue;
      }
      const defensive = plan.mode === 'defend' || plan.mode === 'move';
      if (defensive) {
        if (state.owners[plan.target] !== root.side) {
          rows.push({ unitId, ok: false, error: planModes[plan.mode] + '需要己方目标城镇。' });
          continue;
        }
        const preview = validateOrder(commandContext(data, state, root.id), plan.mode, plan.target);
        rows.push(preview.ok
          ? { unitId, ok: true, type: plan.mode, target: plan.target, days: preview.days, route: preview.route }
          : { unitId, ok: false, error: preview.error });
        continue;
      }
      if (distance === 0) {
        rows.push({ unitId, ok: true, type: 'defend', target: root.city, days: 0, route: [root.city] });
        continue;
      }
      const closer = (map.neighbors.get(root.city) ?? []).filter(id => (wanted.get(id) ?? Infinity) < distance);
      const own = closer.find(id => state.owners[id] === root.side);
      const enemy = closer.find(id => state.owners[id] !== root.side);
      if (distance === 1) {
        const preview = validateOrder(commandContext(data, state, root.id), plan.mode, plan.target);
        rows.push(preview.ok
          ? { unitId, ok: true, type: plan.mode, target: plan.target, days: preview.days, route: preview.route }
          : { unitId, ok: false, error: preview.error });
        continue;
      }
      if (own) {
        const preview = validateOrder(commandContext(data, state, root.id), 'move', own);
        rows.push(preview.ok
          ? { unitId, ok: true, type: 'move', target: own, days: preview.days, route: preview.route, staging: true }
          : { unitId, ok: false, error: preview.error });
        continue;
      }
      if (enemy) {
        const preview = validateOrder(commandContext(data, state, root.id), 'advance', enemy);
        rows.push(preview.ok
          ? { unitId, ok: true, type: 'advance', target: enemy, days: preview.days, route: preview.route, staging: true }
          : { unitId, ok: false, error: preview.error });
        continue;
      }
      rows.push({ unitId, ok: false, error: '前方没有可用的接敌或调动城镇。' });
    }
    return rows;
  }

  function createPlan(data, state, config = {}) {
    ensureLogistics(state);
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    const tree = unitTree(state);
    const target = config.target;
    if (!map_has(data, target)) return { ok: false, error: '请选择有效目标城镇。' };
    const mode = Object.hasOwn(planModes, config.mode) ? config.mode : 'advance';
    const stance = Object.hasOwn(planStances, config.stance) ? config.stance : 'spearhead';
    const line = Array.isArray(config.line) ? config.line.filter(id => map_has(data, id)).slice(0, 12) : [];
    const units = [];
    for (const unitId of config.units ?? []) {
      let root = tree.byId.get(unitId);
      while (root?.parent) root = tree.byId.get(root.parent);
      if (!root || units.includes(root.id)) continue;
      if (!canCommand(state, root)) return { ok: false, error: '计划中只能编入当前可指挥的部队。' };
      units.push(root.id);
    }
    if (!units.length) return { ok: false, error: '请至少选择一支部队。' };
    const plan = {
      id: 'p' + (state.plans.length + 1) + '-' + units.length,
      name: String(config.name || (planModes[mode] + map_name(data, target))).slice(0, 40),
      side: state.player, units, target, mode, status: 'draft', delegated: false,
      stance, line, autoLine: Boolean(config.autoLine) || !line.length,
      front: map_has(data, config.front) ? config.front : null,
      created: state.date, updated: state.date, executed: null,
    };
    state.plans.push(plan);
    addLog(state, '拟定作战计划：' + plan.name + '（' + units.length + ' 支部队）。', 'plan',
      { city: target, side: plan.side, planId: plan.id, action: 'plan-create' });
    return { ok: true, plan };
  }

  function previewPlan(data, state, planId) {
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    const rows = planUnits(data, state, plan);
    const ready = rows.filter(row => row.ok);
    return { ok: ready.length > 0, rows, ready: ready.length, total: rows.length,
      days: ready.reduce((max, row) => Math.max(max, row.days ?? 0), 0) };
  }

  function executePlan(data, state, planId) {
    ensureLogistics(state);
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    if (plan.side !== state.player) return { ok: false, error: '只能执行本方计划。' };
    const rows = planUnits(data, state, plan);
    const applied = [];
    for (const row of rows) {
      if (!row.ok) continue;
      const result = order(data, state, row.unitId, row.type, row.target);
      if (!result.ok) continue;
      const tree = unitTree(state);
      const root = tree.byId.get(row.unitId);
      for (const member of leaves(root, tree)) {
        if (member.order) member.orderPlan = plan.id;
      }
      applied.push({ unitId: row.unitId, type: row.type, target: row.target });
    }
    if (!applied.length) {
      return { ok: false, error: rows.find(row => !row.ok)?.error ?? '没有部队能执行该计划。' };
    }
    plan.status = 'active';
    plan.updated = state.date;
    plan.executed = state.date;
    addLog(state, '执行作战计划《' + plan.name + '》，' + applied.length + ' 支部队开始行动。', 'plan',
      { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-execute', units: applied.length });
    return { ok: true, applied, skipped: rows.filter(row => !row.ok) };
  }

  function pausePlan(data, state, planId) {
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    if (plan.side !== state.player) return { ok: false, error: '只能暂停本方计划。' };
    let stopped = 0;
    for (const unit of state.units) {
      if (unit.orderPlan !== plan.id) continue;
      clearOrder(unit);
      stopped += 1;
    }
    plan.status = 'paused';
    plan.delegated = false;
    plan.updated = state.date;
    refreshOrders(state, unitTree(state));
    addLog(state, '暂停作战计划《' + plan.name + '》。', 'plan',
      { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-pause', units: stopped });
    return { ok: true, stopped };
  }

  function delegatePlan(state, planId, delegated) {
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    if (plan.side !== state.player) return { ok: false, error: '只能委任本方计划。' };
    plan.delegated = Boolean(delegated);
    if (plan.delegated) {
      plan.status = 'active';
      plan.updated = state.date;
      addLog(state, '《' + plan.name + '》交由司令员按局势调整。', 'plan',
        { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-delegate' });
    }
    return { ok: true };
  }

  function removePlan(state, planId) {
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    if (plan.side !== state.player) return { ok: false, error: '只能撤销本方计划。' };
    for (const unit of state.units) if (unit.orderPlan === plan.id) clearOrder(unit);
    state.plans = state.plans.filter(item => item.id !== planId);
    refreshOrders(state, unitTree(state));
    return { ok: true };
  }

  function delegatedPlans(data, map, state, tree) {
    ensureLogistics(state);
    const day = Math.floor(Date.parse(state.date) / dayMillis);
    for (const plan of state.plans.filter(item => item.delegated && item.status === 'active')) {
      if ((day + hash(plan.id + plan.target)) % 4 !== 0) continue;
      const roots = plan.units.map(id => tree.byId.get(id))
        .filter(root => root && root.strength > 0 && !root.inactive);
      if (!roots.length) { plan.status = 'done'; continue; }
      if (state.owners[plan.target] === plan.side && plan.stance !== 'hold' && plan.stance !== 'fallback') {
        for (const root of roots) order(data, state, root.id, 'defend', root.city);
        plan.status = 'done';
        addLog(state, '《' + plan.name + '》目标已由本方控制，转入驻防。', 'plan',
          { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-done' });
        continue;
      }
      const average = roots.reduce((sum, root) => sum + unitAmmo(root) + unitFuel(root), 0) / (roots.length * 2);
      if (average < 42) {
        for (const root of roots) order(data, state, root.id, 'defend', root.city);
        addLog(state, '《' + plan.name + '》因补给不足暂停推进，部队就地整补。', 'plan',
          { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-rest' });
        continue;
      }
      const recent = (state.log ?? []).filter(entry => entry.type === 'battle-end' && entry.city === plan.target
        && entry.side === plan.side && entry.date >= shiftDays(state.date, -10));
      if (recent.some(entry => entry.result === 'repelled')) {
        for (const root of roots) order(data, state, root.id, 'defend', root.city);
        continue;
      }
      for (const root of roots) {
        const row = planUnits(data, state, { ...plan, units: [root.id] })[0];
        if (!row?.ok) continue;
        order(data, state, root.id, row.type, row.target);
        const tree2 = unitTree(state);
        for (const member of leaves(tree2.byId.get(root.id), tree2)) {
          if (member.order) member.orderPlan = plan.id;
        }
      }
      plan.updated = state.date;
    }
  }

  function frontPressure(map, state, tree) {
    const result = { ccp: 0, roc: 0 };
    const living = tree.combat.filter(unit => unit.strength > 0 && !unit.inactive);
    for (const side of sides) {
      const border = [...map.cities.values()].filter(city => state.owners[city.id] === side
        && (Number(city.value) || 0) >= 4
        && (map.neighbors.get(city.id) ?? []).some(id => state.owners[id] !== side));
      if (!border.length) continue;
      const empty = border.filter(city => !living.some(unit => unit.city === city.id && unit.side === side)).length;
      result[side] = empty / border.length;
    }
    return result;
  }

  function aiOrders(map, state, tree) {
    const day = Math.floor(Date.parse(state.date) / dayMillis);
    const garrisons = groupByCity(tree.combat);
    const pressure = frontPressure(map, state, tree);
    for (const army of tree.armies) {
      if (army.strength <= 0 || army.inactive || (day + hash(army.id)) % 7 !== 0) continue;
      const otherTheater = state.scope === 'theater' && army.area !== state.area;
      const otherGroup = state.group && army.group !== state.group;
      const outsideControl = army.side !== state.player || otherTheater || otherGroup;
      if (!outsideControl && !army.delegated) continue;
      const aiPlan = (state.plans ?? []).find(plan => plan.aiGenerated && plan.side === army.side
        && plan.status === 'active' && plan.units?.includes(army.id));
      const objective = army.delegated && army.delegateTarget || aiPlan?.target;
      const distances = objective ? distancesTo(map, objective) : null;
      const armyGroups = groupByCity(leaves(army, tree).filter(unit => {
        if (unit.garrison) {
          const holding = state.owners[unit.garrison] === unit.side
            && (unit.city === unit.garrison || unit.order?.type === 'move' && unit.order.target === unit.garrison);
          if (holding) return false;
          delete unit.garrison;
        }
        const orderType = unit.order?.type;
        const stationary = orderType === 'hold' || orderType === 'defend' && unit.order.target === unit.city;
        return unit.food >= 30 && (!orderType || stationary && (unit.automatedOrder || outsideControl));
      }));
      for (const [city, available] of armyGroups) {
        const distance = distances?.get(city);
        if (distances && distance === 0) {
          for (const unit of available) assignOrder(map, state, unit, 'defend', city, true);
          continue;
        }
        const availableStrength = available.reduce((sum, member) => sum + member.strength, 0);
        const averageOrg = available.reduce((sum, member) => sum + unitOrg(member), 0) / available.length;
        const attackPower = power(available, false, state);
        const adjacent = map.neighbors.get(city) ?? [];
        const progress = distance === undefined ? adjacent : adjacent.filter(neighbor => distances.get(neighbor) < distance);
        const targets = progress.filter(neighbor => state.owners[neighbor] !== army.side);
        let target;
        let best = -Infinity;
        // 边境越空虚，出击门槛越高：先稳住战线，再考虑扩张。
        const cautionFront = 1 + (pressure[army.side] ?? 0) * 0.8;
        if (averageOrg >= 55) {
          for (const neighbor of targets) {
            const node = map.cities.get(neighbor);
            const garrison = garrisons.get(neighbor) ?? [];
            const terrain = /mountain|plateau|岭|山|高原/.test(node?.terrain ?? '') ? 1.22 : 1;
            const fort = unitFortDefense({ city: neighbor }, state);
            const defensePower = power(garrison, true, state) * terrain * (1 + fort) * (isTaiwan(node) ? 1.55 : 1);
            const ratio = attackPower / Math.max(defensePower, 1);
            const supply = available.reduce((sum, member) => sum + unitAmmo(member) + unitFuel(member), 0)
              / (available.length * 2);
            // 补给不足时略微抬高出击门槛，实际战力影响由弹药与组织度在战斗结算中体现。
            const readiness = clampValue(0.85 + supply / 200 * 0.17, 0.85, 1.02);
            const caution = (state.log ?? []).some(entry => entry.type === 'battle-end' && entry.city === neighbor
              && entry.side === army.side && entry.result === 'repelled'
              && entry.date >= shiftDays(state.date, -12)) ? 1.18 : 1;
            const required = (isTaiwan(node) ? 2.4 : 1.12) * caution * cautionFront / readiness;
            const ongoing = state.battles?.[neighbor];
            const stalling = ongoing && ongoing.side === army.side && ongoing.lastRatio < 0.95;
            const local = otherTheater && army.side === state.player && node?.region === army.area ? 0.35 : 0;
            const score = ratio + (Number(node?.value) || 1) * 0.055
              + local + (hash(neighbor + state.date + army.id) % 20) / 100;
            if (!stalling && ratio >= required && score > best) {
              target = neighbor;
              best = score;
            }
          }
        }
        if (target) {
          for (const unit of available) assignOrder(map, state, unit, 'advance', target, true);
        } else {
          const front = distance === undefined
            ? (!targets.length && nearestFront(map, state, city, army.side))
            : progress.find(neighbor => state.owners[neighbor] === army.side);
          const moving = front && front !== city;
          for (const unit of available) assignOrder(map, state, unit, moving ? 'move' : 'defend', moving ? front : city, true);
        }
      }
    }
  }

  function aiGarrison(map, state, tree) {
    const day = Math.floor(Date.parse(state.date) / dayMillis);
    if ((day + 3) % 5 !== 0) return;
    for (const side of sides) {
      const armies = tree.armies.filter(army => {
        if (army.side !== side || army.strength <= 0 || army.inactive) return false;
        const otherTheater = state.scope === 'theater' && army.area !== state.area;
        const otherGroup = state.group && army.group !== state.group;
        return army.side !== state.player || otherTheater || otherGroup || army.delegated;
      });
      if (!armies.length) continue;
      const units = tree.combat.filter(unit => unit.strength > 0 && !unit.inactive && unit.side === side);
      const byCity = groupByCity(units);
      const targeted = new Set();
      for (const unit of state.units) {
        if (!unit.garrison) continue;
        const active = state.owners[unit.garrison] === side
          && (unit.city === unit.garrison || (unit.order?.type === 'move' && unit.order.target === unit.garrison));
        if (active) targeted.add(unit.garrison);
        else delete unit.garrison;
      }
      const empty = [...map.cities.values()].filter(city => {
        if (state.owners[city.id] !== side || byCity.has(city.id) || targeted.has(city.id)) return false;
        return (map.neighbors.get(city.id) ?? []).some(id => state.owners[id] !== side);
      }).sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
      if (!empty.length) continue;
      const reserves = [];
      for (const army of armies) {
        const divisions = (tree.children.get(army.id) ?? []).filter(unit => unit.strength > 0 && !unit.inactive);
        const candidates = divisions.length ? divisions : [army];
        for (const unit of candidates) {
          const order = unit.order;
          const idle = !order || order.type === 'hold' || (order.type === 'defend' && order.target === unit.city);
          if (!idle) continue;
          if ((tree.combat.filter(member => member.city === unit.city && member.side === side).length) < 2) continue;
          reserves.push(unit);
        }
      }
      if (!reserves.length) continue;
      const used = new Set();
      let assigned = 0;
      for (const city of empty) {
        if (assigned >= 4) break;
        const distances = distancesTo(map, city.id);
        let pick = null;
        let best = Infinity;
        for (const unit of reserves) {
          if (used.has(unit.id)) continue;
          const distance = distances.get(unit.city);
          if (distance === undefined || distance > 5) continue;
          if (!friendlyRoute(map, state, unit.city, city.id, side)) continue;
          if (distance < best) { best = distance; pick = unit; }
        }
        if (!pick) continue;
        used.add(pick.id);
        assigned += 1;
        assignOrder(map, state, pick, 'move', city.id, true);
        pick.garrison = city.id;
        for (const member of leaves(pick, tree)) member.garrison = city.id;
      }
    }
  }

  function capture(map, state, combat, city, side, force = false, source, onRetreat) {
    const previousSide = state.owners[city];
    if (previousSide === side) return;
    if (state.intervened) delete state.intervened[city];
    state.owners[city] = side;
    const nearby = map.neighbors.get(city) ?? [];
    const nearbyUnits = nearbyForces(combat, city, nearby);
    let isolated = 0;
    for (const unit of combat) {
      if (unit.city !== city || unit.side === side || unit.strength <= 0) continue;
      const next = nearby.find((id) => state.owners[id] === unit.side);
      const retreat = next ? map.cities.get(next) : force ? closestFriendly(map, state, city, unit.side) : null;
      if (retreat) {
        onRetreat?.(unit, retreat.id);
        unit.city = retreat.id;
        unit.area = retreat.region ?? unit.area;
        unit.food = Math.max(10, unit.food - 20);
      } else {
        isolated += unit.strength;
        unit.strength = 0;
      }
      delete unit.garrison;
      clearOrder(unit);
    }
    const name = map.cities.get(city)?.name ?? city;
    if (!force && state.warSupport && sides.includes(previousSide) && sides.includes(side)) {
      const weight = Number(map.cities.get(city)?.value) || 1;
      state.warSupport[previousSide] = clampValue(num(state.warSupport[previousSide], 60) - weight * 0.35, 2, 100);
      state.warSupport[side] = clampValue(num(state.warSupport[side], 60) + weight * 0.2, 2, 100);
      if (state.capitals?.[previousSide] === city) {
        state.warSupport[previousSide] = clampValue(num(state.warSupport[previousSide], 60) - 10, 2, 100);
        addLog(state, sideNames[previousSide] + '首都' + name + '失守，战争支持度大幅下降。', 'capital',
          { city, side, previousSide });
      }
    }
    const title = force ? '历史进程中，' : '';
    const record = addLog(state, title + sideNames[side] + '控制' + name + '，' + sideNames[previousSide] + '失去该城。',
      force ? 'history' : 'capture', { city, side, previousSide, nearbyUnits, ...(source ? { source } : {}) });
    state.cityRecords ??= {};
    state.cityRecords[city] = record;
    if (isolated > 0 && !force) {
      addLog(state, name + '守军失去相邻退路，' + isolated + ' 人退出战斗。', 'battle', { city, side });
    }
  }

  function nearbyForces(combat, city, neighbors) {
    const locations = new Set([city, ...neighbors]);
    const forces = new Map();
    for (const unit of combat) {
      if (!locations.has(unit.city) || unit.strength <= 0 || unit.inactive) continue;
      const name = unit.name.split(' · ')[0];
      const id = unit.parent?.replace(/-d\d+$/, '') ?? unit.id;
      const key = [unit.side, unit.city, id].join('|');
      const row = forces.get(key) ?? { id, name, city: unit.city, side: unit.side, strength: 0 };
      row.strength += unit.strength;
      forces.set(key, row);
    }
    return [...forces.values()].sort((a, b) => b.strength - a.strength).slice(0, 10);
  }

  function recordIntervention(state, city, side) {
    state.intervened ??= {};
    state.intervened[city] = side;
  }

  function power(units, defend, state) {
    return units.reduce((sum, unit) => {
      const preparedness = defend && unit.order?.type === 'defend' && unit.order.target === unit.city ? 1.2 : 1;
      const profile = profileFor(unit);
      const multiplier = defend ? profile.defense : profile.attack;
      const readiness = (0.55 + unit.food * 0.0045) * (0.62 + unit.equipment * 0.0038);
      const ammo = 1 + (unitAmmo(unit) - 100) * 0.0025;
      const morale = 1 + (unitMorale(unit) - 70) * 0.003;
      const veteran = 1 + unitVeteran(unit) * 0.02;
      const org = 1 + (unitOrg(unit) - 100) * 0.0032;
      const design = state ? unitDesignStats(state, unit) : null;
      const designMultiplier = design ? (defend ? design.defense : design.attack) : 1;
      const designOrg = design ? design.org : 1;
      const leader = state ? leaderBonus(state, unit) : { attack: 1, defense: 1 };
      const trait = defend ? leader.defense : leader.attack;
      let buff = 0;
      if (state) {
        buff = defend
          ? buffValue(state, unit, 'lastStand') * 0.2 - buffValue(state, unit, 'barrage') * 0.18
          : 0;
      }
      return sum + unit.strength * readiness * preparedness * multiplier
        * ammo * morale * veteran * org * designOrg * designMultiplier * trait * (1 + buff)
        * supportFactor(unit, defend);
    }, 0);
  }

  function supportLosses(unit, state) {
    let factor = clampValue(1 - (unitMedical(unit) - 100) * 0.0015, 0.82, 1.22);
    if (state) factor *= 1 - (state.research?.[unit.side]?.levels?.medical ?? 0) * 0.03;
    return factor;
  }

  function applyLosses(units, fraction, state) {
    for (const unit of units) {
      const share = fraction * supportLosses(unit, state);
      unit.strength = Math.max(0, unit.strength - Math.max(1, Math.round(unit.strength * share)));
      unit.equipment = Math.max(12, unit.equipment - share * 32);
      unit.food = Math.max(0, unit.food - share * 45);
      unit.ammo = Math.round(Math.max(0, unitAmmo(unit) - share * 120));
      unit.medical = Math.round(Math.max(12, unitMedical(unit) - share * 85));
      if (unit.strength === 0) clearOrder(unit);
    }
  }

  function battleOutcome(state, city, attackingSide, defendingSide, attackers, defenders, won, numbers) {
    const { attackerStart, defenderStart, attackerCasualties, defenderCasualties, routed } = numbers;
    const wounded = Math.round((attackerCasualties + defenderCasualties) * 0.42);
    const prisoners = won ? routed + Math.round(defenderStart * 0.08) : 0;
    const captured = won
      ? { arms: Math.round(defenderStart * 0.014), fuel: Math.round(defenderStart * 0.006),
        medical: Math.round(defenderStart * 0.004) }
      : { arms: 0, fuel: 0, medical: 0 };
    if (attackingSide !== defendingSide) {
      const attackerTally = state.tally?.[attackingSide];
      const defenderTally = state.tally?.[defendingSide];
      if (attackerTally) {
        attackerTally.battles += 1;
        attackerTally.wins += won ? 1 : 0;
        attackerTally.casualties += attackerCasualties;
        attackerTally.wounded += Math.round(attackerCasualties * 0.42);
        attackerTally.prisoners += prisoners;
        attackerTally.captured += captured.arms;
      }
      if (defenderTally) {
        defenderTally.battles += 1;
        defenderTally.wins += won ? 0 : 1;
        defenderTally.casualties += defenderCasualties;
        defenderTally.wounded += Math.round(defenderCasualties * 0.42);
      }
      if (won) {
        if (state.economy?.[attackingSide]) state.economy[attackingSide].arms += captured.arms;
        if (state.logistics?.[attackingSide]) {
          state.logistics[attackingSide].fuel += captured.fuel;
          state.logistics[attackingSide].medical += captured.medical;
        }
      }
    }
    const moraleAttack = won ? 7 : -11;
    const moraleDefend = won ? -14 : 8;
    for (const unit of attackers) {
      unit.morale = Math.round(clampValue(unitMorale(unit) + moraleAttack, 8, 100));
      if (won) unit.veteran = Math.round(clampValue(unitVeteran(unit) + 0.5, 0, 6) * 10) / 10;
      if (attackerCasualties > 0) {
        unit.wounded = num(unit.wounded, 0) + Math.round(attackerCasualties * 0.42 / Math.max(1, attackers.length));
      }
    }
    for (const unit of defenders) {
      unit.morale = Math.round(clampValue(unitMorale(unit) + moraleDefend, 5, 100));
      if (!won) unit.veteran = Math.round(clampValue(unitVeteran(unit) + 0.4, 0, 6) * 10) / 10;
      if (defenderCasualties > 0) {
        unit.wounded = num(unit.wounded, 0) + Math.round(defenderCasualties * 0.42 / Math.max(1, defenders.length));
      }
    }
    return {
      city, side: attackingSide, defendingSide, result: won ? 'capture' : 'repelled', days: num(numbers.days, 1),
      period: numbers.period ?? battlePeriod(state.date, city),
      attackerStrength: attackerStart, defenderStrength: defenderStart,
      attackerCasualties, defenderCasualties, wounded, prisoners, routed, captured,
      moraleAttack, moraleDefend, experience: won ? attackingSide : defendingSide,
      attackDirections: num(numbers.attackDirections, 1),
    };
  }

  function combatWidth(map, city) {
    const value = Number(city?.value) || 1;
    return Math.max(4, Math.min(14, 4 + Math.round(value)));
  }

  function startBattle(state, city, side, defendingSide) {
    state.battles ??= {};
    const record = {
      city: city.id, side, defendingSide, since: state.date, days: 0,
      period: battlePeriod(state.date, city),
      attackerStrength: 0, defenderStrength: 0,
      attackerUnitIds: [], defenderUnitIds: [],
      attackerCasualties: 0, defenderCasualties: 0, wounded: 0, prisoners: 0, routed: 0,
      lastRatio: 1,
    };
    state.battles[city.id] = record;
    addLog(state, sideNames[side] + '开始对' + city.name + '发起' + record.period + '。', 'battle-start',
      { city: city.id, side, defendingSide, period: record.period });
    return record;
  }

  function clearStaleBattles(map, state, combat) {
    for (const city of Object.keys(state.battles ?? {})) {
      const battle = state.battles[city];
      const stillFighting = combat.some(unit => unit.strength > 0 && unit.side === battle.side
        && unit.order && hostileOrders.has(unit.order.type) && unit.order.target === city
        && map.neighbors.get(unit.city)?.includes(city));
      if (!map.cities.has(city) || state.owners[city] === battle.side || !stillFighting) {
        delete state.battles[city];
      }
    }
  }

  function advanceOrders(map, state, tree) {
    const { combat } = tree;
    const attacks = new Map();
    const attacksByDirection = new Map();
    const bombards = new Map();
    const screens = new Map();
    const completed = new Map();
    const interceptions = new Map();
    const finish = (unit, target, description, phase = 'completed', reason) => {
      if (unit.automatedOrder !== false) return;
      const issuer = tree.byId.get(unit.orderUnit) ?? unit;
      const action = unit.order.type;
      completed.set(issuer.id + ':' + action + ':' + target, {
        text: issuer.name + description,
        city: target, side: unit.side, unitId: issuer.id, action, phase, ...(reason ? { reason } : {}),
      });
    };

    for (const unit of combat) {
      if (unit.order?.type !== 'intercept' || unit.strength <= 0) continue;
      const { target } = unit.order;
      const name = map.cities.get(target)?.name ?? target;
      if (state.owners[target] === unit.side || !map.neighbors.get(unit.city)?.includes(target)) {
        finish(unit, target, '结束在' + name + '周边的围点打援。', 'cleared', '目标归属或相邻关系已变化');
        clearOrder(unit);
        continue;
      }
      if (unit.orderDays > 0) {
        unit.orderDays -= 1;
        if (unit.orderDays === 0) finish(unit, target, '已在' + name + '周边展开围点打援。');
      }
      if (unit.orderDays > 0) continue;
      if (!screens.has(target)) screens.set(target, []);
      screens.get(target).push(unit);
    }

    const interceptArrival = (unit, target) => {
      const units = screens.get(target);
      if (!units || state.owners[target] !== unit.side) return false;
      const screenStrength = units.reduce((sum, screen) => {
        if (screen.side === unit.side || screen.order?.type !== 'intercept') return sum;
        return sum + screen.strength * profileFor(screen).screen * (0.4 + screen.food * 0.006);
      }, 0);
      if (screenStrength <= 0) return false;
      const losses = unit.strength;
      applyLosses([unit], 0.14 * screenStrength / (screenStrength + unit.strength), state);
      const key = unit.side + ':' + target;
      const previous = interceptions.get(key)?.losses ?? 0;
      interceptions.set(key, { city: target, side: unit.side, losses: previous + losses - unit.strength });
      return true;
    };

    for (const unit of combat) {
      if (!unit.order || unit.strength <= 0) continue;
      const { type, target } = unit.order;
      if (type === 'hold' || type === 'intercept' || type === 'defend' && target === unit.city) continue;
      unit.orderDays = Math.max(0, (unit.orderDays ?? 1) - 1);
      if (unit.orderDays > 0) continue;

      const targetName = map.cities.get(target)?.name ?? target;
      if (type === 'bombard') {
        if (state.airWar?.[unit.side]?.mission === 'airdrop') { clearOrder(unit); continue; }
        const bases = [...map.cities.values()].filter(city => state.owners[city.id] === unit.side
          && (Number(city.value) || 0) >= 5);
        const targetCity = map.cities.get(target);
        const inRange = bases.some(base => targetCity
          && Math.hypot(base.lon - targetCity.lon, (base.lat - targetCity.lat) * 1.25) <= map.bombardRange);
        if (!inRange || state.owners[target] === unit.side || (state.airWar?.[unit.side]?.planes ?? 0) < 10) {
          clearOrder(unit);
          continue;
        }
        if (!bombards.has(target)) bombards.set(target, []);
        bombards.get(target).push(unit);
        continue;
      }
      if ((type === 'advance' || type === 'siege') && state.owners[target] !== unit.side) {
        const oversea = seaLink(map, unit.city, target);
        const adjacent = !oversea && map.neighbors.get(unit.city)?.includes(target);
        if (!adjacent && !oversea) {
          finish(unit, target, '已停止对' + targetName + '的行动，出发城市已变更。', 'cleared', '出发城市已变更');
          clearOrder(unit);
          continue;
        }
        if (oversea) {
          const need = Math.ceil(unit.strength / 1500);
          if ((state.navy?.[unit.side]?.transports ?? 0) < need) {
            finish(unit, target, '已放弃渡海进攻' + targetName + '，运输船不足。', 'cleared', 'no-transports');
            clearOrder(unit);
            continue;
          }
          unit.seaAssault = true;
        }
        if (!attacks.has(target)) attacks.set(target, []);
        attacks.get(target).push(unit);
        if (!attacksByDirection.has(target)) attacksByDirection.set(target, new Map());
        const direction = unit.city;
        const byDirection = attacksByDirection.get(target);
        if (!byDirection.has(direction)) byDirection.set(direction, []);
        byDirection.get(direction).push(unit);
        continue;
      }

      const route = friendlyRoute(map, state, unit.city, target, unit.side);
      let delayed = false;
      if (route?.length > 1) {
        delayed = interceptArrival(unit, route[1]);
        unit.city = route[1];
        unit.area = map.cities.get(unit.city)?.region ?? unit.area;
      }
      if (route && unit.city === target && unit.strength > 0) {
        finish(unit, target, type === 'defend' ? '已抵达' + targetName + '并完成布防。' : '已抵达' + targetName + '。', 'arrival');
      }
      if (!route) finish(unit, target, '已停止调往' + targetName + '，沿途友方路线中断。', 'cleared', 'route-broken');
      if (!route) {
        delete unit.garrison;
        let parent = unit.parent ? tree.byId.get(unit.parent) : null;
        while (parent) {
          delete parent.garrison;
          parent = parent.parent ? tree.byId.get(parent.parent) : null;
        }
      }
      if (!route || unit.strength === 0 || (unit.city === target && type !== 'defend')) {
        clearOrder(unit);
      } else if (unit.city === target) {
        unit.orderDays = 0;
      } else {
        unit.orderDays = deploymentDays(map, 'move', unit, route[2], unit.city, state) + (delayed ? 1 : 0);
      }
    }

    for (const [target, planned] of attacks) {
      const attackersAll = planned.filter(unit => unit.order?.target === target && unit.strength > 0
        && state.owners[target] !== unit.side);
      if (!attackersAll.length) continue;
      const city = map.cities.get(target);
      const side = attackersAll[0].side;
      const defendingSide = state.owners[target];
      const defenders = combat.filter(unit => unit.city === target && unit.side !== side && unit.strength > 0);
      const fort = unitFortDefense({ city: target }, state);
      const obstacle = unitFortAttack({ city: target }, state);
      let battle = state.battles[target];
      if (battle && battle.side !== side) {
        delete state.battles[target];
        battle = null;
      }
      if (!battle) battle = startBattle(state, city, side, defendingSide);
      battle.days += 1;
      battle.period = battlePeriod(state.date, city);
      for (const [units, idsKey, strengthKey] of [
        [attackersAll, 'attackerUnitIds', 'attackerStrength'], [defenders, 'defenderUnitIds', 'defenderStrength'],
      ]) {
        if (!Array.isArray(battle[idsKey])) {
          battle[idsKey] = units.map(unit => unit.id);
          if (!battle[strengthKey]) {
            battle[strengthKey] = Math.round(units.reduce((sum, unit) => sum + unit.strength, 0));
          }
          continue;
        }
        const counted = new Set(battle[idsKey]);
        for (const unit of units) {
          if (counted.has(unit.id)) continue;
          counted.add(unit.id);
          battle[idsKey].push(unit.id);
          battle[strengthKey] += Math.round(unit.strength);
        }
      }

      const finishAttack = (won) => {
        for (const unit of attackersAll) {
          const action = unit.order?.type === 'siege' ? '围城' : '进攻';
          finish(unit, target, '对' + city.name + '的' + action + (won ? '完成。' : '受阻，暂退整补。'));
        }
      };
      const conclude = (won, routed = 0) => {
        const record = battleOutcome(state, target, side, defendingSide, attackersAll, defenders, won, {
          attackerStart: battle.attackerStrength, defenderStart: battle.defenderStrength,
          attackerCasualties: battle.attackerCasualties, defenderCasualties: battle.defenderCasualties,
          routed, days: battle.days, period: battle.period, attackDirections: battle.attackDirections,
        });
        awardLeaderXp(state, attackersAll, 6 + Math.round((battle.attackerCasualties + battle.defenderCasualties) / 1500));
        awardLeaderXp(state, defenders, 4 + Math.round((battle.attackerCasualties + battle.defenderCasualties) / 2000));
        addLog(state, city.name + battle.period + (won ? '战斗结束，' : '围攻受挫，'), 'battle-end',
          { city: target, side, defendingSide, result: won ? 'capture' : 'repelled', days: battle.days,
            period: battle.period,
            weather: battle.weather, tactic: battle.tactic,
            nearbyUnits: nearbyForces(combat, target, map.neighbors.get(target) ?? []), aftermath: record,
            fort, obstacle });
        delete state.battles[target];
      };

      // 无守军：直接占领，不进入逐日消耗。
      if (!defenders.length) {
        finishAttack(true);
        consumeTransports(state, side, attackersAll, 1);
        const directed = attackersAll.some(unit => unit.automatedOrder === false);
        capture(map, state, combat, target, side, false, undefined, interceptArrival);
        if (directed) recordIntervention(state, target, side);
        for (const unit of attackersAll) {
          if (unit.strength > 0) {
            unit.city = target;
            unit.area = city.region ?? unit.area;
            unit.org = Math.max(0, unitOrg(unit) - 4);
          }
          clearOrder(unit);
        }
        conclude(true);
        continue;
      }

      // 战斗宽度：只有最强的若干部队能同时展开，其余作为预备队。
      const width = combatWidth(map, city);
      const campaign = map.cities.size > 100;
      const ready = attackersAll.filter(unit => unitOrg(unit) > 0)
        .sort((a, b) => b.strength - a.strength);
      const engageCap = campaign ? Math.min(width, 1 + battle.days) : width;
      const engaged = ready.slice(0, engageCap);
      const sampledGround = Number.isFinite(city.lon) && Number.isFinite(city.lat)
        ? terrainAt(map.data, city.lon, city.lat)?.terrain : null;
      const terrainName = String(city.terrain ?? '');
      const terrain = /mountain|plateau|岭|山|高原/.test(terrainName) || sampledGround === 'mountain' ? 1.22
        : sampledGround === 'highland' ? 1.16
          : /hill|rough|丘陵|高地/.test(terrainName) || sampledGround === 'rough' ? 1.12
            : sampledGround === 'hill' ? 1.06 : 1;
      const recon = clampValue(1 - num(state.recon?.[side], 0) / 220, 0.55, 1);
      const terrainFactor = 1 + (terrain - 1) * recon;
      const air = clampValue((num(state.air?.[side], 0) - num(state.air?.[defendingSide], 0) * 0.45) / 520, -0.06, 0.16);
      const variation = 0.95 + (hash(state.date + target + side) % 11) * 0.01;
      const weather = weatherCombat(state, map, state.date, city);
      const tactic = campaign ? tacticTable[hash(state.date + target + side) % tacticTable.length] : null;
      const tacticAttack = tactic ? tactic.attack : 1;
      const tacticDefense = tactic ? tactic.defense : 1;
      const cas = state.airWar?.[side]?.mission === 'cas' ? 1.08 : 1;
      const attackDirections = new Set(engaged.map(unit => unit.city)).size;
      const multidir = attackDirections >= 2 ? 1.1 : 1;
      battle.attackDirections = attackDirections;
      const prepPlan = engaged.map(unit => (state.plans ?? []).find(plan => plan.id === unit.orderPlan)).find(Boolean);
      const prep = prepPlan ? Math.min(0.1, (prepPlan.prep ?? 0) * 0.01) : 0;
      const seaRatio = engaged.filter(unit => unit.seaAssault).length / Math.max(1, engaged.length);
      const average = (list, pick) => list.reduce((sum, unit) => sum + pick(unit), 0) / Math.max(1, list.length);
      const armor = average(engaged, unit => unitDesignStats(state, unit).armor);
      const piercing = average(engaged, unit => unitDesignStats(state, unit).piercing);
      const enemyArmor = average(defenders, unit => unitDesignStats(state, unit).armor);
      const enemyPiercing = average(defenders, unit => unitDesignStats(state, unit).piercing);
      const armored = (armor > enemyPiercing + 0.5 ? 1.08 : 1) * (enemyArmor > piercing + 0.5 ? 0.92 : 1);
      const river = city?.river && seaRatio === 0
        ? 1 - 0.12 * Math.max(0, 1 - (state.riverBonus?.[side] ?? 0)) : 1;
      const invasionPrep = clampValue(state.navy?.[side]?.invasion ?? 0, 0, 1);
      const landingFactor = 1 - 0.18 * seaRatio + 0.26 * seaRatio * invasionPrep;
      const night = battle.period === '夜战';
      const attackPower = power(engaged, false, state) * (1 - obstacle) * (1 + air) * variation
        * weather.attack * tacticAttack * cas * multidir * armored * river * (1 + prep) * landingFactor
        * (night ? 0.92 : 1);
      const attackStrength = engaged.reduce((sum, unit) => sum + unit.strength, 0);
      const siegeStrength = engaged.reduce((sum, unit) => sum + (unit.order?.type === 'siege'
        ? unit.strength * profileFor(unit).siege * (1 + unitSupport(unit).artillery / 400) : 0), 0);
      const siegeEffect = attackStrength > 0 ? 1 - 0.3 * siegeStrength / attackStrength : 1;
      const defensePower = power(defenders, true, state) * terrainFactor * (isTaiwan(city) ? 1.55 : 1)
        * (1 + fort) * siegeEffect * tacticDefense * (night ? 1.03 : 1);
      const ratio = attackPower / Math.max(defensePower, 1);
      battle.lastRatio = Math.round(ratio * 100) / 100;
      battle.weather = weather.name;
      battle.tactic = tactic?.name ?? null;

      const attackOrgLoss = clampValue(3 + 8.5 / Math.max(ratio, 0.15), 2, 20);
      const defenseOrgLoss = clampValue(3 + 8 * ratio, 2, 22);
      const attackShare = clampValue(0.0012 / Math.max(ratio, 0.2), 0.0003, 0.008);
      const defenseShare = clampValue(0.0012 * ratio, 0.0003, 0.008);

      const attackerBefore = attackStrength;
      const defenderBefore = defenders.reduce((sum, unit) => sum + unit.strength, 0);
      for (const unit of engaged) {
        unit.org = Math.max(0, unitOrg(unit) - attackOrgLoss);
        applyLosses([unit], attackShare, state);
      }
      for (const unit of defenders) {
        unit.org = Math.max(0, unitOrg(unit) - defenseOrgLoss);
        applyLosses([unit], defenseShare, state);
      }
      battle.attackerCasualties += Math.max(0, attackerBefore - engaged.reduce((sum, unit) => sum + unit.strength, 0));
      battle.defenderCasualties += Math.max(0, defenderBefore - defenders.reduce((sum, unit) => sum + unit.strength, 0));

      const attackersBroken = !engaged.length || engaged.every(unit => unit.strength <= 0 || unitOrg(unit) <= 0);
      const defendersBroken = defenders.every(unit => unit.strength <= 0 || unitOrg(unit) <= 0);
      if (!attackersBroken && !defendersBroken) continue;

      if (defendersBroken) {
        finishAttack(true);
        consumeTransports(state, side, attackersAll, 1);
        const directed = attackersAll.some(unit => unit.automatedOrder === false);
        for (const unit of defenders) {
          unit.org = Math.max(0, unitOrg(unit) - 12);
          unit.wounded = num(unit.wounded, 0) + Math.round(unit.strength * 0.05);
        }
        const defenderBeforeCapture = defenders.reduce((sum, unit) => sum + unit.strength, 0);
        capture(map, state, combat, target, side, false, undefined, interceptArrival);
        battle.routed += Math.max(0, defenderBeforeCapture - defenders.reduce((sum, unit) => sum + unit.strength, 0));
        if (directed) recordIntervention(state, target, side);
        for (const unit of attackersAll) {
          if (unit.strength > 0) {
            unit.city = target;
            unit.area = city.region ?? unit.area;
            unit.org = Math.max(0, unitOrg(unit) - 5);
          }
          clearOrder(unit);
        }
        conclude(true, battle.routed);
      } else {
        finishAttack(false);
        consumeTransports(state, side, attackersAll, 0.5);
        for (const unit of attackersAll) {
          if (unit.strength > 0) unit.org = Math.max(0, unitOrg(unit) - 4);
          clearOrder(unit);
        }
        const directed = defenders.some(unit => unit.automatedOrder === false
          && unit.order?.type === 'defend' && unit.order.target === target);
        if (directed) recordIntervention(state, target, state.owners[target]);
        conclude(false);
      }
    }

    for (const [target, sorties] of bombards) {
      const city = map.cities.get(target);
      if (!city || state.owners[target] === sorties[0].side) continue;
      const side = sorties[0].side;
      const enemy = side === 'ccp' ? 'roc' : 'ccp';
      const force = state.airWar[side];
      const opposition = state.airWar[enemy];
      const zone = city.region ?? 'north';
      if (force.mission === 'airdrop') {
        state.logistics[side].ammo += 35 * sorties.length;
        state.logistics[side].medical += 15 * sorties.length;
        addLog(state, '空投机群向' + city.name + '方向投送弹药与医疗物资。', 'air-drop',
          { side, city: target, action: 'airdrop' });
        continue;
      }
      const ownFleet = state.seaZones?.[zone]?.[side]?.mission === 'patrol' ? 1.15 : 1;
      const enemyPatrol = state.seaZones?.[zone]?.[enemy]?.mission === 'patrol' ? 1.2 : 1;
      const pressure = Math.max(0.08, (force.planes / (force.planes + opposition.planes + 1)) * ownFleet / enemyPatrol);
      const damage = (0.008 + pressure * 0.018) * Math.max(1, sorties.length);
      state.economy[enemy].treasury = Math.max(0, state.economy[enemy].treasury - (Number(city.value) || 1) * damage * 10);
      state.stock[enemy].infantry = Math.max(0, state.stock[enemy].infantry - damage * 8);
      if (state.production?.[enemy]?.lines) {
        state.production[enemy].lines.infantry = Math.max(0, state.production[enemy].lines.infantry - damage * 2);
      }
      force.losses = (force.losses ?? 0) + Math.max(0.02, force.planes * (1 - pressure) * 0.002);
      force.planes = Math.max(0, force.planes - Math.max(0.03, force.planes * (1 - pressure) * 0.002));
      state.warSupport[enemy] = Math.max(2, state.warSupport[enemy] - damage * 0.25);
      addLog(state, sideNames[side] + '空军轰炸' + city.name + '，压制敌方工业与装备生产。', 'air-strike',
        { side, city: target, action: 'strategic-bombing', pressure: Math.round(pressure * 100) });
    }

    clearStaleBattles(map, state, combat);

    for (const { text, ...details } of completed.values()) addLog(state, text, 'operation', details);
    for (const { city, side, losses } of interceptions.values()) {
      const name = map.cities.get(city).name;
      addLog(state, sideNames[side] + '援军在进入' + name + '时遭拦截，' + losses + ' 人退出战斗。', 'intercept',
        { city, side, losses });
    }
  }

  function preservePlayerOutcome(map, state, city, historicalSide, details = {}) {
    const side = state.owners[city];
    if (side === historicalSide || state.intervened?.[city] !== side) return false;
    const name = map.cities.get(city).name;
    addLog(state, name + '沿用本局战果，现由' + sideNames[side] + '控制。', 'divergence',
      { ...details, city, side, historicalSide });
    return true;
  }

  function applyHistory(data, map, state, tree) {
    const historical = state.historyMode === 'historical';
    const skipped = new Set();
    for (const event of map.events.get(state.date) ?? []) {
      const details = { eventId: event.id, city: event.city ?? null, side: event.side ?? null, source: event.source ?? null };
      const changesControl = historical && map.cities.has(event.city) && sides.includes(event.side);
      if (state.historicalEvents?.[event.id] === false) {
        if (changesControl) skipped.add(event.side + ':' + event.city);
        addLog(state, '本局略过史实节点「' + event.title + '」。', 'reference', details);
        continue;
      }
      if (changesControl && preservePlayerOutcome(map, state, event.city, event.side, details)) {
        skipped.add(event.side + ':' + event.city);
        continue;
      }

      addLog(state, event.title + (event.detail ? '｜' + event.detail : ''), historical ? 'history' : 'reference',
        details);
      if (changesControl) {
        capture(map, state, tree.combat, event.city, event.side, true, event.source);
      }
    }

    if (historical) {
      for (const anchor of map.anchors) {
        if (anchor.date !== state.date) continue;
        for (const side of sides) {
          for (const city of anchor[side] ?? []) {
            if (!map.cities.has(city) || skipped.has(side + ':' + city)) continue;
            if (preservePlayerOutcome(map, state, city, side, { source: anchor.source ?? null })) continue;
            capture(map, state, tree.combat, city, side, true, anchor.source);
          }
        }
      }
    }

    const roster = data.units ?? [];
    for (const seed of roster) {
      if (seed.from === state.date && !tree.byId.has(seed.id)) {
        const related = seed.predecessors ?? roster.filter(old => seed.group && old.side === seed.side
          && old.group === seed.group && old.until === seed.from).map(old => old.id);
        const predecessors = historical ? [] : related.map(id => tree.byId.get(id))
          .filter(army => army && !army.inactive && army.side === seed.side);
        if (predecessors.length) {
          reorganize(map, state, tree, seed, predecessors);
        } else if (createArmy(state, map, seed)) {
          addLog(state, seed.name + '进入战场。', 'reinforcement', { side: seed.side, city: seed.city });
        }
      }
      if (historical && seed.until === state.date && tree.byId.has(seed.id)) {
        retire(tree.byId.get(seed.id), tree);
        addLog(state, seed.name + '结束当前编制。', 'history', { side: seed.side });
      }
    }
  }

  function retire(unit, tree) {
    unit.inactive = true;
    unit.strength = 0;
    clearOrder(unit);
    for (const child of tree.children.get(unit.id) ?? []) retire(child, tree);
  }

  function reorganize(map, state, tree, seed, predecessors) {
    const units = predecessors.flatMap(army => leaves(army, tree));
    const strength = units.reduce((sum, unit) => sum + unit.strength, 0);
    const headquarters = predecessors.reduce((largest, army) => army.strength > largest.strength ? army : largest);
    const army = createArmy(state, map, {
      ...seed,
      city: headquarters.city,
      strength,
      maxStrength: seed.strength,
      food: headquarters.food,
      equipment: headquarters.equipment,
    });
    if (!army) return;
    army.delegated = headquarters.delegated;
    army.delegateTarget = headquarters.delegateTarget;
    for (const predecessor of predecessors) retire(predecessor, tree);
    addLog(state, army.name + '由原部队改编。', 'reinforcement', { city: army.city, side: army.side });
  }

  function isTaiwan(city) {
    return Boolean(city && (city.id === 'taipei' || /taiwan|台湾|臺灣/i.test(city.region ?? '')));
  }

  const decisionKinds = {
    defect: { name: '策反', cost: 30, cooldown: 8, hint: '离间与己方接战或被围的敌军，可能使其起义。' },
    reorganize: { name: '整军', cost: 15, cooldown: 5, hint: '整补后方城镇的驻军，恢复组织度。' },
    airlift: { name: '空运补给', cost: 20, cooldown: 6, hint: '向被围城镇空投弹药与医疗物资。' },
    mobilize: { name: '动员', cost: 25, cooldown: 10, hint: '征发兵员与物资，增加兵员储备与战争支持。' },
  };

  function ensurePolitics(state) {
    state.political ??= {};
    for (const side of sides) {
      const current = state.political[side] ?? {};
      state.political[side] = { points: num(current.points, 20), cooldowns: current.cooldowns ?? {} };
    }
    state.warSupport ??= { ccp: 82, roc: 58 };
    state.capitals ??= {};
  }

  function politicalStep(data, state) {
    ensurePolitics(state);
    const value = { ccp: 0, roc: 0 };
    for (const city of data.cities) value[state.owners[city.id]] += Number(city.value) || 1;
    for (const side of sides) {
      const politics = state.political[side];
      politics.points = Math.min(200, politics.points + 0.22 + value[side] / 240);
      for (const key of Object.keys(politics.cooldowns)) {
        politics.cooldowns[key] -= 1;
        if (politics.cooldowns[key] <= 0) delete politics.cooldowns[key];
      }
    }
  }

  function decide(data, state, kind, args = {}) {
    ensureLogistics(state);
    ensurePolitics(state);
    const definition = decisionKinds[kind];
    if (!definition) return { ok: false, error: '无法识别该项决议。' };
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    const side = state.player;
    const politics = state.political[side];
    if (politics.cooldowns[kind]) {
      return { ok: false, error: definition.name + '还需 ' + politics.cooldowns[kind] + ' 天才能再次使用。' };
    }
    if (politics.points < definition.cost) {
      return { ok: false, error: definition.name + '需要政治点 ' + definition.cost + '。' };
    }
    const map = index(data);
    const tree = unitTree(state);

    if (kind === 'mobilize') {
      politics.points -= definition.cost;
      politics.cooldowns[kind] = definition.cooldown;
      const manpower = Math.round(leafStrength(state, side) * 1000 * 0.04);
      state.economy[side].manpower += manpower;
      state.warSupport[side] = clampValue(num(state.warSupport[side], 60) + 2, 2, 100);
      addLog(state, sideNames[side] + '实施动员，兵员储备增加 ' + manpower + '。', 'decision',
        { side, action: 'decide', kind });
      return { ok: true, manpower };
    }

    if (kind === 'reorganize' || kind === 'airlift') {
      const city = args.city;
      if (!map_has(data, city) || state.owners[city] !== side) return { ok: false, error: '请在己方城镇执行。' };
      const local = tree.combat.filter(unit => unit.city === city && unit.side === side && unit.strength > 0);
      if (!local.length) return { ok: false, error: '这座城市没有驻军。' };
      politics.points -= definition.cost;
      politics.cooldowns[kind] = definition.cooldown;
      if (kind === 'reorganize') {
        for (const unit of local) unit.org = Math.round(Math.min(100, unitOrg(unit) + 30));
        addLog(state, map_name(data, city) + '驻军完成整军，组织度恢复。', 'decision',
          { side, city, action: 'decide', kind });
        return { ok: true };
      }
      for (const unit of local) {
        unit.ammo = Math.round(Math.min(100, unitAmmo(unit) + 35));
        unit.medical = Math.round(Math.min(100, unitMedical(unit) + 30));
      }
      state.logistics[side].ammo += 150;
      state.logistics[side].medical += 60;
      addLog(state, '空运补给抵达' + map_name(data, city) + '，弹药与医疗物资得到补充。', 'decision',
        { side, city, action: 'decide', kind });
      return { ok: true };
    }

    if (kind === 'defect') {
      const target = state.units.find(unit => unit.id === args.unitId
        && unit.side !== side && unit.strength > 0 && !unit.inactive);
      if (!target) return { ok: false, error: '请选择可策反的敌军部队。' };
      const rootId = target.parent ? target.parent.replace(/-d\d+$/, '') : target.id;
      const army = tree.byId.get(rootId) ?? target;
      if (army.side === side) return { ok: false, error: '该部队已在本方。' };
      const nearby = map.neighbors.get(army.city) ?? [];
      const contact = nearby.some(id => state.owners[id] === side) || state.battles?.[army.city]?.side === side;
      if (!contact) return { ok: false, error: '只有与己方接战或被围的敌军才能策反。' };
      politics.points -= definition.cost;
      politics.cooldowns[kind] = definition.cooldown;
      const surrounded = nearby.every(id => state.owners[id] !== army.side);
      const chance = clampValue(26 + (70 - unitMorale(army)) * 0.7
        + ((army.food ?? 100) < 40 ? 16 : 0) + (surrounded ? 18 : 0) + (army.group ? 6 : 0), 8, 92);
      const roll = hash(state.date + army.id + side) % 100;
      if (roll >= chance) {
        addLog(state, '策反' + army.name + '未成，对方仍在观望。', 'decision',
          { side, city: army.city, action: 'decide', kind, chance, roll });
        return { ok: true, success: false, chance };
      }
      for (const unit of [army, ...descendants(army, tree)]) {
        unit.side = side;
        unit.morale = Math.max(28, Math.round(unitMorale(unit) - 12));
        unit.org = Math.round(Math.min(100, unitOrg(unit) + 10));
        delete unit.garrison;
        clearOrder(unit);
      }
      addLog(state, army.name + '宣布起义，归入' + sideNames[side] + '。', 'defect',
        { side, city: army.city, unitId: army.id, action: 'defect', chance, roll });
      if (nearby.every(id => state.owners[id] !== army.side)) {
        capture(map, state, tree.combat, army.city, side, false, undefined, undefined);
      }
      return { ok: true, success: true, chance };
    }

    return { ok: false, error: '无法执行该项决议。' };
  }

  const lawFactors = {
    conscription: { volunteer: 1, limited: 1.15, extensive: 1.32 },
    economy: { civilian: 1, partial: 1.15, war: 1.32 },
  };
  const lawNames = {
    volunteer: '志愿兵役', limited: '有限征兵', extensive: '全民动员',
    civilian: '民用经济', partial: '部分动员', war: '战时经济',
  };
  const intelOps = {
    recon: { name: '侦察', cost: 20, cooldown: 6, hint: '提升对敌情报水平。' },
    sabotage: { name: '破坏', cost: 30, cooldown: 10, hint: '打击敌方库存与机队。' },
  };
  const diplomacyOps = {
    aid: { name: '争取外援', cost: 40, cooldown: 25, hint: '获得装备与财政援助。' },
    embargo: { name: '禁运', cost: 30, cooldown: 20, hint: '削弱敌方补给 20 天。' },
    ceasefire: { name: '提议停战', cost: 50, cooldown: 60, hint: '双方战争支持都较低时可能结束战争。' },
  };
  const tacticTable = [
    { id: 'assault', name: '强攻', attack: 1.06, defense: 0.97 },
    { id: 'infiltration', name: '渗透', attack: 1.04, defense: 1.01 },
    { id: 'elastic', name: '弹性防御', attack: 0.98, defense: 1.06 },
    { id: 'counter', name: '反击', attack: 1.02, defense: 1.02 },
    { id: 'ambush', name: '伏击', attack: 0.97, defense: 1.08 },
  ];

  function ensureSystems(state) {
    state.designs ??= {};
    for (const side of sides) {
      if (!Array.isArray(state.designs[side]) || !state.designs[side].length) {
        state.designs[side] = [normalizeDesign({ id: side + '-std', name: '标准师', branch: 'infantry' })];
      }
      state.designs[side] = state.designs[side].map(design =>
        normalizeDesign({ ...design, id: design.id || side + '-std' }));
    }
    state.research ??= {};
    for (const side of sides) {
      const current = state.research[side] ?? {};
      state.research[side] = { points: num(current.points, 80), levels: { ...emptyLevels(), ...(current.levels ?? {}) } };
    }
    state.airWar ??= {};
    for (const side of sides) {
      const current = state.airWar[side] ?? {};
      state.airWar[side] = {
        planes: num(current.planes, side === 'ccp' ? 18 : 60),
        mission: airMissions[current.mission] ? current.mission : 'superiority',
        losses: num(current.losses, 0),
      };
    }
    state.stock ??= {};
    for (const side of sides) {
      state.stock[side] = {
        infantry: 600, artillery: 200, armor: 0, air: 0,
        ...(state.stock[side] ?? {}),
      };
    }
    state.production ??= {};
    for (const side of sides) {
      state.production[side] = {
        lines: { infantry: 40, artillery: 25, armor: 15, air: 20, naval: 0 },
        ...(state.production[side] ?? {}),
      };
      state.production[side].lines = { naval: 0, ...state.production[side].lines };
    }
    state.command ??= {};
    for (const side of sides) {
      state.command[side] = { points: 60, cooldowns: {}, ...(state.command[side] ?? {}) };
    }
    state.focus ??= {};
    for (const side of sides) {
      state.focus[side] = { done: [], current: null, progress: 0, ...(state.focus[side] ?? {}) };
    }
    state.buffs ??= [];
    state.externalCooldowns ??= {};
    for (const side of sides) state.externalCooldowns[side] ??= {};
    state.foreignActionCooldowns ??= {};
    for (const side of sides) state.foreignActionCooldowns[side] ??= {};
    state.navy ??= {};
    for (const side of sides) {
      state.navy[side] = {
        transports: 6, warships: 4, patrol: 0, convoy: 0, invasion: 0,
        zones: {}, ...(state.navy[side] ?? {}),
      };
      state.navy[side].zones ??= {};
    }
    state.leadersXp ??= {};
    state.intel ??= {};
    for (const side of sides) {
      state.intel[side] = { level: 35, points: 40, ...(state.intel[side] ?? {}) };
    }
    state.occupation ??= {};
    state.laws ??= {};
    for (const side of sides) {
      state.laws[side] = { conscription: 'volunteer', economy: 'civilian', ...(state.laws[side] ?? {}) };
    }
    state.stability ??= { ccp: 70, roc: 55 };
    state.foreign ??= {};
    state.foreign.usa = { support: 0, embargo: 0, pressure: 0, ...(state.foreign.usa ?? {}) };
    state.foreign.ussr = { support: 0, pressure: 0, equipment: 0, ...(state.foreign.ussr ?? {}) };
    state.foreign.japan = { stock: 0, equipment: 0, ...(state.foreign.japan ?? {}) };
    state.seaZones ??= {};
    for (const [zone, records] of Object.entries(state.seaZones)) {
      if (!records || typeof records !== 'object') { delete state.seaZones[zone]; continue; }
      for (const side of sides) {
        const record = records[side];
        if (!record || typeof record !== 'object' || !['patrol', 'escort', 'raid', 'invasion'].includes(record.mission)) continue;
        if (!state.navy[side].zones[zone]) {
          state.navy[side].zones[zone] = { mission: record.mission, assigned: num(record.assigned, 0) };
        }
      }
    }
    for (const side of sides) {
      for (const [zone, record] of Object.entries(state.navy[side].zones)) {
        if (!record || !['patrol', 'escort', 'raid', 'invasion'].includes(record.mission)) continue;
        state.seaZones[zone] ??= {};
        state.seaZones[zone][side] ??= {
          mission: record.mission,
          strength: num(record.strength, state.navy[side].warships + state.navy[side].transports * 0.5),
          assigned: num(record.assigned, 0),
        };
      }
    }
    state.convoy ??= { ccp: 1, roc: 1 };
    state.aiFronts ??= { ccp: [], roc: [] };
    state.diplomacy ??= {};
    for (const side of sides) {
      state.diplomacy[side] = { cooldowns: {}, ...(state.diplomacy[side] ?? {}) };
    }
    state.treaties ??= {};
    state.trade ??= {};
    for (const side of sides) {
      state.treaties[side] = { volunteers: false, lendLease: true, ...(state.treaties[side] ?? {}) };
      state.trade[side] = { partner: null, steel: 0, oil: 0, rubber: 0, ...(state.trade[side] ?? {}) };
    }
    state.orgBonus ??= { ccp: 0, roc: 0 };
    state.interdiction ??= { ccp: 0, roc: 0 };
    state.riverBonus ??= { ccp: 0, roc: 0 };
    state.air ??= { ccp: 16, roc: 54 };
    for (const unit of state.units) {
      if (!unit.design) unit.design = state.designs[unit.side]?.[0]?.id ?? null;
    }
    for (const side of sides) state.air[side] = airSupport(state, side);
    return state;
  }

  function designStats(state, side, design) {
    const d = normalizeDesign(design);
    const levels = state.research?.[side]?.levels ?? emptyLevels();
    const support = d.support;
    let attack = 1 + (d.artillery - 2) * 0.045 + d.armor * 0.05 + d.motorized * 0.01
      + d.antiTank * 0.02 + (support.recon ? 0.02 : 0);
    let defense = 1 + (d.infantry - 8) * 0.018 + d.antiAir * 0.03 + (support.engineer ? 0.03 : 0);
    attack *= 1 + levels.infantry * 0.04 + levels.artillery * 0.05 + levels.armor * 0.04;
    defense *= 1 + levels.infantry * 0.04 + levels.armor * 0.02;
    const width = clampValue(8 + d.infantry * 0.5 + d.artillery * 0.6 + d.armor * 0.8
      + d.motorized * 0.6 + d.antiAir * 0.4 + d.antiTank * 0.5, 8, 40);
    const speed = 1 + d.motorized * 0.04 + (support.logistics ? 0.02 : 0);
    const supply = Math.max(0.5, 1 + d.armor * 0.05 + (d.artillery - 2) * 0.02 + d.motorized * 0.02
      - (support.logistics ? 0.08 : 0)) * (1 - levels.logistics * 0.03);
    const org = 1 + (d.infantry - 8) * 0.004 + (support.signal ? 0.05 : 0);
    const armor = d.armor * (5 + levels.armor);
    const piercing = 2 + d.antiTank * 6 + d.armor * 2 + levels.armor * 2;
    return { attack, defense, width, speed, supply, org, armor, piercing };
  }

  function unitDesign(state, unit) {
    const list = state.designs?.[unit.side] ?? [];
    return list.find(design => design.id === unit.design) ?? list[0] ?? null;
  }

  function unitDesignStats(state, unit) {
    return designStats(state, unit.side, unitDesign(state, unit));
  }

  function applyDesignSupport(unit, design) {
    const branch = unitBranch(unit);
    const base = supportBase[branch];
    const defaults = designDefaults[branch] ?? designDefaults.infantry;
    const d = normalizeDesign(design);
    unit.support = {
      infantry: clampValue(base.infantry + (d.infantry - defaults.infantry) * 2, 0, 100),
      artillery: clampValue(base.artillery + (d.artillery - defaults.artillery) * 6, 0, 100),
      armor: clampValue(base.armor + d.armor * 12, 0, 100),
      engineer: clampValue(base.engineer + (d.support.engineer ? 12 : 0), 0, 100),
      medical: clampValue(base.medical + (d.support.medical ? 12 : 0), 0, 100),
      transport: clampValue(base.transport + d.motorized * 6, 0, 100),
    };
  }

  function createDesign(state, config = {}) {
    ensureSystems(state);
    const owner = state.player;
    const list = state.designs[owner];
    if (list.length >= 10) return { ok: false, error: '编制方案最多 10 个。' };
    const design = normalizeDesign({
      ...config, id: owner + '-d' + (list.length + 1), branch: config.branch ?? 'infantry',
      name: config.name || '新编制',
    });
    const total = design.infantry + design.artillery + design.armor + design.motorized + design.antiAir + design.antiTank;
    if (total < 1) return { ok: false, error: '编制至少需要 1 个作战营。' };
    if (total > 16) return { ok: false, error: '一个师最多 16 个作战营。' };
    if (design.armor > 0 && (state.research[owner].levels.armor ?? 0) < 1) {
      return { ok: false, error: '装甲营需要先完成装甲科技 1 级。' };
    }
    list.push(design);
    addLog(state, '设计新编制「' + design.name + '」。', 'operation',
      { side: owner, action: 'design-create', designId: design.id });
    return { ok: true, design };
  }

  function updateDesign(state, designId, config = {}) {
    ensureSystems(state);
    const owner = state.player;
    const list = state.designs[owner];
    const index = list.findIndex(design => design.id === designId);
    if (index < 0) return { ok: false, error: '找不到该编制。' };
    const design = normalizeDesign({ ...list[index], ...config, id: designId });
    const total = design.infantry + design.artillery + design.armor + design.motorized + design.antiAir + design.antiTank;
    if (total < 1 || total > 16) return { ok: false, error: '一个师需要 1 到 16 个作战营。' };
    if (design.armor > 0 && (state.research[owner].levels.armor ?? 0) < 1) {
      return { ok: false, error: '装甲营需要先完成装甲科技 1 级。' };
    }
    list[index] = design;
    addLog(state, '调整编制「' + design.name + '」。', 'operation',
      { side: owner, action: 'design-update', designId });
    return { ok: true, design };
  }

  function assignDesign(state, unitId, designId) {
    ensureSystems(state);
    const tree = unitTree(state);
    const picked = tree.byId.get(unitId);
    if (!canCommand(state, picked)) return { ok: false, error: '只能为本方可指挥的部队换编制。' };
    const target = picked.parent ? tree.byId.get(picked.parent) : picked;
    const design = (state.designs[state.player] ?? []).find(item => item.id === designId);
    if (!design) return { ok: false, error: '请选择本方编制。' };
    if (design.armor > 0 && (state.research[state.player].levels.armor ?? 0) < 1) {
      return { ok: false, error: '装甲营需要先完成装甲科技 1 级。' };
    }
    const cost = Math.max(4, Math.round(designCost(design) * target.strength / 60000));
    const economy = state.economy[state.player];
    if (economy.arms < cost) return { ok: false, error: '换编制需要军械 ' + cost + '。' };
    economy.arms -= cost;
    for (const member of [target, ...descendants(target, tree)]) {
      member.design = design.id;
      applyDesignSupport(member, design);
    }
    addLog(state, target.name + '改用「' + design.name + '」编制。', 'operation',
      { side: target.side, city: target.city, unitId: target.id, action: 'design-assign', designId });
    return { ok: true };
  }

  function researchStep(data, state) {
    const value = { ccp: 0, roc: 0 };
    for (const city of data.cities) value[state.owners[city.id]] += Number(city.value) || 1;
    for (const side of sides) {
      const research = state.research[side];
      const stability = num(state.stability?.[side], 60);
      research.points = Math.min(600, research.points + (0.3 + value[side] / 300) * (0.75 + stability / 250));
    }
  }

  function researchTech(state, key) {
    ensureSystems(state);
    const line = techLines[key];
    if (!line) return { ok: false, error: '无法识别的科技。' };
    const side = state.player;
    const research = state.research[side];
    const level = research.levels[key] ?? 0;
    if (level >= line.max) return { ok: false, error: line.name + '已研究到最高级。' };
    const cost = line.costs[level];
    if (research.points < cost) return { ok: false, error: line.name + '需要科研点 ' + cost + '。' };
    research.points -= cost;
    research.levels[key] = level + 1;
    addLog(state, sideNames[side] + '完成' + line.name + ' ' + (level + 1) + ' 级研究。', 'research',
      { side, action: 'research', tech: key, level: level + 1 });
    return { ok: true, level: level + 1 };
  }

  function airPowerOf(state, side) {
    const force = state.airWar?.[side];
    if (!force) return 0;
    const tech = state.research?.[side]?.levels?.air ?? 0;
    const mission = airMissions[force.mission] ?? airMissions.superiority;
    const foreign = state.foreign?.usa?.support && side === 'roc' ? 1.12
      : state.foreign?.ussr?.support && side === 'ccp' ? 1.08 : 1;
    return Math.max(0, force.planes) * mission.support * (1 + tech * 0.06) * foreign;
  }

  function foreignStep(data, state) {
    state.foreign ??= {};
    const usa = state.foreign.usa ??= { support: 0, embargo: 0, pressure: 0 };
    const ussr = state.foreign.ussr ??= { support: 0, pressure: 0, equipment: 0 };
    const japan = state.foreign.japan ??= { stock: 0, equipment: 0 };
    const date = state.date;
    const usAid = ['1946-01-01', '1947-01-01', '1948-06-01'].some(mark => date >= mark)
      && date < '1949-01-01' && state.owners.nanjing === 'roc';
    const sovietPressure = date >= '1945-08-15' && date < '1946-04-01'
      && ['harbin', 'changchun', 'dalian'].some(city => state.owners[city] === 'ccp');
    const japanStock = date >= '1945-08-15' && date < '1947-01-01';
    if (usAid) {
      usa.support = Math.min(1, usa.support + 0.025);
      const aid = 0.7 + state.stability.roc / 150;
      state.stock.roc.infantry += aid;
      state.stock.roc.artillery += aid * 0.32;
      state.airWar.roc.planes = Math.min(state.airWar.roc.planes + aid * 0.08, 500);
    } else {
      usa.support = Math.max(0, usa.support - 0.01);
    }
    if (sovietPressure) {
      ussr.support = Math.min(1, ussr.support + 0.018);
      ussr.pressure = Math.min(0.45, ussr.pressure + 0.008);
      state.stock.ccp.infantry += 0.55;
      state.stock.ccp.artillery += 0.18;
      ussr.equipment += 0.35;
    } else {
      ussr.support = Math.max(0, ussr.support - 0.012);
      ussr.pressure = Math.max(0, ussr.pressure - 0.004);
    }
    if (japanStock) {
      japan.stock = Math.min(100, japan.stock + 0.25);
      japan.equipment += 0.12;
      state.stock.ccp.infantry += 0.3;
      if (date < '1946-04-01') state.stock.ccp.artillery += 0.1;
    }
    if (usa.embargo > 0) {
      usa.embargo = Math.max(0, usa.embargo - 0.01);
      state.supplyScarcity.roc = Math.min(state.supplyScarcity.roc, 0.75);
    }
    // 列强状态随历史阶段变化：援助影响工业装备，外交压力影响稳定度与战争支持。
    state.foreign.usa = usa;
    state.foreign.ussr = ussr;
    state.foreign.japan = japan;
    for (const side of sides) {
      const actor = side === 'roc' ? usa : ussr;
      if (actor.support > 0) {
        state.stability[side] = clampValue(state.stability[side] + actor.support * 0.005, 5, 100);
      }
      if (actor.pressure > 0) {
        state.stability[side] = clampValue(state.stability[side] - actor.pressure * 0.006, 5, 100);
      }
    }
  }

  function foreignAction(state, actor, action) {
    ensureSystems(state);
    if (!['usa', 'ussr'].includes(actor)) return { ok: false, error: '只有美国或苏联能执行此项外交行动。' };
    if (!['request-aid', 'lend-lease', 'volunteers', 'pressure', 'embargo'].includes(action)) {
      return { ok: false, error: '无法识别的列强互动。' };
    }
    const side = state.player;
    const other = side === 'ccp' ? 'roc' : 'ccp';
    const political = state.political[side];
    const cooldownKey = actor + ':' + action;
    const cooldown = state.foreignActionCooldowns?.[side]?.[cooldownKey] ?? 0;
    if (cooldown > 0) return { ok: false, error: '该列强互动还需 ' + cooldown + ' 天才能再次使用。' };
    if (action === 'request-aid' || action === 'lend-lease' || action === 'volunteers') {
      const cost = action === 'volunteers' ? 55 : action === 'lend-lease' ? 60 : 45;
      if (political.points < cost) return { ok: false, error: '外交行动需要政治点 ' + cost + '。' };
      if (action === 'lend-lease' && !state.treaties[side]?.lendLease) {
        return { ok: false, error: '需要先签订租借条约。' };
      }
      let volunteer;
      if (action === 'volunteers') {
        if (!state.treaties[side]?.volunteers) return { ok: false, error: '需要先签订志愿军条约。' };
        const source = actor === 'usa' ? 'roc' : 'ccp';
        if (source === side) return { ok: false, error: '志愿军必须来自另一方阵营。' };
        volunteer = state.units.find(unit => !unit.parent && unit.side === source && unit.strength > 0 && !unit.inactive);
        if (!volunteer) return { ok: false, error: '没有可派遣的志愿军。' };
      }
      political.points -= cost;
      state.foreignActionCooldowns[side][cooldownKey] = action === 'volunteers' ? 60 : 30;
      if (action === 'volunteers') {
        volunteer.expeditionary = side;
        volunteer.side = side;
        volunteer.strength = Math.round(volunteer.strength * 0.65);
        volunteer.org = Math.min(unitOrg(volunteer), 70);
        addLog(state, (actor === 'usa' ? '美国' : '苏联') + '派遣志愿军加入' + sideNames[side] + '。', 'foreign',
          { actor, action, side, unitId: volunteer.id });
        return { ok: true, unitId: volunteer.id };
      }
      if (action === 'lend-lease') {
        state.stock[side].infantry += 180;
        state.stock[side].artillery += 75;
        state.airWar[side].planes += 8;
        addLog(state, (actor === 'usa' ? '美国' : '苏联') + '租借装备抵达' + sideNames[side] + '。', 'foreign',
          { actor, action, side });
        return { ok: true };
      }
      if (actor === 'usa') {
        state.foreign.usa.support = Math.min(1, state.foreign.usa.support + 0.25);
        state.stock.roc.infantry += 160;
        state.stock.roc.artillery += 60;
        state.airWar.roc.planes += 12;
        addLog(state, '美国扩大对国民政府的装备援助。', 'foreign', { actor, action, side: 'roc' });
      } else if (actor === 'ussr') {
        state.foreign.ussr.support = Math.min(1, state.foreign.ussr.support + 0.2);
        state.stock.ccp.infantry += 120;
        state.stock.ccp.artillery += 45;
        addLog(state, '苏联向共产党提供东北地区装备援助。', 'foreign', { actor, action, side: 'ccp' });
      } else return { ok: false, error: '该列强不能提供此类军事援助。' };
      return { ok: true };
    }
    if (action === 'pressure') {
      const cost = 35;
      if (political.points < cost) return { ok: false, error: '外交施压需要政治点 ' + cost + '。' };
      political.points -= cost;
      state.foreignActionCooldowns[side][cooldownKey] = 25;
      if (actor === 'usa') {
        state.foreign.usa.pressure = Math.min(1, state.foreign.usa.pressure + 0.3);
        state.warSupport.roc = Math.max(2, state.warSupport.roc - 3);
        state.stability.roc = Math.max(5, state.stability.roc - 3);
      } else if (actor === 'ussr') {
        state.foreign.ussr.pressure = Math.min(1, state.foreign.ussr.pressure + 0.3);
        state.warSupport.roc = Math.max(2, state.warSupport.roc - 2);
      } else if (actor === 'japan') {
        state.foreign.japan.pressure = Math.min(1, (state.foreign.japan.pressure ?? 0) + 0.3);
        state.warSupport.roc = Math.max(2, state.warSupport.roc - 1);
      }
      addLog(state, '通过' + (actor === 'usa' ? '美国' : actor === 'ussr' ? '苏联' : '日本') + '渠道施加外交压力。',
        'foreign', { actor, action, side, other });
      return { ok: true };
    }
    if (action === 'embargo') {
      const cost = 40;
      if (political.points < cost) return { ok: false, error: '请求禁运需要政治点 ' + cost + '。' };
      if (actor !== 'usa' && actor !== 'ussr') return { ok: false, error: '该国不能执行此项禁运。' };
      political.points -= cost;
      state.foreignActionCooldowns[side][cooldownKey] = 35;
      if (actor === 'usa') state.foreign.usa.embargo = Math.min(1, state.foreign.usa.embargo + 0.5);
      else state.foreign.ussr.pressure = Math.min(1, state.foreign.ussr.pressure + 0.25);
      state.supplyScarcity[other] = Math.min(state.supplyScarcity[other], 0.65);
      addLog(state, (actor === 'usa' ? '美国' : '苏联') + '对' + sideNames[other] + '实施禁运。', 'foreign',
        { actor, action, side: other });
      return { ok: true };
    }
    return { ok: false, error: '无法识别的列强互动。' };
  }

  function airSupport(state, side) {
    const other = side === 'ccp' ? 'roc' : 'ccp';
    const own = airPowerOf(state, side);
    const enemy = airPowerOf(state, other);
    return Math.round(clampValue(70 * own / (own + enemy + 1), 0, 100));
  }

  function airStep(data, state) {
    for (const side of sides) {
      const force = state.airWar[side];
      const other = side === 'ccp' ? 'roc' : 'ccp';
      const owned = data.cities.filter(city => state.owners[city.id] === side);
      const bases = owned.filter(city => (Number(city.value) || 0) >= 5).length;
      const capacity = 24 + bases * 18;
      const industry = policyLevel(state, side, 'industry');
      const stability = num(state.stability?.[side], 60);
      const gain = 1.2 + industry * 1.6 + owned.length / 90;
      force.planes = Math.min(capacity, force.planes + gain * (0.8 + stability / 300));
      const mission = airMissions[force.mission] ?? airMissions.superiority;
      const own = airPowerOf(state, side);
      const enemy = airPowerOf(state, other);
      const enemyRatio = enemy / (own + enemy + 1);
      const loss = force.planes * mission.attrition * (0.4 + enemyRatio * 1.6);
      force.planes = Math.max(0, force.planes - loss);
      force.losses = (force.losses ?? 0) + loss;
    }
    for (const side of sides) state.air[side] = airSupport(state, side);
  }

  function setAirMission(state, mission) {
    ensureSystems(state);
    const [kind, zone] = String(mission).split(':');
    if (!airMissions[kind]) return { ok: false, error: '无法识别的空军任务。' };
    const target = state.airWar[state.player];
    target.mission = kind;
    target.zone = zone || null;
    state.air[state.player] = airSupport(state, state.player);
    addLog(state, sideNames[state.player] + '空军转入「' + airMissions[kind].name + '」'
      + (zone ? '，任务区 ' + zone : '') + '。', 'air',
      { side: state.player, action: 'air-mission', mission: kind, zone: zone || null });
    return { ok: true };
  }

  function setNavalMission(state, zone, mission) {
    ensureSystems(state);
    const missions = ['patrol', 'escort', 'raid', 'invasion'];
    if (!zone || (mission && !missions.includes(mission))) return { ok: false, error: '请选择有效海域与舰队任务。' };
    const side = state.player;
    const navy = state.navy[side];
    if (!mission) {
      delete navy.zones[zone];
      if (state.seaZones[zone]) {
        delete state.seaZones[zone][side];
        if (!Object.keys(state.seaZones[zone]).length) delete state.seaZones[zone];
      }
      addLog(state, sideNames[side] + '海军撤销在' + zone + '的任务部署。', 'navy',
        { side, zone, mission: null, action: 'naval-mission-clear' });
      return { ok: true, zone, cleared: true };
    }
    const fleetSize = (navy.warships ?? 0) + (navy.transports ?? 0) * 0.5;
    const cost = mission === 'invasion' ? 12 : mission === 'patrol' ? 8 : 6;
    const committed = Object.entries(navy.zones).reduce((sum, [name, assignment]) =>
      name === zone ? sum : sum + num(assignment?.assigned, 0), 0);
    if (fleetSize - committed < cost) return { ok: false, error: '可用舰队吨位不足，无法执行该海域任务。' };
    navy.zones[zone] = { mission, assigned: cost };
    state.seaZones[zone] ??= {};
    state.seaZones[zone][side] = { mission, strength: cost, assigned: cost };
    addLog(state, sideNames[side] + '海军在' + zone + '转入'
      + ({ patrol: '巡逻', escort: '护航', raid: '破交', invasion: '登陆准备' }[mission]) + '任务。', 'navy',
      { side, zone, mission, action: 'naval-mission' });
    return { ok: true, mission, zone };
  }

  function enemySeaControl(state, zone, side) {
    const own = state.seaZones?.[zone]?.[side]?.strength ?? 0;
    const enemy = state.seaZones?.[zone]?.[side === 'ccp' ? 'roc' : 'ccp']?.strength ?? 0;
    return own / (own + enemy + 1);
  }

  function applyFocus(data, state, side, definition) {
    const effect = definition.effect ?? {};
    const economy = state.economy[side];
    if (effect.manpower) economy.manpower += Math.round(leafStrength(state, side) * 1000 * effect.manpower);
    if (effect.food) economy.food += Math.round(economy.food * effect.food);
    if (effect.treasury) economy.treasury += Math.round(economy.treasury * effect.treasury);
    if (effect.arms) economy.arms += Math.round(economy.arms * effect.arms);
    if (effect.stock) {
      for (const [key, amount] of Object.entries(effect.stock)) state.stock[side][key] += amount;
    }
    if (effect.org) state.orgBonus[side] = (state.orgBonus[side] ?? 0) + effect.org;
    if (effect.air) state.airWar[side].planes += effect.air;
    if (effect.transports) state.navy[side].transports += effect.transports;
    if (effect.naval) state.navy[side].invasion = (state.navy[side].invasion ?? 0) + effect.naval;
    if (effect.interdiction) state.interdiction[side] = (state.interdiction[side] ?? 0) + effect.interdiction;
    if (effect.river) state.riverBonus[side] = (state.riverBonus[side] ?? 0) + effect.river;
    if (effect.warSupport) {
      state.warSupport[side] = clampValue(num(state.warSupport[side], 60) + effect.warSupport, 2, 100);
    }
    if (effect.forts) {
      const targets = dataCapitalAndBorder(data, state, side).slice(0, effect.forts);
      for (const city of targets) {
        state.forts[city] ??= {};
        state.forts[city].trench = Math.min(fortKinds.trench.tier, (state.forts[city].trench ?? 0) + 1);
      }
    }
    addLog(state, sideNames[side] + '完成国策「' + definition.name + '」。', 'focus',
      { side, action: 'focus-done', focusId: definition.id });
  }

  function dataCapitalAndBorder(data, state, side) {
    const map = index(data);
    const border = [...map.cities.values()].filter(city => state.owners[city.id] === side
      && (map.neighbors.get(city.id) ?? []).some(id => state.owners[id] !== side))
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .map(city => city.id);
    const capital = state.capitals?.[side];
    return capital && state.owners[capital] === side ? [capital, ...border] : border;
  }

  function focusStep(data, state) {
    for (const side of sides) {
      const focus = state.focus[side];
      if (!focus.current) continue;
      const definition = (focusTrees[side] ?? []).find(item => item.id === focus.current);
      if (!definition) { focus.current = null; continue; }
      focus.progress = (focus.progress ?? 0) + 1;
      if (focus.progress < definition.days) continue;
      applyFocus(data, state, side, definition);
      focus.done = [...(focus.done ?? []), definition.id];
      focus.current = null;
      focus.progress = 0;
    }
  }

  function startFocus(state, focusId) {
    ensureSystems(state);
    const side = state.player;
    const focus = state.focus[side];
    if (focus.current) return { ok: false, error: '已有国策正在进行。' };
    const definition = (focusTrees[side] ?? []).find(item => item.id === focusId);
    if (!definition) return { ok: false, error: '无法识别的国策。' };
    if (focus.done?.includes(focusId)) return { ok: false, error: '该国有策已完成。' };
    if (definition.requires?.some(id => !focus.done?.includes(id))) {
      return { ok: false, error: '前置国策尚未完成。' };
    }
    focus.current = focusId;
    focus.progress = 0;
    addLog(state, sideNames[side] + '开始推进国策「' + definition.name + '」。', 'focus',
      { side, action: 'focus-start', focusId });
    return { ok: true };
  }

  function productionStep(data, state) {
    const value = { ccp: 0, roc: 0 };
    for (const city of data.cities) value[state.owners[city.id]] += Number(city.value) || 1;
    for (const side of sides) {
      const production = state.production[side];
      const lines = production.lines;
      const total = Object.values(lines).reduce((sum, share) => sum + Math.max(0, Number(share) || 0), 0);
      if (!total) continue;
      const factories = Math.max(2, Math.round(value[side] / 9));
      const industry = policyLevel(state, side, 'industry');
      const stability = num(state.stability?.[side], 60);
      const output = factories * industry * 2.4 * (0.8 + stability / 300);
      for (const key of ['infantry', 'artillery', 'armor', 'air', 'naval']) {
        const share = Math.max(0, Number(lines[key]) || 0);
        if (!share) continue;
        const gain = output * share / total;
        if (key === 'air') {
          state.airWar[side].planes += gain * 0.35;
        } else if (key === 'naval') {
          state.navy[side].transports += gain * 0.06;
        } else {
          state.stock[side][key] += gain;
        }
      }
    }
  }

  function setProduction(state, lines) {
    ensureSystems(state);
    const production = state.production[state.player];
    const next = {};
    for (const key of ['infantry', 'artillery', 'armor', 'air', 'naval']) {
      next[key] = clampValue(Math.round(Number(lines?.[key]) || 0), 0, 100);
    }
    const total = Object.values(next).reduce((sum, share) => sum + share, 0);
    if (total <= 0) return { ok: false, error: '至少给一条生产线分配产能。' };
    if (total > 100) return { ok: false, error: '产能分配总和不能超过 100。' };
    production.lines = next;
    addLog(state, sideNames[state.player] + '调整生产线分配。', 'production',
      { side: state.player, action: 'production', lines: next });
    return { ok: true };
  }

  function commandStep(state) {
    for (const side of sides) {
      const command = state.command[side];
      const armies = state.units.filter(unit => unit.side === side && !unit.parent && unit.strength > 0).length;
      command.points = Math.min(200, command.points + 0.25 + armies * 0.04);
      for (const key of Object.keys(command.cooldowns ?? {})) {
        command.cooldowns[key] -= 1;
        if (command.cooldowns[key] <= 0) delete command.cooldowns[key];
      }
      for (const key of Object.keys(state.foreignActionCooldowns?.[side] ?? {})) {
        state.foreignActionCooldowns[side][key] -= 1;
        if (state.foreignActionCooldowns[side][key] <= 0) delete state.foreignActionCooldowns[side][key];
      }
    }
    state.buffs = (state.buffs ?? []).filter(buff => buff.until >= state.date);
  }

  function commandAbility(data, state, ability, args = {}) {
    ensureSystems(state);
    const definition = commandAbilities[ability];
    if (!definition) return { ok: false, error: '无法识别的指挥技能。' };
    const side = state.player;
    const command = state.command[side];
    if (command.cooldowns[ability]) return { ok: false, error: definition.name + '还需 ' + command.cooldowns[ability] + ' 天。' };
    if (command.points < definition.cost) return { ok: false, error: definition.name + '需要指挥点 ' + definition.cost + '。' };
    const tree = unitTree(state);
    const unit = args.unitId ? tree.byId.get(args.unitId) : null;
    const city = args.city;
    if (ability === 'barrage') {
      if (!map_has(data, city)) return { ok: false, error: '请选择目标城镇。' };
    } else if (!unit || !canCommand(state, unit)) {
      return { ok: false, error: '请选择本方部队。' };
    }
    command.points -= definition.cost;
    command.cooldowns[ability] = definition.cooldown;
    state.buffs.push({
      side, kind: ability, target: ability === 'barrage' ? city : unit.id,
      until: shiftDays(state.date, definition.days),
    });
    addLog(state, sideNames[side] + '下达「' + definition.name + '」。', 'command',
      { side, action: 'command', ability, city, unitId: unit?.id });
    return { ok: true };
  }

  function buffValue(state, unit, kind) {
    let value = 0;
    for (const buff of state.buffs ?? []) {
      if (buff.kind !== kind || buff.until < state.date) continue;
      let node = unit;
      let hops = 0;
      while (node && hops < 4) {
        if (buff.target === node.id || buff.target === node.city) { value += 1; break; }
        node = node.parent ? state.units.find(item => item.id === node.parent) : null;
        hops += 1;
      }
    }
    return value;
  }

  function leaderLevel(state, leaderId) {
    const xp = state.leadersXp?.[leaderId]?.xp ?? 0;
    return Math.min(5, 1 + Math.floor(xp / 120));
  }

  function leaderTraits(state, leaderId) {
    if (!leaderId) return [];
    state.leaderTraits ??= {};
    if (!state.leaderTraits[leaderId]) {
      const first = leaderTraitPool[hash(leaderId + 'a') % leaderTraitPool.length];
      const second = leaderTraitPool[(hash(leaderId + 'b') % (leaderTraitPool.length - 1))];
      state.leaderTraits[leaderId] = [first.id, second.id === first.id ? leaderTraitPool[(hash(leaderId + 'c') % leaderTraitPool.length)].id : second.id];
    }
    return state.leaderTraits[leaderId].map(id => leaderTraitPool.find(item => item.id === id)).filter(Boolean);
  }

  function leaderBonus(state, unit) {
    let army = unit;
    let hops = 0;
    while (army?.parent && hops < 4) { army = state.units.find(item => item.id === army.parent); hops += 1; }
    const leaderId = army?.leader;
    if (!leaderId) return { attack: 1, defense: 1, speed: 1, supply: 1 };
    const level = leaderLevel(state, leaderId);
    const bonus = { attack: 1 + (level - 1) * 0.02, defense: 1 + (level - 1) * 0.02, speed: 1, supply: 1 };
    for (const trait of leaderTraits(state, leaderId)) {
      if (trait.attack) bonus.attack += trait.attack;
      if (trait.defense) bonus.defense += trait.defense;
      if (trait.speed) bonus.speed += trait.speed;
      if (trait.supply) bonus.supply += trait.supply;
    }
    return bonus;
  }

  function awardLeaderXp(state, units, amount) {
    const seen = new Set();
    for (const unit of units) {
      let army = unit;
      let hops = 0;
      while (army?.parent && hops < 4) { army = state.units.find(item => item.id === army.parent); hops += 1; }
      if (!army?.leader || seen.has(army.leader)) continue;
      seen.add(army.leader);
      state.leadersXp ??= {};
      state.leadersXp[army.leader] ??= { xp: 0 };
      state.leadersXp[army.leader].xp += amount;
    }
  }

  function intelStep(state) {
    for (const side of sides) {
      const intel = state.intel[side];
      intel.points = Math.min(200, intel.points + 0.3);
      intel.level = clampValue(intel.level - 0.05, 20, 100);
    }
  }

  function intelOperation(state, kind) {
    ensureSystems(state);
    const definition = intelOps[kind];
    if (!definition) return { ok: false, error: '无法识别的情报行动。' };
    const side = state.player;
    const other = side === 'ccp' ? 'roc' : 'ccp';
    const intel = state.intel[side];
    if (intel.points < definition.cost) return { ok: false, error: definition.name + '需要情报点 ' + definition.cost + '。' };
    if (intel.cooldowns?.[kind]) return { ok: false, error: definition.name + '还需 ' + intel.cooldowns[kind] + ' 天。' };
    intel.points -= definition.cost;
    intel.cooldowns ??= {};
    intel.cooldowns[kind] = definition.cooldown;
    if (kind === 'recon') {
      intel.level = Math.min(100, intel.level + 18);
      addLog(state, sideNames[side] + '完成侦察，对敌情报提升。', 'intel', { side, action: 'intel', kind });
    } else {
      state.stock[other].infantry = Math.max(0, state.stock[other].infantry * 0.88);
      state.stock[other].artillery = Math.max(0, state.stock[other].artillery * 0.88);
      state.airWar[other].planes = Math.max(0, state.airWar[other].planes * 0.9);
      addLog(state, sideNames[side] + '实施破坏，敌方装备与机队受损。', 'intel', { side, action: 'intel', kind });
    }
    return { ok: true };
  }

  function occupationStep(data, state) {
    state.occupation ??= {};
    const map = index(data);
    const tree = unitTree(state);
    for (const city of data.cities) {
      const owner = state.owners[city.id];
      const core = state.coreOwners?.[city.id] ?? owner;
      const record = state.occupation[city.id] ?? { resistance: 0, compliance: 0 };
      if (owner === core) {
        record.resistance = Math.max(0, record.resistance - 1.5);
        record.compliance = Math.min(100, record.compliance + 0.4);
      } else {
        const garrison = tree.combat.some(unit => unit.city === city.id && unit.side === owner && unit.strength > 0);
        record.resistance = clampValue(record.resistance + (garrison ? 0.1 : 0.45)
          + (Number(city.value) || 1) * 0.03, 0, 100);
        record.compliance = clampValue(record.compliance + 0.08, 0, 100);
        if (record.resistance >= 100) {
          capture(map, state, tree.combat, city.id, core, true, undefined, undefined);
          record.resistance = 20;
          record.compliance = Math.max(0, record.compliance - 30);
          addLog(state, city.name + '爆发反抗，转归' + sideNames[core] + '。', 'revolt', { city: city.id, side: core });
        }
      }
      state.occupation[city.id] = record;
    }
  }

  function setLaw(state, kind, value) {
    ensureSystems(state);
    if (!lawFactors[kind]) return { ok: false, error: '无法识别的法令。' };
    if (!lawFactors[kind][value]) return { ok: false, error: '无法识别的法令等级。' };
    const side = state.player;
    const laws = state.laws[side];
    if (laws[kind] === value) return { ok: true };
    const politics = state.political[side];
    if (politics.points < 35) return { ok: false, error: '更换法令需要政治点 35。' };
    politics.points -= 35;
    laws[kind] = value;
    addLog(state, sideNames[side] + '颁布' + lawNames[value] + '。', 'laws',
      { side, action: 'laws', kind, value });
    return { ok: true };
  }

  function stabilityStep(state) {
    for (const side of sides) {
      const support = num(state.warSupport?.[side], 60);
      const target = clampValue(45 + support * 0.35, 20, 90);
      const current = num(state.stability?.[side], 60);
      state.stability[side] = current + (target - current) * 0.01;
    }
  }

  function diplomacyAction(state, kind, actor = state.player === 'ccp' ? 'ussr' : 'usa') {
    ensureSystems(state);
    const definition = diplomacyOps[kind];
    if (!definition) return { ok: false, error: '无法识别的外交行动。' };
    if (!['usa', 'ussr'].includes(actor)) return { ok: false, error: '请选择美国或苏联。' };
    const side = state.player;
    const other = side === 'ccp' ? 'roc' : 'ccp';
    const diplomacy = state.diplomacy[side];
    if (diplomacy.cooldowns?.[kind]) return { ok: false, error: definition.name + '还需 ' + diplomacy.cooldowns[kind] + ' 天。' };
    const politics = state.political[side];
    if (politics.points < definition.cost) return { ok: false, error: definition.name + '需要政治点 ' + definition.cost + '。' };
    if (kind === 'ceasefire' && (num(state.warSupport[side], 60) >= 45 || num(state.warSupport[other], 60) >= 45)) {
      return { ok: false, error: '双方战争支持仍然过高，无法停战。' };
    }
    politics.points -= definition.cost;
    diplomacy.cooldowns ??= {};
    diplomacy.cooldowns[kind] = definition.cooldown;
    if (kind === 'aid') {
      if (actor === 'usa') {
        state.foreign.usa.support = Math.min(1, state.foreign.usa.support + 0.2);
        state.stock.roc.infantry += 220;
        state.stock.roc.artillery += 80;
        state.airWar.roc.planes += 12;
        state.economy.roc.treasury += 180;
      } else if (actor === 'ussr') {
        state.foreign.ussr.support = Math.min(1, state.foreign.ussr.support + 0.2);
        state.stock.ccp.infantry += 180;
        state.stock.ccp.artillery += 55;
        state.airWar.ccp.planes += 8;
      }
      addLog(state, (actor === 'usa' ? '美国' : actor === 'ussr' ? '苏联' : '日本')
        + '渠道提供装备援助。', 'diplomacy', { side, actor, action: 'diplomacy', kind });
      return { ok: true };
    }
    if (kind === 'embargo') {
      if (actor === 'usa') state.foreign.usa.embargo = Math.min(1, state.foreign.usa.embargo + 0.35);
      if (actor === 'ussr') state.foreign.ussr.pressure = Math.min(1, state.foreign.ussr.pressure + 0.25);
      state.interdiction[side] = (state.interdiction[side] ?? 0) + 0.12;
      addLog(state, '通过' + (actor === 'usa' ? '美国' : '苏联') + '渠道对敌方实施禁运，补给受到影响。',
        'diplomacy', { side, actor, action: 'diplomacy', kind });
      return { ok: true };
    }
    state.winner = null;
    state.endReason = 'ceasefire';
    state.ceasefire = true;
    addLog(state, '双方接受调停，战争以停战告终。', 'ceasefire', { side, action: 'diplomacy', kind });
    return { ok: true, ceasefire: true };
  }

  function weatherFor(state, date, region) {
    const month = Number(String(date).slice(5, 7));
    const roll = hash(region + date.slice(0, 7)) % 100;
    if (month <= 2 || month === 12) return roll < 45 ? 'snow' : roll < 60 ? 'storm' : 'clear';
    if (month >= 6 && month <= 8) return roll < 35 ? 'rain' : roll < 45 ? 'storm' : 'clear';
    return roll < 20 ? 'rain' : 'clear';
  }

  function weatherCombat(state, map, date, city) {
    if (map.cities.size <= 100) return { attack: 1, name: '晴' };
    const weather = weatherFor(state, date, city?.region ?? 'north');
    const table = { clear: 1, rain: 0.96, snow: 0.94, storm: 0.92 };
    const names = { clear: '晴', rain: '雨', snow: '雪', storm: '暴风雪' };
    return { attack: table[weather] ?? 1, name: names[weather] ?? '晴' };
  }

  function campaignOnly(data) {
    return (data.cities?.length ?? 0) > 100;
  }

  function seaLink(map, from, to) {
    return map.routeTypes?.[[from, to].sort().join('|')] === 'maritime';
  }

  function consumeTransports(state, side, units, factor = 1) {
    const navy = state.navy?.[side];
    if (!navy) return;
    let used = 0;
    for (const unit of units) {
      if (!unit.seaAssault) continue;
      used += Math.max(1, Math.ceil(unit.strength / 3000));
      delete unit.seaAssault;
    }
    navy.transports = Math.max(0, navy.transports - Math.round(used * factor));
  }

  function systemsStep(data, state) {
    foreignStep(data, state);
    navalStep(state);
    researchStep(data, state);
    productionStep(data, state);
    airStep(data, state);
    focusStep(data, state);
    commandStep(state);
    intelStep(state);
    stabilityStep(state);
    occupationStep(data, state);
    for (const plan of state.plans ?? []) {
      if (plan.status === 'active') plan.prep = (plan.prep ?? 0) + 1;
    }
  }

  function navalStep(state) {
    ensureSystems(state);
    for (const side of sides) {
      const enemy = side === 'ccp' ? 'roc' : 'ccp';
      let patrol = 0;
      let invasion = false;
      for (const zone of Object.values(state.seaZones)) {
        const assignment = zone?.[side];
        if (!assignment) continue;
        const strength = Math.max(0, num(assignment.strength, 0));
        const scale = clampValue(strength / 8, 0.25, 2);
        if (assignment.mission === 'patrol') patrol += strength;
        if (assignment.mission === 'raid') state.convoy[enemy] = Math.max(0.25, state.convoy[enemy] - 0.01 * scale);
        if (assignment.mission === 'escort') state.convoy[side] = Math.min(1.4, state.convoy[side] + 0.005 * scale);
        if (assignment.mission === 'invasion') {
          state.navy[side].invasion = Math.min(1, (state.navy[side].invasion ?? 0) + 0.01 * scale);
          invasion = true;
        }
      }
      state.navy[side].patrol = patrol;
      if (!invasion) state.navy[side].invasion = Math.max(0, (state.navy[side].invasion ?? 0) - 0.01);
    }
  }

  function systemsAI(data, state) {
    const map = index(data);
    const day = Math.floor(Date.parse(state.date) / dayMillis);
    const combat = unitTree(state).combat;
    for (const side of sides) {
      if (side === state.player) continue;
      const research = state.research[side];
      const order = ['infantry', 'artillery', 'logistics', 'medical', 'armor', 'air'];
      for (const key of order) {
        const line = techLines[key];
        const level = research.levels[key] ?? 0;
        if (level >= line.max) continue;
        if (research.points >= line.costs[level]) {
          research.points -= line.costs[level];
          research.levels[key] = level + 1;
          break;
        }
      }
      const focus = state.focus[side];
      if (!focus.current) {
        const available = (focusTrees[side] ?? []).filter(item =>
          !focus.done?.includes(item.id) && !(item.requires ?? []).some(id => !focus.done?.includes(id)));
        if (available.length) {
          focus.current = available[hash(side + state.date) % available.length].id;
          focus.progress = 0;
        }
      }
      const force = state.airWar[side];
      const enemy = side === 'ccp' ? 'roc' : 'ccp';
      const isolatedNeeds = combat.some(unit => unit.side === side && unit.strength > 0 && !unit.inactive
        && pocketFactor(map, state, unit.city, side) < 1
        && (unitAmmo(unit) < 45 || unitFuel(unit) < 35 || num(unit.food, 100) < 35));
      if (force.planes > 15 && isolatedNeeds) force.mission = 'airdrop';
      else if (state.air[side] < 35 && force.mission !== 'cas') force.mission = 'cas';
      else if (state.air[side] > 65 && force.mission !== 'superiority') force.mission = 'superiority';
      else if (state.air[side] >= 35 && state.air[side] <= 65 && force.mission !== 'interdiction') force.mission = 'interdiction';
      const line = state.aiFronts[side] ?? [];
      if (line.some(city => !map.cities.has(city) || state.owners[city] !== side)) state.aiFronts[side] = [];
      if (!state.aiFronts[side].length) {
        const capital = state.capitals?.[side];
        const border = [...map.cities.values()].filter(city => state.owners[city.id] === side
          && (map.neighbors.get(city.id) ?? []).some(id => state.owners[id] === enemy));
        if (border.length) {
          const regionGroups = new Map();
          for (const city of border) {
            const key = city.region || 'front';
            if (!regionGroups.has(key)) regionGroups.set(key, []);
            regionGroups.get(key).push(city);
          }
          state.aiFronts[side] = [...regionGroups.values()]
            .sort((a, b) => b.reduce((n, city) => n + (Number(city.value) || 1), 0)
              - a.reduce((n, city) => n + (Number(city.value) || 1), 0))
            .slice(0, 2).flatMap(group => group.sort((a, b) => (Number(b.value) || 1) - (Number(a.value) || 1))
              .slice(0, 3).map(city => city.id));
          if (capital && state.owners[capital] === side && !state.aiFronts[side].includes(capital)) {
            state.aiFronts[side].push(capital);
          }
        }
      }
      const activePlan = (state.plans ?? []).find(plan => plan.side === side && plan.aiGenerated && plan.status === 'active');
      // 机队优势且战线过强时优先空袭补给/枢纽；运输船充足时尝试选择海岸登陆目标。
      const coastalTargets = [...map.cities.values()].filter(city => state.owners[city.id] === enemy
        && [...map.neighbors.get(city.id) ?? []].some(id => map.routeTypes[[id, city.id].sort().join('|')] === 'maritime'));
      const invasionReady = (state.navy[side]?.transports ?? 0) >= 12
        && Object.values(state.seaZones ?? {}).some(zone => zone?.[side]?.mission === 'invasion');
      const invasionTarget = invasionReady ? coastalTargets
        .sort((a, b) => (Number(b.value) || 1) - (Number(a.value) || 1))[0] : null;
      if (!activePlan && state.aiFronts[side]?.length) {
        const units = state.units.filter(unit => !unit.parent && unit.side === side && unit.strength > 0
          && !unit.inactive && !unit.delegated).map(unit => unit.id);
        if (units.length) {
          const target = invasionTarget ?? [...map.cities.values()].filter(city => state.owners[city.id] === enemy)
            .sort((a, b) => (Number(b.value) || 1) - (Number(a.value) || 1))[0];
          const plan = { id: 'ai-' + side + '-' + state.date, name: '自动战线计划', side, units,
            target: target?.id ?? state.aiFronts[side][0], mode: 'advance', stance: 'push',
            line: state.aiFronts[side].slice(), autoLine: false, status: 'active', delegated: false,
            invasion: Boolean(invasionTarget),
            aiGenerated: true, created: state.date, updated: state.date, executed: state.date };
          state.plans.push(plan);
          addLog(state, sideNames[side] + '司令部建立自动战线，部署 ' + units.length + ' 支部队。', 'ai-plan',
            { side, action: 'ai-front', line: plan.line });
        }
      }
      if (force.planes > 35 && (day + hash(side + 'bomb')) % 5 === 0) {
        const airTargets = [...map.cities.values()].filter(city => state.owners[city.id] === enemy
          && Math.hypot((city.lon - (map.cities.get(state.capitals?.[side])?.lon ?? city.lon)),
            (city.lat - (map.cities.get(state.capitals?.[side])?.lat ?? city.lat)) * 1.25) <= 24
          && ((Number(city.value) || 0) >= 4 || railDegree(map, city.id) >= 2));
        const target = airTargets.sort((a, b) => {
          const frontA = (map.neighbors.get(a.id) ?? []).some(id => state.owners[id] === side) ? 1 : 0;
          const frontB = (map.neighbors.get(b.id) ?? []).some(id => state.owners[id] === side) ? 1 : 0;
          return frontB - frontA || (Number(b.value) || 0) - (Number(a.value) || 0);
        })[0];
        if (target && force.mission !== 'airdrop') {
          const damage = 0.01 + Math.min(0.025, (force.planes / 2500));
          state.economy[enemy].treasury = Math.max(0, state.economy[enemy].treasury - target.value * damage * 14);
          state.stock[enemy].infantry = Math.max(0, state.stock[enemy].infantry - target.value * damage * 0.25);
          if (state.airWar[enemy].mission === 'interdiction') state.supplyScarcity[enemy] = Math.max(0.3, state.supplyScarcity[enemy] - 0.002);
          addLog(state, sideNames[side] + '空军对' + target.name + '实施战略轰炸，敌方工业受损。', 'air-strike',
            { side, city: target.id, action: 'strategic-bombing' });
        }
      }
      const ownedSeas = Object.values(state.seaZones ?? {}).filter(zone => zone?.[side]?.strength > 0);
      const seaCoverage = ownedSeas.reduce((sum, zone) => sum + zone[side].strength, 0);
      const enemySea = ownedSeas.reduce((sum, zone) => sum + (zone?.[enemy]?.strength ?? 0), 0);
      const navalReady = seaCoverage / (seaCoverage + enemySea + 1) > 0.55
        && (state.navy[side]?.transports ?? 0) >= 12;
      if (invasionReady && navalReady && invasionTarget) {
        const reserve = state.units.filter(unit => !unit.parent && unit.side === side && unit.strength > 0
          && !unit.inactive && !unit.delegated).sort((a, b) => a.org - b.org);
        const landingForce = reserve[0];
        if (landingForce) {
          const tree = unitTree(state);
          const root = tree.byId.get(landingForce.id);
          let assigned = 0;
          for (const member of leaves(root, tree)) {
            if (member.strength <= 0 || member.order?.type === 'advance' && member.order.target === invasionTarget.id) continue;
            const route = plannedRoute({ map, state, routes: new Map() }, 'advance', member, invasionTarget.id);
            if (!route) continue;
            if (seaLink(map, member.city, invasionTarget.id)
              && state.navy[side].transports < Math.ceil(member.strength / 1500)) continue;
            assignOrder(map, state, member, 'advance', invasionTarget.id, true, root.id, route);
            member.seaAssault = true;
            assigned += 1;
          }
          if (assigned) {
            addLog(state, sideNames[side] + '海军为' + landingForce.name + '组织两栖登陆，目标' + invasionTarget.name + '。',
              'navy', { side, city: invasionTarget.id, unitId: landingForce.id, units: assigned, action: 'ai-invasion' });
          }
        }
      }
    }
  }

  function checkVictory(data, state) {
    if (state.ceasefire) { state.winner = null; state.endReason = 'ceasefire'; return; }
    const objective = data.cities.filter(city => state.goal === 'all' || !isTaiwan(city));
    if (!objective.length) return;
    const leader = state.owners[objective[0].id];
    if (sides.includes(leader) && objective.every(city => state.owners[city.id] === leader)) {
      state.winner = leader;
      state.endReason = 'unification';
      addLog(state, sideNames[leader] + '已控制' + (state.goal === 'all' ? '全部目标城市。' : '全部大陆城市。'),
        'victory', { side: leader });
      return;
    }
    ensurePolitics(state);
    // 战争支持度崩溃或首都失守后长期低迷 → 停战。
    for (const side of sides) {
      const other = side === 'ccp' ? 'roc' : 'ccp';
      const capital = state.capitals?.[side];
      const capitalLost = Boolean(capital) && state.owners[capital] !== side;
      const support = num(state.warSupport?.[side], 60);
      const owned = data.cities.filter(city => state.owners[city.id] === side).length;
      const share = owned / data.cities.length;
      const collapse = (capitalLost && support < 25) || support < 8
        || (data.cities.length > 40 && share < 0.1);
      if (!collapse) continue;
      state.winner = other;
      state.endReason = 'capitulation';
      addLog(state, sideNames[side] + '战争支持度崩溃，停止抵抗。', 'capitulation',
        { side, winner: other, support, share: Math.round(share * 100) / 100 });
      return;
    }
    if (state.date >= '1951-12-31') {
      const ccp = data.cities.filter(city => state.owners[city.id] === 'ccp').length;
      const roc = data.cities.length - ccp;
      state.winner = ccp === roc ? null : (ccp > roc ? 'ccp' : 'roc');
      state.endReason = 'timeout';
      addLog(state, '战争在 1951 年底暂告一段落，'
        + (state.winner ? sideNames[state.winner] + '控制城镇较多。' : '双方势均力敌。'),
        'timeout', { ccp, roc, winner: state.winner });
    }
  }

  function syncPlans(map, state) {
    for (const plan of state.plans ?? []) {
      if (plan.status !== 'active') continue;
      if (plan.stance === 'hold' || plan.stance === 'fallback') continue;
      if (state.owners[plan.target] !== plan.side) continue;
      plan.status = 'done';
      plan.updated = state.date;
      addLog(state, '作战计划《' + plan.name + '》已达成，' + (map.cities.get(plan.target)?.name ?? plan.target)
        + '由本方控制。', 'plan', { city: plan.target, side: plan.side, planId: plan.id, action: 'plan-done' });
    }
  }

  function step(data, state, days = 1) {
    const map = index(data);
    ensureLogistics(state);
    ensureSystems(state);
    const elapsed = Number.isFinite(Number(days)) ? Math.max(0, Math.floor(Number(days))) : 0;
    for (let day = 0; day < elapsed && !state.winner && !state.ceasefire; day += 1) {
      state.date = shiftDays(state.date, 1);
      let tree = unitTree(state);
      const count = state.units.length;
      applyHistory(data, map, state, tree);
      economyStep(data, map, state, tree.combat);
      if (state.units.length !== count) tree = unitTree(state);
      state.supplyReport = supplyStep(data, map, state, tree.combat);
      politicalStep(data, state);
      systemsStep(data, state);
      systemsAI(data, state);
      completeWorks(data, state);
      aiOrders(map, state, tree);
      aiGarrison(map, state, tree);
      delegatedPlans(data, map, state, tree);
      advanceOrders(map, state, tree);
      syncPlans(map, state);
      aggregate(map, state, tree);
      checkVictory(data, state);
    }
    return state;
  }

  function stats(data, state) {
    const result = { ccp: 0, roc: 0, ccpStrength: 0, rocStrength: 0 };
    for (const city of data.cities) {
      const side = state.owners[city.id];
      if (sides.includes(side)) result[side] += 1;
    }
    for (const unit of unitTree(state).combat) {
      if (!unit.inactive) result[unit.side + 'Strength'] += unit.strength;
    }
    return result;
  }

  function forecast(data, state, months = 3, deferred) {
    const projection = snapshot(state);
    const results = [];
    const due = deferred && shiftDays(state.date, Math.max(0, Math.floor(Number(deferred.afterDays) || 0)));
    let pending = Boolean(due);
    const count = Number.isFinite(Number(months)) ? Math.min(12, Math.max(0, Math.floor(Number(months)))) : 0;
    for (let month = 1; month <= count; month += 1) {
      const date = shiftMonths(state.date, month);
      const before = { ...projection.owners };
      const sequence = projection.eventSequence ?? projection.log.at(-1)?.seq ?? 0;
      if (pending && due <= date) {
        step(data, projection, Math.round((Date.parse(due) - Date.parse(projection.date)) / dayMillis));
        if (!projection.winner) {
          const result = order(data, projection, deferred.unitId, deferred.type, deferred.target);
          addLog(projection, result.ok ? '整补结束，已下达计划命令。' : '整补结束，计划命令未能执行。' + result.error,
            'operation', { phase: 'deferred', action: deferred.type, city: deferred.target,
              side: projection.player, ...(result.ok ? {} : { error: result.error }) });
        }
        pending = false;
      }
      const days = Math.round((Date.parse(date) - Date.parse(projection.date)) / dayMillis);
      step(data, projection, days);
      const changed = data.cities.filter(city => projection.owners[city.id] !== before[city.id]).length;
      const newLogs = projection.log.filter(entry => entry.seq > sequence);
      const highlights = newLogs.filter(entry => entry.previousSide || entry.type === 'victory').slice(-4);
      highlights.push(...newLogs.filter(entry => entry.phase === 'deferred'));
      const summary = { date, ...stats(data, projection), changed, ccpFood: projection.economy.ccp.food,
        rocFood: projection.economy.roc.food, highlights };
      if (projection.winner) summary.winner = projection.winner;
      results.push(summary);
    }
    return results;
  }

  function updatePlan(data, state, planId, patch = {}) {
    const plan = planById(state, planId);
    if (!plan) return { ok: false, error: '找不到该作战计划。' };
    if (plan.side !== state.player) return { ok: false, error: '只能修改本方计划。' };
    if (typeof patch.name === 'string' && patch.name.trim()) plan.name = patch.name.trim().slice(0, 40);
    if (patch.front !== undefined) {
      if (patch.front === null || patch.front === '') plan.front = null;
      else if (!map_has(data, patch.front)) return { ok: false, error: '请选择有效的集结城镇。' };
      else plan.front = patch.front;
    }
    if (patch.target !== undefined) {
      if (!map_has(data, patch.target)) return { ok: false, error: '请选择有效目标城镇。' };
      plan.target = patch.target;
    }
    if (patch.mode !== undefined) {
      if (!Object.hasOwn(planModes, patch.mode)) return { ok: false, error: '无法识别该作战方式。' };
      plan.mode = patch.mode;
    }
    if (patch.stance !== undefined) {
      if (!Object.hasOwn(planStances, patch.stance)) return { ok: false, error: '无法识别该作战决心。' };
      plan.stance = patch.stance;
    }
    if (patch.line !== undefined) {
      if (!Array.isArray(patch.line)) return { ok: false, error: '战线格式不正确。' };
      plan.line = patch.line.filter(id => map_has(data, id)).slice(0, 12);
      plan.autoLine = false;
    }
    if (patch.autoLine !== undefined) {
      plan.autoLine = Boolean(patch.autoLine);
      if (plan.autoLine) plan.line = [];
    }
    if (Array.isArray(patch.units)) {
      const tree = unitTree(state);
      const units = [];
      for (const unitId of patch.units) {
        let root = tree.byId.get(unitId);
        while (root?.parent) root = tree.byId.get(root.parent);
        if (!root || units.includes(root.id)) continue;
        if (!canCommand(state, root)) return { ok: false, error: '计划中只能编入当前可指挥的部队。' };
        units.push(root.id);
      }
      if (!units.length) return { ok: false, error: '请至少选择一支部队。' };
      plan.units = units;
    }
    plan.updated = state.date;
    return { ok: true, plan };
  }

  const api = {
    createGame, step, order, setSide, setGroup, setScope, setPolicy, setDelegated, setLeader, setEquipment,
    setHistoryMode, setHistoricalEvent,
    createPlan, updatePlan, previewPlan, executePlan, pausePlan, delegatePlan, removePlan,
    buildFort, setSupport, supplyReading, prepare, decide,
    createDesign, updateDesign, assignDesign, researchTech, setAirMission, setNavalMission,
    startFocus, setProduction, commandAbility, intelOperation, setLaw, diplomacyAction, foreignAction,
    previewOrder, previewOrders, forecast, snapshot, stats, activeUnits,
    metadata: { supportKinds, supportKeys, fortKinds, planModes, planStances, decisionKinds, supplyGoods,
      fortLevel, engineerSupport, unitSupport, supportFactor, power,
      techLines, airMissions, focusTrees, commandAbilities, designBattalions, designSupports,
      designDefaults, intelOps, diplomacyOps, lawNames, lawFactors,
      designStats: (state, side, design) => designStats(state, side, design),
      battlePeriod,
      unitDesign: (state, unit) => unitDesign(state, unit),
      unitDesignStats: (state, unit) => unitDesignStats(state, unit),
      airSupport: (state, side) => airSupport(state, side),
      leaderLevel: (state, leaderId) => leaderLevel(state, leaderId),
      leaderTraits: (state, leaderId) => leaderTraits(state, leaderId),
      resolvePlanLine: (data, state, plan) => resolveLine(index(data), state, plan) },
  };
  globalThis.CivilWarEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
















