import { useState, useCallback, useEffect, useRef } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_RANDOM_WORD, CHECK_TRANSLATION, GET_CATEGORIES } from '../graphql/operations';

export function useTranslation() {
  // Stan gry
  const [gameState, setGameState] = useState('setup');
  const [quizMode, setQuizMode] = useState(null);
  const [quizSettings, setQuizSettings] = useState({
    wordLimit: 10,
    timeLimit: 300,
    customLimit: 10,
  });

  // Filtry
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

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

  // Tryb utrwalania wiedzy
  const [reinforceMode, setReinforceMode] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [incorrectWords, setIncorrectWords] = useState([]);
  const [roundIncorrectWords, setRoundIncorrectWords] = useState([]);
  const [wordsInCurrentRound, setWordsInCurrentRound] = useState(0);
  const [totalStats, setTotalStats] = useState({ correct: 0, incorrect: 0, rounds: 0 });

  // Pobierz kategorie
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const categories = categoriesData?.getCategories || [];

  // GraphQL operations
  const [fetchWord, { loading: loadingWord }] = useLazyQuery(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const word = data.getRandomWord;
      
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

      // Śledź błędne słowa w trybie utrwalania
      let updatedIncorrectWords = roundIncorrectWords;
      if (reinforceMode && !translationResult.isCorrect && currentWord) {
        updatedIncorrectWords = [...roundIncorrectWords, currentWord];
        setRoundIncorrectWords(updatedIncorrectWords);
      }

      // Sprawdź czy runda się skończyła
      if (reinforceMode) {
        if (newWordsCompleted >= wordsInCurrentRound) {
          setTimeout(() => endRound(updatedIncorrectWords), 1500);
        }
      } else if ((quizMode === 'limit' || quizMode === 'custom') && 
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
      default: return quizSettings.wordLimit;
    }
  }, [quizMode, quizSettings]);

  // Zakończ rundę (dla trybu utrwalania)
  const endRound = useCallback((incorrectList = roundIncorrectWords) => {
    setTotalStats(prev => ({
      correct: prev.correct + stats.correct,
      incorrect: prev.incorrect + stats.incorrect,
      rounds: prev.rounds + 1,
    }));

    if (incorrectList.length === 0) {
      setGameState('finished');
    } else {
      setIncorrectWords(incorrectList);
      setGameState('roundEnd');
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [stats, roundIncorrectWords]);

  // Rozpocznij następną rundę z błędnymi słowami
  const startNextRound = useCallback(() => {
    setCurrentRound(prev => prev + 1);
    setWordsInCurrentRound(incorrectWords.length);
    setRoundIncorrectWords([]);
    setUsedWordIds(new Set());
    setWordsCompleted(0);
    setStats({ correct: 0, incorrect: 0 });
    setCurrentWord(null);
    setResult(null);
    setUserInput('');
    setGameState('playing');

    if (incorrectWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * incorrectWords.length);
      const word = incorrectWords[randomIndex];
      setCurrentWord(word);
      setUsedWordIds(new Set([word.id]));
    }
  }, [incorrectWords]);

  // Pobierz następne słowo z błędnych
  const getNextWordFromIncorrect = useCallback(() => {
    const unusedWords = incorrectWords.filter(w => !usedWordIds.has(w.id));
    
    if (unusedWords.length === 0) {
      endRound();
      return;
    }

    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    const word = unusedWords[randomIndex];
    setCurrentWord(word);
    setUsedWordIds(prev => new Set([...prev, word.id]));
    setResult(null);
    setUserInput('');
  }, [incorrectWords, usedWordIds, endRound]);

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
    setReinforceMode(false);
    setCurrentRound(1);
    setIncorrectWords([]);
    setRoundIncorrectWords([]);
    setTotalStats({ correct: 0, incorrect: 0, rounds: 0 });
    
    if (selectedMode === 'timed') {
      setTimeRemaining(settings.timeLimit || quizSettings.timeLimit);
    }
    
    fetchWord({ 
      variables: { 
        mode,
        category: selectedCategory,
        difficulty: selectedDifficulty
      } 
    });
  }, [fetchWord, mode, selectedCategory, selectedDifficulty, quizSettings.timeLimit]);

  // Rozpocznij quiz z trybem utrwalania
  const startQuizWithReinforce = useCallback((selectedMode, settings = {}) => {
    setReinforceMode(true);
    setQuizMode(selectedMode);
    setQuizSettings(prev => ({ ...prev, ...settings }));
    setGameState('playing');
    setWordsCompleted(0);
    setUsedWordIds(new Set());
    setStats({ correct: 0, incorrect: 0 });
    setCurrentWord(null);
    setResult(null);
    setUserInput('');
    setCurrentRound(1);
    setIncorrectWords([]);
    setRoundIncorrectWords([]);
    setWordsInCurrentRound(settings.wordLimit || settings.customLimit || quizSettings.wordLimit);
    setTotalStats({ correct: 0, incorrect: 0, rounds: 0 });
    
    fetchWord({ 
      variables: { 
        mode,
        category: selectedCategory,
        difficulty: selectedDifficulty
      } 
    });
  }, [fetchWord, mode, selectedCategory, selectedDifficulty, quizSettings.wordLimit]);

  const getNewWord = useCallback(() => {
    // W trybie utrwalania z błędnymi słowami
    if (reinforceMode && currentRound > 1) {
      getNextWordFromIncorrect();
      return;
    }

    if ((quizMode === 'limit' || quizMode === 'custom') && 
        wordsCompleted >= getWordLimit()) {
      if (reinforceMode) {
        endRound();
      } else {
        endQuiz();
      }
      return;
    }
    
    fetchWord({ 
      variables: { 
        mode,
        category: selectedCategory,
        difficulty: selectedDifficulty
      } 
    });
  }, [fetchWord, mode, selectedCategory, selectedDifficulty, quizMode, wordsCompleted, getWordLimit, endQuiz, reinforceMode, currentRound, getNextWordFromIncorrect, endRound]);

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
    setReinforceMode(false);
    setCurrentRound(1);
    setIncorrectWords([]);
    setRoundIncorrectWords([]);
    setTotalStats({ correct: 0, incorrect: 0, rounds: 0 });
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
    
    // Filtry
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    
    // Tryb utrwalania
    reinforceMode,
    currentRound,
    incorrectWords,
    totalStats,
    wordsInCurrentRound,
    
    // Akcje
    setUserInput,
    startQuiz,
    startQuizWithReinforce,
    startNextRound,
    getNewWord,
    submitTranslation,
    toggleMode,
    resetQuiz,
  };
}