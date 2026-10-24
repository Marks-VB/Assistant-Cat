import { describe, expect, it } from 'vitest';
import { effectiveModel, resolveBaseUrl } from './providers';

describe('providers — resolveBaseUrl', () => {
  it('remove a barra final de baseUrl custom', () => {
    expect(
      resolveBaseUrl({ provider: 'custom', model: '', apiKey: 'k', baseUrl: 'https://example.com/v1/' })
    ).toBe('https://example.com/v1');
  });

  it('usa a baseUrl do provider padrão', () => {
    expect(resolveBaseUrl({ provider: 'openai', model: '', apiKey: 'k' })).toBe(
      'https://api.openai.com/v1'
    );
  });
});

describe('providers — effectiveModel', () => {
  it('prefere o modelo explícito (com trim)', () => {
    expect(effectiveModel({ provider: 'openai', model: '  gpt-4o-mini  ', apiKey: 'k' })).toBe(
      'gpt-4o-mini'
    );
  });

  it('cai no modelo padrão do provider quando vazio', () => {
    expect(effectiveModel({ provider: 'ollama', model: '', apiKey: '' })).toBe('llama3.1');
  });
});
