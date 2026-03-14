#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/character_undo.js save <character-json>",
      "  node scripts/character_undo.js list <character-json>",
      "  node scripts/character_undo.js undo <character-json> [--keep]",
      "",
      "Examples:",
      "  node scripts/character_undo.js save data/rathen-l1.json",
      "  node scripts/character_undo.js undo data/rathen-l1.json",
      "  node scripts/character_undo.js list data/rathen-l1.json"
    ].join("\n")
  );
}

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) fail(`Not a file: ${filePath}`);
}

function resolveCharacterPath(inputPath) {
  const cwd = process.cwd();
  const absolute = path.resolve(cwd, inputPath);
  const relative = path.relative(cwd, absolute);
  if (relative.startsWith("..")) {
    fail(`Character file must be inside this workspace: ${absolute}`);
  }
  ensureFile(absolute);
  return { cwd, absolute, relative };
}

function snapshotDir(cwd, relativePath) {
  const safe = relativePath.replace(/[\\/]/g, "__");
  return path.join(cwd, ".undo", safe);
}

function listSnapshots(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith(".json"))
    .map(name => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      return { name, full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function saveSnapshot(charAbs, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${timestamp()}.json`;
  const out = path.join(dir, fileName);
  fs.copyFileSync(charAbs, out);
  return out;
}

function formatList(items) {
  if (!items.length) return "No snapshots found.";
  return items
    .map((s, i) => `${i + 1}. ${s.name}`)
    .join("\n");
}

function main() {
  const [, , command, characterArg, ...rest] = process.argv;
  if (!command || !characterArg) {
    usage();
    process.exit(1);
  }

  const keep = rest.includes("--keep");
  const { cwd, absolute, relative } = resolveCharacterPath(characterArg);
  const dir = snapshotDir(cwd, relative);

  if (command === "save") {
    const out = saveSnapshot(absolute, dir);
    console.log(`Saved snapshot: ${path.relative(cwd, out)}`);
    return;
  }

  if (command === "list") {
    const snapshots = listSnapshots(dir);
    console.log(formatList(snapshots));
    return;
  }

  if (command === "undo") {
    const snapshots = listSnapshots(dir);
    if (!snapshots.length) fail("No snapshots available to restore.");
    const latest = snapshots[0];
    fs.copyFileSync(latest.full, absolute);
    if (!keep) fs.unlinkSync(latest.full);
    console.log(
      `Restored ${relative} from ${path.relative(cwd, latest.full)}${keep ? "" : " (popped)"}`
    );
    return;
  }

  usage();
  process.exit(1);
}

main();
