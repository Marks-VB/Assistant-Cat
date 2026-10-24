import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.marksvb.assistantcat',
  appName: 'Assistant Cat',
  webDir: 'dist',
  server: {
    // Origem do WebView no APK: https://localhost. Não há servidor local, então
    // /api/ai só funciona com a URL absoluta do Worker (Personalizar → IA).
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#121212',
    allowMixedContent: false
  }
};

export default config;
