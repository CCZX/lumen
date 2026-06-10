import { z } from 'zod';
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from './defaults.js';
import type { AgentConfig, CliConfigInput } from './types.js';

const AgentConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required. Set OPENAI_API_KEY or pass --api-key.'),
  baseURL: z.string().url('baseURL must be a valid URL.').optional(),
  model: z.string().min(1, 'model is required.'),
});

export class ConfigManager {
  // 从环境变量和 CLI 参数加载配置
  static fromEnvironment(input: CliConfigInput = {}): AgentConfig {
    const result = AgentConfigSchema.safeParse({
      apiKey: input.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: input.baseURL ?? process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
      model: input.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    });

    if (!result.success) {
      throw new Error(result.error.issues.map((issue) => issue.message).join('\n'));
    }

    return result.data;
  }
}
