// Picks the words for a study session. Pure functions only, so they are easy to test.

import { LEVELS, type Level, type Word } from "./data/words";
import { isDue, type CardState } from "./srs";
import { shuffle } from "./util";

export const SESSION_SIZE = 10;

// New words start at this level, so a learner who knows A1 can skip it.
function isFromLevel(word: Word, fromLevel: Level): boolean {
  return LEVELS.indexOf(word.level) >= LEVELS.indexOf(fromLevel);
}

// A word is due if its review time has passed, or if it is new and at or above the
// chosen start level. A word that was already studied stays in reviews at any level.
export function dueStudyWords(
  words: Word[],
  cards: Record<string, CardState>,
  now: number,
  fromLevel: Level = "A1",
): Word[] {
  return words.filter((w) => {
    const card = cards[w.id];
    return card ? isDue(card, now) : isFromLevel(w, fromLevel);
  });
}

// New words in the order they should be learned: A1 first, random within a level.
function freshWordsInOrder(fresh: Word[], random: () => number): Word[] {
  return LEVELS.flatMap((level) => shuffle(fresh.filter((w) => w.level === level), random));
}

// Picks the words for one session. Due reviews go in first, the ones that have waited
// longest before the others, so they are not crowded out by the many new words; new
// words fill the rest. While SESSION_SIZE or more reviews are due, a session has no
// new words: clearing the backlog comes first. The chosen words are shown in random
// order. `random` is like Math.random; tests pass their own so the order is predictable.
export function buildStudyQueue(
  words: Word[],
  cards: Record<string, CardState>,
  now: number,
  size: number = SESSION_SIZE,
  random: () => number = Math.random,
  fromLevel: Level = "A1",
): Word[] {
  const due = dueStudyWords(words, cards, now, fromLevel);
  const reviews = due.filter((w) => cards[w.id]).sort((a, b) => cards[a.id].due - cards[b.id].due);
  const fresh = freshWordsInOrder(due.filter((w) => !cards[w.id]), random);
  // Shuffle so reviews and new words are mixed within the session.
  return shuffle([...reviews, ...fresh].slice(0, size), random);
}
