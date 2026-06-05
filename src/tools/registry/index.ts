import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { globTool, readFileTool, writeFileTool } from '../builtin/file/index.js';
import { shellTool } from '../builtin/shell/index.js';
import type { AgentTool } from '../types/index.js';

const tools: AgentTool[] = [globTool, readFileTool, shellTool, writeFileTool];

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
