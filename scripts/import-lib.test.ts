import { describe, expect, it } from "vitest";
import type { Word } from "../src/data/words";
import { assignIds, missingIds, parseLevelFile, type Entry } from "./import-lib";

const entry = (spanish: string, level: Entry["level"] = "A1"): Entry => ({
  spanish,
  meaning: "význam",
  level,
  example: `Hola [${spanish}].`,
  exampleMeaning: "Ahoj.",
});
const word = (id: string, spanish: string, level: Entry["level"] = "A1"): Word => ({ id, ...entry(spanish, level) });

describe("parseLevelFile", () => {
  it("reads the four parts of a line and skips titles and empty lines", () => {
    const text = "# Rodina\n\nla casa|dům|Mi [casa] es pequeña.|Můj dům je malý.\r\n";
    expect(parseLevelFile(text, "A1")).toEqual([
      { spanish: "la casa", meaning: "dům", level: "A1", example: "Mi [casa] es pequeña.", exampleMeaning: "Můj dům je malý." },
    ]);
  });

  it("names the line of a broken entry", () => {
    expect(() => parseLevelFile("la casa|dům", "A2")).toThrow("A2, line 1");
  });
});

describe("assignIds", () => {
  it("numbers new words per level", () => {
    const ids = assignIds([entry("uno"), entry("dos", "A2"), entry("tres")], [], []).map((w) => w.id);
    expect(ids).toEqual(["a1-0001", "a2-0001", "a1-0002"]);
  });

  it("keeps the id of a known word, even when the order changes", () => {
    const existing = [word("a1-0001", "uno"), word("a1-0002", "dos")];
    const ids = assignIds([entry("dos"), entry("uno")], existing, []).map((w) => w.id);
    expect(ids).toEqual(["a1-0002", "a1-0001"]);
  });

  it("never reuses the number of a retired word", () => {
    const existing = [word("a1-0001", "uno")];
    expect(assignIds([entry("uno"), entry("nuevo")], existing, ["a1-0005"])[1].id).toBe("a1-0006");
    expect(assignIds([entry("uno"), entry("nuevo")], existing, ["a1-0002"])[1].id).toBe("a1-0003");
  });

  it("gives a word that changed level a new id with the right prefix", () => {
    expect(assignIds([entry("uno", "A2")], [word("a1-0001", "uno")], [])[0].id).toBe("a2-0001");
  });

  it("refuses the same word twice", () => {
    expect(() => assignIds([entry("uno"), entry("uno", "B1")], [], [])).toThrow("Duplicate word: uno");
  });
});

describe("missingIds", () => {
  const existing = [word("a1-0001", "uno"), word("a1-0002", "dos")];

  it("finds the id of a word that was removed", () => {
    const words = assignIds([entry("uno")], existing, []);
    expect(missingIds(existing, words, [])).toEqual(["a1-0002"]);
  });

  it("finds the id of a word whose Spanish form was changed", () => {
    const words = assignIds([entry("uno"), entry("el dos")], existing, []);
    expect(missingIds(existing, words, [])).toEqual(["a1-0002"]);
  });

  it("accepts a removal that is listed as retired", () => {
    const words = assignIds([entry("uno")], existing, ["a1-0002"]);
    expect(missingIds(existing, words, ["a1-0002"])).toEqual([]);
  });

  it("finds nothing when no word was lost", () => {
    expect(missingIds(existing, assignIds([entry("dos"), entry("uno")], existing, []), [])).toEqual([]);
  });
});
