// SPDX-License-Identifier: AGPL-3.0-or-later
// Catálogo de providers OpenAI-compatíveis (/v1/chat/completions).

export type AIProviderId =
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'groq'
  | 'openrouter'
  | 'ollama'
  | 'custom';

export interface AIProviderDef {
  id: AIProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  needsKey: boolean;
  hint: string;
}

export const AI_PROVIDERS: AIProviderDef[] = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', needsKey: true, hint: 'sk-...' },
  { id: 'gemini', label: 'Google Gemini (OpenAI-compat)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-2.0-flash-lite', needsKey: true, hint: 'AIza...' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', needsKey: true, hint: 'sk-...' },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', needsKey: true, hint: 'gsk_...' },
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini', needsKey: true, hint: 'sk-or-...' },
  { id: 'ollama', label: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3.1', needsKey: false, hint: 'sem chave' },
  { id: 'custom', label: 'Custom (OpenAI-compat)', baseUrl: '', defaultModel: '', needsKey: true, hint: 'https://.../v1 + modelo + chave' },
];

export interface AISettings {
  provider: AIProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  /** URL absoluta do Worker de proxy. Vazio = mesmo host (web). Obrigatório no app nativo. */
  proxyUrl?: string;
}

/** Valor padrão do proxy: vazio, ou seja, mesmo host da página. */
export const DEFAULT_PROXY_URL = '';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  model: 'gemini-2.0-flash-lite',
  apiKey: '',
  proxyUrl: DEFAULT_PROXY_URL,
};

export function resolveBaseUrl(s: AISettings): string {
  if (s.provider === 'custom') return (s.baseUrl || '').replace(/\/$/, '');
  return AI_PROVIDERS.find((p) => p.id === s.provider)?.baseUrl || '';
}

/** Normaliza a URL do Worker removendo espaços e a barra final. Vazio = mesmo host. */
export function resolveProxyBaseUrl(ai: AISettings): string {
  return (ai.proxyUrl || '').trim().replace(/\/$/, '');
}

export function effectiveModel(s: AISettings): string {
  if (s.model.trim()) return s.model.trim();
  return AI_PROVIDERS.find((p) => p.id === s.provider)?.defaultModel || '';
}
