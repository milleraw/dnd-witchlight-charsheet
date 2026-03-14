// monster-editor.js

let monsterData = [];

function getAbilityMod(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return '(?)';
    const mod = Math.floor((n - 10) / 2);
    return `(${mod >= 0 ? '+' : ''}${mod})`;
}

function updateAbilityModifiers() {
    document.querySelectorAll('input[data-mod]').forEach(input => {
        const modInput = document.getElementById(input.dataset.mod);
        if (modInput) {
            modInput.value = getAbilityMod(input.value);
        }
    });
}

function populateForm(monsterName) {
    const form = document.getElementById('monster-form');
    form.reset();

    if (!monsterName) {
        updateAbilityModifiers();
        return;
    }

    const monster = monsterData.find(m => m.name === monsterName);
    if (!monster) {
        alert('Monster not found!');
        return;
    }

    document.getElementById('name').value = monster.name || '';
    document.getElementById('meta').value = monster.meta || '';
    document.getElementById('ac').value = monster['Armor Class'] || '';
    document.getElementById('hp').value = monster['Hit Points'] || '';
    document.getElementById('speed').value = monster.Speed || '';
    document.getElementById('img_url').value = monster.img_url || '';

    document.getElementById('str').value = monster.STR || '';
    document.getElementById('dex').value = monster.DEX || '';
    document.getElementById('con').value = monster.CON || '';
    document.getElementById('int').value = monster.INT || '';
    document.getElementById('wis').value = monster.WIS || '';
    document.getElementById('cha').value = monster.CHA || '';

    document.getElementById('saves').value = monster['Saving Throws'] || '';
    document.getElementById('skills').value = monster.Skills || '';
    document.getElementById('vulnerabilities').value = monster['Damage Vulnerabilities'] || '';
    document.getElementById('resistances').value = monster['Damage Resistances'] || '';
    document.getElementById('immunities').value = monster['Damage Immunities'] || '';
    document.getElementById('conditions').value = monster['Condition Immunities'] || '';
    document.getElementById('senses').value = monster.Senses || '';
    document.getElementById('languages').value = monster.Languages || '';
    document.getElementById('challenge').value = monster.Challenge || '';

    document.getElementById('traits').value = monster.Traits || '';
    document.getElementById('actions').value = monster.Actions || '';
    document.getElementById('reactions').value = monster.Reactions || '';
    document.getElementById('legendary').value = monster['Legendary Actions'] || '';
    document.getElementById('lair').value = monster['Lair Actions'] || '';

    updateAbilityModifiers();
}

function collectMonsterFromForm() {
    const monster = {
        name: document.getElementById('name').value.trim(),
        meta: document.getElementById('meta').value.trim(),
        'Armor Class': document.getElementById('ac').value.trim(),
        'Hit Points': document.getElementById('hp').value.trim(),
        Speed: document.getElementById('speed').value.trim(),
        img_url: document.getElementById('img_url').value.trim(),
        STR: document.getElementById('str').value.trim(),
        DEX: document.getElementById('dex').value.trim(),
        CON: document.getElementById('con').value.trim(),
        INT: document.getElementById('int').value.trim(),
        WIS: document.getElementById('wis').value.trim(),
        CHA: document.getElementById('cha').value.trim(),
        STR_mod: document.getElementById('str_mod').value.trim(),
        DEX_mod: document.getElementById('dex_mod').value.trim(),
        CON_mod: document.getElementById('con_mod').value.trim(),
        INT_mod: document.getElementById('int_mod').value.trim(),
        WIS_mod: document.getElementById('wis_mod').value.trim(),
        CHA_mod: document.getElementById('cha_mod').value.trim(),
        'Saving Throws': document.getElementById('saves').value.trim(),
        Skills: document.getElementById('skills').value.trim(),
        'Damage Vulnerabilities': document.getElementById('vulnerabilities').value.trim(),
        'Damage Resistances': document.getElementById('resistances').value.trim(),
        'Damage Immunities': document.getElementById('immunities').value.trim(),
        'Condition Immunities': document.getElementById('conditions').value.trim(),
        Senses: document.getElementById('senses').value.trim(),
        Languages: document.getElementById('languages').value.trim(),
        Challenge: document.getElementById('challenge').value.trim(),
        Traits: document.getElementById('traits').value.trim(),
        Actions: document.getElementById('actions').value.trim(),
        Reactions: document.getElementById('reactions').value.trim(),
        'Legendary Actions': document.getElementById('legendary').value.trim(),
        'Lair Actions': document.getElementById('lair').value.trim(),
    };

    // Clean up empty fields to keep the JSON tidy
    for (const key in monster) {
        if (monster[key] === '') {
            delete monster[key];
        }
    }
    return monster;
}

async function handleSave() {
    const newMonster = collectMonsterFromForm();
    if (!newMonster.name) {
        alert('Monster name is required!');
        return;
    }

    const existingIndex = monsterData.findIndex(m => m.name.toLowerCase() === newMonster.name.toLowerCase());

    if (existingIndex > -1) {
        monsterData[existingIndex] = newMonster;
    } else {
        monsterData.push(newMonster);
    }

    monsterData.sort((a, b) => a.name.localeCompare(b.name));

    const updatedJson = JSON.stringify(monsterData, null, 2);

    const outputContainer = document.getElementById('output-container');
    const outputTextarea = document.getElementById('output-json');

    outputTextarea.value = updatedJson;
    outputContainer.classList.remove('hidden');

    // --- Trigger download automatically ---
    const blob = new Blob([updatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = 'externalmonsters.json';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);

    alert(`Monster "${newMonster.name}" has been saved. Your browser should have started downloading the updated 'externalmonsters.json' file.`);
    
    populateMonsterDropdown();
    document.getElementById('monster-select').value = newMonster.name;
}

function populateMonsterDropdown() {
    const select = document.getElementById('monster-select');
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- New Monster --</option>';
    monsterData.forEach(monster => {
        const option = document.createElement('option');
        option.value = monster.name;
        option.textContent = monster.name;
        select.appendChild(option);
    });
    select.value = currentVal;
}

async function init() {
    try {
        const response = await fetch('externalmonsters.json');
        if (!response.ok) throw new Error('Could not load monster data.');
        monsterData = await response.json();
        populateMonsterDropdown();
    } catch (error) {
        console.error(error);
        alert('Failed to load externalmonsters.json. You can still create new monsters, but editing is disabled.');
    }

    document.getElementById('monster-select').addEventListener('change', (e) => populateForm(e.target.value));
    document.getElementById('save-btn').addEventListener('click', handleSave);
    document.getElementById('clear-btn').addEventListener('click', () => {
        document.getElementById('monster-select').value = '';
        document.getElementById('monster-search').value = '';
        populateForm(null); // This resets the form fields
        document.getElementById('monster-search').dispatchEvent(new Event('input')); // Trigger filter reset
    });
    document.querySelectorAll('input[data-mod]').forEach(input => input.addEventListener('input', updateAbilityModifiers));

    document.getElementById('monster-search').addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        const select = document.getElementById('monster-select');
        for (const option of select.options) {
            // Always show the "-- New Monster --" option
            if (option.value === "") {
                option.style.display = "";
                continue;
            }
            option.style.display = option.textContent.toLowerCase().includes(filter) ? "" : "none";
        }
    });
    updateAbilityModifiers();
}

document.addEventListener('DOMContentLoaded', init);