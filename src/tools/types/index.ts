import type { FunctionParameters } from 'openai/resources/shared';

export interface AgentTool {
  name: string;
  description: string;
  parameters: FunctionParameters;
  execute: (args: unknown) => Promise<string>;
}
