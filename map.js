(() => {
  'use strict';

  const sideColors = { ccp: '#a54f40', roc: '#406e82' };
  const sideNames = { ccp: '共产党', roc: '国民党' };
  const profileLabels = { infantry: '步', artillery: '炮', mobile: '机', mixed: '混' };
  const regionNames = { northeast: '东北', north: '华北', east: '华东', central: '中原',
    south: '华南', southwest: '西南', northwest: '西北', taiwan: '台湾' };
  const orderStyles = {
    advance: { label: '进攻', color: '#8d3027', dash: [] },
    move: { label: '行军', color: '#155753', dash: [7, 4] },
    defend: { label: '守阵地', color: '#234e76', dash: [4, 3] },
    entrench: { label: '挖战壕', color: '#8a6d2f', dash: [3, 3] },
    rest: { label: '城内休整', color: '#3b734c', dash: [] },
    siege: { label: '围城', color: '#7d3a6b', dash: [5, 3] },
    intercept: { label: '围点打援', color: '#78395d', dash: [2, 3] },
    support: { label: '支援牵制', color: '#c47b2b', dash: [4, 4] },
    bombard: { label: '轰炸', color: '#d7a347', dash: [2, 5] },
    hold: { label: '待命', color: '#595843', dash: [] },
  };
  const orderStatus = {
    advance: '进攻中', move: '行军中', defend: '守阵地', entrench: '挖战壕',
    rest: '休整中', siege: '围城中', intercept: '打援中', support: '支援牵制', hold: '待命',
  };
  const nationalZoom = 17;
  const detailZoom = 76;
  const terrainStops = [
    [0, [173, 182, 141]], [150, [189, 188, 141]], [550, [187, 169, 124]],
    [1400, [181, 149, 108]], [2600, [163, 125, 98]], [4300, [185, 158, 136]], [6200, [229, 224, 206]],
  ];
  const mapNames = new Set(['shenyang', 'harbin', 'beiping', 'nanjing', 'shanghai', 'wuhan', 'chongqing', 'guangzhou', 'taipei',
    'jinzhou', 'tashan', 'changchun', 'siping', 'xuzhou', 'zaozhuang', 'nianzhuang', 'tianjin', 'zhangjiakou', 'chen' ,
    'chengdu', 'lanzhou', 'dihua', 'lhasa', 'haikou', 'shuangduiji']);
  const round = new Intl.NumberFormat('zh-CN');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const linkKey = (a, b) => a < b ? a + '|' + b : b + '|' + a;

  // 城市节点仅供近似推算显示，不能当作历史控制边界。
  function territoryNodes(data, state, factions = false) {
    const groups = new Map();
    if (factions) for (const unit of state.units || []) {
      if (unit.parent || unit.inactive || !(unit.strength > 0) || !unit.group
        || unit.side !== state.owners?.[unit.city]) continue;
      const old = groups.get(unit.city);
      if (!old || unit.strength > old.strength) groups.set(unit.city, unit);
    }
    return (data.cities || []).filter(city => ['ccp', 'roc'].includes(state.owners?.[city.id]))
      .map(city => ({ id: city.id, lon: city.lon, lat: city.lat, owner: state.owners[city.id],
        group: groups.get(city.id)?.group || null }));
  }

  function nearestTerritory(lon, lat, nodes, maximum = 3.5) {
    let nearest = null, best = maximum * maximum;
    for (const node of nodes) {
      let dLon = Math.abs(lon - node.lon);
      if (dLon > 180) dLon = 360 - dLon;
      const dx = dLon * .76, dy = lat - node.lat;
      const distance = dx * dx + dy * dy;
      if (distance < best) { best = distance; nearest = node; }
    }
    return nearest;
  }

  function prepareGrid(grid, index) {
    const binary = atob(grid.samples);
    const meters = new Int16Array(grid.width * grid.height);
    for (let i = 0; i < meters.length; i++) {
      meters[i] = binary.charCodeAt(i * 2) | binary.charCodeAt(i * 2 + 1) << 8;
    }
    const relief = document.createElement('canvas');
    relief.width = grid.width;
    relief.height = grid.height;
    const brush = relief.getContext('2d');
    const image = brush.createImageData(grid.width, grid.height);
    const at = (row, col) => meters[row * grid.width + col];
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const height = at(row, col);
        if (height < -1) continue;
        const neighborX = at(row, Math.min(grid.width - 1, col + 1)) - at(row, Math.max(grid.width - 1, col - 1) === col ? col : Math.max(0, col - 1));
        const neighborY = at(Math.min(grid.height - 1, row + 1), col) - at(Math.max(0, row - 1), col);
        const slopeX = (at(row, Math.min(grid.width - 1, col + 1)) - at(row, Math.max(0, col - 1))) / (grid.step * 115);
        const slopeY = (at(Math.min(grid.height - 1, row + 1), col) - at(Math.max(0, row - 1), col)) / (grid.step * 115);
        // 3D 立体西北 315° 太阳斜射光影（暖阳面提亮、背阴面偏冷蓝灰，增强真实山脊立体感）
        const shade = clamp((slopeX - slopeY) * 1.35, -46, 44);
        let upper = terrainStops.findIndex(([level]) => level > height);
        if (upper < 0) upper = terrainStops.length - 1;
        upper = Math.max(1, upper);
        const [lowerLevel, lowerColor] = terrainStops[upper - 1];
        const [upperLevel, upperColor] = terrainStops[upper];
        const t = clamp((height - lowerLevel) / (upperLevel - lowerLevel), 0, 1);
        const i = (row * grid.width + col) * 4;
        const warmR = shade > 0 ? shade * 1.08 : shade * 0.92;
        const warmG = shade * 0.98;
        const coolB = shade > 0 ? shade * 0.84 : shade * 0.68;
        image.data[i] = clamp(lowerColor[0] * (1 - t) + upperColor[0] * t + warmR, 0, 255);
        image.data[i + 1] = clamp(lowerColor[1] * (1 - t) + upperColor[1] * t + warmG, 0, 255);
        image.data[i + 2] = clamp(lowerColor[2] * (1 - t) + upperColor[2] * t + coolB, 0, 255);
        const border = Math.min(row, col, grid.width - 1 - col, grid.height - 1 - row);
        image.data[i + 3] = index > 0 ? 255 * clamp(border * grid.step / .7, 0, 1) : 255;
      }
    }
    brush.putImageData(image, 0, 0);
    return { ...grid, at, relief, east: grid.west + (grid.width - 1) * grid.step,
      south: grid.north - (grid.height - 1) * grid.step };
  }

  function shortUnitName(unit) {
    const type = unit.name.match(/第[一二三四五六七八九十百〇0-9]+(?:纵队|兵团|集团军|军|师|旅|团)/g);
    if (unit.parent) {
      const child = unit.name.match(/[· ]([一二三四五六七八九十0-9]+(?:师|团))/g);
      if (child) return child.map((part) => part.trim()).join(' · ');
    }
    return type?.at(-1) || unit.name.replace(/总司令部|指挥所/g, '部');
  }

  function mount(canvas, data, handlers) {
    const brush = canvas.getContext('2d');
    let humanRenderer = null;
    try { humanRenderer = globalThis.CivilWarHuman3D?.createRenderer() || null; }
    catch (error) { console.warn('三维人物初始化失败', error); }
    canvas.dataset.humanModel = humanRenderer ? 'webgl' : 'fallback';
    let places, groups, land, important, outlets;
    const geography = globalThis.CivilWarGeography;
    const worldGeo = globalThis.WorldGeography;
    const grids = (geography?.grids || []).map(prepareGrid);
    const worldGrids = (worldGeo?.grids || []).map(prepareGrid);
    let globalBackdropCities = [];
    let globalBackdropRoutes = [];
    let globalDeployments = [];
    let globalCityHitItems = [];
    let globalDeployHitItems = [];
    const textWidthCache = new Map();
    const polyBoundsCache = new WeakMap();
    function getPolyBounds(pts) {
      let b = polyBoundsCache.get(pts);
      if (b) return b;
      let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const lon = pts[i][0], lat = pts[i][1];
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      b = [minLon, maxLon, minLat, maxLat];
      polyBoundsCache.set(pts, b);
      return b;
    }
    function cachedTextWidth(ctx, font, text) {
      const k = font + '|' + text;
      let w = textWidthCache.get(k);
      if (w === undefined) {
        ctx.font = font;
        w = ctx.measureText(text).width;
        if (textWidthCache.size > 4000) textWidthCache.clear();
        textWidthCache.set(k, w);
      }
      return w;
    }

    const GLOBAL_DEPLOYMENTS_KOREA = [
      // ══ 五常：苏联（红 · 欧亚全域纵深部署）══
      { id: 'gd-kw-moscow', nation: '苏联', name: '苏军莫斯科军区近卫集群', short: '苏·莫斯科近卫', commander: '华西列夫斯基', strength: 180000, lon: 37.62, lat: 55.75, city: '莫斯科', bloc: 'red', side: 'ccp', icon: '★', kind: '装甲/火箭炮战略预备', models: ['t34', 'katyusha', 'soldier_ussr'], arsenal: 'T-34/85 ×600 · IS-3重坦 ×120 · 喀秋莎火箭炮 ×180', note: '苏联最高统帅部中央战略总预备队，威慑欧洲与远东全局。' },
      { id: 'gd-kw-leningrad', nation: '苏联', name: '苏军列宁格勒军区与波罗的海舰队', short: '苏·波罗的海舰队', commander: '戈沃罗夫', strength: 150000, lon: 30.31, lat: 59.93, city: '列宁格勒/喀琅施塔得港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '波罗的海舰队与北方集群', models: ['battleship', 'ship', 'mig15'], arsenal: '战列舰/巡洋舰编队 · 米格-15防空师 · 机械化师×8', note: '扼守芬兰湾与波罗的海出口，拱卫苏联西北门户。' },
      { id: 'gd-kw-kiev', nation: '苏联', name: '苏军基辅军区与黑海舰队', short: '苏·黑海舰队/乌克兰', commander: '格列奇科', strength: 175000, lon: 33.52, lat: 44.61, city: '塞瓦斯托波尔/敖德萨港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '黑海舰队与南方装甲集群', models: ['battleship', 'ship', 't34'], arsenal: '黑海舰队主力 · T-34/85装甲师×5 · 152mm重炮群', note: '监控黑海海峡与土耳其方向北约南翼。' },
      { id: 'gd-kw-berlin', nation: '苏联', name: '苏军驻德集群（GSFG）', short: '苏·驻德集群', commander: '崔可夫', strength: 350000, lon: 13.40, lat: 52.52, city: '柏林', bloc: 'red', side: 'ccp', icon: '⛨', kind: '重装甲机械化集群', models: ['t34', 'soldier_ussr', 'mig15'], arsenal: 'T-34/85与IS-2 ×2400 · 米格-15 ×400 · 机械化师×22', note: '冷战欧洲前线最精锐机械化集群，牢牢牵制北约主力东调。' },
      { id: 'gd-kw-warsaw', nation: '苏联', name: '苏军北方集群', short: '苏·北方集群', commander: '罗科索夫斯基', strength: 120000, lon: 21.01, lat: 52.23, city: '华沙', bloc: 'red', side: 'ccp', icon: '★', kind: '步兵与装甲师群', models: ['t34', 'soldier_ussr'], arsenal: 'T-34/85 ×420 · 152mm加榴炮 ×240', note: '守卫东欧铁路干线与波罗的海方向侧翼。' },
      { id: 'gd-kw-ural', nation: '苏联', name: '苏军乌拉尔/西伯利亚战略预备军区', short: '苏·西伯利亚预备', commander: '朱可夫', strength: 160000, lon: 61.40, lat: 55.16, city: '车里雅宾斯克/新西伯利亚', bloc: 'red', side: 'ccp', icon: '★', kind: '重装甲生产与铁路预备', models: ['t34', 'katyusha'], arsenal: '坦克城兵工厂 · 西伯利亚大铁路机动预备师', note: '依托乌拉尔重工业基地向中朝提供60个师苏械装备。' },
      { id: 'gd-kw-chita', nation: '苏联', name: '苏军后贝加尔军区（伯力/赤塔）', short: '苏·后贝加尔军区', commander: '普尔卡耶夫', strength: 140000, lon: 113.50, lat: 52.03, city: '赤塔/伯力', bloc: 'red', side: 'ccp', icon: '★', kind: '机械化步兵与航空师', models: ['soldier_ussr', 't34'], arsenal: '机械化师×10 · 喀秋莎团 · 远东战略铁路枢纽', note: '沿西伯利亚大铁路衔接中苏边境满洲里与海参崴。' },
      { id: 'gd-kw-vladivostok', nation: '苏联', name: '苏军远东军区 · 太平洋舰队', short: '苏·太平洋舰队/远东军', commander: '马利诺夫斯基', strength: 220000, lon: 131.89, lat: 43.12, city: '海参崴军港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '太平洋舰队与远东集团军', models: ['battleship', 'ship', 'mig15'], arsenal: '巡洋舰×4 · 驱逐舰×26 · 潜艇×60 · 米格-15×280', note: '扼守日本海北大门，为中朝后勤与米格走廊提供战略纵深。' },
      { id: 'gd-kw-kamchatka', nation: '苏联', name: '苏军堪察加与千岛防卫基地', short: '苏·堪察加基地', commander: '太平洋舰队北支队', strength: 55000, lon: 158.65, lat: 53.02, city: '彼得罗巴甫洛夫斯克港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '潜艇基地与岸防航空师', models: ['uboat', 'ship', 'mig15'], arsenal: '潜艇编队 · 岸防炮兵与极地航空团', note: '与美军阿留申荷兰港隔北太平洋对峙。' },
      { id: 'gd-kw-lushun', nation: '苏联', name: '苏军驻旅顺海军要塞与第39集团军', short: '苏·旅顺海军基地', commander: '别洛博罗多夫', strength: 60000, lon: 121.25, lat: 38.80, city: '旅顺/大连港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '海军基地与米格航空师', models: ['ship', 'mig15', 'soldier_ussr'], arsenal: '驱逐舰与鱼雷艇×18 · 米格-15×96 · 岸防重炮群', note: '拱卫渤海湾与辽东半岛，与志愿军共同防卫黄海北岸。' },
      // ══ 五常：中国（红 · 六大军区完整分布）══
      { id: 'gd-kw-beijing', nation: '中国', name: '解放军华北军区战略总预备队', short: '中·华北军区', commander: '聂荣臻', strength: 280000, lon: 116.40, lat: 39.90, city: '北京/天津港', bloc: 'red', side: 'ccp', icon: '★', kind: '野战兵团预备队', models: ['soldier_pva', 't34', 'artillery'], arsenal: '野战兵团×3 · T-34/85坦克团 · 122mm榴弹炮群', note: '拱卫京津与华北铁路枢纽，源源不断轮换兵团入朝。' },
      { id: 'gd-kw-shenyang', nation: '中国/苏联', name: '东北军区 · 志愿军后勤与米格走廊空军', short: '中苏·东北/米格走廊', commander: '高岗 / 阔日杜布', strength: 240000, lon: 123.43, lat: 41.80, city: '沈阳/安东机场', bloc: 'red', side: 'ccp', icon: '✈', kind: '米格-15空军与喀秋莎预备', models: ['mig15', 'katyusha', 'soldier_pva'], arsenal: '米格-15×480 · BM-13喀秋莎×240 · 铁道兵与高炮师', note: '抗美援朝大后方核心，中苏空军由此起飞开辟“米格走廊”。' },
      { id: 'gd-kw-shanghai', nation: '中国', name: '解放军华东军区与华东海军', short: '中·华东军区/海防', commander: '陈毅 / 粟裕', strength: 320000, lon: 121.47, lat: 31.23, city: '上海/南京/青岛港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '野战兵团与东南海防舰艇', models: ['soldier_pva', 'ship', 'artillery'], arsenal: '野战军×8 · 护卫舰与炮艇编队 · 岸防重炮', note: '防卫长江口与台湾海峡方向，应对美第7舰队与国民党反攻威胁。' },
      { id: 'gd-kw-guangzhou', nation: '中国', name: '解放军中南军区（华南防务）', short: '中·中南军区', commander: '叶剑英', strength: 250000, lon: 113.26, lat: 23.13, city: '广州/武汉', bloc: 'red', side: 'ccp', icon: '★', kind: '野战军与援越顾问团', models: ['soldier_pva', 'artillery'], arsenal: '野战军×6 · 山炮与榴弹炮群', note: '扼守华南海疆并经湘桂铁路支援印支反法抗战。' },
      { id: 'gd-kw-chengdu', nation: '中国', name: '解放军西南军区（成渝/进藏）', short: '中·西南军区', commander: '刘伯承 / 贺龙', strength: 210000, lon: 104.07, lat: 30.67, city: '重庆/成都', bloc: 'red', side: 'ccp', icon: '★', kind: '山地野战军与铁道工程兵', models: ['soldier_pva', 'artillery'], arsenal: '第18军等主力师 · 成渝铁路修筑兵团', note: '稳固大西南战略后方并修通成渝铁路干线。' },
      { id: 'gd-kw-lanzhou', nation: '中国', name: '解放军西北军区（兰新线）', short: '中·西北军区', commander: '彭德怀 / 习仲勋', strength: 160000, lon: 103.83, lat: 36.06, city: '西安/兰州/乌鲁木齐', bloc: 'red', side: 'ccp', icon: '★', kind: '西北野战兵团', models: ['soldier_pva', 'artillery'], arsenal: '第1/2/6军主力 · 西北铁路与石油通道守备', note: '保障西北大后方与中苏新疆陆路通道。' },
      // ══ 邻国：蒙古 ══
      { id: 'gd-kw-ulaanbaatar', nation: '蒙古', name: '苏蒙联军外蒙古防卫集群', short: '蒙·外蒙防卫集群', commander: '乔巴山', strength: 55000, lon: 106.91, lat: 47.92, city: '乌兰巴托', bloc: 'red', side: 'ccp', icon: '★', kind: '骑兵机械化师', models: ['soldier_ussr', 't34'], arsenal: 'T-34中型坦克×90 · 摩托化骑兵师×4', note: '护卫中苏蒙铁路大动脉与北方战略纵深。' },
      // ══ 五常：美国 & 第7舰队 & 全球基地网（蓝）══
      { id: 'gd-kw-tokyo', nation: '美国', name: '美远东司令部（FECOM · 东京总部）', short: '美·远东司令部', commander: '麦克阿瑟 / 李奇微', strength: 85000, lon: 139.69, lat: 35.69, city: '东京/横滨', bloc: 'blue', side: 'roc', icon: '★', kind: '战区最高司令部与航空联队', models: ['soldier_usa', 'f86', 'm26'], arsenal: 'F-86佩刀联队 · 第16军预备师 · 远东后勤司令部', note: '联合国军总指挥部，统筹日本列岛全部美军陆海空基地与铁路补给。' },
      { id: 'gd-kw-7thfleet', nation: '美国', name: '美国海军第7舰队（TF77 航母战列舰编队）', short: '美·第7舰队(TF77)', commander: '斯特鲁布尔 / 克拉克', strength: 78000, lon: 130.60, lat: 32.30, city: '佐世保/横须贺军港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '埃塞克斯级航母编队 + 战列舰群 + 舰载机', models: ['carrier', 'battleship', 'f86'], arsenal: '埃塞克斯级航母×6 · 衣阿华级战列舰×2（密苏里/新泽西号） · 巡洋舰×8 · 驱逐舰×48 · 舰载机500架', note: '掌控黄海、日本海与台湾海峡制海权，承担仁川登陆、舰载空袭与406mm巨炮支援。' },
      { id: 'gd-kw-okinawa', nation: '美国', name: '美远东空军 B-29 战略轰炸机群（嘉手纳）', short: '美·冲绳嘉手纳B-29', commander: '斯特拉特迈耶', strength: 52000, lon: 127.77, lat: 26.35, city: '冲绳嘉手纳基地', bloc: 'blue', side: 'roc', icon: '✈', kind: 'B-29战略轰炸与F-86联队', models: ['b29', 'f86', 'soldier_usa'], arsenal: 'B-29超级空中堡垒×120 · F-80/F-86×180', note: '从冲绳嘉手纳基地起飞，对朝鲜北部铁路、电站与桥梁实施战略轰炸。' },
      { id: 'gd-kw-taipei', nation: '美国/中国台湾', name: '美第7舰队台海巡弋编队 & 国民党驻台部队', short: '美第7舰队/驻台军', commander: '蒋介石 / 孙立人', strength: 450000, lon: 121.56, lat: 25.03, city: '台北/基隆/左营港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '海峡巡弋航母编队与岛屿守军', models: ['carrier', 'ship', 'f86'], arsenal: '美第7舰队台湾海峡分遣舰队 · 国民党陆军60万与F-51机群', note: '1950年6月美第7舰队开入台湾海峡，牵制华东解放军兵力。' },
      { id: 'gd-kw-guam', nation: '美国', name: '美太平洋海空战略中转基地（关岛安德森）', short: '美·关岛战略基地', commander: '太平洋司令部', strength: 42000, lon: 144.79, lat: 13.44, city: '关岛阿普拉港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '战略轰炸与海军补给枢纽', models: ['battleship', 'b29'], arsenal: 'B-29战略轰炸机中队 · 太平洋后勤补给舰群', note: '西太平洋第二岛链核心枢纽，保障跨洋兵力与弹药转运。' },
      { id: 'gd-kw-pearl', nation: '美国', name: '美太平洋舰队司令部（CINCPAC · 珍珠港）', short: '美·珍珠港太平洋舰队', commander: '雷德福', strength: 125000, lon: -157.86, lat: 21.31, city: '珍珠港/希卡姆基地', bloc: 'blue', side: 'roc', icon: '⚓', kind: '大型航母舰队与陆战后备', models: ['carrier', 'battleship', 'f86'], arsenal: '重型航母×4 · 战列舰×2 · 潜艇舰队 · 陆战预备团', note: '统筹太平洋全域海运护航、舰队轮换与陆战队增援。' },
      { id: 'gd-kw-bremerton', nation: '美国', name: '美军西北太平洋军港与阿拉斯加防空', short: '美·布雷默顿/西雅图港', commander: '第13海军区', strength: 72000, lon: -122.63, lat: 47.56, city: '布雷默顿/西雅图港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '航母船厂与北太平洋护航', models: ['battleship', 'ship', 'b29'], arsenal: '普吉特湾海军船厂 · 阿拉斯加北极防空联队', note: '承担太平洋航母与战列舰大修及北太平洋补给线护航。' },
      { id: 'gd-kw-sf', nation: '美国', name: '美军西海岸战略投送港与彭德尔顿陆战队', short: '美·旧金山/圣迭戈港', commander: '第6集团军', strength: 185000, lon: -117.38, lat: 33.30, city: '圣迭戈/彭德尔顿/旧金山', bloc: 'blue', side: 'roc', icon: '⚓', kind: '跨洋航母投送港与陆战队师', models: ['carrier', 'm26', 'soldier_usa'], arsenal: '登陆运输船队×120 · 陆战预备师 · M26/M46坦克群', note: '美军赴朝兵力、坦克与海量范佛里特弹药的主要装船母港。' },
      { id: 'gd-kw-hood', nation: '美国', name: '美军胡德堡装甲基地（得州预备集群）', short: '美·胡德堡装甲基地', commander: '第4集团军', strength: 95000, lon: -97.78, lat: 31.14, city: '胡德堡/休斯敦港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '重装甲预备师与燃油枢纽', models: ['m26', 'sherman', 'soldier_usa'], arsenal: '第1/第2装甲师预备群 · 休斯敦战略燃油装船港', note: '美军本土核心装甲训练与重装备铁路集结基地。' },
      { id: 'gd-kw-bragg', nation: '美国', name: '美军布拉格堡空降集群（第82/101空降师）', short: '美·布拉格堡空降军', commander: '第18空降军', strength: 88000, lon: -79.00, lat: 35.14, city: '布拉格堡(北卡)', bloc: 'blue', side: 'roc', icon: '✈', kind: '战略空降快速反应部队', models: ['soldier_usa', 'b29'], arsenal: '第82空降师 · 第11空降师 · 战术运输机群', note: '美军全球机动战略总预备队，可随时空运支援欧洲或远东。' },
      { id: 'gd-kw-dc', nation: '美国', name: '美军大西洋舰队与华盛顿/诺福克总基地', short: '美·诺福克大西洋舰队', commander: '布莱德雷', strength: 350000, lon: -76.29, lat: 36.85, city: '华盛顿/诺福克军港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '大西洋大型航母舰队与本土总部', models: ['carrier', 'battleship', 'f86'], arsenal: '中途岛级/埃塞克斯级航母×5 · 战列舰×2 · 核威慑空军', note: '美军参谋长联席会议统筹全球防务与大西洋海运线。' },
      { id: 'gd-kw-frankfurt', nation: '美国', name: '美军驻德第7集团军（法兰克福）', short: '美·驻德第7集团军', commander: '艾森豪威尔', strength: 220000, lon: 8.68, lat: 50.11, city: '法兰克福(西德)', bloc: 'blue', side: 'roc', icon: '⛨', kind: '驻欧美军重装甲与步兵军', models: ['m26', 'soldier_usa', 'f86'], arsenal: '美第5军/第7军 · M46巴顿坦克群 · 驻德战术空军', note: '美军全球第一战略重心，正面抵御苏军驻德集群。' },
      // ══ 邻国：日本（发达城市与铁路沿线防务）══
      { id: 'gd-kw-japan', nation: '日本', name: '日本警察预备队（保安队）与海上警备队', short: '日·警察预备队(4管区)', commander: '林敬三', strength: 75000, lon: 135.50, lat: 34.69, city: '大阪/舞鹤/札幌', bloc: 'blue', side: 'roc', icon: '⛨', kind: '美械治安步兵与扫雷艇队', models: ['soldier_japan', 'sherman', 'ship'], arsenal: '4个管区队（7.5万人） · 美援M24/M4坦克 · 扫雷艇队', note: '朝鲜战争爆发后组建，接替美第8集团军守备日本东海道/东北本线与北海道，并派扫雷艇赴元山扫雷。' },
      // ══ 五常：英国（本土/莱茵/地中海/远东四大部署）══
      { id: 'gd-kw-london', nation: '英国', name: '英国皇家海军本土舰队与英联邦陆军', short: '英·皇家海军本土舰队', commander: '斯利姆', strength: 160000, lon: -0.13, lat: 51.51, city: '伦敦/朴茨茅斯港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '皇家海军航母编队与皇家空军', models: ['carrier', 'battleship', 'spitfire'], arsenal: '光辉级/巨像级航母×4 · 战列舰 · 皇家空军与本土军', note: '向朝鲜派遣英联邦第1师（装备百夫长重坦）及轻型航母编队。' },
      { id: 'gd-kw-baor', nation: '英国', name: '英国莱茵陆军（BAOR · 西德汉诺威）', short: '英·莱茵陆军(BAOR)', commander: '哈丁', strength: 95000, lon: 9.73, lat: 52.37, city: '汉诺威/鲁尔', bloc: 'blue', side: 'roc', icon: '⛨', kind: '百夫长重装甲师与驻德英军', models: ['churchill', 'soldier_uk'], arsenal: '百夫长Mk.3重型坦克师 · 皇家炮兵团', note: '北约北方集群核心，与驻德美军共同驻守北德平原。' },
      { id: 'gd-kw-med', nation: '英国', name: '英国地中海舰队（马耳他/苏伊士）', short: '英·地中海舰队', commander: '蒙巴顿', strength: 75000, lon: 14.51, lat: 35.90, city: '瓦莱塔/亚历山大港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '地中海航母战舰编队与运河驻军', models: ['carrier', 'ship', 'spitfire'], arsenal: '地中海舰队航母编队 · 苏伊士运河区陆军驻军', note: '守护直布罗陀—马耳他—苏伊士至远东的生命航线。' },
      { id: 'gd-kw-singapore', nation: '英国', name: '英国皇家海军远东舰队（新加坡/香港）', short: '英·远东舰队/新加坡', commander: '坦普勒', strength: 88000, lon: 103.82, lat: 1.35, city: '新加坡/香港军港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '远东航母编队与英联邦陆军', models: ['carrier', 'battleship', 'churchill'], arsenal: '凯旋号/忒修斯号/荣耀号轻型航母 · 巡洋舰×4 · 廓尔喀旅', note: '扼守马六甲海峡与南海航道，轮换赴朝鲜西海岸制海作战。' },
      // ══ 五常：法国（本土/印支）══
      { id: 'gd-kw-paris', nation: '法国', name: '法国本土陆军与土伦地中海舰队', short: '法·巴黎/土伦舰队', commander: '瑞安', strength: 165000, lon: 2.35, lat: 48.86, city: '巴黎/土伦港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '法军装甲师与地中海舰队', models: ['charb1', 'soldier_france', 'ship'], arsenal: '法军机械化师×8 · 黎塞留号战列舰编队 · 赴朝法国营', note: '北约西欧防务柱石，并派法国独立志愿营赴朝参加砥平里战斗。' },
      { id: 'gd-kw-saigon', nation: '法国', name: '法军远东远征军（印支战场）', short: '法·印支远征军', commander: '塔西尼', strength: 150000, lon: 106.66, lat: 10.78, city: '西贡/海防港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '外籍军团与阿罗芒什航母', models: ['soldier_france', 'sherman', 'ship'], arsenal: '法国外籍军团 · 谢尔曼坦克群 · 航母阿罗芒什号', note: '在印度支那与越盟激战，构筑西方东南亚防线。' },
      // ══ 其他重要邻国：印度 / 菲律宾 / 澳大利亚 ══
      { id: 'gd-kw-delhi', nation: '印度', name: '印度陆军与孟买海军舰队', short: '印·本土陆海军', commander: '卡里亚帕', strength: 210000, lon: 77.21, lat: 28.61, city: '新德里/孟买港', bloc: 'amber', side: 'roc', icon: '★', kind: '南亚主力陆军与巡洋舰队', models: ['churchill', 'soldier_uk', 'ship'], arsenal: '装甲师与步兵师群 · 德里号巡洋舰 · 战地救护队', note: '在朝鲜战争中保持中立调停立场，并派第60野战救护队与中立国遣返委员会。' },
      { id: 'gd-kw-manila', nation: '美国/菲律宾', name: '美军苏比克湾/克拉克海空基地', short: '美菲·苏比克基地', commander: '西太平洋海军', strength: 65000, lon: 120.98, lat: 14.60, city: '马尼拉/苏比克港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '海军修理港与重型航空基地', models: ['ship', 'b29', 'soldier_usa'], arsenal: '第7舰队前进维修母港 · 菲律宾远征营（PEFTOK）', note: '南海核心海空基地，菲律宾亦派战斗营加入联合国军。' },
      { id: 'gd-kw-sydney', nation: '澳大利亚', name: '澳新联军西南太平洋航母编队与后备队', short: '澳新·悉尼航母编队', commander: '罗伯逊', strength: 48000, lon: 151.21, lat: -33.87, city: '悉尼港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '悉尼号轻型航母与步兵旅', models: ['carrier', 'ship', 'spitfire'], arsenal: '悉尼号航空母舰 · 皇家澳军第3营 · 第77战斗机中队', note: '派遣航母、驱逐舰与步兵营加入英联邦师赴朝作战。' },
    ];

    const GLOBAL_DEPLOYMENTS_CIVIL = [
      // ══ 五常：苏联（红 · 欧亚全域部署）══
      { id: 'gd-cw-moscow', nation: '苏联', name: '苏军莫斯科战略预备集群', short: '苏·莫斯科预备', commander: '华西列夫斯基', strength: 220000, lon: 37.62, lat: 55.75, city: '莫斯科', bloc: 'red', side: 'ccp', icon: '★', kind: '近卫坦克与喀秋莎集群', models: ['t34', 'katyusha', 'soldier_ussr'], arsenal: 'T-34/85 ×800 · 喀秋莎火箭炮 ×220 · 近卫步兵师', note: '战后苏联最高统帅部中枢与战略总预备队。' },
      { id: 'gd-cw-leningrad', nation: '苏联', name: '苏军列宁格勒军区与波罗的海舰队', short: '苏·波罗的海舰队', commander: '戈沃罗夫', strength: 160000, lon: 30.31, lat: 59.93, city: '列宁格勒港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '波罗的海舰队与北方集群', models: ['battleship', 'ship', 'il2'], arsenal: '波罗的海舰队主力 · 伊尔强击机师 · 机械化师', note: '扼守芬兰湾与波罗的海航道。' },
      { id: 'gd-cw-kiev', nation: '苏联', name: '苏军乌克兰军区与黑海舰队', short: '苏·黑海舰队', commander: '格列奇科', strength: 185000, lon: 33.52, lat: 44.61, city: '塞瓦斯托波尔/敖德萨', bloc: 'red', side: 'ccp', icon: '⚓', kind: '黑海舰队与南方装甲群', models: ['battleship', 'ship', 't34'], arsenal: '黑海舰队主力 · T-34/85近卫坦克师', note: '监控黑海海峡与巴尔干方向。' },
      { id: 'gd-cw-berlin', nation: '苏联', name: '苏军驻德占领军集群', short: '苏·驻德占领军', commander: '索科洛夫斯基', strength: 400000, lon: 13.40, lat: 52.52, city: '柏林', bloc: 'red', side: 'ccp', icon: '⛨', kind: '重装甲机械化集团军', models: ['t34', 'soldier_ussr', 'il2'], arsenal: 'T-34/85与IS-2 ×2800 · 伊尔强击机与雅克战机群', note: '控制东德与中欧要冲，柏林危机期间与西方盟军正面峙立。' },
      { id: 'gd-cw-ural', nation: '苏联', name: '苏军乌拉尔/西伯利亚战略预备军区', short: '苏·西伯利亚预备', commander: '朱可夫', strength: 170000, lon: 61.40, lat: 55.16, city: '车里雅宾斯克/新西伯利亚', bloc: 'red', side: 'ccp', icon: '★', kind: '重装甲预备与铁路纵深', models: ['t34', 'katyusha'], arsenal: '乌拉尔兵工基地 · 西伯利亚大铁路机动兵团', note: '苏联战后工业腹地与远东物资转运后盾。' },
      { id: 'gd-cw-chita', nation: '苏联', name: '苏军后贝加尔军区（赤塔/伯力）', short: '苏·后贝加尔军区', commander: '马利诺夫斯基', strength: 150000, lon: 113.50, lat: 52.03, city: '赤塔/伯力', bloc: 'red', side: 'ccp', icon: '★', kind: '远东铁路机械化集团军', models: ['soldier_ussr', 't34'], arsenal: 'T-34机械化军 · 满洲里—赤塔铁路通道', note: '紧邻东北解放区北翼，保障铁路后勤交通。' },
      { id: 'gd-cw-vladivostok', nation: '苏联', name: '苏军远东军区与太平洋舰队', short: '苏·远东/太平洋舰队', commander: '华西列夫斯基', strength: 280000, lon: 131.89, lat: 43.12, city: '海参崴军港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '远东集团军与太平洋舰队', models: ['battleship', 'ship', 't34'], arsenal: '太平洋舰队主力 · T-34/85机械化军 · 远东航空军', note: '曾出兵东北击溃关东军，战后扼守东北亚北翼并提供通道与物资支持。' },
      { id: 'gd-cw-lushun', nation: '苏联', name: '苏军旅顺海军要塞驻军', short: '苏·旅顺海军要塞', commander: '第39集团军', strength: 55000, lon: 121.25, lat: 38.80, city: '旅顺/大连港', bloc: 'red', side: 'ccp', icon: '⚓', kind: '海军要塞与步兵师', models: ['ship', 'soldier_ussr', 'artillery'], arsenal: '旅顺海军支队 · 海岸要塞炮台 · 第39集团军', note: '依中苏协定驻守旅大地区，客观上形成辽东半岛海上屏障。' },
      // ══ 邻国：蒙古 & 朝鲜（红/蓝南北对峙）══
      { id: 'gd-cw-ulaanbaatar', nation: '蒙古', name: '苏蒙联军外蒙古防卫集群', short: '蒙·苏蒙联军', commander: '乔巴山', strength: 60000, lon: 106.91, lat: 47.92, city: '乌兰巴托', bloc: 'red', side: 'ccp', icon: '★', kind: '骑兵机械化师', models: ['soldier_ussr', 't34'], arsenal: '苏蒙机械化旅 · T-34坦克营', note: '稳固蒙古高原与漠北铁路、公路交通线。' },
      { id: 'gd-cw-pyongyang', nation: '朝鲜/苏联', name: '苏军驻北朝鲜第25集团军 & 朝鲜人民军', short: '朝苏·平壤/北朝鲜', commander: '奇斯佳科夫 / 金日成', strength: 130000, lon: 125.76, lat: 39.03, city: '平壤/元山港', bloc: 'red', side: 'ccp', icon: '★', kind: '驻朝苏军与朝鲜人民军', models: ['soldier_kpa', 't34', 'il2'], arsenal: '第25集团军 · 人民军主力师 · T-34/85装甲团', note: '掩护东北解放区东侧后方，并协助东北野战军伤员转运与物资过境。' },
      { id: 'gd-cw-seoul', nation: '韩国/美国', name: '美军驻南朝鲜第24军 & 韩国防警备队', short: '美韩·汉城/仁川港', commander: '霍奇 / 蔡秉德', strength: 75000, lon: 126.98, lat: 37.57, city: '汉城/仁川港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '美第24军与韩警备队', models: ['soldier_usa', 'sherman', 'ship'], arsenal: '美第6/第7步兵师 · 谢尔曼坦克营 · 仁川港务舰艇', note: '驻守三八线以南，监控黄海与东北亚海上动向。' },
      // ══ 五常：美国 & 第7舰队 & 日本占领军 & 本土基地（蓝）══
      { id: 'gd-cw-tokyo', nation: '美国/日本', name: '美军驻日占领军（SCAP · 第8集团军）', short: '美·驻日第8集团军', commander: '麦克阿瑟 / 艾克尔伯格', strength: 150000, lon: 139.69, lat: 35.69, city: '东京/大阪', bloc: 'blue', side: 'roc', icon: '★', kind: '占领军与日本战后海上保安队', models: ['soldier_usa', 'sherman', 'soldier_japan'], arsenal: '美第8集团军（4个师） · 远东空军 · 日本战后扫雷队', note: '盟军最高司令官总司令部（SCAP）驻地，管控日本列岛铁路与四大军港。' },
      { id: 'gd-cw-7thfleet', nation: '美国', name: '美国海军第7舰队（航母战列舰巡弋编队）', short: '美·第7舰队(青岛/横须贺)', commander: '库克 / 巴杰', strength: 68000, lon: 130.60, lat: 32.30, city: '横须贺/佐世保/青岛外海', bloc: 'blue', side: 'roc', icon: '⚓', kind: '埃塞克斯级航母编队 + 战列舰群 + 登陆舰队', models: ['carrier', 'battleship', 'p40'], arsenal: '埃塞克斯级航母×3 · 战列舰/重巡洋舰群 · 两栖登陆舰队（曾运送国军北上东北/华北）', note: '1945–1949年驻泊青岛与横须贺，协助国民党海运主力并控制西太平洋制海权。' },
      { id: 'gd-cw-okinawa', nation: '美国', name: '美军琉球海空战略基地（嘉手纳）', short: '美·冲绳嘉手纳B-29', commander: '远东空军', strength: 60000, lon: 127.77, lat: 26.35, city: '冲绳嘉手纳基地', bloc: 'blue', side: 'roc', icon: '✈', kind: 'B-29轰炸机与海运中转', models: ['b29', 'p40', 'soldier_usa'], arsenal: 'B-29超级空中堡垒联队 · 战略运输机群', note: '距中国东海沿岸仅数百公里，负责对国民党军空运与海运补给。' },
      { id: 'gd-cw-manila', nation: '美国/菲律宾', name: '美军菲律宾克拉克/苏比克海空基地', short: '美·菲律宾苏比克基地', commander: '西太平洋海军', strength: 80000, lon: 120.98, lat: 14.60, city: '马尼拉/苏比克港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '海空联队与剩余军火库', models: ['ship', 'b29', 'soldier_usa'], arsenal: '美军二战剩余军火总库 · 苏比克海军基地', note: '大量太平洋战争美军剩余军火由此海运援助国民党军。' },
      { id: 'gd-cw-guam', nation: '美国', name: '美军关岛西太平洋海军枢纽', short: '美·关岛基地', commander: '太平洋舰队', strength: 45000, lon: 144.79, lat: 13.44, city: '关岛港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '海军补给与战略航空基地', models: ['battleship', 'b29'], arsenal: '阿普拉海军基地 · 战略轰炸机中队', note: '连接珍珠港与冲绳、上海、青岛的跨洋运输中继站。' },
      { id: 'gd-cw-pearl', nation: '美国', name: '美海军太平洋舰队司令部（珍珠港）', short: '美·珍珠港太平洋舰队', commander: '尼米兹 / 登菲尔德', strength: 140000, lon: -157.86, lat: 21.31, city: '珍珠港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '大型航母舰队与登陆舰群', models: ['carrier', 'battleship', 'p40'], arsenal: '埃塞克斯级航母×5 · 衣阿华级战列舰×2 · 两栖登陆舰队', note: '掌控整个太平洋航线，调派登陆舰协助国民党军跨海机动。' },
      { id: 'gd-cw-bremerton', nation: '美国', name: '美军西雅图/布雷默顿军港', short: '美·布雷默顿军港', commander: '第13海军区', strength: 65000, lon: -122.63, lat: 47.56, city: '布雷默顿/西雅图', bloc: 'blue', side: 'roc', icon: '⚓', kind: '太平洋航母修造船厂', models: ['battleship', 'ship'], arsenal: '普吉特湾海军船厂 · 阿拉斯加北线护航队', note: '美国太平洋舰队主力战舰维修与北太平洋补给母港。' },
      { id: 'gd-cw-sf', nation: '美国', name: '美军西海岸军港与彭德尔顿陆战队', short: '美·旧金山/圣迭戈港', commander: '第6集团军', strength: 160000, lon: -117.38, lat: 33.30, city: '圣迭戈/彭德尔顿/旧金山', bloc: 'blue', side: 'roc', icon: '⚓', kind: '航母基地与援华运输港', models: ['carrier', 'sherman', 'soldier_usa'], arsenal: '太平洋后备舰队 · 援华军械与燃油运输船队', note: '美援武器、舰艇、燃油与工业物资发往上海、青岛的主港口。' },
      { id: 'gd-cw-hood', nation: '美国', name: '美军胡德堡装甲预备基地（得州）', short: '美·胡德堡装甲基地', commander: '第4集团军', strength: 90000, lon: -97.78, lat: 31.14, city: '胡德堡/休斯敦港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '本土装甲师与燃油枢纽', models: ['sherman', 'soldier_usa'], arsenal: '第2装甲师 · 休斯敦油港', note: '美国南部军事集结与战略燃油装运中心。' },
      { id: 'gd-cw-bragg', nation: '美国', name: '美军布拉格堡空降总预备队', short: '美·布拉格堡空降军', commander: '第82空降师', strength: 80000, lon: -79.00, lat: 35.14, city: '布拉格堡(北卡)', bloc: 'blue', side: 'roc', icon: '✈', kind: '本土战略空降机动集群', models: ['soldier_usa', 'b29'], arsenal: '第82空降师 · 战略运输航空联队', note: '美军战后本土最快反应机动力量。' },
      { id: 'gd-cw-dc', nation: '美国', name: '美军本土战略预备队与大西洋舰队', short: '美·诺福克大西洋舰队', commander: '艾森豪威尔 / 马歇尔', strength: 400000, lon: -76.29, lat: 36.85, city: '华盛顿/诺福克军港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '大西洋大型航母舰队与本土总部', models: ['carrier', 'battleship', 'p40'], arsenal: '大西洋舰队航母主力 · 陆军总预备队 · 战略空军', note: '马歇尔调停与美国全球战略决策中枢，战略重心置于欧洲。' },
      { id: 'gd-cw-frankfurt', nation: '美国', name: '美军驻德占领军（法兰克福）', short: '美·驻德占领军', commander: '克莱', strength: 180000, lon: 8.68, lat: 50.11, city: '法兰克福(西德)', bloc: 'blue', side: 'roc', icon: '⛨', kind: '西德美占区主力与柏林空运', models: ['sherman', 'soldier_usa', 'b29'], arsenal: '驻德美军装甲骑兵团 · 柏林空运运输机群', note: '冷战欧洲前线主力，1948年执行柏林大空运。' },
      // ══ 五常：英国（本土/莱茵/地中海/远东四大部署）══
      { id: 'gd-cw-london', nation: '英国', name: '英国皇家海军本土舰队与英军', short: '英·皇家海军本土舰队', commander: '蒙哥马利', strength: 180000, lon: -0.13, lat: 51.51, city: '伦敦/朴茨茅斯港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '皇家海军航母编队与喷火空军', models: ['carrier', 'battleship', 'spitfire'], arsenal: '皇家海军主力航母/战列舰 · 喷火战斗机联队', note: '维系大英帝国经苏伊士至香港、新加坡的海上交通线。' },
      { id: 'gd-cw-baor', nation: '英国', name: '英国莱茵占领军（BAOR · 西德）', short: '英·莱茵占领军', commander: '麦克里里', strength: 110000, lon: 9.73, lat: 52.37, city: '汉诺威/鲁尔', bloc: 'blue', side: 'roc', icon: '⛨', kind: '装甲师与驻德英军', models: ['churchill', 'soldier_uk'], arsenal: '英军第7装甲师 · 皇家炮兵与步兵师', note: '驻守西德英占区与鲁尔重工业带。' },
      { id: 'gd-cw-med', nation: '英国', name: '英国地中海舰队（马耳他/苏伊士）', short: '英·地中海舰队', commander: '坎宁安', strength: 85000, lon: 14.51, lat: 35.90, city: '瓦莱塔/亚历山大港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '地中海航母战舰编队', models: ['carrier', 'ship', 'spitfire'], arsenal: '地中海舰队主力 · 苏伊士运河驻军', note: '控制地中海与红海咽喉要道。' },
      { id: 'gd-cw-singapore', nation: '英国', name: '英军远东舰队与香港驻军', short: '英·新加坡/香港舰队', commander: '远东司令部', strength: 95000, lon: 103.82, lat: 1.35, city: '新加坡/香港军港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '远东航母舰队与丘吉尔装甲旅', models: ['carrier', 'battleship', 'churchill'], arsenal: '远东舰队主力与紫石英号护卫舰 · 廓尔喀与英军旅', note: '扼守马六甲海峡与南海航道，并驻防香港与长江口外海。' },
      // ══ 五常：法国（本土/印支）══
      { id: 'gd-cw-paris', nation: '法国', name: '法国本土陆军与土伦地中海舰队', short: '法·巴黎/土伦舰队', commander: '塔西尼', strength: 195000, lon: 2.35, lat: 48.86, city: '巴黎/土伦港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '法军装甲师与地中海舰队', models: ['charb1', 'soldier_france', 'ship'], arsenal: '法军装甲与步兵师 · 黎塞留号战列舰编队', note: '冷战初起时在西欧与苏联红军形成战略均势。' },
      { id: 'gd-cw-saigon', nation: '法国', name: '法军印支远征军（西贡/海防）', short: '法·印支远征军', commander: '勒克莱尔 / 瓦吕', strength: 115000, lon: 106.66, lat: 10.78, city: '西贡/海防港', bloc: 'blue', side: 'roc', icon: '⛨', kind: '外籍军团与远东海军', models: ['soldier_france', 'sherman', 'ship'], arsenal: '法国外籍军团 · 谢尔曼装甲团 · 远东分遣舰队', note: '控制越南南部与海防港，紧邻中国两广与云南边境。' },
      // ══ 重要邻国：印度 & 澳大利亚 ══
      { id: 'gd-cw-delhi', nation: '印度', name: '南亚与印度洋防卫集群', short: '印·新德里/孟买舰队', commander: '奥金莱克', strength: 180000, lon: 77.21, lat: 28.61, city: '新德里/孟买港', bloc: 'amber', side: 'roc', icon: '★', kind: '南亚陆军与孟买海军', models: ['churchill', 'soldier_uk', 'ship'], arsenal: '南亚主力师群 · 孟买海军巡洋舰队', note: '印巴分治前后南亚次大陆主力部队与印度洋核心港口。' },
      { id: 'gd-cw-sydney', nation: '澳大利亚', name: '澳大利亚战后本土防卫军与舰队', short: '澳·悉尼舰队', commander: '布莱梅', strength: 52000, lon: 151.21, lat: -33.87, city: '悉尼港', bloc: 'blue', side: 'roc', icon: '⚓', kind: '西南太平洋海军与陆军', models: ['ship', 'soldier_uk'], arsenal: '皇家澳军巡洋舰与驱逐舰 · 驻日英联邦占领军旅', note: '守护南太平洋航线并派兵参加盟军驻日占领任务。' },
    ];

    const GLOBAL_SEA_CORRIDORS = [
      [[139.69, 35.69], [144.79, 13.44]],
      [[144.79, 13.44], [-157.86, 21.31]],
      [[-157.86, 21.31], [-122.42, 37.77]],
      [[139.69, 35.69], [127.68, 26.21], [120.98, 14.60], [103.82, 1.35]],
      [[103.82, 1.35], [72.88, 19.08], [32.30, 31.26], [-5.35, 36.14], [-0.13, 51.51]],
      [[-0.13, 51.51], [-74.01, 40.71]],
      [[-76.29, 36.85], [-5.35, 36.14]],
      [[131.89, 43.12], [129.07, 35.18], [121.25, 38.80]],
      [[103.82, 1.35], [151.21, -33.87]],
      [[-122.42, 37.77], [-79.52, 8.98], [-76.29, 36.85]],
    ];

    const GLOBAL_RAIL_TRUNKS = [
      [[37.62, 55.75], [60.60, 56.84], [82.93, 55.01], [104.28, 52.29], [117.43, 49.60], [131.89, 43.12]],
      [[37.62, 55.75], [21.01, 52.23], [13.40, 52.52], [2.35, 48.86]],
      [[-74.01, 40.71], [-87.63, 41.88], [-104.99, 39.74], [-122.42, 37.77]],
    ];

    function rebuildDataIndex(nextData) {
      data = nextData;
      places = new Map(data.cities.map((city) => [city.id, city]));
      groups = new Map((data.groups || []).map((group) => [group.id, group]));
      // 三大战区统一接入 Natural Earth 50m 完整全球真实陆地轮廓，支持随时缩放查看全球布兵与重大城市港口
      land = worldGeo?.land?.length ? worldGeo.land : (geography?.land?.length ? geography.land : (data.land || []));

      // 为国共内战与朝鲜战争构建去重后的全球重大城市/港口底图节点与全球战略布兵数据
      if (data.theaterMode !== 'ww2') {
        if (typeof globalThis.applyWorldCitiesExt === 'function' && globalThis.WW2Data) {
          globalThis.applyWorldCitiesExt(globalThis.WW2Data);
        }
        const ww2Cities = globalThis.WW2Data?.cities || [];
        const ww2CityMap = new Map(ww2Cities.map((c) => [c.id, c]));
        const localCoords = (data.cities || []).map((c) => [c.lon, c.lat]);
        const backdropIdSet = new Set();
        globalBackdropCities = ww2Cities.filter((wc) => {
          for (const [lon, lat] of localCoords) {
            if (Math.abs(wc.lon - lon) < 0.65 && Math.abs(wc.lat - lat) < 0.55) return false;
          }
          backdropIdSet.add(wc.id);
          return true;
        }).sort((a, b) => (Number(b.terrain === 'fort') - Number(a.terrain === 'fort')) || (Number(b.port) - Number(a.port)) || ((b.vp || 0) - (a.vp || 0)));
        // 同步接入二战同级完整全球铁路网与海运网（日本东海道/山阳/东北/九州铁路、美国东西贯通铁路、中国新干线、西伯利亚与欧洲铁路）
        globalBackdropRoutes = [];
        for (const [aId, bId, kind] of (globalThis.WW2Data?.routes || [])) {
          if (!backdropIdSet.has(aId) && !backdropIdSet.has(bId)) continue;
          const a = ww2CityMap.get(aId);
          const b = ww2CityMap.get(bId);
          if (!a || !b || Math.abs(a.lon - b.lon) > 160) continue;
          globalBackdropRoutes.push({ a, b, kind });
        }
        globalDeployments = data.theaterMode === 'korea' ? GLOBAL_DEPLOYMENTS_KOREA : GLOBAL_DEPLOYMENTS_CIVIL;
      } else {
        globalBackdropCities = [];
        globalBackdropRoutes = [];
        globalDeployments = [];
      }
      // 二战全球 550+ 城按重要度与缩放清晰展示：战区视角即展示重要城市/省会/州府/要塞/根据地，放大后展示全部 550+ 节点
      const theaterImportant = data.theaterMode === 'ww2'
        ? data.cities.filter((c) => (c.value || 0) >= 4 || c.terrain === 'fort' || c.port).map((c) => c.id)
        : data.theaterMode === 'korea'
          ? data.cities.map((c) => c.id)
          : [];
      important = new Set([...(data.battleLayers || []).flatMap((layer) => layer.points || []), ...mapNames, ...theaterImportant]);
      outlets = new Map();
      for (const [a, b] of (data.links || [])) {
        if (data.routeTypes?.[linkKey(a, b)] !== 'rail') continue;
        outlets.set(a, (outlets.get(a) || 0) + 1);
        outlets.set(b, (outlets.get(b) || 0) + 1);
      }
      if (data.sideMeta) {
        sideNames.ccp = data.sideMeta.ccp?.short || '共产党';
        sideNames.roc = data.sideMeta.roc?.short || '国民党';
      } else {
        sideNames.ccp = '共产党';
        sideNames.roc = '国民党';
      }
    }
    rebuildDataIndex(data);
    const options = { mode: 'situation', terrainBack: true, satellite: true, rail: true, province: true, battle: true, maritime: false,
      supply: false, fort: true, models3d: true, globalLayer: true };
    let width = 1;
    let height = 1;
    let camera = { lon: 105, lat: 35, zoom: 12 };
    let state;
    let selection = {};
    let pointer;
    let highlightedCity;
    let hoverPoint;
    let hover;
    let keyboardCard;
    let hitCards = [];
    let battleBubbles = [];
    let backgroundKey;
    let lastBattleDays = {};
    let battleEffects = [];
    let commandEffects = [];
    let previousOrders = new Map();
    let previousPostures = new Map();
    let previousWorks = new Set();
    let animationFrame = 0;
    let lastAnimationAt = 0;
    let initialized = false;
    let lastMapEventSequence = 0;
    const cache = document.createElement('canvas');
    const backdrop = cache.getContext('2d');
    const territoryCanvas = document.createElement('canvas');
    const territoryBrush = territoryCanvas.getContext('2d');
    const territoryClipped = document.createElement('canvas');
    const territoryClippedBrush = territoryClipped.getContext('2d');
    // GPU 常驻世界纹理图集（4096×2048）与陆地硬件蒙版（2048×1024）：彻底消除每帧数万顶点 CPU 裁切，释放 4060 GPU 硬件贴图加速！
    const worldAtlas = document.createElement('canvas');
    const worldAtlasCtx = worldAtlas.getContext('2d');
    const worldLandMask = document.createElement('canvas');
    const worldLandMaskCtx = worldLandMask.getContext('2d');
    const chinaLandMask = document.createElement('canvas');
    const chinaLandMaskCtx = chinaLandMask.getContext('2d');
    let worldAtlasKey = '';
    let worldMaskBuilt = false;
    let chinaMaskBuilt = false;
    let territoryKey = '';
    let pendingDrawFrame = 0;

    // ── 🚀 真正的 WebGL GLSL GPU 硬件着色器管线（powerPreference: 'high-performance'，单次 DrawCall 完成 360° 球形底图 + 硬件蒙版势力混合）──
    const glCanvas = document.createElement('canvas');
    let gpuPipe = null;
    let gpuLabel = 'Canvas 2D';
    try {
      const gl = glCanvas.getContext('webgl', {
        powerPreference: 'high-performance',
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const rawRenderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '');
        const rtxMatch = rawRenderer.match(/(RTX\s*\d+\w*|GTX\s*\d+\w*|Radeon\s*[\w\s]+?)(?:\s+Laptop|\s+GPU|\s*\/|,|\)|$)/i);
        gpuLabel = rtxMatch ? rtxMatch[1].trim() : (rawRenderer.includes('SwiftShader') ? 'WebGL 软件光栅' : 'WebGL GPU');

        const vsSrc = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }';
        const fsSrc = [
          'precision highp float;',
          'varying vec2 vUv;',
          'uniform sampler2D uAtlas;',
          'uniform sampler2D uMask;',
          'uniform sampler2D uTerr;',
          'uniform float uCamLon;',
          'uniform float uCamLat;',
          'uniform float uSpanLon;',
          'uniform float uSpanLat;',
          'uniform float uHasTerr;',
          'uniform float uUseMask;',
          'uniform float uNight;',
          'void main(){',
          '  float lon = uCamLon + (vUv.x - 0.5) * uSpanLon;',
          '  float lat = uCamLat + (0.5 - vUv.y) * uSpanLat;',
          '  float u = fract((lon + 180.0) / 360.0);',
          '  float v = clamp((90.0 - lat) / 180.0, 0.0005, 0.9995);',
          '  vec4 col = texture2D(uAtlas, vec2(u, v));',
          '  if (uHasTerr > 0.5) {',
          '    vec4 terr = texture2D(uTerr, vUv);',
          '    float m = uUseMask > 0.5 ? texture2D(uMask, vec2(u, v)).a : 1.0;',
          '    col.rgb = mix(col.rgb, terr.rgb, terr.a * m);',
          '  }',
          '  if (uNight > 0.5) {',
          '    col.rgb = mix(col.rgb, vec3(0.05, 0.09, 0.16), 0.28);',
          '  }',
          '  gl_FragColor = vec4(col.rgb, 1.0);',
          '}',
        ].join('\n');
        const compile = (type, src) => {
          const sh = gl.createShader(type);
          gl.shaderSource(sh, src);
          gl.compileShader(sh);
          return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
        };
        const vs = compile(gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (vs && fs) {
          const prog = gl.createProgram();
          gl.attachShader(prog, vs);
          gl.attachShader(prog, fs);
          gl.linkProgram(prog);
          if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
            const makeTex = (wrapS) => {
              const t = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, t);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              return t;
            };
            gpuPipe = {
              gl,
              prog,
              buf,
              aPos: gl.getAttribLocation(prog, 'aPos'),
              uAtlas: gl.getUniformLocation(prog, 'uAtlas'),
              uMask: gl.getUniformLocation(prog, 'uMask'),
              uTerr: gl.getUniformLocation(prog, 'uTerr'),
              uCamLon: gl.getUniformLocation(prog, 'uCamLon'),
              uCamLat: gl.getUniformLocation(prog, 'uCamLat'),
              uSpanLon: gl.getUniformLocation(prog, 'uSpanLon'),
              uSpanLat: gl.getUniformLocation(prog, 'uSpanLat'),
              uHasTerr: gl.getUniformLocation(prog, 'uHasTerr'),
              uUseMask: gl.getUniformLocation(prog, 'uUseMask'),
              uNight: gl.getUniformLocation(prog, 'uNight'),
              atlasTex: makeTex(gl.REPEAT),
              maskTex: makeTex(gl.REPEAT),
              terrTex: makeTex(gl.CLAMP_TO_EDGE),
              atlasVer: '',
              maskReady: false,
              terrVer: '',
            };
          }
        }
      }
    } catch {}

    // 实时帧率统计（平滑滑动窗口）
    let fpsSmoothed = 60;
    let lastDrawStamp = 0;
    let cursorGeo = null;

    // ── 🛰️ 全球高清卫星影像瓦片引擎（对齐八九/谷歌卫星图，Mercator 精确重投影至等经纬坐标，零偏差、360°无限循环、离线自动无缝降级）──
    const satTileCache = new Map();
    const SAT_TILE_MAX = 320;
    const tileLat = (ty, n) => Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n))) * 180 / Math.PI;
    const latToTileY = (lat, n) => {
      const rad = clamp(lat, -82, 82) * Math.PI / 180;
      return Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n);
    };
    function getSatTile(z, tx, ty) {
      const n = 1 << z;
      const wx = ((tx % n) + n) % n;
      if (ty < 0 || ty >= n) return null;
      const key = z + '/' + wx + '/' + ty;
      let entry = satTileCache.get(key);
      if (entry) {
        // LRU 刷新
        satTileCache.delete(key);
        satTileCache.set(key, entry);
        return entry;
      }
      if (satTileCache.size >= SAT_TILE_MAX) {
        const oldest = satTileCache.keys().next().value;
        satTileCache.delete(oldest);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      entry = { img, ready: false, failed: false, z, wx, ty };
      satTileCache.set(key, entry);
      img.onload = () => {
        entry.ready = true;
        backgroundKey = undefined;
        scheduleDraw();
      };
      img.onerror = () => { entry.failed = true; };
      img.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + z + '/' + ty + '/' + wx;
      return entry;
    }

    function drawSatelliteTiles(ctx) {
      // 根据当前 camera.zoom 匹配最清晰的卫星瓦片层级（z = 2 .. 13，放大至街道/山脊/港口全清！）
      const targetZ = clamp(Math.round(Math.log2(Math.max(camera.zoom * 0.76 * 360 / 256, 1))), 2, 13);
      const n = 1 << targetZ;
      const [vMinLon, vMaxLon, vMinLat, vMaxLat] = viewportGeoBounds();
      const tyMin = clamp(latToTileY(vMaxLat, n), 0, n - 1);
      const tyMax = clamp(latToTileY(vMinLat, n), 0, n - 1);
      const txMin = Math.floor(((vMinLon + 180) / 360) * n);
      const txMax = Math.floor(((vMaxLon + 180) / 360) * n);
      let drawnAny = false;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      for (let ty = tyMin; ty <= tyMax; ty++) {
        const latN = tileLat(ty, n);
        const latS = tileLat(ty + 1, n);
        for (let tx = txMin; tx <= txMax; tx++) {
          const lonW = (tx / n) * 360 - 180;
          const lonE = ((tx + 1) / n) * 360 - 180;
          const [x0, y0] = projectAt(lonW, latN, 0);
          const [x1, y1] = projectAt(lonE, latS, 0);
          const dw = x1 - x0;
          const dh = y1 - y0;
          if (x1 < 0 || x0 > width || y1 < 0 || y0 > height || dw <= 0 || dh <= 0) continue;
          const tile = getSatTile(targetZ, tx, ty);
          if (tile?.ready) {
            ctx.drawImage(tile.img, x0 - 0.5, y0 - 0.5, dw + 1, dh + 1);
            drawnAny = true;
          } else {
            // 瓦片加载中自动向上查找已缓存父级瓦片无缝补帧（零白闪！）
            for (let pz = targetZ - 1; pz >= 2; pz--) {
              const shift = targetZ - pz;
              const ptx = Math.floor(tx / (1 << shift));
              const pty = ty >> shift;
              const pn = 1 << pz;
              const pKey = pz + '/' + (((ptx % pn) + pn) % pn) + '/' + pty;
              const pEntry = satTileCache.get(pKey);
              if (pEntry?.ready) {
                const pLonW = (ptx / pn) * 360 - 180;
                const pLonE = ((ptx + 1) / pn) * 360 - 180;
                const pLatN = tileLat(pty, pn);
                const pLatS = tileLat(pty + 1, pn);
                const sx = ((lonW - pLonW) / (pLonE - pLonW)) * pEntry.img.width;
                const sw = ((lonE - lonW) / (pLonE - pLonW)) * pEntry.img.width;
                const sy = ((pLatN - latN) / (pLatN - pLatS)) * pEntry.img.height;
                const sh = ((latN - latS) / (pLatN - pLatS)) * pEntry.img.height;
                ctx.drawImage(pEntry.img, sx, sy, sw, sh, x0 - 0.5, y0 - 0.5, dw + 1, dh + 1);
                drawnAny = true;
                break;
              }
            }
          }
        }
      }
      ctx.restore();
      return drawnAny;
    }

    function scheduleDraw() {
      if (pendingDrawFrame) return;
      pendingDrawFrame = requestAnimationFrame(() => {
        pendingDrawFrame = 0;
        draw();
      });
    }

    function ensureChinaLandMask() {
      if (chinaMaskBuilt) return;
      chinaMaskBuilt = true;
      const mw = 2048, mh = 1024;
      chinaLandMask.width = mw;
      chinaLandMask.height = mh;
      const ctx = chinaLandMaskCtx;
      ctx.clearRect(0, 0, mw, mh);
      const px = (lon) => ((lon + 180) / 360) * mw;
      const py = (lat) => ((90 - lat) / 180) * mh;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const maskRings = geography?.boundary?.length ? geography.boundary : (geography?.land || []);
      for (let r = 0; r < maskRings.length; r++) {
        const ring = maskRings[r];
        if (!ring?.length) continue;
        ctx.moveTo(px(ring[0][0]), py(ring[0][1]));
        for (let i = 1; i < ring.length; i++) ctx.lineTo(px(ring[i][0]), py(ring[i][1]));
        ctx.closePath();
      }
      ctx.fill();
    }

    function ensureWorldLandMask() {
      if (worldMaskBuilt) return;
      worldMaskBuilt = true;
      const mw = 2048, mh = 1024;
      worldLandMask.width = mw;
      worldLandMask.height = mh;
      const ctx = worldLandMaskCtx;
      ctx.clearRect(0, 0, mw, mh);
      const px = (lon) => ((lon + 180) / 360) * mw;
      const py = (lat) => ((90 - lat) / 180) * mh;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const maskRings = worldGeo?.land?.length ? worldGeo.land : (geography?.land || []);
      for (let r = 0; r < maskRings.length; r++) {
        const ring = maskRings[r];
        if (!ring?.length) continue;
        ctx.moveTo(px(ring[0][0]), py(ring[0][1]));
        for (let i = 1; i < ring.length; i++) ctx.lineTo(px(ring[i][0]), py(ring[i][1]));
        ctx.closePath();
      }
      ctx.fill();
    }

    function ensureWorldAtlas() {
      const aKey = [options.mode, options.province, options.terrainBack, data.theaterMode || 'civil'].join('|');
      if (worldAtlasKey === aKey && worldAtlas.width === 4096) return;
      worldAtlasKey = aKey;
      const aw = 4096, ah = 2048;
      if (worldAtlas.width !== aw || worldAtlas.height !== ah) {
        worldAtlas.width = aw;
        worldAtlas.height = ah;
      }
      const ctx = worldAtlasCtx;
      const px = (lon) => ((lon + 180) / 360) * aw;
      const py = (lat) => ((90 - lat) / 180) * ah;
      const sea = ctx.createLinearGradient(0, 0, aw, ah);
      if (data.theaterMode === 'ww2' || data.theaterMode === 'korea') {
        sea.addColorStop(0, '#5d8499');
        sea.addColorStop(1, '#44687d');
      } else {
        sea.addColorStop(0, '#7899a6');
        sea.addColorStop(1, '#5e8291');
      }
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, aw, ah);
      ctx.beginPath();
      for (let r = 0; r < land.length; r++) {
        const ring = land[r];
        if (!ring?.length) continue;
        ctx.moveTo(px(ring[0][0]), py(ring[0][1]));
        for (let i = 1; i < ring.length; i++) ctx.lineTo(px(ring[i][0]), py(ring[i][1]));
        ctx.closePath();
      }
      ctx.fillStyle = options.mode === 'contour' ? '#e3d7b7' : '#d3c9a7';
      ctx.fill();
      if (options.mode === 'terrain' || options.mode === 'terrain3d' || options.mode === 'contour' || options.terrainBack) {
        ctx.save();
        ctx.clip();
        const demAlpha = options.mode === 'contour' ? .52 : .97;
        ctx.globalAlpha = demAlpha;
        ctx.imageSmoothingEnabled = true;
        for (const grid of worldGrids) {
          const x0 = px(grid.west), y0 = py(grid.north), x1 = px(grid.east), y1 = py(grid.south);
          ctx.drawImage(grid.relief, x0, y0, x1 - x0, y1 - y0);
        }
        for (const grid of grids) {
          const x0 = px(grid.west), y0 = py(grid.north), x1 = px(grid.east), y1 = py(grid.south);
          ctx.drawImage(grid.relief, x0, y0, x1 - x0, y1 - y0);
        }
        ctx.globalAlpha = 1;
        const worldRivers = globalThis.CivilWarWorld?.rivers || [];
        if (worldRivers.length) {
          ctx.strokeStyle = 'rgba(72, 118, 140, 0.58)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (const rv of worldRivers) {
            if (!rv.pts?.length) continue;
            ctx.moveTo(px(rv.pts[0][0]), py(rv.pts[0][1]));
            for (let i = 1; i < rv.pts.length; i++) ctx.lineTo(px(rv.pts[i][0]), py(rv.pts[i][1]));
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.strokeStyle = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? '#2a4654b8' : '#3a5d6699';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      if (options.province && worldGeo?.borders?.length) {
        ctx.save();
        ctx.strokeStyle = '#5c66549c';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (const seg of worldGeo.borders) {
          if (!seg?.length) continue;
          ctx.moveTo(px(seg[0][0]), py(seg[0][1]));
          for (let i = 1; i < seg.length; i++) ctx.lineTo(px(seg[i][0]), py(seg[i][1]));
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    function blitWorldTexture(ctx, tex, tw, th) {
      for (const off of visibleWorldOffsets()) {
        const [a, b] = projectAt(-180, 90, off);
        const [x, y] = projectAt(180, -90, off);
        if (x < 0 || a > width || y < 0 || b > height) continue;
        const fullW = x - a, fullH = y - b;
        if (fullW <= 0 || fullH <= 0) continue;
        const dx0 = Math.max(0, a), dy0 = Math.max(0, b);
        const dx1 = Math.min(width, x), dy1 = Math.min(height, y);
        if (dx1 <= dx0 || dy1 <= dy0) continue;
        const sx = ((dx0 - a) / fullW) * tw;
        const sy = ((dy0 - b) / fullH) * th;
        const sw = ((dx1 - dx0) / fullW) * tw;
        const sh = ((dy1 - dy0) / fullH) * th;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tex, sx, sy, sw, sh, dx0, dy0, dx1 - dx0, dy1 - dy0);
      }
    }
    let factionLegendKey = '';
    const mapLabel = canvas.getAttribute('aria-label') || '战区地图';
    const keyboardHelp = 'Page Up 和 Page Down 浏览标记，Enter 打开所选部队或同城名册';
    canvas.setAttribute('aria-keyshortcuts', 'PageUp PageDown Enter');
    canvas.setAttribute('aria-label', mapLabel + '。' + keyboardHelp);

    function zoomLevel() {
      if (camera.zoom < nationalZoom) return 'national';
      return camera.zoom < detailZoom ? 'theater' : 'detail';
    }

    const normalizeLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;
    const wrapDeltaLon = (lon) => ((((lon - camera.lon + 180) % 360) + 360) % 360) - 180;

    function visibleWorldOffsets() {
      const halfDeg = (width / 2) / Math.max(camera.zoom * .76, 0.01) + 12;
      const minLon = camera.lon - halfDeg;
      const maxLon = camera.lon + halfDeg;
      const offsets = [];
      for (let off = -720; off <= 720; off += 360) {
        if (180 + off >= minLon && -180 + off <= maxLon) offsets.push(off);
      }
      return offsets.length ? offsets : [0];
    }

    function projectAt(lon, lat, offset = 0) {
      return [width / 2 + (lon + offset - camera.lon) * camera.zoom * .76, height / 2 - (lat - camera.lat) * camera.zoom];
    }

    function project(lon, lat) {
      return [width / 2 + wrapDeltaLon(lon) * camera.zoom * .76, height / 2 - (lat - camera.lat) * camera.zoom];
    }

    function unproject(x, y) {
      return [normalizeLon(camera.lon + (x - width / 2) / (camera.zoom * .76)), camera.lat - (y - height / 2) / camera.zoom];
    }

    function traceAt(ctx, points, close = false, offset = 0) {
      if (!points?.length) return;
      let curLon = points[0][0];
      ctx.moveTo(...projectAt(curLon, points[0][1], offset));
      for (let i = 1; i < points.length; i++) {
        let nextLon = points[i][0];
        if (!close) {
          while (nextLon - curLon > 180) nextLon -= 360;
          while (nextLon - curLon < -180) nextLon += 360;
        }
        curLon = nextLon;
        ctx.lineTo(...projectAt(curLon, points[i][1], offset));
      }
      if (close) ctx.closePath();
    }

    function viewportGeoBounds() {
      const halfLon = (width / 2) / Math.max(camera.zoom * .76, 0.01) + 2;
      const halfLat = (height / 2) / Math.max(camera.zoom, 0.01) + 2;
      return [camera.lon - halfLon, camera.lon + halfLon, camera.lat - halfLat, camera.lat + halfLat];
    }

    function trace(ctx, points, close = false) {
      if (!points?.length) return;
      const [vMinLon, vMaxLon, vMinLat, vMaxLat] = viewportGeoBounds();
      const [minLon, maxLon, minLat, maxLat] = getPolyBounds(points);
      if (maxLat < vMinLat || minLat > vMaxLat) return;
      for (const off of visibleWorldOffsets()) {
        if (maxLon + off < vMinLon || minLon + off > vMaxLon) continue;
        traceAt(ctx, points, close, off);
      }
    }

    function shape(ctx, rings) {
      ctx.beginPath();
      if (!rings?.length) return;
      const [vMinLon, vMaxLon, vMinLat, vMaxLat] = viewportGeoBounds();
      const offsets = visibleWorldOffsets();
      for (const off of offsets) {
        for (let r = 0; r < rings.length; r++) {
          const ring = rings[r];
          if (!ring?.length) continue;
          const [minLon, maxLon, minLat, maxLat] = getPolyBounds(ring);
          if (maxLat < vMinLat || minLat > vMaxLat || maxLon + off < vMinLon || minLon + off > vMaxLon) continue;
          traceAt(ctx, ring, true, off);
        }
      }
    }

    function showContours(ctx) {
      const activeGrids = [...worldGrids, ...grids];
      if (!activeGrids.length) return;
      const southwest = unproject(0, height);
      const northeast = unproject(width, 0);
      const step = camera.zoom >= 1200 ? 25 : camera.zoom >= 260 ? 50 : camera.zoom >= 100 ? 100 : camera.zoom >= 48 ? 200 : camera.zoom >= 24 ? 400 : 800;
      const paths = new Map();
      for (const [index, grid] of activeGrids.entries()) {
        const stride = camera.zoom < 19 ? 3 : camera.zoom < 35 ? 2 : 1;
        const left = Math.max(0, Math.floor((southwest[0] - grid.west) / grid.step / stride) * stride);
        const top = Math.max(0, Math.floor((grid.north - northeast[1]) / grid.step / stride) * stride);
        const right = Math.min(grid.width - stride, Math.ceil((northeast[0] - grid.west) / grid.step));
        const bottom = Math.min(grid.height - stride, Math.ceil((grid.north - southwest[1]) / grid.step));
        const later = activeGrids.slice(index + 1);
        for (let row = top; row < bottom; row += stride) for (let col = left; col < right; col += stride) {
          const lon = grid.west + col * grid.step;
          const lat = grid.north - row * grid.step;
          if (later.some((item) => lon >= item.west && lon < item.east && lat <= item.north && lat > item.south)) continue;
          const corners = [grid.at(row, col), grid.at(row, col + stride), grid.at(row + stride, col + stride), grid.at(row + stride, col)];
          const start = Math.max(step, Math.ceil(Math.min(...corners) / step) * step);
          const end = Math.max(...corners);
          const size = grid.step * stride;
          const coord = [[lon, lat], [lon + size, lat], [lon + size, lat - size], [lon, lat - size]];
          for (let level = start; level < end; level += step) {
            const intersections = [];
            for (let side = 0; side < 4; side++) {
              const other = (side + 1) % 4;
              const a = corners[side], b = corners[other];
              if ((a < level) === (b < level)) continue;
              const fraction = (level - a) / (b - a);
              intersections.push(project(coord[side][0] + fraction * (coord[other][0] - coord[side][0]),
                coord[side][1] + fraction * (coord[other][1] - coord[side][1])));
            }
            if (!paths.has(level)) paths.set(level, new Path2D());
            const path = paths.get(level);
            for (let i = 1; i < intersections.length; i += 2) {
              path.moveTo(...intersections[i - 1]);
              path.lineTo(...intersections[i]);
            }
          }
        }
      }
      for (const [level, path] of paths) {
        const main = level % (step * 5) === 0;
        ctx.strokeStyle = main ? '#694d37af' : '#775c416e';
        ctx.lineWidth = main ? 1.08 : .62;
        ctx.stroke(path);
      }
      ctx.font = '10px "Microsoft YaHei UI", sans-serif';
      ctx.fillStyle = '#614c37';
      ctx.fillText('等高距 ' + step + ' 米', 15, height - 115);
    }

    function sampleElevation(rawLon, lat) {
      const lon = normalizeLon(rawLon);
      for (let i = grids.length - 1; i >= 0; i--) {
        const g = grids[i];
        if (lon >= g.west && lon <= g.east && lat <= g.north && lat >= g.south) {
          const fc = (lon - g.west) / g.step;
          const fr = (g.north - lat) / g.step;
          const c0 = clamp(Math.floor(fc), 0, g.width - 2);
          const r0 = clamp(Math.floor(fr), 0, g.height - 2);
          const tx = fc - c0, ty = fr - r0;
          const h00 = g.at(r0, c0), h10 = g.at(r0, c0 + 1), h01 = g.at(r0 + 1, c0), h11 = g.at(r0 + 1, c0 + 1);
          return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
        }
      }
      for (let i = worldGrids.length - 1; i >= 0; i--) {
        const g = worldGrids[i];
        if (lon >= g.west && lon <= g.east && lat <= g.north && lat >= g.south) {
          const fc = (lon - g.west) / g.step;
          const fr = (g.north - lat) / g.step;
          const c0 = clamp(Math.floor(fc), 0, g.width - 2);
          const r0 = clamp(Math.floor(fr), 0, g.height - 2);
          const tx = fc - c0, ty = fr - r0;
          const h00 = g.at(r0, c0), h10 = g.at(r0, c0 + 1), h01 = g.at(r0 + 1, c0), h11 = g.at(r0 + 1, c0 + 1);
          return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
        }
      }
      return 0;
    }

    function drawCroppedGrid(ctx, grid, alpha) {
      for (const off of visibleWorldOffsets()) {
        const [a, b] = projectAt(grid.west, grid.north, off);
        const [x, y] = projectAt(grid.east, grid.south, off);
        if (x < 0 || a > width || y < 0 || b > height) continue;
        const fullW = x - a;
        const fullH = y - b;
        if (fullW <= 0 || fullH <= 0) continue;
        // 仅裁剪视口内可见区域绘制，支持 360° 球形循环拼接与 24000 倍超大缩放
        const dx0 = Math.max(0, a);
        const dy0 = Math.max(0, b);
        const dx1 = Math.min(width, x);
        const dy1 = Math.min(height, y);
        if (dx1 <= dx0 || dy1 <= dy0) continue;
        const sx = ((dx0 - a) / fullW) * grid.width;
        const sy = ((dy0 - b) / fullH) * grid.height;
        const sw = ((dx1 - dx0) / fullW) * grid.width;
        const sh = ((dy1 - dy0) / fullH) * grid.height;
        ctx.globalAlpha = alpha;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(grid.relief, sx, sy, sw, sh, dx0, dy0, dx1 - dx0, dy1 - dy0);
      }
    }

    function drawTerrain3DRelief(ctx) {
      const is3DMode = options.mode === 'terrain3d';
      if (!is3DMode) return;
      const cell = 32;
      const cols = Math.ceil(width / cell) + 1;
      const rows = Math.ceil(height / cell) + 1;
      const elev = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const [lon, lat] = unproject(c * cell, r * cell);
          elev[r * cols + c] = sampleElevation(lon, lat);
        }
      }
      ctx.save();
      const liftScale = is3DMode ? clamp(camera.zoom * 0.012, 0.008, 0.032) : 0.007;
      // 绘制 3D 立体山脊斜坡光影与高程透视层叠（完全符合 1937–1953 历史地貌）
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          const h = elev[r * cols + c];
          if (h < 160) continue;
          const hx = elev[r * cols + (c + 1)] - elev[r * cols + (c - 1)];
          const hy = elev[(r + 1) * cols + c] - elev[(r - 1) * cols + c];
          const slope = Math.hypot(hx, hy);
          if (slope < 22 && h < 900) continue;
          const px = c * cell;
          const py = r * cell;
          const lift = clamp(h * liftScale, 2, is3DMode ? 26 : 12);
          // 东南背阴山坡立体投影
          if (is3DMode || slope > 45) {
            ctx.fillStyle = h > 2600 ? 'rgba(46, 56, 72, 0.24)' : 'rgba(54, 48, 36, 0.20)';
            ctx.beginPath();
            ctx.moveTo(px - cell * 0.45, py + cell * 0.15);
            ctx.lineTo(px + cell * 0.05, py - lift);
            ctx.lineTo(px + cell * 0.62, py + cell * 0.28);
            ctx.closePath();
            ctx.fill();
            // 西北向阳山坡暖光高光
            ctx.fillStyle = h > 3200 ? 'rgba(250, 248, 240, 0.34)' : 'rgba(244, 224, 174, 0.20)';
            ctx.beginPath();
            ctx.moveTo(px - cell * 0.55, py + cell * 0.18);
            ctx.lineTo(px + cell * 0.05, py - lift);
            ctx.lineTo(px - cell * 0.05, py + cell * 0.20);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      // 局部最高峰标高三角点（△ 842m）
      const peaks = [];
      for (let r = 2; r < rows - 2; r += 2) {
        for (let c = 2; c < cols - 2; c += 2) {
          const h = elev[r * cols + c];
          if (h < 350) continue;
          if (h >= elev[(r - 1) * cols + c] && h >= elev[(r + 1) * cols + c]
            && h >= elev[r * cols + (c - 1)] && h >= elev[r * cols + (c + 1)]) {
            peaks.push({ x: c * cell, y: r * cell, h: Math.round(h) });
          }
        }
      }
      peaks.sort((a, b) => b.h - a.h);
      const placed = [];
      ctx.font = '600 9.5px "Microsoft YaHei UI", sans-serif';
      ctx.textAlign = 'center';
      for (const pk of peaks.slice(0, is3DMode ? 18 : 10)) {
        if (placed.some((p) => Math.hypot(p.x - pk.x, p.y - pk.y) < 95)) continue;
        placed.push(pk);
        const label = '△ ' + pk.h + 'm';
        ctx.strokeStyle = 'rgba(242, 232, 206, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.strokeText(label, pk.x, pk.y - 4);
        ctx.fillStyle = '#4a3520';
        ctx.fillText(label, pk.x, pk.y - 4);
      }
      ctx.restore();
    }

    function drawHistoricalMicroDetails(ctx) {
      // 参考谷歌地图微观缩放层次，严格遵守 1937–1953 历史年代（老城街廓、蒸汽铁路站场、海港栈桥防波堤、野战土质机场、农田与战壕）
      if (camera.zoom < 85) return;
      const alpha = clamp((camera.zoom - 85) / 140, 0.15, 0.92);
      const allCities = data.theaterMode === 'ww2' ? data.cities : [...data.cities, ...globalBackdropCities];
      ctx.save();
      for (const city of allCities) {
        const [x, y] = project(city.lon, city.lat);
        if (x < -120 || x > width + 120 || y < -120 || y > height + 120) continue;
        const val = Number(city.value || Math.round((city.vp || 6) / 2)) || 4;
        const scale = clamp(camera.zoom / 220, 0.45, 5.5);
        const cityRad = (10 + val * 2.2) * Math.min(scale, 3.2);
        const seed = (city.id || city.name || 'c').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);

        // 1. 历史老城城廓与民国/二战时期棋盘街巷（绝无现代高架/摩天楼）
        ctx.save();
        ctx.globalAlpha = alpha * 0.62;
        ctx.fillStyle = 'rgba(182, 168, 138, 0.42)';
        ctx.strokeStyle = 'rgba(96, 82, 58, 0.62)';
        ctx.lineWidth = Math.max(1, scale * 0.85);
        ctx.beginPath();
        ctx.roundRect(x - cityRad, y - cityRad * 0.78, cityRad * 2, cityRad * 1.56, 3);
        ctx.fill();
        ctx.stroke();
        // 老城十字主街与次级街巷
        ctx.strokeStyle = 'rgba(116, 102, 76, 0.46)';
        ctx.lineWidth = Math.max(0.7, scale * 0.45);
        ctx.beginPath();
        const cols = camera.zoom >= 350 ? 6 : 4;
        for (let i = 1; i < cols; i++) {
          const gx = x - cityRad + (cityRad * 2 * i) / cols;
          ctx.moveTo(gx, y - cityRad * 0.76);
          ctx.lineTo(gx, y + cityRad * 0.76);
        }
        const rows = camera.zoom >= 350 ? 5 : 3;
        for (let j = 1; j < rows; j++) {
          const gy = y - cityRad * 0.78 + (cityRad * 1.56 * j) / rows;
          ctx.moveTo(x - cityRad, gy);
          ctx.lineTo(x + cityRad, gy);
        }
        ctx.stroke();
        ctx.restore();

        // 2. 蒸汽铁路编组站与铁轨股道
        if (val >= 4 || outlets.get(city.id)) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.72;
          const ry = y + cityRad * 0.95;
          ctx.strokeStyle = '#3f3528';
          ctx.lineWidth = 1.2;
          for (const dy of [-2.5, 0, 2.5]) {
            ctx.beginPath();
            ctx.moveTo(x - cityRad * 0.9, ry + dy);
            ctx.lineTo(x + cityRad * 0.9, ry + dy);
            ctx.stroke();
          }
          ctx.fillStyle = '#6e4c36';
          ctx.fillRect(x - 6, ry - 5, 12, 4);
          ctx.restore();
        }

        // 3. 海港石砌防波堤与栈桥码头（港口专属）
        if (city.port || city.terrain === 'port') {
          ctx.save();
          ctx.globalAlpha = alpha * 0.78;
          const px = x + cityRad * 1.05;
          ctx.strokeStyle = '#56646b';
          ctx.lineWidth = Math.max(1.8, scale * 1.1);
          ctx.beginPath();
          ctx.moveTo(px, y - cityRad * 0.55);
          ctx.lineTo(px + cityRad * 0.65, y - cityRad * 0.35);
          ctx.lineTo(px + cityRad * 0.65, y + cityRad * 0.45);
          ctx.stroke();
          ctx.strokeStyle = '#8b7355';
          ctx.lineWidth = 1.1;
          for (const dy of [-cityRad * 0.25, 0, cityRad * 0.25]) {
            ctx.beginPath();
            ctx.moveTo(px - 2, y + dy);
            ctx.lineTo(px + cityRad * 0.42, y + dy);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. 战时野战机场土质/碎石跑道（重要城市与军事基地专属）
        if (val >= 5 || city.terrain === 'fort') {
          ctx.save();
          ctx.globalAlpha = alpha * 0.68;
          const ax = x - cityRad * 1.25;
          const ay = y - cityRad * 0.25;
          ctx.translate(ax, ay);
          ctx.rotate(((seed % 5) - 2) * 0.22);
          ctx.fillStyle = 'rgba(138, 126, 98, 0.72)';
          ctx.fillRect(-cityRad * 0.55, -2.5, cityRad * 1.1, 5);
          ctx.strokeStyle = 'rgba(240, 232, 206, 0.7)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(-cityRad * 0.48, 0);
          ctx.lineTo(cityRad * 0.48, 0);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // 5. 超近距（zoom >= 320）历史农田方格、松林丛与外围防御战壕
        if (camera.zoom >= 320) {
          const microAlpha = clamp((camera.zoom - 320) / 360, 0.12, 0.62);
          ctx.save();
          ctx.globalAlpha = microAlpha;
          ctx.strokeStyle = 'rgba(116, 134, 86, 0.55)';
          ctx.lineWidth = 0.8;
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * Math.PI * 2 + (seed % 7) * 0.3;
            const fx = x + Math.cos(ang) * cityRad * 1.75;
            const fy = y + Math.sin(ang) * cityRad * 1.45;
            ctx.strokeRect(fx - 12, fy - 8, 24, 16);
          }
          // 城郊环形防御战壕虚线
          ctx.strokeStyle = 'rgba(92, 74, 52, 0.58)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.ellipse(x, y, cityRad * 1.38, cityRad * 1.12, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    function drawGlobalStaticBackdrop(ctx) {
      globalCityHitItems = [];
      if (data.theaterMode === 'ww2' || options.globalLayer === false) return;
      if (!globalBackdropCities.length && !globalBackdropRoutes.length) return;

      // 1. 全球完整铁路网与战略海运航线（绘制在底图缓存上，动画帧 0 开销）
      ctx.save();
      if (options.rail !== false && globalBackdropRoutes.length) {
        ctx.lineWidth = camera.zoom >= 14 ? 1.55 : 1.05;
        ctx.strokeStyle = 'rgba(72, 62, 46, 0.54)';
        ctx.beginPath();
        for (let i = 0; i < globalBackdropRoutes.length; i++) {
          const r = globalBackdropRoutes[i];
          if (r.kind !== 'rail') continue;
          const [x1, y1] = project(r.a.lon, r.a.lat);
          const [x2, y2] = project(r.b.lon, r.b.lat);
          if (Math.abs(x2 - x1) > width * 0.72) continue;
          if ((x1 < -20 && x2 < -20) || (x1 > width + 20 && x2 > width + 20) || (y1 < -20 && y2 < -20) || (y1 > height + 20 && y2 > height + 20)) continue;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        if (camera.zoom >= 12) {
          ctx.lineWidth = 0.85;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(235, 224, 194, 0.52)';
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.lineWidth = 1.05;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(130, 204, 232, 0.36)';
      for (const seg of GLOBAL_SEA_CORRIDORS) {
        ctx.beginPath();
        let prevX = null;
        for (let i = 0; i < seg.length; i++) {
          const [px, py] = project(seg[i][0], seg[i][1]);
          if (i === 0 || (prevX !== null && Math.abs(px - prevX) > width * 0.72)) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
          prevX = px;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // 2. 全球重大城市、美国州府/军事基地、中国省会、日本发达城市与重要港口（预排序 + 文本宽度缓存）
      const labelBoxes = [];
      const minVp = camera.zoom < 6.5 ? 9 : camera.zoom < 12 ? 7 : camera.zoom < 22 ? 5 : 0;
      const minPortVp = camera.zoom < 6.5 ? 8 : camera.zoom < 12 ? 6 : 0;
      for (let i = 0; i < globalBackdropCities.length; i++) {
        const city = globalBackdropCities[i];
        const vp = city.vp || 5;
        const isBase = city.terrain === 'fort';
        if (!isBase && (city.port ? vp < minPortVp : vp < minVp)) continue;
        const [x, y] = project(city.lon, city.lat);
        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;
        const isCapital = vp >= 14;
        const r = isBase ? 4.2 : city.port ? 3.8 : isCapital ? 4.2 : 2.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isBase ? '#b85330' : city.port ? '#2b86a8' : isCapital ? '#c28b32' : '#6b624c';
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = '#f2ead2';
        ctx.stroke();
        if (city.port) {
          ctx.font = '700 10px "Microsoft YaHei UI", sans-serif';
          ctx.fillStyle = '#8be4ff';
          ctx.strokeStyle = '#10222ce6';
          ctx.lineWidth = 2.2;
          ctx.strokeText('⚓', x - 11, y - 4);
          ctx.fillText('⚓', x - 11, y - 4);
        } else if (isBase) {
          ctx.font = '700 9.5px "Microsoft YaHei UI", sans-serif';
          ctx.fillStyle = '#ffd480';
          ctx.strokeStyle = '#1e1610e6';
          ctx.lineWidth = 2.2;
          ctx.strokeText('★', x - 10, y - 4);
          ctx.fillText('★', x - 10, y - 4);
        }
        const shortName = city._short || (city._short = (city.name || '').split('(')[0].split('（')[0]);
        const fontStr = (city.port || isCapital || isBase ? '600 10.5px' : '500 9.5px') + ' "Microsoft YaHei UI", sans-serif';
        const tw = cachedTextWidth(ctx, fontStr, shortName);
        const lx = x + 6;
        const ly = y;
        const overlap = labelBoxes.some((b) => lx + tw + 3 > b[0] && lx - 3 < b[1] && Math.abs(ly - b[2]) < 12);
        if (!overlap && lx + tw < width - 4 && lx > 4 && ly > 10 && ly < height - 10) {
          labelBoxes.push([lx, lx + tw, ly]);
          ctx.font = fontStr;
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = '#eee4c6d8';
          ctx.lineWidth = 2.4;
          ctx.strokeText(shortName, lx, ly);
          ctx.fillStyle = isBase ? '#6e2315' : city.port ? '#17485c' : '#2d352e';
          ctx.fillText(shortName, lx, ly);
        }
        globalCityHitItems.push({ kind: 'city', item: city, left: x - 8, top: y - 8, width: 16 + tw, height: 16 });
      }
    }

    function drawBase() {
      const key = [width, height, camera.lon, camera.lat, camera.zoom, options.mode, options.province, options.terrainBack, options.satellite, options.rail, options.globalLayer].join('|');
      if (key === backgroundKey) return;
      backgroundKey = key;
      const ctx = backdrop;
      const useSatellite = options.mode === 'satellite' || (options.satellite && options.mode !== 'contour' && options.mode !== 'terrain');
      let satDrawn = false;
      if (useSatellite) {
        // 先铺深邃卫星海面与离线高清世界图集作为底层（瓦片未到或离线时无缝兜底，绝不黑屏）
        ctx.fillStyle = '#071527';
        ctx.fillRect(0, 0, width, height);
        if (camera.zoom < 45) {
          ensureWorldAtlas();
          blitWorldTexture(ctx, worldAtlas, worldAtlas.width, worldAtlas.height);
        }
        satDrawn = drawSatelliteTiles(ctx);
        if (options.mode === 'terrain3d') {
          drawTerrain3DRelief(ctx);
          showContours(ctx);
        }
        // 叠加八九/谷歌卫星图风格的清晰白色国际国界、亮青色水系与醒目金色中国国界
        if (options.province && worldGeo?.borders?.length) {
          ctx.save();
          ctx.beginPath();
          for (const seg of worldGeo.borders) trace(ctx, seg, false);
          ctx.strokeStyle = satDrawn ? 'rgba(255, 255, 255, 0.64)' : '#5c66549c';
          ctx.lineWidth = satDrawn ? 0.95 : 0.78;
          ctx.stroke();
          ctx.restore();
        }
        const worldRivers = globalThis.CivilWarWorld?.rivers || [];
        if (satDrawn && worldRivers.length) {
          ctx.save();
          ctx.strokeStyle = 'rgba(122, 206, 238, 0.68)';
          ctx.lineWidth = Math.max(0.95, Math.min(2.6, camera.zoom * 0.04));
          ctx.beginPath();
          for (const rv of worldRivers) trace(ctx, rv.pts, false);
          ctx.stroke();
          ctx.restore();
        }
        if (camera.zoom >= 85) drawHistoricalMicroDetails(ctx);
      } else if (camera.zoom < 45 && options.mode !== 'contour') {
        // 宏观/全球/战区视角直接使用 WebGL GPU 着色器（或 4096×2048 纹理贴图）完成 360° 球形底图渲染！
        ensureWorldAtlas();
        if (gpuPipe) {
          const { gl } = gpuPipe;
          if (glCanvas.width !== width || glCanvas.height !== height) {
            glCanvas.width = width;
            glCanvas.height = height;
          }
          if (gpuPipe.atlasVer !== worldAtlasKey) {
            gpuPipe.atlasVer = worldAtlasKey;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gpuPipe.atlasTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, worldAtlas);
          }
          if (!gpuPipe.maskReady) {
            ensureWorldLandMask();
            gpuPipe.maskReady = true;
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, gpuPipe.maskTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, worldLandMask);
          }
          gl.viewport(0, 0, width, height);
          gl.useProgram(gpuPipe.prog);
          gl.bindBuffer(gl.ARRAY_BUFFER, gpuPipe.buf);
          gl.enableVertexAttribArray(gpuPipe.aPos);
          gl.vertexAttribPointer(gpuPipe.aPos, 2, gl.FLOAT, false, 0, 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, gpuPipe.atlasTex);
          gl.uniform1i(gpuPipe.uAtlas, 0);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, gpuPipe.maskTex);
          gl.uniform1i(gpuPipe.uMask, 1);
          gl.uniform1f(gpuPipe.uCamLon, camera.lon);
          gl.uniform1f(gpuPipe.uCamLat, camera.lat);
          gl.uniform1f(gpuPipe.uSpanLon, width / Math.max(camera.zoom * .76, 0.01));
          gl.uniform1f(gpuPipe.uSpanLat, height / Math.max(camera.zoom, 0.01));
          gl.uniform1f(gpuPipe.uHasTerr, 0.0);
          gl.uniform1f(gpuPipe.uUseMask, 0.0);
          gl.uniform1f(gpuPipe.uNight, 0.0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          ctx.drawImage(glCanvas, 0, 0, width, height);
        } else {
          ctx.fillStyle = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? '#4b7186' : '#658a99';
          ctx.fillRect(0, 0, width, height);
          blitWorldTexture(ctx, worldAtlas, worldAtlas.width, worldAtlas.height);
        }
        if (options.mode === 'terrain3d') {
          drawTerrain3DRelief(ctx);
          showContours(ctx);
        }
      } else {
        const sea = ctx.createLinearGradient(0, 0, width, height);
        if (data.theaterMode === 'ww2' || data.theaterMode === 'korea') {
          sea.addColorStop(0, '#5d8499');
          sea.addColorStop(1, '#44687d');
        } else {
          sea.addColorStop(0, '#7899a6');
          sea.addColorStop(1, '#5e8291');
        }
        ctx.fillStyle = sea;
        ctx.fillRect(0, 0, width, height);
        shape(ctx, land);
        ctx.fillStyle = options.mode === 'contour' ? '#e3d7b7' : '#d3c9a7';
        ctx.fill();
        if (options.mode === 'terrain' || options.mode === 'terrain3d' || options.mode === 'contour' || options.terrainBack) {
          ctx.save();
          ctx.clip();
          const demAlpha = options.mode === 'contour' ? .52 : .97;
          // 视口精准裁剪绘制全球 AWS Mapzen DEM + 东亚 0.1° 超高清 SRTM DEM（支持 24000 倍超大缩放）
          for (const grid of worldGrids) drawCroppedGrid(ctx, grid, demAlpha);
          for (const grid of grids) drawCroppedGrid(ctx, grid, demAlpha);
          // 3D 立体地形光影与高地标高
          drawTerrain3DRelief(ctx);
          // 叠加真实世界主要河流线
          const worldRivers = globalThis.CivilWarWorld?.rivers || [];
          if (worldRivers.length) {
            ctx.save();
            ctx.strokeStyle = 'rgba(72, 118, 140, 0.58)';
            ctx.lineWidth = Math.max(0.85, Math.min(3.2, camera.zoom * 0.04));
            ctx.beginPath();
            for (const rv of worldRivers) trace(ctx, rv.pts, false);
            ctx.stroke();
            ctx.restore();
          }
          // 1937–1953 历史年代微观城镇/铁路/海港/野战机场/农田细节
          drawHistoricalMicroDetails(ctx);
          ctx.restore();
        }
        ctx.strokeStyle = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? '#2a4654b8' : '#3a5d6699';
        ctx.lineWidth = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? 1.05 : .85;
        shape(ctx, land);
        ctx.stroke();
        if (options.mode === 'contour' || options.mode === 'terrain3d') showContours(ctx);

        if (options.province && worldGeo?.borders?.length) {
          ctx.save();
          shape(ctx, land);
          ctx.clip();
          ctx.beginPath();
          for (const seg of worldGeo.borders) trace(ctx, seg, false);
          ctx.strokeStyle = '#5c66549c';
          ctx.lineWidth = data.theaterMode === 'korea' ? 1.0 : 0.78;
          ctx.stroke();
          ctx.restore();
        }
      }

      if (geography?.boundary && (!data.theaterMode || useSatellite)) {
        shape(ctx, geography.boundary);
        ctx.strokeStyle = satDrawn ? '#e8cc72' : '#465e50';
        ctx.lineWidth = satDrawn ? 1.65 : 1.2;
        ctx.stroke();
      }
      if (!data.theaterMode && options.province && geography?.provinces?.length) {
        for (const province of geography.provinces) {
          shape(ctx, province.rings);
          ctx.lineWidth = .7;
          ctx.strokeStyle = satDrawn ? 'rgba(255, 255, 255, 0.44)' : '#626a57a4';
          ctx.stroke();
          if (!province.name || camera.zoom < 10 || camera.zoom > 146) continue;
          const [x, y] = project(...province.label);
          if (x < 10 || x > width - 10 || y < 50 || y > height - 30) continue;
          ctx.font = (camera.zoom < 22 ? '10' : '13') + 'px SimSun, serif';
          ctx.textAlign = 'center';
          if (satDrawn) {
            ctx.strokeStyle = 'rgba(8, 16, 24, 0.85)';
            ctx.lineWidth = 2.6;
            ctx.strokeText(province.name, x, y);
            ctx.fillStyle = '#f2ecd6';
          } else {
            ctx.fillStyle = options.mode === 'terrain' ? '#3b4a39b8' : '#5b614bbd';
          }
          ctx.fillText(province.name, x, y);
        }
      }
      if (!data.theaterMode && camera.zoom < 22) {
        const [x, y] = project(101, 34);
        ctx.font = 'bold 26px SimSun, serif';
        ctx.textAlign = 'center';
        if (satDrawn) {
          ctx.strokeStyle = 'rgba(10, 14, 18, 0.85)';
          ctx.lineWidth = 3.2;
          ctx.strokeText('中  国', x, y);
          ctx.fillStyle = '#ff6b57';
        } else {
          ctx.fillStyle = '#4858468a';
        }
        ctx.fillText('中  国', x, y);
      }
      // 全球 31 国名称标注（卫星图下白字深边，地形图下墨绿字）
      {
        const countries = [
          ['苏  联', 62, 61, 22], ['德  国', 10.4, 51.2, 15], ['法  国', 2.4, 46.8, 15], ['英  国', -2.2, 54.0, 13],
          ['意 大 利', 12.6, 43.1, 12], ['波  兰', 19.3, 52.1, 13], ['西 班 牙', -3.7, 40.3, 13], ['瑞  典', 15.5, 62.5, 12],
          ['挪  威', 9.0, 61.5, 11], ['芬  兰', 26.0, 63.0, 12], ['土 耳 其', 35.0, 39.2, 13], ['埃  及', 29.8, 26.8, 13],
          ['阿 尔 及 利 亚', 3.0, 29.0, 12], ['利 比 亚', 17.5, 27.5, 12], ['沙 特', 44.5, 24.0, 12], ['伊  朗', 53.5, 32.5, 13],
          ['印  度', 79.0, 22.5, 17], ['中  国', 104.0, 35.2, 20], ['蒙  古', 103.5, 46.8, 13], ['日  本', 138.2, 36.8, 13],
          ['朝  鲜', 127.2, 39.5, 11], ['越  南', 106.5, 16.5, 11], ['泰  国', 101.2, 15.2, 11], ['缅  甸', 96.5, 21.0, 11],
          ['菲 律 宾', 122.0, 13.0, 11], ['印  尼', 114.0, -1.5, 13], ['澳大利亚', 134.0, -25.0, 18],
          ['美  国', -98.0, 39.5, 21], ['加 拿 大', -104.0, 57.5, 19], ['墨 西 哥', -102.0, 23.5, 13], ['巴  西', -52.0, -10.5, 18],
        ];
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [cname, lon, lat, basePx] of countries) {
          if (!data.theaterMode && cname === '中  国') continue;
          const [cx, cy] = project(lon, lat);
          if (cx < -60 || cx > width + 60 || cy < -30 || cy > height + 30) continue;
          const sz = Math.round(clamp(basePx * (camera.zoom / 18), 10, 26));
          ctx.font = 'bold ' + sz + 'px SimSun, serif';
          if (satDrawn) {
            ctx.strokeStyle = 'rgba(6, 12, 20, 0.88)';
            ctx.lineWidth = 2.8;
            ctx.strokeText(cname, cx, cy);
            ctx.fillStyle = cname === '中  国' ? '#ff6b57' : 'rgba(244, 240, 226, 0.92)';
          } else {
            ctx.fillStyle = '#2d3b3288';
          }
          ctx.fillText(cname, cx, cy);
        }
        ctx.restore();
      }
      if (data.theaterMode === 'korea') {
        const [, y38] = project(127, 38.0);
        ctx.save();
        ctx.strokeStyle = 'rgba(180, 128, 36, 0.78)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 5]);
        ctx.beginPath(); ctx.moveTo(0, y38); ctx.lineTo(width, y38); ctx.stroke();
        ctx.restore();
      }
      ctx.font = 'italic 11px "Microsoft YaHei UI", sans-serif';
      ctx.fillStyle = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? '#c9e2ed8c' : '#476f6994';
      ctx.textAlign = 'center';
      const seas = [['黄  海', 124, 34.7], ['东  海', 125, 28.9], ['渤  海', 119.8, 38.45], ['南  海', 114, 15.0],
        ['太平洋', 155, 20], ['大西洋', -32, 34], ['地中海', 18, 35.2], ['北  海', 3.5, 56.2], ['波罗的海', 19.5, 57.8], ['印度洋', 76, 4]];
      for (const [name, lon, lat] of seas) {
        const [sx, sy] = project(lon, lat);
        if (sx >= -40 && sx <= width + 40 && sy >= -20 && sy <= height + 20) ctx.fillText(name, sx, sy);
      }
      ctx.textAlign = 'start';
      drawGlobalStaticBackdrop(ctx);
    }

    function line(points, color, width, dash = []) {
      brush.beginPath();
      trace(brush, points);
      brush.strokeStyle = color;
      brush.lineWidth = width;
      brush.setLineDash(dash);
      brush.stroke();
      brush.setLineDash([]);
    }

    function arrowHead(from, to, color, size = 9) {
      const [x, y] = to;
      const theta = Math.atan2(y - from[1], x - from[0]);
      brush.beginPath();
      brush.moveTo(x, y);
      brush.lineTo(x - size * Math.cos(theta - .5), y - size * Math.sin(theta - .5));
      brush.lineTo(x - size * Math.cos(theta + .5), y - size * Math.sin(theta + .5));
      brush.closePath();
      brush.fillStyle = color;
      brush.fill();
    }

    function drawRoutes() {
      const level = zoomLevel();
      for (const [a, b] of data.links) {
        const city = places.get(a), to = places.get(b);
        if (!city || !to) continue;
        const type = data.routeTypes?.[linkKey(a, b)] || 'land';
        const mainLink = important.has(a) || important.has(b) || (outlets.get(a) || 0) > 2 || (outlets.get(b) || 0) > 2;
        if ((type === 'rail' && (!options.rail || level === 'national' && !mainLink))
          || (type === 'maritime' && !options.maritime)
          || (type === 'land' && (level === 'national' || level === 'theater' && (!mainLink || camera.zoom < 30)))) continue;
        // 跨太平洋 180° 日界线航线：拆分为向东/向西两端出海航道，避免直线横穿整个欧亚大陆！
        if (Math.abs(city.lon - to.lon) > 180) {
          const midLat = (city.lat + to.lat) / 2;
          const eastPt = city.lon > 0 ? city : to;
          const westPt = city.lon > 0 ? to : city;
          line([[eastPt.lon, eastPt.lat], [180, midLat]], '#6eb4d9c8', 1.4, [6, 5]);
          line([[westPt.lon, westPt.lat], [-180, midLat]], '#6eb4d9c8', 1.4, [6, 5]);
          continue;
        }
        const route = [[city.lon, city.lat], [to.lon, to.lat]];
        if (type === 'rail') {
          line(route, '#474b3ec2', level === 'detail' ? 2.5 : mainLink && level === 'theater' ? 2.05 : 1.25);
          line(route, '#e8ddbb', level === 'detail' ? 1.35 : .65, [4, 3]);
        } else if (type === 'maritime') line(route, '#487c9bd9', 1.5, [6, 5]);
        else line(route, '#736b5449', 1, [2, 4]);
      }
    }

    function activeBattleLayers() {
      if (!options.battle) return [];
      const related = { jinzhou: 'liaoshen', tashan: 'liaoshen', changchun: 'liaoshen' }[state.scenarioId] || state.scenarioId || '';
      return (data.battleLayers || []).filter((layer) => layer.id === related || (related === 'huaihai' && layer.id === 'xuzhou-line')
        || state.scope === 'national' || related.startsWith('siping') && layer.id === 'liaoshen');
    }

    function drawCampaigns(layers) {
      const styles = { advance: ['#a64b3ec2', []], defense: ['#3a677aca', [3, 3]],
        rail: ['#a66a35c0', [7, 5]], encirclement: ['#884b72d7', [5, 3]] };
      for (const layer of layers) {
        for (const path of layer.paths || []) {
          const nodes = path.points.map((id) => places.get(id)).filter(Boolean);
          if (nodes.length < 2) continue;
          const positions = nodes.map((city) => [city.lon, city.lat]);
          const [color, dash] = styles[path.kind] || styles.advance;
          line(positions, '#f7e8c68c', 3.8);
          line(positions, color, 1.75, dash);
          if (path.kind === 'advance' || path.kind === 'encirclement') {
            arrowHead(project(...positions.at(-2)), project(...positions.at(-1)), color);
          }
        }
      }
    }

    function drawSupply() {
      if (!options.supply || !selection.supply) return;
      const reading = selection.supply;
      for (const item of reading.bottlenecks ?? []) {
        const from = places.get(item.cities[0]);
        const to = places.get(item.cities[1]);
        if (!from || !to) continue;
        const color = item.side === 'ccp' ? '#f3b199' : '#abd5e9';
        line([[from.lon, from.lat], [to.lon, to.lat]], '#4d2b208f', 5.6);
        line([[from.lon, from.lat], [to.lon, to.lat]], color, 2.2, [3, 4]);
        const [x, y] = project((from.lon + to.lon) / 2, (from.lat + to.lat) / 2);
        if (!inMap(x, y)) continue;
        brush.beginPath();
        brush.arc(x, y, 7.4, 0, Math.PI * 2);
        brush.fillStyle = '#7d2f21e8';
        brush.fill();
        brush.strokeStyle = '#f6d8b0';
        brush.lineWidth = .9;
        brush.stroke();
        brush.fillStyle = '#fff0cf';
        brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
        brush.textAlign = 'center';
        brush.textBaseline = 'middle';
        brush.fillText('滞', x, y + .5);
        brush.textAlign = 'start';
      }
      const occupied = new Map();
      for (const unit of state.units) {
        if (unit.parent || unit.strength <= 0 || unit.inactive) continue;
        occupied.set(unit.city, unit.side);
      }
      for (const [cityId, side] of occupied) {
        const city = places.get(cityId);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const coverage = reading.coverage?.[side]?.[cityId] ?? reading.cities?.[cityId]?.[side];
        if (coverage === undefined) continue;
        const tone = coverage >= 0.85 ? '#74bd86' : coverage >= 0.6 ? '#d9b54f' : '#cf6a4f';
        brush.beginPath();
        brush.arc(x + 6.5, y - 6.5, 3.2, 0, Math.PI * 2);
        brush.fillStyle = tone + 'e8';
        brush.fill();
        brush.strokeStyle = '#2c3a2ff2';
        brush.lineWidth = .7;
        brush.stroke();
        if (coverage >= 0.7) continue;
        const radius = 8 + (1 - coverage) * 10;
        brush.beginPath();
        brush.arc(x, y, radius, 0, Math.PI * 2);
        brush.strokeStyle = coverage < 0.4 ? '#a9301fb8' : '#b07f36b8';
        brush.lineWidth = 1.7;
        brush.setLineDash([2, 3]);
        brush.stroke();
        brush.setLineDash([]);
      }
    }

    function drawForts() {
      if (!options.fort || !state.forts) return;
      for (const [cityId, kinds] of Object.entries(state.forts)) {
        const city = places.get(cityId);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const total = Object.values(kinds).reduce((sum, level) => sum + (Number(level) || 0), 0);
        if (!total) continue;
        const side = state.owners[cityId];
        const frame = side === 'ccp' ? '#5d372c' : '#2c4854';
        const mark = side === 'ccp' ? '#f3c9b1' : '#b9dae7';
        brush.beginPath();
        brush.roundRect(x - 24, y - 6, 15, 11, 2);
        brush.fillStyle = frame + 'f2';
        brush.fill();
        brush.strokeStyle = mark;
        brush.lineWidth = .8;
        brush.stroke();
        brush.fillStyle = mark;
        const teeth = Math.min(4, Math.max(1, total));
        for (let index = 0; index < teeth; index += 1) brush.fillRect(x - 21.6 + index * 3.4, y - 3.6, 2.1, 6);
      }
    }

    function drawIndustry() {
      if (!state.buildings || zoomLevel() === 'national') return;
      for (const [cityId, levels] of Object.entries(state.buildings)) {
        const factories = (Number(levels.militaryFactory) || 0) + (Number(levels.civilianFactory) || 0);
        const work = (state.construction || []).some(item => item.city === cityId);
        if (!factories && !work) continue;
        const city = places.get(cityId);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const color = state.owners[cityId] === 'ccp' ? '#f2c181' : '#a8d2df';
        brush.save();
        brush.translate(x + 9, y + 7);
        brush.fillStyle = '#1e2924eF';
        brush.strokeStyle = color;
        brush.lineWidth = 1;
        brush.beginPath();
        brush.moveTo(-6, 5); brush.lineTo(-6, -2); brush.lineTo(-2, 1);
        brush.lineTo(2, -2); brush.lineTo(6, 1); brush.lineTo(6, 5); brush.closePath();
        brush.fill(); brush.stroke();
        brush.fillRect(2.5, -6, 2.2, 5);
        brush.fillStyle = color;
        if (factories) {
          brush.font = '700 8px "Microsoft YaHei UI", sans-serif';
          brush.textAlign = 'center';
          brush.textBaseline = 'middle';
          brush.fillText(String(factories), 0, 1.5);
        } else {
          brush.beginPath(); brush.arc(0, 1, 1.3, 0, Math.PI * 2); brush.fill();
        }
        brush.restore();
      }
    }

    function drawShip(x, y, color, mission, scale = 1) {
      brush.save();
      brush.translate(x, y);
      brush.scale(scale, scale);
      brush.fillStyle = '#1a2b35eF';
      brush.strokeStyle = color;
      brush.lineWidth = 1.15;
      brush.beginPath();
      brush.moveTo(-13, 1); brush.lineTo(12, 1); brush.lineTo(8, 6); brush.lineTo(-9, 6); brush.closePath();
      brush.fill(); brush.stroke();
      brush.fillStyle = '#c8c5b1';
      brush.fillRect(-4, -4, 9, 5);
      brush.fillRect(0, -7, 2, 3);
      brush.beginPath();
      brush.moveTo(-10, 8); brush.quadraticCurveTo(0, 10, 10, 8);
      brush.strokeStyle = '#d8e9e9b0'; brush.lineWidth = .8; brush.stroke();
      brush.fillStyle = '#fff0c8';
      brush.font = '700 7px "Microsoft YaHei UI", sans-serif';
      brush.textAlign = 'center'; brush.textBaseline = 'middle';
      brush.fillText(({ patrol: '巡', escort: '护', raid: '袭', invasion: '登' })[mission] || '舰', 0, -1);
      brush.restore();
    }

    function drawFleet(x, y, side, mission, count) {
      const columns = Math.min(5, count);
      const size = zoomLevel() === 'detail' ? 76 : zoomLevel() === 'national' ? 38 : 54;
      const color = side === 'ccp' ? '#f2b38e' : '#b4d9e7';
      const activeSea = mission && mission !== 'reserve';
      const action = mission === 'raid' || mission === 'invasion' ? 'attack' : activeSea ? 'march' : 'idle';
      const now = activeSea ? performance.now() : 0;
      for (let index = 0; index < count; index++) {
        const px = x + (index % columns - (columns - 1) / 2) * size * .52;
        const py = y - Math.floor(index / columns) * size * .28;
        if (humanRenderer && options.models3d) {
          brush.drawImage(humanRenderer.frame(side, activeSea, now + index * 140, 'ship', action), px - size / 2, py - size * .62, size, size);
        } else drawShip(px, py, color, mission, .8);
      }
    }

    function drawNavy() {
      const zones = {
        '东北外海': [122.8, 39.3], '黄海': [123.3, 36.1], '东海': [124.4, 29.8],
        '台湾海峡': [119.7, 24.6], '珠江口': [113.9, 21.5],
      };
      const missions = { patrol: '巡逻', escort: '护航', raid: '破交', invasion: '登陆准备' };
      for (const side of ['ccp', 'roc']) {
        const navy = state.navy?.[side];
        const ports = data.cities.filter(city => city.terrain === 'port' && state.owners[city.id] === side)
          .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
        if (!navy || !ports.length) continue;
        const reserve = globalThis.CivilWarHuman3D.fleetIcons(navy).reserve;
        if (reserve <= 0) continue;
        const port = ports[0];
        const [x, y] = project(port.lon + (side === 'ccp' ? -.18 : .18), port.lat + .12);
        if (!inMap(x, y)) continue;
        drawFleet(x, y, side, 'reserve', reserve);
        if (camera.zoom > 28) {
          brush.font = '600 8px "Microsoft YaHei UI", sans-serif';
          brush.textAlign = 'center'; brush.textBaseline = 'middle';
          brush.fillStyle = '#f2ead4'; brush.strokeStyle = '#1b2b32e8'; brush.lineWidth = 2;
          const label = (side === 'ccp' ? '共' : '国') + '海军 · 待命 ' + reserve + '舰';
          brush.strokeText(label, x, y + 16); brush.fillText(label, x, y + 16);
          brush.textAlign = 'start';
        }
      }
      for (const [zone, sides] of Object.entries(state.seaZones || {})) {
        const position = zones[zone];
        if (!position) continue;
        for (const side of ['ccp', 'roc']) {
          const assignment = sides?.[side];
          if (!assignment?.mission) continue;
          const count = globalThis.CivilWarHuman3D.fleetIcons(state.navy?.[side]).zones.get(zone) || 0;
          if (!count) continue;
          const [x, y] = project(position[0], position[1]);
          if (!inMap(x, y)) continue;
          const offset = side === 'ccp' ? -10 : 10;
          drawFleet(x + offset, y, side, assignment.mission, count);
          if (camera.zoom > 28) {
            brush.font = '600 8px "Microsoft YaHei UI", sans-serif';
            brush.textAlign = 'center';
            brush.textBaseline = 'middle';
            brush.fillStyle = '#f2ead4';
            brush.strokeStyle = '#1b2b32e8';
            brush.lineWidth = 2;
            const label = (side === 'ccp' ? '共' : '国') + '海军 · ' + missions[assignment.mission] + ' ' + count + '舰';
            brush.strokeText(label, x + offset, y + 16);
            brush.fillText(label, x + offset, y + 16);
            brush.textAlign = 'start';
          }
        }
      }
    }

    function drawBattles() {
      battleBubbles = [];
      if (!state.battles) return;
      for (const [cityId, battle] of Object.entries(state.battles)) {
        const city = places.get(cityId);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const rawScore = Number.isFinite(battle.bubbleScore) ? battle.bubbleScore : 52;
        const score = Math.max(1, Math.min(99, battle.side === state.player ? rawScore : 100 - rawScore));
        const winning = score >= 50;
        const bx = x + 15, by = y - 13, br = 12;
        battleBubbles.push({ cityId, bx, by, br: br + 4 });
        if (battle.encircled) {
          brush.save();
          brush.beginPath();
          brush.arc(x, y, 22, 0, Math.PI * 2);
          brush.strokeStyle = '#ff4b3ee8';
          brush.lineWidth = 2.4;
          brush.setLineDash([5, 4]);
          brush.stroke();
          brush.restore();
        }
        brush.save();
        brush.beginPath();
        brush.arc(bx, by, br + 2, 0, Math.PI * 2);
        brush.fillStyle = '#151c18e6';
        brush.fill();
        brush.beginPath();
        brush.arc(bx, by, br, 0, Math.PI * 2);
        brush.fillStyle = winning ? '#278e46f2' : '#c6352ef2';
        brush.fill();
        brush.beginPath();
        brush.arc(bx, by, br, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (score / 100));
        brush.strokeStyle = winning ? '#9ef7b0' : '#ffb0a0';
        brush.lineWidth = 2.4;
        brush.stroke();
        brush.fillStyle = '#ffffff';
        brush.font = '700 10px "Microsoft YaHei UI", sans-serif';
        brush.textAlign = 'center';
        brush.textBaseline = 'middle';
        brush.fillText(String(score), bx, by + 0.5);
        if (battle.days > 1) {
          brush.font = '600 8px "Microsoft YaHei UI", sans-serif';
          brush.fillStyle = '#ffe5b0';
          brush.fillText((battle.encircled ? '饺·' : '') + battle.days + '日', bx, by + br + 7);
        }
        brush.restore();
      }
    }

    function drawPlans() {
      if (!selection.plans) return;
      for (const plan of selection.plans) {
        const target = places.get(plan.target);
        if (!target) continue;
        const isFallback = plan.stance === 'fallback' || plan.stance === 'hold';
        const color = isFallback ? '#6fc0f0' : (plan.side === 'ccp' ? '#f69e7a' : '#8fd2f0');
        const fillArrow = isFallback ? 'rgba(111,192,240,0.30)' : (plan.side === 'ccp' ? 'rgba(246,142,102,0.34)' : 'rgba(122,198,238,0.34)');
        const segments = (plan.resolvedLine ?? plan.line ?? []).map((id) => places.get(id)).filter(Boolean);
        if (segments.length > 1) {
          const points = segments.map((city) => [city.lon, city.lat]);
          line(points, '#1b2622cc', 6.2);
          line(points, isFallback ? '#6fc0f0' : '#f4d49a', 2.8, isFallback ? [8, 4] : [6, 3]);
          for (const city of segments) {
            const [x, y] = project(city.lon, city.lat);
            if (!inMap(x, y)) continue;
            brush.beginPath();
            brush.rect(x - 3.6, y - 3.6, 7.2, 7.2);
            brush.fillStyle = isFallback ? '#bce8ff' : '#f7e3b4';
            brush.fill();
            brush.strokeStyle = '#24312a';
            brush.lineWidth = 1.1;
            brush.stroke();
          }
        }
        const origins = new Set();
        for (const id of plan.units) {
          const unit = state.units.find(member => member.id === id && member.strength > 0);
          const city = unit && places.get(unit.city);
          if (city && city.id !== plan.target) origins.add(city);
        }
        const staging = plan.front ? places.get(plan.front) : null;
        const drawBroadArrow = (from, to) => {
          const a = project(from.lon, from.lat), b = project(to.lon, to.lat);
          const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
          const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (dist < 16) return;
          const headLen = Math.min(20, dist * 0.35), shaftW = 5.5;
          const nx = -Math.sin(angle), ny = Math.cos(angle);
          const endX = b[0] - Math.cos(angle) * headLen, endY = b[1] - Math.sin(angle) * headLen;
          brush.save();
          brush.beginPath();
          brush.moveTo(a[0] + nx * shaftW, a[1] + ny * shaftW);
          brush.lineTo(endX + nx * shaftW, endY + ny * shaftW);
          brush.lineTo(endX + nx * (shaftW * 2.1), endY + ny * (shaftW * 2.1));
          brush.lineTo(b[0], b[1]);
          brush.lineTo(endX - nx * (shaftW * 2.1), endY - ny * (shaftW * 2.1));
          brush.lineTo(endX - nx * shaftW, endY - ny * shaftW);
          brush.lineTo(a[0] - nx * shaftW, a[1] - ny * shaftW);
          brush.closePath();
          brush.fillStyle = fillArrow;
          brush.fill();
          brush.strokeStyle = color;
          brush.lineWidth = 1.6;
          if (plan.status === 'paused') brush.setLineDash([4, 4]);
          brush.stroke();
          brush.restore();
        };
        for (const city of origins) {
          if (staging && staging.id !== city.id && staging.id !== plan.target) {
            drawBroadArrow(city, staging);
            drawBroadArrow(staging, target);
          } else {
            drawBroadArrow(city, target);
          }
        }
        const [x, y] = project(target.lon, target.lat);
        if (!inMap(x, y)) continue;
        brush.beginPath();
        brush.moveTo(x, y - 10);
        brush.lineTo(x + 10, y);
        brush.lineTo(x, y + 10);
        brush.lineTo(x - 10, y);
        brush.closePath();
        brush.strokeStyle = '#2b1f16d9';
        brush.lineWidth = 3.4;
        brush.stroke();
        brush.strokeStyle = color;
        brush.lineWidth = 1.7;
        brush.stroke();
        brush.font = '600 10px "Microsoft YaHei UI", sans-serif';
        brush.textAlign = 'center';
        brush.fillStyle = '#ffecc6';
        brush.strokeStyle = '#2a2119d9';
        brush.lineWidth = 2.6;
        const label = (plan.status === 'paused' ? '暂停 · ' : '计划 · ') + String(plan.name || '').slice(0, 14);
        brush.strokeText(label, x, y - 16);
        brush.fillText(label, x, y - 16);
        brush.textAlign = 'start';
      }
    }

    function inMap(x, y) { return x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10; }

    const factionZoneColors = {
      ccp: '#9e3c38', roc: '#8c8349', qingma: '#61557a', ningma: '#6e5e87',
      xinjiang: '#3f7366', xizang: '#5b6b59', dianxi: '#466b43', chuanxi: '#6c754b',
      guixi: '#395e54', yuejun: '#51705a', jinsui: '#5d493f', suiyuan: '#6e5745',
    };

    function drawControl() {
      const national = zoomLevel() === 'national';
      const supplyHeat = Boolean(options.supply);
      const factionMode = options.mode === 'faction';
      const situationMode = options.mode === 'situation';
      const showFill = situationMode || factionMode || supplyHeat || national;
      const radius = national ? clamp(camera.zoom * 1.9, 16, 42) : clamp(camera.zoom * 1.05, 16, 54);
      if ((situationMode || factionMode) && !supplyHeat) {
        const nodes = territoryNodes(data, state, factionMode);
        const signature = nodes.map(node => node.id + ':' + node.owner + ':' + node.group).join(',');
        const legend = document.getElementById('faction-key');
        if (legend) {
          legend.hidden = !factionMode;
          if (factionMode && factionLegendKey !== signature) {
            factionLegendKey = signature;
            const groupIds = [...new Set(nodes.filter(node => node.owner === 'roc' && factionZoneColors[node.group]).map(node => node.group))];
            const entries = [[sideNames.ccp, factionZoneColors.ccp], [sideNames.roc + '（未归派系）', '#3c5e78'],
              ...groupIds.map(id => [groups.get(id)?.name || id, factionZoneColors[id]])];
            legend.replaceChildren(...entries.map(([name, color]) => {
              const row = document.createElement('span'), swatch = document.createElement('i');
              swatch.style.background = color;
              row.append(swatch, document.createTextNode(name));
              return row;
            }));
          }
        }
        const key = [width, height, camera.lon, camera.lat, camera.zoom, options.mode, data.theaterMode || 'civil', signature].join('|');
        if (key !== territoryKey) {
          territoryKey = key;
          const step = 8;
          const maxRadius = data.theaterMode === 'ww2' ? 11.5 : data.theaterMode === 'korea' ? 2.6 : 3.5;
          const maxSq = maxRadius * maxRadius;
          const tw = Math.ceil(width / step);
          const th = Math.ceil(height / step);
          territoryCanvas.width = tw;
          territoryCanvas.height = th;
          const pixels = territoryBrush.createImageData(tw, th);
          const alphaVal = camera.zoom >= 400 ? 48 : camera.zoom >= 120 ? 78 : (data.theaterMode === 'ww2' ? 105 : 130);

          // 空间哈希网格索引：只查询当前像素周边 3×3 网格内城市，把单帧计算从 2000 万次降到 < 8 万次！
          const [vMinLon, vMaxLon, vMinLat, vMaxLat] = viewportGeoBounds();
          const cellSize = Math.max(1.2, maxRadius);
          const gridBuckets = new Map();
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.lat < vMinLat - maxRadius || node.lat > vMaxLat + maxRadius) continue;
            const dLon = wrapDeltaLon(node.lon);
            const approxLon = camera.lon + dLon;
            if (approxLon < vMinLon - maxRadius - 2 || approxLon > vMaxLon + maxRadius + 2) continue;
            const colorHex = factionMode && node.owner === 'roc' && factionZoneColors[node.group]
              ? factionZoneColors[node.group] : node.owner === 'ccp' ? '#9e3c38' : '#3c5e78';
            const rCol = parseInt(colorHex.slice(1, 3), 16);
            const gCol = parseInt(colorHex.slice(3, 5), 16);
            const bCol = parseInt(colorHex.slice(5, 7), 16);
            const entry = { lon: node.lon, lat: node.lat, r: rCol, g: gCol, b: bCol };
            const gx = Math.floor(normalizeLon(node.lon) / cellSize);
            const gy = Math.floor(node.lat / cellSize);
            const bk = gx * 10000 + gy;
            let arr = gridBuckets.get(bk);
            if (!arr) { arr = []; gridBuckets.set(bk, arr); }
            arr.push(entry);
          }

          if (gridBuckets.size > 0) {
            for (let y = 0; y < th; y++) {
              const lat = camera.lat - ((y + .5) * step - height / 2) / camera.zoom;
              const gy = Math.floor(lat / cellSize);
              for (let x = 0; x < tw; x++) {
                const lon = normalizeLon(camera.lon + ((x + .5) * step - width / 2) / (camera.zoom * .76));
                const gx = Math.floor(lon / cellSize);
                let best = maxSq;
                let nearestNode = null;
                for (let oy = -1; oy <= 1; oy++) {
                  const cy = gy + oy;
                  for (let ox = -1; ox <= 1; ox++) {
                    const arr = gridBuckets.get((gx + ox) * 10000 + cy);
                    if (!arr) continue;
                    for (let k = 0; k < arr.length; k++) {
                      const n = arr[k];
                      let dl = Math.abs(lon - n.lon);
                      if (dl > 180) dl = 360 - dl;
                      const dx = dl * .76;
                      const dy = lat - n.lat;
                      const d2 = dx * dx + dy * dy;
                      if (d2 < best) { best = d2; nearestNode = n; }
                    }
                  }
                }
                if (!nearestNode) continue;
                const offset = (y * tw + x) * 4;
                pixels.data[offset] = nearestNode.r;
                pixels.data[offset + 1] = nearestNode.g;
                pixels.data[offset + 2] = nearestNode.b;
                pixels.data[offset + 3] = alphaVal;
              }
            }
          }
          territoryBrush.putImageData(pixels, 0, 0);

          // 仅在视角或归属变化时执行一次硬件蒙版/陆地裁剪，动画帧直接 0.05ms GPU 贴图！
          if (territoryClipped.width !== width || territoryClipped.height !== height) {
            territoryClipped.width = width;
            territoryClipped.height = height;
          }
          territoryClippedBrush.clearRect(0, 0, width, height);
          territoryClippedBrush.save();
          if (camera.zoom < 45) {
            // 三大战区统一走硬件蒙版 destination-in 裁剪（0.2ms，彻底告别 CPU 路径 clip！）
            const maskTex = data.theaterMode ? (ensureWorldLandMask(), worldLandMask) : (ensureChinaLandMask(), chinaLandMask);
            territoryClippedBrush.imageSmoothingEnabled = true;
            territoryClippedBrush.drawImage(territoryCanvas, 0, 0, width, height);
            territoryClippedBrush.globalCompositeOperation = 'destination-in';
            blitWorldTexture(territoryClippedBrush, maskTex, maskTex.width, maskTex.height);
          } else {
            const clipRings = data.theaterMode ? land : (geography?.boundary?.length ? geography.boundary : land);
            shape(territoryClippedBrush, clipRings);
            territoryClippedBrush.clip();
            territoryClippedBrush.imageSmoothingEnabled = true;
            territoryClippedBrush.drawImage(territoryCanvas, 0, 0, width, height);
          }
          territoryClippedBrush.restore();
        }
        brush.drawImage(territoryClipped, 0, 0, width, height);
      } else if (showFill) {
        brush.save();
        shape(brush, land);
        brush.clip();
        for (const city of data.cities) {
          const [x, y] = project(city.lon, city.lat);
          if (!inMap(x, y)) continue;
          let color = state.owners[city.id] === 'ccp' ? '#9e3c38' : '#3c5e78';
          let alpha = situationMode || factionMode ? '56' : supplyHeat ? '5a' : '2c';
          if (supplyHeat && selection.supply?.coverage) {
            const cov = selection.supply.coverage[state.player]?.[city.id];
            if (cov !== undefined) color = cov >= 0.85 ? '#2b82cc' : cov >= 0.45 ? '#cc8824' : '#c4322b';
            else color = '#46544e';
          }
          const halo = brush.createRadialGradient(x, y, 2, x, y, radius);
          halo.addColorStop(0, color + alpha);
          halo.addColorStop(0.65, color + (situationMode || factionMode || supplyHeat ? '2c' : '10'));
          halo.addColorStop(1, color + '00');
          brush.fillStyle = halo;
          brush.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        brush.restore();
      }
      // 补给模式下高亮加粗铁路干线，一眼看清截断铁路包饺子路线
      if (supplyHeat) {
        brush.save();
        brush.lineWidth = national ? 2.4 : 3.6;
        brush.strokeStyle = '#7ad4ffcc';
        for (const link of data.links) {
          if (data.routeTypes?.[linkKey(link[0], link[1])] !== 'rail') continue;
          const a = places.get(link[0]), b = places.get(link[1]);
          if (!a || !b) continue;
          const pa = project(a.lon, a.lat), pb = project(b.lon, b.lat);
          if (!inMap(pa[0], pa[1]) && !inMap(pb[0], pb[1])) continue;
          brush.beginPath(); brush.moveTo(pa[0], pa[1]); brush.lineTo(pb[0], pb[1]); brush.stroke();
        }
        brush.restore();
      }
      // 绘制国共对峙前线交界虚线（钢4红蓝战线视觉）
      brush.save();
      brush.lineWidth = national ? 1.8 : 2.6;
      brush.strokeStyle = '#ff6b52cc';
      brush.setLineDash([4, 3]);
      for (const link of data.links) {
        const aId = link[0], bId = link[1];
        if (state.owners[aId] === state.owners[bId]) continue;
        const a = places.get(aId), b = places.get(bId);
        if (!a || !b || Math.abs(a.lon - b.lon) > 180) continue;
        const pa = project(a.lon, a.lat), pb = project(b.lon, b.lat);
        if (!inMap(pa[0], pa[1]) && !inMap(pb[0], pb[1])) continue;
        const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
        const dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 9, ny = (dx / len) * 9;
        brush.beginPath();
        brush.moveTo(mx - nx, my - ny);
        brush.lineTo(mx + nx, my + ny);
        brush.stroke();
      }
      brush.restore();
    }

    function cityPreview(cityId) {
      const results = selection.previews?.get?.(cityId) || selection.previews?.[cityId];
      if (!results) return undefined;
      const type = selection.command || (results.move?.ok ? 'move' : 'advance');
      return results[type] && { type, result: results[type] };
    }

    function drawTarget(city, x, y) {
      const preview = cityPreview(city.id);
      if (!preview?.result.ok || !orderStyles[preview.type]) return;
      const radius = highlightedCity === city.id ? 10 : 8;
      brush.beginPath();
      if (['move', 'defend', 'entrench', 'rest'].includes(preview.type)) {
        brush.roundRect(x - radius, y - radius, radius * 2, radius * 2, 3);
      } else {
        brush.moveTo(x, y - radius - 2);
        brush.lineTo(x + radius + 2, y);
        brush.lineTo(x, y + radius + 2);
        brush.lineTo(x - radius - 2, y);
        brush.closePath();
      }
      brush.strokeStyle = '#fff3cbd9';
      brush.lineWidth = 4;
      brush.stroke();
      brush.strokeStyle = orderStyles[preview.type].color;
      brush.lineWidth = 2;
      brush.stroke();
    }

    function drawCities(layers) {
      const level = zoomLevel();
      const marked = new Set(layers.flatMap((layer) => layer.points || []));
      const awarded = [];
      const rank = (city) => (city.id === selection.city ? 80 : 0) + (city.id === highlightedCity ? 60 : 0)
        + (cityPreview(city.id)?.result.ok ? 30 : 0)
        + (marked.has(city.id) ? 24 : 0) + (important.has(city.id) ? 12 : 0) + city.value;
      for (const city of data.cities.slice().sort((a, b) => rank(b) - rank(a))) {
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const selected = city.id === selection.city;
        const major = important.has(city.id) || city.value >= 6;
        const station = city.terrain === 'rail' || (outlets.get(city.id) || 0) >= 3;
        const side = state.owners[city.id];
        const highlight = marked.has(city.id);
        const focused = highlightedCity === city.id;
        const valid = cityPreview(city.id)?.result.ok;
        if (selected || highlight) {
          brush.beginPath();
          brush.arc(x, y, selected ? 9 : 6.2, 0, Math.PI * 2);
          brush.fillStyle = selected ? '#fff2be' : '#eed6a97a';
          brush.fill();
          brush.strokeStyle = selected ? '#6e5331' : '#a0714f';
          brush.lineWidth = 1;
          brush.stroke();
        }
        drawTarget(city, x, y);
        const radius = selected || major ? 3.4 : level === 'national' ? 1.1 : 2.25;
        brush.beginPath();
        if (station && level !== 'national') brush.rect(x - radius, y - radius, radius * 2, radius * 2);
        else brush.arc(x, y, radius, 0, Math.PI * 2);
        brush.fillStyle = sideColors[side] || '#777052';
        brush.strokeStyle = '#f1e5bd';
        brush.lineWidth = .8;
        brush.fill();
        brush.stroke();
        if (city.terrain === 'port' && level !== 'national') {
          brush.save();
          brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
          brush.fillStyle = '#9be0ff';
          brush.strokeStyle = '#14232be6';
          brush.lineWidth = 2.4;
          brush.strokeText('⚓', x - 11, y - 5);
          brush.fillText('⚓', x - 11, y - 5);
          brush.restore();
        }
        if (options.supply && (Number(city.value) || 0) >= 5 && level !== 'national') {
          brush.save();
          brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
          brush.fillStyle = '#ffe599';
          brush.fillText('🏠', x + 5, y - 6);
          brush.restore();
        }
        if (state.railCooldown?.[city.id] > 0 && level !== 'national') {
          brush.save();
          brush.font = '700 8px "Microsoft YaHei UI", sans-serif';
          brush.fillStyle = '#ffae66';
          brush.strokeStyle = '#241810e6';
          brush.lineWidth = 2.2;
          const cool = '修路' + state.railCooldown[city.id] + '日';
          brush.strokeText(cool, x - 14, y - 13);
          brush.fillText(cool, x - 14, y - 13);
          brush.restore();
        }
        if (selected || major || highlight && level !== 'national' || focused || valid && selection.command
          || level === 'detail' || level === 'theater' && station && camera.zoom > 45) {
          const name = city.name.split('（')[0];
          brush.font = (major || selected ? '700 ' : '500 ') + (selected ? 14 : major ? 12 : 10) + 'px "Microsoft YaHei UI", sans-serif';
          brush.textBaseline = 'middle';
          const length = brush.measureText(name).width;
          const spacing = valid ? 13 : 7;
          const candidates = [[x + spacing, y], [x - spacing - length, y], [x - length / 2, y - 13], [x - length / 2, y + 14]];
          const position = candidates.find(([left, center]) => left > 2 && left + length < width - 2
            && !awarded.some((box) => left + length + 3 > box[0] && left - 3 < box[1] && Math.abs(center - box[2]) < 12));
          if (!position) continue;
          const [left, center] = position;
          awarded.push([left, left + length, center]);
          brush.strokeStyle = '#eee4c6de';
          brush.lineWidth = 2.8;
          brush.strokeText(name, left, center);
          brush.fillStyle = '#27362d';
          brush.fillText(name, left, center);
        }
      }
    }

    function drawSoldier(x, y, color, scale, stride = 0, bayonet = false) {
      brush.save();
      brush.translate(x, y);
      brush.scale(scale, scale);
      brush.lineCap = 'round';
      brush.lineJoin = 'round';
      brush.fillStyle = '#101a1680'; brush.beginPath(); brush.ellipse(0, 7, 7, 2.3, 0, 0, Math.PI * 2); brush.fill();
      brush.strokeStyle = '#292c25'; brush.lineWidth = 2.8;
      brush.beginPath(); brush.moveTo(-.6, -.6); brush.lineTo(-2.7, 4 + stride); brush.lineTo(-4.2, 6 + stride);
      brush.moveTo(.6, -.6); brush.lineTo(2.6, 3 - stride); brush.lineTo(3.8, 6 - stride); brush.stroke();
      brush.fillStyle = '#4b4b36'; brush.strokeStyle = '#252b24'; brush.lineWidth = .8;
      brush.beginPath(); brush.roundRect(-4, -7, 3.2, 7, .8); brush.fill(); brush.stroke();
      const coat = brush.createLinearGradient(-3, -7, 3, 0);
      coat.addColorStop(0, '#77755b'); coat.addColorStop(.55, color); coat.addColorStop(1, '#514c39');
      brush.fillStyle = coat; brush.beginPath(); brush.moveTo(-2.8, -7); brush.lineTo(2, -7);
      brush.lineTo(3.1, -.8); brush.lineTo(-2.5, .5); brush.closePath(); brush.fill(); brush.stroke();
      brush.strokeStyle = '#353729'; brush.lineWidth = .75; brush.beginPath(); brush.moveTo(-2, -2); brush.lineTo(2.6, -2.4); brush.stroke();
      brush.fillStyle = '#c2a27d'; brush.beginPath(); brush.arc(.1, -8.6, 2.1, 0, Math.PI * 2); brush.fill();
      brush.fillStyle = '#353c2d'; brush.beginPath(); brush.ellipse(0, -10.2, 3.1, 1.9, 0, Math.PI, Math.PI * 2); brush.lineTo(3.6, -10); brush.lineTo(-3.5, -10); brush.closePath(); brush.fill();
      brush.strokeStyle = '#89866a'; brush.lineWidth = .6; brush.beginPath(); brush.moveTo(-2.4, -10.5); brush.lineTo(2.4, -10.5); brush.stroke();
      brush.strokeStyle = '#625a42'; brush.lineWidth = 2; brush.beginPath(); brush.moveTo(-2, -5); brush.lineTo(2.7, -6); brush.stroke();
      brush.beginPath(); brush.moveTo(1, -5); brush.lineTo(8, -6.5); brush.lineTo(9.5, -5.5);
      brush.strokeStyle = '#282c26'; brush.lineWidth = 1.4; brush.stroke();
      if (bayonet) {
        brush.beginPath(); brush.moveTo(9.5, -5.5); brush.lineTo(14, -6.4);
        brush.strokeStyle = '#f5e9ca'; brush.lineWidth = .8; brush.stroke();
      }
      brush.restore();
    }

    function drawHuman(x, y, side, scale, moving, now, bayonet = false, action = moving ? 'march' : 'idle', variant = '') {
      if (pointer?.marquee && pointer.moved && pointer.end) {
        const x0 = Math.min(pointer.where[0], pointer.end[0]), y0 = Math.min(pointer.where[1], pointer.end[1]);
        const bw = Math.abs(pointer.end[0] - pointer.where[0]), bh = Math.abs(pointer.end[1] - pointer.where[1]);
        brush.save();
        brush.fillStyle = 'rgba(224, 193, 138, 0.16)';
        brush.strokeStyle = '#f3d48c';
        brush.lineWidth = 1.6;
        brush.setLineDash([5, 3]);
        brush.fillRect(x0, y0, bw, bh);
        brush.strokeRect(x0, y0, bw, bh);
        brush.restore();
      }
      if (!humanRenderer) {
        drawSoldier(x, y, side === 'ccp' ? '#e6a38d' : '#acd0dc', scale,
          moving ? Math.sin(now / 115) * 1.6 : 0, bayonet);
        return;
      }
      const size = 42 * scale;
      brush.drawImage(humanRenderer.frame(side, moving, now, 'human', action, variant), x - size / 2, y - size * .94, size, size);
    }

    function drawUnitSprite(unit, x, y, index = 0, members = 1, moving = false, now = 0) {
      const rawProfile = unit.profile || unit.branch || 'infantry';
      const profile = rawProfile === 'armor' || rawProfile === 'tank' ? 'mobile' : rawProfile;
      const color = unit.side === 'ccp' ? '#e6a38d' : '#acd0dc';
      const detail = zoomLevel() === 'detail';
      const scale = detail ? clamp(camera.zoom / 60, 1.35, 2.1) : clamp(camera.zoom / 58, .76, 1.28);
      const offset = (index - (Math.min(members, 3) - 1) / 2) * (detail ? 20 : 11);
      if (humanRenderer) {
        const px = x + offset, py = y - (moving ? 2 : 12);
        const kind = profile === 'artillery' ? 'artillery' : profile === 'mobile' ? 'tank' : 'human';
        const size = (kind === 'human' ? 38 : 42) * scale;
        brush.drawImage(humanRenderer.frame(unit.side, moving, now, kind, moving ? 'march' : 'idle', unit.group || ''),
          px - size / 2, py - size * .85, size, size);
        return;
      }
      brush.save();
      brush.translate(x + offset, y - (moving ? 0 : 12));
      brush.scale(scale, scale);
      brush.fillStyle = '#17211ddd';
      brush.strokeStyle = color;
      brush.lineWidth = 1.1;
      brush.beginPath(); brush.arc(0, 0, 10, 0, Math.PI * 2); brush.fill(); brush.stroke();
      brush.restore();
      if (profile === 'artillery') {
        const px = x + offset, py = y - (moving ? 11 : 23);
        brush.save(); brush.translate(px, py); brush.scale(scale, scale);
        brush.fillStyle = '#101a1690'; brush.beginPath(); brush.ellipse(0, 8, 11, 2.8, 0, 0, Math.PI * 2); brush.fill();
        brush.fillStyle = '#666952'; brush.strokeStyle = '#252b25'; brush.lineWidth = 1;
        brush.beginPath(); brush.moveTo(-3, -4); brush.lineTo(2, -5); brush.lineTo(4, 1); brush.lineTo(-2, 2); brush.closePath(); brush.fill(); brush.stroke();
        brush.strokeStyle = '#252b25'; brush.lineWidth = 2.2;
        brush.beginPath(); brush.moveTo(-5, 4); brush.lineTo(4, 0); brush.lineTo(9, -3); brush.stroke();
        brush.strokeStyle = color; brush.lineWidth = 1.5;
        brush.beginPath(); brush.moveTo(-3, 1); brush.lineTo(7, -5); brush.stroke();
        for (const wheel of [-4, 3]) {
          brush.beginPath(); brush.arc(wheel, 5, 3, 0, Math.PI * 2); brush.fillStyle = '#343a30'; brush.fill();
          brush.strokeStyle = color; brush.lineWidth = 1; brush.stroke();
          brush.beginPath(); brush.arc(wheel, 5, 1, 0, Math.PI * 2); brush.fillStyle = '#b4ad8c'; brush.fill();
        }
        brush.restore();
        return;
      }
      if (profile === 'mobile') {
        const px = x + offset, py = y - (moving ? 11 : 23);
        brush.save(); brush.translate(px, py); brush.scale(scale, scale);
        brush.fillStyle = '#101a1690'; brush.beginPath(); brush.ellipse(0, 9, 12, 3, 0, 0, Math.PI * 2); brush.fill();
        brush.fillStyle = '#252b25'; brush.strokeStyle = color; brush.lineWidth = 1.1;
        brush.beginPath(); brush.roundRect(-10, 1, 20, 7, 3); brush.fill(); brush.stroke();
        for (const wheel of [-7, -3.5, 0, 3.5, 7]) {
          brush.beginPath(); brush.arc(wheel, 4.5, 1.65, 0, Math.PI * 2);
          brush.fillStyle = '#606651'; brush.fill(); brush.strokeStyle = color; brush.lineWidth = .55; brush.stroke();
        }
        brush.fillStyle = '#657250'; brush.strokeStyle = color; brush.lineWidth = 1.1;
        brush.beginPath(); brush.moveTo(-7, 1); brush.lineTo(-5, -3); brush.lineTo(5, -3);
        brush.lineTo(8, 1); brush.closePath(); brush.fill(); brush.stroke();
        brush.beginPath(); brush.roundRect(-3.5, -5, 7, 3.5, 1); brush.fill(); brush.stroke();
        brush.strokeStyle = '#a6a886'; brush.lineWidth = .7;
        brush.beginPath(); brush.moveTo(-5, -.5); brush.lineTo(5, -.5); brush.moveTo(-2, -4.2); brush.lineTo(2, -4.2); brush.stroke();
        brush.beginPath(); brush.moveTo(1, -3.4); brush.lineTo(10, -4.5);
        brush.strokeStyle = '#d4c8a6'; brush.lineWidth = 1.8; brush.stroke();
        brush.restore();
        return;
      }
      drawHuman(x + offset - (profile === 'mixed' ? 3 : 0), y - (moving ? 5 : 17), unit.side,
        scale * .9, moving, now);
      if (profile === 'mixed') {
        brush.save(); brush.translate(x + offset + 5, y - (moving ? 8 : 20)); brush.scale(scale * .62, scale * .62);
        brush.strokeStyle = '#252b25'; brush.lineWidth = 2;
        brush.beginPath(); brush.moveTo(-3, 3); brush.lineTo(3, 0); brush.lineTo(8, -3); brush.stroke();
        brush.strokeStyle = color; brush.lineWidth = 1.4; brush.beginPath(); brush.moveTo(0, 1); brush.lineTo(8, -5); brush.stroke();
        brush.beginPath(); brush.arc(-2, 4, 2.6, 0, Math.PI * 2); brush.fillStyle = '#343a30'; brush.fill(); brush.stroke();
        brush.restore();
      }
    }

    function deployed() {
      const active = state.units.filter((unit) => unit.strength > 0 && !unit.inactive);
      const byId = new Map(active.map((unit) => [unit.id, unit]));
      return active.filter((unit) => {
        if (!unit.parent || unit.id === selection.unit) return true;
        const parent = byId.get(unit.parent);
        return parent && ((zoomLevel() === 'detail' && unit.level === 'division') || (parent.city !== unit.city && (unit.side === state.player || camera.zoom > 72)));
      });
    }

    function nationalUnits(units) {
      const groups = new Map();
      for (const unit of units) {
        if (unit.parent || !places.has(unit.city)) continue;
        const key = unit.area + '|' + unit.side;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(unit);
      }
      for (const members of groups.values()) {
        const unit = members[0];
        const points = members.map((member) => places.get(member.city));
        const [x, y] = project(...['lon', 'lat'].map((key) => points.reduce((sum, p) => sum + p[key], 0) / points.length));
        const horizontal = unit.side === 'ccp' ? -46 : 3;
        const positions = [0, -21, 21, -42, 42, -63, 63].map((dy) => [x + horizontal, y + dy]);
        const fit = positions.find(([left, top]) => inMap(left, top) && !hitCards.some((marker) =>
          Math.abs(marker.left - left) < 52 && Math.abs(marker.top - top) < 19));
        if (!fit) continue;
        const [left, top] = fit;
        brush.fillStyle = unit.side === 'ccp' ? '#694237f3' : '#39596bf3';
        brush.beginPath();
        brush.roundRect(left, top, 52, 18, 3);
        brush.fill();
        brush.font = '10px "Microsoft YaHei UI", sans-serif';
        brush.textBaseline = 'middle';
        brush.fillStyle = '#fff2d5';
        brush.fillText((regionNames[unit.area] || '战区') + ' ' + members.length, left + 4, top + 9);
        hitCards.push({ unit, stack: members.map((member) => member.id), national: true, left, top, width: 52, height: 18 });
      }
    }

      const spriteBounds = new WeakMap();
      function drawCroppedSprite(sprite, x, y, w, h) {
        let bounds = spriteBounds.get(sprite);
        if (!bounds) {
          const sw = sprite.width, sh = sprite.height, pixels = sprite.getContext('2d').getImageData(0, 0, sw, sh).data;
          let left = sw, right = -1, top = sh, bottom = -1;
          for (let yy = 0; yy < sh; yy++) for (let xx = 0; xx < sw; xx++) if (pixels[(yy * sw + xx) * 4 + 3] > 8) {
            left = Math.min(left, xx); right = Math.max(right, xx); top = Math.min(top, yy); bottom = Math.max(bottom, yy);
          }
          bounds = right >= left ? {left, top, width: right-left+1, height: bottom-top+1} : {left: 0, top: 0, width: sw, height: sh};
          spriteBounds.set(sprite, bounds);
        }
        const scale = Math.min(w / bounds.width, h / bounds.height);
        const dw = bounds.width * scale, dh = bounds.height * scale;
        brush.drawImage(sprite, bounds.left, bounds.top, bounds.width, bounds.height, x + (w-dw)/2, y + h-dh, dw, dh);
      }

    function drawUnits() {
      hitCards = [];
      const units = deployed();
      const parentIds = new Set(state.units.map(member => member.parent).filter(Boolean));
      const unitById = new Map(state.units.map(member => [member.id, member]));
      const localStrength = globalThis.CivilWarHuman3D.formationStrengthByCity(state.units);
      const chosen = new Set(selection.units ?? []);
      const national = zoomLevel() === 'national';
      const nightMode = Boolean(state.nightMode);
      const now = performance.now();

      const priority = (unit) => (unit.id === selection.unit ? 10_000 : 0) + (chosen.has(unit.id) ? 9_000 : 0)
        + (unit.id === selection.guideUnit ? 8_000 : 0)
        + (unit.side === state.player ? 1_000 : 0) + Math.min(unit.strength / 100, 900);
      const candidates = units.filter((unit) => !national || !unit.parent || unit.id === selection.unit)
        .sort((a, b) => priority(b) - priority(a));

      // 已显示的下级从上级的显示人物中扣除，避免同一兵员重复绘制。
      const visibleById = new Map(candidates.map(unit => [unit.id, unit]));
      const shownChildren = new Map();
      for (const child of candidates) {
        let parent = unitById.get(child.parent);
        while (parent) {
          if (visibleById.has(parent.id) && parent.city === child.city && parent.side === child.side) {
            const key = parent.id + '|' + child.city;
            shownChildren.set(key, (shownChildren.get(key) || 0) + (localStrength.get(child.id + '|' + child.city) || 0));
            break;
          }
          parent = unitById.get(parent.parent);
        }
      }
      // 按城市分组，同城多支纵队/军独立扇形排开，每支纵队拥有独立三维兵阵与独立可点击标牌！
      const byCity = new Map();
      for (const unit of candidates) {
        const key = unit.city + '|' + unit.side;
        if (!byCity.has(key)) byCity.set(key, []);
        byCity.get(key).push(unit);
      }

      const cityGroups = [...byCity.values()].sort((a, b) => {
        const score = (list) => (list.some((u) => u.id === selection.unit || u.id === selection.guideUnit) ? 10 : 0)
          + (list[0].city === selection.city ? 4 : 0)
          + (list[0].side === state.player ? 2 : 0);
        return score(b) - score(a);
      });

      for (const members of cityGroups) {
        const anchorCity = places.get(members[0].city);
        if (!anchorCity) continue;
        const [cx, cy] = project(anchorCity.lon, anchorCity.lat);
        if (!inMap(cx, cy)) continue;

        const show3D = Boolean(options.models3d) && Boolean(humanRenderer);

        members.forEach((unit, idx) => {
          const totalInSide = members.length;
          const ringSlot = idx === 0 ? 0 : (idx % 2 === 1 ? Math.ceil(idx / 2) : -Math.ceil(idx / 2));
          let ux = cx, uy = cy;
          if (unit.camp?.distKm > 0 && Number.isFinite(unit.camp.lon) && Number.isFinite(unit.camp.lat)) {
            [ux, uy] = project(unit.camp.lon, unit.camp.lat);
            brush.save();
            brush.strokeStyle = 'rgba(240, 208, 128, 0.72)';
            brush.lineWidth = 1.1;
            brush.setLineDash([3, 3]);
            brush.beginPath();
            brush.moveTo(cx, cy);
            brush.lineTo(ux, uy);
            brush.stroke();
            brush.setLineDash([]);
            brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
            brush.fillStyle = '#ffe599';
            brush.textAlign = 'center';
            brush.fillText('⛺ ' + unit.camp.distKm + 'km', ux, uy + 24);
            brush.restore();
          } else if (ringSlot !== 0) {
            const spread = national ? 48 : zoomLevel() === 'detail' ? 86 : 68;
            ux = cx + ringSlot * spread;
            uy = cy + (unit.side === 'ccp' ? -Math.abs(ringSlot) * 7 : Math.abs(ringSlot) * 7);
          }

          // 宏观/战区缩放下同城次级非选中单位直接聚合进首牌（不再额外堆叠 3D 兵墙与重叠标签），点开首牌即可查看全城纵队
          const focusedEarly = unit.id === selection.unit || unit.id === selection.guideUnit || chosen.has(unit.id);
          if (idx > 0 && !focusedEarly && camera.zoom < 40) {
            const primaryCard = hitCards.find((rect) => !rect.figureHit && rect.primary && rect.unit?.city === unit.city && rect.unit?.side === unit.side);
            if (primaryCard) {
              if (!primaryCard.stack.includes(unit.id)) primaryCard.stack.push(unit.id);
              const n = primaryCard.stack.length;
              brush.save();
              brush.fillStyle = '#a67d37';
              brush.beginPath();
              brush.roundRect(primaryCard.left + primaryCard.width - 21, primaryCard.top + 1.5, 19, 11.5, 3);
              brush.fill();
              brush.fillStyle = '#fff9e6';
              brush.font = '700 8px "Microsoft YaHei UI", sans-serif';
              brush.textAlign = 'center';
              brush.textBaseline = 'middle';
              brush.fillText('×' + n, primaryCard.left + primaryCard.width - 11.5, primaryCard.top + 7.5);
              brush.restore();
              return;
            }
          }

          // 每支纵队有自己的兵模和可点击区域；小人数量按该驻地的实际基层兵力计算。
          const localCount = localStrength.get(unit.id + '|' + unit.city) ?? (parentIds.has(unit.id) ? 0 : unit.strength);
          const strength = Math.max(0, localCount - (shownChildren.get(unit.id + '|' + unit.city) || 0));
          if (show3D && strength > 0) {
            const battle = state.battles?.[unit.order?.target] || state.battles?.[unit.city];
            const action = globalThis.CivilWarHuman3D.orderAction(unit, Boolean(battle), nightMode);
            const gSet = globalThis.GameSettings || { modelScale: 1, maxModelsMacro: 4 };
            const size = Math.round((national ? 22 : zoomLevel() === 'detail' ? 44 : 34) * (gSet.modelScale || 1));
            const rawCount = globalThis.CivilWarHuman3D.iconCount(strength);
            // 宏观与中景视角严格限制单队兵模上限，杜绝低地国家/华北堆出几十排兵模高墙；局部放大后自动展开完整人数阵型
            const macroCap = Math.max(1, gSet.maxModelsMacro || 4);
            const count = camera.zoom < 40 ? Math.min(rawCount, macroCap) : rawCount;
            const columns = Math.min(count, 4);
            const soldierKind = unit.nationModel || 'human';
            const sprite = humanRenderer.frame(unit.side, !['idle', 'hold', 'sleep'].includes(action), now, soldierKind, action, unit.group || '');
            for (let n = 0; n < count; n++) {
              const px = ux + (n % columns - (columns - 1) / 2) * size * .58;
              const py = uy - size - 12 - Math.floor(n / columns) * size * .54;
              // 柔和椭圆形地面接触阴影，杜绝浮空与前后排视觉粘连
              brush.save();
              brush.fillStyle = 'rgba(0, 0, 0, 0.28)';
              brush.beginPath();
              brush.ellipse(px, py + size * 0.90, size * 0.24, size * 0.08, 0, 0, Math.PI * 2);
              brush.fill();
              brush.restore();
              drawCroppedSprite(sprite, px - size / 2, py, size, size);
              hitCards.push({ unit, stack: [unit.id], figureHit: true, spriteHit: true, left: px - size * .23, top: py + size * .12, width: size * .46, height: size * .77 });
            }
            // 编制缺少实际车辆数时 unitTanks / unitArtillery 是估算，不能作为逐辆实有数。
            const tanks = globalThis.CivilWarHuman3D.tankIcons(globalThis.CivilWarHuman3D.unitTanks(unit));
            const guns = globalThis.CivilWarHuman3D.artilleryIcons(globalThis.CivilWarHuman3D.unitArtillery(unit));
            const tankKind = unit.tankModel || 'tank';
            const vSize = Math.round(34 * (gSet.modelScale || 1));
            let equipmentSlot = 0;
            for (const [kind, amount] of [[tankKind, tanks], ['artillery', guns]]) {
              if (!amount) continue;
              const vehicleAction = globalThis.CivilWarHuman3D.equipmentAction(action);
              const vehicle = humanRenderer.frame(unit.side, vehicleAction !== 'idle', now, kind, vehicleAction, unit.group || '');
              for (let n = 0; n < amount; n++, equipmentSlot++) {
                const px = ux + 40 + (equipmentSlot % 4) * (vSize * 0.74), py = uy - 26 - Math.floor(equipmentSlot / 4) * (vSize * 0.62);
                brush.drawImage(vehicle, px - vSize / 2, py - vSize / 2, vSize, vSize);
              }
            }
          }

          const stanceIcon = { ambush: '🥷', feint: '🎭', forced_march: '⚡', night_infiltrate: '🌙' }[unit.tacticalStance] || '';
          const label = stanceIcon + shortUnitName(unit);
          brush.font = (national ? '700 9.5px ' : '700 11px ') + '"Microsoft YaHei UI", sans-serif';
          const status = unit.order
            ? (unit.order.type === 'defend' && unit.city === unit.order.target ? '守阵地'
              : unit.order.type === 'entrench' && unit.city === unit.order.target ? '挖战壕'
              : unit.order.type === 'rest' && unit.city === unit.order.target ? (nightMode ? '宿营中' : '休整中')
              : orderStatus[unit.order.type] || '执行中')
            : nightMode ? '宿营中'
            : state.log.slice(-15).some((entry) => entry.unitId === unit.id && entry.phase === 'arrival') ? '已抵达' : '';

          const cardWidth = national
            ? clamp(brush.measureText(label).width + 12, 42, 74)
            : clamp(brush.measureText(label).width + 20, status ? 74 : 58, 118);
          const cardHeight = national ? 18 : 28;

          const choices = idx === 0
            ? [[ux - cardWidth / 2, uy + 8], [ux + 9, uy + 5], [ux - cardWidth - 9, uy + 5], [ux - cardWidth / 2, uy + 38], [ux - cardWidth / 2, uy - 38], [ux + 12, uy - 30], [ux - cardWidth - 12, uy - 30], [ux - cardWidth / 2, uy + 66]]
            : [[ux - cardWidth / 2, uy + 8], [ux - cardWidth / 2, uy + 38], [ux - cardWidth / 2, uy - 34], [ux + 8, uy + 6], [ux - cardWidth - 8, uy + 6], [ux + 12, uy + 36], [ux - cardWidth - 12, uy + 36]];

          const collides = ([left, top]) => hitCards.find((rect) => !rect.figureHit
            && left < rect.left + rect.width + 2 && left + cardWidth > rect.left - 2
            && top < rect.top + rect.height + 2 && top + cardHeight > rect.top - 2);
          const fit = choices.find((pt) => pt[0] > 2 && pt[1] > 4 && pt[0] + cardWidth < width - 2 && pt[1] + cardHeight < height - 4 && !collides(pt));
          const focused = unit.id === selection.unit || unit.id === selection.guideUnit || chosen.has(unit.id);
          // 屏幕空间兵牌聚合：在宏观/战区缩放下，若非选中兵牌仍与已有同方兵牌严重重叠，则聚合进该兵牌并更新 ×N 角标，避免华北/西欧文字叠成噪点
          if (!fit && !focused && camera.zoom < 40) {
            const host = collides(choices[0]) || hitCards.find((rect) => !rect.figureHit && rect.unit?.side === unit.side
              && Math.hypot((rect.left + rect.width / 2) - ux, (rect.top + rect.height / 2) - uy) < 92);
            if (host && host.unit?.side === unit.side) {
              if (!host.stack.includes(unit.id)) host.stack.push(unit.id);
              const n = host.stack.length;
              brush.save();
              brush.fillStyle = '#a67d37';
              brush.beginPath();
              brush.roundRect(host.left + host.width - 21, host.top + 1.5, 19, 11.5, 3);
              brush.fill();
              brush.fillStyle = '#fff9e6';
              brush.font = '700 8px "Microsoft YaHei UI", sans-serif';
              brush.textAlign = 'center';
              brush.textBaseline = 'middle';
              brush.fillText('×' + n, host.left + host.width - 11.5, host.top + 7.5);
              brush.restore();
              return;
            }
          }
          const [left, top] = fit || choices[0];

          brush.beginPath();
          brush.moveTo(cx, cy);
          brush.lineTo(left + cardWidth / 2, top + cardHeight / 2);
          brush.strokeStyle = focused ? '#f7dc98' : (sideColors[unit.side] || '#666a56');
          brush.lineWidth = focused ? 1.3 : .75;
          brush.stroke();

          brush.beginPath();
          brush.roundRect(left, top, cardWidth, cardHeight, 4);
          brush.fillStyle = unit.side === 'ccp' ? '#68302bf2' : '#2a4559f2';
          brush.fill();
          brush.lineWidth = focused ? 2.1 : 1;
          brush.strokeStyle = focused ? (chosen.has(unit.id) && unit.id !== selection.unit ? '#9ee0c2' : '#f7dc98')
            : '#8c7853cc';
          brush.stroke();

          brush.fillStyle = '#fff3d7';
          brush.textBaseline = 'middle';
          brush.fillText(label, left + 5, top + (national ? 9 : 8.5), cardWidth - (idx === 0 && totalInSide > 1 ? 24 : 10));
          if (idx === 0 && totalInSide > 1) {
            brush.save();
            brush.fillStyle = '#8c7853';
            brush.beginPath();
            brush.roundRect(left + cardWidth - 19, top + 2, 17, 11, 3);
            brush.fill();
            brush.fillStyle = '#fff7df';
            brush.font = '700 8px "Microsoft YaHei UI", sans-serif';
            brush.textAlign = 'center';
            brush.fillText('×' + totalInSide, left + cardWidth - 10.5, top + 7.5);
            brush.restore();
          }

          if (!national) {
            brush.font = '500 9px "Microsoft YaHei UI", sans-serif';
            const believed = unit.side === state.player ? localCount : Math.round(localCount / 100) * 100;
            const badge = profileLabels[unit.profile || unit.branch] || '步';
            brush.fillStyle = '#e6e0c8';
            brush.fillText((status || badge) + ' · ' + (unit.side === state.player ? '' : '约') + round.format(believed), left + 5, top + 20.5, cardWidth - 10);
            const org = Number.isFinite(unit.org) ? Math.max(0, Math.min(100, unit.org)) : 100;
            const hpRatio = unit.maxStrength ? Math.max(0, Math.min(1, unit.strength / unit.maxStrength)) : 1;
            brush.fillStyle = '#00000070';
            brush.fillRect(left + 4, top + cardHeight - 5.4, cardWidth - 8, 2);
            brush.fillStyle = org > 60 ? '#4fd16c' : org > 30 ? '#e3b84b' : '#e05848';
            brush.fillRect(left + 4, top + cardHeight - 5.4, (cardWidth - 8) * org / 100, 2);
            brush.fillStyle = '#00000070';
            brush.fillRect(left + 4, top + cardHeight - 2.6, cardWidth - 8, 1.8);
            brush.fillStyle = '#eb9c44';
            brush.fillRect(left + 4, top + cardHeight - 2.6, (cardWidth - 8) * hpRatio, 1.8);
            const lowSupply = unit.encircled || (selection.supply?.coverage?.[unit.side]?.[unit.city] ?? 1) < 0.45;
            if (lowSupply) {
              brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
              brush.fillStyle = '#ff5c4d';
              brush.fillText('💀', left + cardWidth - 13, top + 8.5);
            }
          }

          // 仅保留 2D 部队牌与城镇锚点的点击判定（彻底关闭 3D 兵模点击抢焦点！）
          hitCards.push({ unit, stack: [unit.id], anchorX: ux, anchorY: uy + 16, primary: idx === 0, left, top, width: cardWidth, height: cardHeight });
          if (idx === 0 && !national) {
            hitCards.push({ unit, stack: [unit.id], anchorX: cx, anchorY: cy + 16, primaryPin: true, figureHit: true, left: cx - 14, top: cy + 8, width: 28, height: 18 });
          }
          // 选中己方部队且开启射程圈时，实时绘制炮兵真实公里射程圈
          if (unit.id === selection.unit && unit.side === state.player && (globalThis.GameSettings?.showRangeRings !== false)) {
            const rangeKm = globalThis.CivilWarEngine?.unitArtilleryRangeKm?.(unit) || 40;
            const dLat = rangeKm / 111.32;
            const [rx, ry] = project(unit.camp?.lon ?? anchorCity.lon, (unit.camp?.lat ?? anchorCity.lat) + dLat);
            const pxRadius = Math.hypot(rx - ux, ry - uy);
            if (pxRadius >= 12 && pxRadius <= Math.max(width, height) * 1.4) {
              brush.save();
              brush.strokeStyle = 'rgba(245, 198, 84, 0.52)';
              brush.fillStyle = 'rgba(245, 198, 84, 0.06)';
              brush.lineWidth = 1.25;
              brush.setLineDash([5, 4]);
              brush.beginPath();
              brush.arc(ux, uy, pxRadius, 0, Math.PI * 2);
              brush.fill();
              brush.stroke();
              brush.setLineDash([]);
              brush.font = '600 9.5px "Microsoft YaHei UI", sans-serif';
              brush.fillStyle = '#ffe599';
              brush.textAlign = 'center';
              brush.fillText('🎯 炮兵射程 ' + rangeKm + ' km', ux, uy - pxRadius - 4);
              brush.restore();
            }
          }
        });
      }
      // 绘制最近跨距炮兵炮击的抛物线弹道与落点闪光
      for (const st of (state.artilleryStrikes || [])) {
        if (st.date !== state.date && Date.now() - (st.at || 0) > 8000) continue;
        const [x1, y1] = project(st.fromLon, st.fromLat);
        const [x2, y2] = project(st.toLon, st.toLat);
        if (!inMap(x1, y1) && !inMap(x2, y2)) continue;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(80, Math.hypot(x2 - x1, y2 - y1) * 0.28);
        brush.save();
        brush.strokeStyle = 'rgba(255, 122, 68, 0.88)';
        brush.lineWidth = 2.0;
        brush.setLineDash([6, 4]);
        brush.beginPath();
        brush.moveTo(x1, y1);
        brush.quadraticCurveTo(mx, my, x2, y2);
        brush.stroke();
        brush.setLineDash([]);
        brush.fillStyle = 'rgba(255, 92, 54, 0.45)';
        brush.beginPath();
        brush.arc(x2, y2, 11, 0, Math.PI * 2);
        brush.fill();
        brush.fillStyle = '#ffe599';
        brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
        brush.textAlign = 'center';
        brush.fillText('💥 ' + st.distKm + 'km', x2, y2 - 13);
        brush.restore();
      }
    }

    function drawAirForce() {
      for (const side of ['ccp', 'roc']) {
        const planes = Math.max(0, Math.floor(Number(state.airWar?.[side]?.planes) || 0));
        const count = globalThis.CivilWarHuman3D?.airIcons(planes) || 0;
        if (!count) continue;
        const bases = data.cities.filter(city => state.owners[city.id] === side && (Number(city.value) || 0) >= 5)
          .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0) || a.id.localeCompare(b.id))
          .slice(0, zoomLevel() === 'national' ? 1 : 3);
        if (!bases.length) continue;
        bases.forEach((base, baseIdx) => {
          const basePlanes = Math.floor(planes / bases.length) + (baseIdx < planes % bases.length ? 1 : 0);
          const share = globalThis.CivilWarHuman3D.airIcons(basePlanes);
          if (share <= 0) return;
          const [x, y] = project(base.lon, base.lat);
          if (!inMap(x, y)) return;
          const drawIcons = share;
          const sz = zoomLevel() === 'national' ? 28 : 38;
          for (let i = 0; i < drawIcons; i++) {
            const cols = Math.min(drawIcons, 8);
            const px = x + (i % cols - (cols - 1) / 2) * (sz * .5), py = y - 42 - Math.floor(i / cols) * (sz * .48);
            if (humanRenderer && options.models3d) brush.drawImage(humanRenderer.frame(side, false, 0, 'aircraft', 'idle'), px - sz / 2, py - sz / 2, sz, sz);
            else { brush.font = '14px sans-serif'; brush.fillStyle = side === 'cccp' ? '#a54f40' : '#406e82'; brush.fillText('✈', px - 7, py); }
          }
          if (zoomLevel() !== 'national') {
            brush.save(); brush.font = '600 9px "Microsoft YaHei UI", sans-serif';
            brush.textAlign = 'center'; brush.lineWidth = 3; brush.strokeStyle = '#1b2b32e8';
            const label = '空军示意 ' + basePlanes + '架（' + share + '标）';
            brush.strokeText(label, x, y - 56); brush.fillStyle = '#fff0cc'; brush.fillText(label, x, y - 56); brush.restore();
          }
        });
      }
    }

    function drawOrders() {
      const preview = cityPreview(highlightedCity);
      if (preview?.result.ok && preview.result.route?.length > 1 && !pointer?.moved) {
        const route = preview.result.route.map((id) => places.get(id)).filter(Boolean).map((place) => [place.lon, place.lat]);
        if (route.length > 1) line(route, orderStyles[preview.type].color, 2.4, [5, 4]);
      }
      const parentIds = new Set(state.units.map((unit) => unit.parent).filter(Boolean));
      const plannedFronts = [];
      for (const unit of state.units) {
        if (parentIds.has(unit.id) || unit.side !== state.player || unit.strength <= 0
          || !['advance', 'siege'].includes(unit.order?.type) || state.battles?.[unit.order.target]) continue;
        plannedFronts.push(unit);
      }
      for (const unit of plannedFronts) {
        const routeIds = Array.isArray(unit.order.route) && unit.order.route.length > 1
          ? unit.order.route : [unit.city, unit.order.target];
        const routePlaces = routeIds.map(id => places.get(id)).filter(Boolean);
        if (routePlaces.length < 2) continue;
        const route = routePlaces.map(place => [place.lon, place.lat]);
        const attackColor = unit.side === 'ccp' ? '#f07755' : '#65c9ee';
        line(route, attackColor + 'd8', 2.2, [6, 5]);
        const from = project(route.at(-2)[0], route.at(-2)[1]);
        const to = project(route.at(-1)[0], route.at(-1)[1]);
        arrowHead(from, to, attackColor, 9);
      }
      const now = performance.now();
      for (const unit of state.units) {
        if (parentIds.has(unit.id) || unit.strength <= 0 || unit.side !== state.player) continue;
        const route = unit.order?.route;
        if (!Array.isArray(route) || route.length < 2) continue;
        const moving = ['move', 'defend', 'entrench', 'rest', 'intercept'].includes(unit.order.type)
          || ['advance', 'siege'].includes(unit.order.type) && route.length > 2;
        if (!moving) continue;
        const a = places.get(route[0]), b = places.get(route[1]);
        if (!a || !b) continue;
        const progress = (now / 1450 + (unit.id.length % 5) * .17) % 1;
        const px = a.lon + (b.lon - a.lon) * progress;
        const py = a.lat + (b.lat - a.lat) * progress;
        drawUnitSprite(unit, ...project(px, py), 0, 1, true, now);
      }
      const selected = state.units.find((unit) => unit.id === selection.unit);
      const origin = places.get(selected?.city);
      const target = places.get(selected?.order?.target);
      const color = '#fff1b6';
      if (origin && target && origin !== target) {
        const route = (selected.order.route?.length > 1 ? selected.order.route : [origin.id, target.id])
          .map(id => places.get(id)).filter(Boolean).map(place => [place.lon, place.lat]);
        line(route, '#744e2f', 4);
        line(route, color, 2.1, selected.order.type === 'move' ? [7, 4] : []);
        if (route.length > 1) arrowHead(project(...route.at(-2)), project(...route.at(-1)), color);
      }
      if (target && ['siege', 'intercept'].includes(selected?.order?.type)) {
        brush.beginPath();
        brush.arc(...project(target.lon, target.lat), 14, 0, Math.PI * 2);
        brush.strokeStyle = '#974c36';
        brush.lineWidth = 2.5;
        brush.setLineDash([5, 4]);
        brush.stroke();
        brush.setLineDash([]);
      }
      if (pointer?.unit && pointer.moved) {
        const start = places.get(pointer.unit.city);
        if (!start) return;
        brush.beginPath();
        brush.moveTo(...project(start.lon, start.lat));
        brush.lineTo(...pointer.end);
        brush.strokeStyle = '#fff0a9';
        brush.lineWidth = 2.3;
        brush.stroke();
      }
    }

    function activeAttackers(cityId, battle) {
      const parentIds = new Set(state.units.map((unit) => unit.parent).filter(Boolean));
      return state.units.filter((unit) => !parentIds.has(unit.id) && unit.strength > 0
        && unit.side === battle.side && ['advance', 'siege'].includes(unit.order?.type)
        && unit.order.target === cityId);
    }

    function drawOrderActivity(now) {
      if (zoomLevel() === 'national') return;
      const parents = new Set(state.units.map(unit => unit.parent).filter(Boolean));
      const drawn = new Set();
      for (const unit of state.units) {
        if (parents.has(unit.id) || unit.strength <= 0 || unit.inactive || !unit.order) continue;
        const type = unit.order.type;
        if (!['defend', 'entrench', 'siege', 'intercept', 'bombard'].includes(type)) continue;
        const target = places.get(unit.order.target), origin = places.get(unit.city);
        if (!target || !origin) continue;
        const key = unit.side + '|' + type + '|' + target.id;
        if (drawn.has(key)) continue;
        if ((type === 'defend' || type === 'entrench') && unit.city !== target.id) continue;
        if (['siege', 'intercept'].includes(type) && (unit.order.route?.length || 0) > (type === 'siege' ? 2 : 1)) continue;
        drawn.add(key);
        const [x, y] = project(target.lon, target.lat);
        if (type === 'defend' || type === 'entrench') {
          if (!inMap(x, y)) continue;
          brush.save(); brush.strokeStyle = type === 'entrench' ? '#8c6e32' : '#51432f'; brush.lineWidth = 3;
          brush.beginPath(); brush.moveTo(x - 13, y + 28); brush.lineTo(x - 5, y + 24);
          brush.lineTo(x + 3, y + 28); brush.lineTo(x + 11, y + 24); brush.stroke(); brush.restore();
        } else if (type === 'siege' || type === 'intercept') {
          if (!inMap(x, y)) continue;
          brush.save(); brush.strokeStyle = type === 'siege' ? '#bd758d' : '#d7b879';
          brush.lineWidth = 2; brush.setLineDash(type === 'siege' ? [5, 5] : [2, 5]);
          brush.lineDashOffset = -now / 180; brush.beginPath(); brush.arc(x, y, 19, 0, Math.PI * 2); brush.stroke(); brush.restore();
        } else if (humanRenderer && (state.airWar?.[unit.side]?.planes || 0) > 0) {
          const [sx, sy] = project(origin.lon, origin.lat);
          const phase = (now / 2400) % 1;
          const px = sx + (x - sx) * phase, py = sy + (y - sy) * phase - 24;
          brush.drawImage(humanRenderer.frame(unit.side, false, now, 'aircraft'), px - 22, py - 22, 44, 44);
          if (phase > .7 && inMap(x, y)) {
            const drop = (phase - .7) / .3;
            brush.fillStyle = '#ffd28a'; brush.beginPath(); brush.arc(x, y - 28 * (1 - drop), 2.5, 0, Math.PI * 2); brush.fill();
          }
        }
      }
    }

    function drawBattleFronts(now) {
      for (const [cityId, battle] of Object.entries(state.battles || {})) {
        const target = places.get(cityId);
        if (!target) continue;
        const destinations = project(target.lon, target.lat);
        const byOrigin = new Map();
        for (const unit of activeAttackers(cityId, battle)) {
          if (!byOrigin.has(unit.city)) byOrigin.set(unit.city, []);
          byOrigin.get(unit.city).push(unit);
        }
        const origins = [...byOrigin.keys()];
        const color = battle.side === 'ccp' ? '#f07755' : '#65c9ee';
        origins.forEach((originId, index) => {
          const origin = places.get(originId);
          if (!origin) return;
          const from = project(origin.lon, origin.lat);
          const dx = destinations[0] - from[0], dy = destinations[1] - from[1];
          const length = Math.max(1, Math.hypot(dx, dy));
          const bend = (index - (origins.length - 1) / 2) * 9;
          const control = [(from[0] + destinations[0]) / 2 - dy / length * bend,
            (from[1] + destinations[1]) / 2 + dx / length * bend];
          brush.beginPath();
          brush.moveTo(from[0], from[1]);
          brush.quadraticCurveTo(control[0], control[1], destinations[0], destinations[1]);
          brush.strokeStyle = '#1b211fbd';
          brush.lineWidth = 5;
          brush.stroke();
          brush.beginPath();
          brush.moveTo(from[0], from[1]);
          brush.quadraticCurveTo(control[0], control[1], destinations[0], destinations[1]);
          brush.strokeStyle = color + 'f0';
          brush.lineWidth = 2.4;
          brush.setLineDash([8, 5]);
          brush.stroke();
          brush.setLineDash([]);
          arrowHead(control, destinations, color, 11);
          const march = (now / 2500 + index * .23) % 1;
          const t = .08 + march * .84;
          const inverse = 1 - t;
          const soldierX = inverse * inverse * from[0] + 2 * inverse * t * control[0] + t * t * destinations[0];
          const soldierY = inverse * inverse * from[1] + 2 * inverse * t * control[1] + t * t * destinations[1];
          drawHuman(soldierX, soldierY, battle.side, zoomLevel() === 'detail'
            ? clamp(camera.zoom / 72, 1.2, 1.85) : clamp(camera.zoom / 76, .55, .96),
            true, now + index * 110, battle.postureBySide?.[battle.side] === 'assault', 'fire');
          const attackingUnits = byOrigin.get(originId) || [];
          const artillery = attackingUnits.some(unit => unit.branch === 'artillery' || unit.profile === 'artillery'
            || /炮兵|炮团|炮营/.test(unit.name || '') || Number(unit.support?.artillery) >= 80);
          const cycle = now / (artillery ? 1800 : 950) + index * .31;
          const phase = cycle % 1;
          const flight = .08 + phase * .84;
          const arc = artillery ? clamp(length * .16, 18, 64) : 2;
          const projectileX = from[0] + dx * flight;
          const projectileY = from[1] + dy * flight - Math.sin(flight * Math.PI) * arc;
          brush.beginPath();
          brush.moveTo(projectileX - dx * (artillery ? .045 : .035),
            projectileY - dy * (artillery ? .045 : .035) + 1);
          brush.lineTo(projectileX, projectileY);
          brush.strokeStyle = artillery ? 'rgba(255,198,111,.94)' : 'rgba(255,239,188,.82)';
          brush.lineWidth = artillery ? 1.8 : 1.2;
          brush.stroke();
          brush.beginPath();
          brush.arc(projectileX, projectileY, artillery ? 2.7 : 1.8, 0, Math.PI * 2);
          brush.fillStyle = artillery ? '#ffe39c' : '#fff1c1';
          brush.shadowColor = artillery ? '#ff9d4c' : '#f57956';
          brush.shadowBlur = artillery ? 11 : 6;
          brush.fill();
          brush.shadowBlur = 0;
          if (phase < .09) {
            brush.beginPath();
            brush.arc(from[0] + dx * .035, from[1] + dy * .035, artillery ? 5.5 : 3.8,
              0, Math.PI * 2);
            brush.fillStyle = 'rgba(255,194,111,' + (1 - phase / .09) * .9 + ')';
            brush.fill();
          }
          if (origins.length > 1 && inMap((from[0] + destinations[0]) / 2, (from[1] + destinations[1]) / 2)) {
            brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
            brush.textAlign = 'center';
            brush.fillStyle = '#fff2d3';
            brush.fillText((index + 1) + '路', control[0], control[1] - 4);
            brush.textAlign = 'start';
          }
        });
      }
    }

    // 战场小场景只表达当前命令与战况，兵力结算仍由推演引擎负责。
    function drawFieldActions(now) {
      if (zoomLevel() === 'national') return;
      for (const [cityId, battle] of Object.entries(state.battles || {})) {
        const city = places.get(cityId);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const attackers = activeAttackers(cityId, battle);
        const siege = attackers.some(unit => unit.order?.type === 'siege');
        const assault = battle.postureBySide?.[battle.side] === 'assault';
        brush.save();
        brush.strokeStyle = '#4b3928'; brush.lineWidth = 4;
        brush.beginPath(); brush.moveTo(x - 19, y + 24); brush.lineTo(x - 10, y + 20);
        brush.lineTo(x, y + 24); brush.lineTo(x + 10, y + 20); brush.lineTo(x + 19, y + 24); brush.stroke();
        brush.strokeStyle = '#c0a77b'; brush.lineWidth = 1; brush.stroke();
        drawHuman(x + 3, y + 21, battle.side === 'ccp' ? 'roc' : 'ccp', .8, true, now, false, 'defend');
        drawHuman(x - 30 + Math.sin(now / 500) * 3, y + 29, battle.side, .85, true, now, assault, 'fire');
        drawHuman(x - 40 + Math.sin(now / 500) * 3, y + 33, battle.side, .7, true, now + 400, assault, 'fire');
        if (siege) {
          brush.beginPath(); brush.ellipse(x, y, 33, 23, 0, 0, Math.PI * 2);
          brush.setLineDash([5, 4]); brush.lineDashOffset = -now / 160;
          brush.strokeStyle = '#d8a2b8'; brush.lineWidth = 1.7; brush.stroke(); brush.setLineDash([]);
        }
        const armor = attackers.find(unit => unit.profile === 'mobile' || unit.branch === 'mobile'
          || unit.branch === 'armor' || Number(unit.support?.armor) >= 25);
        if (armor) drawUnitSprite({ ...armor, profile: 'mobile' }, x - 48, y + 17, 0, 1, true, now);
        const cannon = attackers.find(unit => unit.profile === 'artillery' || unit.branch === 'artillery'
          || Number(unit.support?.artillery) >= 80);
        if (cannon) drawUnitSprite({ ...cannon, profile: 'artillery' }, x - 62, y + 33, 0, 1, true, now);
        const force = state.airWar?.[battle.side];
        if (force?.mission === 'cas' && force.planes > 0) {
          const px = x - 60 + (now / 30 % 120), py = y - 46;
          brush.translate(px, py); brush.fillStyle = '#3b4840';
          brush.beginPath(); brush.moveTo(12, 0); brush.lineTo(1, -2); brush.lineTo(-3, -8);
          brush.lineTo(-6, -8); brush.lineTo(-3, -1); brush.lineTo(-12, 1); brush.lineTo(-13, 4);
          brush.lineTo(-3, 3); brush.lineTo(0, 8); brush.lineTo(3, 8); brush.lineTo(2, 2); brush.closePath(); brush.fill();
        }
        brush.restore();
      }
      for (const work of state.works || []) {
        const city = places.get(work.city);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        brush.save(); brush.strokeStyle = '#493a28'; brush.lineWidth = 3;
        brush.beginPath(); brush.moveTo(x - 17, y + 30); brush.lineTo(x - 8, y + 26);
        brush.lineTo(x + 1, y + 30); brush.lineTo(x + 10, y + 26); brush.stroke();
        drawHuman(x - 4, y + 25, work.side, .75, true, now);
        brush.strokeStyle = '#e6d0a2'; brush.lineWidth = 1.5;
        brush.beginPath(); brush.moveTo(x + 1, y + 16); brush.lineTo(x + 9, y + 24 + Math.sin(now / 250) * 3); brush.stroke();
        brush.restore();
      }
    }

    function drawCommandEffects(now) {
      commandEffects = commandEffects.filter(effect => now - effect.startedAt < 1800);
      for (const effect of commandEffects) {
        const city = places.get(effect.city);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        const progress = (now - effect.startedAt) / 1800;
        brush.save(); brush.globalAlpha = 1 - progress;
        brush.strokeStyle = effect.color; brush.lineWidth = 2.5;
        brush.beginPath(); brush.arc(x, y, 8 + progress * 28, 0, Math.PI * 2); brush.stroke();
        brush.textAlign = 'center'; brush.font = 'bold 12px "Microsoft YaHei UI", sans-serif';
        brush.lineWidth = 3; brush.strokeStyle = '#18231f'; brush.strokeText(effect.label, x, y - 19 - progress * 15);
        brush.fillStyle = '#fff0bd'; brush.fillText(effect.label, x, y - 19 - progress * 15);
        brush.restore();
      }
    }

    function drawBattleEffects(now) {
      const live = [];
      for (const effect of battleEffects) {
        const elapsed = now - effect.startedAt;
        if (elapsed >= 1400) continue;
        live.push(effect);
        const progress = clamp(elapsed / 1080, 0, 1);
        const target = places.get(effect.target);
        if (!target) continue;
        const to = project(target.lon, target.lat);
        effect.origins.forEach((item, index) => {
          const origin = places.get(item.city);
          if (!origin) return;
          const from = project(origin.lon, origin.lat);
          const dx = to[0] - from[0], dy = to[1] - from[1];
          const offset = ((index % 3) - 1) * 5;
          const kind = item.kind || (item.artillery ? 'artillery' : 'infantry');
          if (kind === 'infantry') {
            for (let volley = 0; volley < 3; volley += 1) {
              const shotElapsed = elapsed - index * 70 - volley * 300;
              if (shotElapsed < 0 || shotElapsed > 390) continue;
              const shot = shotElapsed / 390;
              const x = from[0] + dx * shot;
              const y = from[1] + dy * shot + offset + Math.sin(shot * Math.PI) * 1.5;
              brush.beginPath();
              brush.moveTo(x - dx * .032, y - dy * .032);
              brush.lineTo(x, y);
              brush.strokeStyle = 'rgba(255,235,174,' + (1 - shot) * .94 + ')';
              brush.lineWidth = 1.15;
              brush.stroke();
              brush.beginPath();
              brush.arc(x, y, 1.7, 0, Math.PI * 2);
              brush.fillStyle = '#fff0bd';
              brush.shadowColor = '#f57956';
              brush.shadowBlur = 7;
              brush.fill();
              brush.shadowBlur = 0;
              if (shotElapsed < 52) {
                brush.beginPath();
                brush.arc(from[0] + dx * .025, from[1] + dy * .025, 3.5 - shotElapsed * .035,
                  0, Math.PI * 2);
                brush.fillStyle = 'rgba(255,205,111,' + (1 - shotElapsed / 52) + ')';
                brush.fill();
              }
            }
          } else {
            const artillery = kind === 'artillery';
            const flight = artillery ? 1050 : 620;
            const shotElapsed = elapsed - index * 65;
            if (shotElapsed < 0 || shotElapsed > flight) return;
            const shot = shotElapsed / flight;
            const peak = Math.max(artillery ? 20 : 8, Math.min(artillery ? 72 : 34,
              Math.hypot(dx, dy) * (artillery ? .15 : .075)));
            const x = from[0] + dx * shot;
            const y = from[1] + dy * shot - Math.sin(shot * Math.PI) * peak;
            brush.beginPath();
            brush.moveTo(x - dx * (artillery ? .025 : .04), y - dy * (artillery ? .025 : .04) + 1);
            brush.lineTo(x + offset, y);
            brush.strokeStyle = artillery
              ? 'rgba(255,202,116,' + (1 - shot) * .8 + ')'
              : 'rgba(255,226,151,' + (1 - shot) * .92 + ')';
            brush.lineWidth = artillery ? 1.6 : 1.25;
            brush.stroke();
            brush.beginPath();
            brush.arc(x + offset, y, artillery ? 2.8 : 2.2, 0, Math.PI * 2);
            brush.fillStyle = artillery ? '#ffe6a2' : '#fff0bd';
            brush.shadowColor = artillery ? '#ff9b4b' : '#f57956';
            brush.shadowBlur = artillery ? 12 : 8;
            brush.fill();
            brush.shadowBlur = 0;
            if (shotElapsed < 90) {
              brush.beginPath();
              brush.arc(from[0] + dx * .025, from[1] + dy * .025, artillery ? 5 : 3.5,
                0, Math.PI * 2);
              brush.fillStyle = 'rgba(255,188,96,' + (1 - shotElapsed / 90) * .88 + ')';
              brush.fill();
            }
          }
        });
        const impactWave = clamp((elapsed - 670) / 650, 0, 1);
        const radius = 5 + progress * (effect.capture ? 24 : 15);
        brush.beginPath();
        brush.arc(to[0], to[1], radius, 0, Math.PI * 2);
        brush.strokeStyle = (effect.capture ? 'rgba(255, 224, 156, ' : 'rgba(255, 194, 116, ')
          + (1 - progress) * 0.88 + ')';
        brush.lineWidth = effect.capture ? 3 : 2;
        brush.stroke();
        if (impactWave > 0 && impactWave < 1) {
          brush.beginPath();
          brush.arc(to[0], to[1], 4 + impactWave * 31, 0, Math.PI * 2);
          brush.strokeStyle = 'rgba(255, 201, 115, ' + (1 - impactWave) * .82 + ')';
          brush.lineWidth = 3.2;
          brush.stroke();
        }
        if (effect.capture && progress > 0.34) {
          brush.globalAlpha = 1 - progress * 0.78;
          brush.font = '900 12px "Microsoft YaHei UI", sans-serif';
          brush.textAlign = 'center';
          brush.fillStyle = '#fff1bf';
          brush.fillText('突破', to[0], to[1] - 24);
          brush.textAlign = 'start';
          brush.globalAlpha = 1;
        }
        const hasArtillery = effect.origins.some(item => item.kind === 'artillery' || item.artillery);
        if ((effect.barrage || hasArtillery) && progress > 0.48) {
          brush.beginPath();
          brush.arc(to[0], to[1], 4 + progress * 8, 0, Math.PI * 2);
          brush.fillStyle = 'rgba(255, 176, 83, ' + (1 - progress) * 0.45 + ')';
          brush.fill();
        }
        const flash = clamp(1 - Math.abs(elapsed - 920) / 260, 0, 1);
        if (flash > 0) {
          brush.save();
          brush.globalAlpha = flash;
          brush.shadowColor = '#ff9b45';
          brush.shadowBlur = 26;
          brush.beginPath();
          brush.arc(to[0], to[1], 3 + flash * 13, 0, Math.PI * 2);
          brush.fillStyle = '#ffd37c';
          brush.fill();
          brush.shadowBlur = 0;
          for (let spark = 0; spark < 8; spark += 1) {
            const angle = spark * Math.PI / 4 + (Math.floor(effect.startedAt / 100) % 7) * .13;
            const inner = 5 + flash * 5;
            const outer = inner + 7 + flash * (spark % 3) * 6;
            brush.beginPath();
            brush.moveTo(to[0] + Math.cos(angle) * inner, to[1] + Math.sin(angle) * inner);
            brush.lineTo(to[0] + Math.cos(angle) * outer, to[1] + Math.sin(angle) * outer);
            brush.strokeStyle = spark % 2 ? '#ffb65f' : '#fff0bd';
            brush.lineWidth = spark % 2 ? 2.1 : 1.5;
            brush.stroke();
          }
          brush.restore();
        }
        const smoke = clamp((elapsed - 650) / 750, 0, 1);
        if (smoke > 0 && smoke < 1) {
          brush.globalAlpha = Math.sin(smoke * Math.PI) * .58;
          for (let puff = 0; puff < 5; puff += 1) {
            brush.beginPath();
            brush.arc(to[0] + ((puff % 3) - 1) * (7 + smoke * 6),
              to[1] - smoke * (10 + puff * 3), 3 + smoke * (5 + (puff % 2) * 3),
              0, Math.PI * 2);
            brush.fillStyle = puff === 2 ? '#302c26' : '#6b5741';
            brush.fill();
          }
          brush.globalAlpha = 1;
        }
      }
      battleEffects = live;
    }

    function animateBattle() {
      animationFrame = 0;
      const now = performance.now();
      // 解锁原生高刷屏帧率上限（144Hz / 165Hz / 240Hz），不再人为锁 22 FPS！
      lastAnimationAt = now;
      draw();
      if (battleEffects.length || commandEffects.length || !state?.winner && (hasMovingUnits() || hasActiveBattles() || state?.works?.length || hasVisibleOrders())) {
        animationFrame = requestAnimationFrame(animateBattle);
      }
    }

    function hasActiveBattles() {
      return Object.keys(state?.battles || {}).length > 0;
    }

    function hasVisibleOrders() {
      if (!state) return false;
      if (state.nightMode) return true;
      return (state.units || []).some(unit => {
        if (!unit.order || unit.strength <= 0 || unit.inactive) return false;
        const city = places.get(unit.city);
        return city && inMap(...project(city.lon, city.lat));
      });
    }

    function hasMovingUnits() {
      return (state?.units || []).some(unit => unit.strength > 0 && unit.order?.route?.length > 1
        && (['move', 'defend', 'entrench', 'rest', 'intercept'].includes(unit.order.type)
          || ['advance', 'siege'].includes(unit.order.type) && unit.order.route.length > 2));
    }

    function queueBattleAnimations(next) {
      const now = performance.now();
      const orders = new Map();
      for (const unit of next.units || []) {
        if (unit.side !== next.player || !unit.order || unit.inactive || unit.strength <= 0) continue;
        const signature = JSON.stringify([unit.order.type, unit.order.target]);
        orders.set(unit.id, signature);
        if (initialized && previousOrders.get(unit.id) !== signature) {
          const style = orderStyles[unit.order.type];
          if (style) commandEffects.push({ city: unit.order.target || unit.city, color: style.color,
            label: style.label, startedAt: now });
        }
      }
      previousOrders = orders;
      const postures = new Map();
      const postureNames = { balanced: '均衡作战', assault: '全线突击', envelop: '多路包围',
        cautious: '谨慎推进', hold: '坚守阵地' };
      for (const [city, battle] of Object.entries(next.battles || {})) {
        const posture = battle.postureBySide?.[next.player] || 'balanced';
        postures.set(city, posture);
        if (initialized && previousPostures.has(city) && previousPostures.get(city) !== posture) {
          commandEffects.push({ city, color: '#f4d58b', label: postureNames[posture] || '调整姿态', startedAt: now });
        }
      }
      previousPostures = postures;
      const works = new Set((next.works || []).map(work => work.id));
      if (initialized) for (const work of next.works || []) {
        if (!previousWorks.has(work.id) && work.side === next.player) {
          commandEffects.push({ city: work.city, color: '#dbc18c', label: '修筑工事', startedAt: now });
        }
      }
      previousWorks = works;
      const eventSequence = Number(next.eventSequence) || 0;
      if (initialized && eventSequence > lastMapEventSequence) {
        for (const entry of (next.log || [])) {
          if (entry.seq <= lastMapEventSequence) continue;
          if (entry.type === 'battle-end' && entry.result === 'capture') {
            battleEffects.push({ target: entry.city, origins: entry.attackOrigins || [], startedAt: now, capture: true });
          } else if (entry.type === 'encirclement' && entry.city) {
            const rifles = Number(entry.capturedRifles) || 0;
            const art = Number(entry.capturedArtillery) || 0;
            commandEffects.push({
              city: entry.city,
              color: '#ffd86b',
              label: '缴获成功！步枪+' + rifles + (art ? ' 火炮+' + art : ''),
              startedAt: now,
            });
          } else if (entry.type === 'sabotage' && entry.city) {
            commandEffects.push({
              city: entry.city,
              color: '#ff7b6b',
              label: '💣 铁路瘫痪！',
              startedAt: now,
            });
          } else if (entry.type === 'airborne' && entry.city) {
            commandEffects.push({
              city: entry.city,
              color: '#ffe066',
              label: entry.captured ? '⚡ 奇袭夺城！' : '⚡ 敌后破袭！',
              startedAt: now,
            });
          }
        }
      }
      for (const [cityId, battle] of Object.entries(next.battles || {})) {
        if (!initialized || (battle.days || 0) <= (lastBattleDays[cityId] || 0)) continue;
        const parentIds = new Set(next.units.map((unit) => unit.parent).filter(Boolean));
        const origins = new Map();
        for (const unit of next.units) {
          if (parentIds.has(unit.id) || unit.strength <= 0 || unit.side !== battle.side
            || !['advance', 'siege'].includes(unit.order?.type) || unit.order.target !== cityId) continue;
          const artillery = unit.branch === 'artillery' || unit.profile === 'artillery'
            || /炮兵|炮团|炮营/.test(unit.name || '') || Number(unit.support?.artillery) >= 80;
          const armor = !artillery && (unit.branch === 'mobile' || unit.profile === 'mobile'
            || unit.branch === 'armor' || Number(unit.support?.armor) >= 25);
          const kind = artillery ? 'artillery' : armor ? 'armor' : 'infantry';
          const previous = origins.get(unit.city);
          const priority = { infantry: 0, armor: 1, artillery: 2 };
          const strongest = priority[kind] > priority[previous?.kind] ? kind : previous?.kind || kind;
          origins.set(unit.city, { city: unit.city, kind: strongest, artillery: strongest === 'artillery' });
        }
        battleEffects.push({ target: cityId, origins: [...origins.values()], startedAt: now,
          barrage: battle.phase === '炮火准备' });
      }
      lastBattleDays = Object.fromEntries(Object.entries(next.battles || {}).map(([cityId, battle]) => [cityId, battle.days || 0]));
      lastMapEventSequence = eventSequence;
      initialized = true;
      if ((battleEffects.length || commandEffects.length || !state?.winner && (hasMovingUnits() || hasActiveBattles() || state?.works?.length || hasVisibleOrders())) && !animationFrame) {
        animationFrame = requestAnimationFrame(animateBattle);
      }
    }

    function drawGlobalBackdrop() {
      globalDeployHitItems = [];
      if (data.theaterMode === 'ww2' || options.globalLayer === false) return;
      if (!globalDeployments.length) return;

      // 实时动态渲染全球战略布兵图（大航母在前 + 后方人字形护航战舰群 + 上空舰载机编队 / 陆空重装甲单兵）
      const cardBoxes = [];
      const showGlobal3D = Boolean(options.models3d) && Boolean(humanRenderer);
      const now = performance.now();
      const baseModelSize = clamp(camera.zoom * 3.8, 28, 46);
      const airKinds = new Set(['b29', 'mig15', 'f86', 'spitfire', 'il2', 'zero', 'p40', 'jet', 'aircraft']);
      const shipKinds = new Set(['carrier', 'battleship', 'yamato', 'ship', 'uboat']);
      const cardFont = '700 10px "Microsoft YaHei UI", sans-serif';

      for (const dep of globalDeployments) {
        const [x, y] = project(dep.lon, dep.lat);
        if (x < -70 || x > width + 70 || y < -55 || y > height + 55) continue;

        let modelRendered = false;
        let modelTopY = y - 12;
        let modelBottomY = y + 6;
        const isCarrierGroup = Array.isArray(dep.models) && dep.models.includes('carrier');

        if (showGlobal3D && isCarrierGroup) {
          // ── 航母打击群专享大型防穿模编队：旗舰大航母居前 + 后方人字形战列舰与护航驱逐舰群 + 上空双机舰载机编队 ──
          const sideKey = dep.side || (dep.bloc === 'red' ? 'ccp' : 'roc');
          const cvSize = Math.round(baseModelSize * 1.62);
          const bbSize = Math.round(baseModelSize * 1.02);
          const ddSize = Math.round(baseModelSize * 0.82);
          const airSize = Math.round(baseModelSize * 0.88);
          const airKind = dep.models.find((k) => airKinds.has(k)) || 'f86';
          const escortHeavy = dep.models.includes('battleship') ? 'battleship' : 'ship';

          // 后方护航战舰群（严格位于航母后方两侧与尾后，绝不与航母本体重叠穿模）
          const escorts = [
            { kind: escortHeavy, ex: x - cvSize * 0.62, ey: y + cvSize * 0.12, sz: bbSize },
            { kind: 'ship', ex: x + cvSize * 0.62, ey: y + cvSize * 0.12, sz: ddSize },
            { kind: 'ship', ex: x, ey: y + cvSize * 0.34, sz: ddSize },
          ];
          for (const esc of escorts) {
            try {
              const sp = humanRenderer.frame(sideKey, true, now, esc.kind, 'idle', '');
              if (sp) {
                brush.save();
                brush.fillStyle = 'rgba(130, 224, 255, 0.22)';
                brush.beginPath();
                brush.ellipse(esc.ex, esc.ey + esc.sz * 0.28, esc.sz * 0.42, esc.sz * 0.11, 0, 0, Math.PI * 2);
                brush.fill();
                brush.restore();
                brush.drawImage(sp, esc.ex - esc.sz / 2, esc.ey - esc.sz / 2, esc.sz, esc.sz);
                modelRendered = true;
              }
            } catch {}
          }

          // 旗舰大型航空母舰（居前中心，带白色破浪尾迹 V 字波纹）
          const cvY = y - cvSize * 0.16;
          try {
            const cvSp = humanRenderer.frame(sideKey, true, now, 'carrier', 'idle', '');
            if (cvSp) {
              brush.save();
              brush.strokeStyle = 'rgba(218, 245, 255, 0.48)';
              brush.lineWidth = 1.6;
              brush.beginPath();
              brush.moveTo(x, cvY - cvSize * 0.12);
              brush.lineTo(x - cvSize * 0.48, cvY + cvSize * 0.36);
              brush.moveTo(x, cvY - cvSize * 0.12);
              brush.lineTo(x + cvSize * 0.48, cvY + cvSize * 0.36);
              brush.stroke();
              brush.fillStyle = 'rgba(140, 232, 255, 0.28)';
              brush.beginPath();
              brush.ellipse(x, cvY + cvSize * 0.24, cvSize * 0.50, cvSize * 0.13, 0, 0, Math.PI * 2);
              brush.fill();
              brush.restore();
              brush.drawImage(cvSp, x - cvSize / 2, cvY - cvSize / 2, cvSize, cvSize);
              modelRendered = true;
            }
          } catch {}

          // 上空伴飞舰载机双机编队（高空巡航，独立间距零穿模）
          const planes = [
            { px: x - cvSize * 0.44, py: cvY - cvSize * 0.52 },
            { px: x + cvSize * 0.44, py: cvY - cvSize * 0.44 },
          ];
          for (const pl of planes) {
            try {
              const pSp = humanRenderer.frame(sideKey, true, now, airKind, 'idle', '');
              if (pSp) {
                brush.save();
                brush.fillStyle = 'rgba(10, 22, 32, 0.26)';
                brush.beginPath();
                brush.ellipse(pl.px + 4, pl.py + airSize * 0.42, airSize * 0.24, airSize * 0.08, 0, 0, Math.PI * 2);
                brush.fill();
                brush.restore();
                brush.drawImage(pSp, pl.px - airSize / 2, pl.py - airSize / 2, airSize, airSize);
              }
            } catch {}
          }

          modelTopY = cvY - cvSize * 0.82;
          modelBottomY = y + cvSize * 0.58;
        } else if (showGlobal3D && Array.isArray(dep.models) && dep.models.length) {
          const modelsToDraw = camera.zoom < 6 ? dep.models.slice(0, 2) : dep.models.slice(0, 3);
          const spacing = baseModelSize * 0.82;
          const startX = x - ((modelsToDraw.length - 1) * spacing) / 2;
          modelsToDraw.forEach((kind, idx) => {
            const mx = startX + idx * spacing;
            const isAir = airKinds.has(kind);
            const isShip = shipKinds.has(kind);
            const isSoldier = kind.startsWith('soldier_');
            const mSize = isShip ? baseModelSize * 1.16 : isAir ? baseModelSize * 1.02 : baseModelSize * 0.94;
            const my = y - (isAir ? 26 : isShip ? 12 : 14);
            modelTopY = Math.min(modelTopY, my - mSize * 0.5);
            try {
              const sprite = humanRenderer.frame(dep.side || (dep.bloc === 'red' ? 'ccp' : 'roc'), isAir || isShip, now, kind, 'idle', '');
              if (sprite) {
                brush.save();
                brush.fillStyle = isShip ? 'rgba(130, 224, 255, 0.24)' : 'rgba(12, 18, 16, 0.34)';
                brush.beginPath();
                brush.ellipse(mx, my + mSize * (isAir ? 0.42 : 0.30), mSize * (isShip ? 0.46 : 0.28), mSize * 0.11, 0, 0, Math.PI * 2);
                brush.fill();
                brush.restore();
                if (isSoldier) {
                  drawCroppedSprite(sprite, mx - mSize / 2, my - mSize * 0.52, mSize, mSize);
                } else {
                  brush.drawImage(sprite, mx - mSize / 2, my - mSize / 2, mSize, mSize);
                }
                modelRendered = true;
              }
            } catch {}
          });
        }

        const strengthLabel = dep.strength >= 10000 ? Math.round(dep.strength / 10000) + '万' : round.format(dep.strength);
        const text = dep.icon + ' ' + dep.short + ' ' + strengthLabel;
        brush.save();
        const tw = cachedTextWidth(brush, cardFont, text);
        brush.font = cardFont;
        const cw = Math.ceil(tw + 14);
        const ch = 18;
        const candidates = [
          [x - cw / 2, modelBottomY + 2],
          [x - cw / 2, modelTopY - ch - 4],
          [x + (isCarrierGroup ? baseModelSize * 1.15 : 14), y - ch / 2],
          [x - cw - (isCarrierGroup ? baseModelSize * 1.15 : 14), y - ch / 2],
        ];
        const pos = candidates.find(([cx, cy]) => cx > 4 && cx + cw < width - 4 && cy > 4 && cy + ch < height - 4
          && !cardBoxes.some((b) => cx < b[0] + b[2] + 3 && cx + cw + 3 > b[0] && cy < b[1] + b[3] + 3 && cy + ch + 3 > b[1]));
        if (!pos) { brush.restore(); continue; }
        const [cx, cy] = pos;
        cardBoxes.push([cx, cy, cw, ch]);
        const bg = dep.bloc === 'red' ? 'rgba(138, 36, 32, 0.92)' : dep.bloc === 'blue' ? 'rgba(34, 78, 122, 0.92)' : 'rgba(122, 92, 36, 0.92)';
        const border = dep.bloc === 'red' ? '#f3b19c' : dep.bloc === 'blue' ? '#a6d6f7' : '#f2d99b';
        brush.strokeStyle = border;
        brush.lineWidth = 1.2;
        brush.beginPath();
        brush.moveTo(x, y);
        brush.lineTo(cx + cw / 2, cy + ch / 2);
        brush.stroke();
        brush.fillStyle = bg;
        brush.beginPath();
        brush.roundRect(cx, cy, cw, ch, 4);
        brush.fill();
        brush.stroke();
        brush.fillStyle = '#fff8e8';
        brush.textBaseline = 'middle';
        brush.fillText(text, cx + 7, cy + ch / 2 + 0.5);
        brush.restore();
        globalDeployHitItems.push({ kind: 'deployment', item: dep, left: cx, top: cy, width: cw, height: ch });
        if (modelRendered) {
          globalDeployHitItems.push({ kind: 'deployment', item: dep, left: x - baseModelSize * 1.2, top: modelTopY, width: baseModelSize * 2.4, height: modelBottomY - modelTopY + 8 });
        }
      }
    }

    function drawPreviewTip() {
      if (!highlightedCity || !hoverPoint) return;
      const text = handlers.previewCity?.(highlightedCity, hoverPoint, pointer?.unit?.id);
      if (!text) return;
      brush.font = '11px "Microsoft YaHei UI", sans-serif';
      const size = Math.min(width - 15, brush.measureText(text).width + 14);
      const x = clamp(hoverPoint[0] + 10, 4, width - size - 4);
      const y = clamp(hoverPoint[1] - 27, 4, height - 28);
      brush.fillStyle = '#26382ff3';
      brush.beginPath();
      brush.roundRect(x, y, size, 22, 4);
      brush.fill();
      brush.fillStyle = '#fff0cc';
      brush.textBaseline = 'middle';
      brush.fillText(text, x + 7, y + 11, size - 12);
    }

    function draw() {
      if (!state) return;
      const drawStart = performance.now();
      if (lastDrawStamp > 0) {
        const dt = drawStart - lastDrawStamp;
        if (dt > 0.5 && dt < 250) {
          const instFps = Math.min(240, 1000 / dt);
          fpsSmoothed = fpsSmoothed * 0.86 + instFps * 0.14;
        }
      }
      lastDrawStamp = drawStart;
      drawBase();
      brush.clearRect(0, 0, width, height);
      brush.drawImage(cache, 0, 0, width, height);
      const layers = activeBattleLayers();
      drawControl();
      if (state.nightMode) {
        brush.save();
        brush.fillStyle = 'rgba(12, 22, 38, 0.28)';
        brush.fillRect(0, 0, width, height);
        for (const city of data.cities) {
          if ((Number(city.value) || 0) < 4) continue;
          const [lx, ly] = project(city.lon, city.lat);
          if (!inMap(lx, ly)) continue;
          const glow = brush.createRadialGradient(lx, ly, 1, lx, ly, 14);
          glow.addColorStop(0, 'rgba(255, 214, 130, 0.38)');
          glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
          brush.fillStyle = glow;
          brush.fillRect(lx - 14, ly - 14, 28, 28);
        }
        brush.restore();
      }
      drawGlobalBackdrop();
      drawRoutes();
      drawBattleFronts(performance.now());
      drawCampaigns(layers);
      drawSupply();
      drawCities(layers);
      drawBattles();
      drawNavy();
      drawForts();
      drawIndustry();
      drawAirForce();
      drawPlans();
      drawOrders();
      drawUnits();
      drawOrderActivity(performance.now());
      drawFieldActions(performance.now());
      drawBattleEffects(performance.now());
      drawCommandEffects(performance.now());
      if (pointer?.drawFront && pointer.end) {
        const x1 = pointer.where[0], y1 = pointer.where[1], x2 = pointer.end[0], y2 = pointer.end[1];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 28;
        const ang = Math.atan2(y2 - my, x2 - mx);
        const pulse = 0.72 + 0.28 * Math.sin(performance.now() * 0.01);
        brush.save();
        brush.strokeStyle = 'rgba(255, 104, 72, ' + pulse.toFixed(2) + ')';
        brush.lineWidth = 7;
        brush.lineCap = 'round';
        brush.beginPath(); brush.moveTo(x1, y1); brush.quadraticCurveTo(mx, my, x2, y2); brush.stroke();
        brush.strokeStyle = '#ffe29a';
        brush.lineWidth = 2.4;
        brush.setLineDash([8, 6]);
        brush.beginPath(); brush.moveTo(x1, y1); brush.quadraticCurveTo(mx, my, x2, y2); brush.stroke();
        brush.setLineDash([]);
        brush.fillStyle = '#ff6b4a';
        brush.beginPath();
        brush.moveTo(x2, y2);
        brush.lineTo(x2 - Math.cos(ang - 0.45) * 18, y2 - Math.sin(ang - 0.45) * 18);
        brush.lineTo(x2 - Math.cos(ang + 0.45) * 18, y2 - Math.sin(ang + 0.45) * 18);
        brush.closePath(); brush.fill();
        brush.font = '700 12px "Microsoft YaHei UI", sans-serif';
        brush.fillStyle = '#fff0b8';
        brush.textAlign = 'center';
        brush.fillText('⚔ 手绘进攻战线（松开即刻执行）', mx, my - 8);
        brush.restore();
      }
      if (pointer?.marquee && pointer.moved && pointer.end) {
        const x0 = Math.min(pointer.where[0], pointer.end[0]), y0 = Math.min(pointer.where[1], pointer.end[1]);
        const bw = Math.abs(pointer.end[0] - pointer.where[0]), bh = Math.abs(pointer.end[1] - pointer.where[1]);
        brush.save();
        brush.fillStyle = 'rgba(224, 193, 138, 0.16)';
        brush.strokeStyle = '#f3d48c';
        brush.lineWidth = 1.6;
        brush.setLineDash([5, 3]);
        brush.fillRect(x0, y0, bw, bh);
        brush.strokeRect(x0, y0, bw, bh);
        brush.restore();
      }
      if (!humanRenderer) {
        brush.save(); brush.font = '12px "Microsoft YaHei UI", sans-serif';
        brush.fillStyle = '#402c20e8'; brush.fillRect(10, 10, 284, 24);
        brush.fillStyle = '#fff0c5'; brush.fillText('三维人物不可用，请启用浏览器 WebGL', 17, 26);
        brush.restore();
      }
      drawPreviewTip();
      drawScaleBar();
    }

    function drawScaleBar() {
      // 谷歌地图级动态比例尺（1000km -> 100m 实时换算）
      const kmPerDegLat = 111.1;
      const kmPerPx = kmPerDegLat / Math.max(camera.zoom, 0.1);
      const niceStepsKm = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];
      let chosenKm = 100;
      for (const s of niceStepsKm) {
        const px = s / kmPerPx;
        if (px >= 56 && px <= 148) { chosenKm = s; break; }
      }
      const barPx = clamp(chosenKm / kmPerPx, 48, 152);
      const label = chosenKm >= 1 ? chosenKm + ' km' : Math.round(chosenKm * 1000) + ' m';
      const x0 = 14;
      const y0 = height - 42;
      const geoCoords = cursorGeo || [camera.lon, camera.lat];
      const geoText = '经纬度: ' + geoCoords[0].toFixed(2) + '°, ' + geoCoords[1].toFixed(2) + '°';
      const fpsText = '⚡ ' + gpuLabel + ' · ' + Math.round(fpsSmoothed) + ' FPS · ' + geoText;
      brush.font = '700 10px "Microsoft YaHei UI", sans-serif';
      const fpsW = cachedTextWidth(brush, '700 10px "Microsoft YaHei UI", sans-serif', fpsText);
      const totalW = barPx + 74 + fpsW + 16;
      brush.save();
      brush.fillStyle = 'rgba(20, 26, 23, 0.78)';
      brush.strokeStyle = 'rgba(214, 190, 134, 0.55)';
      brush.lineWidth = 1;
      brush.beginPath();
      brush.roundRect(x0 - 6, y0 - 15, totalW, 24, 4);
      brush.fill();
      brush.stroke();
      brush.strokeStyle = '#f4e6be';
      brush.lineWidth = 2;
      brush.beginPath();
      brush.moveTo(x0, y0 - 4);
      brush.lineTo(x0, y0 + 2);
      brush.lineTo(x0 + barPx, y0 + 2);
      brush.lineTo(x0 + barPx, y0 - 4);
      brush.stroke();
      brush.font = '700 10px "Microsoft YaHei UI", sans-serif';
      brush.fillStyle = '#f5e7c2';
      brush.textBaseline = 'middle';
      brush.fillText(label, x0 + barPx + 7, y0 - 2);
      brush.fillStyle = '#8ef5b4';
      brush.fillText(fpsText, x0 + barPx + 66, y0 - 2);
      brush.restore();
    }

    function resize() {
      const dimensions = canvas.getBoundingClientRect();
      width = Math.max(1, dimensions.width);
      height = Math.max(1, dimensions.height);
      const density = Math.min(2, devicePixelRatio || 1);
      cache.width = canvas.width = Math.round(width * density);
      cache.height = canvas.height = Math.round(height * density);
      for (const ctx of [brush, backdrop]) ctx.setTransform(density, 0, 0, density, 0, 0);
      backgroundKey = undefined;
      draw();
    }

    new ResizeObserver(resize).observe(canvas);
    resize();

    function zoom(factor, x = width / 2, y = height / 2) {
      const [lon, lat] = unproject(x, y);
      camera.zoom = clamp(camera.zoom * factor, 3.4, 24000);
      const [afterLon, afterLat] = unproject(x, y);
      camera.lon = normalizeLon(camera.lon + ((((lon - afterLon + 180) % 360) + 360) % 360 - 180));
      camera.lat = clamp(camera.lat + lat - afterLat, -78, 82);
      draw();
      if (!animationFrame && !state?.winner && (hasVisibleOrders() || hasMovingUnits() || hasActiveBattles())) {
        animationFrame = requestAnimationFrame(animateBattle);
      }
    }

    function focus(area, cityId) {
      const city = places.get(cityId);
      const local = data.cities.filter((item) => item.region === area);
      if (area === 'national' || !local.length) {
        if (data.theaterMode === 'korea') {
          camera = { lon: 127.0, lat: 37.8, zoom: Math.min((width - 28) / 9.2, (height - 45) / 7.2) };
        } else if (data.theaterMode === 'ww2') {
          camera = { lon: city?.lon ?? data.defaultView?.lon ?? 14, lat: city?.lat ?? data.defaultView?.lat ?? 48, zoom: Math.min((width - 28) / 36, (height - 45) / 26) };
        } else {
          camera = { lon: 104.2, lat: 35.2, zoom: Math.min((width - 28) / 48, (height - 45) / 36) };
        }
      } else if (area === 'northeast') {
        camera = { lon: 123.2, lat: 42.9, zoom: Math.min((width - 25) / 11, (height - 62) / 10) };
      } else {
        const lon = city?.lon ?? local.reduce((sum, town) => sum + town.lon, 0) / local.length;
        const lat = city?.lat ?? local.reduce((sum, town) => sum + town.lat, 0) / local.length;
        camera = { lon, lat, zoom: Math.min((width - 28) / 9, (height - 68) / 7.5) };
      }
      camera.zoom = Math.max(3.4, camera.zoom);
      draw();
    }

    function jump(cityId) {
      const city = places.get(cityId);
      if (!city) return;
      camera.lon = city.lon;
      camera.lat = city.lat;
      draw();
    }

    function detail(cityId) {
      const city = places.get(cityId);
      if (!city) return;
      camera.lon = city.lon;
      camera.lat = city.lat;
      camera.zoom = Math.max(camera.zoom, 620);
      draw();
    }

    function worldView() {
      camera = {
        lon: 95,
        lat: 28,
        zoom: clamp(Math.min((width - 20) / 245, (height - 40) / 118), 3.5, 6.2),
      };
      draw();
    }

    function coordinates(event) {
      const { left, top } = canvas.getBoundingClientRect();
      return [event.clientX - left, event.clientY - top];
    }

    const markerAt = (x, y) => {
      const hits = hitCards.filter((card) => x >= card.left && x <= card.left + card.width
        && y >= card.top && y <= card.top + card.height);
      if (hits.length <= 1) return hits[0];
      const pinHit = hits.find((c) => c.primaryPin && Math.hypot(x - c.anchorX, y - c.anchorY) <= 9
        && c.unit.side === state.player);
      if (pinHit) return pinHit;
      return hits.sort((a, b) => {
        const aCard = a.figureHit ? 1 : 0, bCard = b.figureHit ? 1 : 0;
        if (aCard !== bCard) return aCard - bCard;
        const aSide = a.unit?.side === state.player ? 0 : 1, bSide = b.unit?.side === state.player ? 0 : 1;
        if (aSide !== bSide) return aSide - bSide;
        const da = Math.hypot(x - (a.left + a.width / 2), y - (a.top + a.height / 2));
        const db = Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2));
        return da - db;
      })[0];
    };
    const cardAt = (x, y) => markerAt(x, y)?.unit;

    function nearest(x, y, radius = 17) {
      let chosen;
      let smallest = radius;
      for (const city of data.cities) {
        const [px, py] = project(city.lon, city.lat);
        const gap = Math.hypot(px - x, py - y);
        if (gap < smallest) { chosen = city; smallest = gap; }
      }
      return chosen;
    }

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const [wx, wy] = coordinates(event);
      const [lon, lat] = unproject(wx, wy);
      camera.zoom = clamp(camera.zoom * Math.exp(-event.deltaY * .0018), 3.4, 24000);
      const [afterLon, afterLat] = unproject(wx, wy);
      camera.lon = normalizeLon(camera.lon + ((((lon - afterLon + 180) % 360) + 360) % 360 - 180));
      camera.lat = clamp(camera.lat + lat - afterLat, -78, 82);
      scheduleDraw();
      if (!animationFrame && !state?.winner && (hasVisibleOrders() || hasMovingUnits() || hasActiveBattles())) {
        animationFrame = requestAnimationFrame(animateBattle);
      }
    }, { passive: false });
    let drawFrontMode = false;
    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const where = coordinates(event);
      if (drawFrontMode) {
        pointer = { where, end: where, drawFront: true, lon: camera.lon, lat: camera.lat, moved: false };
        canvas.setPointerCapture(event.pointerId);
        return;
      }
      const marker = markerAt(...where);
      const unit = marker?.unit;
      const marquee = Boolean(event.shiftKey && !unit && !selection.command);
      pointer = { where, unit: unit && !marker.national && !selection.command && handlers.canOrder(unit) ? unit : null,
        picked: unit, marker, marquee, lon: camera.lon, lat: camera.lat, moved: false,
        toggle: Boolean(event.ctrlKey || event.metaKey || event.shiftKey) };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      const xy = coordinates(event);
      cursorGeo = unproject(xy[0], xy[1]);
      if (pointer) {
        const dx = xy[0] - pointer.where[0], dy = xy[1] - pointer.where[1];
        if (Math.hypot(dx, dy) > 5) pointer.moved = true;
        if (!pointer.moved) return;
        if (pointer.drawFront) {
          pointer.end = xy;
          hoverPoint = xy;
          highlightedCity = nearest(...xy, 36)?.id;
          draw();
          return;
        }
        if (pointer.marquee) {
          pointer.end = xy;
          draw();
          return;
        }
        if (pointer.unit) {
          pointer.end = xy;
          hoverPoint = xy;
          highlightedCity = nearest(...xy, 23)?.id;
          draw();
          return;
        }
        camera.lon = normalizeLon(pointer.lon - dx / camera.zoom / .76);
        camera.lat = clamp(pointer.lat + dy / camera.zoom, -78, 82);
        canvas.classList.add('dragging');
        scheduleDraw();
        return;
      }
      const bubble = battleBubbles.find((b) => Math.hypot(xy[0] - b.bx, xy[1] - b.by) <= b.br);
      const unit = bubble ? null : cardAt(...xy);
      const city = bubble ? places.get(bubble.cityId) : (nearest(...xy, 12) || places.get(unit?.city));
      hoverPoint = xy;
      canvas.title = bubble ? (city?.name || '') + ' 交战中（悬停查看修正）'
        : unit ? unit.name + ' · ' + (sideNames[unit.side] || '') + ' · ' + city?.name : city?.name || '';
      if (highlightedCity !== city?.id || city && (selection.unit || bubble)) { highlightedCity = city?.id; draw(); }
    });
    canvas.addEventListener('pointerup', (event) => {
      if (!pointer) return;
      const xy = coordinates(event);
      const old = pointer;
      pointer = undefined;
      canvas.classList.remove('dragging');
      if (old.drawFront) {
        drawFrontMode = false;
        const target = nearest(...xy, 38) || places.get(cardAt(...xy)?.city);
        if (old.moved && target) handlers.drawFrontOrder?.(target.id);
        else handlers.drawFrontCancel?.();
        draw();
      } else if (old.moved && old.marquee && old.end) {
        const x0 = Math.min(old.where[0], old.end[0]), x1 = Math.max(old.where[0], old.end[0]);
        const y0 = Math.min(old.where[1], old.end[1]), y1 = Math.max(old.where[1], old.end[1]);
        const ids = [...new Set(hitCards.filter((c) => !c.figureHit && handlers.canOrder(c.unit)
          && (c.left + c.width / 2) >= x0 && (c.left + c.width / 2) <= x1
          && (c.top + c.height / 2) >= y0 && (c.top + c.height / 2) <= y1).map((c) => c.unit.id))];
        if (ids.length) handlers.selectBox?.(ids);
        else draw();
      } else if (old.moved && old.unit) {
        const target = nearest(...xy, 28) || places.get(cardAt(...xy)?.city);
        if (target) handlers.quickOrder(target.id, old.unit.id);
        else draw();
      } else if (!old.moved) {
        const bubble = battleBubbles.find((b) => Math.hypot(xy[0] - b.bx, xy[1] - b.by) <= b.br);
        if (bubble && !selection.command) {
          handlers.openBattle?.(bubble.cityId);
        } else if (old.picked && old.toggle && !selection.command) {
          handlers.toggleUnit?.(old.picked.id);
        } else if (old.picked && !selection.command) {
          if ((old.marker?.stack?.length > 1 || old.marker?.national) && old.picked.id !== selection.guideUnit) {
            handlers.selectStack?.(old.picked.city, old.marker.stack, old.marker.national ? old.picked.area : undefined);
          } else handlers.selectUnit(old.picked.id);
        }
        else {
          const city = nearest(...xy) || places.get(old.picked?.city);
          if (city) handlers.selectCity(city.id);
          else {
            const gHit = globalDeployHitItems.find((g) => xy[0] >= g.left && xy[0] <= g.left + g.width && xy[1] >= g.top && xy[1] <= g.top + g.height)
              || globalCityHitItems.find((g) => xy[0] >= g.left && xy[0] <= g.left + g.width && xy[1] >= g.top && xy[1] <= g.top + g.height);
            if (gHit) handlers.selectGlobalInfo?.(gHit);
          }
        }
      }
    });
    canvas.addEventListener('pointercancel', () => {
      pointer = undefined;
      canvas.classList.remove('dragging');
      draw();
    });
    canvas.addEventListener('pointerleave', () => {
      if (pointer) return;
      highlightedCity = hoverPoint = undefined;
      draw();
    });
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const xy = coordinates(event);
      const target = nearest(...xy, 25) || places.get(cardAt(...xy)?.city);
      if (target) handlers.quickOrder(target.id, undefined, { ctrl: event.ctrlKey || event.metaKey, alt: event.altKey });
    });
    canvas.addEventListener('keydown', (event) => {
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
      if (delta) {
        event.preventDefault();
        camera.lon = normalizeLon(camera.lon + delta[0] * 45 / camera.zoom);
        camera.lat = clamp(camera.lat + delta[1] * 45 / camera.zoom, -78, 82);
        draw();
      } else if (event.key === '+' || event.key === '=') zoom(1.25);
      else if (event.key === '-') zoom(.8);
      else if (event.key === 'PageUp' || event.key === 'PageDown') {
        event.preventDefault();
        const own = state.units.filter((unit) => !unit.parent && unit.side === state.player
          && unit.strength > 0 && !unit.inactive)
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        if (!own.length) return;
        const index = own.findIndex((unit) => unit.id === selection.unit);
        const step = event.key === 'PageDown' ? 1 : -1;
        const next = own[index < 0 ? (step > 0 ? 0 : own.length - 1) : (index + step + own.length) % own.length];
        handlers.selectUnit(next.id);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const city = highlightedCity || state.units.find((unit) => unit.id === selection.unit)?.city;
        if (city) handlers.selectCity(city);
      }
    });

    return {
      update(next, nextSelection) { state = next; selection = nextSelection; queueBattleAnimations(next); draw(); },
      setData(nextData, view) {
        rebuildDataIndex(nextData);
        backgroundKey = undefined;
        territoryKey = '';
        factionLegendKey = '';
        if (view) camera = { lon: view.lon, lat: view.lat, zoom: view.zoom };
        else if (nextData.defaultView) camera = { ...nextData.defaultView };
        else camera = { lon: 105, lat: 35, zoom: 12 };
        draw();
      },
      layer(mode) {
        options.mode = mode;
        const note = document.getElementById('territory-note');
        if (note) note.hidden = !['situation', 'faction'].includes(mode);
        const legend = document.getElementById('faction-key');
        if (legend && mode !== 'faction') legend.hidden = true;
        draw();
      },
      overlay(id, enabled) {
        options[id] = enabled;
        if (id === 'supply') {
          const note = document.getElementById('territory-note'), legend = document.getElementById('faction-key');
          if (note) note.hidden = enabled || !['situation', 'faction'].includes(options.mode);
          if (legend) legend.hidden = enabled || options.mode !== 'faction';
        }
        draw();
      },
      focus, jump, detail, worldView, zoom, resize,
      globalSummary: () => ({
        cities: globalBackdropCities.length,
        ports: globalBackdropCities.filter((c) => c.port).length,
        rails: globalBackdropRoutes.filter((r) => r.kind === 'rail').length,
        deployments: globalDeployments.length,
        carrierGroups: globalDeployments.filter((d) => d.models?.includes('carrier')).length,
        models3dTotal: globalDeployments.reduce((sum, d) => sum + (d.models?.length || 0), 0),
        nations: [...new Set(globalDeployments.map((d) => d.nation).filter(Boolean))],
      }),
      setDrawFront(on) { drawFrontMode = Boolean(on); canvas.style.cursor = drawFrontMode ? 'crosshair' : ''; if (!drawFrontMode && pointer?.drawFront) pointer = undefined; draw(); },
      markers: () => hitCards.map(({ unit, spriteHit, left, top, width, height }) => ({
        unitId: unit.id, city: unit.city, side: unit.side, figure: Boolean(spriteHit), left, top, width, height,
      })),
      hitTest: (x, y) => {
        const hit = markerAt(x, y);
        return hit ? { unitId: hit.unit.id, figure: Boolean(hit.spriteHit) } : null;
      },
      point: (id) => {
        const city = places.get(id);
        return city && project(city.lon, city.lat);
      },
    };
  }

  globalThis.CivilWarMap = { mount, territoryNodes, nearestTerritory };
})();
