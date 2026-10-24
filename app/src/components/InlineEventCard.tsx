// SPDX-License-Identifier: AGPL-3.0-or-later
// InlineEventCard - Card Interativo de Compromisso/Tarefa no Chat (estilo do app)

import React, { useState } from 'react';
import { TriangleAlert, CalendarDays, History } from 'lucide-react';
import { cn } from '../lib/utils';

export interface InlineEventData {
  id?: string;
  title: string;
  date?: string;
  time?: string;
  duration?: number; // minutos
  notes?: string;
}

export interface InlineEventCardProps {
  event: InlineEventData;
  conflictWarning?: string | null;
  status?: 'needs_review' | 'executed' | 'cancelled';
  reminderMinutes?: number | null;
  onReminderChange?: (minutes: number | null) => void;
  onConfirm?: () => void;
  onEdit?: () => void;
  onViewAgenda?: () => void;
  onRevert?: () => void;
}

const REMINDER_OPTIONS = [5, 10, 15, 30, 60];

export const InlineEventCard: React.FC<InlineEventCardProps> = ({
  event,
  conflictWarning,
  status = 'executed',
  reminderMinutes,
  onReminderChange,
  onConfirm,
  onEdit,
  onViewAgenda,
  onRevert
}) => {
  const [callMe, setCallMe] = useState(false);
  const [localReminder, setLocalReminder] = useState<number | null>(null);
  const reminder = reminderMinutes !== undefined ? reminderMinutes : localReminder;

  const handleReminderChange = (value: string) => {
    const minutes = value === 'off' ? null : Number(value);
    setLocalReminder(minutes);
    onReminderChange?.(minutes);
  };

  // Calcula término estimado
  const calculateEndTime = (startTime = '14:30', duration = 60) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = (isNaN(h) ? 14 : h) * 60 + (isNaN(m) ? 30 : m) + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const startTime = event.time || '14:30';
  const endTime = calculateEndTime(event.time, event.duration || 60);
  const isExecuted = status === 'executed';

  return (
    <div className="w-full my-3 space-y-2 select-none animate-fade-in font-sans">
      {/* Alerta Inteligente de Sobreposição de Horário */}
      {conflictWarning && (
        <div className="rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-border)] p-3 flex items-start gap-2.5 text-[var(--accent)] shadow-sm max-w-full overflow-hidden">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-xs leading-relaxed flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
            <span className="font-bold shrink-0">Atenção: </span>{conflictWarning}
          </div>
        </div>
      )}

      {/* Cartão Principal do Evento (Superfície #1E1E1E) */}
      <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)] shadow-xl transition-all max-w-full overflow-hidden">
        {/* Topo do Card */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
            <h4
              className="font-bold text-sm tracking-tight text-[var(--text-primary)] truncate min-w-0 flex-1"
              title={event.title || 'Novo compromisso'}
            >
              {event.title || 'Novo compromisso'}
            </h4>
          </div>
          <button
            onClick={onEdit}
            className="text-[var(--text-primary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--overlay-weak)] transition shrink-0"
            title="Editar compromisso"
            aria-label="Editar compromisso"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>

        {/* Linha Temporal em Vermelho Coral */}
        <div className="py-3 flex items-center justify-between gap-2 font-mono text-xs text-[var(--accent)] font-bold">
          <span className="bg-[var(--accent-soft)] px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] shrink-0 truncate max-w-[120px]">
            {event.date || 'Today'}
          </span>
          <div className="flex items-center gap-2 tracking-wide text-sm shrink-0">
            <span>{startTime}</span>
            <span className="opacity-50 font-normal select-none">→</span>
            <span>{endTime}</span>
          </div>
        </div>

        {/* Controles Internos e Toggles Funcionais */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
          {/* Toggle Call Me */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)] font-medium truncate">Ligar no horário combinado</span>
            <button
              type="button"
              role="switch"
              aria-checked={callMe}
              aria-label="Ligar no horário do compromisso"
              onClick={() => setCallMe(!callMe)}
              className={cn(
                'h-6 w-11 rounded-full p-0.5 shrink-0 transition-colors duration-200',
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

          {/* Lembrete configurável antes do compromisso */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)] font-medium truncate">Lembrete antes</span>
            <select
              value={reminder == null ? 'off' : String(reminder)}
              onChange={(e) => handleReminderChange(e.target.value)}
              disabled={isExecuted}
              aria-label="Tempo do lembrete antes do compromisso"
              className="shrink-0 rounded-full bg-[var(--surface-hover)] border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
            >
              <option value="off">Sem lembrete</option>
              {REMINDER_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min antes
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ações Inferiores (Chips rápidos) */}
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onViewAgenda}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--overlay-weak)] hover:bg-[var(--overlay)] text-[11px] font-semibold text-[var(--text-primary)] transition shrink-0 min-h-[44px]"
          >
            <CalendarDays size={14} aria-hidden="true" />
            <span>Ver agenda</span>
          </button>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {!isExecuted && onConfirm && (
              <button
                onClick={onConfirm}
                className="px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-[var(--text-primary)] text-[11px] font-bold hover:bg-[var(--accent-hover)] transition shadow-md shrink-0"
              >
                Confirmar
              </button>
            )}
            {onRevert && (
              <button
                onClick={onRevert}
                aria-label="Reverter alteração"
                className="w-11 h-11 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--overlay)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] transition shrink-0"
                title="Reverter / Histórico"
              >
                <History size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineEventCard;
