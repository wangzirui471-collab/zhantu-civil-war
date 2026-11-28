(() => {
  'use strict';

  // 1946–1953 世界冷战格局（向后兼容 CivilWarWorld 接口）
  const blocs = {
    socialist: { id: 'socialist', name: '社会主义阵营（苏/中/朝/东欧）', color: '#a83c34', border: '#e3776b' },
    western: { id: 'western', name: '西方与北约阵营（美/英/法/盟国）', color: '#356294', border: '#7eb2e8' },
    commonwealth: { id: 'commonwealth', name: '英联邦与殖民体系', color: '#8f4c68', border: '#d98cab' },
    nonaligned: { id: 'nonaligned', name: '独立与中立地区（印/中东/拉美）', color: '#7a7846', border: '#c7c27c' },
    china_civil: { id: 'china_civil', name: '中国战场（国共内战）', color: '#c45b33', border: '#f5b378' },
    korea_zone: { id: 'korea_zone', name: '朝鲜半岛（38线热点）', color: '#b88628', border: '#ffd978' },
  };

  // HOI4 二战三大阵营配色
  const ww2Blocs = {
    allies: { id: 'allies', name: '同盟国 (Allies · 美/英/法/中)', color: '#2f65a3', border: '#8fc5ff' },
    comintern: { id: 'comintern', name: '共产国际 (Comintern · 苏联)', color: '#a62621', border: '#f28074' },
    axis: { id: 'axis', name: '轴心国 (Axis · 德/日/意)', color: '#5c646b', border: '#c4d0d8' },
  };

  // 高精度世界各大洲与主要半岛/岛屿海岸线经纬度多边形（[lon, lat]）
  const continents = [
    {
      name: '欧亚大陆',
      bloc: 'nonaligned',
      points: [
        [-9.2,37.0],[-9.5,38.7],[-8.9,41.8],[-9.2,43.0],[-5.0,43.5],[-1.8,43.4],[-1.2,45.8],[-4.6,48.3],[-1.9,48.7],
        [-1.8,49.7],[0.1,49.5],[1.6,50.9],[3.4,51.4],[4.8,53.0],[8.5,53.9],[8.4,55.5],[10.6,57.7],[10.2,55.6],[11.0,54.4],
        [14.2,54.0],[18.6,54.6],[21.0,55.7],[24.0,57.0],[24.7,59.4],[29.8,60.0],[21.5,60.6],[21.0,63.5],[25.0,65.8],
        [18.0,63.0],[18.2,59.3],[15.0,56.1],[12.8,55.6],[11.5,58.8],[8.0,58.1],[5.2,60.4],[6.5,62.5],[10.4,63.5],
        [14.5,67.3],[19.0,69.6],[28.0,71.0],[33.0,69.0],[41.0,67.5],[44.0,66.2],[54.0,68.8],[61.0,69.8],[68.0,72.5],
        [75.0,73.2],[88.0,75.0],[104.0,77.4],[116.0,73.5],[135.0,71.6],[152.0,70.5],[170.0,66.2],[178.0,64.5],
        [168.0,60.5],[162.0,56.0],[157.0,51.2],[156.0,58.5],[142.0,59.2],[136.0,55.0],[141.0,53.0],[139.0,47.5],
        [135.0,43.8],[131.5,42.8],[129.0,40.0],[129.4,35.1],[126.2,34.6],[126.5,37.6],[124.4,39.9],[121.6,38.9],
        [120.0,40.0],[117.7,39.0],[122.6,37.4],[120.4,35.8],[121.9,31.2],[121.5,28.5],[119.8,25.5],[116.6,23.2],
        [114.2,22.2],[110.2,20.2],[108.0,21.4],[106.0,18.0],[109.2,13.2],[105.0,8.6],[100.5,13.6],[100.2,7.5],
        [103.8,1.3],[100.0,5.5],[98.0,16.5],[94.2,16.0],[91.8,22.2],[88.2,21.6],[85.0,19.5],[80.3,13.1],[77.5,8.1],
        [75.0,12.5],[72.8,19.0],[69.0,22.5],[67.0,24.8],[61.5,25.2],[56.5,27.0],[50.0,29.8],[51.5,25.2],[56.3,26.1],
        [59.5,22.5],[53.0,16.5],[45.0,12.8],[43.3,12.6],[39.0,21.5],[34.8,29.5],[32.5,31.2],[35.5,33.5],[36.1,36.8],
        [30.5,36.8],[26.2,38.5],[26.8,40.5],[29.0,41.2],[36.0,41.8],[41.5,41.5],[39.0,44.5],[33.5,44.5],[30.5,46.4],
        [28.5,43.0],[27.0,40.6],[23.7,37.9],[22.0,36.6],[20.0,39.6],[19.0,42.2],[13.8,45.6],[12.5,44.2],[16.0,41.8],
        [18.5,40.2],[15.8,38.0],[13.8,41.0],[10.3,43.8],[8.9,44.4],[5.4,43.3],[3.1,42.4],[0.5,40.5],[-0.5,38.0],
        [-5.4,36.1],[-6.9,37.1]
      ],
    },
    {
      name: '非洲大陆',
      bloc: 'commonwealth',
      points: [
        [-5.8,35.8],[0.0,35.8],[6.0,36.8],[10.3,37.2],[11.1,35.0],[13.2,32.9],[20.0,32.0],[25.1,31.6],[32.5,31.2],
        [34.5,27.5],[37.2,21.0],[40.0,15.5],[43.3,12.6],[49.0,11.2],[51.3,11.8],[48.5,5.0],[41.5,-1.5],[39.5,-8.0],
        [40.6,-15.0],[35.2,-20.0],[32.9,-26.0],[28.0,-33.0],[20.0,-34.8],[18.4,-34.2],[15.0,-26.0],[13.2,-16.0],
        [12.0,-6.0],[9.3,0.5],[9.2,4.0],[5.0,4.5],[0.5,5.6],[-4.0,5.2],[-7.8,4.4],[-13.5,9.0],[-17.4,14.7],
        [-16.2,20.8],[-13.2,27.2],[-9.8,30.4],[-7.6,33.6]
      ],
    },
    {
      name: '北美洲',
      bloc: 'western',
      points: [
        [-165.0,60.0],[-166.0,65.5],[-160.0,71.0],[-140.0,69.8],[-124.0,70.2],[-105.0,68.8],[-86.0,68.0],[-78.0,62.5],
        [-64.0,60.0],[-55.5,52.0],[-60.0,46.0],[-66.5,45.0],[-70.0,42.0],[-74.0,40.6],[-75.6,35.5],[-80.2,25.2],
        [-82.8,29.5],[-90.0,29.2],[-97.2,26.0],[-96.2,19.2],[-90.5,21.2],[-87.0,21.4],[-88.2,15.8],[-83.4,15.0],
        [-83.0,10.0],[-78.0,8.2],[-81.0,7.5],[-85.5,10.5],[-92.2,14.6],[-100.0,16.8],[-105.5,20.5],[-110.0,24.0],
        [-114.5,31.5],[-117.2,32.6],[-120.6,34.5],[-122.5,37.8],[-124.5,42.0],[-124.6,48.4],[-130.0,54.5],
        [-137.5,58.5],[-148.0,60.5],[-154.0,57.5],[-162.0,55.0]
      ],
    },
    {
      name: '南美洲',
      bloc: 'nonaligned',
      points: [
        [-78.0,9.0],[-75.5,10.5],[-71.5,12.2],[-62.0,10.5],[-58.0,6.8],[-50.0,1.5],[-42.0,-2.8],[-35.0,-6.0],
        [-38.5,-13.0],[-40.5,-22.5],[-48.5,-27.5],[-53.5,-34.0],[-58.0,-38.5],[-65.0,-43.0],[-68.0,-52.5],
        [-71.0,-54.8],[-75.0,-51.0],[-73.5,-40.0],[-71.6,-33.0],[-70.5,-18.5],[-77.0,-12.0],[-81.3,-4.8],[-79.8,1.5]
      ],
    },
    {
      name: '澳大利亚',
      bloc: 'commonwealth',
      points: [
        [114.0,-22.0],[119.0,-20.0],[122.2,-17.5],[128.0,-14.5],[131.0,-12.0],[136.5,-12.5],[136.0,-15.5],
        [141.5,-15.0],[142.5,-10.8],[145.5,-15.5],[149.5,-21.5],[153.4,-27.5],[151.2,-33.9],[149.9,-37.5],
        [141.0,-38.2],[135.5,-35.0],[131.0,-31.8],[122.0,-34.0],[115.0,-34.3],[113.5,-26.5]
      ],
    },
    { name: '格陵兰', bloc: 'western', points: [[-52,60],[-42,64],[-32,68],[-20,74],[-24,81],[-48,82],[-68,76],[-56,69]] },
    { name: '冰岛', bloc: 'western', points: [[-24,64],[-18,66],[-13.5,65],[-16,63.5],[-22,63.5]] },
    { name: '大不列颠岛', bloc: 'western', points: [[-5.6,50.1],[-1.5,50.8],[1.4,51.2],[1.7,52.8],[0.1,53.6],[-1.6,55.5],[-2.1,57.7],[-3.2,58.6],[-5.5,58.5],[-6.2,56.5],[-4.8,54.8],[-3.2,53.4],[-5.1,51.8]] },
    { name: '爱尔兰岛', bloc: 'western', points: [[-10.2,51.8],[-6.2,52.2],[-5.8,54.8],[-8.2,55.3],[-10.0,53.5]] },
    { name: '西西里与撒丁', bloc: 'western', points: [[12.4,37.8],[15.6,38.2],[15.1,36.7],[13.5,37.2]] },
    { name: '日本本州', bloc: 'western', points: [[130.9,34.0],[133.5,34.4],[135.5,34.6],[137.0,34.6],[139.8,35.4],[140.9,35.8],[141.5,38.5],[141.4,41.4],[140.2,40.8],[139.5,38.2],[136.8,37.0],[134.5,35.6],[131.8,34.8]] },
    { name: '日本九州', bloc: 'western', points: [[130.0,31.2],[131.6,31.8],[131.8,33.5],[130.4,33.8],[129.6,32.7]] },
    { name: '日本北海道', bloc: 'western', points: [[140.2,41.5],[143.2,42.1],[145.6,43.3],[144.8,44.4],[141.8,45.4],[140.8,43.2]] },
    { name: '库页岛', bloc: 'socialist', points: [[142.0,46.0],[143.5,49.0],[143.2,54.0],[141.8,53.5],[141.8,48.0]] },
    { name: '台湾岛', bloc: 'china_civil', points: [[120.2,22.0],[121.6,22.8],[121.9,25.2],[120.8,24.8],[120.1,23.2]] },
    { name: '菲律宾吕宋/棉兰老', bloc: 'western', points: [[120.0,14.0],[122.4,18.4],[124.2,13.0],[126.2,7.2],[122.0,6.8],[120.2,11.5]] },
    { name: '苏门答腊', bloc: 'nonaligned', points: [[95.3,5.5],[99.5,2.5],[105.8,-5.8],[103.5,-5.2],[98.0,0.5]] },
    { name: '爪哇岛', bloc: 'nonaligned', points: [[105.5,-6.2],[111.0,-6.8],[114.5,-8.3],[110.5,-8.0],[106.0,-7.0]] },
    { name: '加里曼丹(婆罗洲)', bloc: 'nonaligned', points: [[109.0,1.5],[115.5,5.5],[118.8,4.8],[117.5,-3.2],[111.5,-3.3],[109.2,-1.0]] },
    { name: '新几内亚岛', bloc: 'commonwealth', points: [[131.0,-1.5],[141.0,-2.6],[150.5,-10.2],[146.5,-9.5],[138.0,-5.5],[132.5,-3.8]] },
    { name: '马达加斯加', bloc: 'commonwealth', points: [[44.0,-25.2],[47.2,-25.0],[50.3,-15.2],[49.2,-12.0],[44.5,-18.0]] },
    { name: '新西兰', bloc: 'commonwealth', points: [[167.0,-46.2],[172.0,-43.2],[178.2,-37.5],[174.5,-35.5],[173.0,-41.0],[168.5,-44.5]] },
    { name: '古巴与加勒比', bloc: 'western', points: [[-84.8,21.8],[-79.5,23.1],[-74.2,20.2],[-77.5,19.8],[-82.5,21.5]] },
  ];

  // 世界主要大河（高精地形图与二战战线地标）
  const rivers = [
    { name: '伏尔加河', pts: [[34.0,57.0],[40.0,57.5],[44.0,56.3],[49.0,55.5],[48.5,52.0],[44.6,48.7],[48.0,46.3]] },
    { name: '第聂伯河', pts: [[31.5,54.5],[30.6,51.2],[30.5,50.4],[33.5,49.0],[35.1,47.8],[32.6,46.6]] },
    { name: '莱茵河', pts: [[8.5,47.5],[7.7,48.6],[8.2,50.0],[7.0,51.4],[4.5,51.9]] },
    { name: '多瑙河', pts: [[9.0,48.0],[13.5,48.5],[16.4,48.2],[19.0,47.5],[20.5,44.8],[28.8,45.2]] },
    { name: '尼罗河', pts: [[32.5,15.6],[32.8,24.0],[31.2,30.0],[31.0,31.4]] },
    { name: '长江', pts: [[98.0,30.0],[104.5,28.8],[106.6,29.6],[111.3,30.7],[114.3,30.6],[118.8,32.1],[121.6,31.3]] },
    { name: '密西西比河', pts: [[-93.2,45.0],[-90.2,38.6],[-90.0,35.1],[-91.1,30.4],[-89.3,29.1]] },
  ];

  // 世界冷战国家/地区（保持 CivilWarWorld.nations 兼容）
  const nations = [
    { id: 'ussr', name: '苏联', capital: '莫斯科', lon: 68, lat: 60, capLon: 37.6, capLat: 55.7, bloc: 'socialist', ww2Id: 'ussr',
      poly: [[26,52],[30,60],[42,68],[75,73],[135,72],[170,66],[162,56],[140,54],[132,43],[120,51],[88,49],[72,40],[54,40],[42,42],[30,46]],
      summary: '社会主义阵营与二战反法西斯东线绝对主力，拥有 T-34 钢铁洪流、喀秋莎火箭炮与乌拉尔军工集群。' },
    { id: 'east_europe', name: '东欧战区', capital: '华沙/柏林', lon: 18, lat: 51, capLon: 13.4, capLat: 52.5, bloc: 'socialist', ww2Id: 'germany',
      poly: [[10,54],[24,54],[29,46],[26,42],[19,41],[12,46]],
      summary: '二战欧陆核心主战场（柏林、华沙、鲁尔），冷战时期成为东西方对峙前沿。' },
    { id: 'china', name: '中国战区', capital: '北平/南京/重庆', lon: 105, lat: 35, capLon: 116.4, capLat: 39.9, bloc: 'china_civil', ww2Id: 'usa',
      poly: [[75,40],[88,49],[120,51],[134,48],[130,42],[124,40],[119,39],[122,31],[119,24],[109,20],[100,21],[92,28],[79,32]],
      summary: '二战东方反法西斯主战场（抗日战争）与 1945–1950 国共内战主战场；1950 年组建志愿军抗美援朝。' },
    { id: 'korea', name: '朝鲜半岛', capital: '平壤 / 汉城', lon: 127.5, lat: 38.2, capLon: 125.7, capLat: 39.0, bloc: 'korea_zone', clickableKorea: true,
      poly: [[124.2,40.2],[130.5,42.2],[129.5,35.0],[126.0,34.8],[125.0,38.0]],
      summary: '以北纬 38 度线为界，1950 年爆发抗美援朝朝鲜战争，点击可直达朝鲜战争 3D 武器库！' },
    { id: 'usa', name: '美利坚合众国', capital: '华盛顿', lon: -99, lat: 39, capLon: -77, capLat: 38.9, bloc: 'western', ww2Id: 'usa',
      poly: [[-124,49],[-95,49],[-82,45],[-67,45],[-74,40],[-81,25],[-97,26],[-117,33],[-124,42]],
      summary: '二战“民主兵工厂”，拥有埃塞克斯航母群、B-29、M4 谢尔曼与 P-51 野马，主宰欧亚双洋战线。' },
    { id: 'canada', name: '加拿大', capital: '渥太华', lon: -102, lat: 58, capLon: -75.7, capLat: 45.4, bloc: 'western', ww2Id: 'uk',
      poly: [[-140,69],[-85,68],[-55,52],[-67,45],[-95,49],[-125,49],[-138,59]],
      summary: '英联邦与大西洋护航核心，诺曼底朱诺海滩主力登陆部队。' },
    { id: 'uk_nation', name: '大英帝国', capital: '伦敦', lon: -2, lat: 54, capLon: -0.1, capLat: 51.5, bloc: 'western', ww2Id: 'uk',
      poly: [[-6,50],[2,51],[1,55],[-3,59],[-7,57]],
      summary: '皇家海军与喷火战斗机的堡垒，赢得不列颠空战、阿拉曼决战与大西洋海战。' },
    { id: 'france_nation', name: '法兰西', capital: '巴黎', lon: 2.5, lat: 46.8, capLon: 2.35, capLat: 48.85, bloc: 'western', ww2Id: 'france',
      poly: [[-4.8,48.3],[2.5,51.0],[8.2,49.0],[7.0,43.5],[3.0,42.5],[-1.8,43.4]],
      summary: '拥有夏尔 B1 bis 重坦、马奇诺要塞与黎塞留战列舰的西欧陆军强权，以及光复巴黎的自由法国。' },
    { id: 'west_europe', name: '南欧/伊比利亚/意', capital: '罗马/马德里', lon: 10, lat: 41.5, capLon: 12.5, capLat: 41.9, bloc: 'western', ww2Id: 'germany',
      poly: [[-9,37],[-9,43],[-1,43],[4,43],[14,45],[18,40],[12,38],[-5,36]],
      summary: '地中海门户与意大利战线（西西里、那不勒斯、罗马登陆战）。' },
    { id: 'japan', name: '日本', capital: '东京', lon: 138, lat: 36, capLon: 139.7, capLat: 35.7, bloc: 'western', ww2Id: 'japan',
      poly: [[130,31],[141,41],[145,44],[139,39],[132,34]],
      summary: '二战太平洋轴心核心，拥有大和号超战列舰、翔鹤/赤城航母群与零式战机。' },
    { id: 'india', name: '印度与南亚', capital: '新德里', lon: 78, lat: 21, capLon: 77.2, capLat: 28.6, bloc: 'nonaligned', ww2Id: 'uk',
      poly: [[67,25],[75,35],[88,28],[93,22],[80,8],[72,20]],
      summary: '二战英印第 14 集团军与驼峰航线援华大后方，1947 年独立。' },
    { id: 'middle_east', name: '中东与土耳其', capital: '安卡拉/开罗', lon: 42, lat: 30, capLon: 32.8, capLat: 39.9, bloc: 'nonaligned', ww2Id: 'uk',
      poly: [[26,39],[42,41],[56,26],[59,22],[44,12],[34,29],[35,36]],
      summary: '苏伊士运河、波斯走廊援苏通道与中东核心产油区。' },
    { id: 'africa', name: '北非与非洲', capital: '开罗/卡萨布兰卡', lon: 20, lat: 5, capLon: 31.2, capLat: 30.0, bloc: 'commonwealth', ww2Id: 'uk',
      poly: [[-15,26],[10,37],[33,31],[43,12],[40,-15],[28,-33],[18,-34],[12,-6],[-8,4],[-17,15]],
      summary: '二战北非阿拉曼与火炬行动战场、战后民族独立浪潮兴起地。' },
    { id: 'latam', name: '拉丁美洲', capital: '里约/布宜诺斯艾利斯', lon: -60, lat: -15, capLon: -43.2, capLat: -22.9, bloc: 'nonaligned',
      poly: [[-78,9],[-60,8],[-35,-6],[-41,-23],[-58,-38],[-67,-54],[-73,-40],[-81,-5]],
      summary: '美洲战略原料后方，巴西远征军亦赴意大利参战。' },
    { id: 'oceania', name: '澳大利亚与新西兰', capital: '堪培拉/悉尼', lon: 134, lat: -25, capLon: 151.2, capLat: -33.9, bloc: 'commonwealth', ww2Id: 'uk',
      poly: [[114,-22],[131,-12],[142,-11],[153,-27],[150,-37],[115,-34]],
      summary: '西南太平洋盟军大后方，麦克阿瑟反攻新几内亚与菲律宾的跳板。' },
  ];

  // 世界地形特征（高原/山脉/沙漠/丛林/冻土）
  const terrainFeatures = [
    { name: '青藏高原', lon: 89, lat: 33, rx: 14, ry: 6, color: 'rgba(196, 174, 146, 0.72)' },
    { name: '喜马拉雅山脉', lon: 86, lat: 28, rx: 11, ry: 2.5, color: 'rgba(232, 224, 212, 0.85)' },
    { name: '高加索山脉', lon: 44, lat: 43, rx: 6, ry: 2.2, color: 'rgba(220, 208, 194, 0.82)' },
    { name: '西伯利亚冻土', lon: 105, lat: 64, rx: 28, ry: 8, color: 'rgba(162, 174, 158, 0.56)' },
    { name: '乌拉尔山', lon: 60, lat: 59, rx: 3, ry: 10, color: 'rgba(170, 144, 112, 0.68)' },
    { name: '阿尔卑斯山', lon: 10, lat: 46.2, rx: 6, ry: 2.3, color: 'rgba(226, 222, 212, 0.85)' },
    { name: '阿登森林', lon: 5.5, lat: 50.0, rx: 2.4, ry: 1.5, color: 'rgba(72, 118, 68, 0.72)' },
    { name: '落基山脉', lon: -112, lat: 46, rx: 7, ry: 16, color: 'rgba(186, 152, 114, 0.72)' },
    { name: '安第斯山脉', lon: -70, lat: -22, rx: 4, ry: 26, color: 'rgba(198, 162, 126, 0.8)' },
    { name: '撒哈拉沙漠', lon: 12, lat: 22, rx: 22, ry: 7, color: 'rgba(218, 194, 138, 0.78)' },
    { name: '阿拉伯沙漠', lon: 45, lat: 22, rx: 9, ry: 6, color: 'rgba(216, 190, 134, 0.72)' },
    { name: '蒙古与戈壁', lon: 103, lat: 44, rx: 13, ry: 4, color: 'rgba(204, 186, 136, 0.68)' },
    { name: '东南亚热带丛林', lon: 104, lat: 6, rx: 14, ry: 8, color: 'rgba(66, 124, 68, 0.62)' },
    { name: '亚马孙盆地', lon: -61, lat: -4, rx: 13, ry: 7, color: 'rgba(84, 134, 78, 0.62)' },
    { name: '刚果盆地', lon: 22, lat: 0, rx: 9, ry: 6, color: 'rgba(90, 136, 82, 0.58)' },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // HOI4 二战全球沙盘实时推演引擎 (WW2Sim)
  // ══════════════════════════════════════════════════════════════════════
  const ww2FocusTrees = {
    usa: [
      { id: 'us_arsenal', name: '民主兵工厂', days: 25, desc: '军工产能 +25，每月坦克/飞机产出翻倍', effect: (s, f) => { f.mil += 25; f.stock.tanks += 120; f.stock.planes += 140; } },
      { id: 'us_lendlease', name: '签署租借法案', days: 20, desc: '向英苏法提供巨量装备，同时我方政治点 +60、战争支持 +10%', effect: (s, f) => { f.pp += 60; f.warSupport = Math.min(100, f.warSupport + 10); } },
      { id: 'us_two_ocean', name: '两洋海军法案', days: 30, desc: '新建埃塞克斯航母 +4、战列舰 +2，全面掌控大西洋与太平洋', effect: (s, f) => { f.stock.ships += 6; f.navalPower += 45; } },
    ],
    ussr: [
      { id: 'su_ural', name: '乌拉尔军工大转移', days: 25, desc: '军工 +28，T-34/85 +180，喀秋莎重炮 +120', effect: (s, f) => { f.mil += 28; f.stock.tanks += 180; f.stock.artillery += 120; } },
      { id: 'su_not_one_step', name: '第227号令·一步不退', days: 20, desc: '全军组织度恢复与防御 +20%，人力 +400K', effect: (s, f) => { f.manpowerK += 400; f.warSupport = Math.min(100, f.warSupport + 15); } },
      { id: 'su_deep_battle', name: '大纵深钢铁洪流', days: 30, desc: '近卫坦克集团军突破力暴涨，坦克 +220、伊尔-2 强击机 +150', effect: (s, f) => { f.stock.tanks += 220; f.stock.planes += 150; } },
    ],
    uk: [
      { id: 'uk_never_surrender', name: '绝不投降演说', days: 20, desc: '本土防空与陆军士气大振，政治点 +50，战争支持 +15%', effect: (s, f) => { f.pp += 50; f.warSupport = Math.min(100, f.warSupport + 15); } },
      { id: 'uk_dowding', name: '道丁雷达与喷火量产', days: 25, desc: '喷火战斗机 +160，西欧制空权大幅提升', effect: (s, f) => { f.stock.planes += 160; f.airPower += 40; } },
      { id: 'uk_royal_navy', name: '皇家海军光辉航母编队', days: 30, desc: '装甲航母与护航舰队 +6，掌控大西洋与地中海', effect: (s, f) => { f.stock.ships += 6; f.navalPower += 40; } },
    ],
    france: [
      { id: 'fr_extend_maginot', name: '延伸马奇诺至色当与海峡', days: 25, desc: '色当与敦刻尔克立刻获得 +3 级混凝土要塞！', effect: (s) => { s.forts.sedan = Math.min(6, (s.forts.sedan || 0) + 3); s.forts.dunkirk = Math.min(6, (s.forts.dunkirk || 0) + 3); } },
      { id: 'fr_degaulle_armor', name: '采纳戴高乐集中装甲论', days: 25, desc: '夏尔 B1 bis 与索玛 S35 +140，摆脱指挥迟缓', effect: (s, f) => { f.stock.tanks += 140; f.pp += 40; } },
      { id: 'fr_free_empire', name: '法兰西海外帝国总动员', days: 20, desc: '从北非与殖民地征召 300K 兵员与黎塞留舰队增援', effect: (s, f) => { f.manpowerK += 300; f.stock.ships += 3; } },
    ],
    japan: [
      { id: 'jp_southern_strike', name: '南进政策与机动部队', days: 20, desc: '零式舰战 +150，第一航空舰队制海突袭 +35', effect: (s, f) => { f.stock.planes += 150; f.navalPower += 35; } },
      { id: 'jp_yamato', name: '大和级超战列舰服役', days: 30, desc: '大和/武藏号入列，海军主力舰 +4、炮击压制暴涨', effect: (s, f) => { f.stock.ships += 4; f.navalPower += 45; } },
      { id: 'jp_island_forts', name: '绝对国防圈坑道要塞', days: 25, desc: '冲绳、硫磺岛与东京要塞等级 +2，火炮 +120', effect: (s, f) => { s.forts.okinawa = (s.forts.okinawa || 2) + 2; s.forts.iwo_jima = (s.forts.iwo_jima || 2) + 2; f.stock.artillery += 120; } },
    ],
    germany: [
      { id: 'ge_blitzkrieg', name: '装甲闪电战总攻', days: 20, desc: '四号/虎式坦克 +180，斯图卡 +120，进攻速度大增', effect: (s, f) => { f.stock.tanks += 180; f.stock.planes += 120; } },
      { id: 'ge_total_war', name: '斯佩尔总体战动员', days: 25, desc: '军工产能 +30，88mm 炮 +150，人力 +450K', effect: (s, f) => { f.mil += 30; f.stock.artillery += 150; f.manpowerK += 450; } },
      { id: 'ge_uboat', name: '邓尼茨 U 艇狼群', days: 25, desc: '远洋潜艇与俾斯麦舰队 +8，重创盟军大西洋补给', effect: (s, f) => { f.stock.ships += 8; f.navalPower += 35; } },
    ],
    china: [
      { id: 'ch_hundred_regiments', name: '百团大战与敌后破袭', days: 20, desc: '华北抗日武装全面动员，步兵武器 +320，人力 +500K，战争支持 +12%', effect: (s, f) => { f.stock.infantry += 320; f.manpowerK += 500; f.warSupport = Math.min(100, f.warSupport + 12); } },
      { id: 'ch_tianlu', name: '长沙天炉战法要塞', days: 25, desc: '长沙、重庆与延安要塞等级 +2，火炮 +140', effect: (s, f) => { s.forts.changsha = (s.forts.changsha || 2) + 2; s.forts.chongqing = (s.forts.chongqing || 2) + 2; f.stock.artillery += 140; } },
      { id: 'ch_ledo_road', name: '驼峰航线与驻印美械换装', days: 25, desc: '飞虎队战机 +120、美援谢尔曼/斯图亚特坦克 +95、105mm 榴弹炮 +110', effect: (s, f) => { f.stock.planes += 120; f.stock.tanks += 95; f.stock.artillery += 110; } },
    ],
  };

  function buildAdjacency(WW2) {
    const adj = new Map();
    for (const c of WW2.cities) adj.set(c.id, []);
    for (const [a, b, kind] of WW2.routes) {
      if (adj.has(a) && adj.has(b)) {
        adj.get(a).push({ to: b, kind });
        adj.get(b).push({ to: a, kind });
      }
    }
    return adj;
  }

  const ww2Doctrines = {
    mobile: { id: 'mobile', name: '机动战学说（闪电战）', desc: '装甲突破 +25%，行军速度 +20%', atkMult: 1.12, armorMult: 1.25, defMult: 1.0, speedMult: 1.2, orgRec: 1.0 },
    firepower: { id: 'firepower', name: '优势火力学说', desc: '重炮与软攻 +22%，空中支援 +15%', atkMult: 1.2, armorMult: 1.05, defMult: 1.08, speedMult: 1.0, orgRec: 1.0 },
    grand: { id: 'grand', name: '决战计划学说', desc: '堑壕防御 +25%，要塞与两栖规划 +15%', atkMult: 1.06, armorMult: 1.0, defMult: 1.24, speedMult: 1.0, orgRec: 1.1 },
    mass: { id: 'mass', name: '大纵深 / 人海突击', desc: '组织度恢复 +35%，补员翻倍，持久战无惧消耗', atkMult: 1.05, armorMult: 1.0, defMult: 1.12, speedMult: 1.05, orgRec: 1.35 },
  };

  const ww2TechCatalog = [
    { id: 'heavy_armor', name: '重型坦克工程（虎式/IS-2/潘兴）', cost: 25, desc: '全军装甲战力 +18%，立刻交付 60 辆重坦', apply: (f) => { f.stock.tanks += 60; f.techBonus.armor += 0.18; } },
    { id: 'radar_net', name: '道丁雷达与夜间截击网', cost: 22, desc: '制空战力 +25，本土防御 +12%', apply: (f) => { f.airPower += 25; f.techBonus.def += 0.12; } },
    { id: 'jet_engine', name: '喷气式战机（Me262/流星/P-80）', cost: 35, desc: '战机 +80，空优压制 +30', apply: (f) => { f.stock.planes += 80; f.airPower += 30; } },
    { id: 'amphibious', name: '希金斯两栖登陆艇与人工港', cost: 24, desc: '跨海登陆惩罚大幅降低，海军 +20', apply: (f) => { f.navalPower += 20; f.techBonus.sea += 0.25; } },
    { id: 'rocket_art', name: '喀秋莎/火箭炮与 VT 近炸引信', cost: 26, desc: '全军火炮压制 +20%，火炮 +90', apply: (f) => { f.stock.artillery += 90; f.techBonus.atk += 0.20; } },
    { id: 'atomic_proj', name: '超级战略武器工程（曼哈顿/核威慑）', cost: 50, desc: '战略轰炸与全军攻势 +30%，政治点 +60', apply: (f) => { f.pp += 60; f.techBonus.atk += 0.30; } },
  ];

  const ww2HistoricalEvents = [
    {
      id: 'ev_lend_lease', title: '📜 租借法案与民主兵工厂扩产', desc: '是否将民用工业紧急转产军工并向盟友开放装备租借？',
      choices: [
        { label: '全力转产军工（军工+12，坦克+80，稳定-4）', apply: (s, f) => { f.mil += 12; f.stock.tanks += 80; f.stability = Math.max(20, f.stability - 4); } },
        { label: '稳健保民经济（政点+45，稳定+6）', apply: (s, f) => { f.pp += 45; f.stability = Math.min(100, f.stability + 6); } },
      ],
    },
    {
      id: 'ev_enigma', title: '🕵️ 截获敌军最高司令部无线电密码本', desc: '密码破译部门已捕捉到敌军主力调动频率，如何运用？',
      choices: [
        { label: '立即破译发动决战爆发（30天攻防+15%）', apply: (s, f) => { f.intel.cipher = 100; f.intel.burstDays = 30; } },
        { label: '长期潜伏建网（情报网+45%，指挥点+35）', apply: (s, f) => { f.intel.network = Math.min(100, f.intel.network + 45); f.cp += 35; } },
      ],
    },
    {
      id: 'ev_winter_offensive', title: '❄️ 战略总反攻动员令', desc: '前线敌军补给线已拉长至极限，是否集结预备队发动全面反攻？',
      choices: [
        { label: '动员预备役全面反攻（全军组织度满值，火炮+80，政点-20）', apply: (s, f) => { f.pp = Math.max(0, f.pp - 20); f.stock.artillery += 80; s.armies.filter((a) => a.nation === f.id && a.strength > 0).forEach((a) => { a.org = 100; }); } },
        { label: '稳扎稳打深挖战壕（全军堑壕+3，人力+250K）', apply: (s, f) => { f.manpowerK += 250; s.armies.filter((a) => a.nation === f.id && a.strength > 0).forEach((a) => { a.entrench = Math.min(10, a.entrench + 3); }); } },
      ],
    },
    {
      id: 'ev_airborne_ops', title: '🪂 敌后空降与游击奇袭计划', desc: '空降军与敌后游击纵队已准备就绪，可随时突袭敌方后勤枢纽。',
      choices: [
        { label: '批准空降整训（指挥点+40，战机+50）', apply: (s, f) => { f.cp += 40; f.stock.planes += 50; } },
        { label: '改派物资援助铁路后勤（步兵军械+250，补给机动升至卡车）', apply: (s, f) => { f.stock.infantry += 250; f.supplyMotor = Math.min(2, f.supplyMotor + 1); } },
      ],
    },
  ];

  const ww2NeutralMinors = [
    { id: 'finland', name: '芬兰（冬季战争精锐）', bonusDesc: '人力+150K，严寒防御强化', apply: (f) => { f.manpowerK += 150; f.stock.infantry += 180; } },
    { id: 'turkey', name: '土耳其（黑海海峡门户）', bonusDesc: '民工+6，军工+4，战略钢铁+20', apply: (f) => { f.civ += 6; f.mil += 4; f.resources.steel += 20; } },
    { id: 'brazil', name: '巴西（美洲橡胶与远征军）', bonusDesc: '石油+15，运输船+30，人力+120K', apply: (f) => { f.resources.oil += 15; f.convoys += 30; f.manpowerK += 120; } },
    { id: 'spain', name: '西班牙（直布罗陀侧翼）', bonusDesc: '军工+5，步兵军械+220', apply: (f) => { f.mil += 5; f.stock.infantry += 220; } },
    { id: 'sweden', name: '瑞典（北欧铁矿石产地）', bonusDesc: '战略钢铁+35，军工+6', apply: (f) => { f.resources.steel += 35; f.mil += 6; } },
  ];

  const ww2GeneralTraits = {
    panzer_leader: { id: 'panzer_leader', name: '装甲专家', desc: '装甲突破与硬攻 +18%' },
    desert_fox: { id: 'desert_fox', name: '沙漠之狐', desc: '沙漠与低补给适应 +20%' },
    mountaineer: { id: 'mountaineer', name: '山地战大师', desc: '山地与严寒攻防 +18%' },
    amphibious_expert: { id: 'amphibious_expert', name: '两栖跳岛专家', desc: '跨海登陆惩罚减半' },
    field_marshal: { id: 'field_marshal', name: '陆军元帅统御', desc: '全军组织度上限与恢复 +15%' },
  };

  const ww2MIOByNation = {
    usa: [{ id: 'mio_tank', name: '底特律坦克兵工厂', kind: 'tanks' }, { id: 'mio_air', name: '洛克希德/波音航空', kind: 'planes' }, { id: 'mio_navy', name: '纽波特纽斯造船厂', kind: 'ships' }],
    ussr: [{ id: 'mio_tank', name: '莫罗佐夫/乌拉尔坦克厂', kind: 'tanks' }, { id: 'mio_air', name: '伊留申/雅科夫列夫设计局', kind: 'planes' }, { id: 'mio_navy', name: '波罗的海造船厂', kind: 'ships' }],
    uk: [{ id: 'mio_tank', name: '维克斯-阿姆斯特朗装甲', kind: 'tanks' }, { id: 'mio_air', name: '超级马林航空(喷火)', kind: 'planes' }, { id: 'mio_navy', name: '约翰·布朗皇家造船厂', kind: 'ships' }],
    france: [{ id: 'mio_tank', name: '雷诺/索玛装甲设计局', kind: 'tanks' }, { id: 'mio_air', name: '德瓦蒂纳航空', kind: 'planes' }, { id: 'mio_navy', name: '布雷斯特海军造船厂', kind: 'ships' }],
    japan: [{ id: 'mio_tank', name: '大阪陆军造兵厂', kind: 'tanks' }, { id: 'mio_air', name: '三菱重工航空(零战)', kind: 'planes' }, { id: 'mio_navy', name: '吴海军工厂(大和级)', kind: 'ships' }],
    germany: [{ id: 'mio_tank', name: '亨舍尔/保时捷/克虏伯', kind: 'tanks' }, { id: 'mio_air', name: '梅塞施密特/容克斯', kind: 'planes' }, { id: 'mio_navy', name: '布洛姆-福斯造船厂(U艇)', kind: 'ships' }],
    china: [{ id: 'mio_tank', name: '金陵/汉阳兵工厂', kind: 'tanks' }, { id: 'mio_air', name: '中美航空修理厂', kind: 'planes' }, { id: 'mio_navy', name: '江南造船所', kind: 'ships' }],
  };

  function getWW2SeasonWeather(month) {
    if (month === 11 || month === 12 || month === 1 || month === 2) {
      return { id: 'winter', name: '❄️ 东线严冬（冬将军）', atkPen: 0.84, speedPen: 0.78 };
    }
    if (month === 3 || month === 4 || month === 10) {
      return { id: 'mud', name: '🌧️ 泥泞翻浆季', atkPen: 0.92, speedPen: 0.72 };
    }
    if (month === 7 || month === 8 || month === 9) {
      return { id: 'typhoon', name: '🌀 太平洋台风季', atkPen: 0.95, speedPen: 0.90 };
    }
    return { id: 'clear', name: '☀️ 晴朗适宜进攻', atkPen: 1.0, speedPen: 1.0 };
  }

  function createWW2Game(WW2, scenarioId = 'ww2-1941-barbarossa', playerId = 'ussr') {
    const sc = WW2.scenarios.find((x) => x.id === scenarioId) || WW2.scenarios[0];
    const [yr, mo, dy] = sc.date.split('-').map(Number);
    const owners = { ...sc.owners };
    const forts = {};
    for (const c of WW2.cities) forts[c.id] = c.fort || 0;

    const nationsState = {};
    for (const f of Object.values(WW2.factions)) {
      nationsState[f.id] = {
        id: f.id, bloc: f.bloc, name: f.name, short: f.short,
        pp: 65, cp: 45, stability: 78, warSupport: 72,
        civ: f.industry.civ, mil: f.industry.mil, dock: f.industry.dock,
        manpowerK: f.industry.manpowerK,
        resources: { oil: f.industry.oil || 30, steel: f.industry.steel || 50 },
        fuel: 85, // 石油燃料储备 0–100%（坦克/飞机/军舰实时消耗！）
        convoys: 60 + Math.round(f.industry.dock * 2.5), // 运输船队（租借/贸易/海岛补给命脉）
        capitalShips: Math.max(1, Math.round(f.industry.dock * 0.22)), // 主力舰（航母/战列舰）
        screenShips: Math.max(4, Math.round(f.industry.dock * 0.72)), // 屏卫舰（驱逐舰/轻巡，1主力需3屏卫=100%屏卫率）
        mioLevels: { mio_tank: 1, mio_air: 1, mio_navy: 1 }, // MIO 军工设计局等级(1-5)
        exileGov: false, // 流亡政府状态
        warScore: 0, // 和谈会议战争分数
        puppets: [], // 附庸傀儡国列表
        alliedMinors: [], // 拉拢入盟的中立国
        equipDesign: {
          tankGun: '75mm', tankArmor: 'sloped', tankEngine: 'diesel',
          planeRole: 'fighter', planeRange: 'standard',
          shipFocus: 'balanced',
        },
        customTemplate: { inf: 7, art: 2, tank: 1, support: 1 }, // 自由师编网格（可凑 20/27/40 宽）
        stock: {
          infantry: 1200 + f.industry.mil * 10,
          artillery: 220 + f.industry.mil * 3,
          tanks: 160 + f.industry.mil * 2,
          planes: 180 + f.industry.mil * 2,
          ships: 8 + Math.round(f.industry.dock * 0.4),
        },
        airPower: 40 + Math.round(f.industry.mil * 0.6),
        navalPower: 30 + Math.round(f.industry.dock * 1.1),
        activeFocus: null,
        completedFocuses: [],
        doctrine: f.doctrine,
        doctrineId: f.id === 'germany' ? 'mobile' : f.id === 'usa' ? 'firepower' : f.id === 'ussr' || f.id === 'china' ? 'mass' : 'grand',
        laws: { conscription: 'limited', economy: 'war_eco' },
        prodShare: { infantry: 30, artillery: 25, tanks: 25, planes: 20 },
        supplyMotor: 1, // 0马车 | 1单卡车 | 2双卡车
        techs: [],
        techBonus: { atk: 0, def: 0, armor: 0, sea: 0 },
        intel: { network: 20, cipher: 35, burstDays: 0 },
        eventsDone: [],
        airMission: 'air_superiority', // air_superiority | cas | strat_bomb | logistic
        navalMission: 'strike_force', // strike_force | convoy_raid | escort
      };
    }

    const wars = (sc.wars || []).map(([a, b]) => [a, b]);
    const armies = [];
    for (const f of Object.values(WW2.factions)) {
      for (const c of f.corps) {
        // 确保部队部署在本方或同阵营同战区城市，否则落到该国核心首都
        let spawnCity = c.city;
        const cityOwner = owners[spawnCity];
        const sameNation = cityOwner === f.id;
        const sameBloc = cityOwner && WW2.factions[cityOwner]?.bloc === f.bloc;
        if (!sameNation && !sameBloc) {
          spawnCity = Object.keys(owners).find((cid) => owners[cid] === f.id && WW2.cities.find((x) => x.id === cid)?.theater === c.theater)
            || Object.keys(owners).find((cid) => owners[cid] === f.id)
            || Object.keys(owners).find((cid) => WW2.factions[owners[cid]]?.bloc === f.bloc && WW2.cities.find((x) => x.id === cid)?.theater === c.theater)
            || Object.keys(owners).find((cid) => WW2.factions[owners[cid]]?.bloc === f.bloc)
            || c.city;
        }
        armies.push({
          id: c.id,
          nation: f.id,
          bloc: f.bloc,
          homeTheater: c.theater || WW2.cities.find((x) => x.id === spawnCity)?.theater || 'global',
          name: c.name,
          commander: c.commander,
          city: spawnCity,
          strength: c.strength,
          maxStrength: c.strength,
          tanks: c.tanks,
          artillery: c.artillery,
          org: 100,
          entrench: 2,
          planBonus: 12, // HOI4 作战计划准备加成 0–45%
          amphibPrep: 0, // HOI4 两栖登陆筹备进度 0–100%
          vet: 0, // 老兵经验 0–3 星（与国内内战一致）
          traits: [], // 将领养成特质列表
          order: 'defend', // defend | rest | attack | support | siege | intercept | move
          target: null,
          progress: 0,
        });
      }
    }

    // 史实特混舰队（三排海战阵型：前排驱逐 DD / 中排主力 BB+CA / 后排航母 CV + 潜艇 SS）
    const taskForces = {
      usa: { name: 'TF58 快速航母特混舰队', cv: 6, bb: 6, ca: 10, dd: 42, ss: 18 },
      japan: { name: '第一航空舰队（南云机动部队）', cv: 5, bb: 5, ca: 9, dd: 32, ss: 14 },
      uk: { name: '皇家本土与远东特混舰队', cv: 4, bb: 6, ca: 10, dd: 36, ss: 12 },
      germany: { name: '公海舰队与大西洋 U 艇狼群', cv: 0, bb: 3, ca: 5, dd: 16, ss: 34 },
      ussr: { name: '波罗的海与黑海红旗舰队', cv: 0, bb: 2, ca: 4, dd: 18, ss: 16 },
      france: { name: '地中海与大西洋分舰队', cv: 1, bb: 3, ca: 6, dd: 20, ss: 10 },
      china: { name: '江海防巡防舰队', cv: 0, bb: 0, ca: 1, dd: 4, ss: 0 },
    };

    return {
      scenarioId: sc.id,
      scenarioTitle: sc.title,
      player: playerId,
      date: { y: yr, m: mo, d: dy },
      dayCount: 0,
      worldTension: sc.id === 'ww2-1938-china' ? 40 : sc.id === 'ww2-1940' ? 72 : 100,
      theater: sc.focus || 'global',
      historyMode: 'dynamic', // historical | dynamic
      nightMode: false,
      aiDelegate: false, // 委任总参谋部 AI 接管玩家部队
      winner: null,
      wars,
      owners,
      initialOwners: { ...owners },
      forts,
      radars: { london: 2, berlin: 1, tokyo: 1, pearl_harbor: 2 },
      blockaded: {},
      vichyTriggered: false,
      uralRelocated: false,
      taskForces,
      lastNavalBattle: null,
      resistance: {},
      railDamaged: {},
      barraged: {},
      nukedCities: {},
      effects: [], // { type: 'blitz'|'naval_air'|'nuke', from, to, startMs, durationMs }
      stats: { casualties: {}, pow: {}, capturedTanks: {}, capturedGuns: {} },
      nations: nationsState,
      armies,
      battles: [],
      log: [`${sc.date} · 《${sc.title}》开战！你执掌 ${WW2.factions[playerId]?.name}，可按钢铁雄心4方式统帅全球陆海空三军！`],
    };
  }

  function isHostile(WW2, nationA, nationB, state = null) {
    if (!nationA || !nationB || nationA === nationB) return false;
    if (state && Array.isArray(state.wars)) {
      return state.wars.some(([x, y]) => (x === nationA && y === nationB) || (x === nationB && y === nationA));
    }
    const bA = WW2.factions[nationA]?.bloc;
    const bB = WW2.factions[nationB]?.bloc;
    if (!bA || !bB) return false;
    return (bA === 'axis') !== (bB === 'axis');
  }

  function theaterAllowed(homeTheater, cityTheater) {
    if (!homeTheater || homeTheater === 'global' || !cityTheater) return true;
    if (homeTheater === cityTheater) return true;
    const pairs = {
      europe: ['europe', 'east', 'africa'],
      east: ['east', 'europe'],
      africa: ['africa', 'europe'],
      china: ['china', 'pacific'],
      pacific: ['pacific', 'china'],
      america: ['america', 'europe', 'pacific'],
    };
    return (pairs[homeTheater] || [homeTheater]).includes(cityTheater);
  }

  function issueWW2Order(WW2, state, armyId, order, targetCityId = null) {
    const a = state.armies.find((u) => u.id === armyId);
    if (!a || a.strength <= 0) return { ok: false, error: '部队不存在或已失去战力。' };
    if (order === 'defend' || order === 'rest') {
      a.order = order; a.target = null; a.progress = 0;
      return { ok: true };
    }
    const adj = buildAdjacency(WW2);
    const link = (adj.get(a.city) || []).find((x) => x.to === targetCityId);
    if (!link) return { ok: false, error: '目标城市与当前驻地无直接铁路、公路或海运航线相连。' };
    const targetOwner = state.owners[targetCityId];
    const hostile = isHostile(WW2, a.nation, targetOwner, state);
    if (order === 'move' && hostile) order = 'attack';
    if ((order === 'attack' || order === 'support' || order === 'siege' || order === 'intercept') && !hostile) order = 'move';
    a.order = order;
    a.target = targetCityId;
    a.progress = 0;
    return { ok: true, linkKind: link.kind };
  }

  function fortifyWW2City(WW2, state, nationId, cityId) {
    const ns = state.nations[nationId];
    if (!ns || state.owners[cityId] !== nationId) return { ok: false, error: '只能在本国控制城市修筑要塞工事。' };
    if (ns.pp < 15) return { ok: false, error: '修筑工事需要 15 政治点。' };
    if ((state.forts[cityId] || 0) >= 6) return { ok: false, error: '该城要塞已达最高 6 级。' };
    ns.pp -= 15;
    state.forts[cityId] = (state.forts[cityId] || 0) + 1;
    const cName = WW2.cities.find((c) => c.id === cityId)?.name || cityId;
    state.log.push(`${formatDate(state.date)} · 🏰 ${ns.short}在 ${cName} 修筑要塞工事至 ${state.forts[cityId]} 级！`);
    return { ok: true };
  }

  function scorchedEarthWW2(WW2, state, nationId, cityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 15) return { ok: false, error: '破袭铁路需要 15 政治点。' };
    ns.pp -= 15;
    state.railDamaged = state.railDamaged || {};
    state.railDamaged[cityId] = 12;
    const cName = WW2.cities.find((c) => c.id === cityId)?.name || cityId;
    state.log.push(`${formatDate(state.date)} · 🔥 ${ns.short}对 ${cName} 实施焦土铁路破袭（12 天断轨低补给）！`);
    return { ok: true };
  }

  function citySupplyLevel(WW2, state, cityId) {
    if ((state.blockaded?.[cityId] || 0) > 0) return 10; // HOI4 太平洋孤岛海运封锁断粮！
    if ((state.railDamaged?.[cityId] || 0) > 0) return 30;
    const owner = state.owners[cityId];
    const motorBonus = (state.nations[owner]?.supplyMotor || 0) * 12;
    const hasRail = WW2.routes.some(([a, b, k]) => k === 'rail' && (a === cityId || b === cityId)
      && state.owners[a === cityId ? b : a] === owner);
    return Math.min(120, (hasRail ? 95 : 62) + motorBonus);
  }

  function setWW2Doctrine(state, nationId, doctrineId) {
    const ns = state.nations[nationId];
    if (!ns || !ww2Doctrines[doctrineId]) return { ok: false, error: '无效学说。' };
    if (ns.doctrineId === doctrineId) return { ok: true };
    if (ns.pp < 25) return { ok: false, error: '切换陆军学说需要 25 政治点。' };
    ns.pp -= 25;
    ns.doctrineId = doctrineId;
    ns.doctrine = ww2Doctrines[doctrineId].name;
    state.log.push(`${formatDate(state.date)} · 📘 ${ns.short}切换陆军学说为【${ww2Doctrines[doctrineId].name}】！`);
    return { ok: true };
  }

  function setWW2Law(state, nationId, kind, value) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 20) return { ok: false, error: '调整国家法令需要 20 政治点。' };
    ns.pp -= 20;
    ns.laws[kind] = value;
    if (kind === 'conscription') {
      const bonus = value === 'all_adults' ? 1200 : value === 'extensive' ? 600 : 250;
      ns.manpowerK += bonus;
      state.log.push(`${formatDate(state.date)} · 📜 ${ns.short}颁布新征兵法，新增预备人力 +${bonus}K！`);
    } else if (kind === 'economy') {
      const milAdd = value === 'total_mob' ? 18 : value === 'war_eco' ? 10 : 4;
      ns.mil += milAdd;
      state.log.push(`${formatDate(state.date)} · 🏭 ${ns.short}切换经济动员法案，军工产能 +${milAdd}！`);
    }
    return { ok: true };
  }

  function researchWW2Tech(state, nationId, techId) {
    const ns = state.nations[nationId];
    const t = ww2TechCatalog.find((x) => x.id === techId);
    if (!ns || !t) return { ok: false, error: '未找到该科技项目。' };
    if (ns.techs.includes(techId)) return { ok: false, error: '该科技已研发完成。' };
    if (ns.pp < t.cost) return { ok: false, error: `研发需要 ${t.cost} 政治点/科研经费。` };
    ns.pp -= t.cost;
    ns.techs.push(techId);
    t.apply(ns);
    state.log.push(`${formatDate(state.date)} · 🔬 ${ns.short}突破关键二战科技：【${t.name}】！`);
    return { ok: true };
  }

  function ww2IntelAction(state, nationId, action) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (action === 'network') {
      if (ns.pp < 15) return { ok: false, error: '潜伏建网需要 15 政治点。' };
      ns.pp -= 15;
      ns.intel.network = Math.min(100, ns.intel.network + 30);
      state.log.push(`${formatDate(state.date)} · 🕵️ ${ns.short}隐蔽战线渗透敌后，情报网提升至 ${ns.intel.network}%（削弱敌方堑壕）。`);
      return { ok: true };
    }
    if (action === 'decrypt') {
      if (ns.pp < 20) return { ok: false, error: '密码破译需要 20 政治点。' };
      ns.pp -= 20;
      ns.intel.cipher = Math.min(100, ns.intel.cipher + 45);
      state.log.push(`${formatDate(state.date)} · 📻 ${ns.short}电台密码破译进度达到 ${ns.intel.cipher}%！`);
      return { ok: true };
    }
    if (action === 'burst') {
      if (ns.intel.cipher < 100) return { ok: false, error: '需先将密码破译至 100% 才能启动决战爆发。' };
      ns.intel.cipher = 0;
      ns.intel.burstDays = 30;
      state.log.push(`${formatDate(state.date)} · ⚡ ${ns.short}启动【密码破译决战爆发】：未来 30 天全军攻防 +15%！`);
      return { ok: true };
    }
    return { ok: false, error: '未知情报行动。' };
  }

  function airborneWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (!isHostile(WW2, nationId, state.owners[targetCityId], state)) return { ok: false, error: '敌后空降奇袭必须指向敌占城市。' };
    if (ns.cp < 25) return { ok: false, error: '空降/敌后奇袭需要 25 指挥点。' };
    ns.cp -= 25;
    state.railDamaged[targetCityId] = 10;
    const defenders = state.armies.filter((u) => u.city === targetCityId && u.strength > 0);
    const cName = WW2.cities.find((c) => c.id === targetCityId)?.name || targetCityId;
    if (!defenders.length) {
      state.owners[targetCityId] = nationId;
      state.log.push(`${formatDate(state.date)} · 🪂 空降奇袭大捷！${ns.short}伞兵直插空城夺取 ${cName}！`);
    } else {
      for (const d of defenders) d.org = Math.max(10, d.org - 28);
      state.log.push(`${formatDate(state.date)} · 🪂 ${ns.short}空降兵/游击队奇袭 ${cName}，炸断铁路并重创守军组织度 -28！`);
    }
    return { ok: true };
  }

  function barrageWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (!isHostile(WW2, nationId, state.owners[targetCityId], state)) return { ok: false, error: '炮火覆盖必须选择敌占城市。' };
    if (ns.cp < 20) return { ok: false, error: '重炮火力覆盖需要 20 指挥点。' };
    ns.cp -= 20;
    state.barraged[targetCityId] = 5;
    state.forts[targetCityId] = Math.max(0, (state.forts[targetCityId] || 0) - 1);
    for (const d of state.armies.filter((u) => u.city === targetCityId && u.strength > 0)) {
      d.org = Math.max(5, d.org - 25);
    }
    const cName = WW2.cities.find((c) => c.id === targetCityId)?.name || targetCityId;
    state.log.push(`${formatDate(state.date)} · 💣 ${ns.short}对 ${cName} 实施 5 日重炮火力覆盖（工事 -1，守军组织度 -25）！`);
    return { ok: true };
  }

  function commandSkillWW2(state, nationId, armyId, skill) {
    const ns = state.nations[nationId];
    const a = state.armies.find((u) => u.id === armyId && u.nation === nationId && u.strength > 0);
    if (!ns || !a) return { ok: false, error: '请先选中本国现役集团军。' };
    if (ns.cp < 15) return { ok: false, error: '指挥技能需要 15 指挥点。' };
    ns.cp -= 15;
    if (skill === 'force_march') {
      a.progress = Math.min(95, a.progress + 45);
      state.log.push(`${formatDate(state.date)} · ⚡ ${a.name}发动【强行军】，行军进度大幅跃进！`);
    } else if (skill === 'last_stand') {
      a.org = 100;
      a.entrench = Math.min(10, a.entrench + 4);
      a.order = 'defend';
      state.log.push(`${formatDate(state.date)} · 🛡 ${a.name}下达【一步不退死守令】，组织度回满、堑壕 +4！`);
    }
    return { ok: true };
  }

  function portGarrisonWW2(WW2, state, nationId) {
    const ports = WW2.cities.filter((c) => c.port && state.owners[c.id] === nationId);
    const armies = state.armies.filter((a) => a.nation === nationId && a.strength > 0);
    if (!ports.length || !armies.length) return { ok: false, error: '无本国港口或可调部队。' };
    for (const a of armies) {
      if (ports.some((p) => p.id === a.city)) {
        a.order = 'defend'; a.target = null; a.entrench = Math.min(10, a.entrench + 2);
      }
    }
    state.log.push(`${formatDate(state.date)} · ⚓ ${state.nations[nationId].short}启动【沿海港口专守令】，各港驻军掘壕严防两栖登陆！`);
    return { ok: true };
  }

  function applyWW2Event(state, nationId, eventId, choiceIdx = 0) {
    const ns = state.nations[nationId];
    const ev = ww2HistoricalEvents.find((x) => x.id === eventId);
    if (!ns || !ev || !ev.choices[choiceIdx]) return { ok: false, error: '事件或选项无效。' };
    if (ns.eventsDone.includes(eventId)) return { ok: false, error: '该历史事件已完成抉择。' };
    ns.eventsDone.push(eventId);
    ev.choices[choiceIdx].apply(state, ns);
    state.log.push(`${formatDate(state.date)} · 📜 ${ns.short}历史抉择《${ev.title}》：${ev.choices[choiceIdx].label}`);
    return { ok: true };
  }

  function blitzkriegStrikeWW2(WW2, state, nationId, armyId, targetCityId) {
    const ns = state.nations[nationId];
    const a = state.armies.find((u) => u.id === armyId && u.nation === nationId && u.strength > 0);
    if (!ns || !a) return { ok: false, error: '请先选中本国装甲集团军。' };
    if (a.tanks < 400) return { ok: false, error: '发动多坦克装甲闪电战需要至少 400 辆坦克编成。' };
    if (ns.cp < 20) return { ok: false, error: '装甲闪电突击需要 20 指挥点。' };
    const adj = buildAdjacency(WW2);
    let tgt = targetCityId;
    if (!tgt || !isHostile(WW2, nationId, state.owners[tgt], state)) {
      const hop1 = (adj.get(a.city) || []).map((l) => l.to);
      tgt = hop1.find((cid) => isHostile(WW2, nationId, state.owners[cid], state));
      if (!tgt) {
        for (const mid of hop1) {
          tgt = (adj.get(mid) || []).map((l) => l.to).find((cid) => isHostile(WW2, nationId, state.owners[cid], state));
          if (tgt) { a.city = mid; break; } // 装甲集群高速前出至前沿阵地发动闪电突击！
        }
      }
    }
    if (!tgt || !isHostile(WW2, nationId, state.owners[tgt], state)) return { ok: false, error: '两跳范围内无敌占目标可供装甲闪电突击。' };
    ns.cp -= 20;
    a.order = 'attack';
    a.target = tgt;
    a.progress = 75;
    a.org = Math.min(100, a.org + 15);
    for (const d of state.armies.filter((u) => u.city === tgt && u.strength > 0 && isHostile(WW2, nationId, u.nation, state))) {
      d.org = Math.max(8, d.org - 24);
    }
    state.effects = state.effects || [];
    state.effects.push({ type: 'blitz', from: a.city, to: tgt, startMs: Date.now(), durationMs: 4200 });
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · ⚡ 【装甲闪电战】${ns.short}${a.name}（${a.tanks} 辆坦克集群）高速穿插猛攻 ${cName}！`);
    return { ok: true, target: tgt };
  }

  function pacificNavalAirBattle(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.cp < 20) return { ok: false, error: '发动海空决战需要 20 指挥点。' };
    const myPort = WW2.cities.find((c) => c.port && state.owners[c.id] === nationId) || WW2.cities.find((c) => state.owners[c.id] === nationId);
    const inViewHostilePort = WW2.cities.find((c) => c.port && c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state));
    const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
      ? targetCityId
      : (inViewHostilePort?.id || WW2.cities.find((c) => c.port && isHostile(WW2, nationId, state.owners[c.id], state))?.id);
    if (!myPort || !tgt) return { ok: false, error: '未找到可交战的敌方海域港口或岛屿。' };
    ns.cp -= 20;
    const defNation = state.owners[tgt];
    const dns = state.nations[defNation];
    const atkTF = state.taskForces?.[nationId] || { name: ns.short + '特混舰队', cv: 2, bb: 2, ca: 4, dd: 16, ss: 6 };
    const defTF = state.taskForces?.[defNation] || { name: (dns?.short || defNation) + '守备舰队', cv: 1, bb: 2, ca: 3, dd: 12, ss: 5 };

    // HOI4 三排海战阵型精确结算：第1排屏卫 DD → 第2排主力 BB/CA → 第3排航母舰载机 CV
    const atkScreenPct = Math.min(100, Math.round((atkTF.dd / Math.max(1, (atkTF.cv + atkTF.bb + atkTF.ca) * 2.5)) * 100));
    const defScreenPct = Math.min(100, Math.round((defTF.dd / Math.max(1, (defTF.cv + defTF.bb + defTF.ca) * 2.5)) * 100));
    const atkCarrierOverload = atkTF.cv > 4 ? 0.88 : 1.0; // HOI4 超过 4 艘航母触发舰载机调度超载惩罚
    const atkPow = (atkTF.cv * 28 * atkCarrierOverload + atkTF.bb * 18 + atkTF.ca * 9 + atkTF.dd * 3 + ns.airPower * 0.4) * (atkScreenPct < 70 ? 0.72 : 1.06);
    const defPow = (defTF.cv * 26 + defTF.bb * 17 + defTF.ca * 8 + defTF.dd * 3 + (dns?.airPower || 30) * 0.35) * (defScreenPct < 70 ? 0.72 : 1.0);
    const winRatio = atkPow / Math.max(20, defPow);

    const defLostDD = Math.min(defTF.dd, Math.max(1, Math.round(3 * winRatio)));
    const defLostCA = Math.min(defTF.ca, winRatio > 0.9 ? 1 : 0);
    const defLostBB = Math.min(defTF.bb, defScreenPct < 75 && winRatio > 1.0 ? 1 : 0);
    const defLostCV = Math.min(defTF.cv, winRatio > 1.25 ? 1 : 0);
    const atkLostDD = Math.min(atkTF.dd, Math.max(0, Math.round(2 / Math.max(0.5, winRatio))));
    const atkLostCA = Math.min(atkTF.ca, winRatio < 0.85 ? 1 : 0);
    defTF.dd -= defLostDD; defTF.ca -= defLostCA; defTF.bb -= defLostBB; defTF.cv -= defLostCV;
    atkTF.dd -= atkLostDD; atkTF.ca -= atkLostCA;

    if (dns) {
      dns.stock.ships = Math.max(0, dns.stock.ships - (defLostDD + defLostCA + defLostBB + defLostCV));
      dns.screenShips = Math.max(0, (dns.screenShips || 0) - defLostDD);
      dns.capitalShips = Math.max(0, (dns.capitalShips || 0) - (defLostBB + defLostCV));
      dns.stock.planes = Math.max(0, dns.stock.planes - Math.max(10, Math.round(30 * winRatio)));
    }
    const shoreBombard = atkTF.bb >= 2 ? 25 : atkTF.ca >= 3 ? 12 : 0;
    for (const d of state.armies.filter((u) => u.city === tgt && u.strength > 0)) {
      d.org = Math.max(8, d.org - (20 + Math.round(shoreBombard * 0.4)));
    }
    state.blockaded = state.blockaded || {};
    state.blockaded[tgt] = 10; // 跳岛封锁切断该岛海运补给
    state.railDamaged[tgt] = 8;
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.lastNavalBattle = {
      date: formatDate(state.date),
      cityId: tgt,
      cityName: cName,
      winner: winRatio >= 1 ? nationId : defNation,
      shoreBombard,
      atk: { nation: nationId, name: atkTF.name, screenPct: atkScreenPct, overload: atkTF.cv > 4, cv: atkTF.cv, bb: atkTF.bb, ca: atkTF.ca, dd: atkTF.dd, ss: atkTF.ss, lost: { cv: 0, bb: 0, ca: atkLostCA, dd: atkLostDD } },
      def: { nation: defNation, name: defTF.name, screenPct: defScreenPct, cv: defTF.cv, bb: defTF.bb, ca: defTF.ca, dd: defTF.dd, ss: defTF.ss, lost: { cv: defLostCV, bb: defLostBB, ca: defLostCA, dd: defLostDD } },
    };
    state.effects = state.effects || [];
    state.effects.push({ type: 'naval_air', from: myPort.id, to: tgt, startMs: Date.now(), durationMs: 4800 });
    state.log.push(`${formatDate(state.date)} · 🚢✈️ 【三排海空决战】${atkTF.name} 在 ${cName} 海域激战 ${defTF.name}，击沉敌舰(CV:${defLostCV} BB:${defLostBB} CA:${defLostCA} DD:${defLostDD})，战列舰岸轰 -${shoreBombard}% 并封锁孤岛！`);
    return { ok: true, target: tgt, battle: state.lastNavalBattle };
  }

  function findAirbaseInRange(WW2, state, nationId, targetCityId, maxDeg = 42) {
    const tgt = WW2.cities.find((c) => c.id === targetCityId);
    if (!tgt) return null;
    const ownCities = WW2.cities.filter((c) => state.owners[c.id] === nationId);
    let best = null, bestDist = Infinity;
    for (const c of ownCities) {
      let dLon = Math.abs(c.lon - tgt.lon);
      if (dLon > 180) dLon = 360 - dLon;
      const dist = Math.hypot(dLon, c.lat - tgt.lat);
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    return best && bestDist <= maxDeg ? { base: best, dist: bestDist } : null;
  }

  function launchAtomicBombWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (!ns.techs.includes('atomic_proj') && ns.pp < 35) {
      return { ok: false, error: '请先在【产线科研】研发《超级战略武器工程》，或储备 35 政点紧急启动曼哈顿投弹！' };
    }
    const inViewHostile = WW2.cities.find((c) => c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state));
    const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
      ? targetCityId
      : (inViewHostile?.id || WW2.cities.find((c) => isHostile(WW2, nationId, state.owners[c.id], state))?.id);
    if (!tgt) return { ok: false, error: '未找到敌方战略目标城市。' };
    // HOI4 岛屿/前线机场 B-29 航程圈校验（42° 约 4,400 km 作战半径）
    const inRange = findAirbaseInRange(WW2, state, nationId, tgt, 45);
    if (!inRange) {
      const tName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
      return { ok: false, error: `B-29 航程不足！请先通过跳岛作战夺取距离 ${tName} 较近的前线岛屿机场（如冲绳/硫磺岛/塞班/英国本土）。` };
    }
    if (!ns.techs.includes('atomic_proj')) ns.techs.push('atomic_proj');
    ns.pp = Math.max(0, ns.pp - 35);
    const launchBase = inRange.base;

    state.forts[tgt] = 0;
    state.railDamaged[tgt] = 30;
    state.nukedCities = state.nukedCities || {};
    state.nukedCities[tgt] = true;
    for (const d of state.armies.filter((u) => u.city === tgt && u.strength > 0)) {
      d.strength = Math.round(d.strength * 0.28);
      d.org = 0;
    }
    const defNation = state.owners[tgt];
    if (state.nations[defNation]) {
      state.nations[defNation].warSupport = Math.max(10, state.nations[defNation].warSupport - 28);
      state.nations[defNation].stability = Math.max(15, state.nations[defNation].stability - 20);
    }
    state.effects = state.effects || [];
    state.effects.push({ type: 'nuke', from: launchBase.id, to: tgt, startMs: Date.now(), durationMs: 5600 });
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · ☢️ 【原子弹发射轰炸！】${ns.short} B-29 战略轰炸机自前进机场 ${launchBase.name} 起飞，向 ${cName} 投下原子弹！蘑菇云遮天蔽日，守军与要塞瞬间摧毁！`);
    return { ok: true, from: launchBase.id, to: tgt };
  }

  function buildRadarWW2(WW2, state, nationId, cityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    const tgt = (cityId && state.owners[cityId] === nationId) ? cityId : WW2.cities.find((c) => state.owners[c.id] === nationId)?.id;
    if (!tgt) return { ok: false, error: '未找到本国控制城市。' };
    if (ns.pp < 15) return { ok: false, error: '建设防空雷达站需要 15 政治点。' };
    ns.pp -= 15;
    state.radars = state.radars || {};
    state.radars[tgt] = Math.min(4, (state.radars[tgt] || 0) + 1);
    ns.airPower = Math.min(100, ns.airPower + 6);
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · 📡 ${ns.short}在 ${cName} 建成 ${state.radars[tgt]} 级防空雷达网（不列颠/本土空域截击 +28%）！`);
    return { ok: true, cityId: tgt, level: state.radars[tgt] };
  }

  function garrisonSuppressWW2(WW2, state, nationId, cityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 10) return { ok: false, error: '宪兵治安镇压需要 10 政治点。' };
    ns.pp -= 10;
    state.resistance = state.resistance || {};
    if (cityId) state.resistance[cityId] = 0;
    else {
      for (const cid of Object.keys(state.resistance)) {
        if (state.owners[cid] === nationId) state.resistance[cid] = Math.max(0, state.resistance[cid] - 45);
      }
    }
    state.log.push(`${formatDate(state.date)} · 👮 ${ns.short}派遣装甲宪兵师镇压占领区游击队，抵抗度大幅下降！`);
    return { ok: true };
  }

  function relocateIndustryWW2(WW2, state, nationId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (state.uralRelocated && nationId === 'ussr') return { ok: false, error: '乌拉尔大后方工业内迁已经执行过。' };
    if (ns.pp < 20) return { ok: false, error: '大后方工业内迁需要 20 政治点。' };
    ns.pp -= 20;
    ns.mil += 14; ns.civ += 8; ns.stock.tanks += 120;
    if (nationId === 'ussr') state.uralRelocated = true;
    state.log.push(`${formatDate(state.date)} · 🏭 【乌拉尔/大后方工业内迁】${ns.short}将前线重工抢运至战略大后方（军工 +14、民工 +8、坦克 +120）！`);
    return { ok: true };
  }

  function triggerVichyFranceWW2(WW2, state) {
    if (state.vichyTriggered) return { ok: false, error: '维希法国与自由法国分治事件已触发。' };
    state.vichyTriggered = true;
    if (state.owners.marseille === 'france') state.owners.marseille = 'germany';
    if (state.nations.france) state.nations.france.exileGov = true;
    state.log.push(`${formatDate(state.date)} · 🏛️ 【维希法国成立 & 自由法国流亡】巴黎陷落后法国南部转入轴心控制，戴高乐在海外组建自由法国继续抗战！`);
    return { ok: true };
  }

  function planAmphibiousWW2(WW2, state, armyId, targetCityId) {
    const a = state.armies.find((u) => u.id === armyId && u.strength > 0);
    if (!a) return { ok: false, error: '请先选中一支我方集团军。' };
    const ns = state.nations[a.nation];
    if (ns.cp < 15) return { ok: false, error: '两栖登陆规划筹备需要 15 指挥点。' };
    ns.cp -= 15;
    a.amphibPrep = 100;
    a.planBonus = Math.min(45, (a.planBonus || 0) + 20);
    if (targetCityId && isHostile(WW2, a.nation, state.owners[targetCityId], state)) {
      const adj = buildAdjacency(WW2);
      if ((adj.get(a.city) || []).some((l) => l.to === targetCityId)) {
        a.order = 'attack'; a.target = targetCityId; a.progress = 0;
      }
    }
    state.log.push(`${formatDate(state.date)} · ⚓ 【两栖登陆筹备就绪】${a.name} 完成陆战队抢滩训练与战列舰岸轰协同（登陆准备 100% · 计划加成 +20%）！`);
    return { ok: true, amphibPrep: a.amphibPrep };
  }

  function blockadeIslandWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.cp < 15) return { ok: false, error: '孤岛潜艇封锁需要 15 指挥点。' };
    const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
      ? targetCityId
      : WW2.cities.find((c) => c.port && c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state))?.id
        || WW2.cities.find((c) => c.port && isHostile(WW2, nationId, state.owners[c.id], state))?.id;
    if (!tgt) return { ok: false, error: '未找到可封锁的敌方岛屿或港口。' };
    ns.cp -= 15;
    state.blockaded = state.blockaded || {};
    state.blockaded[tgt] = 14;
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · 🦈 【太平洋孤岛封锁断粮】${ns.short}潜艇与特混舰队彻底切断 ${cName} 海运补给线 14 天（岛上守军补给暴跌至 10%）！`);
    return { ok: true, target: tgt };
  }

  function kamikazeStrikeWW2(WW2, state, nationId, targetNationId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 25 || ns.stock.planes < 80) return { ok: false, error: '神风特攻需要 25 政治点与 80 架战机。' };
    const enemy = targetNationId && isHostile(WW2, nationId, targetNationId, state)
      ? targetNationId
      : Object.keys(state.nations).find((id) => isHostile(WW2, nationId, id, state) && (state.nations[id].navalPower || 0) >= 40);
    if (!enemy) return { ok: false, error: '当前没有正在交战的海上敌国。' };
    ns.pp -= 25;
    ns.stock.planes -= 80;
    const dns = state.nations[enemy];
    const dtf = state.taskForces?.[enemy];
    if (dtf) {
      if (dtf.cv > 0) dtf.cv -= 1;
      else if (dtf.bb > 0) dtf.bb -= 1;
      dtf.dd = Math.max(0, dtf.dd - 3);
    }
    dns.navalPower = Math.max(15, dns.navalPower - 18);
    dns.capitalShips = Math.max(0, (dns.capitalShips || 0) - 1);
    state.log.push(`${formatDate(state.date)} · 🌸 【神风特攻队突袭】${ns.short}投入 80 架战机饱和冲撞 ${dns.short}特混舰队，重创 1 艘航母/主力舰并削弱敌制海权 -18！`);
    return { ok: true, targetNation: enemy };
  }

  function fallbackLineWW2(WW2, state, nationId) {
    const adj = buildAdjacency(WW2);
    const myArmies = state.armies.filter((a) => a.nation === nationId && a.strength > 0);
    let moved = 0;
    for (const a of myArmies) {
      const links = adj.get(a.city) || [];
      const rear = links.find((l) => state.owners[l.to] === nationId
        && ['mountain', 'river', 'fort', 'urban'].includes(WW2.cities.find((c) => c.id === l.to)?.terrain));
      if (rear && links.some((l) => isHostile(WW2, nationId, state.owners[l.to], state))) {
        a.order = 'move'; a.target = rear.to; a.progress = 35; moved++;
      } else {
        a.order = 'defend'; a.target = null; a.entrench = Math.min(10, a.entrench + 2);
      }
    }
    state.log.push(`${formatDate(state.date)} · ↩️ ${state.nations[nationId].short}启动【后撤防线令】：${moved} 支前线集团军依托山河要塞收拢设防！`);
    return { ok: true, moved };
  }

  function declareWarWW2(WW2, state, nationA, nationB) {
    if (!nationA || !nationB || nationA === nationB) return { ok: false, error: '宣战对象无效。' };
    if (isHostile(WW2, nationA, nationB, state)) return { ok: false, error: '两国已在交战状态。' };
    state.wars.push([nationA, nationB]);
    state.worldTension = Math.min(100, state.worldTension + 15);
    state.log.push(`${formatDate(state.date)} · ⚔ 【正式宣战】${WW2.factions[nationA]?.short}向${WW2.factions[nationB]?.short}宣战！全球紧张度飙升至 ${state.worldTension}%！`);
    return { ok: true };
  }

  function proposePeaceWW2(WW2, state, nationA, nationB) {
    if (!isHostile(WW2, nationA, nationB, state)) return { ok: false, error: '两国当前未交战。' };
    const ns = state.nations[nationA];
    if (ns.pp < 30) return { ok: false, error: '外交停战调停需要 30 政治点。' };
    ns.pp -= 30;
    state.wars = state.wars.filter(([x, y]) => !((x === nationA && y === nationB) || (x === nationB && y === nationA)));
    state.log.push(`${formatDate(state.date)} · 🕊️ 【外交停战】${WW2.factions[nationA]?.short}与${WW2.factions[nationB]?.short}签署停战协定！`);
    return { ok: true };
  }

  function generalOffensiveWW2(WW2, state, nationId) {
    const adj = buildAdjacency(WW2);
    let launched = 0;
    for (const a of state.armies) {
      if (a.nation !== nationId || a.strength <= 0 || a.org < 30) continue;
      const hostile = (adj.get(a.city) || []).find((l) => isHostile(WW2, nationId, state.owners[l.to], state));
      if (hostile) { a.order = 'attack'; a.target = hostile.to; a.progress = 0; launched++; }
    }
    if (!launched) return { ok: false, error: '当前没有与敌接壤且可出击的前线集团军。' };
    state.log.push(`${formatDate(state.date)} · ⚔ 【全战线总攻令】${state.nations[nationId].short}共 ${launched} 支前线集团军同时发起全面反攻！`);
    return { ok: true, launched };
  }

  function tradeWW2Resource(state, nationId, resType = 'oil') {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.civ < 4) return { ok: false, error: '民用工厂不足（需拨出 2 座民工换取战略资源）。' };
    if (ns.convoys < 8) return { ok: false, error: '运输船不足（跨海资源贸易需至少 8 艘运输船）。' };
    ns.civ -= 2;
    ns.convoys -= 4;
    if (resType === 'oil') {
      ns.resources.oil += 24;
      ns.fuel = Math.min(100, ns.fuel + 28);
      state.log.push(`${formatDate(state.date)} · 🛢️ ${ns.short}拨出 2 座民工启动战略石油贸易（燃料恢复至 ${Math.round(ns.fuel)}%）。`);
    } else {
      ns.resources.steel += 30;
      ns.stock.tanks += 35; ns.stock.artillery += 35;
      state.log.push(`${formatDate(state.date)} · ⚙️ ${ns.short}拨出 2 座民工进口战略钢铁（重武器产能提升）。`);
    }
    return { ok: true };
  }

  function designWW2Equipment(state, nationId, patch = {}) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.cp < 10) return { ok: false, error: '改装武器设计方案需要 10 陆海空经验/指挥点。' };
    ns.cp -= 10;
    Object.assign(ns.equipDesign, patch);
    // 根据设计器部件实时重算装备加成
    const d = ns.equipDesign;
    ns.techBonus.armor = (ns.techs.includes('heavy_armor') ? 0.18 : 0) + (d.tankArmor === 'heavy' ? 0.16 : d.tankArmor === 'sloped' ? 0.08 : 0);
    ns.techBonus.atk = (ns.techs.includes('rocket_art') ? 0.20 : 0) + (ns.techs.includes('atomic_proj') ? 0.30 : 0)
      + (d.tankGun === '122mm' ? 0.15 : d.tankGun === '88mm' ? 0.10 : 0)
      + (d.planeRole === 'cas_heavy' ? 0.08 : 0);
    if (d.shipFocus === 'carrier_deck') ns.navalPower += 8;
    if (d.planeRange === 'long_range') ns.airPower += 8;
    state.log.push(`${formatDate(state.date)} · 🔧 ${ns.short}在武器设计器完成新一代装备定型改装（主炮:${d.tankGun} / 装甲:${d.tankArmor} / 战机:${d.planeRole}）！`);
    return { ok: true, design: ns.equipDesign };
  }

  function templateStats(tpl = { inf: 7, art: 2, tank: 1, support: 1 }) {
    const width = tpl.inf * 2 + tpl.art * 3 + tpl.tank * 2;
    const str = tpl.inf * 16000 + tpl.art * 8000 + tpl.tank * 12000 + tpl.support * 6000;
    const tanks = tpl.tank * 160;
    const art = tpl.art * 140 + tpl.support * 40;
    const costInf = tpl.inf * 24 + tpl.support * 15;
    const costArt = tpl.art * 30 + tpl.support * 10;
    const costTank = tpl.tank * 55;
    return { width, str, tanks, art, costInf, costArt, costTank };
  }

  function recruitCustomTemplateWW2(WW2, state, nationId, cityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    const stp = templateStats(ns.customTemplate);
    if (ns.stock.infantry < stp.costInf || ns.stock.artillery < stp.costArt || ns.stock.tanks < stp.costTank) {
      return { ok: false, error: `库存不足（需步${stp.costInf}/炮${stp.costArt}/坦${stp.costTank}）。` };
    }
    const spawn = (cityId && state.owners[cityId] === nationId)
      ? cityId : Object.keys(state.owners).find((cid) => state.owners[cid] === nationId);
    if (!spawn) return { ok: false, error: '无本国城市可部署。' };
    ns.stock.infantry -= stp.costInf; ns.stock.artillery -= stp.costArt; ns.stock.tanks -= stp.costTank;
    const id = `${nationId}-tpl-${state.armies.length + 1}`;
    state.armies.push({
      id, nation: nationId, bloc: ns.bloc,
      homeTheater: WW2.cities.find((c) => c.id === spawn)?.theater || 'global',
      name: `${ns.short}自定义${stp.width}宽精锐军`, commander: WW2.factions[nationId].commanders[0] || '前线司令',
      city: spawn, strength: stp.str, maxStrength: stp.str,
      tanks: stp.tanks, artillery: stp.art, org: 92, entrench: 1, vet: 0, traits: [],
      order: 'defend', target: null, progress: 0,
    });
    state.log.push(`${formatDate(state.date)} · 🎖️ ${ns.short}按自定义【${stp.width} 战斗宽度】编制成军部署！`);
    return { ok: true, id, width: stp.width };
  }

  function upgradeWW2General(state, nationId, armyId, traitId) {
    const ns = state.nations[nationId];
    const a = state.armies.find((u) => u.id === armyId && u.nation === nationId && u.strength > 0);
    const tr = ww2GeneralTraits[traitId];
    if (!ns || !a || !tr) return { ok: false, error: '请先选中本国现役集团军与有效特质。' };
    a.traits = a.traits || [];
    if (a.traits.includes(traitId)) return { ok: false, error: '该将领已掌握此特质。' };
    if (ns.cp < 15) return { ok: false, error: '解锁将领特质需要 15 指挥点。' };
    ns.cp -= 15;
    a.traits.push(traitId);
    state.log.push(`${formatDate(state.date)} · ⭐ 将领晋升！${a.commander} 获得特质【${tr.name}】（${tr.desc}）！`);
    return { ok: true };
  }

  function inviteMinorWW2(state, nationId, minorId) {
    const ns = state.nations[nationId];
    const m = ww2NeutralMinors.find((x) => x.id === minorId);
    if (!ns || !m) return { ok: false, error: '中立国无效。' };
    if (ns.alliedMinors.includes(minorId)) return { ok: false, error: '该国已加入我方阵营。' };
    if (ns.pp < 25) return { ok: false, error: '拉拢中立国入盟需要 25 政治点。' };
    ns.pp -= 25;
    ns.alliedMinors.push(minorId);
    m.apply(ns);
    state.log.push(`${formatDate(state.date)} · 🤝 【阵营外交】${ns.short}成功拉拢 ${m.name} 加入阵营（${m.bonusDesc}）！`);
    return { ok: true };
  }

  function peaceDemandWW2(WW2, state, nationId, demandType, targetCityId = null) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    const cost = demandType === 'annex_city' ? 20 : demandType === 'puppet' ? 25 : 15;
    if (ns.warScore < cost && ns.pp < 30) return { ok: false, error: `和谈会议需要 ${cost} 战争分数（当前 ${Math.floor(ns.warScore)}）或 30 政点外交筹码。` };
    if (ns.warScore >= cost) ns.warScore -= cost; else ns.pp -= 30;
    if (demandType === 'annex_city') {
      const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
        ? targetCityId : WW2.cities.find((c) => isHostile(WW2, nationId, state.owners[c.id], state))?.id;
      if (!tgt) return { ok: false, error: '无可供和谈割让的敌方城市。' };
      state.owners[tgt] = nationId;
      state.log.push(`${formatDate(state.date)} · 🕊️ 【和谈会议】${ns.short}凭战争分数正式割占 ${WW2.cities.find((c) => c.id === tgt)?.name || tgt}！`);
    } else if (demandType === 'puppet') {
      const pname = `${ns.short}附庸自治政权#${ns.puppets.length + 1}`;
      ns.puppets.push(pname);
      ns.manpowerK += 350; ns.civ += 5;
      state.log.push(`${formatDate(state.date)} · 🕊️ 【和谈会议】${ns.short}建立傀儡附庸【${pname}】，获得人力 +350K、民工 +5！`);
    } else if (demandType === 'reparations') {
      ns.civ += 8; ns.resources.steel += 25;
      state.log.push(`${formatDate(state.date)} · 🕊️ 【和谈会议】${ns.short}索取战争赔款：民工 +8、战略钢铁 +25！`);
    } else if (demandType === 'seize_fleet') {
      ns.stock.ships += 6; ns.convoys += 35; ns.navalPower += 15;
      state.log.push(`${formatDate(state.date)} · 🕊️ 【和谈会议】${ns.short}瓜分战败国舰队：主力舰 +6、运输船 +35！`);
    }
    return { ok: true };
  }

  function fleetScreenRatio(ns) {
    if (!ns) return 100;
    const need = Math.max(1, (ns.capitalShips || 1) * 3);
    return Math.min(100, Math.round(((ns.screenShips || 0) / need) * 100));
  }

  function buildEscortScreenWW2(state, nationId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 15) return { ok: false, error: '紧急建造屏卫驱逐舰编队需要 15 政治点。' };
    ns.pp -= 15;
    ns.screenShips = (ns.screenShips || 0) + 6;
    ns.convoys += 15;
    state.log.push(`${formatDate(state.date)} · ⚓ ${ns.short}下水 6 艘屏卫驱逐舰与 15 艘护航运输船（当前舰队屏卫率 ${fleetScreenRatio(ns)}%）。`);
    return { ok: true, ratio: fleetScreenRatio(ns) };
  }

  function marketWW2Trade(state, nationId, mode = 'buy', item = 'tanks') {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (mode === 'sell') {
      const sellQty = item === 'infantry' ? 200 : 50;
      if ((ns.stock[item] || 0) < sellQty) return { ok: false, error: '库存不足，无法在国际军火市场挂牌出售。' };
      ns.stock[item] -= sellQty;
      ns.civ += 2; ns.pp += 18;
      state.log.push(`${formatDate(state.date)} · 💰 【国际军火市场】${ns.short}出售 ${sellQty} 批库存军火，换得民工 +2、政点 +18！`);
      return { ok: true };
    }
    if (ns.pp < 22) return { ok: false, error: '国际军火市场现货采购需要 22 政治点。' };
    ns.pp -= 22;
    const buyQty = item === 'infantry' ? 240 : 60;
    ns.stock[item] = (ns.stock[item] || 0) + buyQty;
    state.log.push(`${formatDate(state.date)} · 🛒 【国际军火市场】${ns.short}现货采购 ${buyQty} 批军械交付前线！`);
    return { ok: true };
  }

  function upgradeWW2MIO(state, nationId, mioId) {
    const ns = state.nations[nationId];
    if (!ns || !ns.mioLevels?.[mioId]) return { ok: false, error: '军工设计局无效。' };
    if (ns.mioLevels[mioId] >= 5) return { ok: false, error: '该军工设计局已升至满级 Lv.5。' };
    if (ns.cp < 18) return { ok: false, error: '升级军工设计局（MIO）需要 18 指挥点/军种经验。' };
    ns.cp -= 18;
    ns.mioLevels[mioId] += 1;
    if (mioId === 'mio_tank') { ns.techBonus.armor += 0.06; ns.stock.tanks += 35; }
    else if (mioId === 'mio_air') { ns.airPower += 12; ns.stock.planes += 35; }
    else if (mioId === 'mio_navy') { ns.navalPower += 12; ns.screenShips += 3; }
    const def = (ww2MIOByNation[nationId] || []).find((m) => m.id === mioId);
    state.log.push(`${formatDate(state.date)} · 🏭 【军工设计局升级】${def?.name || mioId} 晋升至 Lv.${ns.mioLevels[mioId]}，产能与装备战力永久提升！`);
    return { ok: true, level: ns.mioLevels[mioId] };
  }

  function launchV2MissileWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 20) return { ok: false, error: '发射 V-2 弹道导弹需要 20 政治点。' };
    const inViewHostile = WW2.cities.find((c) => c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state));
    const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
      ? targetCityId : (inViewHostile?.id || WW2.cities.find((c) => isHostile(WW2, nationId, state.owners[c.id], state))?.id);
    if (!tgt) return { ok: false, error: '未找到敌方弹道导弹目标。' };
    const rangeCheck = findAirbaseInRange(WW2, state, nationId, tgt, 38);
    if (!rangeCheck) {
      const tName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
      return { ok: false, error: `超出导弹射程！请先将导弹发射旅/航母舰队前移并停驻至距 ${tName} 射程圈内再发射！` };
    }
    ns.pp -= 20;
    const base = rangeCheck.base;
    state.forts[tgt] = Math.max(0, (state.forts[tgt] || 0) - 1);
    state.railDamaged[tgt] = 10;
    for (const d of state.armies.filter((u) => u.city === tgt && u.strength > 0)) d.org = Math.max(8, d.org - 20);
    state.effects = state.effects || [];
    state.effects.push({ type: 'v2', from: base.id, to: tgt, startMs: Date.now(), durationMs: 3600 });
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · 🚀 【秘密工程 · V-2 导弹射程内打击】${ns.short}自前沿阵地 ${base.name} 发射超音速 V-2 导弹突防命中 ${cName}，重创要塞与铁路！`);
    return { ok: true, from: base.id, target: tgt };
  }

  // ── 免换装直出地图：自由部署坦克军 / 空军联队 / 航母特混舰队 / 战列舰 / 导弹发射旅 ──
  function deployDirectForceWW2(WW2, state, nationId, kind = 'tank', cityId = null) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.pp < 15) return { ok: false, error: '直接部署海陆空特种机动部队需要 15 政治点。' };
    const tgtCity = (cityId && state.owners[cityId] === nationId) ? cityId
      : WW2.cities.find((c) => state.owners[c.id] === nationId && c.theater === state.theater && ((kind !== 'carrier' && kind !== 'battleship') || c.port))?.id
        || WW2.cities.find((c) => state.owners[c.id] === nationId && ((kind !== 'carrier' && kind !== 'battleship') || c.port))?.id
        || WW2.cities.find((c) => state.owners[c.id] === nationId)?.id;
    if (!tgtCity) return { ok: false, error: '未找到可部署的本国城市或港口。' };
    ns.pp -= 15;
    const cObj = WW2.cities.find((c) => c.id === tgtCity);
    const labelMap = {
      tank: `${ns.short}直属重装坦克军`,
      air: `${ns.short}独立前线空军联队`,
      carrier: `${ns.short}机动航母特混舰队`,
      battleship: `${ns.short}主力战列舰打击群`,
      missile: `${ns.short}远程导弹发射旅`,
    };
    const unit = {
      id: `direct-${nationId}-${kind}-${state.armies.length + 1}`,
      nation: nationId, bloc: WW2.factions[nationId]?.bloc || 'allies',
      homeTheater: cObj?.theater || state.theater || 'global',
      unitKind: kind,
      name: labelMap[kind] || `${ns.short}机动兵团`,
      commander: kind === 'carrier' || kind === 'battleship' ? '舰队司令' : kind === 'air' ? '航空联队长' : kind === 'missile' ? '导弹旅长' : '装甲军长',
      city: tgtCity,
      strength: kind === 'tank' ? 140000 : kind === 'carrier' || kind === 'battleship' ? 95000 : 80000,
      maxStrength: kind === 'tank' ? 140000 : 95000,
      tanks: kind === 'tank' ? 1200 : 120,
      artillery: kind === 'missile' ? 650 : 280,
      org: 100, entrench: 1, planBonus: 18, amphibPrep: kind === 'carrier' || kind === 'battleship' ? 100 : 0,
      vet: 1, traits: kind === 'tank' ? ['panzer_leader'] : [],
      order: 'defend', target: null, progress: 0,
    };
    state.armies.push(unit);
    if (kind === 'air') { ns.airPower = Math.min(100, ns.airPower + 8); ns.stock.planes += 60; }
    if (kind === 'carrier' || kind === 'battleship') {
      ns.navalPower = Math.min(100, ns.navalPower + 8);
      if (state.taskForces?.[nationId]) {
        if (kind === 'carrier') state.taskForces[nationId].cv += 1;
        else state.taskForces[nationId].bb += 1;
      }
    }
    state.log.push(`${formatDate(state.date)} · ⚔️ 【免换装直属部署】${unit.name} 已直接进驻 ${cObj?.name || tgtCity} 并出现在地图上，可随时自由移动/登陆/打击！`);
    return { ok: true, army: unit };
  }

  // ── 自由两栖登陆：选中我方任意部队/航母舰队，想在哪个敌方沿海港口登陆就能直接登陆！──
  function freeAmphibiousLandingWW2(WW2, state, nationId, armyId, targetPortId) {
    const ns = state.nations[nationId];
    const a = state.armies.find((u) => u.id === armyId && u.nation === nationId && u.strength > 0)
      || state.armies.find((u) => u.nation === nationId && u.strength > 0);
    if (!ns || !a) return { ok: false, error: '请先选中一支我方部队或特混舰队。' };
    if (ns.cp < 15) return { ok: false, error: '自由两栖登陆需要 15 指挥点。' };
    const tgt = (targetPortId && isHostile(WW2, nationId, state.owners[targetPortId], state))
      ? WW2.cities.find((c) => c.id === targetPortId)
      : WW2.cities.find((c) => c.port && c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state))
        || WW2.cities.find((c) => c.port && isHostile(WW2, nationId, state.owners[c.id], state));
    if (!tgt) return { ok: false, error: '请先点击选择一座敌方沿海港口或岛屿作为登陆点！' };
    ns.cp -= 15;
    a.amphibPrep = 100;
    const defs = state.armies.filter((u) => u.city === tgt.id && u.strength > 0 && isHostile(WW2, nationId, u.nation, state));
    defs.forEach((d) => { d.org = Math.max(8, d.org - 34); d.strength = Math.max(5000, Math.round(d.strength * 0.78)); });
    const fromId = a.city;
    if (!defs.length || defs.every((d) => d.org <= 22)) {
      state.owners[tgt.id] = nationId;
      a.city = tgt.id; a.order = 'defend'; a.target = null; a.progress = 0;
      state.log.push(`${formatDate(state.date)} · ⚓ 【自由两栖强行登陆大捷】${a.name} 跨海直插 ${tgt.name} 抢滩成功并占领港口！`);
    } else {
      a.order = 'attack'; a.target = tgt.id; a.progress = 55;
      state.log.push(`${formatDate(state.date)} · ⚓ 【自由两栖强行登陆】${a.name} 在舰炮掩护下向 ${tgt.name} 发起抢滩激战！`);
    }
    state.effects = state.effects || [];
    state.effects.push({ type: 'naval_air', from: fromId, to: tgt.id, startMs: Date.now(), durationMs: 4200 });
    return { ok: true, target: tgt.id };
  }

  function fireRailwayGunWW2(WW2, state, nationId, targetCityId) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if (ns.cp < 20) return { ok: false, error: '古斯塔夫重型列车炮齐射需要 20 指挥点。' };
    const inViewHostile = WW2.cities.find((c) => c.theater === state.theater && isHostile(WW2, nationId, state.owners[c.id], state));
    const tgt = (targetCityId && isHostile(WW2, nationId, state.owners[targetCityId], state))
      ? targetCityId : (inViewHostile?.id || WW2.cities.find((c) => isHostile(WW2, nationId, state.owners[c.id], state))?.id);
    if (!tgt) return { ok: false, error: '未找到敌方要塞目标。' };
    ns.cp -= 20;
    state.forts[tgt] = Math.max(0, (state.forts[tgt] || 0) - 2);
    for (const d of state.armies.filter((u) => u.city === tgt && u.strength > 0)) {
      d.org = Math.max(5, d.org - 32);
      d.strength = Math.max(0, d.strength - 6000);
    }
    const cName = WW2.cities.find((c) => c.id === tgt)?.name || tgt;
    state.log.push(`${formatDate(state.date)} · 🚂 【秘密工程 · 800mm 古斯塔夫列车炮】重炮沿铁路抵近轰击 ${cName}，摧毁 2 级混凝土要塞！`);
    return { ok: true, target: tgt };
  }

  function spyMissionWW2(WW2, state, nationId, mission = 'steal_tech', targetNationId = null) {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    if ((ns.intel?.network || 0) < 35) return { ok: false, error: '执行深度特工任务需要情报网强度 ≥ 35%（请先潜伏建网）。' };
    if (ns.pp < 20) return { ok: false, error: '特工行动经费需要 20 政治点。' };
    ns.pp -= 20;
    ns.intel.network = Math.max(0, ns.intel.network - 25);
    const enemy = targetNationId || Object.keys(state.nations).find((id) => isHostile(WW2, nationId, id, state));
    if (mission === 'steal_tech') {
      const nextTech = ww2TechCatalog.find((t) => !ns.techs.includes(t.id));
      if (!nextTech) return { ok: false, error: '本国已掌握全部科研项目。' };
      ns.techs.push(nextTech.id);
      nextTech.apply(ns);
      state.log.push(`${formatDate(state.date)} · 🕵️ 【特工窃取蓝图】王牌特工潜入敌国兵工厂，成功窃取并立即解锁【${nextTech.name}】！`);
    } else if (mission === 'sabotage_factory' && enemy && state.nations[enemy]) {
      state.nations[enemy].mil = Math.max(10, state.nations[enemy].mil - 6);
      state.log.push(`${formatDate(state.date)} · 💣 【特工破坏重水/军工厂】敌国 ${state.nations[enemy].short} 军工产能被炸毁 -6！`);
    } else if (mission === 'incite_revolt' && enemy) {
      const eCity = WW2.cities.find((c) => state.owners[c.id] === enemy);
      if (eCity) {
        state.railDamaged[eCity.id] = 12;
        state.resistance[eCity.id] = 85;
        state.log.push(`${formatDate(state.date)} · 🔥 【特工策反敌后起义】${eCity.name} 爆发大规模抵抗起义并炸断铁路！`);
      }
    }
    return { ok: true };
  }

  function forecastWW2(WW2, state, days = 30) {
    const clone = JSON.parse(JSON.stringify(state));
    stepWW2Day(WW2, clone, days);
    const ownedNow = Object.values(state.owners).filter((o) => o === state.player).length;
    const ownedLater = Object.values(clone.owners).filter((o) => o === state.player).length;
    const strNow = state.armies.filter((a) => a.nation === state.player && a.strength > 0).reduce((s, a) => s + a.strength, 0);
    const strLater = clone.armies.filter((a) => a.nation === state.player && a.strength > 0).reduce((s, a) => s + a.strength, 0);
    return {
      date: formatDate(clone.date),
      cityDelta: ownedLater - ownedNow,
      ownedLater,
      strDelta: strLater - strNow,
      strLater,
      recentLog: clone.log.slice(-4),
    };
  }

  function startWW2Focus(state, nationId, focusId) {
    const ns = state.nations[nationId];
    const list = ww2FocusTrees[nationId] || [];
    const f = list.find((x) => x.id === focusId);
    if (!ns || !f) return { ok: false, error: '未找到该国家焦点。' };
    if (ns.completedFocuses.includes(focusId)) return { ok: false, error: '该国家焦点已完成。' };
    ns.activeFocus = { id: f.id, name: f.name, left: f.days };
    state.log.push(`${formatDate(state.date)} · ${ns.short}开始推进国家焦点：《${f.name}》（${f.days} 天）。`);
    return { ok: true };
  }

  function recruitWW2Division(WW2, state, nationId, cityId, template = 'infantry') {
    const ns = state.nations[nationId];
    if (!ns) return { ok: false, error: '国家不存在。' };
    const cost = template === 'armor'
      ? { mp: 35, inf: 120, art: 60, tanks: 140, str: 95000, t: 480, a: 280, label: '装甲突击军(10坦10摩)' }
      : template === 'marine'
        ? { mp: 40, inf: 180, art: 50, tanks: 40, str: 110000, t: 180, a: 240, label: '两栖海军陆战军' }
        : { mp: 60, inf: 220, art: 80, tanks: 20, str: 150000, t: 120, a: 420, label: '主力步炮集团军(9步2炮)' };
    if (ns.stock.infantry < cost.inf || ns.stock.artillery < cost.art || ns.stock.tanks < cost.tanks) {
      return { ok: false, error: '库存装备不足，请先等军工生产或接收盟国租借法案。' };
    }
    const spawn = (cityId && state.owners[cityId] === nationId)
      ? cityId
      : Object.keys(state.owners).find((cid) => state.owners[cid] === nationId);
    if (!spawn) return { ok: false, error: '无本国控制城市可供部署。' };
    ns.stock.infantry -= cost.inf;
    ns.stock.artillery -= cost.art;
    ns.stock.tanks -= cost.tanks;
    ns.manpowerK = Math.max(0, ns.manpowerK - cost.mp);
    const id = `${nationId}-new-${state.armies.length + 1}`;
    const cName = WW2.cities.find((c) => c.id === spawn)?.name || spawn;
    state.armies.push({
      id, nation: nationId, bloc: ns.bloc,
      name: `${ns.short}新编${cost.label}`, commander: WW2.factions[nationId].commanders[0] || '前线司令',
      city: spawn, strength: cost.str, maxStrength: cost.str,
      tanks: cost.t, artillery: cost.a, org: 85, entrench: 1,
      order: 'defend', target: null, progress: 0,
    });
    state.log.push(`${formatDate(state.date)} · ${ns.short}在 ${cName} 成军部署：${ns.short}新编${cost.label}！`);
    return { ok: true, id };
  }

  function lendLeaseWW2(WW2, state, fromId, toId) {
    const src = state.nations[fromId];
    const dst = state.nations[toId];
    if (!src || !dst || fromId === toId) return { ok: false, error: '租借对象无效。' };
    if (isHostile(WW2, fromId, toId)) return { ok: false, error: '不能向敌对阵营提供租借法案。' };
    if (src.pp < 20) return { ok: false, error: '需要 20 政治点启动租借运输船队。' };
    src.pp -= 20;
    dst.stock.infantry += 260;
    dst.stock.artillery += 90;
    dst.stock.tanks += 85;
    dst.stock.planes += 60;
    state.log.push(`${formatDate(state.date)} · 🚢 租借法案船队抵达：${src.short}向${dst.short}交付 85 辆坦克、90 门火炮、60 架战机与大量步兵军械！`);
    return { ok: true };
  }

  function formatDate(d) {
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }

  function stepWW2Day(WW2, state, days = 1) {
    const adj = buildAdjacency(WW2);
    const cityMap = new Map(WW2.cities.map((c) => [c.id, c]));

    for (let step = 0; step < days; step++) {
      state.dayCount += 1;
      state.date.d += 1;
      if (state.date.d > 30) { state.date.d = 1; state.date.m += 1; }
      if (state.date.m > 12) { state.date.m = 1; state.date.y += 1; }
      state.battles = [];
      for (const cid of Object.keys(state.railDamaged || {})) {
        if (state.railDamaged[cid] > 0) state.railDamaged[cid] -= 1;
      }

      // 1. 每日军工/船坞生产 + 石油燃料实时消耗 + 潜艇破交运输船绞杀 + 国家焦点推进
      const weather = getWW2SeasonWeather(state.date.m);
      for (const ns of Object.values(state.nations)) {
        ns.pp = Math.min(500, ns.pp + 1.8);
        ns.cp = Math.min(200, ns.cp + 1.4);
        const steelEff = ns.resources.steel >= 30 ? 1.0 : 0.72;
        const ps = ns.prodShare || { infantry: 30, artillery: 25, tanks: 25, planes: 20 };
        const tot = Math.max(1, ps.infantry + ps.artillery + ps.tanks + ps.planes);
        ns.stock.infantry += Math.round(ns.mil * 1.45 * (ps.infantry / tot));
        ns.stock.artillery += Math.round(ns.mil * 0.52 * (ps.artillery / tot) * steelEff);
        ns.stock.tanks += Math.round(ns.mil * 0.48 * (ps.tanks / tot) * steelEff);
        ns.stock.planes += Math.round(ns.mil * 0.50 * (ps.planes / tot) * steelEff);
        // 石油燃料每日收支（油田产出 - 机械化/海空消耗）
        const activeTanks = state.armies.filter((a) => a.nation === ns.id && a.strength > 0).reduce((s, a) => s + a.tanks, 0);
        const oilBurn = activeTanks * 0.0006 + (ns.airMission !== 'air_superiority' ? 0.55 : 0.35) + (ns.navalMission === 'strike_force' ? 0.5 : 0.25);
        const oilGain = (ns.resources.oil || 20) * 0.045;
        ns.fuel = Math.max(0, Math.min(100, ns.fuel + oilGain - oilBurn));
        // 运输船破交绞杀战（敌方执行 convoy_raid 潜艇破交时击沉运输船）
        if (state.dayCount % 4 === 0) {
          const raiders = Object.values(state.nations).filter((e) => e.navalMission === 'convoy_raid' && isHostile(WW2, ns.id, e.id, state));
          if (raiders.length && ns.convoys > 0) {
            const sunk = Math.min(ns.convoys, ns.navalMission === 'escort' ? 1 : 3);
            ns.convoys -= sunk;
          } else {
            ns.convoys = Math.min(400, ns.convoys + Math.max(1, Math.round(ns.dock / 20)));
          }
        }
        if (ns.intel?.burstDays > 0) ns.intel.burstDays -= 1;
        if (state.dayCount % 12 === 0 && ns.dock > 0) ns.stock.ships += Math.max(1, Math.round(ns.dock / 25));
        if (ns.activeFocus) {
          ns.activeFocus.left -= 1;
          if (ns.activeFocus.left <= 0) {
            const def = (ww2FocusTrees[ns.id] || []).find((x) => x.id === ns.activeFocus.id);
            if (def && def.effect) def.effect(state, ns);
            ns.completedFocuses.push(ns.activeFocus.id);
            state.log.push(`${formatDate(state.date)} · ⭐ ${ns.short}完成国家焦点《${ns.activeFocus.name}》！`);
            ns.activeFocus = null;
          }
        }
      }

      // 1.5 孤岛封锁衰减、占领区逐城抵抗度演化与维希法国自动触发
      state.blockaded = state.blockaded || {};
      for (const cid of Object.keys(state.blockaded)) {
        if (state.blockaded[cid] > 0) state.blockaded[cid] -= 1;
      }
      state.resistance = state.resistance || {};
      if (state.dayCount % 3 === 0) {
        for (const c of WW2.cities) {
          const cur = state.owners[c.id];
          const orig = state.initialOwners?.[c.id];
          if (cur && orig && cur !== orig) {
            const hasGarrison = state.armies.some((u) => u.city === c.id && u.nation === cur && u.strength > 0);
            const delta = hasGarrison ? 0.5 : 3.2;
            state.resistance[c.id] = Math.min(100, (state.resistance[c.id] || 0) + delta);
            if (state.resistance[c.id] >= 75) {
              state.railDamaged[c.id] = Math.max(state.railDamaged[c.id] || 0, 5);
              state.resistance[c.id] = 45;
              state.log.push(`${formatDate(state.date)} · 🔥 【占领区游击破袭】${c.name} 抵抗组织炸毁当地铁路补给线！`);
            }
          } else if (state.resistance[c.id]) {
            state.resistance[c.id] = Math.max(0, state.resistance[c.id] - 6);
          }
        }
      }
      if (!state.vichyTriggered && state.owners.paris === 'germany' && state.initialOwners?.paris === 'france') {
        triggerVichyFranceWW2(WW2, state);
      }

      // 2. 非玩家列强（或玩家开启委任总参谋部时）HOI4 战略 AI 决策
      if (state.dayCount % 3 === 1) {
        for (const a of state.armies) {
          if ((a.nation === state.player && !state.aiDelegate) || a.strength <= 0 || a.order !== 'defend' || a.org < 45) continue;
          const ns = state.nations[a.nation];
          const links = (adj.get(a.city) || []).filter((l) => theaterAllowed(a.homeTheater, cityMap.get(l.to)?.theater));
          const hostileTargets = links.filter((l) => {
            const owner = state.owners[l.to];
            if (!isHostile(WW2, a.nation, owner, state)) return false;
            if (l.kind === 'sea') {
              const defNav = state.nations[owner]?.navalPower || 20;
              if (ns.navalPower < defNav * 0.72) return false; // 无制海权不盲目跨洋送死
            }
            return true;
          });
          if (hostileTargets.length) {
            const best = hostileTargets.sort((x, y) => {
              const dx = state.armies.filter((u) => u.city === x.to && u.strength > 0).reduce((s, u) => s + u.strength, 0);
              const dy = state.armies.filter((u) => u.city === y.to && u.strength > 0).reduce((s, u) => s + u.strength, 0);
              return dx - dy;
            })[0];
            const defStr = state.armies.filter((u) => u.city === best.to && u.strength > 0).reduce((s, u) => s + u.strength, 0);
            if (a.strength * (best.kind === 'sea' ? 0.9 : 1.15) >= defStr) {
              a.order = 'attack'; a.target = best.to; a.progress = 0;
            }
          } else if (links.length && Math.random() < 0.35) {
            // 向本战区有敌邻城的前线机动（仅走己方/友军领土）
            const frontLink = links.find((l) => !isHostile(WW2, a.nation, state.owners[l.to], state)
              && (adj.get(l.to) || []).some((n2) => isHostile(WW2, a.nation, state.owners[n2.to], state)));
            if (frontLink) {
              a.order = 'move'; a.target = frontLink.to; a.progress = 0;
            }
          }
        }
      }

      // 3. 执行陆海空交战、移动与补员
      for (const a of state.armies) {
        if (a.strength <= 0) continue;
        const ns = state.nations[a.nation];
        if (a.order === 'defend' || a.order === 'rest') {
          const sup = citySupplyLevel(WW2, state, a.city) / 100;
          const restMult = a.order === 'rest' ? 1.85 : 1.0;
          a.entrench = a.order === 'defend' ? Math.min(10, a.entrench + 0.45) : a.entrench;
          // HOI4 作战计划准备加成：位于前线待命/掘壕每日积攒计划条
          const onFront = (adj.get(a.city) || []).some((l) => isHostile(WW2, a.nation, state.owners[l.to], state));
          const maxPlan = ns.doctrineId === 'grand' ? 45 : 35;
          if (onFront) a.planBonus = Math.min(maxPlan, (a.planBonus || 0) + 2.5);
          // 孤岛封锁断粮扣组织度，正常补给恢复组织度
          if ((state.blockaded?.[a.city] || 0) > 0) {
            a.org = Math.max(8, a.org - 4.5);
          } else {
            a.org = Math.min(100, a.org + 3.5 * sup * restMult);
          }
          if (a.strength < a.maxStrength && ns.stock.infantry > 20 && !(state.blockaded?.[a.city] > 0)) {
            const heal = Math.min(a.maxStrength - a.strength, Math.round(3500 * sup * restMult));
            a.strength += heal;
            ns.stock.infantry -= 8;
          }
          continue;
        }
        if (!a.target) { a.order = 'defend'; continue; }
        const link = (adj.get(a.city) || []).find((l) => l.to === a.target);
        if (!link) { a.order = 'defend'; a.target = null; continue; }

        const railBroken = (state.railDamaged?.[a.city] || 0) > 0 || (state.railDamaged?.[a.target] || 0) > 0;
        const speedBase = link.kind === 'sea' ? 20 : link.kind === 'rail' ? (railBroken ? 18 : 42) : 26;
        const targetHostile = isHostile(WW2, a.nation, state.owners[a.target], state);
        // 彻底根治友军互抢：若目标已归本国或同盟友军，自动转为和平进驻而不覆盖归属
        if (!targetHostile) {
          a.order = 'move';
          a.progress += speedBase;
          a.entrench = Math.max(0, a.entrench - 1);
          if (a.progress >= 100) {
            a.city = a.target; a.target = null; a.order = 'defend'; a.progress = 0;
          }
          continue;
        }

        // 进攻 / 支援牵制战斗结算（含 HOI4 装甲金盾、空优、两栖制海、地形与工事）
        const defenders = state.armies.filter((u) => u.city === a.target && u.strength > 0 && isHostile(WW2, a.nation, u.nation, state));
        const tgtCity = cityMap.get(a.target);
        const fortLvl = state.forts[a.target] || 0;
        const airBonus = ns.airMission === 'cas' ? 1.18 : ns.airMission === 'air_superiority' ? 1.1 : 1.04;
        const seaMult = link.kind === 'sea' ? (ns.navalPower > 65 ? 0.92 : 0.65) : 1.0;

        if (!defenders.length) {
          a.progress += link.kind === 'sea' ? 24 : 42;
          if (a.progress >= 100 && isHostile(WW2, a.nation, state.owners[a.target], state)) {
            const prevOwner = state.owners[a.target];
            state.owners[a.target] = a.nation;
            state.worldTension = Math.min(100, state.worldTension + 2);
            if (a.order !== 'support') a.city = a.target;
            a.order = 'defend'; a.target = null; a.progress = 0;
            state.log.push(`${formatDate(state.date)} · 🚩 ${ns.short}${a.name} 攻克 ${tgtCity?.name || a.target}（原属 ${WW2.factions[prevOwner]?.short || prevOwner}）！`);
          }
          continue;
        }

        const atkDoc = ww2Doctrines[ns.doctrineId] || ww2Doctrines.grand;
        const atkTech = ns.techBonus || { atk: 0, def: 0, armor: 0, sea: 0 };
        const atkBurst = (ns.intel?.burstDays || 0) > 0 ? 1.15 : 1.0;
        const vetMult = 1 + (a.vet || 0) * 0.08;
        const fuelMult = (ns.fuel || 0) < 20 ? 0.62 : 1.0; // 缺油坦克与机械化战力暴跌！
        const traitMult = 1 + ((a.traits || []).includes('panzer_leader') ? 0.16 : 0) + ((a.traits || []).includes('field_marshal') ? 0.12 : 0);
        const weatherMult = weather.atkPen;
        const planMult = 1 + Math.min(45, a.planBonus || 0) / 100; // HOI4 作战计划准备加成
        a.planBonus = Math.max(0, (a.planBonus || 0) - 1.5);
        // HOI4 两栖登陆筹备与战列舰岸轰支持
        if (link.kind === 'sea' && (a.amphibPrep || 0) < 100) a.amphibPrep = Math.min(100, (a.amphibPrep || 0) + 25);
        const amphibMult = link.kind === 'sea' ? ((a.amphibPrep || 0) >= 100 ? 1.0 : 0.72) : 1.0;
        const shoreBombardNerf = (link.kind === 'sea' && (state.taskForces?.[a.nation]?.bb || 0) >= 2) ? 0.75 : 1.0;
        const radarDefBonus = 1 + Math.min(0.28, (state.radars?.[a.target] || 0) * 0.08);
        const siegeBonus = a.order === 'siege' ? 1.16 : 1.0;
        if (a.order === 'siege' && (state.forts[a.target] || 0) > 0 && state.dayCount % 4 === 0) {
          state.forts[a.target] = Math.max(0, state.forts[a.target] - 1);
        }
        const atkPower = (a.strength / 1000 + a.tanks * 0.28 * atkDoc.armorMult * (1 + atkTech.armor) * fuelMult + a.artillery * 0.22)
          * (0.4 + 0.6 * a.org / 100) * airBonus * Math.min(1.0, seaMult + atkTech.sea) * amphibMult * planMult * atkDoc.atkMult * (1 + atkTech.atk) * atkBurst * vetMult * siegeBonus * traitMult * weatherMult;
        ns.warScore = (ns.warScore || 0) + 1.5;
        const defTotal = defenders.reduce((s, d) => {
          const dns = state.nations[d.nation];
          const defDoc = ww2Doctrines[dns?.doctrineId] || ww2Doctrines.grand;
          const intelNerf = 1 - Math.min(0.25, (ns.intel?.network || 0) * 0.0025);
          const terrMult = tgtCity?.terrain === 'mountain' || tgtCity?.terrain === 'urban' || tgtCity?.terrain === 'fort' ? 1.32 : 1.08;
          const fortMult = 1 + (fortLvl * 0.11 + d.entrench * 0.03) * intelNerf;
          return s + (d.strength / 1000 + d.tanks * 0.25 + d.artillery * 0.24) * (0.4 + 0.6 * d.org / 100) * terrMult * fortMult * radarDefBonus * shoreBombardNerf * defDoc.defMult * (1 + (dns?.techBonus?.def || 0)) * (1 + (d.vet || 0) * 0.08);
        }, 1);

        // HOI4 装甲金盾阈值检查
        const atkArmorEdge = a.tanks > defenders.reduce((s, d) => s + d.tanks, 0) * 1.35 ? 1.28 : 1.0;
        const ratio = (atkPower * atkArmorEdge) / defTotal;
        const atkLoss = Math.round(Math.min(a.strength * 0.08, 1800 / Math.max(0.4, ratio)));
        const defLoss = Math.round(Math.min(defenders[0].strength * 0.09, 2100 * Math.min(2.2, ratio)));

        a.strength = Math.max(0, a.strength - atkLoss);
        a.org = Math.max(0, a.org - (7.5 / Math.max(0.5, ratio)));
        a.vet = Math.min(3, (a.vet || 0) + 0.06);
        state.stats.casualties[a.nation] = (state.stats.casualties[a.nation] || 0) + atkLoss;
        for (const d of defenders) {
          const dl = Math.round(defLoss / defenders.length);
          d.strength = Math.max(0, d.strength - dl);
          d.org = Math.max(0, d.org - (8.5 * Math.min(2.0, ratio)));
          d.vet = Math.min(3, (d.vet || 0) + 0.05);
          state.stats.casualties[d.nation] = (state.stats.casualties[d.nation] || 0) + dl;
        }

        state.battles.push({
          from: a.city, to: a.target, attacker: a.nation, defender: defenders[0].nation,
          ratio: Number(ratio.toFixed(2)), armorGold: atkArmorEdge > 1,
        });

        // 守军崩溃撤退或合围全歼缴获（40%装备归攻方！）
        const remaining = defenders.filter((d) => d.strength > 0 && d.org > 8);
        if (!remaining.length) {
          const retreatLinks = (adj.get(a.target) || []).filter((l) => !isHostile(WW2, defenders[0].nation, state.owners[l.to], state));
          let wipedPow = 0, capTanks = 0, capGuns = 0;
          for (const d of defenders) {
            if (d.strength > 0 && retreatLinks.length) {
              d.city = retreatLinks[0].to; d.org = 25; d.entrench = 0; d.order = 'defend'; d.target = null;
            } else {
              wipedPow += d.strength;
              capTanks += Math.round(d.tanks * 0.4);
              capGuns += Math.round(d.artillery * 0.4);
              d.strength = 0; // 合围全歼！
            }
          }
          if (wipedPow > 0) {
            ns.stock.tanks += capTanks; ns.stock.artillery += capGuns;
            state.stats.pow[a.nation] = (state.stats.pow[a.nation] || 0) + wipedPow;
            state.stats.capturedTanks[a.nation] = (state.stats.capturedTanks[a.nation] || 0) + capTanks;
            state.stats.capturedGuns[a.nation] = (state.stats.capturedGuns[a.nation] || 0) + capGuns;
          }
          if (isHostile(WW2, a.nation, state.owners[a.target], state)) {
            const prevOwner = state.owners[a.target];
            state.owners[a.target] = a.nation;
            state.worldTension = Math.min(100, state.worldTension + 3);
            if (a.order !== 'support' && a.order !== 'intercept') a.city = a.target;
            a.order = 'defend'; a.target = null; a.progress = 0;
            state.log.push(`${formatDate(state.date)} · ⚔ 决战大捷！${ns.short}${a.name} 占领 ${tgtCity?.name || a.target}（原属 ${WW2.factions[prevOwner]?.short || prevOwner}`
              + (wipedPow > 0 ? `，合围俘虏 ${Math.round(wipedPow / 1000)}K 人、缴获坦${capTanks}/炮${capGuns}！` : '）！'));
          }
        } else if (a.org < 14) {
          a.order = 'defend'; a.target = null; a.progress = 0;
        }
      }

      // 4. 占领区抵抗度累积（无人驻防敌后城市累积抵抗，引发铁路破袭）+ 胜负结算检测
      if (state.dayCount % 5 === 0) {
        for (const c of WW2.cities) {
          const orig = state.initialOwners?.[c.id];
          const cur = state.owners[c.id];
          if (orig && cur && orig !== cur && isHostile(WW2, orig, cur, state)) {
            const garrison = state.armies.some((u) => u.city === c.id && u.nation === cur && u.strength > 0);
            state.resistance[c.id] = Math.max(0, Math.min(100, (state.resistance[c.id] || 0) + (garrison ? -6 : 9)));
            if (state.resistance[c.id] >= 75) {
              state.railDamaged[c.id] = 6;
              state.resistance[c.id] = 35;
              state.log.push(`${formatDate(state.date)} · 🔥 敌后游击抵抗爆发！${c.name} 占领区游击队炸毁铁路线！`);
            }
          }
        }
        // 流亡政府机制：同盟国若本土全失，在盟友首都成立流亡政府继续抗战
        for (const ns of Object.values(state.nations)) {
          const owned = Object.values(state.owners).filter((o) => o === ns.id).length;
          if (owned === 0 && !ns.exileGov) {
            ns.exileGov = true;
            const allyCity = Object.keys(state.owners).find((cid) => !isHostile(WW2, ns.id, state.owners[cid], state));
            if (allyCity) {
              state.armies.push({
                id: `${ns.id}-exile`, nation: ns.id, bloc: ns.bloc, homeTheater: 'europe',
                name: `${ns.short}流亡精锐装甲师`, commander: WW2.factions[ns.id]?.commanders?.[0] || '流亡司令',
                city: allyCity, strength: 85000, maxStrength: 85000, tanks: 320, artillery: 220,
                org: 100, entrench: 1, vet: 2, traits: [], order: 'defend', target: null, progress: 0,
              });
              state.log.push(`${formatDate(state.date)} · 🏛️ 【流亡政府成立】${ns.short}在盟友支援下成立流亡政府，率领精锐流亡装甲师继续战斗！`);
            }
          }
        }
        const axisHeld = WW2.cities.filter((c) => ['germany', 'japan'].includes(state.owners[c.id])).length;
        const alliesHeld = WW2.cities.filter((c) => ['usa', 'ussr', 'uk', 'france', 'china'].includes(state.owners[c.id])).length;
        if (!state.winner && state.owners.berlin !== 'germany' && state.owners.tokyo !== 'japan') {
          state.winner = 'allies';
          state.log.push(`${formatDate(state.date)} · 🏆 反法西斯同盟全面胜利！柏林与东京均已解放，第二次世界大战胜利结束！`);
        } else if (!state.winner && alliesHeld <= 6) {
          state.winner = 'axis';
          state.log.push(`${formatDate(state.date)} · 🏆 轴心国掌控欧亚核心枢纽，取得战略胜利！`);
        } else if (!state.winner && axisHeld <= 2) {
          state.winner = 'allies';
          state.log.push(`${formatDate(state.date)} · 🏆 轴心国全面崩溃投降，同盟国赢得二战胜利！`);
        }
      }
      if (state.log.length > 80) state.log = state.log.slice(-80);
    }
    return state;
  }

  // ══════════════════════════════════════════════════════════════════════
  // 1) 原有冷战世界图渲染（向后兼容 CivilWarWorld.renderWorldCanvas）
  // ══════════════════════════════════════════════════════════════════════
  function renderWorldCanvas(canvas, mode = 'factions', selectedNationId = null) {
    if (!canvas) return [];
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const proj = (lon, lat) => [((lon + 180) / 360) * w, ((85 - lat) / 145) * h];
    drawBaseWorld(ctx, w, h, proj, mode === 'terrain' ? 'terrain' : 'hybrid', 1);

    const drawPoly = (pts) => {
      ctx.beginPath();
      pts.forEach(([lon, lat], idx) => {
        const [x, y] = proj(lon, lat);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };
    const hitBoxes = [];
    for (const n of nations) {
      const bloc = blocs[n.bloc] || blocs.nonaligned;
      const [cx, cy] = proj(n.lon, n.lat);
      if (mode !== 'terrain') {
        drawPoly(n.poly);
        ctx.fillStyle = bloc.color + (mode === 'hybrid' ? '88' : 'cc');
        ctx.fill();
        ctx.strokeStyle = selectedNationId === n.id ? '#ffe484' : bloc.border;
        ctx.lineWidth = selectedNationId === n.id ? 2.4 : 1.1;
        ctx.stroke();
      }
      if (n.clickableKorea) {
        ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd86b'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.font = n.clickableKorea ? 'bold 11.5px "Microsoft YaHei", sans-serif' : '600 10.5px "Microsoft YaHei", sans-serif';
      const tw = ctx.measureText(n.name).width;
      ctx.fillStyle = selectedNationId === n.id ? 'rgba(92, 72, 26, 0.92)' : 'rgba(18, 24, 21, 0.8)';
      ctx.fillRect(cx - tw / 2 - 5, cy - 8, tw + 10, 16);
      ctx.strokeStyle = selectedNationId === n.id ? '#ffd86b' : bloc.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - tw / 2 - 5, cy - 8, tw + 10, 16);
      ctx.fillStyle = n.clickableKorea ? '#ffe68c' : '#f4ecd5';
      ctx.textAlign = 'center';
      ctx.fillText(n.name, cx, cy + 4);
      hitBoxes.push({ id: n.id, nation: n, x: cx - tw / 2 - 8, y: cy - 12, w: tw + 16, h: 24 });
    }
    ctx.fillStyle = 'rgba(245, 228, 176, 0.95)';
    ctx.font = 'bold 14px "Songti SC", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('1939–1953 高精世界战略地形与势力图 · 点击可切入二战全球战役或抗美援朝', 14, 24);
    return hitBoxes;
  }

  // ── 高精中点分形海岸线细化（保留真实半岛/海湾/岬角锐度，绝不磨圆成粗糙椭圆！）──
  const smoothCoastCache = new WeakMap();
  function smoothCoast(pts, iterations = 2) {
    if (!pts || pts.length < 3) return pts;
    const cached = smoothCoastCache.get(pts);
    if (cached) return cached;
    let cur = pts;
    for (let it = 0; it < iterations; it++) {
      const next = [];
      for (let i = 0; i < cur.length; i++) {
        const [x0, y0] = cur[i];
        const [x1, y1] = cur[(i + 1) % cur.length];
        next.push([x0, y0]);
        const len = Math.hypot(x1 - x0, y1 - y0);
        if (len > 0.25) {
          const h1 = Math.sin(x0 * 127.1 + y0 * 311.7 + x1 * 74.7 + it * 19.3) * 43758.5453;
          const n1 = (h1 - Math.floor(h1) - 0.5) * Math.min(0.28, len * 0.14);
          const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
          next.push([(x0 + x1) * 0.5 + nx * n1, (y0 + y1) * 0.5 + ny * n1]);
        }
      }
      cur = next;
    }
    smoothCoastCache.set(pts, cur);
    return cur;
  }

  // ── 中国地图同级：6 阶 Ridged Multifractal 山脊微地形 + 连续 7 档高程渐变色（0m–6200m，零色带断层！）──
  const chinaTerrainStops = [
    [0, [173, 182, 141]], [150, [189, 188, 141]], [550, [187, 169, 124]],
    [1400, [181, 149, 108]], [2600, [163, 125, 98]], [4300, [185, 158, 136]], [6200, [229, 224, 206]],
  ];
  const majorMountains = [
    [10, 46.5, 5.5, 2.0, 2600], [0, 42.7, 3.2, 1.1, 1800], [24, 46, 4.5, 2.2, 1600], [14, 42.5, 2.2, 3.5, 1400], // 阿尔卑斯/比利牛斯/喀尔巴阡/亚平宁
    [59, 60, 3.5, 9.5, 1500], [43, 42.5, 5.5, 2.0, 3200], [34, 39, 6.5, 2.2, 1900], [-4, 34, 5.5, 1.6, 1700], // 乌拉尔/高加索/安纳托利亚/阿特拉斯
    [88, 33, 13, 6.5, 4800], [104, 31, 5.5, 4.5, 2900], [112, 37, 3.8, 4.8, 1500], // 青藏/横断/太行
    [128.3, 37.6, 0.95, 2.2, 1450], [127.4, 40.6, 1.5, 1.1, 1850], [128.2, 41.8, 1.8, 1.2, 1700], // 太白/盖马/长白
    [138.2, 36.2, 1.4, 2.0, 2100], [-110, 44, 7.5, 11, 2900], [-70, -18, 3.5, 16, 3800], // 日本阿尔卑斯/落基/安第斯
  ];
  function hash2(ix, iy) {
    const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  function vNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function sampleWorldElev(lon, lat) {
    // 6 阶分形山脊噪声（形成细腻真实的山脉纹理、河谷与丘陵起伏，彻底消除卡通色块！）
    let ridge = 0, amp = 0.52, freq = 0.28;
    for (let o = 0; o < 5; o++) {
      const n = 1 - Math.abs(vNoise(lon * freq, lat * freq) * 2 - 1);
      ridge += n * n * amp;
      freq *= 2.12;
      amp *= 0.48;
    }
    let meters = 65 + ridge * 780;
    for (let i = 0; i < majorMountains.length; i++) {
      const [mlo, mla, rx, ry, peak] = majorMountains[i];
      const dx = (lon - mlo) / rx, dy = (lat - mla) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 < 4.0) {
        const micro = 0.55 + 0.65 * (1 - Math.abs(vNoise(lon * 1.4, lat * 1.4) * 2 - 1));
        meters += Math.exp(-d2 * 1.35) * peak * micro;
      }
    }
    return Math.max(5, Math.min(6200, meters));
  }

  let reliefCacheKey = '';
  let reliefCacheCanvas = null;
  function getHillshadeCanvas(w, h, lon0, lat1, spanLon, spanLat, contourMode = false) {
    const rw = Math.min(1080, Math.max(480, Math.round(w * 0.85)));
    const rh = Math.min(580, Math.max(260, Math.round(h * 0.85)));
    const key = [rw, rh, lon0.toFixed(2), lat1.toFixed(2), spanLon.toFixed(2), spanLat.toFixed(2), contourMode ? 1 : 0].join('|');
    if (key === reliefCacheKey && reliefCacheCanvas) return reliefCacheCanvas;
    reliefCacheKey = key;
    if (typeof document === 'undefined') return null;
    const cvs = reliefCacheCanvas || document.createElement('canvas');
    cvs.width = rw; cvs.height = rh;
    const rctx = cvs.getContext('2d');
    const img = rctx.createImageData(rw, rh);
    const data = img.data;
    const dLon = spanLon / rw, dLat = spanLat / rh;
    // 先计算整幅高程场，再做精准像素差分山体阴影（与 map.js prepareGrid 算法 100% 同源！）
    const elev = new Float32Array(rw * rh);
    for (let py = 0; py < rh; py++) {
      const lat = lat1 - (py + 0.5) * dLat;
      const rowOff = py * rw;
      for (let px = 0; px < rw; px++) {
        elev[rowOff + px] = sampleWorldElev(lon0 + (px + 0.5) * dLon, lat);
      }
    }
    const slopeScale = Math.max(12, dLon * 240);
    for (let py = 0; py < rh; py++) {
      const rowOff = py * rw;
      const prevRow = Math.max(0, py - 1) * rw;
      const nextRow = Math.min(rh - 1, py + 1) * rw;
      for (let px = 0; px < rw; px++) {
        const hCur = elev[rowOff + px];
        const nx = elev[rowOff + Math.min(rw - 1, px + 1)] - elev[rowOff + Math.max(0, px - 1)];
        const ny = elev[nextRow + px] - elev[prevRow + px];
        const reliefAmt = Math.max(-36, Math.min(34, (nx - ny) / slopeScale));
        let u = chinaTerrainStops.findIndex(([lv]) => lv > hCur);
        if (u < 0) u = chinaTerrainStops.length - 1;
        u = Math.max(1, u);
        const [lLv, lCol] = chinaTerrainStops[u - 1];
        const [uLv, uCol] = chinaTerrainStops[u];
        const t = Math.max(0, Math.min(1, (hCur - lLv) / (uLv - lLv)));
        const onContour = contourMode && (Math.abs((hCur % 250) - 125) < 7);
        const idx = (rowOff + px) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const baseC = lCol[ch] * (1 - t) + uCol[ch] * t + reliefAmt;
          data[idx + ch] = onContour ? (ch === 0 ? 104 : ch === 1 ? 80 : 56) : Math.max(0, Math.min(255, Math.round(baseC)));
        }
        data[idx + 3] = 250;
      }
    }
    rctx.putImageData(img, 0, 0);
    reliefCacheCanvas = cvs;
    return cvs;
  }

  // ── 与国共内战同款的 Voronoi 平滑势力版图着色（在陆地裁剪区内绘制）──
  function drawVoronoiTerritory(ctx, w, h, cities, owners, colorOf, proj, step = 10) {
    const pts = [];
    for (const c of cities) {
      const col = colorOf(owners[c.id]);
      if (!col) continue;
      const [x, y] = proj(c.lon, c.lat);
      if (x < -180 || x > w + 180 || y < -180 || y > h + 180) continue;
      pts.push({ x, y, col, owner: owners[c.id] });
    }
    if (!pts.length) return;
    ctx.save();
    ctx.globalAlpha = 0.34;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        let best = null, bestD = Infinity;
        for (let i = 0; i < pts.length; i++) {
          const dx = x - pts[i].x, dy = y - pts[i].y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = pts[i]; }
        }
        if (best && bestD < 220 * 220) {
          ctx.fillStyle = best.col;
          ctx.fillRect(x, y, step, step);
        }
      }
    }
    ctx.restore();
  }

  // ── 统一底层 3D 步坦炮/海空/导弹列阵渲染（响应 GameSettings 兵模大小与密度！）──
  function drawUnified3DFormation(ctx, renderer3D, cx, baseY, opts) {
    if (!renderer3D) return;
    const gSet = globalThis.GameSettings || { modelScale: 1, maxModelsMacro: 4 };
    const H3D = globalThis.CivilWarHuman3D;
    const scale = gSet.modelScale || 1;
    const size = Math.round((opts.size || 28) * scale);
    const unitKind = opts.unitKind || '';

    // 直属特种部队（纯坦克军 / 空军联队 / 航母 / 战列舰 / 导弹旅）直接显示对应高精 3D 模型集群！
    if (unitKind === 'carrier' || unitKind === 'battleship' || unitKind === 'air' || unitKind === 'missile' || unitKind === 'tank') {
      const count = unitKind === 'carrier' || unitKind === 'battleship' ? 1 : unitKind === 'air' ? 2 : 2;
      const modelKind = unitKind === 'carrier' ? 'carrier'
        : unitKind === 'battleship' ? (opts.nation === 'japan' ? 'yamato' : 'battleship')
        : unitKind === 'air' ? (opts.nation === 'japan' ? 'zero' : opts.nation === 'germany' ? 'stuka' : opts.nation === 'ussr' ? 'il2' : opts.nation === 'china' ? 'p40' : 'spitfire')
        : unitKind === 'missile' ? 'katyusha'
        : (opts.tankKind || 'sherman');
      const sp = size * 0.68;
      const sx0 = cx - ((count - 1) * sp) / 2;
      for (let i = 0; i < count; i++) {
        const px = sx0 + i * sp;
        const drawSz = unitKind === 'carrier' || unitKind === 'battleship' ? Math.round(size * 1.38) : Math.round(size * 1.12);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        ctx.beginPath(); ctx.ellipse(px, baseY - 2, drawSz * 0.32, drawSz * 0.10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        const spr = renderer3D.frame(opts.side || 'roc', Boolean(opts.moving), opts.now || 0, modelKind, opts.action || 'idle', opts.variant || '', opts.orbit || 0);
        if (spr) ctx.drawImage(spr, px - drawSz / 2, baseY - drawSz * 0.94, drawSz, drawSz);
      }
      return;
    }

    const rawSoldiers = H3D?.iconCount ? H3D.iconCount(opts.strength || 15000) : Math.max(1, Math.round((opts.strength || 15000) / 5000));
    const tankIcons = opts.tanks >= 25 ? Math.min(2, H3D?.tankIcons ? Math.max(1, H3D.tankIcons(opts.tanks)) : 1) : 0;
    const cap = Math.min(opts.maxSoldiers || 3, Math.max(1, gSet.maxModelsMacro || 4));
    const soldierIcons = Math.min(cap, Math.max(1, rawSoldiers));
    const total = soldierIcons + tankIcons;
    const spacing = size * 0.56;
    const startX = cx - ((total - 1) * spacing) / 2;

    for (let i = 0; i < total; i++) {
      const isTank = i >= soldierIcons;
      const px = startX + i * spacing;
      const py = baseY - (isTank ? size * 0.92 : size * 0.98) + (i % 2 === 1 ? -2 : 1);
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
      ctx.beginPath();
      ctx.ellipse(px, baseY - 2, size * 0.28, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const kind = isTank ? (opts.tankKind || 'sherman') : (opts.soldierKind || 'human');
      const spr = renderer3D.frame(opts.side || 'roc', Boolean(opts.moving), opts.now || 0, kind, opts.action || 'idle', opts.variant || '', opts.orbit || 0);
      if (spr) ctx.drawImage(spr, px - size / 2, py, size, size);
    }
  }

  function drawBaseWorld(ctx, w, h, proj, mode, zoomScale, bounds = null) {
    // 与国共内战 map.js 同款的复古军事海图青灰渐变 + 经纬网格
    const ocean = ctx.createLinearGradient(0, 0, w, h);
    ocean.addColorStop(0, '#8ea99c');
    ocean.addColorStop(0.55, '#7c9a90');
    ocean.addColorStop(1, '#6c8b82');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(52, 82, 74, 0.16)';
    ctx.lineWidth = 0.85;
    const step = zoomScale > 2 ? 10 : 30;
    for (let lon = -180; lon <= 180; lon += step) {
      const [x] = proj(lon, 0);
      if (x >= 0 && x <= w) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    }
    for (let lat = -60; lat <= 80; lat += (zoomScale > 2 ? 10 : 20)) {
      const [, y] = proj(0, lat);
      if (y >= 0 && y <= h) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    const traceAllContinents = () => {
      ctx.beginPath();
      for (const c of continents) {
        const pts = smoothCoast(c.points, 2);
        pts.forEach(([lon, lat], idx) => {
          const [x, y] = proj(lon, lat);
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
    };

    // 浅海大陆架柔光描边
    ctx.save();
    traceAllContinents();
    ctx.strokeStyle = 'rgba(202, 224, 214, 0.42)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // 陆地复古羊皮纸底色 + 裁剪 DEM 山体阴影浮雕（与国共内战地图同级精细度！）
    ctx.save();
    traceAllContinents();
    ctx.fillStyle = '#d3c9a7';
    ctx.fill();
    ctx.clip();
    if (bounds) {
      const relief = getHillshadeCanvas(w, h, bounds.lon0, bounds.lat1, bounds.spanLon, bounds.spanLat, mode === 'contour');
      if (relief) {
        ctx.globalAlpha = mode === 'contour' ? 0.78 : 0.95;
        ctx.drawImage(relief, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }
    // 全球主要大河（裁剪在陆地内）
    ctx.strokeStyle = 'rgba(72, 128, 138, 0.72)';
    ctx.lineWidth = zoomScale > 1.8 ? 1.7 : 1.1;
    for (const r of rivers) {
      ctx.beginPath();
      r.pts.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();

    // 清晰复古海岸线描边 + 地理山脉/海峡标注（对齐国共内战测绘精细度）
    ctx.save();
    traceAllContinents();
    ctx.strokeStyle = 'rgba(66, 98, 86, 0.78)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.font = 'italic 11px "Microsoft YaHei UI", sans-serif';
    ctx.textAlign = 'center';
    const geoLabels = [
      ['大  西  洋', -26, 42, 'sea'], ['地  中  海', 16, 35.5, 'sea'], ['英吉利海峡', -1.8, 50.1, 'sea'],
      ['阿尔卑斯山脉', 10.2, 46.6, 'mtn'], ['乌拉尔山脉', 59.5, 58, 'mtn'], ['高加索山脉', 43.5, 42.8, 'mtn'],
      ['太  平  洋', 158, 26, 'sea'], ['东  海', 124.5, 29.5, 'sea'], ['南  海', 114, 14, 'sea'],
    ];
    for (const [txt, lo, la, kind] of geoLabels) {
      const [gx, gy] = proj(lo, la);
      if (gx < 20 || gx > w - 20 || gy < 20 || gy > h - 20) continue;
      ctx.fillStyle = kind === 'sea' ? 'rgba(54, 86, 80, 0.68)' : 'rgba(92, 72, 48, 0.72)';
      ctx.fillText(txt, gx, gy);
    }
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2) HOI4 二战全球战略沙盘高精渲染器（支持 6 战区缩放、城市、补给线、兵牌、进攻箭头、战斗火花）
  // ══════════════════════════════════════════════════════════════════════
  function renderWW2Canvas(canvas, WW2, state, opts = {}) {
    if (!canvas || !WW2 || !state) return { cityHits: [], armyHits: [] };
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const th = WW2.theaters[opts.theater || state.theater || 'global'] || WW2.theaters.global;
    const zoom = opts.zoom || 1;
    const panLon = opts.panLon || 0;
    const panLat = opts.panLat || 0;
    const cLon = (th.lonMin + th.lonMax) / 2 + panLon;
    const cLat = (th.latMin + th.latMax) / 2 + panLat;
    const spanLon = (th.lonMax - th.lonMin) / zoom;
    const spanLat = (th.latMax - th.latMin) / zoom;
    const lon0 = cLon - spanLon / 2;
    const lat1 = cLat + spanLat / 2;
    const proj = (lon, lat) => [((lon - lon0) / spanLon) * w, ((lat1 - lat) / spanLat) * h];

    drawBaseWorld(ctx, w, h, proj, opts.layer || 'ww2', 360 / spanLon, { lon0, lat1, spanLon, spanLat });

    const cityMap = new Map(WW2.cities.map((c) => [c.id, c]));

    // 1. 与国共内战同款的 Voronoi 陆地平滑势力疆域（裁剪在陆地海岸线内）
    if (opts.layer !== 'terrain' && opts.layer !== 'contour') {
      ctx.save();
      ctx.beginPath();
      for (const c of continents) {
        const pts = smoothCoast(c.points, 2);
        pts.forEach(([lon, lat], idx) => {
          const [x, y] = proj(lon, lat);
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
      ctx.clip();
      drawVoronoiTerritory(ctx, w, h, WW2.cities, state.owners, (o) => WW2.factions[o]?.color, proj, 11);
      ctx.restore();
    }

    // 2. 双轨枕木铁路网 + 公路 + 跨海战略航线（与国内战场完全同款视觉）
    const showRail = opts.showRail !== false;
    for (const [aId, bId, kind] of WW2.routes) {
      const ca = cityMap.get(aId), cb = cityMap.get(bId);
      if (!ca || !cb || Math.abs(ca.lon - cb.lon) > 180) continue;
      if (kind === 'rail' && !showRail) continue;
      const [x1, y1] = proj(ca.lon, ca.lat);
      const [x2, y2] = proj(cb.lon, cb.lat);
      const hostileLine = isHostile(WW2, state.owners[aId], state.owners[bId], state);
      const broken = (state.railDamaged?.[aId] || 0) > 0 || (state.railDamaged?.[bId] || 0) > 0;
      ctx.save();
      if (kind === 'sea') {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(128, 206, 255, 0.45)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
      } else if (kind === 'rail') {
        // 双轨枕木铁路：底轨 + 浅金铁轨 + 枕木刻度
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = broken ? 'rgba(235, 76, 62, 0.85)' : hostileLine ? 'rgba(255, 134, 96, 0.82)' : 'rgba(54, 44, 30, 0.85)';
        ctx.lineWidth = 3.2;
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = broken ? '#ff9988' : '#e6d39c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = hostileLine ? 'rgba(255, 118, 92, 0.72)' : 'rgba(210, 198, 160, 0.36)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2.5 可选补给热力图层（蓝充足 / 黄偏紧 / 红断轨）
    if (opts.showSupply) {
      for (const c of WW2.cities) {
        const [x, y] = proj(c.lon, c.lat);
        if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
        const sup = citySupplyLevel(WW2, state, c.id);
        const col = sup >= 90 ? 'rgba(72, 168, 255, 0.34)' : sup >= 55 ? 'rgba(245, 204, 82, 0.34)' : 'rgba(240, 72, 62, 0.44)';
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      }
    }

    // 3. 战略城市节点 + 要塞 + 港口标识
    const cityHits = [];
    for (const c of WW2.cities) {
      const [x, y] = proj(c.lon, c.lat);
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
      const owner = state.owners[c.id];
      const fac = WW2.factions[owner] || { color: '#777', border: '#ccc' };
      const isSelected = opts.selectedCity === c.id;

      ctx.beginPath();
      ctx.arc(x, y, c.vp >= 20 ? 6.5 : 4.8, 0, Math.PI * 2);
      ctx.fillStyle = fac.color;
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.8 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffe57f' : fac.border;
      ctx.stroke();

      if (c.vp >= 25) {
        ctx.fillStyle = '#ffe57f';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x, y + 3.2);
      }

      const fort = state.forts[c.id] || 0;
      const nuked = state.nukedCities?.[c.id];
      const radar = state.radars?.[c.id] || 0;
      const block = (state.blockaded?.[c.id] || 0) > 0;
      const resLv = Math.round(state.resistance?.[c.id] || 0);
      if (radar > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(116, 224, 198, 0.36)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(x, y, 24 + radar * 10, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      const label = (nuked ? '☢️' : '') + c.name + (fort > 0 ? ` 🛡${fort}` : '') + (radar > 0 ? ` 📡${radar}` : '') + (block ? ' 🦈封锁' : '') + (resLv >= 45 ? ` 🔥${resLv}%` : '') + (c.port ? ' ⚓' : '');
      ctx.font = (c.vp >= 20 ? 'bold 10.5px' : '9.5px') + ' "Microsoft YaHei", sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = isSelected ? 'rgba(84, 62, 18, 0.92)' : 'rgba(14, 20, 18, 0.78)';
      ctx.fillRect(x - tw / 2 - 4, y + 7, tw + 8, 14);
      ctx.fillStyle = isSelected ? '#ffeb96' : '#efe7d2';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 17.5);
      cityHits.push({ id: c.id, city: c, x: x - 16, y: y - 12, w: 32, h: 32 });
    }

    // 4. HOI4 进攻箭头 & 交战火花 & B-29 前线机场航程圈 + 红色导弹射程圈
    const gSet = globalThis.GameSettings || { showRangeRings: true };
    if (opts.showAirRange && gSet.showRangeRings !== false) {
      const airBase = (opts.selectedCity && state.owners[opts.selectedCity] === state.player && cityMap.get(opts.selectedCity))
        || WW2.cities.find((c) => c.theater === state.theater && state.owners[c.id] === state.player && c.port)
        || WW2.cities.find((c) => c.theater === state.theater && state.owners[c.id] === state.player);
      if (airBase) {
        const [ax, ay] = proj(airBase.lon, airBase.lat);
        const [rx] = proj(airBase.lon + 36, airBase.lat);
        const rad = Math.max(48, Math.min(340, Math.abs(rx - ax)));
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 224, 118, 0.72)';
        ctx.fillStyle = 'rgba(255, 224, 118, 0.05)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.arc(ax, ay, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // 红色导弹射程圈（36° V-2 / 弹道导弹有效射程）
        const mRad = Math.round(rad * 0.76);
        ctx.strokeStyle = 'rgba(255, 108, 86, 0.68)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(ax, ay, mRad, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffe994';
        ctx.font = '700 11px "Microsoft YaHei UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🛫 B-29航程 / 🚀 导弹射程圈（阵地：${airBase.name}）`, ax, ay - rad + 16);
        ctx.restore();
      }
    }
    for (const a of state.armies) {
      if (a.strength <= 0 || !a.target) continue;
      const ca = cityMap.get(a.city), cb = cityMap.get(a.target);
      if (!ca || !cb || Math.abs(ca.lon - cb.lon) > 180) continue;
      const [x1, y1] = proj(ca.lon, ca.lat);
      const [x2, y2] = proj(cb.lon, cb.lat);
      const isBlitz = a.order === 'attack' && a.tanks >= 500 && (state.nations[a.nation]?.doctrineId === 'mobile' || a.nation === 'germany');
      ctx.save();
      ctx.strokeStyle = isBlitz ? '#ffd84d' : a.order === 'attack' ? '#ff5946' : a.order === 'support' ? '#ffb84d' : '#66d19e';
      ctx.lineWidth = isBlitz ? 4.4 : 3.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 12 * Math.cos(ang - 0.42), y2 - 12 * Math.sin(ang - 0.42));
      ctx.lineTo(x2 - 12 * Math.cos(ang + 0.42), y2 - 12 * Math.sin(ang + 0.42));
      ctx.closePath(); ctx.fill();
      if (isBlitz) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        ctx.fillStyle = '#fff5b8';
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡闪电装甲', mx, my - 5);
      }
      ctx.restore();
    }

    for (const b of state.battles || []) {
      const cb = cityMap.get(b.to);
      if (!cb) continue;
      const [x, y] = proj(cb.lon, cb.lat);
      ctx.beginPath(); ctx.arc(x, y - 4, 11, 0, Math.PI * 2);
      ctx.fillStyle = b.ratio >= 1 ? 'rgba(68, 196, 102, 0.88)' : 'rgba(228, 72, 58, 0.88)';
      ctx.fill();
      ctx.strokeStyle = b.armorGold ? '#ffd75e' : '#ffffff';
      ctx.lineWidth = b.armorGold ? 2.5 : 1.4;
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.min(99, Math.max(5, Math.round(b.ratio * 50))), x, y - 0.5);
    }

    // 5. HOI4 集团军兵牌（防重叠防穿模排版引擎 + 地面接触阴影 + 独立站位 3D 兵模）
    const armyHits = [];
    const placedBoxes = cityHits.map((ch) => ({ x: ch.x - 4, y: ch.y + 18, w: 58, h: 16 }));
    const overlaps = (ax, ay, aw, ah) => placedBoxes.some((b) => ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y);
    const byCity = new Map();
    for (const a of state.armies) {
      if (a.strength <= 0) continue;
      if (!byCity.has(a.city)) byCity.set(a.city, []);
      byCity.get(a.city).push(a);
    }
    const offsetRing = [
      [0, -28], [48, -28], [-48, -28], [0, -64], [52, 12], [-52, 12],
      [48, -64], [-48, -64], [84, -28], [-84, -28], [0, 32],
    ];
    for (const [cid, list] of byCity.entries()) {
      const c = cityMap.get(cid);
      if (!c) continue;
      const [cx, cy] = proj(c.lon, c.lat);
      if (cx < -30 || cx > w + 30 || cy < -30 || cy > h + 30) continue;
      list.forEach((a, idx) => {
        const fac = WW2.factions[a.nation] || { color: '#555', border: '#ccc', flag: '★', short: a.nation };
        const has3D = Boolean(opts.show3D && opts.renderer3D && idx === 0);
        const boxH = has3D ? 44 : 20;
        let bx = cx - 23, by = cy - 28;
        let chosen = false;
        for (let k = idx; k < offsetRing.length + idx; k++) {
          const [ox, oy] = offsetRing[k % offsetRing.length];
          const tx = Math.max(8, Math.min(w - 54, cx - 23 + ox));
          const ty = Math.max(has3D ? 36 : 10, Math.min(h - 24, cy + oy));
          if (!overlaps(tx - 2, ty - (has3D ? 28 : 2), 50, boxH)) {
            bx = tx; by = ty; chosen = true; break;
          }
        }
        if (!chosen) {
          bx = Math.max(8, Math.min(w - 54, cx - 23 + idx * 50));
          by = Math.max(36, Math.min(h - 24, cy - 28 - idx * 24));
        }
        placedBoxes.push({ x: bx - 2, y: by - (has3D ? 28 : 2), w: 50, h: boxH });

        // 若因避让穿模产生偏移，画细金定位引导线连回所属城市圆心
        if (Math.hypot(bx + 23 - cx, by + 9 - cy) > 36) {
          ctx.save();
          ctx.strokeStyle = 'rgba(230, 206, 146, 0.42)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx + 23, by + 18); ctx.stroke();
          ctx.restore();
        }

        // 先画正上方独立站位【统一底层 3D 步坦炮多兵模列阵】（与国共内战同源比例换算！）
        if (has3D) {
          const tankKind = ({ germany: 'tiger', ussr: 't34', usa: 'sherman', uk: 'churchill', france: 'charb1', japan: 'chiha', china: 'sherman' }[a.nation] || 'sherman');
          const soldierKind = ({ usa: 'soldier_usa', ussr: 'soldier_ussr', uk: 'soldier_uk', france: 'soldier_france', japan: 'soldier_japan', germany: 'soldier_germany', china: 'soldier_china_ww2' }[a.nation] || 'soldier_usa');
          const sSide = a.nation === 'ussr' ? 'ccp' : 'roc';
          const sAct = a.order === 'attack' || a.order === 'siege' ? 'fire' : a.order === 'move' ? 'march' : state.nightMode ? 'sleep' : 'idle';
          drawUnified3DFormation(ctx, opts.renderer3D, bx + 23, by + 1, {
            strength: a.strength, tanks: a.tanks, unitKind: a.unitKind || '', nation: a.nation,
            maxSoldiers: zoom >= 1.4 ? 3 : 2, size: zoom >= 1.4 ? 30 : 25,
            soldierKind, tankKind, side: sSide, moving: sAct !== 'idle', action: sAct, now: opts.nowMs || 0,
          });
        }

        const selected = opts.selectedArmy === a.id;
        ctx.fillStyle = fac.color;
        ctx.fillRect(bx, by, 46, 18);
        ctx.strokeStyle = selected ? '#ffe680' : fac.border;
        ctx.lineWidth = selected ? 2.4 : 1.2;
        ctx.strokeRect(bx, by, 46, 18);
        // 组织度绿条 + HOI4 作战计划蓄力蓝条
        ctx.fillStyle = '#141916';
        ctx.fillRect(bx + 2, by + 13.5, 42, 3);
        ctx.fillStyle = a.org > 45 ? '#66e088' : '#f07154';
        ctx.fillRect(bx + 2, by + 13.5, 42 * Math.max(0, Math.min(1, a.org / 100)), 3);
        if ((a.planBonus || 0) > 2) {
          ctx.fillStyle = '#52c8ff';
          ctx.fillRect(bx + 2, by + 1, 42 * Math.min(1, a.planBonus / 45), 2);
        }
        const vetStars = '★'.repeat(Math.floor(a.vet || 0));
        ctx.fillStyle = '#fff9e6';
        ctx.font = 'bold 9.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${fac.flag}${Math.round(a.strength / 1000)}K${vetStars}`, bx + 23, by + 10.5);
        if (a.tanks >= 600 && !has3D) {
          const tankCount = Math.min(4, Math.max(2, Math.floor(a.tanks / 500)));
          ctx.fillStyle = '#ffd966';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.fillText('▪'.repeat(tankCount) + '坦', bx + 23, by - 2);
        }
        armyHits.push({ id: a.id, army: a, x: bx, y: by, w: 46, h: 18 });
      });
    }

    // 5.5 HOI4 手绘进攻箭头（拖动绘制粗大弧形进攻箭头 + 动态脉冲光点）
    if (opts.drawnArrow && opts.drawnArrow.x1 != null) {
      const { x1, y1, x2, y2 } = opts.drawnArrow;
      const dx = x2 - x1, dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        const cx = (x1 + x2) / 2 - dy * 0.14;
        const cy = (y1 + y2) / 2 + dx * 0.14;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 92, 68, 0.35)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();

        ctx.strokeStyle = '#ff6a4d';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();

        // 动态脉冲光点沿箭头流动
        const pulse = ((opts.nowMs || Date.now()) % 1200) / 1200;
        for (let k = 0; k < 3; k++) {
          const t = (pulse + k / 3) % 1;
          const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
          const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
          ctx.fillStyle = '#fff2a6';
          ctx.beginPath(); ctx.arc(px, py, 3.6, 0, Math.PI * 2); ctx.fill();
        }
        const ang = Math.atan2(y2 - cy, x2 - cx);
        ctx.fillStyle = '#ff7d5c';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 18 * Math.cos(ang - 0.45), y2 - 18 * Math.sin(ang - 0.45));
        ctx.lineTo(x2 - 18 * Math.cos(ang + 0.45), y2 - 18 * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffe999';
        ctx.font = 'bold 11.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔ 手绘战线进攻计划（松开即刻执行）', cx, cy - 10);
        ctx.restore();
      }
    }

    // 6. 实时战场史诗动态特效：欧洲多坦克闪电战 / 太平洋海空决战 / 原子弹发射飞行与蘑菇云轰炸！
    const nowMs = opts.nowMs || Date.now();
    if (Array.isArray(state.effects) && state.effects.length) {
      state.effects = state.effects.filter((ef) => (nowMs - ef.startMs) < (ef.durationMs || 5000));
      for (const ef of state.effects) {
        const p = Math.max(0, Math.min(1, (nowMs - ef.startMs) / (ef.durationMs || 5000)));
        const cf = cityMap.get(ef.from), ct = cityMap.get(ef.to);
        if (!ct) continue;
        const [tx, ty] = proj(ct.lon, ct.lat);
        const [fx, fy] = cf ? proj(cf.lon, cf.lat) : [tx - 160, ty - 70];

        if (ef.type === 'blitz') {
          // 德国/装甲集群金色闪电冲击波 + 多坦克履带推进光效
          ctx.save();
          ctx.strokeStyle = `rgba(255, 218, 72, ${1 - p * 0.6})`;
          ctx.lineWidth = 4.5;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
          for (let k = 0; k < 3; k++) {
            const tp = Math.min(1, p * 1.3 - k * 0.14);
            if (tp < 0) continue;
            const px = fx + (tx - fx) * tp, py = fy + (ty - fy) * tp;
            ctx.fillStyle = '#ffe56b';
            ctx.fillRect(px - 7, py - 4, 14, 8);
            ctx.strokeStyle = '#382a08'; ctx.lineWidth = 1.2; ctx.strokeRect(px - 7, py - 4, 14, 8);
          }
          ctx.beginPath(); ctx.arc(tx, ty, 12 + p * 34, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 198, 56, ${1 - p})`; ctx.lineWidth = 2.6; ctx.stroke();
          ctx.restore();
        } else if (ef.type === 'naval_air') {
          // 太平洋航母海战水柱波纹 + 舰载机空中曳光弹缠斗特效
          ctx.save();
          for (let r = 0; r < 3; r++) {
            const rad = 10 + ((p * 85 + r * 24) % 58);
            ctx.beginPath(); ctx.arc(tx, ty, rad, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(98, 206, 255, ${Math.max(0.1, 0.85 - rad / 65)})`;
            ctx.lineWidth = 2; ctx.stroke();
          }
          // 交叉空中机炮曳光弹与舰载机飞掠
          for (let j = 0; j < 4; j++) {
            const ang = p * Math.PI * 3 + j * (Math.PI / 2);
            const ax = tx + Math.cos(ang) * 26, ay = ty + Math.sin(ang) * 18;
            ctx.strokeStyle = j % 2 === 0 ? '#7ad4ff' : '#ff8c66';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(ang + 1.2) * 16, ay + Math.sin(ang + 1.2) * 12); ctx.stroke();
          }
          ctx.fillStyle = '#d6f4ff';
          ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚢✈️ 海空决战 · 跳岛封锁', tx, ty - 28);
          ctx.restore();
        } else if (ef.type === 'v2') {
          // 🚀 V-2 超音速弹道导弹高空抛物线火焰轨迹 + 落地爆炸特效
          ctx.save();
          if (p < 0.65) {
            const fp = p / 0.65;
            const mx = fx + (tx - fx) * fp;
            const my = fy + (ty - fy) * fp - Math.sin(fp * Math.PI) * 115;
            ctx.strokeStyle = 'rgba(255, 130, 56, 0.9)'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo((fx + tx) / 2, Math.min(fy, ty) - 140, mx, my); ctx.stroke();
            ctx.fillStyle = '#fff5cc'; ctx.beginPath(); ctx.arc(mx, my, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffaa66'; ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('🚀 V-2 弹道导弹', mx, my - 10);
          } else {
            const bp = (p - 0.65) / 0.35;
            ctx.beginPath(); ctx.arc(tx, ty, 10 + bp * 42, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 110, 32, ${(1 - bp) * 0.75})`; ctx.fill();
            ctx.strokeStyle = `rgba(255, 240, 170, ${1 - bp})`; ctx.lineWidth = 2.4; ctx.stroke();
          }
          ctx.restore();
        } else if (ef.type === 'nuke') {
          // ☢️ 原子弹全流程特效：0–0.42 B-29发射飞行轨迹 → 0.42–0.56 全屏炽白核闪爆 → 0.56–1.00 三层冲击波+立体升腾蘑菇云！
          ctx.save();
          const sx = Math.abs((cf?.lon || 0) - ct.lon) > 150 ? Math.max(30, tx - 210) : fx;
          const sy = Math.abs((cf?.lon || 0) - ct.lon) > 150 ? Math.max(40, ty - 90) : fy;
          if (p < 0.42) {
            const fp = p / 0.42;
            const bx = sx + (tx - sx) * fp;
            const by = sy + (ty - sy) * fp - Math.sin(fp * Math.PI) * 58;
            // 金色高空尾迹
            ctx.strokeStyle = 'rgba(255, 224, 130, 0.85)';
            ctx.setLineDash([6, 4]); ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + tx) / 2, Math.min(sy, ty) - 85, bx, by); ctx.stroke();
            ctx.setLineDash([]);
            // 银白 B-29 轰炸机轮廓
            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(bx - 13, by - 1.5, 26, 3);
            ctx.fillRect(bx - 2, by - 9, 4, 18);
            // 目标红核爆准星
            ctx.strokeStyle = '#ff4433'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(tx, ty, 16 + Math.sin(p * 30) * 4, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#ff7b6b'; ctx.font = 'bold 11px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('☢️ B-29 原子弹投弹逼近', tx, ty - 24);
          } else {
            const bp = (p - 0.42) / 0.58;
            // 阶段2：炽白强光闪爆
            if (bp < 0.24) {
              const flashAlpha = (1 - bp / 0.24) * 0.72;
              ctx.fillStyle = `rgba(255, 252, 232, ${flashAlpha})`;
              ctx.fillRect(0, 0, w, h);
            }
            // 阶段3：三层超音速地面冲击波环
            for (let ring = 0; ring < 3; ring++) {
              const rRad = Math.max(4, bp * 165 - ring * 26);
              if (rRad <= 4) continue;
              ctx.beginPath(); ctx.arc(tx, ty, rRad, 0, Math.PI * 2);
              ctx.strokeStyle = ring === 0 ? `rgba(255, 245, 200, ${1 - bp})` : `rgba(255, 118, 42, ${(1 - bp) * 0.85})`;
              ctx.lineWidth = 3.5 - ring;
              ctx.stroke();
            }
            // 巨型立体升腾蘑菇云（火球底座 + 火柱柄 + 翻滚蕈伞云冠）
            const rise = Math.min(1, bp * 1.45);
            const stemH = 22 + rise * 68;
            const capY = ty - stemH;
            const capRx = 18 + rise * 42;
            const capRy = 11 + rise * 22;
            // 底座火海光晕
            const baseG = ctx.createRadialGradient(tx, ty, 2, tx, ty, 28 + rise * 28);
            baseG.addColorStop(0, 'rgba(255, 230, 120, 0.95)');
            baseG.addColorStop(0.5, 'rgba(255, 96, 24, 0.65)');
            baseG.addColorStop(1, 'rgba(180, 30, 10, 0)');
            ctx.fillStyle = baseG;
            ctx.beginPath(); ctx.arc(tx, ty, 28 + rise * 28, 0, Math.PI * 2); ctx.fill();
            // 蘑菇云柱柄
            const stemG = ctx.createLinearGradient(tx - 10, ty, tx + 10, capY);
            stemG.addColorStop(0, '#ff9d3b');
            stemG.addColorStop(0.5, '#d95b26');
            stemG.addColorStop(1, '#6e3b2e');
            ctx.fillStyle = stemG;
            ctx.fillRect(tx - (6 + rise * 5), capY, 12 + rise * 10, stemH);
            // 翻滚蕈伞云盖
            const capG = ctx.createRadialGradient(tx, capY - 4, 4, tx, capY, capRx);
            capG.addColorStop(0, '#fff7cc');
            capG.addColorStop(0.45, '#ff9a2e');
            capG.addColorStop(0.82, '#c83e1d');
            capG.addColorStop(1, 'rgba(72, 42, 36, 0.88)');
            ctx.fillStyle = capG;
            ctx.beginPath(); ctx.ellipse(tx, capY, capRx, capRy, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(tx, capY - capRy * 0.45, capRx * 0.72, capRy * 0.65, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('☢️ 原子弹引爆 · 蘑菇云升腾', tx, capY - capRy - 8);
          }
          ctx.restore();
        }
      }
    }

    // 夜间视图蓝黑夜幕叠加（与国内战场夜间模式一致）
    if (state.nightMode) {
      ctx.fillStyle = 'rgba(8, 16, 36, 0.36)';
      ctx.fillRect(0, 0, w, h);
    }

    // 标题水印
    const curWeather = getWW2SeasonWeather(state.date.m);
    ctx.fillStyle = 'rgba(246, 228, 178, 0.96)';
    ctx.font = 'bold 13.5px "Songti SC", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.scenarioTitle} · ${formatDate(state.date)} · ${curWeather.name} · 紧张度 ${state.worldTension}% · ${th.name}`, 14, 22);
    ctx.fillStyle = 'rgba(216, 224, 214, 0.82)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('左键选中我方集团军兵牌 → 再点击相邻城市立即下达【进攻/调动】；支持滚轮缩放与按战区一键聚焦', 14, 39);

    return { cityHits, armyHits };
  }

  const WW2Sim = {
    ww2Blocs,
    ww2FocusTrees,
    ww2Doctrines,
    ww2TechCatalog,
    ww2HistoricalEvents,
    ww2NeutralMinors,
    ww2GeneralTraits,
    ww2MIOByNation,
    getWW2SeasonWeather,
    templateStats,
    fleetScreenRatio,
    createWW2Game,
    tradeWW2Resource,
    designWW2Equipment,
    recruitCustomTemplateWW2,
    upgradeWW2General,
    inviteMinorWW2,
    peaceDemandWW2,
    buildEscortScreenWW2,
    marketWW2Trade,
    upgradeWW2MIO,
    launchV2MissileWW2,
    deployDirectForceWW2,
    freeAmphibiousLandingWW2,
    fireRailwayGunWW2,
    spyMissionWW2,
    issueWW2Order,
    fortifyWW2City,
    scorchedEarthWW2,
    citySupplyLevel,
    setWW2Doctrine,
    setWW2Law,
    researchWW2Tech,
    ww2IntelAction,
    airborneWW2,
    barrageWW2,
    commandSkillWW2,
    portGarrisonWW2,
    applyWW2Event,
    blitzkriegStrikeWW2,
    pacificNavalAirBattle,
    launchAtomicBombWW2,
    findAirbaseInRange,
    buildRadarWW2,
    garrisonSuppressWW2,
    relocateIndustryWW2,
    triggerVichyFranceWW2,
    planAmphibiousWW2,
    blockadeIslandWW2,
    kamikazeStrikeWW2,
    fallbackLineWW2,
    declareWarWW2,
    proposePeaceWW2,
    generalOffensiveWW2,
    forecastWW2,
    startWW2Focus,
    recruitWW2Division,
    lendLeaseWW2,
    stepWW2Day,
    isHostile,
    formatDate,
    renderWW2Canvas,
  };

  // =========================================================================
  // 抗美援朝 · 朝鲜战争（1950–1953）HOI4 全屏战略沙盘引擎与渲染器
  // =========================================================================
  function createKoreanWarGame(Korea, scenarioId = 'kw-1950-10', playerSide = 'dprk_coalition') {
    const sc = (Korea.scenarios || []).find((s) => s.id === scenarioId) || Korea.scenarios[2] || Korea.scenarios[0];
    const [y, m, d] = (sc?.date || '1950-10-25').split('-').map(Number);
    const owners = {};
    const northSet = new Set(['dandong', 'sinyiju', 'unsan', 'chongchon', 'chosin', 'hungnam', 'pyongyang', 'wonsan', 'shangganling', 'cheorwon', 'kaesong']);
    const pusanSet = new Set(['taegu', 'pusan']);
    const unPushSet = new Set(['seoul', 'incheon', 'suwon', 'chuncheon', 'taejon', 'taegu', 'pusan', 'kaesong', 'pyongyang', 'wonsan', 'hungnam']);
    for (const c of Korea.cities) {
      if (sc.id === 'kw-1950-06') owners[c.id] = northSet.has(c.id) ? 'dprk_coalition' : 'un_coalition';
      else if (sc.id === 'kw-1950-09') owners[c.id] = pusanSet.has(c.id) || c.id === 'incheon' ? 'un_coalition' : 'dprk_coalition';
      else if (sc.id === 'kw-1950-10' || sc.id === 'kw-1950-11') owners[c.id] = unPushSet.has(c.id) ? 'un_coalition' : 'dprk_coalition';
      else owners[c.id] = northSet.has(c.id) ? 'dprk_coalition' : 'un_coalition';
    }
    owners.dandong = 'dprk_coalition';
    owners.pusan = 'un_coalition';

    const sides = {
      dprk_coalition: {
        id: 'dprk_coalition', name: '中朝联军（志愿军 / 人民军 / 苏援空军）', short: '中朝联军', flag: '★', color: '#c4362c',
        pp: 60, cp: 45, fuel: 78, convoys: 40, airPower: 62, navalPower: 28, warScore: 0,
        stock: { infantry: 850, tanks: 240, artillery: 540, planes: 320, ships: 12 },
        activeFocus: null, completedFocuses: [], atkBonus: 1, defBonus: 1,
      },
      un_coalition: {
        id: 'un_coalition', name: '联合国军（美军 / 韩军 / 英联邦）', short: '联合国军', flag: '★', color: '#2b6cb0',
        pp: 60, cp: 45, fuel: 95, convoys: 180, airPower: 88, navalPower: 94, warScore: 0,
        stock: { infantry: 780, tanks: 420, artillery: 680, planes: 520, ships: 64 },
        activeFocus: null, completedFocuses: [], atkBonus: 1, defBonus: 1,
      },
    };

    const citySet = new Set(Korea.cities.map((c) => c.id));
    const armies = [];
    const factionList = Object.values(Korea.factions);
    for (const f of factionList) {
      if (f.id === 'ussr') continue;
      for (const corp of (f.corps || [])) {
        let city = citySet.has(corp.city) ? corp.city : (f.side === 'dprk_coalition' ? 'sinyiju' : 'pusan');
        if (owners[city] !== f.side) {
          city = Korea.cities.find((c) => owners[c.id] === f.side)?.id || city;
        }
        armies.push({
          id: corp.id,
          name: corp.name,
          commander: corp.commander,
          side: f.side,
          factionId: f.id,
          city,
          strength: corp.strength,
          maxStrength: corp.strength,
          org: 86,
          entrench: sc.id === 'kw-1952-10' ? 5 : 2,
          tanks: f.id === 'usa' || f.id === 'kpa' ? 45 : f.id === 'commonwealth' ? 30 : 18,
          artillery: f.id === 'usa' || f.id === 'pva' ? 65 : 35,
          order: 'defend',
          target: null,
          progress: 0,
        });
      }
    }

    const forts = { shangganling: 4, cheorwon: 3, seoul: 2, pusan: 3, pyongyang: 2 };
    return {
      scenarioId: sc.id,
      scenarioTitle: sc.title,
      player: playerSide === 'un_coalition' ? 'un_coalition' : 'dprk_coalition',
      date: { y, m, d },
      dayCount: 0,
      owners,
      forts,
      sides,
      armies,
      aiDelegate: false,
      fxQueue: [],
      log: [`${formatDate({ y, m, d })} · 🇰🇵 【${sc.title}】开战！${sc.summary}`],
    };
  }

  function buildKoreaAdj(Korea) {
    const adj = new Map();
    for (const c of Korea.cities) adj.set(c.id, []);
    for (const [a, b, kind] of (Korea.routes || [])) {
      if (adj.has(a) && adj.has(b)) {
        adj.get(a).push({ to: b, kind });
        adj.get(b).push({ to: a, kind });
      }
    }
    return adj;
  }

  function issueKoreanWarOrder(Korea, st, armyId, order, targetId) {
    const a = st.armies.find((u) => u.id === armyId && u.strength > 0);
    if (!a) return { ok: false, error: '未找到该参战军团。' };
    if (order === 'defend' || order === 'rest') {
      a.order = order; a.target = null; a.progress = 0;
      return { ok: true };
    }
    const adj = buildKoreaAdj(Korea);
    const links = adj.get(a.city) || [];
    const direct = links.find((l) => l.to === targetId);
    let stepTarget = targetId;
    if (!direct) {
      // BFS 寻路，自动走铁路/公路向目标推进
      const q = [[a.city]];
      const vis = new Set([a.city]);
      let found = null;
      while (q.length && !found) {
        const path = q.shift();
        const cur = path[path.length - 1];
        for (const l of (adj.get(cur) || [])) {
          if (vis.has(l.to)) continue;
          const np = path.concat(l.to);
          if (l.to === targetId) { found = np; break; }
          vis.add(l.to);
          q.push(np);
        }
      }
      if (!found || found.length < 2) return { ok: false, error: '目标城镇与当前阵地无连通路线。' };
      stepTarget = found[1];
    }
    a.order = st.owners[stepTarget] !== a.side ? 'attack' : 'move';
    a.target = stepTarget;
    a.progress = 0;
    return { ok: true, stepTarget };
  }

  function startKoreanWarFocus(Korea, st, sideId, focusId) {
    const s = st.sides[sideId];
    const list = Korea.focusTrees?.[sideId] || [];
    const fo = list.find((f) => f.id === focusId);
    if (!s || !fo) return { ok: false, error: '未找到该朝鲜战区国策。' };
    if (s.completedFocuses.includes(focusId)) return { ok: false, error: '该国策已完成。' };
    s.activeFocus = { id: fo.id, name: fo.name, left: fo.days, total: fo.days };
    st.log.push(`${formatDate(st.date)} · ⭐ ${s.short}启动国家焦点【${fo.name}】（需 ${fo.days} 天）！`);
    return { ok: true };
  }

  function triggerKoreanWarSpecial(Korea, st, sideId, kind, targetCityId) {
    const s = st.sides[sideId];
    if (!s) return { ok: false, error: '阵营无效。' };
    const enemySide = sideId === 'dprk_coalition' ? 'un_coalition' : 'dprk_coalition';
    const cityMap = new Map(Korea.cities.map((c) => [c.id, c]));
    let tgt = targetCityId && st.owners[targetCityId] === enemySide ? targetCityId : null;
    if (!tgt) {
      tgt = st.armies.find((u) => u.side === enemySide && u.strength > 0)?.city
        || Korea.cities.find((c) => st.owners[c.id] === enemySide)?.id;
    }
    const ownFront = Korea.cities.find((c) => st.owners[c.id] === sideId && (buildKoreaAdj(Korea).get(c.id) || []).some((l) => st.owners[l.to] === enemySide))?.id
      || Korea.cities.find((c) => st.owners[c.id] === sideId)?.id;

    if (kind === 'katyusha') {
      if (s.cp < 20) return { ok: false, error: '指挥点不足（喀秋莎齐射需 20 指点）。' };
      s.cp -= 20;
      const defs = st.armies.filter((u) => u.city === tgt && u.side === enemySide && u.strength > 0);
      defs.forEach((d) => { d.org = Math.max(8, d.org - 32); d.strength = Math.max(2000, Math.round(d.strength * 0.84)); });
      st.forts[tgt] = Math.max(0, (st.forts[tgt] || 0) - 1);
      st.fxQueue.push({ kind: 'katyusha', from: ownFront || 'sinyiju', to: tgt, ttl: 26 });
      st.log.push(`${formatDate(st.date)} · 🚀 BM-13 喀秋莎火箭炮师齐射覆盖 ${cityMap.get(tgt)?.name || tgt}，敌军组织度暴跌！`);
      return { ok: true, target: tgt };
    }
    if (kind === 'mig_corridor') {
      if (s.pp < 20) return { ok: false, error: '政治点不足（米格走廊截击需 20 政点）。' };
      s.pp -= 20;
      s.airPower = Math.min(100, s.airPower + 18);
      s.stock.planes += 45;
      st.sides[enemySide].airPower = Math.max(25, st.sides[enemySide].airPower - 10);
      st.fxQueue.push({ kind: 'mig_corridor', from: 'dandong', to: tgt || 'chongchon', ttl: 28 });
      st.log.push(`${formatDate(st.date)} · ✈️ 苏联第64航空军与志愿军米格-15 机群升空截击，稳控「米格走廊」制空权！`);
      return { ok: true, target: tgt };
    }
    if (kind === 'inchon_landing') {
      if (s.cp < 25) return { ok: false, error: '指挥点不足（航母特混两栖登陆需 25 指点）。' };
      s.cp -= 25;
      const portTgt = ['incheon', 'wonsan', 'hungnam', 'pusan'].find((id) => st.owners[id] === enemySide) || tgt;
      const defs = st.armies.filter((u) => u.city === portTgt && u.side === enemySide && u.strength > 0);
      defs.forEach((d) => { d.org = Math.max(10, d.org - 28); d.strength = Math.max(2000, Math.round(d.strength * 0.85)); });
      if (!defs.length && portTgt) st.owners[portTgt] = sideId;
      st.fxQueue.push({ kind: 'inchon_landing', from: 'pusan', to: portTgt, ttl: 30 });
      st.log.push(`${formatDate(st.date)} · 🚢 埃塞克斯航母与密苏里战列舰 406mm 巨炮掩护两栖登陆突袭 ${cityMap.get(portTgt)?.name || portTgt}！`);
      return { ok: true, target: portTgt };
    }
    if (kind === 'tunnel_fort') {
      if (s.pp < 15) return { ok: false, error: '政治点不足（构筑上甘岭坑道网需 15 政点）。' };
      s.pp -= 15;
      if (ownFront) st.forts[ownFront] = Math.min(6, (st.forts[ownFront] || 0) + 2);
      st.armies.filter((u) => u.side === sideId && u.strength > 0).forEach((u) => { u.entrench = Math.min(10, u.entrench + 3); u.org = Math.min(100, u.org + 15); });
      st.log.push(`${formatDate(st.date)} · ⛰️ ${s.short}在 ${cityMap.get(ownFront)?.name || '前沿'} 构筑反斜面坑道工事网，全军防守大幅强化！`);
      return { ok: true, target: ownFront };
    }
    if (kind === 'van_fleet') {
      if (s.cp < 20) return { ok: false, error: '指挥点不足（范佛里特重炮轰击需 20 指点）。' };
      s.cp -= 20;
      const defs = st.armies.filter((u) => u.city === tgt && u.side === enemySide && u.strength > 0);
      defs.forEach((d) => { d.org = Math.max(10, d.org - 26); d.strength = Math.max(2000, Math.round(d.strength * 0.86)); });
      st.fxQueue.push({ kind: 'van_fleet', from: ownFront || 'seoul', to: tgt, ttl: 26 });
      st.log.push(`${formatDate(st.date)} · 💣 155/203mm 重炮群倾泻「范佛里特弹药量」覆盖 ${cityMap.get(tgt)?.name || tgt}！`);
      return { ok: true, target: tgt };
    }
    return { ok: false, error: '未知朝鲜战区战术。' };
  }

  function stepKoreanWarDay(Korea, st, days = 1) {
    const adj = buildKoreaAdj(Korea);
    const cityMap = new Map(Korea.cities.map((c) => [c.id, c]));
    for (let step = 0; step < days; step += 1) {
      st.dayCount += 1;
      const dt = new Date(Date.UTC(st.date.y, st.date.m - 1, st.date.d + 1));
      st.date = { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
      st.fxQueue = (st.fxQueue || []).map((f) => ({ ...f, ttl: f.ttl - 1 })).filter((f) => f.ttl > 0);

      for (const s of Object.values(st.sides)) {
        s.pp = Math.min(300, s.pp + 2.2);
        s.cp = Math.min(100, s.cp + 1.5);
        s.fuel = Math.min(100, s.fuel + 0.4);
        if (s.activeFocus) {
          s.activeFocus.left -= 1;
          if (s.activeFocus.left <= 0) {
            const fid = s.activeFocus.id;
            s.completedFocuses.push(fid);
            if (fid === 'kw_cross_yalu') { s.atkBonus += 0.18; s.defBonus += 0.12; }
            else if (fid === 'kw_mig_alley') { s.airPower = Math.min(100, s.airPower + 28); s.stock.planes += 120; s.stock.artillery += 80; }
            else if (fid === 'kw_tunnel_net') { s.defBonus += 0.25; s.pp += 30; st.forts.shangganling = Math.min(6, (st.forts.shangganling || 0) + 2); }
            else if (fid === 'kw_chromite') { s.navalPower = Math.min(100, s.navalPower + 20); s.atkBonus += 0.18; }
            else if (fid === 'kw_vanfleet') { s.stock.artillery += 140; s.stock.tanks += 70; s.atkBonus += 0.2; }
            else if (fid === 'kw_sabre_sky') { s.airPower = Math.min(100, s.airPower + 25); s.stock.planes += 120; }
            st.log.push(`${formatDate(st.date)} · ✅ ${s.short}完成国策【${s.activeFocus.name}】！`);
            s.activeFocus = null;
          }
        }
      }

      // AI 行动（敌方 + 玩家开启委任AI时）
      for (const a of st.armies) {
        if (a.strength <= 0) continue;
        if (a.side === st.player && !st.aiDelegate) continue;
        if (a.order === 'defend' && a.org > 48) {
          const links = adj.get(a.city) || [];
          const hostile = links.filter((l) => st.owners[l.to] !== a.side && (l.kind !== 'sea' || st.sides[a.side].navalPower >= 60));
          if (hostile.length) {
            const tgt = hostile[Math.floor(Math.random() * hostile.length)].to;
            const defStr = st.armies.filter((u) => u.city === tgt && u.side !== a.side && u.strength > 0).reduce((s, u) => s + u.strength, 0);
            if (a.strength * 1.1 >= defStr) { a.order = 'attack'; a.target = tgt; a.progress = 0; }
          } else {
            const fwd = links.find((l) => st.owners[l.to] === a.side && (adj.get(l.to) || []).some((n2) => st.owners[n2.to] !== a.side));
            if (fwd) { a.order = 'move'; a.target = fwd.to; a.progress = 0; }
          }
        }
      }

      // 陆海空推进与战斗结算
      for (const a of st.armies) {
        if (a.strength <= 0) continue;
        const s = st.sides[a.side];
        if (a.order === 'defend' || a.order === 'rest') {
          a.entrench = a.order === 'defend' ? Math.min(10, a.entrench + 0.4) : a.entrench;
          a.org = Math.min(100, a.org + (a.order === 'rest' ? 6.5 : 3.2));
          if (a.strength < a.maxStrength) a.strength = Math.min(a.maxStrength, a.strength + 800);
          continue;
        }
        if (!a.target) { a.order = 'defend'; continue; }
        const link = (adj.get(a.city) || []).find((l) => l.to === a.target);
        if (!link) { a.order = 'defend'; a.target = null; continue; }
        if (st.owners[a.target] === a.side) {
          a.progress += link.kind === 'rail' ? 45 : 28;
          if (a.progress >= 100) { a.city = a.target; a.target = null; a.order = 'defend'; a.progress = 0; }
          continue;
        }
        const defs = st.armies.filter((u) => u.city === a.target && u.side !== a.side && u.strength > 0);
        if (!defs.length) {
          a.progress += 42;
          if (a.progress >= 100) {
            st.owners[a.target] = a.side;
            a.city = a.target; a.target = null; a.order = 'defend'; a.progress = 0;
            s.warScore += 8;
            st.log.push(`${formatDate(st.date)} · 🚩 ${a.name} 攻占 ${cityMap.get(a.city)?.name || a.city}！`);
          }
          continue;
        }
        const fortLvl = st.forts[a.target] || 0;
        const atkPow = (a.strength / 1000 + a.tanks * 0.35 + a.artillery * 0.25) * (0.45 + 0.55 * a.org / 100) * s.atkBonus * (0.9 + s.airPower / 400);
        const defSide = st.sides[defs[0].side];
        const defPow = defs.reduce((sum, d) => sum + (d.strength / 1000 + d.tanks * 0.3 + d.artillery * 0.25) * (0.45 + 0.55 * d.org / 100) * (1 + d.entrench * 0.04 + fortLvl * 0.14), 0) * defSide.defBonus;
        const ratio = atkPow / Math.max(1, defPow);
        a.progress += Math.min(34, Math.max(6, Math.round(14 * ratio)));
        a.org = Math.max(10, a.org - 5.5 / Math.max(0.5, ratio));
        a.strength = Math.max(1500, Math.round(a.strength - 650 / Math.max(0.5, ratio)));
        s.warScore += 1.5;
        defs.forEach((d) => {
          d.org = Math.max(5, d.org - 6.5 * Math.min(2.2, ratio));
          d.strength = Math.max(1200, Math.round(d.strength - 750 * Math.min(2.2, ratio)));
        });
        if (a.progress >= 100 || defs.every((d) => d.org <= 14)) {
          const retreat = (adj.get(a.target) || []).find((l) => st.owners[l.to] === defs[0].side)?.to;
          defs.forEach((d) => { if (retreat) { d.city = retreat; d.org = 25; } else d.strength = 0; });
          st.owners[a.target] = a.side;
          a.city = a.target; a.target = null; a.order = 'defend'; a.progress = 0;
          s.warScore += 14;
          st.log.push(`${formatDate(st.date)} · ⚔️ ${a.name} 激战攻克 ${cityMap.get(a.city)?.name || a.city}！`);
        } else if (a.org <= 16) {
          a.order = 'defend'; a.target = null; a.progress = 0;
        }
      }
      if (st.log.length > 60) st.log = st.log.slice(-60);
    }
    return st;
  }

  // 高精朝鲜半岛 + 辽东 + 济州岛 + 对马岛自然海岸线（与国共内战同级测绘精度）
  const koreaLandPolys = [
    // 朝鲜半岛主体 + 辽东半岛连接陆块（54 节点高精真实地理轮廓）
    [
      [122.0, 41.8], [131.5, 41.8], [130.7, 42.3], [130.65, 42.0], [130.35, 41.75],
      [129.85, 41.78], [129.68, 41.15], [129.35, 40.72], [128.95, 40.38], [128.22, 40.02],
      [127.65, 39.84], [127.48, 39.42], [127.46, 39.15], [127.95, 38.92], [128.42, 38.48],
      [128.88, 37.82], [129.38, 37.12], [129.44, 36.52], [129.55, 36.02], [129.42, 35.52],
      [129.12, 35.12], [128.62, 35.02], [128.18, 34.86], [127.68, 34.72], [127.12, 34.62],
      [126.55, 34.42], [126.18, 34.78], [126.35, 35.28], [126.52, 35.72], [126.62, 36.18],
      [126.18, 36.68], [126.52, 36.98], [126.64, 37.45], [126.38, 37.76], [125.72, 37.88],
      [125.05, 37.98], [124.85, 38.28], [125.25, 38.66], [125.44, 39.04], [125.22, 39.52],
      [124.65, 39.84], [124.32, 39.96], [123.62, 39.82], [122.95, 39.55], [122.0, 39.25],
    ],
    // 济州岛
    [[126.16, 33.30], [126.52, 33.54], [126.94, 33.46], [126.82, 33.24], [126.35, 33.20]],
    // 对马岛
    [[129.20, 34.12], [129.42, 34.62], [129.48, 34.58], [129.30, 34.08]],
  ];
  const koreaRivers = [
    [[128.05, 41.95], [126.9, 41.45], [125.6, 40.75], [124.4, 40.05]], // 鸭绿江
    [[126.8, 39.8], [126.2, 39.35], [125.76, 39.03], [125.3, 38.7]], // 大同江
    [[128.4, 37.65], [127.7, 37.8], [127.0, 37.56], [126.58, 37.68]], // 汉江
    [[128.9, 36.9], [128.5, 36.2], [128.6, 35.87], [128.88, 35.12]], // 洛东江
  ];

  function renderKoreanWarCanvas(canvas, Korea, st, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const now = opts.now || Date.now();
    const minLonBase = 122.8, maxLonBase = 131.2, minLatBase = 33.8, maxLatBase = 41.5;
    const kwZoom = opts.zoom || 1;
    const kwCLon = (minLonBase + maxLonBase) / 2 + (opts.panLon || 0);
    const kwCLat = (minLatBase + maxLatBase) / 2 + (opts.panLat || 0);
    const spanLon = (maxLonBase - minLonBase) / kwZoom;
    const spanLat = (maxLatBase - minLatBase) / kwZoom;
    const minLon = kwCLon - spanLon / 2, maxLat = kwCLat + spanLat / 2;
    const proj = (lon, lat) => [
      ((lon - minLon) / spanLon) * W,
      ((maxLat - lat) / spanLat) * H,
    ];

    // 1. 与国共内战 map.js 同款的复古军事海图青灰海面 + 经纬网
    const seaGrad = ctx.createLinearGradient(0, 0, W, H);
    seaGrad.addColorStop(0, '#8ea99c');
    seaGrad.addColorStop(0.55, '#7c9a90');
    seaGrad.addColorStop(1, '#6c8b82');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(52, 82, 74, 0.16)';
    ctx.lineWidth = 0.8;
    for (let lo = 123; lo <= 131; lo++) { const [x] = proj(lo, 38); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let la = 34; la <= 41; la++) { const [, y] = proj(127, la); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const traceKorea = () => {
      ctx.beginPath();
      for (const poly of koreaLandPolys) {
        const pts = smoothCoast(poly, 2);
        pts.forEach(([lo, la], i) => {
          const [px, py] = proj(lo, la);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.closePath();
      }
    };

    // 2. 浅海大陆架柔光 + 复古羊皮纸地形山体阴影浮雕 + Voronoi 平滑势力疆域
    ctx.save();
    traceKorea();
    ctx.strokeStyle = 'rgba(202, 224, 214, 0.48)'; ctx.lineWidth = 7; ctx.stroke();
    ctx.restore();

    ctx.save();
    traceKorea();
    ctx.fillStyle = '#d3c9a7';
    ctx.fill();
    ctx.clip();
    const relief = getHillshadeCanvas(W, H, minLon, maxLat, spanLon, spanLat);
    if (relief) { ctx.globalAlpha = 0.94; ctx.drawImage(relief, 0, 0, W, H); ctx.globalAlpha = 1; }
    drawVoronoiTerritory(ctx, W, H, Korea.cities, st.owners, (o) => o === 'dprk_coalition' ? '#c73a32' : '#2b6cb0', proj, 9);
    // 朝鲜半岛四大河流水系（鸭绿江/大同江/汉江/洛东江）
    ctx.strokeStyle = 'rgba(62, 118, 132, 0.78)';
    ctx.lineWidth = 1.8;
    for (const rv of koreaRivers) {
      ctx.beginPath();
      rv.forEach(([lo, la], i) => { const [px, py] = proj(lo, la); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    traceKorea();
    ctx.strokeStyle = 'rgba(66, 98, 86, 0.85)'; ctx.lineWidth = 1.25; ctx.stroke();
    ctx.font = 'italic 12px "Microsoft YaHei UI", sans-serif';
    ctx.fillStyle = 'rgba(54, 86, 80, 0.72)'; ctx.textAlign = 'center';
    ctx.fillText('黄  海', ...proj(124.2, 36.2));
    ctx.fillText('日  本  海（东海）', ...proj(129.9, 38.6));
    ctx.restore();

    // 3. 三八线与鸭绿江标识
    const [x38a, y38] = proj(124.5, 38.0);
    const [x38b] = proj(129.8, 38.0);
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 208, 108, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(x38a, y38); ctx.lineTo(x38b, y38); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5d478';
    ctx.font = '700 11px "Microsoft YaHei UI", sans-serif';
    ctx.fillText('━━ 北纬 38° 线（三八线） ━━', x38b - 175, y38 - 5);
    ctx.restore();

    const cityMap = new Map(Korea.cities.map((c) => [c.id, c]));

    // 4. 铁路/公路/海运航线
    for (const [a, b, kind] of (Korea.routes || [])) {
      const ca = cityMap.get(a), cb = cityMap.get(b);
      if (!ca || !cb) continue;
      const [x1, y1] = proj(ca.lon, ca.lat), [x2, y2] = proj(cb.lon, cb.lat);
      ctx.save();
      if (kind === 'sea') {
        ctx.strokeStyle = 'rgba(104, 194, 240, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
      } else if (kind === 'rail') {
        ctx.strokeStyle = 'rgba(232, 198, 122, 0.75)';
        ctx.lineWidth = 2.2;
      } else {
        ctx.strokeStyle = 'rgba(182, 172, 146, 0.45)';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3, 3]);
      }
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    }

    // 5. 城市归属光晕与标签
    const cityHits = [];
    for (const c of Korea.cities) {
      const [x, y] = proj(c.lon, c.lat);
      const owner = st.owners[c.id];
      const col = owner === 'dprk_coalition' ? '#d9483b' : '#3a86d4';
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
      glow.addColorStop(0, owner === 'dprk_coalition' ? 'rgba(217,72,59,0.42)' : 'rgba(58,134,212,0.42)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, c.value >= 7 ? 6.5 : 4.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = opts.selectedCity === c.id ? '#ffe680' : '#f4ecd8';
      ctx.lineWidth = opts.selectedCity === c.id ? 2.5 : 1.2;
      ctx.stroke();

      const fort = st.forts?.[c.id] || 0;
      const lbl = c.name + (c.terrain === 'port' ? '⚓' : '') + (fort > 0 ? '🛡' + fort : '');
      ctx.font = '700 11.5px "Microsoft YaHei UI", sans-serif';
      const tw = ctx.measureText(lbl).width + 10;
      ctx.fillStyle = 'rgba(14, 19, 17, 0.84)';
      ctx.fillRect(x - tw / 2, y + 8, tw, 16);
      ctx.fillStyle = '#f7eed4';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x, y + 20);
      cityHits.push({ id: c.id, city: c, x: x - 16, y: y - 12, w: 32, h: 32 });
    }

    // 6. 军团推进箭头、防穿模 3D 兵模与兵牌
    const armyHits = [];
    const placedKw = cityHits.map((ch) => ({ x: ch.x - 14, y: ch.y + 18, w: 72, h: 18 }));
    const kwOverlaps = (ax, ay, aw, ah) => placedKw.some((b) => ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y);
    const kwOffsets = [[0, -24], [56, -24], [-56, -24], [0, -64], [58, 16], [-58, 16], [96, -24], [-96, -24]];
    const byCity = new Map();
    for (const a of st.armies) {
      if (a.strength <= 0) continue;
      if (!byCity.has(a.city)) byCity.set(a.city, []);
      byCity.get(a.city).push(a);
    }
    for (const [cid, list] of byCity.entries()) {
      const c = cityMap.get(cid);
      if (!c) continue;
      const [bx, by] = proj(c.lon, c.lat);
      list.forEach((a, idx) => {
        if (a.target && cityMap.has(a.target)) {
          const tc = cityMap.get(a.target);
          const [tx, ty] = proj(tc.lon, tc.lat);
          ctx.save();
          ctx.strokeStyle = a.order === 'attack' ? '#ff6448' : '#74c7ff';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([6, 4]);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.restore();
        }
        const has3D = Boolean(opts.show3D && opts.renderer3D);
        let x = bx, y = by - 24;
        for (let k = idx; k < kwOffsets.length + idx; k++) {
          const [ox, oy] = kwOffsets[k % kwOffsets.length];
          const tx = Math.max(30, Math.min(W - 30, bx + ox));
          const ty = Math.max(has3D ? 44 : 18, Math.min(H - 18, by + oy));
          if (!kwOverlaps(tx - 26, ty - (has3D ? 38 : 10), 52, has3D ? 50 : 20)) {
            x = tx; y = ty; break;
          }
        }
        placedKw.push({ x: x - 26, y: y - (has3D ? 38 : 10), w: 52, h: has3D ? 50 : 20 });
        if (Math.hypot(x - bx, y - by) > 36) {
          ctx.save();
          ctx.strokeStyle = 'rgba(230, 206, 146, 0.42)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y + 8); ctx.stroke();
          ctx.restore();
        }
        if (has3D) {
          const tankKind = a.side === 'dprk_coalition' ? 't34' : 'm26';
          const soldierKind = a.factionId === 'pva' ? 'soldier_china_kw' : a.factionId === 'usa' ? 'soldier_usa' : a.factionId === 'commonwealth' ? 'soldier_uk' : a.factionId === 'kpa' ? 'soldier_ussr' : 'soldier_usa';
          const renderSide = a.side === 'dprk_coalition' ? 'ccp' : 'roc';
          drawUnified3DFormation(ctx, opts.renderer3D, x, y - 7, {
            strength: a.strength, tanks: a.tanks, maxSoldiers: 2, size: 26,
            soldierKind, tankKind, side: renderSide, moving: a.order === 'attack', action: a.order === 'attack' ? 'attack' : 'idle', now,
          });
        }
        const sel = opts.selectedArmy === a.id;
        ctx.fillStyle = a.side === 'dprk_coalition' ? '#9c261f' : '#1f538a';
        ctx.fillRect(x - 24, y - 8, 48, 17);
        ctx.strokeStyle = sel ? '#ffe875' : '#e6dcc0';
        ctx.lineWidth = sel ? 2.2 : 1;
        ctx.strokeRect(x - 24, y - 8, 48, 17);
        ctx.fillStyle = '#fff';
        ctx.font = '700 10px "Microsoft YaHei UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(a.strength / 1000) + 'K', x, y + 4);
        ctx.fillStyle = '#5ee886';
        ctx.fillRect(x - 22, y + 7, Math.round(44 * (a.org / 100)), 2);
        armyHits.push({ id: a.id, army: a, x: x - 24, y: y - 10, w: 48, h: 22 });
      });
    }

    // 7. 特色战区特效（喀秋莎火箭弹雨 / 米格走廊空战 / 仁川航母炮击 / 范佛里特重炮）
    for (const fx of (st.fxQueue || [])) {
      const cf = cityMap.get(fx.from), ct = cityMap.get(fx.to);
      if (!ct) continue;
      const [x2, y2] = proj(ct.lon, ct.lat);
      const [x1, y1] = cf ? proj(cf.lon, cf.lat) : [x2 - 80, y2 - 40];
      ctx.save();
      const prog = 1 - Math.max(0, fx.ttl) / 28;
      if (fx.kind === 'katyusha' || fx.kind === 'van_fleet') {
        for (let i = 0; i < 6; i += 1) {
          const off = (i - 2.5) * 9;
          const mx = (x1 + x2) / 2 + off, my = Math.min(y1, y2) - 45 - i * 4;
          ctx.strokeStyle = fx.kind === 'katyusha' ? 'rgba(255, 118, 52, 0.88)' : 'rgba(255, 210, 96, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2 + off, y2); ctx.stroke();
        }
        const r = 10 + prog * 30;
        ctx.fillStyle = 'rgba(255, 130, 50, ' + (0.65 * (1 - prog * 0.7)).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(x2, y2, r, 0, Math.PI * 2); ctx.fill();
      } else if (fx.kind === 'mig_corridor') {
        ctx.strokeStyle = '#ff6d52'; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = '#ffe88a'; ctx.font = '700 13px "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('✈️ 米格-15 走廊截击！', (x1 + x2) / 2, (y1 + y2) / 2 - 12);
      } else if (fx.kind === 'inchon_landing') {
        ctx.strokeStyle = '#6ad4ff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x2, y2, 16 + prog * 28, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#bdeaff'; ctx.font = '700 12px "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🚢 航母特混·两栖强攻！', x2, y2 - 22);
      }
      ctx.restore();
    }

    // 8. HOI4 手绘曲率进攻箭头
    if (opts.drawnArrow) {
      const { x1, y1, x2, y2 } = opts.drawnArrow;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 28;
      const ang = Math.atan2(y2 - my, x2 - mx);
      const pulse = 0.72 + 0.28 * Math.sin(now * 0.01);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 102, 72, ' + pulse.toFixed(2) + ')';
      ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      ctx.strokeStyle = '#ffe29a'; ctx.lineWidth = 2.4; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b4a';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(ang - 0.45) * 18, y2 - Math.sin(ang - 0.45) * 18);
      ctx.lineTo(x2 - Math.cos(ang + 0.45) * 18, y2 - Math.sin(ang + 0.45) * 18);
      ctx.closePath(); ctx.fill();
      ctx.font = '700 12px "Microsoft YaHei UI", sans-serif'; ctx.fillStyle = '#fff0b8'; ctx.textAlign = 'center';
      ctx.fillText('⚔ 手绘进攻战线（松开即刻执行）', mx, my - 8);
      ctx.restore();
    }

    // 9. 左上角标题 HUD
    ctx.save();
    ctx.fillStyle = 'rgba(14, 20, 17, 0.84)';
    ctx.fillRect(10, 10, 440, 40);
    ctx.strokeStyle = '#9c8659'; ctx.strokeRect(10, 10, 440, 40);
    ctx.fillStyle = '#ffe599'; ctx.font = '700 13px "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`🇰🇵 ${st.scenarioTitle} · ${formatDate(st.date)}`, 18, 28);
    ctx.fillStyle = '#cbd4c4'; ctx.font = '11px "Microsoft YaHei UI", sans-serif';
    ctx.fillText('左键选中我方军团 → 点击敌城或使用「✏️ 画进攻战线」拖动突击', 18, 44);
    ctx.restore();

    return { cityHits, armyHits };
  }

  const KoreanWarSim = {
    createKoreanWarGame,
    issueKoreanWarOrder,
    startKoreanWarFocus,
    triggerKoreanWarSpecial,
    stepKoreanWarDay,
    renderKoreanWarCanvas,
  };

  const api = { blocs, ww2Blocs, continents, rivers, nations, terrainFeatures, renderWorldCanvas, WW2Sim, KoreanWarSim, getHillshadeCanvas, smoothCoast, koreaLandPolys };
  globalThis.CivilWarWorld = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
