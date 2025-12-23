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
        <div className="quiz-progress__timer">
          ⏱️ {formatTime(timeRemaining)}
        </div>
      );
    }

    if (reinforceMode) {
      return (
        <div className="quiz-progress__info">
          <div className="quiz-progress__counter">
            ✓ {masteredCount} / {wordLimit}
          </div>
          {wordsToRepeatCount > 0 && (
            <div className="quiz-progress__repeat">
              🔄 {wordsToRepeatCount} do powtórki
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="quiz-progress__counter">
        {wordsCompleted} / {wordLimit}
      </div>
    );
  };

  return (
    <>
      {/* Progress bar */}
      <div className="quiz-progress">
        {renderProgress()}
        <Button variant="text" onClick={onReset}>
          ✕ Zakończ
        </Button>
      </div>

      {/* Word Display */}
      <div className="word-display">
        <div className="word-display__label">
          Przetłumacz z {sourceLanguage} na {targetLanguage}
        </div>
        <div className="word-display__word">
          {loading && !currentWord ? (
            <Loading size="small" />
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
        />
      )}

      {/* Result */}
      {result && !noMoreWords && (
        <div
          className={`result ${
            result.isCorrect ? 'result--correct' : 'result--incorrect'
          }`}
        >
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
          <Button onClick={onReset}>Zakończ quiz</Button>
        ) : !result ? (
          <Button onClick={onSubmit} disabled={!currentWord || loading}>
            Sprawdź
          </Button>
        ) : (
          <Button onClick={onNextWord} disabled={loading}>
            Następne słowo →
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stats__item">
          <div className="stats__value stats__value--correct">{stats.correct}</div>
          <div className="stats__label">Poprawne</div>
        </div>
        <div className="stats__item">
          <div className="stats__value stats__value--incorrect">
            {stats.incorrect}
          </div>
          <div className="stats__label">Błędne</div>
        </div>
        <div className="stats__item">
          <div className="stats__value">
            {stats.correct + stats.incorrect > 0
              ? Math.round(
                  (stats.correct / (stats.correct + stats.incorrect)) * 100
                )
              : 0}
            %
          </div>
          <div className="stats__label">Skuteczność</div>
        </div>
      </div>
    </>
  );
}
