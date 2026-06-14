import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { debugStore } from '../store/debugStore.js';
import { messageStore } from '../store/messageStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lumen Debug Panel</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/debug-panel.js"></script>
</body>
</html>`;

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendFile(res: ServerResponse, filePath: string, contentType: string): void {
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(readFileSync(filePath));
}

const sseClients = new Set<ServerResponse>();

// Subscribe to store changes
messageStore.subscribe(() => {
  const messages = messageStore.getState().messages;
  const data = `event: messages\ndata: ${JSON.stringify(messages)}\n\n`;
  sseClients.forEach(client => {
    client.write(data);
  });
});

debugStore.subscribe(() => {
  const logs = debugStore.getState().logs;
  const data = `event: logs\ndata: ${JSON.stringify(logs)}\n\n`;
  sseClients.forEach(client => {
    client.write(data);
  });
});

export function startDebugHttpServer(port: number = 3001): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    if (url.pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML);
      return;
    }

    if (url.pathname === '/debug-panel.js' && req.method === 'GET') {
      sendFile(res, join(projectRoot, 'dist', 'debug-panel.js'), 'application/javascript');
      return;
    }

    if (url.pathname === '/messages' && req.method === 'GET') {
      sendJson(res, 200, messageStore.getState().messages);
      return;
    }

    if (url.pathname === '/logs' && req.method === 'GET') {
      sendJson(res, 200, debugStore.getState().logs);
      return;
    }

    if (url.pathname === '/clear' && req.method === 'POST') {
      debugStore.getState().clearLogs();
      sendJson(res, 200, { ok: true });
      return;
    }

    // SSE endpoint for real-time updates
    if (url.pathname === '/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      // Send initial data
      res.write(`event: messages\ndata: ${JSON.stringify(messageStore.getState().messages)}\n\n`);
      res.write(`event: logs\ndata: ${JSON.stringify(debugStore.getState().logs)}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`[DEBUG] HTTP server running at http://localhost:${port}`);
  });
}