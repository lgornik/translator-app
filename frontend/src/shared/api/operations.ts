import { gql } from '@apollo/client';

/**
 * GraphQL fragments
 */
export const WORD_CHALLENGE_FRAGMENT = gql`
  fragment WordChallengeFields on WordChallenge {
    id
    wordToTranslate
    correctTranslation
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
  query GetRandomWord($mode: TranslationMode!, $category: String, $difficulty: Int) {
    getRandomWord(mode: $mode, category: $category, difficulty: $difficulty) {
      ...WordChallengeFields
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
      count
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
  mutation CheckTranslation($wordId: ID!, $userTranslation: String!, $mode: TranslationMode!) {
    checkTranslation(wordId: $wordId, userTranslation: $userTranslation, mode: $mode) {
      ...TranslationResultFields
    }
  }
`;

export const RESET_SESSION = gql`
  mutation ResetSession {
    resetSession
  }
`;

/**
 * Type definitions for query/mutation results
 */
export interface GetRandomWordData {
  getRandomWord: {
    id: string;
    wordToTranslate: string;
    correctTranslation: string;
    mode: 'EN_TO_PL' | 'PL_TO_EN';
    category: string;
    difficulty: number;
  };
}

export interface GetCategoriesData {
  getCategories: string[];
}

export interface GetDifficultiesData {
  getDifficulties: number[];
}

export interface GetWordCountData {
  getWordCount: {
    count: number;
  };
}

export interface CheckTranslationData {
  checkTranslation: {
    isCorrect: boolean;
    correctTranslation: string;
    userTranslation: string;
  };
}

export interface ResetSessionData {
  resetSession: boolean;
}

/**
 * Variable types
 */
export interface GetRandomWordVariables {
  mode: 'EN_TO_PL' | 'PL_TO_EN';
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
  mode: 'EN_TO_PL' | 'PL_TO_EN';
}
