# Technical Documentation

## Project Overview

**afanime** is a Telegram bot that automatically forwards anime episodes from the NEP (Nyaa Enhanced Protocol) library to a Telegram channel. It fetches anime metadata from Bangumi API and matches episodes using RealSearch.

## Commands

```bash
# Install dependencies
pnpm i

# Development (watch mode with hot reload)
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm run start

# Lint
pnpm run lint
pnpm run lint:fix

# Test
pnpm run test           # Run tests in watch mode
pnpm run test:run       # Run tests once
pnpm run test:ui        # Open Vitest UI
pnpm run test:coverage  # Run tests with coverage report

# Docs (VitePress)
pnpm run docs:dev
pnpm run docs:build
```

## Architecture

### Tech Stack
- **Runtime**: Node.js 18+ (ESM)
- **Language**: TypeScript 5.7
- **Bot Framework**: grammy (Telegram Bot API)
- **Database**: MongoDB (via Mongoose + @typegoose/typegoose)
- **Build Tool**: tsup (esbuild-based)
- **Linting**: @antfu/eslint-config

### Project Structure

```
src/
├── api/              # External API clients (Bangumi, RealSearch, NEP)
├── bot/              # Bot initialization, command handler, thread/topic management
├── classes/          # OOP entities (AniSub for anime, AniEpi for episodes, CustomError)
├── config/           # Environment config and throttler settings
├── constants/        # Bot command list and constants
├── databases/        # Shared state store (singleton pattern)
├── middlewares/      # Bot middlewares (authorization, conversation, menu, timestamp)
├── models/           # Mongoose/Typegoose schemas (Anime, Episode, Cron, Tag, Image, Rating)
├── modules/          # Feature modules organized by domain:
│   ├── anime/        # Anime management (fetch, update, push episodes)
│   ├── bangumi/      # Bangumi API integration
│   ├── realsearch/   # RealSearch API for episode matching
│   ├── crons/        # Scheduled jobs (daily episode fetch, weekly meta update)
│   └── user/         # User-related handlers
├── types/            # TypeScript type definitions
├── utils/            # Utility functions (logger, mongodb, string, promise)
└── start.ts          # Entry point
```

### Key Patterns

1. **Module Organization**: Each feature module has `index.ts` (exports), `task.ts` (scheduled tasks), and `event.ts` (event handlers).

2. **Shared State**: `src/databases/store.ts` is a singleton holding bot instance, menu state, active anime IDs, push queue, and cron jobs.

3. **Anime-Topic Mapping**: `ATRelation` class (`src/bot/thread.ts`) maintains bidirectional mapping between anime IDs and Telegram topic/thread IDs.

4. **OOP Entity Classes**:
   - `AniSub`: Represents an anime series, manages episode array, push list, and validation logic
   - `AniEpi`: Represents a single episode, validates title/episode number/link

5. **Cron Jobs**: Three built-in jobs in `src/modules/crons/jobs.ts`:
   - `updateAnimeLibraryEpisodesInfo`: Daily at 8:00 AM (fetch new episodes)
   - `updateAnimeLibraryMetaInfo`: Weekly on Monday at midnight (refresh metadata from Bangumi)
   - `timestamp`: Every minute (debug only, disabled by default)

### Data Flow (Episode Push)

1. Cron job triggers `executeAnimeEpisodeInfoTaskInOrder()` for each active anime
2. Fetch NEP repository using anime's `query` string
3. `dealNEPResult()` matches episodes, updates `maxInNEP` and `current_episode`
4. Valid episodes added to `pushCenter.list` queue
5. Bot sends messages from queue to the corresponding Telegram topic

### Environment Variables

Required: `BOT_TOKEN`, `GROUP_CHAT_ID`, `MONGO_DB_URL`, `REAL_SEARCH_URI`, `REAL_SEARCH_TOKEN`

Optional: `BOT_NAME`, `ADMIN_CHAT_IDS`, `TRANSLATOR_BLACK_LIST`, `PROXY_ADDRESS`, `COMMAND_WHITE_LIST`

### Path Aliases

- `#root/*` → `./src/*`
- `@/*` → `./src/*`

### Bot Commands

| Command | Admin Only | Description |
|---------|------------|-------------|
| `/start` | No | Welcome message |
| `/dashboard` | Yes | View anime management panel |
| `/create` | Yes | Create new anime entry |
| `/schedule` | No | View weekly broadcast schedule |
| `/cron` | Yes | Configure cron job schedules |
| `/info` | No | View anime metadata (in topic) |
| `/getid` | No | Get topic ID (in topic) |

## Testing

### Test Framework

- **Runner**: Vitest 4.x
- **UI**: @vitest/ui
- **Location**: `src/test/`

### Test Structure

```
src/test/
├── setup.ts              # Global setup with mocks
├── unit/                 # Unit tests for business logic
│   ├── utils/            # Utility function tests (string.ts)
│   ├── classes/          # OOP class tests (AniSub, AniEpi)
│   ├── bot/              # Bot logic tests (ATRelation)
│   └── modules/          # Module-level tests (dealNEPResult)
```

### Writing Tests

1. **Unit tests** - Test pure functions and class methods in isolation:
   - Mock external dependencies (APIs, database, logger)
   - Follow AAA pattern (Arrange-Act-Assert)
   - Use descriptive test names

2. **Mocking pattern**:
   ```typescript
   // Mock external API in setup.ts
   vi.mock('#root/api/bangumi.js', () => ({
     fetchBangumiSubjectInfoFromID: vi.fn(),
   }))

   // Mock config
   vi.mock('#root/config/index.js', () => ({
     config: { translatorBlacklist: ['BadSub'] },
   }))
   ```

3. **Test file naming**: `*.test.ts` in `src/test/unit/` subdirectories

### Test Commands

```bash
# Run all tests once
pnpm test:run

# Run in watch mode (default)
pnpm test

# Open Vitest UI dashboard
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test src/test/unit/classes/AniEpi.test.ts

# Run tests matching pattern
pnpm test -t "AniSub"
```

### Implemented Tests

- **utils/string.test.ts**: `extractEpisodeNumber`, `normalizedAnimeTitle`
- **classes/AniEpi.test.ts**: Episode validation (title, number, link, blacklist)
- **classes/AniSub.test.ts**: Anime subscription logic (push list, episode validation)
- **bot/thread.test.ts**: `ATRelation` singleton (anime-thread ID mapping)
- **modules/anime/dealNEPResult.test.ts**: NEP result processing logic
