const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
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
    const state = () => evaluate('JSON.parse(JSON.parse(localStorage.getItem("civil-war-map-v1")).auto).state');
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
      || pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
    await request('Page.navigate', { url });
    await poll(() => value('#date'), (label) => label === '1948.09.12');
    assert.equal(await value('#date'), '1948.09.12');
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
    assert.equal(await evaluate('document.querySelectorAll(".formation-table tbody tr").length'), 9);
    await click('.formation-table [data-unit=nw3-d1-r1]');
    await click('[data-command=hold]');
    assert(await value('#toast').then((message) => message.includes('已下达')));
    const regiment = (await state()).units.find((unit) => unit.level === 'regiment' && unit.order?.type === 'hold');
    assert(regiment, '团级命令应写入存档');

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
    await click('#save-menu');
    await set('#branch-form [name=date]', '1948-10-16');
    await click('#branch-form button[type=submit]');
    assert.equal(await value('#date'), '1948.10.16');
    await click('#save-menu');
    await click('[data-load-slot="0"]');
    assert.equal(await value('#date'), '1948.10.20');

    await click('#groups');
    assert((await value('#dialog-body')).includes('桂系'));
    await click('[data-group-control=guixi]');
    assert.equal((await state()).group, 'guixi');
    assert.equal((await state()).player, 'roc');
    await click('#archive');
    assert((await value('#dialog-body')).includes('将领档案'));
    const photos = await evaluate('Promise.all([...document.images].map(img => img.decode())).then(() => document.images.length)');
    assert(photos >= 30);
    await click('#dialog-close');
    await evaluate(`(() => {
      const raw = JSON.parse(localStorage.getItem('civil-war-map-v1'));
      const progress = JSON.parse(raw.auto);
      delete progress.state.owners.nianzhuang;
      delete progress.timeline.origin.owners.nianzhuang;
      raw.auto = JSON.stringify(progress);
      localStorage.setItem('civil-war-map-v1', JSON.stringify(raw));
    })()`);
    await request('Page.reload');
    await poll(() => value('#date'), (label) => label === '1948.10.20');
    assert.equal((await state()).group, 'guixi');
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

    const formalSave = await state();
    await click('#forecast');
    await set('#forecast-months', '6');
    await click('#compare-forecast');
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
    await click('#plan-form button[type=submit]');
    assert.equal((await state()).plans.length, 1);
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

    // 战报后果与累计战果
    for (let day = 0; day < 6; day++) await click('#step');
    await click('#show-log');
    assert((await value('#dialog-body')).includes('累计战果'));
    await choose('#brief-filter', 'all');
    const battleIndex = await evaluate(`(() => {
      const button = [...document.querySelectorAll('#brief-list [data-brief-index]')]
        .find((item) => item.textContent.includes('战斗结束'));
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
    console.log('浏览器通过：地图命令、多选作战计划、铁路补给面板、工事修筑、部队编制、战报后果、单屏界面、锦州完整引导、两方案预测与存档隔离、历史日期开局、自动暂停、旧存档和照片。');
  } finally {
    socket?.close();
    child.kill();
    if (errors.length) console.error(errors.join('\n'));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
