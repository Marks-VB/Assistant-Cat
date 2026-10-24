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

## Segredos do servidor (opcional)

A chave pode vir do próprio app (Personalizar → IA). Para usar fallback do servidor:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
```

Secret definido tem precedência apenas quando o app não envia chave. O APK não deve embutir chave: veja `docs/Android-APK-e-Play-Store.md` §8.

## Endurecimento do Worker

O `/api/ai` é um proxy aberto para providers pagos. O Worker aplica estas travas — configure-as no dashboard ou no `wrangler.jsonc` antes de divulgar o endereço:

| Item | Configuração | Efeito |
| --- | --- | --- |
| Allowlist de CORS | var/secret `ALLOWED_ORIGINS` | Lista separada por vírgula das origens autorizadas. Inclua o domínio do site, `https://localhost` (WebView do APK) e as URLs de preview que forem usadas. Origem fora da lista não recebe `Access-Control-Allow-Origin` e o navegador bloqueia a leitura da resposta. |
| Rate limit | binding `AI_RATE_LIMITER` | Limita requisições por IP e janela; excedeu, responde `429`. Crie o namespace no dashboard da Cloudflare (Rate Limiting) e declare o binding `AI_RATE_LIMITER` no `wrangler.jsonc` — atenção: o schema exige **array**, não objeto (veja o exemplo abaixo). |
| Limite de payload | validação no Worker | Corpo JSON com teto de tamanho e `messages` com máximo de itens; acima disso, `400`/`413`. Evita que uma única chamada consuma cota e memória. |
| Timeout | `AbortSignal` no fetch ao provider | Chamada pendurada é abortada e vira `504`, em vez de segurar a requisição até o limite da plataforma. |
| Bloqueio de SSRF | validação de `baseUrl` | Aceita apenas `http(s)` e recusa hosts locais/privados (`localhost`, `127.0.0.1`, `10.*`, `192.168.*`, `*.internal`). O provider `ollama` só funciona com o Worker rodando localmente (`wrangler dev`). |

Exemplo de variável de ambiente no `wrangler.jsonc` (o valor não é segredo):

```jsonc
"vars": {
  "ALLOWED_ORIGINS": "https://assistant-cat.SEUSUBDOMINIO.workers.dev,https://localhost"
}
```

Se preferir manter a lista fora do repositório: `npx wrangler secret put ALLOWED_ORIGINS`.

O rate limit usa o binding nativo de Rate Limiting. O formato é **array** — declarar como objeto faz o
`wrangler deploy` falhar com `The field "ratelimits" should be an array`:

```jsonc
"ratelimits": [
  {
    "name": "AI_RATE_LIMITER",
    "namespace_id": "2026102401",
    "simple": { "limit": 30, "period": 60 }
  }
]
```

`namespace_id` é um número de 10 dígitos escolhido por você e deve ser único na conta. Sem o binding
(ex.: `wrangler dev` sem a config), o Worker cai no fallback em memória por isolate, que também aplica
30 req/60 s.

## Variáveis de build (Vite)

Estas entram no bundle durante `npm run build`. Defina no ambiente do build — `.env` local, variável de ambiente do shell ou **Settings → Build → Variables** no Workers Builds. Trocar depois exige novo build e novo deploy.

| Variável | Uso |
| --- | --- |
| `VITE_SITE_URL` | Domínio canônico do site (ex.: `https://assistant-cat.SEUSUBDOMINIO.workers.dev`). Usado por `sitemap.xml`, `robots.txt` e metadados Open Graph. Sem ela, o sitemap sai vazio e não há URL absoluta para OG. |
| `VITE_SENTRY_DSN` | DSN público do Sentry. Sem ela, `initSentry()` retorna cedo e **nada é enviado**; com ela, erros do app vão para o Sentry em produção (`tracesSampleRate` 0.2). |

```bash
# Windows (PowerShell)
$env:VITE_SITE_URL="https://assistant-cat.SEUSUBDOMINIO.workers.dev"
$env:VITE_SENTRY_DSN="https://...@o000.ingest.sentry.io/000"
npm run deploy
```

`SENTRY_DSN` (sem `VITE_`) é lido só pelo Worker, para erros do servidor. Não confunda com `VITE_SENTRY_DSN`: o prefixo `VITE_` significa que o valor fica visível no bundle.

## Origem nativa (APK)

O WebView do Android envia `Origin: https://localhost`. Para o chat funcionar no APK:

1. inclua `https://localhost` em `ALLOWED_ORIGINS`;
2. no aparelho, preencha **Personalizar → IA → URL do proxy (app Android)** com a URL do Worker.

Sem o item 2 o app exibe a mensagem para configurar o proxy; sem o item 1 a resposta é bloqueada pelo WebView. Detalhes em `docs/Android-APK-e-Play-Store.md` §8.

## Domínio próprio

No dashboard do Worker: **Settings → Domains & Routes**.

- **Custom domain**: adicione `app.seudominio.com` (o domínio precisa estar na mesma conta Cloudflare). A Cloudflare cria o DNS e o certificado.
- **Route**: use `seudominio.com/*` com a zona correspondente, quando o Worker divide o domínio com outros serviços.

Depois de ativar:

1. inclua `https://app.seudominio.com` em `ALLOWED_ORIGINS`;
2. defina `VITE_SITE_URL=https://app.seudominio.com` e rode o deploy de novo;
3. atualize a URL do proxy no APK, se ele já estiver instalado.

## Verificação

```bash
# Deve responder 401 (sem chave) — confirma que o Worker está ativo
curl -i -X POST https://assistant-cat.SEUSUBDOMINIO.workers.dev/api/ai \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini","model":"gemini-2.0-flash-lite","messages":[{"role":"user","content":"oi"}]}'
```

Com o secret configurado, ou enviando `"apiKey":"..."` no corpo, o mesmo POST retorna 200.
Para conferir o CORS, repita com `-H "Origin: https://localhost"` e verifique se a resposta traz
`Access-Control-Allow-Origin: https://localhost`. Repetições acima do limite do `AI_RATE_LIMITER`
retornam `429`.

## Checagem de assets

Abra a raiz do site e confirme no DevTools que não há 400/404 para:

- `/manifest.webmanifest`
- `/icon.svg`, `/favicon.png`, `/apple-touch-icon.png`
- `/og-image.png`
- `/assets/index-*.js`
