import { describe, expect, it } from "vitest";
import type { Word } from "./data/words";
import {
  BLANK,
  HINT_REMOVES,
  choicesAfterHint,
  isCorrect,
  kindOf,
  makeQuestion,
  pickQuestionType,
  sharesMeaning,
  type Question,
  type QuestionType,
} from "./questions";

const word = (n: number, overrides: Partial<Word> = {}): Word => ({
  id: `test-${n}`,
  spanish: `la cosa${n}`,
  meaning: `význam ${n}`,
  example: `Tengo [cosas${n}] aquí.`,
  exampleMeaning: `Mám tu věci ${n}.`,
  level: "A1",
  ...overrides,
});

const pool = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => word(n));
const labels = (q: Question) => q.choices.map((c) => c.label);
const ALL_TYPES: QuestionType[] = ["meaning", "spanish", "context", "blank"];

describe("every question type", () => {
  for (const type of ALL_TYPES) {
    it(`${type}: 4 different options, exactly one of them correct`, () => {
      const q = makeQuestion(type, pool[0], pool);
      expect(q.type).toBe(type);
      expect(q.choices).toHaveLength(4);
      expect(new Set(labels(q)).size).toBe(4);
      expect(q.choices.filter((c) => isCorrect(q, c.wordId))).toHaveLength(1);
    });
  }

  it("can offer six options for a confusing monster", () => {
    expect(makeQuestion("meaning", pool[0], pool, Math.random, 6).choices).toHaveLength(6);
  });
});

describe("what each type shows", () => {
  it("meaning: shows the Spanish word, options are Czech meanings", () => {
    const q = makeQuestion("meaning", pool[0], pool);
    expect(q.prompt).toBe("la cosa1");
    expect(q.choices.find((c) => c.wordId === "test-1")).toEqual({ wordId: "test-1", label: "význam 1" });
  });

  it("spanish: shows the meaning, options are Spanish words with articles", () => {
    const q = makeQuestion("spanish", pool[0], pool);
    expect(q.prompt).toBe("význam 1");
    expect(q.choices.find((c) => c.wordId === "test-1")).toEqual({ wordId: "test-1", label: "la cosa1" });
  });

  it("context: shows the sentence with the marked word, options are meanings", () => {
    const q = makeQuestion("context", pool[0], pool);
    expect(q.prompt).toBe("Tengo [cosas1] aquí.");
    expect(q.choices.find((c) => c.wordId === "test-1")?.label).toBe("význam 1");
  });

  it("blank: shows the example with a gap, options have no article", () => {
    const q = makeQuestion("blank", pool[0], pool);
    expect(q.prompt).toBe(`Tengo ${BLANK} aquí.`);
    expect(q.choices.find((c) => c.wordId === "test-1")?.label).toBe("cosa1");
  });
});

describe("no second right answer", () => {
  it("meaning: never shows the same meaning twice", () => {
    const repeats = [word(1), word(2, { meaning: "význam 1" }), word(3, { meaning: "stejný" }), word(4, { meaning: "stejný" }), word(5)];
    const q = makeQuestion("meaning", repeats[0], repeats);
    expect(new Set(labels(q)).size).toBe(q.choices.length);
    expect(q.choices.map((c) => c.wordId)).not.toContain("test-2");
  });

  it("spanish and blank: leave out other words with the same meaning", () => {
    const synonyms = [word(1), word(2, { meaning: "význam 1" }), word(3), word(4), word(5)];
    for (const type of ["spanish", "blank"] as const) {
      const q = makeQuestion(type, synonyms[0], synonyms);
      expect(q.choices.map((c) => c.wordId)).not.toContain("test-2");
    }
  });

  it("a small pool gives fewer options rather than a wrong one", () => {
    const only = word(1);
    expect(makeQuestion("meaning", only, [only]).choices).toEqual([{ wordId: "test-1", label: "význam 1" }]);
  });
});

describe("shared meanings", () => {
  const send = [word(1, { meaning: "poslat" }), word(2, { meaning: "poslat, nařídit" }), word(3), word(4), word(5)];

  it("sees a meaning that is one of several", () => {
    expect(sharesMeaning(send[0], send[1])).toBe(true);
    expect(sharesMeaning(send[0], send[2])).toBe(false);
  });

  it("ignores notes in brackets", () => {
    expect(sharesMeaning(word(1, { meaning: "ženatý (casada = vdaná)" }), word(2, { meaning: "vdaná" }))).toBe(false);
  });

  it("never offers a word with a shared meaning as a wrong option", () => {
    for (const type of ALL_TYPES) {
      const q = makeQuestion(type, send[0], send);
      expect(q.choices.map((c) => c.wordId), type).not.toContain("test-2");
    }
  });
});

describe("gap questions", () => {
  const nouns = [1, 2, 3, 4].map((n) => word(n));
  const verbs = [word(5, { spanish: "hablar" }), word(6, { spanish: "comer" }), word(7, { spanish: "vivir" })];

  it("takes the wrong options from other kinds of word first", () => {
    const q = makeQuestion("blank", nouns[0], [...nouns, ...verbs]);
    const wrong = q.choices.filter((c) => c.wordId !== "test-1").map((c) => c.wordId);
    expect(wrong.sort()).toEqual(["test-5", "test-6", "test-7"]);
  });

  it("falls back to the same kind when there are not enough others", () => {
    const q = makeQuestion("blank", nouns[0], [...nouns, verbs[0]]);
    expect(q.choices).toHaveLength(4);
  });

  it("drops an option that looks the same without its article", () => {
    const morning = word(1, { spanish: "la mañana", meaning: "ráno" });
    const tomorrow = word(2, { spanish: "mañana", meaning: "zítra" });
    const q = makeQuestion("blank", morning, [morning, tomorrow, word(3), word(4), word(5)]);
    expect(q.choices.map((c) => c.wordId)).not.toContain("test-2");
  });
});

describe("kind of word", () => {
  const kind = (spanish: string) => kindOf(word(1, { spanish }));

  it("tells nouns, verbs and the rest apart", () => {
    expect(kind("la casa")).toBe("noun");
    expect(kind("hablar")).toBe("verb");
    expect(kind("levantarse")).toBe("verb");
    expect(kind("darse cuenta")).toBe("verb");
    expect(kind("grande")).toBe("other");
  });

  it("does not take words ending in -er or -ar for verbs by mistake", () => {
    for (const spanish of ["ayer", "anteayer", "regular", "cualquier"]) expect(kind(spanish)).toBe("other");
  });
});

describe("picking a question type", () => {
  it("picks from the allowed types", () => {
    expect(pickQuestionType(ALL_TYPES, () => 0)).toBe("meaning");
    expect(pickQuestionType(ALL_TYPES, () => 0.99)).toBe("blank");
  });
});

describe("hints", () => {
  it("removes two wrong answers and keeps the correct one", () => {
    const q = makeQuestion("spanish", pool[0], pool);
    const left = choicesAfterHint(q);
    expect(left).toHaveLength(q.choices.length - HINT_REMOVES);
    expect(left.some((c) => isCorrect(q, c.wordId))).toBe(true);
  });

  it("leaves four options when a confusing monster offered six", () => {
    const q = makeQuestion("meaning", pool[0], pool, Math.random, 6);
    expect(q.choices).toHaveLength(6);
    const left = choicesAfterHint(q);
    expect(left).toHaveLength(4);
    expect(left.some((c) => isCorrect(q, c.wordId))).toBe(true);
  });

  it("never removes the correct answer, even with few options", () => {
    const small = [word(1), word(2)];
    const q = makeQuestion("meaning", small[0], small);
    expect(choicesAfterHint(q).map((c) => c.wordId)).toEqual(["test-1"]);
  });
});
