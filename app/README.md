# 🐱 Assistant Cat — Aplicação Multiplataforma (React + TypeScript + Tailwind)

Bem-vindo à arquitetura moderna de produção do **Assistant Cat** (**Seu Gato Assistente** / **Your Assistant Cat**), projetada para rodar em:
- 🌐 **Web** (PWA offline-first de carregamento instantâneo)
- 📱 **Mobile** (Android via Capacitor / APK & Google Play, iOS via Xcode)
- 🪟 **Desktop & Microsoft Store** (via PWABuilder em formato `.msix` ou Tauri)

---

## 🏗️ Estrutura do Projeto

```text
app/
├── index.html                 # PWA & HTML5 Entry point
├── package.json               # Dependências do app
├── vite.config.ts             # Configuração do Vite + Tailwind + Proxy
├── tsconfig.json              # Configuração TypeScript
└── src/
    ├── main.tsx               # Bootstrapping do React 19
    ├── App.tsx                # Interface completa com todas as 5 telas
    ├── index.css              # Estilos, Tailwind e importação dos temas
    ├── styles/
    │   └── themes.css         # Variáveis CSS dos 8 temas
    ├── types/
    │   └── index.ts           # Definições completas de tipos (Eventos, Tarefas, Memórias, IA)
    ├── core/
    │   ├── domain.ts          # Regras de negócio puras (validações, recorrência, retrospectiva)
    │   ├── cat-avatar.ts      # Motor modular de avatares com 72 combinações SVG
    │   ├── storage.ts         # Persistência IndexedDB e fallback localStorage
    │   ├── themes.ts          # Catálogo, normalização e resolução de temas
    │   ├── notifications.ts   # Lembretes locais de compromissos
    │   └── ai-adapter.ts      # Integração direta com Google Gemini 3.5 Flash-Lite
    └── components/
        └── CatAvatar.tsx      # Componente React do avatar felino
```

---

## 🚀 Como Executar

### 1. Iniciar o servidor de suporte da IA (porta 3000):
```bash
# Na raiz do projeto:
node server.cjs
```

### 2. No ambiente local de desenvolvimento (NTFS/SSD local):
Recomenda-se rodar o build ou instalar os pacotes em uma unidade local rápida (como `C:\` ou `D:\`) para evitar bloqueios de sincronização de arquivos do Google Drive:
```bash
cd app
npm install
npm run dev
```

---

## 📱 Empacotamento Multiplataforma

### Android (Capacitor — já configurado):
O projeto Android já existe em `app/android/` e o build assinado roda no GitHub Actions.
```bash
npm run android:sync   # build web + cap sync
npx cap open android   # abre no Android Studio (requer Android Studio + JDK 21)
```
Passo a passo de APK, AAB, segredos e publicação: [`docs/Android-APK-e-Play-Store.md`](../docs/Android-APK-e-Play-Store.md).

### iOS:
Requer macOS + Xcode: `npm install @capacitor/ios && npx cap add ios`.

### Para Microsoft Store (Windows 10/11):
1. Gere o build de produção: `npm run build`.
2. Acesse o [PWABuilder da Microsoft](https://www.pwabuilder.com/).
3. Aponte para a URL do seu app web ou submeta o pacote para gerar o `.msix` assinado pronto para a **Microsoft Store**.
