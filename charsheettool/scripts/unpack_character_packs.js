#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PACKS = JSON.parse(fs.readFileSync(path.join(ROOT, "data/packs.json"), "utf8"));
const EQUIP_V2 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/equipment.v2.json"), "utf8"));
const EQUIP_LIST = Array.isArray(EQUIP_V2?.equipment) ? EQUIP_V2.equipment : [];

function normalizeKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const packByKey = new Map();
for (const p of (Array.isArray(PACKS) ? PACKS : [])) {
  const keys = [p?.index, p?.name].map(normalizeKey).filter(Boolean);
  for (const k of keys) packByKey.set(k, p);
}

const equipByKey = new Map();
for (const e of EQUIP_LIST) {
  const keys = [e?.id, e?.key, e?.index, e?.name].map(normalizeKey).filter(Boolean);
  for (const k of keys) {
    if (!equipByKey.has(k)) equipByKey.set(k, e);
  }
}

function isCharacter(obj) {
  return obj && typeof obj === "object" && typeof obj.name === "string" && (obj.equipment || obj.class || obj.level);
}

function expandPackEntry(entry) {
  const keys = [entry?.ref, entry?.name].map(normalizeKey).filter(Boolean);
  let pack = null;
  for (const k of keys) {
    if (packByKey.has(k)) {
      pack = packByKey.get(k);
      break;
    }
  }
  if (!pack || !Array.isArray(pack.items) || !pack.items.length) return null;

  const packQty = Math.max(1, Number(entry?.qty ?? 1) || 1);
  const out = [];
  for (const item of pack.items) {
    const baseName = String(item?.name || "").trim();
    if (!baseName) continue;
    const qty = Math.max(1, Number(item?.qty || 1) || 1) * packQty;
    const lookup = equipByKey.get(normalizeKey(baseName)) || null;
    out.push({
      name: lookup?.name || baseName,
      qty,
      ref: lookup?.id || lookup?.key || lookup?.index || undefined,
      equip_slot: lookup?.equip_slot || undefined,
      object_form: lookup?.object_form || undefined,
      is_spellcasting_focus: !!lookup?.is_spellcasting_focus || undefined,
      focus_kind: lookup?.focus_kind || undefined,
      is_armor_like_garment: !!lookup?.is_armor_like_garment || undefined
    });
  }
  return out;
}

function mergeItems(items) {
  const acc = new Map();
  for (const it of items) {
    const key = [
      String(it?.name || "").trim().toLowerCase(),
      String(it?.ref || "").trim().toLowerCase(),
      String(it?.desc || "").trim(),
      String(it?.equip_slot || "").trim().toLowerCase(),
      String(it?.object_form || "").trim().toLowerCase()
    ].join("|");
    if (!key.replace(/\|/g, "")) continue;
    if (!acc.has(key)) {
      acc.set(key, { ...it, qty: Math.max(1, Number(it?.qty || 1) || 1) });
    } else {
      const prev = acc.get(key);
      prev.qty += Math.max(1, Number(it?.qty || 1) || 1);
    }
  }
  return Array.from(acc.values());
}

function processCharacterFile(absPath) {
  const raw = fs.readFileSync(absPath, "utf8");
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!isCharacter(obj)) return false;

  const gear = Array.isArray(obj?.equipment?.gear) ? obj.equipment.gear : [];
  if (!gear.length) return false;

  let changed = false;
  const next = [];
  for (const g of gear) {
    const expanded = expandPackEntry(g);
    if (expanded) {
      changed = true;
      next.push(...expanded);
    } else {
      next.push(g);
    }
  }
  if (!changed) return false;
  obj.equipment = obj.equipment || {};
  obj.equipment.gear = mergeItems(next);
  fs.writeFileSync(absPath, JSON.stringify(obj, null, 2) + "\n");
  return true;
}

function listTargets() {
  const targets = [];
  const roots = [
    path.join(ROOT, "data"),
    path.join(ROOT, "data", "level1"),
    path.join(ROOT, "encounter_tracker", "players")
  ];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      targets.push(path.join(dir, file));
    }
  }
  return targets;
}

function main() {
  const files = listTargets();
  let changed = 0;
  for (const f of files) {
    if (processCharacterFile(f)) changed++;
  }
  console.log(`Unpacked pack entries in ${changed} character file(s).`);
}

main();
