// SPDX-License-Identifier: AGPL-3.0-or-later
// AvatarModal - Modal de Personalização "Meu Assistente" com Carrossel Snap-Center e Configurações

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { CatAppearance, Profile, AISettingsState } from '../types';
import { AI_PROVIDERS, DEFAULT_AI_SETTINGS } from '../core/providers';
import { AVATAR_PRESETS } from '../core/avatar-presets';
import { CatAvatar } from './CatAvatar';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appearance: CatAppearance;
  profile: Profile;
  autoSpeak: boolean;
  ai?: AISettingsState;
  onSave: (newAppearance: CatAppearance, newProfile: Profile, autoSpeak: boolean, ai: AISettingsState) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  appearance,
  profile,
  autoSpeak: initialAutoSpeak,
  ai: initialAi,
  onSave
}) => {
  const [activeAvatarIndex, setActiveAvatarIndex] = useState(0);
  const [name, setName] = useState(profile.assistantName);
  const [userName, setUserName] = useState(profile.name);
  const [personality, setPersonality] = useState('Friendly');
  const [autoSpeak, setAutoSpeak] = useState(initialAutoSpeak);
  const [aiProvider, setAiProvider] = useState(initialAi?.provider || DEFAULT_AI_SETTINGS.provider);
  const [aiModel, setAiModel] = useState(initialAi?.model || DEFAULT_AI_SETTINGS.model);
  const [aiKey, setAiKey] = useState(initialAi?.apiKey || '');
  const [aiBase, setAiBase] = useState(initialAi?.baseUrl || '');
  const [aiProxy, setAiProxy] = useState(initialAi?.proxyUrl || '');
  const isNative = Capacitor.isNativePlatform();

  if (!isOpen) return null;

  // 5 variações de destaque conforme a timeline do app:
  // 1) Normal (fundo azul), 2) Laranja (fundo amarelo), 3) Festeiro, 4) Executivo (terno), 5) Nerd (óculos)
  const avatarVariations = AVATAR_PRESETS;

  const handleSelectVariation = (idx: number) => {
    setActiveAvatarIndex(idx);
  };

  const handleApply = () => {
    const selected = avatarVariations[activeAvatarIndex].appearance;
    onSave(selected, { name: userName, assistantName: name }, autoSpeak, {
      provider: aiProvider,
      model: aiModel.trim(),
      apiKey: aiKey.trim(),
      baseUrl: aiBase.trim(),
      proxyUrl: aiProxy.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)] min-h-dvh max-h-dvh overflow-y-auto overscroll-contain animate-slide-up text-[var(--text-primary)]"
    >
      {/* Header com botão X na esquerda */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] backdrop-blur-md">
        <button
          onClick={onClose}
          aria-label="Fechar personalização"
          className="press-scale w-9 h-9 rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <h2 className="font-bold text-base tracking-tight">Personalizar Assistente</h2>
        <button
          onClick={handleApply}
          className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--accent-hover)]"
        >
          Salvar
        </button>
      </div>

      <div className="max-w-md mx-auto w-full p-5 space-y-6">
        {/* Carrossel Horizontal Snap-Center com Física Fluida Apple/Emil */}
        <div className="py-6 flex items-center justify-center gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
          {avatarVariations.map((item, idx) => {
            const isCenter = idx === activeAvatarIndex;
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => handleSelectVariation(idx)}
                aria-label={`Avatar ${item.label}`}
                aria-pressed={isCenter}
                className={`flex flex-col items-center cursor-pointer select-none snap-center outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 ${
                  isCenter ? 'scale-110 z-10' : 'scale-90 hover:scale-95'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center p-2 border-2 transition-all duration-300 shadow-xl ${
                    isCenter
                      ? 'border-[var(--accent)] ring-4 ring-[var(--accent-ring)] scale-100 shadow-[0_8px_24px_rgba(255,77,77,0.3)]'
                      : 'border-transparent shadow-md opacity-50 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: item.bgCircle,
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <CatAvatar appearance={item.appearance} className="w-24 h-24" />
                </div>
                {/* O rótulo mantém contraste cheio mesmo quando o card está
                    encolhido: a escala já comunica a seleção, e apagar o texto
                    derrubava o contraste para 2.4:1 (WCAG AA pede 4.5:1). */}
                <span
                  className={`mt-2 text-xs font-bold transition-colors duration-200 ${
                    isCenter ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Card de Configurações do Assistente (Lista agrupada) */}
        <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] text-sm shadow-xl">
          <div className="p-4 flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium text-xs">Nome</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              aria-label="Nome do assistente"
              className="bg-transparent text-right font-semibold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium text-xs">Conta</span>
            <span className="text-[var(--text-secondary)] text-xs">Somente neste aparelho</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium text-xs">Personalidade</span>
            <select
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              aria-label="Personalidade do assistente"
              className="bg-transparent text-right font-semibold text-[var(--text-primary)] focus:outline-none text-xs"
            >
              <option value="Friendly" className="bg-[var(--surface-card)]">Amigável</option>
              <option value="Professional" className="bg-[var(--surface-card)]">Profissional</option>
              <option value="Direct" className="bg-[var(--surface-card)]">Direto</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium text-xs">Como o assistente te chama</span>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              aria-label="Como o assistente te chama"
              className="bg-transparent text-right font-semibold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[var(--text-primary)] text-xs">Ler respostas em voz alta</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Ler respostas de voz via TTS automaticamente</div>
            </div>
            {/* role="switch" dá o estado ligado/desligado ao leitor de tela;
                antes era um botão sem nome acessível nenhum. */}
            <button
              type="button"
              role="switch"
              aria-checked={autoSpeak}
              aria-label="Ler respostas em voz alta"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`press-scale shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ${
                autoSpeak ? 'bg-[var(--accent)]' : 'bg-[var(--surface-hover)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  autoSpeak ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* IA: provider + modelo + chave (OpenAI-compatível) */}
        <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] text-sm shadow-xl">
          <div className="p-4">
            <div className="font-semibold text-[var(--text-primary)] text-xs mb-1">IA — Provedor</div>
            <select
              value={aiProvider}
              onChange={(e) => {
                const id = e.target.value;
                setAiProvider(id);
                const def = AI_PROVIDERS.find((p) => p.id === id);
                if (def && !aiModel.trim()) setAiModel(def.defaultModel);
              }}
              className="w-full bg-transparent font-semibold text-[var(--text-primary)] text-xs focus:outline-none"
              aria-label="Provedor de IA"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--surface-card)]">{p.label}</option>
              ))}
            </select>
          </div>
          <div className="p-4">
            <div className="font-semibold text-[var(--text-primary)] text-xs mb-1">Modelo</div>
            <input
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder={AI_PROVIDERS.find((p) => p.id === aiProvider)?.defaultModel}
              className="w-full bg-transparent font-semibold text-[var(--text-primary)] text-xs focus:outline-none"
              aria-label="Modelo de IA"
            />
          </div>
          <div className="p-4">
            <div className="font-semibold text-[var(--text-primary)] text-xs mb-1">Chave (só neste aparelho)</div>
            <input
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              type="password"
              autoComplete="off"
              placeholder={AI_PROVIDERS.find((p) => p.id === aiProvider)?.hint}
              className="w-full bg-transparent font-semibold text-[var(--text-primary)] text-xs focus:outline-none"
              aria-label="Chave da IA"
            />
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">Vazia = usa secret do servidor. Com chave, vai direto via proxy sem salvar em servidor.</div>
          </div>
          {isNative && (
            <div className="p-4">
              <label htmlFor="ai-proxy-url" className="font-semibold text-[var(--text-primary)] text-xs mb-1 block">
                URL do proxy (app Android)
              </label>
              <input
                id="ai-proxy-url"
                value={aiProxy}
                onChange={(e) => setAiProxy(e.target.value)}
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="https://assistant-cat.SEU.workers.dev"
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] text-xs focus:outline-none"
                aria-label="URL do proxy do Worker"
                aria-describedby="ai-proxy-url-help"
              />
              <div id="ai-proxy-url-help" className="text-[11px] text-[var(--text-secondary)] mt-1">
                Endereço do Worker que serve /api/ai. No APK não existe servidor local, então sem esta URL o chat não responde.
              </div>
            </div>
          )}
          {aiProvider === 'custom' && (
            <div className="p-4">
              <div className="font-semibold text-[var(--text-primary)] text-xs mb-1">Base URL</div>
              <input
                value={aiBase}
                onChange={(e) => setAiBase(e.target.value)}
                placeholder="https://.../v1"
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] text-xs focus:outline-none"
                aria-label="Base URL custom"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarModal;
