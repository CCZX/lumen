import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AgentConfig } from '../config/types.js';
import { configStore } from '../store/configStore.js';

export class SimpleAgent {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: AgentConfig = configStore.getState().config) {
    if (!config.apiKey) {
      throw new Error('Agent config is missing apiKey.');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model;
  }

  async chat(message: string): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful coding assistant.',
      },
      {
        role: 'user',
        content: message,
      },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
