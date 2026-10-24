// SPDX-License-Identifier: AGPL-3.0-or-later
// GatoAI - Adaptador multi-provider OpenAI-compatível (/v1/chat/completions)
// Legado Gemini (/api/gemini) mantido como fallback.

import { Capacitor } from '@capacitor/core';
import { AppState, Memory, Proposal } from '../types';
import { AISettings, DEFAULT_AI_SETTINGS, effectiveModel, resolveBaseUrl, resolveProxyBaseUrl } from './providers';

export const GEMINI_CONFIG = Object.freeze({
  model: 'gemini-3.5-flash-lite' as const
});

export interface ChatOptions {
  assistantName?: string;
  userName?: string;
  today?: string;
  timeZone?: string;
  language?: string;
  memories?: Memory[];
}

export interface AIAction {
  kind: 'create_event' | 'create_task' | 'create_memory' | 'none';
  title?: string;
  content?: string;
  date?: string;
  time?: string;
  duration?: number;
}

export interface AIResponse {
  reply: string;
  action: AIAction;
}

export interface AIInferenceResult {
  replyText: string;
  proposal?: Proposal;
  action?: AIAction;
}

/**
 * Função central de inferência compatível com o App.tsx
 */
export async function requestInference(
  userText: string,
  state: Partial<AppState> = {}
): Promise<AIInferenceResult> {
  const options: ChatOptions = {
    assistantName: state.profile?.assistantName,
    userName: state.profile?.name,
    memories: state.memories || []
  };
  const ai: AISettings = {
    ...DEFAULT_AI_SETTINGS,
    ...(state.ai || {}),
  } as AISettings;

  try {
    const rawResult = await generateChatResponse(userText, options, ai);
    const action = rawResult.action || { kind: 'none' };
    const replyText = rawResult.reply || 'Entendido.';

    let proposal: Proposal | undefined = undefined;

    if (action.kind !== 'none' && (action.title || action.content)) {
      proposal = {
        kind: action.kind,
        action: action.kind,
        status: 'needs_review',
        confidence: 0.95,
        missingFields: [],
        key: `${action.kind}-${Date.now()}`,
        payload: {
          title: action.title,
          content: action.content,
          date: action.date,
          time: action.time,
          duration: action.duration
        }
      };
    }

    return {
      replyText,
      proposal,
      action
    };
  } catch (err: any) {
    console.warn('[AI Adapter] Falha na inferência remota, acionando fallback local:', err.message);
    return {
      replyText: `Não foi possível consultar o modelo no momento (${err.message}). Verifique provider, modelo e chave em Personalizar > IA.`,
      proposal: undefined
    };
  }
}

/**
 * Executa a chamada estruturada via proxy OpenAI-compatível (/api/ai).
 * Web: URL relativa ao mesmo host, com fallback legado Gemini (/api/gemini).
 * Nativo (Android/iOS): URL absoluta do Worker configurada em Personalizar → IA.
 */
export async function generateChatResponse(userText: string, options: ChatOptions = {}, ai: AISettings = DEFAULT_AI_SETTINGS): Promise<AIResponse> {
  const userName = options.userName || 'Você';
  const today = options.today || new Date().toISOString().slice(0, 10);
  const timeZone = options.timeZone || 'America/Sao_Paulo';
  const memories = Array.isArray(options.memories) ? options.memories : [];
  const memoryContext = memories.length
    ? '\nMemórias e preferências conhecidas sobre o usuário:\n' +
      memories.map((m) => `- [${m.title}]: ${m.content}`).join('\n')
    : '';

  // Determinar idioma e nome dinâmico
  const userLang = (
    options.language ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    ''
  ).toLowerCase();
  const textLooksEnglish = /\b(hi|hello|please|schedule|task|event|today|tomorrow|thanks|help|meeting)\b/i.test(userText);
  const isEnglish = userLang.startsWith('en') || textLooksEnglish;

  let assistantName = options.assistantName;
  if (!assistantName || assistantName === 'Nino') {
    assistantName = isEnglish ? 'Your Assistant Cat' : 'Seu Gato Assistente';
  }

  const systemInstruction = `Você é o assistente pessoal "${assistantName}" (em português: "Seu Gato Assistente", em inglês: "Your Assistant Cat").
Você atende com exclusividade ao usuário "${userName}".

DIRETRIZES DE COMUNICAÇÃO E CONDUTA:
1. FOCO E OBJETIVIDADE: Responda de forma concisa, educada e diretamente orientada à ação e produtividade.
2. RIGOR ANTI-SLOP E ZERO CLICHÊS:
   - Jamais use fórmulas mecânicas de preenchimento ("throat-clearing") como: "Certamente!", "Com todo o prazer!", "Estou aqui para ajudar", "Como posso ser útil hoje?", "Com certeza!", "Perfeito!", "Excelente escolha!".
   - Vá direto ao ponto sem enrolação, sem saudações redundantes e sem adjetivações vazias.
3. PERSONALIDADE E IDENTIDADE:
   - NUNCA imite um animal: NÃO emita onomatopeias felinas (proibido "miau", "ronrom", etc.).
   - NÃO utilize metáforas forçadas sobre gatos (proibido "patinhas", "ronronar", "arranhador", "cochilo de gato").
   - Comporte-se como um assistente digital inteligente, cordial, discreto e focado em organização pessoal.
4. IDIOMA: Responda SEMPRE no mesmo idioma empregado pelo usuário (português se a mensagem for em português, inglês se for em inglês, etc.).
5. CONTEXTO TEMPORAL: Data civil atual de referência: ${today} (Fuso horário: ${timeZone}).${memoryContext}
6. AÇÕES E ESTRUTURAÇÃO DE DADOS: Identifique com precisão se a mensagem requer:
   - create_event: agendar compromisso na agenda (obrigatório: title; recomendado: date YYYY-MM-DD, time HH:MM, duration em minutos - padrão 60 min se não informado).
   - create_task: criar afazer/tarefa (obrigatório: title; opcional: date YYYY-MM-DD).
   - create_memory: registrar fato novo duradouro ou preferência do usuário (obrigatório: title e content).
   - none: resposta conversacional objetiva, esclarecimento de dúvida ou orientação sem criação de registros.
7. Ao propor horários ou afazeres, respeite rigorosamente as preferências registradas nas memórias.`;

  const prompt = `Mensagem do usuário: "${userText}"`;

  const messages = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt },
  ];

  const openaiBody = {
    provider: ai.provider,
    model: effectiveModel(ai),
    baseUrl: resolveBaseUrl(ai) || undefined,
    apiKey: ai.apiKey || undefined,
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'assistant_action',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            action: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['create_event', 'create_task', 'create_memory', 'none'] },
                title: { type: 'string' },
                content: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                duration: { type: 'number' }
              },
              required: ['kind'],
              additionalProperties: false
            }
          },
          required: ['reply', 'action'],
          additionalProperties: false
        }
      }
    },
    messages,
  };

  // Payload legado Gemini (fallback /api/gemini)
  const legacyPayload = {
    contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
  };

  let response: Response | null = null;
  let usedLegacy = false;

  // No APK o WebView roda em `https://localhost` (androidScheme https) e não há
  // servidor local: só a URL absoluta do Worker funciona. Na web o proxy continua
  // relativo ao mesmo host.
  const isNative = Capacitor.isNativePlatform();
  const proxyBase = resolveProxyBaseUrl(ai);

  if (isNative && !proxyBase) {
    throw new Error('Configure a URL do proxy em Personalizar → IA (ex.: https://assistant-cat.SEU.workers.dev).');
  }

  // 1) Proxy novo OpenAI-compatível (/api/ai)
  try {
    const r = await fetch(`${proxyBase}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(openaiBody)
    });
    if (r.ok || r.status !== 404) response = r;
  } catch {
    response = null;
  }

  // 2) Fallback legado Gemini (somente web: o Worker não expõe /api/gemini)
  if (!response && !isNative) {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legacyPayload)
      });
      if (r.ok || r.status !== 404) { response = r; usedLegacy = r.ok; }
    } catch {
      response = null;
    }
  }

  if (!response) {
    throw new Error(
      isNative
        ? `Proxy de IA indisponível em ${proxyBase}. Verifique a URL do Worker em Personalizar → IA e o CORS (ALLOWED_ORIGINS).`
        : 'Proxy de IA indisponível. Verifique /api/ai (provider, modelo e chave).'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro na comunicação com a IA (${response.status})`);
  }

  const data = await response.json();
  if (usedLegacy) {
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('A IA não retornou conteúdo legível.');
    return JSON.parse(rawText) as AIResponse;
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('A IA não retornou conteúdo legível.');
  return (typeof content === 'string' ? JSON.parse(content) : content) as AIResponse;
}
