#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"

ROOT = File.expand_path("..", __dir__)
SRC = File.join(ROOT, "data", "equipment.json")
DEST = File.join(ROOT, "data", "equipment.v1.json")

def item_id(index)
  "equip:#{index}"
end

def build_contents(contents)
  return [] unless contents.is_a?(Array) && !contents.empty?

  contents.map do |entry|
    ref = entry.dig("item", "index")
    {
      "item" => ref ? item_id(ref) : nil,
      "name" => entry.dig("item", "name"),
      "quantity" => entry["quantity"]
    }.compact
  end
end

def build_weapon(item)
  return nil unless item["weapon_category"]

  {
    "category" => item["weapon_category"],
    "range" => item["weapon_range"],
    "category_range" => item["category_range"],
    "damage" => {
      "dice" => item.dig("damage", "damage_dice"),
      "type" => item.dig("damage", "damage_type", "name")
    }.compact,
    "range_values" => item["range"],
    "properties" => (item["properties"] || []).map { |prop| prop["name"] }
  }.compact
end

def build_armor(item)
  return nil unless item["armor_category"]

  armor_class = item["armor_class"] || {}
  {
    "category" => item["armor_category"],
    "ac" => armor_class["base"],
    "dex_bonus" => armor_class["dex_bonus"],
    "dex_max" => armor_class["max_bonus"],
    "str_min" => item["str_minimum"],
    "stealth_disadvantage" => !!item["stealth_disadvantage"],
    "shield" => item["armor_category"].to_s.downcase == "shield"
  }.compact
end

def build_tool(item)
  return nil unless item["tool_category"]

  { "category" => item["tool_category"] }
end

def build_desc(item)
  desc = []
  desc.concat(item["desc"]) if item["desc"].is_a?(Array)
  desc.concat(item["special"]) if item["special"].is_a?(Array)
  desc
end

items = JSON.parse(File.read(SRC))

v1 = {
  "schema_version" => "1.0",
  "equipment" => items.map do |item|
    {
      "id" => item_id(item["index"]),
      "key" => item["index"],
      "name" => item["name"],
      "source" => {
        "book" => item.dig("source", "book"),
        "page" => item.dig("source", "page")
      }.compact,
      "category" => {
        "id" => item.dig("equipment_category", "index"),
        "name" => item.dig("equipment_category", "name")
      }.compact,
      "cost" => item["cost"],
      "weight" => item["weight"],
      "desc" => build_desc(item),
      "contents" => build_contents(item["contents"]),
      "weapon" => build_weapon(item),
      "armor" => build_armor(item),
      "tool" => build_tool(item)
    }.compact
  end,
  "modifiers" => [
    { "id" => "mod:magic:+1", "key" => "+1", "name" => "+1", "bonus" => 1, "type" => "magic" },
    { "id" => "mod:magic:+2", "key" => "+2", "name" => "+2", "bonus" => 2, "type" => "magic" },
    { "id" => "mod:magic:+3", "key" => "+3", "name" => "+3", "bonus" => 3, "type" => "magic" }
  ]
}

File.write(DEST, JSON.pretty_generate(v1))
puts "Wrote #{DEST}"
