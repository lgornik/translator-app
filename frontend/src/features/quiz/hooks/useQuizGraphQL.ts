import { useCallback, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  GET_RANDOM_WORD,
  GET_RANDOM_WORDS,
  CHECK_TRANSLATION,
  type GetRandomWordData,
  type GetRandomWordVariables,
  type GetRandomWordsData,
  type GetRandomWordsVariables,
  type CheckTranslationData,
  type CheckTranslationVariables,
} from '@/shared/api/operations';
import type { WordChallenge, TranslationResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

interface FetchWordParams {
  mode: 'EN_TO_PL' | 'PL_TO_EN';
  category: string | null;
  difficulty: number | null;
}

interface FetchWordsParams {
  mode: 'EN_TO_PL' | 'PL_TO_EN';
  limit: number;
  category: string | null;
  difficulty: number | null;
}

interface CheckAnswerParams {
  wordId: string;
  userTranslation: string;
  mode: 'EN_TO_PL' | 'PL_TO_EN';
}

interface UseQuizGraphQLCallbacks {
  onWordLoaded: (word: WordChallenge) => void;
  onPoolLoaded: (words: WordChallenge[]) => void;
  onNoMoreWords: () => void;
  onWordError: (error: string) => void;
  onResultReceived: (result: TranslationResult) => void;
}

interface UseQuizGraphQLReturn {
  fetchWord: (params: FetchWordParams) => void;
  fetchWords: (params: FetchWordsParams) => void;
  checkAnswer: (params: CheckAnswerParams) => void;
  isLoadingWord: boolean;
  isLoadingWords: boolean;
  isCheckingAnswer: boolean;
}

/**
 * Encapsulates all GraphQL operations for the quiz
 */
export function useQuizGraphQL({
  onWordLoaded,
  onPoolLoaded,
  onNoMoreWords,
  onWordError,
  onResultReceived,
}: UseQuizGraphQLCallbacks): UseQuizGraphQLReturn {

  // Pojedyncze słowo (dla trybu standardowego i czasowego)
  const [fetchWordQuery, { loading: isLoadingWord, data: wordData, error: wordError }] = useLazyQuery<
    GetRandomWordData,
    GetRandomWordVariables
  >(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
  });

  // Handle word query completion and errors
  useEffect(() => {
    if (wordData) {
      if (!wordData.getRandomWord) {
        logger.debug('[useQuizGraphQL] No word returned');
        onNoMoreWords();
        return;
      }

      logger.debug('[useQuizGraphQL] Word loaded', {
        wordId: wordData.getRandomWord.id
      });
      onWordLoaded(wordData.getRandomWord as WordChallenge);
    }
  }, [wordData, onWordLoaded, onNoMoreWords]);

  useEffect(() => {
    if (wordError) {
      logger.error('[useQuizGraphQL] Error fetching word', { error: wordError });

      const errorMsg = wordError.message.toLowerCase();
      const isNoWordsError =
        errorMsg.includes('no words') ||
        errorMsg.includes('brak słów') ||
        errorMsg.includes('available');

      if (isNoWordsError) {
        onNoMoreWords();
      } else {
        onWordError(wordError.message);
      }
    }
  }, [wordError, onNoMoreWords, onWordError]);

  // Wiele słów naraz (dla trybu utrwalania)
  const [fetchWordsQuery, { loading: isLoadingWords, data: wordsData, error: wordsError }] = useLazyQuery<
    GetRandomWordsData,
    GetRandomWordsVariables
  >(GET_RANDOM_WORDS, {
    fetchPolicy: 'network-only',
  });

  // Handle words pool query completion and errors
  useEffect(() => {
    if (wordsData) {
      const words = wordsData.getRandomWords || [];

      logger.debug('[useQuizGraphQL] Pool loaded', {
        count: words.length
      });

      onPoolLoaded(words as WordChallenge[]);
    }
  }, [wordsData, onPoolLoaded]);

  useEffect(() => {
    if (wordsError) {
      logger.error('[useQuizGraphQL] Error fetching words pool', { error: wordsError });
      onWordError(wordsError.message);
    }
  }, [wordsError, onWordError]);

  const [checkTranslationMutation, { loading: isCheckingAnswer, data: checkData, error: checkError }] = useMutation<
    CheckTranslationData,
    CheckTranslationVariables
  >(CHECK_TRANSLATION);

  // Handle translation check completion and errors
  useEffect(() => {
    if (checkData) {
      logger.debug('[useQuizGraphQL] Translation checked', {
        isCorrect: checkData.checkTranslation.isCorrect
      });
      onResultReceived(checkData.checkTranslation);
    }
  }, [checkData, onResultReceived]);

  useEffect(() => {
    if (checkError) {
      logger.error('[useQuizGraphQL] Error checking translation', { error: checkError });
    }
  }, [checkError]);

  const fetchWord = useCallback((params: FetchWordParams) => {
    logger.debug('[useQuizGraphQL] Fetching word', params);
    fetchWordQuery({ variables: params });
  }, [fetchWordQuery]);

  const fetchWords = useCallback((params: FetchWordsParams) => {
    logger.debug('[useQuizGraphQL] Fetching words pool', params);
    fetchWordsQuery({ variables: params });
  }, [fetchWordsQuery]);

  const checkAnswer = useCallback((params: CheckAnswerParams) => {
    logger.debug('[useQuizGraphQL] Checking answer', {
      wordId: params.wordId,
      mode: params.mode,
    });
    checkTranslationMutation({ variables: params });
  }, [checkTranslationMutation]);

  return {
    fetchWord,
    fetchWords,
    checkAnswer,
    isLoadingWord,
    isLoadingWords,
    isCheckingAnswer,
  };
}