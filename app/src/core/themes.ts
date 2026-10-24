// SPDX-License-Identifier: AGPL-3.0-or-later
// Catálogo de temas visuais disponíveis no app.

import { ThemeId } from '../types';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  /** Cores de prévia: fundo, superfície e acento. */
  preview: [string, string, string];
  /** Cor da barra do sistema (meta theme-color). */
  themeColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    label: 'Escuro',
    description: 'Verde-gato sobre carvão',
    preview: ['#121212', '#1C1C1F', '#7ECFB6'],
    themeColor: '#121212'
  },
  {
    id: 'porcelain',
    label: 'Claro',
    description: 'Papel quente e sereno',
    preview: ['#F7F4EE', '#FFFFFF', '#2B7A6B'],
    themeColor: '#F7F4EE'
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    description: 'Monocromático preciso',
    preview: ['#FAFAFA', '#FFFFFF', '#111111'],
    themeColor: '#FAFAFA'
  },
  {
    id: 'glass',
    label: 'Vidro',
    description: 'Aurora e vidro fosco',
    preview: ['#060B16', '#16233A', '#38BDF8'],
    themeColor: '#060B16'
  },
  {
    id: 'nord',
    label: 'Nord',
    description: 'Ártico calmo e frio',
    preview: ['#2E3440', '#3B4252', '#88C0D0'],
    themeColor: '#2E3440'
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon magenta e ciano',
    preview: ['#07010F', '#12001F', '#FF2E97'],
    themeColor: '#07010F'
  },
  {
    id: 'retro',
    label: 'Retrô',
    description: 'Papel, serifa e terracota',
    preview: ['#F3E7CE', '#FBF3E2', '#B5462F'],
    themeColor: '#F3E7CE'
  },
  {
    id: 'system',
    label: 'Sistema',
    description: 'Segue o aparelho',
    preview: ['#121212', '#F7F4EE', '#7ECFB6'],
    themeColor: '#121212'
  }
];

export const DEFAULT_THEME: ThemeId = 'midnight';

/** Converte valores antigos ('dark'/'light') e inválidos para o tema padrão. */
export function normalizeTheme(value: unknown): ThemeId {
  if (value === 'dark') return 'midnight';
  if (value === 'light') return 'porcelain';
  if (THEME_OPTIONS.some((option) => option.id === value)) return value as ThemeId;
  return DEFAULT_THEME;
}

export function resolveTheme(theme: ThemeId, prefersDark: boolean): Exclude<ThemeId, 'system'> {
  if (theme === 'system') return prefersDark ? 'midnight' : 'porcelain';
  return theme;
}
