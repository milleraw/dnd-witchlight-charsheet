// storage.js — shared data utilities and lightweight state


/** Public API root for SRD2014 on dnd5eapi */
const API = "https://www.dnd5eapi.co/api/2014";

/** Characters known to the toolbar; override via setCharacterList if needed */
let _CHAR_LIST = [
  "direcris-zzzxaaxthroth-new.json",
  "rathen-new.json",
  "hareiette-carrotson-new.json",
  "orchid-feather-new.json",
  "illanis-siannodel-new.json",
  "psalm-new.json",
  "via.json",
  "figge-(locke).json",
  "midnight.json",
  "gocreld-mountainblade.json",
];
function getCharacterList() { return [..._CHAR_LIST]; }
function setCharacterList(list) { _CHAR_LIST = [...list]; }

/** Prefer an absolute /data/ if you have one; override with a <meta> */
function dataRoot() {
  const meta = document.querySelector('meta[name="data-root"]');
  return (meta?.content?.trim()) || "/data/";
}

/** Simple slug utility */
const slug = (s) => String(s || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-");

/** Lightweight storage wrapper (upgradeable later) */
const STORAGE = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
  remove(k) { try { localStorage.removeItem(k); } catch {} },
};

const keys = {
  lastChar: "dd:lastChar",
  schema:   "dd:schema",
};
const PARTY_SCOPE_KEY = 'dd:partyScope';
const CHARACTER_PARTY_MAP_KEY = 'dd:characterPartyMap';
const PARTY_SCOPES = ['Witchlight', 'Witchlight-Test', 'One-Shots'];

/** Fetch JSON with cache-busting option if you ever version your data */
async function loadJSON(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return res.json();
}

/** Load a character from /data (or whatever your meta points to) */


/** In‑memory current character state (no window globals) */
let _currentChar = null;
let _currentCharFile = null;

function getCurrentCharacter()     { return _currentChar; }
function getCurrentCharacterFile() { return _currentCharFile; }
function setCurrentCharacter(fileName, obj) {
  _currentCharFile = fileName || null;
  _currentChar = obj || null;
  // Persist last selection for both sheets
  if (fileName) STORAGE.set(keys.lastChar, fileName);
}


// storage.js — local snapshot storage
function saveSnapshot(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadSnapshot(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

//function maybeLoadSnapshot(key, applyFn) {
//  const data = loadSnapshot(key);
//  if (data && confirm("Restore saved game data?")) {
//    applyFn(data);
//  }
// }

// ------------------------------
// storage.js — networking & data
// ------------------------------

// (already present from earlier steps)



// ---------- Low-level fetchers ----------
async function fetchJSON(url) {
  const r = await fetch(url, { credentials: "same-origin" });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

/** Try a list of URLs in order; return first JSON or fallback (never throws). */
async function safeJSONMulti(urls, fallback = null) {
  for (const url of urls) {
    try {
      const r = await fetch(url, { credentials: "same-origin" });
      if (!r.ok) continue;
      return await r.json();
    } catch (_) { /* try next */ }
  }
  return fallback;
}

/** Single URL, never throws; returns null on failure. */
async function safeGetJSON(url) {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/** Try candidate paths locally; first JSON wins or null. */
async function readLocalJSON(candidates) {
  for (const p of candidates) {
    const data = await safeGetJSON(p);
    if (data != null) return data;
  }
  return null;
}

/** Local-first: try getLocal(), else getFromAPI(); returns {data, source}. */
async function localFirst(getLocal, getFromAPI) {
  const local = await getLocal();
  if (local && (Array.isArray(local) ? local.length : true)) {
    return { data: local, source: "local" };
  }
  const api = await getFromAPI();
  if (api && (Array.isArray(api) ? api.length : true)) {
    return { data: api, source: "api" };
  }
  return { data: Array.isArray(local || api) ? [] : null, source: "none" };
}

// ---------- Project-specific loaders ----------
/** Build common local candidate paths for a filename in /data or cwd. */
function candidatesFor(file) {
  const root = dataRoot().replace(/\/+$/, "");
  return [`${root}/${file}`, `./${file}`];
}

/** Characters (shared) */
function normalizeCharacterFileName(fileName) {
  return String(fileName || '')
    .replace(/^\/?data\//, '')
    .replace(/\?.*$/, '');
}

function getPartyScopes() {
  return ['All Parties', ...PARTY_SCOPES];
}

function getActivePartyScope() {
  const raw = String(STORAGE.get(PARTY_SCOPE_KEY, 'All Parties') || 'All Parties').trim();
  if (raw === 'All Parties' || PARTY_SCOPES.includes(raw)) return raw;
  return 'All Parties';
}

function setActivePartyScope(scopeName) {
  const next = String(scopeName || '').trim();
  STORAGE.set(PARTY_SCOPE_KEY, (next === 'All Parties' || PARTY_SCOPES.includes(next)) ? next : 'All Parties');
}

function inferPartyScope(fileName) {
  const clean = normalizeCharacterFileName(fileName).toLowerCase();
  if (/one[-_\s]?shot/.test(clean) || /oneshot/.test(clean)) return 'One-Shots';
  if (/-l\d+\.json$/.test(clean) || clean.includes('/level1/')) return 'Witchlight-Test';
  return 'Witchlight';
}

function resolveCharacterParty(fileName, character = null) {
  const clean = normalizeCharacterFileName(fileName);
  const map = STORAGE.get(CHARACTER_PARTY_MAP_KEY, {}) || {};
  const mapped = String(map[clean] || '').trim();
  if (PARTY_SCOPES.includes(mapped)) return mapped;

  const metaParty = String(character?.meta?.party || character?.party || character?.choices?.party || '').trim();
  if (PARTY_SCOPES.includes(metaParty)) return metaParty;

  return inferPartyScope(clean);
}

function setCharacterParty(fileName, scopeName) {
  const clean = normalizeCharacterFileName(fileName);
  if (!clean) return;
  const scope = String(scopeName || '').trim();
  if (!PARTY_SCOPES.includes(scope)) return;
  const map = STORAGE.get(CHARACTER_PARTY_MAP_KEY, {}) || {};
  map[clean] = scope;
  STORAGE.set(CHARACTER_PARTY_MAP_KEY, map);
}

function getPartyCharacterFiles(scopeName = 'All Parties', opts = {}) {
  const scope = String(scopeName || 'All Parties').trim();
  const mapRaw = STORAGE.get(CHARACTER_PARTY_MAP_KEY, {}) || {};
  const mappedEntries = Object.entries(mapRaw)
    .map(([file, party]) => [normalizeCharacterFileName(file), String(party || '').trim()])
    .filter(([file, party]) => file && PARTY_SCOPES.includes(party));
  const mappedFiles = mappedEntries
    .filter(([, party]) => scope === 'All Parties' || party === scope)
    .map(([file]) => file);

  // Include inferred members from known files for convenience/fallback.
  const listed = getCharacterList().map(normalizeCharacterFileName).filter(Boolean);
  const inferred = listed.filter((file) => {
    const mappedParty = mappedEntries.find(([f]) => f === file)?.[1] || '';
    const party = PARTY_SCOPES.includes(mappedParty) ? mappedParty : inferPartyScope(file);
    return scope === 'All Parties' || party === scope;
  });

  const currentFile = normalizeCharacterFileName(opts.currentFile || '');
  const currentInScope = currentFile
    ? ((scope === 'All Parties') || (resolveCharacterParty(currentFile) === scope))
    : false;

  return Array.from(new Set([
    ...mappedFiles,
    ...inferred,
    ...(currentInScope ? [currentFile] : []),
  ]));
}

async function loadCharacter(fileName, fallback = null) {
  const clean = normalizeCharacterFileName(fileName);
  const override = STORAGE.get(`dd:char:${clean}`);
  const fileWithBuster = `${clean}?v=${Date.now()}`;
  const fileData = await safeJSONMulti(candidatesFor(fileWithBuster), fallback);

  // Prefer file data when it is clearly ahead (e.g., after CLI undo/restore),
  // otherwise keep local override behavior for unsaved in-browser edits.
  if (override && fileData) {
    const oLevel = Number(override?.level || 0);
    const fLevel = Number(fileData?.level || 0);
    const oLogLen = Array.isArray(override?.levelUpLog) ? override.levelUpLog.length : 0;
    const fLogLen = Array.isArray(fileData?.levelUpLog) ? fileData.levelUpLog.length : 0;
    if (fLevel > oLevel) return fileData;
    if (fLevel === oLevel && fLogLen > oLogLen) return fileData;
    if (fLevel === oLevel && fLogLen === oLogLen && fLogLen > 0) {
      // If both have same progression depth but different level-up history,
      // trust the file (e.g., CLI/manual correction to hpGain, feats, notes).
      const fLog = JSON.stringify(fileData.levelUpLog || []);
      const oLog = JSON.stringify(override.levelUpLog || []);
      if (fLog !== oLog) return fileData;
    }
    return override;
  }

  if (override) return override;
  return fileData;
}

// --- File System Access helpers (for writing back to /data/*.json) ---
const HANDLE_DB_NAME = 'dd:fs';
const HANDLE_STORE = 'handles';
const DATA_DIR_KEY = 'dataDir';

function openHandleDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredHandle(key) {
  try {
    const db = await openHandleDB();
    if (!db) return null;
    return await new Promise((resolve) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const store = tx.objectStore(HANDLE_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setStoredHandle(key, handle) {
  try {
    const db = await openHandleDB();
    if (!db) return false;
    return await new Promise((resolve) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      const store = tx.objectStore(HANDLE_STORE);
      const req = store.put(handle, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function verifyHandlePermission(handle, mode = 'readwrite') {
  if (!handle) return false;
  if (typeof handle.queryPermission !== 'function') return true;
  try {
    const opts = { mode };
    let perm = await handle.queryPermission(opts);
    if (perm === 'granted') return true;
    perm = await handle.requestPermission(opts);
    return perm === 'granted';
  } catch {
    return false;
  }
}

async function getDataDirHandle(opts = {}) {
  if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
    return null;
  }

  const { prompt = false } = opts;
  let handle = await getStoredHandle(DATA_DIR_KEY);
  if (handle && await verifyHandlePermission(handle)) return handle;
  if (!prompt) return null;

  try {
    handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const ok = await verifyHandlePermission(handle);
    if (!ok) return null;
    await setStoredHandle(DATA_DIR_KEY, handle);
    return handle;
  } catch {
    return null;
  }
}

async function saveCharacterToFile(fileName, data, opts = {}) {
  const handle = await getDataDirHandle({ prompt: !!opts.prompt });
  if (!handle) return false;
  const fileHandle = await handle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  await writable.close();
  return true;
}

async function saveCharacter(fileName, data, opts = {}) {
  const clean = normalizeCharacterFileName(fileName);
  if (!clean) throw new Error('Missing character file name.');

  let savedToDisk = false;
  let error = null;
  try {
    savedToDisk = await saveCharacterToFile(clean, data, opts);
  } catch (err) {
    error = err;
  }

  if (savedToDisk) {
    STORAGE.remove(`dd:char:${clean}`);
    return { persistedTo: 'file' };
  }

  STORAGE.set(`dd:char:${clean}`, data || null);
  return { persistedTo: 'local', error };
}

/** Spells catalog (shared; used by spells page) */
async function loadSpells(fallback = []) { return safeJSONMulti(candidatesFor(`srd-5.2-spells.json?v=${Date.now()}`), fallback); }

/** Infusions catalog (shared) */
async function loadInfusions(fallback = []) {
  const v = Date.now(); // Simple cache buster
  return safeJSONMulti(candidatesFor(`infusions.json?v=${v}`), fallback);
}

/** Generic “j(url)” helper you had */
const j = fetchJSON;

// ---------- Equipment (local-first with SRD fallback) ----------
let __EQUIP_LOCAL = null;
// bump this when editing equipment.v2.json locally to defeat caches
const EQUIP_VERSION = (typeof window !== 'undefined'
  ? (window.__EQUIP_VERSION ||= Date.now())
  : Date.now());

const EQUIP_SLOT_ENUM = new Set([
  'armor',
  'shield',
  'weapon',
  'boots',
  'cloak',
  'gloves',
  'goggles',
  'headwear',
  'bracers',
  'belt',
  'amulet',
  'ring',
  'instrument',
  'container',
  'wondrous_handheld',
  'tool'
]);
const OBJECT_FORM_ENUM = new Set([
  'bag',
  'jug',
  'rope',
  'stones',
  'wand',
  'lantern',
  'shackles',
  'gem',
  'horn',
  'staff',
  'rod',
  'pipes'
]);

function validateEquipmentSchema(entries) {
  const errors = [];
  (entries || []).forEach((item) => {
    const id = item?.id || item?.key || item?.index || item?.name || '<unknown>';
    if (!EQUIP_SLOT_ENUM.has(item?.equip_slot)) {
      errors.push(`${id}: invalid equip_slot (${String(item?.equip_slot)})`);
    }
    const objectForm = item?.object_form;
    if (!(objectForm === null || OBJECT_FORM_ENUM.has(objectForm))) {
      errors.push(`${id}: invalid object_form (${String(objectForm)})`);
    }
    if (typeof item?.is_spellcasting_focus !== 'boolean') {
      errors.push(`${id}: is_spellcasting_focus must be boolean`);
    }
    if (!(item?.focus_kind === null || item?.focus_kind === 'arcane')) {
      errors.push(`${id}: invalid focus_kind (${String(item?.focus_kind)})`);
    }
    if (item?.focus_kind != null && item?.is_spellcasting_focus !== true) {
      errors.push(`${id}: focus_kind requires is_spellcasting_focus=true`);
    }
    if (typeof item?.is_armor_like_garment !== 'boolean') {
      errors.push(`${id}: is_armor_like_garment must be boolean`);
    }
  });
  if (errors.length) {
    const msg = `Equipment schema validation failed (${errors.length}):\n${errors.slice(0, 25).join('\n')}`;
    throw new Error(msg);
  }
}

function normalizeEquipmentCatalog(data) {
  if (data && Array.isArray(data.equipment)) {
    validateEquipmentSchema(data.equipment);
    return data;
  }
  if (Array.isArray(data)) {
    validateEquipmentSchema(data);
    return { schema_version: "legacy", equipment: data, modifiers: [] };
  }
  return { schema_version: "legacy", equipment: [], modifiers: [] };
}

async function loadEquipmentLocal(force = false) {
  if (force || !__EQUIP_LOCAL) {
    const v = EQUIP_VERSION;
    const candV2 = candidatesFor(`equipment.v2.json?v=${encodeURIComponent(v)}`);
    const v2 = await readLocalJSON(candV2);
    if (v2) {
      __EQUIP_LOCAL = normalizeEquipmentCatalog(v2);
      return __EQUIP_LOCAL;
    }
    const candV1 = candidatesFor(`equipment.v1.json?v=${encodeURIComponent(v)}`);
    const v1 = await readLocalJSON(candV1);
    if (v1) {
      __EQUIP_LOCAL = normalizeEquipmentCatalog(v1);
      return __EQUIP_LOCAL;
    }
    const cand = candidatesFor(`equipment.json?v=${encodeURIComponent(v)}`);
    __EQUIP_LOCAL = normalizeEquipmentCatalog(await readLocalJSON(cand) || []);
  }
  return __EQUIP_LOCAL;
}

function _findLocalEquip(list, key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  return (list || []).find(e =>
    String(e.id || "").toLowerCase() === k ||
    String(e.key || "").toLowerCase() === k ||
    String(e.index || "").toLowerCase() === k ||
    String(e.name  || "").toLowerCase() === k
  ) || null;
}

async function fetchEquipmentSRD(indexOrName) {
  if (!indexOrName) return null;
  const slug = String(indexOrName).trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  try { return await j(`${API}/equipment/${slug}`); }
  catch { return null; }
}

async function getEquipmentByName(indexOrName) {
  const local = await loadEquipmentLocal();
  const direct = _findLocalEquip(local.equipment, indexOrName);
  if (direct) return direct;
  const trimmed = String(indexOrName || '').replace(/\s*\+\s*\d+\s*$/i, '').trim();
  const fallback = trimmed ? _findLocalEquip(local.equipment, trimmed) : null;
  return fallback || await fetchEquipmentSRD(indexOrName);
}

/** Property helper for API-shaped equipment objects */
function hasEquipProp(equip, propIndex) {
  const arr = equip?.properties || [];
  const want = String(propIndex).toLowerCase();
  return arr.some(p => String(p?.index || "").toLowerCase() === want);
}

/**
 * Extracts the list of equipped weapon names from a character object.
 * This is a simple helper that looks in standard locations.
 * @param {object} character The character object.
 * @returns {string[]} An array of weapon names.
 */
function getEquippedWeapons(character) {
  const uniqueByName = (arr) => {
    const out = [];
    const seen = new Set();
    for (const w of arr) {
      const key = String(w || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(String(w || '').trim());
    }
    return out;
  };
  const normalize = (arr) => (Array.isArray(arr) ? arr
    .map(w => (typeof w === 'string' ? w : (w && typeof w === 'object' ? w.name : '')))
    .map(w => String(w || '').trim())
    .filter(Boolean) : []);
  if (!character) return [];
  const fromGearWeapons = () => {
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    return gear
      .filter(it => String(it?.equip_slot || '').trim().toLowerCase() === 'weapon' || !!it?.weapon)
      .map(it => String(it?.name || '').trim())
      .filter(Boolean);
  };
  // Standard location in character JSON
  if (character.equipment && Array.isArray(character.equipment.weapons)) {
    return uniqueByName(normalize(character.equipment.weapons).concat(fromGearWeapons()));
  }
  // Fallback for flatter structures
  if (Array.isArray(character.weapons)) {
    return uniqueByName(normalize(character.weapons).concat(fromGearWeapons()));
  }
  return uniqueByName(fromGearWeapons());
}
// ===============================
// Items / Packs (shared, no DOM)
// ===============================

// Local packs catalog (rich tooltips)
let _packsCache = null;
async function loadPacksCatalog() {
  if (_packsCache) return _packsCache;
  try {
    const res = await fetch('./data/packs.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('packs.json not found');
    _packsCache = await res.json();
  } catch {
    _packsCache = {}; // graceful if file isn't present yet
  }
  return _packsCache;
}

const STATIC_PACK_CONTENTS = {
  "burglars-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Ball bearings (bag of 1,000)", qty: 1 },
    { name: "String (10 feet)", qty: 1 },
    { name: "Bell", qty: 1 },
    { name: "Candle", qty: 5 },
    { name: "Crowbar", qty: 1 },
    { name: "Hammer", qty: 1 },
    { name: "Piton", qty: 10 },
    { name: "Lantern, hooded", qty: 1 },
    { name: "Oil (flask)", qty: 2 },
    { name: "Rations (1 day)", qty: 5 },
    { name: "Tinderbox", qty: 1 },
    { name: "Waterskin", qty: 1 },
    { name: "Rope, hempen (50 feet)", qty: 1 }
  ],
  "diplomats-pack": [
    { name: "Chest", qty: 1 },
    { name: "Case, map or scroll", qty: 2 },
    { name: "Clothes, fine", qty: 1 },
    { name: "Ink (bottle)", qty: 1 },
    { name: "Ink pen", qty: 1 },
    { name: "Lamp", qty: 1 },
    { name: "Oil (flask)", qty: 2 },
    { name: "Paper (sheet)", qty: 5 },
    { name: "Perfume (vial)", qty: 1 },
    { name: "Sealing wax", qty: 1 },
    { name: "Soap", qty: 1 }
  ],
  "dungeoneers-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Crowbar", qty: 1 },
    { name: "Hammer", qty: 1 },
    { name: "Piton", qty: 10 },
    { name: "Torch", qty: 10 },
    { name: "Tinderbox", qty: 1 },
    { name: "Rations (1 day)", qty: 10 },
    { name: "Waterskin", qty: 1 },
    { name: "Rope, hempen (50 feet)", qty: 1 }
  ],
  "entertainers-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Bedroll", qty: 1 },
    { name: "Costume", qty: 2 },
    { name: "Candle", qty: 5 },
    { name: "Rations (1 day)", qty: 5 },
    { name: "Waterskin", qty: 1 },
    { name: "Disguise kit", qty: 1 }
  ],
  "explorers-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Bedroll", qty: 1 },
    { name: "Mess kit", qty: 1 },
    { name: "Tinderbox", qty: 1 },
    { name: "Torch", qty: 10 },
    { name: "Rations (1 day)", qty: 10 },
    { name: "Waterskin", qty: 1 },
    { name: "Rope, hempen (50 feet)", qty: 1 }
  ],
  "priests-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Blanket", qty: 1 },
    { name: "Candle", qty: 10 },
    { name: "Tinderbox", qty: 1 },
    { name: "Alms box", qty: 1 },
    { name: "Block of incense", qty: 2 },
    { name: "Censer", qty: 1 },
    { name: "Vestments", qty: 1 },
    { name: "Rations (1 day)", qty: 2 },
    { name: "Waterskin", qty: 1 }
  ],
  "scholars-pack": [
    { name: "Backpack", qty: 1 },
    { name: "Book of lore", qty: 1 },
    { name: "Ink (bottle)", qty: 1 },
    { name: "Ink pen", qty: 1 },
    { name: "Parchment (sheet)", qty: 10 },
    { name: "Sand (bag)", qty: 1 },
    { name: "Small knife", qty: 1 }
  ],
  "monster-hunters-pack": [
    { name: "Chest", qty: 1 },
    { name: "Crowbar", qty: 1 },
    { name: "Hammer", qty: 1 },
    { name: "Wooden stake", qty: 3 },
    { name: "Holy symbol", qty: 1 },
    { name: "Holy water (flask)", qty: 1 },
    { name: "Manacles", qty: 1 },
    { name: "Steel mirror", qty: 1 },
    { name: "Oil (flask)", qty: 1 },
    { name: "Tinderbox", qty: 1 },
    { name: "Torch", qty: 3 }
  ]
};

function normalizePackKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPackContentsFromGearItem(it) {
  const candidates = [it?.ref, it?.name].map(normalizePackKey).filter(Boolean);
  for (const key of candidates) {
    if (STATIC_PACK_CONTENTS[key]) return STATIC_PACK_CONTENTS[key];
  }
  return null;
}

function expandPackedGearEntries(rawGear) {
  const out = [];
  for (const it of (rawGear || [])) {
    const packContents = getPackContentsFromGearItem(it);
    if (!packContents) {
      out.push(it);
      continue;
    }
    const packQty = Math.max(1, Number(it?.qty ?? 1) || 1);
    for (const c of packContents) {
      out.push({
        name: c.name,
        qty: Math.max(1, Number(c.qty || 1)) * packQty
      });
    }
  }
  return out;
}

// Normalize character.gear into [{name, qty, ref, desc}] and update character.coins
function normalizeGearList(character) {
  const coins = { pp:0, gp:0, sp:0, cp:0, ...(character?.coins || {}) };

  const equipGear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
  const legacyGear = Array.isArray(character?.gear) ? character.gear : [];
  // Prefer modern equipment.gear when present to avoid double-counting legacy gear entries.
  const sourceGear = equipGear.length ? equipGear : legacyGear;
  const raw = expandPackedGearEntries(sourceGear);

  const items = [];
  const seen = new Set();
  for (const it of raw) {
    const name = String(it?.name || '').trim();
    if (!name) continue;

    // e.g. "15 gp", "1 sp", "20 PP"
    const m = name.match(/^(\d+)\s*(pp|gp|sp|cp)\b/i);
    if (m) {
      coins[m[2].toLowerCase()] += Number(m[1]) || 0;
      continue;
    }

    const qty = Number(it?.qty ?? 1) || 1;
    const ref = it?.ref ? String(it.ref).toLowerCase() : null;
    const desc = typeof it?.desc === 'string' ? it.desc : null;
    const valueGp = Math.max(0, Number(it?.value_gp || 0) || 0);
    const attuned = !!it?.attuned;
    const attunedQty = Math.max(0, Number(it?.attuned_qty ?? (attuned ? 1 : 0)) || 0);
    const weapon = (it?.weapon && typeof it.weapon === 'object') ? it.weapon : null;
    const weaponSig = weapon ? JSON.stringify(weapon) : '';
    const key = `${name.toLowerCase()}|${qty}|${ref || ''}|${desc || ''}|${valueGp}|${attuned ? 1 : 0}|${attunedQty}|${weaponSig}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      name,
      qty,
      ref,
      desc,
      modifier: Number(it?.modifier || 0) || null,
      value_gp: valueGp || null,
      equip_slot: it?.equip_slot ? String(it.equip_slot) : null,
      object_form: it?.object_form == null ? null : String(it.object_form),
      is_spellcasting_focus: !!it?.is_spellcasting_focus,
      focus_kind: it?.focus_kind == null ? null : String(it.focus_kind),
      is_armor_like_garment: !!it?.is_armor_like_garment,
      weapon: weapon ? structuredClone(weapon) : null,
      attuned,
      attuned_qty: attunedQty
    });
  }

  character.coins = coins; // write back for currency box
  return items;
}

// Optional: API fallback for packs by name/ref
const ALLOW_API_PACK_FALLBACK = false;
const _packsApiCache = new Map();

async function fetchPackFromApi(slug) {
  if (!slug) return null;
  if (_packsApiCache.has(slug)) return _packsApiCache.get(slug);
  try {
    const res = await fetch(`/api/equipment/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('not ok');
    const data = await res.json();

    const contents = Array.isArray(data.contents)
      ? data.contents.map(c => {
          if (typeof c === 'string') return c;
          const n = c?.item?.name || c?.name || '';
          const q = c?.quantity || c?.qty || 1;
          return q > 1 ? `${n} (x${q})` : n;
        })
      : [];

    const packObj = { name: data.name || slug.replace(/-/g, ' '), contents };
    _packsApiCache.set(slug, packObj);
    return packObj;
  } catch {
    _packsApiCache.set(slug, null);
    return null;
  }
}

// Currency one-liner for the UI
function coinsLine(coins) {
  if (!coins) return null;
  const keys = ['pp', 'gp', 'sp', 'cp'];
   const bits = keys.map(k => `${Number(coins[k] || 0)} ${k.toUpperCase()}`);
  return bits.join('  •  ');
}


// Armor lookup (shared fetch/cache; no DOM)
const ARMOR_API_ROOT = typeof API !== 'undefined' ? API : "https://www.dnd5eapi.co/api/2014";

const armorCache = new Map();
const ARMOR_FALLBACK = {
  "leather armor":   { baseAC: 11, dexBonus: true, maxDex: null, isShield: false },
  "studded leather": { baseAC: 12, dexBonus: true, maxDex: null, isShield: false },
  "hide armor":      { baseAC: 12, dexBonus: true, maxDex: 2,    isShield: false },
  "chain shirt":     { baseAC: 13, dexBonus: true, maxDex: 2,    isShield: false },
  "chain mail":      { baseAC: 16, dexBonus: false, maxDex: 0,   isShield: false, strMin: 13, stealthDis: true },
  "shield":          { baseAC: 0,  dexBonus: false, maxDex: 0,   isShield: true,  bonus: 2 }
};

function slugFromName(name) {
  return String(name || "").trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

async function getArmorInfoByName(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (armorCache.has(key)) return armorCache.get(key);

  if (key === "shield" || key.endsWith(" shield")) {
    const info = { baseAC: 0, dexBonus: false, maxDex: 0, isShield: true, bonus: 2, name: "Shield" };
    armorCache.set(key, info);
    return info;
  }

  try {
    const catalog = await loadEquipmentLocal();
    const localItem = _findLocalEquip(catalog.equipment, name);
    if (localItem) {
      if (localItem.rules?.armor) {
        const armor = localItem.rules.armor;
        const ac = armor.ac || {};
        const isShield = String(armor.category || '').toLowerCase() === 'shield'
          || String(localItem.subtype || '').toLowerCase() === 'shield';
        const dexMode = String(ac.dexBonus ?? '').toLowerCase();
        const dexBonus = ac.dexBonus === true
          || dexMode === 'full'
          || dexMode === 'capped'
          || dexMode === 'unlimited';
        const info = {
          name: localItem.name,
          baseAC: isShield ? 0 : Number(ac.base ?? 10),
          dexBonus,
          maxDex: (ac.dexMax === undefined || ac.dexMax === null) ? null : Number(ac.dexMax),
          isShield,
          bonus: isShield ? Number(ac.bonus ?? 2) : 0,
          stealthDis: !!armor.stealthDisadvantage,
          strMin: Number(armor.strMin ?? 0)
        };
        armorCache.set(key, info);
        return info;
      }
      if (localItem.armor) {
        const isShield = !!localItem.armor.shield;
        const info = {
          name: localItem.name,
          baseAC: isShield ? 0 : Number(localItem.armor.ac ?? 10),
          dexBonus: !!localItem.armor.dex_bonus,
          maxDex: (localItem.armor.dex_max === undefined || localItem.armor.dex_max === null)
            ? null
            : Number(localItem.armor.dex_max),
          isShield,
          bonus: isShield ? Number(localItem.armor.ac ?? 2) : 0,
          stealthDis: !!localItem.armor.stealth_disadvantage,
          strMin: Number(localItem.armor.str_min ?? 0)
        };
        armorCache.set(key, info);
        return info;
      }
      if (localItem.armor_class) {
        const ac = localItem.armor_class || {};
        const isShield = String(localItem.equipment_category?.name || '').toLowerCase() === 'shield';
        const info = {
          name: localItem.name,
          baseAC: Number(ac.base ?? 10),
          dexBonus: !!ac.dex_bonus,
          maxDex: (ac.max_bonus === undefined || ac.max_bonus === null) ? null : Number(ac.max_bonus),
          isShield,
          bonus: isShield ? 2 : 0,
          stealthDis: !!localItem.stealth_disadvantage,
          strMin: Number(localItem.str_minimum ?? 0)
        };
        armorCache.set(key, info);
        return info;
      }
    }

    // Local-only by default to avoid CORS/network instability during sheet rendering.
    if (!(typeof window !== "undefined" && window.ENABLE_REMOTE_DND_API === true)) {
      throw new Error("remote armor api disabled");
    }
    const category = await fetch(`${ARMOR_API_ROOT}/equipment-categories/armor/`).then(r => r.json());
    const item = (category.equipment || []).find(e => e.name.toLowerCase() === key)
            || (category.equipment || []).find(e => slugFromName(e.name) === slugFromName(name));
    if (!item) throw new Error("armor not found");

    const detailsUrl = item.url.startsWith('http') ? item.url : `https://www.dnd5eapi.co${item.url}`;
    const data = await fetch(detailsUrl).then(r => r.json());
    const ac = data.armor_class || {};
    const isShield = String(data.equipment_category?.name || '').toLowerCase() === 'shield';
    const info = {
      name: data.name,
      baseAC: Number(ac.base ?? 10),
      dexBonus: !!ac.dex_bonus,
      maxDex: (ac.max_bonus === undefined || ac.max_bonus === null) ? null : Number(ac.max_bonus),
      isShield,
      bonus: isShield ? 2 : 0,
      stealthDis: !!data.stealth_disadvantage,
      strMin: Number(data.str_minimum ?? 0)
    };
    armorCache.set(key, info);
    return info;
  } catch {
    if (ARMOR_FALLBACK[key]) return ARMOR_FALLBACK[key];
    return null;
  }
}
// ==== Races catalog & base speed (shared) ====
const BASE_SPEED_FALLBACK = {
  "dragonborn": 30,
  "dwarf": 25, "duergar": 25, "hill dwarf": 25, "mountain dwarf": 25,
  "elf": 30, "high elf": 30, "drow": 30, "wood elf": 35,
  "halfling": 25, "lightfoot halfling": 25, "stout halfling": 25,
  "human": 30, "tiefling": 30, "harengon": 30, "moon elf": 30
};

let _racesJsonCache = null;
const normKey = s => String(s || "").trim().toLowerCase();

async function ensureRacesJson() {
  if (_racesJsonCache) return _racesJsonCache;
  try {
    const res = await fetch('./data/races.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('races.json fetch failed');
    _racesJsonCache = await res.json();
  } catch {
    _racesJsonCache = [];
  }
  return _racesJsonCache;
}

async function getRaceBaseSpeed(character) {
  const want = normKey(character?.race);
  const races = await ensureRacesJson();

  let local = null;
  if (Array.isArray(races)) local = races.find(r => normKey(r.name || r.index) === want);
  else if (races && typeof races === 'object') local = races[want] || null;

  if (local && Number.isFinite(local.speed)) {
    return { speed: local.speed, src: `Base (${local.name || character.race})` };
  }

  const fb = BASE_SPEED_FALLBACK[want];
  if (Number.isFinite(fb)) return { speed: fb, src: `Base (${character.race})` };

  // Optional API fallback
  try {
    const idx = want.replace(/\s+/g, '-');
    const res = await fetch(`https://www.dnd5eapi.co/api/races/${idx}`);
    if (res.ok) {
      const j = await res.json();
      if (j && Number.isFinite(j.speed)) {
        return { speed: j.speed, src: `Base (${character.race}, API)` };
      }
    }
  } catch {}

  return { speed: 30, src: `Base (default)` };
}

// (export if you’re using modules; otherwise they’ll be global as-is)

// ===== Data Mappers (races / classes / subclasses / backgrounds) =====
// Depends on: DATA_ROOT, API, slug, j, safeGetJSON, readLocalJSON (all in storage.js)

// ---- Local loaders (cached) -----------------------------------------
let __CLASSES_LOCAL, __SUBCLASSES_LOCAL, __RACES_LOCAL, __BACKGROUNDS_LOCAL;

async function loadClassesLocal() {
  if (!__CLASSES_LOCAL) {
    __CLASSES_LOCAL = await readLocalJSON(candidatesFor('classes.json').concat(['./classes.json'])) || [];
  }
  return __CLASSES_LOCAL;
}
async function loadSubclassesLocal() {
  if (!__SUBCLASSES_LOCAL) {
    __SUBCLASSES_LOCAL = await readLocalJSON(candidatesFor('subclasses.json').concat(['./subclasses.json'])) || [];
  }
  return __SUBCLASSES_LOCAL;
}
async function loadRacesLocal() {
  if (!__RACES_LOCAL) {
    __RACES_LOCAL = await readLocalJSON(candidatesFor('races.json').concat(['./races.json'])) || [];
  }
  return __RACES_LOCAL;
}
async function loadBackgroundsLocal() {
  if (!__BACKGROUNDS_LOCAL) {
    __BACKGROUNDS_LOCAL = await readLocalJSON(candidatesFor('backgrounds.json').concat(['./backgrounds.json'])) || [];
  }
  return __BACKGROUNDS_LOCAL;
}

// ---- Helpers ---------------------------------------------------------
const textOf = (x) => Array.isArray(x) ? x.join('\n') : String(x ?? '');
const pickSubclassName = (c) => {
  const b = c?.build;
  if (typeof b === 'string') return b.trim();
  if (b?.subclass) return String(b.subclass).trim();
  if (b?.name) return String(b.name).trim();
  return '';
};

// Keep some lookups local-only to avoid dead API calls
const API_CLASS_BLOCKLIST = new Set(['artificer']);
const API_SUBCLASS_ALLOW  = new Set(['open-hand','champion','lore','evocation','life','devotion','fiend','hunter','land','thief','draconic','berserker']);
const API_RACE_BLOCKLIST  = new Set(['harengon']);

function isNoiseFeature(f) {
  const n = String(f?.name || '').toLowerCase();
  return !n || n.endsWith(' proficiency') || n.endsWith(' language') || n.startsWith('spellcasting');
}

function isGenericSubclassScaffoldName(name) {
  const n = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!n) return false;
  const genericBases = new Set([
    'druid circle',
    'divine domain',
    'primal path',
    'martial archetype',
    'roguish archetype',
    'sacred oath',
    'arcane tradition',
    'sorcerous origin',
    'otherworldly patron',
    'bard college',
    'ranger archetype',
    'monastic tradition',
    'artificer specialist'
  ]);
  if (genericBases.has(n)) return true;
  if (n.endsWith(' feature')) {
    const base = n.replace(/\s+feature$/, '');
    if (genericBases.has(base)) return true;
  }
  return false;
}

// ---- Class features (local-first; API fallback unless blocked) -------
async function getClassFeaturesLocal(clsName, level) {
  const entry = (await loadClassesLocal()).find(c => (c.name || '').toLowerCase() === String(clsName || '').toLowerCase());
  if (!entry) return [];
  const L = Number(level || 1);
  const out = [];

  // Shape 1: { levels: [ {level, features:[...]}, ... ] }
  if (Array.isArray(entry.levels)) {
    for (const row of entry.levels) {
      if (row.level <= L) {
        for (const f of (row.features || [])) {
         out.push(typeof f === 'string'
  ? { name: f, desc: '', source: `Class ${row.level} (Local)` }
  : { ...f, name: f?.name || '', desc: textOf(f?.desc) || '', source: `Class ${row.level} (Local)` });

        }
      }
    }
    return out;
  }

  // Shape 2: { features: { "1":[...], "2":[...], ... } }
  const byLevel = entry.features || {};
  const keys = Object.keys(byLevel).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  for (const k of keys) {
    if (k > L) break;
    for (const f of (byLevel[String(k)] || [])) {
      out.push(typeof f === 'string'
        ? { name: f, desc: '', source: `Class ${k} (Local)` }
        : { ...f, name: f?.name || '', desc: textOf(f?.desc) || '', source: `Class ${k} (Local)` });
    }
  }
  return out;
}

async function getClassFeaturesAPI(clsName, level) {
  if (!clsName) return [];
  const lvls = await j(`${API}/classes/${slug(clsName)}/levels`).catch(() => []);
  const out = [];
  for (const row of lvls) {
    if (level && row.level > Number(level)) break;
    for (const f of (row.features || [])) {
      const dt = await j(`https://www.dnd5eapi.co${f.url}`).catch(() => null);
      if (dt) out.push({ name: dt.name, desc: textOf(dt.desc), source: `Class ${row.level}` });
    }
  }
  return out;
}

async function getClassFeatures(clsName, level) {
  const local = await getClassFeaturesLocal(clsName, level);
  if (local.length) return local; // local wins
  if (API_CLASS_BLOCKLIST.has(String(clsName).toLowerCase())) return [];
  return await getClassFeaturesAPI(clsName, level).catch(() => []);
}

// ---- Export to global (so any sheet can use these) --------------------
window.loadClassesLocal      = window.loadClassesLocal      || loadClassesLocal;
window.loadSubclassesLocal   = window.loadSubclassesLocal   || loadSubclassesLocal;
window.loadRacesLocal        = window.loadRacesLocal        || loadRacesLocal;
window.loadBackgroundsLocal  = window.loadBackgroundsLocal  || loadBackgroundsLocal;
window.loadEquipmentLocal    = window.loadEquipmentLocal    || loadEquipmentLocal;
window.getClassFeatures      = window.getClassFeatures      || getClassFeatures;
window.pickSubclassName      = window.pickSubclassName      || pickSubclassName;
window.isNoiseFeature        = window.isNoiseFeature        || isNoiseFeature;

// ---- Subclass features (strict local-first; allowlisted API fallback) --

async function getSubclassFeaturesLocal(subclassName, className, level) {
  const data = await loadSubclassesLocal();
  const nm = String(subclassName || '').toLowerCase();
  const cl = String(className   || '').toLowerCase();
  const hit = (data || []).find(s =>
    String(s.name  || '').toLowerCase() === nm &&
    String(s.class || '').toLowerCase() === cl
  );
  if (!hit) return [];
  const out = [];
  const L = Number(level || 0);
  // Expect shape: { features: { "2":[...], "6":[...], ... } } or array
  if (hit.features && !Array.isArray(hit.features)) {
    const keys = Object.keys(hit.features).map(Number).sort((a,b)=>a-b);
    for (const k of keys) {
      if (!L || k <= L) {
        for (const f of (hit.features[String(k)] || [])) {
          out.push({ name: f?.name || '', desc: textOf(f?.desc) || '', source: `Subclass ${k} (Local)` });
        }
      }
    }
  } else if (Array.isArray(hit.features)) {
    for (const f of hit.features) {
      if (!L || !f.level || f.level <= L) {
        out.push({ name: f?.name || '', desc: textOf(f?.desc) || '', source: 'Subclass (Local)' });
      }
    }
  }
  return out;
}

async function getSubclassFeaturesAPI(subclassName, className, level) {
  const idx = slug(subclassName);
  if (!API_SUBCLASS_ALLOW.has(idx)) return [];    // don’t waste a call
  const out = [];

  // Primary: /subclasses/{idx}
  const sc = await j(`${API}/subclasses/${idx}`).catch(() => null);
  if (sc && Array.isArray(sc.features)) {
    for (const f of sc.features) {
      const dt = await j(`https://www.dnd5eapi.co${f.url}`).catch(() => null);
      if (dt && (!level || (dt.level ?? 0) <= Number(level))) {
        out.push({ name: dt.name, desc: textOf(dt.desc), source: 'Subclass' });
      }
    }
    if (out.length) return out;
  }

  // Secondary: /classes/{class}/levels → subclass_features
  const lvls = await j(`${API}/classes/${slug(className)}/levels`).catch(() => []);
  for (const row of lvls) {
    if (level && row.level > Number(level)) break;
    for (const f of (row.subclass_features || [])) {
      const dt = await j(`https://www.dnd5eapi.co${f.url}`).catch(() => null);
      const matchName = (dt?.subclass?.name || '').toLowerCase();
      if (dt && matchName === String(subclassName || '').toLowerCase()) {
        out.push({ name: dt.name, desc: textOf(dt.desc), source: `Subclass ${row.level}` });
      }
    }
  }
  return out;
}

async function getSubclassFeatures(subclassName, className, level) {
  const local = await getSubclassFeaturesLocal(subclassName, className, level);
  if (local.length) return local;                 // local wins
  return await getSubclassFeaturesAPI(subclassName, className, level).catch(() => []);
}

// ---- Race features (local-first; API fallback unless blocked) ----------

// ---- Race features: LOCAL first, API only for allowed SRD races if missing locally ----

// Optional aliasing (kept for Moon Elf -> Elf/High Elf)
const RACE_ALIASES = {
  'moon elf': { raceSlug: 'elf', subraceSlug: 'high-elf', displayName: 'Moon Elf' },
  'moon-elf': { raceSlug: 'elf', subraceSlug: 'high-elf', displayName: 'Moon Elf' }
};

// SRD races we ALLOW for API fallback. Anything else never calls the API.
const API_ALLOWED = new Set([
  'dragonborn','dwarf','elf','gnome','half-elf','half-orc','halfling','human','tiefling'
]);

function resolveRaceAlias(character) {
  const raw = String(character?.race || '').trim();
  const lower = raw.toLowerCase();
  const alias = RACE_ALIASES[lower] || RACE_ALIASES[slug?.(raw)];
  if (alias) return { ...alias, rawName: raw };

  const raceSlug = slug?.(raw || 'human') || 'human';
  return { raceSlug, subraceSlug: null, displayName: raw || 'Unknown', rawName: raw };
}

window.StorageAPI = Object.assign(window.StorageAPI || {}, {
  loadClassesLocal, loadSubclassesLocal, loadRacesLocal, loadBackgroundsLocal,
  getClassFeatures, getSubclassFeatures,
  // keep locals available if you want:
  getClassFeaturesLocal, getClassFeaturesAPI,
  getSubclassFeaturesLocal, getSubclassFeaturesAPI,
  resolveRaceAlias
});

// ---- Local JSON loaders ----------------------------------------------------
async function loadLocalRaces() {
  try {
    const res = await fetch('./data/races.json');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function findLocalRace(character) {
  const races = await loadLocalRaces();
  console.log('[races loaded]', Array.isArray(races), Array.isArray(races) ? races.length : Object.keys(races||{}).length);

  const want = String(character?.race || '').toLowerCase();

  if (Array.isArray(races)) {
      console.log("findLocalRace want =", want);
      console.log("findLocalRace races =", races.map(r => r.name || r.index));
    return races.find(r => {
  const cand = String(r.name || r.index || '').toLowerCase();
  console.log('[check]', cand);
  return cand === want;     // <-- this was missing
}) || null;
  }
  if (races && typeof races === 'object') {
    const nm = String(races.name || races.index || '').toLowerCase();
    return (nm === want) ? races : null;
  }
  return null;
}

// ---- LOCAL features --------------------------------------------------------
function mapLocalRaceTraits(race) {
  const out = [];

  // Inline objects on race.traits
  if (Array.isArray(race.traits) && race.traits.length) {
    for (const t of race.traits) {
      const name = (typeof t === 'string') ? t : (t?.name || t?.index || '');
      const desc = (typeof t?.desc === 'string') ? t.desc : textOf?.(t?.desc) || '';
      const id = (typeof t === 'object' && t?.id) ? String(t.id).trim() : '';

      if (name) out.push({ id: id || undefined, name, desc, source: 'Race (Local)' });
    }
  }

  // Also include race.trait_descriptions if present
  if (Array.isArray(race.trait_descriptions)) {
    for (const t of race.trait_descriptions) {
      const name = t?.name || '';
      const desc = textOf?.(t?.desc) || '';
      const id = t?.id ? String(t.id).trim() : '';
      if (name) out.push({ id: id || undefined, name, desc, source: 'Race (Local)' });
    }
  }

  return out;
}

// ---- API fallback (guarded by API_ALLOWED) ---------------------------------
async function getRaceFeaturesAPI(character) {
  const { raceSlug, subraceSlug } = resolveRaceAlias(character);

  // Hard stop if this race isn't explicitly allowed for API
  if (!API_ALLOWED.has((raceSlug || '').toLowerCase())) {
    // console.info(`[race] Skipping API for "${raceSlug}" (not in API_ALLOWED).`);
    return [];
  }

  const out = [];
  try {
    const race = await j(`${API}/races/${raceSlug}`);
    for (const t of (race?.traits || [])) {
      try {
        const dt = await j(`https://www.dnd5eapi.co${t.url}`);
        out.push({ id: String(dt?.id || '').trim() || undefined, name: dt.name, desc: textOf?.(dt.desc), source: 'Race' });
      } catch {}
    }
  } catch {}

  if (subraceSlug) {
    try {
      const sub = await j(`${API}/subraces/${subraceSlug}`);
      for (const t of (sub?.racial_traits || [])) {
        try {
        const dt = await j(`https://www.dnd5eapi.co${t.url}`);
        out.push({ id: String(dt?.id || '').trim() || undefined, name: dt.name, desc: textOf?.(dt.desc), source: 'Subrace' });
      } catch {}
      }
    } catch {}
  }

  // de-dupe by (source::name)
  const seen = new Set();
  const merged = [];
  for (const f of out) {
    const k = (`${f.source || ''}::${f.name || ''}`).toLowerCase();
    if (f?.name && !seen.has(k)) { seen.add(k); merged.push(f); }
  }
  return merged;
}

// ---- Public: LOCAL first, API only if missing AND allowed ------------------
async function getRaceFeatures(character) {
  const localRace = await findLocalRace(character);
  let fromLocal = [];
  if (localRace) {
    const localTraits = mapLocalRaceTraits(localRace);
    // If we found a local race but it had no traits, it might be a stub.
    // If at least one trait has a description, we'll use the local data.
    if (localTraits.length > 0 && localTraits.some(t => t.desc)) {
      fromLocal = localTraits;
    }
  }
  const fromApi = fromLocal.length ? [] : (await getRaceFeaturesAPI(character).catch(() => []));

  // Preserve explicitly tagged racial traits from character data, but do not
  // let generic `character.traits` override canonical race definitions.
  const explicitRacial = (Array.isArray(character?.traits) ? character.traits : [])
    .filter(t => {
      const src = String(t?.source || '').toLowerCase();
      return src.includes('racial') || src.includes('race');
    })
    .map(t => ({
      id: String(t?.id || '').trim() || undefined,
      name: String(t?.name || t || '').trim(),
      desc: String(t?.desc || '').trim(),
      source: t?.source || 'Racial'
    }))
    .filter(t => !!t.name);

  const out = [...fromLocal, ...fromApi, ...explicitRacial];
  const seen = new Set();
  return out.filter(f => {
    const key = String(f?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
// ---- Background features (local only) ---------------------------------

async function getBackgroundFeatures(bgName) {
  if (!bgName) return [];
  const data = await loadBackgroundsLocal();
  const bg = (data || []).find(b => (b.name || '').toLowerCase() === String(bgName || '').toLowerCase());
  if (!bg) return [];
  return (bg.features || []).map(f => ({
    name: f?.name || '',
    desc: textOf(f?.desc) || '',
    source: `Background (${bg.source || 'Local'})`
  }));
}

// ---- Feats (API fallback; local stubbed) -------------------------------

async function getFeatFeaturesLocal(featNames) {
  const data = await readLocalJSON(candidatesFor('feats.json'));
  if (!Array.isArray(data) || !Array.isArray(featNames)) return [];
  const nameSet = new Set(featNames.map(f => String(f?.name || f).toLowerCase()));
  const noteByName = new Map(
    featNames
      .map(f => {
        const name = String(f?.name || f || '').toLowerCase();
        const note = String(f?.desc || '').trim();
        return [name, note];
      })
      .filter(([name]) => !!name)
  );
  return data
    .filter(f => nameSet.has(String(f?.name || '').toLowerCase()))
    .map(f => {
      const name = String(f?.name || '');
      const desc = textOf(f?.desc) || noteByName.get(name.toLowerCase()) || '';
      return { name, desc, source: 'Feat' };
    });
}
async function getFeatFeatures(featNames) {
  const local = await getFeatFeaturesLocal(featNames);
  if (local.length) return local;
  const out = [];
  for (const name of (featNames || [])) {
    const dt = await j(`${API}/feats/${slug(name)}`).catch(() => null);
    if (dt) out.push({ name: dt.name, desc: textOf(dt.desc), source: 'Feat' });
  }
  return out;
}



// 70. Features Aggregation & Rendering
// ------------------------------------

async function loadAllFeatures(character) {
  const subclassName = pickSubclassName(character);

  const [race, cls, sub, feats, bg] = await Promise.all([
    getRaceFeatures(character),
    getClassFeatures(character.class, character.level),
    getSubclassFeatures(subclassName, character.class, character.level),
    getFeatFeatures(character.feats || []),
    getBackgroundFeatures(character.background)
  ]);

  const raceList = Array.isArray(race) ? race : [];
  const classList = Array.isArray(cls) ? cls : [];
  const subList = Array.isArray(sub) ? sub : [];
  const featList = Array.isArray(feats) ? feats : [];
  const bgList = Array.isArray(bg) ? bg : [];
  const customTraitList = (Array.isArray(character?.traits) ? character.traits : [])
    .map(t => (typeof t === 'string' ? { name: t, desc: '' } : (t || {})))
    .map(t => ({
      name: String(t?.name || '').trim(),
      desc: String(t?.desc || '').trim(),
      source: String(t?.source || 'Character')
    }))
    // Include only explicit picked/detail traits to avoid duplicating broad race/class entries.
    .filter(t => t.name.includes(':'));

  const chosenRaceIds = new Set((character?.choices?.raceTraits || []).map(f => f.id).filter(Boolean));
  const chosenRaceNames = new Set((character?.choices?.raceTraits || []).map(f => String(f?.name || '').toLowerCase()).filter(Boolean));
  const chosenClassIds = new Set((character?.choices?.classFeatures || []).map(f => f.id).filter(Boolean));
  const chosenSubIds = new Set((character?.choices?.subclassFeatures || []).map(f => f.id).filter(Boolean));
  const chosenBgNames = new Set((character?.choices?.backgroundFeatures || []).map(f => String(f.name || '').toLowerCase()).filter(Boolean));
  const chosenBgFromChoices = (Array.isArray(character?.choices?.backgroundFeatures) ? character.choices.backgroundFeatures : [])
    .map(f => ({
      name: String(f?.name || '').trim(),
      desc: String(f?.desc || '').trim(),
      source: 'Background'
    }))
    .filter(f => !!f.name);
  const filteredRace = (chosenRaceIds.size || chosenRaceNames.size)
    ? raceList.filter(f => chosenRaceIds.has(f?.id) || chosenRaceNames.has(String(f?.name || '').toLowerCase()))
    : raceList;
  const isOptionalFeature = (f) =>
    /\(optional\)/i.test(String(f?.name || '')) || /-optional$/i.test(String(f?.id || ''));
  const filteredClass = chosenClassIds.size
    ? classList.filter(f => {
        // Keep baseline class progression visible even when saved choice ids are stale/incomplete.
        if (!f?.id) return true;
        if (chosenClassIds.has(f.id)) return true;
        return !isOptionalFeature(f);
      })
    : classList;
  const filteredSub = chosenSubIds.size ? subList.filter(f => chosenSubIds.has(f.id)) : subList;
  const filteredBgBase = chosenBgNames.size ? bgList.filter(f => chosenBgNames.has(String(f.name || '').toLowerCase())) : bgList;
  const filteredBg = (() => {
    const out = [...filteredBgBase];
    const seen = new Set(filteredBgBase.map(f => String(f?.name || '').toLowerCase()));
    for (const feat of chosenBgFromChoices) {
      const key = String(feat?.name || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(feat);
    }
    return out;
  })();

  // Optional class features should only display when explicitly taken.
  const optionalChoiceStates = new Map();
  const parseTaken = (val, fallbackRaw = "") => {
    if (typeof val === "boolean") return val;
    const raw = String(fallbackRaw || "").trim().toLowerCase();
    if (!raw) return false;
    return ["taken", "yes", "y", "true", "ok", "done", "1"].includes(raw);
  };
  const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
  for (const choice of classChoices) {
    const id = String(choice?.choiceId || "");
    const marker = ":optional:";
    const idx = id.indexOf(marker);
    if (idx < 0) continue;
    const key = String(id.slice(idx + marker.length) || "").trim().toLowerCase();
    if (!key) continue;
    const note = String(choice?.value || "").trim();
    optionalChoiceStates.set(key, {
      taken: parseTaken(choice?.taken, note),
      note
    });
  }
  const levelUpDecisions = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
  for (const row of levelUpDecisions) {
    const picks = Array.isArray(row?.choices) ? row.choices : [];
    for (const pick of picks) {
      const id = String(pick?.choiceId || "");
      const marker = ":optional:";
      const idx = id.indexOf(marker);
      if (idx < 0) continue;
      const key = String(id.slice(idx + marker.length) || "").trim().toLowerCase();
      if (!key || optionalChoiceStates.has(key)) continue;
      const note = String(pick?.value || "").trim();
      optionalChoiceStates.set(key, {
        taken: parseTaken(pick?.taken, note),
        note
      });
    }
  }

  const classWithOptionalNotes = filteredClass.map(f => {
    const isOptional = /\(optional\)/i.test(String(f?.name || "")) || /-optional$/i.test(String(f?.id || ""));
    if (!isOptional) return f;
    const nameKey = slug(String(f?.name || "").replace(/\(optional\)/ig, "").trim());
    const idKey = slug(String(f?.id || "").replace(/-optional$/i, "").trim());
    let picked = null;
    for (const [k, v] of optionalChoiceStates.entries()) {
      if (
        (nameKey && (nameKey === k || nameKey.includes(k) || k.includes(nameKey))) ||
        (idKey && (idKey === k || idKey.includes(k) || k.includes(idKey)))
      ) {
        picked = v;
        break;
      }
    }
    if (!picked?.taken) return null;
    const cleanName = String(f?.name || "").replace(/\s*\(optional\)\s*/ig, " ").replace(/\s{2,}/g, " ").trim();
    return { ...f, name: cleanName };
  }).filter(Boolean);

  // Convert class choice picks into concrete feature entries (e.g., Fighting Style: Archery).
  const collectFightingStyles = () => {
    const picked = new Set();
    const pushValues = (vals) => {
      for (const v of (Array.isArray(vals) ? vals : [])) {
        const raw = String(v || '').trim();
        if (raw) picked.add(raw);
      }
    };
    for (const row of classChoices) {
      const id = String(row?.choiceId || '').toLowerCase();
      if (!id.includes('fighting_style')) continue;
      pushValues(row?.values);
      if (!Array.isArray(row?.values) && row?.value) pushValues([row.value]);
    }
    for (const dec of levelUpDecisions) {
      for (const pick of (Array.isArray(dec?.choices) ? dec.choices : [])) {
        const id = String(pick?.choiceId || '').toLowerCase();
        if (!id.includes('fighting_style')) continue;
        pushValues(pick?.values);
        if (!Array.isArray(pick?.values) && pick?.value) pushValues([pick.value]);
      }
    }
    return [...picked];
  };

  const styleDesc = {
    archery: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
    defense: 'While you are wearing armor, you gain a +1 bonus to AC.',
    dueling: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
    'great weapon fighting': 'When you roll a 1 or 2 on a damage die for a melee attack you make with a two-handed or versatile weapon, you can reroll the die and must use the new roll.',
    protection: 'When a creature you can see attacks a target other than you within 5 feet, you can use your reaction to impose disadvantage on that attack roll. You must be wielding a shield.',
    'two-weapon fighting': 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.',
    'thrown weapon fighting': 'You can draw a weapon that has the thrown property as part of the attack you make with the weapon. In addition, when you hit with a ranged attack using a thrown weapon, you gain a +2 bonus to the damage roll.',
    'blind fighting': 'You have blindsight with a range of 10 feet. Within that range, you can effectively see anything that isn’t behind total cover, even if you’re blinded or in darkness.',
    interception: 'When a creature you can see hits a target other than you within 5 feet, you can use your reaction to reduce the damage by 1d10 + your proficiency bonus. You must be wielding a shield or a simple/martial weapon.',
    'superior technique': 'You learn one maneuver of your choice from the Battle Master archetype and gain one superiority die, which is a d6.',
    'unarmed fighting': 'Your unarmed strikes can deal d6 bludgeoning damage (d8 if you are not wielding weapons or a shield). At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature grappled by you.',
    'blessed warrior': 'You learn two cantrips of your choice from the cleric spell list. They count as paladin spells for you, and Charisma is your spellcasting ability for them.',
    'druidic warrior': 'You learn two cantrips of your choice from the druid spell list. They count as ranger spells for you, and Wisdom is your spellcasting ability for them.'
  };
  const chosenFightingStyles = collectFightingStyles().map(name => ({
    name: `Fighting Style: ${name}`,
    desc: styleDesc[String(name || '').toLowerCase()] || `You adopted the ${name} fighting style.`,
    source: 'Class'
  }));

  const classWithChoices = (() => {
    if (!chosenFightingStyles.length) return classWithOptionalNotes;
    return [
      ...classWithOptionalNotes.filter(f => String(f?.name || '').trim().toLowerCase() !== 'fighting style'),
      ...chosenFightingStyles
    ];
  })();

  const hasBlessedStrikes = classWithChoices.some(f =>
    String(f?.id || "").toLowerCase().includes("blessed-strikes-optional") ||
    String(f?.name || "").toLowerCase() === "blessed strikes"
  );
  const filteredSubForOptionalReplacements = hasBlessedStrikes
    ? filteredSub.filter(f => {
        const n = String(f?.name || "").trim().toLowerCase();
        return n !== "divine strike" && n !== "divine strike improvement" && n !== "potent spellcasting";
      })
    : filteredSub;

  // TCoE optional replacement: Primal Awareness replaces Primeval Awareness.
  const hasPrimalAwareness = classWithChoices.some(f => {
    const n = String(f?.name || "").toLowerCase();
    const id = String(f?.id || "").toLowerCase();
    return n === "primal awareness" || n.includes("primal awareness") || id.includes("primal-awareness");
  });
  const hasNaturesVeil = classWithChoices.some(f => {
    const n = String(f?.name || "").toLowerCase();
    const id = String(f?.id || "").toLowerCase();
    return n === "nature's veil" || n.includes("nature's veil") || id.includes("natures-veil");
  });
  const classWithOptionalReplacements = classWithChoices.filter(f => {
    const name = String(f?.name || "").trim().toLowerCase();
    if (hasPrimalAwareness && name === "primeval awareness") return false;
    if (hasNaturesVeil && name === "hide in plain sight") return false;
    return true;
  });

  const seen = new Set();
  const merged = [];
  for (const f of [...filteredRace, ...classWithOptionalReplacements, ...filteredSubForOptionalReplacements, ...featList, ...filteredBg, ...customTraitList]) {
    if (!f || !f.name) continue;
    if (isNoiseFeature(f)) continue;
    if (isGenericSubclassScaffoldName(f.name)) continue;
    const key = `${f.source || ''}::${f.name}`.toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push({ ...f, name: f.name, desc: f.desc || '', source: f.source || '' }); }
  }
  return merged;
}

// ===================================
// Character Calculation Logic
// ===================================

// --- Core Rules Helpers ---
window.DDRules = window.DDRules || {};
Object.assign(window.DDRules, {
  abilityMod(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.floor((n - 10) / 2);
  },
  proficiencyFromLevel(level) {
    const L = Number(level) || 1;
    if (L < 1) return 2;
    return Math.floor((L - 1) / 4) + 2;
  },
  propHas(equip, prop) {
    const list = (equip?.properties || equip?.weapon?.properties || equip?.rules?.weapon?.properties || []).map(p => {
      if (typeof p === 'string') return p;
      return p?.id || p?.index || p?.name;
    });
    const p = String(prop).toLowerCase();
    return list.some(pr => {
      const raw = String(pr || '').toLowerCase();
      return raw === p || raw.replace(/^prop:/, "") === p;
    });
  },
  fmtMod(mod) {
    const n = Number(mod) || 0;
    return (n >= 0 ? `+${n}` : String(n));
  }
});

// --- Calculation Functions ---
window.CharCalculations = window.CharCalculations || {};

function hasNamedFeature(character, name){
  const needle = String(name).toLowerCase();
  const pool = (character.features || []).concat(character.feats || []);
  return pool.some(f => String(f.name || f).toLowerCase().includes(needle));
}

function monkUnarmoredBonus(level) {
  if (level >= 18) return 30;
  if (level >= 14) return 25;
  if (level >= 10) return 20;
  if (level >= 6)  return 15;
  if (level >= 2)  return 10;
  return 0;
}

function isWearingArmor(armor) {
  return Boolean(armor && (armor.category || armor.type));
}

function safeArmorCtx(ctx) {
  return ctx && typeof ctx === 'object'
    ? { armor: ctx.armor || null, shield: !!ctx.shield }
    : { armor: null, shield: false };
}

async function calculateAC(character) {
  if (character.isWildShaped && character.overrideAC) {
    return { ac: character.overrideAC, armorName: 'Natural Armor', breakdown: `Wild Shape: ${character.wildShapeFormName}` };
  }

  const hasFeat = (name) => {
    const feats = Array.isArray(character?.feats) ? character.feats : [];
    return feats.some(f => String(f?.name || f).toLowerCase() === String(name || '').toLowerCase());
  };

  const cls = String(character.class || "").trim().toLowerCase();
  const A   = character.abilities || {};
  const effScore = (ab) => (
    (window.DDRules && typeof window.DDRules.getEffectiveAbilityScore === 'function')
      ? Number(window.DDRules.getEffectiveAbilityScore(character, ab) || 10)
      : Number(A?.[ab] ?? A?.[String(ab || '').toLowerCase()] ?? 10)
  );
  const dex = window.DDRules.abilityMod(effScore('DEX'));

  const armorList = Array.isArray(character.armor)
    ? character.armor
    : (character.armor ? [character.armor] : []);
  const lower = armorList.map(n => String(n).toLowerCase());
  const hasShield = lower.some(n => n.includes("shield"));

  const finish = (ac, label, parts) => ({ ac, armorName: label, breakdown: parts.join("\n") });

  const armorNameRaw = armorList.find(n => !String(n).toLowerCase().includes("shield"));
  const shieldName = armorList.find(n => String(n).toLowerCase().includes("shield"));
  const info = armorNameRaw ? await window.getArmorInfoByName(armorNameRaw) : null;
  const shieldInfo = shieldName ? await window.getArmorInfoByName(shieldName) : null;
  const armorItem = armorNameRaw ? await window.getEquipmentByName(armorNameRaw) : null;
  const shieldItem = shieldName ? await window.getEquipmentByName(shieldName) : null;

  const shieldBonus = hasShield ? Number(shieldInfo?.bonus ?? 2) : 0;
  const hasDualWielder = hasFeat('Dual Wielder');
  const collectFightingStyles = (ch) => {
    const picked = new Set();
    const addRaw = (value) => {
      const text = String(value || '').trim();
      if (!text) return;
      picked.add(text.toLowerCase());
      const match = text.match(/fighting style\s*[:(]\s*([^)\n]+)\)?/i);
      if (match?.[1]) picked.add(String(match[1]).trim().toLowerCase());
    };
    const traitList = Array.isArray(ch?.traits) ? ch.traits : [];
    traitList.forEach(t => addRaw(typeof t === 'string' ? t : t?.name));
    const featureList = Array.isArray(ch?.features) ? ch.features : [];
    featureList.forEach(f => addRaw(typeof f === 'string' ? f : f?.name));
    const classChoices = Array.isArray(ch?.choices?.classChoices) ? ch.choices.classChoices : [];
    classChoices.forEach(row => {
      if (!String(row?.choiceId || '').toLowerCase().includes('fighting_style')) return;
      (Array.isArray(row?.values) ? row.values : []).forEach(addRaw);
      addRaw(row?.value);
    });
    const decisions = Array.isArray(ch?.choices?.levelUpDecisions) ? ch.choices.levelUpDecisions : [];
    decisions.forEach(decision => {
      const rows = Array.isArray(decision?.choices) ? decision.choices : [];
      rows.forEach(row => {
        if (!String(row?.choiceId || '').toLowerCase().includes('fighting_style')) return;
        (Array.isArray(row?.values) ? row.values : []).forEach(addRaw);
        addRaw(row?.value);
      });
    });
    return picked;
  };
  const fightingStyles = collectFightingStyles(character);
  const hasDefenseStyle = fightingStyles.has('defense');

  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  let infusionBonus = 0;
  const infusionParts = [];
  const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
  const attunedQtyForName = (label) => {
    const want = String(label || '').trim().toLowerCase();
    if (!want) return 0;
    return gear.reduce((sum, g) => {
      if (String(g?.name || '').trim().toLowerCase() !== want) return sum;
      const qty = Math.max(1, Number(g?.qty || 1));
      const att = Math.max(0, Number(g?.attuned_qty ?? (g?.attuned ? 1 : 0)) || 0);
      return sum + Math.min(qty, att);
    }, 0);
  };
  const findGearModifier = (label) => {
    if (!label) return 0;
    const key = String(label).toLowerCase();
    const slug = slugFromName(label);
    const match = gear.find(g => {
      const ref = String(g?.ref || '').toLowerCase();
      const name = String(g?.name || '').toLowerCase();
      const refSlug = ref.replace(/^equip:/, "");
      return (ref && (ref === key || refSlug === slug)) || (name && name.includes(key));
    });
    return Number(match?.modifier || 0) || 0;
  };
  const armorMagic = findGearModifier(armorNameRaw);
  const shieldMagic = findGearModifier(shieldName);
  const sumAcEffects = (item) => {
    if (!item?.magic?.isMagic) return 0;
    const effects = Array.isArray(item?.effects) ? item.effects : [];
    return effects.reduce((acc, eff) => {
      if (String(eff?.when || '').toLowerCase() !== 'equipped') return acc;
      if (String(eff?.kind || '').toLowerCase() !== 'ac') return acc;
      const val = Number(eff?.value || 0);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  };
  const armorEffectBonus = sumAcEffects(armorItem);
  const shieldEffectBonus = sumAcEffects(shieldItem);

  const armorInfusion = allInfusions.find(inf => inf.name === 'Enhanced Defense' && inf.owner === character.name && inf.item === armorNameRaw);
  if (armorInfusion && armorInfusion.bonus) {
    infusionBonus += armorInfusion.bonus;
    infusionParts.push(`Infusion (Armor): +${armorInfusion.bonus}`);
  }
  const shieldInfusion = allInfusions.find(inf => inf.name === 'Enhanced Defense' && inf.owner === character.name && inf.item === shieldName);
  if (shieldInfusion && shieldInfusion.bonus) {
    infusionBonus += shieldInfusion.bonus;
    infusionParts.push(`Infusion (Shield): +${shieldInfusion.bonus}`);
  }
  const cloakProtection = allInfusions.find(inf =>
    String(inf?.name || '').toLowerCase() === 'replicate magic item (cloak of protection)'
    && String(inf?.owner || '') === String(character?.name || '')
  );
  if (cloakProtection && attunedQtyForName(cloakProtection.item) > 0) {
    infusionBonus += 1;
    infusionParts.push('Cloak of Protection (attuned): +1');
  }

  if (!info) { // Unarmored or only a shield
    const monkWisMod = window.DDRules.abilityMod(effScore('WIS'));
    const barbConMod = window.DDRules.abilityMod(effScore('CON'));
    const base = cls === "monk" ? 10 + dex + monkWisMod
               : cls === "barbarian" ? 10 + dex + barbConMod
               : 10 + dex;
    const parts = [
      cls === "monk" ? `Unarmored Defense (Monk): 10 + Dex (${window.DDRules.fmtMod(dex)}) + Wis (${window.DDRules.fmtMod(monkWisMod)})`
      : cls === "barbarian" ? `Unarmored Defense (Barbarian): 10 + Dex (${window.DDRules.fmtMod(dex)}) + Con (${window.DDRules.fmtMod(barbConMod)})`
      : `Unarmored: 10 + Dex (${window.DDRules.fmtMod(dex)})`
    ];
    if (hasShield) parts.push(`Shield: +${shieldBonus}`);
    if (shieldMagic || shieldEffectBonus) parts.push(`Magic Shield: +${shieldMagic + shieldEffectBonus}`);
    if (hasDualWielder && character?.offhandWeapon && !hasShield) {
      parts.push('Dual Wielder: +1');
      return finish(base + shieldBonus + shieldMagic + shieldEffectBonus + 1, hasShield ? "Unarmored + Shield" : "Unarmored", parts);
    }
    if (infusionBonus > 0) parts.push(...infusionParts);
    return finish(base + shieldBonus + shieldMagic + shieldEffectBonus + infusionBonus, hasShield ? "Unarmored + Shield" : "Unarmored", parts);
  }

  let total = info.baseAC;
  const parts = [`${info.name || armorNameRaw}: ${info.baseAC}`];
  if (info.dexBonus) {
    const maxDex = (hasFeat('Medium Armor Master') && info.maxDex === 2) ? 3 : info.maxDex;
    const used = maxDex == null ? dex : Math.min(dex, maxDex);
    total += used;
    parts.push(`Dex Mod${maxDex != null ? ` (cap ${maxDex})` : ''}: ${window.DDRules.fmtMod(used)}`);
  }
  if (hasShield) { total += shieldBonus; parts.push(`Shield: +${shieldBonus}`); }
  if (armorMagic || armorEffectBonus) { total += armorMagic + armorEffectBonus; parts.push(`Magic Armor: +${armorMagic + armorEffectBonus}`); }
  if (shieldMagic || shieldEffectBonus) { total += shieldMagic + shieldEffectBonus; parts.push(`Magic Shield: +${shieldMagic + shieldEffectBonus}`); }
  if (hasDualWielder && character?.offhandWeapon && !hasShield) {
    total += 1;
    parts.push('Dual Wielder: +1');
  }
  if (hasDefenseStyle) {
    total += 1;
    parts.push('Fighting Style (Defense): +1');
  }
  if (infusionBonus > 0) { total += infusionBonus; parts.push(...infusionParts); }

  const label = hasShield ? `${info.name || armorNameRaw} + Shield` : (info.name || armorNameRaw);
  return finish(total, label, parts);
}

function computeInitiative(character) {
  const A = character.abilities || {};
  const effScore = (ab) => (
    (window.DDRules && typeof window.DDRules.getEffectiveAbilityScore === 'function')
      ? Number(window.DDRules.getEffectiveAbilityScore(character, ab) || 10)
      : Number(A?.[ab] ?? A?.[String(ab || '').toLowerCase()] ?? 10)
  );
  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const dex = window.DDRules.abilityMod(effScore('DEX'));
  const cls = String(character?.class || '').trim().toLowerCase();
  const lvl = Number(character?.level || 1);

  let bonus = 0;
  const breakdownParts = [`Dex: ${window.DDRules.fmtMod(dex)}`];
  let hasAdvantage = false;

  if (Array.isArray(character.feats) && character.feats.some(f => String(f?.name || f).toLowerCase() === 'alert')) {
    bonus += 5;
    breakdownParts.push('Alert feat: +5');
  }
  if (Number.isFinite(Number(character.bonusInitiative)) && Number(character.bonusInitiative) !== 0) {
    bonus += Number(character.bonusInitiative);
    breakdownParts.push(`Bonus Initiative: ${window.DDRules.fmtMod(Number(character.bonusInitiative))}`);
  }
  if (character.add_cha_to_initiative) {
    const chaMod = window.DDRules.abilityMod(effScore('CHA'));
    bonus += chaMod;
    breakdownParts.push(`Bonus (CHA): ${window.DDRules.fmtMod(chaMod)}`);
  }
  if (typeof character.initiative_bonus === 'number') {
    bonus += character.initiative_bonus;
    breakdownParts.push(`Bonus (Misc): ${window.DDRules.fmtMod(character.initiative_bonus)}`);
  }
  if (String(character.race || '').toLowerCase() === 'harengon') {
    bonus += pb;
    breakdownParts.push(`Hare-Trigger (PB): +${pb}`);
  }
  if (cls === 'barbarian' && lvl >= 7) {
    hasAdvantage = true;
    breakdownParts.push('Feral Instinct: advantage on initiative rolls');
  }
  try {
    const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
    const hasHelmInfusion = allInfusions.some(inf =>
      String(inf?.name || '').toLowerCase() === 'helm of awareness'
      && String(inf?.owner || '') === String(character?.name || '')
    );
    if (hasHelmInfusion) {
      hasAdvantage = true;
      breakdownParts.push('Helm of Awareness: advantage on initiative rolls; cannot be surprised while conscious');
    }
  } catch (_) { /* ignore */ }

  return { value: dex + bonus, breakdown: breakdownParts.join('\n'), hasAdvantage };
}

async function calculateSpeed(character, armorCtxOpt = null) {
  if (character.isWildShaped && character.overrideSpeed) {
    return { total: parseInt(character.overrideSpeed, 10) || 0, breakdown: `Wild Shape: ${character.wildShapeFormName}` };
  }

  // Check for conditions that reduce speed to 0
  const activeConditions = new Set(window.readConditionState(character));
  const speedZeroConditions = ['Grappled', 'Paralyzed', 'Petrified', 'Restrained', 'Stunned', 'Unconscious'];
  for (const cond of speedZeroConditions) {
    if (activeConditions.has(cond)) {
      return {
        total: 0,
        breakdown: `Condition (${cond}): Speed is 0`
      };
    }
  }

  // Determine armor context if not provided, similar to how calculateAC does it.
  let armorInfo = null;
  let wornArmorName = "";
  let hasShield = false;
  if (armorCtxOpt && armorCtxOpt.armor) {
      armorInfo = armorCtxOpt.armor;
      wornArmorName = String(armorInfo?.name || "");
      hasShield = armorCtxOpt.shield;
  } else {
      const armorList = Array.isArray(character.armor)
          ? character.armor
          : (character.armor ? [character.armor] : []);
      const lower = armorList.map(n => String(n).toLowerCase());
      hasShield = lower.some(n => n.includes("shield"));
      const armorNameRaw = armorList.find(n => !String(n).toLowerCase().includes("shield"));
      wornArmorName = String(armorNameRaw || "");
      armorInfo = armorNameRaw ? await window.getArmorInfoByName(armorNameRaw) : null;
  }

  const bd = [];
  const { speed: base, src } = await window.getRaceBaseSpeed(character);
  let total = base;
  bd.push(`${src}: ${base}`);

  const cls = (character?.class || '').trim().toLowerCase();
  const lvl = Number(character?.level || 1);
  const isHeavyArmor = (info, rawName) => {
    const blob = [
      info?.category,
      info?.type,
      info?.subtype,
      info?.name,
      rawName
    ].map(v => String(v || "").toLowerCase()).join(" ");
    if (blob.includes("heavy")) return true;
    // Fallback for legacy entries without category metadata.
    return ["ring mail", "chain mail", "splint", "plate"]
      .some(n => blob.includes(n));
  };

  if (cls === 'monk' && lvl >= 2 && !isWearingArmor(armorInfo) && !hasShield) {
    const bonus = monkUnarmoredBonus(lvl);
    total += bonus; bd.push(`Monk Unarmored Movement (lvl ${lvl}): +${bonus}`);
  }
  if (cls === 'barbarian' && lvl >= 5) {
    const heavy = isHeavyArmor(armorInfo, wornArmorName);
    if (!heavy) {
      total += 10;
      bd.push(`Barbarian Fast Movement (lvl ${lvl}): +10`);
    } else {
      bd.push(`Barbarian Fast Movement blocked by heavy armor`);
    }
  }
  if (Number.isFinite(Number(character.speedBonus)) && Number(character.speedBonus) !== 0) {
    total += Number(character.speedBonus);
    bd.push(`Speed Bonus: +${Number(character.speedBonus)}`);
  }

  total = Math.max(0, total);
  return { total, breakdown: bd.join('\n') };
}

async function getWildShapeOptions(character) {
    const [beasts, classes] = await Promise.all([
        window.loadBeasts(),
        window.loadClassesLocal()
    ]);

    const druidClass = classes.find(c => c.name === 'Druid');
    const wsFeature = druidClass?.actions?.find(a => a.name === 'Wild Shape');
    if (!wsFeature) return [];

    // Determine which scaling rules to use (base or subclass)
    const level = Number(character.level) || 1;
    let maxCR = 0;
    let restrictions = new Set();
    let resolvedFromScaling = false;

    let scalingRules = wsFeature.scaling;
    const buildLower = String(character?.build || '').toLowerCase();
    if (wsFeature.subclass_scaling && character.build && wsFeature.subclass_scaling[character.build]) {
        scalingRules = wsFeature.subclass_scaling[character.build];
    }

    // Preferred path: structured scaling rules from class data.
    if (scalingRules && Array.isArray(scalingRules.levels)) {
        let applicableRule = null;
        for (let i = scalingRules.levels.length - 1; i >= 0; i--) {
            const rule = scalingRules.levels[i];
            if (level >= Number(rule.level || 0)) {
                applicableRule = rule;
                break;
            }
        }
        if (applicableRule) {
            maxCR = Number(applicableRule.max_cr || 0);
            if (applicableRule.max_cr_formula) {
                const formula = String(applicableRule.max_cr_formula).replace(/\blevel\b/g, String(level));
                // Keep eval constrained to simple arithmetic formulas in our local data file.
                maxCR = Number(eval(formula)) || maxCR;
            }
            restrictions = new Set(applicableRule.restrictions || []);
            resolvedFromScaling = true;
        }
    }

    // Fallback path: core 5e rules when local action metadata has no scaling block.
    if (!resolvedFromScaling) {
        if (buildLower.includes('moon')) {
            maxCR = Math.max(1, Math.floor(level / 3));
            if (level < 8) restrictions.add('no flying');
        } else {
            if (level >= 8) maxCR = 1;
            else if (level >= 4) maxCR = 0.5;
            else if (level >= 2) maxCR = 0.25;
            else maxCR = 0;
            if (level < 8) restrictions.add('no flying');
            if (level < 4) restrictions.add('no swimming');
        }
    }

    const crToNum = (raw) => {
        const text = String(raw || '').trim();
        if (!text) return 0;
        const token = text.split(/\s+/)[0]; // e.g. "1/4" from "1/4 (50 XP)"
        if (token.includes('/')) {
            const [a, b] = token.split('/');
            const n = Number(a);
            const d = Number(b);
            if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return n / d;
            return 0;
        }
        const n = Number(token);
        return Number.isFinite(n) ? n : 0;
    };

    return beasts.filter(b => {
        const crNum = crToNum(b.cr ?? b.Challenge ?? b.challenge_rating ?? 0);
        if (crNum > maxCR) return false;

        const speed = String(b.speed ?? b.Speed ?? '').toLowerCase();
        if (restrictions.has('no flying') && speed.includes('fly')) return false;
        if (restrictions.has('no swimming') && speed.includes('swim')) return false;

        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
}

Object.assign(window.CharCalculations, {
  calculateAC,
  computeInitiative,
  hasNamedFeature,
  calculateSpeed,
  getWildShapeOptions,
});

let __MONSTERS_LOCAL = null;
async function loadMonsters(force = false) {
  if (force || !__MONSTERS_LOCAL) {
    __MONSTERS_LOCAL = await readLocalJSON(candidatesFor('externalmonsters.json')) || [];
  }
  return __MONSTERS_LOCAL;
}
window.loadMonsters = window.loadMonsters || loadMonsters;

let __BEASTS_LOCAL = null;
async function loadBeasts(force = false) {
  if (force || !__BEASTS_LOCAL) {
    __BEASTS_LOCAL = await readLocalJSON(candidatesFor('beasts.json')) || [];
  }
  return __BEASTS_LOCAL;
}
window.loadBeasts = window.loadBeasts || loadBeasts;

function getActionStateKey(c) { return 'actions:' + String(c?.name || '').toLowerCase(); }
function readActionState(c) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getActionStateKey(c)) || '{}');
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
}
function writeActionState(c, state) {
  try { localStorage.setItem(getActionStateKey(c), JSON.stringify(state || {})); } catch {}
}


// ——— explicit globals to ensure the sheet can call these ———
window.dataRoot               = window.dataRoot               || dataRoot;
window.getCharacterList       = window.getCharacterList       || getCharacterList;
window.setCharacterList       = window.setCharacterList       || setCharacterList;
window.getPartyScopes         = window.getPartyScopes         || getPartyScopes;
window.getActivePartyScope    = window.getActivePartyScope    || getActivePartyScope;
window.setActivePartyScope    = window.setActivePartyScope    || setActivePartyScope;
window.resolveCharacterParty  = window.resolveCharacterParty  || resolveCharacterParty;
window.setCharacterParty      = window.setCharacterParty      || setCharacterParty;
window.getPartyCharacterFiles = window.getPartyCharacterFiles || getPartyCharacterFiles;

window.loadCharacter          = window.loadCharacter          || loadCharacter;
window.saveCharacter          = window.saveCharacter          || saveCharacter;
window.getDataDirectoryHandle = window.getDataDirectoryHandle || getDataDirHandle;
window.loadSpells             = window.loadSpells             || loadSpells;
window.loadInfusions          = window.loadInfusions          || loadInfusions;

window.getEquippedWeapons     = window.getEquippedWeapons     || getEquippedWeapons;
window.getEquipmentByName     = window.getEquipmentByName     || getEquipmentByName;
window.normalizeGearList      = window.normalizeGearList      || normalizeGearList;
window.expandPackedGearEntries = window.expandPackedGearEntries || expandPackedGearEntries;
window.gearTooltipFor         = window.Tooltips?.gearTooltipFor || window.gearTooltipFor;

window.getArmorInfoByName     = window.getArmorInfoByName     || getArmorInfoByName;

window.getRaceFeatures        = window.getRaceFeatures        || getRaceFeatures;
window.getClassFeatures       = window.getClassFeatures       || getClassFeatures;
window.getSubclassFeatures    = window.getSubclassFeatures    || getSubclassFeatures;
window.getBackgroundFeatures  = window.getBackgroundFeatures  || getBackgroundFeatures;
window.loadAllFeatures        = window.loadAllFeatures        || loadAllFeatures;

window.CharCalculations       = window.CharCalculations       || {}; // Ensure it exists
window.coinsLine              = window.coinsLine              || coinsLine;
window.setCurrentCharacter    = window.setCurrentCharacter    || setCurrentCharacter;
window.getCurrentCharacter    = window.getCurrentCharacter    || getCurrentCharacter;
window.getCurrentCharacterFile= window.getCurrentCharacterFile|| getCurrentCharacterFile;
window.STORAGE                = window.STORAGE                || STORAGE;
window.readActionState        = window.readActionState        || readActionState;
window.writeActionState       = window.writeActionState       || writeActionState;
window.STORAGE                = window.STORAGE                || STORAGE;

// --- Spells Page State ---
function getSpellStateKey(c) { return 'spells:' + String(c?.name || '').toLowerCase(); }
function readSpellState(c) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getSpellStateKey(c)) || '{}');
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
}
function writeSpellState(c, state) {
  try { localStorage.setItem(getSpellStateKey(c), JSON.stringify(state || {})); } catch {}
}
window.readSpellState = window.readSpellState || readSpellState;
window.writeSpellState = window.writeSpellState || writeSpellState;

// --- Artificer Companion Helpers (Homunculus Servant) ---
const ENCOUNTER_PENDING_SUMMONS_KEY = 'dd:encounter:pendingSummons';
const HOMUNCULUS_STATE_PREFIX = 'dd:homunculus:';

function getHomunculusStateKey(character) {
  return `${HOMUNCULUS_STATE_PREFIX}${String(character?.name || '').trim().toLowerCase()}`;
}

function parseOptionalFiniteNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeInfusionName(v) {
  return String(v || '').trim().toLowerCase();
}

function characterKnowsInfusion(character, infusionName) {
  const target = normalizeInfusionName(infusionName);
  if (!target) return false;
  const charKnown = Array.isArray(character?.infusions?.known) ? character.infusions.known : [];
  if (charKnown.some(n => normalizeInfusionName(n) === target)) return true;
  const spellState = readSpellState(character);
  const stateKnown = Array.isArray(spellState?.knownInfusions) ? spellState.knownInfusions : [];
  return stateKnown.some(n => normalizeInfusionName(n) === target);
}

function characterKnowsHomunculusServant(character) {
  return characterKnowsInfusion(character, 'Homunculus Servant');
}

function getHomunculusServantState(character) {
  const raw = STORAGE.get(getHomunculusStateKey(character), {}) || {};
  const knows = characterKnowsHomunculusServant(character);
  const fallbackName = `${String(character?.name || 'Artificer').trim()}'s Homunculus`;
  const parsedCurrentHP = parseOptionalFiniteNumber(raw.currentHP);
  const parsedMaxHPOverride = parseOptionalFiniteNumber(raw.maxHPOverride);
  const state = {
    enabled: knows,
    active: !!raw.active,
    name: String(raw.name || fallbackName),
    currentHP: parsedCurrentHP,
    maxHPOverride: parsedMaxHPOverride
  };
  if (!knows) state.active = false;
  return state;
}

function writeHomunculusServantState(character, nextState) {
  const prev = getHomunculusServantState(character);
  const parsedCurrentHP = parseOptionalFiniteNumber(nextState?.currentHP);
  const parsedMaxHPOverride = parseOptionalFiniteNumber(nextState?.maxHPOverride);
  const merged = {
    ...prev,
    ...(nextState || {}),
    currentHP: parsedCurrentHP,
    maxHPOverride: parsedMaxHPOverride
  };
  STORAGE.set(getHomunculusStateKey(character), merged);

  // Mirror this into character JSON shape so snapshots/saves carry the intent.
  if (character && typeof character === 'object') {
    character.companions = character.companions || {};
    character.companions.homunculusServant = {
      enabled: !!merged.enabled,
      active: !!merged.active,
      name: String(merged.name || `${String(character?.name || 'Artificer').trim()}'s Homunculus`),
      currentHP: parseOptionalFiniteNumber(merged.currentHP),
      maxHPOverride: parseOptionalFiniteNumber(merged.maxHPOverride)
    };
  }
  return merged;
}

function getHomunculusServantStats(character, stateOverride = null) {
  const state = stateOverride || getHomunculusServantState(character);
  const level = Math.max(1, Number(character?.level || 1));
  const intScore = Number(character?.abilities?.INT ?? character?.abilities?.int ?? 10);
  const intMod = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
    ? window.DDRules.abilityMod(intScore)
    : Math.floor((intScore - 10) / 2);
  const pb = (window.DDRules && typeof window.DDRules.proficiencyFromLevel === 'function')
    ? window.DDRules.proficiencyFromLevel(level)
    : (2 + Math.floor((level - 1) / 4));
  const baseMaxHP = Math.max(1, 1 + level + intMod);
  const maxOverride = parseOptionalFiniteNumber(state?.maxHPOverride);
  const currOverride = parseOptionalFiniteNumber(state?.currentHP);
  const maxHP = (maxOverride != null) ? Math.max(1, maxOverride) : baseMaxHP;
  const currentHP = (currOverride != null)
    ? Math.max(0, Math.min(maxHP, currOverride))
    : maxHP;
  const ac = 13;
  const attackBonus = pb + intMod;
  const saveDC = 8 + pb + intMod;
  const dmgBonus = pb;
  const dmgBonusText = dmgBonus >= 0 ? `+${dmgBonus}` : `${dmgBonus}`;
  return {
    level,
    intMod,
    pb,
    ac,
    maxHP,
    currentHP,
    speed: '20 ft., fly 30 ft.',
    attackBonus,
    saveDC,
    forceStrike: `1d4 ${dmgBonusText}`
  };
}

function buildHomunculusCombatantData(character, options = {}) {
  const state = options?.state || getHomunculusServantState(character);
  const stats = getHomunculusServantStats(character, state);
  const name = String(options?.name || state?.name || `${String(character?.name || 'Artificer').trim()}'s Homunculus`);
  const toSigned = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);
  return {
    name,
    isPlayer: false,
    initiative: Number(options?.initiative ?? 0),
    currentHp: stats.currentHP,
    controlledBy: options?.controlledBy || null,
    summonType: 'homunculus_servant',
    meta: 'Tiny construct, neutral',
    'Armor Class': `${stats.ac} (natural armor)`,
    'Hit Points': `${stats.maxHP} (derived from artificer level and Intelligence)`,
    Speed: stats.speed,
    STR: '4', STR_mod: '(-3)',
    DEX: '15', DEX_mod: '(+2)',
    CON: '12', CON_mod: '(+1)',
    INT: '10', INT_mod: '(+0)',
    WIS: '10', WIS_mod: '(+0)',
    CHA: '7', CHA_mod: '(-2)',
    Senses: 'darkvision 60 ft., passive Perception 10',
    languages: 'understands the languages you speak',
    Challenge: '—',
    Traits: `<p><em><strong>Homunculus Servant.</strong></em> This construct acts on its own turn. It can move and use its reaction on its own, but it takes only the Dodge action unless commanded by its creator as a bonus action.</p>`,
    Actions: `<p><em><strong>Force Strike.</strong></em> <em>Ranged Weapon Attack:</em> ${toSigned(stats.attackBonus)} to hit, range 30 ft., one target. <em>Hit:</em> ${stats.forceStrike} force damage.</p>`,
    Reactions: `<p><em><strong>Channel Magic.</strong></em> The homunculus delivers a spell with a range of touch when its creator casts it, if the homunculus is within 120 feet.</p>`,
    summonedBy: String(character?.name || '')
  };
}

function queueEncounterPendingSummon(entry) {
  if (!entry || !entry.ownerName || !entry.summonType) return;
  const pending = STORAGE.get(ENCOUNTER_PENDING_SUMMONS_KEY, []) || [];
  const filtered = pending.filter(s =>
    !(String(s?.ownerName || '').toLowerCase() === String(entry.ownerName || '').toLowerCase()
      && String(s?.summonType || '').toLowerCase() === String(entry.summonType || '').toLowerCase())
  );
  filtered.push(entry);
  STORAGE.set(ENCOUNTER_PENDING_SUMMONS_KEY, filtered);
}

function consumeEncounterPendingSummonsFor(ownerName) {
  const key = String(ownerName || '').toLowerCase().trim();
  if (!key) return [];
  const pending = STORAGE.get(ENCOUNTER_PENDING_SUMMONS_KEY, []) || [];
  const mine = pending.filter(s => String(s?.ownerName || '').toLowerCase().trim() === key);
  const rest = pending.filter(s => String(s?.ownerName || '').toLowerCase().trim() !== key);
  STORAGE.set(ENCOUNTER_PENDING_SUMMONS_KEY, rest);
  return mine;
}

window.characterKnowsInfusion = window.characterKnowsInfusion || characterKnowsInfusion;
window.characterKnowsHomunculusServant = window.characterKnowsHomunculusServant || characterKnowsHomunculusServant;
window.getHomunculusServantState = window.getHomunculusServantState || getHomunculusServantState;
window.writeHomunculusServantState = window.writeHomunculusServantState || writeHomunculusServantState;
window.getHomunculusServantStats = window.getHomunculusServantStats || getHomunculusServantStats;
window.buildHomunculusCombatantData = window.buildHomunculusCombatantData || buildHomunculusCombatantData;
window.queueEncounterPendingSummon = window.queueEncounterPendingSummon || queueEncounterPendingSummon;
window.consumeEncounterPendingSummonsFor = window.consumeEncounterPendingSummonsFor || consumeEncounterPendingSummonsFor;

// --- Global Infusion State ---
const ALL_INFUSIONS_KEY = 'dd:allActiveInfusions';
function readAllActiveInfusions() {
  const raw = STORAGE.get(ALL_INFUSIONS_KEY, []);
  const list = Array.isArray(raw) ? raw : [];
  let changed = false;
  const normalized = list.map(inf => {
    if (!inf || typeof inf !== 'object') return inf;
    const next = { ...inf };
    const name = String(next.name || '').trim();
    if (!next.replicates && /^replicate magic item/i.test(name)) {
      const m = name.match(/\(([^)]+)\)/);
      if (m?.[1]) {
        next.replicates = String(m[1]).trim();
        changed = true;
      }
    }
    return next;
  });
  if (changed) STORAGE.set(ALL_INFUSIONS_KEY, normalized);
  return normalized;
}
function writeAllActiveInfusions(infusions) {
  STORAGE.set(ALL_INFUSIONS_KEY, infusions || []);
}
window.readAllActiveInfusions = window.readAllActiveInfusions || readAllActiveInfusions;
window.writeAllActiveInfusions = window.writeAllActiveInfusions || writeAllActiveInfusions;

// --- Conditions State ---
function getConditionStateKey(c) { return 'conditions:' + String(c?.name || '').toLowerCase(); }
function readConditionState(c) {
  try { return JSON.parse(localStorage.getItem(getConditionStateKey(c)) || '[]'); } catch { return []; }
}
function writeConditionState(c, state) {
  try { localStorage.setItem(getConditionStateKey(c), JSON.stringify(state || [])); } catch {}
}
window.readConditionState = window.readConditionState || readConditionState;
window.writeConditionState = window.writeConditionState || writeConditionState;
