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
  const targetOrders = ['advance', 'move', 'defend', 'siege', 'intercept'];
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
      cities, neighbors, events, anchors, routeTypes: data.routeTypes ?? {},
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
      ammo: 100, fuel: 100, medical: 100, morale: 70, veteran: 0, wounded: 0,
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
      policies: { recruit: 'normal', industry: 'normal', supply: 'normal' },
      historicalEvents: {},
      plans: [], forts: {}, works: [], logistics: null,
      supplyScarcity: {
        ccp: 1, roc: 0.82,
        ...(data.supply?.scarcity ?? {}), ...(chosenScenario?.supply ?? {}), ...(options.supply ?? {}),
      },
      air: { ccp: 16, roc: 54, ...(data.supply?.air ?? {}), ...(chosenScenario?.air ?? {}) },
      recon: { ccp: 34, roc: 46, ...(data.supply?.recon ?? {}), ...(chosenScenario?.recon ?? {}) },
      tally: { ccp: emptyTally(), roc: emptyTally() },
      log: [], eventSequence: 0, winner: null,
    };
    for (const seed of data.units ?? []) {
      if ((!seed.from || seed.from <= date) && (!seed.until || date < seed.until)) createArmy(state, map, seed);
    }
    for (const side of sides) state.economy[side] = startingEconomy(map, data, state, side);
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
    if (side !== state.player) return 1;
    const value = state.policies[key];
    if (typeof value === 'number') return Math.max(0.35, Math.min(2, value > 3 ? value / 100 : value));
    if (typeof value === 'boolean') return value ? levels.high : levels.low;
    return levels[value] ?? 1;
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

  function deploymentDays(map, type, unit, target, from = unit.city) {
    const city = map.cities.get(target);
    const terrain = city?.terrain ?? '';
    const rough = /mountain|plateau|岭|山|高原/.test(terrain);
    const routeType = map.routeTypes[[from, target].sort().join('|')];
    const maritime = routeType ? routeType === 'maritime' : isTaiwan(city) !== isTaiwan(map.cities.get(from));
    const distance = { advance: 5, siege: 12, intercept: 2 }[type] ?? 3;
    return Math.max(1, distance + profileFor(unit).days + (rough ? 2 : 0)
      + (maritime ? 3 : 0) + (unit.food < 40 ? 2 : 0));
  }

  function clearOrder(unit) {
    delete unit.order;
    delete unit.orderDays;
    delete unit.automatedOrder;
    delete unit.orderUnit;
    delete unit.orderPlan;
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
    if (automated) delete unit.orderUnit;
    else unit.orderUnit = orderUnit;
    const firstStop = (type === 'move' || type === 'defend')
      ? (route ?? friendlyRoute(map, state, unit.city, target, unit.side))?.[1]
      : target;
    unit.orderDays = type === 'hold' || !firstStop ? 0 : deploymentDays(map, type, unit, firstStop);
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
    if (hostileOrders.has(type)) {
      return map.neighbors.get(member.city)?.includes(destination) ? [member.city, destination] : null;
    }
    if (!routes.has(member.city)) routes.set(member.city, friendlyPaths(map, state, member.city, member.side));
    return pathTo(routes.get(member.city), destination);
  }

  function estimateDays(context, type, member, route) {
    const key = [type, member.profile ?? member.branch, member.food < 40, route[0], route.at(-1)].join('|');
    if (!context.estimates.has(key)) {
      let days = 0;
      for (let offset = 1; offset < route.length; offset += 1) {
        days += deploymentDays(context.map, offset === 1 ? type : 'move', member, route[offset], route[offset - 1]);
      }
      context.estimates.set(key, days);
    }
    return context.estimates.get(key);
  }

  function validateOrder(context, type, target) {
    const { state, map, unit, members } = context;
    if (state.winner) return { ok: false, error: '此战局已结束。' };
    if (!members.length) return { ok: false, error: '只能向当前可指挥的在役部队下令。' };
    if (!targetOrders.includes(type) && type !== 'hold') {
      return { ok: false, error: '无法识别此命令。' };
    }
    const destination = type === 'hold' ? unit.city : target ?? unit.city;
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
      const routeForMember = plannedRoute(context, type, member, destination);
      if (!routeForMember) continue;
      recipients.push({ member, route: routeForMember });
      const time = estimateDays(context, type, member, routeForMember);
      if (time > days) {
        days = time;
        route = routeForMember;
      }
    }
    if (!recipients.length) return {
      ok: false, error: hostileOrders.has(type) ? '目标须与出发城市相邻。' : '没有可用的友方通路。',
    };

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
    }
    refreshOrders(state, tree);
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
      const base = supportBase[unitBranch(unit)];
      if (!unit.support) unit.support = { ...base };
      else for (const key of supportKeys) unit.support[key] = num(unit.support[key], base[key]);
    }
    return state;
  }

  function prepare(data, state) {
    index(data);
    ensureLogistics(state);
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
        const weight = type === 'rail' ? 1 : type === 'maritime' ? 6 : 3;
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

  function unitSupplyNeed(unit) {
    const base = unit.strength / 1000;
    const active = hostileOrders.has(unit.order?.type) || unit.order?.type === 'move';
    const mobile = unitBranch(unit) === 'mobile';
    return {
      ammo: base * (active ? 1.25 : 0.45),
      fuel: base * (active ? 0.72 : 0.22) * (mobile ? 1.7 : 1),
      medical: base * 0.18 + 0.05,
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
        coverage *= pocketFactor(map, state, unit.city, side);
        if (state.owners[unit.city] !== side) coverage *= 0.5;
        const need = unitSupplyNeed(unit);
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
        const one = unitSupplyNeed(unit);
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
        coverage *= pocketFactor(map, state, unit.city, side);
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
      if (mobilized || unit.food < 40 || !accessible || unit.strength === 0) continue;

      // 伤员回补：在己方城镇且粮秣尚可时逐步归队。
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
      const additions = Math.floor(Math.min(
        unit.maxStrength - unit.strength, economy.manpower,
        Math.max(1, unit.maxStrength * 0.008 * recruit), economy.arms * 4, economy.treasury * 4,
      ));
      unit.strength += additions;
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

  function planUnits(data, state, plan, distances) {
    const map = index(data);
    const tree = unitTree(state);
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
      if (state.owners[plan.target] === plan.side) {
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

  function aiOrders(map, state, tree) {
    const day = Math.floor(Date.parse(state.date) / dayMillis);
    const garrisons = groupByCity(tree.combat);
    for (const army of tree.armies) {
      if (army.strength <= 0 || army.inactive || (day + hash(army.id)) % 7 !== 0) continue;
      const otherTheater = state.scope === 'theater' && army.area !== state.area;
      const otherGroup = state.group && army.group !== state.group;
      const outsideControl = army.side !== state.player || otherTheater || otherGroup;
      if (!outsideControl && !army.delegated) continue;
      const objective = army.delegated && army.delegateTarget;
      const distances = objective ? distancesTo(map, objective) : null;
      const armyGroups = groupByCity(leaves(army, tree).filter(unit => {
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
        const adjacent = map.neighbors.get(city) ?? [];
        const progress = distance === undefined ? adjacent : adjacent.filter(neighbor => distances.get(neighbor) < distance);
        const targets = progress.filter(neighbor => state.owners[neighbor] !== army.side);
        let target;
        let best = -Infinity;
        for (const neighbor of targets) {
          const node = map.cities.get(neighbor);
          const defense = (garrisons.get(neighbor) ?? []).reduce((sum, member) => sum + member.strength, 0);
          const terrain = /mountain|plateau|岭|山|高原/.test(node?.terrain ?? '') ? 1.22 : 1;
          const probability = availableStrength / Math.max(defense * terrain, availableStrength * 0.18);
          const average = available.reduce((sum, member) => sum + unitAmmo(member) + unitFuel(member), 0)
            / (available.length * 2);
          // 补给不足时略微提高出击门槛，实际战力影响仍由弹药与士气在战斗结算中体现。
          const readiness = clampValue(0.85 + average / 200 * 0.17, 0.85, 1.02);
          const caution = (state.log ?? []).some(entry => entry.type === 'battle-end' && entry.city === neighbor
            && entry.side === army.side && entry.result === 'repelled'
            && entry.date >= shiftDays(state.date, -12)) ? 1.18 : 1;
          const required = (isTaiwan(node) ? 1.7 : 0.76) * caution / readiness;
          const local = otherTheater && army.side === state.player && node?.region === army.area ? 0.35 : 0;
          const score = probability + (Number(node?.value) || 1) * 0.055
            + local + (hash(neighbor + state.date + army.id) % 20) / 100;
          if (probability >= required && score > best) {
            target = neighbor;
            best = score;
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
      clearOrder(unit);
    }
    const name = map.cities.get(city)?.name ?? city;
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

  function power(units, defend) {
    return units.reduce((sum, unit) => {
      const preparedness = defend && unit.order?.type === 'defend' && unit.order.target === unit.city ? 1.2 : 1;
      const profile = profileFor(unit);
      const multiplier = defend ? profile.defense : profile.attack;
      const readiness = (0.55 + unit.food * 0.0045) * (0.62 + unit.equipment * 0.0038);
      const ammo = 1 + (unitAmmo(unit) - 100) * 0.0025;
      const morale = 1 + (unitMorale(unit) - 70) * 0.003;
      const veteran = 1 + unitVeteran(unit) * 0.02;
      return sum + unit.strength * readiness * preparedness * multiplier
        * ammo * morale * veteran * supportFactor(unit, defend);
    }, 0);
  }

  function supportLosses(unit) {
    return clampValue(1 - (unitMedical(unit) - 100) * 0.0015, 0.82, 1.22);
  }

  function applyLosses(units, fraction) {
    for (const unit of units) {
      const share = fraction * supportLosses(unit);
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
      city, side: attackingSide, defendingSide, result: won ? 'capture' : 'repelled',
      attackerStrength: attackerStart, defenderStrength: defenderStart,
      attackerCasualties, defenderCasualties, wounded, prisoners, routed, captured,
      moraleAttack, moraleDefend, experience: won ? attackingSide : defendingSide,
    };
  }

  function advanceOrders(map, state, tree) {
    const { combat } = tree;
    const attacks = new Map();
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
      applyLosses([unit], 0.14 * screenStrength / (screenStrength + unit.strength));
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
      if ((type === 'advance' || type === 'siege') && state.owners[target] !== unit.side) {
        if (!map.neighbors.get(unit.city)?.includes(target)) {
          finish(unit, target, '已停止对' + targetName + '的行动，出发城市已变更。', 'cleared', '出发城市已变更');
          clearOrder(unit);
          continue;
        }
        if (!attacks.has(target)) attacks.set(target, []);
        attacks.get(target).push(unit);
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
      if (!route || unit.strength === 0 || (unit.city === target && type !== 'defend')) {
        clearOrder(unit);
      } else if (unit.city === target) {
        unit.orderDays = 0;
      } else {
        unit.orderDays = deploymentDays(map, 'move', unit, route[2]) + (delayed ? 1 : 0);
      }
    }

    for (const [target, planned] of attacks) {
      const attackers = planned.filter(unit => unit.order?.target === target && unit.strength > 0
        && state.owners[target] !== unit.side);
      if (!attackers.length) continue;
      const city = map.cities.get(target);
      const side = attackers[0].side;
      const defenders = combat.filter(unit => unit.city === target && unit.side !== side && unit.strength > 0);
      const defendingSide = state.owners[target];
      addLog(state, sideNames[side] + '开始对' + city.name + '作战。', 'battle-start',
        { city: target, side, defendingSide });
      const terrain = /mountain|plateau|岭|山|高原/.test(city.terrain ?? '') ? 1.22 : 1;
      const recon = clampValue(1 - num(state.recon?.[side], 0) / 220, 0.55, 1);
      const terrainFactor = 1 + (terrain - 1) * recon;
      const variation = 0.92 + (hash(state.date + target + side) % 17) * 0.01;
      const fort = unitFortDefense({ city: target }, state);
      const obstacle = unitFortAttack({ city: target }, state);
      const air = clampValue((num(state.air?.[side], 0) - num(state.air?.[defendingSide], 0) * 0.45) / 520, -0.06, 0.16);
      const attackPower = power(attackers, false) * variation * (1 - obstacle) * (1 + air);
      const attackStrength = attackers.reduce((sum, unit) => sum + unit.strength, 0);
      const siegeStrength = attackers.reduce((sum, unit) => sum + (unit.order.type === 'siege'
        ? unit.strength * profileFor(unit).siege * (1 + unitSupport(unit).artillery / 400) : 0), 0);
      const siegeEffect = 1 - 0.28 * siegeStrength / attackStrength;
      const defensePower = power(defenders, true) * terrainFactor * (isTaiwan(city) ? 1.55 : 1) * (1 + fort) * siegeEffect;
      const won = attackPower >= defensePower * 0.98;
      for (const unit of attackers) {
        const action = unit.order.type === 'siege' ? '围城' : '进攻';
        finish(unit, target, '对' + city.name + '的' + action + (won ? '完成。' : '受阻。'));
      }
      const attackerStart = attackStrength;
      const defenderStart = defenders.reduce((sum, unit) => sum + unit.strength, 0);
      let routed = 0;

      if (won) {
        const directedByPlayer = attackers.some(unit => unit.automatedOrder === false);
        if (defenders.length) {
          applyLosses(attackers, Math.max(0.018, Math.min(0.14, defensePower / attackPower * 0.12)));
          applyLosses(defenders, 0.24);
        }
        const defenderAfterLosses = defenders.reduce((sum, unit) => sum + unit.strength, 0);
        capture(map, state, combat, target, side, false, undefined, interceptArrival);
        routed = Math.max(0, defenderAfterLosses - defenders.reduce((sum, unit) => sum + unit.strength, 0));
        if (directedByPlayer) recordIntervention(state, target, side);
        for (const unit of attackers) {
          if (unit.strength > 0) {
            unit.city = target;
            unit.area = city.region ?? unit.area;
          }
          clearOrder(unit);
        }
      } else {
        const directedByPlayer = defenders.some(unit => unit.automatedOrder === false
          && unit.order?.type === 'defend' && unit.order.target === target);
        if (directedByPlayer) recordIntervention(state, target, state.owners[target]);
        applyLosses(attackers, 0.12);
        applyLosses(defenders, Math.max(0.014, attackPower / defensePower * 0.09));
        for (const unit of attackers) clearOrder(unit);
      }
      const attackerCasualties = Math.max(0, attackerStart - attackers.reduce((sum, unit) => sum + unit.strength, 0));
      const defenderCasualties = Math.max(0, defenderStart - routed - defenders.reduce((sum, unit) => sum + unit.strength, 0));
      const record = battleOutcome(state, target, side, defendingSide, attackers, defenders, won, {
        attackerStart, defenderStart, attackerCasualties, defenderCasualties, routed,
      });
      addLog(state, city.name + '战斗结束，' + (won ? sideNames[side] + '夺取该城。' : sideNames[defendingSide] + '守住该城。'),
        'battle-end', { city: target, side, defendingSide, result: won ? 'capture' : 'repelled',
          nearbyUnits: nearbyForces(combat, target, map.neighbors.get(target) ?? []), aftermath: record, fort, obstacle });
    }

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

  function checkVictory(data, state) {
    const objective = data.cities.filter(city => state.goal === 'all' || !isTaiwan(city));
    if (!objective.length) return;
    const leader = state.owners[objective[0].id];
    if (sides.includes(leader) && objective.every(city => state.owners[city.id] === leader)) {
      state.winner = leader;
      addLog(state, sideNames[leader] + '已控制' + (state.goal === 'all' ? '全部目标城市。' : '全部大陆城市。'),
        'victory', { side: leader });
    }
  }

  function syncPlans(map, state) {
    for (const plan of state.plans ?? []) {
      if (plan.status !== 'active') continue;
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
    const elapsed = Number.isFinite(Number(days)) ? Math.max(0, Math.floor(Number(days))) : 0;
    for (let day = 0; day < elapsed && !state.winner; day += 1) {
      state.date = shiftDays(state.date, 1);
      let tree = unitTree(state);
      const count = state.units.length;
      applyHistory(data, map, state, tree);
      economyStep(data, map, state, tree.combat);
      if (state.units.length !== count) tree = unitTree(state);
      state.supplyReport = supplyStep(data, map, state, tree.combat);
      completeWorks(data, state);      aiOrders(map, state, tree);
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
    buildFort, setSupport, supplyReading, prepare,
    previewOrder, previewOrders, forecast, snapshot, stats, activeUnits,
    metadata: { supportKinds, supportKeys, fortKinds, planModes, supplyGoods, fortLevel, engineerSupport,
      unitSupport, supportFactor },
  };
  globalThis.CivilWarEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
