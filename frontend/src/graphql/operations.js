import { gql } from '@apollo/client';

// Pobierz losowe słowo (z opcjonalnymi filtrami)
export const GET_RANDOM_WORD = gql`
  query GetRandomWord($mode: TranslationMode!, $category: String, $difficulty: Int) {
    getRandomWord(mode: $mode, category: $category, difficulty: $difficulty) {
      id
      wordToTranslate
      mode
      category
      difficulty
    }
  }
`;

// Pobierz dostępne kategorie
export const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories
  }
`;

// Pobierz liczbę słów
export const GET_WORD_COUNT = gql`
  query GetWordCount($category: String, $difficulty: Int) {
    getWordCount(category: $category, difficulty: $difficulty) {
      count
    }
  }
`;

// Sprawdź tłumaczenie
export const CHECK_TRANSLATION = gql`
  mutation CheckTranslation($wordId: ID!, $userTranslation: String!, $mode: TranslationMode!) {
    checkTranslation(wordId: $wordId, userTranslation: $userTranslation, mode: $mode) {
      isCorrect
      correctTranslation
      userTranslation
    }
  }
`;

// Reset sesji
export const RESET_SESSION = gql`
  mutation ResetSession {
    resetSession
  }
`;