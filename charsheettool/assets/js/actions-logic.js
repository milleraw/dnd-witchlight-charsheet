// assets/js/actions-logic.js
(function(global) {
  'use strict';

  // --- Generic Actions (Universal Rules) ---
  function getGenericActions(character) {
    return [
      { name: 'Attack', desc: 'Make one melee or ranged attack. Certain features, such as the Extra Attack feature, allow you to make more than one attack with this action.', source: 'Basic Rules' },
      { name: 'Grapple', desc: 'As part of an Attack action, you can make a special melee attack to grapple. This replaces one of your attacks. The target must be no more than one size larger than you and within your reach. Make a Strength (Athletics) check contested by the target’s Strength (Athletics) or Dexterity (Acrobatics) check.', source: 'Special Melee Attack' },
      { name: 'Shove', desc: 'As part of an Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it 5 feet away from you. This replaces one of your attacks. The target must be no more than one size larger than you and within your reach. Make a Strength (Athletics) check contested by the target’s Strength (Athletics) or Dexterity (Acrobatics) check.', source: 'Special Melee Attack' },
      { name: 'Cast a Spell', desc: 'Cast a spell with a casting time of 1 action.', source: 'Basic Rules' },
      { name: 'Dash', desc: 'Gain extra movement for the current turn.', source: 'Basic Rules' },
      { name: 'Disengage', desc: 'Your movement doesn’t provoke opportunity attacks for the rest of the turn.', source: 'Basic Rules' },
      { name: 'Dodge', desc: 'Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.', source: 'Basic Rules' },
      { name: 'Help', desc: 'Give an ally advantage on an ability check or their next attack roll.', source: 'Basic Rules' },
      { name: 'Hide', desc: 'Make a Dexterity (Stealth) check to become unseen.', source: 'Basic Rules' },
      { name: 'Ready', desc: 'Ready an action to occur on a specific trigger.', source: 'Basic Rules' },
      { name: 'Search', desc: 'Make a Wisdom (Perception) or Intelligence (Investigation) check.', source: 'Basic Rules' },
      { name: 'Use an Object', desc: 'Interact with a second object on your turn.', source: 'Basic Rules' },
      { name: 'Don/Doff a Shield', desc: 'Donning or doffing a shield takes 1 action.', source: 'Basic Rules' },
    ];
  }

  function getGenericBonusActions(character) {
    return [{
      name: 'Two-Weapon Fighting',
      desc: "When you take the Attack action and attack with a light melee weapon that you're holding in one hand, you can use a bonus action to attack with a different light melee weapon that you're holding in the other hand. You don't add your ability modifier to the damage of the bonus attack, unless that modifier is negative.",
      source: 'Basic Rules'
    }];
  }

  function getGenericReactions(character) {
    return [{
      name: 'Opportunity Attack',
      desc: 'You can make an opportunity attack when a hostile creature that you can see moves out of your reach. You use your reaction to make one melee attack against the provoking creature.',
      source: 'Basic Rules'
    }];
  }

  function getMovementActions(character) {
    const strScore = Number(character?.abilities?.STR ?? character?.abilities?.str ?? 10);
    const strMod = window.DDRules.abilityMod(strScore);
    return [
      { name: 'Move', desc: `You can move up to your speed on your turn. You can break up your movement, using some of it before and after your action.`, source: 'Basic Rules' },
      { name: 'Stand Up', desc: 'You can stand up from prone by using half of your movement speed.', source: 'Basic Rules' },
      { name: 'Drop Prone', desc: 'You can drop prone without using any of your speed.', source: 'Basic Rules' },
      { name: 'Climb, Swim, or Crawl', desc: 'Each foot of movement costs 1 extra foot (2 extra feet in difficult terrain) when you climb, swim, or crawl.', source: 'Basic Rules' },
      { name: 'Long Jump', desc: `With a 10-foot run-up, you can long jump up to your Strength score in feet (${strScore} ft). Without a run-up, you can only jump half that distance.`, source: 'Basic Rules' },
      { name: 'High Jump', desc: `With a 10-foot run-up, you can high jump up to 3 + your Strength modifier feet (${3 + strMod} ft). Without a run-up, you can only jump half that distance.`, source: 'Basic Rules' },
      { name: 'Difficult Terrain', desc: 'Moving through difficult terrain costs 2 feet of speed for every 1 foot moved.', source: 'Basic Rules' },
    ];
  }

  // --- Spells that can be cast as a Bonus Action ---
  function _storageKeyForSpells(c) { return 'spells:' + String(c?.name || '').toLowerCase(); }
  function _readSpellState(c) { try { return JSON.parse(localStorage.getItem(_storageKeyForSpells(c)) || '{}'); } catch { return {}; } }

  async function getSpellBonusActions(character) {
    const out = [];
    const cls = String(character.class || '').toLowerCase();

    const preparedCasters = ['cleric', 'druid', 'paladin', 'wizard', 'artificer'];
    const knownCasters = ['bard', 'ranger', 'sorcerer', 'warlock'];

    let spellNames = new Set();

    if (preparedCasters.includes(cls)) {
      const state = _readSpellState(character);
      const preparedByLevel = state.preparedByLevel || {};
      for (const level in preparedByLevel) {
        if (Array.isArray(preparedByLevel[level])) {
          preparedByLevel[level].forEach(name => spellNames.add(name));
        }
      }
    } else if (knownCasters.includes(cls)) {
      if (Array.isArray(character.spells)) {
        character.spells.forEach(name => spellNames.add(name));
      }
    } else {
      return []; // Not a caster type we're handling for bonus action spells
    }

    if (spellNames.size === 0) return [];

    if (typeof global.DDData?.loadAllSpells !== 'function') return [];

    const allSpells = await global.DDData.loadAllSpells();
    const spellsByName = new Map(allSpells.map(s => [String(s.name).toLowerCase(), s]));

    for (const spellName of spellNames) {
      const spellData = spellsByName.get(spellName.toLowerCase());
      if (spellData && spellData.casting_time === '1 bonus action') {
        const desc = Array.isArray(spellData.desc) ? spellData.desc.join('\n\n') : spellData.desc;
        out.push({ name: spellData.name, desc, source: `Spell (Lvl ${spellData.level})` });
      }
    }
    return out;
  }

  // --- Data-Driven Action Collector ---
  async function collectDataDrivenActions(character) {
    const actions = { action: [], bonus: [], reaction: [], special: [] };
    const level = Number(character.level) || 1;

    const [classData, subClassData, raceData] = await Promise.all([
      window.loadClassesLocal(),
      window.loadSubclassesLocal(),
      window.loadRacesLocal()
    ]);

    const className = String(character.class || '').trim().toLowerCase();
    const subclassName = String(character.build || '').trim().toLowerCase();
    const raceName = String(character.race || '').trim().toLowerCase();

    const charClass = classData.find(c => String(c.name || '').trim().toLowerCase() === className);
    const charSubclass = subClassData.find(s => String(s.name || '').trim().toLowerCase() === subclassName && String(s.class || '').trim().toLowerCase() === className);
    const charRace = raceData.find(r => String(r.name || '').trim().toLowerCase() === raceName || String(r.index || '').trim().toLowerCase() === raceName);

    const sources = [charClass, charSubclass, charRace];
    for (const source of sources) {
      if (source && Array.isArray(source.actions)) {
        for (const action of source.actions) {
          if (action.level && action.level > level) continue;
          if (action.type && actions[action.type]) {
            actions[action.type].push({ ...action });
          }
        }
      }
    }
    return actions;
  }

  // --- Main Function ---
  // This gathers all actions and organizes them by type.
  async function getCharacterActions(character, state = {}) {
    const dataDriven = await collectDataDrivenActions(character);
    const spellActions = await getSpellBonusActions(character);

    // Handle conditional descriptions
    if (state.isRaging) {
      const rageAction = dataDriven.bonus.find(a => a.name === 'Rage');
      if (rageAction) {
        const rageDamageBonus = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2;
        let benefits = `• Advantage on Strength checks and saving throws.\n• +${rageDamageBonus} bonus to damage rolls with Strength-based melee attacks.\n• Resistance to bludgeoning, piercing, and slashing damage.`;
        if (character.level >= 6) {
          benefits += `\n• Fanatical Focus: If you fail a saving throw, you can reroll it (once per rage).`;
        }
        rageAction.desc = `You are currently raging. You gain the following benefits:\n\n${benefits}\n\nYou can end your rage as a bonus action.`;
      }
    }

    // Filter out actions whose conditions are not met
    const filterByCondition = (action) => {
      if (!action.condition) return true;
      if (action.condition === 'isRaging') return !!state.isRaging;
      return false;
    };

    const actions = {
      move: getMovementActions(character),
      action: getGenericActions(character).concat(dataDriven.action.filter(filterByCondition)),
      bonus: getGenericBonusActions(character).concat(dataDriven.bonus.filter(filterByCondition), spellActions),
      reaction: getGenericReactions(character).concat(dataDriven.reaction.filter(filterByCondition)),
    };

    // Integrate "special" actions into the descriptions of their parent actions
    for (const special of dataDriven.special.filter(filterByCondition)) {
      const parentAction = actions.action.find(a => a.name === 'Attack');
      if (parentAction) {
        parentAction.desc += `\n\n${special.name}: ${special.desc}`;
      }
    }

    return actions;
  }

  // Expose to global scope so other scripts can use it
  global.getCharacterActions = getCharacterActions;

})(window);