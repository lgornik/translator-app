import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { useQuiz } from './useQuiz';
import { GET_RANDOM_WORD, GET_RANDOM_WORDS } from '@/shared/api/operations';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

// Helper do tworzenia mocka pojedynczego słowa (tryb standardowy/czasowy)
const createWordMock = (id: string): MockedResponse => ({
  request: {
    query: GET_RANDOM_WORD,
    variables: { mode: 'EN_TO_PL', category: null, difficulty: null },
  },
  result: {
    data: {
      getRandomWord: {
        id,
        wordToTranslate: `word-${id}`,
        mode: 'EN_TO_PL',
        category: 'test',
        difficulty: 1,
      },
    },
  },
});

// Helper do mocka "brak więcej słów" (tryb standardowy)
const createNoMoreWordsMock = (): MockedResponse => ({
  request: {
    query: GET_RANDOM_WORD,
    variables: { mode: 'EN_TO_PL', category: null, difficulty: null },
  },
  result: {
    data: { getRandomWord: null },
  },
});

// Helper do tworzenia mocka wielu słów (tryb utrwalania - batch)
const createWordsMock = (count: number, limit: number): MockedResponse => ({
  request: {
    query: GET_RANDOM_WORDS,
    variables: { mode: 'EN_TO_PL', limit, category: null, difficulty: null },
  },
  result: {
    data: {
      getRandomWords: Array.from({ length: count }, (_, i) => ({
        id: String(i + 1),
        wordToTranslate: `word-${i + 1}`,
        mode: 'EN_TO_PL',
        category: 'test',
        difficulty: 1,
      })),
    },
  },
});

// Helper do mocka pustej puli (tryb utrwalania)
const createEmptyPoolMock = (limit: number): MockedResponse => ({
  request: {
    query: GET_RANDOM_WORDS,
    variables: { mode: 'EN_TO_PL', limit, category: null, difficulty: null },
  },
  result: {
    data: { getRandomWords: [] },
  },
});

// Wrapper z MockedProvider
const createWrapper = (mocks: MockedResponse[]) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };
};

describe('useQuiz - Reinforce Mode (Batch Loading)', () => {
  describe('Pool Loading', () => {
    it('should set isLoadingPool to true after startQuizWithReinforce', async () => {
      const mocks = [createWordsMock(2, 2)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 2 });
      });

      expect(result.current.isLoadingPool).toBe(true);
      expect(result.current.context.reinforceMode).toBe(true);
    });

    it('should load all words in single request and transition to playing', async () => {
      const mocks = [createWordsMock(3, 3)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 3 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.wordPool).toHaveLength(3);
      expect(result.current.isLoadingPool).toBe(false);
    });

    it('should handle fewer words than requested', async () => {
      // Request 5 words but only 2 available
      const mocks = [createWordsMock(2, 5)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 5 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.wordPool).toHaveLength(2);
    });

    it('should go to finished if no words available', async () => {
      const mocks = [createEmptyPoolMock(5)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 5 });
      });

      await waitFor(() => {
        expect(result.current.isFinished).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.noMoreWords).toBe(true);
    });

    it('should set first word as currentWord after pool loaded', async () => {
      const mocks = [createWordsMock(3, 3)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 3 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.currentWord).not.toBeNull();
    });
  });

  describe('Standard Mode vs Reinforce Mode', () => {
    it('should NOT go to loadingPool in standard mode', async () => {
      const mocks = [createWordMock('1')];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuiz({ wordLimit: 3 });
      });

      expect(result.current.isLoadingPool).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('should have reinforceMode false in standard mode', async () => {
      const mocks = [createWordMock('1')];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuiz({ wordLimit: 3 });
      });

      expect(result.current.context.reinforceMode).toBe(false);
    });

    it('should use GET_RANDOM_WORD in standard mode', async () => {
      const mocks = [createWordMock('1')];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuiz({ wordLimit: 3 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      // Should have loaded single word, not pool
      expect(result.current.context.wordPool).toHaveLength(0);
      expect(result.current.context.currentWord).not.toBeNull();
    });
  });

  describe('Reinforce Mode Settings', () => {
    it('should set timeLimit to 0 in reinforce mode', async () => {
      const mocks = [createWordsMock(1, 5)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 5 });
      });

      expect(result.current.context.timeLimit).toBe(0);
    });

    it('should preserve wordLimit setting', async () => {
      const mocks = [createWordsMock(3, 3)];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 3 });
      });

      expect(result.current.context.wordLimit).toBe(3);
    });
  });
});

describe('useQuiz - Timed Mode Settings', () => {
  it('should set timeLimit correctly', async () => {
    const mocks = [createWordMock('1')];

    const { result } = renderHook(() => useQuiz(), {
      wrapper: createWrapper(mocks),
    });

    act(() => {
      result.current.startQuiz({ wordLimit: 10, timeLimit: 300 });
    });

    expect(result.current.context.timeLimit).toBe(300);
    expect(result.current.context.timeRemaining).toBe(300);
  });

  it('should have timeLimit 0 by default', async () => {
    const mocks = [createWordMock('1')];

    const { result } = renderHook(() => useQuiz(), {
      wrapper: createWrapper(mocks),
    });

    act(() => {
      result.current.startQuiz({ wordLimit: 10 });
    });

    expect(result.current.context.timeLimit).toBe(0);
  });
});