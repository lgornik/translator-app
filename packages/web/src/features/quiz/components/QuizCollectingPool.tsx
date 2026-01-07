import { Button } from '@/shared/components/ui';
import { Loading } from '@/shared/components/feedback/Loading';

interface QuizCollectingPoolProps {
  collectedCount: number;
  targetCount: number;
  onReset: () => void;
}

/**
 * Komponent wyświetlany podczas zbierania puli słów w trybie utrwalania
 */
export function QuizCollectingPool({
  collectedCount,
  targetCount,
  onReset,
}: QuizCollectingPoolProps) {
  const percentage = Math.round((collectedCount / targetCount) * 100);

  return (
    <section 
      className="quiz-collecting" 
      aria-label="Przygotowywanie quizu"
      role="status"
      aria-live="polite"
    >
      <div className="quiz-collecting__content">
        <Loading size="medium" />
        
        <h2 className="quiz-collecting__title">
          Przygotowywanie słów do nauki
        </h2>
        
        <div className="quiz-collecting__progress">
          <div 
            className="quiz-collecting__progress-bar"
            role="progressbar"
            aria-valuenow={collectedCount}
            aria-valuemin={0}
            aria-valuemax={targetCount}
            aria-label={`Pobrano ${collectedCount} z ${targetCount} słów`}
          >
            <div 
              className="quiz-collecting__progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="quiz-collecting__progress-text">
            {collectedCount} / {targetCount} słów
          </div>
        </div>
        
        <p className="quiz-collecting__description">
          Pobieramy słowa do Twojej sesji nauki. 
          Za chwilę rozpoczniesz quiz!
        </p>
        
        <Button
          variant="text"
          onClick={onReset}
          aria-label="Anuluj i wróć do ustawień"
        >
          Anuluj
        </Button>
      </div>
    </section>
  );
}