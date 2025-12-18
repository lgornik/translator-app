export const typeDefs = `#graphql
  enum TranslationMode {
    EN_TO_PL
    PL_TO_EN
  }

  type WordChallenge {
    id: ID!
    wordToTranslate: String!
    mode: TranslationMode!
    category: String
    difficulty: Int
  }

  type TranslationResult {
    isCorrect: Boolean!
    correctTranslation: String!
    userTranslation: String!
  }

  type DictionaryWord {
    id: ID!
    polish: String!
    english: String!
    category: String!
    difficulty: Int!
  }

  type WordCount {
    count: Int!
  }

  type Query {
    getRandomWord(mode: TranslationMode!, category: String, difficulty: Int): WordChallenge!
    getAllWords: [DictionaryWord!]!
    getCategories: [String!]!
    getDifficulties: [Int!]!
    getWordCount(category: String, difficulty: Int): WordCount!
  }

  type Mutation {
    checkTranslation(
      wordId: ID!
      userTranslation: String!
      mode: TranslationMode!
    ): TranslationResult!
    resetSession: Boolean!
  }
`;