import OpenAI from 'openai';
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { AgentConfig } from '../config/types.js';
import { configStore } from '../store/configStore.js';
import { debugStore } from '../store/debugStore.js';
import { messageStore } from '../store/messageStore.js';
import { getTool, getToolsAsChatCompletionTools } from '../tools/registry/index.js';
import { assembleSystemPrompt } from '../prompts/index.js';

const MAX_TOOL_ROUNDS = 5;

function sanitizeForDebug(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return String(data);
  }
}

function logDebug(type: 'request' | 'response' | 'error', data: unknown): void {
  if (configStore.getState().config.debug) {
    debugStore.getState().addLog({ type, data: sanitizeForDebug(data) });
  }
}

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
    messageStore.getState().addMessage({
      role: 'user',
      content: message,
    });

    const tools = getToolsAsChatCompletionTools();
    const messages = messageStore.getState().messages;

    logDebug('request', { model: this.model, messages, tools });

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools,
        tool_choice: 'auto',
      });

      logDebug('response', { round, response });

      const responseMessage = response.choices[0]?.message as
        | MessageWithReasoningContent
        | undefined;
      if (!responseMessage) {
        return '';
      }

      const toolCalls = responseMessage.tool_calls ?? [];
      if (toolCalls.length === 0) {
        messageStore.getState().addMessage(this.createAssistantMessage(responseMessage));
        return responseMessage.content ?? '';
      }

      messageStore.getState().addMessage(
        this.createAssistantToolCallMessage(responseMessage, toolCalls),
      );

      for (const toolCall of toolCalls) {
        messageStore.getState().addMessage({
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

  private createAssistantMessage(
    message: MessageWithReasoningContent,
  ): ChatCompletionMessageParam {
    return {
      role: 'assistant',
      content: message.content ?? '',
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
      return await tool.execute(args); // 委托给工具注册表
    } catch (error) {
      return JSON.stringify({
        error: `Invalid arguments for ${toolCall.function.name}: ${(error as Error).message}`,
      });
    }
  }
}
