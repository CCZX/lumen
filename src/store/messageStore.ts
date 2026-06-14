import { createStore } from 'zustand/vanilla';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { assembleSystemPrompt } from '../prompts/index.js';

interface MessageState {
  messages: ChatCompletionMessageParam[];
  addMessage: (message: ChatCompletionMessageParam) => void;
  clearMessages: () => void;
}

export const messageStore = createStore<MessageState>()((set) => ({
  messages: [
    {
      role: 'system',
      content: assembleSystemPrompt(),
    },
  ],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () =>
    set((state) => ({
      messages: [state.messages[0]],
    })),
}));