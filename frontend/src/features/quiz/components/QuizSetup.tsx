import { useState, useCallback, useEffect } from 'react';
import { Button, Select, Input } from '@/shared/components/ui';
import { QUIZ_DEFAULTS, DIFFICULTY_CONFIG } from '@/shared/constants';
import type { Difficulty } from '@/shared/types';

interface QuizSetupProps {
  mode: 'EN_TO_PL' | 'PL_TO_EN';
  categories: string[];
  availableWordCount: number;
  onStart: (settings: QuizStartSettings) => void;
  onStartWithReinforce: (settings: QuizStartSettings) => void;
  onToggleMode: () => void;
  onFiltersChange?: (category: string | null, difficulty: Difficulty | null) => void;
}

interface QuizStartSettings {
  wordLimit?: number;
  timeLimit?: number;
  category?: string | null;
  difficulty?: Difficulty | null;
  mode?: 'EN_TO_PL' | 'PL_TO_EN';
}

/**
 * Quiz setup/configuration screen
 */
export function QuizSetup({
  mode,
  categories,
  availableWordCount,
  onStart,
  onStartWithReinforce,
  onToggleMode,
  onFiltersChange,
}: QuizSetupProps) {
  const [customWords, setCustomWords] = useState(QUIZ_DEFAULTS.WORD_LIMIT);
  const [customTime, setCustomTime] = useState(5);
  const [useReinforce, setUseReinforce] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const modeLabel = mode === 'EN_TO_PL' ? 'EN → PL' : 'PL → EN';

  const difficultyOptions = [
    { value: '', label: 'Wszystkie poziomy' },
    ...Object.entries(DIFFICULTY_CONFIG).map(([value, config]) => ({
      value,
      label: `${config.emoji} ${config.label}`,
    })),
  ];

  const categoryOptions = [
    { value: '', label: 'Wszystkie kategorie' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  // Notify parent about filter changes (for word count updates)
  useEffect(() => {
    onFiltersChange?.(selectedCategory, selectedDifficulty);
  }, [selectedCategory, selectedDifficulty, onFiltersChange]);

  const getSettings = useCallback((): QuizStartSettings => ({
    category: selectedCategory,
    difficulty: selectedDifficulty,
    mode,
  }), [selectedCategory, selectedDifficulty, mode]);

  const validateAndStart = useCallback(
    (wordLimit: number, withReinforce: boolean) => {
      if (wordLimit > availableWordCount) {
        setError(`Dostępnych jest tylko ${availableWordCount} słów dla wybranych filtrów.`);
        return;
      }
      setError(null);

      const settings = { ...getSettings(), wordLimit };
      
      if (withReinforce) {
        onStartWithReinforce(settings);
      } else {
        onStart(settings);
      }
    },
    [availableWordCount, getSettings, onStart, onStartWithReinforce]
  );

  const handleCustomWordsChange = (value: string) => {
    const num = Math.min(Number(value), QUIZ_DEFAULTS.MAX_WORDS);
    setCustomWords(num);
    setError(null);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value || null);
    setError(null);
  };

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value ? (Number(value) as Difficulty) : null);
    setError(null);
  };

  return (
    <div className="quiz-setup">
      <h2 className="quiz-setup__title">Wybierz tryb quizu</h2>

      {/* Filters */}
      <div className="quiz-filters">
        <Select
          label="Kategoria"
          options={categoryOptions}
          value={selectedCategory ?? ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
        />
        <Select
          label="Poziom trudności"
          options={difficultyOptions}
          value={selectedDifficulty?.toString() ?? ''}
          onChange={(e) => handleDifficultyChange(e.target.value)}
        />
      </div>

      {/* Word count info */}
      <div className="quiz-setup__info">
        Dostępnych słów: <strong>{availableWordCount}</strong>
      </div>

      {/* Error */}
      {error && <div className="quiz-setup__error">{error}</div>}

      {/* Quiz options */}
      <div className="quiz-setup__options">
        {/* Test 50 words */}
        <button
          className="quiz-option"
          onClick={() => validateAndStart(50, useReinforce)}
          disabled={availableWordCount === 0}
        >
          <span className="quiz-option__icon">📝</span>
          <span className="quiz-option__title">TEST</span>
          <span className="quiz-option__desc">50 słów</span>
        </button>

        {/* Timed mode */}
        <div className="quiz-option quiz-option--custom">
          <span className="quiz-option__icon">⏱️</span>
          <span className="quiz-option__title">Na czas</span>
          <div className="quiz-option__input-group">
            <input
              type="number"
              min="1"
              max="60"
              value={customTime}
              onChange={(e) => setCustomTime(Number(e.target.value))}
              className="quiz-option__input"
            />
            <span>minut</span>
            <Button
              size="small"
              onClick={() => {
                setError(null);
                onStart({ ...getSettings(), timeLimit: customTime * 60 });
              }}
              disabled={availableWordCount === 0}
            >
              Start
            </Button>
          </div>
        </div>

        {/* Custom word count */}
        <div className="quiz-option quiz-option--custom">
          <span className="quiz-option__icon">🎯</span>
          <span className="quiz-option__title">Własna liczba</span>
          <div className="quiz-option__input-group">
            <input
              type="number"
              min={QUIZ_DEFAULTS.MIN_WORDS}
              max={QUIZ_DEFAULTS.MAX_WORDS}
              value={customWords}
              onChange={(e) => handleCustomWordsChange(e.target.value)}
              className="quiz-option__input"
            />
            <span>słów</span>
            <Button
              size="small"
              onClick={() => validateAndStart(customWords, useReinforce)}
              disabled={availableWordCount === 0}
            >
              Start
            </Button>
          </div>
        </div>

        {/* Reinforce mode toggle */}
        <div className="quiz-reinforce">
          <label className="quiz-reinforce__label">
            <input
              type="checkbox"
              checked={useReinforce}
              onChange={(e) => setUseReinforce(e.target.checked)}
              className="quiz-reinforce__checkbox"
            />
            <span className="quiz-reinforce__text">Tryb utrwalania</span>
          </label>
          <span className="quiz-reinforce__hint">
            Błędne odpowiedzi będą powtarzane
          </span>
        </div>
      </div>

      {/* Translation direction toggle */}
      <div className="quiz-setup__mode">
        <Button variant="secondary" onClick={onToggleMode}>
          {modeLabel}
        </Button>
      </div>
    </div>
  );
}
