// Pages Function: POST /api/ai — proxy OpenAI-compatível multi-provider.
// Body: { provider, model, baseUrl?, apiKey?, messages, temperature?, response_format? }
// Chave: usa apiKey do body (BYOK) ou secret do ambiente (GEMINI_API_KEY, OPENAI_API_KEY...).

interface Env {
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

const ENV_KEY: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const headers = cors(request.headers.get('origin'));
  headers['Content-Type'] = 'application/json; charset=utf-8';

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: 'JSON inválido.' } }), { status: 400, headers });
  }

  const provider = String(body.provider || 'gemini');
  const model = String(body.model || '').trim();
  const messages = body.messages;
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: { message: 'Informe model e messages.' } }), { status: 400, headers });
  }
  if (messages.length > 50) {
    return new Response(JSON.stringify({ error: { message: 'messages excede 50 itens.' } }), { status: 400, headers });
  }

  const baseUrl = String(body.baseUrl || DEFAULT_BASE[provider] || '').replace(/\/$/, '');
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    return new Response(JSON.stringify({ error: { message: 'Provider desconhecido ou baseUrl inválida.' } }), { status: 400, headers });
  }
  // SSRF: bloquear destinos internos
  try {
    const u = new URL(baseUrl);
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(u.hostname) && provider !== 'ollama') {
      return new Response(JSON.stringify({ error: { message: 'baseUrl interna bloqueada.' } }), { status: 400, headers });
    }
  } catch {
    return new Response(JSON.stringify({ error: { message: 'baseUrl inválida.' } }), { status: 400, headers });
  }

  const apiKey = String(body.apiKey || env[ENV_KEY[provider] as keyof Env] || '').trim();
  if (!apiKey && provider !== 'ollama') {
    return new Response(
      JSON.stringify({ error: { message: 'Chave ausente. Informe a chave no app ou configure o secret.' } }),
      { status: 401, headers }
    );
  }

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(provider === 'openrouter' ? { 'HTTP-Referer': request.headers.get('origin') || '', 'X-Title': 'Assistant Cat' } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }),
  });

  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers });
};
