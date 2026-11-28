(() => {
  'use strict';

  // 全球精细城市、州府、省会、军港与铁路枢纽站扩展库（与 ww2-data.js 合并后突破 430+ 城，与中国内战 410 城同级密度）
  // 字段简写：[id, name, lon, lat, theater, owner, terrain, port, vp, ic]
  const rawCities = [
    // ═══ 美国全部 50 州核心城市、州府、军港与铁路枢纽 ═══
    ['us_portland_me', '波特兰(缅因)', -70.26, 43.66, 'america', 'usa', 'port', true, 5, 4],
    ['us_manchester_nh', '曼彻斯特(新罕布什尔)', -71.45, 42.99, 'america', 'usa', 'plain', false, 4, 3],
    ['us_burlington_vt', '伯灵顿(佛蒙特)', -73.21, 44.48, 'america', 'usa', 'mountain', false, 4, 2],
    ['us_providence', '普罗维登斯(罗德岛)', -71.41, 41.82, 'america', 'usa', 'port', true, 5, 4],
    ['us_hartford', '哈特福德(康涅狄格)', -72.68, 41.76, 'america', 'usa', 'plain', false, 5, 5],
    ['us_buffalo', '布法罗(水牛城)', -78.88, 42.89, 'america', 'usa', 'urban', false, 6, 8],
    ['us_newark', '纽瓦克(新泽西)', -74.17, 40.74, 'america', 'usa', 'port', true, 6, 8],
    ['us_philadelphia', '费城(宾夕法尼亚)', -75.17, 39.95, 'america', 'usa', 'port', true, 10, 14],
    ['us_pittsburgh', '匹兹堡(钢都)', -79.99, 40.44, 'america', 'usa', 'urban', false, 9, 16],
    ['us_wilmington_de', '威尔明顿(特拉华)', -75.55, 39.74, 'america', 'usa', 'port', true, 4, 4],
    ['us_baltimore', '巴尔的摩(马里兰)', -76.61, 39.29, 'america', 'usa', 'port', true, 8, 10],
    ['us_norfolk', '诺福克军港(弗吉尼亚)', -76.29, 36.85, 'america', 'usa', 'port', true, 10, 8],
    ['us_richmond', '里士满(弗吉尼亚)', -77.44, 37.54, 'america', 'usa', 'plain', false, 6, 5],
    ['us_charleston_wv', '查尔斯顿(西弗吉尼亚)', -81.63, 38.35, 'america', 'usa', 'mountain', false, 5, 4],
    ['us_raleigh', '罗利(北卡罗来纳)', -78.64, 35.78, 'america', 'usa', 'plain', false, 5, 4],
    ['us_charlotte', '夏洛特(北卡)', -80.84, 35.23, 'america', 'usa', 'plain', false, 6, 5],
    ['us_charleston_sc', '查尔斯顿港(南卡)', -79.93, 32.78, 'america', 'usa', 'port', true, 6, 4],
    ['us_atlanta', '亚特兰大(佐治亚)', -84.39, 33.75, 'america', 'usa', 'urban', false, 9, 9],
    ['us_savannah', '萨凡纳港', -81.09, 32.08, 'america', 'usa', 'port', true, 5, 4],
    ['us_jacksonville', '杰克逊维尔(佛罗里达)', -81.66, 30.33, 'america', 'usa', 'port', true, 6, 5],
    ['us_miami', '迈阿密(佛罗里达)', -80.19, 25.76, 'america', 'usa', 'port', true, 8, 6],
    ['us_tampa', '坦帕港', -82.46, 27.95, 'america', 'usa', 'port', true, 5, 4],
    ['us_cleveland', '克利夫兰(俄亥俄)', -81.69, 41.50, 'america', 'usa', 'urban', false, 8, 12],
    ['us_columbus', '哥伦布(俄亥俄)', -82.99, 39.96, 'america', 'usa', 'plain', false, 6, 6],
    ['us_cincinnati', '辛辛那提', -84.51, 39.10, 'america', 'usa', 'river', false, 6, 7],
    ['us_indianapolis', '印第安纳波利斯', -86.16, 39.77, 'america', 'usa', 'plain', false, 7, 8],
    ['us_milwaukee', '密尔沃基(威斯康星)', -87.91, 43.04, 'america', 'usa', 'plain', false, 6, 7],
    ['us_minneapolis', '明尼阿波利斯(明尼苏达)', -93.27, 44.98, 'america', 'usa', 'plain', false, 7, 7],
    ['us_des_moines', '得梅因(艾奥瓦)', -93.62, 41.59, 'america', 'usa', 'plain', false, 5, 4],
    ['us_st_louis', '圣路易斯(密苏里)', -90.20, 38.63, 'america', 'usa', 'river', false, 8, 9],
    ['us_kansas_city', '堪萨斯城', -94.58, 39.10, 'america', 'usa', 'plain', false, 7, 6],
    ['us_omaha', '奥马哈(内布拉斯加)', -95.93, 41.26, 'america', 'usa', 'plain', false, 6, 5],
    ['us_wichita', '威奇托(堪萨斯)', -97.34, 37.69, 'america', 'usa', 'plain', false, 5, 6],
    ['us_fargo', '法戈(北达科他)', -96.79, 46.88, 'america', 'usa', 'plain', false, 4, 2],
    ['us_sioux_falls', '苏瀑(南达科他)', -96.73, 43.55, 'america', 'usa', 'plain', false, 4, 2],
    ['us_louisville', '路易斯维尔(肯塔基)', -85.76, 38.25, 'america', 'usa', 'river', false, 6, 6],
    ['us_nashville', '纳什维尔(田纳西)', -86.78, 36.16, 'america', 'usa', 'plain', false, 6, 5],
    ['us_memphis', '孟菲斯(田纳西)', -90.05, 35.15, 'america', 'usa', 'river', false, 6, 5],
    ['us_birmingham_al', '伯明翰(阿拉巴马)', -86.80, 33.52, 'america', 'usa', 'urban', false, 6, 7],
    ['us_jackson_ms', '杰克逊(密西西比)', -90.18, 32.30, 'america', 'usa', 'plain', false, 4, 3],
    ['us_little_rock', '小石城(阿肯色)', -92.29, 34.75, 'america', 'usa', 'plain', false, 5, 3],
    ['us_oklahoma_city', '俄克拉荷马城', -97.52, 35.47, 'america', 'usa', 'plain', false, 6, 6],
    ['us_dallas', '达拉斯(得克萨斯)', -96.80, 32.78, 'america', 'usa', 'urban', false, 9, 10],
    ['us_houston', '休斯敦(得州油港)', -95.37, 29.76, 'america', 'usa', 'port', true, 10, 12],
    ['us_san_antonio', '圣安东尼奥', -98.49, 29.42, 'america', 'usa', 'plain', false, 6, 5],
    ['us_denver', '丹佛(科罗拉多)', -104.99, 39.74, 'america', 'usa', 'mountain', false, 8, 7],
    ['us_cheyenne', '夏延(怀俄明)', -104.82, 41.14, 'america', 'usa', 'mountain', false, 4, 2],
    ['us_billings', '比灵斯(蒙大拿)', -108.50, 45.78, 'america', 'usa', 'mountain', false, 4, 2],
    ['us_boise', '博伊西(爱达荷)', -116.20, 43.62, 'america', 'usa', 'mountain', false, 4, 2],
    ['us_salt_lake', '盐湖城(犹他)', -111.89, 40.76, 'america', 'usa', 'mountain', false, 6, 5],
    ['us_albuquerque', '阿尔伯克基(新墨西哥)', -106.65, 35.08, 'america', 'usa', 'desert', false, 5, 4],
    ['us_phoenix', '菲尼克斯(亚利桑那)', -112.07, 33.45, 'america', 'usa', 'desert', false, 6, 4],
    ['us_las_vegas', '拉斯维加斯(内华达)', -115.14, 36.17, 'america', 'usa', 'desert', false, 5, 3],
    ['us_san_diego', '圣迭戈军港(加州)', -117.16, 32.72, 'america', 'usa', 'port', true, 10, 9],
    ['us_sacramento', '萨克拉门托(加州)', -121.49, 38.58, 'america', 'usa', 'plain', false, 5, 4],
    ['us_portland_or', '波特兰(俄勒冈)', -122.68, 45.52, 'america', 'usa', 'port', true, 7, 7],
    ['us_anchorage', '安克雷奇(阿拉斯加)', -149.90, 61.22, 'america', 'usa', 'port', true, 7, 3],

    // ═══ 加拿大与拉丁美洲核心城市与运河 ═══
    ['ca_montreal', '蒙特利尔', -73.57, 45.50, 'america', 'uk', 'port', true, 10, 10],
    ['ca_toronto', '多伦多', -79.38, 43.65, 'america', 'uk', 'urban', false, 10, 10],
    ['ca_quebec', '魁北克港', -71.21, 46.81, 'america', 'uk', 'port', true, 7, 5],
    ['ca_winnipeg', '温尼伯', -97.14, 49.90, 'america', 'uk', 'plain', false, 6, 5],
    ['ca_calgary', '卡尔加里', -114.07, 51.05, 'america', 'uk', 'mountain', false, 6, 5],
    ['ca_vancouver', '温哥华港', -123.12, 49.28, 'america', 'uk', 'port', true, 9, 8],
    ['mx_mexico_city', '墨西哥城', -99.13, 19.43, 'america', 'usa', 'mountain', false, 10, 8],
    ['mx_monterrey', '蒙特雷', -100.31, 25.69, 'america', 'usa', 'mountain', false, 6, 5],
    ['mx_veracruz', '韦拉克鲁斯港', -96.13, 19.17, 'america', 'usa', 'port', true, 6, 4],
    ['cu_havana', '哈瓦那', -82.36, 23.11, 'america', 'usa', 'port', true, 7, 4],
    ['pa_panama', '巴拿马运河', -79.52, 8.98, 'america', 'usa', 'port', true, 12, 4],
    ['co_bogota', '波哥大', -74.07, 4.71, 'america', 'usa', 'mountain', false, 7, 4],
    ['ve_caracas', '加拉加斯(油田)', -66.90, 10.48, 'america', 'usa', 'port', true, 8, 6],
    ['pe_lima', '利马', -77.04, -12.05, 'america', 'usa', 'port', true, 7, 4],
    ['cl_santiago', '圣地亚哥(智利)', -70.65, -33.45, 'america', 'usa', 'mountain', false, 8, 5],
    ['ar_buenos_aires', '布宜诺斯艾利斯', -58.38, -34.60, 'america', 'usa', 'port', true, 11, 8],
    ['br_rio', '里约热内卢', -43.17, -22.91, 'america', 'usa', 'port', true, 11, 8],
    ['br_sao_paulo', '圣保罗', -46.63, -23.55, 'america', 'usa', 'urban', false, 10, 9],
    ['br_recife', '累西腓港', -34.88, -8.05, 'america', 'usa', 'port', true, 7, 4],

    // ═══ 中国全部省会、直辖市与关键铁路/港口枢纽 ═══
    ['cn_qiqihar', '齐齐哈尔', 123.92, 47.35, 'china', 'japan', 'plain', false, 7, 5],
    ['cn_jiamusi', '佳木斯', 130.32, 46.80, 'china', 'japan', 'river', false, 6, 4],
    ['cn_mudanjiang', '牡丹江', 129.63, 44.55, 'china', 'japan', 'mountain', false, 7, 4],
    ['cn_jinzhou', '锦州(辽西走廊)', 121.13, 41.11, 'china', 'japan', 'plain', false, 8, 5],
    ['cn_dandong', '丹东(安东)', 124.38, 40.12, 'china', 'japan', 'port', true, 7, 5],
    ['cn_hohhot', '呼和浩特(归绥)', 111.75, 40.84, 'china', 'japan', 'plain', false, 7, 4],
    ['cn_baotou', '包头', 109.84, 40.66, 'china', 'japan', 'plain', false, 6, 4],
    ['cn_tianjin', '天津港', 117.20, 39.13, 'china', 'japan', 'port', true, 12, 10],
    ['cn_shijiazhuang', '石家庄', 114.51, 38.04, 'china', 'japan', 'plain', false, 9, 6],
    ['cn_tangshan', '唐山', 118.18, 39.63, 'china', 'japan', 'urban', false, 7, 7],
    ['cn_zhangjiakou', '张家口', 114.88, 40.81, 'china', 'japan', 'mountain', false, 7, 4],
    ['cn_datong', '大同', 113.30, 40.08, 'china', 'japan', 'mountain', false, 7, 5],
    ['cn_zhengzhou', '郑州', 113.62, 34.75, 'china', 'china', 'plain', false, 10, 6],
    ['cn_luoyang', '洛阳', 112.45, 34.62, 'china', 'china', 'plain', false, 8, 5],
    ['cn_qingdao', '青岛港', 120.38, 36.07, 'china', 'japan', 'port', true, 10, 8],
    ['cn_yantai', '烟台港', 121.45, 37.46, 'china', 'japan', 'port', true, 6, 4],
    ['cn_lianyungang', '连云港(海州)', 119.22, 34.60, 'china', 'japan', 'port', true, 6, 4],
    ['cn_hefei', '合肥', 117.23, 31.82, 'china', 'japan', 'plain', false, 8, 5],
    ['cn_hangzhou', '杭州', 120.15, 30.27, 'china', 'japan', 'urban', false, 10, 7],
    ['cn_ningbo', '宁波港', 121.55, 29.87, 'china', 'japan', 'port', true, 7, 5],
    ['cn_fuzhou', '福州', 119.30, 26.07, 'china', 'china', 'port', true, 8, 5],
    ['cn_xiamen', '厦门港', 118.09, 24.48, 'china', 'japan', 'port', true, 7, 5],
    ['cn_nanchang', '南昌', 115.86, 28.68, 'china', 'china', 'river', false, 9, 5],
    ['cn_hengyang', '衡阳', 112.57, 26.89, 'china', 'china', 'mountain', false, 8, 4],
    ['cn_guilin', '桂林', 110.29, 25.27, 'china', 'china', 'mountain', false, 8, 4],
    ['cn_nanning', '南宁', 108.37, 22.82, 'china', 'china', 'mountain', false, 8, 4],
    ['cn_haikou', '海口(海南)', 110.33, 20.04, 'china', 'japan', 'port', true, 7, 4],
    ['cn_guiyang', '贵阳', 106.63, 26.65, 'china', 'china', 'mountain', false, 8, 4],
    ['cn_yichang', '宜昌', 111.29, 30.69, 'china', 'china', 'river', false, 8, 4],
    ['cn_yinchuan', '银川', 106.23, 38.49, 'china', 'china', 'plain', false, 6, 3],
    ['cn_xining', '西宁', 101.78, 36.62, 'china', 'china', 'mountain', false, 6, 3],
    ['cn_urumqi', '迪化(乌鲁木齐)', 87.62, 43.83, 'china', 'china', 'mountain', false, 9, 4],
    ['cn_kashgar', '喀什', 75.99, 39.47, 'china', 'china', 'mountain', false, 6, 2],
    ['cn_lhasa', '拉萨', 91.11, 29.65, 'china', 'china', 'mountain', false, 8, 2],
    ['cn_kaohsiung', '高雄港', 120.30, 22.62, 'china', 'japan', 'port', true, 7, 5],

    // ═══ 欧洲全部国家首都、重点工业城、军港与干线火车站 ═══
    ['uk_glasgow', '格拉斯哥', -4.25, 55.86, 'europe', 'uk', 'port', true, 8, 10],
    ['uk_manchester', '曼彻斯特', -2.24, 53.48, 'europe', 'uk', 'urban', false, 8, 10],
    ['uk_newcastle', '纽卡斯尔', -1.61, 54.98, 'europe', 'uk', 'port', true, 7, 8],
    ['uk_cardiff', '加的夫', -3.18, 51.48, 'europe', 'uk', 'port', true, 6, 6],
    ['uk_plymouth', '普利茅斯军港', -4.14, 50.37, 'europe', 'uk', 'port', true, 7, 5],
    ['uk_dover', '多佛尔海峡', 1.31, 51.13, 'europe', 'uk', 'port', true, 7, 3],
    ['uk_belfast', '贝尔法斯特', -5.93, 54.60, 'europe', 'uk', 'port', true, 7, 6],
    ['fr_lille', '里尔', 3.06, 50.63, 'europe', 'france', 'urban', false, 7, 7],
    ['fr_calais', '加莱', 1.86, 50.95, 'europe', 'france', 'port', true, 7, 4],
    ['fr_le_havre', '勒阿弗尔港', 0.11, 49.49, 'europe', 'france', 'port', true, 7, 5],
    ['fr_nantes', '南特', -1.55, 47.22, 'europe', 'france', 'port', true, 6, 5],
    ['fr_toulouse', '图卢兹', 1.44, 43.60, 'europe', 'france', 'plain', false, 7, 6],
    ['fr_strasbourg', '斯特拉斯堡', 7.75, 48.57, 'europe', 'france', 'river', false, 8, 6],
    ['fr_metz', '梅斯要塞', 6.18, 49.12, 'europe', 'france', 'fort', false, 7, 4],
    ['fr_toulon', '土伦军港', 5.93, 43.12, 'europe', 'france', 'port', true, 8, 5],
    ['fr_dijon', '第戎', 5.04, 47.32, 'europe', 'france', 'plain', false, 5, 4],
    ['lu_luxembourg', '卢森堡', 6.13, 49.61, 'europe', 'france', 'forest', false, 6, 4],
    ['nl_rotterdam', '鹿特丹港', 4.48, 51.92, 'europe', 'france', 'port', true, 9, 8],
    ['nl_groningen', '格罗宁根', 6.57, 53.22, 'europe', 'france', 'plain', false, 5, 3],
    ['ch_bern', '伯尔尼(瑞士)', 7.45, 46.95, 'europe', 'uk', 'mountain', false, 7, 5],
    ['ch_zurich', '苏黎世', 8.54, 47.37, 'europe', 'uk', 'mountain', false, 8, 7],
    ['ch_geneva', '日内瓦', 6.14, 46.20, 'europe', 'uk', 'mountain', false, 7, 5],
    ['de_bremen', '不莱梅港', 8.80, 53.08, 'europe', 'germany', 'port', true, 8, 8],
    ['de_hannover', '汉诺威', 9.73, 52.37, 'europe', 'germany', 'plain', false, 7, 8],
    ['de_leipzig', '莱比锡', 12.37, 51.34, 'europe', 'germany', 'urban', false, 8, 9],
    ['de_stuttgart', '斯图加特', 9.18, 48.78, 'europe', 'germany', 'urban', false, 8, 10],
    ['de_nuremberg', '纽伦堡', 11.08, 49.45, 'europe', 'germany', 'urban', false, 8, 9],
    ['de_stettin', '什切青港', 14.55, 53.43, 'europe', 'germany', 'port', true, 7, 6],
    ['at_graz', '格拉茨', 15.44, 47.07, 'europe', 'germany', 'mountain', false, 6, 5],
    ['at_innsbruck', '因斯布鲁克', 11.40, 47.27, 'europe', 'germany', 'mountain', false, 6, 4],
    ['cz_brno', '布尔诺', 16.61, 49.20, 'europe', 'germany', 'plain', false, 6, 6],
    ['sk_bratislava', '布拉迪斯拉发', 17.11, 48.15, 'europe', 'germany', 'river', false, 7, 5],
    ['pl_poznan', '波兹南', 16.93, 52.41, 'east', 'uk', 'plain', false, 7, 5],
    ['pl_lodz', '罗兹', 19.46, 51.76, 'east', 'uk', 'urban', false, 7, 6],
    ['pl_lublin', '卢布林', 22.57, 51.25, 'east', 'uk', 'plain', false, 6, 4],
    ['ua_lviv', '利沃夫', 24.03, 49.84, 'east', 'uk', 'plain', false, 8, 5],
    ['se_gothenburg', '哥德堡', 11.97, 57.71, 'europe', 'uk', 'port', true, 7, 6],
    ['se_malmo', '马尔默', 13.00, 55.60, 'europe', 'uk', 'port', true, 6, 5],
    ['no_bergen', '卑尔根', 5.32, 60.39, 'europe', 'uk', 'port', true, 7, 4],
    ['no_trondheim', '特隆赫姆', 10.40, 63.43, 'europe', 'uk', 'port', true, 7, 4],
    ['is_reykjavik', '雷克雅未克(冰岛)', -21.94, 64.15, 'europe', 'uk', 'port', true, 8, 2],
    ['fi_turku', '图尔库', 22.27, 60.45, 'east', 'germany', 'port', true, 6, 4],
    ['fi_viipuri', '维堡(卡累利阿)', 28.75, 60.71, 'east', 'germany', 'fort', false, 7, 3],
    ['ee_tallinn', '塔林(爱沙尼亚)', 24.75, 59.44, 'east', 'ussr', 'port', true, 7, 4],
    ['lv_riga', '里加(拉脱维亚)', 24.11, 56.95, 'east', 'ussr', 'port', true, 8, 5],
    ['lt_vilnius', '维尔纽斯(立陶宛)', 25.28, 54.69, 'east', 'ussr', 'plain', false, 7, 4],
    ['it_turin', '都灵', 7.69, 45.07, 'europe', 'germany', 'urban', false, 8, 9],
    ['it_genoa', '热那亚港', 8.94, 44.41, 'europe', 'germany', 'port', true, 8, 7],
    ['it_bologna', '博洛尼亚', 11.34, 44.49, 'europe', 'germany', 'plain', false, 7, 6],
    ['it_florence', '佛罗伦萨', 11.25, 43.77, 'europe', 'germany', 'plain', false, 7, 5],
    ['it_trieste', '的里雅斯特', 13.78, 45.65, 'europe', 'germany', 'port', true, 7, 5],
    ['it_cagliari', '卡利亚里(撒丁岛)', 9.12, 39.22, 'europe', 'germany', 'port', true, 6, 3],
    ['mt_valletta', '瓦莱塔(马耳他)', 14.51, 35.90, 'europe', 'uk', 'port', true, 9, 2],
    ['es_seville', '塞维利亚', -5.98, 37.39, 'europe', 'germany', 'plain', false, 7, 5],
    ['es_valencia', '瓦伦西亚', -0.38, 39.47, 'europe', 'germany', 'port', true, 7, 5],
    ['es_bilbao', '毕尔巴鄂', -2.93, 43.26, 'europe', 'germany', 'port', true, 6, 5],
    ['pt_porto', '波尔图', -8.61, 41.15, 'europe', 'uk', 'port', true, 6, 4],
    ['hr_zagreb', '萨格勒布', 15.98, 45.81, 'europe', 'germany', 'plain', false, 7, 5],
    ['hr_split', '斯普利特港', 16.44, 43.51, 'europe', 'germany', 'port', true, 6, 3],
    ['ba_sarajevo', '萨拉热窝', 18.41, 43.86, 'europe', 'uk', 'mountain', false, 6, 3],
    ['al_tirana', '地拉那(阿尔巴尼亚)', 19.82, 41.33, 'europe', 'germany', 'mountain', false, 6, 2],
    ['gr_thessaloniki', '塞萨洛尼基', 22.94, 40.64, 'europe', 'uk', 'port', true, 7, 4],
    ['gr_crete', '伊拉克利翁(克里特岛)', 25.14, 35.34, 'europe', 'uk', 'port', true, 8, 2],
    ['ro_constanta', '康斯坦察港', 28.63, 44.16, 'east', 'germany', 'port', true, 7, 4],
    ['ro_cluj', '克卢日', 23.59, 46.77, 'east', 'germany', 'mountain', false, 6, 4],
    ['cy_nicosia', '尼科西亚(塞浦路斯)', 33.38, 35.19, 'africa', 'uk', 'port', true, 6, 2],

    // ═══ 苏联纵深、黑海高加索、中亚与西伯利亚大铁路各站 ═══
    ['su_arkhangelsk', '阿尔汉格尔斯克', 40.54, 64.54, 'east', 'ussr', 'port', true, 8, 5],
    ['su_petrozavodsk', '彼得罗扎沃茨克', 34.35, 61.79, 'east', 'ussr', 'forest', false, 6, 4],
    ['su_pskov', '普斯科夫', 28.33, 57.82, 'east', 'ussr', 'plain', false, 6, 4],
    ['su_novgorod', '诺夫哥罗德', 31.27, 58.52, 'east', 'ussr', 'forest', false, 6, 4],
    ['su_vitebsk', '维捷布斯克', 30.20, 55.19, 'east', 'ussr', 'forest', false, 7, 4],
    ['su_brest', '布列斯特要塞', 23.69, 52.09, 'east', 'ussr', 'fort', false, 8, 4],
    ['su_kishinev', '基希讷乌', 28.86, 47.01, 'east', 'ussr', 'plain', false, 6, 4],
    ['su_dnipro', '第聂伯罗', 35.05, 48.46, 'east', 'ussr', 'river', false, 8, 8],
    ['su_donetsk', '斯大林诺(顿涅茨克)', 37.80, 48.02, 'east', 'ussr', 'urban', false, 9, 10],
    ['su_kerch', '刻赤海峡', 36.47, 45.36, 'east', 'ussr', 'port', true, 7, 3],
    ['su_novorossiysk', '新罗西斯克', 37.77, 44.72, 'east', 'ussr', 'port', true, 7, 5],
    ['su_tula', '图拉(兵工城)', 37.62, 54.19, 'east', 'ussr', 'urban', false, 8, 8],
    ['su_yaroslavl', '雅罗斯拉夫尔', 39.87, 57.63, 'east', 'ussr', 'plain', false, 7, 7],
    ['su_gorky', '高尔基(下诺夫哥罗德)', 44.00, 56.33, 'east', 'ussr', 'urban', false, 10, 12],
    ['su_kazan', '喀山', 49.11, 55.79, 'east', 'ussr', 'urban', false, 9, 10],
    ['su_saratov', '萨拉托夫', 46.03, 51.53, 'east', 'ussr', 'river', false, 8, 7],
    ['su_astrakhan', '阿斯特拉罕', 48.04, 46.35, 'east', 'ussr', 'port', true, 7, 5],
    ['su_perm', '彼尔姆', 56.25, 58.01, 'east', 'ussr', 'urban', false, 8, 9],
    ['su_chelyabinsk', '车里雅宾斯克(坦克城)', 61.40, 55.16, 'east', 'ussr', 'urban', false, 11, 16],
    ['su_omsk', '鄂木斯克', 73.37, 54.99, 'east', 'ussr', 'plain', false, 9, 10],
    ['su_krasnoyarsk', '克拉斯诺亚尔斯克', 92.87, 56.01, 'east', 'ussr', 'forest', false, 8, 7],
    ['su_chita', '赤塔', 113.50, 52.03, 'east', 'ussr', 'mountain', false, 7, 5],
    ['su_ulan_ude', '乌兰乌德', 107.61, 51.83, 'east', 'ussr', 'mountain', false, 6, 4],
    ['su_blagoveshchensk', '海兰泡(布拉戈维申斯克)', 127.54, 50.28, 'china', 'ussr', 'river', false, 6, 4],
    ['su_magadan', '马加丹', 150.80, 59.56, 'pacific', 'ussr', 'port', true, 5, 3],
    ['su_kamchatka', '堪察加彼得罗巴甫洛夫斯克', 158.65, 53.02, 'pacific', 'ussr', 'port', true, 6, 3],
    ['su_tbilisi', '第比利斯', 44.79, 41.72, 'east', 'ussr', 'mountain', false, 8, 5],
    ['su_yerevan', '埃里温', 44.51, 40.18, 'east', 'ussr', 'mountain', false, 6, 4],
    ['su_tashkent', '塔什干', 69.24, 41.30, 'east', 'ussr', 'plain', false, 9, 7],
    ['su_almaty', '阿拉木图', 76.85, 43.22, 'east', 'ussr', 'mountain', false, 8, 6],
    ['su_ashgabat', '阿什哈巴德', 58.38, 37.96, 'east', 'ussr', 'desert', false, 6, 4],

    // ═══ 日本列岛全线城市与四大军港 ═══
    ['jp_yokohama', '横滨/横须贺军港', 139.64, 35.44, 'pacific', 'japan', 'port', true, 10, 10],
    ['jp_shizuoka', '静冈', 138.38, 34.98, 'pacific', 'japan', 'plain', false, 6, 5],
    ['jp_kyoto', '京都', 135.77, 35.01, 'pacific', 'japan', 'urban', false, 8, 6],
    ['jp_kobe', '神户港', 135.19, 34.69, 'pacific', 'japan', 'port', true, 9, 9],
    ['jp_okayama', '冈山', 133.93, 34.66, 'pacific', 'japan', 'plain', false, 6, 5],
    ['jp_sasebo', '佐世保军港', 129.72, 33.16, 'pacific', 'japan', 'port', true, 8, 6],
    ['jp_kagoshima', '鹿儿岛', 130.56, 31.60, 'pacific', 'japan', 'port', true, 7, 4],
    ['jp_takamatsu', '高松(四国)', 134.04, 34.34, 'pacific', 'japan', 'port', true, 6, 4],
    ['jp_niigata', '新潟港', 139.04, 37.92, 'pacific', 'japan', 'port', true, 7, 5],
    ['jp_kanazawa', '金泽', 136.66, 36.56, 'pacific', 'japan', 'plain', false, 6, 4],
    ['jp_aomori', '青森', 140.74, 40.82, 'pacific', 'japan', 'port', true, 7, 4],
    ['jp_hakodate', '函馆港', 140.73, 41.77, 'pacific', 'japan', 'port', true, 6, 4],

    // ═══ 中东、非洲、南亚、东南亚、澳新与太平洋岛链 ═══
    ['me_beirut', '贝鲁特', 35.50, 33.89, 'africa', 'france', 'port', true, 7, 4],
    ['me_damascus', '大马士革', 36.29, 33.51, 'africa', 'france', 'desert', false, 7, 4],
    ['me_jerusalem', '耶路撒冷', 35.21, 31.77, 'africa', 'uk', 'mountain', false, 8, 4],
    ['me_riyadh', '利雅得', 46.68, 24.71, 'africa', 'uk', 'desert', false, 7, 4],
    ['me_jeddah', '吉达港', 39.19, 21.49, 'africa', 'uk', 'port', true, 6, 3],
    ['me_aden', '亚丁港', 45.03, 12.79, 'africa', 'uk', 'port', true, 8, 3],
    ['me_basra', '巴士拉油港', 47.78, 30.51, 'africa', 'uk', 'port', true, 8, 6],
    ['me_tabriz', '大不里士', 46.29, 38.08, 'africa', 'ussr', 'mountain', false, 6, 4],
    ['me_kabul', '喀布尔', 69.17, 34.53, 'pacific', 'uk', 'mountain', false, 7, 3],
    ['af_khartoum', '喀土穆', 32.56, 15.50, 'africa', 'uk', 'desert', false, 7, 3],
    ['af_addis', '亚的斯亚贝巴', 38.75, 9.03, 'africa', 'germany', 'mountain', false, 8, 3],
    ['af_nairobi', '内罗毕', 36.82, -1.29, 'africa', 'uk', 'plain', false, 7, 3],
    ['af_dar', '达累斯萨拉姆', 39.28, -6.79, 'africa', 'uk', 'port', true, 6, 3],
    ['af_johannesburg', '约翰内斯堡', 28.05, -26.20, 'africa', 'uk', 'urban', false, 9, 8],
    ['af_cape_town', '开普敦港', 18.42, -33.92, 'africa', 'uk', 'port', true, 10, 6],
    ['af_durban', '德班港', 31.02, -29.86, 'africa', 'uk', 'port', true, 7, 4],
    ['af_lagos', '拉各斯', 3.38, 6.52, 'africa', 'uk', 'port', true, 7, 4],
    ['af_dakar', '达喀尔军港', -17.44, 14.72, 'africa', 'france', 'port', true, 8, 3],
    ['in_karachi', '卡拉奇港', 67.01, 24.86, 'pacific', 'uk', 'port', true, 9, 6],
    ['in_lahore', '拉合尔', 74.36, 31.55, 'pacific', 'uk', 'plain', false, 8, 5],
    ['in_hyderabad', '海得拉巴', 78.49, 17.39, 'pacific', 'uk', 'plain', false, 7, 5],
    ['in_bangalore', '班加罗尔', 77.59, 12.97, 'pacific', 'uk', 'plain', false, 7, 5],
    ['in_madras', '马德拉斯(金奈)', 80.27, 13.08, 'pacific', 'uk', 'port', true, 8, 6],
    ['lk_colombo', '科伦坡港', 79.86, 6.93, 'pacific', 'uk', 'port', true, 8, 4],
    ['bd_dhaka', '达卡', 90.41, 23.81, 'pacific', 'uk', 'river', false, 7, 4],
    ['bd_chittagong', '吉大港', 91.78, 22.36, 'pacific', 'uk', 'port', true, 7, 4],
    ['vn_haiphong', '海防港', 106.68, 20.84, 'pacific', 'france', 'port', true, 7, 4],
    ['vn_danang', '岘港', 108.21, 16.05, 'pacific', 'france', 'port', true, 6, 3],
    ['kh_phnom_penh', '金边', 104.92, 11.56, 'pacific', 'france', 'river', false, 6, 3],
    ['la_vientiane', '万象', 102.63, 17.97, 'pacific', 'france', 'jungle', false, 5, 2],
    ['my_kuala_lumpur', '吉隆坡', 101.69, 3.14, 'pacific', 'uk', 'jungle', false, 8, 5],
    ['id_medan', '棉兰(苏门答腊)', 98.67, 3.59, 'pacific', 'uk', 'jungle', false, 7, 4],
    ['id_palembang', '巨港(油田)', 104.75, -2.99, 'pacific', 'uk', 'port', true, 9, 7],
    ['id_balikpapan', '巴厘巴板(油港)', 116.83, -1.24, 'pacific', 'uk', 'port', true, 8, 6],
    ['id_makassar', '望加锡', 119.43, -5.14, 'pacific', 'uk', 'port', true, 7, 3],
    ['ph_cebu', '宿务(莱特湾)', 123.89, 10.32, 'pacific', 'usa', 'port', true, 8, 4],
    ['ph_davao', '达沃', 125.61, 7.07, 'pacific', 'usa', 'port', true, 7, 3],
    ['au_melbourne', '墨尔本', 144.96, -37.81, 'pacific', 'uk', 'port', true, 11, 10],
    ['au_brisbane', '布里斯班', 153.03, -27.47, 'pacific', 'uk', 'port', true, 9, 7],
    ['au_adelaide', '阿德莱德', 138.60, -34.93, 'pacific', 'uk', 'port', true, 7, 5],
    ['au_perth', '珀斯港', 115.86, -31.95, 'pacific', 'uk', 'port', true, 8, 5],
    ['au_canberra', '堪培拉', 149.13, -35.28, 'pacific', 'uk', 'plain', false, 8, 4],
    ['nz_auckland', '奥克兰', 174.76, -36.85, 'pacific', 'uk', 'port', true, 9, 5],
    ['nz_wellington', '惠灵顿', 174.78, -41.29, 'pacific', 'uk', 'port', true, 8, 4],
    ['pac_saipan', '塞班岛', 145.75, 15.18, 'pacific', 'japan', 'port', true, 9, 2],
    ['pac_guam', '关岛', 144.79, 13.44, 'pacific', 'usa', 'port', true, 9, 2],
    ['pac_truk', '特鲁克环礁', 151.85, 7.45, 'pacific', 'japan', 'port', true, 9, 2],
    ['pac_wake', '威克岛', 166.65, 19.28, 'pacific', 'usa', 'port', true, 7, 1],
  ];

  function applyWorldCitiesExt(WW2) {
    if (!WW2 || WW2.__worldExtApplied) return WW2;
    WW2.__worldExtApplied = true;
    const existingIds = new Set(WW2.cities.map((c) => c.id));
    const added = [];
    for (const [id, name, lon, lat, theater, owner, terrain, port, vp, ic] of rawCities) {
      if (existingIds.has(id)) continue;
      existingIds.add(id);
      const city = { id, name, lon, lat, theater, owner, terrain, port, vp, ic };
      WW2.cities.push(city);
      added.push(city);
    }

    // 构建去重连通边，自动把每座新城市接入最近 2–3 座真实邻近枢纽（避免孤立城，且不生成跨洋伪陆路）
    const linkSet = new Set();
    const keyOf = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    for (const [a, b] of WW2.routes) linkSet.add(keyOf(a, b));

    const addEdge = (a, b, kind) => {
      if (a === b) return;
      const k = keyOf(a, b);
      if (linkSet.has(k)) return;
      linkSet.add(k);
      WW2.routes.push([a, b, kind]);
    };

    const dist = (a, b) => {
      const dx = (a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
      const dy = a.lat - b.lat;
      return Math.hypot(dx, dy);
    };

    for (const c of added) {
      const candidates = WW2.cities
        .filter((o) => o.id !== c.id && Math.abs(o.lon - c.lon) < 60)
        .map((o) => ({ o, d: dist(c, o) }))
        .sort((x, y) => x.d - y.d);
      const maxLinks = c.vp >= 8 ? 3 : 2;
      let count = 0;
      for (const { o, d } of candidates) {
        if (count >= maxLinks) break;
        const isSea = (c.port && o.port && (d > 8 || (c.id.startsWith('pac_') || o.id.startsWith('pac_') || c.id.startsWith('nz_') || o.id.startsWith('nz_') || c.id.startsWith('uk_') !== o.id.startsWith('uk_') && Math.abs(c.lon - o.lon) > 2)));
        const kind = isSea ? 'sea' : d <= 10 ? 'rail' : 'land';
        addEdge(c.id, o.id, kind);
        count++;
      }
    }

    // 显式补齐跨大西洋/跨太平洋/澳洲-新西兰/拉美关键战略海运线
    const keySeaLinks = [
      ['us_norfolk', 'gibraltar', 'sea'], ['us_miami', 'cu_havana', 'sea'], ['cu_havana', 'pa_panama', 'sea'],
      ['pa_panama', 'us_san_diego', 'sea'], ['pa_panama', 'co_bogota', 'sea'], ['br_recife', 'af_dakar', 'sea'],
      ['af_cape_town', 'in_bombay', 'sea'], ['au_perth', 'in_colombo', 'sea'], ['au_sydney', 'nz_auckland', 'sea'],
      ['pac_guam', 'pac_saipan', 'sea'], ['pac_saipan', 'iwo_jima', 'sea'], ['pac_guam', 'manila', 'sea'],
      ['pac_truk', 'rabaul', 'sea'], ['pac_truk', 'pac_saipan', 'sea'], ['pac_wake', 'midway', 'sea'],
      ['pac_wake', 'pac_saipan', 'sea'], ['is_reykjavik', 'edinburgh', 'sea'], ['is_reykjavik', 'halifax', 'sea'],
      ['mt_valletta', 'palermo', 'sea'], ['mt_valletta', 'alexandria', 'sea'], ['gr_crete', 'athens', 'sea'],
      ['gr_crete', 'tobruk', 'sea'], ['us_anchorage', 'seattle', 'sea'], ['us_anchorage', 'su_kamchatka', 'sea'],
    ];
    for (const [a, b, kind] of keySeaLinks) {
      if (existingIds.has(a) && existingIds.has(b)) addEdge(a, b, kind);
    }

    // 为所有剧本补全扩充城市的阵营归属
    for (const sc of (WW2.scenarios || [])) {
      if (!sc.owners) continue;
      for (const c of added) {
        if (sc.owners[c.id] === undefined) sc.owners[c.id] = c.owner;
      }
    }
    return WW2;
  }

  if (globalThis.WW2Data) applyWorldCitiesExt(globalThis.WW2Data);
  globalThis.applyWorldCitiesExt = applyWorldCitiesExt;
  if (typeof module !== 'undefined' && module.exports) module.exports = { rawCities, applyWorldCitiesExt };
})();
