// SPDX-License-Identifier: AGPL-3.0-or-later
// BookingFlow - Fluxo de Criação de Link de Agendamento com IA Híbrida (Chat ao Vivo + Formulário)

import React, { useState } from 'react';

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ isOpen, onClose, assistantName }) => {
  const [step, setStep] = useState<'main' | 'choose' | 'hybrid_chat'>('main');

  // 5 campos do checklist
  const [bookingData, setBookingData] = useState({
    name: 'Mentoria ou Alinhamento 30 min',
    duration: '30 min',
    availability: 'Segunda a Sexta (10h - 18h)',
    calendar: 'Agenda Principal',
    bookingLink: 'assistantcat.app/@marcos/30min'
  });

  const [inputMsg, setInputMsg] = useState('');
  const [completedSteps, setCompletedSteps] = useState(3); // Simulado inicial

  if (!isOpen) return null;

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    // Preenchimento em tempo real
    setCompletedSteps(5);
    setBookingData({
      name: inputMsg.slice(0, 30),
      duration: '45 min',
      availability: 'Segunda a Quinta (14h - 19h)',
      calendar: 'Agenda Principal',
      bookingLink: `assistantcat.app/@marcos/${encodeURIComponent(inputMsg.slice(0, 10))}`
    });
    setInputMsg('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-dvh max-h-dvh overflow-y-auto overscroll-contain animate-slide-up"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
        <h2 className="font-bold text-sm">Booking Link & Agendamento</h2>
        <div className="w-9" />
      </div>

      <div className="max-w-md mx-auto w-full p-5 space-y-6 flex-1 flex flex-col justify-between">
        {step === 'main' && (
          <div className="space-y-6 text-center pt-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-4xl shadow-2xl">
              🔗
            </div>
            <div>
              <h3 className="text-xl font-bold">Seu Link Público de Agendamento</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-xs mx-auto">
                Permita que clientes e colegas escolham horários livres direto da sua agenda sem troca de e-mails.
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-xs font-mono text-[var(--accent)] font-bold flex items-center justify-between">
              <span>assistantcat.app/@marcos</span>
              <button className="bg-[var(--overlay)] px-3 py-1 rounded-full text-[var(--text-primary)] text-[11px] hover:bg-[var(--overlay-strong)]">
                Share
              </button>
            </div>

            <button
              onClick={() => setStep('choose')}
              className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--text-primary)] font-bold text-sm shadow-xl hover:bg-[var(--accent-hover)] transition"
            >
              + Create booking page
            </button>
          </div>
        )}

        {/* Escolha do método de criação */}
        {step === 'choose' && (
          <div className="space-y-4 pt-10">
            <h3 className="text-lg font-bold text-center">New booking type</h3>
            <p className="text-xs text-[var(--text-secondary)] text-center mb-6">Como prefere configurar seu link?</p>

            <button
              onClick={() => setStep('hybrid_chat')}
              className="w-full p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-strong)] hover:border-[var(--accent)] flex items-center gap-3 text-left transition"
            >
              <span className="text-2xl">💬</span>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">Create by chatting with {assistantName}</div>
                <div className="text-xs text-[var(--text-secondary)]">Fale normalmente e a IA preenche as regras e horários</div>
              </div>
            </button>

            <button
              onClick={() => setStep('hybrid_chat')}
              className="w-full p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] flex items-center gap-3 text-left transition"
            >
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">Set up manually</div>
                <div className="text-xs text-[var(--text-secondary)]">Definir disponibilidade e durações manualmente</div>
              </div>
            </button>
          </div>
        )}

        {/* Interface Híbrida: Formulário com Checklist + Chat ao Vivo com IA */}
        {step === 'hybrid_chat' && (
          <div className="flex flex-col h-full justify-between space-y-4">
            {/* Card de Preview com badge DRAFT */}
            <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Booking preview</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  DRAFT
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">{bookingData.name}</h4>
                <p className="text-xs text-[var(--accent)] font-mono mt-0.5">{bookingData.bookingLink}</p>
              </div>

              {/* Checklist de Progresso 0 of 5 */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="text-[11px] font-bold text-[var(--text-secondary)]">
                  Setup progress {completedSteps} of 5 completed
                </div>
                <div className="space-y-1.5 text-xs text-[var(--text-primary)]">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> <span>Name: {bookingData.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> <span>Duration: {bookingData.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> <span>Availability: {bookingData.availability}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{completedSteps >= 4 ? '✓' : '○'}</span> <span>Calendar: {bookingData.calendar}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{completedSteps >= 5 ? '✓' : '○'}</span> <span>Link: Ativo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Input dedicada para conversar com a IA */}
            <form onSubmit={handleSendPrompt} className="flex items-center gap-2 bg-[var(--surface-card)] border border-[var(--border-strong)] rounded-full p-2 pl-4">
              <input
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder={`Tell ${assistantName} about your booking type...`}
                className="flex-1 bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs"
              >
                ↑
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
