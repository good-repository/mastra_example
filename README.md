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

```
src/mastra/
├── agents/              # AI agents with instructions and tools
│   ├── cinema-agent.ts  # TV show specialist agent
│   └── weather-agent.ts # Weather information agent
│
├── workflows/           # Multi-step orchestrations
│   ├── cinema-workflow.ts                  # Series search workflow
│   ├── cinema-workflow-executor.ts         # Type-safe wrapper
│   ├── weather-workflow.ts                 # Weather + activities workflow
│   ├── weather-workflow-executor.ts        # Type-safe wrapper
│   ├── weather-types.ts                    # Type definitions
│   └── weather-prompts.ts                  # LLM prompts
│
├── tools/               # Reusable tools for agents
│   ├── cinema-workflow-tool.ts # Exposes cinema workflow
│   ├── tv-tool.ts              # Direct TVMaze API access
│   └── weather-tool.ts         # Weather forecasting tool
│
├── lib/                 # Shared utilities
│   ├── api-utils.ts     # Retry logic, error handling, endpoints
│   └── weather-codes.ts # WMO weather code mappings
│
├── scorers/             # Evaluation functions (optional)
│   └── weather-scorer.ts
│
└── index.ts             # Mastra initialization
```

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
