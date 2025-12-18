import { useState, useCallback, useEffect, useRef } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_RANDOM_WORD, CHECK_TRANSLATION, GET_CATEGORIES, GET_WORD_COUNT } from '../graphql/operations';

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
  const [shuffledQueue, setShuffledQueue] = useState([]);
  
  // Stan quizu
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  // Tryb utrwalania wiedzy
  const [reinforceMode, setReinforceMode] = useState(false);
  const [wordsToRepeat, setWordsToRepeat] = useState([]); // Słowa do powtórki
  const [masteredCount, setMasteredCount] = useState(0); // Opanowane słowa
  const [lastWordId, setLastWordId] = useState(null);
  const [noMoreWords, setNoMoreWords] = useState(false);

  // Pobierz kategorie
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const categories = categoriesData?.getCategories || [];

  // GraphQL operations
  const [fetchWord, { loading: loadingWord }] = useLazyQuery(GET_RANDOM_WORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const word = data.getRandomWord;
      
      // Sprawdź czy słowo już było użyte (brak nowych słów)
      if (usedWordIds.has(word.id)) {
        if (quizMode === 'timed') {
          setNoMoreWords(true);
        } else {
          endQuiz();
        }
        return;
      }
      
      setCurrentWord(word);
      setUsedWordIds(prev => new Set([...prev, word.id]));
      setResult(null);
      setUserInput('');
      setNoMoreWords(false);
    },
    onError: (error) => {
      console.error('Error fetching word:', error);
      if (quizMode === 'timed') {
        setNoMoreWords(true);
      }
    },
  });

  const [checkTranslation, { loading: checkingTranslation }] = useMutation(CHECK_TRANSLATION, {
    onCompleted: (data) => {
      const translationResult = data.checkTranslation;
      setResult(translationResult);
      
      setStats((prev) => ({
        correct: prev.correct + (translationResult.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (translationResult.isCorrect ? 0 : 1),
      }));

      if (reinforceMode) {
        if (translationResult.isCorrect) {
          // Usuń słowo z listy do powtórki (jeśli tam było)
          setWordsToRepeat(prev => prev.filter(w => w.id !== currentWord.id));
          // Usuń też z kolejki
          setShuffledQueue(prev => prev.filter(w => w.id !== currentWord.id));
          setMasteredCount(prev => prev + 1);
          
          // Sprawdź czy to było ostatnie słowo
          const newWordsToRepeat = wordsToRepeat.filter(w => w.id !== currentWord.id);
          const wordsLeft = (getWordLimit() - masteredCount - 1) + newWordsToRepeat.length;
          
          if (wordsLeft <= 0 && newWordsToRepeat.length === 0) {
            setTimeout(() => endQuiz(), 1500);
          }
        } else {
          // Dodaj do listy powtórek (jeśli jeszcze nie ma)
          if (!wordsToRepeat.find(w => w.id === currentWord.id)) {
            setWordsToRepeat(prev => [...prev, currentWord]);
          }
        }
      } else {
        const newWordsCompleted = wordsCompleted + 1;
        setWordsCompleted(newWordsCompleted);
        
        if ((quizMode === 'limit' || quizMode === 'custom') && 
            newWordsCompleted >= getWordLimit()) {
          setTimeout(() => endQuiz(), 1500);
        }
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

  const endQuiz = useCallback(() => {
    setGameState('finished');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Pobierz liczbę słów
  const { data: wordCountData, refetch: refetchWordCount } = useQuery(GET_WORD_COUNT, {
    variables: { category: selectedCategory, difficulty: selectedDifficulty },
  });
  const availableWordCount = wordCountData?.getWordCount?.count || 0;

  // Odśwież liczbę słów gdy zmienią się filtry
  useEffect(() => {
    refetchWordCount({ category: selectedCategory, difficulty: selectedDifficulty });
  }, [selectedCategory, selectedDifficulty, refetchWordCount]);

  // Funkcja tasująca tablicę (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
    setWordsToRepeat([]);
    setMasteredCount(0);
    setNoMoreWords(false);  // ← dodaj
    
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
    setWordsToRepeat([]);
    setMasteredCount(0);
    setNoMoreWords(false);  // ← dodaj
    
    fetchWord({ 
      variables: { 
        mode,
        category: selectedCategory,
        difficulty: selectedDifficulty
      } 
    });
  }, [fetchWord, mode, selectedCategory, selectedDifficulty]);

  const getNewWord = useCallback(() => {
    setResult(null);
    setUserInput('');

    if (reinforceMode) {
      const newWordsRemaining = getWordLimit() - masteredCount - (wordsToRepeat.find(w => w.id === currentWord?.id) ? 0 : 1);
      
      if (newWordsRemaining > 0 && usedWordIds.size < getWordLimit()) {
        setLastWordId(currentWord?.id);
        fetchWord({ 
          variables: { 
            mode,
            category: selectedCategory,
            difficulty: selectedDifficulty
          } 
        });
      } else if (wordsToRepeat.length > 0) {
        // Jeśli kolejka pusta, przetasuj na nowo
        let queue = shuffledQueue;
        if (queue.length === 0) {
          // Użyj aktualnego słowa jako ostatniego
          const lastId = currentWord?.id;
          
          queue = shuffleArray(wordsToRepeat);
          
          // Jeśli pierwsze słowo jest takie samo jak ostatnie, przesuń je na koniec
          if (queue.length > 1 && queue[0].id === lastId) {
            const firstWord = queue[0];
            queue = [...queue.slice(1), firstWord];
          }
        }
        
        // Weź pierwsze słowo z kolejki
        const word = queue[0];
        const newQueue = queue.slice(1);
        
        setLastWordId(word.id);
        setShuffledQueue(newQueue);
        setCurrentWord(word);
      } else {
        endQuiz();
      }
    } else {
      if ((quizMode === 'limit' || quizMode === 'custom') && 
          wordsCompleted >= getWordLimit()) {
        endQuiz();
        return;
      }
      
      fetchWord({ 
        variables: { 
          mode,
          category: selectedCategory,
          difficulty: selectedDifficulty
        } 
      });
    }
  }, [fetchWord, mode, selectedCategory, selectedDifficulty, quizMode, wordsCompleted, getWordLimit, endQuiz, reinforceMode, wordsToRepeat, masteredCount, usedWordIds, currentWord, shuffledQueue, lastWordId]);

  const submitTranslation = useCallback(() => {
    if (!currentWord) return;

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
    setWordsToRepeat([]);
    setMasteredCount(0);
    setShuffledQueue([]);
    setLastWordId(null);
    setNoMoreWords(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Oblicz postęp dla trybu utrwalania
  const getProgress = useCallback(() => {
    if (reinforceMode) {
      return {
        mastered: masteredCount,
        total: getWordLimit(),
        toRepeat: wordsToRepeat.length
      };
    }
    return {
      completed: wordsCompleted,
      total: getWordLimit()
    };
  }, [reinforceMode, masteredCount, wordsToRepeat.length, wordsCompleted, getWordLimit]);

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
    wordsToRepeat,
    masteredCount,
    getProgress,
    
    // Akcje
    setUserInput,
    startQuiz,
    startQuizWithReinforce,
    getNewWord,
    submitTranslation,
    toggleMode,
    resetQuiz,
    availableWordCount,
    noMoreWords
  };
}