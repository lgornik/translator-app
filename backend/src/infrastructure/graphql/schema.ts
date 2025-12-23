export const typeDefs = `#graphql
  """
  Direction of translation
  """
  enum TranslationMode {
    EN_TO_PL
    PL_TO_EN
  }

  """
  Difficulty level
  """
  enum Difficulty {
    EASY
    MEDIUM
    HARD
  }

  """
  A word challenge for the user to translate
  """
  type WordChallenge {
    id: ID!
    wordToTranslate: String!
    correctTranslation: String!
    mode: TranslationMode!
    category: String!
    difficulty: Int!
  }

  """
  Result of checking a translation
  """
  type TranslationResult {
    isCorrect: Boolean!
    correctTranslation: String!
    userTranslation: String!
  }

  """
  Dictionary word with all translations
  """
  type DictionaryWord {
    id: ID!
    polish: String!
    english: String!
    category: String!
    difficulty: Int!
  }

  """
  Word count response
  """
  type WordCount {
    count: Int!
  }

  """
  API information
  """
  type ApiInfo {
    name: String!
    version: String!
    status: String!
  }

  # ============================================================================
  # Queries
  # ============================================================================

  type Query {
    """
    Get API information
    """
    info: ApiInfo!

    """
    Get a random word for translation with optional filters
    """
    getRandomWord(
      mode: TranslationMode!
      category: String
      difficulty: Int
    ): WordChallenge!

    """
    Get all words in the dictionary
    """
    getAllWords: [DictionaryWord!]!

    """
    Get all available categories
    """
    getCategories: [String!]!

    """
    Get all available difficulty levels
    """
    getDifficulties: [Int!]!

    """
    Get count of words matching filters
    """
    getWordCount(
      category: String
      difficulty: Int
    ): WordCount!
  }

  # ============================================================================
  # Mutations
  # ============================================================================

  type Mutation {
    """
    Check if a translation is correct
    """
    checkTranslation(
      wordId: ID!
      userTranslation: String!
      mode: TranslationMode!
    ): TranslationResult!

    """
    Reset the current session (clear used words)
    """
    resetSession: Boolean!
  }
`;
