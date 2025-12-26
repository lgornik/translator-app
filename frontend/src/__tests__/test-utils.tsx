import { vi } from 'vitest';
import type { WordChallenge, TranslationResult, QuizStats, Difficulty } from '@/shared/types';

/**
 * Factory functions for creating test data
 */

export const createMockWord = (overrides: Partial<WordChallenge> = {}): WordChallenge => ({
  id: `word-${Math.random().toString(36).substr(2, 9)}`,
  wordToTranslate: 'cat',
  correctTranslation: 'kot',
  mode: 'EN_TO_PL',
  category: 'Animals',
  difficulty: 1 as Difficulty,
  ...overrides,
});

export const createMockResult = (
  isCorrect: boolean,
  overrides: Partial<TranslationResult> = {}
): TranslationResult => ({
  isCorrect,
  correctTranslation: 'kot',
  userTranslation: isCorrect ? 'kot' : 'pies',
  ...overrides,
});

export const createMockStats = (overrides: Partial<QuizStats> = {}): QuizStats => ({
  correct: 0,
  incorrect: 0,
  ...overrides,
});

/**
 * Mock hooks for component testing
 */

export const createMockUseQuiz = (overrides = {}) => ({
  // State
  state: 'setup' as const,
  context: {
    mode: 'EN_TO_PL' as const,
    category: null,
    difficulty: null,
    wordLimit: 50,
    timeLimit: 0,
    reinforceMode: false,
    currentWord: null,
    userInput: '',
    result: null,
    stats: { correct: 0, incorrect: 0 },
    wordsCompleted: 0,
    usedWordIds: new Set<string>(),
    timeRemaining: 0,
    wordsToRepeat: [],
    masteredCount: 0,
    shuffledQueue: [],
    error: null,
    noMoreWords: false,
  },
  
  // Derived state
  isSetup: true,
  isPlaying: false,
  isLoading: false,
  isFinished: false,
  isError: false,
  isWaitingForInput: false,
  isShowingResult: false,
  
  // Timer
  timerDisplay: '00:00',
  isTimerRunning: false,
  
  // Data
  categories: ['Animals', 'Food', 'Colors'],
  availableWordCount: 100,
  
  // Actions
  startQuiz: vi.fn(),
  startQuizWithReinforce: vi.fn(),
  submitAnswer: vi.fn(),
  nextWord: vi.fn(),
  updateInput: vi.fn(),
  toggleMode: vi.fn(),
  reset: vi.fn(),
  updateFilters: vi.fn(),
  refetchWordCount: vi.fn(),
  
  // Loading states
  loadingWord: false,
  checkingAnswer: false,
  
  ...overrides,
});

/**
 * Apollo Client test helpers
 */

export const createApolloMock = <TData, TVariables>(
  query: any,
  variables: TVariables,
  data: TData
) => ({
  request: {
    query,
    variables,
  },
  result: {
    data,
  },
});

export const createApolloErrorMock = <TVariables>(
  query: any,
  variables: TVariables,
  errorMessage: string
) => ({
  request: {
    query,
    variables,
  },
  error: new Error(errorMessage),
});

/**
 * Timer helpers for testing
 */

export const advanceTimersBySeconds = (seconds: number) => {
  vi.advanceTimersByTime(seconds * 1000);
};

/**
 * Custom render with providers
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  apolloMocks?: MockedResponse[];
  route?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    apolloMocks = [],
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      <BrowserRouter>{children}</BrowserRouter>
    </MockedProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Wait helpers
 */

export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Keyboard event helpers
 */

export const pressEnter = (element: Element) => {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
    })
  );
};

export const pressEscape = (element: Element) => {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
    })
  );
};