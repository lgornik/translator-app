# 🌍 Translator - Aplikacja do nauki słówek

Prosta, ale rozszerzalna aplikacja do nauki tłumaczeń polsko-angielskich.

## 🚀 Szybki start

### Opcja 1: Docker (zalecane)

```bash
# Uruchom całą aplikację
docker-compose up --build

# Otwórz w przeglądarce:
# Frontend: http://localhost:3000
# GraphQL Playground: http://localhost:4000/graphql
```

### Opcja 2: Uruchom lokalnie (development)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 📁 Struktura projektu

```
translator-app/
├── backend/                 # Node.js + GraphQL API
│   ├── src/
│   │   ├── graphql/        # Schema i Resolvers
│   │   ├── services/       # Logika biznesowa
│   │   ├── data/           # Dane słownika (łatwe do zamiany na DB)
│   │   └── index.js        # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React + Apollo Client
│   ├── src/
│   │   ├── components/     # Komponenty React (do rozbudowy)
│   │   ├── hooks/          # Custom hooks
│   │   ├── graphql/        # Queries i Mutations
│   │   ├── styles/         # CSS
│   │   └── App.jsx         # Główny komponent
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # Orkiestracja kontenerów
└── README.md
```

## 🔌 API GraphQL

### Queries

```graphql
# Pobierz losowe słowo do tłumaczenia
query GetRandomWord($mode: TranslationMode!) {
  getRandomWord(mode: $mode) {
    id
    wordToTranslate
    mode
    category
    difficulty
  }
}

# Pobierz wszystkie słowa
query GetAllWords {
  getAllWords {
    id
    polish
    english
    category
  }
}

# Pobierz kategorie
query GetCategories {
  getCategories
}
```

### Mutations

```graphql
# Sprawdź tłumaczenie
mutation CheckTranslation($wordId: ID!, $userTranslation: String!, $mode: TranslationMode!) {
  checkTranslation(wordId: $wordId, userTranslation: $userTranslation, mode: $mode) {
    isCorrect
    correctTranslation
    userTranslation
  }
}

# Reset sesji
mutation ResetSession {
  resetSession
}
```

### Tryby tłumaczenia

- `EN_TO_PL` - z angielskiego na polski
- `PL_TO_EN` - z polskiego na angielski

## 🛠 Technologie

| Warstwa | Technologia |
|---------|------------|
| Frontend | React 18, Apollo Client, Vite |
| Backend | Node.js, Express, Apollo Server |
| API | GraphQL |
| Konteneryzacja | Docker, Docker Compose |

## 📱 Użycie z aplikacji mobilnej

API jest gotowe do użycia z aplikacji mobilnej. Przykład w React Native:

```javascript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://YOUR_SERVER:4000/graphql',
  cache: new InMemoryCache(),
});

// Pobierz słowo
const { data } = await client.query({
  query: gql`
    query GetRandomWord($mode: TranslationMode!) {
      getRandomWord(mode: $mode) {
        id
        wordToTranslate
      }
    }
  `,
  variables: { mode: 'EN_TO_PL' },
});
```

## 🗺 Roadmap - plan rozbudowy

### Faza 2: Baza danych
- [ ] Dodać PostgreSQL / MongoDB
- [ ] Migracje schematu
- [ ] Więcej słówek

### Faza 3: Użytkownicy
- [ ] Rejestracja / logowanie
- [ ] Śledzenie postępów
- [ ] Własne listy słówek

### Faza 4: Zaawansowane funkcje
- [ ] Spaced Repetition (algorytm powtórek)
- [ ] Tryby nauki (fiszki, quiz, gry)
- [ ] Leaderboard / gamifikacja
- [ ] Import/export słówek

### Faza 5: Skalowanie
- [ ] Kubernetes deployment
- [ ] Mikroserwisy (jeśli potrzebne)
- [ ] CI/CD pipeline

## 🐳 Kubernetes (przyszłość)

Struktura jest przygotowana pod K8s. Przykładowy deployment:

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: translator-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: translator-backend
  template:
    metadata:
      labels:
        app: translator-backend
    spec:
      containers:
      - name: backend
        image: translator-backend:latest
        ports:
        - containerPort: 4000
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
```

## 📝 Dodawanie słówek

Edytuj plik `backend/src/data/dictionary.js`:

```javascript
{ id: "31", polish: "nowe_słowo", english: "new_word", category: "basics", difficulty: 1 },
```

W przyszłości: panel admina lub import z pliku CSV.

## 🤝 Rozwój

```bash
# Backend w trybie watch
cd backend && npm run dev

# Frontend z hot reload
cd frontend && npm run dev
```

## 📄 Licencja

MIT
