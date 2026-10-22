/* SPDX-License-Identifier: AGPL-3.0-or-later */
// Adaptador de IA para o Assistente Gato - Provedor Google Gemini
(function(root){'use strict';

const GEMINI_CONFIG = Object.freeze({
  model: 'gemini-3.5-flash-lite'
});

async function generateChatResponse(userText, options = {}) {
  const userName = options.userName || 'Você';
  const today = options.today || new Date().toISOString().slice(0, 10);
  const timeZone = options.timeZone || 'America/Sao_Paulo';
  const memories = Array.isArray(options.memories) ? options.memories : [];
  const memoryContext = memories.length
    ? '\nMemórias e preferências conhecidas sobre o usuário:\n' + memories.map(m => `- [${m.title}]: ${m.content}`).join('\n')
    : '';

  // Determina idioma e nome do assistente
  const userLang = (options.language || (typeof navigator !== 'undefined' ? navigator.language : '') || '').toLowerCase();
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
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply: { type: 'STRING', description: 'Mensagem de resposta concisa, educada e direta, sem clichês de IA (sem "Certamente!", "Com prazer!"), sem onomatopeias e sem metáforas de gato' },
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

  let response;
  const isBrowserHttp = typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:');

  // No navegador com servidor local, tenta primeiro o proxy /api/gemini para evitar bloqueios de extensões/adblockers
  if (isBrowserHttp) {
    try {
      response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok && response.status === 404) {
        response = null; // Servidor estático sem proxy
      }
    } catch {
      response = null; // Falha de rede local, tenta direto
    }
  }

  if (!response) throw new Error('Proxy de IA indisponível. Verifique o servidor local /api/gemini e GEMINI_API_KEY.');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Erro na comunicação com a API Gemini (${response.status})`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('A IA não retornou conteúdo legível.');

  const parsed = JSON.parse(rawText);
  return parsed;
}

const api = {
  GEMINI_CONFIG,
  generateChatResponse
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.GatoAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
