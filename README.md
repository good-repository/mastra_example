# Mastra Example - Multi-Agent AI Application

A comprehensive example application demonstrating Mastra's capabilities with multiple AI agents, workflows, and tools for managing different domains (Cinema/TV Shows and Weather).

## 🎯 Project Overview

This project showcases:
- **Multiple AI Agents** - Specialized agents for different tasks (Cinema, Weather)
- **Workflows** - Multi-step orchestration with automatic retry logic
- **Type-Safe Tools** - Tools with full TypeScript support and validation
- **Error Handling** - Robust error handling with retry mechanisms
- **API Integration** - Integration with TVMaze and Open-Meteo APIs

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.13.0
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the Mastra Studio at http://localhost:4111:

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Running Production Server

```bash
npm start
```

## 📂 Project Structure

The project follows a **feature-based modular architecture** for clarity and scalability:

```
src/mastra/
├── cinema/                      # Cinema domain (TV shows)
│   ├── agent.ts                 # Cinema specialist agent
│   ├── workflow.ts              # Show search & details workflow
│   ├── workflow-executor.ts      # Type-safe workflow wrapper
│   └── tools/
│       ├── workflow-tool.ts      # Exposes workflow to agents
│       └── tv-tool.ts            # Direct TVMaze API access
│
├── weather/                     # Weather domain
│   ├── agent.ts                 # Weather specialist agent
│   ├── workflow.ts              # Forecast + activity planning
│   ├── workflow-executor.ts      # Type-safe workflow wrapper
│   ├── types.ts                 # Zod schemas & type exports
│   ├── prompts.ts               # LLM activity planning prompt
│   └── tools/
│       ├── workflow-tool.ts      # Exposes workflow to agents
│       └── tool.ts               # Current weather for any location
│
├── shared/                      # Shared utilities
│   └── lib/
│       ├── api-utils.ts         # Retry logic, error handling, endpoints
│       └── weather-codes.ts     # WMO weather code mappings (34 codes)
│
├── scorers/                     # Optional evaluators
│   └── weather-scorer.ts        # (not currently used)
│
├── public/                      # Static assets (copied to build)
│
└── index.ts                     # Mastra initialization & exports
```

### Architecture Pattern

Each feature (cinema, weather) follows this consistent structure:

```
feature/
├── agent.ts              # Agent with instructions and tools
├── workflow.ts           # Multi-step workflow definition
├── workflow-executor.ts  # Type-safe wrapper (isolates complex Mastra API)
├── types.ts             # (Weather only) Zod schemas + z.infer types
├── prompts.ts           # (Weather only) Extracted LLM prompts
└── tools/
    ├── workflow-tool.ts  # Exposes workflow as tool
    └── *.ts             # Additional tools (tv-tool, tool.ts)
```

This pattern makes it **easy to add new features** - just follow the same structure!

### Why This Architecture?

1. **Modular** - Each feature is self-contained and independent
2. **Scalable** - Add new features (music, sports, news) without touching existing code
3. **Clear** - Understand the whole feature by reading its directory
4. **Maintainable** - Shared code is centralized, feature code is localized
5. **Testable** - Each module can be tested independently
6. **Consistent** - All features follow the same pattern

## 🎬 Cinema Agent

Specializes in TV show information from TVMaze.

### Features
- **Cinema Workflow Tool** - Automated search and detail fetching
- **TV Tool** - Direct API access for advanced queries

### Example Usage

```typescript
cinemaAgent.stream([
  { role: 'user', content: 'Tell me about Breaking Bad' }
])
```

## ☀️ Weather Agent

Provides weather information and activity suggestions based on forecasts.

### Features
- **Weather Tool** - Current weather data from Open-Meteo
- **Activity Planning** - Suggests activities based on weather conditions

### Example Usage

```typescript
weatherAgent.stream([
  { role: 'user', content: 'What\'s the weather like in New York?' }
])
```

## 🏗️ Architecture Highlights

### Type Safety

All workflows export types using `z.infer` from Zod schemas:

```typescript
type ShowDetail = z.infer<typeof showDetailSchema>;
type WeatherInput = z.infer<typeof weatherInputSchema>;
```

### Error Handling

Centralized error handling with retry logic:

```typescript
await fetchWithRetry<T>(url, options, 3); // Auto-retries with backoff
```

### API Integration

Centralized API endpoints:

```typescript
API_ENDPOINTS.TVMAZE.SEARCH_SHOWS
API_ENDPOINTS.OPEN_METEO.WEATHER
```

## 🆕 Adding New Features

To add a new feature (e.g., Music, Sports, News), follow this pattern:

### 1. Create Feature Directory

```
src/mastra/{feature}/
├── index.ts              # Central exports
├── agent.ts              # Feature agent
├── workflow.ts           # Multi-step workflow
├── workflow-executor.ts  # Type-safe wrapper
├── types.ts             # Zod schemas & exports (if needed)
├── prompts.ts           # LLM prompts (if needed)
└── tools/
    ├── primary-tool.ts   # Main feature tool
    └── workflow-tool.ts  # Exposes workflow as tool
```

### 2. Create `index.ts` Exports

```typescript
// music/index.ts
export { musicAgent } from './agent';
export { musicWorkflow } from './workflow';
export { spotifyTool } from './tools/spotify-tool';
export { musicWorkflowTool } from './tools/workflow-tool';
export type { MusicSearchInput, MusicResult } from './workflow-executor';
```

### 3. Update Main Exports

```typescript
// src/mastra/index.ts
import { musicAgent, musicWorkflow, spotifyTool, musicWorkflowTool } from './music';

export const mastra = new Mastra({
  workflows: { ..., musicWorkflow },
  agents: { ..., musicAgent },
  tools: { ..., spotifyTool, musicWorkflowTool },
  // ...
});
```

### Key Patterns

✅ **Self-contained** - Everything a feature needs is in its folder  
✅ **Clean imports** - Use `index.ts` for centralized exports  
✅ **Type-safe** - Export types via workflow-executor  
✅ **Prompt management** - Extract complex prompts to `prompts.ts`  
✅ **Error handling** - Use shared `formatApiError()` for consistency  

## 📊 API Integration

### TVMaze
- Search shows: `/search/shows?q={name}`
- Show details: `/shows/{id}`
- Retry logic: 3 attempts with exponential backoff
- Timeout: 10 seconds

### Open-Meteo (Weather)
- Geocoding: Complete location lookup
- Forecasting: Temperature, precipitation, conditions
- No API key required
- Free tier available

## 🔧 Configuration

### Retry Policy
- **Max Retries**: 3
- **Initial Delay**: 1000ms
- **Backoff**: Exponential
- **Timeout**: 10 seconds

### Models
- **Default Model**: google/gemini-2.5-flash-lite
- Configurable per agent

## 📝 Development Notes

### Workflow Executors

Each complex workflow has an executor wrapper for type safety:

```typescript
// cinema-workflow-executor.ts
export async function executeCinemaWorkflow(
  input: ShowSearchInput
): Promise<ShowDetail>

// weather-workflow-executor.ts
export async function executeWeatherWorkflow(
  input: WeatherInput
): Promise<WeatherOutput>
```

### Prompt Management

Long prompts are extracted to separate files:
- `weather-prompts.ts` - Activity planning prompts

This improves maintainability and readability.

## 🚦 Testing

Run `npm run dev` to access Mastra Studio where you can:
- Test agents interactively
- Inspect workflow execution
- Monitor API calls and traces
- View performance metrics

## 📚 Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [TVMaze API](https://www.tvmaze.com/api)
- [Open-Meteo API](https://open-meteo.com)
- [Zod Documentation](https://zod.dev)

## 📖 Best Practices Used

✅ Type-safe with TypeScript/Zod  
✅ Centralized configuration  
✅ Robust error handling with retry logic  
✅ Separated concerns (agents, tools, workflows)  
✅ Reusable utilities and types  
✅ Clear error messages for users  
✅ Proper timeout handling  
✅ Documented code with comments  

## 🤝 Contributing

This is an example project. Feel free to fork and extend with your own agents and tools.

## 📄 License

ISC
