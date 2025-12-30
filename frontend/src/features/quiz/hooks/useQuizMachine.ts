import { useMachine } from '@xstate/react';
import { quizMachine, type QuizContext } from '../machines/quizMachine';
import type { WordChallenge, TranslationResult } from '@/shared/types';

export type QuizState = 
  | 'setup'
  | 'collectingPool'
  | 'loading'
  | 'playing'
  | 'playing.waitingForInput'
  | 'playing.checking'
  | 'playing.showingResult'
  | 'playing.repeatWord'
  | 'loadingNext'
  | 'error'
  | 'finished';

interface UseQuizMachineReturn {
  context: QuizContext;
  state: QuizState;
  is: {
    setup: boolean;
    collectingPool: boolean;
    loading: boolean;
    playing: boolean;
    waitingForInput: boolean;
    checking: boolean;
    showingResult: boolean;
    finished: boolean;
    error: boolean;
  };
  actions: {
    start: (settings: Partial<QuizContext>) => void;
    startWithReinforce: (settings: Partial<QuizContext>) => void;
    wordLoaded: (word: WordChallenge) => void;
    noMoreWords: () => void;
    wordError: (error: string) => void;
    updateInput: (value: string) => void;
    submit: () => void;
    resultReceived: (result: TranslationResult) => void;
    nextWord: () => void;
    timerTick: () => void;
    timerEnd: () => void;
    reset: () => void;
    toggleMode: () => void;
  };
}

/**
 * Hook wrapping the quiz state machine
 * Provides typed access to state, context, and actions
 */
export function useQuizMachine(): UseQuizMachineReturn {
  const [state, send] = useMachine(quizMachine);

  const is = {
    setup: state.matches('setup'),
    collectingPool: state.matches('collectingPool'),
    loading: state.matches('loading'),
    playing: state.matches('playing'),
    waitingForInput: state.matches({ playing: 'waitingForInput' }),
    checking: state.matches({ playing: 'checking' }),
    showingResult: state.matches({ playing: 'showingResult' }),
    finished: state.matches('finished'),
    error: state.matches('error'),
  };

  const actions = {
    start: (settings: Partial<QuizContext>) => 
      send({ type: 'START', settings }),
    
    startWithReinforce: (settings: Partial<QuizContext>) => 
      send({ type: 'START_REINFORCE', settings }),
    
    wordLoaded: (word: WordChallenge) => 
      send({ type: 'WORD_LOADED', word }),
    
    noMoreWords: () => 
      send({ type: 'NO_MORE_WORDS' }),
    
    wordError: (error: string) => 
      send({ type: 'WORD_LOAD_ERROR', error }),
    
    updateInput: (value: string) => 
      send({ type: 'INPUT_CHANGE', value }),
    
    submit: () => 
      send({ type: 'SUBMIT' }),
    
    resultReceived: (result: TranslationResult) => 
      send({ type: 'RESULT_RECEIVED', result }),
    
    nextWord: () => 
      send({ type: 'NEXT_WORD' }),
    
    timerTick: () => 
      send({ type: 'TIMER_TICK' }),
    
    timerEnd: () => 
      send({ type: 'TIMER_END' }),
    
    reset: () => 
      send({ type: 'RESET' }),
    
    toggleMode: () => 
      send({ type: 'TOGGLE_MODE' }),
  };

  return {
    context: state.context,
    state: state.value as QuizState,
    is,
    actions,
  };
}