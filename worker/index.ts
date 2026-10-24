// SPDX-License-Identifier: AGPL-3.0-or-later
// Worker entry: serve os assets do build (app/dist) e o proxy /api/ai.
//
// Endurecimento de produção:
// - CORS restrito (mesma origem, allowlist por env ALLOWED_ORIGINS e wrappers nativos).
// - Rate limit por IP (binding AI_RATE_LIMITER; fallback em memória por isolate).
// - Bloqueio de SSRF (hosts internos e faixas privadas).
// - Limite de tamanho do payload e timeout na chamada ao provedor.
// - Headers de segurança aplicados a todas as respostas de assets.

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  /** Origens extras liberadas, separadas por vírgula (além da própria origem). */
  ALLOWED_ORIGINS?: string;
  AI_RATE_LIMITER?: RateLimiter;
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

/** Origens usadas pelos wrappers nativos (Capacitor) quando falam com o Worker. */
const NATIVE_ORIGINS = new Set(['https://localhost', 'capacitor://localhost', 'ionic://localhost']);

const MAX_BODY_BYTES = 64_000;
const MAX_CONTENT_CHARS = 48_000;
const UPSTREAM_TIMEOUT_MS = 30_000;

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
  // 'unsafe-inline' em script-src existe por causa do bootstrap de tema inline no index.html.
  // Ao mover esse script para um arquivo, troque por hash ou remova.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function corsHeaders(origin: string | null): Record<string, string> {
  return origin
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    : { Vary: 'Origin' };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

/**
 * Retorna a origem que pode ser refletida no CORS, ou null quando a origem é proibida.
 * Sem header Origin (curl, apps nativos sem wrapper) não há CORS a aplicar.
 */
function resolveOrigin(request: Request, env: Env): string | null | 'blocked' {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const selfOrigin = new URL(request.url).origin;
  if (origin === selfOrigin) return origin;
  if (NATIVE_ORIGINS.has(origin)) return origin;

  const allowlist = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (allowlist.includes(origin.replace(/\/$/, ''))) return origin;

  // Desenvolvimento local (Vite em outra porta).
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;

  return 'blocked';
}

/** Bloqueia destinos internos e faixas privadas (SSRF). */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host === 'metadata.google.internal' ||
    host === '169.254.169.254'
  ) {
    return true;
  }
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

// Fallback de rate limit por isolate (melhor esforço quando o binding não está configurado).
const memoryHits = new Map<string, { count: number; windowStart: number }>();
const MEMORY_WINDOW_MS = 60_000;
const MEMORY_LIMIT = 30;

function memoryLimit(key: string): boolean {
  const now = Date.now();
  const entry = memoryHits.get(key);
  if (!entry || now - entry.windowStart >= MEMORY_WINDOW_MS) {
    memoryHits.set(key, { count: 1, windowStart: now });
    if (memoryHits.size > 1000) {
      for (const [k, v] of memoryHits) {
        if (now - v.windowStart >= MEMORY_WINDOW_MS) memoryHits.delete(k);
      }
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= MEMORY_LIMIT;
}

async function checkRateLimit(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (env.AI_RATE_LIMITER) {
    try {
      const { success } = await env.AI_RATE_LIMITER.limit({ key: `ai:${ip}` });
      return success;
    } catch {
      // Binding indisponível em dev/preview: cai no limitador em memória.
    }
  }
  return memoryLimit(ip);
}

async function handleAI(request: Request, env: Env): Promise<Response> {
  const allowed = resolveOrigin(request, env);
  if (allowed === 'blocked') {
    return json({ error: { message: 'Origem não autorizada.' } }, 403, null);
  }
  const origin = allowed;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') return json({ error: { message: 'Use POST.' } }, 405, origin);

  if (!(await checkRateLimit(request, env))) {
    return json({ error: { message: 'Limite de requisições excedido. Tente novamente em um minuto.' } }, 429, origin);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: { message: 'Payload muito grande.' } }, 413, origin);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: { message: 'Payload muito grande.' } }, 413, origin);

  let body: any;
  try {
    body = JSON.parse(raw);
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

  const totalChars = messages.reduce(
    (sum: number, message: any) => sum + String(message?.content ?? '').length,
    0,
  );
  if (totalChars > MAX_CONTENT_CHARS) {
    return json({ error: { message: 'Conteúdo das mensagens excede o limite.' } }, 413, origin);
  }

  const baseUrl = String(body.baseUrl || DEFAULT_BASE[provider] || '').replace(/\/$/, '');
  if (!baseUrl) return json({ error: { message: 'Provider desconhecido ou baseUrl inválida.' } }, 400, origin);

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return json({ error: { message: 'baseUrl inválida.' } }, 400, origin);
  }
  if (parsed.protocol !== 'https:' && !(provider === 'ollama' && parsed.protocol === 'http:')) {
    return json({ error: { message: 'baseUrl deve usar https.' } }, 400, origin);
  }
  if (isBlockedHost(parsed.hostname)) {
    return json({ error: { message: 'baseUrl interna bloqueada.' } }, 400, origin);
  }

  const apiKey = String(body.apiKey || (ENV_KEY[provider] ? env[ENV_KEY[provider]] : '') || '').trim();
  if (!apiKey && provider !== 'ollama') {
    return json({ error: { message: 'Chave ausente. Informe a chave no app ou configure o secret.' } }, 401, origin);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${parsed.origin}${parsed.pathname.replace(/\/$/, '')}/chat/completions`, {
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
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return json({ error: { message: 'Falha ao contatar o provedor de IA.' } }, 502, origin);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

/** Aplica headers de segurança sem consumir o corpo do asset. */
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai') {
      try {
        return await handleAI(request, env);
      } catch {
        return json({ error: { message: 'Falha no proxy.' } }, 502, null);
      }
    }
    if (url.pathname.startsWith('/api/')) {
      return json({ error: { message: 'Rota de API inexistente.' } }, 404, null);
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
