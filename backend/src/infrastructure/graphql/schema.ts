export const typeDefs = `#graphql
  """
  Direction of translation
  """
  enum TranslationMode {
    EN_TO_PL
    PL_TO_EN
  }

  """
  Difficulty level (1=Easy, 2=Medium, 3=Hard)
  """
  enum Difficulty {
    EASY
    MEDIUM
    HARD
  }

  """
  A word challenge for the user to translate
  NOTE: correctTranslation is NOT exposed here for security
  """
  type WordChallenge {
    "Unique identifier"
    id: ID!
    "The word to be translated"
    wordToTranslate: String!
    "Translation direction"
    mode: TranslationMode!
    "Word category"
    category: String!
    "Difficulty level (1-3)"
    difficulty: Int!
  }

  """
  Result of checking a translation
  """
  type TranslationResult {
    "Whether the translation was correct"
    isCorrect: Boolean!
    "The correct translation (revealed after checking)"
    correctTranslation: String!
    "What the user submitted"
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
    uptime: Float!
  }

  """
  Health check response
  """
  type HealthCheck {
    status: String!
    timestamp: String!
    uptime: Float!
    sessionCount: Int!
    wordCount: Int!
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
    Health check endpoint
    """
    health: HealthCheck!

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