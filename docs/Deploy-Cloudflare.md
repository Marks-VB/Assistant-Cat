# Deploy na Cloudflare (Worker + Assets)

O app é publicado como **Worker com Static Assets**: os arquivos vêm de `app/dist` (build do Vite) e o `/api/ai` é servido pelo mesmo Worker.

## Por que não publicar a pasta `app/`

`app/index.html` contém `src/main.tsx` e usa o processamento do Vite (JSX, Tailwind, hashing de assets). Servir a pasta crua gera erros de `%BASE_URL%` e módulos `.tsx` no browser. Sempre publique `app/dist`.

## Deploy pelo terminal (recomendado)

```bash
npm install                 # instala wrangler na raiz
npm run deploy              # build + wrangler deploy
```

`wrangler.jsonc` já define:

| Campo | Valor |
| --- | --- |
| `name` | `assistant-cat` |
| `main` | `worker/index.ts` |
| `build.command` | `npm run build` (instala as deps de `app/` e gera `app/dist`) |
| `assets.directory` | `./app/dist` |
| `assets.not_found_handling` | `single-page-application` |
| `assets.run_worker_first` | `true` |

## Deploy via Git (Workers Builds)

No dashboard, projeto do Worker:

- Build command: **deixe vazio** (o `wrangler.jsonc` roda `npm run build` sozinho antes do deploy)
- Deploy command: `npx wrangler deploy`
- Root directory: raiz do repositório

Se preferir manter um build command no dashboard, use `npm run build`. Ele roda duas vezes
(dashboard + wrangler), mas o resultado é o mesmo.

### Por que o deploy limpo falhava

O `bun install`/`npm install` da raiz instala apenas o `wrangler`; as dependências do app
ficam em `app/package-lock.json`. Sem um passo de build, `app/dist` não existia e o wrangler
abortava com:

```
The directory specified by the "assets.directory" field in your configuration file does not exist:
.../app/dist
```

Agora `npm run build` é autossuficiente: roda `npm --prefix app install` e depois o
`vite build`.

## Segredos (opcional)

A chave pode vir do próprio app (Personalizar → IA). Para usar fallback do servidor:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
```

## Verificação

```bash
# Deve responder 401 (sem chave) — confirma que o Worker está ativo
curl -i -X POST https://assistant-cat.SEUSUBDOMINIO.workers.dev/api/ai \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini","model":"gemini-2.0-flash-lite","messages":[{"role":"user","content":"oi"}]}'
```

Depois de salvar a chave em **Personalizar → IA**, o mesmo POST retorna 200.

## Checagem de assets

Abra a raiz do site e confirme no DevTools que não há 400/404 para:

- `/manifest.webmanifest`
- `/icon.svg`, `/favicon.png`, `/apple-touch-icon.png`
- `/og-image.png`
- `/assets/index-*.js`
