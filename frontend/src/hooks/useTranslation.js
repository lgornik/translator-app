import { useState, useCallback, useEffect, useRef } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_RANDOM_WORD, CHECK_TRANSLATION } from '../graphql/operations';

export function useTranslation() {
  // Stan gry
  const [gameState, setGameState] = useState('setup');
  const [quizMode, setQuizMode] = useState(null);
  const [quizSettings, setQuizSettings] = useState({
    wordLimit: 10,
    timeLimit: 300,
    customLimit: 10,
  });

  // Stan tłumaczenia
  const [mode, setMode] = useState('EN_TO_PL');
  const [currentWord, setCurrentWord] = useState(null);
  const [result, setResult] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  
  // Stan quizu
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  // GraphQL operations
  const [fetchWord, { loading: loadingWord }] = useLazyQuery(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const word = data.getRandomWord;
      
      if (quizMode === 'all' && usedWordIds.has(word.id)) {
        endQuiz();
        return;
      }
      
      setCurrentWord(word);
      setUsedWordIds(prev => new Set([...prev, word.id]));
      setResult(null);
      setUserInput('');
    },
    onError: (error) => {
      console.error('Error fetching word:', error);
    },
  });

  const [checkTranslation, { loading: checkingTranslation }] = useMutation(CHECK_TRANSLATION, {
    onCompleted: (data) => {
      const translationResult = data.checkTranslation;
      setResult(translationResult);
      
      const newWordsCompleted = wordsCompleted + 1;
      setWordsCompleted(newWordsCompleted);
      
      setStats((prev) => ({
        correct: prev.correct + (translationResult.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (translationResult.isCorrect ? 0 : 1),
      }));

      if ((quizMode === 'limit' || quizMode === 'custom') && 
          newWordsCompleted >= getWordLimit()) {
        setTimeout(() => endQuiz(), 1500);
      }
    },
    onError: (error) => {
      console.error('Error checking translation:', error);
    },
  });

  // Timer dla trybu czasowego
  useEffect(() => {
    if (gameState === 'playing' && quizMode === 'timed' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, quizMode]);

  const getWordLimit = useCallback(() => {
    switch (quizMode) {
      case 'limit': return quizSettings.wordLimit;
      case 'custom': return quizSettings.customLimit;
      default: return Infinity;
    }
  }, [quizMode, quizSettings]);

  const endQuiz = useCallback(() => {
    setGameState('finished');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const startQuiz = useCallback((selectedMode, settings = {}) => {
    setQuizMode(selectedMode);
    setQuizSettings(prev => ({ ...prev, ...settings }));
    setGameState('playing');
    setWordsCompleted(0);
    setUsedWordIds(new Set());
    setStats({ correct: 0, incorrect: 0 });
    setCurrentWord(null);
    setResult(null);
    setUserInput('');
    
    if (selectedMode === 'timed') {
      setTimeRemaining(settings.timeLimit || quizSettings.timeLimit);
    }
    
    fetchWord({ variables: { mode } });
  }, [fetchWord, mode, quizSettings.timeLimit]);

  const getNewWord = useCallback(() => {
    if ((quizMode === 'limit' || quizMode === 'custom') && 
        wordsCompleted >= getWordLimit()) {
      endQuiz();
      return;
    }
    
    fetchWord({ variables: { mode } });
  }, [fetchWord, mode, quizMode, wordsCompleted, getWordLimit, endQuiz]);

  const submitTranslation = useCallback(() => {
    if (!currentWord || !userInput.trim()) return;

    checkTranslation({
      variables: {
        wordId: currentWord.id,
        userTranslation: userInput.trim(),
        mode,
      },
    });
  }, [checkTranslation, currentWord, userInput, mode]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'EN_TO_PL' ? 'PL_TO_EN' : 'EN_TO_PL');
  }, []);

  const resetQuiz = useCallback(() => {
    setGameState('setup');
    setQuizMode(null);
    setCurrentWord(null);
    setResult(null);
    setUserInput('');
    setWordsCompleted(0);
    setUsedWordIds(new Set());
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    gameState,
    quizMode,
    quizSettings,
    wordsCompleted,
    timeRemaining,
    formatTime,
    getWordLimit,
    mode,
    currentWord,
    result,
    userInput,
    stats,
    loading: loadingWord || checkingTranslation,
    setUserInput,
    startQuiz,
    getNewWord,
    submitTranslation,
    toggleMode,
    resetQuiz,
  };
}