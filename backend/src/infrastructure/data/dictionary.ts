/**
 * Dictionary data
 * In production, this would come from a database
 *
 * Categories: kolokacje, A1
 * Difficulty: 1 (Easy), 2 (Medium), 3 (Hard)
 */

export interface RawWordData {
  id: string;
  polish: string;
  english: string;
  category: string;
  difficulty: number;
}

export const dictionaryData: RawWordData[] = [
  // ============================================================================
  // Opinie & myślenie
  // ============================================================================
  { id: '1', polish: 'podjąć decyzję', english: 'make a decision', category: 'kolokacje', difficulty: 2 },
  { id: '2', polish: 'dojść do wniosku', english: 'reach a conclusion', category: 'kolokacje', difficulty: 2 },
  { id: '3', polish: 'mieć opinię / pogląd', english: 'hold an opinion', category: 'kolokacje', difficulty: 2 },
  { id: '4', polish: 'poruszyć problem / kwestię', english: 'raise an issue', category: 'kolokacje', difficulty: 2 },
  { id: '5', polish: 'wziąć coś pod uwagę', english: 'take something into account', category: 'kolokacje', difficulty: 2 },
  { id: '6', polish: 'wyrazić zaniepokojenie', english: 'express concern', category: 'kolokacje', difficulty: 2 },
  { id: '7', polish: 'zwrócić uwagę na', english: 'draw attention to', category: 'kolokacje', difficulty: 2 },
  { id: '8', polish: 'mieć mieszane uczucia', english: 'have mixed feelings', category: 'kolokacje', difficulty: 2 },
  { id: '9', polish: 'być pod wrażeniem / sądzić, że', english: 'be under the impression', category: 'kolokacje', difficulty: 3 },
  { id: '10', polish: 'z mojej perspektywy', english: 'from my perspective', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Praca & formalny język
  // ============================================================================
  { id: '11', polish: 'dotrzymać terminu', english: 'meet a deadline', category: 'kolokacje', difficulty: 2 },
  { id: '12', polish: 'wziąć odpowiedzialność za', english: 'take responsibility for', category: 'kolokacje', difficulty: 2 },
  { id: '13', polish: 'dojść do porozumienia', english: 'come to an agreement', category: 'kolokacje', difficulty: 2 },
  { id: '14', polish: 'przeprowadzić badania', english: 'carry out research', category: 'kolokacje', difficulty: 2 },
  { id: '15', polish: 'odgrywać kluczową rolę', english: 'play a key role', category: 'kolokacje', difficulty: 2 },
  { id: '16', polish: 'zdobywać doświadczenie', english: 'gain experience', category: 'kolokacje', difficulty: 2 },
  { id: '17', polish: 'wysoko wykwalifikowany', english: 'highly skilled', category: 'kolokacje', difficulty: 2 },
  { id: '18', polish: 'przewaga konkurencyjna', english: 'competitive advantage', category: 'kolokacje', difficulty: 3 },
  { id: '19', polish: 'długoterminowy cel', english: 'long-term goal', category: 'kolokacje', difficulty: 2 },
  { id: '20', polish: 'pracować pod presją', english: 'work under pressure', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Emocje & relacje
  // ============================================================================
  { id: '21', polish: 'budować zaufanie', english: 'build trust', category: 'kolokacje', difficulty: 2 },
  { id: '22', polish: 'stracić cierpliwość', english: 'lose patience', category: 'kolokacje', difficulty: 2 },
  { id: '23', polish: 'czuć się swobodnie', english: 'feel at ease', category: 'kolokacje', difficulty: 2 },
  { id: '24', polish: 'wyrazić wdzięczność', english: 'express gratitude', category: 'kolokacje', difficulty: 2 },
  { id: '25', polish: 'wzajemny szacunek', english: 'mutual respect', category: 'kolokacje', difficulty: 2 },
  { id: '26', polish: 'silna więź', english: 'strong bond', category: 'kolokacje', difficulty: 2 },
  { id: '27', polish: 'poczucie przynależności', english: 'sense of belonging', category: 'kolokacje', difficulty: 3 },
  { id: '28', polish: 'wsparcie emocjonalne', english: 'emotional support', category: 'kolokacje', difficulty: 2 },
  { id: '29', polish: 'głęboko zaniepokojony', english: 'deeply concerned', category: 'kolokacje', difficulty: 2 },
  { id: '30', polish: 'brać coś do siebie', english: 'take something personally', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Życie codzienne & abstrakcja
  // ============================================================================
  { id: '31', polish: 'postarać się / włożyć wysiłek', english: 'make an effort', category: 'kolokacje', difficulty: 2 },
  { id: '32', polish: 'pogodzić się z (czymś)', english: 'come to terms with', category: 'kolokacje', difficulty: 3 },
  { id: '33', polish: 'mieć na uwadze / pamiętać', english: 'bear in mind', category: 'kolokacje', difficulty: 2 },
  { id: '34', polish: 'przypadkiem', english: 'by coincidence', category: 'kolokacje', difficulty: 2 },
  { id: '35', polish: 'na dłuższą metę', english: 'in the long run', category: 'kolokacje', difficulty: 2 },
  { id: '36', polish: 'w krótkim terminie / na ostatnią chwilę', english: 'at short notice', category: 'kolokacje', difficulty: 3 },
  { id: '37', polish: 'do pewnego stopnia', english: 'to some extent', category: 'kolokacje', difficulty: 2 },
  { id: '38', polish: 'ogólnie rzecz biorąc', english: 'on the whole', category: 'kolokacje', difficulty: 2 },
  { id: '39', polish: 'w rzeczywistości / tak naprawdę', english: 'as a matter of fact', category: 'kolokacje', difficulty: 2 },
  { id: '40', polish: 'na razie / tymczasowo', english: 'for the time being', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Argumentowanie
  // ============================================================================
  { id: '41', polish: 'nie da się zaprzeczyć, że', english: 'there is no denying that', category: 'kolokacje', difficulty: 3 },
  { id: '42', polish: 'oczywiste jest, że', english: 'it goes without saying that', category: 'kolokacje', difficulty: 3 },
  { id: '43', polish: 'można by argumentować, że', english: 'one could argue that', category: 'kolokacje', difficulty: 3 },
  { id: '44', polish: 'trafny przykład', english: 'a case in point', category: 'kolokacje', difficulty: 3 },
  { id: '45', polish: 'rzucić światło na / wyjaśnić', english: 'shed light on', category: 'kolokacje', difficulty: 3 },
  { id: '46', polish: 'na podstawie tego, że', english: 'on the grounds that', category: 'kolokacje', difficulty: 3 },
  { id: '47', polish: 'z szerszej perspektywy', english: 'from a broader perspective', category: 'kolokacje', difficulty: 3 },
  { id: '48', polish: 'być otwartym na zmiany', english: 'be open to change', category: 'kolokacje', difficulty: 2 },
  { id: '49', polish: 'stanowić wyzwanie', english: 'pose a challenge', category: 'kolokacje', difficulty: 3 },
  { id: '50', polish: 'mieć daleko idące konsekwencje', english: 'have far-reaching consequences', category: 'kolokacje', difficulty: 3 },

  // ============================================================================
  // Poziom A1 - podstawowe słówka
  // ============================================================================
  { id: '51', polish: 'dom', english: 'house', category: 'A1', difficulty: 1 },
  { id: '52', polish: 'rodzina', english: 'family', category: 'A1', difficulty: 1 },
  { id: '53', polish: 'woda', english: 'water', category: 'A1', difficulty: 1 },
  { id: '54', polish: 'jedzenie', english: 'food', category: 'A1', difficulty: 1 },
  { id: '55', polish: 'książka', english: 'book', category: 'A1', difficulty: 1 },
  { id: '56', polish: 'szkoła', english: 'school', category: 'A1', difficulty: 1 },
  { id: '57', polish: 'praca', english: 'work', category: 'A1', difficulty: 1 },
  { id: '58', polish: 'dzień', english: 'day', category: 'A1', difficulty: 1 },
  { id: '59', polish: 'noc', english: 'night', category: 'A1', difficulty: 1 },
  { id: '60', polish: 'czas', english: 'time', category: 'A1', difficulty: 1 },
  { id: '61', polish: 'przyjaciel', english: 'friend', category: 'A1', difficulty: 1 },
  { id: '62', polish: 'miasto', english: 'city', category: 'A1', difficulty: 1 },
  { id: '63', polish: 'ulica', english: 'street', category: 'A1', difficulty: 1 },
  { id: '64', polish: 'samochód', english: 'car', category: 'A1', difficulty: 1 },
  { id: '65', polish: 'telefon', english: 'phone', category: 'A1', difficulty: 1 },
  { id: '66', polish: 'duży', english: 'big', category: 'A1', difficulty: 1 },
  { id: '67', polish: 'mały', english: 'small', category: 'A1', difficulty: 1 },
  { id: '68', polish: 'dobry', english: 'good', category: 'A1', difficulty: 1 },
  { id: '69', polish: 'zły', english: 'bad', category: 'A1', difficulty: 1 },
  { id: '70', polish: 'nowy', english: 'new', category: 'A1', difficulty: 1 },
  { id: '71', polish: 'stary', english: 'old', category: 'A1', difficulty: 1 },
  { id: '72', polish: 'młody', english: 'young', category: 'A1', difficulty: 1 },
  { id: '73', polish: 'gorący', english: 'hot', category: 'A1', difficulty: 1 },
  { id: '74', polish: 'zimny', english: 'cold', category: 'A1', difficulty: 1 },
  { id: '75', polish: 'szczęśliwy', english: 'happy', category: 'A1', difficulty: 1 },
  { id: '76', polish: 'smutny', english: 'sad', category: 'A1', difficulty: 1 },
  { id: '77', polish: 'jeść', english: 'to eat', category: 'A1', difficulty: 1 },
  { id: '78', polish: 'pić', english: 'to drink', category: 'A1', difficulty: 1 },
  { id: '79', polish: 'spać', english: 'to sleep', category: 'A1', difficulty: 1 },
  { id: '80', polish: 'iść', english: 'to go', category: 'A1', difficulty: 1 },
  { id: '81', polish: 'mówić', english: 'to speak', category: 'A1', difficulty: 1 },
  { id: '82', polish: 'czytać', english: 'to read', category: 'A1', difficulty: 1 },
  { id: '83', polish: 'pisać', english: 'to write', category: 'A1', difficulty: 1 },
  { id: '84', polish: 'słuchać', english: 'to listen', category: 'A1', difficulty: 1 },
  { id: '85', polish: 'rozumieć', english: 'to understand', category: 'A1', difficulty: 1 },
  { id: '86', polish: 'widzieć', english: 'to see', category: 'A1', difficulty: 1 },
  { id: '87', polish: 'dzisiaj', english: 'today', category: 'A1', difficulty: 1 },
  { id: '88', polish: 'jutro', english: 'tomorrow', category: 'A1', difficulty: 1 },
  { id: '89', polish: 'wczoraj', english: 'yesterday', category: 'A1', difficulty: 1 },
  { id: '90', polish: 'teraz', english: 'now', category: 'A1', difficulty: 1 },
  { id: '91', polish: 'zawsze', english: 'always', category: 'A1', difficulty: 1 },
  { id: '92', polish: 'nigdy', english: 'never', category: 'A1', difficulty: 1 },
  { id: '93', polish: 'często', english: 'often', category: 'A1', difficulty: 1 },
  { id: '94', polish: 'czasami', english: 'sometimes', category: 'A1', difficulty: 1 },
  { id: '95', polish: 'tutaj', english: 'here', category: 'A1', difficulty: 1 },
  { id: '96', polish: 'tam', english: 'there', category: 'A1', difficulty: 1 },
  { id: '97', polish: 'pieniądze', english: 'money', category: 'A1', difficulty: 1 },
  { id: '98', polish: 'sklep', english: 'shop', category: 'A1', difficulty: 1 },
  { id: '99', polish: 'pogoda', english: 'weather', category: 'A1', difficulty: 1 },
  { id: '100', polish: 'rok', english: 'year', category: 'A1', difficulty: 1 },
];