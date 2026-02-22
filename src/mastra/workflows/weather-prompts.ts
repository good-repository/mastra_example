/**
 * Weather Activity Planning Prompts
 * Centralizes the complex prompt for weather-based activity suggestions
 */

export const WEATHER_ACTIVITY_PLANNING_PROMPT = (location: string, forecastJson: string) => `
Based on the following weather forecast for ${location}, suggest appropriate activities:

${forecastJson}

For each day in the forecast, structure your response exactly as follows:

📅 [Day, Month Date, Year]
═══════════════════════════

🌡️ WEATHER SUMMARY
• Conditions: [brief description]
• Temperature: [X°C/Y°F to A°C/B°F]
• Precipitation: [X% chance]

🌅 MORNING ACTIVITIES
Outdoor:
• [Activity Name] - [Brief description including specific location/route]
  Best timing: [specific time range]
  Note: [relevant weather consideration]

🌞 AFTERNOON ACTIVITIES
Outdoor:
• [Activity Name] - [Brief description including specific location/route]
  Best timing: [specific time range]
  Note: [relevant weather consideration]

🏠 INDOOR ALTERNATIVES
• [Activity Name] - [Brief description including specific venue]
  Ideal for: [weather condition that would trigger this alternative]

⚠️ SPECIAL CONSIDERATIONS
• [Any relevant weather warnings, UV index, wind conditions, etc.]

Guidelines:
- Suggest 2-3 time-specific outdoor activities per day
- Include 1-2 indoor backup options
- For precipitation >50%, lead with indoor activities
- All activities must be specific to the location
- Include specific venues, trails, or locations
- Consider activity intensity based on temperature
- Keep descriptions concise but informative

Maintain this exact formatting for consistency, using the emoji and section headers as shown.
`;
