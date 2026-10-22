// SPDX-License-Identifier: AGPL-3.0-or-later
// NowTimeline - Timeline Contínua (Yesterday, Today, Tomorrow) com Linha Vermelha de Hora Atual

import React from 'react';
import { CalendarEvent } from '../types';

interface NowTimelineProps {
  events: CalendarEvent[];
  onOpenEvent: (event: CalendarEvent) => void;
  onNewEvent: () => void;
}

export const NowTimeline: React.FC<NowTimelineProps> = ({ events, onOpenEvent, onNewEvent }) => {
  const currentTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Ícone por categoria
  const getCategoryIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('call') || t.includes('reuni') || t.includes('alinhamento')) {
      return { icon: '📞', bg: '#7C4DFF' };
    }
    if (t.includes('treino') || t.includes('estudo') || t.includes('aula') || t.includes('livro')) {
      return { icon: '📚', bg: '#00B0FF' };
    }
    if (t.includes('saude') || t.includes('medico') || t.includes('consulta')) {
      return { icon: '🩺', bg: '#00E676' };
    }
    return { icon: '🗓️', bg: '#FF9100' };
  };

  return (
    <div className="space-y-6 pb-12 text-[var(--text-primary)]">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Timeline</h2>
        <button
          onClick={onNewEvent}
          className="rounded-full bg-[var(--accent)] text-[var(--text-primary)] px-3.5 py-1.5 text-xs font-bold shadow-md hover:bg-[var(--accent-hover)] transition"
        >
          + Add Event
        </button>
      </div>

      {/* Yesterday */}
      <div className="space-y-3 opacity-60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Yesterday</h3>
        <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center text-lg">
            ✓
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)]">16:00 - 17:00</div>
            <div className="text-sm font-semibold text-[var(--text-primary)] line-through">Revisão e Planejamento</div>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="space-y-3 relative pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Today</h3>

        {/* Indicador de Hora Atual: Linha horizontal vermelha atravessando a tela com ponto vermelho à esquerda */}
        <div className="relative py-2 flex items-center">
          <div className="w-3 h-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-ring)] z-10 -ml-1" />
          <div className="h-[2px] bg-[var(--accent)] flex-1 ml-1" />
          <span className="text-[10px] font-mono font-bold text-[var(--accent)] ml-2 tracking-wider">
            NOW {currentTimeStr}
          </span>
        </div>

        {/* Cards de Eventos do Dia */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] italic py-2">Nenhum evento restante para hoje.</p>
          ) : (
            events.map((ev) => {
              const cat = getCategoryIcon(ev.title);
              return (
                <div
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition cursor-pointer shadow-lg group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md"
                      style={{ backgroundColor: cat.bg }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-[var(--accent)]">
                        {ev.allDay ? 'Dia inteiro' : `${ev.time} (${ev.duration} min)`}
                      </div>
                      <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-amber-200 transition">
                        {ev.title}
                      </div>
                      {ev.notes && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">{ev.notes}</div>}
                    </div>
                  </div>
                  <span className="text-[var(--text-primary)] text-xs">›</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tomorrow */}
      <div className="space-y-3 pt-3 opacity-90">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Tomorrow</h3>
        <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center text-lg">
            🗓️
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)]">09:00 - 10:00</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Treinamento de Equipe e Sync Geral</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowTimeline;
