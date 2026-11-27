(() => {
  'use strict';

  const cities = [
    ['manzhouli','满洲里',117.43,49.60,'northeast','plain',2],
    ['hailar','海拉尔',119.74,49.21,'northeast','plain',2],
    ['qiqihar','齐齐哈尔',123.95,47.35,'northeast','plain',3],
    ['beian','北安',126.49,48.24,'northeast','plain',1],
    ['harbin','哈尔滨',126.64,45.76,'northeast','urban',6],
    ['jiamusi','佳木斯',130.36,46.81,'northeast','plain',2],
    ['mudanjiang','牡丹江',129.60,44.58,'northeast','hill',3],
    ['yanji','延吉',129.51,42.90,'northeast','hill',2],
    ['dunhua','敦化',128.23,43.37,'northeast','hill',2],
    ['jilin','吉林',126.55,43.84,'northeast','urban',4],
    ['changchun','长春',125.32,43.90,'northeast','urban',7],
    ['dehui','德惠',125.70,44.53,'northeast','plain',1],
    ['taonan','洮南',122.78,45.34,'northeast','plain',2],
    ['siping','四平',124.36,43.17,'northeast','urban',5],
    ['liaoyuan','西安（今辽源）',125.14,42.89,'northeast','hill',2],
    ['meihekou','梅河口',125.71,42.53,'northeast','plain',2],
    ['tonghua','通化',125.94,41.73,'northeast','hill',2],
    ['changtu','昌图',124.11,42.79,'northeast','plain',1],
    ['kaiyuan','开原',124.04,42.55,'northeast','plain',1],
    ['tieling','铁岭',123.84,42.29,'northeast','plain',3],
    ['faku','法库',123.41,42.50,'northeast','plain',1],
    ['zhangwu','彰武',122.53,42.39,'northeast','plain',1],
    ['fushun','抚顺',123.95,41.88,'northeast','urban',3],
    ['shenyang','沈阳',123.43,41.80,'northeast','urban',8],
    ['xinmin','新民',122.83,41.99,'northeast','plain',2],
    ['dahushan','大虎山',122.12,41.57,'northeast','plain',2],
    ['heishan','黑山',122.12,41.69,'northeast','hill',2],
    ['goubangzi','沟帮子',121.78,41.37,'northeast','plain',2],
    ['fuxin','阜新',121.66,42.02,'northeast','hill',2],
    ['xinlitun','新立屯',122.15,42.04,'northeast','plain',1,'辽宁'],
    ['yixian','义县',121.24,41.54,'northeast','hill',2],
    ['beipiao','北票',120.77,41.80,'northeast','hill',2],
    ['chaoyang','朝阳',120.45,41.57,'northeast','hill',3],
    ['lingyuan','凌源',119.40,41.24,'northeast','hill',1],
    ['jinzhou','锦州',121.13,41.11,'northeast','urban',7],
    ['tashan','塔山',120.96,40.92,'northeast','plain',2],
    ['huludao','锦西·葫芦岛',120.85,40.76,'northeast','port',4],
    ['xingcheng','兴城',120.72,40.61,'northeast','plain',1],
    ['suizhong','绥中',120.34,40.33,'northeast','plain',2],
    ['shanhaiguan','山海关',119.76,40.00,'northeast','hill',4],
    ['benxi','本溪',123.77,41.30,'northeast','hill',2],
    ['liaoyang','辽阳',123.18,41.27,'northeast','plain',2],
    ['anshan','鞍山',122.99,41.11,'northeast','urban',4],
    ['haicheng','海城',122.75,40.85,'northeast','plain',1],
    ['dashiqiao','大石桥',122.51,40.63,'northeast','plain',2],
    ['yingkou','营口',122.23,40.67,'northeast','port',4],
    ['andong','安东（今丹东）',124.39,40.13,'northeast','port',3],
    ['dalian','大连',121.64,38.93,'northeast','port',4,'辽宁'],
    ['lushun','旅顺',121.25,38.80,'northeast','port',2,'辽宁'],
    ['jinxian','金县（今金州）',121.72,39.10,'northeast','plain',2,'辽宁'],
    ['zhoushuizi','周水子',121.58,38.96,'northeast','plain',1,'辽宁'],
    ['chifeng','赤峰',118.89,42.26,'north','hill',2],
    ['chengde','承德',117.96,40.95,'north','hill',3],
    ['qinhuangdao','秦皇岛',119.60,39.94,'north','port',2],
    ['changli','昌黎',119.16,39.71,'north','plain',1],
    ['tangshan','唐山',118.18,39.63,'north','urban',3],
    ['tanggu','塘沽',117.66,39.02,'north','port',2,'天津'],
    ['tianjin','天津',117.20,39.13,'north','port',7],
    ['yangcun','杨村',117.05,39.38,'north','plain',1,'天津'],
    ['langfang','廊坊',116.70,39.52,'north','plain',2,'河北'],
    ['beiping','北平（今北京）',116.40,39.90,'north','urban',8,'北京'],
    ['xinbaoan','新保安',115.42,40.42,'north','hill',2],
    ['zhangjiakou','张家口',114.88,40.83,'north','hill',4],
    ['baoding','保定',115.47,38.87,'north','urban',3],
    ['shijiazhuang','石门（今石家庄）',114.51,38.05,'north','urban',5],
    ['handan','邯郸',114.49,36.62,'north','plain',3],
    ['datong','大同',113.30,40.08,'north','hill',4],
    ['guisui','归绥（今呼和浩特）',111.66,40.82,'north','urban',3],
    ['baotou','包头',110.01,40.63,'north','plain',2],
    ['taiyuan','太原',112.55,37.87,'north','urban',6],
    ['linfen','临汾',111.52,36.08,'north','plain',3],
    ['dezhou','德州',116.31,37.45,'east','plain',2],
    ['jinan','济南',117.00,36.65,'east','urban',6],
    ['weixian','潍县（今潍坊）',119.11,36.71,'east','plain',2],
    ['qingdao','青岛',120.39,36.07,'east','port',5],
    ['yantai','烟台',121.39,37.53,'east','port',3],
    ['linyi','临沂',118.35,35.05,'east','plain',3],
    ['zaozhuang','枣庄',117.56,34.86,'east','plain',2],
    ['lincheng','临城（今薛城）',117.26,34.79,'east','plain',2,'山东'],
    ['taierzhuang','台儿庄',117.73,34.56,'east','plain',2,'山东'],
    ['jiawang','贾汪',117.46,34.44,'east','plain',2,'江苏'],
    ['xuzhou','徐州',117.19,34.27,'east','urban',7],
    ['nianzhuang','碾庄圩',117.78,34.30,'east','plain',2,'江苏'],
    ['nianzhuangstation','碾庄站',117.82,34.30,'east','plain',1,'江苏'],
    ['yunhebridge','运河铁路桥',117.93,34.31,'east','plain',1,'江苏'],
    ['yaowan','窑湾',118.02,34.10,'east','plain',1,'江苏'],
    ['xinanzhen','新安镇（今新沂）',118.35,34.37,'east','plain',2,'江苏'],
    ['haizhou','海州（今连云港海州）',119.13,34.57,'east','plain',2,'江苏'],
    ['lianyungang','连云港（老港区）',119.46,34.73,'east','port',2,'江苏'],
    ['suxian','宿县（今宿州）',116.97,33.64,'east','plain',2,'安徽'],
    ['shuangduiji','双堆集',116.90,33.42,'east','plain',2,'安徽'],
    ['xiaoxian','萧县',116.94,34.19,'east','plain',1,'安徽'],
    ['chenguanzhuang','陈官庄',116.58,34.01,'east','plain',2,'河南'],
    ['yongcheng','永城',116.43,33.94,'east','plain',1,'河南'],
    ['liaocheng','聊城',115.99,36.46,'east','plain',2],
    ['heze','菏泽',115.48,35.24,'east','plain',2],
    ['shangqiu','商丘',115.66,34.44,'central','plain',3],
    ['kaifeng','开封',114.35,34.80,'central','urban',4],
    ['zhengzhou','郑州',113.63,34.75,'central','urban',5],
    ['luoyang','洛阳',112.45,34.62,'central','urban',4],
    ['xuchang','许昌',113.85,34.02,'central','plain',2],
    ['nanyang','南阳',112.53,33.00,'central','plain',3],
    ['xinyang','信阳',114.09,32.15,'central','hill',3],
    ['xuanhuadian','宣化店',114.47,31.92,'central','hill',2],
    ['xiangyang','襄阳',112.14,32.04,'central','plain',3],
    ['wuhan','武汉三镇',114.29,30.59,'central','urban',7],
    ['yichang','宜昌',111.29,30.70,'central','port',3],
    ['changsha','长沙',112.98,28.20,'central','urban',5],
    ['hengyang','衡阳',112.60,26.90,'central','urban',4],
    ['shaoyang','邵阳',111.47,27.24,'central','hill',2],
    ['bengbu','蚌埠',117.36,32.91,'east','plain',3],
    ['pukou','浦口',118.72,32.10,'east','port',2,'江苏'],
    ['hefei','合肥',117.28,31.86,'east','urban',3],
    ['huaiyin','淮阴（今淮安）',119.02,33.60,'east','plain',2],
    ['nanjing','南京',118.80,32.06,'east','urban',9],
    ['zhenjiang','镇江',119.45,32.20,'east','port',2],
    ['changzhou','常州',119.97,31.81,'east','plain',2],
    ['suzhou','苏州',120.59,31.30,'east','urban',4],
    ['shanghai','上海',121.47,31.23,'east','port',9],
    ['hangzhou','杭州',120.16,30.25,'east','urban',5],
    ['ningbo','宁波',121.55,29.87,'east','port',3],
    ['jinhua','金华',119.65,29.08,'east','hill',2],
    ['quzhou','衢州',118.87,28.94,'east','hill',2],
    ['wenzhou','温州',120.70,28.00,'east','port',2],
    ['jiujiang','九江',115.99,29.71,'east','port',3],
    ['nanchang','南昌',115.89,28.68,'east','urban',5],
    ['ganzhou','赣州',114.94,25.85,'east','hill',3],
    ['nanping','南平',118.18,26.64,'east','hill',2],
    ['fuzhou','福州',119.30,26.08,'east','port',5],
    ['quanzhou','泉州',118.68,24.87,'east','port',2],
    ['xiamen','厦门',118.09,24.48,'east','port',4],
    ['kinmen','金门',118.32,24.44,'taiwan','port',2],
    ['shantou','汕头',116.68,23.35,'south','port',3],
    ['shaoguan','韶关',113.60,24.81,'south','hill',3],
    ['guangzhou','广州',113.26,23.13,'south','port',7],
    ['zhanjiang','湛江',110.36,21.27,'south','port',3],
    ['xuwen','徐闻',110.17,20.33,'south','port',2,'广东'],
    ['haikou','海口',110.20,20.04,'south','port',4],
    ['yaxian','崖县（今三亚）',109.51,18.25,'south','port',2],
    ['guilin','桂林',110.29,25.27,'south','hill',4],
    ['liuzhou','柳州',109.41,24.33,'south','hill',3],
    ['wuzhou','梧州',111.30,23.48,'south','port',2],
    ['nanning','南宁',108.36,22.82,'south','urban',4],
    ['baise','百色',106.62,23.90,'south','hill',2],
    ['taoyuan','桃园',121.30,24.99,'taiwan','plain',2],
    ['taipei','台北',121.56,25.04,'taiwan','urban',7],
    ['keelung','基隆',121.74,25.13,'taiwan','port',4],
    ['taichung','台中',120.67,24.15,'taiwan','plain',3],
    ['tainan','台南',120.20,23.00,'taiwan','urban',3],
    ['kaohsiung','高雄',120.31,22.63,'taiwan','port',5],
    ['hualien','花莲',121.61,23.98,'taiwan','port',2],
    ['penghu','澎湖',119.57,23.57,'taiwan','port',2],
    ['yanan','延安',109.48,36.59,'northwest','hill',5],
    ['suide','绥德',110.26,37.50,'northwest','hill',2],
    ['yulin','榆林',109.73,38.28,'northwest','hill',2],
    ['luochuan','洛川',109.43,35.76,'northwest','hill',1],
    ['xian','西安',108.94,34.34,'northwest','urban',7],
    ['baoji','宝鸡',107.15,34.37,'northwest','hill',3],
    ['hanzhong','汉中',107.02,33.07,'northwest','hill',2],
    ['tianshui','天水',105.72,34.58,'northwest','hill',2],
    ['lanzhou','兰州',103.83,36.06,'northwest','urban',5],
    ['xining','西宁',101.78,36.62,'northwest','hill',3],
    ['yinchuan','银川',106.23,38.49,'northwest','plain',3],
    ['wuwei','武威',102.64,37.93,'northwest','hill',2],
    ['zhangye','张掖',100.45,38.93,'northwest','plain',2],
    ['jiuquan','酒泉',98.51,39.74,'northwest','plain',2],
    ['dihua','迪化（今乌鲁木齐）',87.62,43.82,'northwest','urban',4],
    ['hami','哈密',93.51,42.83,'northwest','plain',2],
    ['kashgar','喀什',75.99,39.47,'northwest','plain',2],
    ['guangyuan','广元',105.84,32.43,'southwest','hill',2],
    ['mianyang','绵阳',104.73,31.47,'southwest','hill',2],
    ['chengdu','成都',104.07,30.67,'southwest','urban',7],
    ['yaan','雅安',103.00,29.98,'southwest','hill',2],
    ['kangding','康定',101.96,30.05,'southwest','hill',2],
    ['leshan','乐山',103.77,29.58,'southwest','hill',2],
    ['yibin','宜宾',104.63,28.76,'southwest','port',2],
    ['chongqing','重庆',106.55,29.56,'southwest','port',7],
    ['wanxian','万县（今万州）',108.41,30.81,'southwest','port',2],
    ['zunyi','遵义',106.93,27.73,'southwest','hill',2],
    ['guiyang','贵阳',106.71,26.58,'southwest','urban',4],
    ['bijie','毕节',105.29,27.30,'southwest','hill',2],
    ['zhaotong','昭通',103.72,27.34,'southwest','hill',2],
    ['kunming','昆明',102.71,25.04,'southwest','urban',5],
    ['dali','大理',100.17,25.70,'southwest','hill',2],
    ['lijiang','丽江',100.23,26.88,'southwest','hill',2],
  ].map(([id,name,lon,lat,region,terrain,value,province]) => ({
    id,name,lon,lat,region,terrain:terrain === 'hill' ? 'mountain' : terrain,value,
    ...(province ? {province} : {}),
  }));

  // 长江、黄河沿线的主要渡口：进攻这些城镇会受渡河惩罚，「渡江准备」国策可抵消。
  const riverCities = ['lanzhou','baotou','zhengzhou','kaifeng','jinan','chongqing','yichang',
    'jingzhou','wuhan','jiujiang','anqing','nanjing','zhenjiang','changsha','nanchang'];
  for (const city of cities) if (riverCities.includes(city.id)) city.river = true;

  // 折线连接为游戏通道。铁路沿线节点采用当时地名或并列今名。
  const corridors = [
    'manzhouli hailar qiqihar harbin dehui changchun siping changtu kaiyuan tieling shenyang liaoyang anshan haicheng dashiqiao yingkou',
    'beian qiqihar taonan siping liaoyuan meihekou tonghua andong',
    'beian harbin jiamusi mudanjiang harbin',
    'mudanjiang dunhua yanji', 'dunhua jilin changchun', 'jilin meihekou',
    'tieling faku zhangwu fuxin beipiao chaoyang lingyuan chengde chifeng',
    'shenyang xinmin dahushan goubangzi jinzhou tashan huludao xingcheng suizhong shanhaiguan qinhuangdao changli tangshan tanggu tianjin',
    'jinzhou yixian beipiao', 'yixian fuxin heishan dahushan', 'yixian chaoyang', 'goubangzi yingkou',
    'dahushan xinlitun zhangwu', 'xinlitun heishan', 'xinmin xinlitun fuxin',
    'shenyang fushun benxi andong', 'shenyang benxi liaoyang', 'dashiqiao jinxian zhoushuizi dalian', 'zhoushuizi lushun', 'dalian lushun',
    'chifeng lingyuan', 'chengde beiping langfang yangcun tianjin', 'beiping xinbaoan zhangjiakou datong guisui baotou yinchuan lanzhou',
    'beiping baoding shijiazhuang handan zhengzhou xuchang xinyang xuanhuadian wuhan',
    'datong taiyuan linfen xian', 'taiyuan shijiazhuang', 'zhangjiakou chifeng', 'baotou yulin suide yanan luochuan xian',
    'tianjin dezhou jinan lincheng xuzhou suxian bengbu pukou nanjing zhenjiang changzhou suzhou shanghai',
    'jinan weixian qingdao yantai weixian', 'jinan liaocheng heze shangqiu', 'weixian linyi zaozhuang lincheng',
    'lianyungang haizhou xinanzhen yunhebridge nianzhuangstation xuzhou xiaoxian shangqiu kaifeng zhengzhou luoyang xian',
    'lincheng zaozhuang taierzhuang jiawang xuzhou', 'taierzhuang nianzhuang nianzhuangstation',
    'jiawang nianzhuangstation', 'nianzhuangstation yaowan xinanzhen linyi',
    'xiaoxian chenguanzhuang yongcheng shangqiu', 'xiaoxian suxian shuangduiji bengbu', 'xuzhou chenguanzhuang', 'yongcheng shuangduiji',
    'xuzhou huaiyin nanjing', 'bengbu hefei nanjing', 'kaifeng xuchang nanyang xiangyang yichang wuhan',
    'wuhan jiujiang nanchang ganzhou shaoguan guangzhou', 'wuhan changsha hengyang shaoguan', 'changsha nanchang',
    'nanjing hangzhou ningbo wenzhou fuzhou quanzhou xiamen shantou guangzhou',
    'hangzhou jinhua quzhou nanchang', 'quzhou nanping fuzhou', 'ganzhou nanping', 'ganzhou shantou',
    'kaohsiung tainan taichung taoyuan taipei keelung',
    'guangzhou wuzhou nanning baise kunming', 'guangzhou zhanjiang xuwen', 'haikou yaxian', 'zhanjiang nanning',
    'hengyang shaoyang guiyang', 'hengyang guilin liuzhou nanning', 'liuzhou wuzhou', 'liuzhou guiyang',
    'xian baoji tianshui lanzhou xining', 'lanzhou wuwei zhangye jiuquan hami dihua kashgar',
    'xian hanzhong guangyuan mianyang chengdu leshan yibin chongqing wanxian yichang',
    'chengdu yaan kangding lijiang dali kunming zhaotong yibin', 'chengdu chongqing zunyi guiyang bijie zhaotong', 'guiyang kunming',
  ];
  const railCorridors = [
    'manzhouli hailar qiqihar harbin dehui changchun siping changtu kaiyuan tieling shenyang liaoyang anshan haicheng dashiqiao jinxian zhoushuizi dalian',
    'qiqihar taonan siping liaoyuan meihekou tonghua', 'harbin jiamusi', 'harbin mudanjiang',
    'changchun jilin dunhua yanji', 'shenyang fushun', 'shenyang benxi andong', 'dashiqiao yingkou',
    'shenyang xinmin dahushan goubangzi jinzhou tashan huludao xingcheng suizhong shanhaiguan qinhuangdao changli tangshan tanggu tianjin',
    'dahushan xinlitun zhangwu', 'xinlitun fuxin yixian jinzhou', 'zhoushuizi lushun',
    'beiping xinbaoan zhangjiakou datong guisui baotou', 'beiping langfang yangcun tianjin',
    'beiping baoding shijiazhuang handan zhengzhou xuchang xinyang', 'shijiazhuang taiyuan',
    'tianjin dezhou jinan lincheng xuzhou suxian bengbu pukou', 'jinan weixian qingdao',
    'lianyungang haizhou xinanzhen yunhebridge nianzhuangstation xuzhou xiaoxian shangqiu kaifeng zhengzhou luoyang xian baoji',
    'lincheng zaozhuang', 'nanjing zhenjiang changzhou suzhou shanghai hangzhou jinhua quzhou nanchang',
    'wuhan changsha hengyang shaoguan guangzhou', 'kaohsiung tainan taichung taoyuan taipei keelung',
    'hengyang guilin liuzhou',
  ];
  const seaCorridors = [
    'xiamen kinmen', 'xiamen penghu kaohsiung', 'fuzhou keelung', 'shanghai keelung',
    'guangzhou kaohsiung', 'keelung hualien', 'xuwen haikou', 'tanggu huludao', 'yantai dalian',
  ];
  const routeTypes = {};
  for (const [type,paths] of [['land',corridors],['rail',railCorridors],['maritime',seaCorridors]]) {
    for (const path of paths) {
      const stops = path.split(' ');
      for (let i = 1; i < stops.length; i++) {
        routeTypes[[stops[i - 1],stops[i]].sort().join('|')] = type;
      }
    }
  }
  const links = Object.keys(routeTypes).map(pair => pair.split('|'));

  // 补充县级城镇：铁路干线之外也铺满节点。每座新城接入最近的两座城镇（陆路），
  // 其中交通枢纽另加一条铁路支线，避免“不在铁路边就没有城市”。
  const railIds = new Set(railCorridors.flatMap(path => path.split(' ')));
  const extraCities = [
    // 东北
    ['shuangcheng','双城',126.31,45.38,'northeast','plain',2],
    ['acheng','阿城',126.98,45.54,'northeast','plain',2],
    ['yilan-hl','依兰',129.58,46.32,'northeast','plain',1],
    ['fangzheng','方正',128.83,45.85,'northeast','plain',1],
    ['ningan','宁安',129.47,44.34,'northeast','plain',2],
    ['suifenhe','绥芬河',131.16,44.41,'northeast','mountain',2],
    ['tumen','图们',129.84,42.97,'northeast','plain',2],
    ['jiaohe','蛟河',127.34,43.72,'northeast','mountain',1],
    ['huadian','桦甸',126.75,42.97,'northeast','mountain',1],
    ['panshi','磐石',126.06,42.95,'northeast','mountain',1],
    ['liuhe','柳河',125.74,42.28,'northeast','mountain',1],
    ['qingyuan','清原',124.92,42.10,'northeast','mountain',1],
    ['xinbin','新宾',125.04,41.73,'northeast','mountain',1],
    ['huanren','桓仁',125.36,41.27,'northeast','mountain',1],
    ['kuandian','宽甸',124.78,40.73,'northeast','mountain',1],
    ['fengcheng','凤城',124.07,40.45,'northeast','mountain',2],
    ['xiuyan','岫岩',123.28,40.29,'northeast','mountain',1],
    ['gaizhou','盖州',122.35,40.40,'northeast','plain',2],
    ['taean','台安',122.43,41.39,'northeast','plain',1],
    ['liaozhong','辽中',122.73,41.51,'northeast','plain',1],
    ['kangping','康平',123.35,42.74,'northeast','plain',1],
    ['xifeng','西丰',124.72,42.74,'northeast','plain',1],
    ['lishu','梨树',124.33,43.31,'northeast','plain',2],
    ['shuangliao','双辽',123.50,43.52,'northeast','plain',1],
    ['qianguo','前郭',124.82,45.12,'northeast','plain',1],
    ['yushu','榆树',126.53,44.84,'northeast','plain',2],
    ['wuchang','五常',127.15,44.93,'northeast','plain',2],
    ['shulan','舒兰',126.95,44.41,'northeast','plain',1],
    ['jiutai','九台',125.84,44.15,'northeast','plain',1],
    ['nongan','农安',125.18,44.43,'northeast','plain',1],
    ['changling','长岭',123.97,44.28,'northeast','plain',1],
    ['tongyu','通榆',123.09,44.81,'northeast','plain',1],
    ['keshiketeng','经棚（克什克腾）',117.55,43.26,'northeast','plain',1],
    // 华北
    ['tongzhou','通州',116.66,39.91,'north','plain',2],
    ['liangxiang','良乡',116.14,39.73,'north','plain',1],
    ['zhuoxian','涿县',115.97,39.49,'north','plain',2],
    ['guan','固安',116.30,39.44,'north','plain',1],
    ['yongqing','永清',116.50,39.32,'north','plain',1],
    ['baxian','霸县',116.40,39.12,'north','plain',1],
    ['renqiu','任丘',116.10,38.71,'north','plain',1],
    ['hejian','河间',116.10,38.44,'north','plain',1],
    ['xianxian','献县',116.13,38.19,'north','plain',1],
    ['cangxian','沧县',116.87,38.31,'north','plain',2],
    ['qingxian','青县',116.83,38.58,'north','plain',1],
    ['jinghai','静海',116.93,38.95,'north','plain',1],
    ['wuqing','武清',117.06,39.38,'north','plain',2],
    ['baodi','宝坻',117.31,39.72,'north','plain',1],
    ['jixian','蓟县',117.41,40.05,'north','mountain',1],
    ['zunhua','遵化',117.96,40.19,'north','mountain',1],
    ['qianan','迁安',118.70,40.01,'north','plain',1],
    ['luanxian','滦县',118.70,39.75,'north','plain',1],
    ['laoting','乐亭',118.90,39.43,'north','plain',1],
    ['funing','抚宁',119.24,39.88,'north','plain',1],
    ['jining','集宁',113.10,41.03,'north','plain',2],
    ['fengzhen','丰镇',113.16,40.44,'north','plain',1],
    ['liangcheng','凉城',112.50,40.53,'north','plain',1],
    ['wuchuan','武川',111.46,41.10,'north','plain',1],
    ['xinghe','兴和',113.83,40.87,'north','plain',1],
    ['sarqi','萨拉齐',110.65,40.55,'north','plain',1],
    // 山东
    ['pingyuan','平原',116.43,37.16,'east','plain',1],
    ['yucheng','禹城',116.64,36.93,'east','plain',1],
    ['taian','泰安',117.09,36.19,'east','mountain',2],
    ['feicheng','肥城',116.77,36.25,'east','plain',1],
    ['yanzhou','兖州',116.83,35.55,'east','plain',2],
    ['qufu','曲阜',116.99,35.58,'east','plain',1],
    ['zoucheng','邹县',116.97,35.40,'east','plain',1],
    ['tengxian','滕县',117.15,35.09,'east','plain',2],
    ['yixian-sd','峄县',117.57,34.78,'east','plain',1],
    ['tancheng','郯城',118.35,34.61,'east','plain',1],
    ['mengyin','蒙阴',117.94,35.71,'east','mountain',1],
    ['yishui','沂水',118.63,35.79,'east','mountain',1],
    ['juxian','莒县',118.84,35.58,'east','plain',1],
    ['zhucheng','诸城',119.41,35.99,'east','plain',1],
    ['gaomi','高密',119.76,36.38,'east','plain',2],
    ['jiaoxian','胶县',120.03,36.27,'east','plain',2],
    ['jimo','即墨',120.45,36.39,'east','plain',1],
    ['penglai','蓬莱',120.76,37.81,'east','port',1],
    ['yexian','掖县',119.94,37.18,'east','plain',1],
    ['pingdu','平度',119.96,36.79,'east','plain',1],
    ['yidu','益都',118.48,36.70,'east','plain',2],
    ['guangrao','广饶',118.40,37.05,'east','plain',1],
    ['huimin','惠民',117.51,37.49,'east','plain',1],
    // 华中
    ['chaoxian','巢县',117.87,31.60,'east','plain',1],
    ['wuwei-ah','无为',117.91,31.30,'east','plain',1],
    ['lujiang','庐江',117.29,31.25,'east','plain',1],
    ['tongcheng','桐城',116.95,31.05,'east','plain',1],
    ['anqing','安庆',117.05,30.53,'east','port',2],
    ['qianshan','潜山',116.58,30.63,'east','mountain',1],
    ['liuan','六安',116.51,31.75,'east','plain',2],
    ['huoshan','霍山',116.33,31.39,'east','mountain',1],
    ['shouxian','寿县',116.78,32.58,'east','plain',1],
    ['fengtai','凤台',116.72,32.71,'east','plain',1],
    ['fuyang','阜阳',115.81,32.89,'east','plain',2],
    ['bozhou','亳州',115.78,33.87,'east','plain',2],
    ['guoyang','涡阳',116.22,33.51,'east','plain',1],
    ['mengcheng','蒙城',116.56,33.26,'east','plain',1],
    // 中原与中南
    ['huangpi','黄陂',114.37,30.88,'central','plain',1],
    ['xiaogan','孝感',113.92,30.92,'central','plain',2],
    ['yingcheng','应城',113.58,30.93,'central','plain',1],
    ['anlu','安陆',113.69,31.26,'central','plain',1],
    ['suixian','随县',113.38,31.69,'central','plain',1],
    ['zaoyang','枣阳',112.77,32.13,'central','plain',1],
    ['yicheng','宜城',112.26,31.72,'central','plain',1],
    ['gucheng','谷城',111.65,32.26,'central','plain',1],
    ['laohekou','老河口',111.67,32.39,'central','plain',1],
    ['jingmen','荆门',112.20,31.04,'central','plain',1],
    ['dangyang','当阳',111.79,30.82,'central','plain',1],
    ['jingzhou','荆州',112.24,30.33,'central','port',2],
    ['gongan','公安',112.23,30.06,'central','plain',1],
    ['jianli','监利',112.90,29.82,'central','plain',1],
    ['jiayu','嘉鱼',113.94,29.97,'central','plain',1],
    ['puqi','蒲圻（赤壁）',113.90,29.72,'central','plain',1],
    ['xianning','咸宁',114.33,29.85,'central','plain',1],
    ['yangxin','阳新',115.21,29.84,'central','mountain',1],
    ['macheng','麻城',115.03,31.18,'central','mountain',1],
    ['huanggang','黄冈',114.90,30.45,'central','plain',1],
    // 华南
    ['xiangtan','湘潭',112.94,27.85,'south','plain',2],
    ['xiangxiang','湘乡',112.53,27.73,'south','plain',1],
    ['ningxiang','宁乡',112.55,28.25,'south','plain',1],
    ['liuyang','浏阳',113.64,28.14,'south','plain',1],
    ['liling','醴陵',113.50,27.65,'south','plain',1],
    ['youxian','攸县',113.35,27.00,'south','plain',1],
    ['hengshan','衡山',112.87,27.23,'south','plain',1],
    ['leiyang','耒阳',112.86,26.42,'south','plain',1],
    ['qiyang','祁阳',111.84,26.58,'south','plain',1],
    ['lingling','零陵（永州）',111.61,26.42,'south','plain',2],
    ['daoxian','道县',111.60,25.53,'south','mountain',1],
    ['chenxian','郴县',113.01,25.77,'south','plain',2],
    ['yizhang','宜章',112.95,25.40,'south','mountain',1],
    ['xinhua','新化',111.30,27.73,'south','mountain',1],
    ['longhui','隆回',111.03,27.11,'south','mountain',1],
    ['wugang','武冈',110.63,26.73,'south','mountain',1],
    ['zhijiang','芷江',109.68,27.44,'south','mountain',1],
    ['yuanling','沅陵',110.39,28.46,'south','mountain',1],
    // 西南
    ['bishan','璧山',106.23,29.59,'southwest','plain',1],
    ['tongliang','铜梁',106.05,29.85,'southwest','plain',1],
    ['hechuan','合川',106.27,29.97,'southwest','plain',2],
    ['jiangjin','江津',106.25,29.29,'southwest','plain',1],
    ['yongchuan','永川',105.93,29.36,'southwest','plain',1],
    ['qijiang','綦江',106.65,29.03,'southwest','mountain',1],
    ['fuling','涪陵',107.39,29.70,'southwest','port',2],
    ['fengdu','丰都',107.73,29.86,'southwest','port',1],
    ['zhongxian','忠县',108.04,30.30,'southwest','port',1],
    ['kaixian','开县',108.39,31.16,'southwest','plain',1],
    ['yunyang','云阳',108.70,30.93,'southwest','port',1],
    ['fengjie','奉节',109.46,31.02,'southwest','port',1],
    ['daxian','达县',107.50,31.21,'southwest','plain',2],
    ['bazhong','巴中',106.75,31.87,'southwest','mountain',1],
    ['jiange','剑阁',105.52,32.29,'southwest','mountain',1],
    ['langzhong','阆中',106.00,31.58,'southwest','plain',1],
    ['nanchong','南充',106.11,30.84,'southwest','plain',2],
    ['suining','遂宁',105.59,30.53,'southwest','plain',1],
    ['shehong','射洪',105.39,30.87,'southwest','plain',1],
    ['santai','三台',105.09,31.10,'southwest','plain',1],
    ['jiangyou','江油',104.75,31.78,'southwest','mountain',1],
    ['maoxian','茂县',103.85,31.68,'southwest','mountain',1],
    // 西北
    ['xianyang','咸阳',108.71,34.33,'northwest','plain',2],
    ['wugong','武功',108.20,34.26,'northwest','plain',1],
    ['qianxian','乾县',108.24,34.53,'northwest','plain',1],
    ['jingyang','泾阳',108.84,34.53,'northwest','plain',1],
    ['sanyuan','三原',108.94,34.61,'northwest','plain',1],
    ['lintong','临潼',109.21,34.37,'northwest','plain',1],
    ['lantian','蓝田',109.32,34.15,'northwest','mountain',1],
    ['weinan','渭南',109.50,34.50,'northwest','plain',2],
    ['huayin','华阴',110.09,34.57,'northwest','plain',1],
    ['tongguan','潼关',110.25,34.54,'northwest','plain',2],
    ['dali-sn','大荔',109.94,34.80,'northwest','plain',1],
    ['hancheng','韩城',110.45,35.48,'northwest','plain',1],
    ['fuping','富平',109.18,34.75,'northwest','plain',1],
    ['tongchuan','同官（铜川）',109.09,35.09,'northwest','mountain',1],
    ['fuxian','鄜县（富县）',109.38,35.99,'northwest','plain',1],
    ['ganquan','甘泉',109.35,36.28,'northwest','mountain',1],
    ['qingjian','清涧',110.12,37.09,'northwest','mountain',1],
    ['mizhi','米脂',110.18,37.76,'northwest','plain',1],
    ['shenmu','神木',110.50,38.84,'northwest','plain',1],
    ['jingbian','靖边',108.79,37.60,'northwest','plain',1],
    ['dingbian','定边',107.60,37.59,'northwest','plain',1],
    ['yanchi','盐池',107.41,37.78,'northwest','plain',1],
    ['qingyang','庆阳',107.64,36.03,'northwest','plain',1],
    ['xunyi','旬邑',108.33,35.11,'northwest','plain',1],
    ['binxian','邠县（彬县）',108.09,35.04,'northwest','plain',1],
    ['changwu','长武',107.80,35.21,'northwest','plain',1],
    ['longxian','陇县',106.86,34.90,'northwest','mountain',1],
    ['fengxiang','凤翔',107.39,34.52,'northwest','plain',1],
    ['meixian','眉县',107.75,34.27,'northwest','plain',1],
    ['fengxian','凤县',106.52,33.91,'northwest','mountain',1],
    ['liuba','留坝',106.92,33.62,'northwest','mountain',1],
    ['chenggu','城固',107.33,33.15,'northwest','plain',1],
    ['yangxian','洋县',107.55,33.22,'northwest','plain',1],
    ['ankang','安康',109.03,32.69,'northwest','port',2],
    ['hanyin','汉阴',108.51,32.89,'northwest','plain',1],
    ['shiquan','石泉',108.25,33.04,'northwest','mountain',1],
    ['ziyang','紫阳',108.54,32.52,'northwest','mountain',1],
    ['xunyang','旬阳',109.37,32.83,'northwest','mountain',1],
    // 甘宁绥
    ['yuzhong','榆中',104.11,35.85,'northwest','plain',1],
    ['dingxi','定西',104.63,35.58,'northwest','plain',1],
    ['longxi','陇西',104.63,35.00,'northwest','plain',1],
    ['gangu','甘谷',105.33,34.73,'northwest','plain',1],
    ['qinan','秦安',105.67,34.86,'northwest','plain',1],
    ['qingshui','清水',106.14,34.75,'northwest','plain',1],
    ['pingliang','平凉',106.68,35.54,'northwest','plain',2],
    ['jingchuan','泾川',107.37,35.33,'northwest','plain',1],
    ['jingning','静宁',105.73,35.52,'northwest','plain',1],
    ['guyuan','固原',106.24,36.00,'northwest','plain',2],
    ['haiyuan','海原',105.65,36.56,'northwest','plain',1],
    ['tongxin','同心',105.91,36.98,'northwest','plain',1],
    ['zhongning','中宁',105.68,37.49,'northwest','plain',1],
    ['zhongwei','中卫',105.19,37.51,'northwest','plain',1],
    ['wuzhong','吴忠',106.20,37.99,'northwest','plain',1],
    ['wuyuan','五原',108.27,41.10,'north','plain',1],
    ['linhe','临河',107.39,40.75,'north','plain',1],
    ['tuoketuo','托克托',111.19,40.28,'north','plain',1],
    // 台湾
    ['hsinchu','新竹',120.97,24.80,'taiwan','plain',3],
    ['miaoli','苗栗',120.82,24.56,'taiwan','mountain',1],
    ['changhua','彰化',120.54,24.08,'taiwan','plain',2],
    ['chiayi','嘉义',120.45,23.48,'taiwan','plain',2],
    ['pingtung','屏东',120.49,22.67,'taiwan','plain',1],
    ['yilan','宜兰',121.75,24.75,'taiwan','plain',1],
    // 西藏与昌都高原通道
    ['chamdo','昌都',97.17,31.14,'southwest','mountain',3],
    ['nyingchi','林芝',94.36,29.65,'southwest','mountain',1],
    ['lhasa','拉萨',91.11,29.65,'southwest','urban',4],
    ['shigatse','日喀则',88.88,29.27,'southwest','mountain',2],
  ];
  const railTowns = new Set([
    'shuangcheng','acheng','ningan','suifenhe','jiaohe','panshi','lishu','shuangliao','yushu','wuchang',
    'jiutai','nongan','tongzhou','liangxiang','zhuoxian','cangxian','jinghai','wuqing','taian','yanzhou',
    'tengxian','gaomi','jiaoxian','yidu','xiaogan','xiangtan','xiangxiang','liling','hengshan','lingling',
    'chenxian','jiangjin','yongchuan','fuling','nanchong','xianyang','weinan','huayin','tongguan','dali-sn',
    'fuping','tongchuan','fuxian','mizhi','guyuan','zhongning','zhongwei','wuzhong','linhe','hsinchu',
    'changhua','chiayi',
  ]);
  const distance = (a, b) => Math.hypot(a.lon - b.lon, (a.lat - b.lat) * 1.25);
  const linkKey = (a, b) => [a, b].sort().join('|');
  const addLink = (a, b, type) => {
    const key = linkKey(a, b);
    if (a === b || routeTypes[key]) return;
    routeTypes[key] = type;
    links.push([a, b]);
  };
  for (const [id, name, lon, lat, region, terrain, value] of extraCities) {
    cities.push({ id, name, lon, lat, region, terrain, value });
  }
  for (const [id] of extraCities) {
    const city = cities.find(item => item.id === id);
    const others = cities.filter(item => item.id !== id);
    const nearest = others
      .map(other => ({ other, gap: distance(city, other) }))
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 2);
    for (const { other } of nearest) addLink(id, other.id, 'land');
    if (railTowns.has(id)) {
      const rail = others
        .filter(other => railIds.has(other.id) || railTowns.has(other.id))
        .map(other => ({ other, gap: distance(city, other) }))
        .sort((a, b) => a.gap - b.gap)[0];
      if (rail && rail.gap < 1.6) addLink(id, rail.other.id, 'rail');
    }
  }
  for (const [a, b] of [['kangding', 'chamdo'], ['chamdo', 'nyingchi'], ['nyingchi', 'lhasa'], ['lhasa', 'shigatse'], ['xining', 'lhasa']]) {
    addLink(a, b, 'land');
  }


  const sourcesById = {
    y1945: ['《中国共产党大事记·1945年》','https://cpc.people.com.cn/GB/64162/64164/4416000.html'],
    y1946: ['《中国共产党大事记·1946年》','https://cpc.people.com.cn/GB/64162/64164/4416003.html'],
    y1947: ['《中国共产党大事记·1947年》','https://cpc.people.com.cn/GB/64162/64164/4416005.html'],
    y1948: ['《中国共产党大事记·1948年》','https://cpc.people.com.cn/GB/64162/64164/4416006.html'],
    y1949: ['《中国共产党大事记·1949年》','https://cpc.people.com.cn/GB/64162/64164/4416007.html'],
    hunanPeace: ['湖南省文史研究馆《湖南和平解放口述历史选编》','https://css.hunan.gov.cn/css/tslm/hxws/wssy/201903/jnhnhpjf70zn/202303/t20230315_29274416.html'],
    y1950: ['《中国共产党大事记·1950年》','https://cpc.people.com.cn/GB/64162/64164/4416011.html'],
    century: ['《中国共产党一百年大事记》','https://www.mod.gov.cn/gfbw/qwfb/4888306.html?big=fan'],
    liaoshen: ['中国军网《辽沈战役（1948年）》','https://www.81.mil.cn/2018byzt/2018-07/31/content_9238264.htm'],
    orders: ['中国军网《辽沈战役指挥电报》','https://www.81.mil.cn/yljnt_208627/lsda_208656/16339459.html'],
    jinzhou: ['党史学习教育《辽沈战役：开启解放战争战略决战序幕》','https://cpc.people.com.cn/n1/2022/0531/c443712-32434528.html'],
    tashan: ['中国军网《塔山阻击战创造中外坚守防御战范例》','https://www.81.mil.cn/2018zt/2018-11/29/content_9360259.htm'],
    siping: ['中国军网《邓东哲：四战四平获嘉奖》','https://www.81.mil.cn/yl_208589/16316080.html'],
    sipingMuseum: ['四平战役纪念馆馆长杨树驰《四战四平》','https://www.mj.org.cn/zsjg/mzzzs/mzqk/2010/202001/t20200117_217193.htm'],
    fourBattles: ['中国社会科学院大学转载《四战四平为辽沈战役创造必要条件》','https://ztjy.ucass.edu.cn/info/1006/2132.htm'],
    changchun: ['黄埔军校同学会《难忘我的一九四八》','https://www.huangpu.org.cn/hpsy/201209/t20120921_3111426.html'],
    huaihai: ['中国军网《淮海战役（1948年－1949年）》','https://www.81.mil.cn/2018zt/2018-04/11/content_7992664.htm'],
    xinbaoan: ['邯郸党史网《新保安战役》','https://www.handandangshi.gov.cn/dianxingzhanyi/961.html'],
    taiwan: ['国史馆《公开第六批两蒋日记数字档》','https://www.drnh.gov.tw/p/406-1003-16087%2Cr62.php?Lang=zh-tw'],
    taiwanArchives: ['台湾档案管理局《中央政府迁台》','https://art.archives.gov.tw/tw/art/1484.html'],
    taiwanReception: ['台湾档案管理局《军事接收》','https://art.archives.gov.tw/tw/art/1752.html'],
    taiwanDefense: ['台湾数位典藏《台湾省防卫司令部孙立人到职视事及台湾省警备总司令部成立函件》','https://catalog.digitalarchives.tw/item/00/17/1f/61.html'],
    kinmen: ['台湾档案管理局《金门古宁头战役》','https://art.archives.gov.tw/tw/art/2062.html'],
    shandong: ['《山东省志·军事库·第三路军》','https://shandong-chorography.org/database/a/section/17/article/84/'],
    wuhua: ['《山东省志·共产党志》国民党军队统战与策反','https://shandong-chorography.org/database/g0/section/74/article/214/'],
    guangxi: ['国防部《大迂回追击歼敌的广西战役》','https://www.mod.gov.cn/gfbw/gfjy_index/15974588.html'],
    hengbao: ['中国军网《衡宝战役》','https://www.81.mil.cn/js_208592/16345016.html'],
    sichuan: ['成都政协文史资料（关于刘文辉及国民党第24军）','https://upload.cdcppcc.gov.cn/2023/0509/20230509022527157.pdf'],
    secondArmy: ['中国军网《中国人民解放军之第二野战军》','https://www.81.mil.cn/2018byzt/2018-07/31/content_8100032.htm'],
    lanzhou: ['兰州新区《兰州战役 解放大西北的关键一战》','https://www.lzxq.gov.cn/system/2021/02/19/030278051.shtml'],
    xuzhou: ['国防部《淮海战役：以60万战胜80万的战争奇迹》','https://www.mod.gov.cn/gfbw/gfjy_index/js_214151/4834146.html'],
    jilin: ['吉林省图书馆《吉林省历史编年》中华民国时期（1946—1949年9月）','https://www.jllib.com/szzy/jlsbnjs/201101/P020110118730824947128.pdf'],
    jinzhouNinth: ['中国共产党新闻网《为辽沈战役胜利铺下序笔》','https://cpc.people.com.cn/n1/2024/0602/c443712-40248418.html'],
    siege: ['央广网《长春，1948年的历史细节》','https://jl.cnr.cn/jjy/cc/201312/t20131209_514353935.shtml'],
    west: ['福建省民政厅《百年瞬间｜解放大西南》','https://mzt.fujian.gov.cn/ztzl/dsxxjy/zggcdbnsj/202111/t20211109_5770157.htm'],
    datong: ['大同市人民政府《传承古都历史文脉 弘扬文物时代价值》','https://www.dt.gov.cn/dtszf/bmdt/202410/06b6575acc50456eb35620eb67d81a06.shtml'],
    yulin: ['榆林市档案馆《榆林市馆藏革命历史档案概述》','https://www.ylsdag.com/article/1221104091845'],
    kaifeng: ['开封市《中共开封特别市委员会 开封特别市人民民主政府成立》','https://www.kflz.gov.cn/sitesources/kflzw/page_pc/zt/ddsshlxzczcf/articleb30dea9c233043069e1192c5406e5210.html'],
    reform: ['中国共产党新闻网《解放战争时期人民军队的统一整编》','https://cpc.people.com.cn/n1/2023/0109/c443712-32602393.html'],
    peng: ['《彭德怀大事年表（1940年—1949年）》','https://cpc.people.com.cn/GB/67481/71472/4844881.html'],
    liaodong: ['中国共产党新闻网《辽东保卫战的前前后后》','https://cpc.people.com.cn/n1/2024/0723/c443712-40283125.html'],
    neHistory: ['中国共产党新闻网《军史上三个黑龙江军区的由来》','https://dangshi.people.com.cn/n/2012/1119/c138896-19624737.html'],
    dalianCivil: ['大连图书馆藏大连、旅顺和金县政府建立史料','https://www.dl-library.net.cn/wenxian/dlnet/content.php?id=460593'],
    dalianNames: ['大连图书馆藏大连地名与建置沿革','https://www.dl-library.net.cn/wenxian/dlnet/content.php?id=248745'],
    lushunRail: ['辽宁省文化和旅游厅《旅顺火车站旧址》','https://whly.ln.gov.cn/whly/wlzt/lnww/zdwwbhdw/6EEEF867BB084C168B60CDCF10D2497F/index.shtml'],
    zhoushuizi: ['大连图书馆藏周水子火车站史料','https://www.dl-library.net.cn/wenxian/dlnet/content.php?id=350784'],
    liaoshenMap: ['新疆维吾尔自治区自然资源厅《辽沈战役要图》','https://zrzyt.xinjiang.gov.cn/xjgtzy/fypx/202109/68df62a5d4b44cd89e6cb27e42584e3e.shtml'],
    huaihaiMap: ['新疆维吾尔自治区自然资源厅《淮海战役要图》','https://zrzyt.xinjiang.gov.cn/xjgtzy/fypx/202109/70dd8b2c88494d2cb166023186c235e8.shtml'],
    pingjinMap: ['新疆维吾尔自治区自然资源厅《平津战役要图》','https://zrzyt.xinjiang.gov.cn/xjgtzy/fypx/202109/39b9be8586d44622aa4ef6849d28cc4b.shtml'],
    huaihaiRail: ['中国共产党新闻网《淮海战役前期的铁路争夺战》','https://cpc.people.com.cn/n1/2025/0310/c443712-40435278.html'],
    huaihaiCanal: ['河南省高级人民法院转载《决战淮海，大运河见证了哪些烽火硝烟》','https://www.hncourt.gov.cn/public/detail.php?id=186090'],
    shuangduiji: ['濉溪县人民政府《淮海战役双堆集战场旧址》','https://www.sxx.gov.cn/mhsx/sxgk/wwgj/60876940.html'],
    suxian: ['中国军网《攻克宿县》','https://www.81.mil.cn/js_208592/jdt_208593/16378876.html'],
    linchengRail: ['《薛城区志·铁路》','https://shandong-chorography.org/database/c42/section/1/article/222/'],
    nianzhuang: ['江苏文明网《淮海战役碾庄圩战斗纪念馆》','https://www.jsxc.gov.cn/zt/2026/qingming/jyl/xz/202203/t20220321_74798.shtml'],
    jiangsu: ['江苏党史网《江苏解放概况》','https://www.jsdsw.org.cn/web/detail/detail.html?id=1779'],
    beijing: ['全国政协《1949年全国政协大事记》','https://www.cppcc.gov.cn/zxww/2017/12/25/ARTI1514166497981494.shtml?from=singlemessage'],
  };
  const src = id => sourcesById[id][1];

  const cityHistory = {
    dalian:['1945年11月8日，大连市政府的成立大会举行，苏军仍对当地实行军事管制。1950年12月，原大连市、大连县等调整设立旅大市。','dalianNames'],
    lushun:['1945年8月苏军进驻旅顺。11月25日旅顺市政府成立。1950年旅大市设立后，旅顺市归其管辖。','dalianCivil'],
    jinxian:['县城在金州。1946年1月2日，金县政府在金州成立。','dalianCivil'],
    zhoushuizi:['南满铁路干线与旅顺铁路支线的衔接一带。','zhoushuizi'],
    lincheng:['津浦铁路和临枣支线的交会一带。历史战役记载称临城，现为枣庄市薛城区。','linchengRail'],
    xuzhou:['津浦铁路与陇海铁路在徐州交会。1948年11月淮海战役在徐州周边展开。','huaihaiRail'],
    nianzhuang:['今江苏省邳州市碾庄镇。淮海战役第一阶段，黄百韬第7兵团在碾庄圩一带被围。','nianzhuang'],
    nianzhuangstation:['陇海铁路沿线车站，与碾庄圩战斗位置分别标示。','huaihaiMap'],
    yunhebridge:['陇海铁路跨越大运河的历史通道，位于今邳州境内。1948年11月为撤退和追击的重要节点。','huaihaiCanal'],
    xinanzhen:['位于今新沂市境内。1948年11月淮海战役展开前，国民党军第7兵团驻于新安镇地区。','huaihaiCanal'],
    haizhou:['今连云港市海州区一带。淮海战役开始时，驻海州的第44军向新安镇撤离。','huaihaiCanal'],
    taierzhuang:['大运河沿岸城镇。淮海战役初期，国民党军第三绥靖区部分部队在台儿庄、贾汪一带起义。','huaihaiCanal'],
    jiawang:['台儿庄、徐州之间的运河前沿城镇，1948年11月何基沣、张克侠在这一带组织起义。','huaihaiCanal'],
    shuangduiji:['今安徽省濉溪县双堆集镇。淮海战役第二阶段，黄维第12兵团在这一地区被围。','shuangduiji'],
    chenguanzhuang:['今河南省永城市境内。杜聿明所部1948年12月自徐州撤离后，在该地周边遭包围。','huaihai'],
    pukou:['长江北岸的津浦铁路终点，隔江与南京相对。','huaihaiRail'],
    beiping:['平津战役期间称北平，1949年9月27日经全国政协会议决议改称北京。','beijing'],
  };
  for (const city of cities) {
    const history = cityHistory[city.id];
    if (history) [city.detail,city.source] = [history[0],src(history[1])];
  }

  const battleLayers = [
    {
      id:'liaoshen',name:'辽沈战役示意',source:src('liaoshenMap'),
      points:['jinzhou','yixian','tashan','huludao','shanhaiguan','suizhong','xingcheng','goubangzi','dahushan','heishan','xinlitun','xinmin','shenyang','changchun','yingkou'],
      paths:[
        {label:'北宁铁路辽西段',points:['shanhaiguan','suizhong','xingcheng','huludao','tashan','jinzhou','goubangzi','dahushan','xinmin','shenyang'],kind:'rail'},
        {label:'攻锦方向',points:['yixian','jinzhou'],kind:'advance'},
        {label:'塔山阻击地段',points:['tashan','jinzhou'],kind:'defense'},
        {label:'东进兵团援锦方向',points:['huludao','tashan'],kind:'advance'},
        {label:'西进兵团与辽西会战方向',points:['shenyang','xinmin','xinlitun','heishan','dahushan'],kind:'advance'},
        {label:'黑山、大虎山阻击地段',points:['heishan','dahushan'],kind:'defense'},
      ],
    },
    {
      id:'huaihai',name:'淮海战役示意',source:src('huaihaiMap'),
      points:['lincheng','taierzhuang','jiawang','xuzhou','nianzhuang','nianzhuangstation','yunhebridge','xinanzhen','haizhou','yaowan','suxian','shuangduiji','xiaoxian','chenguanzhuang','yongcheng','bengbu'],
      paths:[
        {label:'陇海铁路徐州至海州段',points:['xuzhou','nianzhuangstation','yunhebridge','xinanzhen','haizhou'],kind:'rail'},
        {label:'第7兵团西撤方向',points:['haizhou','xinanzhen','yunhebridge','nianzhuangstation','nianzhuang'],kind:'advance'},
        {label:'台儿庄、贾汪运河前沿',points:['taierzhuang','jiawang'],kind:'defense'},
        {label:'碾庄圩围歼区域',points:['nianzhuangstation','nianzhuang'],kind:'encirclement'},
        {label:'宿县与双堆集作战地区',points:['suxian','shuangduiji'],kind:'encirclement'},
        {label:'徐州国民党军部队西南撤退方向',points:['xuzhou','xiaoxian','chenguanzhuang'],kind:'advance'},
        {label:'陈官庄周边围歼区域',points:['chenguanzhuang','yongcheng'],kind:'encirclement'},
      ],
    },
    {
      id:'pingjin',name:'平津战役示意',source:src('pingjinMap'),
      points:['zhangjiakou','xinbaoan','beiping','langfang','yangcun','tianjin','tanggu','tangshan'],
      paths:[
        {label:'平绥铁路北平至张家口段',points:['beiping','xinbaoan','zhangjiakou'],kind:'rail'},
        {label:'国民党军第35军东返方向',points:['zhangjiakou','xinbaoan'],kind:'advance'},
        {label:'新保安阻截地段',points:['xinbaoan','beiping'],kind:'defense'},
        {label:'北宁铁路平津段及塘沽方向',points:['beiping','langfang','yangcun','tianjin','tanggu','tangshan'],kind:'rail'},
        {label:'北平、天津之间的分割范围',points:['beiping','langfang','yangcun','tianjin'],kind:'encirclement'},
      ],
    },
    {
      id:'xuzhou-line',name:'徐州铁路与徐蚌防御地段',source:src('huaihaiRail'),
      points:['lincheng','xuzhou','xiaoxian','nianzhuangstation','yunhebridge','xinanzhen','haizhou','suxian','bengbu','pukou'],
      paths:[
        {label:'津浦铁路徐州至浦口段',points:['xuzhou','suxian','bengbu','pukou'],kind:'rail'},
        {label:'津浦铁路临城至徐州段',points:['lincheng','xuzhou'],kind:'rail'},
        {label:'陇海铁路徐州枢纽',points:['xiaoxian','xuzhou','nianzhuangstation','yunhebridge','xinanzhen','haizhou'],kind:'rail'},
        {label:'战前徐蚌沿线重点防御地段',points:['xuzhou','suxian','bengbu'],kind:'defense'},
      ],
    },
  ];

  // 首都用于投降判断：若剧本开局未控制史实首都，引擎会退回首府城市中价值最高者。
  const capitals = { ccp: 'yanan', roc: 'nanjing' };

  const groups = [
    {id:'huzongnan',name:'胡宗南集团（中央军西北系）',side:'roc',region:'northwest',summary:'胡宗南统辖西安绥靖公署中央军主力，含第1军、第36军、第38军、第65军、第90军等二十余万人，身着国军青灰中正装。',source:src('y1947')},
    {id:'qingma',name:'青海马步芳集团（西北青马）',side:'roc',region:'northwest',summary:'西北二马之青海马步芳、马继援父子统领第82军、第129军及青海骑兵旅约8万余人，着国军羊皮翻领军服配马刀。',source:src('lanzhou')},
    {id:'ningma',name:'宁夏马鸿逵集团（西北宁马）',side:'roc',region:'northwest',summary:'西北二马之宁夏马鸿逵、马敦静统领宁夏兵团（第11军、第128军及骑兵旅）约5.4万人，驻防银川、吴忠与黄河沿线。',source:src('lanzhou')},
    {id:'xinjiang',name:'新疆警备总司令部',side:'roc',region:'northwest',summary:'陶峙岳统辖驻疆国军整编第42师、整编第78师及骑兵第1、第4师共约7.6万人，驻防迪化、喀什、哈密；1949年9月通电起义。',source:src('y1949')},
    {id:'xizang',name:'西藏噶厦地方藏军',side:'roc',region:'southwest',summary:'西藏地方噶厦军制以「代本」为团级建制，主力第1至第9代本约1万余人分驻拉萨、昌都、日喀则，昌都前线由阿沛·阿旺晋美统领。',source:src('y1950')},
    {id:'dianxi',name:'滇军（卢汉云南系）',side:'roc',region:'southwest',summary:'云南绥靖公署主任卢汉统辖第93军与驻滇第26军（余程万部）等部，佩戴标志性法式亚德里安钢盔与青天白日徽；1949年12月昆明起义。',source:src('y1949')},
    {id:'chuanxi',name:'川系（刘文辉·邓锡侯·杨森）',side:'roc',region:'southwest',summary:'川康地方实力派，含西康刘文辉第24军、川西邓锡侯第95军及重庆杨森第20军，着国军灰蓝棉布军装背竹斗笠。',source:src('sichuan')},
    {id:'guixi',name:'桂系（李宗仁·白崇禧）',side:'roc',region:'south',summary:'李宗仁、白崇禧统领的新桂系华中主力，核心含「钢七军」第7军、第48军、第46军等，战力强悍。',source:src('hengbao')},
    {id:'yuejun',name:'粤军（余汉谋·薛岳）',side:'roc',region:'south',summary:'广东绥靖公署余汉谋及海南薛岳统辖第62军、第63军、第64军等广东地方军，驻守广州、韶关、湛江与海南岛。',source:src('y1950')},
    {id:'jinsui',name:'晋绥军（阎锡山山西系）',side:'roc',region:'north',summary:'太原绥靖公署主任阎锡山统领的山西地方军系，辖第19军、第33军、第34军等部，固守太原、临汾、大同。',source:src('y1949')},
    {id:'suiyuan',name:'绥远集团（傅作义·董其武）',side:'roc',region:'north',summary:'傅作义、董其武统领的绥远晋察绥系统，辖王牌第35军、第104军、第111军及绥远骑兵旅。',source:src('xinbaoan')},
    {id:'luxi',name:'鲁系（吴化文整96军）',side:'roc',region:'east',summary:'韩复榘旧部延续的地方谱系，吴化文整编第96军驻守济南外围，1948年9月济南战役中起义。',source:src('wuhua')},
    {id:'northeast-army',name:'东北军（周福成第53军系）',side:'roc',region:'northeast',summary:'张学良旧东北军延续谱系，以周福成第8兵团及第53军为代表，驻防沈阳、抚顺。',source:src('jinzhou')},
    {id:'dongye',name:'东北野战军系统',side:'ccp',region:'northeast',summary:'辖第1至第12纵队及炮兵纵队，1949年春统一整编为第四野战军（第38至第49军等）。',source:src('reform')},
    {id:'huaye',name:'华东野战军系统',side:'ccp',region:'east',summary:'辖华野各主力纵队及特种兵纵队，参加孟良崮、济南、淮海战役，1949年整编为第三野战军。',source:src('y1949')},
    {id:'zhongye',name:'中原野战军系统',side:'ccp',region:'central',summary:'刘邓大军各主力纵队，参加挺进大别山、淮海、渡江及解放大西南，1949年整编为第二野战军。',source:src('secondArmy')},
    {id:'xibeiye',name:'西北野战军系统',side:'ccp',region:'northwest',summary:'彭德怀统领西野各纵队，1949年整编为第一野战军，发起扶郿、兰州战役席卷大西北。',source:src('lanzhou')},
    {id:'huabei',name:'华北军区野战兵团',side:'ccp',region:'north',summary:'聂荣臻、徐向前、杨得志等统领华北第1、2、3兵团各纵队，参加石门、新保安、太原战役。',source:src('y1949')},
  ];

  const leaders = [
    ['mao','毛泽东','ccp','中共中央、中央军委','参与制定内战期间的战略方针，1948年9月为中央军委起草辽沈战役指挥电报。','orders','mao-zedong.jpg'],
    ['zhu','朱德','ccp','中国人民解放军总司令','1949年4月与毛泽东共同发布向全国进军的命令。','y1949','zhu-de.jpg'],
    ['lin','林彪','ccp','东北野战军、第四野战军司令员','指挥东北野战军12个步兵纵队及炮兵纵队，参加辽沈、平津战役。','liaoshen','lin-biao.jpg'],
    ['luo','罗荣桓','ccp','东北野战军政治委员','与林彪共同领导东北野战军政治与战略筹划。','y1949','luo-ronghuan.jpg'],
    ['lyt','李天佑','ccp','东北野战军第1纵队（第38军）司令员','指挥东野头等主力第1纵队参加四平、辽西会战与天津攻坚。','fourBattles'],
    ['liuzhen','刘震','ccp','东北野战军第2纵队（第39军）司令员','指挥东野第2纵队参加锦州、辽西、沈阳及天津战役。','liaoshen'],
    ['hanxianchu','韩先楚','ccp','东北野战军第3纵队（第40军）司令员','绰号“旋风司令”，指挥第3纵队参加锦州攻坚、辽西突击与海南岛渡海战役。','liaoshen'],
    ['wu','吴克华','ccp','东北野战军第4纵队（第41军）司令员','辽沈战役中率第4纵队死守塔山六昼夜，阻截国民党东进兵团。','tashan'],
    ['wanyi','万毅','ccp','东北野战军第5纵队（第42军）司令员','指挥第5纵队参加辽西围歼战与平津战役。','liaoshen'],
    ['huangyongsheng','黄永胜','ccp','东北野战军第6纵队（第43军）司令员','指挥第6纵队参加辽西会战及渡江南下追击。','liaoshen'],
    ['denghua','邓华','ccp','东北野战军第7纵队（第44军）司令员','指挥第7纵队参加锦州南侧突破与海南岛战役。','liaoshen'],
    ['duansuquan','段苏权','ccp','东北野战军第8纵队（第45军）司令员','指挥第8纵队参加锦州封锁及天津攻坚。','jinzhou'],
    ['zhancaifang','詹才芳','ccp','东北野战军第9纵队（第46军）司令员','指挥第9纵队参加锦州攻坚并解放营口。','jinzhou'],
    ['liangxingchu','梁兴初','ccp','东北野战军第10纵队（第47军）司令员','辽沈战役中率第10纵队在黑山、大虎山阻击廖耀湘第9兵团。','jinzhou'],
    ['hejinnian','贺晋年','ccp','东北野战军第11纵队（第48军）司令员','指挥第11纵队在塔山侧翼锦西方向执行牵制阻援。','tashan'],
    ['xiao','萧劲光','ccp','东北野战军第1兵团兼第12纵队指挥','1948年主持长春围困与争取守军起义，后任第12兵团司令员。','changchun'],
    ['sujing','匡裕民','ccp','东北野战军特种炮兵纵队指挥','统辖东野机动重炮群，支援锦州、天津攻坚炮火准备。','liaoshen'],
    ['liu','刘伯承','ccp','中原野战军、第二野战军司令员','统率中野各纵队挺进大别山，指挥淮海、渡江与解放大西南。','secondArmy','liu-bocheng.jpg'],
    ['yangyong','杨勇','ccp','中原野战军第1纵队（第5兵团）司令员','指挥中野1纵参加淮海双堆集及进军贵州、四川。','huaihai'],
    ['chengeng','陈赓','ccp','中原野战军第4纵队（第4兵团）司令员','率陈谢集团转战豫西，参加淮海战役并远征广东、广西、云南。','secondArmy'],
    ['wangjinshan','王近山','ccp','中原野战军第6纵队（第12军）司令员','指挥中野主力第6纵队参加襄樊、淮海双堆集及重庆战役。','secondArmy'],
    ['su','粟裕','ccp','华东野战军代司令员兼代政治委员','指挥华东野战军各纵队发起济南、淮海、渡江与上海战役。','huaihai'],
    ['yefei','叶飞','ccp','华东野战军第1纵队（第10兵团）司令员','指挥华野1纵参加豫东、淮海碾庄圩及福建、厦门作战。','huaihai'],
    ['xushiyou','许世友','ccp','华东野战军山东兵团、第9纵队指挥','指挥济南攻城兵团攻克济南，后镇守胶东。','y1948'],
    ['wangjianan','王建安','ccp','华东野战军第8纵队（第7兵团）司令员','参加济南、淮海、渡江及杭州、舟山作战。','huaihai'],
    ['peng','彭德怀','ccp','西北野战军、第一野战军司令员','指挥西野各纵队转战陕北，1949年发起扶郿、兰州战役席卷大西北。','lanzhou','peng-dehuai.jpg'],
    ['zhangzongxun','张宗逊','ccp','西北野战军第1纵队、第一野战军副司令员','率西野第1纵队参加青化砭、沙家店、扶郿与兰州战役。','lanzhou'],
    ['wangzhen','王震','ccp','西北野战军第2纵队（第1兵团）司令员','率部血战渭北、攻克西宁，1949年秋率第一兵团挺进新疆迪化。','lanzhou'],
    ['xuguangda','许光达','ccp','西北野战军第3纵队（第2兵团）司令员','在兰州战役中率第2兵团强攻沈家岭、狗娃山打开胜利通道。','lanzhou'],
    ['nie','聂荣臻','ccp','华北军区司令员','统辖华北三大野战兵团，与林彪、罗荣桓组成平津前线总前委。','y1949'],
    ['xuxiangqian','徐向前','ccp','华北军区第1兵团（第18兵团）司令员','以劣势兵力连克临汾、晋中，围攻太原消灭阎锡山晋绥军主力。','y1949'],
    ['yangdezhi','杨得志','ccp','华北军区第2兵团（第19兵团）司令员','指挥清风店、石门与新保安围歼第35军，后入陕甘宁参加兰州、宁夏战役。','xinbaoan'],
    ['chiang','蒋介石','roc','国民政府主席、中华民国总统','战争期间调度各战区中央军与地方实力派。1949年12月飞抵台北。','taiwan','chiang-kai-shek.jpg'],
    ['wei','卫立煌','roc','东北“剿总”总司令','1948年统辖沈阳、锦州、长春国民党军，辽沈战败后撤职。','jinzhou','wei-lihuang.jpg'],
    ['fan','范汉杰','roc','东北“剿总”锦州指挥所主任','统辖第93军、新8军等守备锦州，1948年10月15日被俘。','jinzhou'],
    ['hou','侯镜如','roc','第17兵团司令官','指挥第39、54、62、92军等由葫芦岛登陆东进援锦，受阻于塔山。','jinzhou'],
    ['liao','廖耀湘','roc','第9兵团司令官','统率新1军、新6军等美械精锐西进兵团，辽西会战覆没被俘。','jinzhou'],
    ['zheng','郑洞国','roc','东北“剿总”副总司令兼第1兵团司令官','驻守长春，1948年10月率兵团部放下武器。','changchun','zheng-dongguo.jpg'],
    ['zeng','曾泽生','roc','滇军第60军军长','1948年10月17日率驻长滇军第60军三个师起义，改编为第50军。','jinzhou'],
    ['lihong','李鸿','roc','新编第7军军长','驻守长春的美械军军长，1948年10月19日率部投诚。','jinzhou'],
    ['zhou','周福成','roc','第8兵团兼第53军司令官','统领东北军系统的第53军等守备沈阳。','jinzhou'],
    ['du','杜聿明','roc','徐州“剿总”副总司令','指挥邱清泉、李弥、孙元良三大机动兵团在淮海决战。','huaihai','du-yuming.jpg'],
    ['huangbaitao','黄百韬','roc','第7兵团司令官','统辖第25、44、63、64、100军共约10万人，在碾庄圩覆没阵亡。','nianzhuang'],
    ['huangwei','黄维','roc','第12兵团司令官','统率第18军等中央军美械王牌自华中驰援徐州，在双堆集被围歼。','shuangduiji'],
    ['fu','傅作义','roc','华北“剿总”总司令','统领绥远系与华北中央军，1949年1月率北平20余万守军接受和平改编。','y1949'],
    ['dongqiwu','董其武','roc','绥远省主席兼西北军政副长官','傅作义嫡系大将，1949年9月19日在归绥率绥远军政部队通电起义。','y1949'],
    ['yanxishan','阎锡山','roc','太原绥靖公署主任','统治山西三十八年的晋绥军首领，所部在晋中与太原战役覆灭。','y1949'],
    ['wang','王耀武','roc','第二绥靖区司令官','指挥整编73师、整编2师及吴化文部守卫济南，城破被俘。','y1948'],
    ['wuhuawen','吴化文','roc','整编第96军军长','鲁系将领，1948年9月19日在济南战役关键时刻率2万人起义。','wuhua'],
    ['lizongren','李宗仁','roc','桂系首领、中华民国代总统','新桂系最高领袖，1949年1月蒋介石下野后任代总统。','hengbao'],
    ['bai','白崇禧','roc','华中军政长官','新桂系二号人物，统辖第7军、第48军等桂军精锐在华中与广西作战。','hengbao','bai-chongxi-1947.jpg'],
    ['yuhanmou','余汉谋','roc','广州绥靖公署主任','广东粤军首领，统辖第62、63、64军等粤系部队守备广东。','y1949'],
    ['xue','薛岳','roc','广东省主席、海南防卫总司令','粤军名将，1950年指挥5个军构筑“伯陵防线”防守海南岛。','y1950'],
    ['liuwen','刘文辉','roc','西康省主席兼第24军军长','川康实力派首领，驻防雅安、康定，1949年12月9日与邓锡侯联名彭县起义。','sichuan'],
    ['dengxihou','邓锡侯','roc','川陕甘边区绥靖公署主任（第95军系）','川军元老，统领川西第95军系部队，1949年12月率部起义。','sichuan'],
    ['yangsen','杨森','roc','重庆卫戍总司令（川军第20军系）','川军宿将，统辖第20军驻守重庆、万县，1949年末败退台湾。','west'],
    ['luhan','卢汉','roc','云南省主席兼云南绥靖公署主任','滇军统帅，统辖第93军及云南保安部队，1949年12月9日在昆明通电起义。','y1949'],
    ['yuchengwan','余程万','roc','第26军军长','驻防滇南、大理、蒙自一带，参加滇南战役。','y1950'],
    ['hu','胡宗南','roc','西安绥靖公署主任（“西北王”）','黄埔一期中央军统帅，统辖第1、36、38、65、90军等重兵集团盘踞关中。','y1947'],
    ['peichanghui','裴昌会','roc','第5兵团兼第7兵团司令官','胡宗南集团主力兵团司令，1949年12月在川北率部起义。','west'],
    ['mabufang','马步芳','roc','西北军政长官、青马首领','盘踞青海数十年的地方军阀，统领青马精锐骑步兵在兰州沈家岭、营盘岭死战。','lanzhou'],
    ['majiyuan','马继援','roc','陇东兵团司令官兼第82军军长','马步芳之子，青马前敌总指挥，率第82军、129军与第一野战军决战兰州。','lanzhou'],
    ['mahongkui','马鸿逵','roc','宁夏省主席、宁马首领','盘踞宁夏的地方军阀，与马步芳合称“西北二马”。','lanzhou'],
    ['madunjing','马敦静','roc','宁夏兵团司令官兼第11军军长','马鸿逵之子，统辖第11军、第128军及贺兰军布防银川、中宁。','lanzhou'],
    ['taoshiyue','陶峙岳','roc','新疆警备总司令','统辖驻新疆7万余国军，1949年9月25日率全疆官兵通电和平起义。','y1949'],
    ['ngapoi','阿沛·阿旺晋美','roc','西藏噶厦昌都总管','统领昌都前线各代本藏军，1950年昌都战役后作为首席全权代表签署《十七条协议》。','y1950'],
    ['sun','孙立人','roc','台湾省防卫司令官','抗日名将，1949年主持台湾新军整训与防务。','taiwanDefense'],
    ['zhongwei','钟伟','ccp','东北民主联军第3师第10旅、第12纵队司令员','参加四平作战，后任东野第12纵队（第49军）司令员。','fourBattles'],
    ['maren','马仁兴','ccp','保安第1旅旅长','参加四平保卫战与四平攻坚战，1947年6月壮烈牺牲。','siping'],
    ['chenmr','陈明仁','roc','第71军军长；长沙起义第1兵团司令官','四平守将；1949年8月与程潜率湖南第1兵团7.7万人长沙起义。','hunanPeace'],
    ['liuhd','刘翰东','roc','国民政府辽北省政府主席','1946年3月四平初次交战守将。','sipingMuseum'],
  ].map(([id,name,side,role,bio,source,photo]) => ({id,name,side,role,bio,source:src(source),...(photo ? {photo:`portraits/${photo}`} : {})}));

  // 数值和初始落点服务于游戏平衡，全国部队统一按纵队/军级独立拆分并标明下辖各师旅建制人数。
  const predecessorsByUnit = {
    'hb1':['jinji'],
    'r1':['r-1-war'],
    'roc-1c':['r1'],
    'north-command':['r-12-war'],
    'r71-siping':['army71early'],
    'nw7':['nw7-siping'],
    'nw1':['neda1-column'],
    'nw6':['neda6-column'],
    '4f-38':['nw1'],
    '4f-39':['nw2'],
    '4f-40':['nw3'],
    '4f-41':['nw4'],
    '4f-42':['nw5'],
    '4f-43':['nw6'],
    '3f-20':['hy1'],
    '3f-23':['hy4'],
    '3f-27':['hy9'],
    '2f-10':['zy1'],
    '2f-13':['zy4'],
    '2f-12':['zy6'],
    '1f-1':['xy1'],
    '1f-2':['xy2'],
    '1f-3':['xy3'],
    '1f-4':['xy4'],
    '1f-6':['xy6'],
  };

  // 下辖各师/旅/代本准确建制明细（总和对齐各纵队/军总兵力）
  const divisionsByUnit = {
    // 东北野战军第 1–12 纵队及炮纵
    'nw1': [['第1师', 11500], ['第2师', 11000], ['第3师', 10000]],
    'nw2': [['第4师', 11500], ['第5师', 11000], ['第6师', 10500]],
    'nw3': [['第7师', 11500], ['第8师', 11500], ['第9师', 11000]],
    'nw4': [['第10师（塔山英雄团）', 9500], ['第11师', 9500], ['第12师', 9000]],
    'nw5': [['第13师', 9500], ['第14师', 9500], ['第15师', 9000]],
    'nw6': [['第16师', 10500], ['第17师（攻坚老虎师）', 11000], ['第18师', 10000]],
    'nw7': [['第19师', 10500], ['第20师', 10000], ['第21师', 9500]],
    'nw8': [['第22师', 10000], ['第23师', 10000], ['第24师', 9500]],
    'nw9': [['第25师', 9500], ['第26师', 9500], ['第27师', 9500]],
    'nw10': [['第28师（黑山阻击主力）', 10500], ['第29师', 10500], ['第30师', 10000]],
    'nw11': [['第31师', 9000], ['第32师', 9000], ['第33师', 9000]],
    'nw12': [['第34师', 9500], ['第35师', 9000], ['第36师', 9000]],
    'nr-art': [['机动重炮第1团', 4500], ['机动重炮第2团', 4500], ['战车团（功臣号）', 4000]],
    // 第四野战军（1949年整编各军）
    '4f-38': [['第112师', 13500], ['第113师', 13000], ['第114师', 12500]],
    '4f-39': [['第115师', 13000], ['第116师', 12500], ['第117师', 12500]],
    '4f-40': [['第118师', 13000], ['第119师', 12500], ['第120师', 12500]],
    '4f-41': [['第121师', 12000], ['第122师', 11500], ['第123师', 11500]],
    '4f-42': [['第124师', 11500], ['第125师', 11000], ['第126师', 11000]],
    '4f-43': [['第127师', 12500], ['第128师', 12000], ['第129师', 11500]],
    // 华东野战军 / 第三野战军独立纵队
    'hy1': [['第1师', 10500], ['第2师', 10000], ['第3师', 9500]],
    'hy4': [['第10师', 9500], ['第11师', 9500], ['第12师', 9000]],
    'hy6': [['第16师', 9500], ['第17师', 9500], ['第18师', 9000]],
    'hy8': [['第22师', 9500], ['第23师', 9000], ['第24师', 9000]],
    'hy9': [['第25师', 10000], ['第26师', 9500], ['第27师', 9500]],
    'hy10': [['第28师', 9000], ['第29师', 9000], ['第30师', 8500]],
    'hy-art': [['华野特种炮兵团', 5000], ['华野战车大队', 4000], ['工兵团', 3500]],
    '3f-20': [['第58师', 11500], ['第59师', 11000], ['第60师', 11000]],
    '3f-23': [['第67师', 11000], ['第68师', 10500], ['第69师', 10500]],
    '3f-27': [['第79师', 11500], ['第80师', 11000], ['第81师', 11000]],
    // 中原野战军 / 第二野战军独立纵队
    'zy1': [['第1旅', 8000], ['第2旅', 7500], ['第20旅', 7500]],
    'zy2': [['第4旅', 7500], ['第5旅', 7000], ['第6旅', 7000]],
    'zy3': [['第7旅', 7500], ['第8旅', 7000], ['第9旅', 7000]],
    'zy4': [['第10旅', 9000], ['第11旅', 8500], ['第13旅', 8500]],
    'zy6': [['第16旅', 8000], ['第17旅', 8000], ['第18旅（肖永银旅）', 8000]],
    'zy9': [['第26旅', 7500], ['第27旅', 7500]],
    '2f-10': [['第28师', 10000], ['第29师', 9500], ['第30师', 9500]],
    '2f-12': [['第34师', 10500], ['第35师', 10000], ['第36师', 9500]],
    '2f-13': [['第37师', 11000], ['第38师', 10500], ['第39师', 10500]],
    // 西北野战军 / 第一野战军独立纵队与各军
    'xy1': [['第358旅', 8500], ['独立第1旅', 8000]],
    'xy2': [['第359旅', 9000], ['独立第4旅', 8500]],
    'xy3': [['独立第2旅', 7500], ['独立第5旅', 7500]],
    'xy4': [['警备第1旅', 7500], ['警备第3旅', 7000]],
    'xy6': [['教导旅', 7500], ['新编第4旅', 7000]],
    '1f-1': [['第1师', 9500], ['第2师', 9000], ['第3师', 9000]],
    '1f-2': [['第4师', 9500], ['第5师（原359旅）', 10000], ['第6师', 9000]],
    '1f-3': [['第7师', 9000], ['第8师', 8500], ['第9师', 8500]],
    '1f-4': [['第10师', 8500], ['第11师', 8500], ['第12师', 8000]],
    '1f-6': [['第16师', 8500], ['第17师', 8500]],
    // 华北军区第1、2、3兵团各纵队
    'hb1': [['华北第8纵队', 12000], ['华北第13纵队', 11500], ['华北第15纵队', 11000]],
    'hb2': [['华北第2纵队', 11000], ['华北第3纵队', 11500], ['华北第4纵队', 11000]],
    'hb3': [['华北第1纵队', 10500], ['华北第6纵队', 10500]],
    // 东北国民党军各兵团与军
    'rj-command': [['第93军（盛家兴）', 18500], ['新编第8军（沈向奎）', 18500]],
    'r17': [['第39军', 13000], ['第54军（阙汉骞）', 13500], ['第62军', 11000], ['独立第95师（华北赵子立）', 10500]],
    'r9': [['新编第1军（潘裕昆）', 16500], ['新编第6军（李涛）', 17500], ['第49军', 10000], ['第207师第3旅', 9000]],
    'r8': [['第53军第116师', 9000], ['第53军第130师', 8500], ['第207师主力', 8500]],
    'r60': [['第182师（白肇学）', 9000], ['第21师（陇耀）', 8500], ['暂编第52师', 8000]],
    'rnew7': [['新编第38师（陈鸣人）', 9500], ['暂编第56师', 7500], ['暂编第61师', 7000]],
    'r53': [['第116师', 10500], ['第130师', 10000]],
    // 胡宗南集团（中央军西安绥靖公署）
    'r1': [['整编第1师（天下第一师）', 19500], ['整编第27师', 18500], ['整编第90师', 18500]],
    'roc-1c': [['第1师', 10500], ['第78师', 9500], ['第167师', 9500]],
    'roc-36c': [['第28师', 9000], ['第123师', 8500], ['第165师', 8500]],
    'roc-38c': [['第17师', 9000], ['第55师', 8500], ['第177师', 8000]],
    'roc-65c': [['第154师', 9000], ['第160师', 8500], ['第187师', 8500]],
    'roc-90c': [['第53师', 9500], ['第61师', 9500], ['第24师', 8500]],
    // 西北二马：青海马步芳 & 宁夏马鸿逵
    'r82': [['第100师（谭呈祥）', 14500], ['第190师（马振武）', 13500], ['第248师（韩有禄）', 13000]],
    'r129': [['第357师（杨修戎）', 9500], ['新编第1师', 8500], ['青海骑兵第8旅（马英）', 8000]],
    'ma-cav': [['青海整编骑兵第8旅', 8500], ['青海骑兵第14旅', 8000]],
    'r11-ning': [['第168师（马光宗）', 10000], ['第189师（马世俊）', 9500], ['宁夏整编骑兵第10旅', 8500]],
    'r128-ning': [['第256师（卢忠良）', 9000], ['第356师', 8500], ['贺兰保安第1师', 8000]],
    // 新疆警备总司令部（陶峙岳）
    'xj-42': [['整编第42师第65旅', 14500], ['整编第42师第128旅', 14000], ['驻疆骑兵第1师（韩有文）', 13500]],
    'xj-78': [['整编第78师第179旅', 12000], ['整编第78师第227旅', 11500], ['南疆骑兵第4师', 10500]],
    // 西藏噶厦地方藏军（代本军制）
    'xz-chamdo': [['藏军第3代本', 1900], ['藏军第6代本', 1800], ['藏军第9代本（穆霞）', 1800]],
    'xz-lhasa': [['噶厦第1禁卫代本', 1800], ['第2代本', 1600], ['第4代本', 1600]],
    // 云南滇军（卢汉 / 余程万）
    'r93-dian': [['第277师', 10000], ['第278师', 9500], ['第279师', 9000]],
    'r26-dian': [['第93师（彭佐熙）', 9500], ['第161师', 9000], ['第193师（石补天）', 8500]],
    // 四川与西康川军（刘文辉 / 邓锡侯 / 杨森）
    'r24': [['第136师（伍培英）', 9500], ['第137师（陈光藻）', 9000], ['西康靖边独立旅', 8000]],
    'r95-chuan': [['第126师（谢无圻）', 10000], ['第225师', 9500], ['川西保安总队', 8500]],
    'r20-chuan': [['第133师（景嘉谟）', 13000], ['第134师（伍重严）', 12500]],
    // 广西桂军（李宗仁 / 白崇禧）
    'r7': [['第171师', 12000], ['第172师', 11500], ['第224师', 10500]],
    'r48': [['第138师（英德师）', 9500], ['第175师', 9000], ['第176师', 8500]],
    'r46-gui': [['第174师', 8500], ['第188师', 8500], ['新编第19师', 8000]],
    // 广东粤军（余汉谋 / 薛岳）
    'r62-yue': [['第95师', 9500], ['第151师', 9000], ['第157师', 9000]],
    'r63-yue': [['第152师', 8500], ['第186师', 8500], ['第321师', 8000]],
    'r64-yue': [['第131师', 9000], ['第156师', 8500], ['第159师', 8500]],
    // 山西晋绥军（阎锡山）与绥远集团（傅作义 / 董其武）
    'r19-jin': [['第68师', 10000], ['第274师', 9500], ['第277师', 9000]],
    'r33-jin': [['第71师', 8500], ['第275师', 8500], ['第280师', 8000]],
    'r34-jin': [['第73师', 8000], ['第278师', 8000], ['第279师', 7500]],
    'r35': [['第101师（郭景云虎头师）', 10500], ['第262师', 10000], ['第267师', 9500]],
    'suiyuan-111': [['第258师', 9500], ['第320师', 9000], ['整编骑兵第12旅', 8000]],
    'north-command': [['第16军', 17500], ['第92军', 17500], ['第94军', 17000]],
    // 华东与淮海中央军各兵团
    'r-jinan': [['整编第73师', 15000], ['整编第2师', 14000], ['保安第8旅', 13000]],
    'r96': [['整编第84师', 9000], ['独立旅', 8000]],
    'r-xuzhou': [['第2兵团（邱清泉第5军）', 24000], ['第13兵团（李弥第8军）', 22500], ['第16兵团（孙元良）', 21500]],
    'r7route': [['第25军（陈士章）', 13000], ['第44军', 11000], ['第64军（刘镇湘）', 12000], ['第100军', 11000]],
    'r12route': [['第18军（杨伯涛美械主力）', 16500], ['第10军（覃道善）', 13000], ['第14军（熊绶春）', 12500], ['第85军', 11000]],
    'hainan-defense': [['第32军', 10000], ['第62军残部', 9500], ['第64军残部', 9500], ['教导第2师', 9500]],
    'hunan-first': [['第100军起义部', 26000], ['第102军起义部', 25500], ['第103军起义部', 25500]],
  };

  const units = [
    // 东北早期与四平阶段
    ['ne-autonomous','东北人民自治军','ccp','yanji','lin',58000,'light','1945-10-31','1946-01-14','dongye','neHistory'],
    ['neda','东北民主联军第1师','ccp','siping','lin',18500,'light','1946-01-14','1946-08-01','dongye','jilin'],
    ['neda2','东北民主联军第2师','ccp','jilin','lin',16000,'light','1946-01-14','1946-08-01','dongye','jilin'],
    ['neda7','东北民主联军第7师','ccp','changchun','lin',14500,'light','1946-01-14','1946-08-01','dongye','jilin'],
    ['neda10-bde','东北民主联军第3师第10旅','ccp','taonan','zhongwei',6800,'light','1946-03-01','1946-05-19','dongye','fourBattles'],
    ['siping-security','保安第1旅','ccp','taonan','maren',5200,'light','1946-03-01','1946-05-19','dongye','siping'],
    ['r-liaobei','辽北省保安部队','roc','siping','liuhd',5600,'light','1946-01-01','1946-03-18',null,'sipingMuseum'],
    ['new1-early','新编第1军','roc','changtu',null,32000,'heavy','1946-03-01','1948-01-01',null,'jilin'],
    ['army71early','第71军','roc','kaiyuan',null,24500,'mixed','1946-03-01','1947-06-01',null,'jilin'],
    ['r71-siping','第71军','roc','siping','chenmr',27800,'mixed','1947-06-01','1948-03-01',null,'fourBattles'],
    ['r88','第71军第88师','roc','siping',null,16000,'mixed','1948-03-01','1948-03-14',null,'fourBattles'],
    ['neda1-column','东北民主联军第1纵队','ccp','taonan','lyt',31000,'mixed','1946-08-01','1948-01-01','dongye','fourBattles'],
    ['neda6-column','东北民主联军第6纵队','ccp','dehui','huangyongsheng',26500,'mixed','1947-05-01','1948-01-01','dongye','fourBattles'],
    ['nw7-siping','东北人民解放军第7纵队','ccp','taonan','denghua',28500,'mixed','1948-01-01','1948-09-12','dongye','fourBattles'],

    // 东北野战军第 1–12 独立纵队 + 炮兵纵队（全部独立可调遣！）
    ['nw1','东北野战军第1纵队','ccp','zhangwu','lyt',32500,'heavy','1948-01-01','1949-02-01','dongye','liaoshen'],
    ['nw2','东北野战军第2纵队','ccp','fuxin','liuzhen',33000,'heavy','1948-01-01','1949-02-01','dongye','liaoshen'],
    ['nw3','东北野战军第3纵队','ccp','yixian','hanxianchu',34000,'mixed','1948-01-01','1949-02-01','dongye','liaoshen'],
    ['nw4','东北野战军第4纵队','ccp','tashan','wu',28000,'mixed','1948-01-01','1949-02-01','dongye','tashan'],
    ['nw5','东北野战军第5纵队','ccp','faku','wanyi',28000,'mixed','1948-01-01','1949-02-01','dongye','liaoshen'],
    ['nw6','东北野战军第6纵队','ccp','liaoyuan','huangyongsheng',31500,'heavy','1948-01-01','1949-02-01','dongye','liaoshen'],
    ['nw7','东北野战军第7纵队','ccp','goubangzi','denghua',30000,'mixed','1948-09-12','1949-02-01','dongye','siping'],
    ['nw8','东北野战军第8纵队','ccp','beipiao','duansuquan',29500,'mixed','1948-01-01','1949-02-01','dongye','jinzhou'],
    ['nw9','东北野战军第9纵队','ccp','chaoyang','zhancaifang',28500,'mixed','1948-01-01','1949-02-01','dongye','jinzhou'],
    ['nw10','东北野战军第10纵队','ccp','heishan','liangxingchu',31000,'mixed','1948-01-01','1949-02-01','dongye','jinzhou'],
    ['nw11','东北野战军第11纵队','ccp','xingcheng','hejinnian',27000,'light','1948-01-01','1949-02-01','dongye','tashan'],
    ['nw12','东北野战军第12纵队','ccp','dehui','xiao',27500,'light','1948-06-01','1949-02-01','dongye','liaoshen'],
    ['nr-art','东北野战军炮兵纵队','ccp','yixian','sujing',13000,'heavy','1948-01-01','1949-02-01','dongye','liaoshen'],

    // 第四野战军（1949年2月整编后各主力军分开独立调遣）
    ['4f-38','第四野战军第38军','ccp','tianjin','lyt',39000,'heavy','1949-02-01',null,'dongye','y1949'],
    ['4f-39','第四野战军第39军','ccp','beiping','liuzhen',38000,'heavy','1949-02-01',null,'dongye','y1949'],
    ['4f-40','第四野战军第40军','ccp','langfang','hanxianchu',38000,'mixed','1949-02-01',null,'dongye','y1949'],
    ['4f-41','第四野战军第41军','ccp','tangshan','wu',35000,'mixed','1949-02-01',null,'dongye','y1949'],
    ['4f-42','第四野战军第42军','ccp','baoding','wanyi',33500,'mixed','1949-02-01',null,'dongye','y1949'],
    ['4f-43','第四野战军第43军','ccp','yangcun','huangyongsheng',36000,'heavy','1949-02-01',null,'dongye','y1949'],

    // 东北国民党军各兵团与军
    ['rj-command','东北“剿总”锦州指挥所','roc','jinzhou','fan',37000,'heavy','1948-03-01','1948-10-16',null,'jinzhou'],
    ['r17','第17兵团（东进援锦）','roc','huludao','hou',48000,'heavy','1948-09-12','1948-11-10',null,'jinzhou'],
    ['r9','第9兵团（廖耀湘美械集团）','roc','shenyang','liao',53000,'heavy','1948-01-01','1948-10-29','us','jinzhou'],
    ['r8','第8兵团（东北军系）','roc','shenyang','zhou',26000,'mixed','1948-01-01','1948-11-03','northeast-army','jinzhou'],
    ['r60','滇军第60军','roc','changchun','zeng',25500,'mixed','1947-06-01','1948-10-17','dianxi','jinzhou'],
    ['rnew7','新编第7军','roc','changchun','lihong',24000,'heavy','1948-01-01','1948-10-19','us','jinzhou'],
    ['r53','东北军第53军','roc','fushun',null,20500,'mixed','1946-06-01','1948-11-03','northeast-army','liaodong'],

    // 华北战区：华北野战兵团各部、傅作义绥远集团与阎锡山晋绥军
    ['jinji','晋察冀军区主力纵队','ccp','zhangjiakou','nie',38000,'light','1945-08-15','1948-05-01','huabei','y1947'],
    ['hb1','华北军区第1兵团（徐向前部）','ccp','linfen','xuxiangqian',34500,'mixed','1948-05-01',null,'huabei','y1949'],
    ['hb2','华北军区第2兵团（杨得志部）','ccp','shijiazhuang','yangdezhi',33500,'mixed','1948-05-01',null,'huabei','xinbaoan'],
    ['hb3','华北军区第3兵团','ccp','baoding','nie',21000,'light','1948-05-01',null,'huabei','y1949'],
    ['r-12-war','第12战区绥远军','roc','guisui','fu',52000,'mixed','1945-08-15','1947-12-01','suiyuan','y1945'],
    ['r35','绥远第35军（傅系王牌）','roc','zhangjiakou','fu',30000,'heavy','1946-01-01','1948-12-23','suiyuan','xinbaoan'],
    ['suiyuan-111','绥远警备第111军','roc','guisui','dongqiwu',26500,'mixed','1946-06-01',null,'suiyuan','y1949'],
    ['north-command','华北“剿总”直辖兵团','roc','beiping','fu',52000,'heavy','1947-12-01','1949-02-01','suiyuan','y1949'],
    ['r19-jin','晋绥军第19军','roc','taiyuan','yanxishan',28500,'mixed','1945-08-15','1949-04-25','jinsui','y1949'],
    ['r33-jin','晋绥军第33军','roc','taiyuan',null,25000,'mixed','1945-08-15','1949-04-25','jinsui','y1949'],
    ['r34-jin','晋绥军第34军','roc','datong',null,23500,'light','1945-08-15','1949-05-02','jinsui','datong'],

    // 华东战区：华东野战军各纵队分开调遣 + 第三野战军各军
    ['new-fourth','新四军华东主力','ccp','linyi','su',44000,'light','1945-08-15','1947-01-01','huaye','y1945'],
    ['hy1','华东野战军第1纵队','ccp','heze','yefei',30000,'heavy','1947-01-01','1949-02-01','huaye','huaihai'],
    ['hy4','华东野战军第4纵队','ccp','linyi','su',28000,'mixed','1947-01-01','1949-02-01','huaye','huaihai'],
    ['hy6','华东野战军第6纵队','ccp','taierzhuang',null,28000,'mixed','1947-01-01','1949-02-01','huaye','huaihai'],
    ['hy8','华东野战军第8纵队','ccp','liaocheng','wangjianan',27500,'mixed','1947-01-01','1949-02-01','huaye','huaihai'],
    ['hy9','华东野战军第9纵队','ccp','weixian','xushiyou',29000,'heavy','1947-01-01','1949-02-01','huaye','y1948'],
    ['hy10','华东野战军第10纵队','ccp','dezhou',null,26500,'mixed','1947-02-01','1949-02-01','huaye','huaihai'],
    ['hy-art','华东野战军特种兵纵队','ccp','linyi',null,12500,'heavy','1947-03-01','1949-02-01','huaye','huaihai'],
    ['3f-20','第三野战军第20军','ccp','xuzhou','yefei',33500,'heavy','1949-02-01',null,'huaye','y1949'],
    ['3f-23','第三野战军第23军','ccp','bengbu','su',32000,'mixed','1949-02-01',null,'huaye','y1949'],
    ['3f-27','第三野战军第27军','ccp','huaiyin','xushiyou',33500,'heavy','1949-02-01',null,'huaye','y1949'],
    ['r-3-war','第3战区部队','roc','quzhou',null,58000,'heavy','1945-08-15','1946-06-01',null,'y1945'],
    ['r-jinan','第二绥靖区守军','roc','jinan','wang',42000,'mixed','1946-01-01','1948-09-25',null,'y1948'],
    ['r96','鲁系整编第96军','roc','jinan','wuhuawen',17000,'mixed','1948-09-01','1948-09-19','luxi','wuhua'],
    ['r-xuzhou','徐州“剿总”杜聿明集团','roc','xuzhou','du',68000,'heavy','1948-06-01','1949-01-11','us','huaihai'],
    ['r7route','第7兵团（黄百韬部）','roc','xinanzhen','huangbaitao',47000,'heavy','1948-09-01','1948-11-23',null,'huaihaiCanal'],

    // 中原战区：中原野战军各纵队分开调遣 + 第二野战军各军
    ['shanxi','晋冀鲁豫野战军主力','ccp','handan','liu',43000,'light','1945-08-15','1948-05-01','zhongye','y1947'],
    ['central-area','中原军区部队','ccp','xuanhuadian',null,27000,'light','1945-10-01','1946-07-21','zhongye','y1946'],
    ['zy1','中原野战军第1纵队','ccp','shangqiu','yangyong',23000,'mixed','1948-05-01','1949-02-01','zhongye','huaihai'],
    ['zy2','中原野战军第2纵队','ccp','kaifeng',null,21500,'mixed','1948-05-01','1949-02-01','zhongye','huaihai'],
    ['zy3','中原野战军第3纵队','ccp','xuchang',null,21500,'mixed','1948-05-01','1949-02-01','zhongye','huaihai'],
    ['zy4','中原野战军第4纵队（陈赓部）','ccp','luoyang','chengeng',26000,'heavy','1948-05-01','1949-02-01','zhongye','secondArmy'],
    ['zy6','中原野战军第6纵队','ccp','nanyang','wangjinshan',24000,'mixed','1948-05-01','1949-02-01','zhongye','secondArmy'],
    ['zy9','中原野战军第9纵队','ccp','zhengzhou','liu',15000,'light','1948-05-01','1949-02-01','zhongye','huaihai'],
    ['2f-10','第二野战军第10军','ccp','hefei','yangyong',29000,'mixed','1949-02-01',null,'zhongye','secondArmy'],
    ['2f-12','第二野战军第12军','ccp','anqing','wangjinshan',30000,'mixed','1949-02-01',null,'zhongye','secondArmy'],
    ['2f-13','第二野战军第13军（陈赓兵团）','ccp','jiujiang','chengeng',32000,'heavy','1949-02-01',null,'zhongye','secondArmy'],
    ['r-6-war','第6战区部队','roc','yichang',null,47000,'mixed','1945-08-15','1946-06-01',null,'y1945'],
    ['r12route','第12兵团（黄维美械集团）','roc','xinyang','huangwei',53000,'heavy','1948-09-01','1948-12-16','us','shuangduiji'],

    // 西北战区：西野/一野各纵队 vs 胡宗南集团、青海马步芳、宁夏马鸿逵、新疆陶峙岳
    ['shaanxi','陕甘宁晋绥联防军','ccp','yanan',null,31500,'light','1945-08-15','1947-03-16','xibeiye','y1947'],
    ['nw-corps','西北野战兵团','ccp','suide','peng',48000,'light','1947-03-16','1947-07-31','xibeiye','peng'],
    ['xy1','西北野战军第1纵队','ccp','suide','zhangzongxun',16500,'mixed','1947-07-31','1949-02-01','xibeiye','peng'],
    ['xy2','西北野战军第2纵队','ccp','yanan','wangzhen',17500,'mixed','1947-07-31','1949-02-01','xibeiye','peng'],
    ['xy3','西北野战军第3纵队','ccp','luochuan','xuguangda',15000,'light','1947-07-31','1949-02-01','xibeiye','peng'],
    ['xy4','西北野战军第4纵队','ccp','fuxian','peng',14500,'light','1947-09-01','1949-02-01','xibeiye','peng'],
    ['xy6','西北野战军第6纵队','ccp','tongchuan',null,14500,'light','1947-10-01','1949-02-01','xibeiye','peng'],
    ['1f-1','第一野战军第1军','ccp','xian','zhangzongxun',27500,'mixed','1949-02-01',null,'xibeiye','lanzhou'],
    ['1f-2','第一野战军第2军（王震部）','ccp','baoji','wangzhen',28500,'mixed','1949-02-01',null,'xibeiye','lanzhou'],
    ['1f-3','第一野战军第3军','ccp','xianyang','xuguangda',26000,'mixed','1949-02-01',null,'xibeiye','lanzhou'],
    ['1f-4','第一野战军第4军','ccp','fuping','peng',25000,'mixed','1949-02-01',null,'xibeiye','lanzhou'],
    ['1f-6','第一野战军第6军','ccp','weinan',null,17000,'light','1949-02-01',null,'xibeiye','lanzhou'],
    ['r-1-war','第1战区胡宗南部','roc','xian','hu',54000,'heavy','1945-08-15','1946-06-01','huzongnan','y1947'],
    ['r1','胡宗南整编第1军主力','roc','xian','hu',56500,'heavy','1946-06-01','1948-09-01','huzongnan','y1947'],
    ['roc-1c','胡宗南集团第1军','roc','xian','hu',29500,'heavy','1948-09-01','1949-12-28','huzongnan','lanzhou'],
    ['roc-36c','胡宗南集团第36军','roc','baoji','peichanghui',26000,'mixed','1948-09-01','1949-12-25','huzongnan','lanzhou'],
    ['roc-38c','胡宗南集团第38军','roc','tianshui',null,25500,'mixed','1948-09-01','1949-12-25','huzongnan','lanzhou'],
    ['roc-65c','胡宗南集团第65军','roc','hanzhong',null,26000,'mixed','1948-09-01','1949-12-25','huzongnan','lanzhou'],
    ['roc-90c','胡宗南集团第90军','roc','xianyang',null,27500,'heavy','1948-09-01','1949-12-25','huzongnan','lanzhou'],
    ['r82','青马第82军（马继援主力）','roc','lanzhou','majiyuan',41000,'mixed','1946-01-01','1949-09-06','qingma','lanzhou'],
    ['r129','青马第129军','roc','xining','mabufang',26000,'mixed','1948-01-01','1949-09-06','qingma','lanzhou'],
    ['ma-cav','青海马家军骑兵纵队','roc','wuwei',null,16500,'mixed','1946-01-01','1949-09-20','qingma','lanzhou'],
    ['r11-ning','宁马第11军（马敦静部）','roc','yinchuan','madunjing',28000,'mixed','1946-01-01','1949-09-24','ningma','lanzhou'],
    ['r128-ning','宁马第128军（马鸿逵部）','roc','wuzhong','mahongkui',25500,'light','1947-01-01','1949-09-24','ningma','lanzhou'],
    ['xj-42','新疆警备整编第42师集团','roc','dihua','taoshiyue',42000,'mixed','1946-01-01',null,'xinjiang','y1949'],
    ['xj-78','新疆警备整编第78师与骑兵师','roc','kashgar',null,34000,'mixed','1946-01-01',null,'xinjiang','y1949'],

    // 西南与西藏战区：川军、滇军、噶厦藏军
    ['r24','西康川康第24军（刘文辉部）','roc','yaan','liuwen',26500,'light','1945-08-15',null,'chuanxi','sichuan'],
    ['r95-chuan','川军第95军（邓锡侯部）','roc','chengdu','dengxihou',28000,'light','1945-08-15',null,'chuanxi','sichuan'],
    ['r20-chuan','川军第20军（杨森部）','roc','chongqing','yangsen',25500,'mixed','1945-08-15','1949-12-27','chuanxi','west'],
    ['r93-dian','滇军第93军（卢汉部）','roc','kunming','luhan',28500,'mixed','1946-01-01',null,'dianxi','y1949'],
    ['r26-dian','驻滇第26军（余程万部）','roc','dali','yuchengwan',27000,'mixed','1948-01-01','1950-02-20','dianxi','y1950'],
    ['xz-chamdo','西藏藏军昌都前线代本群','roc','chamdo','ngapoi',5500,'light','1945-08-15','1950-10-20','xizang','y1950'],
    ['xz-lhasa','噶厦卫藏主力代本军','roc','lhasa',null,5000,'light','1945-08-15','1951-05-24','xizang','y1950'],

    // 华南与两广台湾：桂军、粤军、琼崖与台湾守军
    ['r7','桂系第7军（钢七军）','roc','hengyang','bai',34000,'mixed','1945-08-15','1949-12-12','guixi','hengbao'],
    ['r48','桂系第48军','roc','liuzhou','lizongren',27000,'mixed','1945-08-15','1949-12-12','guixi','guangxi'],
    ['r46-gui','桂系第46军','roc','nanning',null,25000,'mixed','1946-01-01','1949-12-12','guixi','guangxi'],
    ['r62-yue','粤军第62军（余汉谋系）','roc','guangzhou','yuhanmou',27500,'mixed','1945-08-15','1949-11-15','yuejun','y1949'],
    ['r63-yue','粤军第63军','roc','shaoguan',null,25000,'mixed','1945-08-15','1948-11-13','yuejun','huaihaiCanal'],
    ['r64-yue','粤军第64军','roc','zhanjiang',null,26000,'mixed','1945-08-15','1950-05-02','yuejun','y1950'],
    ['hainan-defense','海南防卫总司令部','roc','haikou','xue',38500,'heavy','1949-12-01','1950-05-02','yuejun','y1950'],
    ['qiongya','琼崖纵队','ccp','yaxian',null,14500,'light','1947-10-01',null,null,'y1949'],
    ['roc-taiwan','台湾省警备总司令部','roc','taipei',null,25000,'mixed','1945-10-25',null,null,'taiwanReception'],
    ['roc-taiwan-defense','台湾省防卫司令部','roc','taipei','sun',59000,'heavy','1949-01-04',null,'us','taiwanDefense'],
    ['hunan-first','湖南第一兵团起义部队','roc','changsha','chenmr',77000,'mixed','1949-08-04',null,null,'hunanPeace'],
    ['r25','第25军','roc','kinmen',null,27500,'mixed','1949-10-01',null,null,'kinmen'],
  ].map(([id,name,side,city,leader,strength,equipment,from,until,group,source]) => ({
    id,name,side,city,strength,equipment:{light:57,mixed:71,heavy:86}[equipment],from,until,group,source:src(source),
    ...(leader ? {leader} : {}),
    ...(predecessorsByUnit[id] ? {predecessors:predecessorsByUnit[id]} : {}),
    ...(divisionsByUnit[id] ? {divisions:divisionsByUnit[id]} : {}),
    area:cities.find(item => item.id === city).region,
  }));

  const scenarios = [
    {id:'war1946',title:'全面内战爆发',date:'1946-06-26',focus:'xuanhuadian',area:'central',summary:'1946年6月26日，国民党军进攻中原解放区，全面内战爆发。以全国范围接管战局；城市归属、部队位置和势力范围使用现有史实节点及游戏推演，不能视为精确历史边界。',source:src('y1946')},
    {id:'liaoshen',title:'辽沈战役',date:'1948-09-12',focus:'jinzhou',area:'northeast',summary:'北宁铁路将锦州、锦西和山海关连在一起，沈阳与长春仍由国民党军控制。战役自9月12日开始，官方军史以11月2日为结束日。选择任一方，可将东北的决策交给自己，其他战区仍继续推进。',source:src('liaoshen')},
    {id:'jinzhou',title:'锦州攻坚战',date:'1948-10-14',focus:'jinzhou',area:'northeast',summary:'10月14日，东北野战军向锦州发起总攻。守军由范汉杰指挥，塔山方向的援军与辽西方向的第9兵团也影响战局。历史上锦州在10月15日易手。',source:src('jinzhou')},
    {id:'tashan',title:'塔山阻击战',date:'1948-10-10',focus:'tashan',area:'northeast',summary:'塔山位于锦州和锦西之间的滨海走廊。东北野战军第4纵队等部承担阻援任务，国民党军第17兵团从锦西、葫芦岛方向援锦。战事持续至10月15日。',source:src('tashan')},
    {id:'changchun',title:'长春围困',date:'1948-06-01',focus:'changchun',area:'northeast',summary:'以六月初作为剧本入口。长期围困使城内平民经历严重饥荒。10月17日第60军起义，19日新编第7军投诚，21日第1兵团部交出武器。',source:src('y1948')},
    {id:'siping-first',title:'一战四平 · 初次争夺',date:'1946-03-15',focus:'siping',area:'northeast',summary:'苏军撤出四平后，东北民主联军在15日展开外围进攻，17日进攻市区。城内守备主要由国民政府辽北省组织的地方部队承担。',source:src('fourBattles'),overrides:{taonan:'ccp'}},
    {id:'siping',title:'四平保卫战',date:'1946-04-18',focus:'siping',area:'northeast',summary:'以1946年春第二次四平交战为入口。东北民主联军在四平防守，国民党军新编第1军和第71军参与进攻。四平在1946—1948年多次易手。',source:src('jilin')},
    {id:'siping-third',title:'三战四平 · 四平攻坚战',date:'1947-06-14',focus:'siping',area:'northeast',summary:'6月11日开始外围作战，14日攻城。东北民主联军第1纵队等部进攻，陈明仁第71军守城。东北民主联军于6月30日撤离。',source:src('sipingMuseum')},
    {id:'siping-fourth',title:'四战四平 · 四平收复战',date:'1948-03-12',focus:'siping',area:'northeast',summary:'经过3月初外围战斗后，东北人民解放军于12日发起总攻。第1纵队、第3纵队和第7纵队等参加作战，四平于次日易手。',source:src('fourBattles')},
    {id:'full',title:'全国战局',date:'1945-08-15',focus:'yanan',area:'northwest',summary:'从日本宣布接受投降条件起进入全国战局，覆盖东北、华北、华东、中原、中南、西北、西南及台湾。接收期存在多方势力和过渡状态。地图用双方控制色概括可玩节点，史实有单独的日期与出处。',source:src('y1945')},
    {id:'central',title:'中原突围',date:'1946-06-26',focus:'xuanhuadian',area:'central',summary:'以中原军区从宣化店一带突围为入口，可选择转移兵力或调整战区防务。',source:src('y1946')},
    {id:'jinan',title:'济南战役',date:'1948-09-16',focus:'jinan',area:'east',summary:'华东野战军进攻济南，联通津浦与胶济铁路的枢纽由王耀武指挥防守。吴化文部随后起义。',source:src('y1948')},
    {id:'huaihai',title:'淮海战役',date:'1948-11-06',focus:'xuzhou',area:'east',summary:'徐州及其周边铁路枢纽成为争夺核心。华东、中原野战军参加战役，国民党军以徐州为指挥中心。',source:src('huaihai')},
    {id:'pingjin',title:'平津战役',date:'1948-11-29',focus:'beiping',area:'north',summary:'东北野战军进入华北，联合华北军区部队作战。张家口、新保安、北平和天津牵动平津战局。',source:src('y1948')},
    {id:'dujiang',title:'渡江战役',date:'1949-04-21',focus:'nanjing',area:'east',summary:'4月20日夜至21日，第二、第三野战军在多处渡过长江，随后进入南京等地。',source:src('y1949')},
    {id:'northwest',title:'席卷大西北',date:'1949-07-10',focus:'lanzhou',area:'northwest',summary:'1949年夏，彭德怀指挥第一野战军重创胡宗南集团后挥师西进，与青海马步芳第82军、宁夏马鸿逵兵团展开兰州与银川决战，兵锋直指河西走廊与新疆迪化。',source:src('lanzhou'),overrides:{xian:'ccp',xianyang:'ccp',weinan:'ccp',fuping:'ccp',baoji:'roc',lanzhou:'roc',xining:'roc',yinchuan:'roc',dihua:'roc'}},
    {id:'hainan',title:'海南岛战役',date:'1950-04-16',focus:'haikou',area:'south',summary:'以主力部队渡海进攻开始为入口，海南岛上有琼崖纵队接应，国民党守军由薛岳指挥。历史上战役持续至5月1日。',source:src('y1950')},
  ];

  // 战役入口的日期与史料已核对；当前地图及部队由全国数据近似生成，并非逐部队史实重建。
  scenarios.push(
    {id:'handan1945',title:'邯郸战役（近似）',date:'1945-10-24',focus:'handan',area:'north',summary:'1945年10月24日至11月2日，双方在邯郸以南平汉铁路地区作战。使用现有全国初始部队和地图近似推演，非逐部队历史复原。',source:'https://www.81.mil.cn/js_208592/16269820.html'},
    {id:'linjiang1946',title:'四保临江（近似）',date:'1946-12-17',focus:'tonghua',area:'northeast',summary:'1946年12月至1947年4月，南满方向经历多次攻防。当前地图以通化作为附近入口，部队和地理位置为近似设定。',source:'https://www.81.mil.cn/2018zt/2018-07/09/content_8084221_4.htm'},
    {id:'lunan1947',title:'鲁南战役（近似）',date:'1947-01-04',focus:'zaozhuang',area:'east',summary:'1947年1月鲁南地区展开作战。以枣庄方向为入口，现有城市及部队部署属于近似推演。',source:'https://www.81.mil.cn/yljnt_208627/lsda_208656/16444442.html'},
    {id:'qingfengdian1947',title:'清风店战役（近似）',date:'1947-10-22',focus:'baoding',area:'north',summary:'1947年10月22日清风店地区爆发决战。地图使用附近保定作为入口，战场及各方编制为近似推演。',source:'https://www.81.mil.cn/js_208592/16284443.html'},
    {id:'laiwu',title:'莱芜战役（近似）',date:'1947-02-20',focus:'taian',area:'east',summary:'1947年2月20日至23日，华东野战军在莱芜地区作战。当前地图以附近泰安为入口；城镇控制和兵力沿用全国推演数据，并非战役逐部队复原。',source:'https://www.81.mil.cn/js_208592/jdt_208593/16201832.html'},
    {id:'menglianggu',title:'孟良崮战役（近似）',date:'1947-05-13',focus:'mengyin',area:'east',summary:'1947年5月13日至16日，华东野战军在蒙阴一带作战。以蒙阴为附近地图入口；开局部署与具体兵力为近似推演。',source:'https://www.81.mil.cn/2018zt/2018-10/13/content_9311343.htm'},
    {id:'shajiadian',title:'沙家店战役（近似）',date:'1947-08-18',focus:'mizhi',area:'northwest',summary:'1947年8月18日至20日，西北野战军在陕西米脂县沙家店地区作战。以米脂为入口，具体部署为近似推演。',source:'https://www.mod.gov.cn/gfbw/gfjy_index/js_214151/4859547.html'},
    {id:'yudong',title:'豫东战役（近似）',date:'1948-06-17',focus:'kaifeng',area:'central',summary:'1948年6月17日开始的豫东战役涉及开封、睢杞等地。开局使用现有全国部队与城镇资料，具体部署为近似推演。',source:'https://www.yantian.gov.cn/ytdayszxxw/lsjt/content/post_11736637.html'},
    {id:'shanghai',title:'上海战役（近似）',date:'1949-05-12',focus:'shanghai',area:'east',summary:'1949年5月12日至27日的上海战役涉及上海及周边地区。当前使用全国地图与现有部队资料，并非完整的逐部队攻防复原。',source:'https://www.81.mil.cn/js_208592/jdt_208593/10160093.html'},
    {id:'fumei',title:'扶眉战役（近似）',date:'1949-07-10',focus:'meixian',area:'northwest',summary:'1949年7月10日至14日，第一野战军在扶风、眉县地区作战。以眉县为入口，兵力与城镇归属为现有全国资料近似推演。',source:'https://www.81.mil.cn/js_208592/16200693.html'},
    {id:'lanzhou-battle',title:'兰州战役（近似）',date:'1949-08-21',focus:'lanzhou',area:'northwest',summary:'1949年8月21日至26日，第一野战军与兰州守军作战。开局采用现有全国资料，具体部队与工事不是逐项史实复原。',source:'https://cpc.people.com.cn/GB/67481/71472/4844881.html'},
    {id:'hengbao-battle',title:'衡宝战役（近似）',date:'1949-09-13',focus:'hengyang',area:'central',summary:'1949年9月至10月，第二、第四野战军在衡阳、宝庆地区作战。以衡阳为入口，战局及部署为近似推演。',source:'https://www.81.mil.cn/js_208592/16345016.html'},
    {id:'gunningtou',title:'金门古宁头战役（近似）',date:'1949-10-25',focus:'kinmen',area:'taiwan',summary:'1949年10月25日凌晨开始金门登陆与古宁头作战。该入口使用现有岛屿地图与船运机制，潮汐、登陆点及部队编制尚未逐项复原。',source:'https://art.archives.gov.tw/tw/art/2062.html'}
  );

  // 占位驻军用于补足目前资料缺失的可玩开局，不代表具体历史部队或核实兵力。
  const provisionalForces = {
    dujiang: [{id:'sim-dujiang-roc',name:'南京守备部队（模拟）',side:'roc',city:'nanjing',strength:24000}],
    shanghai: [{id:'sim-shanghai-roc',name:'上海守备部队（模拟）',side:'roc',city:'shanghai',strength:30000},
      {id:'sim-shanghai-ccp',name:'上海方向进攻部队（模拟）',side:'ccp',city:'suzhou',strength:30000}],
    gunningtou: [{id:'sim-kinmen-ccp',name:'厦门登陆集结部队（模拟）',side:'ccp',city:'xiamen',strength:18000}],
  };
  for (const scenario of scenarios) {
    if (provisionalForces[scenario.id]) {
      scenario.provisionalForces = provisionalForces[scenario.id];
      scenario.summary += ' 为保证可玩性，补入标有“模拟”的占位部队，人数并非史实核验数据。';
    }
    if (scenario.id === 'gunningtou') scenario.defaultScope = 'national';
    if (scenario.id === 'hainan' || scenario.id === 'gunningtou') scenario.defaultGoal = 'all';
  }

  // 剧本物资参数：数值为后方产能系数（1 为正常）。国民党军后期多为补给线被切断，
  // 长春、淮海两处尤其明显；渡海与海南作战则受运输能力限制。空中支援为 0—100 的游戏参数。
  const scenarioSupply = {
    full: { supply: { ccp: 1, roc: 0.88 }, air: { ccp: 10, roc: 52 } },
    liaoshen: { supply: { ccp: 1.08, roc: 0.92 }, air: { ccp: 16, roc: 55 } },
    jinzhou: { supply: { ccp: 1, roc: 0.84 }, air: { ccp: 14, roc: 58 } },
    tashan: { supply: { ccp: 0.95, roc: 1.04 }, air: { ccp: 12, roc: 60 } },
    changchun: { supply: { ccp: 1.02, roc: 0.38 }, air: { ccp: 14, roc: 48 } },
    siping: { supply: { ccp: 0.96, roc: 0.95 }, air: { ccp: 10, roc: 46 } },
    'siping-first': { supply: { ccp: 0.94, roc: 0.9 }, air: { ccp: 8, roc: 44 } },
    'siping-third': { supply: { ccp: 0.98, roc: 0.96 }, air: { ccp: 10, roc: 46 } },
    'siping-fourth': { supply: { ccp: 1.02, roc: 0.86 }, air: { ccp: 14, roc: 48 } },
    central: { supply: { ccp: 0.88, roc: 1.02 }, air: { ccp: 8, roc: 50 } },
    jinan: { supply: { ccp: 1, roc: 0.86 }, air: { ccp: 12, roc: 52 } },
    huaihai: { supply: { ccp: 0.94, roc: 0.6 }, air: { ccp: 18, roc: 56 } },
    pingjin: { supply: { ccp: 1, roc: 0.7 }, air: { ccp: 20, roc: 50 } },
    dujiang: { supply: { ccp: 1.06, roc: 0.78 }, air: { ccp: 22, roc: 44 } },
    northwest: { supply: { ccp: 0.96, roc: 0.86 }, air: { ccp: 14, roc: 36 } },
    hainan: { supply: { ccp: 0.76, roc: 0.9 }, air: { ccp: 24, roc: 40 } },
  };
  for (const scenario of scenarios) {
    const tuned = scenarioSupply[scenario.id];
    if (!tuned) continue;
    scenario.supply = { ...tuned.supply };
    scenario.air = { ...tuned.air };
  }

  const events = [
    ['japan-end','1945-08-15','日本宣布接受投降条件','日本天皇发布终战诏书，各地接收与国共谈判随后展开。',null,null,'y1945'],
    ['chongqing-talks','1945-08-28','重庆谈判开始','毛泽东赴重庆，国共双方就和平建国等事项展开谈判。','chongqing',null,'y1945'],
    ['double-ten','1945-10-10','签订《双十协定》','双方发表《政府与中共代表会谈纪要》，军队及解放区等问题仍待解决。','chongqing',null,'y1945'],
    ['taiwan-reception','1945-10-25','台北举行日军受降仪式','中华民国政府接收台湾的军事和行政事务。','taipei','roc','taiwanReception'],
    ['dalian-civil','1945-11-08','大连市政府举行成立大会','苏军继续实行军事管制，大连市政府承担市内民政。','dalian','ccp','dalianCivil'],
    ['lushun-civil','1945-11-25','旅顺市政府成立','在苏军军管下，旅顺另设市政府。旅顺与大连在游戏地图上分别标示。','lushun','ccp','dalianCivil'],
    ['jinxian-civil','1946-01-02','金县政府在金州成立','当地行政安排受苏军军管影响，市县民政逐步建立。','jinxian','ccp','dalianCivil'],
    ['ceasefire','1946-01-10','国共签订停战协定','国共签署停止军事冲突的协定，谈判及地方军事活动仍在继续。',null,null,'y1946'],
    ['siping-first-open','1946-03-15','第一次四平交战展开','苏军撤离后，东北民主联军在四平展开外围战斗。','siping',null,'fourBattles'],
    ['siping-first','1946-03-17','东北民主联军进占四平','东北民主联军攻占市区，国民政府辽北省守备部队失利。','siping','ccp','fourBattles'],
    ['changchun-april','1946-04-18','东北民主联军进占长春','苏军撤离后，东北民主联军进入长春。','changchun','ccp','jilin'],
    ['siping-defense','1946-04-18','四平保卫战开始','国民党军新编第1军、第71军等部进攻四平，东北民主联军在城内外防守。','siping',null,'jilin'],
    ['harbin-1946','1946-04-28','东北民主联军进驻哈尔滨','苏军撤出后，哈尔滨成为东北民主联军的重要后方。','harbin','ccp','y1946'],
    ['siping-second','1946-05-19','国民党军进入四平','东北民主联军于前一夜撤出，当日国民党军进入四平。','siping','roc','y1946'],
    ['changchun-may','1946-05-23','国民党军进入长春','四平失守后，国民党军继续沿铁路北进并进入长春。','changchun','roc','y1946'],
    ['jilin-may','1946-05-28','国民党军进入吉林','东北战局重心向松花江一线移动。','jilin','roc','y1946'],
    ['breakout','1946-06-26','中原突围','中原军区部队从宣化店一带转移，全面内战随之扩大。','xuanhuadian',null,'y1946'],
    ['yanan-retreat','1947-03-19','国民党军进入延安','中共中央机关转移，胡宗南所部进入延安。','yanan','roc','y1947'],
    ['siping-third','1947-06-14','东北民主联军发起四平攻坚','四平攻坚战进入城市进攻阶段。守军坚守，东北民主联军在6月底结束此次进攻。','siping',null,'sipingMuseum'],
    ['yellow-river','1947-06-30','刘邓大军渡过黄河','晋冀鲁豫野战军主力渡过黄河，进入鲁西南作战。','heze',null,'y1947'],
    ['shimen','1947-11-12','石门易手','晋察冀野战军攻占石门，随后城市改名石家庄。','shijiazhuang','ccp','y1947'],
    ['siping-fourth-open','1948-03-12','第四次四平交战发起总攻','东北人民解放军于外围交战后发起总攻。','siping',null,'fourBattles'],
    ['siping-fourth','1948-03-13','东北人民解放军攻占四平','四次四平交战至此结束。','siping','ccp','siping'],
    ['yanan-return','1948-04-22','人民解放军重返延安','西北野战军收复延安。','yanan','ccp','y1948'],
    ['changchun-siege','1948-06-01','长春进入长期围困阶段','围困从初夏持续到10月。城内粮食严重短缺，平民遭遇饥荒。剧本以六月初为入口。','changchun',null,'siege'],
    ['ls-start','1948-09-12','辽沈战役开始','东北野战军向北宁铁路锦州至昌黎一带展开攻势。','jinzhou',null,'orders'],
    ['jinan-start','1948-09-16','济南战役开始','华东野战军围攻济南，并在外线部署阻援部队。','jinan',null,'y1948'],
    ['wu-uprising','1948-09-19','吴化文率部起义','济南西部防守力量的一部分停止同解放军交战。','jinan',null,'wuhua'],
    ['jinan-end','1948-09-24','济南易手','华东野战军攻占济南。','jinan','ccp','y1948'],
    ['tashan-start','1948-10-10','塔山阻击战开始','从锦西、葫芦岛方向出动的国民党援军进攻塔山一线，交战持续六天。','tashan',null,'tashan'],
    ['jinzhou-assault','1948-10-14','锦州总攻开始','东北野战军在完成外围作战后攻入锦州城区，交战延续至次日。','jinzhou',null,'jinzhou'],
    ['jinzhou-fall','1948-10-15','锦州易手','东北野战军攻占锦州，国民党军的东北陆上通道受到决定性影响。','jinzhou','ccp','jinzhou'],
    ['changchun-uprising','1948-10-17','长春第60军起义','曾泽生率第60军起义，长春守军局势随之改变。','changchun',null,'y1948'],
    ['changchun-transfer','1948-10-19','长春新编第7军投诚','长春主要城区控制权转移。10月21日，郑洞国率第1兵团部交出武器。','changchun','ccp','y1948'],
    ['zhengzhou-fall','1948-10-22','郑州易手','中原野战军进入郑州。','zhengzhou','ccp','y1948'],
    ['heishan','1948-10-23','黑山、大虎山方向交战','廖耀湘兵团抵达黑山和大虎山方向，与东北野战军交战。','heishan',null,'jinzhou'],
    ['kaifeng-end','1948-10-24','开封再次易手','国民党军从开封撤离，人民解放军再次进入。','kaifeng','ccp','kaifeng'],
    ['liaoxi','1948-10-28','辽西会战结束','国民党军第9兵团在辽西会战中失去建制，东北野战军随后兵临沈阳。','dahushan',null,'jinzhou'],
    ['shenyang-end','1948-11-02','沈阳易手','东北野战军进入沈阳，辽沈战役结束。','shenyang','ccp','y1948'],
    ['yingkou-end','1948-11-02','营口易手','东北野战军第9纵队攻占营口，部分国民党军由海路撤走。','yingkou','ccp','jinzhou'],
    ['huaihai-start','1948-11-06','淮海战役开始','华东野战军和中原野战军在徐州周边展开战役。','xuzhou',null,'huaihai'],
    ['canal-uprising','1948-11-08','台儿庄、贾汪一带部队起义','何基沣、张克侠率第三绥靖区部分部队起义，改变了徐州东北侧运河一线形势。','taierzhuang','ccp','huaihaiCanal'],
    ['huludao-end','1948-11-10','东北野战军进占锦西、葫芦岛','国民党军于9日撤走，东北野战军次日进入。','huludao','ccp','jinzhou'],
    ['yunhe-bridge','1948-11-10','运河铁路桥易手','华东野战军控制运河铁路桥，继续追击西撤的第7兵团。','yunhebridge','ccp','huaihaiCanal'],
    ['yaowan-end','1948-11-12','窑湾交战结束','华东野战军包围窑湾，国民党军第63军失去建制。','yaowan','ccp','huaihaiCanal'],
    ['suxian-end','1948-11-16','宿县易手','中原野战军攻占宿县，切断徐州与蚌埠之间的津浦铁路。','suxian','ccp','suxian'],
    ['nianzhuang-end','1948-11-22','碾庄圩战斗结束','黄百韬第7兵团于碾庄圩一带失去建制，淮海战役第一阶段结束。','nianzhuang','ccp','nianzhuang'],
    ['pingjin-start','1948-11-29','平津战役开始','华北部队在张家口方向发起作战，东北野战军陆续入关。','zhangjiakou',null,'y1948'],
    ['xuzhou-change','1948-12-01','人民解放军进入徐州','杜聿明集团从徐州撤走，随后在陈官庄地区被包围。','xuzhou','ccp','huaihai'],
    ['shuangduiji-end','1948-12-15','双堆集战斗结束','黄维第12兵团被围于双堆集地区，战斗在12月15日结束。','shuangduiji','ccp','shuangduiji'],
    ['xinbaoan-end','1948-12-22','新保安战斗结束','华北部队攻占新保安，国民党军第35军失去建制。','xinbaoan','ccp','xinbaoan'],
    ['huaihai-end','1949-01-10','淮海战役结束','陈官庄地区的战斗结束，杜聿明集团被击败。','chenguanzhuang','ccp','y1949'],
    ['tianjin-end','1949-01-15','天津易手','自1月14日开始，天津经过约29小时激战后易手。','tianjin','ccp','y1949'],
    ['beiping','1949-01-31','北平和平交接','傅作义所部接受和平改编，人民解放军进入北平。','beiping','ccp','y1949'],
    ['dujiang-start','1949-04-21','渡江战役展开','第二、第三野战军在20日夜至21日横渡长江。','nanjing',null,'y1949'],
    ['nanjing-end','1949-04-23','人民解放军进入南京','南京成为渡江战役中易手的主要城市之一。','nanjing','ccp','y1949'],
    ['taiyuan-end','1949-04-24','太原易手','历经长期围攻，人民解放军占领太原。','taiyuan','ccp','y1949'],
    ['datong-end','1949-05-01','大同和平交接','大同守军与人民解放军代表经谈判达成协议，人民解放军随后进入大同。','datong','ccp','datong'],
    ['hangzhou-end','1949-05-03','杭州易手','第三野战军进入杭州。','hangzhou','ccp','y1949'],
    ['wuhan-end','1949-05-17','武汉三镇易手','5月16至17日，解放军陆续进入武汉三镇。','wuhan','ccp','y1949'],
    ['shanghai-end','1949-05-27','上海易手','人民解放军经过上海战役取得上海控制权。','shanghai','ccp','y1949'],
    ['yulin-end','1949-06-01','榆林和平交接','榆林守军接受和平改编安排，当地局势随之转变。','yulin','ccp','yulin'],
    ['changsha-end','1949-08-04','长沙守军通电起义','程潜、陈明仁率第一兵团及湖南保安部队宣布起义；史料所载兵力约7.7万人，之后仍经历人员离队与整编。','changsha','ccp','hunanPeace'],
    ['lanzhou-end','1949-08-26','兰州易手','第一野战军攻占兰州，击溃青海马步芳集团主力。','lanzhou','ccp','lanzhou'],
    ['suiyuan-uprising','1949-09-19','绥远董其武通电起义','绥远省主席董其武率军政人员通电起义，绥远和平解放。','guisui','ccp','y1949'],
    ['xinjiang-uprising','1949-09-25','新疆陶峙岳通电起义','新疆警备总司令陶峙岳率驻疆7万余官兵通电起义，新疆和平解放。','dihua','ccp','y1949'],
    ['beiping-rename','1949-09-27','北平改称北京','中国人民政治协商会议第一届全体会议通过定都北平并改称北京的决议。','beiping',null,'beijing'],
    ['prc-founded','1949-10-01','中华人民共和国成立','开国大典在北京举行。北平已在9月改称北京，地图保留战役期间的旧称。','beiping',null,'y1949'],
    ['guangzhou-end','1949-10-14','广州易手','人民解放军进入广州，国民政府机构已向西南转移。','guangzhou','ccp','century'],
    ['jinmen','1949-10-25','金门战事开始','人民解放军登陆金门，国民党军保持控制。','kinmen','roc','kinmen'],
    ['chongqing-end','1949-11-30','重庆易手','第二野战军向西南推进，其部队进入重庆。','chongqing','ccp','west'],
    ['roc-relocation','1949-12-07','国民政府决定迁台','蒋经国日记记载，12月7日作出迁台决定。蒋介石于12月10日抵达台北。','taipei',null,'taiwan'],
    ['kunming-uprising','1949-12-09','卢汉昆明起义与川康起义','卢汉在昆明通电起义，同日刘文辉、邓锡侯等川康将领在彭县通电起义。','kunming','ccp','y1949'],
    ['chengdu-end','1949-12-27','成都易手','解放军进入成都，胡宗南集团在成都战役中覆灭。','chengdu','ccp','west'],
    ['hainan-start','1950-04-16','海南岛主力渡海作战开始','人民解放军主力渡海进攻海南岛，岛内琼崖纵队配合。','haikou',null,'y1950'],
    ['hainan-end','1950-05-01','海南岛战役结束','国民党军撤离海南。海口在战役期间已于4月23日易手。','yaxian','ccp','y1950'],
    ['chamdo-end','1950-10-19','昌都战役结束','人民解放军进占昌都，阿沛·阿旺晋美率藏军放下武器，打开和平解放西藏大门。','chamdo','ccp','y1950'],
  ].map(([id,date,title,detail,city,side,source]) => ({id,date,title,detail,source:src(source),...(city ? {city} : {}),...(side ? {side} : {})}));

  const historicalIntegrations = {
    'wu-uprising': [{unit:'r96',side:'ccp',group:'huaye',name:'整编第96军起义部队'}],
    'changchun-uprising': [{unit:'r60',side:'ccp',group:'dongye',name:'第50军（滇军第60军起义改编）'}],
    'changchun-transfer': [{unit:'rnew7',side:'ccp',group:'dongye',name:'新编第7军投诚部队（东北野战军系统）'}],
    'beiping': [{unit:'north-command',side:'ccp',group:'huabei',name:'北平和平改编部队'}],
    'changsha-end': [{unit:'hunan-first',side:'ccp',group:'dongye',name:'湖南第一兵团起义部队（整编中）'}],
    'changsha-reorganization': [{unit:'hunan-first',side:'ccp',group:'dongye',name:'第21兵团（湖南起义部队改编）'}],
    'suiyuan-uprising': [{unit:'suiyuan-111',side:'ccp',group:'huabei',name:'第36军（绥远起义部队改编）'}],
    'xinjiang-uprising': [
      {unit:'xj-42',side:'ccp',group:'xibeiye',name:'第22兵团第9军（驻疆起义改编）'},
      {unit:'xj-78',side:'ccp',group:'xibeiye',name:'第22兵团骑兵第7师（驻疆起义改编）'},
    ],
    'kunming-uprising': [
      {unit:'r93-dian',side:'ccp',group:'zhongye',name:'滇军第93军起义部队'},
      {unit:'r24',side:'ccp',group:'zhongye',name:'西康第24军起义部队'},
      {unit:'r95-chuan',side:'ccp',group:'zhongye',name:'川军第95军起义部队'},
    ],
  };
  for (const event of events) {
    if (historicalIntegrations[event.id]) event.integrations = historicalIntegrations[event.id];
  }
  events.push({id:'changsha-reorganization',date:'1949-10-20',title:'陈明仁起义部队整编为第21兵团',
    detail:'依照中央军委命令，湖南起义部队逐步改编为第21兵团，辖第52、第53军；整编、教育和补充仍持续进行。',
    city:'changsha',source:src('hunanPeace'),integrations:historicalIntegrations['changsha-reorganization']});

  // 这些阶段性锚点补足可玩范围，精确到日的主要易手节点另见 events。
  const stageOwnership = [
    ['1945-08-15','yanan suide linyi liaocheng','chongqing xian chengdu guisui quzhou yichang guilin nanning'],
    ['1945-08-24','zhangjiakou chengde chifeng',''],
    ['1945-10-10','handan yantai yanji',''],
    ['1945-10-25','xuanhuadian','taipei keelung taoyuan taichung tainan kaohsiung hualien penghu'],
    ['1946-04-28','manzhouli hailar qiqihar beian jiamusi mudanjiang yanji dunhua taonan dehui tonghua andong zhoushuizi','shenyang fushun benxi jinzhou huludao shanhaiguan liaoyang anshan chifeng'],
    ['1946-10-11','','chengde zhangjiakou andong'],
    ['1947-06-30','andong tonghua heze','linyi'],
    ['1948-03-13','jilin liaoyuan meihekou changtu beipiao chaoyang lingyuan fuxin','kaiyuan tieling'],
    ['1948-07-15','weixian dezhou luoyang xiangyang linfen luochuan',''],
    ['1948-09-12','faku zhangwu heishan dahushan tashan changli xingcheng','changchun shenyang jinzhou huludao shanhaiguan goubangzi yingkou jinan xuzhou'],
    ['1948-10-01','yixian suizhong',''],
    ['1948-10-28','xinmin goubangzi xinlitun',''],
    ['1948-11-02','tieling kaiyuan fushun benxi liaoyang anshan haicheng dashiqiao',''],
    ['1948-11-10','jiawang xinanzhen haizhou lianyungang',''],
    ['1948-11-22','nianzhuangstation',''],
    ['1948-11-27','shanhaiguan qinhuangdao',''],
    ['1948-12-24','zhangjiakou chengde chifeng zaozhuang lincheng linyi shangqiu xiaoxian yongcheng',''],
    ['1949-01-31','tangshan tanggu langfang yangcun baoding bengbu hefei huaiyin nanyang xuchang',''],
    ['1949-04-30','pukou zhenjiang suzhou changzhou jiujiang xinyang',''],
    ['1949-05-31','xian nanchang jinhua quzhou',''],
    ['1949-06-02','qingdao',''],
    ['1949-07-31','yichang baoji',''],
    ['1949-08-31','fuzhou quanzhou nanping ganzhou ningbo wenzhou tianshui',''],
    ['1949-09-30','yinchuan xining wuwei zhangye jiuquan baotou guisui dihua hami kashgar',''],
    ['1949-10-18','xiamen shaoguan hengyang shantou shaoyang','kinmen'],
    ['1949-12-12','guilin liuzhou wuzhou nanning baise guiyang zunyi wanxian bijie',''],
    ['1949-12-31','guangyuan mianyang leshan yaan kangding yibin zhanjiang xuwen hanzhong',''],
    ['1950-03-31','dali lijiang zhaotong',''],
    ['1950-04-23','haikou',''],
    ['1951-05-23','nyingchi lhasa shigatse',''],
  ];

  const ownershipByDate = new Map();
  const addControl = (date,side,city) => {
    if (!ownershipByDate.has(date)) ownershipByDate.set(date,new Map());
    ownershipByDate.get(date).set(city,side);
  };
  for (const [date,ccp,roc] of stageOwnership) {
    for (const [side,ids] of [['ccp',ccp],['roc',roc]]) {
      for (const id of ids.split(' ').filter(Boolean)) addControl(date,side,id);
    }
  }
  for (const event of events) {
    if (event.city && event.side) addControl(event.date,event.side,event.city);
  }
  // 新城按同一日期最近的原生城镇继承归属，随战线推移而改变，避免所有新节点默认落到一方。
  {
    const extraIds = new Set(extraCities.map(([id]) => id));
    const cityById = new Map(cities.map(city => [city.id, city]));
    const cumulative = new Map();
    const dates = [...ownershipByDate.keys()].sort();
    for (const date of dates) {
      const owners = ownershipByDate.get(date);
      for (const [id, side] of owners) if (!extraIds.has(id)) cumulative.set(id, side);
      const known = [...cumulative].filter(([id]) => !extraIds.has(id));
      for (const id of extraIds) {
        const city = cityById.get(id);
        let best = null;
        let bestGap = Infinity;
        for (const [otherId] of known) {
          const other = cityById.get(otherId);
          if (!other) continue;
          const gap = (other.lon - city.lon) ** 2 + ((other.lat - city.lat) * 1.25) ** 2;
          if (gap < bestGap) { bestGap = gap; best = otherId; }
        }
        const side = best ? cumulative.get(best) : 'roc';
        owners.set(id, side);
        cumulative.set(id, side);
      }
    }
  }
  const anchors = [...ownershipByDate].sort(([a],[b]) => a.localeCompare(b)).map(([date,owners]) => ({
    date,
    ccp:[...owners].filter(([,side]) => side === 'ccp').map(([city]) => city),
    roc:[...owners].filter(([,side]) => side === 'roc').map(([city]) => city),
  }));

  // 自绘的地理背景。这里只画近似的海岸线与主要岛屿轮廓。
  const land = [
    [[65,56],[141,56],[141,53],[140,50],[138,47],[135.2,44],[131.5,42.5],[130.2,42.3],[129.7,41.7],[129.8,40.8],[129,39.7],[127.6,39.3],[127.4,38.5],[129.5,36],[129.3,35.5],[128.6,35],[126.6,34.4],[126,35.3],[126.1,36.7],[126.5,37.4],[125.2,38.6],[124.7,39.6],[124.4,40.05],[122.1,39.1],[121.6,38.82],[121.1,38.8],[120.9,39.4],[121.8,40],[122,40.7],[121.25,40.9],[120.9,40.7],[120,40.2],[119.6,39.85],[118.9,39.15],[118.1,38.95],[117.55,38.65],[118.35,38.25],[119.2,37.95],[119.15,37.25],[120.6,37.67],[121.4,37.56],[122.63,37.4],[122.2,36.85],[121,36.5],[120.5,36.03],[119.8,35.85],[119.3,35.1],[120.85,33.1],[121.1,32.1],[121.8,31.3],[121.9,30.95],[120.55,30.18],[121.55,30.02],[122,29.8],[121.58,28.9],[121.1,28.2],[120.35,27.5],[120.2,26.9],[119.7,26.1],[119.7,25.6],[119.2,25.3],[118.7,24.8],[118.15,24.45],[117.47,23.7],[116.85,23.4],[115.6,22.85],[114.33,22.55],[113.5,22.22],[112.7,21.85],[111.2,21.55],[110.75,21.4],[110.4,20.8],[110.4,20.25],[109.9,20.22],[109.7,21.47],[108.12,21.65],[107.6,21.12],[106.7,20.7],[106.7,19.35],[105.6,18.6],[106.1,17.75],[108.1,16.03],[109.25,13.5],[109,11.3],[107.2,10.2],[105,9.1],[103.7,10.7],[102.5,12.6],[101.5,13],[100.7,12.9],[100.35,13.5],[99.95,12.6],[99.25,10.55],[98.7,10.3],[98.45,11.9],[98,13.8],[97.84,16.55],[96.5,16.15],[95.2,15.9],[94.8,16.55],[94.1,18.75],[92.35,20.7],[91.9,22],[90.9,22.3],[90,21.7],[88.2,21.6],[87.1,21.6],[86.8,20.6],[85.2,19.7],[83.5,18.7],[82.3,17.6],[80.3,15.9],[80.1,13],[79.8,11.4],[80.2,10.3],[79.5,9.45],[78,8.1],[76.6,8.7],[75.7,11.4],[74.5,14.9],[73.2,17.9],[72.7,19],[72.6,21],[70.6,21],[68.9,22.25],[69,23.4],[67.4,24],[65,25.4],[65,56]],
    [[121.56,25.29],[122.01,25.02],[121.83,24.57],[121.6,24.04],[121.53,23.52],[121.06,22.8],[120.91,22.03],[120.7,21.9],[120.58,22.35],[120.27,22.62],[120.02,23.1],[120.11,23.7],[120.52,24.25],[121,24.9],[121.29,25.13],[121.56,25.29]],
    [[110.7,20.12],[111.03,19.8],[110.68,19.2],[110.47,18.7],[109.95,18.32],[109.57,18.14],[109.05,18.38],[108.61,18.51],[108.61,19.21],[109.19,19.75],[109.85,19.99],[110.7,20.12]],
    [[119.52,23.78],[119.7,23.74],[119.68,23.53],[119.51,23.49],[119.52,23.78]],
    [[118.24,24.52],[118.43,24.5],[118.46,24.39],[118.27,24.37],[118.24,24.52]],
    [[126.1,34.45],[126.65,34.45],[126.9,33.57],[126.4,33.22],[126.12,33.3],[126.1,34.45]],
    [[129.55,33.8],[130.8,33.97],[131.15,33.48],[131.95,33.29],[131.7,32.7],[130.7,31.1],[130.2,31.0],[130.3,31.8],[129.6,32.3],[129.5,33.1],[129.55,33.8]],
    [[130.68,34.04],[132.1,34.4],[133.55,35.62],[135.15,35.71],[136.1,36.35],[137.38,36.78],[138.45,37.56],[139.77,38.9],[139.95,40.0],[140.38,41.45],[141.67,41.3],[142.1,40.33],[141.92,39.0],[141.27,37.91],[140.95,36.4],[139.68,35.0],[138.3,34.63],[137.03,34.56],[136.17,33.94],[135.79,33.44],[135.37,33.6],[134.73,34.34],[132.77,34.24],[132.13,33.8],[130.68,34.04]],
    [[132.14,33.37],[132.75,34.12],[133.55,33.9],[134.77,34.31],[134.57,33.67],[134.13,33.3],[133.15,33.38],[132.7,32.8],[132.14,33.37]],
  ];

  const notes = [
    '史实条目主要来自公开军史、档案说明和地方志，开局日期按主要事件或阶段近似设置。长春围困的不同阶段存在不同起算日。',
    '兵力、装备指数、部队开局落点、城市产值及模拟师团隶属为玩法参数。铁路标示历史线路的大致走向，陆路与海运连接支持游戏移动。战役图层按主要历史节点绘制，箭头和地段仅作地理示意。',
    '阶段性控制在城市节点上简化了城乡、驻军与民政差异。大连、旅顺在苏军军管期间各有民政机构，1950年12月另设旅大市。',
    '桂系、鲁系、川系、东北军为地方军事谱系标签，游戏中的部队归属仍遵循两方编制与场景。',
    '弹药、油料、医疗物资、工事等级、部队支援编制、士气与老兵经验为游戏参数。铁路补给按「后方库存—铁路线—车站—前线」的简化模型计算，地图上的运输瓶颈表示运量紧张，并不等于史料中的实际运量。',
    '补充的县级城镇采用当时的县名或并列今名，坐标与连线为游戏示意；每座新城按同一日期最近的历史城镇继承归属，因此战线附近的归属会随后续节点变化，而不代表逐村逐镇的精确控制。',
    '剧本中的物资系数与空中支援用于表达各战役的补给条件差异，不表示真实库存或出动架次。工事名称与规模参照当时的野战筑城做法，具体数值服务于玩法。',
    '金门和澎湖计入离岛目标。大陆胜利以全部大陆和海南可玩节点结算。',
  ];
  const sources = Object.values(sourcesById).map(([title,url]) => ({title,url}));

  const pingjinDetail = 'https://www.mod.gov.cn/gfbw/gfjy_index/16104241.html';
  const liaoshenDetail = 'https://www.mod.gov.cn/gfbw/gfjy_index/js_214151/4911864.html?big=fan';
  const jingzhangRail = 'https://www.ccdi.gov.cn/toutiao/201912/t20191231_206899.html';
  const guzhenRail = 'https://www.guzhen.gov.cn/zjgz/gzgk/gjjs/jptlgzhczjqhrjsl/index.html';
  const stations = [
    ['guzhen','固镇站',117.32,33.32,'east','安徽','津浦铁路固镇老站，位于宿县与蚌埠之间。',guzhenRail],
    ['xuanhua','宣化站',115.04,40.60,'north','河北','原京张铁路宣化府站，平绥铁路张家口段的车站。',jingzhangRail],
    ['shalingzi','沙岭子站',114.94,40.67,'north','河北','原京张铁路沙岭子站，位于宣化与张家口之间。',jingzhangRail],
  ];
  for (const [id,name,lon,lat,region,province,detail,source] of stations) {
    cities.push({id,name,lon,lat,region,province,detail,source,terrain:'rail',value:1});
  }
  const stationSegments = [
    ['suxian','bengbu',['guzhen']],
    ['xinbaoan','zhangjiakou',['xuanhua','shalingzi']],
  ];
  for (const [start,end,stops] of stationSegments) {
    routeTypes[[start,end].sort().join('|')] = 'land';
    const segment = [start,...stops,end];
    for (let i = 1; i < segment.length; i++) {
      const link = [segment[i-1],segment[i]];
      links.push(link);
      routeTypes[link.slice().sort().join('|')] = 'rail';
    }
    for (const layer of battleLayers) {
      let included = false;
      for (const path of layer.paths) {
        for (let i = path.points.length - 1; i >= 1; i--) {
          if (path.points[i-1] === start && path.points[i] === end) {
            path.points.splice(i,0,...stops);
            included = true;
          } else if (path.points[i-1] === end && path.points[i] === start) {
            path.points.splice(i,0,...stops.slice().reverse());
            included = true;
          }
        }
      }
      if (included) layer.points = [...new Set([...layer.points,...stops])];
    }
  }
  const deploy = (name,side,city,unitId) => ({name,side,city,...(unitId ? {unitId} : {})});
  const historyCheckpoints = [
    {id:'liao-start',scenarioId:'liaoshen',city:'jinzhou',date:'1948-09-12',title:'辽沈战役开局',
      summary:'战役在北宁铁路沿线展开。锦州和沈阳为国民党军控制，东北野战军在辽西展开行动。',
      source:liaoshenDetail,related:['shanhaiguan','shenyang','yixian'],overrides:{jinzhou:'roc',shenyang:'roc'},
      deployments:[deploy('锦州指挥所','roc','jinzhou','rj-command')]},
    {id:'liao-tashan',scenarioId:'tashan',city:'tashan',date:'1948-10-10',title:'塔山交战开始',
      summary:'东北野战军第4纵队等部在塔山地区防守。国民党军东进兵团自锦西、葫芦岛方向行动。',
      source:src('tashan'),related:['jinzhou','huludao'],overrides:{tashan:'ccp',huludao:'roc',jinzhou:'roc'},
      deployments:[deploy('东北野战军第4纵队','ccp','tashan','nw4'),deploy('国民党军东进兵团','roc','huludao','r17')]},
    {id:'liao-jinzhou',scenarioId:'jinzhou',city:'jinzhou',date:'1948-10-14',title:'锦州攻城当日',
      summary:'东北野战军向锦州发动总攻。范汉杰所部守城，塔山一线的战斗仍在进行。',
      source:liaoshenDetail,related:['tashan','yixian','huludao','goubangzi'],overrides:{jinzhou:'roc',tashan:'ccp'},
      deployments:[deploy('锦州指挥所','roc','jinzhou','rj-command'),deploy('东北野战军第4纵队','ccp','tashan','nw4')]},
    {id:'liao-heishan',scenarioId:'liaoshen',city:'heishan',date:'1948-10-23',title:'黑山、大虎山方向交战',
      summary:'廖耀湘兵团与东北野战军在黑山、大虎山方向交战。锦州已于此前易手。',
      source:liaoshenDetail,related:['dahushan','xinlitun','jinzhou'],overrides:{jinzhou:'ccp'},deployments:[]},
    {id:'huai-start',scenarioId:'huaihai',city:'xuzhou',date:'1948-11-06',title:'淮海战役开局',
      summary:'战役从徐州周边展开。黄百韬第7兵团此时在新安镇方向，陇海铁路连接新安镇、碾庄与徐州。',
      source:src('huaihaiCanal'),related:['xinanzhen','haizhou','nianzhuangstation','lincheng'],overrides:{xuzhou:'roc'},
      deployments:[deploy('国民党军第7兵团','roc','xinanzhen')]},
    {id:'huai-suxian',scenarioId:'huaihai',city:'suxian',date:'1948-11-16',title:'宿县易手',
      summary:'中原野战军攻占宿县，徐州与蚌埠之间的津浦铁路通路被切断。固镇站在这段铁路上。',
      source:src('suxian'),related:['xuzhou','guzhen','bengbu'],overrides:{suxian:'ccp'},deployments:[]},
    {id:'huai-nianzhuang',scenarioId:'huaihai',city:'nianzhuang',date:'1948-11-21',title:'碾庄圩围困后期',
      summary:'黄百韬第7兵团已集中在碾庄圩一带，11月22日该地战斗结束。',
      source:src('nianzhuang'),related:['xuzhou','nianzhuangstation','yunhebridge'],overrides:{nianzhuang:'roc'},
      deployments:[deploy('国民党军第7兵团','roc','nianzhuang')]},
    {id:'huai-shuangduiji',scenarioId:'huaihai',city:'shuangduiji',date:'1948-12-14',title:'双堆集交战后期',
      summary:'黄维第12兵团被围在双堆集一带，战斗持续到12月15日。',
      source:'https://www.81.mil.cn/js_208592/16289910.html',related:['guzhen','suxian','bengbu'],
      deployments:[deploy('国民党军第12兵团','roc','shuangduiji')]},
    {id:'ping-zhangjiakou',scenarioId:'pingjin',city:'zhangjiakou',date:'1948-11-29',title:'平津战役西线开局',
      summary:'华北军区第3兵团在张家口外围展开行动。宣化与沙岭子位于张家口东南的铁路沿线。',
      source:'https://www.handandangshi.gov.cn/dianxingzhanyi/961.html',related:['xuanhua','shalingzi','xinbaoan'],
      overrides:{zhangjiakou:'roc'},deployments:[]},
    {id:'ping-xinbaoan',scenarioId:'pingjin',city:'xinbaoan',date:'1948-12-22',title:'新保安攻城当日',
      summary:'华北军区第2兵团在新保安发起总攻，国民党军第35军守在城内。',
      source:pingjinDetail,related:['xuanhua','shalingzi','zhangjiakou'],overrides:{xinbaoan:'roc'},
      deployments:[deploy('国民党军第35军','roc','xinbaoan','r35')]},
    {id:'ping-tianjin',scenarioId:'pingjin',city:'tianjin',date:'1949-01-14',title:'天津战斗开始',
      summary:'东北野战军在天津发起总攻，国民党天津警备部队仍在城内防守。',
      source:pingjinDetail,related:['beiping','tanggu','yangcun'],overrides:{tianjin:'roc'},deployments:[]},
  ];
  sources.push({title:'平津战役军史',url:pingjinDetail},{title:'京张铁路沿线车站',url:jingzhangRail},
    {title:'津浦铁路固镇老站',url:guzhenRail});
  globalThis.CivilWarData = {cities,links,routeTypes,battleLayers,historyCheckpoints,leaders,units,scenarios,events,anchors,sources,groups,capitals,land,notes};
})();

