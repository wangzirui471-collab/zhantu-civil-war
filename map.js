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
      const dx = (lon - node.lon) * .76, dy = lat - node.lat;
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
        const neighborX = at(row, Math.min(grid.width - 1, col + 1)) - at(row, Math.max(0, col - 1));
        const neighborY = at(Math.min(grid.height - 1, row + 1), col) - at(Math.max(0, row - 1), col);
        const reliefAmount = clamp((neighborX - neighborY) / (grid.step * 160), -33, 32);
        let upper = terrainStops.findIndex(([level]) => level > height);
        if (upper < 0) upper = terrainStops.length - 1;
        upper = Math.max(1, upper);
        const [lowerLevel, lowerColor] = terrainStops[upper - 1];
        const [upperLevel, upperColor] = terrainStops[upper];
        const t = clamp((height - lowerLevel) / (upperLevel - lowerLevel), 0, 1);
        const i = (row * grid.width + col) * 4;
        for (let channel = 0; channel < 3; channel++) {
          image.data[i + channel] = lowerColor[channel] * (1 - t) + upperColor[channel] * t + reliefAmount;
        }
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
    function rebuildDataIndex(nextData) {
      data = nextData;
      places = new Map(data.cities.map((city) => [city.id, city]));
      groups = new Map((data.groups || []).map((group) => [group.id, group]));
      if (data.theaterMode === 'ww2') {
        land = worldGeo?.land?.length ? worldGeo.land : (data.land || []);
      } else if (data.theaterMode === 'korea') {
        land = geography?.land?.length ? geography.land : (worldGeo?.land?.length ? worldGeo.land : (data.land || []));
      } else {
        land = geography?.land?.length ? geography.land : data.land;
      }
      important = new Set([...(data.battleLayers || []).flatMap((layer) => layer.points || []), ...mapNames, ...(data.theaterMode ? data.cities.map((c) => c.id) : [])]);
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
    const options = { mode: 'situation', terrainBack: true, rail: true, province: true, battle: true, maritime: false,
      supply: false, fort: true, models3d: true };
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
    let territoryKey = '';
    let factionLegendKey = '';
    const mapLabel = canvas.getAttribute('aria-label') || '战区地图';
    const keyboardHelp = 'Page Up 和 Page Down 浏览标记，Enter 打开所选部队或同城名册';
    canvas.setAttribute('aria-keyshortcuts', 'PageUp PageDown Enter');
    canvas.setAttribute('aria-label', mapLabel + '。' + keyboardHelp);

    function zoomLevel() {
      if (camera.zoom < nationalZoom) return 'national';
      return camera.zoom < detailZoom ? 'theater' : 'detail';
    }

    function project(lon, lat) {
      return [width / 2 + (lon - camera.lon) * camera.zoom * .76, height / 2 - (lat - camera.lat) * camera.zoom];
    }

    function unproject(x, y) {
      return [camera.lon + (x - width / 2) / (camera.zoom * .76), camera.lat - (y - height / 2) / camera.zoom];
    }

    function trace(ctx, points, close = false) {
      if (!points?.length) return;
      ctx.moveTo(...project(...points[0]));
      for (let i = 1; i < points.length; i++) ctx.lineTo(...project(...points[i]));
      if (close) ctx.closePath();
    }

    function shape(ctx, rings) {
      ctx.beginPath();
      for (const ring of rings || []) trace(ctx, ring, true);
    }

    function showContours(ctx) {
      const activeGrids = data.theaterMode ? [...worldGrids, ...grids] : grids;
      if (!activeGrids.length) return;
      const southwest = unproject(0, height);
      const northeast = unproject(width, 0);
      const step = camera.zoom >= 200 ? 50 : camera.zoom >= 100 ? 100 : camera.zoom >= 48 ? 200 : camera.zoom >= 24 ? 400 : 800;
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

    function drawBase() {
      const key = [width, height, camera.lon, camera.lat, camera.zoom, options.mode, options.province, options.terrainBack].join('|');
      if (key === backgroundKey) return;
      backgroundKey = key;
      const ctx = backdrop;
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
      if (options.mode === 'terrain' || options.mode === 'contour' || options.terrainBack) {
        ctx.save();
        ctx.clip();
        if (data.theaterMode === 'korea' || data.theaterMode === 'ww2') {
          // 优先使用真实 AWS Mapzen 全球 + 欧洲高精度卫星高程 DEM（与中国地图 100% 同源同清晰度）
          for (const grid of worldGrids) {
            const [a, b] = project(grid.west, grid.north);
            const [x, y] = project(grid.east, grid.south);
            if (x < 0 || a > width || y < 0 || b > height) continue;
            ctx.globalAlpha = options.mode === 'contour' ? .52 : .96;
            ctx.drawImage(grid.relief, a, b, x - a, y - b);
          }
          // 在东亚/朝鲜/中国视口内叠加 0.1° 超高清真实 SRTM 卫星高程图
          for (const grid of grids) {
            const [a, b] = project(grid.west, grid.north);
            const [x, y] = project(grid.east, grid.south);
            if (x < 0 || a > width || y < 0 || b > height) continue;
            ctx.globalAlpha = options.mode === 'contour' ? .52 : .96;
            ctx.drawImage(grid.relief, a, b, x - a, y - b);
          }
          // 叠加真实世界主要河流线
          const worldRivers = globalThis.CivilWarWorld?.rivers || [];
          if (worldRivers.length) {
            ctx.save();
            ctx.strokeStyle = 'rgba(72, 118, 140, 0.55)';
            ctx.lineWidth = Math.max(0.8, Math.min(2.0, camera.zoom * 0.04));
            ctx.beginPath();
            for (const rv of worldRivers) trace(ctx, rv.pts, false);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          for (const grid of grids) {
            const [a, b] = project(grid.west, grid.north);
            const [x, y] = project(grid.east, grid.south);
            if (x < 0 || a > width || y < 0 || b > height) continue;
            ctx.globalAlpha = options.mode === 'contour' ? .5 : .96;
            ctx.drawImage(grid.relief, a, b, x - a, y - b);
          }
        }
        ctx.restore();
      }
      ctx.strokeStyle = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? '#2a4654b8' : '#3a5d6699';
      ctx.lineWidth = (data.theaterMode === 'ww2' || data.theaterMode === 'korea') ? 1.05 : .85;
      shape(ctx, land);
      ctx.stroke();
      if (options.mode === 'contour') showContours(ctx);

      if ((data.theaterMode === 'ww2' || data.theaterMode === 'korea') && options.province && worldGeo?.borders?.length) {
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

      if (!data.theaterMode && geography?.boundary) {
        shape(ctx, geography.boundary);
        ctx.strokeStyle = '#465e50';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      if (!data.theaterMode && options.province && geography?.provinces?.length) {
        for (const province of geography.provinces) {
          shape(ctx, province.rings);
          ctx.lineWidth = .7;
          ctx.strokeStyle = '#626a57a4';
          ctx.stroke();
          if (!province.name || camera.zoom < 10 || camera.zoom > 146) continue;
          const [x, y] = project(...province.label);
          if (x < 10 || x > width - 10 || y < 50 || y > height - 30) continue;
          ctx.font = (camera.zoom < 22 ? '10' : '13') + 'px SimSun, serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = options.mode === 'terrain' ? '#3b4a39b8' : '#5b614bbd';
          ctx.fillText(province.name, x, y);
        }
      }
      if (!data.theaterMode && camera.zoom < 22) {
        const [x, y] = project(101, 34);
        ctx.font = 'bold 29px SimSun, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4858468a';
        ctx.fillText('中  国', x, y);
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
      const seas = data.theaterMode === 'ww2'
        ? [['黄  海', 124, 34.7], ['东  海', 125, 28.9], ['南  海', 114, 15.0], ['太平洋', 155, 20],
           ['大西洋', -32, 34], ['地中海', 18, 35.2], ['北  海', 3.5, 56.2], ['波罗的海', 19.5, 57.8], ['印度洋', 76, 4]]
        : [['黄  海', 124, 34.7], ['东  海', 125, 28.9], ['渤  海', 119.8, 38.45]];
      for (const [name, lon, lat] of seas) {
        const [sx, sy] = project(lon, lat);
        if (sx >= -40 && sx <= width + 40 && sy >= -20 && sy <= height + 20) ctx.fillText(name, sx, sy);
      }
      ctx.textAlign = 'start';
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
          const step = 6;
          const maxRadius = data.theaterMode === 'ww2' ? 11.5 : data.theaterMode === 'korea' ? 2.6 : 3.5;
          territoryCanvas.width = Math.ceil(width / step);
          territoryCanvas.height = Math.ceil(height / step);
          const pixels = territoryBrush.createImageData(territoryCanvas.width, territoryCanvas.height);
          for (let y = 0; y < territoryCanvas.height; y++) for (let x = 0; x < territoryCanvas.width; x++) {
            const [lon, lat] = unproject((x + .5) * step, (y + .5) * step);
            const node = nearestTerritory(lon, lat, nodes, maxRadius);
            if (!node) continue;
            const color = factionMode && node.owner === 'roc' && factionZoneColors[node.group]
              ? factionZoneColors[node.group] : node.owner === 'ccp' ? '#9e3c38' : '#3c5e78';
            const offset = (y * territoryCanvas.width + x) * 4;
            pixels.data[offset] = parseInt(color.slice(1, 3), 16);
            pixels.data[offset + 1] = parseInt(color.slice(3, 5), 16);
            pixels.data[offset + 2] = parseInt(color.slice(5, 7), 16);
            pixels.data[offset + 3] = data.theaterMode === 'ww2' ? 105 : 130;
          }
          territoryBrush.putImageData(pixels, 0, 0);
        }
        brush.save();
        const clipRings = data.theaterMode ? land : (geography?.boundary?.length ? geography.boundary : land);
        shape(brush, clipRings); brush.clip();
        brush.imageSmoothingEnabled = true;
        brush.drawImage(territoryCanvas, 0, 0, width, height);
        brush.restore();
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
          if (ringSlot !== 0) {
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

          const label = shortUnitName(unit);
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
        });
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
      if (now - lastAnimationAt < (hasMovingUnits() || hasActiveBattles() ? 44 : 125)) {
        animationFrame = requestAnimationFrame(animateBattle);
        return;
      }
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
      camera.zoom = clamp(camera.zoom * factor, 3.4, 5400);
      const [afterLon, afterLat] = unproject(x, y);
      camera.lon += lon - afterLon;
      camera.lat += lat - afterLat;
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
      camera.zoom = Math.max(camera.zoom, 480);
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
      zoom(Math.exp(-event.deltaY * .00145), ...coordinates(event));
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
        camera.lon = pointer.lon - dx / camera.zoom / .76;
        camera.lat = pointer.lat + dy / camera.zoom;
        canvas.classList.add('dragging');
        draw();
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
        camera.lon += delta[0] * 45 / camera.zoom;
        camera.lat += delta[1] * 45 / camera.zoom;
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
      focus, jump, detail, zoom, resize,
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
