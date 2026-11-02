// Multiple-choice questions for battles and study. Pure functions only.

import { bareWord, exampleParts, type Word } from "./data/words";
import { shuffle } from "./util";

// What a question shows and what you pick:
// - meaning: see the Spanish word, pick its Czech meaning
// - spanish: see the Czech meaning, pick the Spanish word
// - context: see an example sentence with the word marked, pick its Czech meaning
// - blank:   see the word's example sentence with a gap, pick the word that fills it
export type QuestionType = "meaning" | "spanish" | "context" | "blank";

export const BLANK = "＿＿＿";
export const DEFAULT_OPTIONS = 4;

// One answer option.
export interface Choice {
  wordId: string;
  label: string;
}

export interface Question {
  type: QuestionType;
  word: Word; // the correct answer
  prompt: string; // what is shown above the options
  choices: Choice[]; // shuffled, one of them correct
}

// The word field a question shows as its prompt. A wrong option must differ from the
// answer in this field and in its option text, or it could also be a right answer.
const PROMPT_FIELD: Record<QuestionType, keyof Word> = {
  meaning: "spanish",
  spanish: "meaning",
  context: "spanish",
  blank: "meaning", // two words with the same meaning could both fit the gap
};

// The separate meanings in a Czech translation: "muž, člověk" gives ["muž", "člověk"].
// A note in brackets is not a meaning.
function meaningParts(word: Word): string[] {
  return word.meaning
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[,;/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// Two words that share a meaning (both "poslat" in enviar and mandar) can both be right,
// so one must never be offered as a wrong option for the other.
export function sharesMeaning(a: Word, b: Word): boolean {
  const mine = meaningParts(a);
  return meaningParts(b).some((part) => mine.includes(part));
}

// The kind of word, as far as the spelling shows it. A gap in a sentence takes only one kind.
export type WordKind = "noun" | "verb" | "other";

// Ending in -er or -ar, but not verbs.
const NOT_VERBS = new Set(["ayer", "anteayer", "regular", "cualquier"]);

export function kindOf(word: Word): WordKind {
  if (/^(el|la|los|las) /.test(word.spanish)) return "noun";
  const first = word.spanish.split(" ")[0];
  if (/(ar|er|ir|ír)(se)?$/.test(first) && !NOT_VERBS.has(first)) return "verb";
  return "other";
}

// Picks one of the allowed types at random.
export function pickQuestionType(types: QuestionType[], rng: () => number = Math.random): QuestionType {
  return types[Math.floor(rng() * types.length)];
}

function promptFor(type: QuestionType, word: Word): string {
  if (type === "meaning") return word.spanish;
  if (type === "spanish") return word.meaning;
  if (type === "context") return word.example; // keeps the [brackets], so the UI can mark the word
  const { before, after } = exampleParts(word.example);
  return `${before}${BLANK}${after}`;
}

// The option for one word. A word in a gap is shown without its article.
function choiceFor(type: QuestionType, word: Word): Choice {
  if (type === "meaning" || type === "context") return { wordId: word.id, label: word.meaning };
  if (type === "blank") return { wordId: word.id, label: bareWord(word.spanish) };
  return { wordId: word.id, label: word.spanish };
}

// Builds a question with up to `optionCount` options.
export function makeQuestion(
  type: QuestionType,
  word: Word,
  pool: Word[],
  rng: () => number = Math.random,
  optionCount: number = DEFAULT_OPTIONS,
): Question {
  const promptField = PROMPT_FIELD[type];
  const optionText = (w: Word) => choiceFor(type, w).label;

  // Keep one word per option text, so no option is shown twice
  // ("la mañana" and "mañana" look the same in a gap, without the article).
  const byAnswer = new Map<string, Word>();
  for (const w of shuffle(pool, rng)) {
    const differs =
      w[promptField] !== word[promptField] && optionText(w) !== optionText(word) && !sharesMeaning(w, word);
    if (differs && !byAnswer.has(optionText(w))) byAnswer.set(optionText(w), w);
  }
  const candidates = [...byAnswer.values()];

  // A gap fits only one kind of word, so a wrong option of the same kind (another noun in
  // "Es un ＿＿＿ muy delicado") could also be right. Other kinds come first.
  const otherKind = candidates.filter((w) => kindOf(w) !== kindOf(word));
  const sameKind = candidates.filter((w) => kindOf(w) === kindOf(word));
  const ordered = type === "blank" ? [...otherKind, ...sameKind] : candidates;

  const distractors = ordered.slice(0, optionCount - 1);
  const choices = shuffle([word, ...distractors], rng).map((w) => choiceFor(type, w));
  return { type, word, prompt: promptFor(type, word), choices };
}

export function isCorrect(question: Question, wordId: string): boolean {
  return question.word.id === wordId;
}

// How many wrong answers a hint removes.
export const HINT_REMOVES = 2;

// The options still on screen after a hint: the correct one and all but
// HINT_REMOVES wrong ones. The choices are already shuffled, so taking the
// first wrong ones is as good as a random pick, and it stays the same on re-render.
export function choicesAfterHint(question: Question): Choice[] {
  let removed = 0;
  return question.choices.filter((choice) => {
    if (isCorrect(question, choice.wordId) || removed >= HINT_REMOVES) return true;
    removed++;
    return false;
  });
}
