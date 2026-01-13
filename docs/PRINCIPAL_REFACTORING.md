# 🎯 Principal-Level Refactoring Roadmap

## Stworzone pliki (gotowe do użycia)

```
backend/src/
├── shared/core/
│   ├── DomainEvent.ts      # ✅ Domain Events + Event types
│   └── AggregateRoot.ts    # ✅ Base class for event-emitting entities
├── domain/entities/
│   └── SessionV2.ts        # ✅ Rich Session with events & invariants
├── application/decorators/
│   └── UseCaseDecorators.ts # ✅ Logging, Metrics, Retry, Circuit Breaker
├── infrastructure/
│   ├── events/
│   │   └── EventBus.ts     # ✅ In-memory event bus + handlers
│   ├── resilience/
│   │   └── index.ts        # ✅ Timeout, Retry, Bulkhead, Circuit Breaker
│   └── di/
│       └── registrationV2.ts # ✅ New wiring with decorators
```

---

## 📋 Co teraz zrobić (w kolejności)

### Krok 1: Zamień Session na SessionV2 (2-3h)

```bash
# 1. Zaktualizuj importy
mv backend/src/domain/entities/Session.ts backend/src/domain/entities/Session.old.ts
mv backend/src/domain/entities/SessionV2.ts backend/src/domain/entities/Session.ts

# 2. Napraw błędy kompilacji (głównie: dodaj version do SessionData)

# 3. Uruchom testy
npm run test --workspace=backend
```

**Zmiany w kodzie:**

- `SessionData` teraz ma `version: number`
- `markWordAsUsed()` zwraca `Result` zamiast `void`
- Session emituje eventy (na razie ignorowane)

### Krok 2: Usuń logger z Use Cases (1-2h)

Dla każdego Use Case:

```typescript
// PRZED
export class CheckTranslationUseCase {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly translationChecker: TranslationChecker,
    private readonly logger: ILogger, // ❌ Usuń
  ) {}
}

// PO
export class CheckTranslationUseCase {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly translationChecker: TranslationChecker,
  ) {}
}
```

Logging dodawany przez decorator w `registrationV2.ts`.

### Krok 3: Podłącz Event Bus (1h)

```typescript
// W Use Case
constructor(
  // ... dependencies
  private readonly eventBus: IEventBus,
) {}

async execute(input) {
  // ... business logic ...

  // Na końcu:
  await this.eventBus.publish(session.domainEvents);
  session.clearDomainEvents();
}
```

### Krok 4: Zamień registration.ts na registrationV2.ts (30min)

```typescript
// index.ts
import { registerDependenciesV2 } from "./infrastructure/di/registrationV2.js";

// zamiast registerDependencies
```

### Krok 5: Dodaj endpoint /metrics i /health (1h)

```typescript
// server.ts
app.get("/metrics", (req, res) => {
  const { getMetrics } = container.resolve("ManagementFunctions");
  res.json(getMetrics());
});

app.get("/admin/events", (req, res) => {
  const { getEventLog } = container.resolve("ManagementFunctions");
  res.json(getEventLog());
});
```

---

## 🧪 Jak testować

### Test Domain Events

```typescript
describe("Session Aggregate", () => {
  it("should emit WordUsedEvent when word is marked as used", () => {
    const session = Session.create(SessionId.fromTrusted("test-session"));

    session.markWordAsUsed(WordId.fromTrusted("word-1"));

    expect(session.domainEvents).toHaveLength(2); // Created + WordUsed
    expect(session.domainEvents[1].eventType).toBe("session.word_used");
  });
});
```

### Test Decorators

```typescript
describe("withLogging decorator", () => {
  it("should log execution without changing result", async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const baseUseCase = {
      execute: vi.fn().mockResolvedValue(Result.ok("test")),
    };

    const decorated = withLogging(baseUseCase, mockLogger, "TestUseCase");

    await decorated.execute({});

    expect(mockLogger.info).toHaveBeenCalled();
    expect(baseUseCase.execute).toHaveBeenCalled();
  });
});
```

---

## 📊 Przed/Po porównanie

| Aspekt             | Przed             | Po                         |
| ------------------ | ----------------- | -------------------------- |
| Logging            | W każdym Use Case | Decorator                  |
| Metrics            | Brak              | Decorator                  |
| Retry              | Brak              | Decorator                  |
| Circuit Breaker    | Brak              | Decorator                  |
| Domain Events      | Brak              | Aggregate emituje          |
| Session invariants | Brak              | W Session.markWordAsUsed() |
| Audit trail        | Brak              | AuditLogEventHandler       |

---

## 🎓 Czego to uczy zespół?

1. **Separation of Concerns** - biznes logic ≠ infrastructure
2. **Decorator Pattern** - rozszerzanie bez modyfikacji
3. **Event-Driven** - loose coupling przez eventy
4. **Resilience** - "co gdy coś się zepsuje?"
5. **DDD tactical patterns** - Aggregates, Domain Events, Value Objects

---

## ⏭️ Następne kroki (po tych 5)

1. **Event Store** - persystencja eventów (Event Sourcing ready)
2. **CQRS** - osobne modele do odczytu i zapisu
3. **Distributed tracing** - OpenTelemetry
4. **Feature flags** - gradual rollout
5. **Chaos engineering** - kontrolowane awarie w testach

---

## 💡 Pro tip

Nie rób wszystkiego naraz. Każdy z 5 kroków powinien być **osobnym PR-em** z code review. To też pokazuje principal-level thinking: **incremental improvement > big bang**.
