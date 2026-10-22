// SPDX-License-Identifier: AGPL-3.0-or-later
// ChatScreen - Ecrã Principal de Conversação do app com InlineEventCard e Header Nativo

import React, { useRef, useEffect } from 'react';
import { CatAvatar } from './CatAvatar';
import { CatAppearance, ChatMessage } from '../types';
import { InlineEventCard } from './InlineEventCard';

export interface ChatScreenProps {
  assistantName: string;
  appearance: CatAppearance;
  messages: ChatMessage[];
  chatInput: string;
  isListening: boolean;
  speakingMsgId: string | null;
  unreadNotifications?: boolean;
  onInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onToggleVoice: () => void;
  onToggleSpeak: (text: string, msgId: string) => void;
  onOpenDrawer: () => void;
  onOpenAvatarModal: () => void;
  onOpenNotifications: () => void;
  onOpenBottomSheet: () => void;
  onEditEvent?: (eventPayload: any) => void;
  onViewAgenda?: () => void;
  onProposalReminderChange?: (messageId: string, minutes: number | null) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  assistantName,
  appearance,
  messages,
  chatInput,
  isListening,
  speakingMsgId,
  unreadNotifications = true,
  onInputChange,
  onSendMessage,
  onToggleVoice,
  onToggleSpeak,
  onOpenDrawer,
  onOpenAvatarModal,
  onOpenNotifications,
  onOpenBottomSheet,
  onEditEvent,
  onViewAgenda,
  onProposalReminderChange
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] w-full max-w-2xl mx-auto font-sans select-none">
      {/* 1. Cabeçalho Flutuante */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)] backdrop-blur-md border-b border-[var(--border-subtle)]">
        {/* Botão Esquerdo: Histórico de Conversas */}
        <button
          onClick={onOpenDrawer}
          className="w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition shadow-sm"
          title="Histórico de Conversas"
          aria-label="Abrir conversas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        {/* Avatar Central com Tag em Pílula Sobreposta */}
        <div
          onClick={onOpenAvatarModal}
          className="relative flex flex-col items-center cursor-pointer group"
          title="Personalizar Assistente"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--surface-card)] border-2 border-[var(--border-strong)] group-hover:border-[var(--accent-border)] flex items-center justify-center overflow-hidden transition shadow-lg">
            <CatAvatar appearance={appearance} className="w-11 h-11" />
          </div>
          <span className="absolute -bottom-2 bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md tracking-tight">
            {assistantName}
          </span>
        </div>

        {/* Botão Direito: Sino de Notificações com Alerta Coral */}
        <button
          onClick={onOpenNotifications}
          className="relative w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition shadow-sm"
          title="Notificações"
          aria-label="Notificações"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadNotifications && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-primary)]" />
          )}
        </button>
      </header>

      {/* 2. Área de Mensagens do Chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth overscroll-contain will-change-scroll [overflow-anchor:auto]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 w-full max-w-full`}>
              {isUser ? (
                /* Balão do Utilizador: Direita (#2A2A2C, cantos arredondados) */
                <div className="max-w-[85%] rounded-[20px] rounded-br-sm bg-[var(--surface-input)] text-[var(--text-primary)] px-4 py-3 text-sm shadow-md leading-relaxed animate-fade-in break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {msg.text}
                </div>
              ) : (
                /* Resposta da IA: Esquerda em texto limpo, sem balão pesado */
                <div className="w-full max-w-full text-sm text-[var(--text-primary)] leading-relaxed pt-1 animate-fade-in min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{assistantName}</span>
                    <button
                      onClick={() => onToggleSpeak(msg.text, msg.id)}
                      className="text-[10px] font-semibold text-[var(--accent)] hover:underline shrink-0"
                    >
                      {speakingMsgId === msg.id ? 'Parar áudio' : 'Ouvir 🔊'}
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Inline Widget de Evento / Tarefa com Detecção de Conflitos */}
                  {msg.proposal && (
                    <div className="w-full max-w-full min-w-0 overflow-hidden">
                      <InlineEventCard
                        event={{
                          title: msg.proposal.payload.title || 'Compromisso',
                          date: msg.proposal.payload.date,
                          time: msg.proposal.payload.time || '14:30',
                          duration: msg.proposal.payload.duration || 60,
                          notes: msg.proposal.payload.notes
                        }}
                        conflictWarning={
                          msg.proposal.payload.title?.toLowerCase().includes('laércio') ||
                          msg.text.includes('sobrepõe')
                            ? 'O novo horário se sobrepõe ao treinamento das 14h e à call com a Started das 15h.'
                            : null
                        }
                        status={msg.proposal.status}
                        reminderMinutes={msg.proposal.payload.reminderMinutes ?? 15}
                        onReminderChange={(minutes) => onProposalReminderChange?.(msg.id, minutes)}
                        onEdit={() => onEditEvent?.(msg.proposal?.payload)}
                        onViewAgenda={onViewAgenda}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Banner de Cota Semanal & Footer de Entrada */}
      <div className="px-4 pb-2">
        {/* Banner de Limite de Uso */}
        <div className="mb-2 px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="truncate">You've reached your weekly usage limit... Model: gemini-3.5-flash-lite</span>
          </div>
          <span className="text-[var(--accent)] font-bold text-[10px] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full shrink-0">
            FREE
          </span>
        </div>

        {/* Barra de Entrada em Formato Pílula */}
        <form
          onSubmit={onSendMessage}
          className="flex items-center gap-2 bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-full px-2 py-1.5 shadow-2xl"
        >
          {/* Botão + (Abre o Bottom Sheet) */}
          <button
            type="button"
            onClick={onOpenBottomSheet}
            className="w-9 h-9 rounded-full bg-[var(--surface-input)] text-[var(--text-primary)] hover:bg-[var(--accent)] flex items-center justify-center font-bold text-lg transition duration-200"
            title="Ações e Anexos"
            aria-label="Abrir menu de ações"
          >
            +
          </button>

          {/* Campo de Texto */}
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Message ${assistantName}...`}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none px-2"
          />

          {/* Botão de Áudio / Microfone */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition ${
              isListening ? 'bg-[var(--accent)] text-[var(--text-primary)] animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Ditar por voz"
            aria-label="Gravar áudio"
          >
            🎙️
          </button>

          {/* Botão de Envio Rápido */}
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="w-9 h-9 rounded-full bg-[var(--accent)] disabled:opacity-40 text-[var(--text-primary)] flex items-center justify-center font-bold text-sm shadow-md transition hover:bg-[var(--accent-hover)]"
            title="Enviar mensagem"
            aria-label="Enviar mensagem"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
