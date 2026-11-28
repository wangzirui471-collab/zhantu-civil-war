(() => {
  'use strict';

  // 1946–1953 世界冷战格局势力与地形数据（暂不部署世界各国军队，专注势力范围、地形与历史档案）
  const blocs = {
    socialist: { id: 'socialist', name: '社会主义阵营（苏/中/朝/东欧）', color: '#a83c34', border: '#e3776b' },
    western: { id: 'western', name: '西方与北约阵营（美/英/法/盟国）', color: '#356294', border: '#7eb2e8' },
    commonwealth: { id: 'commonwealth', name: '英联邦与殖民体系', color: '#8f4c68', border: '#d98cab' },
    nonaligned: { id: 'nonaligned', name: '独立与中立地区（印/中东/拉美）', color: '#7a7846', border: '#c7c27c' },
    china_civil: { id: 'china_civil', name: '中国战场（国共内战）', color: '#c45b33', border: '#f5b378' },
    korea_zone: { id: 'korea_zone', name: '朝鲜半岛（38线热点）', color: '#b88628', border: '#ffd978' },
  };

  // 简化高精度世界各大洲与主要岛屿经纬度多边形（[lon, lat]）
  const continents = [
    {
      name: '欧亚大陆',
      bloc: 'nonaligned',
      points: [
        [-9,37],[-9,43],[-2,43],[-4,48],[2,51],[8,54],[10,58],[5,61],[14,68],[28,71],[42,68],[60,70],[75,73],[104,77],
        [135,72],[170,66],[162,56],[142,54],[136,44],[129,40],[129,35],[126,35],[124,40],[118,39],[122,37],[121,31],
        [120,25],[114,22],[108,21],[109,12],[103,1],[100,14],[94,17],[88,22],[80,8],[72,20],[67,25],[56,26],[59,22],
        [44,12],[34,29],[35,36],[26,39],[23,37],[16,40],[12,44],[4,43],[-5,36]
      ],
    },
    {
      name: '非洲大陆',
      bloc: 'commonwealth',
      points: [
        [-6,35],[10,37],[15,32],[25,32],[33,31],[43,12],[51,12],[41,-2],[40,-15],[35,-25],[28,-33],[18,-34],[14,-22],
        [12,-6],[9,4],[0,5],[-8,4],[-17,15],[-15,26],[-9,31]
      ],
    },
    {
      name: '北美洲',
      bloc: 'western',
      points: [
        [-165,60],[-160,71],[-135,70],[-110,69],[-85,68],[-78,62],[-64,60],[-55,52],[-66,45],[-74,40],[-81,25],[-83,30],
        [-97,26],[-96,19],[-87,21],[-83,10],[-78,8],[-84,10],[-92,15],[-105,20],[-114,31],[-117,33],[-124,42],[-125,50],
        [-137,58],[-152,60]
      ],
    },
    {
      name: '南美洲',
      bloc: 'nonaligned',
      points: [
        [-78,9],[-72,12],[-60,8],[-50,0],[-35,-6],[-38,-14],[-41,-23],[-48,-28],[-58,-38],[-67,-54],[-74,-52],[-73,-40],
        [-71,-18],[-81,-5],[-79,2]
      ],
    },
    {
      name: '澳大利亚',
      bloc: 'commonwealth',
      points: [
        [114,-22],[122,-17],[131,-12],[136,-15],[142,-11],[146,-18],[153,-27],[150,-37],[140,-38],[131,-32],[115,-34],[113,-26]
      ],
    },
    { name: '格陵兰', bloc: 'western', points: [[-52,60],[-42,65],[-22,74],[-30,82],[-55,81],[-68,76],[-54,68]] },
    { name: '英国', bloc: 'western', points: [[-5,50],[1,51],[0,54],[-2,58],[-6,57],[-5,53]] },
    { name: '日本列岛', bloc: 'western', points: [[130,31],[135,34],[140,36],[141,41],[145,44],[141,45],[139,39],[132,34]] },
    { name: '台湾岛', bloc: 'china_civil', points: [[120.2,22.2],[121.6,22.8],[121.9,25.1],[120.8,24.6]] },
    { name: '菲律宾', bloc: 'western', points: [[120,14],[122,18],[125,11],[123,7],[120,10]] },
    { name: '印度尼西亚', bloc: 'nonaligned', points: [[96,5],[105,-6],[115,-8],[127,-4],[118,1],[106,-1]] },
    { name: '马达加斯加', bloc: 'commonwealth', points: [[44,-25],[47,-25],[50,-15],[48,-12],[44,-18]] },
    { name: '新西兰', bloc: 'commonwealth', points: [[167,-46],[172,-43],[178,-37],[174,-36],[170,-42]] },
  ];

  // 世界各大势力国家/地区边界着色块（叠加在大陆轮廓内，清晰呈现1946–1953冷战版图）
  const nations = [
    {
      id: 'ussr', name: '苏联', capital: '莫斯科', lon: 68, lat: 60, capLon: 37.6, capLat: 55.7, bloc: 'socialist',
      poly: [[26,52],[30,60],[42,68],[75,73],[135,72],[170,66],[162,56],[140,54],[132,43],[120,51],[88,49],[72,40],[54,40],[42,42],[30,46]],
      summary: '社会主义阵营核心，拥有庞大陆军与米格-15 喷气空军，在东北与朝鲜战争中提供关键装备、空军掩护与战略后盾。',
    },
    {
      id: 'east_europe', name: '东欧人民民主国家', capital: '华沙/柏林', lon: 20, lat: 50, capLon: 21, capLat: 52.2, bloc: 'socialist',
      poly: [[11,54],[24,54],[29,46],[26,42],[19,41],[13,46]],
      summary: '波兰、捷克斯洛伐克、匈牙利、保加利亚、罗马尼亚与东德等社会主义阵营欧洲前沿。',
    },
    {
      id: 'china', name: '中国战区', capital: '北平/南京', lon: 105, lat: 35, capLon: 116.4, capLat: 39.9, bloc: 'china_civil',
      poly: [[75,40],[88,49],[120,51],[134,48],[130,42],[124,40],[119,39],[122,31],[119,24],[109,20],[100,21],[92,28],[79,32]],
      summary: '1945–1950 国共内战主战场；1949 年新中国成立，1950 年 10 月组建中国人民志愿军跨过鸭绿江抗美援朝。',
    },
    {
      id: 'korea', name: '朝鲜半岛', capital: '平壤 / 汉城', lon: 127.5, lat: 38.2, capLon: 125.7, capLat: 39.0, bloc: 'korea_zone',
      poly: [[124.2,40.2],[130.5,42.2],[129.5,35.0],[126.0,34.8],[125.0,38.0]],
      summary: '以北纬 38 度线为界：北方朝鲜民主主义人民共和国，南方大韩民国。1950 年爆发朝鲜战争，点击可直接进入朝鲜战争沙盘！',
      clickableKorea: true,
    },
    {
      id: 'usa', name: '美利坚合众国', capital: '华盛顿', lon: -99, lat: 39, capLon: -77, capLat: 38.9, bloc: 'western',
      poly: [[-124,49],[-95,49],[-82,45],[-67,45],[-74,40],[-81,25],[-97,26],[-117,33],[-124,42]],
      summary: '西方阵营超级大国，拥有全球最强工业产能、B-29 战略轰炸机、第 7 舰队航母编队与 F-86 佩刀喷气战机。',
    },
    {
      id: 'canada', name: '加拿大', capital: '渥太华', lon: -102, lat: 58, capLon: -75.7, capLat: 45.4, bloc: 'western',
      poly: [[-140,69],[-85,68],[-55,52],[-67,45],[-95,49],[-125,49],[-138,59]],
      summary: '北约创始国与英联邦核心成员，派遣陆军旅与驱逐舰参加联合国军朝鲜作战。',
    },
    {
      id: 'west_europe', name: '西欧（英/法/西德/意）', capital: '伦敦/巴黎', lon: 5, lat: 47, capLon: 2.3, capLat: 48.8, bloc: 'western',
      poly: [[-9,37],[-9,43],[-4,48],[2,51],[11,54],[13,46],[16,40],[4,43],[-5,36]],
      summary: '英法西德与意大利组成北大西洋公约组织欧洲主体；英联邦派遣 27/28/29 旅及凯旋号航母参战朝鲜。',
    },
    {
      id: 'japan', name: '日本（美军占领/后勤基地）', capital: '东京', lon: 138, lat: 36, capLon: 139.7, capLat: 35.7, bloc: 'western',
      poly: [[130,31],[141,41],[145,44],[139,39],[132,34]],
      summary: '1945–1952 美军远东司令部驻地，朝鲜战争期间联合国军海空军最核心的补给与出击基地。',
    },
    {
      id: 'india', name: '印度与南亚', capital: '新德里', lon: 78, lat: 21, capLon: 77.2, capLat: 28.6, bloc: 'nonaligned',
      poly: [[67,25],[75,35],[88,28],[93,22],[80,8],[72,20]],
      summary: '1947 年印巴分治独立，是不结盟运动重要力量，在朝鲜战争期间多次参与外交斡旋。',
    },
    {
      id: 'middle_east', name: '中东与土耳其', capital: '安卡拉/开罗', lon: 42, lat: 30, capLon: 32.8, capLat: 39.9, bloc: 'nonaligned',
      poly: [[26,39],[42,41],[56,26],[59,22],[44,12],[34,29],[35,36]],
      summary: '欧亚非十字路口与石油重地；土耳其于 1950 年派遣土耳其旅赴朝参战。',
    },
    {
      id: 'africa', name: '非洲（英法殖民与独立浪潮）', capital: '开罗/开普敦', lon: 20, lat: 5, capLon: 31.2, capLat: 30.0, bloc: 'commonwealth',
      poly: [[-15,26],[10,37],[33,31],[43,12],[40,-15],[28,-33],[18,-34],[12,-6],[-8,4],[-17,15]],
      summary: '战后英法比利时等殖民体系与民族独立运动交织区域。',
    },
    {
      id: 'latam', name: '拉丁美洲', capital: '里约/布宜诺斯艾利斯', lon: -60, lat: -15, capLon: -43.2, capLat: -22.9, bloc: 'nonaligned',
      poly: [[-78,9],[-60,8],[-35,-6],[-41,-23],[-58,-38],[-67,-54],[-73,-40],[-81,-5]],
      summary: '美洲国家组织体系；哥伦比亚亦派遣营级部队与护卫舰参加朝鲜战争。',
    },
    {
      id: 'oceania', name: '澳大利亚与新西兰', capital: '堪培拉', lon: 134, lat: -25, capLon: 149.1, capLat: -35.3, bloc: 'commonwealth',
      poly: [[114,-22],[131,-12],[142,-11],[153,-27],[150,-37],[115,-34]],
      summary: '英联邦太平洋盟国，派遣澳大利亚皇家步兵团与空军中队参战朝鲜。',
    },
  ];

  // 世界主要高原/山脉/沙漠地形特征（用于世界地形图模式渲染）
  const terrainFeatures = [
    { name: '青藏高原', lon: 89, lat: 33, rx: 14, ry: 6, color: 'rgba(196, 174, 146, 0.72)' },
    { name: '喜马拉雅山脉', lon: 86, lat: 28, rx: 11, ry: 2.5, color: 'rgba(232, 224, 212, 0.85)' },
    { name: '西伯利亚高原', lon: 105, lat: 64, rx: 28, ry: 8, color: 'rgba(162, 168, 148, 0.55)' },
    { name: '乌拉尔山', lon: 60, lat: 59, rx: 3, ry: 10, color: 'rgba(170, 144, 112, 0.65)' },
    { name: '阿尔卑斯山', lon: 10, lat: 46, rx: 6, ry: 2.5, color: 'rgba(220, 214, 200, 0.78)' },
    { name: '落基山脉', lon: -112, lat: 46, rx: 7, ry: 16, color: 'rgba(186, 152, 114, 0.72)' },
    { name: '安第斯山脉', lon: -70, lat: -22, rx: 4, ry: 26, color: 'rgba(198, 162, 126, 0.8)' },
    { name: '撒哈拉沙漠', lon: 12, lat: 22, rx: 22, ry: 7, color: 'rgba(218, 194, 138, 0.78)' },
    { name: '阿拉伯沙漠', lon: 45, lat: 22, rx: 9, ry: 6, color: 'rgba(216, 190, 134, 0.72)' },
    { name: '蒙古与戈壁', lon: 103, lat: 44, rx: 13, ry: 4, color: 'rgba(204, 186, 136, 0.68)' },
    { name: '亚马孙盆地', lon: -61, lat: -4, rx: 13, ry: 7, color: 'rgba(92, 138, 86, 0.62)' },
    { name: '刚果盆地', lon: 22, lat: 0, rx: 9, ry: 6, color: 'rgba(96, 140, 88, 0.58)' },
  ];

  function renderWorldCanvas(canvas, mode = 'factions', selectedNationId = null) {
    if (!canvas) return [];
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const proj = (lon, lat) => [((lon + 180) / 360) * w, ((85 - lat) / 145) * h];

    // Ocean gradient
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#162836');
    ocean.addColorStop(0.5, '#1c3547');
    ocean.addColorStop(1, '#12222e');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    // Lat/Lon graticule
    ctx.strokeStyle = 'rgba(180, 210, 228, 0.11)';
    ctx.lineWidth = 1;
    for (let lon = -150; lon <= 150; lon += 30) {
      const [x] = proj(lon, 0);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let lat = -40; lat <= 60; lat += 20) {
      const [, y] = proj(0, lat);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw continent base terrain
    const drawPoly = (pts) => {
      ctx.beginPath();
      pts.forEach(([lon, lat], idx) => {
        const [x, y] = proj(lon, lat);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };

    for (const c of continents) {
      drawPoly(c.points);
      ctx.fillStyle = mode === 'terrain' ? '#7b8c64' : '#3a453c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(210, 200, 165, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw world terrain elevation features
    if (mode === 'terrain' || mode === 'hybrid') {
      for (const tf of terrainFeatures) {
        const [cx, cy] = proj(tf.lon, tf.lat);
        const rx = (tf.rx / 360) * w, ry = (tf.ry / 145) * h;
        const g = ctx.createRadialGradient(cx, cy, rx * 0.1, cx, cy, Math.max(rx, ry));
        g.addColorStop(0, tf.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        if (mode === 'terrain') {
          ctx.fillStyle = 'rgba(255, 248, 224, 0.82)';
          ctx.font = '10px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tf.name, cx, cy + 3);
        }
      }
    }

    // Draw faction overlays & clickable hit boxes
    const hitBoxes = [];
    for (const n of nations) {
      const bloc = blocs[n.bloc] || blocs.nonaligned;
      const [cx, cy] = proj(n.lon, n.lat);
      if (mode !== 'terrain') {
        drawPoly(n.poly);
        ctx.fillStyle = bloc.color + (mode === 'hybrid' ? '96' : 'cc');
        ctx.fill();
        ctx.strokeStyle = selectedNationId === n.id ? '#ffe484' : bloc.border;
        ctx.lineWidth = selectedNationId === n.id ? 2.4 : 1.1;
        ctx.stroke();
      }
      // Korea hotspot pulsing ring
      if (n.clickableKorea) {
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd86b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Label pill
      ctx.font = n.clickableKorea ? 'bold 11.5px "Microsoft YaHei", sans-serif' : '600 11px "Microsoft YaHei", sans-serif';
      const tw = ctx.measureText(n.name).width;
      ctx.fillStyle = selectedNationId === n.id ? 'rgba(92, 72, 26, 0.92)' : 'rgba(18, 24, 21, 0.78)';
      ctx.fillRect(cx - tw / 2 - 5, cy - 8, tw + 10, 16);
      ctx.strokeStyle = selectedNationId === n.id ? '#ffd86b' : bloc.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - tw / 2 - 5, cy - 8, tw + 10, 16);
      ctx.fillStyle = n.clickableKorea ? '#ffe68c' : '#f4ecd5';
      ctx.textAlign = 'center';
      ctx.fillText(n.name, cx, cy + 4);
      hitBoxes.push({ id: n.id, nation: n, x: cx - tw / 2 - 8, y: cy - 12, w: tw + 16, h: 24 });
    }

    // Map title watermark
    ctx.fillStyle = 'rgba(245, 228, 176, 0.92)';
    ctx.font = 'bold 14px "Songti SC", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('1946–1953 世界战略格局 · ' + (mode === 'terrain' ? '全球地形高程图' : mode === 'hybrid' ? '势力 + 地形叠加图' : '冷战阵营势力范围图'), 14, 24);
    ctx.fillStyle = 'rgba(210, 218, 208, 0.75)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('点击任意国家查看档案 · 点击「朝鲜半岛」可直达《抗美援朝 · 朝鲜战争》作战库（当前暂不部署世界陆军）', 14, 42);
    return hitBoxes;
  }

  const api = { blocs, continents, nations, terrainFeatures, renderWorldCanvas };
  globalThis.CivilWarWorld = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
