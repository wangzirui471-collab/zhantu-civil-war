(function (root) {
  'use strict';

  const databaseName = 'zhantu-civil-war-saves';
  const databaseVersion = 1;
  const objectStoreName = 'saves';

  function normalize(value) {
    const slots = Array.isArray(value?.slots) ? value.slots.filter(slot =>
      slot && typeof slot.name === 'string' && typeof slot.raw === 'string') : [];
    return { auto: typeof value?.auto === 'string' ? value.auto : '', slots,
      updatedAt: Number.isFinite(value?.updatedAt) ? Math.max(0, value.updatedAt) : 0 };
  }

  function localValue(storage, key) {
    try { return normalize(JSON.parse(storage?.getItem(key) || '{}')); }
    catch { return normalize(null); }
  }

  function writeLocalBackup(storage, key, normalized) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(normalized));
      return true;
    } catch {
      for (let keep = Math.min(2, normalized.slots.length - 1); keep >= 0; keep--) {
        try {
          storage.setItem(key, JSON.stringify({ ...normalized, slots: normalized.slots.slice(0, keep) }));
          return true;
        } catch { /* 继续缩减本地手动槽备份，保证最新 auto 状态实时落盘。 */ }
      }
      return false;
    }
  }

  function nativeDatabase(factory) {
    if (!factory || typeof factory.open !== 'function') return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      let request;
      try { request = factory.open(databaseName, databaseVersion); }
      catch (error) { reject(error); return; }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(objectStoreName)) database.createObjectStore(objectStoreName);
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve({
          get(key) {
            return new Promise((resolveGet, rejectGet) => {
              const transaction = database.transaction(objectStoreName, 'readonly');
              const read = transaction.objectStore(objectStoreName).get(key);
              read.onsuccess = () => resolveGet(read.result ?? null);
              read.onerror = () => rejectGet(read.error || new Error('读取 IndexedDB 存档失败。'));
              transaction.onabort = () => rejectGet(transaction.error || new Error('读取 IndexedDB 存档失败。'));
            });
          },
          put(key, value) {
            return new Promise((resolvePut, rejectPut) => {
              const transaction = database.transaction(objectStoreName, 'readwrite');
              transaction.objectStore(objectStoreName).put(value, key);
              transaction.oncomplete = () => resolvePut(true);
              transaction.onerror = () => rejectPut(transaction.error || new Error('写入 IndexedDB 存档失败。'));
              transaction.onabort = () => rejectPut(transaction.error || new Error('写入 IndexedDB 存档失败。'));
            });
          },
        });
      };
      request.onerror = () => reject(request.error || new Error('无法打开 IndexedDB 存档。'));
      request.onblocked = () => reject(new Error('IndexedDB 存档正在等待旧页面关闭。'));
    });
  }

  function create(options = {}) {
    let storage = options.storage;
    if (storage === undefined) {
      try { storage = root.localStorage; } catch { storage = null; }
    }
    const suppliedDatabase = options.database;
    let databasePromise;
    let lastWriteAt = 0;
    const latestByKey = new Map();
    let writeChain = Promise.resolve();
    const stamp = value => {
      lastWriteAt = Math.max(Date.now(), lastWriteAt + 1);
      return { ...normalize(value), updatedAt: lastWriteAt };
    };
    const database = () => {
      if (suppliedDatabase) return Promise.resolve(suppliedDatabase);
      if (!databasePromise) {
        let factory;
        try { factory = root.indexedDB; } catch { factory = null; }
        databasePromise = nativeDatabase(factory);
      }
      return databasePromise;
    };

    async function load(key) {
      const rawLegacy = localValue(storage, key);
      // 老 localStorage 没有 updatedAt；第一次迁移时以 0 作为版本戳，IndexedDB 优先。
      const legacy = { ...rawLegacy, updatedAt: rawLegacy.updatedAt || 0 };
      lastWriteAt = Math.max(lastWriteAt, legacy.updatedAt);
      try {
        const db = await database();
        if (!db) return legacy;
        const saved = await db.get(key);
        if (saved === null || saved === undefined) {
          const migrated = stamp(legacy);
          await db.put(key, migrated);
          writeLocalBackup(storage, key, migrated);
          return migrated;
        }
        const normalized = normalize(saved);
        lastWriteAt = Math.max(lastWriteAt, normalized.updatedAt);
        if (legacy.updatedAt > normalized.updatedAt) {
          const merged = { ...legacy, slots: legacy.slots.length >= normalized.slots.length ? legacy.slots : normalized.slots };
          await db.put(key, merged);
          return merged;
        }
        writeLocalBackup(storage, key, normalized);
        return normalized;
      } catch { return legacy; }
    }

    async function write(key, value) {
      lastWriteAt = Math.max(lastWriteAt, localValue(storage, key).updatedAt);
      const normalized = stamp(value);
      latestByKey.set(key, normalized.updatedAt);
      const localSaved = writeLocalBackup(storage, key, normalized);
      const runWrite = async () => {
        if (latestByKey.get(key) > normalized.updatedAt) return true;
        try {
          const db = await database();
          if (db) {
            await db.put(key, normalized);
            return true;
          }
        } catch { /* 降级到 localStorage。 */ }
        return localSaved;
      };
      const pending = writeChain.then(runWrite, runWrite);
      writeChain = pending.catch(() => {});
      return pending;
    }

    return { load, write };
  }

  const api = { create, normalize };
  root.CivilWarSaveStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
