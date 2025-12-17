import { translationService } from '../services/translationService.js';

// Mapowanie enum GraphQL na format wewnętrzny
const modeMap = {
  'EN_TO_PL': 'en-to-pl',
  'PL_TO_EN': 'pl-to-en',
};

const reverseModeMap = {
  'en-to-pl': 'EN_TO_PL',
  'pl-to-en': 'PL_TO_EN',
};

export const resolvers = {
  Query: {
    // Pobierz losowe słowo
    getRandomWord: (_, { mode }) => {
      const internalMode = modeMap[mode];
      const word = translationService.getRandomWord(internalMode);
      
      return {
        ...word,
        mode: reverseModeMap[word.mode],
      };
    },

    // Pobierz wszystkie słowa
    getAllWords: () => {
      return translationService.getAllWords();
    },

    // Pobierz kategorie
    getCategories: () => {
      return translationService.getCategories();
    },
  },

  Mutation: {
    // Sprawdź tłumaczenie
    checkTranslation: (_, { wordId, userTranslation, mode }) => {
      const internalMode = modeMap[mode];
      const result = translationService.checkTranslation(
        wordId, 
        userTranslation, 
        internalMode
      );
      
      return result;
    },

    // Reset sesji
    resetSession: () => {
      const result = translationService.resetSession();
      return result.success;
    },
  },
};
