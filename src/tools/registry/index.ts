import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { readFileTool } from '../builtin/file/index.js';
import type { AgentTool } from '../types/index.js';

const tools: AgentTool[] = [readFileTool];

export function getTools(): AgentTool[] {
  return tools;
}

export function getTool(name: string): AgentTool | undefined {
  return tools.find((tool) => tool.name === name);
}

export function getToolsAsChatCompletionTools(): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
