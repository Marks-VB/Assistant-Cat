# Android: APK, AAB e Google Play

Guia do empacotamento Android do **Assistant Cat** (`app/`). O Capacitor já está configurado e o repositório já tem remote no GitHub. Falta cadastrar os segredos de assinatura, configurar a URL do proxy de IA no aparelho e enviar o AAB para a Play Store.

---

## O que já está pronto

| Item | Onde |
|---|---|
| Configuração do Capacitor (`appId`, `webDir`, tema) | `app/capacitor.config.ts` |
| Projeto Android nativo | `app/android/` |
| Ícones adaptativos + splash gerados do SVG | `app/android/app/src/main/res/` |
| Ícone 512×512 para a ficha da Play Store | `artes/play-store/icone-512.png` |
| Assinatura condicional (local ou CI) | `app/android/app/build.gradle` |
| Workflow de CI | `.github/workflows/android.yml` |
| Lembretes locais de compromissos | `app/src/core/notifications.ts` |
| Chave de upload + senha (local, fora do Git) | `app/android/keystore.properties` |

O workflow tem três jobs:

1. **Web (build + testes)** — `tsc`, `vite build` e os 58 testes do protótipo.
2. **Android (APK de teste)** — roda em PR e push na `main`; gera `app-debug.apk` sem assinatura de loja.
3. **Android (AAB assinado)** — roda em tag `v*` ou execução manual; gera `.aab` (Play Store) e `.apk` assinados.

---

## 1. Repositório no GitHub

O remote já aponta para `https://github.com/Marks-VB/Assistant-Cat.git`. O `.gitignore` bloqueia keystore, senhas e builds.

```bash
git remote -v                        # deve mostrar origin
git status                           # keystore e keystore.properties não podem aparecer
```

> Confirme que `app/android/keystore/` e `app/android/keystore.properties` **não** aparecem em `git status`.

---

## 2. Cadastrar os segredos do repositório

No GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | conteúdo do arquivo `app/android/keystore/assistant-cat-upload.jks.base64` |
| `ANDROID_KEYSTORE_PASSWORD` | `storePassword` em `app/android/keystore.properties` |
| `ANDROID_KEY_ALIAS` | `assistant-cat` |
| `ANDROID_KEY_PASSWORD` | mesmo valor de `storePassword` |

Para copiar o base64 no Windows:

```powershell
Get-Content "app/android/keystore/assistant-cat-upload.jks.base64" -Raw | Set-Clipboard
```

No macOS/Linux:

```bash
base64 -w 0 app/android/keystore/assistant-cat-upload.jks
```

O GitHub não deixa ler segredos depois de salvos. Se precisar recriar o base64, ele pode ser gerado novamente a partir do `.jks` a qualquer momento.

---

## 3. Disparar o build

### Execução manual (recomendado para o primeiro teste)

1. GitHub → aba **Actions** → workflow **Android** → **Run workflow**.
2. Informe a versão (ex.: `1.0.0`) e confirme.

### Por tag (release versionada)

```bash
git tag v1.0.0
git push origin v1.0.0
```

O `versionName` vem da tag (`v1.0.0` → `1.0.0`). O `versionCode` usa o número da execução do workflow, sempre crescente — a Play Store exige um código novo a cada upload.

---

## 4. Baixar os artefatos

Ao final da execução, em **Actions → execução → Artifacts**:

- `assistant-cat-aab-1.0.0+123` → **AAB assinado**, é o arquivo que sobe para a Play Store.
- `assistant-cat-apk-1.0.0+123` → **APK assinado**, para instalar direto no celular.
- `assistant-cat-debug-123` → APK de teste (só nas execuções de PR/push).

O workflow também roda `apksigner verify` e falha se a assinatura estiver incorreta.

---

## 5. Publicar na Google Play

1. Crie a conta em <https://play.google.com/console> (taxa única de US$ 25).
2. **Criar app**: nome, idioma padrão, app, gratuito.
3. **Play App Signing**: aceite o padrão. O `.jks` deste projeto é a **chave de upload**; o Google guarda a chave de assinatura final.
4. **Testes → Teste interno**: envie o `.aab` baixado do Actions e adicione seu e-mail como testador. É o caminho mais rápido para validar o app no celular.
5. Preencha a ficha da loja. Já pronto: ícone 512×512 em `artes/play-store/icone-512.png`. Falta:
   - gráfico de destaque **1024×500** — criar e enviar;
   - capturas de tela — no mínimo 2 de celular (sugestão: Agora, Chat, Agenda e Personalizar);
   - URL pública da política de privacidade — publicar `app/public/privacidade.html` no Worker e usar `https://SEU-DOMINIO/privacidade.html`;
   - formulário de **Segurança dos dados** — declarar mensagens de chat, preferências e diagnóstico; informar tráfego criptografado e como o usuário apaga os dados (o app guarda tudo no aparelho e oferece backup/limpeza);
   - descrições curta (até 80 caracteres) e completa (até 4000);
   - classificação de conteúdo e público-alvo.
6. Depois do teste interno aprovado: **Produção → Criar nova versão** com o AAB e envie para revisão.

### Regras que evitam retrabalho

- O `applicationId` `dev.marksvb.assistantcat` é permanente. Mudar depois exige um app novo.
- Todo upload precisa de `versionCode` maior que o anterior — o workflow já cuida disso.
- **Guarde o `.jks` e a senha.** Sem eles não é possível publicar atualizações (é preciso pedir redefinição da chave de upload ao Google).
- A Play Store exige `targetSdk` recente; o projeto usa o SDK 36.

---

## 6. Build local (opcional)

Requisitos: **JDK 21** e **Android SDK** (Android Studio instala os dois). O Java 26 instalado nesta máquina não é compatível com o Gradle 8.14.3 do projeto.

```bash
cd app
npm ci
npm run android:sync

# APK de debug
cd android
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug

# AAB + APK de release (usa app/android/keystore.properties automaticamente)
./gradlew bundleRelease assembleRelease
```

Saídas:

- `app/android/app/build/outputs/apk/debug/app-debug.apk`
- `app/android/app/build/outputs/apk/release/app-release.apk`
- `app/android/app/build/outputs/bundle/release/app-release.aab`

Para abrir no Android Studio: `npm run android:open`.

---

## 7. Lembretes de compromissos

Cada evento aceita `reminderMinutes` (`null` = desligado; `5`, `10`, `15`, `30` ou `60`). O campo aparece:

- no modal **Adicionar / Editar Compromisso**;
- no card de proposta do chat, antes da confirmação;
- na lista de compromissos, com o indicador 🔔.

No Android, `app/src/core/notifications.ts` usa `@capacitor/local-notifications`:

- permissão `POST_NOTIFICATIONS` solicitada ao salvar o primeiro evento com lembrete (Android 13+);
- `SCHEDULE_EXACT_ALARM` e `RECEIVE_BOOT_COMPLETED` declaradas pelo plugin para alarmes exatos e restauração após reinício;
- canal `compromissos` com importância alta e ícone monocromático `ic_stat_notify`;
- lembretes são reagendados ao abrir o app, ao salvar, editar ou excluir eventos.

No navegador, o fallback usa a **Notification API** com `setTimeout`: funciona apenas enquanto a aba estiver aberta. Não há push nem servidor envolvido.

> [!note] iOS  
> O módulo é compatível com o plugin do Capacitor, mas iOS exige adicionar `@capacitor/ios`, a plataforma Xcode e a permissão de notificações equivalente.

---

## 8. Chat de IA no APK: configurar a URL do Worker

No APK o app roda em um WebView com origem `https://localhost` (`server.androidScheme: 'https'` em `app/capacitor.config.ts`). Não existe servidor local, então `fetch('/api/ai')` cairia em `https://localhost/api/ai` e falharia. Por isso `app/src/core/ai-adapter.ts` usa a URL absoluta do Worker quando `Capacitor.isNativePlatform()` é verdadeiro. Na web o caminho continua relativo (`/api/ai`), com o fallback legado `/api/gemini`.

### Passo a passo no celular

1. Publique o Worker e anote a URL — por exemplo `https://assistant-cat.SEU.workers.dev` (veja `docs/Deploy-Cloudflare.md`).
2. Abra o app → **Personalizar** (avatar) → seção **IA**.
3. Preencha **URL do proxy (app Android)** com a URL do Worker. Sem `/api/ai` no final e sem barra final.
4. Toque em **Salvar**. O valor fica em `ai.proxyUrl` no armazenamento local do aparelho.
5. Envie uma mensagem no chat para confirmar a resposta.

O campo só aparece no app nativo. Na web ele fica oculto e o proxy é o mesmo host da página.

### Chave da IA

- **Recomendado:** deixe o campo **Chave** vazio e configure o secret no Worker (`npx wrangler secret put GEMINI_API_KEY`, e equivalentes). A chave nunca entra no APK.
- **Opcional:** a chave digitada em Personalizar → IA é enviada no corpo da requisição e fica apenas no aparelho. Use uma chave com cota/limite próprio.
- **Não** embuta chave no APK nem no build web: o conteúdo de `assets/` é extraível. Qualquer chave no bundle deve ser considerada pública.
- Se uma chave do aparelho vazar, revogue no provider; se um secret do Worker vazar, rode `wrangler secret put` novamente.

### CORS

O Worker recebe `Origin: https://localhost` do WebView. Inclua `https://localhost` em `ALLOWED_ORIGINS` no Worker; sem isso a requisição chega, mas o app não consegue ler a resposta.

### Mensagens de erro

| Mensagem | Causa |
|---|---|
| `Configure a URL do proxy em Personalizar → IA...` | Campo vazio no APK. |
| `Proxy de IA indisponível em <url>...` | URL errada, Worker fora do ar ou CORS bloqueando. |
| `Chave ausente...` | Sem chave no app e sem secret no Worker. |

Agenda, afazeres, avatar e backup funcionam sem o proxy; só o chat depende dele.

---

## 9. Segurança

- `app/android/keystore/`, `app/android/keystore.properties`, `*.jks` e `*.keystore` estão no `.gitignore`.
- Faça duas cópias de segurança do `.jks` + senha (gerenciador de senhas e mídia offline).
- Os segredos do GitHub são somente leitura; não os cole em issues, prints ou logs.
