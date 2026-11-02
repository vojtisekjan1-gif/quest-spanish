# Quest Spanish: project notes

A gamified Spanish vocabulary app for Czech learners at levels A1 to B1. It is a Vite and TypeScript app converted from the HSK Quest project (github.com/vojtisekjan1-gif/hsk-quest). Progress is stored in the browser's localStorage. There is no backend and no accounts. The app is in Czech and teaches European Spanish (from Spain).

## Word data
- 1518 words: A1 482, A2 568, B1 468. There is no official list: Claude wrote the lists from its own knowledge of common vocabulary at each level. They are not the Instituto Cervantes list, and the Settings screen says so.
- Every word has the Spanish form (nouns with their article, "la casa"), a Czech meaning and one example sentence with a Czech translation.
- The source is `data-sources/a1.txt`, `a2.txt` and `b1.txt`. One word per line: `spanish|česky|věta s [tvarem slova]|překlad věty`. Lines starting with `#` are section titles.
- The word as it stands in the sentence is in [brackets] (verbs are conjugated there, so it differs from the dictionary form). The app removes the brackets for display and uses them to highlight the word or make the gap.
- Never edit `src/data/words.generated.json` by hand. Change the text files and run `npm run import-words`. A word keeps its id, so saved progress survives a re-import. Ids look like `a1-0012`, and numbers are never reused.
- The import refuses to run when an id would disappear (a removed word, or a word whose Spanish form in column 1 was changed). Add that id to `RETIRED_IDS` in `src/data/words.ts` (the progress under it is lost, and the number is never given out again), or restore the word. To fix a word without losing progress, change only columns 2 to 4. The ids were last renumbered from scratch on 2. 11. 2026, before anyone used the app: do not do that once the app has users.
- Two words at the same level must not share a Czech meaning if it can be avoided. The game leaves such pairs out of each other's questions (`sharesMeaning` in `src/questions.ts`, parts split at `,` `;` `/`, notes in brackets ignored), but the Czech shown on a flashcard should still tell the words apart.
- Sentence rules (checked by `npm run check-data`, rules in `scripts/sentence-lib.ts`): exactly one bracketed form; the form appears only once in the sentence and no other word in it starts like the form's first five letters (otherwise a gap question would give the answer away); at most 14 words; capital first letter; ends with . ! or ?; ¿ and ¡ come in pairs with ? and !; the translation starts with a capital letter and ends with . ! or ?.
- A word must not appear twice across the three files. The import refuses duplicates.

## Commands
Node.js is installed in `C:\Program Files\nodejs`. Open a new terminal after installing, or use `Spustit.bat`.
- `Spustit.bat`: double-click to install packages (first time), start the app and open it in the browser
- `npm run dev`: start the dev server (http://localhost:5173)
- `npm test`: run unit tests (Vitest)
- `npm run check-data`: validate the word list and every example sentence (`-- --strict` also fails when a level is short)
- `npm run import-words`: rebuild `src/data/words.generated.json` from `data-sources/`. The first time it needs the JSON file to exist, even if it holds only `[]`.
- `npm run build`: type-check and build

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the execution policy.

## Structure
- `src/srs.ts`: SM-2 spaced repetition (pure, tested)
- `src/gamification.ts`: XP, levels, streaks, badges (pure, tested)
- `src/study.ts`: picks the words for a session: due reviews first, then new words from the start level up, A1 before A2 before B1 (pure, tested)
- `src/storage.ts`: localStorage wrapper, key `quest-spanish-v1`, schema version 1, shape checks
- `src/adventure.ts`: HP, items, abilities, gold, shop and battle rules (pure, tested)
- `src/world.ts`: regions, monsters and unlock rules (pure, tested)
- `src/questions.ts`: multiple-choice question types (pure, tested)
- `src/speech.ts`: reads Spanish words aloud with the browser's voices; the 🔊 button shows only when the device has a Spanish voice
- `src/art.ts`: SVG art for monsters, hero, items and map regions
- `src/main.ts`: UI, screens and event handling (all texts are in Czech)
- `src/data/words.ts`: word types, `exampleParts`, `plainExample`, `bareWord`
- `scripts/`: data check and import (rules in `*-lib.ts`, tested)

## Adventure mode
- Four regions: Bílá vesnice (A1), Olivový háj (A2), Sierra Nevada (B1), Alhambra (B1). Each has two monsters and a boss. The boss unlocks when the other two are beaten, the next region when the boss falls.
- Question types per region: meaning (Spanish to Czech), spanish (Czech to Spanish), context (the word in its sentence, pick the meaning), blank (fill the gap in the sentence).
- Gap questions take their wrong options from other kinds of word first (noun, verb, other, by spelling: `kindOf`), because another noun could also fit the gap. The price: the gap is easier, since a verb gap shows one verb among nouns.
- Abilities: fierce (a miss costs 2 HP), armored (absorbs the first hit), regen (heals 1 when you miss), confusing (six answer options instead of four). A shield blocks the whole miss, including regen.
- HP refills daily. Gold, shop and items work as in HSK Quest. Monster ids are saved in `defeated`: never rename or reuse one.

## Conventions
- Keep scheduling, gamification and combat logic pure and covered by tests. UI code only calls into them.
- Every localStorage access goes through `storage.ts` and is wrapped in try/catch.
- Progress is keyed by word `id`. Never reuse or renumber an id.
- Respect `prefers-reduced-motion`. Layout must work at 375px width.
- Keep the code readable for a beginner: short functions, clear names, a comment where the reason isn't obvious.
- The user is not a programmer: explain technical things simply, in Czech.

## State (2. 11. 2026)
- This is a standalone project with its own git repository and its own GitHub repository (`vojtisekjan1-gif/quest-spanish`). It is deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
- Done and checked: `npm test` (169 tests), `check-data --strict`, `build`, a click-through in the browser (study session, multiple choice, level-up, reload keeps progress, all four question types, hint on six options, a lost and a won battle, start level change, `lang` attributes, 375px layout).
- A reviewer (an agent with the jarmil rules) read the code and all 1527 entries on 30. 10. and found problems in the code and in the data. The important ones were fixed on 2. 11.: wrong options that share a meaning, gap questions with several fitting words, a lost-HP display of -1, oldest reviews not first, start-level change not rebuilding the session, missing `lang="es"`, the Android voice name, import losing ids, 41 wrong or odd entries corrected (el menú, tolerar, el huevo and others), and 9 entries deleted (loose phrases such as "cenar fuera", and "tranquilamente").
- Not fixed on purpose: some B1 words are really A2 level (la vida, el mundo, el problema), and some A2 words are really A1 (el cine, la música). The level split has no official source, so it does not matter much.
- Not checked: the shop, potions and shields in a real fight, reduced motion, the 🔊 button (the test browser had no Spanish voice).
- The Czech and the Spanish were judged from Claude's own knowledge, not by a native speaker or a dictionary. A native speaker should still spot-check the sentences.
- In gap questions the options show the dictionary form, while the gap holds the conjugated form. This is a known simplification.
- Live app: https://vojtisekjan1-gif.github.io/quest-spanish/ (public repository, because GitHub Pages is free only for public ones).
