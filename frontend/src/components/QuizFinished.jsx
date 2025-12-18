function QuizFinished({ stats, wordsCompleted, onRestart, reinforceMode, totalStats, currentRound }) {
  const displayStats = reinforceMode ? totalStats : stats;
  const accuracy = (displayStats.correct + displayStats.incorrect) > 0 
    ? Math.round((displayStats.correct / (displayStats.correct + displayStats.incorrect)) * 100) 
    : 0;

  const getMessage = () => {
    if (reinforceMode && currentRound > 1) {
      return { emoji: '🏆', text: 'Wszystko opanowane!' };
    }
    if (accuracy >= 90) return { emoji: '🏆', text: 'Doskonale!' };
    if (accuracy >= 70) return { emoji: '👏', text: 'Świetna robota!' };
    if (accuracy >= 50) return { emoji: '💪', text: 'Nieźle, ćwicz dalej!' };
    return { emoji: '📖', text: 'Warto powtórzyć!' };
  };

  const message = getMessage();

  return (
    <div className="quiz-finished">
      <div className="quiz-finished__emoji">{message.emoji}</div>
      <h2 className="quiz-finished__title">{message.text}</h2>
      
      {reinforceMode && currentRound > 1 && (
        <p className="quiz-finished__rounds">
          Ukończono w {currentRound} {currentRound === 1 ? 'rundzie' : 'rundach'}
        </p>
      )}
      
      <div className="quiz-finished__stats">
        <div className="quiz-finished__stat">
          <span className="quiz-finished__stat-value">
            {reinforceMode ? displayStats.correct + displayStats.incorrect : wordsCompleted}
          </span>
          <span className="quiz-finished__stat-label">słów</span>
        </div>
        <div className="quiz-finished__stat quiz-finished__stat--correct">
          <span className="quiz-finished__stat-value">{displayStats.correct}</span>
          <span className="quiz-finished__stat-label">poprawnych</span>
        </div>
        <div className="quiz-finished__stat quiz-finished__stat--incorrect">
          <span className="quiz-finished__stat-value">{displayStats.incorrect}</span>
          <span className="quiz-finished__stat-label">błędnych</span>
        </div>
        <div className="quiz-finished__stat">
          <span className="quiz-finished__stat-value">{accuracy}%</span>
          <span className="quiz-finished__stat-label">skuteczność</span>
        </div>
      </div>

      <button className="btn btn--primary btn--large" onClick={onRestart}>
        Zagraj ponownie
      </button>
    </div>
  );
}

export default QuizFinished;