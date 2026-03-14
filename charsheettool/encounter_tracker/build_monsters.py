import json
import math
import os
import sys

# This maps CR string to XP value.
CR_TO_XP = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450,
    "3": 700, "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900,
    "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000,
    "14": 11500, "15": 13000, "16": 15000, "17": 18000, "18": 20000,
    "19": 22000, "20": 25000, "21": 33000, "22": 41000, "23": 50000,
    "24": 62000, "25": 75000, "26": 90000, "27": 105000, "28": 120000,
    "29": 135000, "30": 155000
}

def get_mod_string(score):
    """Calculates an ability modifier string from a score."""
    try:
        mod = math.floor((int(score) - 10) / 2)
        return f"({'+' if mod >= 0 else ''}{mod})"
    except (ValueError, TypeError):
        return ""

def format_html_block(items, intro=""):
    """Formats a list of named descriptions into an HTML string."""
    if not items:
        return ""
    
    parts = [f"<p>{intro}</p>"] if intro else []
    for item in items:
        name = item.get("name", "")
        desc = item.get("description", "")
        parts.append(f'<p><em><strong>{name}.</strong></em> {desc}</p>')
    return "".join(parts)

def format_spellcasting_block(spell_info):
    """Formats a spellcasting block into an HTML string."""
    if not spell_info:
        return ""
 
    parts = []
    preamble = spell_info.get('preamble', '')
    name = spell_info.get('name', 'Spellcasting')

    # The name is often part of the preamble in the source data, so let's not double it up if it is.
    if name.lower() not in preamble.lower():
        parts.append(f"<p><em><strong>{name}.</strong></em> {preamble}</p>")
    else:
        # The name is already in the preamble, so just use that.
        parts.append(f"<p><em><strong>{preamble}</strong></em></p>")

    if spell_info.get("at_will"):
        parts.append(f"<p>Cantrips (at will): <em>{', '.join(spell_info['at_will'])}</em></p>")

    spells_data = spell_info.get("spells")
    if isinstance(spells_data, dict):
        # Handles monsters where spells are grouped by level in a dictionary
        for level_str, spells in spells_data.items():
            level_num_str = level_str.split(' ')[0]
            slots = spell_info.get("slots", {}).get(level_num_str, '')
            slots_str = f" ({slots} slots)" if slots else ""
            parts.append(f"<p>{level_str}{slots_str}: <em>{', '.join(spells)}</em></p>")
    elif isinstance(spells_data, list):
        # Handles monsters where spells are in a flat list (like Bavlorna Blightstraw)
        slots_text = spell_info.get("slots_text", "Spells")
        parts.append(f"<p>{slots_text}: <em>{', '.join(spells_data)}</em></p>")


    if spell_info.get("daily"):
        for freq, spells in spell_info["daily"].items():
            parts.append(f"<p>{freq}: <em>{', '.join(spells)}</em></p>")

    if spell_info.get("postamble"):
        parts.append(f"<p>{spell_info.get('postamble')}</p>")

    return "".join(parts)

def convert_monster(monster):
    """Converts a monster from the monsters.json format to the output.json format."""
    
    new_monster = {
        "name": monster.get("name", ""),
        "meta": f"{monster.get('size', '')} {monster.get('type', '')}, {monster.get('alignment', '')}".strip(),
        "Speed": monster.get("speed", ""),
        "Languages": monster.get("languages", "")
    }

    ac_info = monster.get("ac", {})
    ac_val = ac_info.get("value", "")
    ac_details = ac_info.get("details", "")
    new_monster["Armor Class"] = f"{ac_val} ({ac_details})" if ac_details else str(ac_val)

    hp_info = monster.get("hp", {})
    hp_avg = hp_info.get("average", "")
    hp_dice = hp_info.get("dice", "")
    new_monster["Hit Points"] = f"{hp_avg} ({hp_dice})" if hp_dice else str(hp_avg)

    scores = monster.get("ability_scores", {})
    for abl in ["str", "dex", "con", "int", "wis", "cha"]:
        score_val = scores.get(abl)
        if score_val is not None:
            new_monster[abl.upper()] = str(score_val)
            new_monster[f"{abl.upper()}_mod"] = get_mod_string(score_val)

    if monster.get("saving_throws"):
        new_monster["Saving Throws"] = ", ".join([f"{k.upper()} {v}" for k, v in monster["saving_throws"].items()])
    if monster.get("skills"):
        new_monster["Skills"] = ", ".join([f"{k} {v}" for k, v in monster["skills"].items()])
    if monster.get("senses"):
        senses_list = [f"{k.replace('_', ' ')} {v}" for k, v in monster["senses"].items()]
        new_monster["Senses"] = ", ".join(senses_list)

    for key, new_key in [("damage_immunities", "Damage Immunities"), ("condition_immunities", "Condition Immunities"), ("damage_resistances", "Damage Resistances"), ("damage_vulnerabilities", "Damage Vulnerabilities")]:
        if monster.get(key):
            new_monster[new_key] = monster[key]

    cr = monster.get("cr", "0")
    xp = CR_TO_XP.get(str(cr), 0)
    new_monster["Challenge"] = f"{cr} ({xp:,} XP)"

    if monster.get("traits"):
        new_monster["Traits"] = format_html_block(monster["traits"])
    if monster.get("actions"):
        new_monster["Actions"] = format_html_block(monster["actions"])
    if monster.get("legendary_actions"):
        intro = "The monster can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The monster regains spent legendary actions at the start of its turn."
        new_monster["Legendary Actions"] = format_html_block(monster["legendary_actions"], intro)
    if monster.get("reactions"):
        new_monster["Reactions"] = format_html_block(monster["reactions"])
    if monster.get("spellcasting"):
        new_monster["Traits"] = new_monster.get("Traits", "") + format_spellcasting_block(monster["spellcasting"])
        
    new_monster["img_url"] = ""

    return {k: v for k, v in new_monster.items() if v}

def main():
    """Main build function."""
    base_path = os.path.dirname(__file__)
    monsters_file = os.path.join(base_path, 'monsters.json')
    external_file = os.path.join(base_path, 'externalmonsters.json')
    output_file = os.path.join(base_path, 'output.json')

    print("Starting monster build process...")

    try:
        with open(monsters_file, 'r', encoding='utf-8') as f:
            main_monsters_data = json.load(f)
        print(f"Loaded {len(main_monsters_data)} monsters from {monsters_file}")
        converted_monsters = [convert_monster(monster) for monster in main_monsters_data.values()]
    except FileNotFoundError:
        print(f"Warning: Could not find {monsters_file}. Proceeding with external monsters only.")
        converted_monsters = []
    except json.JSONDecodeError as e:
        print(f"\nFATAL ERROR: Invalid JSON in '{monsters_file}'.")
        print(f"Build failed. Please fix the JSON syntax error and try again.")
        print(f"Details: {e}")
        sys.exit(1)

    try:
        with open(external_file, 'r', encoding='utf-8') as f:
            external_monsters_data = json.load(f)
        print(f"Loaded {len(external_monsters_data)} monsters from {external_file}")
    except FileNotFoundError:
        print(f"Info: No custom monsters found at {external_file}. This is normal if you haven't added any.")
        external_monsters_data = []
    except json.JSONDecodeError as e:
        print(f"\nFATAL ERROR: Invalid JSON in '{external_file}'.")
        print(f"This is the most likely cause of your custom monsters not appearing.")
        print(f"Build failed. Please fix the JSON syntax error and try again.")
        print(f"Details: {e}")
        sys.exit(1)

    # Use a dictionary to handle overrides, giving precedence to externalmonsters.json
    final_monster_dict = {monster['name']: monster for monster in converted_monsters}
    for monster in external_monsters_data:
        final_monster_dict[monster['name']] = monster

    final_monster_list = list(final_monster_dict.values())
    final_monster_list.sort(key=lambda x: x.get('name', ''))

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_monster_list, f, indent=2)
    print(f"Successfully wrote {len(final_monster_list)} monsters to {output_file}")

if __name__ == '__main__':
    main()
