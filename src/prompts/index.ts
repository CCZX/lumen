/**
 * Prompt templates organized in layers following Claude Code's approach.
 *
 * Layers:
 * 1. System - Core role definition
 * 2. Guidelines - Behavioral rules
 * 3. Tools Context - Available tools and their usage
 */

import { SYSTEM_PROMPT } from './system.js';
import { GUIDELINES_PROMPT } from './guidelines.js';
import { TOOLS_CONTEXT_PROMPT } from './tools.js';

export { SYSTEM_PROMPT, GUIDELINES_PROMPT, TOOLS_CONTEXT_PROMPT };

/**
 * 组装并合并所有层
 */
export function assembleSystemPrompt(): string {
  return [SYSTEM_PROMPT, GUIDELINES_PROMPT, TOOLS_CONTEXT_PROMPT].join('\n\n');
}