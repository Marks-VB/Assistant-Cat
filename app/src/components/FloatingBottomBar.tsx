// SPDX-License-Identifier: AGPL-3.0-or-later
// FloatingBottomBar - Barra de Navegação Inferior em Formato de Pílula Flutuante (estilo do app)

import React from 'react';

export type AppTabKey = 'chat' | 'now' | 'calendar' | 'tasks' | 'me';

export interface FloatingBottomBarProps {
  currentTab: AppTabKey;
  onChangeTab: (tab: AppTabKey) => void;
  badgeCounts?: Partial<Record<AppTabKey, number>>;
  className?: string;
}

export interface NavItem {
  key: AppTabKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

/** Fonte única dos itens de navegação (barra inferior e menu lateral). */
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'chat',
    label: 'Chat',
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '0' : '1.8'}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    )
  },
  {
    key: 'now',
    label: 'Agora',
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.4' : '1.8'}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
      </svg>
    )
  },
  {
    key: 'calendar',
    label: 'Agenda',
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.2' : '1.8'}
        viewBox="0 0 24 24"
      >
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
        {active && <circle cx="12" cy="15" r="2" fill="currentColor" />}
      </svg>
    )
  },
  {
    key: 'tasks',
    label: 'Tarefas',
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.2' : '1.8'}
        viewBox="0 0 24 24"
      >
        <rect x="2" y="7" width="20" height="14" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l2 2 4-4" />
      </svg>
    )
  },
  {
    key: 'me',
    label: 'Eu',
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '0' : '1.8'}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    )
  }
];

export const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  currentTab,
  onChangeTab,
  badgeCounts = {},
  className = ''
}) => {
  const tabs = NAV_ITEMS;

  // Formatador defensivo de contagem de notificações/badges
  const formatBadgeCount = (count?: number): string | null => {
    if (typeof count !== 'number' || isNaN(count) || count <= 0) return null;
    if (count > 999) return '999+';
    if (count > 99) return '99+';
    return String(count);
  };

  return (
    <nav
      role="tablist"
      aria-label="Navegação Principal"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom, 12px))'
      }}
      className={`fixed left-1/2 -translate-x-1/2 z-40 bg-[var(--nav-bg)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-full p-1.5 flex items-center justify-center gap-1 shadow-[var(--nav-shadow)] max-w-[calc(100vw-24px)] overflow-visible transition-all duration-300 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        const formattedBadge = formatBadgeCount(badgeCounts[tab.key]);

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeTab(tab.key)}
            className={`relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-full text-xs font-semibold select-none outline-none active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isActive
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-md scale-100 ring-1 ring-white/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-weak)]'
            }`}
          >
            <span className="flex items-center justify-center shrink-0" aria-hidden="true">{tab.icon(isActive)}</span>
            {/* Em telas pequenas a aba inativa esconde o rótulo visualmente, mas ele
                continua no nome acessível (sr-only) — WCAG 2.5.3: o nome contém o texto visível. */}
            <span className={`tracking-tight truncate max-w-[60px] sm:max-w-none ${isActive ? 'inline font-bold' : 'sr-only sm:not-sr-only sm:inline font-medium'}`}>{tab.label}</span>

            {/* Badge de alerta/contagem blindado */}
            {formattedBadge && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1 flex h-4 min-w-[16px] max-w-[36px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-extrabold text-[var(--text-primary)] shadow-sm ring-2 ring-[var(--surface-card)] tabular-nums leading-none pointer-events-none truncate"
                >
                  {formattedBadge}
                </span>
                <span className="sr-only">{` ${formattedBadge} novas notificações`}</span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default FloatingBottomBar;
