import { Button } from '@/shared/components/ui';
import { RESULT_MESSAGES } from '@/shared/constants';
import { calculateAccuracy } from '@/shared/utils';
import type { QuizStats } from '@/shared/types';

interface QuizFinishedProps {
  stats: QuizStats;
  wordsCompleted: number;
  reinforceMode: boolean;
  onRestart: () => void;
}

/**
 * Quiz finished/results screen
 */
export function QuizFinished({
  stats,
  wordsCompleted,
  reinforceMode,
  onRestart,
}: QuizFinishedProps) {
  const accuracy = calculateAccuracy(stats.correct, stats.correct + stats.incorrect);

  const getMessage = () => {
    if (reinforceMode) {
      return { emoji: '🏆', text: 'Wszystko opanowane!' };
    }

    if (accuracy >= RESULT_MESSAGES.EXCELLENT.minAccuracy) {
      return RESULT_MESSAGES.EXCELLENT;
    }
    if (accuracy >= RESULT_MESSAGES.GREAT.minAccuracy) {
      return RESULT_MESSAGES.GREAT;
    }
    if (accuracy >= RESULT_MESSAGES.GOOD.minAccuracy) {
      return RESULT_MESSAGES.GOOD;
    }
    return RESULT_MESSAGES.PRACTICE;
  };

  const message = getMessage();

  return (
    <div className="quiz-finished">
      <div className="quiz-finished__emoji">{message.emoji}</div>
      <h2 className="quiz-finished__title">{message.text}</h2>

      <div className="quiz-finished__stats">
        <div className="quiz-finished__stat">
          <span className="quiz-finished__stat-value">{wordsCompleted}</span>
          <span className="quiz-finished__stat-label">słów</span>
        </div>
        <div className="quiz-finished__stat quiz-finished__stat--correct">
          <span className="quiz-finished__stat-value">{stats.correct}</span>
          <span className="quiz-finished__stat-label">poprawnych</span>
        </div>
        <div className="quiz-finished__stat quiz-finished__stat--incorrect">
          <span className="quiz-finished__stat-value">{stats.incorrect}</span>
          <span className="quiz-finished__stat-label">błędnych</span>
        </div>
        <div className="quiz-finished__stat">
          <span className="quiz-finished__stat-value">{accuracy}%</span>
          <span className="quiz-finished__stat-label">skuteczność</span>
        </div>
      </div>

      <Button size="large" onClick={onRestart}>
        Zagraj ponownie
      </Button>
    </div>
  );
}
