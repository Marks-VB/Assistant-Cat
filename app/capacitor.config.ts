import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.marksvb.assistantcat',
  appName: 'Assistant Cat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#121212',
    allowMixedContent: false
  }
};

export default config;
