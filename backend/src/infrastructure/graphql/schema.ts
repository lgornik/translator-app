export const typeDefs = `#graphql
  # ============================================================================
  # Enums
  # ============================================================================

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

  # ============================================================================
  # Error Types (Union Type Pattern)
  # ============================================================================

  """
  Base interface for all errors
  """
  interface Error {
    code: String!
    message: String!
  }

  """
  Validation error - invalid input data
  """
  type ValidationError implements Error {
    code: String!
    message: String!
    field: String
  }

  """
  Resource not found error
  """
  type NotFoundError implements Error {
    code: String!
    message: String!
    resourceType: String!
  }

  """
  Rate limit exceeded error
  """
  type RateLimitError implements Error {
    code: String!
    message: String!
    retryAfter: Int!
  }

  """
  Session related error
  """
  type SessionError implements Error {
    code: String!
    message: String!
  }

  # ============================================================================
  # Domain Types
  # ============================================================================

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
  List of word challenges (for batch loading)
  """
  type WordChallengeList {
    words: [WordChallenge!]!
    count: Int!
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
  Session reset success response
  """
  type ResetSessionSuccess {
    success: Boolean!
    message: String!
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
  # Union Types (Principal Pattern: Type-safe error handling)
  # ============================================================================

  """
  Result of getRandomWord query - either a word or an error
  """
  union GetRandomWordResult = WordChallenge | NotFoundError | ValidationError | RateLimitError | SessionError

  """
  Result of getRandomWords query - either a list or an error
  """
  union GetRandomWordsResult = WordChallengeList | NotFoundError | ValidationError | RateLimitError | SessionError

  """
  Result of checkTranslation mutation - either result or an error
  """
  union CheckTranslationResult = TranslationResult | NotFoundError | ValidationError | RateLimitError

  """
  Result of resetSession mutation - either success or an error
  """
  union ResetSessionResult = ResetSessionSuccess | SessionError | RateLimitError

  """
  Result of getWordCount query - either count or an error
  """
  union GetWordCountResult = WordCount | ValidationError

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
    Returns union type for type-safe error handling
    """
    getRandomWord(
      mode: TranslationMode!
      category: String
      difficulty: Int
    ): GetRandomWordResult!

    """
    Get multiple random words for translation (for quiz pool)
    Returns up to 'limit' words, may return fewer if not enough available
    """
    getRandomWords(
      mode: TranslationMode!
      limit: Int!
      category: String
      difficulty: Int
    ): GetRandomWordsResult!

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
    ): GetWordCountResult!
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
    ): CheckTranslationResult!

    """
    Reset the current session (clear used words)
    """
    resetSession: ResetSessionResult!
  }
`;
