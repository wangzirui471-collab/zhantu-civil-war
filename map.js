(() => {
  'use strict';

  const sideColors = { ccp: '#a54f40', roc: '#406e82' };
  const sideNames = { ccp: '共产党', roc: '国民党' };
  const profileLabels = { infantry: '步', artillery: '炮', mobile: '机', mixed: '混' };
  const regionNames = { northeast: '东北', north: '华北', east: '华东', central: '中原',
    south: '华南', southwest: '西南', northwest: '西北', taiwan: '台湾' };
  const orderStyles = {
    advance: { label: '进攻', color: '#8d3027', dash: [] },
    move: { label: '调动', color: '#155753', dash: [7, 4] },
    defend: { label: '布防', color: '#234e76', dash: [4, 3] },
    siege: { label: '围城', color: '#7d3a6b', dash: [5, 3] },
    intercept: { label: '围点打援', color: '#78395d', dash: [2, 3] },
    hold: { label: '驻防', color: '#595843', dash: [] },
  };
  const orderStatus = { advance: '进攻中', move: '调动中', defend: '布防中',
    siege: '围城中', intercept: '拦援中', hold: '驻防' };
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
    const places = new Map(data.cities.map((city) => [city.id, city]));
    const groups = new Map((data.groups || []).map((group) => [group.id, group]));
    const geography = globalThis.CivilWarGeography;
    const grids = (geography?.grids || []).map(prepareGrid);
    const land = geography?.land?.length ? geography.land : data.land;
    const important = new Set([...(data.battleLayers || []).flatMap((layer) => layer.points || []), ...mapNames]);
    const outlets = new Map();
    for (const [a, b] of data.links) {
      if (data.routeTypes?.[linkKey(a, b)] !== 'rail') continue;
      outlets.set(a, (outlets.get(a) || 0) + 1);
      outlets.set(b, (outlets.get(b) || 0) + 1);
    }
    const options = { mode: 'terrain', rail: true, province: true, battle: true, maritime: false,
      supply: false, fort: true };
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
    let backgroundKey;
    const cache = document.createElement('canvas');
    const backdrop = cache.getContext('2d');
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
      if (!grids.length) return;
      const southwest = unproject(0, height);
      const northeast = unproject(width, 0);
      const step = camera.zoom >= 200 ? 50 : camera.zoom >= 100 ? 100 : camera.zoom >= 48 ? 200 : camera.zoom >= 24 ? 400 : 800;
      const paths = new Map();
      for (const [index, grid] of grids.entries()) {
        const stride = camera.zoom < 19 ? 3 : camera.zoom < 35 ? 2 : 1;
        const left = Math.max(0, Math.floor((southwest[0] - grid.west) / grid.step / stride) * stride);
        const top = Math.max(0, Math.floor((grid.north - northeast[1]) / grid.step / stride) * stride);
        const right = Math.min(grid.width - stride, Math.ceil((northeast[0] - grid.west) / grid.step));
        const bottom = Math.min(grid.height - stride, Math.ceil((grid.north - southwest[1]) / grid.step));
        const later = grids.slice(index + 1);
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
      const key = [width, height, camera.lon, camera.lat, camera.zoom, options.mode, options.province].join('|');
      if (key === backgroundKey) return;
      backgroundKey = key;
      const ctx = backdrop;
      const sea = ctx.createLinearGradient(0, 0, width, height);
      sea.addColorStop(0, '#90a99d');
      sea.addColorStop(1, '#77978d');
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, width, height);
      shape(ctx, land);
      ctx.fillStyle = options.mode === 'contour' ? '#e3d7b7' : '#d3c9a7';
      ctx.fill();
      if (options.mode !== 'situation') {
        ctx.save();
        ctx.clip();
        for (const grid of grids) {
          const [a, b] = project(grid.west, grid.north);
          const [x, y] = project(grid.east, grid.south);
          if (x < 0 || a > width || y < 0 || b > height) continue;
          ctx.globalAlpha = options.mode === 'contour' ? .5 : .96;
          ctx.drawImage(grid.relief, a, b, x - a, y - b);
        }
        ctx.restore();
      }
      ctx.strokeStyle = '#496d5d8c';
      ctx.lineWidth = .8;
      shape(ctx, land);
      ctx.stroke();
      if (options.mode === 'contour') showContours(ctx);

      if (geography?.boundary) {
        shape(ctx, geography.boundary);
        ctx.strokeStyle = '#465e50';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      if (options.province && geography?.provinces?.length) {
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
      if (camera.zoom < 22) {
        const [x, y] = project(101, 34);
        ctx.font = 'bold 29px SimSun, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4858468a';
        ctx.fillText('中  国', x, y);
      }
      ctx.font = 'italic 11px "Microsoft YaHei UI", sans-serif';
      ctx.fillStyle = '#476f6994';
      ctx.textAlign = 'center';
      for (const [name, lon, lat] of [['黄  海', 124, 34.7], ['东  海', 125, 28.9], ['渤  海', 119.8, 38.45]]) {
        ctx.fillText(name, ...project(lon, lat));
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

    function drawPlans() {
      if (!selection.plans) return;
      for (const plan of selection.plans) {
        const target = places.get(plan.target);
        if (!target) continue;
        const color = plan.side === 'ccp' ? '#f6bb9c' : '#abd8ec';
        const origins = new Set();
        for (const id of plan.units) {
          const unit = state.units.find(member => member.id === id && member.strength > 0);
          const city = unit && places.get(unit.city);
          if (city && city.id !== plan.target) origins.add(city);
        }
        const staging = plan.front ? places.get(plan.front) : null;
        const hop = (from, to) => {
          line([[from.lon, from.lat], [to.lon, to.lat]], '#37251a99', 4.2);
          line([[from.lon, from.lat], [to.lon, to.lat]], color, 1.5, plan.status === 'paused' ? [2, 6] : [9, 5]);
        };
        for (const city of origins) {
          if (staging && staging.id !== city.id && staging.id !== plan.target) {
            hop(city, staging);
            arrowHead(project(city.lon, city.lat), project(staging.lon, staging.lat), color, 6);
            hop(staging, target);
            arrowHead(project(staging.lon, staging.lat), project(target.lon, target.lat), color, 7);
          } else {
            hop(city, target);
            arrowHead(project(city.lon, city.lat), project(target.lon, target.lat), color, 7);
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

    function drawControl() {
      const national = zoomLevel() === 'national';
      if (options.mode !== 'situation' && !national) return;
      brush.save();
      shape(brush, land);
      brush.clip();
      const radius = national ? clamp(camera.zoom * 1.5, 12, 31) : clamp(camera.zoom * .78, 11, 39);
      for (const city of data.cities) {
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const color = sideColors[state.owners[city.id]] || '#777052';
        const halo = brush.createRadialGradient(x, y, 1, x, y, radius);
        halo.addColorStop(0, color + (options.mode === 'situation' ? '58' : '27'));
        halo.addColorStop(1, color + '00');
        brush.fillStyle = halo;
        brush.fillRect(x - radius, y - radius, radius * 2, radius * 2);
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
      if (preview.type === 'move' || preview.type === 'defend') {
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

    function deployed() {
      const active = state.units.filter((unit) => unit.strength > 0 && !unit.inactive);
      const byId = new Map(active.map((unit) => [unit.id, unit]));
      return active.filter((unit) => {
        if (!unit.parent || unit.id === selection.unit) return true;
        const parent = byId.get(unit.parent);
        return parent && ((zoomLevel() === 'detail' && unit.level === 'division')
          || (parent.city !== unit.city && (unit.side === state.player || camera.zoom > 72)));
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

    function drawUnits() {
      hitCards = [];
      const units = deployed();
      const chosen = new Set(selection.units ?? []);
      const national = zoomLevel() === 'national';
      if (national) {
        nationalUnits(units);
        if (!selection.unit) return;
      }
      const priority = (unit) => (unit.id === selection.unit ? 10_000 : 0) + (chosen.has(unit.id) ? 9_000 : 0)
        + (unit.id === selection.guideUnit ? 8_000 : 0)
        + (unit.side === state.player ? 1_000 : 0) + Math.min(unit.strength / 100, 900);
      const candidates = units.filter((unit) => !national || unit.id === selection.unit).sort((a, b) => priority(b) - priority(a));
      const groups = new Map();
      for (const unit of candidates) {
        const key = unit.city + '|' + unit.side;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(unit);
      }
      for (const members of groups.values()) {
        const unit = members[0];
        const city = places.get(unit.city);
        if (!city) continue;
        const [x, y] = project(city.lon, city.lat);
        if (!inMap(x, y)) continue;
        const label = shortUnitName(unit);
        brush.font = '700 11px "Microsoft YaHei UI", sans-serif';
        const status = unit.order ? (unit.order.type === 'defend' && unit.city === unit.order.target ? '已布防'
          : orderStatus[unit.order.type] || '执行中')
          : state.log.slice(-15).some((entry) => entry.unitId === unit.id && entry.phase === 'arrival') ? '已抵达' : '';
        const cardWidth = clamp(brush.measureText(label).width + (members.length > 1 ? 38 : 22), status ? 76 : 58, 124);
        const cardHeight = 29;
        const choices = [[x - cardWidth / 2, y + 8], [x + 9, y + 5], [x - cardWidth - 9, y + 5],
          [x - cardWidth / 2, y - 40], [x - cardWidth / 2, y + 39]];
        const fit = choices.find(([left, top]) => left > 3 && top > 6 && left + cardWidth < width - 3 && top + cardHeight < height - 5
          && !hitCards.some((rect) => left < rect.left + rect.width + 1 && left + cardWidth > rect.left - 1
            && top < rect.top + rect.height + 1 && top + cardHeight > rect.top - 1));
        if (!fit) continue;
        const [left, top] = fit;
        const focused = unit.id === selection.unit || unit.id === selection.guideUnit || chosen.has(unit.id);
        brush.beginPath();
        brush.moveTo(x, y);
        brush.lineTo(left + cardWidth / 2, top + cardHeight / 2);
        brush.strokeStyle = sideColors[unit.side] || '#666a56';
        brush.lineWidth = .65;
        brush.stroke();
        brush.beginPath();
        brush.roundRect(left, top, cardWidth, cardHeight, 4);
        brush.fillStyle = unit.side === 'ccp' ? '#603e36f7' : '#334f5af7';
        brush.fill();
        brush.lineWidth = focused ? 2 : .8;
        brush.strokeStyle = focused ? (chosen.has(unit.id) && unit.id !== selection.unit ? '#9ee0c2' : '#f7dc98')
          : (unit.side === 'ccp' ? '#d9927e' : '#9bbbc8');
        brush.stroke();
        brush.fillStyle = '#fff3d7';
        brush.textBaseline = 'middle';
        const count = members.length > 1 ? 18 : 0;
        brush.fillText(label, left + 5, top + 8.6, cardWidth - 10 - count);
        if (count) {
          brush.font = '700 9px "Microsoft YaHei UI", sans-serif';
          brush.fillText('+' + (members.length - 1), left + cardWidth - count, top + 8.6);
        }
        brush.font = '500 9px "Microsoft YaHei UI", sans-serif';
        const believed = unit.side === state.player ? unit.strength : Math.round(unit.strength / 100) * 100;
        const badge = profileLabels[unit.profile || unit.branch] || '步';
        brush.fillStyle = '#e6e0c8';
        brush.fillText((status || badge) + ' · ' + (unit.side === state.player ? '' : '约 ') + round.format(believed), left + 5, top + 21, cardWidth - 10);
        hitCards.push({ unit, stack: members.map((member) => member.id), left, top, width: cardWidth, height: cardHeight });
      }
    }

    function drawOrders() {
      const preview = cityPreview(highlightedCity);
      if (preview?.result.ok && preview.result.route?.length > 1 && !pointer?.moved) {
        const route = preview.result.route.map((id) => places.get(id)).filter(Boolean).map((place) => [place.lon, place.lat]);
        if (route.length > 1) line(route, orderStyles[preview.type].color, 2.4, [5, 4]);
      }
      const selected = state.units.find((unit) => unit.id === selection.unit);
      const origin = places.get(selected?.city);
      const target = places.get(selected?.order?.target);
      const color = '#fff1b6';
      if (origin && target && origin !== target) {
        const route = [[origin.lon, origin.lat], [target.lon, target.lat]];
        line(route, '#744e2f', 4);
        line(route, color, 2.1, selected.order.type === 'move' ? [7, 4] : []);
        arrowHead(project(...route[0]), project(...route[1]), color);
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
      drawRoutes();
      drawCampaigns(layers);
      drawSupply();
      drawCities(layers);
      drawForts();
      drawPlans();
      drawOrders();
      drawUnits();
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
      camera.zoom = clamp(camera.zoom * factor, 3.4, 430);
      const [afterLon, afterLat] = unproject(x, y);
      camera.lon += lon - afterLon;
      camera.lat += lat - afterLat;
      draw();
    }

    function focus(area, cityId) {
      const city = places.get(cityId);
      const local = data.cities.filter((item) => item.region === area);
      if (area === 'national' || !local.length) {
        camera = { lon: 104.2, lat: 35.2, zoom: Math.min((width - 28) / 48, (height - 45) / 36) };
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

    function coordinates(event) {
      const { left, top } = canvas.getBoundingClientRect();
      return [event.clientX - left, event.clientY - top];
    }

    const markerAt = (x, y) => hitCards.find((card) => x >= card.left && x <= card.left + card.width
      && y >= card.top && y <= card.top + card.height);
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
    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const where = coordinates(event);
      const marker = markerAt(...where);
      const unit = marker?.unit;
      pointer = { where, unit: unit && !marker.national && !selection.command && handlers.canOrder(unit) ? unit : null,
        picked: unit, marker, lon: camera.lon, lat: camera.lat, moved: false,
        toggle: Boolean(event.ctrlKey || event.metaKey || event.shiftKey) };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      const xy = coordinates(event);
      if (pointer) {
        const dx = xy[0] - pointer.where[0], dy = xy[1] - pointer.where[1];
        if (Math.hypot(dx, dy) > 5) pointer.moved = true;
        if (!pointer.moved) return;
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
      const unit = cardAt(...xy);
      const city = nearest(...xy, 12) || places.get(unit?.city);
      hoverPoint = xy;
      canvas.title = unit ? unit.name + ' · ' + (sideNames[unit.side] || '') + ' · ' + city?.name : city?.name || '';
      if (highlightedCity !== city?.id || city && selection.unit) { highlightedCity = city?.id; draw(); }
    });
    canvas.addEventListener('pointerup', (event) => {
      if (!pointer) return;
      const xy = coordinates(event);
      const old = pointer;
      pointer = undefined;
      canvas.classList.remove('dragging');
      if (old.moved && old.unit) {
        const target = nearest(...xy, 28) || places.get(cardAt(...xy)?.city);
        if (target) handlers.quickOrder(target.id, old.unit.id);
        else draw();
      } else if (!old.moved) {
        if (old.picked && old.toggle && !selection.command) {
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
      if (target) handlers.quickOrder(target.id);
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
    });

    return {
      update(next, nextSelection) { state = next; selection = nextSelection; draw(); },
      layer(mode) { options.mode = mode; draw(); },
      overlay(id, enabled) { options[id] = enabled; draw(); },
      focus, jump, zoom, resize,
      point: (id) => {
        const city = places.get(id);
        return city && project(city.lon, city.lat);
      },
    };
  }

  globalThis.CivilWarMap = { mount };
})();
