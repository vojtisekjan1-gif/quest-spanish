// The Adventure world: regions, their monsters and the order they unlock in.
// Pure data and functions only. Battle rules are in adventure.ts.

import type { Level } from "./data/words";
import type { QuestionType } from "./questions";

// Special rules a monster can bring to a fight (applied in adventure.ts).
export type AbilityId = "fierce" | "armored" | "regen" | "confusing";

export const ABILITIES: Record<AbilityId, { name: string; description: string }> = {
  fierce: { name: "Zuřivý", description: "Špatná odpověď stojí 2 HP." },
  armored: { name: "Obrněný", description: "Zbroj zastaví tvůj první zásah." },
  regen: { name: "Regeneruje", description: "Když se spleteš, vyléčí si 1 HP." },
  confusing: { name: "Matoucí", description: "Nabízí šest odpovědí místo čtyř." },
};

export interface Monster {
  id: string; // saved in AdventureState.defeated, so never rename or reuse one
  name: string;
  regionId: string;
  boss: boolean;
  hp: number; // correct answers needed to defeat it
  xp: number; // XP reward for the first win
  gold: number; // gold reward for the first win
  abilities: AbilityId[];
}

export interface Region {
  id: string;
  name: string;
  level: Level; // which level its questions come from
  questionTypes: QuestionType[]; // the kinds of question its monsters ask
  monsterIds: string[]; // the normal monsters, in the order they are shown
  bossId: string; // unlocks once every normal monster here is defeated
}

export const MONSTERS: Monster[] = [
  // Bílá vesnice
  { id: "slime", name: "Sliz Ser-Estar", regionId: "village", boss: false, hp: 3, xp: 20, gold: 10, abilities: [] },
  { id: "wolf", name: "Přízvukový vlk", regionId: "village", boss: false, hp: 5, xp: 35, gold: 15, abilities: [] },
  { id: "bull", name: "Býk z Pamplony", regionId: "village", boss: true, hp: 7, xp: 50, gold: 30, abilities: ["fierce"] },
  // Olivový háj
  { id: "fox", name: "Liška Por-Para", regionId: "grove", boss: false, hp: 5, xp: 40, gold: 15, abilities: ["confusing"] },
  { id: "turtle", name: "Kamenná želva", regionId: "grove", boss: false, hp: 6, xp: 45, gold: 20, abilities: ["armored"] },
  { id: "tarasca", name: "Tarasca", regionId: "grove", boss: true, hp: 9, xp: 70, gold: 40, abilities: ["fierce", "regen"] },
  // Sierra Nevada
  { id: "stork", name: "Čáp hádankář", regionId: "sierra", boss: false, hp: 6, xp: 50, gold: 20, abilities: ["confusing"] },
  { id: "bat", name: "Inkoustový netopýr", regionId: "sierra", boss: false, hp: 6, xp: 50, gold: 20, abilities: ["fierce"] },
  { id: "dragon", name: "Drak svatého Jiří", regionId: "sierra", boss: true, hp: 10, xp: 80, gold: 50, abilities: ["fierce", "armored"] },
  // Alhambra
  { id: "guard", name: "Strážce brány", regionId: "alhambra", boss: false, hp: 7, xp: 60, gold: 25, abilities: ["armored"] },
  { id: "mirror", name: "Zrcadlový duch", regionId: "alhambra", boss: false, hp: 7, xp: 60, gold: 25, abilities: ["regen"] },
  { id: "sultan", name: "Stínový sultán", regionId: "alhambra", boss: true, hp: 12, xp: 100, gold: 60, abilities: ["confusing", "regen"] },
];

// In unlock order. Each region opens once the boss of the one before it is defeated.
export const REGIONS: Region[] = [
  { id: "village", name: "Bílá vesnice", level: "A1", questionTypes: ["meaning"], monsterIds: ["slime", "wolf"], bossId: "bull" },
  { id: "grove", name: "Olivový háj", level: "A2", questionTypes: ["meaning", "spanish"], monsterIds: ["fox", "turtle"], bossId: "tarasca" },
  { id: "sierra", name: "Sierra Nevada", level: "B1", questionTypes: ["meaning", "spanish", "context"], monsterIds: ["stork", "bat"], bossId: "dragon" },
  { id: "alhambra", name: "Alhambra", level: "B1", questionTypes: ["meaning", "spanish", "context", "blank"], monsterIds: ["guard", "mirror"], bossId: "sultan" },
];

export function monsterById(id: string): Monster | undefined {
  return MONSTERS.find((m) => m.id === id);
}

export function regionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

// The region a monster lives in. Every monster has one (world.test.ts checks this).
export function regionOf(monster: Monster): Region {
  return regionById(monster.regionId)!;
}

// The monsters of a region: the normal ones first, then the boss.
export function regionMonsters(region: Region): Monster[] {
  return [...region.monsterIds, region.bossId].map((id) => monsterById(id)!);
}

// A region opens once the boss of the region before it is defeated.
export function isRegionUnlocked(region: Region, defeated: string[]): boolean {
  const index = REGIONS.indexOf(region);
  if (index <= 0) return true;
  return defeated.includes(REGIONS[index - 1].bossId);
}

// A boss waits until the other monsters in its region are beaten.
export function isMonsterUnlocked(monster: Monster, defeated: string[]): boolean {
  if (defeated.includes(monster.id)) return true;
  const region = regionOf(monster);
  if (!isRegionUnlocked(region, defeated)) return false;
  if (!monster.boss) return true;
  return region.monsterIds.every((id) => defeated.includes(id));
}

// The furthest region the player can enter: where the map opens.
export function latestUnlockedRegion(defeated: string[]): Region {
  const open = REGIONS.filter((r) => isRegionUnlocked(r, defeated));
  return open[open.length - 1];
}

// Messages for what a win just opened up: a new region, or a boss that now
// accepts a challenge. `before` and `after` are the defeated lists around the win.
export function unlockMessages(before: string[], after: string[]): string[] {
  const messages: string[] = [];
  for (const region of REGIONS) {
    if (!isRegionUnlocked(region, before) && isRegionUnlocked(region, after)) {
      messages.push(`Nový kraj odemčen: ${region.name}!`);
    }
    const boss = monsterById(region.bossId)!;
    if (!isMonsterUnlocked(boss, before) && isMonsterUnlocked(boss, after)) {
      messages.push(`Čeká na tebe boss: ${boss.name}!`);
    }
  }
  return messages;
}
