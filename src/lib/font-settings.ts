export interface FontSettings {
  family: string;
  size: number;   // px
  weight: number; // 300–700
}

export const FONT_OPTIONS: { value: string; label: string; css: string }[] = [
  { value: 'noto-serif-sc', label: '思源宋体', css: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif' },
  { value: 'ma-shan-zheng', label: '马上正楷', css: '"Ma Shan Zheng", "PingFang SC", cursive' },
  { value: 'system-serif',  label: '系统衬线', css: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", serif' },
  { value: 'system-sans',   label: '系统无衬线', css: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif' },
];

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  family: 'noto-serif-sc',
  size: 16,
  weight: 400,
};

const STORAGE_KEY = 'reading-font-settings';

export function getFontSettings(): FontSettings {
  if (typeof window === 'undefined') return DEFAULT_FONT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<FontSettings>;
    return {
      family: parsed.family || DEFAULT_FONT_SETTINGS.family,
      size: parsed.size || DEFAULT_FONT_SETTINGS.size,
      weight: parsed.weight || DEFAULT_FONT_SETTINGS.weight,
    };
  } catch {
    return DEFAULT_FONT_SETTINGS;
  }
}

export function saveFontSettings(settings: FontSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applyFontSettings(settings);
}

export function applyFontSettings(settings: FontSettings): void {
  if (typeof document === 'undefined') return;
  const opt = FONT_OPTIONS.find((o) => o.value === settings.family);
  const fontFamily = opt?.css || FONT_OPTIONS[0].css;
  const root = document.documentElement;
  root.style.setProperty('--reading-font-family', fontFamily);
  root.style.setProperty('--reading-font-size', `${settings.size}px`);
  root.style.setProperty('--reading-font-weight', `${settings.weight}`);
}

/** Inline script to prevent flash — paste into <script> in layout */
export const FONT_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('reading-font-settings')||'{}');var f={"noto-serif-sc":"\\"Noto Serif SC\\", \\"PingFang SC\\", serif","ma-shan-zheng":"\\"Ma Shan Zheng\\", cursive","system-serif":"\\"PingFang SC\\", \\"Microsoft YaHei\\", serif","system-sans":"\\"PingFang SC\\", \\"Microsoft YaHei\\", sans-serif"};var r=document.documentElement.style;r.setProperty('--reading-font-family',f[s.family]||f["noto-serif-sc"]);r.setProperty('--reading-font-size',(s.size||16)+'px');r.setProperty('--reading-font-weight',(s.weight||400));}catch(e){}})();`;
