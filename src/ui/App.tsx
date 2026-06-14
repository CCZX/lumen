import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Agent } from '../agent/Agent.js';
import { useConfigStore } from '../store/configStore.js';
import { messageStore } from '../store/messageStore.js';

export function App(): ReactElement {
  const config = useConfigStore((state) => state.config);
  const agent = useMemo(() => new Agent(config), [config]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => messageStore.getState().messages);
  const [pendingInput, setPendingInput] = useState('');

  async function handleSubmit(value: string): Promise<void> {
    const trimmedValue = value.trim();
    if (!trimmedValue || isLoading) {
      return;
    }

    setIsLoading(true);
    setPendingInput(trimmedValue);
    setInput('');

    try {
      await agent.chat(trimmedValue);
      setMessages([...messageStore.getState().messages]);
    } catch (error) {
      messageStore.getState().addMessage({
        role: 'assistant',
        content: `Error: ${(error as Error).message}`,
      });
      setMessages([...messageStore.getState().messages]);
    } finally {
      setIsLoading(false);
      setPendingInput('');
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Lumen Coding Agent
      </Text>
      <Text color="gray">model: {config.model}</Text>

      <Box marginY={1} flexDirection="column" flexGrow={1}>
        {messages
          .filter((m) => m.role !== 'system')
          .map((m, i) => (
            <Text key={i}>
              {m.role === 'user' && (
                <Text color="green">{'> '}</Text>
              )}
              {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
              {'\n'}
            </Text>
          ))}
        {isLoading && (
          <Text>
            <Text color="green">{'> '}</Text>
            {pendingInput}
            {'\n'}
            <Spinner type="dots" />
            <Text> Thinking...</Text>
          </Text>
        )}
      </Box>

      <Box>
        <Text color="green">{'> '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Ask me anything..."
        />
      </Box>
    </Box>
  );
}
