import { z } from 'zod';

/**
 * Agent Contracts
 * Defines the public interfaces for inter-agent communication.
 * Use these schemas and types when building tools that delegate to specialist agents.
 */

// ─── Weather Agent ────────────────────────────────────────────────────────────

export const weatherAgentQuerySchema = z.object({
  query: z.string().max(500).describe('Natural language weather query including the location'),
});

export const weatherAgentResponseSchema = z.object({
  response: z.string().describe('Weather information and activity suggestions'),
});

export type WeatherAgentQuery = z.infer<typeof weatherAgentQuerySchema>;
export type WeatherAgentResponse = z.infer<typeof weatherAgentResponseSchema>;

// ─── Cinema Agent ─────────────────────────────────────────────────────────────

export const cinemaAgentQuerySchema = z.object({
  query: z.string().max(500).describe('Natural language query about a TV show or series'),
});

export const cinemaAgentResponseSchema = z.object({
  response: z.string().describe('Information about the requested TV show or series'),
});

export type CinemaAgentQuery = z.infer<typeof cinemaAgentQuerySchema>;
export type CinemaAgentResponse = z.infer<typeof cinemaAgentResponseSchema>;
