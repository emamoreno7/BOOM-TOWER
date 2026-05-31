export interface ThemeDefinition {
  id: string;
  name: string;
  bgTopColor: number;
  bgBottomColor: number;
  gridBgColor: number;
  gridLineColor: number;
  hudTextColor: string;
  accentColor: number;
}

export const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Dark',
    bgTopColor: 0x0a0a1a,
    bgBottomColor: 0x1a1a2e,
    gridBgColor: 0x111122,
    gridLineColor: 0x223344,
    hudTextColor: '#ffffff',
    accentColor: 0xffd700,
  },
  {
    id: 'light',
    name: 'Light',
    bgTopColor: 0xeeeeff,
    bgBottomColor: 0xccddff,
    gridBgColor: 0xddeeff,
    gridLineColor: 0xaabbcc,
    hudTextColor: '#111111',
    accentColor: 0xff6600,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bgTopColor: 0x000011,
    bgBottomColor: 0x110022,
    gridBgColor: 0x0a0011,
    gridLineColor: 0x220033,
    hudTextColor: '#cc88ff',
    accentColor: 0xcc00ff,
  },
];
