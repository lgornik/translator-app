// Translation Service - logika biznesowa

import { dictionary } from '../data/dictionary.js';

class TranslationService {
  constructor() {
    this.usedWordIds = new Set();
  }

  // Pobierz losowe słowo do tłumaczenia (z opcjonalnymi filtrami)
  getRandomWord(mode = 'en-to-pl', filters = {}) {
    const { category, difficulty } = filters;

    // Filtruj słowa według kategorii i trudności
    let availableWords = dictionary;

    if (category) {
      availableWords = availableWords.filter(w => w.category === category);
    }

    if (difficulty) {
      availableWords = availableWords.filter(w => w.difficulty === difficulty);
    }

    // Jeśli brak słów po filtrowaniu
    if (availableWords.length === 0) {
      throw new Error('Brak słów dla wybranych filtrów');
    }

    // Reset jeśli wszystkie przefiltrowane słowa użyte
    const usedInFilter = availableWords.filter(w => this.usedWordIds.has(w.id));
    if (usedInFilter.length >= availableWords.length) {
      // Wyczyść tylko słowa z bieżącego filtra
      availableWords.forEach(w => this.usedWordIds.delete(w.id));
    }

    // Znajdź nieużyte słowo
    let word;
    const unusedWords = availableWords.filter(w => !this.usedWordIds.has(w.id));
    
    if (unusedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedWords.length);
      word = unusedWords[randomIndex];
    } else {
      // Fallback - losowe z dostępnych
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      word = availableWords[randomIndex];
    }

    this.usedWordIds.add(word.id);

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
    };
  }

  // Normalizacja odpowiedzi
  normalizeAnswer(answer) {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Pobierz wszystkie słowa
  getAllWords() {
    return dictionary;
  }

  // Pobierz słowa według kategorii
  getWordsByCategory(category) {
    return dictionary.filter(w => w.category === category);
  }

  // Pobierz dostępne kategorie
  getCategories() {
    return [...new Set(dictionary.map(w => w.category))].sort();
  }

  // Pobierz dostępne poziomy trudności
  getDifficulties() {
    return [...new Set(dictionary.map(w => w.difficulty))].sort((a, b) => a - b);
  }

  // Reset sesji
  resetSession() {
    this.usedWordIds.clear();
    return { success: true, message: 'Session reset' };
  }
}

export const translationService = new TranslationService();