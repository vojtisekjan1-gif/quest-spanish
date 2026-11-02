import { describe, expect, it } from "vitest";
import type { Level, Word } from "./data/words";
import { newCard, review } from "./srs";
import { SESSION_SIZE, buildStudyQueue, dueStudyWords } from "./study";

const NOW = 1_000_000;

function word(id: string, level: Level = "A1"): Word {
  return { id, spanish: id, meaning: id, level, example: `[${id}].`, exampleMeaning: "Věta." };
}

describe("study words", () => {
  it("counts new words as due and skips words reviewed for later", () => {
    const later = review(newCard(NOW), "good", NOW); // due again in 1 day
    expect(dueStudyWords([word("a"), word("b")], { a: later }, NOW).map((w) => w.id)).toEqual(["b"]);
  });

  it("keeps a session to the session size", () => {
    const many = Array.from({ length: SESSION_SIZE + 5 }, (_, i) => word(`w${i}`));
    expect(buildStudyQueue(many, {}, NOW)).toHaveLength(SESSION_SIZE);
  });
});

describe("levels", () => {
  const mixed = [word("b1", "B1"), word("a2", "A2"), word("a1", "A1")];

  it("teaches A1 before A2 and A2 before B1", () => {
    expect(buildStudyQueue(mixed, {}, NOW, 1).map((w) => w.id)).toEqual(["a1"]);
    expect(buildStudyQueue(mixed, {}, NOW, 2).map((w) => w.id).sort()).toEqual(["a1", "a2"]);
  });

  it("starts new words at the chosen level", () => {
    const queue = buildStudyQueue(mixed, {}, NOW, SESSION_SIZE, Math.random, "A2");
    expect(queue.map((w) => w.id).sort()).toEqual(["a2", "b1"]);
  });

  it("keeps reviewing a studied word below the start level", () => {
    const due = dueStudyWords(mixed, { a1: newCard(0) }, NOW, "B1");
    expect(due.map((w) => w.id).sort()).toEqual(["a1", "b1"]);
  });
});

describe("a backlog of reviews", () => {
  it("takes the reviews that have waited longest", () => {
    const many = Array.from({ length: SESSION_SIZE + 5 }, (_, i) => word(`w${String(i).padStart(2, "0")}`));
    // w00 has waited longest, w14 the least.
    const cards = Object.fromEntries(many.map((w, i) => [w.id, { ...newCard(0), due: i * 1000 }]));
    const queue = buildStudyQueue(many, cards, NOW);
    expect(queue.map((w) => w.id).sort()).toEqual(many.slice(0, SESSION_SIZE).map((w) => w.id));
  });
});

describe("random order", () => {
  const many = Array.from({ length: 30 }, (_, i) => word(`w${String(i).padStart(2, "0")}`));
  // Always picking 0 moves each word to the front in turn, so the order is no longer alphabetical.
  const alwaysZero = () => 0;

  it("does not take the first words alphabetically", () => {
    const queue = buildStudyQueue(many, {}, NOW, SESSION_SIZE, alwaysZero);
    const firstTen = many.slice(0, SESSION_SIZE).map((w) => w.id);
    expect(queue.map((w) => w.id).sort()).not.toEqual(firstTen);
  });

  it("puts due reviews in the session before new words", () => {
    // w29 is last alphabetically and would never be reached without this rule.
    const cards = { w29: newCard(0) };
    const queue = buildStudyQueue(many, cards, NOW, SESSION_SIZE, alwaysZero);
    expect(queue.map((w) => w.id)).toContain("w29");
  });

  it("fills a whole session with reviews when that many are due", () => {
    const cards = Object.fromEntries(many.slice(0, SESSION_SIZE + 2).map((w) => [w.id, newCard(0)]));
    const queue = buildStudyQueue(many, cards, NOW, SESSION_SIZE, alwaysZero);
    expect(queue.every((w) => cards[w.id])).toBe(true);
  });
});
