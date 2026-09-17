const DB_NAME = "sabertooth-personal";
const DB_VERSION = 1;
const SESSIONS_STORE = "sessions";
const SETTINGS_STORE = "settings";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessions = db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
        sessions.createIndex("startedAt", "startedAt");
        sessions.createIndex("dayId", "dayId");
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await fn(store);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
}

export async function saveSession(session) {
  return withStore(SESSIONS_STORE, "readwrite", (store) => requestToPromise(store.put(session)));
}

export async function getSession(id) {
  return withStore(SESSIONS_STORE, "readonly", (store) => requestToPromise(store.get(id)));
}

export async function getAllSessions() {
  const rows = await withStore(SESSIONS_STORE, "readonly", (store) => requestToPromise(store.getAll()));
  return rows.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export async function deleteSession(id) {
  return withStore(SESSIONS_STORE, "readwrite", (store) => requestToPromise(store.delete(id)));
}

export async function setSetting(key, value) {
  return withStore(SETTINGS_STORE, "readwrite", (store) => requestToPromise(store.put({ key, value })));
}

export async function getSetting(key, fallback = null) {
  const row = await withStore(SETTINGS_STORE, "readonly", (store) => requestToPromise(store.get(key)));
  return row ? row.value : fallback;
}

export async function deleteSetting(key) {
  return withStore(SETTINGS_STORE, "readwrite", (store) => requestToPromise(store.delete(key)));
}

export async function exportBackup() {
  const [sessions, activeSession, selectedDayId] = await Promise.all([
    getAllSessions(),
    getSetting("activeSession"),
    getSetting("selectedDayId")
  ]);
  return {
    format: "sabertooth-personal-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    settings: { activeSession, selectedDayId }
  };
}

export async function importBackup(payload) {
  if (!payload || payload.format !== "sabertooth-personal-backup" || payload.version !== 1) {
    throw new Error("This is not a supported Sabertooth Personal backup.");
  }
  if (!Array.isArray(payload.sessions)) {
    throw new Error("Backup is missing workout sessions.");
  }

  for (const session of payload.sessions) {
    if (session && session.id && session.dayId && session.startedAt) {
      await saveSession(session);
    }
  }

  if (payload.settings && Object.prototype.hasOwnProperty.call(payload.settings, "activeSession")) {
    await setSetting("activeSession", payload.settings.activeSession);
  }
  if (payload.settings && payload.settings.selectedDayId) {
    await setSetting("selectedDayId", payload.settings.selectedDayId);
  }
}

export async function clearAllData() {
  const db = await openDb();
  db.close();
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other Sabertooth tabs before resetting data."));
  });
}
