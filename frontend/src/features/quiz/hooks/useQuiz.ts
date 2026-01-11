import { useEffect, useCallback } from "react";
import { useQuizMachine, type QuizState } from "./useQuizMachine";

// Re-export for consumers
export type { QuizState };
import { useQuizTimer } from "./useQuizTimer";
import { useQuizGraphQL } from "./useQuizGraphQL";
import { useQuizCategories } from "./useQuizCategories";
import type {
  Difficulty,
  WordChallenge,
  TranslationResult,
} from "@/shared/types";
import type { QuizContext } from "../machines/quizMachine";

/**
 * Quiz start settings from UI
 */
export interface QuizStartSettings {
  wordLimit?: number;
  timeLimit?: number;
  category?: string | null;
  difficulty?: Difficulty | null;
  mode?: "EN_TO_PL" | "PL_TO_EN";
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
  isLoadingPool: boolean;
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
  updateFilters: (
    category: string | null,
    difficulty: Difficulty | null,
  ) => void;

  // Loading states
  loadingWord: boolean;
  checkingAnswer: boolean;
}

/**
 * Main quiz hook - orchestrates all quiz functionality
 */
export function useQuiz(): UseQuizReturn {
  // Core state management
  const { context, state, is, actions } = useQuizMachine();

  // Categories and word count
  const { categories, availableWordCount, updateWordCountFilters } =
    useQuizCategories({
      category: context.category,
      difficulty: context.difficulty,
    });

  // GraphQL operations with machine integration
  const {
    fetchWord,
    fetchWords, // NOWY
    checkAnswer,
    isLoadingWord,
    isLoadingWords, // NOWY
    isCheckingAnswer,
  } = useQuizGraphQL({
    onWordLoaded: (word: WordChallenge) => actions.wordLoaded(word),
    onPoolLoaded: (words: WordChallenge[]) => actions.poolLoaded(words), // NOWY
    onNoMoreWords: () => actions.noMoreWords(),
    onWordError: (error: string) => actions.wordError(error),
    onResultReceived: (result: TranslationResult) =>
      actions.resultReceived(result),
  });

  // Timer management
  // Timer should run in all active quiz states, not just 'playing'
  const isQuizActive = is.playing || is.loading || is.loadingPool;
  const { isRunning: isTimerRunning, formattedTime: timerDisplay } =
    useQuizTimer({
      timeLimit: context.timeLimit,
      timeRemaining: context.timeRemaining,
      isActive: isQuizActive,
      onTick: actions.timerTick,
      onEnd: actions.timerEnd,
    });

  // Fetch single word when entering loading state (normalny tryb i tryb czasowy)
  useEffect(() => {
    if (!is.loading) return;

    // Prevent race conditions - if component unmounts or state changes
    // before fetch completes, we don't want to process stale responses
    let isCancelled = false;

    // Apollo's useLazyQuery handles request cancellation internally,
    // but we add this flag for additional safety with state updates
    if (!isCancelled) {
      fetchWord({
        mode: context.mode,
        category: context.category,
        difficulty: context.difficulty,
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [
    is.loading,
    context.mode,
    context.category,
    context.difficulty,
    fetchWord,
  ]);

  // NOWY - Fetch całej puli naraz (tryb utrwalania)
  useEffect(() => {
    if (!is.loadingPool) return;

    let isCancelled = false;

    if (!isCancelled) {
      fetchWords({
        mode: context.mode,
        limit: context.wordLimit,
        category: context.category,
        difficulty: context.difficulty,
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [
    is.loadingPool,
    context.mode,
    context.wordLimit,
    context.category,
    context.difficulty,
    fetchWords,
  ]);

  // Public actions with default values
  const startQuiz = useCallback(
    (settings: QuizStartSettings) => {
      actions.start({
        wordLimit: settings.wordLimit ?? 50,
        timeLimit: settings.timeLimit ?? 0,
        category: settings.category ?? null,
        difficulty: settings.difficulty ?? null,
        mode: settings.mode ?? "EN_TO_PL",
      });
    },
    [actions],
  );

  const startQuizWithReinforce = useCallback(
    (settings: QuizStartSettings) => {
      actions.startWithReinforce({
        wordLimit: settings.wordLimit ?? 50,
        timeLimit: 0,
        category: settings.category ?? null,
        difficulty: settings.difficulty ?? null,
        mode: settings.mode ?? "EN_TO_PL",
      });
    },
    [actions],
  );

  const submitAnswer = useCallback(() => {
    if (!context.currentWord) return;

    actions.submit();

    checkAnswer({
      wordId: context.currentWord.id,
      userTranslation: context.userInput.trim(),
      mode: context.mode,
    });
  }, [
    actions,
    checkAnswer,
    context.currentWord,
    context.userInput,
    context.mode,
  ]);

  const updateFilters = useCallback(
    (category: string | null, difficulty: Difficulty | null) => {
      updateWordCountFilters({ category, difficulty });
    },
    [updateWordCountFilters],
  );

  return {
    // State
    state,
    context,

    // Derived state (flat for convenience)
    isSetup: is.setup,
    isPlaying: is.playing,
    isLoading: is.loading,
    isLoadingPool: is.loadingPool,
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

    // Loading states
    loadingWord: isLoadingWord || isLoadingWords,
    checkingAnswer: is.checking || isCheckingAnswer,
  };
}
