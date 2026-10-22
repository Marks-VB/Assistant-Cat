// SPDX-License-Identifier: AGPL-3.0-or-later
// Worker entry: serve os assets do build (app/dist) e o proxy /api/ai.

interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

const DEFAULT_BASE: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

const ENV_KEY: Record<string, keyof Env> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin || '*',
      Vary: 'Origin',
    },
  });
}

async function handleAI(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') return json({ error: { message: 'Use POST.' } }, 405, origin);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: 'JSON inválido.' } }, 400, origin);
  }

  const provider = String(body.provider || 'gemini');
  const model = String(body.model || '').trim();
  const messages = body.messages;
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: { message: 'Informe model e messages.' } }, 400, origin);
  }
  if (messages.length > 50) return json({ error: { message: 'messages excede 50 itens.' } }, 400, origin);

  const baseUrl = String(body.baseUrl || DEFAULT_BASE[provider] || '').replace(/\/$/, '');
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    return json({ error: { message: 'Provider desconhecido ou baseUrl inválida.' } }, 400, origin);
  }

  const apiKey = String(body.apiKey || (ENV_KEY[provider] ? env[ENV_KEY[provider]] : '') || '').trim();
  if (!apiKey && provider !== 'ollama') {
    return json({ error: { message: 'Chave ausente. Informe a chave no app ou configure o secret.' } }, 401, origin);
  }

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(provider === 'openrouter' ? { 'HTTP-Referer': origin || '', 'X-Title': 'Assistant Cat' } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin || '*',
      Vary: 'Origin',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai') {
      try {
        return await handleAI(request, env);
      } catch (err: any) {
        return json({ error: { message: err?.message || 'Falha no proxy.' } }, 502, request.headers.get('origin'));
      }
    }
    return env.ASSETS.fetch(request);
  },
};
