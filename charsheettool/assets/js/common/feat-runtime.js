(function (global) {
  'use strict';

  const toLower = (v) => String(v || '').trim().toLowerCase();
  const normalizeKey = (v) => toLower(v).replace(/\s+/g, ' ');

  function listResources(character) {
    return Array.isArray(character?.resources) ? character.resources : [];
  }

  function resourceKey(resource) {
    return `featRes:${toLower(resource?.id || resource?.name || '')}`;
  }

  function readResourceUsed(character, resource) {
    const st = global.readActionState ? (global.readActionState(character) || {}) : {};
    return Math.max(0, Number(st[resourceKey(resource)] || 0));
  }

  function writeResourceUsed(character, resource, used) {
    if (!global.readActionState || !global.writeActionState) return;
    const st = global.readActionState(character) || {};
    st[resourceKey(resource)] = Math.max(0, Number(used || 0));
    global.writeActionState(character, st);
  }

  function getResourceById(character, idOrName) {
    const needle = normalizeKey(idOrName);
    if (!needle) return null;
    for (const res of listResources(character)) {
      const id = normalizeKey(res?.id);
      const name = normalizeKey(res?.name);
      if (id === needle || name === needle) return res;
    }
    return null;
  }

  function getResourceUsage(character, idOrName) {
    const res = getResourceById(character, idOrName);
    if (!res) return null;
    const max = Math.max(0, Number(res.uses || 0));
    const used = Math.min(max, readResourceUsed(character, res));
    const remaining = Math.max(0, max - used);
    return { resource: res, max, used, remaining, key: resourceKey(res) };
  }

  function spendResource(character, idOrName, amount = 1, refund = false) {
    const usage = getResourceUsage(character, idOrName);
    if (!usage) return { ok: false, reason: 'missing_resource' };
    const delta = Math.max(1, Number(amount || 1));
    const next = refund
      ? Math.max(0, usage.used - delta)
      : Math.min(usage.max, usage.used + delta);
    if (!refund && usage.remaining < delta) {
      return { ok: false, reason: 'insufficient_resource', usage };
    }
    writeResourceUsed(character, usage.resource, next);
    return { ok: true, usage: { ...usage, used: next, remaining: Math.max(0, usage.max - next) } };
  }

  function resetResourcesByRecharge(character, rechargeSet) {
    if (!global.readActionState || !global.writeActionState) return;
    const wanted = new Set((Array.isArray(rechargeSet) ? rechargeSet : [rechargeSet]).map(toLower));
    const st = global.readActionState(character) || {};
    for (const res of listResources(character)) {
      const recharge = toLower(res?.recharge);
      const isShortLong = recharge === 'short_or_long_rest';
      const shouldReset = wanted.has(recharge) || (isShortLong && (wanted.has('short_rest') || wanted.has('long_rest')));
      if (!shouldReset) continue;
      st[resourceKey(res)] = 0;
    }
    global.writeActionState(character, st);
  }

  function hasFeat(character, featNameOrId) {
    const needle = normalizeKey(featNameOrId);
    if (!needle) return false;
    const feats = Array.isArray(character?.feats) ? character.feats : [];
    return feats.some((f) => {
      const id = normalizeKey(f?.id || '');
      const name = normalizeKey(f?.name || f);
      return id === needle || name === needle;
    });
  }

  function runtimeRules(character) {
    return {
      passiveRules: Array.isArray(character?.passiveRules) ? character.passiveRules : [],
      damageRules: Array.isArray(character?.damageRules) ? character.damageRules : [],
      saveDcRules: Array.isArray(character?.saveDcRules) ? character.saveDcRules : [],
      replacementRules: Array.isArray(character?.replacementRules) ? character.replacementRules : []
    };
  }

  function normalizeDamageType(v) {
    return toLower(v).replace(/[^a-z]/g, '');
  }

  function extractDamageTypesFromText(text) {
    const src = String(text || '').toLowerCase();
    if (!src) return [];
    const all = ['acid', 'cold', 'fire', 'lightning', 'thunder', 'necrotic', 'radiant', 'poison', 'psychic', 'force', 'bludgeoning', 'piercing', 'slashing'];
    const found = [];
    for (const t of all) {
      const re = new RegExp(`\\b${t}\\b`, 'i');
      if (re.test(src)) found.push(t);
    }
    return found;
  }

  function getSpellDamageRuleEffects(character, damageType) {
    const rules = Array.isArray(character?.damageRules) ? character.damageRules : [];
    const type = normalizeDamageType(damageType);
    const out = { ignoreResistance: false, minDieResult: null };
    for (const r of rules) {
      if (toLower(r?.scope) !== 'spell_damage') continue;
      const rType = normalizeDamageType(r?.damage_type || r?.damageType);
      if (!rType || !type || rType !== type) continue;
      const kind = toLower(r?.type);
      if (kind === 'damage_resistance_ignore') {
        const ignores = Array.isArray(r?.ignore) ? r.ignore.map(toLower) : [];
        if (ignores.includes('resistance')) out.ignoreResistance = true;
      }
      if (kind === 'damage_die_floor') {
        const floor = Number(r?.die_result_min || 0);
        if (Number.isFinite(floor) && floor > 0) {
          out.minDieResult = out.minDieResult == null ? floor : Math.max(out.minDieResult, floor);
        }
      }
    }
    return out;
  }

  function describeSpellDamageRules(character, damageTypes) {
    const list = Array.isArray(damageTypes) ? damageTypes : [];
    if (!list.length) return '';
    const lines = [];
    for (const dt of list) {
      const eff = getSpellDamageRuleEffects(character, dt);
      if (!eff.ignoreResistance && eff.minDieResult == null) continue;
      const parts = [];
      if (eff.ignoreResistance) parts.push('ignores resistance');
      if (eff.minDieResult != null) parts.push(`damage dice results below ${eff.minDieResult} become ${eff.minDieResult}`);
      lines.push(`Elemental Adept (${dt}): ${parts.join('; ')}`);
    }
    return lines.join('\n');
  }

  function getLuckyResource(character) {
    for (const res of listResources(character)) {
      const id = toLower(res?.id);
      const name = toLower(res?.name);
      if (id.includes('res:feat:lucky:points') || name.includes('lucky points')) return res;
    }
    return null;
  }

  function getLuckyUsage(character) {
    const res = getLuckyResource(character);
    if (!res) return null;
    return getResourceUsage(character, res.id || res.name);
  }

  function spendLucky(character, refund = false) {
    const res = getLuckyResource(character);
    if (!res) return { ok: false, reason: 'missing_resource' };
    return spendResource(character, res.id || res.name, 1, refund);
  }

  global.FeatRuntime = global.FeatRuntime || {
    listResources,
    resourceKey,
    getResourceById,
    getResourceUsage,
    spendResource,
    resetResourcesByRecharge,
    hasFeat,
    runtimeRules,
    normalizeDamageType,
    extractDamageTypesFromText,
    getSpellDamageRuleEffects,
    describeSpellDamageRules,
    getLuckyResource,
    getLuckyUsage,
    spendLucky
  };
})(window);
