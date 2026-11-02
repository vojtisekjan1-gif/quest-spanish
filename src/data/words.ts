// The word list the app uses. words.generated.json is built by `npm run import-words`
// from the text files in data-sources/. That file is GENERATED: never edit it by hand.
// Change data-sources/*.txt and run the import again. The import keeps existing ids.
// Each word has a stable id, because saved progress is keyed by it.
// Run `npm run check-data` after any change.

import generated from "./words.generated.json";

export type Level = "A1" | "A2" | "B1";
export const LEVELS: Level[] = ["A1", "A2", "B1"];

export interface Word {
  id: string;
  spanish: string; // dictionary form; nouns come with their article ("la casa")
  meaning: string; // the Czech meaning
  level: Level;
  // Example sentence with the form of the word used in it in [brackets]: "Mi [casa] es pequeña."
  // Verbs are usually conjugated in the sentence, so the form can differ from `spanish`.
  example: string;
  exampleMeaning: string; // the Czech translation of the sentence
}

// Ids that were used once and then removed. They must never be used again,
// or old saved progress would attach to a different word. check-data,
// words.test.ts and the import enforce this.
export const RETIRED_IDS: string[] = [];

// JSON only knows "string" for the level. check-data and the tests make sure it is valid.
export const WORDS = generated as Word[];

export interface ExampleParts {
  before: string;
  form: string; // the part that was in [brackets]
  after: string;
}

// Splits an example sentence around its [bracketed] form.
export function exampleParts(example: string): ExampleParts {
  const open = example.indexOf("[");
  const close = example.indexOf("]");
  return { before: example.slice(0, open), form: example.slice(open + 1, close), after: example.slice(close + 1) };
}

// The sentence as it is shown, without the brackets.
export function plainExample(example: string): string {
  const { before, form, after } = exampleParts(example);
  return `${before}${form}${after}`;
}

// The word without its article: "la casa" becomes "casa". Used when a word fills a gap.
export function bareWord(spanish: string): string {
  return spanish.replace(/^(el|la|los|las) /, "");
}
