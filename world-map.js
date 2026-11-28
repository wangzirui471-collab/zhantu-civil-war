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
        airMission: 'air_superiority', // air_superiority | cas | strat_bomb
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
          order: 'defend', // defend | attack | support | move
          target: null,
          progress: 0,
        });
      }
    }

    return {
      scenarioId: sc.id,
      scenarioTitle: sc.title,
      player: playerId,
      date: { y: yr, m: mo, d: dy },
      dayCount: 0,
      worldTension: sc.id === 'ww2-1938-china' ? 40 : sc.id === 'ww2-1940' ? 72 : 100,
      theater: sc.focus || 'global',
      wars,
      owners,
      forts,
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
    if (order === 'defend') {
      a.order = 'defend'; a.target = null; a.progress = 0;
      return { ok: true };
    }
    const adj = buildAdjacency(WW2);
    const link = (adj.get(a.city) || []).find((x) => x.to === targetCityId);
    if (!link) return { ok: false, error: '目标城市与当前驻地无直接陆路或海运航线相连。' };
    const targetOwner = state.owners[targetCityId];
    const hostile = isHostile(WW2, a.nation, targetOwner, state);
    if (order === 'move' && hostile) order = 'attack';
    if ((order === 'attack' || order === 'support') && !hostile) order = 'move';
    a.order = order;
    a.target = targetCityId;
    a.progress = 0;
    return { ok: true, linkKind: link.kind };
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

      // 1. 每日军工/船坞生产 + 政治点 + 国家焦点推进
      for (const ns of Object.values(state.nations)) {
        ns.pp = Math.min(500, ns.pp + 1.8);
        ns.cp = Math.min(200, ns.cp + 1.2);
        ns.stock.infantry += Math.round(ns.mil * 0.45);
        ns.stock.artillery += Math.round(ns.mil * 0.14);
        ns.stock.tanks += Math.round(ns.mil * 0.12);
        ns.stock.planes += Math.round(ns.mil * 0.13);
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

      // 2. 非玩家列强 HOI4 战略 AI 决策（严格遵守战区归属、宣战外交与跨海制海权门槛）
      if (state.dayCount % 3 === 1) {
        for (const a of state.armies) {
          if (a.nation === state.player || a.strength <= 0 || a.order !== 'defend' || a.org < 45) continue;
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
        if (a.order === 'defend') {
          a.entrench = Math.min(10, a.entrench + 0.45);
          a.org = Math.min(100, a.org + 3.5);
          if (a.strength < a.maxStrength && ns.stock.infantry > 20) {
            const heal = Math.min(a.maxStrength - a.strength, 3500);
            a.strength += heal;
            ns.stock.infantry -= 8;
          }
          continue;
        }
        if (!a.target) { a.order = 'defend'; continue; }
        const link = (adj.get(a.city) || []).find((l) => l.to === a.target);
        if (!link) { a.order = 'defend'; a.target = null; continue; }

        const targetHostile = isHostile(WW2, a.nation, state.owners[a.target], state);
        // 彻底根治友军互抢：若目标已归本国或同盟友军，自动转为和平进驻而不覆盖归属
        if (!targetHostile) {
          a.order = 'move';
          a.progress += link.kind === 'sea' ? 18 : 28;
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

        const atkPower = (a.strength / 1000 + a.tanks * 0.28 + a.artillery * 0.22) * (0.4 + 0.6 * a.org / 100) * airBonus * seaMult;
        const defTotal = defenders.reduce((s, d) => {
          const terrMult = tgtCity?.terrain === 'mountain' || tgtCity?.terrain === 'urban' || tgtCity?.terrain === 'fort' ? 1.32 : 1.08;
          const fortMult = 1 + fortLvl * 0.11 + d.entrench * 0.03;
          return s + (d.strength / 1000 + d.tanks * 0.25 + d.artillery * 0.24) * (0.4 + 0.6 * d.org / 100) * terrMult * fortMult;
        }, 1);

        // HOI4 装甲金盾阈值检查
        const atkArmorEdge = a.tanks > defenders.reduce((s, d) => s + d.tanks, 0) * 1.35 ? 1.28 : 1.0;
        const ratio = (atkPower * atkArmorEdge) / defTotal;
        const atkLoss = Math.round(Math.min(a.strength * 0.08, 1800 / Math.max(0.4, ratio)));
        const defLoss = Math.round(Math.min(defenders[0].strength * 0.09, 2100 * Math.min(2.2, ratio)));

        a.strength = Math.max(0, a.strength - atkLoss);
        a.org = Math.max(0, a.org - (7.5 / Math.max(0.5, ratio)));
        for (const d of defenders) {
          d.strength = Math.max(0, d.strength - Math.round(defLoss / defenders.length));
          d.org = Math.max(0, d.org - (8.5 * Math.min(2.0, ratio)));
        }

        state.battles.push({
          from: a.city, to: a.target, attacker: a.nation, defender: defenders[0].nation,
          ratio: Number(ratio.toFixed(2)), armorGold: atkArmorEdge > 1,
        });

        // 守军崩溃撤退
        const remaining = defenders.filter((d) => d.strength > 0 && d.org > 8);
        if (!remaining.length) {
          const retreatLinks = (adj.get(a.target) || []).filter((l) => !isHostile(WW2, defenders[0].nation, state.owners[l.to], state));
          for (const d of defenders) {
            if (d.strength > 0 && retreatLinks.length) {
              d.city = retreatLinks[0].to; d.org = 25; d.entrench = 0; d.order = 'defend'; d.target = null;
            } else {
              d.strength = 0; // 合围全歼！
            }
          }
          if (isHostile(WW2, a.nation, state.owners[a.target], state)) {
            const prevOwner = state.owners[a.target];
            state.owners[a.target] = a.nation;
            state.worldTension = Math.min(100, state.worldTension + 3);
            if (a.order !== 'support') a.city = a.target;
            a.order = 'defend'; a.target = null; a.progress = 0;
            state.log.push(`${formatDate(state.date)} · ⚔ 决战大捷！${ns.short}${a.name} 击溃守军并占领 ${tgtCity?.name || a.target}（原属 ${WW2.factions[prevOwner]?.short || prevOwner}）！`);
          }
        } else if (a.org < 14) {
          a.order = 'defend'; a.target = null; a.progress = 0;
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

  function drawBaseWorld(ctx, w, h, proj, mode, zoomScale) {
    // 深海渐变 + 海图经纬网
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#10212e');
    ocean.addColorStop(0.5, '#193548');
    ocean.addColorStop(1, '#0e1d29');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(175, 210, 232, 0.10)';
    ctx.lineWidth = 1;
    const step = zoomScale > 2 ? 10 : 30;
    for (let lon = -180; lon <= 180; lon += step) {
      const [x] = proj(lon, 0);
      if (x >= 0 && x <= w) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    }
    for (let lat = -60; lat <= 80; lat += (zoomScale > 2 ? 10 : 20)) {
      const [, y] = proj(0, lat);
      if (y >= 0 && y <= h) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    const drawPoly = (pts) => {
      ctx.beginPath();
      pts.forEach(([lon, lat], idx) => {
        const [x, y] = proj(lon, lat);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };

    // 浅海大陆架光晕
    ctx.save();
    for (const c of continents) {
      drawPoly(c.points);
      ctx.strokeStyle = 'rgba(92, 168, 206, 0.22)';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.restore();

    // 大陆高精度陆地
    for (const c of continents) {
      drawPoly(c.points);
      ctx.fillStyle = mode === 'terrain' ? '#708358' : '#354137';
      ctx.fill();
      ctx.strokeStyle = 'rgba(220, 206, 168, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // 地形山脉/沙漠/冻土/丛林晕渲
    if (mode === 'terrain' || mode === 'hybrid' || mode === 'ww2') {
      for (const tf of terrainFeatures) {
        const [cx, cy] = proj(tf.lon, tf.lat);
        const [x2] = proj(tf.lon + tf.rx, tf.lat);
        const [, y2] = proj(tf.lon, tf.lat - tf.ry);
        const rx = Math.max(8, Math.abs(x2 - cx)), ry = Math.max(6, Math.abs(y2 - cy));
        const g = ctx.createRadialGradient(cx, cy, rx * 0.1, cx, cy, Math.max(rx, ry));
        g.addColorStop(0, tf.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 全球主要大河
    ctx.strokeStyle = 'rgba(116, 184, 224, 0.62)';
    ctx.lineWidth = zoomScale > 1.8 ? 1.8 : 1.1;
    for (const r of rivers) {
      ctx.beginPath();
      r.pts.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
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

    drawBaseWorld(ctx, w, h, proj, opts.layer === 'terrain' ? 'terrain' : 'ww2', 360 / spanLon);

    const cityMap = new Map(WW2.cities.map((c) => [c.id, c]));

    // 1. 势力范围柔和控制圈（HOI4 战区着色）
    if (opts.layer !== 'terrain') {
      for (const c of WW2.cities) {
        const owner = state.owners[c.id];
        const fac = WW2.factions[owner];
        if (!fac) continue;
        const [x, y] = proj(c.lon, c.lat);
        if (x < -80 || x > w + 80 || y < -80 || y > h + 80) continue;
        const rad = Math.max(24, Math.min(72, (16 / spanLon) * w));
        const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
        g.addColorStop(0, fac.color + '88');
        g.addColorStop(0.65, fac.color + '44');
        g.addColorStop(1, fac.color + '00');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 2. 铁路与跨海战略航线
    for (const [aId, bId, kind] of WW2.routes) {
      const ca = cityMap.get(aId), cb = cityMap.get(bId);
      if (!ca || !cb) continue;
      // 跨太平洋日期变更线（珍珠港 <-> 中途岛/东京）跳过横贯整张地图的直线，改画短指向线
      if (Math.abs(ca.lon - cb.lon) > 180) continue;
      const [x1, y1] = proj(ca.lon, ca.lat);
      const [x2, y2] = proj(cb.lon, cb.lat);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      if (kind === 'sea') {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(128, 206, 255, 0.45)';
        ctx.lineWidth = 1.25;
      } else {
        ctx.strokeStyle = isHostile(WW2, state.owners[aId], state.owners[bId], state)
          ? 'rgba(255, 118, 92, 0.78)'
          : 'rgba(222, 206, 165, 0.42)';
        ctx.lineWidth = isHostile(WW2, state.owners[aId], state.owners[bId], state) ? 2.0 : 1.3;
      }
      ctx.stroke();
      ctx.restore();
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
      const label = c.name + (fort > 0 ? ` 🛡${fort}` : '') + (c.port ? ' ⚓' : '');
      ctx.font = (c.vp >= 20 ? 'bold 10.5px' : '9.5px') + ' "Microsoft YaHei", sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = isSelected ? 'rgba(84, 62, 18, 0.92)' : 'rgba(14, 20, 18, 0.78)';
      ctx.fillRect(x - tw / 2 - 4, y + 7, tw + 8, 14);
      ctx.fillStyle = isSelected ? '#ffeb96' : '#efe7d2';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 17.5);
      cityHits.push({ id: c.id, city: c, x: x - 16, y: y - 12, w: 32, h: 32 });
    }

    // 4. HOI4 进攻箭头 & 交战火花
    for (const a of state.armies) {
      if (a.strength <= 0 || !a.target) continue;
      const ca = cityMap.get(a.city), cb = cityMap.get(a.target);
      if (!ca || !cb || Math.abs(ca.lon - cb.lon) > 180) continue;
      const [x1, y1] = proj(ca.lon, ca.lat);
      const [x2, y2] = proj(cb.lon, cb.lat);
      ctx.save();
      ctx.strokeStyle = a.order === 'attack' ? '#ff5946' : a.order === 'support' ? '#ffb84d' : '#66d19e';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 11 * Math.cos(ang - 0.4), y2 - 11 * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - 11 * Math.cos(ang + 0.4), y2 - 11 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
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

    // 5. HOI4 集团军兵牌（带兵力、坦克数、组织度绿条、国旗色）
    const armyHits = [];
    const byCity = new Map();
    for (const a of state.armies) {
      if (a.strength <= 0) continue;
      if (!byCity.has(a.city)) byCity.set(a.city, []);
      byCity.get(a.city).push(a);
    }
    for (const [cid, list] of byCity.entries()) {
      const c = cityMap.get(cid);
      if (!c) continue;
      const [cx, cy] = proj(c.lon, c.lat);
      if (cx < -30 || cx > w + 30 || cy < -30 || cy > h + 30) continue;
      list.forEach((a, idx) => {
        const fac = WW2.factions[a.nation] || { color: '#555', border: '#ccc', flag: '★', short: a.nation };
        const bx = cx - 22 + idx * 14;
        const by = cy - 26 - idx * 12;
        const selected = opts.selectedArmy === a.id;
        ctx.fillStyle = fac.color;
        ctx.fillRect(bx, by, 46, 18);
        ctx.strokeStyle = selected ? '#ffe680' : fac.border;
        ctx.lineWidth = selected ? 2.4 : 1.2;
        ctx.strokeRect(bx, by, 46, 18);
        // 组织度绿条
        ctx.fillStyle = '#141916';
        ctx.fillRect(bx + 2, by + 13.5, 42, 3);
        ctx.fillStyle = a.org > 45 ? '#66e088' : '#f07154';
        ctx.fillRect(bx + 2, by + 13.5, 42 * Math.max(0, Math.min(1, a.org / 100)), 3);
        // 兵力千人标签
        ctx.fillStyle = '#fff9e6';
        ctx.font = 'bold 9.5px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${fac.flag}${Math.round(a.strength / 1000)}K`, bx + 23, by + 10.5);
        armyHits.push({ id: a.id, army: a, x: bx, y: by, w: 46, h: 18 });
      });
    }

    // 标题水印
    ctx.fillStyle = 'rgba(246, 228, 178, 0.96)';
    ctx.font = 'bold 13.5px "Songti SC", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.scenarioTitle} · ${formatDate(state.date)} · 全球紧张度 ${state.worldTension}% · 视角：${th.name}`, 14, 22);
    ctx.fillStyle = 'rgba(216, 224, 214, 0.82)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('左键选中我方集团军兵牌 → 再点击相邻城市立即下达【进攻/调动】；支持滚轮缩放与按战区一键聚焦', 14, 39);

    return { cityHits, armyHits };
  }

  const WW2Sim = {
    ww2Blocs,
    ww2FocusTrees,
    createWW2Game,
    issueWW2Order,
    startWW2Focus,
    recruitWW2Division,
    lendLeaseWW2,
    stepWW2Day,
    isHostile,
    formatDate,
    renderWW2Canvas,
  };

  const api = { blocs, ww2Blocs, continents, rivers, nations, terrainFeatures, renderWorldCanvas, WW2Sim };
  globalThis.CivilWarWorld = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
