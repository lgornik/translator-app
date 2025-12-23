import { WordData } from '../../domain/entities/Word.js';
import { Difficulty } from '../../shared/types/index.js';

/**
 * Dictionary data
 * In production, this would come from a database
 * 
 * Categories: kolokacje, A1
 * Difficulty: 1 (Easy), 2 (Medium), 3 (Hard)
 */
export const dictionaryData: WordData[] = [
  // ============================================================================
  // Opinie & myślenie
  // ============================================================================
  { id: '1', polish: 'podjąć decyzję', english: 'make a decision', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '2', polish: 'dojść do wniosku', english: 'reach a conclusion', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '3', polish: 'mieć opinię / pogląd', english: 'hold an opinion', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '4', polish: 'poruszyć problem / kwestię', english: 'raise an issue', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '5', polish: 'wziąć coś pod uwagę', english: 'take something into account', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '6', polish: 'wyrazić zaniepokojenie', english: 'express concern', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '7', polish: 'zwrócić uwagę na', english: 'draw attention to', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '8', polish: 'mieć mieszane uczucia', english: 'have mixed feelings', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '9', polish: 'być pod wrażeniem / sądzić, że', english: 'be under the impression', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '10', polish: 'z mojej perspektywy', english: 'from my perspective', category: 'kolokacje', difficulty: Difficulty.MEDIUM },

  // ============================================================================
  // Praca & formalny język
  // ============================================================================
  { id: '11', polish: 'dotrzymać terminu', english: 'meet a deadline', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '12', polish: 'wziąć odpowiedzialność za', english: 'take responsibility for', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '13', polish: 'dojść do porozumienia', english: 'come to an agreement', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '14', polish: 'przeprowadzić badania', english: 'carry out research', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '15', polish: 'odgrywać kluczową rolę', english: 'play a key role', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '16', polish: 'zdobywać doświadczenie', english: 'gain experience', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '17', polish: 'wysoko wykwalifikowany', english: 'highly skilled', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '18', polish: 'przewaga konkurencyjna', english: 'competitive advantage', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '19', polish: 'długoterminowy cel', english: 'long-term goal', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '20', polish: 'pracować pod presją', english: 'work under pressure', category: 'kolokacje', difficulty: Difficulty.MEDIUM },

  // ============================================================================
  // Emocje & relacje
  // ============================================================================
  { id: '21', polish: 'budować zaufanie', english: 'build trust', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '22', polish: 'stracić cierpliwość', english: 'lose patience', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '23', polish: 'czuć się swobodnie', english: 'feel at ease', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '24', polish: 'wyrazić wdzięczność', english: 'express gratitude', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '25', polish: 'wzajemny szacunek', english: 'mutual respect', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '26', polish: 'silna więź', english: 'strong bond', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '27', polish: 'poczucie przynależności', english: 'sense of belonging', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '28', polish: 'wsparcie emocjonalne', english: 'emotional support', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '29', polish: 'głęboko zaniepokojony', english: 'deeply concerned', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '30', polish: 'brać coś do siebie', english: 'take something personally', category: 'kolokacje', difficulty: Difficulty.MEDIUM },

  // ============================================================================
  // Życie codzienne & abstrakcja
  // ============================================================================
  { id: '31', polish: 'postarać się / włożyć wysiłek', english: 'make an effort', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '32', polish: 'pogodzić się z (czymś)', english: 'come to terms with', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '33', polish: 'mieć na uwadze / pamiętać', english: 'bear in mind', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '34', polish: 'przypadkiem', english: 'by coincidence', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '35', polish: 'na dłuższą metę', english: 'in the long run', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '36', polish: 'w krótkim terminie / na ostatnią chwilę', english: 'at short notice', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '37', polish: 'do pewnego stopnia', english: 'to some extent', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '38', polish: 'ogólnie rzecz biorąc', english: 'on the whole', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '39', polish: 'w rzeczywistości / tak naprawdę', english: 'as a matter of fact', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '40', polish: 'na razie / tymczasowo', english: 'for the time being', category: 'kolokacje', difficulty: Difficulty.MEDIUM },

  // ============================================================================
  // Argumentowanie
  // ============================================================================
  { id: '41', polish: 'nie da się zaprzeczyć, że', english: 'there is no denying that', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '42', polish: 'oczywiste jest, że', english: 'it goes without saying that', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '43', polish: 'można by argumentować, że', english: 'one could argue that', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '44', polish: 'trafny przykład', english: 'a case in point', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '45', polish: 'rzucić światło na / wyjaśnić', english: 'shed light on', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '46', polish: 'na podstawie tego, że', english: 'on the grounds that', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '47', polish: 'z szerszej perspektywy', english: 'from a broader perspective', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '48', polish: 'być otwartym na zmiany', english: 'be open to change', category: 'kolokacje', difficulty: Difficulty.MEDIUM },
  { id: '49', polish: 'stanowić wyzwanie', english: 'pose a challenge', category: 'kolokacje', difficulty: Difficulty.HARD },
  { id: '50', polish: 'mieć daleko idące konsekwencje', english: 'have far-reaching consequences', category: 'kolokacje', difficulty: Difficulty.HARD },

  // ============================================================================
  // Poziom A1 - podstawowe słówka
  // ============================================================================
  { id: '51', polish: 'dom', english: 'house', category: 'A1', difficulty: Difficulty.EASY },
  { id: '52', polish: 'rodzina', english: 'family', category: 'A1', difficulty: Difficulty.EASY },
  { id: '53', polish: 'woda', english: 'water', category: 'A1', difficulty: Difficulty.EASY },
  { id: '54', polish: 'jedzenie', english: 'food', category: 'A1', difficulty: Difficulty.EASY },
  { id: '55', polish: 'książka', english: 'book', category: 'A1', difficulty: Difficulty.EASY },
  { id: '56', polish: 'szkoła', english: 'school', category: 'A1', difficulty: Difficulty.EASY },
  { id: '57', polish: 'praca', english: 'work', category: 'A1', difficulty: Difficulty.EASY },
  { id: '58', polish: 'dzień', english: 'day', category: 'A1', difficulty: Difficulty.EASY },
  { id: '59', polish: 'noc', english: 'night', category: 'A1', difficulty: Difficulty.EASY },
  { id: '60', polish: 'czas', english: 'time', category: 'A1', difficulty: Difficulty.EASY },
  { id: '61', polish: 'przyjaciel', english: 'friend', category: 'A1', difficulty: Difficulty.EASY },
  { id: '62', polish: 'miasto', english: 'city', category: 'A1', difficulty: Difficulty.EASY },
  { id: '63', polish: 'ulica', english: 'street', category: 'A1', difficulty: Difficulty.EASY },
  { id: '64', polish: 'samochód', english: 'car', category: 'A1', difficulty: Difficulty.EASY },
  { id: '65', polish: 'telefon', english: 'phone', category: 'A1', difficulty: Difficulty.EASY },
  { id: '66', polish: 'duży', english: 'big', category: 'A1', difficulty: Difficulty.EASY },
  { id: '67', polish: 'mały', english: 'small', category: 'A1', difficulty: Difficulty.EASY },
  { id: '68', polish: 'dobry', english: 'good', category: 'A1', difficulty: Difficulty.EASY },
  { id: '69', polish: 'zły', english: 'bad', category: 'A1', difficulty: Difficulty.EASY },
  { id: '70', polish: 'nowy', english: 'new', category: 'A1', difficulty: Difficulty.EASY },
  { id: '71', polish: 'stary', english: 'old', category: 'A1', difficulty: Difficulty.EASY },
  { id: '72', polish: 'młody', english: 'young', category: 'A1', difficulty: Difficulty.EASY },
  { id: '73', polish: 'gorący', english: 'hot', category: 'A1', difficulty: Difficulty.EASY },
  { id: '74', polish: 'zimny', english: 'cold', category: 'A1', difficulty: Difficulty.EASY },
  { id: '75', polish: 'szczęśliwy', english: 'happy', category: 'A1', difficulty: Difficulty.EASY },
  { id: '76', polish: 'smutny', english: 'sad', category: 'A1', difficulty: Difficulty.EASY },
  { id: '77', polish: 'jeść', english: 'to eat', category: 'A1', difficulty: Difficulty.EASY },
  { id: '78', polish: 'pić', english: 'to drink', category: 'A1', difficulty: Difficulty.EASY },
  { id: '79', polish: 'spać', english: 'to sleep', category: 'A1', difficulty: Difficulty.EASY },
  { id: '80', polish: 'iść', english: 'to go', category: 'A1', difficulty: Difficulty.EASY },
  { id: '81', polish: 'mówić', english: 'to speak', category: 'A1', difficulty: Difficulty.EASY },
  { id: '82', polish: 'czytać', english: 'to read', category: 'A1', difficulty: Difficulty.EASY },
  { id: '83', polish: 'pisać', english: 'to write', category: 'A1', difficulty: Difficulty.EASY },
  { id: '84', polish: 'słuchać', english: 'to listen', category: 'A1', difficulty: Difficulty.EASY },
  { id: '85', polish: 'rozumieć', english: 'to understand', category: 'A1', difficulty: Difficulty.EASY },
  { id: '86', polish: 'widzieć', english: 'to see', category: 'A1', difficulty: Difficulty.EASY },
  { id: '87', polish: 'dzisiaj', english: 'today', category: 'A1', difficulty: Difficulty.EASY },
  { id: '88', polish: 'jutro', english: 'tomorrow', category: 'A1', difficulty: Difficulty.EASY },
  { id: '89', polish: 'wczoraj', english: 'yesterday', category: 'A1', difficulty: Difficulty.EASY },
  { id: '90', polish: 'teraz', english: 'now', category: 'A1', difficulty: Difficulty.EASY },
  { id: '91', polish: 'zawsze', english: 'always', category: 'A1', difficulty: Difficulty.EASY },
  { id: '92', polish: 'nigdy', english: 'never', category: 'A1', difficulty: Difficulty.EASY },
  { id: '93', polish: 'często', english: 'often', category: 'A1', difficulty: Difficulty.EASY },
  { id: '94', polish: 'czasami', english: 'sometimes', category: 'A1', difficulty: Difficulty.EASY },
  { id: '95', polish: 'tutaj', english: 'here', category: 'A1', difficulty: Difficulty.EASY },
  { id: '96', polish: 'tam', english: 'there', category: 'A1', difficulty: Difficulty.EASY },
  { id: '97', polish: 'pieniądze', english: 'money', category: 'A1', difficulty: Difficulty.EASY },
  { id: '98', polish: 'sklep', english: 'shop', category: 'A1', difficulty: Difficulty.EASY },
  { id: '99', polish: 'pogoda', english: 'weather', category: 'A1', difficulty: Difficulty.EASY },
  { id: '100', polish: 'rok', english: 'year', category: 'A1', difficulty: Difficulty.EASY },
];
