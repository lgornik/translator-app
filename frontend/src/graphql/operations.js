import { gql } from '@apollo/client';

// Pobierz losowe słowo
export const GET_RANDOM_WORD = gql`
  query GetRandomWord($mode: TranslationMode!) {
    getRandomWord(mode: $mode) {
      id
      wordToTranslate
      mode
      category
      difficulty
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
