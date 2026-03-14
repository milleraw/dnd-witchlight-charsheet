#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const EQUIP_PATH = path.join(ROOT, "data/equipment.v2.json");
const INFUSION_PATH = path.join(ROOT, "data/infusions.json");

const EQUIP_SLOT_ENUM = new Set([
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

const OBJECT_FORM_ENUM = new Set([
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

const REPLICATE_TARGET_SPEC = {
  "bag of holding": { equipSlot: "container", objectForm: "bag" },
  "alchemy jug": { equipSlot: "wondrous_handheld", objectForm: "jug" },
  "rope of climbing": { equipSlot: "wondrous_handheld", objectForm: "rope" },
  "sending stones": { equipSlot: "wondrous_handheld", objectForm: "stones" },
  "wand of magic detection": { equipSlot: "wondrous_handheld", objectForm: "wand" },
  "wand of secrets": { equipSlot: "wondrous_handheld", objectForm: "wand" },
  "lantern of revealing": { equipSlot: "wondrous_handheld", objectForm: "lantern" },
  "dimensional shackles": { equipSlot: "wondrous_handheld", objectForm: "shackles" },
  "gem of seeing": { equipSlot: "wondrous_handheld", objectForm: "gem" },
  "horn of blasting": { equipSlot: "wondrous_handheld", objectForm: "horn" },
  "pipes of haunting": { equipSlot: "instrument", objectForm: "pipes" },
  "boots of elvenkind": { equipSlot: "boots" },
  "boots of the winterlands": { equipSlot: "boots" },
  "boots of striding and springing": { equipSlot: "boots" },
  "boots of levitation": { equipSlot: "boots" },
  "boots of speed": { equipSlot: "boots" },
  "winged boots": { equipSlot: "boots" },
  "cloak of elvenkind": { equipSlot: "cloak" },
  "cloak of the manta ray": { equipSlot: "cloak" },
  "cloak of protection": { equipSlot: "cloak" },
  "cloak of the bat": { equipSlot: "cloak" },
  "gloves of thievery": { equipSlot: "gloves" },
  "gauntlets of ogre power": { equipSlot: "gloves" },
  "goggles of night": { equipSlot: "goggles" },
  "eyes of charming": { equipSlot: "goggles" },
  "eyes of the eagle": { equipSlot: "goggles" },
  "hat of disguise": { equipSlot: "headwear" },
  "helm of telepathy": { equipSlot: "headwear" },
  "bracers of archery": { equipSlot: "bracers" },
  "bracers of defense": { equipSlot: "bracers" },
  "belt of hill giant strength": { equipSlot: "belt" },
  "amulet of health": { equipSlot: "amulet" },
  "periapt of wound closure": { equipSlot: "amulet" },
  "medallion of thoughts": { equipSlot: "amulet" },
  "ring of water walking": { equipSlot: "ring" },
  "ring of protection": { equipSlot: "ring" },
  "ring of the ram": { equipSlot: "ring" },
  "ring of free action": { equipSlot: "ring" },
  "ring of jumping": { equipSlot: "ring" },
  "ring of mind shielding": { equipSlot: "ring" },
  "ring of swimming": { equipSlot: "ring" },
  "spell-refueling ring": { equipSlot: "ring" }
};

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function normalizeReplicateName(infusionName) {
  const m = String(infusionName || "").match(/^replicate magic item \((.+)\)$/i);
  return m ? m[1].trim().toLowerCase() : "";
}

function itemGoldValue(item) {
  const explicit = Math.max(0, Number(item?.value_gp || 0) || 0);
  if (explicit > 0) return explicit;
  const cp = Number(item?.cost?.cp);
  if (Number.isFinite(cp) && cp > 0) return cp / 100;
  const gp = Number(item?.cost?.gp);
  if (Number.isFinite(gp) && gp > 0) return gp;
  return 0;
}

function validateEquipmentSchema(items) {
  items.forEach((item) => {
    const id = item.id || item.key || item.name;
    assert(EQUIP_SLOT_ENUM.has(item.equip_slot), `${id}: invalid equip_slot ${item.equip_slot}`);
    assert(item.object_form === null || OBJECT_FORM_ENUM.has(item.object_form), `${id}: invalid object_form ${item.object_form}`);
    assert(typeof item.is_spellcasting_focus === "boolean", `${id}: is_spellcasting_focus must be boolean`);
    assert(item.focus_kind === null || item.focus_kind === "arcane", `${id}: invalid focus_kind ${item.focus_kind}`);
    assert(item.focus_kind === null || item.is_spellcasting_focus === true, `${id}: focus_kind requires is_spellcasting_focus=true`);
    assert(typeof item.is_armor_like_garment === "boolean", `${id}: is_armor_like_garment must be boolean`);
  });
}

function run() {
  const equip = loadJson(EQUIP_PATH);
  const infusions = loadJson(INFUSION_PATH);
  const items = Array.isArray(equip?.equipment) ? equip.equipment : [];

  validateEquipmentSchema(items);

  // Hard rule checks from current requirements.
  const backpack = items.find(i => String(i.name).toLowerCase() === "backpack");
  const bagpipes = items.find(i => String(i.name).toLowerCase() === "bagpipes");
  const pipes = items.find(i => String(i.name).toLowerCase() === "pipes of haunting");
  assert(backpack && backpack.object_form === "bag", "Backpack must have object_form='bag'");
  assert(bagpipes && bagpipes.object_form !== "bag", "Bagpipes must not be bag-like for replication");
  assert(pipes && pipes.object_form === "pipes" && pipes.equip_slot === "instrument", "Pipes of Haunting must be instrument+pipes");

  // Replicate specs in infusions should have matching targetable items by metadata.
  infusions
    .filter(inf => /^Replicate Magic Item \(/i.test(String(inf.name || "")))
    .forEach((inf) => {
      const key = normalizeReplicateName(inf.name);
      const spec = REPLICATE_TARGET_SPEC[key];
      if (!spec) return;
      const existsInCatalog = items.some(i => String(i.name || '').trim().toLowerCase() === key);
      if (!existsInCatalog) return;
      const candidates = items.filter(i =>
        i.equip_slot === spec.equipSlot
        && (!spec.objectForm || i.object_form === spec.objectForm)
      );
      assert(candidates.length > 0, `No targetable items for ${inf.name} using metadata spec`);
    });

  // Arcane focus forms.
  const arcaneForms = items.filter(i => i.is_spellcasting_focus && i.focus_kind === "arcane");
  assert(arcaneForms.every(i => ["wand", "rod", "staff"].includes(i.object_form)), "Arcane focus items must be wand/rod/staff forms");

  // Homunculus: at least one gem with >=100 gp and no bagpipes false-positive.
  const homunculusTargets = items.filter(i => i.object_form === "gem" && itemGoldValue(i) >= 100);
  if (!homunculusTargets.length) {
    console.warn("WARN: no gem targets >=100 gp in equipment.v2 catalog; Homunculus infusion target list may be empty until such items are added.");
  }

  console.log(`OK: validated ${items.length} equipment entries and infusion metadata targeting rules.`);
}

run();
