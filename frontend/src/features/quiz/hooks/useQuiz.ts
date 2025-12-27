import { useEffect, useCallback } from 'react';
import { useQuizMachine, type QuizState } from './useQuizMachine';

// Re-export for consumers
export type { QuizState };
import { useQuizTimer } from './useQuizTimer';
import { useQuizGraphQL } from './useQuizGraphQL';
import { useQuizCategories } from './useQuizCategories';
import type { Difficulty, WordChallenge, TranslationResult } from '@/shared/types';
import type { QuizContext } from '../machines/quizMachine';

/**
 * Quiz start settings from UI
 */
export interface QuizStartSettings {
  wordLimit?: number;
  timeLimit?: number;
  category?: string | null;
  difficulty?: Difficulty | null;
  mode?: 'EN_TO_PL' | 'PL_TO_EN';
}

/**
 * Public API of useQuiz hook
 */
export interface UseQuizReturn {
  // State
  state: QuizState;
  context: QuizContext;
  
  // Derived state
  isSetup: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isFinished: boolean;
  isError: boolean;
  isWaitingForInput: boolean;
  isShowingResult: boolean;
  
  // Timer
  timerDisplay: string;
  isTimerRunning: boolean;
  
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
  updateFilters: (category: string | null, difficulty: Difficulty | null) => void;
  /** @deprecated Use updateFilters instead */
  refetchWordCount: (variables: { category?: string | null; difficulty?: number | null }) => void;
  
  // Loading states
  loadingWord: boolean;
  checkingAnswer: boolean;
}

/**
 * Main quiz hook - orchestrates all quiz functionality
 * 
 * This hook composes smaller, focused hooks:
 * - useQuizMachine: State management
 * - useQuizTimer: Timer logic
 * - useQuizGraphQL: API operations
 * - useQuizCategories: Categories & word count
 * 
 * @example
 * function QuizPage() {
 *   const quiz = useQuiz();
 *   
 *   if (quiz.isSetup) {
 *     return <QuizSetup {...quiz} />;
 *   }
 *   
 *   if (quiz.isPlaying) {
 *     return <QuizPlaying {...quiz} />;
 *   }
 *   
 *   return <QuizFinished {...quiz} />;
 * }
 */
export function useQuiz(): UseQuizReturn {
  // Core state management
  const { context, state, is, actions } = useQuizMachine();

  // Categories and word count
  const { 
    categories, 
    availableWordCount, 
    updateWordCountFilters 
  } = useQuizCategories({
    category: context.category,
    difficulty: context.difficulty,
  });

  // GraphQL operations with machine integration
  const { 
    fetchWord, 
    checkAnswer, 
    isLoadingWord, 
    isCheckingAnswer 
  } = useQuizGraphQL({
    onWordLoaded: (word: WordChallenge) => actions.wordLoaded(word),
    onNoMoreWords: () => actions.noMoreWords(),
    onWordError: (error: string) => actions.wordError(error),
    onResultReceived: (result: TranslationResult) => actions.resultReceived(result),
  });

  // Timer management
  const { isRunning: isTimerRunning, formattedTime: timerDisplay } = useQuizTimer({
    timeLimit: context.timeLimit,
    timeRemaining: context.timeRemaining,
    isActive: is.playing,
    onTick: actions.timerTick,
    onEnd: actions.timerEnd,
  });

  // Fetch word when entering loading state
  useEffect(() => {
    if (is.loading) {
      fetchWord({
        mode: context.mode,
        category: context.category,
        difficulty: context.difficulty,
      });
    }
  }, [is.loading, context.mode, context.category, context.difficulty, fetchWord]);

  // Public actions with default values
  const startQuiz = useCallback((settings: QuizStartSettings) => {
    actions.start({
      wordLimit: settings.wordLimit ?? 50,
      timeLimit: settings.timeLimit ?? 0,
      category: settings.category ?? null,
      difficulty: settings.difficulty ?? null,
      mode: settings.mode ?? 'EN_TO_PL',
    });
  }, [actions]);

  const startQuizWithReinforce = useCallback((settings: QuizStartSettings) => {
    actions.startWithReinforce({
      wordLimit: settings.wordLimit ?? 50,
      timeLimit: 0,
      category: settings.category ?? null,
      difficulty: settings.difficulty ?? null,
      mode: settings.mode ?? 'EN_TO_PL',
    });
  }, [actions]);

  const submitAnswer = useCallback(() => {
    if (!context.currentWord) return;
    
    actions.submit();
    
    checkAnswer({
      wordId: context.currentWord.id,
      userTranslation: context.userInput.trim(),
      mode: context.mode,
    });
  }, [actions, checkAnswer, context.currentWord, context.userInput, context.mode]);

  const updateFilters = useCallback((
    category: string | null, 
    difficulty: Difficulty | null
  ) => {
    updateWordCountFilters({ category, difficulty });
  }, [updateWordCountFilters]);

  return {
    // State
    state,
    context,
    
    // Derived state (flat for convenience)
    isSetup: is.setup,
    isPlaying: is.playing,
    isLoading: is.loading,
    isFinished: is.finished,
    isError: is.error,
    isWaitingForInput: is.waitingForInput,
    isShowingResult: is.showingResult,
    
    // Timer
    timerDisplay,
    isTimerRunning,
    
    // Data
    categories,
    availableWordCount,
    
    // Actions
    startQuiz,
    startQuizWithReinforce,
    submitAnswer,
    nextWord: actions.nextWord,
    updateInput: actions.updateInput,
    toggleMode: actions.toggleMode,
    reset: actions.reset,
    updateFilters,
    refetchWordCount: (variables: { category?: string | null; difficulty?: number | null }) => {
      updateWordCountFilters({ 
        category: variables.category ?? null, 
        difficulty: variables.difficulty as Difficulty | null ?? null 
      });
    },
    
    // Loading states
    loadingWord: isLoadingWord,
    checkingAnswer: is.checking || isCheckingAnswer,
  };
}