import { Encounter } from './Encounter.js';

document.addEventListener('DOMContentLoaded', () => {
    const encounter = new Encounter();

    // Initialize the encounter (e.g., load monsters)
    encounter.init();

    // --- Event Listeners for Setup ---
    document.getElementById('select-all-players-btn').addEventListener('click', () => {
        const allPlayerCheckboxes = document.querySelectorAll('#party-selection-list input[type="checkbox"]:not(:disabled)');
        allPlayerCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    document.getElementById('add-selected-players-btn').addEventListener('click', async () => {
        const selectedCheckboxes = document.querySelectorAll('#party-selection-list input[type="checkbox"]:checked');
        
        if (selectedCheckboxes.length === 0) return;

        for (const checkbox of selectedCheckboxes) {
            const characterFileName = checkbox.dataset.name;
            
            // Load character data from JSON using the shared function
            const character = await window.loadCharacter(characterFileName);
            if (!character) {
                console.error(`Could not load character: ${characterFileName}`);
                continue; // Skip to the next selected character
            }

            // Calculate dynamic stats using shared functions from storage.js
            const acResult = await window.CharCalculations.calculateAC(character);
            const initiativeResult = window.CharCalculations.computeInitiative(character);

            // Check for a saved HP snapshot from the character sheet page
            const hpSnapshotKey = 'dd:hp::' + character.name.toLowerCase();
            const savedHP = window.STORAGE.get(hpSnapshotKey);

            const combatantData = {
                name: character.name,
                isPlayer: true,
                ac: acResult.ac,
                maxHP: character.maxHP,
                // Use saved HP if available, otherwise use full HP
                currentHP: savedHP ? savedHP.currentHP : character.maxHP,
                initiativeBonus: initiativeResult.value,
                full_stats: character // Pass full character data for stat block, etc.
            };

            const addedPlayer = encounter.addCombatant(combatantData);

            // Pull in any explicit companion summons queued from the character sheet.
            const pendingSummons = (window.consumeEncounterPendingSummonsFor && character?.name)
                ? window.consumeEncounterPendingSummonsFor(character.name)
                : [];
            for (const summon of pendingSummons) {
                const summonType = String(summon?.summonType || '').toLowerCase();
                if (summonType !== 'homunculus_servant') continue;
                if (!window.buildHomunculusCombatantData) continue;
                const hsState = window.getHomunculusServantState
                    ? window.getHomunculusServantState(character)
                    : null;
                const hsData = window.buildHomunculusCombatantData(character, {
                    controlledBy: addedPlayer?.id || null,
                    state: hsState,
                    name: summon?.name,
                    initiative: Number(addedPlayer?.initiative || 0)
                });
                const hsCombatant = encounter.addCombatant(hsData);
                if (window.writeHomunculusServantState) {
                    window.writeHomunculusServantState(character, {
                        ...(hsState || {}),
                        enabled: true,
                        active: true,
                        name: String(hsCombatant?.name || hsData?.name || ''),
                        currentHP: Number(hsCombatant?.currentHp || hsData?.currentHp || 0)
                    });
                }
            }
            
            // Disable checkbox after adding to prevent duplicates
            checkbox.checked = false;
            checkbox.disabled = true;
        }
        encounter.renderSetupList();
        encounter.saveState();
    });

    document.getElementById('add-monster-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('monster-type').value;
        const count = parseInt(document.getElementById('monster-count').value, 10);
        encounter.addMonsters(type, count);
    });

    document.getElementById('start-encounter-btn').addEventListener('click', () => {
        encounter.start();
    });

    // --- Event Listeners for Combat ---
    document.getElementById('prev-turn-btn').addEventListener('click', () => {
        encounter.previousTurn();
    });

    document.getElementById('next-turn-btn').addEventListener('click', () => {
        encounter.nextTurn();
    });

    document.getElementById('end-encounter-btn').addEventListener('click', () => {
        encounter.end();
    });

    // --- Keyboard Shortcut for Next Turn ---
    document.addEventListener('keydown', (e) => {
        // Check if we are in combat view and not typing in an input/select
        const combatView = document.getElementById('combat-view');
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

        if (e.key === ' ' && !combatView.classList.contains('hidden') && !isTyping) {
            e.preventDefault(); // Prevent space bar from scrolling or clicking buttons
            if (e.shiftKey) {
                encounter.previousTurn();
            } else {
                encounter.nextTurn();
            }
        }
    });
});
