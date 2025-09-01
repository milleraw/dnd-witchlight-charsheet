// assets/js/spells-page.js
// Page-specific logic for the spells sheet.

(function (global) {
  // --- DOM Refs ---
  const $ = global.$ || ((sel, root = document) => (root || document).querySelector(sel));
  const F = {
    status:      () => $("#status"),
    klass:       () => $("#field-class"),
    level:       () => $("#field-level"),
    nameBox:     () => $("#field-name"),
    abilityTP:   () => $("#ability-tp"),
    scPrepBox:   ()=> $("#sc-prep"),
    scPrepCount: ()=> $("#prep-count"),
    scPrepLimit: ()=> $("#prep-limit"),
    short:       () => $("#short-rest"),
    long:        () => $("#long-rest"),
    reprep:      () => $("#reprepare"),
    lvlBox:      (n) => n===0 ? $("#lvl-cantrips") : $(`#lvl-${n}`),
    resKi:       () => $("#res-ki"),
    resCD:       () => $("#res-cd"),
    resCDP:      () => $("#cd-dots"),
    resKiP:      () => $("#ki-pips"),
    resWS:       () => $("#res-ws"),
    resWSP:      () => $("#ws-pips"),
    resSE:       () => $("#res-se"),
    seToggle:    () => $("#se-toggle"),
  };

  // --- State Management ---
  const ST = {
    getPrepared: s => s.preparedByLevel || {},
    setPrepared: (s,v)=>{ s.preparedByLevel=v; },
    getSlotsSpent: s=> s.slotsSpent || {},
    setSlotsSpent: (s,v)=>{ s.slotsSpent=v; },
    getKi: s => Number(s.kiSpent||0),
    setKi: (s,v)=>{ s.kiSpent = Math.max(0, Number(v)||0); },
    getCD: s => Number(s.channelDivinityUsed||0),
    setCD: (s,v)=>{ s.channelDivinityUsed = Math.max(0, Number(v)||0); },
    getWS: s => Number(s.wildShapeUsed||0),
    setWS: (s,v)=>{ s.wildShapeUsed = Math.max(0, Number(v)||0); },
    getSE: s => !!s.symbioticActive,
    setSE: (s,v)=>{ s.symbioticActive = !!v; },
    getKnownInfusions: s => s.knownInfusions,
    setKnownInfusions: (s,v) => { s.knownInfusions = v; },
  };

  function rangerSpellsKnown(level) {
    const L = Number(level) || 1;
    const knownMap = {
        1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
        11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11
    };
    return knownMap[L] || 0;
  };

  // --- Racial/Subclass Spell Hooks ---
  function racialSpells(character){
    const out = { cantrips:[], leveled:[] };
    const race = String(character?.race||'').toLowerCase();
    if (race.includes('tiefling')) {
      const hasDevilsTongue = (character.traits || []).some(trait =>
        String(trait.name || trait).toLowerCase().includes("devil's tongue")
      );

      if (hasDevilsTongue) {
        out.cantrips.push({ name: 'Vicious Mockery', level: 0, badge: 'Racial', locked: true, desc: "You know the Vicious Mockery cantrip.\n(Spellcasting ability: Charisma)" });
        if ((character.level || 1) >= 3) out.leveled.push({ name: 'Charm Person', level: 1, badge: 'Racial', locked: true, desc: "You can cast Charm Person as a 2nd-level spell once per long rest.\n(Spellcasting ability: Charisma)" });
        if ((character.level || 1) >= 5) out.leveled.push({ name: 'Enthrall', level: 2, badge: 'Racial', locked: true, desc: "You can cast Enthrall once per long rest.\n(Spellcasting ability: Charisma)" });
      } else { // Default: Infernal Legacy
        out.cantrips.push({ name: 'Thaumaturgy', level: 0, badge: 'Racial', locked: true, desc: "You know the Thaumaturgy cantrip.\n(Spellcasting ability: Charisma)" });
        if ((character.level || 1) >= 3) out.leveled.push({ name: 'Hellish Rebuke', level: 1, badge: 'Racial', locked: true, desc: "You can cast Hellish Rebuke as a 2nd-level spell once per long rest.\n(Spellcasting ability: Charisma)" });
        if ((character.level || 1) >= 5) out.leveled.push({ name: 'Darkness', level: 2, badge: 'Racial', locked: true, desc: "You can cast Darkness once per long rest.\n(Spellcasting ability: Charisma)" });
      }
    }
    return out;
  }
  async function subclassAlwaysPrepared(character, masterIndex){ // Added masterIndex
    const out = [];
    const level = Number(character.level) || 1;
    const className = String(character.class || '').toLowerCase();
    const subclassName = String(character.build || '').toLowerCase();

    if (!subclassName) return [];

    const allSubclasses = await window.loadSubclassesLocal();
    const subclassData = allSubclasses.find(s => 
        String(s.name || '').toLowerCase() === subclassName &&
        String(s.class || '').toLowerCase() === className
    );

    if (subclassData && subclassData.alwaysPreparedSpells) {
        const badge = subclassData.name.split(' ').pop();
        for (const levelKey in subclassData.alwaysPreparedSpells) {
            if (level >= Number(levelKey)) {
                for (const spellName of subclassData.alwaysPreparedSpells[levelKey]) {
                    const spellData = masterIndex ? masterIndex.get(String(spellName).toLowerCase()) : null;
                    const spellLevel = spellData ? (Number(spellData.level) || 0) : 0;
                    out.push({ name: spellName, level: spellLevel, badge: badge, locked: true });
                }
            }
        }
    }
    return out;
  }

  function slotsFor(cls, level) {
    const C = String(cls || '').toLowerCase();
    const L = Number(level) || 1;

    const FULL_CASTER = {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 }, 5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 }, 8: { 1: 4, 2: 3, 3: 3, 4: 2 },
      9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
    };
    const HALF_CASTER = {
      1: {}, 2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
      6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 }, 9: { 1: 4, 2: 3, 3: 2 },
      10: { 1: 4, 2: 3, 3: 2 }, 11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
      13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
    };
    if (['cleric', 'druid', 'wizard', 'bard', 'sorcerer'].includes(C)) return FULL_CASTER[L] || {};
    if (['ranger', 'paladin', 'artificer'].includes(C)) return HALF_CASTER[L] || {};
    return {};
  }

  // --- Class-specific Abilities (data-driven) ---
  async function classAbilities(character) {
    const out = [];
    const level = Number(character.level) || 1;
    const className = String(character.class || '').toLowerCase();
    const subclassName = String(character.build || '').toLowerCase();

    if (!className) return [];

    const [allClasses, allSubclasses] = await Promise.all([
      window.loadClassesLocal(),
      window.loadSubclassesLocal()
    ]);

    const classData = allClasses.find(c => String(c.name || '').toLowerCase() === className);
    const subclassData = allSubclasses.find(s => 
        String(s.name || '').toLowerCase() === subclassName &&
        String(s.class || '').toLowerCase() === className
    );

    const sources = [classData, subclassData];
    for (const source of sources) {
      if (!source) continue;

      if (source.bonusCantrips) {
        for (const levelKey in source.bonusCantrips) {
          if (level >= Number(levelKey)) {
            for (const cantripName of source.bonusCantrips[levelKey]) {
              out.push({ name: cantripName, level: 0, badge: 'Cantrip', locked: true });
            }
          }
        }
      }

      if (Array.isArray(source.actions)) {
        for (const action of source.actions) {
          if (action.badge && action.level && level >= action.level) {
            out.push({ name: action.name, level: 0, badge: action.badge, locked: true, desc: action.desc });
          }
        }
      }
    }
    return out;
  }

  // --- Build Model ---
  async function buildModel(character){
    // --- FIX: Ensure DDData has the infusion loader from storage.js ---
    if (window.DDData && typeof window.DDData.loadInfusions !== 'function' && typeof window.loadInfusions === 'function') {
      window.DDData.loadInfusions = window.loadInfusions;
    }

    const [allSpellsList, allInfusionsList] = await Promise.all([
      DDData.loadAllSpells(),
      typeof DDData.loadInfusions === 'function' ? DDData.loadInfusions() : Promise.resolve([])
    ]);

    const masterIndex = new Map();
    for (const s of (Array.isArray(allSpellsList) ? allSpellsList : Object.values(allSpellsList))) {
      if (s && s.name) masterIndex.set(String(s.name).toLowerCase(), s);
    }
    // Also index infusions by name for easy lookup
    for (const i of (Array.isArray(allInfusionsList) ? allInfusionsList : Object.values(allInfusionsList))) {
      if (i && i.name) masterIndex.set(String(i.name).toLowerCase(), i);
    }

    const allInfusions = (allInfusionsList || []).map(inf => masterIndex.get(String(inf.name).toLowerCase())).filter(Boolean);
    const cls = String(character.class||'');
    const level = Number(character.level)||1;
    const stats = window.DDRules.computeSpellStats(character) || { ab:null, dc:'—', atk:'—' };
    const baseKnown = Array.isArray(character.spells) ? character.spells.slice() : [];
    const racial = racialSpells(character, masterIndex);
    const always = await subclassAlwaysPrepared(character, masterIndex);
    const classAbils = await classAbilities(character);
    const allEntries = [];
    for (const n of baseKnown) {
      const idx = masterIndex.get(String(n).toLowerCase());
      const lvl = (idx && typeof idx==='object' && Number.isInteger(idx.level)) ? idx.level : 1;
      allEntries.push({ name:n, level:lvl, badge:null, locked:false });
    }
    allEntries.push(...racial.cantrips, ...racial.leveled, ...always, ...classAbils);

    // For prepared/known casters, fetch their entire class list for preparation/selection.
    const preparedCasters = ['cleric', 'druid', 'paladin', 'wizard', 'artificer'];
    const knownCastersWithChoice = ['ranger', 'bard', 'sorcerer'];
    const lowerCls = cls.toLowerCase();
    let dynamic = [];

    if (preparedCasters.includes(lowerCls) || knownCastersWithChoice.includes(lowerCls)) {
      const upTo = Math.min(9, window.DDRules.getMaxSpellLevelFor(character));
      // Artificer and Ranger have specific local lists we want to prioritize
      if (lowerCls === 'artificer' || lowerCls === 'ranger') {
        const classSpells = await DDData.getSpellsForClassLevel(cls, 0, upTo, { character });
        dynamic = classSpells.map(s => ({ name: s.name, level: Number(s.level) || 0, badge: 'Class', locked: false }));
      } else {
        // Other casters can fall back to the API
        const viaAPI = await DDData.getClassSpellList(cls).catch(() => []); // Gracefully handle API failure
        dynamic = viaAPI.filter(s => s.level <= upTo).map(s => ({ name: s.name, level: s.level, badge:'Class', locked:false }));
      }
    }
    allEntries.push(...dynamic);
    const map = new Map();
    for (const s of allEntries){
      const k = `${s.level}|${s.name.toLowerCase()}`;
      if (!map.has(k)) map.set(k, s);
      else { const prev = map.get(k); map.set(k, { ...prev, locked:(prev.locked||s.locked), badge: prev.badge||s.badge }); }
    }
    const byLevel = Array.from({length:10},()=>[]);
    for (const s of map.values()) if (s.level>=0 && s.level<=9) byLevel[s.level].push(s);    const slots = slotsFor(cls, level);
    const caster = String(cls).toLowerCase();
    let prepLimit = 0;
    let knownLimit = 0;

    if (caster==='cleric' || caster==='druid' || caster==='wizard') {
        prepLimit = Math.max(1, stats.mod + level);
    } else if (caster==='artificer') {
        prepLimit = Math.max(1, stats.mod + Math.floor(level/2));
    } else if (caster==='ranger') {
        knownLimit = rangerSpellsKnown(level);
    }
    const hasKi = (caster==='monk');
    const kiMax = hasKi ? level : 0;
    const hasWildShape = (caster==='druid');
    const wildMax = hasWildShape ? (level >= 2 ? 2 : 0) : 0;
    const hasChannelDivinity = (caster==='cleric' || caster==='paladin');
    let cdMax = 0;
    if (hasChannelDivinity && level >= 2) { cdMax = (level >= 18) ? 3 : (level >= 6 ? 2 : 1); }
    return { character, cls, level, abilKey: stats.ab, dc: stats.dc, atk: stats.atk, masterIndex, allInfusions, byLevel, slots, prepLimit, knownLimit, hasKi, kiMax, hasWildShape, wildMax, hasChannelDivinity, cdMax };
  }
  
  // --- Renderers ---
  async function renderSpellcastingNumbers(character){
   const atkEl = F.scAtk ? F.scAtk() : document.querySelector('#field-spell-attack');
    const dcEl  = document.querySelector('#field-spell-dc');
    if (!atkEl || !dcEl) return;
    const stats = window.DDRules.computeSpellStats(character);
    if (!stats){ atkEl.textContent = '—'; dcEl.textContent = '—'; return; }
    const sign = n => (n>=0?`+${n}`:`${n}`);
    atkEl.textContent = sign(stats.atk);
    dcEl.textContent  = String(stats.dc);
    atkEl.setAttribute('data-tooltip', `Spell Attack = PB ${sign(stats.pb)} + ${stats.ab} mod ${sign(stats.mod)}`);
    dcEl.setAttribute('data-tooltip',  `Spell Save DC = 8 + PB ${sign(stats.pb)} + ${stats.ab} mod ${sign(stats.mod)}`);
  }
  function paintHeader(model){
    window.autoFit(F.klass(), model.cls);
    window.autoFit(F.level(), String(model.level));
    if (window.NameCurves?.renderTwoArcName) {
      const F_name = {
        nameBox:        F.nameBox,
        nameTop:        () => document.getElementById('name-top'),
        nameBot:        () => document.getElementById('name-bottom'),
        nameTopTP:      () => document.getElementById('name-top-tp'),
        nameBotTP:      () => document.getElementById('name-bottom-tp'),
        nameTopPath:    () => document.getElementById('name-curve-top'),
        nameBottomPath: () => document.getElementById('name-curve-bottom'),
      };
      window.NameCurves.renderTwoArcName(F_name, model.character.name || '');
    }
    const abilWord = window.DDRules.abilityFullName(model.abilKey);
    F.abilityTP().textContent = abilWord || '';
    if (model.prepLimit > 0 || model.knownLimit > 0){
      F.scPrepBox().classList.remove('hidden');
      const state = window.readSpellState(model.character);
      const prepared = ST.getPrepared(state);
      const totalPrepared = Object.values(prepared).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      
      const limit = model.prepLimit > 0 ? model.prepLimit : model.knownLimit;
      const label = model.prepLimit > 0 ? 'Prepared' : 'Known';
      F.scPrepBox().title = `Daily ${label} spells (excludes always-prepared)`;
      F.scPrepBox().innerHTML = `⭐ <span id="prep-count">${totalPrepared}</span>/<span id="prep-limit">${limit}</span> ${label}`;

      // Infusion titles (Artificer specific)
      const infusionLimit = model.character?.infusions?.known_limit || 0;
      const activeLimit = model.character?.infusions?.active_limit || 0;
      const lvl6Title = F.lvlBox(6)?.querySelector('.title');
      const lvl7Title = F.lvlBox(7)?.querySelector('.title');
      if (lvl6Title) {
              lvl6Title.classList.add('infusion-header');
        lvl6Title.textContent = `Known Infusions (${infusionLimit})`;
        lvl6Title.innerHTML = `Known Infusions (${infusionLimit}) <button id="manage-infusions-btn" title="Manage Known Infusions">⚙️</button>`;
        const btn = lvl6Title.querySelector('#manage-infusions-btn');
        if (btn) {
          btn.onclick = () => showInfusionManager(model);
        }
      }
      if (lvl7Title) {
        lvl7Title.classList.add('infusion-header');
        lvl7Title.textContent = `Active Infusions (${activeLimit})`;
      }
    
    } else {
      F.scPrepBox().classList.add('hidden');
    }
  }
  function clearLists(){
    for(let L=0; L<=9; L++){
      const box = F.lvlBox(L);
      if (!box) continue;
      const list = box.querySelector('.list');
      if (list) list.innerHTML = '';
      const p = box.querySelector('.slot-dots');
      if (p) p.innerHTML = '';
    }
  }
  function paintLevels(model){
    console.log('DEBUG: model object passed to paintLevels:', model);
    const state = window.readSpellState(model.character);
    const prepared = ST.getPrepared(state);
    const activeInfusions = window.readAllActiveInfusions();
    const infusionLimits = model.character?.infusions || { active_limit: 0 };
    const spent = ST.getSlotsSpent(state);
    if (model.prepLimit>0){
      const totalPrepared = Object.values(prepared).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      F.scPrepCount().textContent = String(totalPrepared);
    }
    for(let L=0; L<=9; L++){
      const box = F.lvlBox(L);
      if (!box) continue;
      const list = box.querySelector('.list');
      if (!list) continue;

      // --- Artificer Infusions Logic ---
      if (model.cls.toLowerCase() === 'artificer' && L >= 6) {
        box.style.display = ''; // Make sure it's visible
        const slotsEl = box.querySelector('.slots');
        if (slotsEl) slotsEl.style.display = 'none'; // Hide spell slots UI

        if (L === 6) { // Use Level 6 box for "Known Infusions"
          const knownFromState = ST.getKnownInfusions(state);
          const known = Array.isArray(knownFromState) ? knownFromState : (model.character?.infusions?.known || []);
          

          list.innerHTML = ''; // Clear before appending
          known.sort().forEach(name => {
            const infusion = model.masterIndex.get(name.toLowerCase());
            const desc = infusion?.desc || 'Infusion details not found.';
            const activeInstance = activeInfusions.find(inf => inf.name === name);

            const el = document.createElement('div');
            el.className = 'Item tooltip infusion-known' + (activeInstance ? ' active' : '');
            el.setAttribute('data-tooltip', desc);
            el.innerHTML = `<div class="star">${activeInstance ? '✅' : '⚙️'}</div><div class="name">${name}</div>`;
            
            el.addEventListener('click', () => {
              const currentActive = window.readAllActiveInfusions();
              const activeIndex = currentActive.findIndex(inf => inf.name === name);

              if (activeIndex > -1) { // It's active, so deactivate it
                currentActive.splice(activeIndex, 1);
                window.writeAllActiveInfusions(currentActive);
                paintLevels(model); // Re-render
              } else { // It's not active, so try to activate it
                showInfusionTargeter(infusion, model, character => paintLevels(model));
              }
            });
            list.appendChild(el);
          });
        } else if (L === 7) { // Use Level 7 box for "Active Infusions"
          list.innerHTML = activeInfusions.sort((a, b) => a.name.localeCompare(b.name)).map(inf => {
            const infusionData = model.masterIndex.get(inf.name.toLowerCase());
            const desc = infusionData?.desc || 'Infusion details not found.';
              return `<div class="Item tooltip infusion-active" data-tooltip="${desc}">
                          <div class="star">✅</div>
                          <div class="name">${inf.name} <span class="infusion-target">on ${inf.item} (${inf.owner || '?'})</span></div>
                      </div>`;
          }).join('');
          if (activeInfusions.length === 0) {
            list.innerHTML = '<div style="opacity:0.5; text-align:center; padding-top:20px;">(Click a known infusion to activate)</div>';
          }
        } else {
          box.style.display = 'none'; // Hide 8 and 9 for now
        }
        continue; // Skip the regular spell rendering for this level
      } else if (model.cls.toLowerCase() !== 'artificer' && L >= 6) {
        box.style.display = 'none'; // Hide for non-artificers
        continue;
      }

      // --- Regular Spell Rendering ---
      const spells = (model.byLevel[L]||[]).slice().sort((a,b)=>{
        const ap = (prepared[L]?.includes(a.name) || a.locked) ? 0 : 1;
        const bp = (prepared[L]?.includes(b.name) || b.locked) ? 0 : 1;
        return (ap-bp) || a.name.localeCompare(b.name);
      });
      list.innerHTML='';
      for (const s of spells){
        const el = document.createElement('div');
        el.className = 'Item tooltip';
        el.dataset.locked = s.locked ? '1' : '0';

        // Handle description: prefer inline (for Ki), then local index, then API
        if (s.desc) {
          el.setAttribute('data-tooltip', s.desc);
        } else {
          const idx = model.masterIndex.get(s.name.toLowerCase());
          const localDesc = (idx && (idx.desc || idx.description || idx.full || idx.text));
          if (localDesc) {
            el.setAttribute('data-tooltip', String(Array.isArray(localDesc) ? localDesc.join('\n\n') : localDesc));
          } else {
            el.setAttribute('data-tooltip', 'Looking up description…');
            const onHover = async () => { el.setAttribute('data-tooltip', await DDData.getSpellDescription(s.name, model.masterIndex) || 'No description found.'); };
            el.addEventListener('mouseenter', onHover, { once: true });
          }
        }
        const star = document.createElement('div');
        star.className = 'star';
        const isPrepared = !!(prepared[L]?.includes(s.name) || s.locked);
        star.textContent = isPrepared ? '⭐' : '☆';
        star.title = s.locked ? 'Always prepared' : (model.prepLimit > 0 ? 'Toggle prepared' : (model.knownLimit > 0 ? 'Toggle known' : 'Known spell'));
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = s.name;
        el.appendChild(star);
        el.appendChild(name);
        if (s.badge){ const b = document.createElement('span'); b.className = 'badge'; b.textContent = s.badge; el.appendChild(b); }
        list.appendChild(el);
        if (!s.locked){
          const allowToggle = (model.prepLimit > 0 || model.knownLimit > 0);
          if (!allowToggle) {
            star.style.opacity = .35; star.style.cursor = 'not-allowed';
          } else {
          star.addEventListener('click', ()=>{
            const st = window.readSpellState(model.character);
            const prep = ST.getPrepared(st);
            prep[L] = prep[L] || [];
            const i = prep[L].indexOf(s.name);
            if (i>=0){ prep[L].splice(i,1); }
            else {
              const limit = model.prepLimit > 0 ? model.prepLimit : model.knownLimit;
              const total = Object.values(prep).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
              if (total >= limit){
                const type = model.prepLimit > 0 ? 'prepared' : 'known';
                F.status().textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} spell limit reached.`;
                setTimeout(()=>F.status().textContent='',1500);
                return;
              }
              prep[L].push(s.name);
            }
            ST.setPrepared(st, prep);
            window.writeSpellState(model.character, st);
            paintLevels(model);
            paintHeader(model);
          });
        }}
      }
      const pipBox = box.querySelector('.slot-dots');
      const resetBtn = box.querySelector('.reset');
      if (L>0 && pipBox){
        const max = Number(model.slots[L]||0);
        console.log(`DEBUG: For Level ${L}, max slots = ${max}`);
        pipBox.innerHTML='';
        const curr = Number(spent[L]||0);
        for(let i=0;i<max;i++){
          const dot = document.createElement('div');
          dot.className='slot-dot'+(i<curr?' spent':'');
          dot.title = 'Spell slot';
          dot.addEventListener('click', (ev)=>{
            const st = window.readSpellState(model.character);
            const sl = ST.getSlotsSpent(st);
            const c = Number(sl[L]||0);
            sl[L] = (!ev.shiftKey) ? ((i < c) ? i : (i+1)) : ((c>=max) ? 0 : max);
            ST.setSlotsSpent(st, sl);
            window.writeSpellState(model.character, st);
            paintLevels(model);
          });
          pipBox.appendChild(dot);
        }
        if (resetBtn){ resetBtn.onclick = ()=>{ const st = window.readSpellState(model.character); const sl = ST.getSlotsSpent(st); sl[L]=0; ST.setSlotsSpent(st, sl); window.writeSpellState(model.character, st); paintLevels(model); }; }
      } else if (L===0 && pipBox){ pipBox.parentElement.style.display='none'; }
    }
  }
  function paintResources(model){
    const st = window.readSpellState(model.character);
    if (model.hasChannelDivinity){
      F.resCD().style.display = '';
      F.resCDP().innerHTML = '';
      const used = ST.getCD(st);
      for (let i=0;i<model.cdMax;i++){
        const d=document.createElement('div');
        d.className='resource-dot'+(i<used?' spent':''); d.title='Channel Divinity use';
        d.addEventListener('click', (ev)=>{
          const curr = ST.getCD(window.readSpellState(model.character));
          ST.setCD(st, (!ev.shiftKey) ? ((i < curr) ? i : (i+1)) : ((curr>=model.cdMax) ? 0 : model.cdMax));
          window.writeSpellState(model.character, st);
          paintResources(model);
        });
        F.resCDP().appendChild(d);
      }
    } else {
      F.resCD().style.display = 'none';
    }
    if (model.hasKi){
      F.resKi().style.display = '';
      F.resKiP().innerHTML = '';
      const used = ST.getKi(st);
      for (let i=0;i<model.kiMax;i++){
        const d=document.createElement('div');
        d.className='resource-dot'+(i<used?' spent':''); d.title='Ki point';
        d.addEventListener('click', (ev)=>{
          const curr = ST.getKi(window.readSpellState(model.character));
          ST.setKi(st, (!ev.shiftKey) ? ((i < curr) ? i : (i+1)) : ((curr>=model.kiMax) ? 0 : model.kiMax));
          window.writeSpellState(model.character, st);
          paintResources(model);
        });
        F.resKiP().appendChild(d);
      }
    } else { F.resKi().style.display = 'none'; }
    if (model.hasWildShape){
      F.resWS().style.display = '';
      F.resWSP().innerHTML = '';
      const used = ST.getWS(st);
      for (let i=0;i<model.wildMax;i++){
        const d=document.createElement('div');
        d.className='resource-dot'+(i<used?' spent':''); d.title='Wild Shape use';
        d.addEventListener('click', (ev)=>{
          const curr = ST.getWS(window.readSpellState(model.character));
          ST.setWS(st, (!ev.shiftKey) ? ((i < curr) ? i : (i+1)) : ((curr>=model.wildMax) ? 0 : model.wildMax));
          if (ST.getWS(st) < 1 && ST.getSE(st)) ST.setSE(st,false);
          window.writeSpellState(model.character, st);
          paintResources(model);
        });
        F.resWSP().appendChild(d);
      }
      F.resSE().style.display = '';
      F.seToggle().checked = ST.getSE(st);
      F.seToggle().onchange = ()=>{
        const st2 = window.readSpellState(model.character);
        const onNow = !!F.seToggle().checked;
        if (onNow){
          if (ST.getWS(st2) >= model.wildMax){ F.seToggle().checked = false; F.status().textContent = 'No Wild Shape uses remaining.'; setTimeout(()=>F.status().textContent='',1500); return; }
          ST.setWS(st2, ST.getWS(st2)+1);
          ST.setSE(st2, true);
        } else { ST.setSE(st2, false); }
        window.writeSpellState(model.character, st2);
        paintResources(model);
      };
    } else { F.resWS().style.display = 'none'; F.resSE().style.display = 'none'; }
  }
  function wireRests(model){
    F.short().onclick = ()=>{
      const st = window.readSpellState(model.character);
      if (model.hasChannelDivinity) ST.setCD(st,0);
      if (model.hasKi) ST.setKi(st,0);
      if (model.hasWildShape){ ST.setWS(st,0); ST.setSE(st,false); }
      window.writeSpellState(model.character, st);
      paintResources(model);
      F.status().textContent = 'Short Rest applied.';
      setTimeout(()=>F.status().textContent='',1200);
    };
    F.long().onclick = ()=>{
      const st = window.readSpellState(model.character);
      ST.setSlotsSpent(st, {});
      if (model.hasChannelDivinity) ST.setCD(st,0);
      if (model.hasKi) ST.setKi(st,0);
      if (window.readActionState && window.writeActionState) {
        const actionState = window.readActionState(model.character);
        if (actionState) {
          actionState.rageUsed = 0;
          actionState.zealousPresenceUsed = 0;
          actionState.eldritchCannonUsed = 0;
          actionState.rabbitHopUsed = 0;
          window.writeActionState(model.character, actionState);
        }
      }
      if (model.hasWildShape){ ST.setWS(st,0); ST.setSE(st,false); }
      window.writeSpellState(model.character, st);
      paintLevels(model);
      paintResources(model);
      F.status().textContent = 'Long Rest: all slots/resources restored.';
      setTimeout(()=>F.status().textContent='',1200);
    };
    F.reprep().onclick = ()=>{
      const st = window.readSpellState(model.character);
      ST.setPrepared(st, {});
      window.writeSpellState(model.character, st);
      paintLevels(model);
      paintHeader(model);
      F.status().textContent = 'Prepared spells cleared.';
      setTimeout(()=>F.status().textContent='',1200);
    };
  }

  function showInfusionManager(model) {
    const state = window.readSpellState(model.character);
    const knownLimit = model.character?.infusions?.known_limit || 0;
    const knownFromState = ST.getKnownInfusions(state);
    const initialKnown = Array.isArray(knownFromState) ? knownFromState : (model.character?.infusions?.known || []);
    let selection = new Set(initialKnown);

    // Create modal elements
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'infusion-manager-modal';

    const availableInfusions = model.allInfusions.filter(inf => inf.level <= model.level);

    const listHtml = availableInfusions
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(infusion => {
        const isKnown = selection.has(infusion.name);
        return `
            <label class="infusion-choice tooltip" data-tooltip="${infusion.desc}">
                <input type="checkbox" value="${infusion.name}" ${isKnown ? 'checked' : ''}>
                <span>${infusion.name}</span>
            </label>
        `;
    }).join('');

    modal.innerHTML = `
        <h3 class="modal-title">Manage Known Infusions</h3>
        <p class="modal-subtitle">You can know up to <strong>${knownLimit}</strong> infusions. (<span id="infusion-known-count">${selection.size}</span> selected)</p>
        <div class="infusion-list">${listHtml}</div>
        <div class="modal-actions">
            <button id="infusion-cancel">Cancel</button>
            <button id="infusion-save">Save</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event Listeners
    const countEl = modal.querySelector('#infusion-known-count');
    modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                if (selection.size >= knownLimit) {
                    cb.checked = false; // prevent checking more
                    F.status().textContent = `You can only know ${knownLimit} infusions.`;
                    setTimeout(() => F.status().textContent = '', 2000);
                    return;
                }
                selection.add(cb.value);
            } else {
                selection.delete(cb.value);
            }
            countEl.textContent = selection.size;
        });
    });

    const close = () => document.body.removeChild(overlay);

    modal.querySelector('#infusion-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    modal.querySelector('#infusion-save').addEventListener('click', () => {
        const newState = window.readSpellState(model.character);
        const newKnownList = Array.from(selection).sort();
        ST.setKnownInfusions(newState, newKnownList);

        // Prune any *active* infusions that are no longer known.
        const allActive = window.readAllActiveInfusions();
        const newActiveList = allActive.filter(inf => newKnownList.includes(inf.name));
        window.writeAllActiveInfusions(newActiveList);
        
        window.writeSpellState(model.character, newState);
        paintLevels(model); // Re-render the main UI
        close();
    });
  }

  function itemMatchesInfusionType(item, infusionType) {
    if (!item || !infusionType) return false;

    const type = infusionType.toLowerCase();
    const itemCategory = String(item.weapon_category || '').toLowerCase(); // 'simple', 'martial'
    const equipCategoryIndex = String(item.equipment_category?.index || '').toLowerCase();
    const itemName = String(item.name || '').toLowerCase();

    if (type.includes('simple or martial weapon')) {
        if (equipCategoryIndex !== 'weapon') return false;
        if (itemCategory !== 'simple' && itemCategory !== 'martial') return false;
        
        if (type.includes('ammunition property') && !window.DDRules.propHas(item, 'ammunition')) {
            return false;
        }
        if (type.includes('thrown property') && !window.DDRules.propHas(item, 'thrown')) {
            return false;
        }
        return true;
    }

    if (type.includes('armor or a shield')) {
        return equipCategoryIndex === 'armor' || equipCategoryIndex === 'shield';
    }
    
    // Fallback for simple name checks on other item types
    const typeWords = type.split(/, | or /); // "rod, staff, or wand" -> ["rod", "staff", "wand"]
    return typeWords.some(word => itemName.includes(word.trim()));
  }

  async function showInfusionTargeter(infusion, model, onComplete) {
    const character = model.character;
    const infusionLimits = character?.infusions || { active_limit: 0 };
    const currentActive = window.readAllActiveInfusions();

    if (currentActive.length >= infusionLimits.active_limit) {
        F.status().textContent = `Active infusion limit (${infusionLimits.active_limit}) reached.`;
      setTimeout(() => F.status().textContent = '', 2000);
      return;
    }

    // --- NEW: Load all characters to get their gear ---
    const charList = window.getCharacterList();
    const allCharacters = await Promise.all(
      charList.map(file => window.loadCharacter(file))
    );

    let optionsHtml = '';
    for (const char of allCharacters) {
      if (!char) continue;

      const allItemNames = [...(char.equipment?.weapons || []),
        ...(char.gear?.map(g => g.name) || []),
        ...(Array.isArray(char.armor) ? char.armor : [char.armor])
      ].filter(Boolean);

      if (allItemNames.length === 0) continue;

      const allItemDetails = await Promise.all(
        allItemNames.map(name => window.getEquipmentByName(name))
      );

      const targetableItems = allItemDetails.filter(item => item && itemMatchesInfusionType(item, infusion.item_type));

      if (targetableItems.length > 0) {
        optionsHtml += `<optgroup label="${char.name}">`;
        optionsHtml += targetableItems.map(item => `<option value="${item.name}" data-owner="${char.name}">${item.name}</option>`).join('');
        optionsHtml += `</optgroup>`;
      }
    }

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'infusion-manager-modal'; // Re-using style

    

    modal.innerHTML = `
        <h3 class="modal-title">Infuse Item</h3>
        <p class="modal-subtitle">Select an item to infuse with <strong>${infusion.name}</strong>.</p>
        <div class="infusion-list" style="padding: 20px;">
            <p>This infusion applies to: <em>${infusion.item_type || 'any non-magical item'}</em></p>
            <select id="infusion-item-select" style="width: 100%; font-size: 14px; padding: 5px;">
                <option value="">-- Choose a target item --</option>
                ${optionsHtml}
            </select>
        </div>
        <div class="modal-actions">
            <button id="infusion-cancel">Cancel</button>
            <button id="infusion-save">Infuse</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    modal.querySelector('#infusion-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    modal.querySelector('#infusion-save').addEventListener('click', () => {
        const selectEl = modal.querySelector('#infusion-item-select');
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;
        
        let bonus = 0;
        if (infusion.name === 'Enhanced Defense' || infusion.name === 'Enhanced Weapon' || infusion.name === 'Returning Weapon') {
            bonus = (model.character.level >= 10) ? 2 : 1;
        }

        const active = window.readAllActiveInfusions();
        const newInfusion = { name: infusion.name, item: selectedOption.value, owner: selectedOption.dataset.owner, bonus: bonus };
        active.push(newInfusion);
        window.writeAllActiveInfusions(active);
        if (onComplete) onComplete();
        close();
    });
  }

  // --- Main Render Function ---
  async function render(character){
    global._currentCharacter = character;
    const model = await buildModel(character);
    paintHeader(model);
    clearLists();
    paintLevels(model);
    paintResources(model);
    wireRests(model);
    await renderSpellcastingNumbers(character);
  }

  // --- Public Entry Point ---
  async function renderFromCharacterFile(file){
    const clean = String(file||'').replace(/^\/?data\//,'');
    const char = await global.loadCharacter(clean);
    if (!char) { const st = $('#status'); if (st) st.textContent = `Could not load ${clean}`; return; }

    global.STORAGE.set('dd:lastChar', clean);
    global.setURLParam('char', clean);

    await render(char);

    const st = $('#status'); if (st) st.textContent = `Loaded ${char.name || clean}`;
  }

  // --- Boot & Toolbar Wiring ---
  function boot(){
    if (typeof global.initToolbar === 'function') {
      global.initToolbar({
        onLoadCharacter: renderFromCharacterFile,
        onSaveCharacter: () => {
          const char = global._currentCharacter;
          if (!char) return;
          const state = readState(char);
          writeState(char, state);
          const st = $('#status'); if (st) { st.textContent = 'State saved to localStorage.'; setTimeout(()=>st.textContent='', 2000); }
        }
      });
    }

    // Initial load: ?char=… or lastChar or a sensible default
    const url = new URL(location.href);
    const want = url.searchParams.get('char') || global.STORAGE.get('dd:lastChar') || 'direcris.json';
    renderFromCharacterFile(want);

    // Add navigation ribbon button to go back to the character sheet
    if (typeof createRibbonButton === 'function') {
      createRibbonButton({
        id: "to-character", container: "#sheet", top: 6, left: 5, width: 110, height: 52,
        label: "Sheet →",
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `charactersheet.html${location.search}`; }
      });

      createRibbonButton({
        id: "to-actions", container: "#sheet", top: 6, left: 676, width: 110, height: 52,
        label: "← Actions",
        mirrored: true,
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `actions.html${location.search}`; }
      });
    }
  }

  // expose & start
  global.renderFromCharacterFile = renderFromCharacterFile;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
