// SPDX-License-Identifier: AGPL-3.0-or-later
// Opções de posição da navegação principal.

import { NavLayout } from '../types';

export interface LayoutOption {
  id: NavLayout;
  label: string;
  hint: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: 'auto', label: 'Automático', hint: 'Lateral no computador, inferior no celular' },
  { id: 'bottom', label: 'Inferior', hint: 'Barra flutuante sempre embaixo' },
  { id: 'side', label: 'Lateral', hint: 'Menu fixo à esquerda a partir de telas médias' }
];
