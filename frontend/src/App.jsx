import { useEffect, useRef } from 'react';
import { useTranslation } from './hooks/useTranslation';

function App() {
  const {
    mode,
    currentWord,
    result,
    userInput,
    stats,
    loading,
    setUserInput,
    getNewWord,
    submitTranslation,
    toggleMode,
  } = useTranslation();

  const inputRef = useRef(null);

  // Globalny listener na Enter dla "Następne słowo"
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && result && !loading) {
        getNewWord();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [result, loading, getNewWord]);

  // Ustaw focus na inpucie po pojawieniu się nowego słowa
  useEffect(() => {
    if (currentWord && !result && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, result]);

  // Tekst zależny od trybu
  const modeLabel = mode === 'EN_TO_PL' ? 'EN → PL' : 'PL → EN';
  const sourceLanguage = mode === 'EN_TO_PL' ? 'angielski' : 'polski';
  const targetLanguage = mode === 'EN_TO_PL' ? 'polski' : 'angielski';

  // Obsługa klawisza Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (result) {
        getNewWord();
      } else if (currentWord && userInput.trim()) {
        submitTranslation();
      }
    }
  };

  // Klasa inputu zależna od wyniku
  const getInputClass = () => {
    if (!result) return 'input-group__input';
    return `input-group__input ${result.isCorrect ? 'input-group__input--correct' : 'input-group__input--incorrect'}`;
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="header__title">Translator</h1>
        <p className="header__subtitle">Ucz się słówek przez tłumaczenie</p>
      </header>

      {/* Main Card */}
      <main className="card">
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
            ) : currentWord ? (
              currentWord.wordToTranslate
            ) : (
              <span className="word-display__placeholder">
                Kliknij "Nowe słowo" aby zacząć
              </span>
            )}
          </div>
          {currentWord?.category && (
            <div className="word-display__category">{currentWord.category}</div>
          )}
        </div>

        {/* Input */}
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
            autoFocus
          />
        </div>

        {/* Result */}
        {result && (
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
          {!result ? (
            <>
              <button
                className="btn btn--secondary"
                onClick={getNewWord}
                disabled={loading}
              >
                {currentWord ? 'Pomiń' : 'Nowe słowo'}
              </button>
              <button
                className="btn btn--primary"
                onClick={submitTranslation}
                disabled={!currentWord || !userInput.trim() || loading}
              >
                Sprawdź
              </button>
            </>
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

      {/* Mode Toggle - Bottom Right Corner */}
      <button className="mode-toggle" onClick={toggleMode} title="Zmień kierunek tłumaczenia">
        <span className="mode-toggle__label">Tryb:</span>
        <span className="mode-toggle__value">{modeLabel}</span>
        <svg className="mode-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
    </div>
  );
}

export default App;
