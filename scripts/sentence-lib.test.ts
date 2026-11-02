import { describe, expect, it } from "vitest";
import { checkExample, countForm, leakedStem } from "./sentence-lib";

const good = { example: "Mi [casa] es pequeña.", exampleMeaning: "Můj dům je malý." };

describe("example sentences", () => {
  it("accepts a good sentence", () => {
    expect(checkExample("la casa", good)).toEqual([]);
  });

  it("accepts a conjugated verb and an inverted question", () => {
    expect(checkExample("ir", { example: "¿Adónde [vas] hoy?", exampleMeaning: "Kam dnes jdeš?" })).toEqual([]);
  });

  it("needs exactly one marked form", () => {
    expect(checkExample("la casa", { ...good, example: "Mi casa es pequeña." })).toHaveLength(1);
    expect(checkExample("la casa", { ...good, example: "[Mi] [casa] es pequeña." })).toHaveLength(1);
  });

  it("rejects a form that appears twice, which would give the answer away", () => {
    const repeated = { ...good, example: "Mi [casa] es tu casa." };
    expect(checkExample("la casa", repeated)[0]).toContain("more than once");
  });

  it("rejects a marked form that is clearly another word", () => {
    const wrong = { ...good, example: "Mi casa es [pequeña]." };
    expect(checkExample("la casa", wrong)[0]).toContain("does not look like");
  });

  it("does not mistake a noun ending in -ar for a verb", () => {
    const wrong = { example: "Es un [sitio] bonito.", exampleMeaning: "Je to hezké místo." };
    expect(checkExample("el lugar", wrong)[0]).toContain("does not look like");
  });

  it("ignores accents when it compares the form with the word", () => {
    expect(checkExample("inglés", { example: "Es [inglesa].", exampleMeaning: "Je Angličanka." })).toEqual([]);
    expect(checkExample("joven", { example: "Son [jóvenes].", exampleMeaning: "Jsou mladí." })).toEqual([]);
  });

  it("checks the punctuation of Spanish questions", () => {
    expect(checkExample("la casa", { ...good, example: "Dónde está tu [casa]?" }).join()).toContain("¿");
  });

  it("limits the length", () => {
    const long = { ...good, example: `Mi [casa] ${"es ".repeat(14)}grande.` };
    expect(checkExample("la casa", long).join()).toContain("words long");
  });

  it("needs a translation in sentence form", () => {
    expect(checkExample("la casa", { ...good, exampleMeaning: "" }).join()).toContain("no translation");
    expect(checkExample("la casa", { ...good, exampleMeaning: "můj dům" }).join()).toContain("capital");
  });
});

describe("an answer that leaks into the sentence", () => {
  it("finds another word that starts like the marked form", () => {
    expect(leakedStem("Hay muchos turistas; un  me pregunta algo.", "turista")).toBe("turistas");
  });

  it("ignores accents", () => {
    expect(leakedStem("En esta fábrica  coches.", "fabrican")).toBe("fabrica");
  });

  it("leaves short forms alone, because five letters would no longer be a stem", () => {
    expect(leakedStem("Mi casa y la casa", "casa")).toBeNull();
  });

  it("finds nothing in a clean sentence", () => {
    expect(leakedStem("Un  me pregunta dónde está el museo.", "turista")).toBeNull();
  });

  it("is part of the sentence check", () => {
    const leaky = { example: "Hay muchos turistas; un [turista] me pregunta algo.", exampleMeaning: "Je tu hodně turistů." };
    expect(checkExample("el turista", leaky).join()).toContain("gives the answer away");
  });
});

describe("countForm", () => {
  it("counts whole words only, ignoring capitals", () => {
    expect(countForm("La casa de la playa.", "la")).toBe(2);
    expect(countForm("Las playas son bonitas.", "la")).toBe(0);
  });
});
