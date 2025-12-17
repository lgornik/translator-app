export const typeDefs = `#graphql
  # Tryb tłumaczenia
  enum TranslationMode {
    EN_TO_PL  # Angielski na Polski
    PL_TO_EN  # Polski na Angielski
  }

  # Słowo do przetłumaczenia
  type WordChallenge {
    id: ID!
    wordToTranslate: String!
    mode: TranslationMode!
    category: String
    difficulty: Int
  }

  # Wynik sprawdzenia tłumaczenia
  type TranslationResult {
    isCorrect: Boolean!
    correctTranslation: String!
    userTranslation: String!
  }

  # Słowo w słowniku (do przyszłego panelu admina)
  type DictionaryWord {
    id: ID!
    polish: String!
    english: String!
    category: String!
    difficulty: Int!
  }

  # Queries - pobieranie danych
  type Query {
    # Pobierz losowe słowo do tłumaczenia
    getRandomWord(mode: TranslationMode!): WordChallenge!
    
    # Pobierz wszystkie słowa (do przyszłego użytku)
    getAllWords: [DictionaryWord!]!
    
    # Pobierz dostępne kategorie
    getCategories: [String!]!
  }

  # Mutations - operacje zmieniające stan
  type Mutation {
    # Sprawdź tłumaczenie użytkownika
    checkTranslation(
      wordId: ID!
      userTranslation: String!
      mode: TranslationMode!
    ): TranslationResult!
    
    # Reset sesji (wyczyść historię użytych słów)
    resetSession: Boolean!
  }
`;
