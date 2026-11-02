import { describe, expect, it } from "vitest";
import { LEVELS } from "./data/words";
import {
  MONSTERS,
  REGIONS,
  isMonsterUnlocked,
  isRegionUnlocked,
  latestUnlockedRegion,
  monsterById,
  regionMonsters,
  regionOf,
  unlockMessages,
} from "./world";

const [village, grove, sierra] = REGIONS;
const monster = (id: string) => monsterById(id)!;

describe("world data", () => {
  it("has unique monster and region ids", () => {
    expect(new Set(MONSTERS.map((m) => m.id)).size).toBe(MONSTERS.length);
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length);
  });

  it("places every monster in exactly one region, matching its regionId", () => {
    for (const m of MONSTERS) {
      const homes = REGIONS.filter((r) => regionMonsters(r).includes(m));
      expect(homes).toEqual([regionOf(m)]);
    }
  });

  it("gives each region one boss, listed as its bossId", () => {
    for (const r of REGIONS) {
      const bosses = regionMonsters(r).filter((m) => m.boss);
      expect(bosses.map((m) => m.id)).toEqual([r.bossId]);
    }
  });

  it("makes each region at least as hard as the one before it", () => {
    for (let i = 1; i < REGIONS.length; i++) {
      expect(LEVELS.indexOf(REGIONS[i].level)).toBeGreaterThanOrEqual(LEVELS.indexOf(REGIONS[i - 1].level));
      expect(REGIONS[i].questionTypes.length).toBeGreaterThan(REGIONS[i - 1].questionTypes.length);
    }
  });

  it("gives every monster positive HP, XP and gold", () => {
    for (const m of MONSTERS) {
      expect(m.hp).toBeGreaterThan(0);
      expect(m.xp).toBeGreaterThan(0);
      expect(m.gold).toBeGreaterThan(0);
    }
  });
});

describe("unlocking", () => {
  it("starts with only the first region open", () => {
    expect(REGIONS.map((r) => isRegionUnlocked(r, []))).toEqual([true, false, false, false]);
    expect(latestUnlockedRegion([])).toBe(village);
  });

  it("opens the next region when the previous boss is defeated", () => {
    const defeated = ["slime", "wolf", "bull"];
    expect(isRegionUnlocked(grove, defeated)).toBe(true);
    expect(isRegionUnlocked(sierra, defeated)).toBe(false);
    expect(latestUnlockedRegion(defeated)).toBe(grove);
  });

  it("locks a boss until the other monsters in its region are beaten", () => {
    expect(isMonsterUnlocked(monster("bull"), [])).toBe(false);
    expect(isMonsterUnlocked(monster("bull"), ["slime"])).toBe(false);
    expect(isMonsterUnlocked(monster("bull"), ["slime", "wolf"])).toBe(true);
  });

  it("locks every monster in a locked region", () => {
    expect(isMonsterUnlocked(monster("fox"), [])).toBe(false);
    expect(isMonsterUnlocked(monster("fox"), ["bull"])).toBe(true);
  });
});

describe("unlock messages", () => {
  it("announces a boss once the other monsters in its region are beaten", () => {
    expect(unlockMessages(["slime"], ["slime", "wolf"])).toEqual(["Čeká na tebe boss: Býk z Pamplony!"]);
  });

  it("announces the next region after its boss falls", () => {
    expect(unlockMessages(["slime", "wolf"], ["slime", "wolf", "bull"])).toEqual(["Nový kraj odemčen: Olivový háj!"]);
  });

  it("says nothing when nothing new opened", () => {
    expect(unlockMessages([], ["slime"])).toEqual([]);
    expect(unlockMessages(["slime"], ["slime"])).toEqual([]);
  });
});
