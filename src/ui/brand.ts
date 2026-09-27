import type { AccessWarmth } from '../../shared/contracts';

export const PYRGRAPH_LOGO_SRC = '/pyrgraph4.png';

export const ACCESS_COLOR: Record<AccessWarmth, string> = {
  hot: 'var(--pg-hot)',
  warm: 'var(--pg-warm)',
  connected: 'var(--pg-connected)',
  cold: 'var(--pg-cold)',
};

export const ACCESS_LABEL: Record<AccessWarmth, string> = {
  hot: 'Hot access',
  warm: 'Warm access',
  connected: 'Connected',
  cold: 'No known path',
};

// Sampled from cmocean's published thermal-rgb.txt palette.
// Source: https://github.com/matplotlib/cmocean/blob/main/cmocean/rgb/thermal-rgb.txt
const THERMAL_STOPS = [
  [4, 35, 51],
  [23, 51, 121],
  [85, 59, 156],
  [129, 79, 143],
  [175, 95, 130],
  [222, 111, 101],
  [249, 146, 66],
  [249, 196, 65],
  [232, 250, 91],
] as const;

export function routeRankColor(rank: number, total: number): string {
  const position = total <= 1 ? 1 : 1 - rank / (total - 1);
  const scaled = position * (THERMAL_STOPS.length - 1);
  const index = Math.min(Math.floor(scaled), THERMAL_STOPS.length - 2);
  const mix = scaled - index;
  const rgb = THERMAL_STOPS[index].map((value, channel) =>
    Math.round(value + (THERMAL_STOPS[index + 1][channel] - value) * mix),
  );

  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
