import { useCallback } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  GET_RANDOM_WORD,
  CHECK_TRANSLATION,
  type GetRandomWordData,
  type GetRandomWordVariables,
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

interface CheckAnswerParams {
  wordId: string;
  userTranslation: string;
  mode: 'EN_TO_PL' | 'PL_TO_EN';
}

interface UseQuizGraphQLCallbacks {
  onWordLoaded: (word: WordChallenge) => void;
  onNoMoreWords: () => void;
  onWordError: (error: string) => void;
  onResultReceived: (result: TranslationResult) => void;
}

interface UseQuizGraphQLReturn {
  fetchWord: (params: FetchWordParams) => void;
  checkAnswer: (params: CheckAnswerParams) => void;
  isLoadingWord: boolean;
  isCheckingAnswer: boolean;
}

/**
 * Encapsulates all GraphQL operations for the quiz
 * 
 * Responsibilities:
 * - Fetch random words with proper error handling
 * - Check translations
 * - Normalize API responses to domain events
 * 
 * @example
 * const { fetchWord, checkAnswer, isLoadingWord } = useQuizGraphQL({
 *   onWordLoaded: (word) => send({ type: 'WORD_LOADED', word }),
 *   onNoMoreWords: () => send({ type: 'NO_MORE_WORDS' }),
 *   onWordError: (error) => send({ type: 'WORD_LOAD_ERROR', error }),
 *   onResultReceived: (result) => send({ type: 'RESULT_RECEIVED', result }),
 * });
 */
export function useQuizGraphQL({
  onWordLoaded,
  onNoMoreWords,
  onWordError,
  onResultReceived,
}: UseQuizGraphQLCallbacks): UseQuizGraphQLReturn {
  
  const [fetchWordQuery, { loading: isLoadingWord }] = useLazyQuery<
    GetRandomWordData,
    GetRandomWordVariables
  >(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (!data.getRandomWord) {
        logger.debug('[useQuizGraphQL] No word returned');
        onNoMoreWords();
        return;
      }
      
      logger.debug('[useQuizGraphQL] Word loaded', { 
        wordId: data.getRandomWord.id 
      });
      onWordLoaded(data.getRandomWord as WordChallenge);
    },
    onError: (error) => {
      logger.error('[useQuizGraphQL] Error fetching word', { error });
      
      // Distinguish "no words available" from actual errors
      const errorMsg = error.message.toLowerCase();
      const isNoWordsError = 
        errorMsg.includes('no words') || 
        errorMsg.includes('brak sÅ‚Ã³w') || 
        errorMsg.includes('available');
      
      if (isNoWordsError) {
        onNoMoreWords();
      } else {
        onWordError(error.message);
      }
    },
  });

  const [checkTranslationMutation, { loading: isCheckingAnswer }] = useMutation<
    CheckTranslationData,
    CheckTranslationVariables
  >(CHECK_TRANSLATION, {
    onCompleted: (data) => {
      logger.debug('[useQuizGraphQL] Translation checked', { 
        isCorrect: data.checkTranslation.isCorrect 
      });
      onResultReceived(data.checkTranslation);
    },
    onError: (error) => {
      logger.error('[useQuizGraphQL] Error checking translation', { error });
      // Could add onCheckError callback if needed
    },
  });

  const fetchWord = useCallback((params: FetchWordParams) => {
    logger.debug('[useQuizGraphQL] Fetching word', params);
    fetchWordQuery({ variables: params });
  }, [fetchWordQuery]);

  const checkAnswer = useCallback((params: CheckAnswerParams) => {
    logger.debug('[useQuizGraphQL] Checking answer', { 
      wordId: params.wordId,
      mode: params.mode,
    });
    checkTranslationMutation({ variables: params });
  }, [checkTranslationMutation]);

  return {
    fetchWord,
    checkAnswer,
    isLoadingWord,
    isCheckingAnswer,
  };
}