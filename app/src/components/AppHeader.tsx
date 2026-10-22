// SPDX-License-Identifier: AGPL-3.0-or-later
// AppHeader - Header Flutuante com Gaveta de Chats, Avatar com Pill Tag e Sino de Notificações

import React from 'react';
import { CatAvatar } from './CatAvatar';
import { CatAppearance } from '../types';

interface AppHeaderProps {
  assistantName: string;
  appearance: CatAppearance;
  onOpenChatsDrawer: () => void;
  onOpenAvatarModal: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  assistantName,
  appearance,
  onOpenChatsDrawer,
  onOpenAvatarModal,
  onOpenNotifications,
  unreadNotificationsCount = 2
}) => {
  return (
    <header className="app-header sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
      {/* Botão Circular Esquerdo: Lista de Chats */}
      <button
        onClick={onOpenChatsDrawer}
        className="w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition"
        title="Histórico de Conversas"
        aria-label="Abrir histórico de chats"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </button>

      {/* Avatar Central com Pill Tag */}
      <div
        onClick={onOpenAvatarModal}
        className="relative flex flex-col items-center cursor-pointer group"
        title="Personalizar Assistente"
      >
        <div className="w-11 h-11 rounded-full bg-[var(--surface-card)] border-2 border-[var(--border-strong)] group-hover:border-[var(--accent-border)] flex items-center justify-center overflow-hidden transition shadow-lg">
          <CatAvatar appearance={appearance} className="w-11 h-11" />
        </div>
        <span
          title={assistantName}
          className="absolute -bottom-2 max-w-[160px] truncate whitespace-nowrap rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-2.5 py-0.5 text-[10px] font-bold leading-none tracking-tight text-[var(--text-primary)] shadow-md"
        >
          {assistantName}
        </span>
      </div>

      {/* Botão Circular Direito: Sino com Ponto Vermelho Coral */}
      <button
        onClick={onOpenNotifications}
        className="relative w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition"
        title="Central de Avisos"
        aria-label="Abrir notificações"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-primary)]" />
        )}
      </button>
    </header>
  );
};

export default AppHeader;
