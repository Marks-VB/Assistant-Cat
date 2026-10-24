# Assistant Cat — app web e Android

App de assistente pessoal em **React 19 + TypeScript + Tailwind 4**, buildado com Vite e embarcado em **Android via Capacitor 8**. A IA é acessada por um proxy HTTP (`POST /api/ai`), nunca por chamada direta do navegador ao provider.

## Estado atual

- **Web:** publicado no Cloudflare Worker `assistant-cat`, que serve `app/dist` e o proxy `/api/ai`.
- **IA:** multi-provider no formato OpenAI (`provider`, `model`, `messages`). Chave digitada em Personalizar → IA (BYOK, fica no aparelho) ou secret configurado no Worker.
- **Android:** `appId` `dev.marksvb.assistantcat`, projeto em `app/android/`. No APK a origem do WebView é `https://localhost`, então o proxy precisa de URL absoluta — configurada em **Personalizar → IA → URL do proxy (app Android)**.
- **Dados:** persistidos localmente (IndexedDB, com fallback para localStorage), com backup JSON. Sem conta e sem sincronização.

## Estrutura

```text
app/
├── index.html                 # entrada do Vite/PWA
├── vite.config.ts             # React + Tailwind (+ proxy legado /api/gemini em dev)
├── capacitor.config.ts        # appId, webDir e androidScheme https
├── android/                   # projeto Android nativo
├── public/                    # ícones, manifest, privacidade, robots, sitemap
└── src/
    ├── main.tsx               # bootstrap do React e do Sentry
    ├── App.tsx                # estado global e as cinco telas
    ├── sentry.ts              # Sentry opcional via VITE_SENTRY_DSN
    ├── types/index.ts         # tipos de domínio, incluindo AISettingsState
    ├── core/
    │   ├── providers.ts       # catálogo de providers e resolução de URL/modelo
    │   ├── ai-adapter.ts      # payload, system prompt e chamada a /api/ai
    │   ├── domain.ts          # regras puras (datas, recorrência, retrospectiva)
    │   ├── storage.ts         # IndexedDB/localStorage e backup
    │   ├── notifications.ts   # lembretes locais de compromissos
    │   ├── themes.ts          # catálogo e normalização de temas
    │   ├── layout.ts          # posição da navegação
    │   ├── cat-avatar.ts      # motor do avatar em SVG
    │   └── avatar-presets.ts  # presets do carrossel de avatares
    └── components/            # telas, modais e avatar
```

## Rodar

Requisito: Node.js 22 ou posterior.

```bash
cd app
npm install
npm run dev        # Vite em http://localhost:5173
```

O Vite não encaminha `/api/ai`: para testar o chat de ponta a ponta, rode o Worker a partir da raiz do repositório:

```bash
npm install
npm run build      # gera app/dist
npm run dev        # wrangler dev (assets + /api/ai)
```

O `server.cjs` da raiz é legado e só atende `/api/gemini`, usado como fallback no navegador. Ele não é necessário para o app atual.

## IA no app

`src/core/ai-adapter.ts` monta o payload e escolhe a URL:

| Plataforma | URL usada |
| --- | --- |
| Web | `/api/ai` no mesmo host; se não existir, tenta `/api/gemini` (legado). |
| Android/iOS (`Capacitor.isNativePlatform()`) | `<URL do proxy>/api/ai`, com a URL de **Personalizar → IA**. Vazia, lança erro de configuração. |

O Worker aceita `apiKey` no corpo e faz fallback para os secrets `GEMINI_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY` e `OPENROUTER_API_KEY`. Nunca coloque chave no bundle do app.

## Build e Android

```bash
npm run build          # tsc -b + vite build -> dist/
npm run android:sync   # build + cap sync android
npm run android:open   # Android Studio (JDK 21 + Android SDK)
npm test               # Vitest (lógica pura)
```

Empacotamento, assinatura e Play Store: [`docs/Android-APK-e-Play-Store.md`](../docs/Android-APK-e-Play-Store.md).
Deploy do Worker, CORS e variáveis: [`docs/Deploy-Cloudflare.md`](../docs/Deploy-Cloudflare.md).

## Variáveis de build

| Variável | Efeito |
| --- | --- |
| `VITE_SITE_URL` | Domínio canônico para sitemap, robots e Open Graph. |
| `VITE_SENTRY_DSN` | Liga o Sentry no app. Vazia, nada é enviado. |

Ambas são embutidas no bundle pelo Vite; veja `.env.example` na raiz.
