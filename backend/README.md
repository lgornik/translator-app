# Translator API - Clean Architecture

Backend aplikacji do nauki słówek, zbudowany zgodnie z zasadami **Clean Architecture** i **Domain-Driven Design**.

## 🏗️ Architektura

```
src/
├── domain/                 # Warstwa domenowa (czysta logika biznesowa)
│   ├── entities/           # Encje (Word, Session)
│   ├── value-objects/      # Value Objects (Difficulty, TranslationMode, etc.)
│   ├── repositories/       # Interfejsy repozytoriów (porty)
│   └── services/           # Serwisy domenowe (TranslationChecker, RandomWordPicker)
│
├── application/            # Warstwa aplikacji (use cases)
│   ├── use-cases/          # Use Cases (GetRandomWord, CheckTranslation, etc.)
│   ├── interfaces/         # Porty aplikacji (ILogger, IUseCase)
│   └── dtos/               # Data Transfer Objects
│
├── infrastructure/         # Warstwa infrastruktury (implementacje)
│   ├── persistence/        # Implementacje repozytoriów (InMemory, Redis, DB)
│   ├── graphql/            # GraphQL schema, resolvers, context
│   ├── http/               # Express server, middleware
│   ├── logging/            # Implementacje loggera
│   ├── config/             # Konfiguracja aplikacji
│   └── data/               # Dane (słownik)
│
├── shared/                 # Współdzielone elementy
│   ├── core/               # Result, Entity, ValueObject
│   └── errors/             # Hierarchia błędów domenowych
│
└── __tests__/              # Testy
    ├── unit/               # Testy jednostkowe
    └── integration/        # Testy integracyjne
```

## 🎯 Zasady projektowe

### Clean Architecture
- **Dependency Rule**: Zależności wskazują tylko do wewnątrz (domain → application → infrastructure)
- **Separation of Concerns**: Każda warstwa ma jasno określoną odpowiedzialność
- **Testability**: Łatwe testowanie dzięki Dependency Injection i interfejsom

### Domain-Driven Design
- **Entities**: Obiekty z tożsamością (Word, Session)
- **Value Objects**: Niezmienne obiekty porównywane przez wartość (Difficulty, TranslationMode)
- **Domain Services**: Logika, która nie pasuje do encji (TranslationChecker)
- **Repositories**: Abstrakcja nad persystencją (IWordRepository, ISessionRepository)

### SOLID
- **Single Responsibility**: Każda klasa ma jedną odpowiedzialność
- **Open/Closed**: Rozszerzalne przez nowe implementacje interfejsów
- **Liskov Substitution**: Implementacje mogą być wymieniane
- **Interface Segregation**: Małe, dedykowane interfejsy
- **Dependency Inversion**: Zależność od abstrakcji, nie konkretnych implementacji

## 📦 Use Cases

| Use Case | Opis |
|----------|------|
| `GetRandomWordUseCase` | Pobiera losowe słowo do tłumaczenia |
| `CheckTranslationUseCase` | Sprawdza poprawność tłumaczenia |
| `GetWordCountUseCase` | Zwraca liczbę słów spełniających filtry |
| `GetCategoriesUseCase` | Zwraca dostępne kategorie |
| `GetDifficultiesUseCase` | Zwraca dostępne poziomy trudności |
| `ResetSessionUseCase` | Resetuje sesję użytkownika |
| `GetAllWordsUseCase` | Zwraca wszystkie słowa |

## 🔧 Result Pattern

Zamiast rzucać wyjątki dla oczekiwanych błędów, używamy `Result<T, E>`:

```typescript
// Zamiast:
function getWord(): Word {
  if (!word) throw new NotFoundError();
  return word;
}

// Używamy:
function getWord(): Result<Word, NotFoundError> {
  if (!word) return Result.fail(new NotFoundError());
  return Result.ok(word);
}

// Użycie:
const result = getWord();
if (result.ok) {
  console.log(result.value);
} else {
  console.log(result.error.message);
}
```

## 🚀 Uruchomienie

```bash
# Instalacja
npm install

# Development
npm run dev

# Testy
npm test
npm run test:coverage

# Build
npm run build
npm start
```

## 📝 API GraphQL

### Queries
```graphql
query {
  getRandomWord(mode: EN_TO_PL, category: "A1", difficulty: 1) {
    id
    wordToTranslate
    category
    difficulty
  }
  
  getWordCount(category: "A1") {
    count
  }
  
  getCategories
  getDifficulties
}
```

### Mutations
```graphql
mutation {
  checkTranslation(wordId: "1", userTranslation: "kot", mode: EN_TO_PL) {
    isCorrect
    correctTranslation
  }
  
  resetSession
}
```

## 🔒 Production Ready Features

- ✅ Structured logging (JSON)
- ✅ Graceful shutdown (SIGTERM/SIGINT)
- ✅ Request ID tracking
- ✅ Health check endpoint
- ✅ Error handling hierarchy
- ✅ Session cleanup
- ✅ Type-safe configuration
- ✅ Unit & Integration tests

## 🔄 Dodawanie nowych funkcji

### Nowy Use Case

1. Utwórz DTO w `application/dtos/`
2. Utwórz Use Case w `application/use-cases/`
3. Dodaj resolver w `infrastructure/graphql/resolvers.ts`
4. Napisz testy

### Nowe repozytorium (np. Redis)

1. Zaimplementuj interfejs `ISessionRepository`
2. Wstrzyknij w `index.ts`
3. Bez zmian w warstwie domenowej!

## 📊 Struktura błędów

```
DomainError (abstract)
├── NotFoundError (404)
├── ValidationError (400)
├── NoWordsAvailableError (404)
├── SessionError (400)
├── InfrastructureError (500)
└── RateLimitError (429)
```
