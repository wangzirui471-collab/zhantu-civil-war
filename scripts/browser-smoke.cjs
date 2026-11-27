const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { setTimeout: wait } = require('node:timers/promises');

async function poll(read, predicate = Boolean) {
  for (let count = 0; count < 100; count++) {
    try {
      const value = await read();
      if (predicate(value)) return value;
    } catch (error) {
      if (count === 99) throw error;
    }
    await wait(70);
  }
  throw new Error('浏览器验证超时。');
}

async function main() {
  // 测试服务器只在内存中注入状态读取入口，正式游戏文件不包含该入口。
  const root = path.resolve(__dirname, '..');
  const server = http.createServer(async (request, response) => {
    try {
      const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      const filename = path.resolve(root, relative);
      if (!filename.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
      let data = await fs.readFile(filename);
      if (relative === 'app.js') {
        const marker = '  restoreSavedGame().catch(() => {';
        const source = data.toString('utf8');
        assert(source.includes(marker), '找不到测试入口位置');
        data = Buffer.from(source.replace(marker,
          '  Object.defineProperty(window, "__smokeState", { get: () => state });\n' + marker));
      }
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }[path.extname(filename)] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' }); response.end(data);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const binary = process.env.CIVIL_WAR_CHROMIUM
    || path.join(process.env.ProgramFiles || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe');
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'civil-war-map-'));
  const child = spawn(binary, ['--headless', '--no-sandbox', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=0', '--window-size=1440,930', '--user-data-dir=' + profile, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
  let socket;
  const errors = [];
  child.on('error', (error) => errors.push(error.message));
  try {
    const endpoint = await poll(() => fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8'));
    const port = endpoint.split(/\s+/)[0];
    const targets = await poll(async () => (await fetch('http://127.0.0.1:' + port + '/json/list')).json(),
      (items) => items.some((item) => item.type === 'page'));
    socket = new WebSocket(targets.find((item) => item.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let id = 0;
    const callbacks = new Map();
    socket.addEventListener('message', (event) => {
      const reply = JSON.parse(event.data);
      if (reply.method === 'Runtime.exceptionThrown') errors.push(reply.params.exceptionDetails.text
        + ': ' + reply.params.exceptionDetails.exception?.description);
      const callback = callbacks.get(reply.id);
      if (!callback) return;
      callbacks.delete(reply.id);
      if (reply.error) callback.reject(Error(reply.error.message));
      else callback.resolve(reply.result);
    });
    const request = (method, params = {}) => new Promise((resolve, reject) => {
      callbacks.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const reply = await request('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || reply.exceptionDetails.text);
      return reply.result.value;
    };
    const click = (query) => evaluate('document.querySelector(' + JSON.stringify(query) + ').click()');
    const value = (query) => evaluate('document.querySelector(' + JSON.stringify(query) + ').textContent');
    const set = (query, next) => evaluate('document.querySelector(' + JSON.stringify(query) + ').value=' + JSON.stringify(next));
    const choose = (query, next) => evaluate('(() => { const node = document.querySelector(' + JSON.stringify(query)
      + '); node.value = ' + JSON.stringify(next) + '; node.dispatchEvent(new Event("change", { bubbles: true })); })()');
    const state = () => evaluate('structuredClone(window.__smokeState)');
    const point = (city) => evaluate(`(() => {
      const r = document.querySelector('#map').getBoundingClientRect();
      const [x,y] = window.testMap.point(${JSON.stringify(city)});
      return [r.left + x, r.top + y];
    })()`);
    const mouse = (type, [x, y], button = 'left', modifiers = 0) => request('Input.dispatchMouseEvent',
      { type, x, y, button, modifiers, buttons: type === 'mouseReleased' ? 0 : button === 'right' ? 2 : 1, clickCount: 1 });

    await request('Runtime.enable');
    await request('Page.enable');
    await request('Page.addScriptToEvaluateOnNewDocument', { source: `
      Object.defineProperty(globalThis, 'CivilWarMap', { configurable: true, set(object) {
        const mount = object.mount;
        object.mount = function (...args) {
          window.testMap = mount(...args);
          return window.testMap;
        };
        Object.defineProperty(globalThis, 'CivilWarMap', { value: object });
      } });
    ` });
    const url = process.env.CIVIL_WAR_URL
      || 'http://127.0.0.1:' + server.address().port + '/';
    await request('Page.navigate', { url });
    await poll(() => value('#date'), (label) => label === '1946.06.26');
    assert.equal(await value('#date'), '1946.06.26');
    await poll(() => evaluate('document.querySelector("#dialog").open'));
    assert((await value('#dialog-title')).includes('新手必修'));
    assert(await evaluate('document.querySelector("#dialog-close").disabled'));
    await click('#tutorial-start');
    assert.equal(await evaluate('!!document.querySelector("[data-tutorial-skip]")'), false);
    await click('[data-scenario=liaoshen]');
    assert((await value('#tutorial-card')).includes('选中部队'), '必修教学期间不应切换剧本');
    await click('[data-tutorial-next]');
    await click('[data-tutorial-next]');
    const tutorialTarget = await point('jinzhou');
    await mouse('mousePressed', tutorialTarget);
    await mouse('mouseReleased', tutorialTarget);
    assert((await value('#tutorial-card')).includes('推进时间'));
    await click('[data-tutorial-next]');
    assert((await value('#tutorial-card')).includes('查看结果'));
    await click('[data-tutorial-next]');
    await click('#dialog-close');
    await click('[data-tutorial-next]');
    assert(await evaluate('document.querySelector("#tutorial-card").hidden'));
    await click('[data-scenario=war1946]');
    await set('#start-form [name=difficulty]', 'hard');
    await click('#start-form [type=submit]');
    assert.equal((await state()).difficulty, 'hard');
    assert.equal(await value('#date'), '1946.06.26');
    assert.equal(await evaluate('document.querySelector("[data-scenario=war1946]").getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelector("[data-layer=situation]").getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelector("[data-overlay=terrainBack]").getAttribute("aria-pressed")'), 'true');
    await click('[data-overlay=terrainBack]');
    assert.equal(await evaluate('document.querySelector("[data-overlay=terrainBack]").getAttribute("aria-pressed")'), 'false');
    await click('[data-overlay=terrainBack]');
    assert.equal(await evaluate('document.querySelector("[data-overlay=terrainBack]").getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelector("#territory-note").hidden'), false);
    if (process.env.CIVIL_WAR_TERRITORY_SCREENSHOT) {
      const shot = await request('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(process.env.CIVIL_WAR_TERRITORY_SCREENSHOT, Buffer.from(shot.data, 'base64'));
    }
    await click('[data-layer=faction]');
    assert(await evaluate('!document.querySelector("#faction-key").hidden && document.querySelector("#faction-key").children.length >= 2'), '派系图应显示颜色说明');
    await click('[data-layer=terrain]');
    assert(await evaluate('document.querySelector("#territory-note").hidden'), '地形图应隐藏势力范围说明');
    await click('[data-layer=situation]');
    await click('[data-scenario=liaoshen]');
    await click('#start-form [type=submit]');
    await poll(() => value('#date'), (label) => label === '1948.09.12');
    const originalMapWidth = await evaluate('document.querySelector("#map").getBoundingClientRect().width');
    await click('#map-expand');
    await wait(180);
    assert.equal(await evaluate('document.querySelector("#map-expand").getAttribute("aria-pressed")'), 'true');
    assert(await evaluate('document.querySelector("#map").getBoundingClientRect().width') > originalMapWidth + 200,
      '大地图视图应扩大地图画布');
    await click('#map-expand');
    await wait(180);
    assert.equal(await evaluate('document.querySelector("#map-expand").getAttribute("aria-pressed")'), 'false');
    const zoomExpansion = await evaluate(`(() => {
      const distance = () => { const a = testMap.point('jinzhou'), b = testMap.point('tashan');
        return Math.hypot(a[0] - b[0], a[1] - b[1]); };
      testMap.zoom(10); const before = distance(); testMap.zoom(2); const after = distance();
      testMap.focus('northeast', 'jinzhou'); return after / before;
    })()`);
    assert(zoomExpansion > 1.4, '高倍率下地图应仍可继续放大');
    const separation = () => evaluate(`(() => { const a = testMap.point('jinzhou'), b = testMap.point('tashan');
      return Math.hypot(a[0] - b[0], a[1] - b[1]); })()`);
    const beforeDetail = await separation();
    await click('#detail-view');
    const afterDetail = await separation();
    assert(afterDetail > beforeDetail * 3, '局部视角应放大地图的实际城镇间距');
    await evaluate('testMap.zoom(1000)');
    assert(await separation() > afterDetail * 10, '地图高倍率应继续提供空间');
    await evaluate("testMap.focus('northeast', 'jinzhou')");
    await evaluate('testMap.zoom(2)');
    const selectFigure = async (except) => {
      const figure = await evaluate(`(() => {
        const r = document.querySelector('#map').getBoundingClientRect();
        return testMap.markers().filter(m => m.figure && m.side === 'ccp' && m.unitId !== ${JSON.stringify(except || '')})
          .map(m => ({ ...m, x: m.left + m.width / 2, y: m.top + m.height / 2, rx: r.left, ry: r.top }))
          .find(m => m.x > 5 && m.y > 5 && m.x < r.width - 5 && m.y < r.height - 5
            && testMap.hitTest(m.x, m.y)?.unitId === m.unitId && testMap.hitTest(m.x, m.y)?.figure);
      })()`);
      assert(figure, '地图上应有可直接点选的己方三维人物');
      const expected = await evaluate(`window.__smokeState.units.find(unit => unit.id === ${JSON.stringify(figure.unitId)})?.name`);
      await mouse('mousePressed', [figure.rx + figure.x, figure.ry + figure.y]);
      await mouse('mouseReleased', [figure.rx + figure.x, figure.ry + figure.y]);
      assert(expected && (await value('#deck-unit')).includes(expected), '点击人物应选择其所属部队');
      return figure.unitId;
    };
    const firstFigure = await selectFigure();
    const secondFigure = await selectFigure(firstFigure);
    assert.notEqual(firstFigure, secondFigure, '不同部队人物应可分别选择');
    assert(await evaluate(`(() => { const readout = document.querySelector('.unit-readout');
      const headline = document.querySelector('.unit-headline');
      return readout && headline && readout.getBoundingClientRect().width >= headline.getBoundingClientRect().width * .85; })()`),
    '部队数据应占据整行，不能被头像和模型挤成窄列');
    if (process.env.CIVIL_WAR_FIGURE_SCREENSHOT) {
      const screenshot = await request('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(process.env.CIVIL_WAR_FIGURE_SCREENSHOT, Buffer.from(screenshot.data, 'base64'));
    }
    await evaluate("testMap.focus('northeast', 'jinzhou')");
    assert.equal(await evaluate('document.querySelector("#map").dataset.humanModel'), 'webgl',
      '浏览器应实际启用 WebGL 人物模型');
    assert(await evaluate(`(() => {
      const renderer = CivilWarHuman3D.createRenderer();
      const frame = renderer.frame('ccp', true, 200);
      const pixels = frame.getContext('2d').getImageData(0, 0, frame.width, frame.height).data;
      let visible = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visible++;
      return visible > 100;
    })()`), '三维模型应真实绘制出可见人物');
    const clippedSprites = await evaluate(`(() => {
      const r = CivilWarHuman3D.createRenderer(), bad = [];
      const scenes = [['human','march'],['human','fire'],['human','entrench'],['human','rest'],['human','sleep'],
        ['tank','march'],['tank','fire'],['artillery','fire'],['aircraft','march']];
      for (const [kind, action] of scenes) for (const side of ['ccp','roc']) for (const phase of [0, 550]) {
        const frame = r.frame(side,true,phase,kind,action), w=frame.width, p=frame.getContext('2d').getImageData(0,0,w,w).data;
        let edge=false; for(let x=0;x<w;x++) if(p[x*4+3] || p[((w-1)*w+x)*4+3]) edge=true;
        for(let y=0;y<w;y++) if(p[y*w*4+3] || p[(y*w+w-1)*4+3]) edge=true;
        if(edge) bad.push(kind+'/'+action+'/'+side+'/'+phase);
      }
      return bad;
    })()`);
    assert.deepEqual(clippedSprites, [], '地图模型不应被精灵画布裁切：' + clippedSprites.join('、'));
    assert(await evaluate('document.documentElement.scrollHeight <= innerHeight'));
    assert(await evaluate('CivilWarGeography.grids.length === 3 && CivilWarGeography.provinces.length > 30'));
    const mapImageBefore = await evaluate('document.querySelector("#map").toDataURL().length');
    await click('[data-layer=contour]');
    assert.notEqual(await evaluate('document.querySelector("#map").toDataURL().length'), mapImageBefore);
    await click('[data-layer=terrain]');
    assert(await evaluate('CivilWarData.cities.some(city => city.name === "旅顺")'));
    assert(await evaluate('CivilWarData.routeTypes["shanghai|taipei"] !== "rail"'));

    await click('[data-scenario=jinzhou]');
    await set('#start-form [name=side]', 'roc');
    await click('#start-form [type=submit]');
    assert.equal(await value('#date'), '1948.10.14');
    assert.equal(await value('#player-name'), '中国国民党');
    await click('#air-command');
    await click('[data-air-mission=cas]');
    assert.equal((await state()).airWar.roc.mission, 'cas');
    await click('#dialog-close');
    await click('#navy-command');
    await choose('[data-sea-zone="黄海"]', 'patrol');
    await click('[data-naval-save]');
    assert((await value('#toast')).includes('吨位不足'));
    await choose('[data-sea-zone="黄海"]', 'escort');
    await click('[data-naval-save]');
    assert.equal((await state()).seaZones['黄海'].roc.mission, 'escort');
    await choose('[data-sea-zone="黄海"]', '');
    await click('[data-naval-save]');
    assert.equal((await state()).seaZones['黄海']?.roc, undefined);
    await click('#dialog-close');
    await click('[data-stage-report]');
    assert.equal(await value('#dialog-title'), '阶段战报');
    await click('#continue-national');
    assert.equal((await state()).scope, 'national');
    await click('#theater-view');
    assert.equal((await state()).scope, 'theater');

    await click('#change-side');
    await click('[data-control-side=ccp]');
    assert.equal((await state()).player, 'ccp');
    await click('#tab-army');
    await click('#inspector-body [data-unit=nw3]');
    await click('[data-appoint=nw3]');
    await set('#dialog form [name=leader]', '');
    await click('#dialog form button[type=submit]');
    assert.equal((await state()).units.find((unit) => unit.id === 'nw3').leader, null);
    await click('[data-delegate=nw3]');
    await set('#dialog form [name=target]', 'jinzhou');
    await click('#dialog form button[type=submit]');
    assert.equal((await state()).units.find((unit) => unit.id === 'nw3').delegateTarget, 'jinzhou');
    await click('[data-delegate=nw3]');
    assert(await evaluate('document.querySelectorAll(".formation-table tbody tr").length >= 9'));
    await click('.formation-table [data-unit=nw3-d1-r1]');
    await click('[data-command=hold]');
    assert(await value('#toast').then((message) => message.includes('已下达')));
    const regiment = (await state()).units.find((unit) => unit.level === 'regiment' && unit.order?.type === 'hold');
    assert(regiment, '团级命令应写入当前战局');
    assert.equal(regiment.manualAssignment, true, '手动命令应保留玩家对该团的控制');
    assert((await value('#inspector-body')).includes('位置与任务'));
    await click('[data-release-ai="' + regiment.id + '"]');
    const released = (await state()).units.find((unit) => unit.id === regiment.id);
    assert.equal(released.manualAssignment, undefined, '交给 AI 后应解除手动控制');
    assert.equal(released.order, undefined, '交给 AI 后应清除此前的手动任务');

    const opponentPoint = await point('jinzhou');
    await mouse('mousePressed', opponentPoint, 'right');
    await mouse('mouseReleased', opponentPoint, 'right');
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.type, 'advance', await value('#toast'));

    const originPoint = await point('yixian');
    const card = [originPoint[0], originPoint[1] + 16];
    await click('[data-command=hold]');
    await mouse('mousePressed', card);
    await mouse('mouseMoved', opponentPoint);
    await mouse('mouseReleased', opponentPoint);
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.target, 'jinzhou');

    await click('[data-command=siege]');
    await click('[data-deck-target]');
    await set('#dialog form [name=target]', 'jinzhou');
    await click('#dialog form button[type=submit]');
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.type, 'siege', await value('#toast'));

    await click('[data-command=intercept]');
    await mouse('mousePressed', opponentPoint);
    await mouse('mouseReleased', opponentPoint);
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.type, 'intercept', await value('#toast'));

    // 验证新增直出战术：挖战壕、城内休整与右上角夜间宿营切换
    await click('[data-command=entrench]');
    await click('[data-deck-here]');
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.type, 'entrench', await value('#toast'));
    await click('[data-command=rest]');
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).order.type, 'rest', await value('#toast'));
    await click('#night-toggle');
    assert.equal((await state()).nightMode, true);
    await click('#night-toggle');
    assert.equal((await state()).nightMode, false);

    await click('#gear');
    await click('[name=profile][value=artillery]');
    assert.equal((await state()).units.find((unit) => unit.id === regiment.id).profile, 'artillery', await value('#toast'));
    await click('#dialog-close');

    await click('#history-mode');
    await click('[data-history-setting=historical]');
    const check = await evaluate('document.querySelector("[data-event-check]").dataset.eventCheck');
    await click('[data-event-check=' + check + ']');
    assert.equal((await state()).historyMode, 'historical');
    assert.equal((await state()).historicalEvents[check], false);
    await click('[data-history-setting=dynamic]');
    await click('#dialog-close');

    const before = await state();
    await click('#forecast');
    await set('#forecast-months', '6');
    await click('#run-forecast');
    assert.equal(await evaluate('document.querySelectorAll("#forecast-output tbody tr").length'), 6);
    assert.deepEqual(await state(), before);
    await click('#dialog-close');

    await click('#economy');
    await set('select[name=recruit]', 'high');
    await click('#policy-form button[type=submit]');
    assert.equal((await state()).policies.recruit, 'high');
    for (let day = 0; day < 6; day++) await click('#step');
    assert.equal(await value('#date'), '1948.10.20');
    assert(await evaluate('document.querySelector("#save-menu").disabled'), '应关闭存档入口');
    assert.equal(await evaluate(`(() => { localStorage.setItem('smoke', 'x'); return localStorage.getItem('smoke'); })()`), null);
    assert.equal(await evaluate('typeof indexedDB'), 'undefined');

    await click('#groups');
    assert((await value('#dialog-body')).includes('桂系'));
    assert((await value('#dialog-body')).includes('青海马步芳'));
    assert((await value('#dialog-body')).includes('胡宗南'));
    assert((await value('#dialog-body')).includes('西藏'));
    await click('[data-group-control=guixi]');
    assert.equal((await state()).group, 'guixi');
    assert.equal((await state()).player, 'roc');
    await click('#archive');
    assert((await value('#dialog-body')).includes('将领档案'));
    const photos = await evaluate('Promise.all([...document.images].map(img => img.decode())).then(() => document.images.length)');
    assert(photos >= 30);
    await click('#dialog-close');
    await click('#national-view');
    assert((await state()).owners.nianzhuang);

    await click('[data-scenario=tashan]');
    await set('#start-form [name=side]', 'ccp');
    await click('#start-form [type=submit]');
    assert.equal((await state()).owners.tashan, 'ccp');
    assert.equal((await state()).player, 'ccp');
    assert((await value('#inspector-body')).includes('守住塔山'));
    await click('[data-scenario=tashan]');
    await set('#start-form [name=side]', 'roc');
    await click('#start-form [type=submit]');
    assert((await value('#inspector-body')).includes('控制塔山'));
    await click('#territory-report');
    assert((await value('#dialog-body')).includes('城镇控制数'));
    await click('#dialog-close');

    await click('#forecast');
    await set('#forecast-months', '6');
    await click('#compare-forecast');
    const formalSave = await state();
    await click('#calculate-comparison');
    assert.equal(await evaluate('document.querySelectorAll(".comparison-table tbody tr").length'), 6);
    assert(await value('#comparison-output').then((text) => text.includes('粮食') && text.includes('整补结束')));
    assert.deepEqual(await state(), formalSave);
    await click('#dialog-close');

    await click('#tutorial-open');
    await click('#tutorial-start');
    assert((await value('#tutorial-card')).includes('选中部队'));
    await click('[data-tutorial-next]');
    assert((await value('#deck-unit')).includes('第3纵队'));
    await click('[data-tutorial-next]');
    const jinzhou = await point('jinzhou');
    await mouse('mouseMoved', jinzhou);
    await mouse('mousePressed', jinzhou);
    await mouse('mouseReleased', jinzhou);
    assert((await value('#tutorial-card')).includes('推进时间'));
    await click('[data-tutorial-next]');
    assert((await value('#tutorial-card')).includes('查看结果'));
    await click('[data-tutorial-next]');
    assert.equal(await value('#dialog-title'), '战况简报');
    const tutorialDate = await value('#date');
    await click('#dialog-close');
    await click('[data-tutorial-next]');
    assert((await value('#inspector-body')).includes('塔山'));
    assert.equal(await value('#date'), tutorialDate);
    assert(await evaluate('document.querySelector("#tutorial-card").hidden'));

    // 作战计划：Ctrl 多选、新建、预览、执行、暂停、委任
    await click('[data-scenario=jinzhou]');
    await set('#start-form [name=side]', 'ccp');
    await click('#start-form [type=submit]');
    for (const city of ['yixian', 'xingcheng']) {
      const card = await point(city);
      const spot = [card[0], card[1] + 16];
      await mouse('mousePressed', spot, 'left', 2);
      await mouse('mouseReleased', spot, 'left', 2);
    }
    assert((await value('#deck-unit')).includes('编队 2 支'), await value('#toast'));
    await click('[data-deck-plan]');
    assert.equal(await evaluate('document.querySelectorAll("#plan-form .plan-picker input:checked").length'), 2);
    await click('[data-plan-back]');
    await click('#plans');
    assert((await value('#dialog-body')).includes('作战计划'));
    await click('[data-plan-new]');
    assert(await evaluate('document.querySelectorAll("#plan-form .plan-picker input").length > 1'));
    await evaluate(`(() => {
      const boxes = [...document.querySelectorAll('#plan-form .plan-picker input')];
      boxes.slice(0, 2).forEach((box) => { box.checked = true; });
    })()`);
    await set('#plan-form [name=target]', 'jinzhou');
    await set('#plan-form [name=mode]', 'advance');
    assert(await evaluate('!!document.querySelector("#plan-form [name=stance]") && !!document.querySelector("#plan-form [name=lineMode]")'));
    await set('#plan-form [name=stance]', 'hold');
    await click('#plan-form button[type=submit]');
    assert.equal((await state()).plans.length, 1);
    assert.equal((await state()).plans[0].stance, 'hold');
    assert.equal((await state()).plans[0].autoLine, true);
    assert((await value('#dialog-body')).includes('执行'));
    await click('[data-plan-run]');
    assert.equal((await state()).plans[0].status, 'active');
    await click('[data-plan-pause]');
    assert.equal((await state()).plans[0].status, 'paused');
    await click('[data-plan-delegate]');
    assert.equal((await state()).plans[0].delegated, true);
    await click('[data-plan-remove]');
    assert.equal((await state()).plans.length, 0);
    await click('[data-plan-close]');

    // 政治决议与撤销
    await click('#politics');
    const politicsText = await value('#dialog-body');
    assert(politicsText.includes('政治点'));
    assert(politicsText.includes('策反'));
    assert(politicsText.includes('整军'));
    await evaluate(`(() => {
      const select = document.querySelector('.decision-card select[name=city]');
      if (select && select.options.length) select.value = select.options[0].value;
    })()`);
    await click('[data-decide=reorganize]');
    assert.ok((await state()).political.ccp.cooldowns.reorganize > 0);
    await click('[data-politics-close]');
    await click('[data-deck-undo]');
    assert.ok(!(await state()).political.ccp.cooldowns.reorganize, '撤销应回滚决议');

    // 国防与建设：国策、科研、生产、编制、空军、指挥、情报
    await click('#defense');
    assert((await value('#dialog-body')).includes('国策'));
    await click('[data-focus=land-reform]');
    assert.equal((await state()).focus.ccp.current, 'land-reform');
    await click('[data-defense-tab=tech]');
    await click('[data-tech=infantry]');
    assert.equal((await state()).research.ccp.levels.infantry, 1, await value('#toast'));
    await click('[data-defense-tab=production]');
    await set('#production-form [name=infantry]', '50');
    await set('#production-form [name=artillery]', '25');
    await set('#production-form [name=armor]', '10');
    await set('#production-form [name=air]', '15');
    await set('#production-form [name=naval]', '0');
    await click('#production-form button[type=submit]');
    assert.equal((await state()).production.ccp.lines.infantry, 50, await value('#toast'));
    await click('[data-defense-tab=design]');
    const designsBefore = (await state()).designs.ccp.length;
    await set('#design-form [name=infantry]', '7');
    await set('#design-form [name=artillery]', '4');
    await click('#design-form button[type=submit]');
    assert.equal((await state()).designs.ccp.length, designsBefore + 1, await value('#toast'));
    await click('[data-defense-tab=air]');
    await click('[data-air-mission=cas]');
    assert.equal((await state()).airWar.ccp.mission, 'cas');
    await click('[data-defense-tab=command]');
    await evaluate(`(() => {
      const select = document.querySelector('select[name=command-unit]');
      if (select && select.options.length) select.selectedIndex = 0;
    })()`);
    await click('[data-command=forcedMarch]');
    assert.ok((await state()).buffs.some((buff) => buff.kind === 'forcedMarch'), await value('#toast'));
    await click('[data-defense-tab=intel]');
    await click('[data-intel=recon]');
    assert.ok((await state()).intel.ccp.level > 35);
    assert((await value('#dialog-body')).includes('美国') && (await value('#dialog-body')).includes('苏联'));
    assert(await evaluate('document.querySelector("[data-foreign=ussr][data-foreign-action=request-aid]").disabled'));
    assert(await evaluate('typeof CivilWarSaveStore?.create === "function"'));
    await click('[data-defense-tab=navy]');
    await choose('[data-sea-zone="黄海"]', 'raid');
    await click('[data-naval-save]');
    assert.equal((await state()).navy.ccp.zones['黄海'].mission, 'raid', '海军部署应写入游戏状态');
    await click('[data-defense-tab=navy]');
    assert((await value('#dialog-body')).includes('运输船'));
    await click('#dialog-close');

    // 工事：修筑战壕并推进到完工
    await click('#find-city');
    await set('#dialog form [name=target]', 'yixian');
    await click('#dialog form button[type=submit]');
    assert((await value('#inspector-body')).includes('工事与补给'));
    await click('[data-forts=yixian]');
    assert((await value('#dialog-body')).includes('战壕'));
    assert((await value('#dialog-body')).includes('固定炮位'));
    await click('[data-fort-build=trench]');
    assert.equal((await state()).works.length, 1);
    await click('[data-fort-close]');
    for (let day = 0; day < 7; day++) await click('#step');
    assert.equal((await state()).forts.yixian.trench, 1);

    // 铁路补给面板与地图图层
    await click('#supply');
    const supplyText = await value('#dialog-body');
    assert(supplyText.includes('后方库存'));
    assert(supplyText.includes('运输瓶颈'));
    assert(supplyText.includes('补给覆盖'));
    await click('[data-supply-overlay]');
    assert.equal(await evaluate('document.querySelector("[data-overlay=supply]").getAttribute("aria-pressed")'), 'true');

    // 编制：调整医护支援
    await click('#tab-army');
    const supportUnit = await evaluate('document.querySelector("#inspector-body [data-unit]").dataset.unit');
    await click('#inspector-body [data-unit=' + supportUnit + ']');
    await click('[data-formation]');
    assert((await value('#dialog-body')).includes('装甲'));
    assert((await value('#dialog-body')).includes('医护'));
    await evaluate(`(() => {
      const input = document.querySelector('#support-form input[name=medical]');
      input.value = 82;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await click('#support-form button[type=submit]');
    assert.ok((await state()).units.some((unit) => unit.support?.medical === 82));
    await click('#dialog-close');

    // 战报后果与累计战果（多日战役需要更长的推进时间）
    await evaluate(`(() => { const back = document.querySelector('[data-back-roster]'); if (back) back.click(); })()`);
    await click('#tab-army');
    await click('#inspector-body [data-unit=nw3]');
    await click('[data-command=advance]');
    const jinzhouPoint = await point('jinzhou');
    await mouse('mousePressed', jinzhouPoint);
    await mouse('mouseReleased', jinzhouPoint);
    assert.equal((await state()).units.find((unit) => unit.id === 'nw3').order.type, 'advance', await value('#toast'));
    let sawBattleAnimation = false;
    for (let day = 0; day < 60; day++) {
      await click('#step');
      if (!sawBattleAnimation && Object.keys((await state()).battles || {}).length) {
        assert.equal(await evaluate('document.querySelector("#battle-hud").hidden'), false,
          '进行中的战斗应立即显示战场指挥面板');
        const battleChoice = await evaluate(`(() => {
          const saved = window.__smokeState;
          const city = document.querySelector('#battle-hud [data-battle-posture]')?.dataset.battleCity;
          const battle = saved.battles?.[city];
          const posture = saved.player === battle?.side ? 'assault' : 'hold';
          const button = [...document.querySelectorAll('#battle-hud [data-battle-posture]')]
            .find((item) => item.dataset.battlePosture === posture);
          return { city, posture, available: Boolean(button && !button.disabled) };
        })()`);
        if (battleChoice.available) {
          await click('#battle-hud [data-battle-posture=' + battleChoice.posture + ']');
          const changed = await state();
          assert.equal(changed.battles[battleChoice.city].postureBySide?.[changed.player], battleChoice.posture,
            '玩家应能在战斗进行中切换进攻或坚守姿态');
        }
        sawBattleAnimation = await evaluate(`new Promise((resolve) => {
          const canvas = document.querySelector('#map');
          const context = canvas.getContext('2d');
          const before = context.getImageData(0, 0, canvas.width, canvas.height).data;
          setTimeout(() => {
            const after = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let changed = 0;
            for (let index = 0; index < after.length; index += 28) {
              if (after[index] !== before[index] || after[index + 1] !== before[index + 1]
                || after[index + 2] !== before[index + 2]) changed += 1;
              if (changed > 12) break;
            }
            resolve(changed > 12);
          }, 220);
        })`);
        if (sawBattleAnimation && process.env.CIVIL_WAR_BATTLE_SCREENSHOT) {
          await wait(620);
          const battleFrame = await request('Page.captureScreenshot', { format: 'png' });
          await fs.writeFile(process.env.CIVIL_WAR_BATTLE_SCREENSHOT, Buffer.from(battleFrame.data, 'base64'));
        }
      }
    }
    assert(sawBattleAnimation, '地图上应有持续更新的战斗动效');
    await click('#show-log');
    assert((await value('#dialog-body')).includes('累计战果'));
    await choose('#brief-filter', 'all');
    const battleIndex = await evaluate(`(() => {
      const button = [...document.querySelectorAll('#brief-list [data-brief-index]')]
        .find((item) => item.textContent.includes('战斗结束') || item.textContent.includes('围攻受挫'));
      return button ? button.dataset.briefIndex : null;
    })()`);
    assert(battleIndex !== null, '应记录含后果的作战简报');
    await click('[data-brief-index="' + battleIndex + '"]');
    assert((await value('#dialog-body')).includes('战斗后果'));
    assert((await value('#dialog-body')).includes('俘虏'));
    await click('#dialog-close');

    await click('#find-city');
    await set('#dialog form [name=target]', 'nianzhuang');
    await click('#dialog form button[type=submit]');
    await click('[data-checkpoint=huai-nianzhuang]');
    assert((await value('#dialog-body')).includes('黄百韬'));
    await click('[data-play-checkpoint=huai-nianzhuang]');
    await click('#start-form [type=submit]');
    assert.equal((await state()).checkpointId, 'huai-nianzhuang');
    assert.equal((await state()).entryCity, 'nianzhuang');
    assert.equal(await value('#date'), '1948.11.21');

    await click('#brief-settings');
    await click('[data-pause-kind=capture]');
    await click('#dialog-close');
    await click('[data-scenario=jinzhou]');
    await set('#start-form [name=historyMode]', 'historical');
    await click('#start-form [type=submit]');
    await click('#pause');
    await poll(() => value('#clock-label').then(async (label) => label === '已暂停' && await value('#date') !== '1948.10.14'));
    assert.equal(await value('#date'), '1948.10.15');
    await click('#latest-event');
    assert((await value('#dialog-body')).includes('城镇归属'));
    await click('#dialog-close');
    await request('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await poll(() => evaluate('innerHeight === 720'));
    assert(await evaluate('document.documentElement.scrollHeight <= innerHeight && document.querySelector("#command-bar").getBoundingClientRect().bottom < innerHeight'));
    const rail = await evaluate('(() => { const panel = document.querySelector(".rail"); return [panel.scrollHeight, panel.clientHeight]; })()');
    assert(rail[0] <= rail[1] + 1, '左栏需要适配 720px 高度：' + rail.join(' / '));
    await request('Emulation.setDeviceMetricsOverride', { width: 430, height: 770, deviceScaleFactor: 1, mobile: false });
    await poll(() => evaluate('innerWidth === 430'));
    assert(await evaluate('document.documentElement.scrollHeight <= innerHeight'));
    await click('#mobile-inspector');
    assert(await evaluate('document.querySelector(".inspector").classList.contains("is-open")'));
    assert.deepEqual(errors, []);

    if (process.env.CIVIL_WAR_SCREENSHOT) {
      await request('Emulation.clearDeviceMetricsOverride');
      await click('[data-layer=contour]');
      const result = await request('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(process.env.CIVIL_WAR_SCREENSHOT, Buffer.from(result.data, 'base64'));
    }
    const reviewUrl = pathToFileURL(path.resolve(__dirname, '..', '..', 'model-review', '模型审阅.html')).href;
    await request('Page.navigate', { url: reviewUrl });
    await poll(() => value('#action-status'), text => text.includes('运行中'));
    assert.deepEqual(await evaluate(`['advanced-units','rifles','smgs','machineguns','pistols']
      .map(id => document.querySelectorAll('#' + id + ' .card').length)`), [10, 6, 3, 6, 4],
      '新增兵种与枪械应全部出现在审阅页');
    for (const [command, label] of [['move', '行军'], ['advance', '射击'], ['defend', '防御'],
      ['siege', '围住'], ['intercept', '拦截'], ['hold', '待命'], ['bombard', '轰炸']]) {
      await choose('#action-choice', command);
      await poll(() => value('#action-description'), text => text.includes(label));
    }
    await choose('#action-choice', 'advance');
    const beforeAction = await evaluate('document.querySelector("#action-preview").toDataURL()');
    await wait(350);
    assert.notEqual(await evaluate('document.querySelector("#action-preview").toDataURL()'), beforeAction,
      '进攻预览应显示随时间变化的画面');
    if (process.env.CIVIL_WAR_REVIEW_SCREENSHOT) {
      await request('Emulation.clearDeviceMetricsOverride');
      await wait(200);
      const screenshot = await request('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(process.env.CIVIL_WAR_REVIEW_SCREENSHOT, Buffer.from(screenshot.data, 'base64'));
    }
    await request('Emulation.clearDeviceMetricsOverride');
    await request('Page.navigate', { url: pathToFileURL(path.resolve(__dirname, '..', '军舰审阅.html')).href });
    await poll(() => evaluate(`(() => { const c = document.querySelector('#ship');
      if (!c) return false; const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      for (let i=3;i<data.length;i+=4) if (data[i]) return true; return false; })()`));
    const clippedAngles = await evaluate(`(() => {
      const renderer = CivilWarHuman3D.createRenderer({resolution: 512}), clipped = [];
      for (let angle=0; angle<8; angle++) {
        const frame = renderer.frame('roc', false, 0, 'ship', 'idle', '', angle * Math.PI / 4);
        const pixels = frame.getContext('2d').getImageData(0,0,512,512).data;
        let edge = false;
        for (let x=0; x<512; x++) if (pixels[(x*4)+3] || pixels[((511*512+x)*4)+3]) edge=true;
        for (let y=0; y<512; y++) if (pixels[(y*512*4)+3] || pixels[((y*512+511)*4)+3]) edge=true;
        if (edge) clipped.push(angle * 45);
      }
      return clipped;
    })()`);
    assert.deepEqual(clippedAngles, [], '军舰八个审阅角度应完整显示：' + clippedAngles.join('、'));
    const shipBefore = await evaluate('document.querySelector("#ship").toDataURL()');
    await click('#right');
    await poll(() => evaluate('document.querySelector("#ship").toDataURL()'), image => image !== shipBefore);
    await click('[data-action=attack]');
    assert.equal(await evaluate('document.querySelector("[data-action=attack]").getAttribute("aria-pressed")'), 'true');
    await click('[data-action=idle]');
    if (process.env.CIVIL_WAR_SHIP_SCREENSHOT) {
      await wait(250);
      const screenshot = await request('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(process.env.CIVIL_WAR_SHIP_SCREENSHOT, Buffer.from(screenshot.data, 'base64'));
    }
    assert.deepEqual(errors, []);
    console.log('浏览器通过：地图命令、多选作战计划、政治决议与撤销、国策科研生产编制空军指挥情报、铁路补给、工事、实时战斗姿态与地图动效、多日战役与战报、单屏界面、锦州引导、两方案预测与局势隔离、历史日期开局、自动暂停、关闭存档和照片。');
  } finally {
    socket?.close();
    child.kill();
    server.close();
    if (errors.length) console.error(errors.join('\n'));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

