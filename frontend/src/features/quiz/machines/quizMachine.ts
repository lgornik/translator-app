import { setup, assign } from 'xstate';
import type { QuizStats, WordChallenge, TranslationResult, Difficulty } from '@/shared/types';
import { shuffleArray } from '@/shared/utils';

/**
 * Quiz context - all state data
 */
export interface QuizContext {
  // Settings
  mode: 'EN_TO_PL' | 'PL_TO_EN';
  category: string | null;
  difficulty: Difficulty | null;
  wordLimit: number;
  timeLimit: number;
  reinforceMode: boolean;

  // Current state
  currentWord: WordChallenge | null;
  userInput: string;
  result: TranslationResult | null;
  
  // Progress tracking
  stats: QuizStats;
  wordsCompleted: number;
  usedWordIds: Set<string>;
  timeRemaining: number;
  
  // Reinforce mode specific
  wordsToRepeat: WordChallenge[];
  masteredCount: number;
  shuffledQueue: WordChallenge[];
  
  // Error state
  error: string | null;
  noMoreWords: boolean;
}

/**
 * Quiz events
 */
export type QuizEvent =
  | { type: 'START'; settings: Partial<QuizContext> }
  | { type: 'START_REINFORCE'; settings: Partial<QuizContext> }
  | { type: 'WORD_LOADED'; word: WordChallenge }
  | { type: 'WORD_LOAD_ERROR'; error: string }
  | { type: 'NO_MORE_WORDS' }
  | { type: 'INPUT_CHANGE'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'RESULT_RECEIVED'; result: TranslationResult }
  | { type: 'NEXT_WORD' }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_END' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_MODE' };

/**
 * Initial context
 */
const initialContext: QuizContext = {
  mode: 'EN_TO_PL',
  category: null,
  difficulty: null,
  wordLimit: 50,
  timeLimit: 300,
  reinforceMode: false,
  currentWord: null,
  userInput: '',
  result: null,
  stats: { correct: 0, incorrect: 0 },
  wordsCompleted: 0,
  usedWordIds: new Set(),
  timeRemaining: 0,
  wordsToRepeat: [],
  masteredCount: 0,
  shuffledQueue: [],
  error: null,
  noMoreWords: false,
};

/**
 * Quiz state machine
 * Manages all quiz state transitions in a predictable, testable way
 */
export const quizMachine = setup({
  types: {
    context: {} as QuizContext,
    events: {} as QuizEvent,
  },
  actions: {
    resetContext: assign(() => ({ ...initialContext, usedWordIds: new Set() })),
    
    applySettings: assign(({ event }) => {
      if (event.type !== 'START' && event.type !== 'START_REINFORCE') return {};
      const settings = event.settings;
      return {
        ...settings,
        reinforceMode: event.type === 'START_REINFORCE',
        stats: { correct: 0, incorrect: 0 },
        wordsCompleted: 0,
        usedWordIds: new Set<string>(),
        wordsToRepeat: [],
        masteredCount: 0,
        shuffledQueue: [],
        error: null,
        noMoreWords: false,
        timeRemaining: settings.timeLimit ?? initialContext.timeLimit,
      };
    }),
    
    setCurrentWord: assign(({ context, event }) => {
      if (event.type !== 'WORD_LOADED') return {};
      const newUsedIds = new Set(context.usedWordIds);
      newUsedIds.add(event.word.id);
      return {
        currentWord: event.word,
        usedWordIds: newUsedIds,
        result: null,
        userInput: '',
        noMoreWords: false,
      };
    }),
    
    setWordFromQueue: assign(({ context }) => {
      let queue = context.shuffledQueue;
      
      // If queue empty, reshuffle wordsToRepeat
      if (queue.length === 0 && context.wordsToRepeat.length > 0) {
        queue = shuffleArray(context.wordsToRepeat);
        
        // Avoid same word twice in a row
        const first = queue[0];
        if (queue.length > 1 && first && first.id === context.currentWord?.id) {
          queue = [...queue.slice(1), first];
        }
      }
      
      if (queue.length === 0) {
        return { noMoreWords: true };
      }
      
      const [nextWord, ...rest] = queue;
      return {
        currentWord: nextWord ?? null,
        shuffledQueue: rest,
        result: null,
        userInput: '',
      };
    }),
    
    updateInput: assign(({ event }) => {
      if (event.type !== 'INPUT_CHANGE') return {};
      return { userInput: event.value };
    }),
    
    processResult: assign(({ context, event }) => {
      if (event.type !== 'RESULT_RECEIVED') return {};
      
      const { result } = event;
      const newStats = {
        correct: context.stats.correct + (result.isCorrect ? 1 : 0),
        incorrect: context.stats.incorrect + (result.isCorrect ? 0 : 1),
      };
      
      if (context.reinforceMode) {
        if (result.isCorrect) {
          // Remove from repeat list and queue
          const newWordsToRepeat = context.wordsToRepeat.filter(
            w => w.id !== context.currentWord?.id
          );
          const newQueue = context.shuffledQueue.filter(
            w => w.id !== context.currentWord?.id
          );
          return {
            result,
            stats: newStats,
            masteredCount: context.masteredCount + 1,
            wordsToRepeat: newWordsToRepeat,
            shuffledQueue: newQueue,
          };
        } else {
          // Add to repeat list if not already there
          const alreadyInRepeat = context.wordsToRepeat.some(
            w => w.id === context.currentWord?.id
          );
          return {
            result,
            stats: newStats,
            wordsToRepeat: alreadyInRepeat
              ? context.wordsToRepeat
              : [...context.wordsToRepeat, context.currentWord!],
          };
        }
      }
      
      return {
        result,
        stats: newStats,
        wordsCompleted: context.wordsCompleted + 1,
      };
    }),
    
    markWordUsed: assign(({ context, event }) => {
      if (event.type !== 'WORD_LOADED') return {};
      const newUsedIds = new Set(context.usedWordIds);
      newUsedIds.add(event.word.id);
      return { usedWordIds: newUsedIds };
    }),
    
    decrementTimer: assign(({ context }) => ({
      timeRemaining: Math.max(0, context.timeRemaining - 1),
    })),
    
    setError: assign(({ event }) => {
      if (event.type !== 'WORD_LOAD_ERROR') return {};
      return { error: event.error };
    }),
    
    setNoMoreWords: assign(() => ({
      noMoreWords: true,
    })),
    
    toggleTranslationMode: assign(({ context }) => ({
      mode: context.mode === 'EN_TO_PL' ? 'PL_TO_EN' : 'EN_TO_PL',
    })),
  },
  guards: {
    isQuizComplete: ({ context }) => {
      if (context.reinforceMode) {
        return context.masteredCount >= context.wordLimit &&
               context.wordsToRepeat.length === 0;
      }
      return context.wordsCompleted >= context.wordLimit;
    },
    
    isTimerComplete: ({ context }) => context.timeRemaining <= 0,
    
    hasWordsToRepeat: ({ context }) => 
      context.wordsToRepeat.length > 0 || context.shuffledQueue.length > 0,
    
    needsNewWord: ({ context }) => {
      if (context.reinforceMode) {
        return context.masteredCount < context.wordLimit;
      }
      return true;
    },
    
    isReinforceMode: ({ context }) => context.reinforceMode,
    
    isTimedMode: ({ context }) => context.timeLimit > 0,
  },
}).createMachine({
  id: 'quiz',
  initial: 'setup',
  context: initialContext,
  states: {
    setup: {
      on: {
        START: {
          target: 'loading',
          actions: ['applySettings'],
        },
        START_REINFORCE: {
          target: 'loading',
          actions: ['applySettings'],
        },
        TOGGLE_MODE: {
          actions: ['toggleTranslationMode'],
        },
      },
    },
    
    loading: {
      on: {
        WORD_LOADED: {
          target: 'playing.waitingForInput',
          actions: ['setCurrentWord', 'markWordUsed'],
        },
        WORD_LOAD_ERROR: {
          target: 'error',
          actions: ['setError'],
        },
        NO_MORE_WORDS: {
          target: 'finished',
          actions: ['setNoMoreWords'],
        },
      },
    },
    
    playing: {
      initial: 'waitingForInput',
      states: {
        waitingForInput: {
          on: {
            INPUT_CHANGE: {
              actions: ['updateInput'],
            },
            SUBMIT: 'checking',
            TIMER_TICK: {
              actions: ['decrementTimer'],
            },
            TIMER_END: '#quiz.finished',
          },
        },
        
        checking: {
          on: {
            RESULT_RECEIVED: {
              target: 'showingResult',
              actions: ['processResult'],
            },
          },
        },
        
        showingResult: {
          always: [
            {
              target: '#quiz.finished',
              guard: 'isQuizComplete',
            },
          ],
          on: {
            NEXT_WORD: [
              {
                target: '#quiz.loadingNext',
                guard: 'needsNewWord',
              },
              {
                target: 'repeatWord',
                guard: 'hasWordsToRepeat',
              },
              {
                target: '#quiz.finished',
              },
            ],
            TIMER_TICK: {
              actions: ['decrementTimer'],
            },
            TIMER_END: '#quiz.finished',
          },
        },
        
        repeatWord: {
          entry: ['setWordFromQueue'],
          always: [
            {
              target: '#quiz.finished',
              guard: ({ context }) => context.noMoreWords,
            },
            {
              target: 'waitingForInput',
            },
          ],
        },
      },
      on: {
        RESET: {
          target: 'setup',
          actions: ['resetContext'],
        },
      },
    },
    
    loadingNext: {
      on: {
        WORD_LOADED: {
          target: 'playing.waitingForInput',
          actions: ['setCurrentWord', 'markWordUsed'],
        },
        WORD_LOAD_ERROR: [
          {
            target: 'playing.repeatWord',
            guard: 'hasWordsToRepeat',
          },
          {
            target: 'finished',
            actions: ['setNoMoreWords'],
          },
        ],
        NO_MORE_WORDS: [
          {
            target: 'playing.repeatWord',
            guard: 'hasWordsToRepeat',
          },
          {
            target: 'finished',
            actions: ['setNoMoreWords'],
          },
        ],
      },
    },
    
    error: {
      on: {
        RESET: {
          target: 'setup',
          actions: ['resetContext'],
        },
      },
    },
    
    finished: {
      on: {
        RESET: {
          target: 'setup',
          actions: ['resetContext'],
        },
      },
    },
  },
});

export type QuizMachine = typeof quizMachine;
export type QuizState = ReturnType<typeof quizMachine.transition>;