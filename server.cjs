// SPDX-License-Identifier: AGPL-3.0-or-later
// Servidor de desenvolvimento local com proxy transparente para a API Gemini
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente de .env simples se existir
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch (e) {
      console.warn('[Aviso] Não foi possível ler o arquivo .env:', e.message);
    }
  }
}
loadEnv();

let Sentry = null;
try {
  Sentry = require("@sentry/node");
  if (process.env.SENTRY_DSN) {
    const isProd = process.env.NODE_ENV === "production";
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: isProd ? 0.2 : 1.0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request) {
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          delete event.request.cookies;
          delete event.request.data;
          delete event.request.query_string;
        }
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          delete event.user.username;
        }
        return event;
      },
    });
  }
} catch {
  console.warn("[Sentry] @sentry/node ausente; rode: npm i @sentry/node");
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const ROOT_DIR = __dirname;
const GEMINI_MODEL_ID = 'gemini-3.5-flash-lite';
const MAX_PROXY_BODY_BYTES = 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
// Mapa em memória: ip -> { count, windowStart }. Apenas para /api/gemini.
const geminiRateLimitStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function checkGeminiRateLimit(ip) {
  const now = Date.now();
  const entry = geminiRateLimitStore.get(ip);
  if (!entry || (now - entry.windowStart) >= RATE_LIMIT_WINDOW_MS) {
    geminiRateLimitStore.set(ip, { count: 1, windowStart: now });
    return { limited: false, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { limited: true, retryAfterSec };
  }
  return { limited: false, retryAfterSec: 0 };
}

const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of geminiRateLimitStore) {
    if ((now - entry.windowStart) >= RATE_LIMIT_WINDOW_MS) geminiRateLimitStore.delete(ip);
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);
if (typeof rateLimitCleanupTimer.unref === 'function') rateLimitCleanupTimer.unref();
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

// Validação com schema mínimo do payload generateContent. Retorna { ok, message }.
function validateGeminiBody(parsed) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: 'Corpo JSON deve ser um objeto.' };
  }
  const allowedTopKeys = new Set([
    'contents', 'generationConfig', 'safetySettings', 'systemInstruction', 'tools', 'toolConfig'
  ]);
  for (const key of Object.keys(parsed)) {
    if (!allowedTopKeys.has(key)) {
      return { ok: false, message: `Campo não permitido: "${key}".` };
    }
  }
  if (!Array.isArray(parsed.contents) || parsed.contents.length === 0) {
    return { ok: false, message: 'Campo "contents" é obrigatório e deve ser um array não vazio.' };
  }
  if (parsed.contents.length > 50) {
    return { ok: false, message: 'Campo "contents" excede o máximo de 50 itens.' };
  }
  let totalText = 0;
  for (let i = 0; i < parsed.contents.length; i++) {
    const item = parsed.contents[i];
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, message: `contents[${i}] deve ser um objeto.` };
    }
    if (item.role !== undefined && !['user', 'model', 'system'].includes(item.role)) {
      return { ok: false, message: `contents[${i}].role inválido.` };
    }
    if (!Array.isArray(item.parts) || item.parts.length === 0) {
      return { ok: false, message: `contents[${i}].parts deve ser um array não vazio.` };
    }
    if (item.parts.length > 20) {
      return { ok: false, message: `contents[${i}].parts excede o máximo de 20 itens.` };
    }
    for (let j = 0; j < item.parts.length; j++) {
      const part = item.parts[j];
      if (part === null || typeof part !== 'object' || Array.isArray(part)) {
        return { ok: false, message: `contents[${i}].parts[${j}] deve ser um objeto.` };
      }
      if (typeof part.text !== 'string' || part.text.length === 0) {
        return { ok: false, message: `contents[${i}].parts[${j}].text deve ser string não vazia.` };
      }
      if (part.text.length > 100000) {
        return { ok: false, message: `contents[${i}].parts[${j}].text excede 100000 caracteres.` };
      }
      totalText += part.text.length;
      if (totalText > MAX_PROXY_BODY_BYTES) {
        return { ok: false, message: 'Texto agregado excede o limite permitido.' };
      }
    }
  }
  if (parsed.generationConfig !== undefined &&
      (parsed.generationConfig === null || typeof parsed.generationConfig !== 'object' || Array.isArray(parsed.generationConfig))) {
    return { ok: false, message: 'Campo "generationConfig" deve ser um objeto.' };
  }
  return { ok: true };
}
const ALLOWED_PROXY_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || ''
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:' + PORT}`);
  let reqPath = decodeURI(parsedUrl.pathname);
  const isGeminiProxyPath = reqPath === '/api/gemini' || reqPath === '/prototipo/api/gemini';
  const origin = req.headers.origin;
  const isAllowedProxyOrigin = ALLOWED_PROXY_ORIGINS.has(origin);

  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    if (isGeminiProxyPath && !isAllowedProxyOrigin) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: 'Origem não autorizada para o proxy Gemini.' } }));
      return;
    }
    if (isGeminiProxyPath) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint proxy para o Gemini
  if (isGeminiProxyPath) {
    if (!isAllowedProxyOrigin) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: 'Origem não autorizada para o proxy Gemini.' } }));
      return;
    }
    // Rate-limit em memória: 60 req/min/IP (apenas /api/gemini, sem contar preflight).
    if (req.method !== 'OPTIONS') {
      const clientIp = getClientIp(req);
      const verdict = checkGeminiRateLimit(clientIp);
      if (verdict.limited) {
        res.setHeader('Retry-After', String(verdict.retryAfterSec));
        res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: { message: 'Limite de requisições excedido. Tente novamente em instantes.' } }));
        return;
      }
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'POST') {
      const bodyChunks = [];
      let bodyBytes = 0;
      let bodyTooLarge = false;
      req.on('data', chunk => {
        if (bodyTooLarge) return;
        bodyBytes += chunk.length;
        if (bodyBytes > MAX_PROXY_BODY_BYTES) {
          bodyTooLarge = true;
          bodyChunks.length = 0;
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: { message: 'Corpo da requisição excede o limite de 1 MiB.' } }));
          req.resume();
          return;
        }
        bodyChunks.push(chunk);
      });
      req.on('end', () => {
        if (bodyTooLarge) return;
        const body = Buffer.concat(bodyChunks).toString('utf8');
        try {
          if (!body || body.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: { message: 'Corpo da requisição vazio.' } }));
            return;
          }
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: { message: 'Corpo da requisição deve ser JSON válido.' } }));
            return;
          }
          const validation = validateGeminiBody(parsed);
          if (!validation.ok) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: { message: validation.message } }));
            return;
          }
          if (!GEMINI_CONFIG.apiKey) {
            console.warn('[Proxy Gemini] Variável GEMINI_API_KEY não configurada no servidor.');
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              error: {
                message: 'Chave de API Gemini não configurada no servidor. Configure a variável GEMINI_API_KEY no arquivo .env ou nas variáveis de ambiente.'
              }
            }));
            return;
          }

          console.log(`[Proxy Gemini] Encaminhando chamada para ${GEMINI_MODEL_ID}...`);
          const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

          const upstreamReq = https.request(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          }, upstreamRes => {
            console.log(`[Proxy Gemini] Resposta recebida da API Google (Status: ${upstreamRes.statusCode})`);
            res.writeHead(upstreamRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
            upstreamRes.pipe(res);
          });

          upstreamReq.on('error', err => {
            console.error('[Proxy Gemini] Erro na requisição upstream:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: { message: 'Erro de conexão com o Gemini: ' + err.message } }));
          });

          upstreamReq.write(body);
          upstreamReq.end();
        } catch (err) {
          console.error('[Proxy Gemini] Exceção:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: { message: err.message } }));
        }
      });
      return;
    }
  }

  // Redirecionamentos de rota
  if (reqPath === '/' || reqPath === '') reqPath = '/prototipo/index.html';
  else if (reqPath === '/prototipo' || reqPath === '/prototipo/') reqPath = '/prototipo/index.html';

  const fullPath = path.join(ROOT_DIR, reqPath);

  // Prevenir Directory Traversal fora do diretório raiz
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(path.normalize(ROOT_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso proibido');
    return;
  }

  // MIME extra para sitemap/robots/manifest quando servidos pelo dev server
  const EXTRA_MIME = { '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
  if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isFile()) {
    const ext = path.extname(normalizedPath).toLowerCase();
    // Headers para prevenir cache agressivo no navegador durante o desenvolvimento
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || EXTRA_MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(normalizedPath).pipe(res);
  } else if (parsedUrl.pathname.endsWith('.html') || (req.headers.accept || '').includes('text/html')) {
    // 404 personalizado: serve prototipo/404.html (ou 404.html na raiz) mantendo o status 404.
    const custom404 = [path.join(ROOT_DIR, 'prototipo', '404.html'), path.join(ROOT_DIR, '404.html')].find(f => fs.existsSync(f));
    if (custom404) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(custom404).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado: ' + reqPath);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado: ' + reqPath);
  }
});

server.listen(PORT, 'localhost', () => {
  console.log(`SERVIDOR_PRONTO: http://localhost:${PORT}/prototipo/`);
  console.log(`[Assistente Gato] Servidor local ativo com proxy Gemini em /api/gemini`);
});
