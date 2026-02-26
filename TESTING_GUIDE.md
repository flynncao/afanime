# Unit Testing Guide

This guide provides comprehensive documentation for the unit testing infrastructure in afanime. Use this when adding new features, modifying existing code, or extending the test suite.

---

## Quick Reference

| When to... | Run this command |
|------------|------------------|
| After changing utility functions | `pnpm test src/test/unit/utils/` |
| After modifying AniSub/AniEpi classes | `pnpm test src/test/unit/classes/` |
| After changing bot thread logic | `pnpm test src/test/unit/bot/` |
| After modifying NEP result processing | `pnpm test src/test/unit/modules/anime/` |
| Before committing any changes | `pnpm test:run` |

---

## Test Module Documentation

### 1. utils/string.test.ts

**Location**: `src/test/unit/utils/string.test.ts`

**Tests**: Pure utility functions for string manipulation

#### What's Tested

| Function | Purpose | Test Cases |
|----------|---------|------------|
| `extractEpisodeNumber()` | Extract episode numbers from subtitle filenames | Standard format (01), v2 suffix (01v2), END suffix (12END), combined (01v2END), invalid (no number) |
| `normalizedAnimeTitle()` | Normalize anime titles for comparison | Spaces, fullwidth brackets, punctuation, Japanese characters, special symbols |

#### Key Implementation Notes

- `extractEpisodeNumber()` requires **2-digit numbers** (`\d{2}`) - single digits return `NaN`
- `normalizedAnimeTitle()` regex range `.。-（` removes Japanese characters (unintended side effect)
- ASCII hyphen `-` is **NOT** removed (different character from range)

#### When to Update

Update these tests when:

1. **Adding new filename format support**
   ```typescript
   it('should extract episode number from NEW_FORMAT', () => {
     expect(extractEpisodeNumber('[NewGroup] Anime - 01 [1080p]')).toBe(1)
   })
   ```

2. **Fixing regex behavior** - Document what characters should/shouldn't be removed

3. **Adding new normalization rules** - Add tests for new character patterns

#### Example: Adding a New Test

```typescript
// If you add support for "EP01" format
it('should extract episode number from EP prefix format', () => {
  expect(extractEpisodeNumber('[SubGroup] Anime EP01 [1080p]')).toBe(1)
})
```

---

### 2. classes/AniEpi.test.ts

**Location**: `src/test/unit/classes/AniEpi.test.ts`

**Tests**: `AniEpi` class - represents a single anime episode

#### What's Tested

| Method | Purpose | Expected Behavior |
|--------|---------|-------------------|
| `isAllInfoValid()` | Complete episode validation | Returns truthy only if ALL checks pass |
| `isValidTitle()` | Title matches anime name | Checks against `name_phantom` or `name_cn` |
| `isValidEpisode()` | Episode exists in database | Returns episode name (truthy) or `undefined` |
| `isValidNum()` | Episode number in valid range | `true` if within eps to eps+total_episodes |
| `isValidLink()` | Link is non-empty | `true` if link is not null/empty string |
| `getTitle()` | Get episode title | Returns the title string |

#### Mock Setup

Tests use a mocked `AniSub` parent with:
- 12 episodes (indices 0-11)
- `eps: 1` (starts from episode 1)
- `name_cn: 'Test Anime'`
- `name_phantom: 'Test|Anime'`

#### When to Update

Update these tests when:

1. **Adding new validation rules**
   ```typescript
   it('should return false for blacklisted translator', () => {
     // Already tested - add new blacklist patterns if needed
   })
   ```

2. **Changing episode number logic** - Update range validation tests

3. **Modifying phantom name matching** - Update title validation tests

4. **Adding new fields to AniEpi** - Add tests for new field validation

#### Example: Testing New Field

```typescript
// If you add a 'quality' field
describe('isValidQuality', () => {
  it('should return true for valid quality', () => {
    const aniEpi = new AniEpi({
      num: 1,
      title: '[SubGroup] Anime - 01',
      link: 'https://example.com',
      quality: '1080p',
    }, aniSub)
    expect((aniEpi as any).isValidQuality()).toBe(true)
  })
})
```

---

### 3. classes/AniSub.test.ts

**Location**: `src/test/unit/classes/AniSub.test.ts`

**Tests**: `AniSub` class - represents an anime subscription/series

#### What's Tested

| Method | Purpose | Test Cases |
|--------|---------|------------|
| `getAnimeInstance()` | Get underlying anime object | Returns the IAnime instance |
| `getPushList()` | Get pending episodes to push | Returns array of episodes |
| `addToPushList()` | Add episode to push queue | New items, updates existing items |
| `emptyPushList()` | Clear push queue | List becomes empty |
| `isPushListConsistent()` | Validate all items have links | `true` if all links valid |
| `isValidDBEpisodeIndex()` | Check array bounds | `true` if 0 <= index < length |
| `isValidBroadEpisodeNum()` | Check episode in broadcast range | `true` if eps <= num <= eps+total-1 |

#### Key Concepts

- **pushList**: Queue of episodes ready to send to Telegram
- **maxInNEP**: Highest episode number found in NEP repository
- **maxInBangumi**: Highest episode number from Bangumi metadata
- **pushedMaxNum**: Highest episode number already pushed

#### When to Update

Update these tests when:

1. **Adding new fields to AniSub** - Add constructor and getter tests

2. **Changing episode matching logic** - Update `isValidBroadEpisodeNum` tests

3. **Modifying push list behavior** - Update `addToPushList`, `isPushListConsistent` tests

4. **Adding new validation methods** - Create new describe block

#### Example: Testing New Method

```typescript
// If you add a 'getUnpushedEpisodes' method
describe('getUnpushedEpisodes', () => {
  it('should return episodes that haven\'t been pushed', () => {
    const anime = createMockAnime({ current_episode: 2 })
    const aniSub = new AniSub(anime)
    const unpushed = aniSub.getUnpushedEpisodes()
    expect(unpushed.length).toBeGreaterThan(0)
  })
})
```

---

### 4. bot/thread.test.ts

**Location**: `src/test/unit/bot/thread.test.ts`

**Tests**: `ATRelation` class - maps anime IDs to Telegram thread IDs

#### What's Tested

| Method | Purpose | Test Cases |
|--------|---------|------------|
| `getInstance()` | Singleton pattern | Same instance returned always |
| `insertOne()` | Add anime-thread mapping | Single, multiple inserts |
| `updateTitle()` | Update anime title | Existing ID, non-existent ID |
| `getAnimeIDFromThreadID()` | Lookup anime by thread | Valid thread, invalid thread |
| `getAnimeTitleFromThreadID()` | Get title by thread | Valid thread, invalid thread |
| `getThreadIDAndTitleFromID()` | Get full info by anime ID | Valid ID, invalid ID |
| `initRelations()` | Load from database | Success, empty result, error |

#### Singleton Pattern

```typescript
const relation1 = ATRelation.getInstance()
const relation2 = ATRelation.getInstance()
expect(relation1).toBe(relation2) // Same instance
```

#### When to Update

Update these tests when:

1. **Adding new relation fields** (e.g., `groupId`, `userId`)
   ```typescript
   relation.insertOne(1, 100, 'Anime', 999) // Added groupId
   ```

2. **Adding new lookup methods** - Add tests for new query patterns

3. **Changing initialization logic** - Update `initRelations` tests

4. **Adding persistence** - Add tests for save/load operations

#### Example: Testing New Field

```typescript
// If you add 'groupId' field
describe('insertOne with groupId', () => {
  it('should store groupId with relation', () => {
    relation.insertOne(1, 100, 'Anime', 999)
    const result = relation.getThreadIDAndTitleFromID(1)
    expect(result.groupId).toBe(999)
  })
})
```

---

### 5. modules/anime/dealNEPResult.test.ts

**Location**: `src/test/unit/modules/anime/dealNEPResult.test.ts`

**Tests**: NEP (Nyaa Enhanced Protocol) result processing logic

> **Note**: `dealNEPResult` is not exported, so tests simulate its behavior using public APIs.

#### What's Tested

| Feature | Purpose | Return Codes |
|---------|---------|--------------|
| Episode matching | Match NEP titles to episodes | N/A |
| maxInNEP update | Track highest found episode | N/A |
| Push list generation | Queue new episodes | N/A |
| Consistency check | Validate push list | N/A |
| Return code 1 | No update needed | `current_episode === maxInNEP` |
| Return code 2 | Incomplete push list | Push list has missing links |
| Return code 3 | Update available | Push list consistent with new episodes |

#### Return Code Logic

```
0 = Error (exception thrown)
1 = No need update (current == maxInNEP)
2 = Not complete (push list inconsistent)
3 = Update available (push list consistent)
```

#### When to Update

Update these tests when:

1. **Changing episode matching algorithm** - Update matching tests

2. **Adding new return codes** - Add tests for new code conditions

3. **Modifying maxInNEP logic** - Update maxInNEP update tests

4. **Changing push list generation** - Update push list tests

#### Example: Testing New Return Code

```typescript
// If you add return code 4 for "partial update"
it('should return 4 for partial update', () => {
  // Setup partial update scenario
  expect(dealtCode).toBe(4)
})
```

---

## Test Setup & Mocks

### Global Mocks (`src/test/setup.ts`)

The following modules are automatically mocked for all tests:

| Module | Mocked Export | Behavior |
|--------|---------------|----------|
| `#root/api/bangumi.js` | `fetchBangumiSubjectInfoFromID` | `vi.fn()` - returns undefined |
| `#root/api/realsearch.js` | `useFetchNEP` | `vi.fn()` - returns undefined |
| `#root/utils/logger.js` | All methods | `vi.fn()` - suppresses output |
| `#root/config/index.js` | `config` | Returns `{ translatorBlacklist: ['BadSub'] }` |
| `grammy` | `Bot`, `Context` | Mocked Bot instance with stub methods |

### Adding Custom Mocks

For specific test files, add local mocks:

```typescript
// At top of your test file (before imports)
vi.mock('#root/api/bangumi.js', () => ({
  fetchBangumiSubjectInfoFromID: vi.fn().mockResolvedValue({ data: 'mock' }),
}))
```

---

## Common Patterns

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should do something', () => {
  // Arrange - setup data
  const anime = createMockAnime({ current_episode: 5 })
  const aniSub = new AniSub(anime)

  // Act - call the method
  const result = aniSub.isValidBroadEpisodeNum(6)

  // Assert - verify result
  expect(result).toBe(true)
})
```

### Testing Private Methods

```typescript
// Cast to 'any' to access private methods
expect((aniEpi as any).isValidTitle()).toBe(true)
```

### Mocking Return Values

```typescript
// For a single test
vi.mocked(fetchBangumiSubjectInfoFromID).mockResolvedValue({
  name_cn: 'Test Anime',
})

// For multiple calls
vi.mocked(useFetchNEP)
  .mockResolvedValueOnce({ data: [] }) // First call
  .mockResolvedValueOnce({ data: [{ text: 'Ep1', link: 'url' }] }) // Second call
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
pnpm test

# Run all tests once
pnpm test:run

# Run tests matching pattern
pnpm test -t "AniSub"

# Run specific test file
pnpm test src/test/unit/classes/AniEpi.test.ts

# Run tests in a directory
pnpm test src/test/unit/utils/

# Open Vitest UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Filtering Tests

```bash
# Run tests with "valid" in the name
pnpm test -t "valid"

# Run tests with "isAllInfoValid" in the name
pnpm test -t "isAllInfoValid"

# Run tests excluding certain pattern
pnpm test --exclude="**/AniEpi/**"
```

---

## Adding New Test Files

### 1. Create Test File

```typescript
// src/test/unit/YOUR_MODULE/yourFeature.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { YourClass } from '#root/your/module.js'

describe('YourClass', () => {
  let instance: YourClass

  beforeEach(() => {
    instance = new YourClass()
  })

  describe('yourMethod', () => {
    it('should do expected behavior', () => {
      const result = instance.yourMethod()
      expect(result).toBe(expectedValue)
    })
  })
})
```

### 2. Add to Documentation

Update this guide with:
- Module name and location
- What's being tested
- When to update tests
- Example test cases

### 3. Run Tests

```bash
pnpm test src/test/unit/YOUR_MODULE/
```

---

## Troubleshooting

### Test Fails After Code Change

1. **Check if behavior intentionally changed** - Update test to match new behavior
2. **Check if test reveals bug** - Fix the code, keep the test
3. **Check mocks** - Ensure mocks still match function signatures

### "Cannot find module" Error

Ensure path aliases are correct:
```typescript
import { something } from '#root/your/module.js' // Note: .js extension
```

### Tests Hang or Timeout

1. Check for unclosed resources
2. Ensure async operations complete
3. Increase timeout if needed:
   ```typescript
   it('long test', async () => {
     // ...
   }, 10000) // 10 second timeout
   ```

---

## Checklist for New Features

When adding a new feature:

- [ ] Identify which module the feature belongs to
- [ ] Create/update test file in appropriate directory
- [ ] Write tests for happy path
- [ ] Write tests for edge cases
- [ ] Write tests for error conditions
- [ ] Run tests locally (`pnpm test:run`)
- [ ] Update this documentation
- [ ] Add test script to CI/CD if needed

---

## Checklist for Code Changes

When modifying existing code:

- [ ] Identify affected test files
- [ ] Run related tests (`pnpm test path/to/tests`)
- [ ] Update tests if behavior changed intentionally
- [ ] Add regression tests for bug fixes
- [ ] Verify all tests pass (`pnpm test:run`)
