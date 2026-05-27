# Lumen

一个最小可运行的 TypeScript + Ink Coding Agent CLI 骨架。

## 技术栈

- TypeScript：核心语言与类型系统
- Ink + React：CLI 交互界面
- Node.js + pnpm：运行时、依赖管理与构建工作流
- Zustand：React 外部也能同步读取的全局状态
- OpenAI SDK：OpenAI 兼容模型调用
- Zod：运行时配置校验
- Vitest + Biome：测试与代码质量

## 快速开始

```bash
pnpm install
cp .env.example .env
```

设置 `OPENAI_API_KEY` 后运行：

```bash
pnpm dev
```

非交互模式：

```bash
pnpm dev --print "hello"
```

构建：

```bash
pnpm build
pnpm start --print "hello"
```

## 当前结构

```text
src/
├── agent/              # Agent 核心
├── config/             # 配置读取与校验
├── store/              # Zustand vanilla store
├── ui/                 # Ink UI
├── tools/              # 后续工具系统扩展
├── context/            # 后续上下文管理扩展
├── services/           # 后续服务层扩展
├── mcp/                # 后续 MCP 协议扩展
├── prompts/            # 后续提示词管理扩展
├── logging/            # 后续日志系统扩展
└── main.tsx            # CLI 入口
```
