import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { useQuiz } from './useQuiz';
import { GET_RANDOM_WORD } from '@/shared/api/operations';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

// Helper do tworzenia mocka słowa
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
        correctTranslation: `translation-${id}`,
        category: 'test',
        difficulty: 1,
      },
    },
  },
});

// Helper do mocka "brak więcej słów"
const createNoMoreWordsMock = (): MockedResponse => ({
  request: {
    query: GET_RANDOM_WORD,
    variables: { mode: 'EN_TO_PL', category: null, difficulty: null },
  },
  result: {
    data: { getRandomWord: null },
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

describe('useQuiz - Reinforce Mode', () => {
  describe('Pool Collection (Zbieranie puli)', () => {
    it('should set isCollectingPool to true after startQuizWithReinforce', async () => {
      const mocks = [
        createWordMock('1'),
        createWordMock('2'),
      ];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 2 });
      });

      expect(result.current.isCollectingPool).toBe(true);
      expect(result.current.context.reinforceMode).toBe(true);
    });

    it('should collect words and transition to playing', async () => {
      const mocks = [
        createWordMock('1'),
        createWordMock('2'),
      ];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 2 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.wordPool).toHaveLength(2);
      expect(result.current.isCollectingPool).toBe(false);
    });

    it('should start with fewer words if not enough available', async () => {
      const mocks = [
        createWordMock('1'),
        createNoMoreWordsMock(),
      ];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 5 });
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.context.wordPool).toHaveLength(1);
    });

    it('should go to finished if no words available', async () => {
      const mocks = [createNoMoreWordsMock()];

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
  });

  describe('Standard Mode vs Reinforce Mode', () => {
    it('should NOT go to collectingPool in standard mode', async () => {
      const mocks = [createWordMock('1')];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuiz({ wordLimit: 3 });
      });

      expect(result.current.isCollectingPool).toBe(false);
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
  });

  describe('Reinforce Mode Settings', () => {
    it('should set timeLimit to 0 in reinforce mode', async () => {
      const mocks = [createWordMock('1')];

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startQuizWithReinforce({ wordLimit: 5 });
      });

      expect(result.current.context.timeLimit).toBe(0);
    });

    it('should preserve wordLimit setting', async () => {
      const mocks = [
        createWordMock('1'),
        createWordMock('2'),
        createWordMock('3'),
      ];

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