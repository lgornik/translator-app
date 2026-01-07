import { useCallback } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  GET_RANDOM_WORD,
  GET_RANDOM_WORDS,  // NOWY import
  CHECK_TRANSLATION,
  type GetRandomWordData,
  type GetRandomWordVariables,
  type GetRandomWordsData,      // NOWY typ
  type GetRandomWordsVariables, // NOWY typ
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
  onPoolLoaded: (words: WordChallenge[]) => void;  // NOWY callback
  onNoMoreWords: () => void;
  onWordError: (error: string) => void;
  onResultReceived: (result: TranslationResult) => void;
}

interface UseQuizGraphQLReturn {
  fetchWord: (params: FetchWordParams) => void;
  fetchWords: (params: FetchWordsParams) => void;  // NOWA funkcja
  checkAnswer: (params: CheckAnswerParams) => void;
  isLoadingWord: boolean;
  isLoadingWords: boolean;  // NOWY stan
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
      
      const errorMsg = error.message.toLowerCase();
      const isNoWordsError = 
        errorMsg.includes('no words') || 
        errorMsg.includes('brak słów') || 
        errorMsg.includes('available');
      
      if (isNoWordsError) {
        onNoMoreWords();
      } else {
        onWordError(error.message);
      }
    },
  });

  // NOWE - wiele słów naraz (dla trybu utrwalania)
  const [fetchWordsQuery, { loading: isLoadingWords }] = useLazyQuery<
    GetRandomWordsData,
    GetRandomWordsVariables
  >(GET_RANDOM_WORDS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const words = data.getRandomWords || [];
      
      logger.debug('[useQuizGraphQL] Pool loaded', { 
        count: words.length 
      });
      
      onPoolLoaded(words as WordChallenge[]);
    },
    onError: (error) => {
      logger.error('[useQuizGraphQL] Error fetching words pool', { error });
      onWordError(error.message);
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
    },
  });

  const fetchWord = useCallback((params: FetchWordParams) => {
    logger.debug('[useQuizGraphQL] Fetching word', params);
    fetchWordQuery({ variables: params });
  }, [fetchWordQuery]);

  // NOWA funkcja
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