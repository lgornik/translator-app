import { vi } from 'vitest';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { TranslationMode, type WordChallenge, type TranslationResult, type QuizStats, type Difficulty } from '@/shared/types';

/**
 * Factory functions for creating test data
 */

export const createMockWord = (overrides: Partial<WordChallenge> = {}): WordChallenge => ({
  id: `word-${Math.random().toString(36).substr(2, 9)}`,
  wordToTranslate: 'cat',
  mode: TranslationMode.EN_TO_PL,
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
  state: 'setup' as const,
  context: {
    mode: TranslationMode.EN_TO_PL,
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
  isSetup: true,
  isPlaying: false,
  isLoading: false,
  isFinished: false,
  isError: false,
  isWaitingForInput: false,
  isShowingResult: false,
  timerDisplay: '00:00',
  isTimerRunning: false,
  categories: ['Animals', 'Food', 'Colors'],
  availableWordCount: 100,
  startQuiz: vi.fn(),
  startQuizWithReinforce: vi.fn(),
  submitAnswer: vi.fn(),
  nextWord: vi.fn(),
  updateInput: vi.fn(),
  toggleMode: vi.fn(),
  reset: vi.fn(),
  updateFilters: vi.fn(),
  refetchWordCount: vi.fn(),
  loadingWord: false,
  checkingAnswer: false,
  ...overrides,
});

/**
 * Apollo Client test helpers
 */

export function createApolloMock<TData, TVariables>(
  query: unknown,
  variables: TVariables,
  data: TData
) {
  return {
    request: { query, variables },
    result: { data },
  };
}

export function createApolloErrorMock<TVariables>(
  query: unknown,
  variables: TVariables,
  errorMessage: string
) {
  return {
    request: { query, variables },
    error: new Error(errorMessage),
  };
}

/**
 * Timer helpers for testing
 */

export function advanceTimersBySeconds(seconds: number): void {
  vi.advanceTimersByTime(seconds * 1000);
}

/**
 * Custom render with providers
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  apolloMocks?: MockedResponse[];
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { apolloMocks = [], route = '/', ...renderOptions } = options;

  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <BrowserRouter>{children}</BrowserRouter>
      </MockedProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Wait helpers
 */

export function waitForLoadingToFinish(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Keyboard event helpers
 */

export function pressEnter(element: Element): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
    })
  );
}

export function pressEscape(element: Element): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
    })
  );
}