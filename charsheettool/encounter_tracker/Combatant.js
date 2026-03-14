export class Combatant {
    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name;
        this.isPlayer = data.isPlayer || false;
        this.initiative = data.initiative || 0;
        this.conditions = new Set(data.conditions || []);
        this.isConcentrating = data.isConcentrating || false;
        this.isWildShaped = data.isWildShaped || false;
        this.wildShapeForm = data.wildShapeForm || null;
        this._preShapeState = data._preShapeState || null;
        this.beast_stats = data.beast_stats || null;
        this.controlledBy = data.controlledBy || null;
        this.summonType = data.summonType || null;
        this.fungalAnimatedFromId = data.fungalAnimatedFromId || null;
        this.fungalConsumed = !!data.fungalConsumed;
        this.transformSource = data.transformSource || null;
        this.transformedBy = data.transformedBy || null;
        this.spellEffects = Array.isArray(data.spellEffects) ? data.spellEffects.map(e => ({ ...e })) : [];

        this.full_stats = data.full_stats || data; // Store all data

        // Handle complex monster data vs simple player data
        if (this.isPlayer) {
            this.maxHp = parseInt(data.maxHP, 10) || 10;
            this.currentHp = data.currentHP !== undefined ? parseInt(data.currentHP, 10) : this.maxHp;
            this.ac = parseInt(data.ac, 10) || 10;
            this.initiativeBonus = data.initiativeBonus || 0;
        } else {
            // It's a monster from externalmonsters.json
            // On restore, the raw stat block is in full_stats, while dynamic values like currentHp are on data.
            const stats = this.full_stats;
            // Parse "Hit Points": "135 (18d10 + 36)" -> 135
            this.maxHp = parseInt(stats['Hit Points'], 10);
            // Parse "Armor Class": "17 (Natural Armor)" -> 17
            this.ac = parseInt(stats['Armor Class'], 10);
            // Parse "DEX_mod": "(+2)" -> 2
            const dexModString = stats.DEX_mod || '(+0)';
            this.initiativeBonus = parseInt(dexModString.replace(/[()]/g, ''), 10);
            // currentHp is part of the dynamic state, so it's on `data`, not `stats`.
            this.currentHp = data.currentHp !== undefined ? parseInt(data.currentHp, 10) : this.maxHp;
        }
    }

 transform(beastData, options = {}) {
        if (this.isWildShaped) return; // Already shaped

        this._preShapeState = {
            name: this.name,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            ac: this.ac,
            full_stats: this.full_stats
        };

        this.isWildShaped = true;
        this.wildShapeForm = beastData.name;
        this.name = `${this._preShapeState.name} (${beastData.name})`;
        this.maxHp = parseInt(beastData['Hit Points'], 10) || 1;
        this.currentHp = this.maxHp; // Assume full HP on transform
        this.ac = parseInt(beastData['Armor Class'], 10);
        this.beast_stats = beastData;
        this.transformSource = String(options.source || this.transformSource || '');
        this.transformedBy = options.transformedBy || this.transformedBy || null;
    }

    revert() {
        if (!this.isWildShaped || !this._preShapeState) return;

        const excessDamage = (this.currentHp <= 0) ? Math.abs(this.currentHp) : 0;

        // Restore original stats and apply excess damage
        this.name = this._preShapeState.name;
        this.maxHp = this._preShapeState.maxHp;
        this.ac = this._preShapeState.ac;
        this.currentHp = this._preShapeState.currentHp - excessDamage;
        if (this.currentHp < 0) this.currentHp = 0;

        // Clear wild shape state
        this.isWildShaped = false;
        this.wildShapeForm = null;
        this._preShapeState = null;
        this.beast_stats = null;
        this.transformSource = null;
        this.transformedBy = null;
    }

    updateHp(amount) {
        // Clamp HP to max, but allow it to go negative for wild-shaped carry-over damage.
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }

        if (!this.isWildShaped && this.currentHp < 0) {
            this.currentHp = 0;
        }
    }

    addCondition(condition) {
        this.conditions.add(condition.toLowerCase());
    }

    removeCondition(condition) {
        this.conditions.delete(condition.toLowerCase());
    }

    toggleConcentration() {
        this.isConcentrating = !this.isConcentrating;
    }
}
