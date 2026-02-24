# AGENTS.md

This document provides guidance for AI coding agents working in this repository.

## CRITICAL: Mastra Skill Required

**BEFORE doing ANYTHING with Mastra code or answering Mastra questions, load the Mastra skill FIRST.**

See [Mastra Skills section](#mastra-skills) for loading instructions.

## Project Overview

This is a **Mastra** project written in TypeScript. Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack.

## Commands

```bash
yarn install        # Install dependencies
yarn dev            # Start Mastra Studio at http://localhost:4111
yarn build          # Production build → .mastra/output/
yarn start          # Run production server
```

## Project Structure

This project uses **feature-based modularization** — each domain is self-contained under its own folder.

```
src/mastra/
├── orchestrator/          # Central router; delegates to specialist agents
│   ├── agent.ts
│   ├── index.ts
│   └── tools/
│       ├── call-weather-agent.ts
│       └── call-cinema-agent.ts
├── weather/               # Meteorology specialist
│   ├── agent.ts
│   ├── activity-planner-agent.ts  # Internal (no tools), used by workflow only
│   ├── workflow.ts
│   ├── workflow-executor.ts
│   ├── types.ts
│   ├── prompts.ts
│   ├── index.ts
│   └── tools/
│       ├── tool.ts
│       └── workflow-tool.ts
├── cinema/                # TV shows specialist
│   ├── agent.ts
│   ├── index.ts
│   └── tools/
│       ├── direct-tool.ts
│       └── tv-tool.ts
├── shared/                # Cross-feature utilities
│   ├── config.ts          # API endpoints, timeouts, model names
│   ├── index.ts
│   ├── types/
│   │   └── agent-contracts.ts  # Zod schemas for inter-agent I/O
│   └── lib/
│       ├── api-utils.ts   # fetchWithRetry, ApiError, formatApiError
│       └── weather-codes.ts
├── scorers/               # Evals for agent quality measurement
│   └── weather-scorer.ts
└── index.ts               # Mastra instance configuration
```

### Top-level files

| File                  | Description                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `src/mastra/index.ts` | Mastra instance — registers all agents, workflows, and tools.                                     |
| `.env.example`        | Template for environment variables — copy to `.env` and fill in your keys.                        |
| `package.json`        | Project metadata, dependencies, and scripts (`dev`, `build`, `start`).                           |

## Mastra Skills

Skills are modular capabilities that extend agent functionalities. They provide pre-built tools, integrations, and workflows that agents can leverage to accomplish tasks more effectively.

This project has skills installed for the following agents:

- Claude Code

### Loading Skills

1. **Load the Mastra skill FIRST** - Use `/mastra` command or Skill tool
2. **Never rely on cached knowledge** - Mastra APIs change frequently between versions
3. **Always verify against current docs** - The skill provides up-to-date documentation

**Why this matters:** Your training data about Mastra is likely outdated. Constructor signatures, APIs, and patterns change rapidly. Loading the skill ensures you use current, correct APIs.

Skills are automatically available to agents in your project once installed. Agents can access and use these skills without additional configuration.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra .well-known skills discovery](https://mastra.ai/.well-known/skills/index.json)
