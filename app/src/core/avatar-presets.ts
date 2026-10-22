// SPDX-License-Identifier: AGPL-3.0-or-later
// Presets de aparência do assistente (atalhos combinados, sempre editáveis).

import { CatAppearance } from '../types';

export interface AvatarPreset {
  label: string;
  appearance: CatAppearance;
  /** Fundo de apoio da prévia circular (não é a pelagem). */
  bgCircle: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { label: 'Normal', appearance: { coat: 'white', outfit: 'none', glasses: 'none' }, bgCircle: '#64B5F6' },
  { label: 'Laranja', appearance: { coat: 'ginger', outfit: 'none', glasses: 'none' }, bgCircle: '#FFD54F' },
  { label: 'Festeiro', appearance: { coat: 'calico', outfit: 'none', glasses: 'round' }, bgCircle: '#BA68C8' },
  { label: 'Executivo', appearance: { coat: 'tuxedo', outfit: 'suit', glasses: 'none' }, bgCircle: '#4FC3F7' },
  { label: 'Nerd', appearance: { coat: 'gray_tabby', outfit: 'hoodie', glasses: 'square' }, bgCircle: '#4DB6AC' }
];
