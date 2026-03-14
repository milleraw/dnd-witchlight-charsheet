#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const EQUIP_FILE = path.join(DATA_DIR, "equipment.v2.json");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function isCharacterJson(obj) {
  return obj && typeof obj === "object" && typeof obj.name === "string" && obj.name.trim()
    && (obj.class || obj.level || obj.equipment || obj.armor);
}

function normalizeName(v) {
  return String(v || "").trim().toLowerCase();
}

function requiresAttunement(item) {
  return !!(
    item?.magic?.requiresAttunement ||
    item?.magic?.attunement?.required ||
    item?.attunement?.required
  );
}

function buildEquipmentIndex(list) {
  const map = new Map();
  for (const it of list) {
    const keys = [it?.id, it?.key, it?.index, it?.name].map(normalizeName).filter(Boolean);
    for (const k of keys) {
      if (!map.has(k)) map.set(k, it);
    }
  }
  return map;
}

function resolveItem(index, rawName, rawRef) {
  const ref = normalizeName(rawRef);
  const name = normalizeName(rawName);
  if (ref && index.has(ref)) return index.get(ref);
  if (name && index.has(name)) return index.get(name);
  const stripped = name.replace(/\s*[+-]\d+\s*$/i, "").trim();
  if (stripped && index.has(stripped)) return index.get(stripped);
  return null;
}

function attunedQty(it) {
  const qty = Math.max(1, Number(it?.qty || 1));
  const aq = Math.max(0, Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0)) || 0);
  return Math.min(qty, aq);
}

function run() {
  const equipJson = loadJson(EQUIP_FILE);
  const equipList = Array.isArray(equipJson?.equipment) ? equipJson.equipment : [];
  const equipIndex = buildEquipmentIndex(equipList);

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json"))
    .filter(f => !f.startsWith("equipment"))
    .filter(f => !f.startsWith("background"))
    .filter(f => !f.startsWith("spells"))
    .filter(f => !f.startsWith("races"))
    .filter(f => !f.startsWith("classes"))
    .filter(f => !f.startsWith("subclasses"))
    .filter(f => !f.startsWith("conditions"))
    .filter(f => !f.startsWith("infusions"))
    .filter(f => !f.startsWith("feats"))
    .filter(f => !f.startsWith("packs"))
    .filter(f => !f.startsWith("maneuvers"))
    .filter(f => !f.startsWith("metamagic"))
    .filter(f => !f.startsWith("eldritch_invocations"))
    .filter(f => !f.startsWith("fey_"))
    .filter(f => !f.startsWith("beasts"))
    .filter(f => !f.startsWith("level1"))
    .sort((a, b) => a.localeCompare(b));

  const lines = [];
  for (const file of files) {
    const p = path.join(DATA_DIR, file);
    let obj = null;
    try {
      obj = loadJson(p);
    } catch (_) {
      continue;
    }
    if (!isCharacterJson(obj)) continue;

    const gear = Array.isArray(obj?.equipment?.gear) ? obj.equipment.gear : [];
    const armor = (Array.isArray(obj?.armor) ? obj.armor : [obj?.armor]).filter(Boolean);
    const weapons = Array.isArray(obj?.equipment?.weapons) ? obj.equipment.weapons.filter(Boolean) : [];

    const attuneRequired = [];
    for (const g of gear) {
      const resolved = resolveItem(equipIndex, g?.name, g?.ref);
      if (resolved && requiresAttunement(resolved)) {
        attuneRequired.push({
          name: g?.name || resolved?.name,
          qty: Math.max(1, Number(g?.qty || 1)),
          attuned: attunedQty(g)
        });
      }
    }
    for (const name of armor) {
      const resolved = resolveItem(equipIndex, name, null);
      if (resolved && requiresAttunement(resolved)) {
        attuneRequired.push({ name: name, qty: 1, attuned: 0 });
      }
    }
    for (const name of weapons) {
      const resolved = resolveItem(equipIndex, name, null);
      if (resolved && requiresAttunement(resolved)) {
        attuneRequired.push({ name: name, qty: 1, attuned: 0 });
      }
    }

    if (!attuneRequired.length) continue;

    const used = attuneRequired.reduce((s, it) => s + it.attuned, 0);
    lines.push(`\n${obj.name} (${file})`);
    lines.push(`  Requires attunement: ${attuneRequired.length} item(s), currently marked attuned: ${used}`);
    for (const it of attuneRequired) {
      lines.push(`  - ${it.name} x${it.qty} (attuned ${it.attuned}/${it.qty})`);
    }
  }

  if (!lines.length) {
    console.log("No character files with carried attunement-required items were found.");
    return;
  }
  console.log(lines.join("\n"));
}

run();
