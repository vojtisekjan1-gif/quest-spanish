// Reads Spanish words aloud with the browser's built-in voices, so the learner hears
// the pronunciation. Not every device has a Spanish voice, so the UI shows the button
// only when one exists. The browser may lack the feature altogether, which is why
// every access to it is wrapped in try/catch.

// Android reports "es_ES", other systems "es-ES".
const normalize = (lang: string) => lang.toLowerCase().replace("_", "-");

// Prefers the Spanish of Spain, then any Spanish voice.
export function pickSpanishVoice<T extends { lang: string }>(voices: T[]): T | undefined {
  return voices.find((v) => normalize(v.lang) === "es-es") ?? voices.find((v) => normalize(v.lang).startsWith("es"));
}

function spanishVoice(): SpeechSynthesisVoice | undefined {
  try {
    return pickSpanishVoice(speechSynthesis.getVoices());
  } catch {
    return undefined;
  }
}

export function canSpeak(): boolean {
  return spanishVoice() !== undefined;
}

export function speak(text: string): void {
  const voice = spanishVoice();
  if (!voice) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    speechSynthesis.cancel(); // a new word replaces one still being read
    speechSynthesis.speak(utterance);
  } catch {
    // Reading aloud is a bonus: the app works the same without it.
  }
}

// Browsers load voices in the background, so the first check can come back empty.
export function onVoicesReady(callback: () => void): void {
  try {
    speechSynthesis.addEventListener("voiceschanged", callback);
  } catch {
    // No speech support: nothing will ever change.
  }
}
