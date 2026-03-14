#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeClasses(list) {
  const out = Array.isArray(list) ? list : [];
  return Array.from(new Set(out.map(toTitleCase).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function spellKey(name) {
  return String(name || '').trim().toLowerCase();
}

function canonicalSource(raw) {
  const src = String(raw || '').trim();
  if (!src) return '';
  const map = new Map([
    ['PHB (assumed)', 'PHB'],
    ['XGE', 'XGtE'],
    ['TCE', 'TCoE']
  ]);
  return map.get(src) || src;
}

function mergeEntries(base, extra) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(extra || {})) {
    if (v === undefined) continue;
    if (k === 'name') continue;
    if (k === 'tooltipAppend') continue;
    out[k] = v;
  }
  const append = String(extra?.tooltipAppend || '').trim();
  if (append) {
    const desc = String(out.desc || '').trim();
    if (!desc) {
      out.desc = append;
    } else if (!desc.toLowerCase().includes(append.toLowerCase())) {
      out.desc = `${desc}\n\n${append}`;
    }
  }
  return out;
}

function toOverridesMap(overridesRaw) {
  if (Array.isArray(overridesRaw)) {
    const map = new Map();
    for (const entry of overridesRaw) {
      const key = spellKey(entry?.name);
      if (!key) continue;
      map.set(key, entry);
    }
    return map;
  }
  if (overridesRaw && typeof overridesRaw === 'object') {
    const map = new Map();
    for (const [k, v] of Object.entries(overridesRaw)) {
      if (String(k).startsWith('_')) continue;
      const key = spellKey(k || v?.name);
      if (!key) continue;
      map.set(key, { ...(v || {}), name: v?.name || k });
    }
    return map;
  }
  return new Map();
}

function toSourceMap(sourceRaw) {
  const map = new Map();
  let defaultSource = 'PHB';
  if (!sourceRaw || typeof sourceRaw !== 'object') {
    return { map, defaultSource };
  }
  if (typeof sourceRaw._default === 'string' && sourceRaw._default.trim()) {
    defaultSource = canonicalSource(sourceRaw._default.trim());
  }
  for (const [k, v] of Object.entries(sourceRaw)) {
    if (String(k).startsWith('_')) continue;
    const key = spellKey(k);
    const src = canonicalSource(v);
    if (!key || !src) continue;
    map.set(key, src);
  }
  return { map, defaultSource };
}

function buildSpellEntryFromSrd(srdEntry) {
  const description = Array.isArray(srdEntry?.description)
    ? srdEntry.description.join('\n\n')
    : String(srdEntry?.description || '');
  return {
    name: String(srdEntry?.name || '').trim(),
    level: Number(srdEntry?.level) || 0,
    classes: normalizeClasses(srdEntry?.classes),
    source: 'SRD 5.2',
    desc: description,
    school: srdEntry?.school,
    actionType: srdEntry?.actionType,
    concentration: srdEntry?.concentration === true,
    ritual: srdEntry?.ritual === true,
    range: srdEntry?.range,
    components: srdEntry?.components,
    duration: srdEntry?.duration,
    cantripUpgrade: srdEntry?.cantripUpgrade,
    higherLevelSlot: srdEntry?.higherLevelSlot
  };
}

function main() {
  const includeSrdUnknown = process.argv.includes('--include-srd-unknown');
  const root = process.cwd();
  const dataDir = path.join(root, 'data');
  const srdPath = path.join(dataDir, 'srd-5.2-spells.json');
  const legacyPath = path.join(dataDir, 'spells.json');
  const overridesPath = path.join(dataDir, 'spells.overrides.json');
  const sourceMapPath = path.join(dataDir, 'spell-sources.json');

  const srd = readJsonSafe(srdPath, []);
  const legacy = readJsonSafe(legacyPath, []);
  const overridesRaw = readJsonSafe(overridesPath, {});
  const overridesMap = toOverridesMap(overridesRaw);
  const sourceRaw = readJsonSafe(sourceMapPath, {});
  const { map: sourceMap, defaultSource } = toSourceMap(sourceRaw);

  const byName = new Map();

  const srdByName = new Map();
  for (const s of (Array.isArray(srd) ? srd : [])) {
    const entry = buildSpellEntryFromSrd(s);
    const key = spellKey(entry.name);
    if (!key) continue;
    srdByName.set(key, entry);
    if (includeSrdUnknown) {
      // Optional: start from full SRD catalog when expansion is requested.
      byName.set(key, entry);
    }
  }

  // Layer existing spells.json, optionally enriched by matching SRD entries.
  for (const old of (Array.isArray(legacy) ? legacy : [])) {
    const key = spellKey(old?.name);
    if (!key) continue;
    const existing = byName.get(key) || srdByName.get(key);
    const merged = mergeEntries(existing || { name: old.name }, old);
    merged.name = merged.name || old.name;
    if (Array.isArray(merged.classes)) merged.classes = normalizeClasses(merged.classes);
    byName.set(key, merged);
  }

  // Apply explicit overrides last.
  for (const [key, ov] of overridesMap.entries()) {
    const existing = byName.get(key);
    const merged = mergeEntries(existing || { name: ov?.name || key }, ov);
    merged.name = merged.name || ov?.name || key;
    if (Array.isArray(merged.classes)) merged.classes = normalizeClasses(merged.classes);
    byName.set(key, merged);
  }

  // Final cleanup/sort.
  const out = Array.from(byName.values())
    .map(s => {
      const cleaned = { ...s };
      cleaned.name = String(cleaned.name || '').trim();
      cleaned.level = Number(cleaned.level) || 0;
      const mappedSource = sourceMap.get(spellKey(cleaned.name));
      if (mappedSource) {
        cleaned.source = mappedSource;
      } else {
        const prior = canonicalSource(cleaned.source);
        cleaned.source = prior && prior !== 'SRD 5.2' ? prior : defaultSource;
      }
      if (Array.isArray(cleaned.classes)) cleaned.classes = normalizeClasses(cleaned.classes);
      if (typeof cleaned.desc !== 'string') cleaned.desc = String(cleaned.desc || '');
      return cleaned;
    })
    .filter(s => s.name)
    .sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name));

  fs.writeFileSync(legacyPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  const sourceCounts = out.reduce((acc, s) => {
    const key = String(s.source || defaultSource);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sourceSummary = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([src, n]) => `${src}: ${n}`)
    .join(', ');
  process.stdout.write(
    `Built data/spells.json from SRD + legacy + overrides.\n` +
    `Mode: ${includeSrdUnknown ? 'expanded (include SRD unknown)' : 'legacy-authoritative'}\n` +
    `SRD: ${Array.isArray(srd) ? srd.length : 0}, ` +
    `legacy: ${Array.isArray(legacy) ? legacy.length : 0}, ` +
    `overrides: ${overridesMap.size}, ` +
    `source-map: ${sourceMap.size}, ` +
    `output: ${out.length}\n` +
    `Sources: ${sourceSummary}\n`
  );
}

main();
