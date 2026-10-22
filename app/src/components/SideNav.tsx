// SPDX-License-Identifier: AGPL-3.0-or-later
// SideNav - Navegação lateral (desktop) com a identidade do Assistant Cat.

import React from 'react';
import { CatAvatar } from './CatAvatar';
import { AppTabKey, NAV_ITEMS } from './FloatingBottomBar';
import { CatAppearance } from '../types';

export interface SideNavProps {
  currentTab: AppTabKey;
  onChangeTab: (tab: AppTabKey) => void;
  badgeCounts?: Partial<Record<AppTabKey, number>>;
  assistantName: string;
  appearance: CatAppearance;
  themeLabel: string;
  onOpenAvatarModal: () => void;
  className?: string;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentTab,
  onChangeTab,
  badgeCounts = {},
  assistantName,
  appearance,
  themeLabel,
  onOpenAvatarModal,
  className = ''
}) => {
  return (
    <aside
      className={`app-sidenav fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-[var(--border-subtle)] bg-[var(--nav-bg)] px-3 py-5 backdrop-blur-xl shadow-[var(--nav-shadow)] ${className}`}
      aria-label="Navegação principal"
    >
      {/* Marca: squircle + gato, para não repetir o avatar circular do header. */}
      <button
        type="button"
        onClick={onOpenAvatarModal}
        title="Personalizar assistente"
        className="group mb-6 flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors duration-200 hover:bg-[var(--overlay-weak)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-[var(--border-strong)] bg-[var(--surface-card)] shadow-[var(--surface-shadow)] transition-transform duration-200 group-hover:scale-[1.04]">
          <CatAvatar appearance={appearance} className="h-10 w-10" />
        </span>
        <span className="min-w-0">
          <span className="app-brand-name block text-[13px] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
            Assistant Cat
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
            {assistantName}
          </span>
        </span>
      </button>

      <nav role="tablist" aria-label="Seções" className="flex flex-col gap-1">
        {NAV_ITEMS.map((tab) => {
          const active = currentTab === tab.key;
          const badge =
            typeof badgeCounts[tab.key] === 'number' && badgeCounts[tab.key]! > 0
              ? badgeCounts[tab.key]! > 99
                ? '99+'
                : String(badgeCounts[tab.key])
              : null;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              aria-label={badge ? `${tab.label} (${badge} pendentes)` : tab.label}
              onClick={() => onChangeTab(tab.key)}
              className={`relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-left text-[13px] outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? 'bg-[var(--accent-soft)] font-bold text-[var(--text-primary)]'
                  : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-weak)] hover:text-[var(--text-primary)]'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
                />
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                  active
                    ? 'bg-[var(--surface-card)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {tab.icon(active)}
              </span>
              <span className="truncate">{tab.label}</span>
              {badge && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-extrabold leading-none text-[var(--text-primary)] tabular-nums">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé: estado do tema, reforçando que o visual é personalizável. */}
      <div className="mt-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 shadow-[var(--surface-shadow)]">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          Tema ativo
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          <span className="truncate">{themeLabel}</span>
        </p>
        <p className="mt-2 text-[10px] leading-snug text-[var(--text-secondary)]">
          Me → Tema e navegação
        </p>
      </div>
    </aside>
  );
};

export default SideNav;
