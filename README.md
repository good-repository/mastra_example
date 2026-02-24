# Mastra Example — Multi-Agent AI Application

Example application demonstrating a multi-agent architecture with Mastra: an orchestrator agent that routes queries to domain specialists.

## Quick Start

```bash
cp .env.example .env   # fill in your API keys
yarn install
yarn seed:cinema       # populate cinema knowledge base (run once)
yarn dev               # Mastra Studio at http://localhost:4111
```

```bash
yarn build  # Production build
yarn start  # Start production server
```

**Node.js >= 22.13.0 required.**

## Architecture

```
User
 └─ orchestratorAgent           # Routes queries to the right specialist
     ├─ callWeatherAgent ──────> weatherAgent
     │                              ├─ forecast-tool → weatherWorkflow
     │                              │    └─ [fetchWeather → planActivities]
     │                              │         └─ activityPlannerAgent (internal)
     │                              └─ weather-tool
     └─ callCinemaAgent ───────> cinemaAgent
                                    ├─ show-details-tool
                                    ├─ tvmaze-tool
                                    └─ cinema-knowledge-tool → LibSQL vector store
```

- **`orchestratorAgent`** — understands user intent and delegates to specialists via agent-as-tool pattern
- **`weatherAgent`** — meteorology specialist; can fetch current weather or trigger the full workflow
- **`cinemaAgent`** — TV shows specialist with RAG-powered knowledge base (TVMaze API reference, response guidelines, edge case handling)
- **`activityPlannerAgent`** — internal, tool-free agent used only by `weatherWorkflow` to generate activity suggestions without circular dependency risk

## Project Structure

```
src/mastra/
├── orchestrator/
│   ├── agent.ts                    # Orchestrator agent
│   ├── index.ts
│   └── tools/
│       ├── call-weather-agent.ts   # Delegates to weatherAgent
│       └── call-cinema-agent.ts    # Delegates to cinemaAgent
│
├── weather/
│   ├── agent.ts                    # Weather specialist agent
│   ├── activity-planner-agent.ts   # Internal agent (no tools)
│   ├── workflow.ts                 # fetchWeather → planActivities
│   ├── workflow-executor.ts        # Type-safe workflow wrapper
│   ├── types.ts                    # Zod schemas & derived types
│   ├── prompts.ts                  # Activity planning prompt template
│   ├── knowledge.ts                # Inline thresholds & safety guidelines
│   ├── index.ts
│   └── tools/
│       ├── weather-tool.ts         # Current weather (Open-Meteo)
│       └── forecast-tool.ts        # Forecast + activity suggestions
│
├── cinema/
│   ├── agent.ts                    # Cinema specialist agent
│   ├── index.ts
│   ├── knowledge/
│   │   ├── faq.md                  # Knowledge base source (edit to expand)
│   │   └── seed.ts                 # Chunks, embeds and upserts faq.md
│   └── tools/
│       ├── show-details-tool.ts    # Show search + details (TVMaze)
│       ├── tvmaze-tool.ts          # Raw TVMaze API access
│       └── knowledge-tool.ts       # RAG: semantic search over cinema knowledge base
│
├── shared/
│   ├── config.ts                   # API endpoints, timeouts, model names
│   ├── index.ts
│   ├── types/
│   │   └── agent-contracts.ts      # Zod schemas for inter-agent I/O
│   └── lib/
│       ├── api-utils.ts            # fetchWithRetry, ApiError
│       └── weather-codes.ts        # WMO weather code mappings
│
├── scorers/
│   └── weather-scorer.ts           # Evals: tool accuracy, completeness, translation
│
└── index.ts                        # Mastra instance (agents, workflows, tools, vectors)
```

## Key Patterns

### Agent-as-Tool (Orchestrator)

The orchestrator delegates via tools that call `agent.generate()`:

```typescript
// orchestrator/tools/call-weather-agent.ts
export const callWeatherAgent = createTool({
  inputSchema: weatherAgentQuerySchema,
  execute: async ({ query }) => {
    const result = await weatherAgent.generate(query);
    return { response: result.text };
  },
});
```

### Agent Contracts

Inter-agent communication is typed via shared Zod schemas:

```typescript
// shared/types/agent-contracts.ts
export const weatherAgentQuerySchema = z.object({
  query: z.string().max(500).describe('Natural language weather query including the location'),
});
export type WeatherAgentQuery = z.infer<typeof weatherAgentQuerySchema>;
```

### Avoiding Circular Dependencies

`weatherWorkflow` calls `activityPlannerAgent` (no tools) instead of `weatherAgent` to prevent:

```
weatherAgent → forecast-tool → weatherWorkflow → weatherAgent  ← loop!
```

### Workflow Executor

The `(workflow.execute as any)()` cast is isolated to a single wrapper function, keeping type unsafety contained:

```typescript
// weather/workflow-executor.ts
export async function executeWeatherWorkflow(input: WeatherInput): Promise<WeatherOutput> {
  const result = await (weatherWorkflow.execute as any)({ inputData: input });
  return result as WeatherOutput;
}
```

### Inline Knowledge (Weather)

Small, structured knowledge stays as TypeScript constants injected into prompts — no vector store needed:

```typescript
// weather/knowledge.ts
export const THRESHOLDS = {
  wind: { strong: 60 },       // km/h — avoid outdoor activities
  precipitation: { high: 80 }, // % — lead with indoor alternatives
  // ...
} as const;
```

These are imported by `prompts.ts` and rendered into the activity planning prompt at call time. Editing a threshold only requires changing one constant.

### RAG Knowledge Base (Cinema)

Large or unstructured reference material lives in a vector store — the agent retrieves only relevant chunks on demand:

```typescript
// cinema/tools/knowledge-tool.ts
export const cinemaKnowledgeTool = createVectorQueryTool({
  vectorStoreName: 'cinemaKnowledge',
  indexName: 'cinema_faq',
  model: google.embedding('text-embedding-004'),
});
```

To update the knowledge base, edit `cinema/knowledge/faq.md` and re-run:

```bash
yarn seed:cinema
```

**When to use each approach:**
- **Inline constants** — small set of well-defined values (thresholds, rules, enums)
- **RAG** — large reference docs, API specs, FAQs that would bloat the system prompt

## Adding a New Domain

1. **Create the feature directory** following the weather/cinema structure:

```
src/mastra/music/
├── agent.ts
├── index.ts
└── tools/
    └── spotify-tool.ts
```

2. **Define agent contracts** in `shared/types/agent-contracts.ts`:

```typescript
export const musicAgentQuerySchema = z.object({ query: z.string().max(500) });
export type MusicAgentQuery = z.infer<typeof musicAgentQuerySchema>;
```

3. **Create a delegation tool** in `orchestrator/tools/call-music-agent.ts`

4. **Register** agent and tool in `src/mastra/index.ts` and add `callMusicAgent` to the orchestrator

## External APIs

| API | Used for | Auth |
|-----|----------|------|
| [TVMaze](https://www.tvmaze.com/api) | TV show search & details | None |
| [Open-Meteo](https://open-meteo.com) | Geocoding + weather forecast | None |
| [Google Gemini](https://aistudio.google.com) | LLM + embeddings | `GOOGLE_GENERATIVE_AI_API_KEY` |

## Configuration

`shared/config.ts` — API endpoints, retry policy (3 attempts, exponential backoff, 10s timeout), and model names.

`LOG_LEVEL` env var controls log verbosity (`debug` | `info` | `warn` | `error`, default: `info`).

## Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Zod Documentation](https://zod.dev)
