// SPDX-License-Identifier: AGPL-3.0-or-later
// ChatScreen - Ecrã Principal de Conversação do app com InlineEventCard e Header Nativo

import React, { useRef, useEffect, useState } from 'react';
import { Mic, Plus, Send } from 'lucide-react';
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
  /** O assistente está aguardando a resposta do provedor de IA. */
  isThinking?: boolean;
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
  isThinking = false,
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
  const didMount = useRef(false);
  /**
   * IDs de mensagens que chegaram depois que a tela montou.
   * Guardados num Set que só cresce: a classe de animação não pode ser
   * recalculada a cada render, senão um re-render no meio do movimento
   * (ex.: o fim do "digitando") cancela a animação pela metade.
   */
  const knownIds = useRef(new Set(messages.map((m) => m.id)));
  const freshIds = useRef(new Set<string>());
  for (const msg of messages) {
    if (!knownIds.current.has(msg.id)) {
      knownIds.current.add(msg.id);
      freshIds.current.add(msg.id);
    }
  }

  /** Se o usuário está no fim da conversa, acompanhamos a rolagem. */
  const stickToBottom = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!didMount.current) {
      didMount.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }

    if (!stickToBottom.current) {
      setShowJumpToLatest(true);
      return;
    }

    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceToBottom < 80;
    if (stickToBottom.current) setShowJumpToLatest(false);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = true;
    setShowJumpToLatest(false);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative flex flex-col h-[calc(100dvh-80px)] w-full max-w-2xl mx-auto font-sans">
      {/* 1. Cabeçalho Flutuante */}
      <header className="chat-header sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        {/* Botão Esquerdo: Histórico de Conversas */}
        <button
          onClick={onOpenDrawer}
          className="press-scale w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition shadow-sm"
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
          <span
            title={assistantName}
            className="absolute -bottom-2 max-w-[160px] truncate whitespace-nowrap rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-2.5 py-0.5 text-[10px] font-bold leading-none tracking-tight text-[var(--text-primary)] shadow-md"
          >
            {assistantName}
          </span>
        </div>

        {/* Botão Direito: Sino de Notificações com Alerta Coral */}
        <button
          onClick={onOpenNotifications}
          className="press-scale relative w-10 h-10 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition shadow-sm"
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
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain [overflow-anchor:auto]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          // Só anima o que acabou de chegar; o histórico já está na tela.
          const isFresh = freshIds.current.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 w-full max-w-full ${
                isFresh ? 'chat-msg-in' : ''
              }`}
            >
              {isUser ? (
                /* Balão do Utilizador: Direita (#2A2A2C, cantos arredondados) */
                <div className="max-w-[85%] rounded-[20px] rounded-br-sm bg-[var(--surface-input)] text-[var(--text-primary)] px-4 py-3 text-sm shadow-md leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {msg.text}
                </div>
              ) : (
                /* Resposta da IA: Esquerda em texto limpo, sem balão pesado */
                <div className="w-full max-w-full text-sm text-[var(--text-primary)] leading-relaxed pt-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{assistantName}</span>
                    <button
                      type="button"
                      onClick={() => onToggleSpeak(msg.text, msg.id)}
                      aria-pressed={speakingMsgId === msg.id}
                      className={`tap-target shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors duration-[var(--dur-fast)] hover:bg-[var(--overlay-weak)] ${
                        speakingMsgId === msg.id
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'text-[var(--accent)] hover:underline'
                      }`}
                    >
                      {speakingMsgId === msg.id ? 'Parar áudio' : 'Ouvir'}
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Inline Widget de Evento / Tarefa com Detecção de Conflitos */}
                  {msg.proposal && (
                    <div className={`w-full max-w-full min-w-0 overflow-hidden ${isFresh ? 'chat-secondary' : ''}`}>
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

        {/* Camada ambiente: o assistente está pensando.
            Anunciado por role="status"; os pontos são decorativos. */}
        {isThinking && (
          <div
            role="status"
            aria-live="polite"
            className="chat-msg-in flex flex-col items-start w-full"
          >
            <span className="sr-only">{assistantName} está escrevendo…</span>
            <div
              aria-hidden="true"
              className="flex items-center gap-1.5 rounded-[18px] rounded-bl-sm bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3.5 py-3 shadow-sm"
            >
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
            </div>
          </div>
        )}
      </div>

      {/* Voltar ao fim da conversa: só aparece se o usuário rolou para cima.
          Evita que uma resposta nova arranque a leitura de quem está no histórico. */}
      {showJumpToLatest && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="animate-scale-in absolute bottom-32 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-3.5 py-2 text-[11px] font-bold text-[var(--text-primary)] shadow-xl press-scale"
        >
          Novas mensagens ↓
        </button>
      )}

      {/* 3. Faixa de status da IA & Footer de Entrada */}
      <div className="px-4 pb-2">
        {/* Aviso de configuração da IA (sem cota falsa: o consumo é do provedor escolhido) */}
        <div className="mb-2 px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="truncate">IA opcional — configure o provedor em Personalizar → IA</span>
          </div>
          <span className="text-[var(--accent)] font-bold text-[10px] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full shrink-0">
            PRIVADO
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
            className="press-scale w-9 h-9 rounded-full bg-[var(--surface-input)] text-[var(--text-primary)] hover:bg-[var(--accent)] flex items-center justify-center font-bold text-lg transition duration-200 min-h-[44px] min-w-[44px]"
            title="Ações e Anexos"
            aria-label="Abrir menu de ações"
          >
            <Plus size={16} aria-hidden="true" />
          </button>

          {/* Campo de Texto */}
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Escreva para ${assistantName}...`}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none px-2"
          />

          {/* Botão de Áudio / Microfone */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`press-scale w-9 h-9 rounded-full flex items-center justify-center text-sm transition min-h-[44px] min-w-[44px] ${
              isListening
                ? 'bg-[var(--accent)] text-[var(--text-primary)] ring-2 ring-[var(--accent-border)] animate-pulse'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Ditar por voz"
            aria-label="Gravar áudio"
            aria-pressed={isListening}
          >
            <Mic size={16} aria-hidden="true" />
          </button>

          {/* Botão de Envio Rápido: press em 90ms, sem overshoot */}
          <button
            type="submit"
            disabled={!chatInput.trim() || isThinking}
            className="press-scale w-9 h-9 rounded-full bg-[var(--accent)] disabled:opacity-40 disabled:pointer-events-none text-[var(--text-primary)] flex items-center justify-center font-bold text-sm shadow-md transition hover:bg-[var(--accent-hover)] min-h-[44px] min-w-[44px]"
            title="Enviar mensagem"
            aria-label="Enviar mensagem"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
