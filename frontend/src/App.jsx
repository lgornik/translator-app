import { useEffect, useRef } from 'react';
import { useTranslation } from './hooks/useTranslation';
import QuizSetup from './components/QuizSetup';
import QuizFinished from './components/QuizFinished';

function App() {
  const {
    gameState,
    quizMode,
    wordsCompleted,
    timeRemaining,
    formatTime,
    getWordLimit,
    mode,
    currentWord,
    result,
    userInput,
    stats,
    loading,
    setUserInput,
    startQuiz,
    startQuizWithReinforce,
    getNewWord,
    submitTranslation,
    toggleMode,
    resetQuiz,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    reinforceMode,
    wordsToRepeat,
    masteredCount,
    getProgress,
    availableWordCount,
    noMoreWords
  } = useTranslation();

  const inputRef = useRef(null);

  // Globalny listener na Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && result && !loading && gameState === 'playing') {
        getNewWord();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [result, loading, getNewWord, gameState]);

  // Focus na input po nowym słowie lub po kliknięciu Enter
  useEffect(() => {
    if (currentWord && !result && inputRef.current && gameState === 'playing') {
      inputRef.current.focus();
    }
  }, [currentWord, result, gameState]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentWord && !result) {
      submitTranslation();
    }
  };

  const getInputClass = () => {
    if (!result) return 'input-group__input';
    return `input-group__input ${result.isCorrect ? 'input-group__input--correct' : 'input-group__input--incorrect'}`;
  };

  const modeLabel = mode === 'EN_TO_PL' ? 'EN → PL' : 'PL → EN';
  const sourceLanguage = mode === 'EN_TO_PL' ? 'angielski' : 'polski';
  const targetLanguage = mode === 'EN_TO_PL' ? 'polski' : 'angielski';

  // Ekran wyboru trybu
  if (gameState === 'setup') {
    return (
      <div className="app">
        <header className="header">
          <h1 className="header__title">Translator</h1>
          <p className="header__subtitle">Ucz się słówek przez tłumaczenie</p>
        </header>
        <main className="card">
          <QuizSetup 
            onStart={startQuiz}
            onStartWithReinforce={startQuizWithReinforce}
            mode={mode} 
            onToggleMode={toggleMode}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            availableWordCount={availableWordCount}
          />
        </main>
        <button className="mode-toggle" onClick={toggleMode} title="Zmień kierunek tłumaczenia">
          <span className="mode-toggle__label">Tryb:</span>
          <span className="mode-toggle__value">{modeLabel}</span>
        </button>
      </div>
    );
  }

  // Ekran zakończenia quizu
  if (gameState === 'finished') {
    return (
      <div className="app">
        <header className="header">
          <h1 className="header__title">Translator</h1>
          <p className="header__subtitle">Quiz zakończony!</p>
        </header>
        <main className="card">
          <QuizFinished 
            stats={stats} 
            wordsCompleted={reinforceMode ? masteredCount : wordsCompleted} 
            onRestart={resetQuiz}
            reinforceMode={reinforceMode}
          />
        </main>
      </div>
    );
  }

  // Ekran gry
  const progress = getProgress();

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">Translator</h1>
        <p className="header__subtitle">Ucz się słówek przez tłumaczenie</p>
      </header>

      <main className="card">
        {/* Progress bar */}
        <div className="quiz-progress">
          {quizMode === 'timed' ? (
            <div className="quiz-progress__timer">
              ⏱️ {formatTime(timeRemaining)}
            </div>
          ) : reinforceMode ? (
            <div className="quiz-progress__info">
              <div className="quiz-progress__counter">
                ✓ {progress.mastered} / {progress.total}
              </div>
            </div>
          ) : (
            <div className="quiz-progress__counter">
              {progress.completed} / {progress.total}
            </div>
          )}
          <button className="btn btn--text" onClick={resetQuiz}>
            ✕ Zakończ
          </button>
        </div>

        {/* Word Display */}
        <div className="word-display">
          <div className="word-display__label">
            Przetłumacz z {sourceLanguage} na {targetLanguage}
          </div>
          <div className="word-display__word">
            {loading && !currentWord ? (
              <div className="loading">
                <div className="loading__spinner" />
                <span>Ładowanie...</span>
              </div>
            ) : noMoreWords ? (
              <span className="word-display__no-words">
                Brak więcej słów dla wybranych kryteriów
              </span>
            ) : currentWord ? (
              currentWord.wordToTranslate
            ) : (
              <span className="word-display__placeholder">Ładowanie...</span>
            )}
          </div>
          {currentWord?.category && !noMoreWords && (
            <div className="word-display__category">{currentWord.category}</div>
          )}
        </div>

        {/* Input - ukryj gdy brak słów */}
        {!noMoreWords && (
          <div className="input-group">
            <label className="input-group__label" htmlFor="translation">
              Twoje tłumaczenie
            </label>
            <input
              ref={inputRef}
              id="translation"
              type="text"
              className={getInputClass()}
              placeholder={`Wpisz tłumaczenie po ${targetLanguage}u...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!currentWord || loading}
              autoComplete="off"
            />
          </div>
        )}

        {/* Result */}
        {result && !noMoreWords && (
          <div className={`result ${result.isCorrect ? 'result--correct' : 'result--incorrect'}`}>
            <div className="result__message">
              {result.isCorrect ? '✓ Świetnie!' : '✗ Niestety nie...'}
            </div>
            {!result.isCorrect && (
              <div className="result__answer">
                Poprawna odpowiedź: {result.correctTranslation}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="button-group">
          {noMoreWords ? (
            <button
              className="btn btn--primary"
              onClick={resetQuiz}
            >
              Zakończ quiz
            </button>
          ) : !result ? (
            <button
              className="btn btn--primary"
              onClick={submitTranslation}
              disabled={!currentWord || loading}
            >
              Sprawdź
            </button>
          ) : (
            <button
              className="btn btn--primary"
              onClick={getNewWord}
              disabled={loading}
            >
              Następne słowo →
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stats__item">
            <div className="stats__value stats__value--correct">{stats.correct}</div>
            <div className="stats__label">Poprawne</div>
          </div>
          <div className="stats__item">
            <div className="stats__value stats__value--incorrect">{stats.incorrect}</div>
            <div className="stats__label">Błędne</div>
          </div>
          <div className="stats__item">
            <div className="stats__value">
              {stats.correct + stats.incorrect > 0
                ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
                : 0}%
            </div>
            <div className="stats__label">Skuteczność</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;