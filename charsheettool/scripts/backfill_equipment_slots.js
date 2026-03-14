#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILES = [
  "data/equipment.v2.json",
  "data/equipment.v1.json",
  "data/equipment.json"
];

const EQUIP_SLOTS = new Set([
  "armor",
  "shield",
  "weapon",
  "boots",
  "cloak",
  "gloves",
  "goggles",
  "headwear",
  "bracers",
  "belt",
  "amulet",
  "ring",
  "instrument",
  "container",
  "wondrous_handheld",
  "tool"
]);

const OBJECT_FORMS = new Set([
  "bag",
  "jug",
  "rope",
  "stones",
  "wand",
  "lantern",
  "shackles",
  "gem",
  "horn",
  "staff",
  "rod",
  "pipes"
]);

const REPLICATE_MAP = new Map([
  ["bag of holding", { equip_slot: "container", object_form: "bag" }],
  ["alchemy jug", { equip_slot: "wondrous_handheld", object_form: "jug" }],
  ["rope of climbing", { equip_slot: "wondrous_handheld", object_form: "rope" }],
  ["sending stones", { equip_slot: "wondrous_handheld", object_form: "stones" }],
  ["wand of magic detection", { equip_slot: "wondrous_handheld", object_form: "wand" }],
  ["wand of secrets", { equip_slot: "wondrous_handheld", object_form: "wand" }],
  ["lantern of revealing", { equip_slot: "wondrous_handheld", object_form: "lantern" }],
  ["dimensional shackles", { equip_slot: "wondrous_handheld", object_form: "shackles" }],
  ["gem of seeing", { equip_slot: "wondrous_handheld", object_form: "gem" }],
  ["horn of blasting", { equip_slot: "wondrous_handheld", object_form: "horn" }],
  ["pipes of haunting", { equip_slot: "instrument", object_form: "pipes" }],
  ["boots of elvenkind", { equip_slot: "boots" }],
  ["boots of the winterlands", { equip_slot: "boots" }],
  ["boots of striding and springing", { equip_slot: "boots" }],
  ["boots of levitation", { equip_slot: "boots" }],
  ["boots of speed", { equip_slot: "boots" }],
  ["winged boots", { equip_slot: "boots" }],
  ["cloak of elvenkind", { equip_slot: "cloak" }],
  ["cloak of the manta ray", { equip_slot: "cloak" }],
  ["cloak of protection", { equip_slot: "cloak" }],
  ["cloak of the bat", { equip_slot: "cloak" }],
  ["gloves of thievery", { equip_slot: "gloves" }],
  ["gauntlets of ogre power", { equip_slot: "gloves" }],
  ["goggles of night", { equip_slot: "goggles" }],
  ["eyes of charming", { equip_slot: "goggles" }],
  ["eyes of the eagle", { equip_slot: "goggles" }],
  ["hat of disguise", { equip_slot: "headwear" }],
  ["helm of telepathy", { equip_slot: "headwear" }],
  ["bracers of archery", { equip_slot: "bracers" }],
  ["bracers of defense", { equip_slot: "bracers" }],
  ["belt of hill giant strength", { equip_slot: "belt" }],
  ["amulet of health", { equip_slot: "amulet" }],
  ["periapt of wound closure", { equip_slot: "amulet" }],
  ["medallion of thoughts", { equip_slot: "amulet" }],
  ["ring of water walking", { equip_slot: "ring" }],
  ["ring of protection", { equip_slot: "ring" }],
  ["ring of the ram", { equip_slot: "ring" }],
  ["ring of free action", { equip_slot: "ring" }],
  ["ring of jumping", { equip_slot: "ring" }],
  ["ring of mind shielding", { equip_slot: "ring" }],
  ["ring of swimming", { equip_slot: "ring" }],
  ["spell-refueling ring", { equip_slot: "ring" }]
]);

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
}

function writeJSON(relPath, data) {
  fs.writeFileSync(path.join(ROOT, relPath), JSON.stringify(data, null, 2) + "\n");
}

function normalizeName(item) {
  return String(item?.name || item?.key || item?.index || "").trim().toLowerCase();
}

function categoryId(item) {
  return String(
    item?.category?.id ||
    item?.equipment_category?.index ||
    item?.equipment_category?.name ||
    ""
  ).toLowerCase();
}

function typeId(item) {
  return String(item?.type || "").toLowerCase();
}

function subtypeId(item) {
  return String(item?.subtype || "").toLowerCase();
}

function nameHas(item, word) {
  return normalizeName(item).includes(String(word || "").toLowerCase());
}

function isWeapon(item) {
  const cat = categoryId(item);
  const type = typeId(item);
  return type === "weapon" || !!item?.rules?.weapon || cat === "weapon";
}

function isShield(item) {
  const sub = subtypeId(item);
  if (sub === "shield") return true;
  if (String(item?.armor_category?.index || "").toLowerCase() === "shield") return true;
  return nameHas(item, "shield");
}

function isArmor(item) {
  if (isShield(item)) return false;
  const cat = categoryId(item);
  const type = typeId(item);
  return type === "armor" || !!item?.rules?.armor || cat === "armor" || cat === "armor";
}

function isTool(item) {
  const cat = categoryId(item);
  const type = typeId(item);
  return type === "tool" || cat.includes("tool");
}

function isInstrument(item) {
  const cat = categoryId(item);
  const sub = subtypeId(item);
  const low = normalizeName(item);
  if (cat.includes("musical")) return true;
  if (sub.includes("musical")) return true;
  return /\b(bagpipes|drum|dulcimer|flute|lute|lyre|horn|pan flute|shawm|viol)\b/.test(low);
}

function inferWearableSlot(item) {
  const low = normalizeName(item);
  if (/\bboot/.test(low)) return "boots";
  if (/\bcloak\b/.test(low)) return "cloak";
  if (/\bglove|\bgauntlet/.test(low)) return "gloves";
  if (/\bgoggle|\beyes of\b/.test(low)) return "goggles";
  if (/\bhat\b|\bhelm\b|\bhelmet\b|\bheadband\b/.test(low)) return "headwear";
  if (/\bbracer/.test(low)) return "bracers";
  if (/\bbelt/.test(low)) return "belt";
  if (/\bamulet\b|\bperiapt\b|\bmedallion\b|\bnecklace\b/.test(low)) return "amulet";
  if (/\bring\b/.test(low)) return "ring";
  return null;
}

function inferObjectForm(item) {
  const low = normalizeName(item);
  const sub = subtypeId(item);
  if (REPLICATE_MAP.has(low) && REPLICATE_MAP.get(low).object_form) {
    return REPLICATE_MAP.get(low).object_form;
  }
  if (low === "backpack" || /\bbag\b/.test(low)) return "bag";
  if (/\bgem\b|\bcrystal\b/.test(low)) return "gem";
  if (/\bwand\b/.test(low) || sub === "wand") return "wand";
  if (/\brod\b/.test(low) || sub === "rod") return "rod";
  if (/\bstaff\b/.test(low) || sub === "staff") return "staff";
  return null;
}

function inferEquipSlot(item) {
  const low = normalizeName(item);
  if (REPLICATE_MAP.has(low)) return REPLICATE_MAP.get(low).equip_slot;
  if (isWeapon(item)) return "weapon";
  if (isShield(item)) return "shield";
  if (isArmor(item)) return "armor";
  if (isInstrument(item)) return "instrument";
  if (isTool(item)) return "tool";

  const wearable = inferWearableSlot(item);
  if (wearable) return wearable;
  if (/\bcontainer\b|\bbag\b|\bbackpack\b|\bpack\b|\bpouch\b|\bquiver\b/.test(low)) return "container";
  return "wondrous_handheld";
}

function withBackfilledFields(item) {
  const out = { ...item };
  const low = normalizeName(item);

  out.equip_slot = inferEquipSlot(item);
  out.object_form = inferObjectForm(item);
  if (!out.object_form) out.object_form = null;

  const form = out.object_form;
  const isArcaneFocusForm = form === "wand" || form === "rod" || form === "staff";
  out.is_spellcasting_focus = !!isArcaneFocusForm;
  out.focus_kind = out.is_spellcasting_focus ? "arcane" : null;

  const robesLike = /\brobe\b|\brobes\b/.test(low);
  out.is_armor_like_garment = !!robesLike;

  return out;
}

function validateEquipmentEntries(entries, fileLabel) {
  const errors = [];
  for (const item of entries) {
    const id = item?.id || item?.key || item?.index || item?.name || "<unknown>";
    if (!EQUIP_SLOTS.has(item?.equip_slot)) {
      errors.push(`${fileLabel}:${id} invalid equip_slot=${JSON.stringify(item?.equip_slot)}`);
    }
    if (!(item?.object_form === null || OBJECT_FORMS.has(item?.object_form))) {
      errors.push(`${fileLabel}:${id} invalid object_form=${JSON.stringify(item?.object_form)}`);
    }
    if (typeof item?.is_spellcasting_focus !== "boolean") {
      errors.push(`${fileLabel}:${id} is_spellcasting_focus must be boolean`);
    }
    if (typeof item?.is_armor_like_garment !== "boolean") {
      errors.push(`${fileLabel}:${id} is_armor_like_garment must be boolean`);
    }
    if (!(item?.focus_kind === null || item?.focus_kind === "arcane")) {
      errors.push(`${fileLabel}:${id} invalid focus_kind=${JSON.stringify(item?.focus_kind)}`);
    }
    if (item?.focus_kind !== null && item?.is_spellcasting_focus !== true) {
      errors.push(`${fileLabel}:${id} focus_kind requires is_spellcasting_focus=true`);
    }
  }
  if (errors.length) {
    throw new Error(`Validation failed (${errors.length} errors):\n${errors.slice(0, 40).join("\n")}`);
  }
}

function processFile(relPath) {
  const json = readJSON(relPath);
  const isArrayRoot = Array.isArray(json);
  const entries = isArrayRoot ? json : (Array.isArray(json.equipment) ? json.equipment : []);
  const next = entries.map(withBackfilledFields);
  validateEquipmentEntries(next, relPath);
  if (isArrayRoot) {
    writeJSON(relPath, next);
  } else {
    writeJSON(relPath, { ...json, equipment: next });
  }
  return next.length;
}

function main() {
  let total = 0;
  for (const rel of FILES) {
    total += processFile(rel);
  }
  console.log(`Backfilled equipment metadata on ${total} entries across ${FILES.length} files.`);
}

main();
