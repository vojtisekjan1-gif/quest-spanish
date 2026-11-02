// Pure rules for the word import (used by scripts/import-words.ts).
// No file access here, so every rule can be tested on its own.

import type { Level, Word } from "../src/data/words";

// One entry from a data-sources file: everything but the id.
export type Entry = Omit<Word, "id">;

// Reads one level's text file. Each line is
//   spanish|Czech meaning|Spanish sentence with the [form]|Czech translation
// Empty lines and lines starting with # (section titles) are skipped.
export function parseLevelFile(text: string, level: Level): Entry[] {
  const entries: Entry[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("|").map((part) => part.trim());
    if (parts.length !== 4 || parts.some((part) => !part)) {
      throw new Error(`${level}, line ${i + 1}: expected 4 parts separated by |: ${trimmed}`);
    }
    const [spanish, meaning, example, exampleMeaning] = parts;
    entries.push({ spanish, meaning, level, example, exampleMeaning });
  });
  return entries;
}

// Ids that were in the old word list but are not in the new one. Removing a word, or
// changing its Spanish form, makes its id disappear, and the saved progress under it is
// lost. The import refuses this until the id is listed in RETIRED_IDS (words.ts), which
// also stops the number from being given to another word later.
export function missingIds(existing: Word[], words: Word[], retired: string[]): string[] {
  const kept = new Set([...words.map((w) => w.id), ...retired]);
  return existing.map((w) => w.id).filter((id) => !kept.has(id));
}

// Gives every entry its id. A word that already has an id keeps it, so saved progress
// survives a re-import, even when a word moves in the file. New words get the next
// free number at their level. Ids of removed words are not reused, because the
// numbers only go up from the highest one in use or retired.
export function assignIds(entries: Entry[], existing: Word[], retired: string[]): Word[] {
  const idByWord = new Map(existing.map((w) => [w.spanish, w.id]));
  const taken = [...existing.map((w) => w.id), ...retired];
  const highest = new Map<string, number>();
  for (const id of taken) {
    const [prefix, number] = id.split("-");
    highest.set(prefix, Math.max(highest.get(prefix) ?? 0, Number(number)));
  }

  const seen = new Set<string>();
  return entries.map((entry) => {
    if (seen.has(entry.spanish)) throw new Error(`Duplicate word: ${entry.spanish}`);
    seen.add(entry.spanish);
    const prefix = entry.level.toLowerCase();
    let id = idByWord.get(entry.spanish);
    // A word that moved to another level needs a new id: the id prefix is its level.
    if (!id || !id.startsWith(`${prefix}-`)) {
      const next = (highest.get(prefix) ?? 0) + 1;
      highest.set(prefix, next);
      id = `${prefix}-${String(next).padStart(4, "0")}`;
    }
    return { id, ...entry };
  });
}
