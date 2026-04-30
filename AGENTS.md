# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-11
**Commit:** Unknown
**Branch:** main

## OVERVIEW
This is `afanime`, a TypeScript-based Telegram Bot built with the `grammy` framework and MongoDB (`mongoose`, `@typegoose`). It provides anime-related features, likely integrating with external APIs like Bangumi and RealSearch.

## STRUCTURE
```
./
├── docs/          # VitePress documentation site
├── openspec/      # Experimental OpenSpec (OPSX) artifacts and workflow
├── src/           # Application source code
│   ├── api/       # External service integrations (Bangumi, RealSearch)
│   ├── bot/       # Grammy bot initialization, commands, menus, cron jobs
│   ├── classes/   # Domain models and Grammy extensions (AniEpi, AniSub)
│   ├── config/    # Configuration schemas
│   ├── databases/ # Shared store/singleton instance bridge
│   ├── middlewares/# Grammy middleware (throttling, auth, menus)
│   ├── models/    # Mongoose/Typegoose schemas
│   ├── modules/   # Core business logic divided by domain (anime, bangumi, user)
│   └── utils/     # Shared utilities (logger, string formatting)
└── src/test/      # Vitest unit tests (mirrors src/ structure)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Bot Initialization | `src/start.ts`, `src/bot/index.ts` | `start.ts` is the main entry point setting up DB and polling. |
| Feature Logic | `src/modules/*/` | Domain-specific logic is split here (e.g., anime processing). |
| Database Schemas | `src/models/*/` | Defined using `@typegoose/typegoose`. |
| External API Logic | `src/api/*/` | Integrations with external data sources like Bangumi. |
| Testing | `src/test/unit/` | Unit tests using Vitest, MUST pass before commits. |

## CONVENTIONS
- **Imports:** Uses `.js` extensions for internal imports in `.ts` files, necessary for the ESM configuration. Path aliases (`#root/*` and `@/*`) both map to `src/`.
- **Testing Style:** Heavy use of `vi.mock` for global/external dependencies defined in `src/test/setup.ts`. Mocks are cleared automatically `afterEach`. White-box testing is common (e.g., casting instances to `any` to test private methods).
- **Linting:** Uses `@antfu/eslint-config`. `no-console` and `no-unused-vars` are explicitly turned off.

## RULES & PERMISSION CONTROLS (ALL AGENTS MUST OBEY)
- **Primary Source of Truth:** `AGENTS.md` is the central knowledge base. `CLAUDE.md` explicitly defers to it.
- **Code Modification:** Do not commit code without running tests first (`pnpm test:run && pnpm run build`).
- **Testing Constraints:** NEVER ignore failing tests. Fix them or intentionally update tests. NEVER remove tests unless the code is removed. NEVER use `.skip()` permanently.
- **Build Quality:** Ensure that no console warnings or unused variables break the build logic unless explicitly permitted by the local config (`no-console` and `no-unused-vars` are off).
- **Environment:** Use ESM imports with `.js` extensions for internal imports in `.ts` files.

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT commit code without running tests:** `pnpm test:run && pnpm run build` is a strict pre-commit requirement.
- **NEVER ignore failing tests:** Fix them or intentionally update tests.
- **NEVER remove tests** unless the tested code is completely removed.
- **NEVER use `.skip()` permanently:** Only allowed temporarily for debugging.

## UNIQUE STYLES
- **Hybrid Store:** `src/databases/store.ts` acts as a global singleton container for the Bot instance, which is unconventional compared to context passing.
- **Mixed Classes:** `src/classes/` contains both pure domain data structures (`AniEpi`, `AniSub`) and framework-specific extensions (like `CustomConversation.ts`).

## COMMANDS
```bash
pnpm run dev       # Start development mode with auto-restart
pnpm run build     # Production build via tsup
pnpm test:run      # Run all Vitest tests
pnpm test          # Run Vitest in watch mode
```

## NOTES
- The bot initialization sequence in `src/bot/index.ts` is highly synchronous and linear, noted in the code as a TODO for future refactoring.
- The repository includes a `ccpm.bat` and an `openspec/` directory, indicating the use of a specialized internal workflow or specification-driven development tool (OPSX).
