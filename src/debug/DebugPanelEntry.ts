const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { font-family: 'SF Mono', 'Fira Code', Menlo, Monaco, Courier New, monospace; background: #1e1e2e; color: #cdd6f4; padding: 20px; display: flex; flex-direction: column; height: 100vh; font-size: 14px; line-height: 1.5; }
#root { height: 100%; display: flex; flex-direction: column; }
.container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-shrink: 0; }
.header h3 { color: #89b4fa; font-size: 1.2rem; margin: 0; }
.header .status { color: #6c7086; font-size: 0.85rem; margin: 0; }
h2 { color: #a6e3a1; margin: 15px 0 8px; font-size: 1rem; flex-shrink: 0; }
.section { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 10px; }
.section h2 { flex-shrink: 0; }
.messages { background: #313244; border-radius: 8px; padding: 12px; flex: 1; overflow-y: auto; }
.message { padding: 8px; margin-bottom: 8px; border-radius: 4px; }
.message.user { background: rgba(137, 180, 250, 0.13); border-left: 3px solid #89b4fa; }
.message.assistant { background: rgba(166, 227, 161, 0.13); border-left: 3px solid #a6e3a1; }
.message.tool { background: rgba(250, 179, 135, 0.13); border-left: 3px solid #fab387; }
.message-role { font-size: 0.7rem; color: #6c7086; margin-bottom: 4px; text-transform: capitalize; }
.message-content { font-size: 0.85rem; white-space: pre-wrap; word-break: break-word; }
.logs-list { flex: 1; overflow-y: auto; }
.log-entry { background: #313244; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
.log-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.log-type { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; }
.log-type.request { background: #89b4fa; color: #1e1e2e; }
.log-type.response { background: #a6e3a1; color: #1e1e2e; }
.log-type.error { background: #f38ba8; color: #1e1e2e; }
.log-time { color: #6c7086; font-size: 0.75rem; }
.log-data { background: #181825; padding: 8px; border-radius: 4px; overflow-x: auto; max-height: 200px; overflow-y: auto; }
.log-data pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 0.8rem; }
.empty { color: #6c7086; font-style: italic; }

/* Hide scrollbars but keep functionality */
.messages, .logs-list, .log-data {
  scrollbar-width: none; /* Firefox */
}
.messages::-webkit-scrollbar, .logs-list::-webkit-scrollbar, .log-data::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Edge */
}
`;

interface Message {
  role: string;
  content: string | null;
}

interface DebugLog {
  type: 'request' | 'response' | 'error';
  timestamp: number;
  data: unknown;
}

let messages: Message[] = [];
let logs: DebugLog[] = [];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatLogData(data: unknown): string {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function renderMessages(msgs: Message[]): string {
  if (!msgs || msgs.length === 0) {
    return '<div class="empty">No messages yet...</div>';
  }

  return msgs
    .filter(m => m.role !== 'system')
    .map(m => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `<div class="message ${m.role}">
        <div class="message-role">${escapeHtml(m.role)}</div>
        <div class="message-content">${escapeHtml(content)}</div>
      </div>`;
    }).join('');
}

function renderLogs(logList: DebugLog[]): string {
  if (!logList || logList.length === 0) {
    return '<div class="empty">No logs yet...</div>';
  }

  return logList.map(log => {
    const data = formatLogData(log.data);
    return `<div class="log-entry">
      <div class="log-header">
        <span class="log-type ${log.type}">${log.type.toUpperCase()}</span>
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="log-data"><pre>${escapeHtml(data)}</pre></div>
    </div>`;
  }).join('');
}

function render(): void {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `<div class="container">
    <div class="header">
      <h3>Lumen Debug Panel</h3>
      <div class="status">Connected | Messages: ${messages.length} | Logs: ${logs.length}</div>
    </div>
    <div class="section">
      <h2>Messages</h2>
      <div class="messages">${renderMessages(messages)}</div>
    </div>
    <div class="section">
      <h2>Debug Logs</h2>
      <div class="logs-list">${renderLogs(logs)}</div>
    </div>
  </div>`;
}

function connectSSE(): void {
  const es = new EventSource('/events');

  es.addEventListener('messages', (e) => {
    messages = JSON.parse(e.data);
    render();
  });

  es.addEventListener('logs', (e) => {
    logs = JSON.parse(e.data);
    render();
  });

  es.onerror = () => {
    console.error('SSE connection error, reconnecting...');
    es.close();
    setTimeout(connectSSE, 1000);
  };
}

function init(): void {
  if (!document.getElementById('debug-styles')) {
    const style = document.createElement('style');
    style.id = 'debug-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  connectSSE();
}

init();