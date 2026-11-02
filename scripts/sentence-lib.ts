// Pure rules for checking example sentences (used by scripts/check-data.ts).
// No file access here, so every rule can be tested on its own.
// These only check the form of a sentence. Whether its words suit the level
// is left to the writer.

import { bareWord, exampleParts, plainExample } from "../src/data/words";

// Longest allowed sentence, in words.
export const MAX_SENTENCE_WORDS = 14;

const stripAccents = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Counts how often a form stands as a whole word or phrase in a sentence, ignoring
// capitals: a second one would give the answer away in a gap question.
export function countForm(sentence: string, form: string): number {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (sentence.match(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "giu")) ?? []).length;
}

// A longer word in the rest of the sentence that starts like the marked form gives the
// answer away in a gap question ("turista" next to "turistas", "fábrica" next to "fabrican").
// Short forms are left out: five letters would no longer be a stem.
export function leakedStem(rest: string, form: string): string | null {
  const others = stripAccents(rest).split(/[^\p{L}]+/u);
  for (const word of stripAccents(form).split(/[^\p{L}]+/u)) {
    if (word.length < 6) continue;
    const stem = word.slice(0, 5);
    const found = others.find((other) => other.startsWith(stem));
    if (found) return found;
  }
  return null;
}

// Verbs change their shape in a sentence (ir becomes voy), so only other words have
// to look like their dictionary form. This catches brackets around the wrong word.
function looksLikeVerb(spanish: string): boolean {
  return /(ar|er|ir|ír)(se)?( |$)/.test(spanish.split(" ")[0]);
}

function formMatchesWord(spanish: string, form: string): boolean {
  if (looksLikeVerb(spanish)) return true;
  const start = stripAccents(bareWord(spanish)).slice(0, 3);
  return stripAccents(form).includes(start);
}

// Checks one example sentence and its translation against the rules in CLAUDE.md.
// Returns the problems found; an empty list means the example is fine.
export function checkExample(spanish: string, example: { example: string; exampleMeaning: string }): string[] {
  const errors: string[] = [];
  const raw = example.example.trim();
  const translation = example.exampleMeaning.trim();

  if ((raw.match(/\[/g) ?? []).length !== 1 || (raw.match(/\]/g) ?? []).length !== 1 || raw.indexOf("[") > raw.indexOf("]")) {
    return ["needs exactly one [marked] form"];
  }
  const { before, form, after } = exampleParts(raw);
  const sentence = plainExample(raw);

  if (!form.trim()) errors.push("has an empty [marked] form");
  else if (countForm(sentence, form) !== 1) errors.push(`has ${form} more than once`);
  const leaked = leakedStem(`${before} ${after}`, form);
  if (leaked) errors.push(`has ${leaked} next to ${form}, which gives the answer away`);
  if (!formMatchesWord(spanish, form)) errors.push(`marks ${form}, which does not look like ${spanish}`);
  const words = sentence.split(/\s+/).length;
  if (words > MAX_SENTENCE_WORDS) errors.push(`is ${words} words long (at most ${MAX_SENTENCE_WORDS})`);
  if (!/^[¿¡]?\p{Lu}/u.test(sentence)) errors.push("should start with a capital letter");
  if (!/[.!?]$/.test(sentence)) errors.push("should end with . ! or ?");
  if (sentence.includes("?") !== sentence.includes("¿")) errors.push("needs both ¿ and ?");
  if (sentence.includes("!") !== sentence.includes("¡")) errors.push("needs both ¡ and !");

  if (!translation) errors.push("has no translation");
  else if (!/^\p{Lu}/u.test(translation) || !/[.!?]$/.test(translation)) {
    errors.push("translation should start with a capital letter and end with . ! or ?");
  }
  return errors;
}
