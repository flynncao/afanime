# CLAUDE.md

> **Note**: For detailed technical documentation, see [TECH.md](./TECH.md). For comprehensive testing guidelines, see [TESTING_GUIDE.md](./TESTING_GUIDE.md).

## RULES

### Testing Requirements

**ALWAYS run related tests after making code changes:**

| When you change... | You MUST run... | And verify... |
|--------------------|-----------------|---------------|
| `src/utils/string.ts` | `pnpm test src/test/unit/utils/` | All string tests pass |
| `src/classes/AniEpi.ts` | `pnpm test src/test/unit/classes/AniEpi.test.ts` | All AniEpi tests pass |
| `src/classes/AniSub.ts` | `pnpm test src/test/unit/classes/AniSub.test.ts` | All AniSub tests pass |
| `src/bot/thread.ts` | `pnpm test src/test/unit/bot/` | All thread tests pass |
| `src/modules/anime/index.ts` | `pnpm test src/test/unit/modules/anime/` | All dealNEPResult tests pass |
| Multiple files / unsure | `pnpm test:run` | ALL tests pass |

**BEFORE committing ANY code:**
```bash
pnpm test:run && pnpm run build
```

### Adding New Features

When adding new features, you MUST:

1. **Identify affected modules** - Determine which existing code your feature touches
2. **Create/update test files** - Add tests for new functionality BEFORE implementation (TDD)
3. **Run tests after each change** - Verify tests pass incrementally
4. **Update TESTING_GUIDE.md** - Document new test files and patterns

### Modifying Existing Code

When modifying existing code:

1. **Read existing tests first** - Understand current behavior
2. **Run tests BEFORE changes** - Establish baseline (tests should pass)
3. **Update tests if behavior changes** - Modify tests to reflect new expected behavior
4. **Run tests AFTER changes** - Verify all tests pass

### Never

- NEVER commit code without running `pnpm test:run`
- NEVER ignore failing tests - fix them or update tests intentionally
- NEVER remove tests unless the tested code is completely removed
- NEVER skip tests with `.skip()` permanently - use temporarily for debugging only

## Quick Reference

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test

# Run specific test file
pnpm test src/test/unit/classes/AniEpi.test.ts

# Run tests matching pattern
pnpm test -t "AniSub"

# Build production
pnpm run build

# Development mode
pnpm run dev
```

## File Locations

| Type | Location |
|------|----------|
| Source code | `src/` |
| Unit tests | `src/test/unit/` |
| Test setup | `src/test/setup.ts` |
| Vitest config | `vitest.config.ts` |
| TypeScript config | `tsconfig.json` |
| Build config | `tsup.config.ts` |

## Path Aliases

- `#root/*` → `./src/*`
- `@/*` → `./src/*`
