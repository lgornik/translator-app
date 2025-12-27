import { useRef, useEffect } from 'react';
import { Button, Input } from '@/shared/components/ui';
import { Loading } from '@/shared/components/feedback/Loading';
import { formatTime } from '@/shared/utils';
import type { WordChallenge, TranslationResult, QuizStats } from '@/shared/types';

interface QuizPlayingProps {
  mode: 'EN_TO_PL' | 'PL_TO_EN';
  currentWord: WordChallenge | null;
  userInput: string;
  result: TranslationResult | null;
  stats: QuizStats;
  wordsCompleted: number;
  wordLimit: number;
  timeRemaining: number;
  reinforceMode: boolean;
  masteredCount: number;
  wordsToRepeatCount: number;
  noMoreWords: boolean;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onNextWord: () => void;
  onReset: () => void;
}

/**
 * Quiz playing screen - word display, input, results
 * Fully accessible with ARIA live regions
 */
export function QuizPlaying({
  mode,
  currentWord,
  userInput,
  result,
  stats,
  wordsCompleted,
  wordLimit,
  timeRemaining,
  reinforceMode,
  masteredCount,
  wordsToRepeatCount,
  noMoreWords,
  loading,
  onInputChange,
  onSubmit,
  onNextWord,
  onReset,
}: QuizPlayingProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceLanguage = mode === 'EN_TO_PL' ? 'angielski' : 'polski';
  const targetLanguage = mode === 'EN_TO_PL' ? 'polski' : 'angielski';
  const isTimedMode = timeRemaining > 0 || (wordLimit === 999);

  // Focus input when ready for input
  useEffect(() => {
    if (currentWord && !result && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, result]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !result && currentWord) {
      onSubmit();
    }
  };

  const getInputState = () => {
    if (!result) return 'default' as const;
    return result.isCorrect ? 'correct' as const : 'incorrect' as const;
  };

  // Progress display
  const renderProgress = () => {
    if (isTimedMode) {
      return (
        <div 
          className="quiz-progress__timer"
          role="timer"
          aria-label={`Pozostały czas: ${formatTime(timeRemaining)}`}
        >
          <span aria-hidden="true">⏱️</span> {formatTime(timeRemaining)}
        </div>
      );
    }

    if (reinforceMode) {
      return (
        <div className="quiz-progress__info" role="status" aria-live="polite">
          <div className="quiz-progress__counter" aria-label={`Opanowano ${masteredCount} z ${wordLimit} słów`}>
            <span aria-hidden="true">✓</span> {masteredCount} / {wordLimit}
          </div>
          {wordsToRepeatCount > 0 && (
            <div className="quiz-progress__repeat" aria-label={`${wordsToRepeatCount} słów do powtórki`}>
              <span aria-hidden="true">🔄</span> {wordsToRepeatCount} do powtórki
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        className="quiz-progress__counter"
        role="status"
        aria-live="polite"
        aria-label={`Ukończono ${wordsCompleted} z ${wordLimit} słów`}
      >
        {wordsCompleted} / {wordLimit}
      </div>
    );
  };

  return (
    <section aria-label="Quiz">
      {/* Progress bar */}
      <div className="quiz-progress">
        {renderProgress()}
        <Button 
          variant="text" 
          onClick={onReset}
          aria-label="Zakończ quiz"
        >
          <span aria-hidden="true">✕</span> Zakończ
        </Button>
      </div>

      {/* Word Display */}
      <div 
        className="word-display"
        role="region"
        aria-label="Słowo do przetłumaczenia"
      >
        <div className="word-display__label" id="translation-instruction">
          Przetłumacz z {sourceLanguage} na {targetLanguage}
        </div>
        <div 
          className="word-display__word"
          aria-live="polite"
          aria-atomic="true"
        >
          {loading && !currentWord ? (
            <Loading size="small" />
          ) : noMoreWords ? (
            <span className="word-display__no-words" role="alert">
              Brak więcej słów dla wybranych kryteriów
            </span>
          ) : currentWord ? (
            <span lang={mode === 'EN_TO_PL' ? 'en' : 'pl'}>
              {currentWord.wordToTranslate}
            </span>
          ) : (
            <span className="word-display__placeholder">Ładowanie...</span>
          )}
        </div>
        {currentWord?.category && !noMoreWords && (
          <div className="word-display__category" aria-label={`Kategoria: ${currentWord.category}`}>
            {currentWord.category}
          </div>
        )}
      </div>

      {/* Input - hide when no more words */}
      {!noMoreWords && (
        <Input
          ref={inputRef}
          label="Twoje tłumaczenie"
          placeholder={`Wpisz tłumaczenie po ${targetLanguage}u...`}
          value={userInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!currentWord || loading || !!result}
          state={getInputState()}
          autoComplete="off"
          aria-describedby="translation-instruction"
        />
      )}

      {/* Result - with live region for screen readers */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {result && (
          result.isCorrect 
            ? 'Odpowiedź poprawna!' 
            : `Odpowiedź niepoprawna. Poprawna odpowiedź to: ${result.correctTranslation}`
        )}
      </div>
      
      {result && !noMoreWords && (
        <div
          className={`result ${
            result.isCorrect ? 'result--correct' : 'result--incorrect'
          }`}
          aria-hidden="true"
        >
          <div className="result__message">
            {result.isCorrect ? '✓ Świetnie!' : '✗ Niestety nie...'}
          </div>
          {!result.isCorrect && (
            <div className="result__answer">
              Poprawna odpowiedź: <span lang={mode === 'EN_TO_PL' ? 'pl' : 'en'}>{result.correctTranslation}</span>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="button-group" role="group" aria-label="Akcje quizu">
        {noMoreWords ? (
          <Button onClick={onReset} aria-label="Zakończ quiz">
            Zakończ quiz
          </Button>
        ) : !result ? (
          <Button 
            onClick={onSubmit} 
            disabled={!currentWord || loading}
            aria-label="Sprawdź odpowiedź"
          >
            Sprawdź
          </Button>
        ) : (
          <Button 
            onClick={onNextWord} 
            disabled={loading}
            aria-label="Przejdź do następnego słowa"
          >
            Następne słowo <span aria-hidden="true">→</span>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div 
        className="stats" 
        role="region" 
        aria-label="Statystyki quizu"
      >
        <div className="stats__item">
          <div className="stats__value stats__value--correct" aria-hidden="true">
            {stats.correct}
          </div>
          <div className="stats__label">Poprawne</div>
          <span className="sr-only">{stats.correct} poprawnych odpowiedzi</span>
        </div>
        <div className="stats__item">
          <div className="stats__value stats__value--incorrect" aria-hidden="true">
            {stats.incorrect}
          </div>
          <div className="stats__label">Błędne</div>
          <span className="sr-only">{stats.incorrect} błędnych odpowiedzi</span>
        </div>
        <div className="stats__item">
          <div className="stats__value" aria-hidden="true">
            {stats.correct + stats.incorrect > 0
              ? Math.round(
                  (stats.correct / (stats.correct + stats.incorrect)) * 100
                )
              : 0}
            %
          </div>
          <div className="stats__label">Skuteczność</div>
          <span className="sr-only">
            Skuteczność: {stats.correct + stats.incorrect > 0
              ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
              : 0} procent
          </span>
        </div>
      </div>
    </section>
  );
}
