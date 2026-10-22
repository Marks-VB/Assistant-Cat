// SPDX-License-Identifier: AGPL-3.0-or-later
// Miniatura do layout de navegação (usada nas opções e nas boas-vindas).

import React from 'react';
import { NavLayout } from '../types';

export const LayoutPreview: React.FC<{ layout: NavLayout }> = ({ layout }) => {
  const sideRail = layout !== 'bottom';
  const bottomBar = layout !== 'side';
  const contentLeft = sideRail ? 'left-7' : 'left-1.5';

  return (
    <span
      aria-hidden="true"
      className="relative block h-12 w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
    >
      {/* Cabeçalho */}
      <span className="absolute left-1.5 right-1.5 top-1.5 h-1 rounded-full bg-[var(--overlay-strong)]" />
      {/* Menu lateral */}
      {sideRail && (
        <span className="absolute bottom-1.5 left-1.5 top-4 w-4 rounded-md bg-[var(--overlay-strong)]" />
      )}
      {/* Barra inferior */}
      {bottomBar && (
        <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1/2 -translate-x-1/2 rounded-full bg-[var(--overlay-strong)]" />
      )}
      {/* Conteúdo */}
      <span className={`absolute ${contentLeft} right-1.5 top-4 h-1.5 w-2/3 rounded-full bg-[var(--overlay-weak)]`} />
      <span className={`absolute ${contentLeft} top-7 h-1.5 w-1/2 rounded-full bg-[var(--overlay-weak)]`} />
    </span>
  );
};

export default LayoutPreview;
