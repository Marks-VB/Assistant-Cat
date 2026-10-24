// SPDX-License-Identifier: AGPL-3.0-or-later
// NotificationsModal - Central de Avisos com Slide-in e 4 Cards Empilhados

import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in overscroll-contain"
    >
      <div
        style={{
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
        }}
        className="w-full max-w-sm h-full max-h-dvh bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] p-5 flex flex-col justify-between shadow-2xl overflow-y-auto overscroll-contain animate-slide-left"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Notificações</h2>
              <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Demonstração
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar notificações"
              className="w-8 h-8 rounded-full bg-[var(--surface-card)] text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-strong)]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* 4 Cards Empilhados com Pílulas Vermelhas (1 >, 2 >, 4 >) */}
          <div className="mt-5 space-y-3.5 stagger-list">
            {/* 1. Reminders */}
            <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">Lembretes</span>
                <span className="bg-[var(--accent)] text-[var(--text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">2 &gt;</span>
              </div>
              <div className="space-y-2 border-l-2 border-[var(--accent)] pl-3 text-xs text-[var(--text-secondary)]">
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">14:15</span> — Call com o Laércio (em 15 min)
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">14:50</span> — Treinamento de equipe
                </div>
              </div>
            </div>

            {/* 2. Usage */}
            <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Sparkles size={14} className="text-[var(--accent)]" aria-hidden="true" />
                  <span>Uso de IA</span>
                </div>
                <span className="bg-[var(--accent)] text-[var(--text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">1 &gt;</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Sua cota semanal de IA foi reiniciada. O modelo ativo é o configurado em Personalizar → IA.</p>
            </div>

            {/* 3. Insights */}
            <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Insights</span>
                <span className="bg-[var(--accent)] text-[var(--text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">1 &gt;</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Você teve 85% de conclusão nas tarefas prioritárias desta semana.</p>
            </div>

            {/* 4. Briefings */}
            <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Resumos</span>
                <span className="bg-[var(--accent)] text-[var(--text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">4 &gt;</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">“Semana cheia: 12 reuniões e 18 tarefas concluídas.”</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--surface-elevated)] transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default NotificationsModal;
