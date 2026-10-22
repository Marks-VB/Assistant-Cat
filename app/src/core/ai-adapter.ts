// SPDX-License-Identifier: AGPL-3.0-or-later
// GatoAI - Adaptador para o modelo Google Gemini 3.5 Flash-Lite

import { AppState, Memory, Proposal } from '../types';

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

  try {
    const rawResult = await generateChatResponse(userText, options);
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
    console.warn('[AI Adapter] Falha na inferência remota do Gemini, acionando fallback local:', err.message);
    return {
      replyText: `Não foi possível consultar o modelo Gemini no momento (${err.message}). Verifique se GEMINI_API_KEY está configurada no servidor local (/api/gemini).`,
      proposal: undefined
    };
  }
}

/**
 * Executa a chamada estruturada à API do Gemini
 */
export async function generateChatResponse(userText: string, options: ChatOptions = {}): Promise<AIResponse> {
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

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply: {
            type: 'STRING',
            description: 'Mensagem de resposta concisa, educada e direta, sem clichês de IA (sem "Certamente!", "Com prazer!"), sem onomatopeias e sem metáforas de gato'
          },
          action: {
            type: 'OBJECT',
            properties: {
              kind: { type: 'STRING', enum: ['create_event', 'create_task', 'create_memory', 'none'] },
              title: { type: 'STRING' },
              content: { type: 'STRING' },
              date: { type: 'STRING' },
              time: { type: 'STRING' },
              duration: { type: 'INTEGER' }
            },
            required: ['kind']
          }
        },
        required: ['reply', 'action']
      }
    }
  };

  let response: Response | null = null;
  const isBrowserHttp =
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:');

  // No navegador via HTTP/HTTPS, tentar prioritariamente o proxy seguro /api/gemini
  if (isBrowserHttp) {
    try {
      response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok && response.status === 404) {
        response = null;
      }
    } catch {
      response = null;
    }
  }

  if (!response) {
    throw new Error('Proxy de IA indisponível. Verifique o servidor local /api/gemini e GEMINI_API_KEY.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro na comunicação com a API Gemini (${response.status})`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('A IA não retornou conteúdo legível.');

  return JSON.parse(rawText) as AIResponse;
}
