import { useState, useCallback } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_RANDOM_WORD, CHECK_TRANSLATION } from '../graphql/operations';

export function useTranslation() {
  // Stan
  const [mode, setMode] = useState('EN_TO_PL'); // 'EN_TO_PL' lub 'PL_TO_EN'
  const [currentWord, setCurrentWord] = useState(null);
  const [result, setResult] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  // GraphQL operations
  const [fetchWord, { loading: loadingWord }] = useLazyQuery(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setCurrentWord(data.getRandomWord);
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
      
      // Aktualizuj statystyki
      setStats((prev) => ({
        correct: prev.correct + (translationResult.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (translationResult.isCorrect ? 0 : 1),
      }));
    },
    onError: (error) => {
      console.error('Error checking translation:', error);
    },
  });

  // Akcje
  const getNewWord = useCallback(() => {
    fetchWord({ variables: { mode } });
  }, [fetchWord, mode]);

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
    const newMode = mode === 'EN_TO_PL' ? 'PL_TO_EN' : 'EN_TO_PL';
    setMode(newMode);
    setCurrentWord(null);
    setResult(null);
    setUserInput('');
  }, [mode]);

  const resetStats = useCallback(() => {
    setStats({ correct: 0, incorrect: 0 });
  }, []);

  return {
    // Stan
    mode,
    currentWord,
    result,
    userInput,
    stats,
    loading: loadingWord || checkingTranslation,
    
    // Akcje
    setUserInput,
    getNewWord,
    submitTranslation,
    toggleMode,
    resetStats,
  };
}
