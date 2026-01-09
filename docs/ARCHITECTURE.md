# Architecture & Recent Changes

## v2.2.0 Changes

### 1. Test Coverage 80%+

Added comprehensive unit tests for:

- All Use Cases (GetRandomWord, GetRandomWords, CheckTranslation, etc.)
- Logger (ConsoleLogger, DevLogger, NullLogger)
- Session entity and mutations
- SessionMutex (InMemory implementation)
- Metrics registry

**Run tests with coverage:**

```bash
npm run test:coverage --workspace=backend
```

### 2. Contract Tests (GraphQL Schema)

Added contract tests to ensure API backward compatibility:

- Schema structure validation
- Type definitions (WordChallenge, TranslationResult, etc.)
- Query and Mutation signatures
- Required vs optional arguments
- Security checks (correctTranslation not exposed)

**Location:** `backend/src/__tests__/contract/graphql-schema.test.ts`

**Run contract tests:**

```bash
npm run test:contract --workspace=backend
```

### 3. Monitoring (Prometheus + Sentry)

**Metrics (`/metrics` endpoint):**

- HTTP request duration histogram
- Request counter by status/method/path
- Active connections gauge
- GraphQL operation metrics
- Business metrics (translations, sessions, words)
- System metrics (uptime, heap size)

**Error Tracking:**

- Sentry-compatible error tracking
- Request context capture
- Breadcrumbs for debugging
- Transaction support for performance

**Configuration:**

```env
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENABLED=true
SENTRY_SAMPLE_RATE=0.1
```

### 4. E2E Tests in CI (Playwright)

Added Playwright E2E tests to CI pipeline:

- Runs after unit tests pass
- Uses Chromium browser
- Uploads reports on failure
- Covers critical user journeys

### 5. Per-User Rate Limiting

Enhanced rate limiting with per-session support:

- Session-based rate limiting (X-Session-Id header)
- Falls back to IP if no session
- Tier support (default/authenticated/premium)
- Different limits per user tier

**Usage:**

```typescript
import {
  createPerUserRateLimiter,
  PerUserRateLimitPresets,
} from "./rateLimiter";

// Use quiz preset
app.use(createPerUserRateLimiter(PerUserRateLimitPresets.quiz, logger));

// Or custom configuration
app.use(
  createPerUserRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    tiers: {
      default: 50,
      authenticated: 200,
      premium: 1000,
    },
    getTier: (req) =>
      req.headers["x-session-id"] ? "authenticated" : "default",
  }),
);
```

---

## Architecture Overview

### Backend Layers

```
┌─────────────────────────────────────────────────────┐
│                    HTTP/GraphQL                      │
│              (Express, Apollo Server)                │
├─────────────────────────────────────────────────────┤
│                  Application Layer                   │
│              (Use Cases, DTOs, Interfaces)           │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│    (Entities, Value Objects, Domain Services)        │
├─────────────────────────────────────────────────────┤
│                Infrastructure Layer                  │
│  (Repositories, DI Container, Redis, PostgreSQL)     │
└─────────────────────────────────────────────────────┘
```

### DI Token Map

```typescript
DI_TOKENS = {
  // Repositories
  WordRepository: Symbol("IWordRepository"),
  SessionRepository: Symbol("ISessionRepository"),

  // Services
  Logger: Symbol("ILogger"),
  TranslationChecker: Symbol("TranslationChecker"),
  RandomWordPicker: Symbol("RandomWordPicker"),
  SessionMutex: Symbol("ISessionMutex"),

  // Use Cases
  GetRandomWordUseCase: Symbol("GetRandomWordUseCase"),
  GetRandomWordsUseCase: Symbol("GetRandomWordsUseCase"),
  CheckTranslationUseCase: Symbol("CheckTranslationUseCase"),
  GetCategoriesUseCase: Symbol("GetCategoriesUseCase"),
  GetDifficultiesUseCase: Symbol("GetDifficultiesUseCase"),
  GetAllWordsUseCase: Symbol("GetAllWordsUseCase"),
  GetWordCountUseCase: Symbol("GetWordCountUseCase"),
  ResetSessionUseCase: Symbol("ResetSessionUseCase"),
};
```

### Session Flow with Mutex

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│ Request │────▶│ Acquire Lock│────▶│ Read/Write  │────▶│ Release  │
└─────────┘     └─────────────┘     │   Session   │     │   Lock   │
                     │              └─────────────┘     └──────────┘
                     │                                       │
                     ▼                                       ▼
              ┌─────────────┐                         ┌──────────┐
              │ Wait/Retry  │                         │ Response │
              └─────────────┘                         └──────────┘
```

---

## Configuration

### Environment Variables

```env
# Server
NODE_ENV=development|production|test
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug|info|warn|error

# Database (optional - uses InMemory if not set)
DATABASE_URL=postgresql://user:password@localhost:5432/translator

# Redis (optional - uses InMemory if not set)
REDIS_URL=redis://localhost:6379

# Session
SESSION_MAX_AGE_HOURS=24
SESSION_MAX_COUNT=10000

# Graceful Shutdown
SHUTDOWN_TIMEOUT_MS=10000
```

### Deployment Configurations

#### Single Instance (Development)

- InMemory word repository
- InMemory session repository
- InMemory mutex

#### Single Instance with Persistence

- PostgreSQL word repository
- PostgreSQL session repository
- InMemory mutex

#### Multi-Instance (Production)

- PostgreSQL word repository with cache
- Redis session repository
- Redis mutex

---

## Testing

### Unit Tests

```bash
npm run test --workspace=backend
npm run test --workspace=frontend
```

### E2E Tests

```bash
npm run test:e2e
```

### With Coverage

```bash
npm run test:coverage --workspace=backend
```

---

## Git Hooks (Husky)

### Pre-commit

Runs automatically on `git commit`:

1. ESLint with auto-fix on staged `.ts/.tsx` files
2. Prettier formatting on all staged files

### Setup

```bash
npm run prepare  # Installs husky hooks
```

### Skip hooks (emergency only)

```bash
git commit --no-verify -m "message"
```
