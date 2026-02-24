/**
 * Weather Activity Knowledge
 *
 * Inline reference material: thresholds and safety guidelines used by the
 * activity planner prompt. Small enough to stay as constants — no RAG needed.
 * Edit these values to tune activity recommendations without touching prompts.
 */

export const THRESHOLDS = {
  temperature: {
    extremeCold: -10, // °C — stay indoors, risk of hypothermia
    cold: 5,          // °C — limit exposure, dress in layers
    comfortableMin: 15,
    comfortableMax: 28,
    hot: 35,          // °C — reduce physical intensity, stay hydrated
    extremeHeat: 40,  // °C — avoid outdoor exertion
  },
  wind: {
    calm: 20,      // km/h — all activities suitable
    moderate: 40,  // km/h — limit light outdoor activities (cycling, picnics)
    strong: 60,    // km/h — avoid most outdoor activities
    dangerous: 80, // km/h — stay indoors
  },
  precipitation: {
    low: 20,      // % — outdoor plans safe
    moderate: 50, // % — bring umbrella, have indoor backup
    high: 80,     // % — lead with indoor alternatives
  },
} as const;

export const SAFETY_GUIDELINES = [
  `Wind above ${THRESHOLDS.wind.strong} km/h: avoid cycling, running, and open-air sports`,
  `Temperature above ${THRESHOLDS.temperature.hot}°C: reduce intensity, prioritize shade and hydration`,
  `Temperature below ${THRESHOLDS.temperature.cold}°C: dress in layers, limit exposure time`,
  `Precipitation above ${THRESHOLDS.precipitation.high}%: lead with indoor alternatives`,
  'Thunderstorm conditions: avoid all outdoor activities',
] as const;
