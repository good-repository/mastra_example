# Cinema Agent Knowledge Base

## TVMaze API — Available Data Fields

Each TV show from the TVMaze API contains the following fields:

- **id**: Unique numeric identifier for the show.
- **name**: Official show name (usually in English or original language).
- **summary**: Show description, may contain HTML tags (strip before displaying).
- **genres**: Array of genre strings (e.g. Drama, Comedy, Thriller).
- **status**: Current show status — Running, Ended, In Development, or To Be Determined.
- **premiered**: Premiere date in YYYY-MM-DD format. May be null for unaired shows.
- **officialSite**: URL of the official website. May be null if not available.
- **language**: Primary language of the show.
- **network**: Broadcast network (name, country). May be null for streaming-only shows.
- **webChannel**: Streaming platform (e.g. Netflix, HBO Max). May be null for broadcast shows.
- **rating**: Object with average rating (0–10 scale).
- **runtime**: Episode duration in minutes.
- **type**: Show type — Scripted, Animation, Reality, Documentary, Talk Show, Sports, etc.

## TVMaze API — Available Endpoints

Use these endpoints with the tvmaze-tool when show-details-tool is not enough:

- **/search/shows?q={name}**: Search shows by name. Returns array of results ordered by relevance score.
- **/shows/{id}**: Full details of a show by numeric ID.
- **/shows/{id}/episodes**: All episodes, including season, number, title, and air date.
- **/shows/{id}/seasons**: Season list with episode counts and premiere/end dates.
- **/shows/{id}/cast**: Main cast with actor names and character names.
- **/shows/{id}/crew**: Crew members (directors, producers, writers).
- **/shows/{id}/images**: All available images (poster, banner, etc.).
- **/schedule?country=US&date=YYYY-MM-DD**: TV schedule for a specific country and date.
- **/search/people?q={name}**: Search for actors or crew members by name.
- **/people/{id}/castcredits?embed=show**: All shows an actor has appeared in.
- **/shows?page={n}**: Paginated list of all shows (100 per page).

## Show Status Reference

- **Running**: Show is currently airing new episodes.
- **Ended**: Show has concluded permanently and will not return.
- **In Development**: Show has been announced or is in production but has not premiered yet.
- **To Be Determined**: Future is uncertain — may be renewed, cancelled, or on hiatus.

## Genre Reference

Genres available on TVMaze (can be combined):

Drama, Comedy, Thriller, Action, Adventure, Crime, Mystery, Science-Fiction, Fantasy, Horror, Romance, Espionage, Music, Sports, Anime, Children, Family, Medical, War, Western, Legal, History, Nature, Food, Travel, Home and Garden, Running.

## Handling Ambiguous Show Names

When a search returns multiple results or the user's intent is unclear:

1. The first result from /search/shows is the highest-relevance match.
2. If the user is looking for a lesser-known show with a common name, mention the top result and confirm before proceeding.
3. For very ambiguous queries (e.g. "the show with the chemist"), ask the user for more details.
4. Some shows have country-specific names — try the English title if the localized name fails.

## Show Not Found — Troubleshooting Steps

If a show cannot be found, try the following in order:

1. Use the original English title (e.g. "Dark" instead of "Sombra").
2. Remove articles ("Breaking Bad" not "The Breaking Bad").
3. Try common abbreviations (e.g. "GOT" for "Game of Thrones", "TWD" for "The Walking Dead").
4. Try alternate spellings or transliterations.
5. Search by the main character's name or actor if the show title is unknown.
6. If all attempts fail, ask the user to confirm the exact show name or provide additional context.

## Handling HTML in Summaries

TVMaze summaries often include HTML tags. Strip them before displaying:

- `<p>A <b>chemistry teacher</b> turns to crime.</p>` → `A chemistry teacher turns to crime.`
- `<p>` and `</p>`: Remove, treat as paragraph breaks.
- `<b>`, `<i>`, `<em>`, `<strong>`: Remove, keep inner text.
- `<br>`: Replace with a space or line break.

## API Error Handling

- **Empty search results** (empty array): No shows match the query. Try name variations before giving up.
- **404 Not Found**: The show ID does not exist. Use search first to get a valid ID.
- **503 Service Unavailable**: TVMaze is temporarily down. Inform the user and suggest retrying later.
- **Rate limiting**: TVMaze allows ~20 requests per 10 seconds for anonymous access. Avoid bulk queries.

## Response Format for Different Query Types

**General show info** (use show-details-tool):
```
- **Série:** [name]
- **Status:** [status]
- **Gênero:** [genres joined by comma]
- **Sinopse:** [summary without HTML]
- **Disponível em:** [officialSite or "não informado"]
```

**Episode list** (use tvmaze-tool with /shows/{id}/episodes):
List episodes grouped by season, showing: S01E01 — Title (air date).

**Cast query** (use tvmaze-tool with /shows/{id}/cast):
List main cast as: Actor Name as Character Name.

**Schedule query** (use tvmaze-tool with /schedule):
List shows with time, channel, and episode title.

## Streaming vs Broadcast Shows

- Shows on broadcast networks (ABC, NBC, CBS, Fox, etc.) have `network` populated and `webChannel` as null.
- Shows on streaming platforms (Netflix, HBO, Disney+, etc.) have `webChannel` populated and `network` as null.
- Some shows air on both; in that case, both fields may be populated.
- When presenting network info, check both fields and present whichever is available.
