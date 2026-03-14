import json
import os
from combatant import Combatant

class Encounter:
    """Manages the entire encounter, including combatants, turn order, and state."""
    def __init__(self, monster_db_path='monsters.json'):
        self.combatants = []
        self.turn_order = []
        self.current_turn_index = -1
        self.round_number = 0
        self.monster_stats = self._load_monster_stats(monster_db_path)
        self.monster_counts = {}

    def _load_monster_stats(self, db_path):
        if not os.path.exists(db_path):
            print(f"Warning: Monster database '{db_path}' not found.")
            return {}
        try:
            with open(db_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error: Could not parse monster database '{db_path}'.")
            return {}

    def add_player(self, name, max_hp):
        if self._find_combatant(name):
            print(f"Error: A combatant with the name '{name}' already exists.")
            return
        player = Combatant(name, max_hp, is_player=True)
        self.combatants.append(player)
        print(f"Added player: {name}")

    def add_monster(self, monster_type):
        monster_type_capitalized = monster_type.capitalize()
        if monster_type_capitalized not in self.monster_stats:
            print(f"Error: Monster type '{monster_type}' not found in the database.")
            return

        # Generate a unique name for the monster (e.g., Goblin 1, Goblin 2)
        count = self.monster_counts.get(monster_type_capitalized, 0) + 1
        self.monster_counts[monster_type_capitalized] = count
        name = f"{monster_type_capitalized} {count}"

        stats = self.monster_stats[monster_type_capitalized]
        monster = Combatant(name, stats['hp'])
        self.combatants.append(monster)
        print(f"Added monster: {name}")

    def _find_combatant(self, name):
        # Case-insensitive search for convenience
        for c in self.combatants:
            if c.name.lower() == name.lower():
                return c
        return None

    def set_initiatives(self):
        print("\n--- Enter Initiative Rolls ---")
        for combatant in self.combatants:
            while True:
                try:
                    roll = input(f"  Initiative for {combatant.name}: ")
                    combatant.set_initiative(int(roll))
                    break
                except ValueError:
                    print("  Invalid input. Please enter a number.")

    def start(self):
        if not self.combatants:
            print("Cannot start encounter. No combatants have been added.")
            return False
        
        # Sort by initiative (descending), then by name (for ties)
        self.turn_order = sorted(self.combatants, key=lambda c: (c.initiative, c.name), reverse=True)
        self.current_turn_index = -1
        self.round_number = 1
        print("\n" + "="*30)
        print("--- Encounter Started! ---")
        print("="*30)
        self.display_status()
        self.next_turn()
        return True

    def next_turn(self):
        self.current_turn_index += 1
        if self.current_turn_index >= len(self.turn_order):
            self.current_turn_index = 0
            self.round_number += 1
            print(f"\n--- Round {self.round_number} ---")

        current_combatant = self.turn_order[self.current_turn_index]
        print(f"\n>>> It is now {current_combatant.name}'s turn. <<<")

    def display_status(self):
        print("\n--- Encounter Status ---")
        for combatant in self.turn_order:
            print(combatant)
        print("------------------------")

    def run_command(self, command_string):
        parts = command_string.strip().split()
        if not parts:
            return True # Continue running

        command = parts[0].lower()

        # Commands that take a name and one value (e.g., damage <name> <amount>)
        if command in ['d', 'damage', 'h', 'heal', 'c', 'condition', 'rc', 'remove_condition']:
            if len(parts) < 3:
                print(f"Usage: {command} <name> <value>")
                return True
            
            value = parts[-1]
            name = " ".join(parts[1:-1])
            combatant = self._find_combatant(name)

            if not combatant:
                print(f"Combatant '{name}' not found.")
                return True

            if command in ['d', 'damage']: combatant.take_damage(value)
            elif command in ['h', 'heal']: combatant.heal(value)
            elif command in ['c', 'condition']: combatant.add_condition(value)
            elif command in ['rc', 'remove_condition']: combatant.remove_condition(value)

        elif command in ['n', 'next']:
            self.next_turn()
        elif command in ['s', 'status']:
            self.display_status()
        elif command in ['q', 'quit', 'exit']:
            print("Exiting encounter tracker.")
            return False # Stop running
        elif command in ['help']:
            self._print_help(in_combat=True)
        else:
            print(f"Unknown command: '{command}'. Type 'help' for a list of commands.")
        
        return True

    def _print_help(self, in_combat=False):
        print("\n--- Available Commands ---")
        if not in_combat:
            print("  add player <Name> <MaxHP>    - Add a player character")
            print("  add monster <type> [count]   - Add monster(s) (e.g., 'add monster goblin 3')")
            print("  init                         - Enter initiative for all combatants")
            print("  start                        - Start the encounter")
        else:
            print("  n, next                      - Advance to the next turn")
            print("  d, damage <name> <amount>    - Deal damage to a combatant")
            print("  h, heal <name> <amount>      - Heal a combatant")
            print("  c, condition <name> <cond>   - Add a condition to a combatant")
            print("  rc, remove_condition <name> <cond> - Remove a condition")
            print("  s, status                    - Display the current encounter status")
        print("  help                         - Show this help message")
        print("  q, quit, exit                - Exit the program")
        print("--------------------------")

def main_loop():
    """Main application loop for setting up and running the encounter."""
    print("Welcome to the Encounter Tracker!")
    encounter = Encounter()
    in_combat = False

    while True:
        try:
            prompt = f"Round {encounter.round_number} > " if in_combat else "Setup > "
            cmd_str = input(prompt)

            if in_combat:
                if not encounter.run_command(cmd_str): break
            else: # Setup phase
                parts = cmd_str.strip().split()
                if not parts: continue
                command = parts[0].lower()

                if command == 'add' and len(parts) > 2:
                    if parts[1].lower() == 'player' and len(parts) == 4:
                        encounter.add_player(parts[2].capitalize(), parts[3])
                    elif parts[1].lower() == 'monster':
                        count = int(parts[3]) if len(parts) == 4 else 1
                        for _ in range(count):
                            encounter.add_monster(parts[2])
                elif command == 'init': encounter.set_initiatives()
                elif command == 'start':
                    if encounter.start(): in_combat = True
                elif command == 'help': encounter._print_help()
                elif command in ['q', 'quit', 'exit']: break
                else: print("Unknown command or wrong format. Type 'help'.")

        except (EOFError, KeyboardInterrupt):
            print("\nExiting.")
            break

if __name__ == "__main__":
    main_loop()