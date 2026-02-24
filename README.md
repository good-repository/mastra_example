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
yarn eval   # Run weather agent evaluations
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
│       ├── cache.ts                # In-memory TTL cache
│       └── weather-codes.ts        # WMO weather code mappings
│
├── scorers/
│   └── weather-scorer.ts           # Scorers: tool accuracy, completeness, translation
│
├── evals/
│   └── weather-evals.ts            # Eval runner (yarn eval)
│
└── index.ts                        # Mastra instance (agents, workflows, tools, vectors)
```

## Key Patterns

### Agent-as-Tool (Orchestrator)

The orchestrator delegates via tools that call `agent.generate()`. An optional `context` field carries recent conversation turns so specialists can resolve follow-up queries:

```typescript
// orchestrator/tools/call-weather-agent.ts
export const callWeatherAgent = createTool({
  inputSchema: weatherAgentQuerySchema,
  execute: async (inputData) => {
    const prompt = inputData.context
      ? `Contexto da conversa recente:\n${inputData.context}\n\nPergunta atual: ${inputData.query}`
      : inputData.query;
    const result = await weatherAgent.generate(prompt);
    return { response: result.text };
  },
});
```

The orchestrator's instructions tell it to populate `context` when it detects a follow-up question (e.g. "e amanhã?", "e lá?"), summarising the relevant prior turns before delegating.

### Agent Contracts

Inter-agent communication is typed via shared Zod schemas. Every specialist query schema includes an optional `context` field for follow-up support:

```typescript
// shared/types/agent-contracts.ts
export const weatherAgentQuerySchema = z.object({
  query: z.string().max(500).describe('Natural language weather query including the location'),
  context: z.string().max(1000).optional()
    .describe('Recent conversation turns to help the specialist resolve follow-up queries'),
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

The `WeatherInput` type includes an optional `forecastDays` parameter (1–16, default 7) that flows all the way through to the Open-Meteo API call:

```typescript
// weather/types.ts
export const weatherInputSchema = z.object({
  city: z.string().max(200),
  forecastDays: z.number().int().min(1).max(16).optional().default(7),
});
```

### In-Memory Cache

A lightweight TTL cache (`shared/lib/cache.ts`) wraps API calls to avoid redundant fetches for the same input within a session:

```typescript
// usage in a tool
return withCache(`weather:${location.toLowerCase()}`, 30 * 60_000, () => fetchWeather(location));
```

Applied to:
- `weather-tool.ts` — 30-minute TTL per location
- `show-details-tool.ts` — 1-hour TTL per show name

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

### Evals

Scorers in `scorers/weather-scorer.ts` define automated quality checks for the weather agent.

Three scorers are included:

| Scorer | What it checks |
|---|---|
| `toolCallAppropriatenessScorer` | Did the agent call `weatherTool` when it should? |
| `completenessScorer` | Does the response include all expected fields (temp, wind, condition)? |
| `translationScorer` | Did the agent translate non-English city names before calling the API? |

**Registered on the agent** — scorers are attached directly to `weatherAgent` via the `evals` property:

```typescript
// weather/agent.ts
new Agent({
  evals: scorers, // runs automatically on every agent execution in eval mode
})
```

This means every run in Mastra Studio is scored and the results are stored in the LibSQL database, giving you a quality history over time.

**Manual runner** — to run evals from the terminal against live API calls:

```bash
yarn eval
```

The runner (`evals/weather-evals.ts`) exercises the agent with four representative queries and prints a score report. Exit code is non-zero if any check falls below the 0.7 threshold, making it CI-friendly.

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
export const musicAgentQuerySchema = z.object({
  query: z.string().max(500),
  context: z.string().max(1000).optional()
    .describe('Recent conversation turns to help the specialist resolve follow-up queries'),
});
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
