// storage.js — shared data utilities and lightweight state


/** Public API root for SRD2014 on dnd5eapi */
const API = "https://www.dnd5eapi.co/api/2014";

/** Characters known to the toolbar; override via setCharacterList if needed */
let _CHAR_LIST = [
  "direcris.json",
  "rathen.json",
  "rabbert.json",
  "orchid.json",
  "illanis.json",
  "psalm.json",
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
async function loadCharacter(fileName, fallback = null) {
  return safeJSONMulti(candidatesFor(fileName), fallback);
}

/** Spells catalog (shared; used by spells page) */
async function loadSpells(fallback = []) {
  return safeJSONMulti(candidatesFor("spells.json"), fallback);
}

/** Generic “j(url)” helper you had */
const j = fetchJSON;

// ---------- Equipment (local-first with SRD fallback) ----------
let __EQUIP_LOCAL = null;
// bump this when editing equipment.json locally to defeat caches
const EQUIP_VERSION = (typeof window !== 'undefined'
  ? (window.__EQUIP_VERSION ||= Date.now())
  : Date.now());

async function loadEquipmentLocal(force = false) {
  if (force || !__EQUIP_LOCAL) {
    const v = EQUIP_VERSION;
    const cand = candidatesFor(`equipment.json?v=${encodeURIComponent(v)}`);
    __EQUIP_LOCAL = await readLocalJSON(cand) || [];
  }
  return __EQUIP_LOCAL;
}

function _findLocalEquip(list, key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  return (list || []).find(e =>
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
  return _findLocalEquip(local, indexOrName) || await fetchEquipmentSRD(indexOrName);
}

/** Property helper for API-shaped equipment objects */
function hasEquipProp(equip, propIndex) {
  const arr = equip?.properties || [];
  const want = String(propIndex).toLowerCase();
  return arr.some(p => String(p?.index || "").toLowerCase() === want);
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

// Normalize character.gear into [{name, qty, ref, desc}] and update character.coins
function normalizeGearList(character) {
  const coins = { pp:0, gp:0, sp:0, cp:0, ...(character?.coins || {}) };

  const raw =
    Array.isArray(character?.equipment?.gear) ? character.equipment.gear :
    Array.isArray(character?.gear)            ? character.gear :
    [];

  const items = [];
  for (const it of raw) {
    const name = String(it?.name || '').trim();
    if (!name) continue;

    // e.g. "15 gp", "1 sp", "20 PP"
    const m = name.match(/^(\d+)\s*(pp|gp|sp|cp)\b/i);
    if (m) {
      coins[m[2].toLowerCase()] += Number(m[1]) || 0;
      continue;
    }

    items.push({
      name,
      qty: Number(it?.qty ?? 1) || 1,
      ref: it?.ref ? String(it.ref).toLowerCase() : null,
      desc: typeof it?.desc === 'string' ? it.desc : null
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
            : { name: f?.name || '', desc: textOf(f?.desc) || '', source: `Class ${row.level} (Local)` });
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
        : { name: f?.name || '', desc: textOf(f?.desc) || '', source: `Class ${k} (Local)` });
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

      if (name) out.push({ name, desc, source: 'Race (Local)' });
    }
  }

  // Also include race.trait_descriptions if present
  if (Array.isArray(race.trait_descriptions)) {
    for (const t of race.trait_descriptions) {
      const name = t?.name || '';
      const desc = textOf?.(t?.desc) || '';
      if (name) out.push({ name, desc, source: 'Race (Local)' });
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
        out.push({ name: dt.name, desc: textOf?.(dt.desc), source: 'Race' });
      } catch {}
    }
  } catch {}

  if (subraceSlug) {
    try {
      const sub = await j(`${API}/subraces/${subraceSlug}`);
      for (const t of (sub?.racial_traits || [])) {
        try {
          const dt = await j(`https://www.dnd5eapi.co${t.url}`);
          out.push({ name: dt.name, desc: textOf?.(dt.desc), source: 'Subrace' });
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
  if (localRace) {
    const localTraits = mapLocalRaceTraits(localRace);
    // If we found a local race but it had no traits, it might be a stub.
    // If at least one trait has a description, we'll use the local data.
    if (localTraits.length > 0 && localTraits.some(t => t.desc)) {
      return localTraits;
    }
  }
  // No local race, or local race was a stub with no feature descriptions.
  // Fall back to the API.
  try { return await getRaceFeaturesAPI(character); }
  catch { return []; }
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

async function getFeatFeaturesLocal(/* featNames */) { return []; }
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

  const seen = new Set();
  const merged = [];
  for (const f of [...race, ...cls, ...sub, ...feats, ...bg]) {
    if (!f || !f.name) continue;
    if (isNoiseFeature(f)) continue;
    const key = `${f.source || ''}::${f.name}`.toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push({ name: f.name, desc: f.desc || '', source: f.source || '' }); }
  }
  return merged;
}

// ——— explicit globals to ensure the sheet can call these ———
window.dataRoot               = window.dataRoot               || dataRoot;
window.getCharacterList       = window.getCharacterList       || getCharacterList;
window.setCharacterList       = window.setCharacterList       || setCharacterList;

window.loadCharacter          = window.loadCharacter          || loadCharacter;
window.loadSpells             = window.loadSpells             || loadSpells;

window.getEquipmentByName     = window.getEquipmentByName     || getEquipmentByName;
window.normalizeGearList      = window.normalizeGearList      || normalizeGearList;
window.gearTooltipFor         = window.Tooltips?.gearTooltipFor || window.gearTooltipFor;

window.getArmorInfoByName     = window.getArmorInfoByName     || getArmorInfoByName;

window.getRaceFeatures        = window.getRaceFeatures        || getRaceFeatures;
window.getClassFeatures       = window.getClassFeatures       || getClassFeatures;
window.getSubclassFeatures    = window.getSubclassFeatures    || getSubclassFeatures;
window.getBackgroundFeatures  = window.getBackgroundFeatures  || getBackgroundFeatures;
window.loadAllFeatures        = window.loadAllFeatures        || loadAllFeatures;

window.coinsLine              = window.coinsLine              || coinsLine;
window.setCurrentCharacter    = window.setCurrentCharacter    || setCurrentCharacter;
window.getCurrentCharacter    = window.getCurrentCharacter    || getCurrentCharacter;
window.getCurrentCharacterFile= window.getCurrentCharacterFile|| getCurrentCharacterFile;
window.STORAGE                = window.STORAGE                || STORAGE;
