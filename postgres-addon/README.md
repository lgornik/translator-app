# PostgreSQL Addon dla Translator App

Ten pakiet zawiera pliki potrzebne do integracji PostgreSQL z Twoją aplikacją.

## Zawartość

```
postgres-addon/
├── backend/
│   ├── src/
│   │   ├── infrastructure/
│   │   │   ├── config/
│   │   │   │   └── Config.ts          # Zaktualizowana konfiguracja z DATABASE_URL
│   │   │   └── persistence/
│   │   │       ├── postgres/
│   │   │       │   ├── schema.ts              # Schemat bazy Drizzle
│   │   │       │   ├── PostgresWordRepository.ts
│   │   │       │   ├── PostgresSessionRepository.ts
│   │   │       │   └── index.ts
│   │   │       └── repositoryFactory.ts       # Factory do tworzenia repozytoriów
│   │   └── index.ts                   # Zaktualizowany entry point
│   ├── drizzle.config.ts              # Konfiguracja Drizzle Kit
│   └── seed.ts                        # Seeder do zasilenia bazy
└── docker-compose.yml                 # Docker Compose z PostgreSQL
```

## Instalacja

### 1. Zainstaluj zależności

```bash
cd backend
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### 2. Skopiuj pliki

Skopiuj zawartość tego pakietu do swojego projektu:

```bash
# Z folderu postgres-addon:
cp -r backend/src/infrastructure/persistence/postgres ../translator-app/backend/src/infrastructure/persistence/
cp backend/src/infrastructure/persistence/repositoryFactory.ts ../translator-app/backend/src/infrastructure/persistence/
cp backend/src/infrastructure/config/Config.ts ../translator-app/backend/src/infrastructure/config/
cp backend/src/index.ts ../translator-app/backend/src/
cp backend/drizzle.config.ts ../translator-app/backend/
cp backend/seed.ts ../translator-app/backend/
cp docker-compose.yml ../translator-app/
```

### 3. Dodaj skrypty do package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx seed.ts"
  }
}
```

### 4. Zaktualizuj .env

```env
# Dodaj do backend/.env
DATABASE_URL=postgresql://app:secret@localhost:5432/translator
```

## Uruchomienie

### Opcja A: Docker Compose (zalecana)

```bash
# Uruchom PostgreSQL + Backend + Frontend
docker-compose up -d

# Zasil bazę danymi
docker-compose exec backend npm run db:seed
```

### Opcja B: Lokalnie

```bash
# 1. Uruchom PostgreSQL (np. przez Docker)
docker run -d \
  --name translator-db \
  -e POSTGRES_DB=translator \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Wypchnij schemat do bazy
cd backend
npm run db:push

# 3. Zasil bazę danymi
npm run db:seed

# 4. Uruchom aplikację
npm run dev
```

## Jak to działa

### Automatyczny wybór repozytorium

Aplikacja automatycznie wybiera implementację repozytorium:

```typescript
// Jeśli DATABASE_URL jest ustawione → PostgreSQL
// Jeśli DATABASE_URL nie jest ustawione → InMemory

const { wordRepository, sessionRepository } = createRepositories(
  config.database.url
);
```

### Migracje

Drizzle Kit pozwala na łatwe zarządzanie schematem:

```bash
# Generuj migracje na podstawie zmian w schema.ts
npm run db:generate

# Zastosuj migracje
npm run db:migrate

# Lub wypchnij schemat bezpośrednio (development)
npm run db:push

# Otwórz Drizzle Studio (GUI do bazy)
npm run db:studio
```

## Struktura bazy danych

```
┌─────────────┐       ┌─────────────┐
│ categories  │       │   words     │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ id (PK)     │
│ name        │       │ polish      │
│ created_at  │       │ english     │
└─────────────┘       │ category_id │
                      │ difficulty  │
                      │ created_at  │
                      └─────────────┘

┌─────────────────┐
│    sessions     │
├─────────────────┤
│ id (PK)         │
│ used_word_ids   │  ← JSON array
│ created_at      │
│ last_accessed_at│
└─────────────────┘
```

## Testowanie

Testy nadal używają InMemory repositories - nie potrzebują bazy danych:

```bash
npm run test
```

Jeśli chcesz testować z prawdziwą bazą:

```bash
DATABASE_URL=postgresql://... npm run test
```

## Troubleshooting

### "Connection refused"
- Sprawdź czy PostgreSQL jest uruchomiony
- Sprawdź czy port 5432 nie jest zajęty
- Sprawdź dane logowania w DATABASE_URL

### "Relation does not exist"
- Uruchom `npm run db:push` aby utworzyć tabele
- Lub `npm run db:migrate` jeśli używasz migracji

### "No data in database"
- Uruchom `npm run db:seed` aby zasilić bazę słowami
