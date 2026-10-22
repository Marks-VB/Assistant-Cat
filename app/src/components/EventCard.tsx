// SPDX-License-Identifier: AGPL-3.0-or-later
// EventCard - Card Interativo de Evento (Inline Widget do app com Linha de Tempo Coral e Alerta de Conflito)

import React, { useState } from 'react';
import { TriangleAlert, Pencil, CalendarDays, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal } from '../types';

interface EventCardProps {
  proposal: Proposal;
  onConfirm: () => void;
  onEdit: () => void;
  onViewCalendar?: () => void;
  conflictWarning?: string | null;
}

export const EventCard: React.FC<EventCardProps> = ({
  proposal,
  onConfirm,
  onEdit,
  onViewCalendar,
  conflictWarning
}) => {
  const [callMe, setCallMe] = useState(false);
  const [reminder15Min, setReminder15Min] = useState(true);

  const payload = proposal.payload;
  const isExecuted = proposal.status === 'executed';

  // Calcular término com base na duração
  const calculateEndTime = (startTime?: string, durationMin = 60) => {
    if (!startTime) return '10:00';
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const startTime = payload.time || '14:30';
  const endTime = calculateEndTime(payload.time, payload.duration || 60);

  return (
    <div className="w-full my-3 space-y-2">
      {/* Alerta Inteligente de Conflito (se houver) */}
      {conflictWarning && (
        <div className="rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] p-3 text-xs text-[var(--accent)] flex items-start gap-2.5">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 leading-relaxed">
            <strong className="block font-semibold">Alerta de Conflito:</strong>
            {conflictWarning}
          </div>
        </div>
      )}

      {/* Card Principal do Evento (Estilo do app) */}
      <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 shadow-xl text-[var(--text-primary)]">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="font-bold text-base text-[var(--text-primary)] tracking-tight">{payload.title || 'Novo compromisso'}</h3>
          <button
            onClick={onEdit}
            aria-label="Editar dados do evento"
            className="text-[var(--text-primary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--overlay-weak)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Editar dados do evento"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Linha de Tempo em Vermelho Coral */}
        <div className="py-3 flex items-center justify-between font-mono text-sm text-[var(--accent)] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2 tracking-wide">
            <span>{startTime}</span>
            <span className="opacity-60">→</span>
            <span>{endTime}</span>
          </div>
        </div>

        {/* Controles Internos do Card */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
          {/* Toggle Call Me */}
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">Call Me (ligar no horário)</span>
            <button
              type="button"
              role="switch"
              aria-checked={callMe}
              aria-label="Ligar no horário do compromisso"
              onClick={() => setCallMe(!callMe)}
              className={cn(
                'h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200',
                callMe ? 'bg-[var(--accent)]' : 'bg-[var(--surface-hover)]'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  callMe ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Lembrete 15 min */}
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>15 minutes before</span>
            <input
              type="checkbox"
              checked={reminder15Min}
              onChange={e => setReminder15Min(e.target.checked)}
              className="accent-[#FF4D4D] rounded"
            />
          </div>
        </div>

        {/* Ação de Confirmação se pendente */}
        {!isExecuted && (
          <button
            onClick={onConfirm}
            className="mt-4 w-full py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-primary)] font-bold text-xs shadow-md transition"
          >
            Confirmar e Salvar Evento
          </button>
        )}
      </div>

      {/* Ações Rápidas abaixo do card */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs">
        <button
          onClick={onViewCalendar}
          className="rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] px-3.5 py-1.5 border border-[var(--border-strong)] flex items-center gap-1.5 font-medium transition min-h-[44px]"
        >
          <CalendarDays size={14} aria-hidden="true" />
          <span>Ver agenda</span>
        </button>
        <button
          onClick={onEdit}
          aria-label="Histórico e reversão de alteração"
          className="text-[var(--text-primary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--overlay-weak)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Histórico / Reverter alteração"
        >
          <History size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
