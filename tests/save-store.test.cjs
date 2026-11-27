const assert = require('node:assert/strict');
const { test } = require('node:test');
const SaveStore = require('../save-store.js');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

function memoryDatabase(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, structuredClone(value)); },
  };
}

test('旧 localStorage 存档首次打开时迁移到 IndexedDB', async () => {
  const storage = memoryStorage({ 'civil-war-map-v1': JSON.stringify({ auto: 'legacy', slots: [{ name: '旧档', raw: 'a' }] }) });
  const database = memoryDatabase();
  const backend = SaveStore.create({ storage, database });

  const loaded = await backend.load('civil-war-map-v1');
  assert.equal(loaded.auto, 'legacy');
  assert.deepEqual(loaded.slots, [{ name: '旧档', raw: 'a' }]);
  assert.ok(loaded.updatedAt > 0);
  assert.deepEqual(await database.get('civil-war-map-v1'), loaded);
});

test('已有 IndexedDB 存档优先载入并同步回 localStorage', async () => {
  const storage = memoryStorage({ 'civil-war-map-v1': JSON.stringify({ auto: 'old', slots: [] }) });
  const database = memoryDatabase({ 'civil-war-map-v1': { auto: 'new', slots: [{ name: '新档', raw: 'b' }] } });
  const backend = SaveStore.create({ storage, database });

  const loaded = await backend.load('civil-war-map-v1');
  assert.equal(loaded.auto, 'new');
  assert.equal(JSON.parse(storage.getItem('civil-war-map-v1')).auto, 'new');
});

test('localStorage 备份比未完成写入的 IndexedDB 新时保留较新版本', async () => {
  const storage = memoryStorage({ 'civil-war-map-v1': JSON.stringify({ auto: 'newer', slots: [], updatedAt: 20 }) });
  const database = memoryDatabase({ 'civil-war-map-v1': { auto: 'stale', slots: [], updatedAt: 10 } });
  const backend = SaveStore.create({ storage, database });

  const loaded = await backend.load('civil-war-map-v1');
  assert.equal(loaded.auto, 'newer');
  assert.equal((await database.get('civil-war-map-v1')).auto, 'newer');
});

test('IndexedDB 不可用时仍可从 localStorage 读取并写入', async () => {
  const storage = memoryStorage({ 'civil-war-map-v1': JSON.stringify({ auto: 'fallback', slots: [] }) });
  const database = { async get() { throw new Error('blocked'); }, async put() { throw new Error('blocked'); } };
  const backend = SaveStore.create({ storage, database });

  assert.equal((await backend.load('civil-war-map-v1')).auto, 'fallback');
  assert.equal(await backend.write('civil-war-map-v1', { auto: 'saved', slots: [] }), true,
    'IndexedDB 失败后 localStorage 写入成功，整体存档操作仍应报告成功');
  assert.equal(JSON.parse(storage.getItem('civil-war-map-v1')).auto, 'saved');
});

test('连续快速写入时同步更新 localStorage 且旧异步写入不会覆盖新状态', async () => {
  const storage = memoryStorage();
  const putOrder = [];
  const database = {
    async get() { return null; },
    async put(_key, value) {
      await new Promise((resolve) => setTimeout(resolve, value.auto === 'first' ? 25 : 1));
      putOrder.push(value.auto);
    },
  };
  const backend = SaveStore.create({ storage, database });

  const first = backend.write('civil-war-map-v1', { auto: 'first', slots: [] });
  const second = backend.write('civil-war-map-v1', { auto: 'second', slots: [] });
  assert.equal(JSON.parse(storage.getItem('civil-war-map-v1')).auto, 'second');
  await Promise.all([first, second]);
  assert.equal(JSON.parse(storage.getItem('civil-war-map-v1')).auto, 'second');
  assert.equal(putOrder.at(-1), 'second');
});
