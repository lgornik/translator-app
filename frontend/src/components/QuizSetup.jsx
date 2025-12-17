import { useState } from 'react';

function QuizSetup({ 
  onStart, 
  mode, 
  onToggleMode,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty
}) {
  const [customWords, setCustomWords] = useState(10);
  const [customTime, setCustomTime] = useState(5);

  const modeLabel = mode === 'EN_TO_PL' ? 'EN → PL' : 'PL → EN';

  const difficulties = [
    { value: null, label: 'Wszystkie poziomy' },
    { value: 1, label: '⭐ Łatwy' },
    { value: 2, label: '⭐⭐ Średni' },
    { value: 3, label: '⭐⭐⭐ Trudny' },
  ];

  return (
    <div className="quiz-setup">
      <h2 className="quiz-setup__title">Wybierz tryb quizu</h2>

      {/* Filtry */}
      <div className="quiz-filters">
        <div className="quiz-filter">
          <label className="quiz-filter__label">Kategoria:</label>
          <select 
            className="quiz-filter__select"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="quiz-filter">
          <label className="quiz-filter__label">Poziom trudności:</label>
          <select 
            className="quiz-filter__select"
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value ? Number(e.target.value) : null)}
          >
            {difficulties.map(diff => (
              <option key={diff.value || 'all'} value={diff.value || ''}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="quiz-setup__options">
        {/* Szybki quiz */}
        <button 
          className="quiz-option"
          onClick={() => onStart('limit', { wordLimit: 10 })}
        >
          <span className="quiz-option__icon">⚡</span>
          <span className="quiz-option__title">Szybki quiz</span>
          <span className="quiz-option__desc">10 słów</span>
        </button>

        {/* Standardowy quiz */}
        <button 
          className="quiz-option"
          onClick={() => onStart('limit', { wordLimit: 20 })}
        >
          <span className="quiz-option__icon">📝</span>
          <span className="quiz-option__title">Standardowy</span>
          <span className="quiz-option__desc">20 słów</span>
        </button>

        {/* Wszystkie słowa */}
        <button 
          className="quiz-option"
          onClick={() => onStart('all')}
        >
          <span className="quiz-option__icon">📚</span>
          <span className="quiz-option__title">Wszystkie słowa</span>
          <span className="quiz-option__desc">Cała baza</span>
        </button>

        {/* Tryb czasowy */}
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
            <button 
              className="btn btn--small"
              onClick={() => onStart('timed', { timeLimit: customTime * 60 })}
            >
              Start
            </button>
          </div>
        </div>

        {/* Własna liczba słów */}
        <div className="quiz-option quiz-option--custom">
          <span className="quiz-option__icon">🎯</span>
          <span className="quiz-option__title">Własna liczba</span>
          <div className="quiz-option__input-group">
            <input
              type="number"
              min="1"
              max="100"
              value={customWords}
              onChange={(e) => setCustomWords(Number(e.target.value))}
              className="quiz-option__input"
            />
            <span>słów</span>
            <button 
              className="btn btn--small"
              onClick={() => onStart('custom', { customLimit: customWords })}
            >
              Start
            </button>
          </div>
        </div>
      </div>

      {/* Wybór kierunku tłumaczenia */}
      <div className="quiz-setup__mode">
        <span>Kierunek tłumaczenia:</span>
        <button className="mode-toggle-inline" onClick={onToggleMode}>
          {modeLabel}
        </button>
      </div>
    </div>
  );
}

export default QuizSetup;