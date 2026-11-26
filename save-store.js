(function (root) {
  'use strict';

  const databaseName = 'zhantu-civil-war-saves';
  const databaseVersion = 1;
  const objectStoreName = 'saves';

  function normalize(value) {
    const slots = Array.isArray(value?.slots) ? value.slots.filter(slot =>
      slot && typeof slot.name === 'string' && typeof slot.raw === 'string') : [];
    return { auto: typeof value?.auto === 'string' ? value.auto : '', slots };
  }

  function localValue(storage, key) {
    try { return normalize(JSON.parse(storage?.getItem(key) || '{}')); }
    catch { return normalize(null); }
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
      const legacy = localValue(storage, key);
      try {
        const db = await database();
        if (!db) return legacy;
        const saved = await db.get(key);
        if (saved === null || saved === undefined) {
          await db.put(key, legacy);
          return legacy;
        }
        const normalized = normalize(saved);
        try { storage?.setItem(key, JSON.stringify(normalized)); } catch { /* 保留 IndexedDB 存档。 */ }
        return normalized;
      } catch { return legacy; }
    }

    async function write(key, value) {
      const normalized = normalize(value);
      try { storage?.setItem(key, JSON.stringify(normalized)); } catch { /* 尝试写入 IndexedDB。 */ }
      try {
        const db = await database();
        if (!db) return false;
        await db.put(key, normalized);
        return true;
      } catch { return false; }
    }

    return { load, write };
  }

  const api = { create, normalize };
  root.CivilWarSaveStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
