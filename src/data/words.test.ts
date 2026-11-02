import { describe, expect, it } from "vitest";
import { checkExample } from "../../scripts/sentence-lib";
import { makeQuestion, sharesMeaning } from "../questions";
import { LEVELS, RETIRED_IDS, WORDS, bareWord, exampleParts, plainExample } from "./words";

describe("word ids", () => {
  it("never reuses a retired id", () => {
    const liveIds = new Set(WORDS.map((w) => w.id));
    for (const id of RETIRED_IDS) expect(liveIds.has(id), `${id} is retired`).toBe(false);
  });

  it("gives every word a different id", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
  });
});

describe("word list", () => {
  it("has words at every level", () => {
    for (const level of LEVELS) expect(WORDS.filter((w) => w.level === level).length, level).toBeGreaterThan(100);
  });

  // The generated JSON is only typed by a cast, so check the shape here.
  it("gives every word a valid level and all its text fields", () => {
    for (const w of WORDS) {
      expect(LEVELS, w.id).toContain(w.level);
      expect(w.spanish && w.meaning && w.example && w.exampleMeaning, w.id).toBeTruthy();
    }
  });
});

describe("example sentences", () => {
  // npm test alone should catch a broken sentence, not only npm run check-data.
  it("follow the sentence rules", () => {
    const problems = WORDS.flatMap((w) => checkExample(w.spanish, w).map((e) => `${w.id} ${w.spanish}: ${e}`));
    expect(problems).toEqual([]);
  });
});

describe("questions made from the real word list", () => {
  const TYPES = ["meaning", "spanish", "context", "blank"] as const;

  it("have four to six options and never a wrong option with the same meaning as the answer", () => {
    const problems: string[] = [];
    for (const level of LEVELS) {
      const pool = WORDS.filter((w) => w.level === level);
      for (const word of pool) {
        for (const type of TYPES) {
          const q = makeQuestion(type, word, pool, Math.random, 6);
          if (q.choices.length !== 6) problems.push(`${word.spanish} (${type}): ${q.choices.length} options`);
          for (const choice of q.choices) {
            const other = pool.find((w) => w.id === choice.wordId)!;
            if (other.id !== word.id && sharesMeaning(other, word)) {
              problems.push(`${word.spanish} (${type}): ${other.spanish} has the same meaning`);
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("example helpers", () => {
  it("splits a sentence around its marked form", () => {
    expect(exampleParts("Mi [casa] es pequeña.")).toEqual({ before: "Mi ", form: "casa", after: " es pequeña." });
  });

  it("removes the brackets for display", () => {
    expect(plainExample("Mi [casa] es pequeña.")).toBe("Mi casa es pequeña.");
  });

  it("removes only a leading article", () => {
    expect(bareWord("la casa")).toBe("casa");
    expect(bareWord("hablar")).toBe("hablar");
    expect(bareWord("lavar")).toBe("lavar");
  });
});
