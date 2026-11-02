// Checks the word list: required fields, unique ids, no retired ids, per-level
// counts, and every example sentence (see scripts/sentence-lib.ts).
// Run with: npm run check-data (add -- --strict before release)

import { LEVELS, RETIRED_IDS, WORDS } from "../src/data/words";
import { checkExample } from "./sentence-lib";

// The size each level should have. There is no official list to match.
const MIN_PER_LEVEL: Record<string, number> = { A1: 400, A2: 450, B1: 450 };
const strict = process.argv.includes("--strict");
const ID_FORMAT = /^(a1|a2|b1)-\d{4}$/;
const problems: string[] = [];

const seen = new Set<string>();
const spanishSeen = new Set<string>();
for (const w of WORDS) {
  if (seen.has(w.id)) problems.push(`duplicate id: ${w.id}`);
  // A retired id may still be in someone's saved progress, for a different word.
  if (RETIRED_IDS.includes(w.id)) problems.push(`${w.id} is retired and must not be reused`);
  seen.add(w.id);
  if (spanishSeen.has(w.spanish)) problems.push(`duplicate word: ${w.spanish}`);
  spanishSeen.add(w.spanish);
  if (!w.id.startsWith(`${w.level.toLowerCase()}-`)) problems.push(`${w.id} id does not match level ${w.level}`);
  if (!ID_FORMAT.test(w.id)) problems.push(`${w.id} is not a valid id (like a1-0012)`);
  if (!LEVELS.includes(w.level)) problems.push(`${w.id} has invalid level ${w.level}`);
  for (const field of ["spanish", "meaning", "example", "exampleMeaning"] as const) {
    if (!w[field]?.trim()) problems.push(`${w.id} is missing ${field}`);
  }
  // Every example sentence must follow the sentence rules (form only, see sentence-lib.ts).
  const errors = checkExample(w.spanish, w);
  problems.push(...errors.map((e) => `${w.id} ${w.spanish} "${w.example}" ${e}`));
}

for (const level of LEVELS) {
  const count = WORDS.filter((w) => w.level === level).length;
  const target = MIN_PER_LEVEL[level];
  const short = count < target;
  console.log(`${level}: ${count} words (${short ? `short of ${target}` : "ok"})`);
  // A short list is only an error with --strict, so day-to-day checks still pass.
  if (short && strict) problems.push(`${level} needs ${target} words`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Data checks passed.");
