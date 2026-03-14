class Combatant:
    """Represents a single participant in an encounter."""
    def __init__(self, name, max_hp, is_player=False):
        self.name = name
        self.max_hp = int(max_hp)
        self.current_hp = int(max_hp)
        self.initiative = 0
        self.conditions = set()
        self.is_player = is_player

    def set_initiative(self, initiative_roll):
        self.initiative = int(initiative_roll)

    def take_damage(self, amount):
        self.current_hp -= int(amount)
        if self.current_hp < 0:
            self.current_hp = 0
        print(f"{self.name} takes {amount} damage. Current HP: {self.current_hp}/{self.max_hp}")

    def heal(self, amount):
        self.current_hp += int(amount)
        if self.current_hp > self.max_hp:
            self.current_hp = self.max_hp
        print(f"{self.name} heals for {amount}. Current HP: {self.current_hp}/{self.max_hp}")

    def add_condition(self, condition):
        self.conditions.add(condition.lower())
        print(f"{self.name} is now {condition}.")

    def remove_condition(self, condition):
        if condition.lower() in self.conditions:
            self.conditions.remove(condition.lower())
            print(f"{self.name} is no longer {condition}.")
        else:
            print(f"{self.name} is not affected by {condition}.")

    def __str__(self):
        status = "DOWN" if self.current_hp == 0 else "UP"
        condition_str = f"| Conditions: {', '.join(sorted(list(self.conditions)))}" if self.conditions else ""
        return f"-> {self.name:<15} | HP: {self.current_hp:>2}/{self.max_hp:<2} | Init: {self.initiative:<2} | Status: {status} {condition_str}"