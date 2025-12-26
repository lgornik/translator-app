import { useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { quizMachine, QuizContext } from '../machines/quizMachine';
import type { Difficulty } from '@/shared/types';

/** Simplified state representation */
export type QuizState = 'setup' | 'loading' | 'playing' | 'finished' | 'error';

interface QuizSettings {
  wordLimit: number;
  timeLimit: number;
  category: string | null;
  difficulty: Difficulty | null;
  mode: 'EN_TO_PL' | 'PL_TO_EN';
}

interface UseQuizMachineReturn {
  // Raw state
  context: QuizContext;
  
  // Simplified state
  state: QuizState;
  
  // State checks
  is: {
    setup: boolean;
    loading: boolean;
    playing: boolean;
    finished: boolean;
    error: boolean;
    waitingForInput: boolean;
    showingResult: boolean;
    checking: boolean;
  };
  
  // Actions
  actions: {
    start: (settings: QuizSettings) => void;
    startWithReinforce: (settings: QuizSettings) => void;
    submit: () => void;
    nextWord: () => void;
    updateInput: (value: string) => void;
    toggleMode: () => void;
    reset: () => void;
    wordLoaded: (word: QuizContext['currentWord']) => void;
    noMoreWords: () => void;
    wordError: (error: string) => void;
    resultReceived: (result: NonNullable<QuizContext['result']>) => void;
    timerTick: () => void;
    timerEnd: () => void;
  };
}

/**
 * Wraps XState machine with convenient derived state and typed actions
 * 
 * Responsibilities:
 * - Initialize and manage quiz state machine
 * - Provide simplified state checks
 * - Expose typed action dispatchers
 * 
 * @example
 * const { context, state, is, actions } = useQuizMachine();
 * 
 * if (is.playing && is.waitingForInput) {
 *   // show input form
 * }
 * 
 * actions.submit();
 */
export function useQuizMachine(): UseQuizMachineReturn {
  const [snapshot, send] = useMachine(quizMachine);

  // Derive simple state string
  const state = useMemo((): QuizState => {
    if (snapshot.matches('setup')) return 'setup';
    if (snapshot.matches('loading') || snapshot.matches('loadingNext')) return 'loading';
    if (snapshot.matches('playing')) return 'playing';
    if (snapshot.matches('finished')) return 'finished';
    if (snapshot.matches('error')) return 'error';
    return 'setup';
  }, [snapshot]);

  // State checks object
  const is = useMemo(() => ({
    setup: snapshot.matches('setup'),
    loading: snapshot.matches('loading') || snapshot.matches('loadingNext'),
    playing: snapshot.matches('playing'),
    finished: snapshot.matches('finished'),
    error: snapshot.matches('error'),
    waitingForInput: snapshot.matches({ playing: 'waitingForInput' }),
    showingResult: snapshot.matches({ playing: 'showingResult' }),
    checking: snapshot.matches({ playing: 'checking' }),
  }), [snapshot]);

  // Actions
  const actions = useMemo(() => ({
    start: (settings: QuizSettings) => {
      send({
        type: 'START',
        settings: {
          ...settings,
          // In timed mode, don't limit words
          wordLimit: settings.timeLimit > 0 ? 9999 : settings.wordLimit,
        },
      });
    },
    
    startWithReinforce: (settings: QuizSettings) => {
      send({
        type: 'START_REINFORCE',
        settings: {
          ...settings,
          timeLimit: 0, // Reinforce mode doesn't support timer
        },
      });
    },
    
    submit: () => send({ type: 'SUBMIT' }),
    nextWord: () => send({ type: 'NEXT_WORD' }),
    updateInput: (value: string) => send({ type: 'INPUT_CHANGE', value }),
    toggleMode: () => send({ type: 'TOGGLE_MODE' }),
    reset: () => send({ type: 'RESET' }),
    
    // Events from external sources (GraphQL, timer)
    wordLoaded: (word: QuizContext['currentWord']) => {
      if (word) {
        send({ type: 'WORD_LOADED', word });
      }
    },
    noMoreWords: () => send({ type: 'NO_MORE_WORDS' }),
    wordError: (error: string) => send({ type: 'WORD_LOAD_ERROR', error }),
    resultReceived: (result: NonNullable<QuizContext['result']>) => {
      send({ type: 'RESULT_RECEIVED', result });
    },
    timerTick: () => send({ type: 'TIMER_TICK' }),
    timerEnd: () => send({ type: 'TIMER_END' }),
  }), [send]);

  return {
    context: snapshot.context,
    state,
    is,
    actions,
  };
}