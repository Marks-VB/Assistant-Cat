// SPDX-License-Identifier: AGPL-3.0-or-later
// BottomSheet - Menu de Ações e Ferramentas do Botão +

import React, { useState } from 'react';
import { Brain, Camera, Folder, Globe, Handshake, Image, ListChecks, Zap } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: string) => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, onSelectTool }) => {
  const [showMore, setShowMore] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md animate-fade-in overscroll-contain transition-all"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
        className="w-full max-w-lg mx-auto bg-[var(--surface-card)] backdrop-blur-2xl border-t border-[var(--border-strong)] rounded-t-[32px] p-5 animate-slide-up overscroll-contain max-h-[90dvh] overflow-y-auto"
      >
        {/* Barra superior / Indicador Apple Handle */}
        <div className="w-10 h-1.5 bg-[var(--overlay-strong)] rounded-full mx-auto mb-4 hover:bg-[var(--overlay-stronger)] transition-colors" />

        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-bold text-base text-[var(--text-primary)] tracking-tight">Adicionar e Ferramentas</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-primary)] hover:text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--overlay-weak)] hover:bg-[var(--overlay)] active:scale-95 transition-all"
          >
            Fechar
          </button>
        </div>

        {/* Topo do Sheet: 3 Botões Retangulares em Grid (Photos, Camera, Files SUPER) */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => onSelectTool('photos')}
            className="rounded-[18px] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] p-3.5 flex flex-col items-center justify-center gap-1.5 hover:bg-[var(--surface-hover)] active:scale-95 transition-all shadow-sm"
          >
            <span className="text-[var(--accent)] transition-transform group-hover:scale-110">
              <Image size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Photos</span>
          </button>
          <button
            onClick={() => onSelectTool('camera')}
            className="rounded-[18px] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] p-3.5 flex flex-col items-center justify-center gap-1.5 hover:bg-[var(--surface-hover)] active:scale-95 transition-all shadow-sm"
          >
            <span className="text-[var(--accent)] transition-transform group-hover:scale-110">
              <Camera size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Camera</span>
          </button>
          <button
            onClick={() => onSelectTool('files')}
            className="relative rounded-[18px] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] p-3.5 flex flex-col items-center justify-center gap-1.5 hover:bg-[var(--surface-hover)] active:scale-95 transition-all shadow-sm"
          >
            <span className="absolute top-1.5 right-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-[var(--text-primary)] text-[8px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
              SUPER
            </span>
            <span className="text-[var(--accent)] transition-transform group-hover:scale-110">
              <Folder size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Files</span>
          </button>
        </div>

        {/* Lista de Ferramentas do Agente */}
        <div className="space-y-2 text-sm">
          <button
            onClick={() => onSelectTool('coordination')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] active:scale-[0.98] text-left border border-[var(--border-subtle)] transition-all shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
              <Handshake size={18} strokeWidth={1.9} />
            </span>
            <div>
              <div className="font-bold text-[var(--text-primary)] text-xs">Coordination</div>
              <div className="text-[11px] text-[var(--text-secondary)]">O assistente contata participantes e organiza reuniões</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('todo')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] active:scale-[0.98] text-left border border-[var(--border-subtle)] transition-all shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
              <ListChecks size={18} strokeWidth={1.9} />
            </span>
            <div>
              <div className="font-bold text-[var(--text-primary)] text-xs">To-do</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Add to your intelligent to-do list</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('trigger')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] active:scale-[0.98] text-left border border-[var(--border-subtle)] transition-all shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
              <Zap size={18} strokeWidth={1.9} />
            </span>
            <div>
              <div className="font-bold text-[var(--text-primary)] text-xs">Trigger</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Track real-world updates and alarms</div>
            </div>
          </button>

          {/* Accordion More (...) */}
          <div className="pt-1">
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full py-2 text-xs font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <span>{showMore ? 'Menos' : 'More (...) '}</span>
            </button>

            {showMore && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] animate-fade-in">
                <button
                  onClick={() => onSelectTool('web_search')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] active:scale-[0.98] text-left border border-[var(--border-subtle)] transition-all shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
                    <Globe size={18} strokeWidth={1.9} />
                  </span>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-xs">Web search</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Pesquisar informações atualizadas online</div>
                  </div>
                </button>
                <button
                  onClick={() => onSelectTool('memory')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] active:scale-[0.98] text-left border border-[var(--border-subtle)] transition-all shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
                    <Brain size={18} strokeWidth={1.9} />
                  </span>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-xs">Memory</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Preferências e fatos anotados sobre você</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
