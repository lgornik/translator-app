# Translator App

A modern, type-safe vocabulary learning application built with React, GraphQL, and XState.

## 🏗️ Architecture

This project follows a **clean architecture** approach with clear separation of concerns:

```
translator-app/
├── backend/                    # Node.js + Apollo Server
│   └── src/
│       ├── config/            # Environment & app configuration
│       ├── domain/            # Business logic (DDD)
│       │   ├── entities/      # Domain entities with validation
│       │   ├── repositories/  # Data access interfaces
│       │   └── services/      # Business logic services
│       ├── infrastructure/    # External concerns
│       │   ├── graphql/       # GraphQL schema & resolvers
│       │   ├── data/          # Data sources
│       │   └── middleware/    # Express middleware
│       └── shared/            # Shared utilities
│           ├── constants/     # Application constants
│           └── errors/        # Custom error classes
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── app/               # App setup & routing
│       │   ├── providers/     # Context providers
│       │   └── Router.tsx     # Application routing
│       ├── features/          # Feature-based modules
│       │   └── quiz/          # Quiz feature
│       │       ├── components/
│       │       ├── hooks/
│       │       ├── machines/  # XState machines
│       │       └── pages/
│       ├── shared/            # Shared code
│       │   ├── api/           # GraphQL operations
│       │   ├── components/    # Reusable UI components
│       │   ├── constants/     # Frontend constants
│       │   ├── hooks/         # Custom hooks
│       │   ├── types/         # TypeScript types
│       │   └── utils/         # Utility functions
│       └── styles/            # Global styles
│
└── shared/                     # Shared types (backend & frontend)
    └── types/
```

## 🚀 Features

- **Quiz Modes**
  - Standard quiz with word limit
  - Timed mode
  - Reinforcement mode (repeat incorrect answers)
  
- **Filtering**
  - By category (Animals, Food, Colors, etc.)
  - By difficulty (Easy, Medium, Hard)
  
- **Translation Directions**
  - English → Polish
  - Polish → English

## 🛠️ Tech Stack

### Backend
- **TypeScript** - Type safety
- **Apollo Server** - GraphQL server
- **Express** - HTTP server
- **Zod** - Runtime validation
- **Rate Limiting** - API protection against abuse

### Frontend
- **TypeScript** - Type safety
- **React 19** - UI library
- **Vite** - Build tool
- **Apollo Client** - GraphQL client
- **XState** - State management
- **React Router** - Navigation

## 📦 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd translator-app

# Install dependencies
npm install

# Start development servers
npm run dev
```

This will start:
- Backend: http://localhost:4000
- Frontend: http://localhost:3000
- GraphQL Playground: http://localhost:4000/graphql

### Individual Commands

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Build all
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🧪 Testing

Tests are written with **Vitest** and follow the testing pyramid:

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

### Test Structure

- **Unit tests** - Pure functions, entities, services
- **Integration tests** - Service interactions
- **State machine tests** - XState machine transitions

## 🏛️ Design Patterns

### Domain-Driven Design (Backend)
- **Entities** - `Word` with business logic
- **Repositories** - Data access abstraction
- **Services** - Business logic orchestration

### Feature-Sliced Design (Frontend)
- Features are self-contained modules
- Shared code is reusable across features
- Clear dependency direction

### State Machine (Frontend)
XState is used for predictable state management:
- All states and transitions are explicit
- Easy to test and debug
- Visualizable with XState Viz

## 📝 API

### GraphQL Queries

```graphql
# Get random word for translation
query GetRandomWord($mode: TranslationMode!, $category: String, $difficulty: Int) {
  getRandomWord(mode: $mode, category: $category, difficulty: $difficulty) {
    id
    wordToTranslate
    correctTranslation
    mode
    category
    difficulty
  }
}

# Get available categories
query GetCategories {
  getCategories
}

# Get word count
query GetWordCount($category: String, $difficulty: Int) {
  getWordCount(category: $category, difficulty: $difficulty) {
    count
  }
}
```

### GraphQL Mutations

```graphql
# Check translation
mutation CheckTranslation($wordId: ID!, $userTranslation: String!, $mode: TranslationMode!) {
  checkTranslation(wordId: $wordId, userTranslation: $userTranslation, mode: $mode) {
    isCorrect
    correctTranslation
    userTranslation
  }
}

# Reset session
mutation ResetSession {
  resetSession
}
```

## 🔮 Future Roadmap

The architecture is prepared for future enhancements:

### Planned Features
- [ ] User authentication (login/register)
- [ ] Leaderboard
- [ ] Personal progress tracking
- [ ] Custom word lists
- [ ] Spaced repetition algorithm
- [ ] Multiple language support

### Technical Improvements
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Redis for session management
- [ ] WebSocket for real-time features
- [ ] PWA support
- [ ] E2E tests with Playwright

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details
