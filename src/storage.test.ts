import { afterEach, describe, expect, it } from "vitest";
import { MAX_HP, emptyAdventure } from "./adventure";
import { loadProgress, resetProgress, sanitizeProgress, saveProgress, emptyProgress } from "./storage";

// Tests run in Node, which has no localStorage, so we provide a stand-in.
type FakeStorage = {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

function fakeStorage(store: FakeStorage) {
  (globalThis as { localStorage?: unknown }).localStorage = store;
}

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe("loadProgress", () => {
  it("fills in the adventure defaults for saves made before Adventure mode", () => {
    fakeStorage({ getItem: () => JSON.stringify({ version: 1, xp: 40, cards: {}, badges: [] }) });
    const progress = loadProgress();
    expect(progress.xp).toBe(40);
    expect(progress.adventure).toEqual(emptyAdventure());
  });

  it("gives a save from before the start level setting the level A1", () => {
    fakeStorage({ getItem: () => JSON.stringify({ version: 1, xp: 40, cards: {}, badges: [] }) });
    expect(loadProgress().startLevel).toBe("A1");
  });

  it("repairs broken adventure data without losing the rest of the save", () => {
    fakeStorage({
      getItem: () =>
        JSON.stringify({
          version: 1,
          xp: 40,
          cards: {},
          badges: [],
          adventure: { hp: "oops", items: { shield: -1 }, gold: -3, defeated: "slime" },
        }),
    });
    const progress = loadProgress();
    expect(progress.xp).toBe(40);
    expect(progress.adventure.hp).toBe(MAX_HP);
    expect(progress.adventure.items.shield).toBe(0);
    expect(progress.adventure.gold).toBe(0);
    expect(progress.adventure.defeated).toEqual([]);
  });

  it("starts fresh when no save exists yet", () => {
    fakeStorage({ getItem: () => null });
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("starts fresh when the save is from an older schema version", () => {
    fakeStorage({ getItem: () => JSON.stringify({ version: 0, xp: 99, cards: {}, badges: [] }) });
    expect(loadProgress().xp).toBe(0);
  });

  it("starts fresh when reading storage throws an error", () => {
    fakeStorage({
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("starts fresh when the saved text is not valid JSON", () => {
    fakeStorage({ getItem: () => "{not json" });
    expect(loadProgress()).toEqual(emptyProgress());
  });
});

describe("sanitizeProgress", () => {
  it("drops card entries whose scheduling fields are not numbers", () => {
    const clean = sanitizeProgress({
      cards: {
        "a1-0001": { ease: 2.5, interval: 1, reps: 1, due: 1000 },
        "a1-0002": { ease: 2.5, interval: 1, reps: 1, due: "soon" },
        "a1-0003": { ease: 2.5 },
        "a1-0004": null,
      } as unknown as Record<string, never>,
    });
    expect(Object.keys(clean.cards)).toEqual(["a1-0001"]);
  });

  it("replaces a non-numeric xp and a negative streak with safe values", () => {
    const clean = sanitizeProgress({ xp: "lots", streak: -4 } as never);
    expect(clean.xp).toBe(0);
    expect(clean.streak).toBe(0);
  });

  it("resets a daily goal outside the allowed range and rounds decimals", () => {
    expect(sanitizeProgress({ dailyGoal: 9999 } as never).dailyGoal).toBe(20);
    expect(sanitizeProgress({ dailyGoal: 30 } as never).dailyGoal).toBe(30);
    expect(sanitizeProgress({ dailyGoal: 20.6 } as never).dailyGoal).toBe(21);
  });

  it("clamps ease and drops negative intervals and unknown word ids", () => {
    // JSON.parse makes "__proto__" a real key, the way a saved file would contain it.
    const cards = JSON.parse(`{
      "a1-0001": { "ease": 0.5, "interval": -3, "reps": -1, "due": 1000 },
      "not-a-word": { "ease": 2.5, "interval": 1, "reps": 1, "due": 1000 },
      "__proto__": { "ease": 2.5, "interval": 1, "reps": 1, "due": 1000 }
    }`);
    const clean = sanitizeProgress({ cards } as never);
    expect(Object.keys(clean.cards)).toEqual(["a1-0001"]);
    expect(clean.cards["a1-0001"]).toEqual({ ease: 1.3, interval: 0, reps: 0, due: 1000 });
  });

  it("keeps a valid start level and repairs a broken one", () => {
    expect(sanitizeProgress({ startLevel: "B1" } as never).startLevel).toBe("B1");
    expect(sanitizeProgress({ startLevel: "C2" } as never).startLevel).toBe("A1");
    expect(sanitizeProgress({} as never).startLevel).toBe("A1");
  });
  it("keeps only string badge ids", () => {
    expect(sanitizeProgress({ badges: ["streak-7", 3, null] } as never).badges).toEqual(["streak-7"]);
  });
});

describe("saving and resetting", () => {
  it("saving does not throw when storage is full or blocked", () => {
    fakeStorage({
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });
    expect(() => saveProgress(emptyProgress())).not.toThrow();
  });

  it("reset returns fresh progress even when removing the save fails", () => {
    fakeStorage({
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(resetProgress()).toEqual(emptyProgress());
  });
});
