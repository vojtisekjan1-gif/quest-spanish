// Hand-drawn style SVG art, written in code. Each function returns a string
// of SVG markup that main.ts places into the page.

import type { ItemId } from "./adventure";
import { monsterById } from "./world";

const INK = "#1f1d1a";

// The drawing inside each monster's 120 × 120 frame, by monster id.
const MONSTER_ART: Record<string, string> = {
  slime: `
    <ellipse cx="60" cy="82" rx="42" ry="28" fill="#6cc46a" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="60" cy="72" rx="30" ry="18" fill="#8bdc88" opacity="0.6"/>
    <circle cx="46" cy="76" r="5" fill="${INK}"/>
    <circle cx="74" cy="76" r="5" fill="${INK}"/>
    <path d="M50 90 Q60 96 70 90" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  wolf: `
    <path d="M30 60 L40 20 L58 50 Z" fill="#8a8f99" stroke="${INK}" stroke-width="3"/>
    <path d="M90 60 L80 20 L62 50 Z" fill="#8a8f99" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="60" cy="72" rx="36" ry="30" fill="#a9afba" stroke="${INK}" stroke-width="3"/>
    <circle cx="46" cy="66" r="5" fill="${INK}"/>
    <circle cx="74" cy="66" r="5" fill="${INK}"/>
    <path d="M52 86 L60 92 L68 86" fill="#fff" stroke="${INK}" stroke-width="2"/>`,
  // A black fighting bull with long horns.
  bull: `
    <path d="M34 42 Q14 34 12 12 Q26 28 44 32 Z" fill="#f1e4c8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M86 42 Q106 34 108 12 Q94 28 76 32 Z" fill="#f1e4c8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 40 Q60 22 90 40 L82 86 Q60 104 38 86 Z" fill="#3a3331" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42 84 Q60 74 78 84 Q72 102 60 102 Q48 102 42 84 Z" fill="#8a6d5a" stroke="${INK}" stroke-width="3"/>
    <circle cx="53" cy="90" r="2.5" fill="${INK}"/>
    <circle cx="67" cy="90" r="2.5" fill="${INK}"/>
    <circle cx="46" cy="58" r="5" fill="#f5c542"/>
    <circle cx="74" cy="58" r="5" fill="#f5c542"/>
    <path d="M38 50 L52 54 M82 50 L68 54" stroke="#c9302c" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="104" r="5" fill="none" stroke="#f5c542" stroke-width="3"/>`,
  fox: `
    <path d="M32 52 L36 18 L56 44 Z" fill="#e8823a" stroke="${INK}" stroke-width="3"/>
    <path d="M88 52 L84 18 L64 44 Z" fill="#e8823a" stroke="${INK}" stroke-width="3"/>
    <path d="M26 50 Q60 34 94 50 L60 100 Z" fill="#f09a50" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42 70 Q60 64 78 70 L60 100 Z" fill="#fff4e6"/>
    <path d="M44 60 Q48 56 52 60" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M68 60 Q72 56 76 60" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="94" r="4" fill="${INK}"/>
    <circle cx="20" cy="30" r="5" fill="#9fd3f2" opacity="0.7"/>
    <circle cx="100" cy="26" r="4" fill="#9fd3f2" opacity="0.7"/>`,
  turtle: `
    <ellipse cx="60" cy="96" rx="44" ry="8" fill="${INK}" opacity="0.15"/>
    <circle cx="100" cy="76" r="12" fill="#9cb87a" stroke="${INK}" stroke-width="3"/>
    <circle cx="104" cy="73" r="2.5" fill="${INK}"/>
    <path d="M18 90 Q20 40 60 38 Q100 40 102 90 Z" fill="#8d8a80" stroke="${INK}" stroke-width="3"/>
    <path d="M60 38 V90 M38 46 L46 90 M82 46 L74 90 M22 66 H98" stroke="${INK}" stroke-width="2" opacity="0.5"/>
    <rect x="26" y="88" width="14" height="10" rx="3" fill="#9cb87a" stroke="${INK}" stroke-width="2"/>
    <rect x="80" y="88" width="14" height="10" rx="3" fill="#9cb87a" stroke="${INK}" stroke-width="2"/>`,
  // La Tarasca, the dragon-like beast of Spanish Corpus Christi parades.
  tarasca: `
    <path d="M36 40 Q28 18 40 12 Q38 28 48 36 Z" fill="#f5c542" stroke="${INK}" stroke-width="3"/>
    <path d="M84 40 Q92 18 80 12 Q82 28 72 36 Z" fill="#f5c542" stroke="${INK}" stroke-width="3"/>
    <path d="M18 70 Q14 40 40 34 Q60 26 80 34 Q106 40 102 70 Q100 104 60 106 Q20 104 18 70 Z" fill="#c9302c" stroke="${INK}" stroke-width="3"/>
    <circle cx="44" cy="56" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <circle cx="76" cy="56" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <circle cx="46" cy="58" r="4" fill="${INK}"/>
    <circle cx="74" cy="58" r="4" fill="${INK}"/>
    <path d="M32 78 Q60 100 88 78 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 82 L48 90 L52 84 L58 92 L62 84 L68 90 L72 82 L76 88" fill="none" stroke="${INK}" stroke-width="2"/>`,
  // A stork with long legs and a riddle.
  stork: `
    <path d="M60 64 L14 46 Q30 70 56 76 Z" fill="#f3f3f0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 46 L24 58" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="66" cy="74" rx="22" ry="14" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <path d="M78 66 Q90 44 82 26" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="82" cy="24" r="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
    +

    <circle cx="84" cy="24" r="2" fill="${INK}"/>
    <path d="M89 22 L112 30 L89 28 Z" fill="#d9534f" stroke="${INK}" stroke-width="1.5"/>
    <path d="M60 88 V110 M70 88 V110" stroke="${INK}" stroke-width="3"/>
    <text x="22" y="30" font-size="16" font-weight="bold" fill="${INK}">?</text>`,
  // A bat made of an ink blot, with drips.
  bat: `
    <path d="M60 54 Q40 30 10 40 Q22 50 18 64 Q30 58 36 70 Q44 60 60 72 Q76 60 84 70 Q90 58 102 64 Q98 50 110 40 Q80 30 60 54 Z" fill="#2f3542" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="60" cy="66" rx="14" ry="16" fill="#3d4454" stroke="${INK}" stroke-width="3"/>
    <path d="M50 52 L52 42 L56 52 M64 52 L68 42 L70 52" fill="#3d4454" stroke="${INK}" stroke-width="2"/>
    <circle cx="54" cy="62" r="3" fill="#f5c542"/>
    <circle cx="66" cy="62" r="3" fill="#f5c542"/>
    <path d="M56 72 L58 76 L60 72 L62 76 L64 72" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M40 72 Q42 86 40 92 M82 72 Q80 84 82 96" fill="none" stroke="#2f3542" stroke-width="4" stroke-linecap="round"/>`,
  dragon: `
    <path d="M60 60 L8 36 L20 70 Z" fill="#d9534f" stroke="${INK}" stroke-width="3"/>
    <path d="M60 60 L112 36 L100 70 Z" fill="#d9534f" stroke="${INK}" stroke-width="3"/>
    <circle cx="60" cy="72" r="32" fill="#e8745f" stroke="${INK}" stroke-width="3"/>
    <circle cx="48" cy="66" r="5" fill="${INK}"/>
    <circle cx="72" cy="66" r="5" fill="${INK}"/>
    <path d="M50 84 Q60 92 70 84" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M56 40 L60 28 L64 40" fill="#f5c542" stroke="${INK}" stroke-width="2"/>`,
  // A clay gate guard with armor plates and a spear.
  guard: `
    <circle cx="60" cy="16" r="7" fill="#b5653a" stroke="${INK}" stroke-width="3"/>
    <circle cx="60" cy="36" r="16" fill="#c9784a" stroke="${INK}" stroke-width="3"/>
    <path d="M52 34 H56 M64 34 H68" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M54 44 H66" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M32 112 L36 58 Q60 48 84 58 L88 112 Z" fill="#b5653a" stroke="${INK}" stroke-width="3"/>
    <path d="M40 68 H80 M39 78 H81 M38 88 H82" stroke="${INK}" stroke-width="2" opacity="0.6"/>
    <path d="M48 60 V96 M60 58 V96 M72 60 V96" stroke="${INK}" stroke-width="1.5" opacity="0.4"/>
    <path d="M96 30 V112" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M90 34 L96 18 L102 34 Z" fill="#a9afba" stroke="${INK}" stroke-width="2"/>`,
  mirror: `
    <ellipse cx="60" cy="58" rx="34" ry="42" fill="#c9a24a" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="60" cy="58" rx="26" ry="34" fill="#dff1f7" stroke="${INK}" stroke-width="2"/>
    <path d="M44 38 L52 30 M46 50 L62 34" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="51" cy="60" r="4" fill="${INK}"/>
    <circle cx="69" cy="60" r="4" fill="${INK}"/>
    <path d="M52 74 Q60 68 68 74" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <rect x="52" y="98" width="16" height="16" rx="3" fill="#8a6d3b" stroke="${INK}" stroke-width="3"/>`,
  // A shadowy sultan: dark robe, a turban with a jewel, glowing eyes.
  sultan: `
    <path d="M22 114 Q26 60 60 56 Q94 60 98 114 Z" fill="#3a2f5b" stroke="${INK}" stroke-width="3"/>
    <path d="M60 60 V114" stroke="#f5c542" stroke-width="3"/>
    <circle cx="60" cy="46" r="19" fill="#4a3f6b" stroke="${INK}" stroke-width="3"/>
    <path d="M36 38 Q34 10 60 10 Q86 10 84 38 Q60 28 36 38 Z" fill="#e8e0f0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42 30 Q60 18 78 30 M40 22 Q60 12 80 22" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.5"/>
    <circle cx="60" cy="24" r="4" fill="#c9302c" stroke="#f5c542" stroke-width="2"/>
    <circle cx="52" cy="48" r="3.5" fill="#f5c542"/>
    <circle cx="68" cy="48" r="3.5" fill="#f5c542"/>
    <path d="M52 57 H68" stroke="${INK}" stroke-width="2"/>`,
};

export function monsterSvg(id: string): string {
  const art = MONSTER_ART[id];
  if (!art) return "";
  const name = monsterById(id)?.name ?? "Soupeř";
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${name}">${art}</svg>`;
}

export function heroSvg(): string {
  return `<svg viewBox="0 0 120 120" role="img" aria-label="Hrdina">
    <path d="M30 110 Q60 58 90 110 Z" fill="#3f6fb5" stroke="${INK}" stroke-width="3"/>
    <circle cx="60" cy="46" r="20" fill="#f1c59a" stroke="${INK}" stroke-width="3"/>
    <path d="M40 40 Q60 16 80 40 Z" fill="#7a4b2a" stroke="${INK}" stroke-width="3"/>
    <circle cx="53" cy="48" r="2.5" fill="${INK}"/>
    <circle cx="67" cy="48" r="2.5" fill="${INK}"/>
  </svg>`;
}

export function itemSvg(id: ItemId): string {
  switch (id) {
    case "potion":
      return `<svg viewBox="0 0 40 40" role="img" aria-label="Lektvar">
        <path d="M16 6 H24 V12 L30 22 V34 H10 V22 L16 12 Z" fill="#ff6b7a" stroke="${INK}" stroke-width="2"/>
        <rect x="16" y="3" width="8" height="4" fill="#8a6d3b" stroke="${INK}" stroke-width="1.5"/>
      </svg>`;
    case "hint":
      return `<svg viewBox="0 0 40 40" role="img" aria-label="Nápověda">
        <circle cx="20" cy="16" r="10" fill="#f5c542" stroke="${INK}" stroke-width="2"/>
        <rect x="16" y="26" width="8" height="6" fill="#b0a68a" stroke="${INK}" stroke-width="2"/>
      </svg>`;
    case "shield":
      return `<svg viewBox="0 0 40 40" role="img" aria-label="Štít">
        <path d="M20 4 L34 9 V20 Q34 32 20 37 Q6 32 6 20 V9 Z" fill="#5a8fd6" stroke="${INK}" stroke-width="2"/>
        <path d="M20 12 V30" stroke="#fff" stroke-width="2"/>
      </svg>`;
  }
}

// A small gold coin with a cross, like an old Spanish doubloon. Decorative:
// the text next to it always says "zlato".
export function coinSvg(): string {
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill="#f5c542" stroke="${INK}" stroke-width="2"/>
    <path d="M20 12 V28 M12 20 H28" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

// Map icons for the regions, by region id. Decorative: the region name is shown as text.
const REGION_ART: Record<string, string> = {
  village: `
    <path d="M6 22 L20 10 L34 22 Z" fill="#c9784a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="10" y="22" width="20" height="12" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
    <rect x="17" y="26" width="6" height="8" fill="#8a6d3b"/>`,
  grove: `
    <circle cx="13" cy="17" r="10" fill="#7f9a57" stroke="${INK}" stroke-width="2"/>
    <circle cx="28" cy="20" r="9" fill="#93ad69" stroke="${INK}" stroke-width="2"/>
    <path d="M13 26 V36 M28 28 V36" stroke="${INK}" stroke-width="3"/>
    <circle cx="10" cy="15" r="1.5" fill="${INK}"/>
    <circle cx="17" cy="20" r="1.5" fill="${INK}"/>
    <circle cx="30" cy="18" r="1.5" fill="${INK}"/>`,
  sierra: `
    <path d="M2 34 L14 12 L22 24 L28 14 L38 34 Z" fill="#8fa3b5" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 12 L10 19 L18 19 Z" fill="#fff"/>`,
  alhambra: `
    <rect x="4" y="12" width="9" height="22" fill="#c9784a" stroke="${INK}" stroke-width="2"/>
    <rect x="27" y="12" width="9" height="22" fill="#c9784a" stroke="${INK}" stroke-width="2"/>
    <rect x="13" y="18" width="14" height="16" fill="#dd9a6a" stroke="${INK}" stroke-width="2"/>
    <path d="M16 34 V27 Q20 21 24 27 V34 Z" fill="#8a6d3b" stroke="${INK}" stroke-width="1.5"/>
    <path d="M4 12 V8 H7 V12 M10 12 V8 H13 V12 M27 12 V8 H30 V12 M33 12 V8 H36 V12" fill="none" stroke="${INK}" stroke-width="2"/>`,
};

export function regionSvg(id: string): string {
  const art = REGION_ART[id];
  return art ? `<svg viewBox="0 0 40 40" aria-hidden="true">${art}</svg>` : "";
}
