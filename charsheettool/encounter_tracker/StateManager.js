const STORAGE_KEY = 'dnd-encounter-tracker-state';

export class StateManager {
    /**
     * Saves the current encounter state to localStorage.
     * @param {Encounter} encounter - The entire Encounter instance.
     */
    static save(encounter) {
        try {
            // Create a serializable representation of the state
            const getSerializableCombatant = (c) => ({
                ...c,
                conditions: Array.from(c.conditions) // Convert Set to Array for JSON
            });

            const stateToSave = {
                inCombat: encounter.turnOrder.length > 0 && encounter.turnIndex > -1,
                combatants: encounter.combatants.map(getSerializableCombatant),
                turnOrder: encounter.turnOrder.map(getSerializableCombatant),
                round: encounter.round,
                turnIndex: encounter.turnIndex,
                monsterCounts: encounter.monsterCounts,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }

    static load() {
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        return savedStateJSON ? JSON.parse(savedStateJSON) : null;
    }

    static clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
}