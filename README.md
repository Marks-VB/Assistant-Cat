# Assistant Cat

Assistente pessoal open source: agenda, afazeres, memórias e chat de IA. A interface é um app **React 19 + TypeScript + Tailwind** (`app/`), publicado como **Cloudflare Worker** com assets estáticos e proxy de IA, e empacotado para **Android com Capacitor**.

## Estado atual

| Parte | Como está |
| --- | --- |
| Web | Worker `assistant-cat` serve `app/dist` (build do Vite) e o `POST /api/ai`. |
| IA | Proxy multi-provider compatível com OpenAI: Gemini, OpenAI, DeepSeek, Groq, OpenRouter, Ollama local e endpoint custom. |
| Chave da IA | BYOK (chave digitada no app, guardada no aparelho) ou secret no Worker (`GEMINI_API_KEY`, `OPENAI_API_KEY` etc.). |
| Android | Projeto Capacitor em `app/android/`, `appId` `dev.marksvb.assistantcat`. O APK usa a URL do Worker configurada em **Personalizar → IA**. |
| Dados | Ficam no aparelho (IndexedDB com fallback para localStorage), com backup/restauração em JSON. Não há conta nem sincronização. |
| `prototipo/` | Protótipo antigo em JavaScript puro, mantido como referência histórica. Não é o app publicado. |
| `server.cjs` | Servidor local legado com `/api/gemini`. O app atual usa `/api/ai`; o fallback Gemini só existe na web. |

## Rodar local

Requisito: Node.js 22 ou posterior.

Pilha completa (Worker + assets + `/api/ai`):

```bash
npm install
npm run build      # instala as deps de app/ e gera app/dist
npm run dev        # wrangler dev em http://localhost:8787
```

Para publicar:

```bash
npm run deploy     # build + wrangler deploy
```

Somente a interface, com HMR do Vite:

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

Nesse modo não há proxy para `/api/ai` no Vite; o chat só funciona apontando para um Worker publicado. Use `npm run dev` na raiz para testar a IA de ponta a ponta.

## IA

O app envia `POST /api/ai` com `provider`, `model`, `messages`, `temperature`, `response_format` e, opcionalmente, `apiKey` e `baseUrl`. O Worker repassa ao provider escolhido. Sem chave no app, ele usa o secret do servidor; sem nenhum dos dois, responde `401`.

Configuração detalhada, CORS, rate limit e Sentry: [`docs/Deploy-Cloudflare.md`](docs/Deploy-Cloudflare.md).

No Android, informe a URL do Worker em **Personalizar → IA → URL do proxy (app Android)**. Sem isso o WebView tenta `https://localhost/api/ai` e o chat falha. Passo a passo: [`docs/Android-APK-e-Play-Store.md`](docs/Android-APK-e-Play-Store.md) §8.

## Android

```bash
cd app
npm run android:sync   # build web + cap sync
npm run android:open   # abre no Android Studio
```

O build assinado (AAB + APK) roda no GitHub Actions. Segredos de assinatura e publicação: [`docs/Android-APK-e-Play-Store.md`](docs/Android-APK-e-Play-Store.md).

## Testes e tipos

```bash
cd app
npm test           # Vitest — lógica pura (domínio, providers)
npx tsc -b         # checagem de tipos
```

## Estrutura

```text
app/               app React/TS (web + Capacitor)
  src/core/        regras, storage, IA, notificações, temas
  src/components/  telas e componentes
  android/         projeto Android nativo
  public/          assets estáticos do build
worker/index.ts    assets + proxy /api/ai
docs/              deploy, Android, especificação
prototipo/         protótipo legado em JS
```

## Documentação

| Material | Arquivo |
| --- | --- |
| Deploy na Cloudflare | [Deploy-Cloudflare](docs/Deploy-Cloudflare.md) |
| APK, AAB e Google Play | [Android-APK-e-Play-Store](docs/Android-APK-e-Play-Store.md) |
| Execução local | [Instalação e execução](docs/Instalacao-e-Execucao.md) |
| Especificação: 256 capacidades de referência | [Especificação completa](docs/Especificacao-Completa.md) |
| Design system e tokens | [Design system](design-system/Design-System.md) |
| Gatos SVG editáveis | [Coleção vetorial](artes/svg-modular/colecao.svg) |
| Casos de interpretação e critérios | [40 casos](testes/Casos-Assistente.md) |
| Backlog com dependências | [38 tickets](backlog/Backlog-Implementacao.md) |
| Contribuição | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Galeria de artes | [galeria.html](galeria.html) |

## Licença

AGPL-3.0-or-later para código, documentação e SVGs novos. Origem e escopo das artes em [ASSETS.md](ASSETS.md).
