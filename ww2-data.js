(() => {
  'use strict';

  // 《战图 · 第二次世界大战（1939–1945）》完整 HOI4 级列强数据库
  // 重点精细覆盖：美国(USA)、苏联(USSR)、英国(UK)、法国(FRA)、日本(JPN) + 德国(GER)、意大利(ITA)、中国(CHI)
  const factions = {
    usa: {
      id: 'usa', bloc: 'allies', name: '美利坚合众国 (USA)', short: '美国', flag: '★',
      color: '#2d63a6', border: '#8ec2ff', leader: '富兰克林·罗斯福',
      commanders: ['艾森豪威尔', '巴顿', '布莱德雷', '麦克阿瑟', '尼米兹', '哈尔西', '斯帕茨'],
      doctrine: '优势火力 · 航母特混舰队 · 战略轰炸',
      spirits: ['民主兵工厂（军工产出 +45%）', '大西洋与太平洋双洋海军', '租借法案总库（支援盟国）'],
      industry: { civ: 135, mil: 95, dock: 68, oil: 180, steel: 165, manpowerK: 16112 },
      peakPersonnel: 16112000, active1941: 1801000,
      summary: '拥有全球最庞大工业产能与双洋航母舰队，通过“租借法案”武装英苏中，以跳岛战术与诺曼底两栖登陆主宰欧亚两大战场。',
      corps: [
        { id: 'usa-1a', name: '美第1集团军（欧陆先锋）', commander: '布莱德雷', strength: 210000, tanks: 950, artillery: 720, city: 'london', theater: 'europe', role: '诺曼底登陆主力' },
        { id: 'usa-3a', name: '美第3集团军（装甲矛头）', commander: '巴顿', strength: 185000, tanks: 1450, artillery: 640, city: 'casablanca', theater: 'africa', role: '火炬登陆与西欧穿插' },
        { id: 'usa-pac', name: '美太平洋陆战军（第1/2/3陆战师）', commander: '范德格里夫特', strength: 165000, tanks: 480, artillery: 520, city: 'pearl_harbor', theater: 'pacific', role: '两栖跳岛攻坚' },
        { id: 'usa-swp', name: '西南太平洋战区部队', commander: '麦克阿瑟', strength: 175000, tanks: 420, artillery: 540, city: 'sydney', theater: 'pacific', role: '瓜岛、菲律宾与新几内亚战线' },
        { id: 'usa-home', name: '北美本土机械化预备军', commander: '马歇尔', strength: 260000, tanks: 1100, artillery: 800, city: 'new_york', theater: 'america', role: '战略总预备队' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: 'M1 加兰德 7.62mm 半自动步枪', qty: 5460000, soft: 14, hard: 2, role: '班组标准半自动主力步枪（全军压倒性射速）' },
          { name: 'M1 卡宾枪 / 汤姆逊 M1A1 冲锋枪', qty: 7800000, soft: 16, hard: 1, role: '近战突击、空降兵与车组自卫' },
          { name: 'M1918A2 BAR / M1919 & M2 .50 重机枪', qty: 1950000, soft: 22, hard: 6, role: '班排压制与防空/反轻甲火力' },
          { name: 'M1 / M9 60mm 巴祖卡火箭筒', qty: 476000, soft: 8, hard: 24, role: '步兵便携破甲反坦克武器' },
        ],
        artillery: [
          { name: 'M2A1 105mm 榴弹炮', qty: 8536, caliber: '105mm', soft: 32, hard: 8, role: '美军师属主力火炮（配 VT 近炸引信）' },
          { name: 'M1 155mm “长脚汤姆”加农炮 / 榴弹炮', qty: 3850, caliber: '155mm', soft: 48, hard: 14, role: '军属远程重炮压制与反炮兵' },
          { name: 'M7 “牧师” 105mm 自行榴弹炮', qty: 3490, caliber: '105mm', soft: 36, hard: 10, role: '伴随装甲师高速机动压制' },
          { name: 'M1 90mm 高射/反坦克炮 & M115 203mm 重榴弹炮', qty: 6200, caliber: '90–203mm', soft: 44, hard: 26, role: '要塞攻坚与高空防空' },
        ],
        tanks: [
          { name: 'M4 谢尔曼 (Sherman) 中型坦克（75/76mm）', qty: 49234, armor: '63–76mm', gun: '75mm / 76mm', soft: 26, hard: 24, modelKind: 'sherman', role: '盟军机械化基石，可靠性与产能无敌' },
          { name: 'M26 潘兴 (Pershing) 重型坦克', qty: 1436, armor: '102mm', gun: '90mm M3', soft: 30, hard: 42, modelKind: 'm26', role: '后期正面抗衡虎式/豹式重坦' },
          { name: 'M10 狼獾 / M18 地狱猫 / M36 杰克逊坦歼', qty: 10900, armor: '25–50mm', gun: '76mm / 90mm', soft: 18, hard: 38, modelKind: 'sherman', role: '高速机动反装甲猎手' },
          { name: 'M3 / M5 斯图亚特 & M24 霞飞轻型坦克', qty: 27400, armor: '38mm', gun: '37mm / 75mm', soft: 16, hard: 12, modelKind: 'sherman', role: '装甲侦察与太平洋丛林支援' },
        ],
        aircraft: [
          { name: 'P-51D 野马 (Mustang) 远程护航战斗机', qty: 15586, speed: '703 km/h', airAtk: 42, groundAtk: 14, modelKind: 'spitfire', role: '全程护航轰炸机深入柏林与东京' },
          { name: 'P-47 雷电 / P-38 闪电战斗轰炸机', qty: 25600, speed: '697 km/h', airAtk: 34, groundAtk: 32, modelKind: 'plane', role: '欧陆对地绞杀装甲纵队主力' },
          { name: 'F6F 地狱猫 / F4U 海盗舰载战斗机', qty: 24800, speed: '718 km/h', airAtk: 40, groundAtk: 18, modelKind: 'plane', role: '太平洋航母制空绝对霸主' },
          { name: 'B-17 空中堡垒 / B-24 解放者 / B-29 超级空中堡垒', qty: 34900, speed: '575 km/h', airAtk: 18, groundAtk: 56, modelKind: 'b29', role: '昼间精准战略轰炸与核威慑' },
        ],
        navy: [
          { name: '埃塞克斯级重型航空母舰 (CV) + 约克城级企业号', qty: 27, class: '重型航母 (CV)', navalAtk: 68, modelKind: 'carrier', role: '太平洋快速航母特混舰队核心（每舰90+机）' },
          { name: '独立级 / 卡萨布兰卡级轻型与护航航母', qty: 110, class: '轻/护航航母 (CVL/CVE)', navalAtk: 36, modelKind: 'carrier', role: '大西洋反潜护航与登陆掩护' },
          { name: '衣阿华级 / 南达科他级 / 北卡罗来纳级战列舰', qty: 23, class: '战列舰 (BB)', navalAtk: 62, modelKind: 'battleship', role: '406mm 巨炮舰队决战与抢滩岸轰' },
          { name: '巴尔的摩/克利夫兰级巡洋舰 & 弗莱彻级驱逐舰 & 潜艇', qty: 680, class: '巡洋/驱逐/潜艇', navalAtk: 30, modelKind: 'ship', role: '防空护航与彻底绞杀日本海运线' },
        ],
      },
    },

    ussr: {
      id: 'ussr', bloc: 'comintern', name: '苏维埃社会主义共和国联盟 (USSR)', short: '苏联', flag: '☭',
      color: '#a62621', border: '#f0786c', leader: '约瑟夫·斯大林',
      commanders: ['朱可夫', '罗科索夫斯基', '科涅夫', '华西列夫斯基', '崔可夫', '瓦图京', '马利诺夫斯基'],
      doctrine: '大纵深战役学说 · 钢铁洪流 · 人海突击',
      spirits: ['卫国战争总动员（人力与恢复 +35%）', '乌拉尔后方工业大转移', '喀秋莎与重炮压制体系'],
      industry: { civ: 88, mil: 110, dock: 18, oil: 115, steel: 145, manpowerK: 34476 },
      peakPersonnel: 34476000, active1941: 5373000,
      summary: '承受并粉碎德军八成以上陆军主力的红色巨人，依托乌拉尔军工基地量产 T-34 坦克与喀秋莎火箭炮，从莫斯科、斯大林格勒一路反攻插旗柏林帝国大厦。',
      corps: [
        { id: 'ussr-west', name: '白俄罗斯第1方面军（近卫坦克集群）', commander: '朱可夫', strength: 420000, tanks: 2400, artillery: 1850, city: 'moscow', theater: 'east', role: '莫斯科保卫与直取柏林' },
        { id: 'ussr-ukr', name: '乌克兰第1方面军', commander: '科涅夫', strength: 380000, tanks: 1950, artillery: 1620, city: 'kiev', theater: 'east', role: '库尔斯克与乌克兰大反攻' },
        { id: 'ussr-stal', name: '斯大林格勒/顿河方面军（第62集团军）', commander: '罗科索夫斯基', strength: 340000, tanks: 1350, artillery: 1500, city: 'stalingrad', theater: 'east', role: '伏尔加河死守与天王星合围' },
        { id: 'ussr-len', name: '列宁格勒方面军', commander: '戈沃罗夫', strength: 220000, tanks: 620, artillery: 980, city: 'leningrad', theater: 'east', role: '波罗的海与芬兰湾坚守' },
        { id: 'ussr-fe', name: '远东红旗方面军（八月风暴）', commander: '华西列夫斯基', strength: 290000, tanks: 1600, artillery: 1200, city: 'vladivostok', theater: 'china', role: '防备关东军与横扫东北' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: '莫辛纳甘 M1891/30 & M1944 步枪', qty: 17400000, soft: 12, hard: 2, role: '极寒可靠、刺刀拼杀的标准红军步枪' },
          { name: 'PPSh-41 波波莎 / PPS-43 冲锋枪', qty: 6150000, soft: 20, hard: 1, role: '71发弹鼓巷战神器，斯大林格勒近战之王' },
          { name: 'DP-28 捷格加廖夫轻机枪 / 马克沁 M1910 重机枪', qty: 920000, soft: 21, hard: 3, role: '步兵连排核心压制火力' },
          { name: 'PTRD-41 / PTRS-41 14.5mm 反坦克步枪', qty: 470000, soft: 5, hard: 18, role: '近距离击穿德军轻中坦侧甲' },
        ],
        artillery: [
          { name: 'BM-13 / BM-31 “喀秋莎” 132mm/300mm 火箭炮', qty: 10200, caliber: '132–300mm', soft: 58, hard: 16, modelKind: 'katyusha', role: '战役突破前毁灭性齐射压制' },
          { name: 'ZiS-3 76mm 师属加农/反坦克炮', qty: 103000, caliber: '76mm', soft: 28, hard: 24, role: '二战产量最大全能野战炮' },
          { name: 'M-30 122mm 榴弹炮 / ML-20 152mm 加榴炮', qty: 26100, caliber: '122–152mm', soft: 50, hard: 18, role: '红军“战争之神”大纵深炮火准备主力' },
          { name: 'B-4 203mm 履带式重型榴弹炮（斯大林之锤）', qty: 1011, caliber: '203mm', soft: 64, hard: 28, role: '直瞄轰塌城市堡垒与柏林巷战攻坚' },
        ],
        tanks: [
          { name: 'T-34/76 & T-34/85 中型坦克', qty: 57300, armor: '45–90mm', gun: '76mm / 85mm', soft: 30, hard: 34, modelKind: 't34', role: '二战最具决定性的倾斜装甲中型坦克' },
          { name: 'KV-1 / IS-2 斯大林重型坦克', qty: 8650, armor: '90–120mm', gun: '76mm / 122mm', soft: 38, hard: 48, modelKind: 't34', role: '122mm 重炮正面击碎虎豹与要塞' },
          { name: 'SU-85 / SU-100 / ISU-152 “猎兽者”突击炮', qty: 14200, armor: '75–90mm', gun: '85–152mm', soft: 46, hard: 46, modelKind: 't34', role: '伴随坦克集群强攻重装甲与碉堡' },
        ],
        aircraft: [
          { name: '伊尔-2 “黑死神” (Il-2) 装甲强击机', qty: 36183, speed: '414 km/h', airAtk: 14, groundAtk: 46, modelKind: 'plane', role: '人类历史产量第一对地舔地装甲杀手' },
          { name: '雅克-3 / 雅克-9 / 拉-5FN / 拉-7 歼击机', qty: 44500, speed: '680 km/h', airAtk: 38, groundAtk: 12, modelKind: 'spitfire', role: '中低空机动格斗夺取东线制空权' },
          { name: '佩-2 (Pe-2) 俯冲轰炸机 / 伊尔-4 远程轰炸机', qty: 16700, speed: '540 km/h', airAtk: 12, groundAtk: 34, modelKind: 'b29', role: '前线交通枢纽与战术轰炸' },
        ],
        navy: [
          { name: '甘古特级战列舰（马拉号/十月革命号）', qty: 3, class: '战列舰 (BB)', navalAtk: 44, modelKind: 'battleship', role: '列宁格勒与黑海舰炮浮动炮台' },
          { name: '基洛夫级重巡洋舰 & 7型驱逐舰 & S级/Shch级潜艇', qty: 245, class: '巡洋/驱逐/潜艇', navalAtk: 24, modelKind: 'ship', role: '波罗的海、黑海与北极护航破交' },
        ],
      },
    },

    uk: {
      id: 'uk', bloc: 'allies', name: '大英帝国与英联邦 (UK)', short: '英国', flag: '✦',
      color: '#9c4b5c', border: '#eda2b2', leader: '温斯顿·丘吉尔',
      commanders: ['蒙哥马利', '亚历山大', '斯利姆', '道丁', '坎宁安', '蒙巴顿'],
      doctrine: '皇家海军制海 · 雷达防空网 · 决战计划',
      spirits: ['绝不投降（本土防御 +25%）', '道丁雷达与恩尼格玛破译', '英联邦全球帝国动员'],
      industry: { civ: 76, mil: 68, dock: 52, oil: 72, steel: 98, manpowerK: 5896 },
      peakPersonnel: 5896000, active1939: 1128000,
      summary: '在欧陆沦陷后独撑大局赢得不列颠空战，依托皇家海军封锁大西洋、在阿拉曼击溃隆美尔，并协同美军从西线与缅甸双线反攻。',
      corps: [
        { id: 'uk-21ag', name: '英第21集团军群（第2集团军）', commander: '蒙哥马利', strength: 240000, tanks: 1200, artillery: 820, city: 'london', theater: 'europe', role: '本土防卫与诺曼底剑/金滩主力' },
        { id: 'uk-8a', name: '英第8集团军（沙漠之鼠）', commander: '奥金莱克 / 蒙哥马利', strength: 215000, tanks: 1120, artillery: 780, city: 'el_alamein', theater: 'africa', role: '北非阿拉曼决战与登陆意大利' },
        { id: 'uk-14a', name: '英印第14集团军（被遗忘的军队）', commander: '斯利姆', strength: 260000, tanks: 450, artillery: 620, city: 'delhi', theater: 'pacific', role: '英帕尔与缅甸丛林反攻日军' },
        { id: 'uk-mal', name: '远东英联邦守备军（马来/澳新军团）', commander: '珀西瓦尔', strength: 130000, tanks: 140, artillery: 320, city: 'singapore', theater: 'pacific', role: '新加坡要塞与太平洋南线' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: '李-恩菲尔德 SMLE / No.4 步枪', qty: 6800000, soft: 13, hard: 2, role: '10发弹匣极速拉栓射击（疯狂一分钟）' },
          { name: '布伦 (Bren) 轻机枪 / 维克斯水冷重机枪', qty: 680000, soft: 22, hard: 3, role: '极高精准度与持续火力支援' },
          { name: '司登 (Sten) 冲锋枪 / PIAT 反坦克抛射器', qty: 4400000, soft: 16, hard: 22, role: '廉价量产冲锋枪与近战破甲武器' },
        ],
        artillery: [
          { name: 'QF 25磅 野战加农榴弹炮', qty: 12000, caliber: '87.6mm', soft: 34, hard: 12, role: '二战机动性与射速口碑最佳野战炮' },
          { name: 'QF 6磅 (57mm) / 17磅 (76.2mm) 反坦克炮', qty: 18500, caliber: '57–76mm', soft: 14, hard: 42, role: '17磅炮正面击穿虎式与豹式装甲' },
          { name: 'BL 5.5英寸 (140mm) 中型重炮 / QF 3.7英寸高炮', qty: 5400, caliber: '94–140mm', soft: 46, hard: 20, role: '军属火力覆盖与本土防空' },
        ],
        tanks: [
          { name: '玛蒂尔达 II / 丘吉尔 (Churchill) 重型步兵坦克', qty: 8620, armor: '78–152mm', gun: '40mm / 57mm / 75mm', soft: 26, hard: 24, modelKind: 'sherman', role: '超厚装甲爬坡之王，阿拉曼与欧陆攻坚' },
          { name: '克伦威尔 (Cromwell) / 彗星 (Comet) 巡洋坦克', qty: 5200, armor: '76–101mm', gun: '75mm / 77mm', soft: 26, hard: 32, modelKind: 'sherman', role: '高速机动追击与突破' },
          { name: '谢尔曼“萤火虫” (Firefly) 17磅炮改装坦克', qty: 2100, armor: '63mm', gun: '76.2mm 17磅炮', soft: 22, hard: 44, modelKind: 'sherman', role: '诺曼底专克德军虎豹的王牌杀手' },
        ],
        aircraft: [
          { name: '喷火 (Spitfire) Mk.I–XIV 战斗机', qty: 20351, speed: '657 km/h', airAtk: 41, groundAtk: 10, modelKind: 'spitfire', role: '椭圆翼传奇，不列颠空战拯救英国' },
          { name: '飓风 (Hurricane) / 台风 (Typhoon) 对地攻击机', qty: 17850, speed: '663 km/h', airAtk: 30, groundAtk: 34, modelKind: 'spitfire', role: '防空主力与法莱斯火箭弹猎杀德军装甲' },
          { name: '蚊式 (Mosquito) 高速全木质多用途轰炸机', qty: 7781, speed: '668 km/h', airAtk: 28, groundAtk: 30, modelKind: 'plane', role: '德军无法拦截的高速精准突袭机' },
          { name: '兰开斯特 (Lancaster) 重型夜间战略轰炸机', qty: 7377, speed: '462 km/h', airAtk: 14, groundAtk: 54, modelKind: 'b29', role: '夜间面积轰炸鲁尔工业区与水坝终结者' },
        ],
        navy: [
          { name: '光辉级 / 怨仇级装甲飞行甲板航母 + 皇家方舟号', qty: 14, class: '装甲航母 (CV)', navalAtk: 56, modelKind: 'carrier', role: '塔兰托夜袭与击伤俾斯麦号，抗神风极强' },
          { name: '乔治五世级 / 纳尔逊级 / 伊丽莎白女王级战列舰', qty: 15, class: '战列舰 (BB)', navalAtk: 58, modelKind: 'battleship', role: '皇家海军大舰队中坚，封锁北海与地中海' },
          { name: '郡级/城级巡洋舰 & 部落级驱逐舰 & 花级护卫舰', qty: 460, class: '巡洋/驱逐/反潜舰', navalAtk: 28, modelKind: 'ship', role: '大西洋破交战赢得护航胜利' },
        ],
      },
    },

    france: {
      id: 'france', bloc: 'allies', name: '法兰西第三共和国 / 自由法国 (FRA)', short: '法国', flag: '⚜',
      color: '#3c70b8', border: '#95c4ff', leader: '达拉第 · 戴高乐',
      commanders: ['甘末林', '魏刚', '戴高乐', '勒克莱尔', '塔西尼', '达尔朗'],
      doctrine: '决战计划 · 马奇诺要塞防线 · 自由法国反攻',
      spirits: ['马奇诺混凝土要塞群（边防工事 +4）', '一战胜利的阴影（指挥迟缓）', '自由法国海外帝国动员'],
      industry: { civ: 54, mil: 42, dock: 26, oil: 24, steel: 82, manpowerK: 5000 },
      peakPersonnel: 5000000, active1940: 2240000,
      summary: '1940 年拥有欧洲最庞大的重型装甲群与坚固的马奇诺防线；若能提前守住阿登色当缺口并集中装甲预备队反击，即可改写西线战局，或以自由法国第 2 装甲师光复巴黎。',
      corps: [
        { id: 'fra-1ag', name: '法军第1集团军群（北翼主力/DLM轻机械化师）', commander: '比约特', strength: 360000, tanks: 1450, artillery: 1200, city: 'paris', theater: 'europe', role: '比利时与色当机动作战主力' },
        { id: 'fra-2ag', name: '法军第2集团军群（马奇诺要塞军）', commander: '普雷特拉', strength: 290000, tanks: 520, artillery: 1480, city: 'maginot', theater: 'europe', role: '莱茵河与阿尔萨斯混凝土防线' },
        { id: 'fra-4dc', name: '第4预备装甲师 / 自由法国第2装甲师', commander: '戴高乐 / 勒克莱尔', strength: 115000, tanks: 520, artillery: 360, city: 'marseille', theater: 'europe', role: '集中装甲反击与光复巴黎先锋' },
        { id: 'fra-af', name: '法属北非与非洲军团', commander: '朱安', strength: 165000, tanks: 260, artillery: 420, city: 'casablanca', theater: 'africa', role: '北非殖民地与意大利战线反攻' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: 'MAS-36 7.5mm 步枪 / 勒贝尔 1886 步枪', qty: 2400000, soft: 12, hard: 2, role: '法军标准步兵主战步枪' },
          { name: 'FM 24/29 沙泰勒罗轻机枪 / 霍奇基斯 M1914 重机枪', qty: 320000, soft: 20, hard: 2, role: '精准可靠的阵地支援机枪' },
          { name: 'MAS-38 冲锋枪 & 25mm 霍奇基斯反坦克炮', qty: 185000, soft: 14, hard: 18, role: '步兵团属直瞄反轻中甲火力' },
        ],
        artillery: [
          { name: 'M1897 75mm “法国小姐”速射野战炮', qty: 4500, caliber: '75mm', soft: 26, hard: 14, role: '经典液压驻退速射炮与反坦直瞄' },
          { name: '155mm C M1917 施耐德榴弹炮 / 155mm GPF 重加农炮', qty: 2650, caliber: '155mm', soft: 46, hard: 14, role: '法军压倒性的重炮压制与要塞支援' },
          { name: '47mm SA 37 反坦克炮（1940年欧洲顶尖反坦炮）', qty: 1280, caliber: '47mm', soft: 10, hard: 28, role: '轻松击穿 1940 年全部德军坦克前甲' },
        ],
        tanks: [
          { name: '夏尔 B1 bis (Char B1 bis) 重型突破坦克', qty: 403, armor: '60mm', gun: '75mm车体炮 + 47mm炮塔炮', soft: 32, hard: 34, modelKind: 'charb1', role: '1940年德军 37mm 炮完全无法击穿的钢铁巨兽' },
          { name: '索玛 S35 (SOMUA S35) 骑兵中型坦克', qty: 430, armor: '47mm', gun: '47mm SA 35', soft: 24, hard: 28, modelKind: 'charb1', role: '1940年综合火力与装甲最佳中型坦克' },
          { name: '雷诺 R35 / 霍奇基斯 H39 / FCM 36 轻步兵坦克', qty: 2850, armor: '40–45mm', gun: '37mm', soft: 16, hard: 14, modelKind: 'charb1', role: '厚甲步兵伴随坦克群' },
        ],
        aircraft: [
          { name: '德瓦蒂纳 D.520 战斗机', qty: 905, speed: '560 km/h', airAtk: 31, groundAtk: 8, modelKind: 'spitfire', role: '机动性直追 Bf 109E 的法国王牌战机' },
          { name: '莫拉纳-索尔尼埃 MS.406 / 布洛赫 MB.152 / 霍克 75', qty: 2150, speed: '515 km/h', airAtk: 24, groundAtk: 8, modelKind: 'plane', role: '1940 法兰西空战主力机群' },
          { name: '布雷盖 693 强击机 / 里奥 451 中型轰炸机', qty: 840, speed: '495 km/h', airAtk: 10, groundAtk: 26, modelKind: 'plane', role: '低空突袭色当德军渡河浮桥' },
        ],
        navy: [
          { name: '黎塞留级战列舰（黎塞留号 / 让·巴尔号）', qty: 2, class: '高速战列舰 (BB)', navalAtk: 60, modelKind: 'battleship', role: '前置两座四联装 380mm 主炮的现代巨舰' },
          { name: '敦刻尔克级战列巡洋舰（敦刻尔克/斯特拉斯堡）', qty: 2, class: '战列巡洋舰 (BC)', navalAtk: 48, modelKind: 'battleship', role: '地中海高速主力舰' },
          { name: '贝亚恩号航母 & 阿尔及利亚号重巡 & 空想级超大型驱逐舰', qty: 118, class: '航母/巡洋/超驱/潜艇', navalAtk: 32, modelKind: 'ship', role: '1940年世界第四大海军（含45节空想级驱逐舰）' },
        ],
      },
    },

    japan: {
      id: 'japan', bloc: 'axis', name: '大日本帝国 (JPN)', short: '日本', flag: '☀',
      color: '#c95c3c', border: '#ffab8c', leader: '东条英机 · 山本五十六',
      commanders: ['山本五十六', '山下奉文', '南云忠一', '岗村宁次', '栗林忠道', '今村均'],
      doctrine: '联合舰队航母奇袭 · 岛屿玉碎防御 · 机动穿插',
      spirits: ['第一航空舰队（开局航母突袭 +30%）', '资源匮乏（极度依赖南洋石油）', '本土决战意志（防御组织度 +20%）'],
      industry: { civ: 48, mil: 52, dock: 44, oil: 16, steel: 58, manpowerK: 9100 },
      peakPersonnel: 9100000, active1941: 2400000,
      summary: '拥有 1941 年太平洋最精锐的六航母机动部队与零式战机，开局横扫珍珠港、新加坡与菲律宾；但受限于钢铁石油与护航短板，必须速战速决抢占南洋资源区。',
      corps: [
        { id: 'jpn-south', name: '南方军（第25/14集团军 · 马来/菲）', commander: '山下奉文', strength: 240000, tanks: 420, artillery: 680, city: 'manila', theater: 'pacific', role: '闪击新加坡、荷属东印度与菲律宾' },
        { id: 'jpn-kwan', name: '关东军（满洲重兵集团）', commander: '梅津美治郎', strength: 360000, tanks: 620, artillery: 900, city: 'shenyang', theater: 'china', role: '驻防东北与警戒苏联远东' },
        { id: 'jpn-china', name: '中国派遣军主力（华北/华中方面军）', commander: '岗村宁次', strength: 520000, tanks: 360, artillery: 1120, city: 'nanjing', theater: 'china', role: '武汉、长沙与华北扫荡主力' },
        { id: 'jpn-isl', name: '太平洋岛链守备军（冲绳/硫磺/瓜岛）', commander: '栗林忠道', strength: 195000, tanks: 180, artillery: 540, city: 'okinawa', theater: 'pacific', role: '依托坑道工事迟滞美军跳岛' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: '三八式 6.5mm / 九九式 7.7mm 步枪', qty: 6900000, soft: 12, hard: 1, role: '精准远程射击与刺刀白刃战主力' },
          { name: '九六式 / 九九式轻机枪 & 九二式重机枪', qty: 310000, soft: 19, hard: 2, role: '丛林与岛屿坑道交叉火力网' },
          { name: '八九式掷弹筒 / 九二式 70mm 步兵炮', qty: 125000, soft: 22, hard: 6, role: '极轻便山地随伴曲射支援（美军极为忌惮）' },
        ],
        artillery: [
          { name: '九一式 105mm 榴弹炮 / 三八式 75mm 野炮', qty: 5800, caliber: '75–105mm', soft: 28, hard: 8, role: '日军师团炮兵主力火炮' },
          { name: '九六式 150mm 榴弹炮 / 九二式 105mm 加农炮', qty: 1350, caliber: '105–150mm', soft: 42, hard: 12, role: '军属远程攻坚与岛屿岸防重炮' },
          { name: '一式 47mm 速射反坦克炮 / 八八式 75mm 高炮', qty: 4600, caliber: '47–75mm', soft: 12, hard: 22, role: '冲绳与吕宋隐蔽伏击美军谢尔曼' },
        ],
        tanks: [
          { name: '九七式中战车改 (Chi-Ha Shinhoto)', qty: 2123, armor: '25–33mm', gun: '47mm 高速炮', soft: 18, hard: 16, modelKind: 'sherman', role: '东南亚丛林与马来突破主力中型坦克' },
          { name: '九五式轻战车 (Ha-Go)', qty: 2300, armor: '12mm', gun: '37mm', soft: 14, hard: 8, modelKind: 'sherman', role: '岛屿侦察与步兵支援' },
          { name: '一式中战车 / 三式中战车 (Chi-Nu) 本土决战型', qty: 340, armor: '50mm', gun: '75mm', soft: 22, hard: 24, modelKind: 'sherman', role: '后期为对抗谢尔曼研制的 75mm 炮坦克' },
        ],
        aircraft: [
          { name: '零式舰上战斗机 A6M2 / A6M5 (Zero)', qty: 10939, speed: '565 km/h', airAtk: 37, groundAtk: 10, modelKind: 'zero', role: '开战初期超长航程与无敌盘旋的太平洋霸主' },
          { name: '四式战“疾风” Ki-84 / 紫电改 N1K2-J', qty: 3940, speed: '631 km/h', airAtk: 40, groundAtk: 14, modelKind: 'zero', role: '后期高空抗衡美军 P-51 与 F6F 的王牌机' },
          { name: '九九舰爆 / 九七舰攻 / 天山舰攻', qty: 4800, speed: '480 km/h', airAtk: 12, groundAtk: 38, modelKind: 'plane', role: '珍珠港与中途岛航空鱼雷俯冲奇袭主力' },
          { name: '一式陆攻 (G4M Betty) 远程鱼雷轰炸机', qty: 2435, speed: '437 km/h', airAtk: 10, groundAtk: 36, modelKind: 'b29', role: '马来海战击沉威尔士亲王号战列舰' },
        ],
        navy: [
          { name: '大和级超弩级战列舰（大和号 / 武藏号）', qty: 2, class: '超战列舰 (SHBB)', navalAtk: 78, modelKind: 'yamato', role: '人类史上最大 460mm 主炮、72800 吨终极巨舰' },
          { name: '翔鹤级 / 赤城 / 加贺 / 苍龙 / 飞龙 / 大凤级航母', qty: 16, class: '正规航母 (CV)', navalAtk: 64, modelKind: 'carrier', role: '一航战与五航战精锐机动打击集群' },
          { name: '金刚/长门级战列舰 & 高雄/利根级重巡 & 阳炎/雪风级驱逐舰', qty: 220, class: '战列/重巡/驱逐/伊号潜艇', navalAtk: 38, modelKind: 'ship', role: '九三式氧气鱼雷夜战之王' },
        ],
      },
    },

    germany: {
      id: 'germany', bloc: 'axis', name: '德意志第三帝国 (GER)', short: '德国', flag: '✠',
      color: '#5a6268', border: '#b8c4cc', leader: '阿道夫·希特勒',
      commanders: ['古德里安', '曼施坦因', '隆美尔', '莫德尔', '伦德施泰特', '邓尼茨'],
      doctrine: '机动战学说（闪电战） · 装甲矛头 · U艇狼群',
      spirits: ['闪电战协同（装甲突破与移速 +25%）', '总参谋部战术素养', '后期双线作战与燃油危机'],
      industry: { civ: 86, mil: 102, dock: 28, oil: 28, steel: 138, manpowerK: 18200 },
      peakPersonnel: 18200000, active1941: 7234000,
      summary: '以闪电战装甲集群横扫波兰与法兰西，在 1941 年发动巴巴罗萨直逼莫斯科，但受困双线作战与石油短缺，最终在东西两线合围中覆灭。',
      corps: [
        { id: 'ger-agc', name: '中央集团军群（第2/3装甲集群）', commander: '古德里安 / 博克', strength: 480000, tanks: 2100, artillery: 1700, city: 'warsaw', theater: 'east', role: '闪击明斯克、斯摩棱斯克与莫斯科' },
        { id: 'ger-ags', name: '南方集团军群（第6集团军/第1装甲军）', commander: '曼施坦因', strength: 410000, tanks: 1650, artillery: 1500, city: 'berlin', theater: 'east', role: '乌克兰、高加索与斯大林格勒主攻' },
        { id: 'ger-west', name: '西线B集团军群（大西洋壁垒）', commander: '隆美尔 / 伦德施泰特', strength: 340000, tanks: 1200, artillery: 1240, city: 'ruhr', theater: 'europe', role: '闪击阿登与防御诺曼底' },
        { id: 'ger-dak', name: '非洲装甲军团 (DAK · 沙漠之狐)', commander: '隆美尔', strength: 185000, tanks: 680, artillery: 540, city: 'tripoli', theater: 'africa', role: '托布鲁克与阿拉曼沙漠闪电战' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: '毛瑟 Kar98k 步枪 / MP40 冲锋枪 / StG 44 突击步枪', qty: 16100000, soft: 18, hard: 2, role: '世界首款现代突击步枪与班组火力核心' },
          { name: 'MG 34 / MG 42 通用机枪（希特勒电锯）', qty: 780000, soft: 26, hard: 4, role: '1200发/分超高射速步兵战术核心' },
          { name: '铁拳 (Panzerfaust) / 坦克杀手火箭筒', qty: 6700000, soft: 6, hard: 28, role: '廉价量产近战反重坦破甲武器' },
        ],
        artillery: [
          { name: 'FlaK 36/37 88mm 高射/反坦克神炮', qty: 21300, caliber: '88mm', soft: 24, hard: 44, role: '北非与东线远程点杀盟军坦克传奇' },
          { name: 'leFH 18 105mm / sFH 18 150mm 榴弹炮 & 雾炮火箭炮', qty: 32500, caliber: '105–150mm', soft: 46, hard: 14, role: '德军主力压制火炮' },
        ],
        tanks: [
          { name: '虎式 I (Tiger I) / 虎王 (Tiger II) 重型坦克', qty: 1839, armor: '100–185mm', gun: '88mm L/56 & L/71', soft: 34, hard: 54, modelKind: 'tiger', role: '正面几乎无解的重装甲猎杀机器' },
          { name: '豹式 (Panther) 中型坦克 & 四号坦克 (Pz.IV)', qty: 14550, armor: '80mm倾斜', gun: '75mm L/70 & L/48', soft: 30, hard: 44, modelKind: 'tiger', role: '后期德军装甲师绝对中坚' },
          { name: '三号突击炮 (StuG III) / 猎豹坦歼', qty: 11200, armor: '80mm', gun: '75mm / 88mm', soft: 24, hard: 40, modelKind: 'tiger', role: '德军击毁盟军坦克数量第一战车' },
        ],
        aircraft: [
          { name: 'Bf 109G / Fw 190A & D / Me 262 喷气战斗机', qty: 55400, speed: '870 km/h', airAtk: 42, groundAtk: 16, modelKind: 'mig15', role: '高空截击与世界首款实战喷气机' },
          { name: 'Ju 87 斯图卡俯冲轰炸机 / He 111 / Ju 88', qty: 28600, speed: '510 km/h', airAtk: 14, groundAtk: 38, modelKind: 'plane', role: '闪电战空中炮兵与战术轰炸' },
        ],
        navy: [
          { name: '俾斯麦级战列舰（俾斯麦/提尔皮茨）& 沙恩霍斯特级', qty: 4, class: '战列舰 (BB)', navalAtk: 60, modelKind: 'battleship', role: '大西洋与挪威峡湾破交威慑' },
          { name: 'U-VII / U-IX / U-XXI 型狼群潜艇', qty: 1150, class: '远洋潜艇 (SS)', navalAtk: 38, modelKind: 'ship', role: '大西洋海运绞杀战核心' },
        ],
      },
    },

    china: {
      id: 'china', bloc: 'allies', name: '中国抗日战区（国军/八路军/新四军）', short: '中国', flag: '❖',
      color: '#d49a38', border: '#ffe099', leader: '统一战线 · 抗日民族救亡',
      commanders: ['朱德', '彭德怀', '林彪', '薛岳', '李宗仁', '张自忠', '孙立人', '卫立煌'],
      doctrine: '持久战 · 天炉战法 · 敌后游击与滇缅远征',
      spirits: ['全民族抗战持久意志（本土防御 +25%）', '华北敌后百团破袭网', '驼峰航线与美苏援华通道'],
      industry: { civ: 36, mil: 28, dock: 4, oil: 10, steel: 32, manpowerK: 14000 },
      peakPersonnel: 14000000, active1941: 5700000,
      summary: '东方反法西斯主战场！正面战场依托武汉、长沙“天炉战法”与衡阳血战死死拖住百万日军主力，敌后八路军与新四军发动百团大战破袭华北，中国远征军更出征滇缅打通中印公路。',
      corps: [
        { id: 'chi-9w', name: '第9战区主力（长沙天炉兵团）', commander: '薛岳', strength: 340000, tanks: 40, artillery: 380, city: 'changsha', theater: 'china', role: '三次长沙大捷主力' },
        { id: 'chi-5w', name: '第5/6战区主力（武汉/宜昌防线）', commander: '李宗仁 / 陈诚', strength: 320000, tanks: 60, artillery: 420, city: 'wuhan', theater: 'china', role: '拱卫陪都重庆门户' },
        { id: 'chi-8ra', name: '八路军主力（115/120/129师 · 华北敌后）', commander: '朱德 / 彭德怀', strength: 290000, tanks: 15, artillery: 220, city: 'yanan', theater: 'china', role: '平型关、百团大战与敌后大反攻' },
        { id: 'chi-cef', name: '中国远征军与驻印美械新一军/新六军', commander: '孙立人 / 卫立煌', strength: 185000, tanks: 180, artillery: 360, city: 'kunming', theater: 'china', role: '滇西反攻与仁安羌/密支那大捷' },
      ],
      arsenal: {
        infantryWeapons: [
          { name: '中正式 7.92mm 步枪 / 汉阳造八八式步枪', qty: 3200000, soft: 11, hard: 1, role: '全民族抗战主力步枪与白刃拼刺主力' },
          { name: '捷克式 ZB-26 轻机枪 / 二四式马克沁重机枪', qty: 185000, soft: 20, hard: 2, role: '连排阵地核心阻击火力（日军极为忌惮）' },
          { name: '驳壳枪 C96 / 汤姆逊冲锋枪（后期远征军）& 集束手榴弹', qty: 620000, soft: 17, hard: 10, role: '近战夜袭与手榴弹反坦克主力' },
        ],
        artillery: [
          { name: '德制 sFH 18 150mm 重榴弹炮 / 博福斯 75mm 山炮', qty: 860, caliber: '75–150mm', soft: 34, hard: 12, role: '正面战场骨干重炮与山地火炮' },
          { name: '美援 M2A1 105mm 榴弹炮 / 82mm 迫击炮群', qty: 6400, caliber: '82–105mm', soft: 28, hard: 8, role: '长沙山地曲射与远征军重火力' },
        ],
        tanks: [
          { name: '苏援 T-26 轻型坦克（第200师机械化主力）', qty: 82, armor: '15mm', gun: '45mm', soft: 16, hard: 14, modelKind: 't34', role: '昆仑关与兰封反击战装甲先锋' },
          { name: '美援 M3A3 斯图亚特 & M4A4 谢尔曼（驻印坦克营）', qty: 180, armor: '38–63mm', gun: '37mm / 75mm', soft: 22, hard: 20, modelKind: 'sherman', role: '瓦鲁班闪击日军第18师团司令部' },
          { name: '德制一号/维克斯轻坦与装甲车', qty: 95, armor: '13mm', gun: '机枪/47mm', soft: 12, hard: 8, modelKind: 'sherman', role: '淞沪与南京保卫战初期装甲' },
        ],
        aircraft: [
          { name: '中美混合联队 P-40 战鹰 / P-51 野马（飞虎队）', qty: 620, speed: '580 km/h', airAtk: 34, groundAtk: 18, modelKind: 'spitfire', role: '驼峰护航与夺取华中西南制空权' },
          { name: '苏联志愿航空队 伊-15 / 伊-16 / SB-2 轰炸机', qty: 980, speed: '470 km/h', airAtk: 24, groundAtk: 16, modelKind: 'plane', role: '武汉空战与奇袭台北松山机场' },
        ],
        navy: [
          { name: '宁海/平海号轻巡与长江布雷炮艇队', qty: 18, class: '江防轻巡/布雷艇', navalAtk: 12, modelKind: 'ship', role: '江阴封锁线与马当长江要塞迟滞日舰' },
        ],
      },
    },
  };

  // 国家领导人开局可选档案（每位领导人带专属特质、执政风格、立绘配色与推荐战役）
  const leaders = [
    {
      id: 'roosevelt', nation: 'usa', name: '富兰克林·罗斯福', title: '美利坚合众国总统 · 民主兵工厂总设计师',
      monogram: 'FDR', accent: '#2d63a6', trait: '军工产能 +25% · 租借法案费用 -25%',
      quote: '“我们必须成为民主国家的伟大兵工厂。”',
      recommended: ['ww2-1941-pacific', 'ww2-1942-pacific', 'ww2-1944-dday', 'ww2-1944-leyte', 'ww2-1945-okinawa', 'ww2-1942-africa'],
    },
    {
      id: 'stalin', nation: 'ussr', name: '约瑟夫·斯大林', title: '苏联最高统帅 · 卫国战争总指挥',
      monogram: 'USSR', accent: '#a62621', trait: '卫国人力动员 +30% · 组织度恢复 +15%',
      quote: '“一步也不后退！莫斯科就在我们身后！”',
      recommended: ['ww2-1941-barbarossa', 'ww2-1942-stalingrad', 'ww2-1944-dday', 'ww2-1939-poland'],
    },
    {
      id: 'churchill', nation: 'uk', name: '温斯顿·丘吉尔', title: '大英帝国首相 · 皇家海军与防空统帅',
      monogram: 'UK', accent: '#9c4b5c', trait: '本土防御 +25% · 制海与制空加成 +15%',
      quote: '“我们将在海滩上战斗，我们绝不投降！”',
      recommended: ['ww2-1940-britain', 'ww2-1940', 'ww2-1941-tobruk', 'ww2-1942-africa', 'ww2-1944-dday'],
    },
    {
      id: 'degaulle', nation: 'france', name: '夏尔·戴高乐', title: '法兰西装甲统帅 · 自由法国领袖',
      monogram: 'FRA', accent: '#3c70b8', trait: '装甲突破 +20% · 马奇诺与光复士气 +20%',
      quote: '“法国输掉了一场战役，但没有输掉整场战争！”',
      recommended: ['ww2-1940', 'ww2-1939-poland', 'ww2-1942-africa', 'ww2-1944-dday'],
    },
    {
      id: 'china_united', nation: 'china', name: '中国抗日统一战线统帅部', title: '正面战场与敌后抗日联合最高指挥（国军/八路军/新四军）',
      monogram: '华', accent: '#d49a38', trait: '持久战本土防御 +25% · 敌后游击破袭 +20%',
      quote: '“地无分南北，年无分老幼，皆有守土抗战之责！”',
      recommended: ['ww2-1937-shanghai', 'ww2-1938-china', 'ww2-1940-hundred', 'ww2-1944-china'],
    },
    {
      id: 'yamamoto', nation: 'japan', name: '山本五十六 · 东条英机', title: '日本联合舰队司令长官 · 帝国大本营',
      monogram: 'JPN', accent: '#c95c3c', trait: '航母突袭与两栖登陆 +25% · 岛屿防御 +20%',
      quote: '“开战后半年至一年内，我将纵横太平洋！”',
      recommended: ['ww2-1941-pacific', 'ww2-1942-pacific', 'ww2-1937-shanghai', 'ww2-1944-leyte', 'ww2-1945-okinawa'],
    },
    {
      id: 'hitler_rommel', nation: 'germany', name: '曼施坦因 · 隆美尔（德军最高统帅部）', title: '德意志装甲闪电战总参谋部',
      monogram: 'GER', accent: '#5a6268', trait: '闪电战装甲突破与行军速度 +25%',
      quote: '“闪电战的关键在于装甲集群不间断的纵深穿插。”',
      recommended: ['ww2-1939-poland', 'ww2-1940', 'ww2-1940-britain', 'ww2-1941-tobruk', 'ww2-1941-barbarossa', 'ww2-1942-stalingrad'],
    },
  ];

  // 四大战场 16 大 HOI4 经典历史战役剧本（1937–1945，含精确历史交战外交表）
  const base1938Owners = {
    london: 'uk', cairo: 'uk', alexandria: 'uk', el_alamein: 'uk', tobruk: 'uk', benghazi: 'germany', gibraltar: 'uk', suez: 'uk', delhi: 'uk', rangoon: 'uk', singapore: 'uk', sydney: 'uk', ottawa: 'uk',
    paris: 'france', sedan: 'france', dunkirk: 'france', cherbourg: 'france', marseille: 'france', maginot: 'france', casablanca: 'france', tunis: 'france',
    berlin: 'germany', ruhr: 'germany', hamburg: 'germany', munich: 'germany', warsaw: 'germany', rome: 'germany', naples: 'germany', tripoli: 'germany',
    moscow: 'ussr', leningrad: 'ussr', stalingrad: 'ussr', kiev: 'ussr', minsk: 'ussr', kursk: 'ussr', baku: 'ussr', sverdlovsk: 'ussr', vladivostok: 'ussr',
    washington: 'usa', new_york: 'usa', detroit: 'usa', san_francisco: 'usa', pearl_harbor: 'usa', midway: 'usa', manila: 'usa', guadalcanal: 'usa',
    tokyo: 'japan', osaka: 'japan', hiroshima: 'japan', okinawa: 'japan', iwo_jima: 'japan', seoul: 'japan', shenyang: 'japan', beiping: 'japan', shanghai: 'japan', nanjing: 'japan',
    wuhan: 'china', changsha: 'china', chongqing: 'china', guangzhou: 'china', yanan: 'china', kunming: 'china', jakarta: 'uk',
  };

  const scenarios = [
    // ═══ 欧洲大战（6场）═══
    {
      id: 'ww2-1939-poland', title: '🇪🇺 1939 · 波兰闪电战与欧战爆发', date: '1939-09-01', focus: 'europe', theaterTag: 'europe',
      wars: [['germany', 'france'], ['germany', 'uk'], ['japan', 'china']],
      summary: '【欧洲大战】德军“白色方案”装甲集群闪击波兰，英法对德宣战！法军可主动越过马奇诺突袭鲁尔，或稳守西线迎战。',
      owners: { ...base1938Owners, warsaw: 'france', wuhan: 'japan', guangzhou: 'japan' },
    },
    {
      id: 'ww2-1940', title: '🇪🇺 1940 · 法兰西战役与敦刻尔克', date: '1940-05-10', focus: 'europe', theaterTag: 'europe',
      wars: [['germany', 'france'], ['germany', 'uk'], ['japan', 'china']],
      summary: '【欧洲大战】曼施坦因“镰刀收割”穿越阿登直扑色当！法军夏尔 B1 重坦与英远征军能否堵住缺口，守住巴黎与英吉利海峡？',
      owners: { ...base1938Owners, sedan: 'germany', wuhan: 'japan', guangzhou: 'japan' },
    },
    {
      id: 'ww2-1940-britain', title: '🇪🇺 1940 · 不列颠空战与海狮计划', date: '1940-08-13', focus: 'europe', theaterTag: 'europe',
      wars: [['germany', 'uk'], ['germany', 'france'], ['japan', 'china']],
      summary: '【欧洲大战】欧陆沦陷后德军集结大军企图强渡英吉利海峡！英国喷火战斗机与皇家海军孤军死守不列颠群岛。',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany',
        wuhan: 'japan', guangzhou: 'japan',
      },
    },
    {
      id: 'ww2-1941-barbarossa', title: '🇪🇺 1941 · 巴巴罗萨与莫斯科保卫战', date: '1941-06-22', focus: 'east', theaterTag: 'europe',
      wars: [['germany', 'ussr'], ['germany', 'uk'], ['germany', 'france'], ['japan', 'china']],
      summary: '【欧洲大战】德军三大集团军群 380 万大军突袭苏联！红军必须在明斯克、基辅、列宁格勒与莫斯科城下顶住钢铁洪流。',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany', tunis: 'germany',
        wuhan: 'japan', guangzhou: 'japan',
      },
    },
    {
      id: 'ww2-1942-stalingrad', title: '🇪🇺 1942 · 斯大林格勒反攻与库尔斯克', date: '1942-11-19', focus: 'east', theaterTag: 'europe',
      wars: [['germany', 'ussr'], ['germany', 'uk'], ['germany', 'usa'], ['germany', 'france'], ['japan', 'usa'], ['japan', 'china']],
      summary: '【欧洲大战】苏军启动“天王星行动”钳形合围伏尔加河德军第 6 集团军，随之爆发人类史上最大规模库尔斯克坦克会战！',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany', tunis: 'germany',
        kiev: 'germany', minsk: 'germany', kursk: 'germany', wuhan: 'japan', guangzhou: 'japan', singapore: 'japan', manila: 'japan', jakarta: 'japan',
      },
    },
    {
      id: 'ww2-1944-dday', title: '🇪🇺 1944 · 诺曼底登陆与反攻柏林', date: '1944-06-06', focus: 'europe', theaterTag: 'europe',
      wars: [['germany', 'usa'], ['germany', 'uk'], ['germany', 'france'], ['germany', 'ussr'], ['japan', 'usa'], ['japan', 'uk'], ['japan', 'china']],
      summary: '【欧洲大战】盟军发起“霸王行动”抢滩诺曼底，苏军启动“巴格拉季昂”解放明斯克，东西两线全面合围柏林！',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'usa', marseille: 'france', maginot: 'germany',
        rome: 'usa', naples: 'uk', tripoli: 'uk', benghazi: 'uk', tobruk: 'uk', tunis: 'france',
        singapore: 'japan', jakarta: 'japan', wuhan: 'japan', guangzhou: 'japan',
      },
    },
    // ═══ 中国抗日战场（4场）═══
    {
      id: 'ww2-1937-shanghai', title: '🇨🇳 1937 · 淞沪会战与平型关保卫战', date: '1937-08-13', focus: 'china', theaterTag: 'china',
      wars: [['japan', 'china']],
      summary: '【中国战场】全面抗战爆发！中国军民在上海、南京与华北铁路沿线浴血阻击日军，八路军在平型关首战告捷打破日军不可战胜神话。',
      owners: { ...base1938Owners, shanghai: 'china', nanjing: 'china' },
    },
    {
      id: 'ww2-1938-china', title: '🇨🇳 1938 · 武汉保卫战与台儿庄/长沙', date: '1938-06-11', focus: 'china', theaterTag: 'china',
      wars: [['japan', 'china']],
      summary: '【中国战场】百万中国军民浴血武汉与长沙！正面战场依托万家岭与天炉战法阻击日军中国派遣军，八路军在华北敌后发动破袭战。',
      owners: { ...base1938Owners },
    },
    {
      id: 'ww2-1940-hundred', title: '🇨🇳 1940 · 百团大战与第三次长沙大捷', date: '1940-08-20', focus: 'china', theaterTag: 'china',
      wars: [['japan', 'china'], ['germany', 'uk'], ['germany', 'france']],
      summary: '【中国战场】八路军发动 105 个团大规模铁路破袭战震撼华北，第 9 战区薛岳兵团在长沙布下天炉阵三战三捷！',
      owners: { ...base1938Owners, wuhan: 'japan', guangzhou: 'japan', paris: 'germany', sedan: 'germany', dunkirk: 'germany' },
    },
    {
      id: 'ww2-1944-china', title: '🇨🇳 1944 · 豫湘桂血战与滇缅远征反攻', date: '1944-05-11', focus: 'china', theaterTag: 'china',
      wars: [['japan', 'china'], ['japan', 'usa'], ['japan', 'uk'], ['germany', 'usa'], ['germany', 'uk'], ['germany', 'ussr']],
      summary: '【中国战场】中国远征军强渡怒江反攻滇西、驻印新一军横扫缅北，同时正面与敌后抗日武装迎战日军“一号作战”！',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', marseille: 'germany', maginot: 'germany',
        wuhan: 'japan', guangzhou: 'japan', rangoon: 'japan', singapore: 'japan', jakarta: 'japan',
      },
    },
    // ═══ 太平洋战场（4场）═══
    {
      id: 'ww2-1941-pacific', title: '⚓ 1941 · 珍珠港与南洋大闪击', date: '1941-12-07', focus: 'pacific', theaterTag: 'pacific',
      wars: [['japan', 'usa'], ['japan', 'uk'], ['japan', 'china'], ['germany', 'ussr'], ['germany', 'uk'], ['germany', 'usa']],
      summary: '【太平洋战场】日本联合舰队偷袭珍珠港并横扫马来、新加坡与菲律宾！美国双洋航母舰队全面苏醒。',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany', tunis: 'germany',
        kiev: 'germany', minsk: 'germany', wuhan: 'japan', guangzhou: 'japan',
        manila: 'japan', guadalcanal: 'japan', jakarta: 'japan',
      },
    },
    {
      id: 'ww2-1942-pacific', title: '⚓ 1942 · 中途岛与瓜岛跳岛反攻', date: '1942-06-04', focus: 'pacific', theaterTag: 'pacific',
      wars: [['japan', 'usa'], ['japan', 'uk'], ['japan', 'china'], ['germany', 'ussr'], ['germany', 'uk'], ['germany', 'usa']],
      summary: '【太平洋战场】中途岛击沉日军四艘主力航母后，美海军陆战队抢滩瓜达尔卡纳尔，开启直扑硫磺岛、冲绳与东京的跳岛血战！',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany', tunis: 'germany',
        kiev: 'germany', minsk: 'germany', kursk: 'germany', wuhan: 'japan', guangzhou: 'japan',
        manila: 'japan', singapore: 'japan', jakarta: 'japan', rangoon: 'japan', guadalcanal: 'usa',
      },
    },
    {
      id: 'ww2-1944-leyte', title: '⚓ 1944 · 莱特湾海战与重返菲律宾', date: '1944-10-20', focus: 'pacific', theaterTag: 'pacific',
      wars: [['japan', 'usa'], ['japan', 'uk'], ['japan', 'china'], ['germany', 'usa'], ['germany', 'uk'], ['germany', 'ussr']],
      summary: '【太平洋战场】人类史上规模最大海战！美军埃塞克斯航母群与麦克阿瑟大军重返马尼拉，彻底切断日本南洋石油生命线。',
      owners: {
        ...base1938Owners,
        paris: 'france', cherbourg: 'usa', marseille: 'france', rome: 'usa', naples: 'uk',
        wuhan: 'japan', guangzhou: 'japan', singapore: 'japan', jakarta: 'japan', manila: 'japan', guadalcanal: 'usa',
      },
    },
    {
      id: 'ww2-1945-okinawa', title: '⚓ 1945 · 硫磺岛、冲绳与本土决战', date: '1945-02-19', focus: 'pacific', theaterTag: 'pacific',
      wars: [['japan', 'usa'], ['japan', 'uk'], ['japan', 'china'], ['japan', 'ussr'], ['germany', 'usa'], ['germany', 'ussr']],
      summary: '【太平洋战场】美军强攻硫磺岛与冲绳铁暴风，B-29 覆盖东京大阪，苏联远东红旗方面军即将发动八月风暴横扫关东军！',
      owners: {
        ...base1938Owners,
        paris: 'france', cherbourg: 'usa', dunkirk: 'uk', marseille: 'france', rome: 'usa', naples: 'uk', warsaw: 'ussr',
        manila: 'usa', guadalcanal: 'usa', rangoon: 'uk', wuhan: 'japan', guangzhou: 'japan', iwo_jima: 'japan', okinawa: 'japan',
      },
    },
    // ═══ 非洲与地中海战场（2场）═══
    {
      id: 'ww2-1941-tobruk', title: '🏜️ 1941 · 沙漠之狐与托布鲁克围城战', date: '1941-03-24', focus: 'africa', theaterTag: 'africa',
      wars: [['germany', 'uk'], ['germany', 'france'], ['japan', 'china']],
      summary: '【非洲战场】隆美尔非洲装甲军团登陆的黎波里发动沙漠闪电战！英澳守军在托布鲁克要塞孤城死守，力阻德军直插苏伊士运河。',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', marseille: 'germany', maginot: 'germany',
        tunis: 'germany', tripoli: 'germany', benghazi: 'germany', tobruk: 'uk', el_alamein: 'uk',
        wuhan: 'japan', guangzhou: 'japan',
      },
    },
    {
      id: 'ww2-1942-africa', title: '🏜️ 1942 · 阿拉曼决战与北非火炬行动', date: '1942-10-23', focus: 'africa', theaterTag: 'africa',
      wars: [['germany', 'uk'], ['germany', 'usa'], ['germany', 'france'], ['germany', 'ussr'], ['japan', 'usa'], ['japan', 'china']],
      summary: '【非洲战场】蒙哥马利第8集团军在阿拉曼以千门火炮反击隆美尔非洲军团，美英法“火炬行动”自卡萨布兰卡东西夹击突尼斯！',
      owners: {
        ...base1938Owners,
        paris: 'germany', sedan: 'germany', dunkirk: 'germany', cherbourg: 'germany', marseille: 'germany', maginot: 'germany',
        casablanca: 'usa', tunis: 'germany', tripoli: 'germany', benghazi: 'germany', tobruk: 'germany', el_alamein: 'uk',
        kiev: 'germany', minsk: 'germany', kursk: 'germany', wuhan: 'japan', guangzhou: 'japan',
        singapore: 'japan', jakarta: 'japan', rangoon: 'japan', manila: 'japan',
      },
    },
  ];

  // 全球 65 座二战核心战略城市、港口、工业枢纽与四大战场节点
  const cities = [
    // 西欧与中欧
    { id: 'london', name: '伦敦', lon: -0.1, lat: 51.5, theater: 'europe', terrain: 'urban', port: true, vp: 25, ic: 18 },
    { id: 'dunkirk', name: '敦刻尔克', lon: 2.38, lat: 51.03, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 5 },
    { id: 'cherbourg', name: '瑟堡(诺曼底)', lon: -1.62, lat: 49.63, theater: 'europe', terrain: 'port', port: true, vp: 12, ic: 5 },
    { id: 'paris', name: '巴黎', lon: 2.35, lat: 48.85, theater: 'europe', terrain: 'urban', port: false, vp: 25, ic: 16 },
    { id: 'sedan', name: '色当(阿登)', lon: 4.94, lat: 49.70, theater: 'europe', terrain: 'forest', port: false, vp: 8, ic: 4 },
    { id: 'maginot', name: '马奇诺防线', lon: 7.35, lat: 48.60, theater: 'europe', terrain: 'fort', port: false, vp: 10, ic: 4, fort: 4 },
    { id: 'marseille', name: '马赛', lon: 5.37, lat: 43.30, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 7 },
    { id: 'ruhr', name: '鲁尔工业区', lon: 7.01, lat: 51.45, theater: 'europe', terrain: 'urban', port: false, vp: 18, ic: 22 },
    { id: 'hamburg', name: '汉堡', lon: 9.99, lat: 53.55, theater: 'europe', terrain: 'port', port: true, vp: 12, ic: 10 },
    { id: 'berlin', name: '柏林', lon: 13.40, lat: 52.52, theater: 'europe', terrain: 'urban', port: false, vp: 30, ic: 20 },
    { id: 'munich', name: '慕尼黑', lon: 11.58, lat: 48.13, theater: 'europe', terrain: 'mountain', port: false, vp: 12, ic: 10 },
    { id: 'warsaw', name: '华沙', lon: 21.01, lat: 52.23, theater: 'east', terrain: 'plain', port: false, vp: 15, ic: 8 },
    { id: 'rome', name: '罗马', lon: 12.50, lat: 41.90, theater: 'europe', terrain: 'urban', port: false, vp: 18, ic: 10 },
    { id: 'naples', name: '那不勒斯', lon: 14.27, lat: 40.85, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 6 },
    { id: 'gibraltar', name: '直布罗陀', lon: -5.35, lat: 36.14, theater: 'africa', terrain: 'port', port: true, vp: 10, ic: 3 },
    // 苏德东线
    { id: 'leningrad', name: '列宁格勒', lon: 30.31, lat: 59.93, theater: 'east', terrain: 'urban', port: true, vp: 20, ic: 14 },
    { id: 'minsk', name: '明斯克', lon: 27.56, lat: 53.90, theater: 'east', terrain: 'forest', port: false, vp: 12, ic: 6 },
    { id: 'kiev', name: '基辅', lon: 30.52, lat: 50.45, theater: 'east', terrain: 'river', port: false, vp: 16, ic: 10 },
    { id: 'moscow', name: '莫斯科', lon: 37.62, lat: 55.75, theater: 'east', terrain: 'urban', port: false, vp: 30, ic: 22 },
    { id: 'kursk', name: '库尔斯克', lon: 36.19, lat: 51.73, theater: 'east', terrain: 'plain', port: false, vp: 12, ic: 6 },
    { id: 'stalingrad', name: '斯大林格勒', lon: 44.51, lat: 48.70, theater: 'east', terrain: 'urban', port: false, vp: 22, ic: 14 },
    { id: 'baku', name: '巴库油田', lon: 49.87, lat: 40.41, theater: 'east', terrain: 'mountain', port: false, vp: 16, ic: 12 },
    { id: 'sverdlovsk', name: '斯维尔德洛夫斯克', lon: 60.61, lat: 56.84, theater: 'east', terrain: 'urban', port: false, vp: 14, ic: 18 },
    { id: 'vladivostok', name: '海参崴', lon: 131.88, lat: 43.12, theater: 'china', terrain: 'port', port: true, vp: 12, ic: 8 },
    // 北非与地中海沙漠走廊
    { id: 'casablanca', name: '卡萨布兰卡', lon: -7.59, lat: 33.57, theater: 'africa', terrain: 'port', port: true, vp: 10, ic: 4 },
    { id: 'tunis', name: '突尼斯', lon: 10.18, lat: 36.81, theater: 'africa', terrain: 'port', port: true, vp: 12, ic: 4 },
    { id: 'tripoli', name: '的黎波里', lon: 13.19, lat: 32.89, theater: 'africa', terrain: 'desert', port: true, vp: 12, ic: 4 },
    { id: 'benghazi', name: '班加西', lon: 20.07, lat: 32.12, theater: 'africa', terrain: 'desert', port: true, vp: 10, ic: 2 },
    { id: 'tobruk', name: '托布鲁克要塞', lon: 23.98, lat: 32.08, theater: 'africa', terrain: 'fort', port: true, vp: 12, ic: 2, fort: 2 },
    { id: 'el_alamein', name: '阿拉曼防线', lon: 28.95, lat: 30.83, theater: 'africa', terrain: 'desert', port: false, vp: 14, ic: 2, fort: 2 },
    { id: 'alexandria', name: '亚历山大港', lon: 29.92, lat: 31.20, theater: 'africa', terrain: 'port', port: true, vp: 12, ic: 6 },
    { id: 'cairo', name: '开罗', lon: 31.24, lat: 30.04, theater: 'africa', terrain: 'urban', port: false, vp: 16, ic: 8 },
    { id: 'suez', name: '苏伊士运河', lon: 32.55, lat: 29.97, theater: 'africa', terrain: 'port', port: true, vp: 15, ic: 4 },
    // 北美大后方
    { id: 'washington', name: '华盛顿', lon: -77.04, lat: 38.90, theater: 'america', terrain: 'urban', port: true, vp: 25, ic: 18 },
    { id: 'new_york', name: '纽约港', lon: -74.00, lat: 40.71, theater: 'america', terrain: 'port', port: true, vp: 20, ic: 24 },
    { id: 'detroit', name: '底特律军工城', lon: -83.05, lat: 42.33, theater: 'america', terrain: 'urban', port: false, vp: 18, ic: 28 },
    { id: 'ottawa', name: '渥太华', lon: -75.70, lat: 45.42, theater: 'america', terrain: 'urban', port: true, vp: 12, ic: 10 },
    { id: 'san_francisco', name: '旧金山港', lon: -122.42, lat: 37.77, theater: 'america', terrain: 'port', port: true, vp: 16, ic: 16 },
    // 中国抗日主战场
    { id: 'shenyang', name: '沈阳(奉天)', lon: 123.43, lat: 41.80, theater: 'china', terrain: 'urban', port: false, vp: 14, ic: 12 },
    { id: 'beiping', name: '北平/天津', lon: 116.40, lat: 39.90, theater: 'china', terrain: 'urban', port: false, vp: 18, ic: 10 },
    { id: 'yanan', name: '延安(华北根据地)', lon: 109.49, lat: 36.59, theater: 'china', terrain: 'mountain', port: false, vp: 14, ic: 5, fort: 2 },
    { id: 'shanghai', name: '上海', lon: 121.47, lat: 31.23, theater: 'china', terrain: 'port', port: true, vp: 16, ic: 12 },
    { id: 'nanjing', name: '南京', lon: 118.79, lat: 32.06, theater: 'china', terrain: 'urban', port: false, vp: 16, ic: 10 },
    { id: 'wuhan', name: '武汉', lon: 114.30, lat: 30.59, theater: 'china', terrain: 'river', port: false, vp: 18, ic: 10 },
    { id: 'changsha', name: '长沙(第9战区)', lon: 112.94, lat: 28.23, theater: 'china', terrain: 'mountain', port: false, vp: 16, ic: 6, fort: 2 },
    { id: 'guangzhou', name: '广州', lon: 113.26, lat: 23.13, theater: 'china', terrain: 'port', port: true, vp: 14, ic: 8 },
    { id: 'chongqing', name: '重庆(陪都)', lon: 106.55, lat: 29.56, theater: 'china', terrain: 'mountain', port: false, vp: 25, ic: 12, fort: 2 },
    { id: 'kunming', name: '昆明(滇缅/驼峰)', lon: 102.71, lat: 25.04, theater: 'china', terrain: 'mountain', port: false, vp: 14, ic: 6 },
    // 太平洋与东南亚战场
    { id: 'pearl_harbor', name: '珍珠港', lon: -157.95, lat: 21.35, theater: 'pacific', terrain: 'port', port: true, vp: 18, ic: 8 },
    { id: 'midway', name: '中途岛', lon: -177.37, lat: 28.21, theater: 'pacific', terrain: 'port', port: true, vp: 12, ic: 2 },
    { id: 'guadalcanal', name: '瓜达尔卡纳尔', lon: 160.02, lat: -9.58, theater: 'pacific', terrain: 'jungle', port: true, vp: 14, ic: 2 },
    { id: 'iwo_jima', name: '硫磺岛', lon: 141.32, lat: 24.78, theater: 'pacific', terrain: 'fort', port: true, vp: 12, ic: 2, fort: 3 },
    { id: 'okinawa', name: '冲绳', lon: 127.78, lat: 26.33, theater: 'pacific', terrain: 'fort', port: true, vp: 15, ic: 4, fort: 3 },
    { id: 'tokyo', name: '东京', lon: 139.69, lat: 35.69, theater: 'pacific', terrain: 'urban', port: true, vp: 30, ic: 22 },
    { id: 'osaka', name: '大阪', lon: 135.50, lat: 34.69, theater: 'pacific', terrain: 'port', port: true, vp: 16, ic: 14 },
    { id: 'hiroshima', name: '广岛/吴港', lon: 132.45, lat: 34.39, theater: 'pacific', terrain: 'port', port: true, vp: 14, ic: 10 },
    { id: 'seoul', name: '汉城', lon: 126.98, lat: 37.56, theater: 'china', terrain: 'urban', port: true, vp: 10, ic: 5 },
    { id: 'manila', name: '马尼拉', lon: 120.98, lat: 14.60, theater: 'pacific', terrain: 'port', port: true, vp: 14, ic: 6 },
    { id: 'singapore', name: '新加坡', lon: 103.82, lat: 1.35, theater: 'pacific', terrain: 'port', port: true, vp: 16, ic: 7 },
    { id: 'jakarta', name: '雅加达(爪哇油田)', lon: 106.85, lat: -6.21, theater: 'pacific', terrain: 'jungle', port: true, vp: 12, ic: 6 },
    { id: 'rangoon', name: '仰光(缅甸)', lon: 96.17, lat: 16.84, theater: 'pacific', terrain: 'jungle', port: true, vp: 12, ic: 4 },
    { id: 'delhi', name: '新德里/加尔各答', lon: 77.21, lat: 28.61, theater: 'pacific', terrain: 'urban', port: false, vp: 16, ic: 12 },
    { id: 'sydney', name: '悉尼', lon: 151.21, lat: -33.87, theater: 'pacific', terrain: 'port', port: true, vp: 14, ic: 10 },
    // ── 精细扩充：英伦三岛与低地/法国 ──
    { id: 'portsmouth', name: '朴茨茅斯', lon: -1.09, lat: 50.80, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 6, owner: 'uk' },
    { id: 'birmingham', name: '伯明翰', lon: -1.89, lat: 52.48, theater: 'europe', terrain: 'urban', port: false, vp: 8, ic: 12, owner: 'uk' },
    { id: 'liverpool', name: '利物浦', lon: -2.99, lat: 53.41, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'uk' },
    { id: 'edinburgh', name: '爱丁堡/斯卡帕湾', lon: -3.19, lat: 55.95, theater: 'europe', terrain: 'port', port: true, vp: 9, ic: 6, owner: 'uk' },
    { id: 'dublin', name: '都柏林', lon: -6.26, lat: 53.35, theater: 'europe', terrain: 'port', port: true, vp: 6, ic: 4, owner: 'uk' },
    { id: 'caen', name: '卡昂', lon: -0.37, lat: 49.18, theater: 'europe', terrain: 'plain', port: false, vp: 7, ic: 3, owner: 'france' },
    { id: 'brest', name: '布雷斯特', lon: -4.49, lat: 48.39, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 4, owner: 'france' },
    { id: 'bordeaux', name: '波尔多', lon: -0.58, lat: 44.84, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 5, owner: 'france' },
    { id: 'lyon', name: '里昂', lon: 4.83, lat: 45.76, theater: 'europe', terrain: 'urban', port: false, vp: 9, ic: 7, owner: 'france' },
    { id: 'brussels', name: '布鲁塞尔', lon: 4.35, lat: 50.85, theater: 'europe', terrain: 'urban', port: false, vp: 10, ic: 8, owner: 'france' },
    { id: 'antwerp', name: '安特卫普', lon: 4.40, lat: 51.22, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 7, owner: 'france' },
    { id: 'amsterdam', name: '阿姆斯特丹', lon: 4.90, lat: 52.37, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'france' },
    // ── 精细扩充：德国、中欧、波兰与巴尔干 ──
    { id: 'kiel', name: '基尔军港', lon: 10.13, lat: 54.32, theater: 'europe', terrain: 'port', port: true, vp: 9, ic: 6, owner: 'germany' },
    { id: 'cologne', name: '科隆', lon: 6.96, lat: 50.94, theater: 'europe', terrain: 'urban', port: false, vp: 10, ic: 12, owner: 'germany' },
    { id: 'frankfurt', name: '法兰克福', lon: 8.68, lat: 50.11, theater: 'europe', terrain: 'urban', port: false, vp: 10, ic: 10, owner: 'germany' },
    { id: 'dresden', name: '德累斯顿', lon: 13.74, lat: 51.05, theater: 'europe', terrain: 'urban', port: false, vp: 9, ic: 9, owner: 'germany' },
    { id: 'konigsberg', name: '柯尼斯堡', lon: 20.51, lat: 54.71, theater: 'east', terrain: 'port', port: true, vp: 10, ic: 6, owner: 'germany' },
    { id: 'breslau', name: '布雷斯劳', lon: 17.04, lat: 51.11, theater: 'east', terrain: 'urban', port: false, vp: 8, ic: 7, owner: 'germany' },
    { id: 'vienna', name: '维也纳', lon: 16.37, lat: 48.21, theater: 'europe', terrain: 'urban', port: false, vp: 14, ic: 10, owner: 'germany' },
    { id: 'prague', name: '布拉格', lon: 14.44, lat: 50.08, theater: 'europe', terrain: 'urban', port: false, vp: 12, ic: 11, owner: 'germany' },
    { id: 'danzig', name: '但泽走廊', lon: 18.65, lat: 54.35, theater: 'east', terrain: 'port', port: true, vp: 10, ic: 5, owner: 'uk' },
    { id: 'krakow', name: '克拉科夫', lon: 19.94, lat: 50.06, theater: 'east', terrain: 'plain', port: false, vp: 8, ic: 5, owner: 'uk' },
    { id: 'budapest', name: '布达佩斯', lon: 19.04, lat: 47.50, theater: 'east', terrain: 'river', port: false, vp: 12, ic: 7, owner: 'germany' },
    { id: 'bucharest', name: '布加勒斯特/油田', lon: 26.10, lat: 44.43, theater: 'east', terrain: 'plain', port: false, vp: 12, ic: 8, owner: 'germany' },
    { id: 'belgrade', name: '贝尔格莱德', lon: 20.45, lat: 44.82, theater: 'europe', terrain: 'river', port: false, vp: 10, ic: 5, owner: 'uk' },
    { id: 'sofia', name: '索非亚', lon: 23.32, lat: 42.70, theater: 'europe', terrain: 'mountain', port: false, vp: 8, ic: 4, owner: 'germany' },
    { id: 'athens', name: '雅典', lon: 23.73, lat: 37.98, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 5, owner: 'uk' },
    // ── 精细扩充：北欧、意大利与伊比利亚 ──
    { id: 'copenhagen', name: '哥本哈根', lon: 12.57, lat: 55.68, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 5, owner: 'uk' },
    { id: 'oslo', name: '奥斯陆', lon: 10.75, lat: 59.91, theater: 'europe', terrain: 'port', port: true, vp: 9, ic: 5, owner: 'uk' },
    { id: 'narvik', name: '纳尔维克', lon: 17.43, lat: 68.44, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 4, owner: 'uk' },
    { id: 'stockholm', name: '斯德哥尔摩', lon: 18.07, lat: 59.33, theater: 'europe', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'uk' },
    { id: 'helsinki', name: '赫尔辛基', lon: 24.94, lat: 60.17, theater: 'east', terrain: 'port', port: true, vp: 10, ic: 5, owner: 'germany' },
    { id: 'milan', name: '米兰', lon: 9.19, lat: 45.46, theater: 'europe', terrain: 'urban', port: false, vp: 12, ic: 12, owner: 'germany' },
    { id: 'venice', name: '威尼斯', lon: 12.32, lat: 45.44, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 6, owner: 'germany' },
    { id: 'palermo', name: '巴勒莫(西西里)', lon: 13.36, lat: 38.12, theater: 'europe', terrain: 'port', port: true, vp: 9, ic: 4, owner: 'germany' },
    { id: 'taranto', name: '塔兰托军港', lon: 17.24, lat: 40.47, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 4, owner: 'germany' },
    { id: 'madrid', name: '马德里', lon: -3.70, lat: 40.42, theater: 'europe', terrain: 'urban', port: false, vp: 12, ic: 7, owner: 'germany' },
    { id: 'barcelona', name: '巴塞罗那', lon: 2.17, lat: 41.39, theater: 'europe', terrain: 'port', port: true, vp: 9, ic: 6, owner: 'germany' },
    { id: 'lisbon', name: '里斯本', lon: -9.14, lat: 38.72, theater: 'europe', terrain: 'port', port: true, vp: 8, ic: 4, owner: 'uk' },
    // ── 精细扩充：苏联纵深与东线重镇 ──
    { id: 'murmansk', name: '摩尔曼斯克', lon: 33.08, lat: 68.97, theater: 'east', terrain: 'port', port: true, vp: 10, ic: 5, owner: 'ussr' },
    { id: 'smolensk', name: '斯摩棱斯克', lon: 32.04, lat: 54.78, theater: 'east', terrain: 'forest', port: false, vp: 12, ic: 6, owner: 'ussr' },
    { id: 'kharkov', name: '哈尔科夫', lon: 36.23, lat: 49.99, theater: 'east', terrain: 'urban', port: false, vp: 14, ic: 12, owner: 'ussr' },
    { id: 'odessa', name: '敖德萨', lon: 30.72, lat: 46.48, theater: 'east', terrain: 'port', port: true, vp: 10, ic: 6, owner: 'ussr' },
    { id: 'sevastopol', name: '塞瓦斯托波尔', lon: 33.52, lat: 44.62, theater: 'east', terrain: 'fort', port: true, vp: 12, ic: 4, fort: 2, owner: 'ussr' },
    { id: 'rostov', name: '罗斯托夫', lon: 39.70, lat: 47.23, theater: 'east', terrain: 'river', port: true, vp: 12, ic: 8, owner: 'ussr' },
    { id: 'voronezh', name: '沃罗涅日', lon: 39.20, lat: 51.67, theater: 'east', terrain: 'plain', port: false, vp: 10, ic: 6, owner: 'ussr' },
    { id: 'grozny', name: '格罗兹尼油田', lon: 45.69, lat: 43.32, theater: 'east', terrain: 'mountain', port: false, vp: 10, ic: 8, owner: 'ussr' },
    { id: 'kuibyshev', name: '古比雪夫', lon: 50.10, lat: 53.20, theater: 'east', terrain: 'urban', port: false, vp: 12, ic: 12, owner: 'ussr' },
    { id: 'novosibirsk', name: '新西伯利亚', lon: 82.92, lat: 55.01, theater: 'east', terrain: 'urban', port: false, vp: 12, ic: 12, owner: 'ussr' },
    { id: 'irkutsk', name: '伊尔库茨克', lon: 104.28, lat: 52.29, theater: 'east', terrain: 'forest', port: false, vp: 10, ic: 8, owner: 'ussr' },
    { id: 'khabarovsk', name: '伯力(哈巴罗夫斯克)', lon: 135.08, lat: 48.48, theater: 'china', terrain: 'river', port: false, vp: 10, ic: 7, owner: 'ussr' },
    // ── 精细扩充：北非与中东走廊 ──
    { id: 'algiers', name: '阿尔及尔', lon: 3.06, lat: 36.75, theater: 'africa', terrain: 'port', port: true, vp: 10, ic: 4, owner: 'france' },
    { id: 'oran', name: '奥兰港', lon: -0.63, lat: 35.70, theater: 'africa', terrain: 'port', port: true, vp: 8, ic: 3, owner: 'france' },
    { id: 'istanbul', name: '伊斯坦布尔', lon: 28.98, lat: 41.01, theater: 'africa', terrain: 'port', port: true, vp: 12, ic: 7, owner: 'uk' },
    { id: 'ankara', name: '安卡拉', lon: 32.86, lat: 39.93, theater: 'africa', terrain: 'mountain', port: false, vp: 10, ic: 6, owner: 'uk' },
    { id: 'baghdad', name: '巴格达', lon: 44.36, lat: 33.31, theater: 'africa', terrain: 'desert', port: false, vp: 10, ic: 6, owner: 'uk' },
    { id: 'tehran', name: '德黑兰', lon: 51.39, lat: 35.69, theater: 'africa', terrain: 'mountain', port: false, vp: 10, ic: 6, owner: 'ussr' },
    // ── 精细扩充：中国抗日各省重镇与蒙古 ──
    { id: 'harbin', name: '哈尔滨', lon: 126.64, lat: 45.75, theater: 'china', terrain: 'urban', port: false, vp: 12, ic: 10, owner: 'japan' },
    { id: 'changchun', name: '长春(新京)', lon: 125.32, lat: 43.82, theater: 'china', terrain: 'urban', port: false, vp: 12, ic: 10, owner: 'japan' },
    { id: 'dalian', name: '大连/旅顺', lon: 121.61, lat: 38.91, theater: 'china', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'japan' },
    { id: 'taiyuan', name: '太原', lon: 112.55, lat: 37.87, theater: 'china', terrain: 'mountain', port: false, vp: 10, ic: 6, owner: 'japan' },
    { id: 'xian', name: '西安', lon: 108.94, lat: 34.34, theater: 'china', terrain: 'plain', port: false, vp: 12, ic: 6, owner: 'china' },
    { id: 'xuzhou', name: '徐州', lon: 117.18, lat: 34.26, theater: 'china', terrain: 'plain', port: false, vp: 10, ic: 5, owner: 'japan' },
    { id: 'jinan', name: '济南', lon: 117.00, lat: 36.65, theater: 'china', terrain: 'plain', port: false, vp: 10, ic: 6, owner: 'japan' },
    { id: 'chengdu', name: '成都', lon: 104.07, lat: 30.67, theater: 'china', terrain: 'plain', port: false, vp: 12, ic: 7, owner: 'china' },
    { id: 'lanzhou', name: '兰州', lon: 103.83, lat: 36.06, theater: 'china', terrain: 'mountain', port: false, vp: 10, ic: 5, owner: 'china' },
    { id: 'hong_kong', name: '香港', lon: 114.17, lat: 22.32, theater: 'china', terrain: 'port', port: true, vp: 10, ic: 7, owner: 'uk' },
    { id: 'taipei', name: '台北', lon: 121.56, lat: 25.03, theater: 'china', terrain: 'port', port: true, vp: 10, ic: 6, owner: 'japan' },
    { id: 'ulaanbaatar', name: '乌兰巴托', lon: 106.91, lat: 47.92, theater: 'china', terrain: 'plain', port: false, vp: 8, ic: 3, owner: 'ussr' },
    // ── 精细扩充：日本列岛与朝鲜半岛 ──
    { id: 'nagoya', name: '名古屋', lon: 136.91, lat: 35.18, theater: 'pacific', terrain: 'urban', port: true, vp: 12, ic: 12, owner: 'japan' },
    { id: 'nagasaki', name: '长崎', lon: 129.88, lat: 32.75, theater: 'pacific', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'japan' },
    { id: 'fukuoka', name: '福冈', lon: 130.40, lat: 33.59, theater: 'pacific', terrain: 'port', port: true, vp: 10, ic: 8, owner: 'japan' },
    { id: 'sendai', name: '仙台', lon: 140.87, lat: 38.27, theater: 'pacific', terrain: 'port', port: true, vp: 9, ic: 6, owner: 'japan' },
    { id: 'sapporo', name: '札幌(北海道)', lon: 141.35, lat: 43.06, theater: 'pacific', terrain: 'mountain', port: true, vp: 9, ic: 6, owner: 'japan' },
    { id: 'pyongyang_ww2', name: '平壤', lon: 125.76, lat: 39.03, theater: 'china', terrain: 'urban', port: false, vp: 9, ic: 5, owner: 'japan' },
    { id: 'pusan_ww2', name: '釜山', lon: 129.07, lat: 35.18, theater: 'china', terrain: 'port', port: true, vp: 9, ic: 5, owner: 'japan' },
    // ── 精细扩充：东南亚、南亚、澳新与太平洋 ──
    { id: 'hanoi', name: '河内', lon: 105.85, lat: 21.03, theater: 'pacific', terrain: 'jungle', port: true, vp: 8, ic: 4, owner: 'france' },
    { id: 'saigon', name: '西贡', lon: 106.70, lat: 10.78, theater: 'pacific', terrain: 'port', port: true, vp: 9, ic: 4, owner: 'france' },
    { id: 'bangkok', name: '曼谷', lon: 100.50, lat: 13.76, theater: 'pacific', terrain: 'jungle', port: true, vp: 9, ic: 4, owner: 'japan' },
    { id: 'mandalay', name: '曼德勒', lon: 96.08, lat: 21.96, theater: 'pacific', terrain: 'jungle', port: false, vp: 8, ic: 3, owner: 'uk' },
    { id: 'calcutta', name: '加尔各答', lon: 88.36, lat: 22.57, theater: 'pacific', terrain: 'port', port: true, vp: 12, ic: 9, owner: 'uk' },
    { id: 'bombay', name: '孟买', lon: 72.88, lat: 19.08, theater: 'pacific', terrain: 'port', port: true, vp: 12, ic: 9, owner: 'uk' },
    { id: 'surabaya', name: '泗水', lon: 112.75, lat: -7.25, theater: 'pacific', terrain: 'port', port: true, vp: 8, ic: 5, owner: 'uk' },
    { id: 'darwin', name: '达尔文港', lon: 130.84, lat: -12.46, theater: 'pacific', terrain: 'port', port: true, vp: 8, ic: 3, owner: 'uk' },
    { id: 'port_moresby', name: '莫尔兹比港', lon: 147.18, lat: -9.44, theater: 'pacific', terrain: 'jungle', port: true, vp: 10, ic: 2, owner: 'uk' },
    { id: 'rabaul', name: '拉包尔', lon: 152.17, lat: -4.20, theater: 'pacific', terrain: 'port', port: true, vp: 10, ic: 3, owner: 'japan' },
    // ── 精细扩充：北美大陆 ──
    { id: 'boston', name: '波士顿', lon: -71.06, lat: 42.36, theater: 'america', terrain: 'port', port: true, vp: 12, ic: 14, owner: 'usa' },
    { id: 'chicago', name: '芝加哥', lon: -87.63, lat: 41.88, theater: 'america', terrain: 'urban', port: false, vp: 14, ic: 18, owner: 'usa' },
    { id: 'new_orleans', name: '新奥尔良', lon: -90.07, lat: 29.95, theater: 'america', terrain: 'port', port: true, vp: 10, ic: 10, owner: 'usa' },
    { id: 'los_angeles', name: '洛杉矶', lon: -118.24, lat: 34.05, theater: 'america', terrain: 'port', port: true, vp: 14, ic: 16, owner: 'usa' },
    { id: 'seattle', name: '西雅图', lon: -122.33, lat: 47.61, theater: 'america', terrain: 'port', port: true, vp: 10, ic: 12, owner: 'usa' },
    { id: 'halifax', name: '哈利法克斯', lon: -63.57, lat: 44.65, theater: 'america', terrain: 'port', port: true, vp: 10, ic: 6, owner: 'uk' },
  ];

  // 全球干线铁路(rail) + 公路通道(land) + 跨海战略航线(sea) —— 与国内战场同款三级交通补给网
  const routes = [
    // 西欧干线铁路与英吉利海峡
    ['london', 'dunkirk', 'sea'], ['london', 'cherbourg', 'sea'], ['london', 'gibraltar', 'sea'], ['london', 'new_york', 'sea'], ['london', 'ottawa', 'sea'],
    ['dunkirk', 'paris', 'rail'], ['dunkirk', 'sedan', 'rail'], ['cherbourg', 'paris', 'rail'], ['paris', 'sedan', 'rail'],
    ['paris', 'maginot', 'rail'], ['paris', 'marseille', 'rail'], ['sedan', 'ruhr', 'land'], ['sedan', 'maginot', 'rail'],
    ['maginot', 'munich', 'rail'], ['marseille', 'rome', 'rail'], ['marseille', 'tunis', 'sea'], ['marseille', 'gibraltar', 'sea'],
    ['ruhr', 'hamburg', 'rail'], ['ruhr', 'berlin', 'rail'], ['ruhr', 'munich', 'rail'], ['hamburg', 'berlin', 'rail'],
    ['berlin', 'munich', 'rail'], ['berlin', 'warsaw', 'rail'], ['munich', 'rome', 'rail'], ['rome', 'naples', 'rail'],
    ['naples', 'tunis', 'sea'], ['naples', 'tripoli', 'sea'],
    // 东线欧亚大铁路与西伯利亚大铁路
    ['warsaw', 'minsk', 'rail'], ['warsaw', 'kiev', 'rail'], ['hamburg', 'leningrad', 'sea'],
    ['minsk', 'leningrad', 'rail'], ['minsk', 'moscow', 'rail'], ['minsk', 'kiev', 'rail'],
    ['leningrad', 'moscow', 'rail'], ['kiev', 'kursk', 'rail'], ['kiev', 'stalingrad', 'rail'],
    ['moscow', 'kursk', 'rail'], ['moscow', 'stalingrad', 'rail'], ['moscow', 'sverdlovsk', 'rail'],
    ['kursk', 'stalingrad', 'rail'], ['stalingrad', 'baku', 'rail'], ['stalingrad', 'sverdlovsk', 'rail'],
    ['sverdlovsk', 'vladivostok', 'rail'], ['baku', 'cairo', 'land'],
    // 北非沿海铁路与沙漠公路走廊
    ['gibraltar', 'casablanca', 'sea'], ['casablanca', 'tunis', 'rail'], ['tunis', 'tripoli', 'land'],
    ['tripoli', 'benghazi', 'land'], ['benghazi', 'tobruk', 'land'], ['tobruk', 'el_alamein', 'rail'],
    ['el_alamein', 'alexandria', 'rail'], ['alexandria', 'cairo', 'rail'], ['cairo', 'suez', 'rail'], ['suez', 'delhi', 'sea'],
    // 中国抗日主战场：中东/平汉/津浦/粤汉/沪宁铁路 + 滇缅公路
    ['vladivostok', 'shenyang', 'rail'], ['vladivostok', 'seoul', 'rail'], ['shenyang', 'seoul', 'rail'],
    ['shenyang', 'beiping', 'rail'], ['beiping', 'yanan', 'land'], ['beiping', 'nanjing', 'rail'], ['beiping', 'wuhan', 'rail'],
    ['yanan', 'wuhan', 'land'], ['yanan', 'chongqing', 'land'],
    ['shanghai', 'nanjing', 'rail'], ['shanghai', 'okinawa', 'sea'], ['nanjing', 'wuhan', 'rail'],
    ['wuhan', 'changsha', 'rail'], ['wuhan', 'chongqing', 'land'], ['changsha', 'guangzhou', 'rail'],
    ['changsha', 'chongqing', 'land'], ['changsha', 'kunming', 'land'], ['chongqing', 'kunming', 'land'],
    ['guangzhou', 'manila', 'sea'], ['kunming', 'rangoon', 'land'],
    // 北美横贯大铁路与跨太平洋跳岛航线
    ['new_york', 'washington', 'rail'], ['new_york', 'ottawa', 'rail'], ['new_york', 'detroit', 'rail'],
    ['washington', 'detroit', 'rail'], ['detroit', 'san_francisco', 'rail'],
    ['san_francisco', 'pearl_harbor', 'sea'], ['pearl_harbor', 'midway', 'sea'], ['pearl_harbor', 'guadalcanal', 'sea'],
    ['midway', 'iwo_jima', 'sea'], ['midway', 'tokyo', 'sea'], ['guadalcanal', 'sydney', 'sea'], ['guadalcanal', 'manila', 'sea'],
    // 日本东海道干线铁路与太平洋岛链
    ['tokyo', 'osaka', 'rail'], ['tokyo', 'iwo_jima', 'sea'], ['osaka', 'hiroshima', 'rail'],
    ['hiroshima', 'okinawa', 'sea'], ['hiroshima', 'seoul', 'sea'], ['iwo_jima', 'okinawa', 'sea'],
    ['okinawa', 'manila', 'sea'], ['manila', 'singapore', 'sea'], ['manila', 'jakarta', 'sea'],
    ['singapore', 'jakarta', 'sea'], ['singapore', 'rangoon', 'rail'], ['jakarta', 'sydney', 'sea'], ['rangoon', 'delhi', 'land'],
    // ── 精细扩充城镇连通网 ──
    ['london', 'portsmouth', 'rail'], ['london', 'birmingham', 'rail'], ['birmingham', 'liverpool', 'rail'], ['liverpool', 'edinburgh', 'rail'], ['liverpool', 'dublin', 'sea'],
    ['portsmouth', 'cherbourg', 'sea'], ['cherbourg', 'caen', 'rail'], ['caen', 'paris', 'rail'], ['caen', 'brest', 'rail'], ['brest', 'bordeaux', 'rail'], ['bordeaux', 'paris', 'rail'], ['bordeaux', 'madrid', 'rail'],
    ['paris', 'lyon', 'rail'], ['lyon', 'marseille', 'rail'], ['lyon', 'milan', 'rail'],
    ['dunkirk', 'brussels', 'rail'], ['brussels', 'antwerp', 'rail'], ['antwerp', 'amsterdam', 'rail'], ['brussels', 'sedan', 'rail'], ['amsterdam', 'ruhr', 'rail'], ['brussels', 'cologne', 'rail'],
    ['hamburg', 'kiel', 'rail'], ['kiel', 'copenhagen', 'sea'], ['copenhagen', 'oslo', 'sea'], ['copenhagen', 'stockholm', 'sea'], ['oslo', 'narvik', 'sea'], ['oslo', 'stockholm', 'rail'], ['stockholm', 'helsinki', 'sea'], ['helsinki', 'leningrad', 'rail'],
    ['ruhr', 'cologne', 'rail'], ['cologne', 'frankfurt', 'rail'], ['frankfurt', 'munich', 'rail'], ['frankfurt', 'berlin', 'rail'], ['berlin', 'dresden', 'rail'], ['dresden', 'prague', 'rail'], ['prague', 'vienna', 'rail'], ['munich', 'vienna', 'rail'],
    ['berlin', 'breslau', 'rail'], ['breslau', 'krakow', 'rail'], ['berlin', 'danzig', 'rail'], ['danzig', 'konigsberg', 'rail'], ['danzig', 'warsaw', 'rail'], ['warsaw', 'krakow', 'rail'],
    ['vienna', 'budapest', 'rail'], ['budapest', 'bucharest', 'rail'], ['budapest', 'belgrade', 'rail'], ['belgrade', 'sofia', 'rail'], ['sofia', 'bucharest', 'rail'], ['sofia', 'athens', 'rail'], ['sofia', 'istanbul', 'rail'],
    ['munich', 'milan', 'rail'], ['milan', 'venice', 'rail'], ['milan', 'rome', 'rail'], ['venice', 'vienna', 'rail'], ['naples', 'taranto', 'rail'], ['naples', 'palermo', 'sea'], ['palermo', 'tunis', 'sea'],
    ['madrid', 'barcelona', 'rail'], ['barcelona', 'marseille', 'rail'], ['madrid', 'lisbon', 'rail'], ['madrid', 'gibraltar', 'rail'],
    ['leningrad', 'murmansk', 'rail'], ['minsk', 'smolensk', 'rail'], ['smolensk', 'moscow', 'rail'], ['kiev', 'kharkov', 'rail'], ['kharkov', 'kursk', 'rail'], ['kharkov', 'rostov', 'rail'],
    ['kiev', 'odessa', 'rail'], ['odessa', 'bucharest', 'rail'], ['odessa', 'sevastopol', 'sea'], ['sevastopol', 'rostov', 'sea'], ['kursk', 'voronezh', 'rail'], ['voronezh', 'stalingrad', 'rail'],
    ['rostov', 'stalingrad', 'rail'], ['rostov', 'grozny', 'rail'], ['grozny', 'baku', 'rail'], ['moscow', 'kuibyshev', 'rail'], ['kuibyshev', 'sverdlovsk', 'rail'],
    ['sverdlovsk', 'novosibirsk', 'rail'], ['novosibirsk', 'irkutsk', 'rail'], ['irkutsk', 'ulaanbaatar', 'land'], ['irkutsk', 'khabarovsk', 'rail'], ['khabarovsk', 'vladivostok', 'rail'], ['khabarovsk', 'harbin', 'rail'],
    ['casablanca', 'oran', 'rail'], ['oran', 'algiers', 'rail'], ['algiers', 'tunis', 'rail'], ['istanbul', 'ankara', 'rail'], ['ankara', 'baghdad', 'rail'], ['baghdad', 'tehran', 'land'], ['tehran', 'baku', 'land'], ['baghdad', 'suez', 'land'],
    ['harbin', 'changchun', 'rail'], ['changchun', 'shenyang', 'rail'], ['shenyang', 'dalian', 'rail'], ['beiping', 'jinan', 'rail'], ['jinan', 'xuzhou', 'rail'], ['xuzhou', 'nanjing', 'rail'],
    ['beiping', 'taiyuan', 'rail'], ['taiyuan', 'yanan', 'land'], ['yanan', 'xian', 'land'], ['xian', 'lanzhou', 'rail'], ['xian', 'chengdu', 'land'], ['chengdu', 'chongqing', 'rail'],
    ['guangzhou', 'hong_kong', 'rail'], ['hong_kong', 'taipei', 'sea'], ['taipei', 'okinawa', 'sea'], ['taipei', 'manila', 'sea'],
    ['shenyang', 'pyongyang_ww2', 'rail'], ['pyongyang_ww2', 'seoul', 'rail'], ['seoul', 'pusan_ww2', 'rail'], ['pusan_ww2', 'fukuoka', 'sea'],
    ['tokyo', 'sendai', 'rail'], ['sendai', 'sapporo', 'rail'], ['tokyo', 'nagoya', 'rail'], ['nagoya', 'osaka', 'rail'], ['hiroshima', 'fukuoka', 'rail'], ['fukuoka', 'nagasaki', 'rail'],
    ['kunming', 'hanoi', 'rail'], ['hanoi', 'saigon', 'rail'], ['saigon', 'bangkok', 'land'], ['bangkok', 'rangoon', 'land'], ['bangkok', 'singapore', 'rail'],
    ['rangoon', 'mandalay', 'rail'], ['mandalay', 'kunming', 'land'], ['mandalay', 'calcutta', 'land'], ['calcutta', 'delhi', 'rail'], ['delhi', 'bombay', 'rail'], ['bombay', 'suez', 'sea'],
    ['jakarta', 'surabaya', 'rail'], ['surabaya', 'darwin', 'sea'], ['darwin', 'port_moresby', 'sea'], ['darwin', 'sydney', 'land'], ['port_moresby', 'rabaul', 'sea'], ['rabaul', 'guadalcanal', 'sea'],
    ['new_york', 'boston', 'rail'], ['boston', 'halifax', 'rail'], ['halifax', 'london', 'sea'], ['detroit', 'chicago', 'rail'], ['chicago', 'new_orleans', 'rail'], ['chicago', 'seattle', 'rail'], ['chicago', 'los_angeles', 'rail'], ['los_angeles', 'san_francisco', 'rail'], ['san_francisco', 'seattle', 'rail'],
  ];

  // 自动将所有扩充城市的默认归属补入各剧本 owners（未显式覆盖的新城沿用其历史 defaultOwner）
  for (const sc of scenarios) {
    for (const c of cities) {
      if (sc.owners && sc.owners[c.id] === undefined && c.owner) {
        sc.owners[c.id] = c.owner;
      }
    }
  }

  // HOI4 7 大战区相机预设（含独立中国抗日战场视角）
  const theaters = {
    global: { id: 'global', name: '🌍 全球总览', lonMin: -180, lonMax: 180, latMin: -56, latMax: 82 },
    europe: { id: 'europe', name: '🇪🇺 西欧与地中海', lonMin: -14, lonMax: 32, latMin: 30, latMax: 60 },
    east: { id: 'east', name: '☭ 苏德东线战场', lonMin: 16, lonMax: 68, latMin: 38, latMax: 66 },
    china: { id: 'china', name: '🇨🇳 中国抗日战场', lonMin: 94, lonMax: 136, latMin: 16, latMax: 46 },
    pacific: { id: 'pacific', name: '⚓ 太平洋与东南亚', lonMin: 92, lonMax: 180, latMin: -38, latMax: 52 },
    africa: { id: 'africa', name: '🏜️ 非洲与北非沙漠', lonMin: -14, lonMax: 44, latMin: 18, latMax: 42 },
    america: { id: 'america', name: '★ 北美与大西洋', lonMin: -136, lonMax: -46, latMin: 16, latMax: 58 },
  };

  const api = { factions, leaders, scenarios, cities, routes, theaters };
  globalThis.WW2Data = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
