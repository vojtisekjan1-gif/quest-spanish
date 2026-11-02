import { describe, expect, it } from "vitest";
import { pickSpanishVoice } from "./speech";

const voice = (lang: string) => ({ lang });

describe("pickSpanishVoice", () => {
  it("prefers the Spanish of Spain", () => {
    expect(pickSpanishVoice([voice("es-MX"), voice("es-ES")])).toEqual(voice("es-ES"));
  });

  it("understands the underscore that Android uses", () => {
    expect(pickSpanishVoice([voice("es_US"), voice("es_ES")])).toEqual(voice("es_ES"));
  });

  it("takes any Spanish voice when there is none from Spain", () => {
    expect(pickSpanishVoice([voice("en-US"), voice("es-MX")])).toEqual(voice("es-MX"));
  });

  it("returns nothing when no voice speaks Spanish", () => {
    expect(pickSpanishVoice([voice("en-US"), voice("cs-CZ")])).toBeUndefined();
    expect(pickSpanishVoice([])).toBeUndefined();
  });
});
