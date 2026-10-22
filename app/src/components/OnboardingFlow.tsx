// SPDX-License-Identifier: AGPL-3.0-or-later
// OnboardingFlow - Boas-vindas de primeiro acesso: assistente, tema, navegação e preferências.
// Todas as escolhas aplicam ao vivo e são persistidas pelo App.

import React, { useEffect, useState } from 'react';
import { CatAppearance, NavLayout, ThemeId } from '../types';
import { THEME_OPTIONS } from '../core/themes';
import { AVATAR_PRESETS } from '../core/avatar-presets';
import { LAYOUT_OPTIONS } from '../core/layout';
import { CatAvatar } from './CatAvatar';
import { LayoutPreview } from './LayoutPreview';

export interface OnboardingFlowProps {
  open: boolean;
  theme: ThemeId;
  layout: NavLayout;
  appearance: CatAppearance;
  assistantName: string;
  userName: string;
  autoSpeak: boolean;
  defaultDuration: number;
  onSelectTheme: (id: ThemeId) => void;
  onSelectLayout: (id: NavLayout) => void;
  onSelectAppearance: (appearance: CatAppearance) => void;
  onSetAssistantName: (name: string) => void;
  onSetUserName: (name: string) => void;
  onSetAutoSpeak: (enabled: boolean) => void;
  onSetDefaultDuration: (minutes: number) => void;
  onFinish: () => void;
}

const STEPS = [
  { id: 'welcome', label: 'Boas-vindas' },
  { id: 'assist', label: 'Assistente' },
  { id: 'theme', label: 'Tema' },
  { id: 'nav', label: 'Navegação' },
  { id: 'prefs', label: 'Preferências' },
  { id: 'done', label: 'Pronto' }
] as const;

type StepId = (typeof STEPS)[number]['id'];

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  open,
  theme,
  layout,
  appearance,
  assistantName,
  userName,
  autoSpeak,
  defaultDuration,
  onSelectTheme,
  onSelectLayout,
  onSelectAppearance,
  onSetAssistantName,
  onSetUserName,
  onSetAutoSpeak,
  onSetDefaultDuration,
  onFinish
}) => {
  const [step, setStep] = useState<StepId>('welcome');
  const [name, setName] = useState(assistantName);
  const [calledName, setCalledName] = useState(userName);
  const [presetIndex, setPresetIndex] = useState(0);

  // Reabrir as boas-vindas sempre reinicia do começo.
  useEffect(() => {
    if (open) {
      setStep('welcome');
      setName(assistantName);
      setCalledName(userName);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      onSetAssistantName(name.trim() || assistantName);
      onSetUserName(calledName.trim() || userName);
      onFinish();
      return;
    }
    setStep(STEPS[stepIndex + 1].id);
  };
  const goBack = () => {
    if (!isFirst) setStep(STEPS[stepIndex - 1].id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boas-vindas do Assistant Cat"
      className="fixed inset-0 z-[80] flex min-h-dvh max-h-dvh flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] animate-slide-up"
    >
      {/* Progresso + pular */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-6 bg-[var(--accent)]'
                  : i < stepIndex
                    ? 'w-1.5 bg-[var(--accent)] opacity-60'
                    : 'w-1.5 bg-[var(--overlay-strong)]'
              }`}
            />
          ))}
        </div>
        {!isFirst && !isLast && (
          <button
            type="button"
            onClick={() => {
              onSetAssistantName(name.trim() || assistantName);
              onSetUserName(calledName.trim() || userName);
              onFinish();
            }}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Pular
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Passo 1: Boas-vindas */}
          {step === 'welcome' && (
            <div className="flex min-h-[52dvh] flex-col items-center justify-center space-y-6 text-center animate-fade-in">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-card)] shadow-[var(--surface-shadow)]">
                <CatAvatar appearance={appearance} className="h-24 w-24" />
              </div>
              <div className="space-y-2">
                <p className="app-brand-name text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Assistant Cat
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight">
                  Um assistente com a sua cara
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Antes de começar, escolha o assistente, o tema e a forma de navegar.
                  Tudo pode ser mudado depois em <strong>Me</strong>.
                </p>
              </div>
              <ul className="w-full space-y-2 text-left">
                {[
                  ['🐈', 'Privado e local', 'Seus dados ficam neste aparelho.'],
                  ['🎨', 'Visual flexível', 'Temas, vidro, retrô, neon — com efeitos próprios.'],
                  ['🧭', 'Menu do seu jeito', 'Barra inferior ou menu lateral no desktop.']
                ].map(([icon, title, text]) => (
                  <li
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 shadow-[var(--surface-shadow)]"
                  >
                    <span className="text-xl" aria-hidden="true">{icon}</span>
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="block text-xs text-[var(--text-secondary)]">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Passo 2: Assistente */}
          {step === 'assist' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">Quem é o seu gato?</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Escolha a aparência e os nomes. É só visual — personalidade fica em Personalizar.
                </p>
              </div>

              <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[30px] border-2 border-[var(--accent)] bg-[var(--surface-card)] shadow-[var(--surface-shadow)] ring-4 ring-[var(--accent-ring)]">
                <CatAvatar appearance={appearance} className="h-28 w-28" />
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Nome do assistente
                  </span>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      onSetAssistantName(e.target.value.trim() || assistantName);
                    }}
                    maxLength={40}
                    placeholder="Nome do assistente"
                    className="block w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface-input)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Como você quer ser chamado?
                  </span>
                  <input
                    value={calledName}
                    onChange={(e) => {
                      setCalledName(e.target.value);
                      onSetUserName(e.target.value.trim() || userName);
                    }}
                    maxLength={40}
                    placeholder="Seu nome ou apelido"
                    className="block w-full rounded-full border border-[var(--border-strong)] bg-[var(--surface-input)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-5 items-start gap-1 py-1" role="group" aria-label="Aparências do gato">
                {AVATAR_PRESETS.map((preset, idx) => {
                  const active = idx === presetIndex;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setPresetIndex(idx);
                        onSelectAppearance(preset.appearance);
                      }}
                      className={`flex flex-col items-center justify-self-center gap-1.5 transition-all duration-300 press-scale ${
                        active ? 'scale-105 opacity-100' : 'scale-90 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 p-1 transition-all duration-300 ${
                          active
                            ? 'border-[var(--accent)] ring-4 ring-[var(--accent-ring)] shadow-[var(--surface-shadow)]'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.bgCircle }}
                      >
                        <CatAvatar appearance={preset.appearance} className="h-10 w-10" />
                      </span>
                      <span className={`text-[10px] font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Passo 3: Tema */}
          {step === 'theme' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">Qual é o clima?</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Cada tema tem cores e efeitos próprios — vidro, neon, papel ou monocromia.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const active = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectTheme(option.id)}
                      className={`press-scale rounded-2xl border p-2.5 text-left transition ${
                        active
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="mb-2 flex h-6 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
                        {option.preview.map((color, index) => (
                          <span
                            key={`${option.id}-${index}`}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="block text-xs font-bold text-[var(--text-primary)]">{option.label}</span>
                      <span className="block text-[10px] leading-tight text-[var(--text-secondary)]">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Passo 4: Navegação */}
          {step === 'nav' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">Como fica o menu?</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  No computador, o menu pode ficar na lateral; no celular, embaixo.
                </p>
              </div>

              <div className="space-y-2">
                {LAYOUT_OPTIONS.map((option) => {
                  const active = layout === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelectLayout(option.id)}
                      className={`press-scale flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="w-28 shrink-0">
                        <LayoutPreview layout={option.id} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[var(--text-primary)]">{option.label}</span>
                        <span className="block text-[11px] leading-snug text-[var(--text-secondary)]">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Passo 5: Preferências rápidas */}
          {step === 'prefs' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">Preferências rápidas</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Só o essencial para o dia a dia. O resto fica nas configurações.
                </p>
              </div>

              <div className="space-y-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-[var(--surface-shadow)]">
                <div>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Duração padrão dos compromissos
                  </span>
                  <div role="group" aria-label="Duração padrão" className="grid grid-cols-4 gap-2">
                    {DURATION_OPTIONS.map((minutes) => {
                      const active = defaultDuration === minutes;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onSetDefaultDuration(minutes)}
                          className={`press-scale rounded-full border py-2 text-xs font-bold transition ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          {minutes} min
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">Ler respostas em voz alta</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      TTS automático quando o assistente responde
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSpeak}
                    onClick={() => onSetAutoSpeak(!autoSpeak)}
                    className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
                      autoSpeak ? 'bg-[var(--accent)]' : 'bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        autoSpeak ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Passo 6: Pronto */}
          {step === 'done' && (
            <div className="flex min-h-[52dvh] flex-col items-center justify-center space-y-6 text-center animate-fade-in">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-soft)] text-4xl shadow-[var(--surface-shadow)]">
                🎉
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Tudo pronto!</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {name.trim() || assistantName} já está do seu jeito{calledName.trim() ? `, ${calledName.trim()}` : ''}.
                  Você pode ajustar tudo de novo em <strong>Me</strong>.
                </p>
              </div>
              <ul className="flex flex-wrap items-center justify-center gap-2">
                <li className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold shadow-[var(--surface-shadow)]">
                  {THEME_OPTIONS.find((o) => o.id === theme)?.label}
                </li>
                <li className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold shadow-[var(--surface-shadow)]">
                  Menu {LAYOUT_OPTIONS.find((o) => o.id === layout)?.label.toLowerCase()}
                </li>
                <li className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold shadow-[var(--surface-shadow)]">
                  {AVATAR_PRESETS[presetIndex]?.label}
                </li>
                <li className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold shadow-[var(--surface-shadow)]">
                  {defaultDuration} min padrão
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé com navegação dos passos */}
      <div
        className="mx-auto flex w-full max-w-md items-center gap-3 px-5"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
      >
        {!isFirst && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--overlay-weak)]"
          >
            Voltar
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          className="flex-1 rounded-full bg-[var(--accent)] py-3 text-xs font-bold text-[var(--text-primary)] shadow-[var(--nav-shadow)] transition hover:bg-[var(--accent-hover)]"
        >
          {isFirst ? 'Começar' : isLast ? 'Entrar no app' : 'Avançar'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
