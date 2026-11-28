(() => {
  'use strict';

  // 《抗美援朝 · 朝鲜战争（1950–1953）》完整参战国编制、武器、人员、飞机、航母、坦克、火炮数据
  const factions = {
    pva: {
      id: 'pva', side: 'dprk_coalition', name: '中国人民志愿军 (PVA)', short: '志愿军',
      flag: '★', color: '#b52822', commander: '彭德怀 · 邓华 · 洪学智',
      totalPeakPersonnel: 1350000, initialEntryPersonnel: 260000,
      doctrine: '近战夜战 · 穿插分割 · 坑道防御',
      summary: '1950 年 10 月 19 日跨过鸭绿江入朝作战，以轻步兵穿插包围与顽强坑道工事对抗机械化联军，随后换装苏械并建立“米格走廊”。',
      corps: [
        { id: 'pva-38', name: '志愿军第38军（万岁军）', commander: '梁兴初', strength: 45000, divisions: ['第112师', '第113师', '第114师'], city: 'chongchon', role: '穿插主力' },
        { id: 'pva-39', name: '志愿军第39军', commander: '吴信泉', strength: 44000, divisions: ['第115师', '第116师', '第117师'], city: 'unsan', role: '云山首捷主力' },
        { id: 'pva-40', name: '志愿军第40军', commander: '温玉成', strength: 43000, divisions: ['第118师', '第119师', '第120师'], city: 'onsong', role: '两水洞首战主力' },
        { id: 'pva-42', name: '志愿军第42军', commander: '吴瑞林', strength: 40000, divisions: ['第124师', '第125师', '第126师'], city: 'huangcaoling', role: '东线阻击主力' },
        { id: 'pva-20', name: '志愿军第9兵团·第20军', commander: '张翼翔', strength: 52000, divisions: ['第58师', '第59师', '第60师', '第89师'], city: 'chosin', role: '长津湖围歼' },
        { id: 'pva-27', name: '志愿军第9兵团·第27军', commander: '彭德清', strength: 50000, divisions: ['第79师', '第80师', '第81师', '第94师'], city: 'chosin', role: '新兴里全歼北极熊团' },
        { id: 'pva-15', name: '志愿军第15军（上甘岭）', commander: '秦基伟', strength: 42000, divisions: ['第29师', '第44师', '第45师'], city: 'shangganling', role: '上甘岭坑道坚守' },
        { id: 'pva-art', name: '志愿军炮兵第1/2/8师与喀秋莎团', commander: '万毅', strength: 28000, divisions: ['炮1师', '炮2师', '炮8师', '火箭炮第21师'], city: 'sinyiju', role: '重炮与火箭炮支援' },
      ],
      arsenal: {
        infantryWeapons: ['波波莎 PPSh-41 / 50式冲锋枪', '莫辛纳甘 M1944 卡宾枪', 'DP-28 转盘轻机枪', '美式 M1/汤姆逊（前期缴获）', '57mm/75mm 无后坐力炮', '反坦克手雷与爆破筒'],
        artillery: [
          { name: 'BM-13 喀秋莎 132mm 火箭炮', qty: 180, caliber: '132mm', role: '面压制齐射' },
          { name: 'M-30 122mm 榴弹炮', qty: 420, caliber: '122mm', role: '主力压制火炮' },
          { name: 'ZiS-3 76mm 加农/反坦克炮', qty: 680, caliber: '76mm', role: '直瞄反坦克与步兵伴随' },
          { name: '82mm / 120mm 迫击炮', qty: 2400, caliber: '82–120mm', role: '山地曲射支援' },
        ],
        tanks: [
          { name: 'T-34/85 中型坦克', qty: 240, armor: '45–90mm', gun: '85mm', role: '志愿军坦克第1/2/3师主力' },
          { name: 'IS-2 重型坦克', qty: 40, armor: '120mm', gun: '122mm', role: '重装甲突击与固定火力点' },
          { name: 'SU-76M 自行火炮', qty: 60, armor: '35mm', gun: '76mm', role: '步兵伴随反装甲' },
        ],
        aircraft: [
          { name: '米格-15 (MiG-15) 喷气歼击机', qty: 480, speed: '1059 km/h', role: '米格走廊制空主力（37mm+23mm 机炮）', modelKind: 'jet' },
          { name: '拉-11 (La-11) 活塞歼击机', qty: 90, speed: '674 km/h', role: '夜间护航与对海巡逻', modelKind: 'plane' },
          { name: '图-2 (Tu-2) 战术轰炸机', qty: 60, speed: '550 km/h', role: '大和岛登岛轰炸支援', modelKind: 'plane' },
        ],
        navy: [
          { name: '鱼雷快艇与岸防炮艇（黄海沿岸）', qty: 12, class: '近岸防御', role: '掩护辽东与鸭绿江口海防', modelKind: 'ship' },
        ],
      },
    },
    kpa: {
      id: 'kpa', side: 'dprk_coalition', name: '朝鲜人民军 (KPA)', short: '人民军',
      flag: '★', color: '#c73a32', commander: '金日成 · 崔庸健 · 金策',
      totalPeakPersonnel: 450000, initialEntryPersonnel: 135000,
      doctrine: '苏式装甲突击 · 山地游击',
      summary: '1950 年 6 月以 T-34/85 装甲旅为先导迅速南下洛东江，仁川登陆后经休整与志愿军并肩守卫三八线东段。',
      corps: [
        { id: 'kpa-1', name: '人民军第1军团', commander: '金雄', strength: 48000, divisions: ['第1师', '第3师', '第4师', '第6师'], city: 'pyongyang', role: '西线主力' },
        { id: 'kpa-2', name: '人民军第2军团', commander: '武亭', strength: 42000, divisions: ['第2师', '第5师', '第7师'], city: 'wonsan', role: '东线山地主力' },
        { id: 'kpa-105', name: '第105近卫坦克师', commander: '柳京洙', strength: 12000, divisions: ['第107坦克团', '第109坦克团', '第203坦克团'], city: 'kaesong', role: 'T-34/85 装甲矛头' },
      ],
      arsenal: {
        infantryWeapons: ['莫辛纳甘 91/30 步枪', 'PPSh-41 波波莎冲锋枪', 'PTRD-41 14.5mm 反坦克枪', 'SG-43 重机枪'],
        artillery: [
          { name: 'M-30 122mm 榴弹炮', qty: 180, caliber: '122mm', role: '军团压制火炮' },
          { name: 'ZiS-3 76mm 加农炮', qty: 320, caliber: '76mm', role: '反坦克与直瞄' },
        ],
        tanks: [
          { name: 'T-34/85 中型坦克', qty: 150, armor: '45–90mm', gun: '85mm', role: '南下闪击主力' },
          { name: 'SU-76M 自行火炮', qty: 70, armor: '35mm', gun: '76mm', role: '伴随火力' },
        ],
        aircraft: [
          { name: '伊尔-10 强击机 / 雅克-9', qty: 110, speed: '550 km/h', role: '开战初期近距对地支援', modelKind: 'plane' },
        ],
        navy: [
          { name: 'G-5 鱼雷艇与布雷舰', qty: 18, class: '近岸布雷', role: '元山港水雷封锁（曾滞缓美军登陆）', modelKind: 'ship' },
        ],
      },
    },
    usa: {
      id: 'usa', side: 'un_coalition', name: '美军 / 联合国军主力 (US / UN)', short: '美军',
      flag: '★', color: '#275996', commander: '麦克阿瑟 · 李奇微 · 范佛里特',
      totalPeakPersonnel: 327000, initialEntryPersonnel: 180000,
      doctrine: '海空绝对优势 · 机械化重炮“磁性战术”',
      summary: '掌握绝对制海权与中低空制空权，依托航母特混舰队实施仁川两栖登陆，并以压倒性重炮弹药量与坦克集群作战。',
      corps: [
        { id: 'us-8a-1cav', name: '美第8集团军·第1骑兵师', commander: '盖伊', strength: 18500, divisions: ['第5骑兵团', '第7骑兵团', '第8骑兵团'], city: 'seoul', role: '机械化快速主力' },
        { id: 'us-8a-2id', name: '美第8集团军·第2步兵师', commander: '凯泽', strength: 19000, divisions: ['第9团', '第23团', '第38团'], city: 'pyongyang', role: '重火力王牌师' },
        { id: 'us-8a-24id', name: '美第8集团军·第24/25步兵师', commander: '迪安 / 킨', strength: 34000, divisions: ['第24师', '第25师'], city: 'taegu', role: '洛东江防线主力' },
        { id: 'us-10c-1mar', name: '美第10军·海军陆战第1师', commander: '奥利弗·史密斯', strength: 25000, divisions: ['陆战1团', '陆战5团', '陆战7团', '陆战11炮团'], city: 'incheon', role: '仁川登陆与长津湖主力' },
        { id: 'us-10c-7id', name: '美第10军·第7步兵师', commander: '巴尔', strength: 19500, divisions: ['第17团', '第31团（北极熊）', '第32团'], city: 'hungnam', role: '东线登陆主力' },
      ],
      arsenal: {
        infantryWeapons: ['M1 加兰德半自动步枪', 'M2 卡宾枪', 'M1918A2 BAR 自动步枪', 'M1919/M2 勃朗宁机枪', 'M20 89mm 超级巴祖卡火箭筒'],
        artillery: [
          { name: 'M2A1 105mm 榴弹炮', qty: 650, caliber: '105mm', role: '师属主力支援火炮' },
          { name: 'M1 155mm 榴弹炮 / “长脚汤姆”加农炮', qty: 310, caliber: '155mm', role: '军属远程重炮（范佛里特弹药量）' },
          { name: 'M115 203mm (8英寸) 重型榴弹炮', qty: 64, caliber: '203mm', role: '攻坚摧毁坑道重炮' },
          { name: 'M40 155mm 自行火炮 / M19 双40mm 防空车', qty: 140, caliber: '155mm/40mm', role: '机动重炮与直瞄扫射' },
        ],
        tanks: [
          { name: 'M26 潘兴重型坦克', qty: 300, armor: '102mm', gun: '90mm', role: '压制 T-34/85 的主力重坦' },
          { name: 'M46 巴顿中型坦克', qty: 200, armor: '102mm', gun: '90mm', role: '高机动改进型主力坦克' },
          { name: 'M4A3E8 谢尔曼“易8”坦克', qty: 650, armor: '63mm', gun: '76mm', role: '山地适应性最佳主力坦克' },
          { name: 'M24 霞飞轻型侦察坦克', qty: 130, armor: '38mm', gun: '75mm', role: '前锋侦察' },
        ],
        aircraft: [
          { name: 'F-86 佩刀 (Sabre) 喷气战斗机', qty: 380, speed: '1106 km/h', role: '高空对抗米格-15 制空主力', modelKind: 'jet' },
          { name: 'F-80 流星 / F-84 雷电喷气战斗轰炸机', qty: 420, speed: '960 km/h', role: '铁路绞杀战与近距支援', modelKind: 'jet' },
          { name: 'F4U 海盗 / AD-4 天袭者舰载攻击机', qty: 360, speed: '718 km/h', role: '航母起飞低空近距支援（凝固汽油弹）', modelKind: 'plane' },
          { name: 'B-29 超级空中堡垒战略轰炸机', qty: 120, speed: '575 km/h', role: '后方交通枢纽与城市战略轰炸', modelKind: 'plane' },
        ],
        navy: [
          { name: '埃塞克斯级航空母舰（福吉谷/莱特/菲律宾海/拳师号等）', qty: 6, class: '重型航空母舰 (CV)', role: 'TF77 特混舰队核心，每舰载机 80–90 架', modelKind: 'carrier' },
          { name: '衣阿华级战列舰（密苏里号 / 新泽西号）', qty: 2, class: '战列舰 (BB)', role: '406mm 巨炮沿岸火力支援', modelKind: 'ship' },
          { name: '克利夫兰级 / 巴尔的摩级巡洋舰', qty: 8, class: '巡洋舰 (CA/CL)', role: '仁川与兴南舰炮封锁', modelKind: 'ship' },
          { name: '弗莱彻级 / 萨姆纳级驱逐舰与两栖登陆舰', qty: 48, class: '驱逐舰/登陆舰', role: '护航、反潜与仁川两栖投送', modelKind: 'ship' },
        ],
      },
    },
    rok: {
      id: 'rok', side: 'un_coalition', name: '韩国国军 (ROK)', short: '韩军',
      flag: '☯', color: '#3b73a8', commander: '白善烨 · 丁一权',
      totalPeakPersonnel: 590000, initialEntryPersonnel: 98000,
      doctrine: '美械换装 · 守备纵深',
      summary: '开战初期缺乏重武器，在美军整编与装备补充下扩编至 16 个步兵师，承担战线大半防御任务。',
      corps: [
        { id: 'rok-1', name: '韩军第1/首都师（白虎团）', commander: '白善烨', strength: 32000, divisions: ['第1师', '首都师'], city: 'seoul', role: '韩军精锐主力' },
        { id: 'rok-2', name: '韩军第2/6/7/8师', commander: '刘载兴', strength: 58000, divisions: ['第2师', '第6师', '第7师', '第8师'], city: 'taejon', role: '中东线主力' },
      ],
      arsenal: {
        infantryWeapons: ['M1 加兰德步枪', 'M1 卡宾枪', 'M1919 机枪', '57mm/75mm 无后坐力炮'],
        artillery: [{ name: 'M3/M2A1 105mm 榴弹炮', qty: 260, caliber: '105mm', role: '师属炮兵' }],
        tanks: [{ name: 'M36 坦克歼击车 / M24 轻坦', qty: 45, armor: '38mm', gun: '90mm/75mm', role: '后期美援装甲' }],
        aircraft: [{ name: 'F-51D 野马战斗机', qty: 40, speed: '703 km/h', role: '低空对地支援', modelKind: 'plane' }],
        navy: [{ name: 'PC-701 白头山号猎潜舰等护卫艇', qty: 10, class: '近岸巡逻', role: '沿海巡逻', modelKind: 'ship' }],
      },
    },
    commonwealth: {
      id: 'commonwealth', side: 'un_coalition', name: '英联邦与联合国军旅 (UK / TR / CA / AU)', short: '英联邦等',
      flag: '✦', color: '#7a4560', commander: '卡塞尔斯 · 亚兹奇',
      totalPeakPersonnel: 45000, initialEntryPersonnel: 18000,
      doctrine: '重装甲支撑 · 坚韧守备',
      summary: '含英联邦第 1 师（27/28/29 旅）、土耳其旅、加拿大/澳新/法/泰/菲等 15 国部队，装备“百夫长”重型坦克与英军轻型航母。',
      corps: [
        { id: 'uk-29', name: '英联邦第27/28/29旅（雪马里）', commander: '布罗迪', strength: 16000, divisions: ['皇家奥斯特来复枪团', '格洛斯特营', '澳加营'], city: 'pusan', role: '百夫长坦克与守备' },
        { id: 'tr-1', name: '土耳其旅', commander: '塔赫辛·亚兹奇', strength: 5500, divisions: ['土耳其第1步兵旅'], city: 'taegu', role: '清川江阻击' },
      ],
      arsenal: {
        infantryWeapons: ['李-恩菲尔德 No.4 步枪', '布伦轻机枪', '司登冲锋枪'],
        artillery: [{ name: 'QF 25磅 野战榴弹炮', qty: 72, caliber: '87.6mm', role: '英军王牌野战炮' }],
        tanks: [{ name: '百夫长 Mk.3 (Centurion) 主战坦克', qty: 55, armor: '152mm', gun: '84mm 20磅炮', role: '朝鲜战场防护与爬坡能力顶尖坦克' }],
        aircraft: [{ name: '海怒 (Sea Fury) / 萤火虫舰载机', qty: 65, speed: '740 km/h', role: '英航母舰载对地与空战', modelKind: 'plane' }],
        navy: [{ name: '巨像级轻型航母（凯旋号 / 忒修斯号 / 荣耀号）', qty: 2, class: '轻型航空母舰 (CVL)', role: '西海岸制海与近距航空支援', modelKind: 'carrier' }],
      },
    },
  };

  // 朝鲜半岛 5 大历史剧本
  const scenarios = [
    { id: 'kw-1950-06', title: '朝鲜战争爆发（三八线南下）', date: '1950-06-25', focus: 'seoul', summary: '人民军第105坦克师突破三八线直取汉城，联合国军紧急固守洛东江釜山环形防线。' },
    { id: 'kw-1950-09', title: '仁川登陆（铬铁行动）', date: '1950-09-15', focus: 'incheon', summary: '美海军第7舰队航母特混编队掩护陆战第1师突袭仁川港，腰斩人民军后方补给线。' },
    { id: 'kw-1950-10', title: '抗美援朝第一次战役（云山/清川江）', date: '1950-10-25', focus: 'unsan', summary: '中国人民志愿军秘密跨过鸭绿江，第39军在云山重创美骑1师，打响抗美援朝第一枪。' },
    { id: 'kw-1950-11', title: '长津湖战役（东线合围）', date: '1950-11-27', focus: 'chosin', summary: '志愿军第9兵团在零下 30 度严寒中合围美陆战第1师与步7师，全歼“北极熊团”，收复三八线以北。' },
    { id: 'kw-1952-10', title: '上甘岭战役（坑道决战）', date: '1952-10-14', focus: 'shangganling', summary: '美韩军倾泻 190 万发炮弹实施“摊牌行动”，志愿军第15军依托坑道工事浴血坚守 43 天。' },
  ];

  // 朝鲜半岛 18 座核心节点（用于后续独立地图推演或快速预览）
  const cities = [
    { id: 'dandong', name: '安东（丹东）', lon: 124.38, lat: 40.12, side: 'dprk', terrain: 'rail', value: 6 },
    { id: 'sinyiju', name: '新义州', lon: 124.40, lat: 40.10, side: 'dprk', terrain: 'rail', value: 5 },
    { id: 'unsan', name: '云山', lon: 125.78, lat: 39.96, side: 'dprk', terrain: 'mountain', value: 4 },
    { id: 'chongchon', name: '清川江（安州）', lon: 125.66, lat: 39.62, side: 'dprk', terrain: 'river', value: 5 },
    { id: 'chosin', name: '长津湖（柳潭里）', lon: 127.20, lat: 40.48, side: 'dprk', terrain: 'mountain', value: 5 },
    { id: 'hungnam', name: '兴南港', lon: 127.62, lat: 39.83, side: 'dprk', terrain: 'port', value: 5 },
    { id: 'pyongyang', name: '平壤', lon: 125.76, lat: 39.03, side: 'dprk', terrain: 'urban', value: 8 },
    { id: 'wonsan', name: '元山港', lon: 127.44, lat: 39.15, side: 'dprk', terrain: 'port', value: 6 },
    { id: 'shangganling', name: '上甘岭（五圣山）', lon: 127.47, lat: 38.33, side: 'dprk', terrain: 'mountain', value: 6 },
    { id: 'cheorwon', name: '铁原（铁三角）', lon: 127.21, lat: 38.15, side: 'dprk', terrain: 'hill', value: 5 },
    { id: 'kaesong', name: '开城（板门店）', lon: 126.55, lat: 37.97, side: 'dprk', terrain: 'plain', value: 5 },
    { id: 'seoul', name: '汉城（首尔）', lon: 126.98, lat: 37.56, side: 'un', terrain: 'urban', value: 9 },
    { id: 'incheon', name: '仁川港', lon: 126.70, lat: 37.45, side: 'un', terrain: 'port', value: 7 },
    { id: 'suwon', name: '水原', lon: 127.01, lat: 37.26, side: 'un', terrain: 'plain', value: 4 },
    { id: 'chuncheon', name: '春川', lon: 127.73, lat: 37.88, side: 'un', terrain: 'mountain', value: 4 },
    { id: 'taejon', name: '大田', lon: 127.38, lat: 36.35, side: 'un', terrain: 'rail', value: 6 },
    { id: 'taegu', name: '大邱（洛东江）', lon: 128.60, lat: 35.87, side: 'un', terrain: 'river', value: 6 },
    { id: 'pusan', name: '釜山港', lon: 129.07, lat: 35.18, side: 'un', terrain: 'port', value: 8 },
  ];

  const api = { factions, scenarios, cities };
  globalThis.KoreanWarData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
