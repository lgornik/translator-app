// Translation Service - logika biznesowa
// W przyszłości łatwo rozbudować o: historię, statystyki, algorytm powtórek (spaced repetition)

import { dictionary } from '../data/dictionary.js';

class TranslationService {
  constructor() {
    this.usedWordIds = new Set(); // Śledzenie użytych słów w sesji
  }

  // Pobierz losowe słowo do tłumaczenia
  getRandomWord(mode = 'en-to-pl') {
    // Reset jeśli wszystkie słowa użyte
    if (this.usedWordIds.size >= dictionary.length) {
      this.usedWordIds.clear();
    }

    // Znajdź nieużyte słowo
    let word;
    do {
      const randomIndex = Math.floor(Math.random() * dictionary.length);
      word = dictionary[randomIndex];
    } while (this.usedWordIds.has(word.id));

    this.usedWordIds.add(word.id);

    // Zwróć słowo w odpowiednim formacie zależnie od trybu
    return {
      id: word.id,
      wordToTranslate: mode === 'en-to-pl' ? word.english : word.polish,
      correctTranslation: mode === 'en-to-pl' ? word.polish : word.english,
      mode,
      category: word.category,
      difficulty: word.difficulty,
    };
  }

  // Sprawdź tłumaczenie
  checkTranslation(wordId, userTranslation, mode = 'en-to-pl') {
    const word = dictionary.find(w => w.id === wordId);
    
    if (!word) {
      return {
        isCorrect: false,
        correctTranslation: null,
        error: 'Word not found',
      };
    }

    const correctAnswer = mode === 'en-to-pl' ? word.polish : word.english;
    const normalizedUserAnswer = this.normalizeAnswer(userTranslation);
    const normalizedCorrectAnswer = this.normalizeAnswer(correctAnswer);

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    return {
      isCorrect,
      correctTranslation: correctAnswer,
      userTranslation,
      // Przygotowanie pod przyszłe funkcje
      // similarity: this.calculateSimilarity(normalizedUserAnswer, normalizedCorrectAnswer),
    };
  }

  // Normalizacja odpowiedzi (małe litery, trim, usunięcie zbędnych spacji)
  normalizeAnswer(answer) {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Pobierz wszystkie słowa (do przyszłego panelu admina)
  getAllWords() {
    return dictionary;
  }

  // Pobierz słowa według kategorii
  getWordsByCategory(category) {
    return dictionary.filter(w => w.category === category);
  }

  // Pobierz dostępne kategorie
  getCategories() {
    return [...new Set(dictionary.map(w => w.category))];
  }

  // Reset sesji
  resetSession() {
    this.usedWordIds.clear();
    return { success: true, message: 'Session reset' };
  }
}

// Singleton - jedna instancja serwisu
export const translationService = new TranslationService();
