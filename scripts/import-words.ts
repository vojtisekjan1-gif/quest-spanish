// Rebuilds src/data/words.generated.json from the text files in data-sources/.
// Run with: npm run import-words

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { LEVELS, RETIRED_IDS, type Word } from "../src/data/words";
import { assignIds, missingIds, parseLevelFile } from "./import-lib";

const OUTPUT = "src/data/words.generated.json";

// The current file gives every known word its id, so ids survive a re-import.
const existing: Word[] = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : [];

const entries = LEVELS.flatMap((level) => {
  const text = readFileSync(`data-sources/${level.toLowerCase()}.txt`, "utf8");
  return parseLevelFile(text, level);
});

const words = assignIds(entries, existing, RETIRED_IDS);

// A word that disappeared would take its saved progress with it, and its number could be
// given to a new word later. Make the author decide on purpose.
const missing = missingIds(existing, words, RETIRED_IDS);
if (missing.length > 0) {
  console.error(`These ids are no longer in the word files: ${missing.join(", ")}`);
  console.error("Add them to RETIRED_IDS in src/data/words.ts (progress under them is lost), or restore the words.");
  process.exit(1);
}

writeFileSync(OUTPUT, `${JSON.stringify(words, null, 1)}\n`);

for (const level of LEVELS) {
  console.log(`${level}: ${words.filter((w) => w.level === level).length} words`);
}
