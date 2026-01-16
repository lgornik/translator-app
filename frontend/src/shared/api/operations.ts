import { gql } from "@apollo/client";

/**
 * GraphQL fragments
 */
export const WORD_CHALLENGE_FRAGMENT = gql`
  fragment WordChallengeFields on WordChallenge {
    id
    wordToTranslate
    mode
    category
    difficulty
  }
`;

export const TRANSLATION_RESULT_FRAGMENT = gql`
  fragment TranslationResultFields on TranslationResult {
    isCorrect
    correctTranslation
    userTranslation
  }
`;

/**
 * Queries
 */
export const GET_RANDOM_WORD = gql`
  ${WORD_CHALLENGE_FRAGMENT}
  query GetRandomWord(
    $mode: TranslationMode!
    $category: String
    $difficulty: Int
  ) {
    getRandomWord(mode: $mode, category: $category, difficulty: $difficulty) {
      __typename
      ... on WordChallenge {
        ...WordChallengeFields
      }
      ... on NotFoundError {
        code
        message
        resourceType
      }
      ... on ValidationError {
        code
        message
      }
      ... on RateLimitError {
        code
        message
        retryAfter
      }
      ... on SessionError {
        code
        message
      }
    }
  }
`;

export const GET_RANDOM_WORDS = gql`
  ${WORD_CHALLENGE_FRAGMENT}
  query GetRandomWords(
    $mode: TranslationMode!
    $limit: Int!
    $category: String
    $difficulty: Int
  ) {
    getRandomWords(
      mode: $mode
      limit: $limit
      category: $category
      difficulty: $difficulty
    ) {
      __typename
      ... on WordChallengeList {
        words {
          ...WordChallengeFields
        }
        count
      }
      ... on NotFoundError {
        code
        message
        resourceType
      }
      ... on ValidationError {
        code
        message
      }
      ... on RateLimitError {
        code
        message
        retryAfter
      }
      ... on SessionError {
        code
        message
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories
  }
`;

export const GET_DIFFICULTIES = gql`
  query GetDifficulties {
    getDifficulties
  }
`;

export const GET_WORD_COUNT = gql`
  query GetWordCount($category: String, $difficulty: Int) {
    getWordCount(category: $category, difficulty: $difficulty) {
      __typename
      ... on WordCount {
        count
      }
      ... on ValidationError {
        code
        message
      }
    }
  }
`;

export const GET_ALL_WORDS = gql`
  query GetAllWords {
    getAllWords {
      id
      polish
      english
      category
      difficulty
    }
  }
`;

/**
 * Mutations
 */
export const CHECK_TRANSLATION = gql`
  ${TRANSLATION_RESULT_FRAGMENT}
  mutation CheckTranslation(
    $wordId: ID!
    $userTranslation: String!
    $mode: TranslationMode!
  ) {
    checkTranslation(
      wordId: $wordId
      userTranslation: $userTranslation
      mode: $mode
    ) {
      __typename
      ... on TranslationResult {
        ...TranslationResultFields
      }
      ... on NotFoundError {
        code
        message
      }
      ... on ValidationError {
        code
        message
      }
      ... on RateLimitError {
        code
        message
        retryAfter
      }
    }
  }
`;

export const RESET_SESSION = gql`
  mutation ResetSession {
    resetSession {
      __typename
      ... on ResetSessionSuccess {
        success
        message
      }
      ... on SessionError {
        code
        message
      }
      ... on RateLimitError {
        code
        message
        retryAfter
      }
    }
  }
`;

/**
 * Type definitions
 */
export interface NotFoundError {
  __typename: "NotFoundError";
  code: string;
  message: string;
  resourceType?: string;
}

export interface ValidationError {
  __typename: "ValidationError";
  code: string;
  message: string;
}

export interface RateLimitError {
  __typename: "RateLimitError";
  code: string;
  message: string;
  retryAfter: number;
}

export interface SessionError {
  __typename: "SessionError";
  code: string;
  message: string;
}

export interface WordChallenge {
  __typename: "WordChallenge";
  id: string;
  wordToTranslate: string;
  mode: "EN_TO_PL" | "PL_TO_EN";
  category: string;
  difficulty: number;
}

export interface WordChallengeList {
  __typename: "WordChallengeList";
  words: Omit<WordChallenge, "__typename">[];
  count: number;
}

export interface TranslationResult {
  __typename: "TranslationResult";
  isCorrect: boolean;
  correctTranslation: string;
  userTranslation: string;
}

export interface ResetSessionSuccess {
  __typename: "ResetSessionSuccess";
  success: boolean;
  message: string;
}

export interface WordCount {
  __typename: "WordCount";
  count: number;
}

// Union types
export type GetRandomWordResult =
  | WordChallenge
  | NotFoundError
  | ValidationError
  | RateLimitError
  | SessionError;

export type GetRandomWordsResult =
  | WordChallengeList
  | NotFoundError
  | ValidationError
  | RateLimitError
  | SessionError;

export type CheckTranslationResult =
  | TranslationResult
  | NotFoundError
  | ValidationError
  | RateLimitError;

export type ResetSessionResult =
  | ResetSessionSuccess
  | SessionError
  | RateLimitError;

export type GetWordCountResult = WordCount | ValidationError;

// Data types
export interface GetRandomWordData {
  getRandomWord: GetRandomWordResult;
}

export interface GetRandomWordsData {
  getRandomWords: GetRandomWordsResult;
}

export interface GetCategoriesData {
  getCategories: string[];
}

export interface GetDifficultiesData {
  getDifficulties: number[];
}

export interface GetWordCountData {
  getWordCount: GetWordCountResult;
}

export interface CheckTranslationData {
  checkTranslation: CheckTranslationResult;
}

export interface ResetSessionData {
  resetSession: ResetSessionResult;
}

// Variables
export interface GetRandomWordVariables {
  mode: "EN_TO_PL" | "PL_TO_EN";
  category?: string | null;
  difficulty?: number | null;
}

export interface GetRandomWordsVariables {
  mode: "EN_TO_PL" | "PL_TO_EN";
  limit: number;
  category?: string | null;
  difficulty?: number | null;
}

export interface GetWordCountVariables {
  category?: string | null;
  difficulty?: number | null;
}

export interface CheckTranslationVariables {
  wordId: string;
  userTranslation: string;
  mode: "EN_TO_PL" | "PL_TO_EN";
}

// Type guards
export function isWordChallenge(
  result: GetRandomWordResult,
): result is WordChallenge {
  return result.__typename === "WordChallenge";
}

export function isWordChallengeList(
  result: GetRandomWordsResult,
): result is WordChallengeList {
  return result.__typename === "WordChallengeList";
}

export function isTranslationResult(
  result: CheckTranslationResult,
): result is TranslationResult {
  return result.__typename === "TranslationResult";
}

export function isResetSessionSuccess(
  result: ResetSessionResult,
): result is ResetSessionSuccess {
  return result.__typename === "ResetSessionSuccess";
}

export function isWordCount(result: GetWordCountResult): result is WordCount {
  return result.__typename === "WordCount";
}

export function isError(result: { __typename: string }): boolean {
  return [
    "NotFoundError",
    "ValidationError",
    "RateLimitError",
    "SessionError",
  ].includes(result.__typename);
}
