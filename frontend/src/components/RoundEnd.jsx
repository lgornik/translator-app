function RoundEnd({ 
  currentRound, 
  stats, 
  incorrectWords, 
  onNextRound, 
  onQuit 
}) {
  return (
    <div className="round-end">
      <div className="round-end__emoji">📊</div>
      <h2 className="round-end__title">Runda {currentRound} zakończona!</h2>
      
      <div className="round-end__stats">
        <div className="round-end__stat round-end__stat--correct">
          <span className="round-end__stat-value">{stats.correct}</span>
          <span className="round-end__stat-label">poprawnych</span>
        </div>
        <div className="round-end__stat round-end__stat--incorrect">
          <span className="round-end__stat-value">{stats.incorrect}</span>
          <span className="round-end__stat-label">do powtórki</span>
        </div>
      </div>

      <div className="round-end__message">
        <p>Pozostało <strong>{incorrectWords.length}</strong> słów do opanowania:</p>
        <ul className="round-end__words">
          {incorrectWords.slice(0, 5).map((word, index) => (
            <li key={index}>{word.wordToTranslate}</li>
          ))}
          {incorrectWords.length > 5 && (
            <li>...i {incorrectWords.length - 5} więcej</li>
          )}
        </ul>
      </div>

      <div className="round-end__actions">
        <button className="btn btn--secondary" onClick={onQuit}>
          Zakończ
        </button>
        <button className="btn btn--primary" onClick={onNextRound}>
          Kontynuuj naukę →
        </button>
      </div>
    </div>
  );
}

export default RoundEnd;