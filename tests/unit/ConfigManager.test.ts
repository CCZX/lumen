import { describe, expect, it } from 'vitest';
import { ConfigManager } from '../../src/config/ConfigManager.js';

describe('ConfigManager', () => {
  it('builds config from explicit input', () => {
    const config = ConfigManager.fromEnvironment({
      apiKey: 'test-key',
      baseURL: 'https://example.com/v1',
      model: 'test-model',
    });

    expect(config).toEqual({
      apiKey: 'test-key',
      baseURL: 'https://example.com/v1',
      model: 'test-model',
    });
  });

  it('throws when apiKey is missing', () => {
    expect(() => ConfigManager.fromEnvironment({ apiKey: '' })).toThrow('API key is required');
  });
});
