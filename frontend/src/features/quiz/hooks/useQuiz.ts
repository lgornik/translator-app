import { useCallback, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';

import { quizMachine, QuizContext } from '../machines/quizMachine';
import {
  GET_RANDOM_WORD,
  CHECK_TRANSLATION,
  GET_CATEGORIES,
  GET_WORD_COUNT,
  type GetRandomWordData,
  type GetRandomWordVariables,
  type CheckTranslationData,
  type CheckTranslationVariables,
  type GetCategoriesData,
  type GetWordCountData,
  type GetWordCountVariables,
} from '@/shared/api/operations';
import type { Difficulty, WordChallenge } from '@/shared/types';

/**
 * Quiz settings input
 */
export interface QuizStartSettings {
  wordLimit?: number;
  timeLimit?: number;
  category?: string | null;
  difficulty?: Difficulty | null;
  mode?: 'EN_TO_PL' | 'PL_TO_EN';
}

/**
 * Hook return type for better intellisense
 */
export interface UseQuizReturn {
  // State
  state: 'setup' | 'loading' | 'playing' | 'finished' | 'error';
  context: QuizContext;
  
  // Derived state
  isSetup: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isFinished: boolean;
  isError: boolean;
  isWaitingForInput: boolean;
  isShowingResult: boolean;
  
  // Data
  categories: string[];
  availableWordCount: number;
  
  // Actions
  startQuiz: (settings: QuizStartSettings) => void;
  startQuizWithReinforce: (settings: QuizStartSettings) => void;
  submitAnswer: () => void;
  nextWord: () => void;
  updateInput: (value: string) => void;
  toggleMode: () => void;
  reset: () => void;
  refetchWordCount: (variables: { category?: string | null; difficulty?: number | null }) => void;
  
  // Loading states
  loadingWord: boolean;
  checkingAnswer: boolean;
}

/**
 * Main quiz hook - integrates XState machine with Apollo Client
 */
export function useQuiz(): UseQuizReturn {
  const [snapshot, send] = useMachine(quizMachine);
  
  // GraphQL queries
  const { data: categoriesData } = useQuery<GetCategoriesData>(GET_CATEGORIES);
  
  const { data: wordCountData, refetch: refetchWordCount } = useQuery<
    GetWordCountData,
    GetWordCountVariables
  >(GET_WORD_COUNT, {
    variables: {
      category: snapshot.context.category,
      difficulty: snapshot.context.difficulty,
    },
  });
  
  const [fetchWord, { loading: loadingWord }] = useLazyQuery<
    GetRandomWordData,
    GetRandomWordVariables
  >(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('[useQuiz] Word loaded:', data.getRandomWord);
      
      if (!data.getRandomWord) {
        console.log('[useQuiz] No word returned, sending NO_MORE_WORDS');
        send({ type: 'NO_MORE_WORDS' });
        return;
      }
      
      send({
        type: 'WORD_LOADED',
        word: data.getRandomWord as WordChallenge,
      });
    },
    onError: (error) => {
      console.error('[useQuiz] Error fetching word:', error);
      
      // Only treat as "no more words" if explicitly stated
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('no words') || errorMsg.includes('brak słów') || errorMsg.includes('available')) {
        send({ type: 'NO_MORE_WORDS' });
      } else {
        send({ type: 'WORD_LOAD_ERROR', error: error.message });
      }
    },
  });
  
  const [checkTranslation, { loading: checkingAnswer }] = useMutation<
    CheckTranslationData,
    CheckTranslationVariables
  >(CHECK_TRANSLATION, {
    onCompleted: (data) => {
      send({
        type: 'RESULT_RECEIVED',
        result: data.checkTranslation,
      });
    },
    onError: (error) => {
      console.error('Error checking translation:', error);
    },
  });
  
  // Track if we've started a timed quiz (persists until reset/finish)
  const [timerActive, setTimerActive] = useState(false);
  const isTimedMode = snapshot.context.timeLimit > 0;
  
  // Start timer when quiz starts in timed mode
  useEffect(() => {
    const justStartedPlaying = snapshot.matches('playing') && isTimedMode && !timerActive;
    if (justStartedPlaying) {
      console.log('[useQuiz] Activating timer');
      setTimerActive(true);
    }
  }, [snapshot.value, isTimedMode, timerActive]);
  
  // Reset timer active state when quiz finishes or resets
  useEffect(() => {
    if (snapshot.matches('setup') || snapshot.matches('finished')) {
      if (timerActive) {
        console.log('[useQuiz] Deactivating timer (quiz ended)');
        setTimerActive(false);
      }
    }
  }, [snapshot.value, timerActive]);
  
  // The actual interval - only depends on timerActive
  useEffect(() => {
    if (timerActive && snapshot.context.timeRemaining > 0) {
      console.log('[useQuiz] Starting timer interval, timeRemaining:', snapshot.context.timeRemaining);
      
      const intervalId = setInterval(() => {
        send({ type: 'TIMER_TICK' });
      }, 1000);
      
      return () => {
        console.log('[useQuiz] Clearing timer interval');
        clearInterval(intervalId);
      };
    }
  }, [timerActive, send]); // send is stable from XState
  
  // Check timer end - only in timed mode
  useEffect(() => {
    const isTimedMode = snapshot.context.timeLimit > 0;
    const timerExpired = snapshot.context.timeRemaining <= 0;
    const isPlaying = snapshot.matches('playing');
    
    // Only end if we're in timed mode AND timer actually expired (was > 0 and reached 0)
    if (isTimedMode && timerExpired && isPlaying) {
      send({ type: 'TIMER_END' });
    }
  }, [snapshot.context.timeRemaining, snapshot.context.timeLimit, snapshot.value, send]);
  
  // Fetch word when entering loading state
  useEffect(() => {
    const isLoading = snapshot.matches('loading');
    const isLoadingNext = snapshot.matches('loadingNext');
    
    console.log('[useQuiz] State check:', { 
      value: snapshot.value, 
      isLoading, 
      isLoadingNext,
      mode: snapshot.context.mode 
    });
    
    if (isLoading || isLoadingNext) {
      console.log('[useQuiz] Fetching word with variables:', {
        mode: snapshot.context.mode,
        category: snapshot.context.category,
        difficulty: snapshot.context.difficulty,
      });
      
      fetchWord({
        variables: {
          mode: snapshot.context.mode,
          category: snapshot.context.category,
          difficulty: snapshot.context.difficulty,
        },
      });
    }
  }, [
    snapshot.value,
    snapshot.context.mode,
    snapshot.context.category,
    snapshot.context.difficulty,
    fetchWord
  ]);
  
  // Actions
  const startQuiz = useCallback((settings: QuizStartSettings) => {
    const hasTimeLimit = settings.timeLimit && settings.timeLimit > 0;
    
    const finalSettings = {
      wordLimit: hasTimeLimit ? 9999 : (settings.wordLimit ?? 50), // No word limit in timed mode
      timeLimit: settings.timeLimit ?? 0,
      category: settings.category ?? null,
      difficulty: settings.difficulty ?? null,
      mode: settings.mode ?? 'EN_TO_PL',
    };
    
    console.log('[useQuiz] startQuiz called with:', settings);
    console.log('[useQuiz] Final settings:', finalSettings);
    
    send({
      type: 'START',
      settings: finalSettings,
    });
  }, [send]);
  
  const startQuizWithReinforce = useCallback((settings: QuizStartSettings) => {
    send({
      type: 'START_REINFORCE',
      settings: {
        wordLimit: settings.wordLimit ?? 50,
        timeLimit: 0,
        category: settings.category ?? null,
        difficulty: settings.difficulty ?? null,
        mode: settings.mode ?? 'EN_TO_PL',
      },
    });
  }, [send]);
  
  const startTimedQuiz = useCallback((settings: QuizStartSettings) => {
    send({
      type: 'START',
      settings: {
        wordLimit: 999, // No word limit in timed mode
        timeLimit: settings.timeLimit ?? 300,
        category: settings.category ?? null,
        difficulty: settings.difficulty ?? null,
        mode: settings.mode ?? 'EN_TO_PL',
      },
    });
  }, [send]);
  
  const submitAnswer = useCallback(() => {
    if (!snapshot.context.currentWord) return;
    
    send({ type: 'SUBMIT' });
    
    checkTranslation({
      variables: {
        wordId: snapshot.context.currentWord.id,
        userTranslation: snapshot.context.userInput.trim(),
        mode: snapshot.context.mode,
      },
    });
  }, [checkTranslation, snapshot.context, send]);
  
  const nextWord = useCallback(() => {
    send({ type: 'NEXT_WORD' });
  }, [send]);
  
  const updateInput = useCallback((value: string) => {
    send({ type: 'INPUT_CHANGE', value });
  }, [send]);
  
  const toggleMode = useCallback(() => {
    send({ type: 'TOGGLE_MODE' });
  }, [send]);
  
  const reset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);
  
  // Derive current state string
  const getStateString = (): UseQuizReturn['state'] => {
    if (snapshot.matches('setup')) return 'setup';
    if (snapshot.matches('loading')) return 'loading';
    if (snapshot.matches('loadingNext')) return 'loading';
    if (snapshot.matches('playing')) return 'playing';
    if (snapshot.matches('finished')) return 'finished';
    if (snapshot.matches('error')) return 'error';
    return 'setup';
  };
  
  return {
    // State
    state: getStateString(),
    context: snapshot.context,
    
    // Derived state
    isSetup: snapshot.matches('setup'),
    isPlaying: snapshot.matches('playing'),
    isLoading: snapshot.matches('loading') || snapshot.matches('loadingNext'),
    isFinished: snapshot.matches('finished'),
    isError: snapshot.matches('error'),
    isWaitingForInput: snapshot.matches({ playing: 'waitingForInput' }),
    isShowingResult: snapshot.matches({ playing: 'showingResult' }),
    
    // Data
    categories: categoriesData?.getCategories ?? [],
    availableWordCount: wordCountData?.getWordCount?.count ?? 0,
    
    // Actions
    startQuiz,
    startQuizWithReinforce,
    submitAnswer,
    nextWord,
    updateInput,
    toggleMode,
    reset,
    refetchWordCount,
    
    // Loading states
    loadingWord,
    checkingAnswer,
  };
}
