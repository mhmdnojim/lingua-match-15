/** Selectable color themes — each one overrides the semantic tokens from index.css */

export interface ThemeDef {
  id: string;
  name: string;
  /** swatch preview colors (css hsl strings) */
  swatch: string[];
  /** css variable name -> hsl value */
  vars: Record<string, string>;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'forest',
    name: 'Forest & Moss',
    swatch: ['150 30% 7%', '135 30% 45%', '96 38% 48%', '42 55% 55%'],
    vars: {
      '--background': '150 30% 7%',
      '--foreground': '100 20% 96%',
      '--card': '150 26% 11%',
      '--card-foreground': '100 20% 96%',
      '--popover': '150 26% 11%',
      '--popover-foreground': '100 20% 96%',
      '--primary': '135 30% 45%',
      '--primary-foreground': '150 40% 8%',
      '--secondary': '150 20% 17%',
      '--secondary-foreground': '100 20% 96%',
      '--muted': '150 18% 17%',
      '--muted-foreground': '120 12% 62%',
      '--accent': '105 32% 60%',
      '--accent-foreground': '150 40% 8%',
      '--border': '150 16% 22%',
      '--input': '150 18% 17%',
      '--ring': '135 30% 45%',
      '--game-chinese': '96 38% 48%',
      '--game-english': '168 40% 42%',
      '--game-pinyin': '42 55% 55%',
      '--game-arabic': '22 42% 50%',
      '--game-selected': '105 40% 62%',
      '--game-matched': '140 45% 50%',
      '--game-error': '8 62% 52%',
      '--game-glow': '90 45% 60%',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    swatch: ['205 60% 8%', '192 55% 45%', '172 45% 48%', '38 70% 58%'],
    vars: {
      '--background': '205 60% 8%',
      '--foreground': '195 30% 96%',
      '--card': '205 50% 12%',
      '--card-foreground': '195 30% 96%',
      '--popover': '205 50% 12%',
      '--popover-foreground': '195 30% 96%',
      '--primary': '192 55% 45%',
      '--primary-foreground': '205 60% 8%',
      '--secondary': '205 35% 18%',
      '--secondary-foreground': '195 30% 96%',
      '--muted': '205 32% 18%',
      '--muted-foreground': '198 18% 65%',
      '--accent': '172 50% 52%',
      '--accent-foreground': '205 60% 8%',
      '--border': '205 28% 24%',
      '--input': '205 32% 18%',
      '--ring': '192 55% 45%',
      '--game-chinese': '205 60% 52%',
      '--game-english': '172 45% 45%',
      '--game-pinyin': '38 70% 58%',
      '--game-arabic': '250 40% 58%',
      '--game-selected': '192 70% 60%',
      '--game-matched': '160 55% 48%',
      '--game-error': '5 65% 55%',
      '--game-glow': '185 70% 60%',
    },
  },
  {
    id: 'noir',
    name: 'Noir & Gold',
    swatch: ['30 8% 6%', '43 62% 55%', '190 45% 50%', '350 45% 55%'],
    vars: {
      '--background': '30 8% 6%',
      '--foreground': '42 30% 95%',
      '--card': '30 8% 11%',
      '--card-foreground': '42 30% 95%',
      '--popover': '30 8% 11%',
      '--popover-foreground': '42 30% 95%',
      '--primary': '43 62% 55%',
      '--primary-foreground': '30 20% 8%',
      '--secondary': '30 7% 17%',
      '--secondary-foreground': '42 30% 95%',
      '--muted': '30 6% 17%',
      '--muted-foreground': '40 10% 66%',
      '--accent': '43 45% 62%',
      '--accent-foreground': '30 20% 8%',
      '--border': '38 12% 24%',
      '--input': '30 6% 17%',
      '--ring': '43 62% 55%',
      '--game-chinese': '43 62% 52%',
      '--game-english': '190 40% 45%',
      '--game-pinyin': '30 25% 55%',
      '--game-arabic': '350 40% 52%',
      '--game-selected': '45 80% 62%',
      '--game-matched': '150 45% 48%',
      '--game-error': '0 70% 55%',
      '--game-glow': '45 85% 65%',
    },
  },

  {
    id: 'midnight',
    name: 'Midnight Indigo',
    swatch: ['240 40% 8%', '250 65% 60%', '190 70% 52%', '325 60% 58%'],
    vars: {
      '--background': '240 40% 8%',
      '--foreground': '225 25% 96%',
      '--card': '240 35% 12%',
      '--card-foreground': '225 25% 96%',
      '--popover': '240 35% 12%',
      '--popover-foreground': '225 25% 96%',
      '--primary': '250 65% 60%',
      '--primary-foreground': '240 40% 8%',
      '--secondary': '240 25% 18%',
      '--secondary-foreground': '225 25% 96%',
      '--muted': '240 22% 18%',
      '--muted-foreground': '230 15% 66%',
      '--accent': '190 70% 52%',
      '--accent-foreground': '240 40% 8%',
      '--border': '240 20% 24%',
      '--input': '240 22% 18%',
      '--ring': '250 65% 60%',
      '--game-chinese': '265 65% 60%',
      '--game-english': '160 60% 45%',
      '--game-pinyin': '35 85% 58%',
      '--game-arabic': '200 70% 55%',
      '--game-selected': '255 75% 68%',
      '--game-matched': '155 65% 52%',
      '--game-error': '0 75% 58%',
      '--game-glow': '270 80% 65%',
    },
  },
  {
    id: 'frost',
    name: 'Arctic Frost (light)',
    swatch: ['205 45% 97%', '205 65% 42%', '175 50% 38%', '255 50% 58%'],
    vars: {
      '--background': '205 45% 97%',
      '--foreground': '212 40% 15%',
      '--card': '0 0% 100%',
      '--card-foreground': '212 40% 15%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '212 40% 15%',
      '--primary': '205 65% 42%',
      '--primary-foreground': '205 45% 98%',
      '--secondary': '205 35% 92%',
      '--secondary-foreground': '212 40% 18%',
      '--muted': '205 30% 92%',
      '--muted-foreground': '208 16% 42%',
      '--accent': '175 50% 40%',
      '--accent-foreground': '205 45% 98%',
      '--border': '205 25% 85%',
      '--input': '205 30% 92%',
      '--ring': '205 65% 42%',
      '--game-chinese': '205 65% 45%',
      '--game-english': '175 50% 36%',
      '--game-pinyin': '255 45% 55%',
      '--game-arabic': '325 45% 50%',
      '--game-selected': '205 75% 55%',
      '--game-matched': '160 50% 40%',
      '--game-error': '0 62% 52%',
      '--game-glow': '195 80% 58%',
    },
  },

  {
    id: 'plum',
    name: 'Plum Dusk',
    swatch: ['295 30% 9%', '315 50% 58%', '265 45% 60%', '45 70% 60%'],
    vars: {
      '--background': '295 30% 9%',
      '--foreground': '300 18% 96%',
      '--card': '295 26% 13%',
      '--card-foreground': '300 18% 96%',
      '--popover': '295 26% 13%',
      '--popover-foreground': '300 18% 96%',
      '--primary': '315 50% 58%',
      '--primary-foreground': '295 35% 10%',
      '--secondary': '295 20% 19%',
      '--secondary-foreground': '300 18% 96%',
      '--muted': '295 18% 19%',
      '--muted-foreground': '300 12% 66%',
      '--accent': '265 45% 62%',
      '--accent-foreground': '295 35% 10%',
      '--border': '295 16% 25%',
      '--input': '295 18% 19%',
      '--ring': '315 50% 58%',
      '--game-chinese': '315 45% 52%',
      '--game-english': '265 45% 55%',
      '--game-pinyin': '45 70% 58%',
      '--game-arabic': '185 45% 45%',
      '--game-selected': '320 60% 66%',
      '--game-matched': '150 50% 48%',
      '--game-error': '0 70% 56%',
      '--game-glow': '310 70% 66%',
    },
  },
  {
    id: 'paper',
    name: 'Paper & Ink (light)',
    swatch: ['210 20% 97%', '215 45% 40%', '190 40% 40%', '15 60% 52%'],
    vars: {
      '--background': '210 20% 97%',
      '--foreground': '215 30% 14%',
      '--card': '0 0% 100%',
      '--card-foreground': '215 30% 14%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '215 30% 14%',
      '--primary': '215 45% 40%',
      '--primary-foreground': '210 25% 98%',
      '--secondary': '210 20% 91%',
      '--secondary-foreground': '215 30% 18%',
      '--muted': '210 18% 91%',
      '--muted-foreground': '215 12% 42%',
      '--accent': '190 40% 42%',
      '--accent-foreground': '210 25% 98%',
      '--border': '210 16% 84%',
      '--input': '210 18% 91%',
      '--ring': '215 45% 40%',
      '--game-chinese': '215 45% 45%',
      '--game-english': '190 40% 38%',
      '--game-pinyin': '38 60% 45%',
      '--game-arabic': '15 55% 48%',
      '--game-selected': '215 60% 55%',
      '--game-matched': '150 40% 40%',
      '--game-error': '0 60% 50%',
      '--game-glow': '210 70% 58%',
    },
  },
];

export const DEFAULT_THEME_ID = 'forest';
const THEME_KEY = 'vocab-game-theme';

export function getTheme(id: string): ThemeDef {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

/** The theme that follows the given one (wraps around) */
export function nextThemeId(id: string): string {
  const index = THEMES.findIndex(t => t.id === id);
  return THEMES[(index + 1 + THEMES.length) % THEMES.length].id;
}

export function applyTheme(id: string): void {
  const theme = getTheme(id);
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => root.style.setProperty(key, value));
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* ignore */
  }
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}
