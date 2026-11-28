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

  const api = { buildKoreanWarCivilData, buildWW2CivilData };
  globalThis.UnifiedTheaters = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
