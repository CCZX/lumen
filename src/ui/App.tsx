import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Agent } from '../agent/Agent.js';
import { useConfigStore } from '../store/configStore.js';

export function App(): ReactElement {
  const config = useConfigStore((state) => state.config);
  const agent = useMemo(() => new Agent(config), [config]);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(value: string): Promise<void> {
    const trimmedValue = value.trim();
    if (!trimmedValue || isLoading) {
      return;
    }

    setIsLoading(true);
    setInput('');

    try {
      const result = await agent.chat(trimmedValue);
      setResponse(result || '(empty response)');
    } catch (error) {
      setResponse(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Lumen Coding Agent
      </Text>
      <Text color="gray">model: {config.model}</Text>

      <Box marginY={1} flexDirection="column">
        {isLoading ? (
          <Box>
            <Spinner type="dots" />
            <Text> Thinking...</Text>
          </Box>
        ) : (
          response && <Text>{response}</Text>
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
