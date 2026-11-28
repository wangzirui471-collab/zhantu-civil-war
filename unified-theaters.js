(() => {
  'use strict';

  const linkKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  function buildKoreanWarCivilData(Korea, World) {
    if (!Korea) return null;
    const regions = {
      north: '北朝鲜战区',
      central: '三八线战区',
      south: '洛东江战区',
    };
    const cities = Korea.cities.map((c) => ({
      id: c.id,
      name: c.name,
      lon: c.lon,
      lat: c.lat,
      region: c.lat >= 39.0 ? 'north' : c.lat >= 37.2 ? 'central' : 'south',
      terrain: c.terrain || 'plain',
      value: c.value || 5,
      port: c.terrain === 'port',
    }));

    const links = [];
    const routeTypes = {};
    for (const [a, b, kind] of (Korea.routes || [])) {
      links.push([a, b]);
      routeTypes[linkKey(a, b)] = kind === 'sea' ? 'maritime' : kind === 'rail' ? 'rail' : 'land';
    }

    const northSet = new Set(['dandong', 'sinyiju', 'unsan', 'chongchon', 'chosin', 'hungnam', 'pyongyang', 'wonsan', 'shangganling', 'cheorwon', 'kaesong']);
    const pusanSet = new Set(['taegu', 'pusan']);
    const unPushSet = new Set(['seoul', 'incheon', 'suwon', 'chuncheon', 'taejon', 'taegu', 'pusan', 'kaesong', 'pyongyang', 'wonsan', 'hungnam']);

    const scenarios = (Korea.scenarios || []).map((sc) => {
      const overrides = {};
      for (const c of cities) {
        if (sc.id === 'kw-1950-06') overrides[c.id] = northSet.has(c.id) ? 'ccp' : 'roc';
        else if (sc.id === 'kw-1950-09') overrides[c.id] = (pusanSet.has(c.id) || c.id === 'incheon') ? 'roc' : 'ccp';
        else if (sc.id === 'kw-1950-10' || sc.id === 'kw-1950-11') overrides[c.id] = unPushSet.has(c.id) ? 'roc' : 'ccp';
        else overrides[c.id] = northSet.has(c.id) ? 'ccp' : 'roc';
      }
      overrides.dandong = 'ccp';
      overrides.pusan = 'roc';
      return {
        id: sc.id,
        title: sc.title,
        date: sc.date,
        focus: sc.focus || 'seoul',
        area: 'central',
        summary: sc.summary,
        overrides,
      };
    });

    const citySet = new Set(cities.map((c) => c.id));
    const units = [];
    const leaders = [];
    const groups = [];
    for (const f of Object.values(Korea.factions || {})) {
      if (f.id === 'ussr') continue;
      const side = f.side === 'dprk_coalition' ? 'ccp' : 'roc';
      groups.push({ id: `kw-${f.id}`, name: f.name, side, region: side === 'ccp' ? 'north' : 'south', summary: f.summary });
      for (const corp of (f.corps || [])) {
        const lid = `kw-ldr-${corp.id}`;
        leaders.push({ id: lid, name: corp.commander, side, title: corp.role || '军长' });
        const spawn = citySet.has(corp.city) ? corp.city : (side === 'ccp' ? 'sinyiju' : 'pusan');
        units.push({
          id: corp.id,
          name: corp.name,
          side,
          city: spawn,
          strength: corp.strength || 35000,
          equipment: f.id === 'usa' ? 88 : f.id === 'pva' ? 74 : 78,
          from: '1950-06-01',
          until: '1953-12-31',
          group: `kw-${f.id}`,
          leader: lid,
          area: side === 'ccp' ? 'north' : 'south',
          nationModel: f.id === 'pva' ? 'soldier_china_kw' : f.id === 'kpa' ? 'soldier_ussr' : f.id === 'commonwealth' ? 'soldier_uk' : 'soldier_usa',
          tankModel: side === 'ccp' ? 't34' : 'm26',
          support: {
            infantry: 3,
            artillery: f.id === 'usa' || f.id === 'pva' ? 3 : 2,
            armor: f.id === 'usa' || f.id === 'kpa' ? 3 : f.id === 'commonwealth' ? 2 : 1,
            engineer: 1,
            recon: 1,
          },
        });
      }
    }

    const land = World?.koreaLandPolys || [
      [
        [122.0, 41.8], [131.5, 41.8], [130.7, 42.3], [130.35, 41.75], [129.68, 41.15],
        [128.95, 40.38], [127.65, 39.84], [127.46, 39.15], [128.42, 38.48], [129.38, 37.12],
        [129.55, 36.02], [129.12, 35.12], [128.18, 34.86], [126.55, 34.42], [126.18, 34.78],
        [126.62, 36.18], [126.18, 36.68], [126.64, 37.45], [125.72, 37.88], [124.85, 38.28],
        [125.44, 39.04], [124.65, 39.84], [123.62, 39.82], [122.0, 39.25],
      ],
      [[126.16, 33.30], [126.52, 33.54], [126.94, 33.46], [126.82, 33.24], [126.35, 33.20]],
      [[129.20, 34.12], [129.42, 34.62], [129.48, 34.58], [129.30, 34.08]],
    ];

    return {
      theaterMode: 'korea',
      theaterTitle: '抗美援朝 · 朝鲜战争（1950–1953）',
      defaultView: { lon: 127.1, lat: 37.8, zoom: 78 },
      regions,
      sideMeta: {
        ccp: { name: '中国人民志愿军 / 中朝联军', short: '中朝联军', flag: '★' },
        roc: { name: '美军 / 联合国军', short: '联合国军', flag: '★' },
      },
      cities,
      links,
      routeTypes,
      battleLayers: [],
      historyCheckpoints: [],
      leaders,
      units,
      scenarios,
      events: [],
      anchors: [],
      sources: [],
      groups,
      capitals: { ccp: 'pyongyang', roc: 'seoul' },
      land,
      notes: '抗美援朝统一高精战区模式（与国共内战同源引擎与同级地图精细度）',
    };
  }

  function buildWW2CivilData(WW2, World) {
    if (!WW2) return null;
    const regions = {
      europe: '西欧与地中海',
      east: '苏德东线战场',
      china: '中国抗日战场',
      pacific: '太平洋与东南亚',
      africa: '非洲与北非沙漠',
      america: '北美与大西洋',
    };
    const cities = WW2.cities.map((c) => ({
      id: c.id,
      name: c.name,
      lon: c.lon,
      lat: c.lat,
      region: c.theater || 'europe',
      terrain: c.terrain || 'plain',
      value: Math.max(2, Math.round((c.vp || 10) / 4)),
      port: Boolean(c.port),
    }));

    const links = [];
    const routeTypes = {};
    for (const [a, b, kind] of (WW2.routes || [])) {
      links.push([a, b]);
      routeTypes[linkKey(a, b)] = kind === 'sea' ? 'maritime' : kind === 'rail' ? 'rail' : 'land';
    }

    const nationToSide = (nation) => (WW2.factions[nation]?.bloc === 'axis' ? 'roc' : 'ccp');
    const tankByNation = { germany: 'tiger', ussr: 't34', usa: 'sherman', uk: 'churchill', france: 'charb1', japan: 'chiha', china: 'sherman' };
    const soldierByNation = { usa: 'soldier_usa', ussr: 'soldier_ussr', uk: 'soldier_uk', france: 'soldier_france', japan: 'soldier_japan', germany: 'soldier_germany', china: 'soldier_china_ww2' };

    const scenarios = (WW2.scenarios || []).map((sc) => {
      const overrides = {};
      for (const c of WW2.cities) {
        const ownerNation = sc.owners?.[c.id] || c.owner || 'usa';
        overrides[c.id] = nationToSide(ownerNation);
      }
      const focusCity = WW2.cities.find((c) => c.theater === sc.focus) || WW2.cities[0];
      return {
        id: sc.id,
        title: sc.title,
        date: sc.date,
        focus: focusCity?.id || 'berlin',
        area: sc.focus === 'global' ? 'europe' : (sc.focus || 'europe'),
        summary: sc.summary,
        overrides,
        ww2Theater: sc.focus || 'europe',
      };
    });

    const units = [];
    const leaders = [];
    const groups = [];
    const cityMap = new Map(WW2.cities.map((c) => [c.id, c]));
    for (const f of Object.values(WW2.factions || {})) {
      const side = nationToSide(f.id);
      groups.push({ id: `ww2-${f.id}`, name: f.name, side, region: 'europe', summary: f.doctrine || f.name });
      for (const c of (f.corps || [])) {
        const lid = `ww2-ldr-${c.id}`;
        leaders.push({ id: lid, name: c.commander, side, title: '集团军司令' });
        const cityObj = cityMap.get(c.city);
        units.push({
          id: c.id,
          name: `${f.short}·${c.name}`,
          side,
          city: c.city,
          strength: Math.min(180000, Math.round((c.strength || 120000) * 0.45)),
          equipment: f.id === 'germany' || f.id === 'usa' ? 92 : f.id === 'ussr' || f.id === 'uk' ? 85 : 74,
          from: '1937-01-01',
          until: '1946-12-31',
          group: `ww2-${f.id}`,
          leader: lid,
          area: c.theater || cityObj?.theater || 'europe',
          nationModel: soldierByNation[f.id] || 'soldier_usa',
          tankModel: tankByNation[f.id] || 'sherman',
          support: {
            infantry: 3,
            artillery: Math.min(4, Math.max(1, Math.round((c.artillery || 200) / 150))),
            armor: Math.min(4, Math.max(1, Math.round((c.tanks || 150) / 260))),
            engineer: 1,
            recon: 1,
          },
        });
      }
    }

    const land = (World?.continents || []).map((c) => c.points);
    return {
      theaterMode: 'ww2',
      theaterTitle: '第二次世界大战（1937–1945）',
      defaultView: { lon: 14, lat: 48, zoom: 22 },
      regions,
      sideMeta: {
        ccp: { name: '反法西斯同盟国（美/苏/英/法/中）', short: '同盟国', flag: '★' },
        roc: { name: '法西斯轴心国（德国/日本）', short: '轴心国', flag: '✠' },
      },
      cities,
      links,
      routeTypes,
      battleLayers: [],
      historyCheckpoints: [],
      leaders,
      units,
      scenarios,
      events: [],
      anchors: [],
      sources: [],
      groups,
      capitals: { ccp: 'moscow', roc: 'berlin' },
      land,
      notes: '二战全球统一高精战区模式（与国共内战同源引擎与同级地图精细度）',
    };
  }

  // ── 🌍 无缝全球大沙盘（中国 + 朝鲜 + 日本 + 苏联 + 欧洲 + 北非 + 太平洋 + 美国，支持从0到100无尽征战！）──
  function buildGrandWorldData(WW2, Korea, World) {
    const base = buildWW2CivilData(WW2, World);
    if (!base) return null;
    const existing = new Set(base.cities.map((c) => c.id));
    // 融入朝鲜半岛核心重镇并打通中-朝-日-太平洋海陆航线
    const extraKorea = [
      { id: 'pyongyang', name: '平壤', lon: 125.76, lat: 39.03, region: 'china', terrain: 'urban', value: 6, port: false },
      { id: 'pusan', name: '釜山港', lon: 129.07, lat: 35.18, region: 'pacific', terrain: 'port', value: 6, port: true },
      { id: 'incheon', name: '仁川港', lon: 126.70, lat: 37.45, region: 'pacific', terrain: 'port', value: 5, port: true },
    ];
    for (const c of extraKorea) {
      if (!existing.has(c.id)) { base.cities.push(c); existing.add(c.id); }
    }
    const extraLinks = [
      ['shenyang', 'pyongyang', 'rail'],
      ['pyongyang', 'seoul', 'rail'],
      ['seoul', 'incheon', 'rail'],
      ['seoul', 'pusan', 'rail'],
      ['pusan', 'hiroshima', 'maritime'],
      ['shanghai', 'okinawa', 'maritime'],
      ['shenyang', 'vladivostok', 'rail'],
    ];
    for (const [a, b, kind] of extraLinks) {
      if (existing.has(a) && existing.has(b)) {
        base.links.push([a, b]);
        base.routeTypes[linkKey(a, b)] = kind;
      }
    }

    const allCcp = Object.fromEntries(base.cities.map((c) => [c.id, 'ccp']));
    const linbiaoOverrides = { ...allCcp };
    for (const id of ['tokyo', 'hiroshima', 'osaka', 'okinawa', 'iwo_jima', 'guam', 'midway', 'pearl_harbor', 'san_francisco', 'washington', 'new_york', 'pusan', 'seoul', 'incheon']) {
      if (existing.has(id)) linbiaoOverrides[id] = 'roc';
    }
    const unthinkableOverrides = Object.fromEntries(base.cities.map((c) => {
      const isEastBloc = ['moscow', 'leningrad', 'stalingrad', 'kiev', 'minsk', 'warsaw', 'berlin', 'vladivostok', 'shenyang', 'yanan', 'pyongyang'].includes(c.id);
      return [c.id, isEastBloc ? 'ccp' : 'roc'];
    }));

    const grandScenarios = [
      {
        id: 'grand-1936',
        title: '🌍 1936 全球大沙盒（从 0 玩到 100 · 自由发展）',
        date: '1936-01-01',
        focus: 'nanjing',
        area: 'china',
        ww2Theater: 'china',
        summary: '1936 年战前大沙盒开局！可自由选择任意大国从零种田、扩军工、点国策、造航母坦克，想何时向谁宣战完全由你掌控。',
        overrides: base.scenarios[0]?.overrides || allCcp,
      },
      {
        id: 'grand-1949-linbiao',
        title: '🇨🇳➡️🇯🇵 1949 林彪统一中国后 · 渡海东征日本',
        date: '1949-10-01',
        focus: 'shanghai',
        area: 'china',
        ww2Theater: 'pacific',
        summary: '解放军统一中国大陆后不再结束！林彪四野主力与华东渡海舰队直指冲绳、九州与东京，向太平洋展开跨国大决战！',
        overrides: linbiaoOverrides,
      },
      {
        id: 'grand-1945-unthinkable',
        title: '🇺🇸⚔️☭ 1945 不可思议行动（美苏冷战全面热战）',
        date: '1945-07-01',
        focus: 'berlin',
        area: 'europe',
        ww2Theater: 'europe',
        summary: '二战刚落幕，美英联军与苏联红军在柏林易北河与远东爆发第三次世界大战！朱可夫装甲洪流正面硬刚巴顿与艾森豪威尔！',
        overrides: unthinkableOverrides,
      },
      {
        id: 'grand-1950-asia',
        title: '🌏 1950 东亚全局博弈（中/朝/苏/美/日同图决战）',
        date: '1950-06-25',
        focus: 'seoul',
        area: 'pacific',
        ww2Theater: 'pacific',
        summary: '中国大陆、朝鲜半岛、日本列岛与美军太平洋基地同图实时推演，既可抗美援朝，也可顺势跨海进攻日本或北上西进！',
        overrides: linbiaoOverrides,
      },
    ];

    base.theaterMode = 'ww2';
    base.theaterTitle = '🌍 全球无缝大沙盒（从 0 到 100 · 无限自由征战）';
    base.scenarios = [...grandScenarios, ...base.scenarios];
    return base;
  }

  const api = { buildKoreanWarCivilData, buildWW2CivilData, buildGrandWorldData };
  globalThis.UnifiedTheaters = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
