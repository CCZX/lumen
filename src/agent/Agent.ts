import OpenAI from 'openai';
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { AgentConfig } from '../config/types.js';
import { configStore } from '../store/configStore.js';
import { getTool, getToolsAsChatCompletionTools } from '../tools/registry/index.js';

const MAX_TOOL_ROUNDS = 5;

type MessageWithReasoningContent = ChatCompletionMessage & {
  reasoning_content?: string | null;
};

export class Agent {
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
        content:
          'You are a helpful coding assistant. Use tools when you need to inspect or update local workspace files before answering.',
      },
      {
        role: 'user',
        content: message,
      },
    ];

    const tools = getToolsAsChatCompletionTools();

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0]?.message as
        | MessageWithReasoningContent
        | undefined;
      if (!responseMessage) {
        return '';
      }

      const toolCalls = responseMessage.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return responseMessage.content ?? '';
      }

      messages.push(this.createAssistantToolCallMessage(responseMessage, toolCalls));

      for (const toolCall of toolCalls) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: await this.executeToolCall(toolCall),
        });
      }
    }

    return 'Tool call limit reached before the model produced a final answer.';
  }

  private createAssistantToolCallMessage(
    message: MessageWithReasoningContent,
    toolCalls: ChatCompletionMessageToolCall[],
  ): ChatCompletionMessageParam {
    return {
      role: 'assistant',
      content: message.content ?? '',
      tool_calls: toolCalls,
      ...(message.reasoning_content ? { reasoning_content: message.reasoning_content } : {}),
    } as ChatCompletionMessageParam;
  }

  private async executeToolCall(toolCall: ChatCompletionMessageToolCall): Promise<string> {
    if (toolCall.type !== 'function') {
      return JSON.stringify({
        error: `Unsupported tool call type: ${toolCall.type}`,
      });
    }

    const tool = getTool(toolCall.function.name);
    if (!tool) {
      return JSON.stringify({
        error: `Unknown tool: ${toolCall.function.name}`,
      });
    }

    try {
      const args = JSON.parse(toolCall.function.arguments || '{}') as unknown;
      return await tool.execute(args);
    } catch (error) {
      return JSON.stringify({
        error: `Invalid arguments for ${toolCall.function.name}: ${(error as Error).message}`,
      });
    }
  }
}
