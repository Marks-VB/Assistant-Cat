# Android: APK, AAB e Google Play

Guia do empacotamento Android do **Assistant Cat** (`app/`). O projeto já está com o Capacitor configurado; falta apenas publicar o repositório e cadastrar os segredos de assinatura.

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

## 1. Subir o repositório no GitHub

O repositório local ainda não tem commit nem remote. O `.gitignore` já bloqueia keystore, senhas e builds.

```bash
git add .
git commit -m "chore: configura build Android, ícones e CI de release"
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
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
5. Preencha a ficha da loja:
   - ícone 512×512: `artes/play-store/icone-512.png`;
   - gráfico de destaque 1024×500 (precisa ser criado);
   - ao menos 2 capturas de tela de celular;
   - descrições curta e completa;
   - política de privacidade (URL pública);
   - formulário de **Segurança dos dados**;
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

## 8. Limitação conhecida: chat de IA

O `app/src/core/ai-adapter.ts` chama `fetch('/api/gemini')`, que hoje só existe no `server.cjs` local (`localhost:3000`). Dentro do APK a origem é `https://localhost`, então **o chat exibe a mensagem de proxy indisponível**; agenda, afazeres, avatar e backup continuam funcionando normalmente.

Para habilitar no APK, publique o proxy (Cloudflare Worker, Vercel, Render etc.) guardando a `GEMINI_API_KEY` no servidor e troque a URL no adaptador. **Não** embuta a chave no APK: ela é extraível.

---

## 9. Segurança

- `app/android/keystore/`, `app/android/keystore.properties`, `*.jks` e `*.keystore` estão no `.gitignore`.
- Faça duas cópias de segurança do `.jks` + senha (gerenciador de senhas e mídia offline).
- Os segredos do GitHub são somente leitura; não os cole em issues, prints ou logs.
