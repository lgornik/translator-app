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
  // Opinie & myÅ›lenie
  // ============================================================================
  { id: '1', polish: 'podjÄ…Ä‡ decyzjÄ™', english: 'make a decision', category: 'kolokacje', difficulty: 2 },
  { id: '2', polish: 'dojÅ›Ä‡ do wniosku', english: 'reach a conclusion', category: 'kolokacje', difficulty: 2 },
  { id: '3', polish: 'mieÄ‡ opiniÄ™ / poglÄ…d', english: 'hold an opinion', category: 'kolokacje', difficulty: 2 },
  { id: '4', polish: 'poruszyÄ‡ problem / kwestiÄ™', english: 'raise an issue', category: 'kolokacje', difficulty: 2 },
  { id: '5', polish: 'wziÄ…Ä‡ coÅ› pod uwagÄ™', english: 'take something into account', category: 'kolokacje', difficulty: 2 },
  { id: '6', polish: 'wyraziÄ‡ zaniepokojenie', english: 'express concern', category: 'kolokacje', difficulty: 2 },
  { id: '7', polish: 'zwrÃ³ciÄ‡ uwagÄ™ na', english: 'draw attention to', category: 'kolokacje', difficulty: 2 },
  { id: '8', polish: 'mieÄ‡ mieszane uczucia', english: 'have mixed feelings', category: 'kolokacje', difficulty: 2 },
  { id: '9', polish: 'byÄ‡ pod wraÅ¼eniem / sÄ…dziÄ‡, Å¼e', english: 'be under the impression', category: 'kolokacje', difficulty: 3 },
  { id: '10', polish: 'z mojej perspektywy', english: 'from my perspective', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Praca & formalny jÄ™zyk
  // ============================================================================
  { id: '11', polish: 'dotrzymaÄ‡ terminu', english: 'meet a deadline', category: 'kolokacje', difficulty: 2 },
  { id: '12', polish: 'wziÄ…Ä‡ odpowiedzialnoÅ›Ä‡ za', english: 'take responsibility for', category: 'kolokacje', difficulty: 2 },
  { id: '13', polish: 'dojÅ›Ä‡ do porozumienia', english: 'come to an agreement', category: 'kolokacje', difficulty: 2 },
  { id: '14', polish: 'przeprowadziÄ‡ badania', english: 'carry out research', category: 'kolokacje', difficulty: 2 },
  { id: '15', polish: 'odgrywaÄ‡ kluczowÄ… rolÄ™', english: 'play a key role', category: 'kolokacje', difficulty: 2 },
  { id: '16', polish: 'zdobywaÄ‡ doÅ›wiadczenie', english: 'gain experience', category: 'kolokacje', difficulty: 2 },
  { id: '17', polish: 'wysoko wykwalifikowany', english: 'highly skilled', category: 'kolokacje', difficulty: 2 },
  { id: '18', polish: 'przewaga konkurencyjna', english: 'competitive advantage', category: 'kolokacje', difficulty: 3 },
  { id: '19', polish: 'dÅ‚ugoterminowy cel', english: 'long-term goal', category: 'kolokacje', difficulty: 2 },
  { id: '20', polish: 'pracowaÄ‡ pod presjÄ…', english: 'work under pressure', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Emocje & relacje
  // ============================================================================
  { id: '21', polish: 'budowaÄ‡ zaufanie', english: 'build trust', category: 'kolokacje', difficulty: 2 },
  { id: '22', polish: 'straciÄ‡ cierpliwoÅ›Ä‡', english: 'lose patience', category: 'kolokacje', difficulty: 2 },
  { id: '23', polish: 'czuÄ‡ siÄ™ swobodnie', english: 'feel at ease', category: 'kolokacje', difficulty: 2 },
  { id: '24', polish: 'wyraziÄ‡ wdziÄ™cznoÅ›Ä‡', english: 'express gratitude', category: 'kolokacje', difficulty: 2 },
  { id: '25', polish: 'wzajemny szacunek', english: 'mutual respect', category: 'kolokacje', difficulty: 2 },
  { id: '26', polish: 'silna wiÄ™Åº', english: 'strong bond', category: 'kolokacje', difficulty: 2 },
  { id: '27', polish: 'poczucie przynaleÅ¼noÅ›ci', english: 'sense of belonging', category: 'kolokacje', difficulty: 3 },
  { id: '28', polish: 'wsparcie emocjonalne', english: 'emotional support', category: 'kolokacje', difficulty: 2 },
  { id: '29', polish: 'gÅ‚Ä™boko zaniepokojony', english: 'deeply concerned', category: 'kolokacje', difficulty: 2 },
  { id: '30', polish: 'braÄ‡ coÅ› do siebie', english: 'take something personally', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Å»ycie codzienne & abstrakcja
  // ============================================================================
  { id: '31', polish: 'postaraÄ‡ siÄ™ / wÅ‚oÅ¼yÄ‡ wysiÅ‚ek', english: 'make an effort', category: 'kolokacje', difficulty: 2 },
  { id: '32', polish: 'pogodziÄ‡ siÄ™ z (czymÅ›)', english: 'come to terms with', category: 'kolokacje', difficulty: 3 },
  { id: '33', polish: 'mieÄ‡ na uwadze / pamiÄ™taÄ‡', english: 'bear in mind', category: 'kolokacje', difficulty: 2 },
  { id: '34', polish: 'przypadkiem', english: 'by coincidence', category: 'kolokacje', difficulty: 2 },
  { id: '35', polish: 'na dÅ‚uÅ¼szÄ… metÄ™', english: 'in the long run', category: 'kolokacje', difficulty: 2 },
  { id: '36', polish: 'w krÃ³tkim terminie / na ostatniÄ… chwilÄ™', english: 'at short notice', category: 'kolokacje', difficulty: 3 },
  { id: '37', polish: 'do pewnego stopnia', english: 'to some extent', category: 'kolokacje', difficulty: 2 },
  { id: '38', polish: 'ogÃ³lnie rzecz biorÄ…c', english: 'on the whole', category: 'kolokacje', difficulty: 2 },
  { id: '39', polish: 'w rzeczywistoÅ›ci / tak naprawdÄ™', english: 'as a matter of fact', category: 'kolokacje', difficulty: 2 },
  { id: '40', polish: 'na razie / tymczasowo', english: 'for the time being', category: 'kolokacje', difficulty: 2 },

  // ============================================================================
  // Argumentowanie
  // ============================================================================
  { id: '41', polish: 'nie da siÄ™ zaprzeczyÄ‡, Å¼e', english: 'there is no denying that', category: 'kolokacje', difficulty: 3 },
  { id: '42', polish: 'oczywiste jest, Å¼e', english: 'it goes without saying that', category: 'kolokacje', difficulty: 3 },
  { id: '43', polish: 'moÅ¼na by argumentowaÄ‡, Å¼e', english: 'one could argue that', category: 'kolokacje', difficulty: 3 },
  { id: '44', polish: 'trafny przykÅ‚ad', english: 'a case in point', category: 'kolokacje', difficulty: 3 },
  { id: '45', polish: 'rzuciÄ‡ Å›wiatÅ‚o na / wyjaÅ›niÄ‡', english: 'shed light on', category: 'kolokacje', difficulty: 3 },
  { id: '46', polish: 'na podstawie tego, Å¼e', english: 'on the grounds that', category: 'kolokacje', difficulty: 3 },
  { id: '47', polish: 'z szerszej perspektywy', english: 'from a broader perspective', category: 'kolokacje', difficulty: 3 },
  { id: '48', polish: 'byÄ‡ otwartym na zmiany', english: 'be open to change', category: 'kolokacje', difficulty: 2 },
  { id: '49', polish: 'stanowiÄ‡ wyzwanie', english: 'pose a challenge', category: 'kolokacje', difficulty: 3 },
  { id: '50', polish: 'mieÄ‡ daleko idÄ…ce konsekwencje', english: 'have far-reaching consequences', category: 'kolokacje', difficulty: 3 },

  // ============================================================================
  // Poziom A1 - podstawowe sÅ‚Ã³wka
  // ============================================================================
  { id: '51', polish: 'dom', english: 'house', category: 'A1', difficulty: 1 },
  { id: '52', polish: 'rodzina', english: 'family', category: 'A1', difficulty: 1 },
  { id: '53', polish: 'woda', english: 'water', category: 'A1', difficulty: 1 },
  { id: '54', polish: 'jedzenie', english: 'food', category: 'A1', difficulty: 1 },
  { id: '55', polish: 'ksiÄ…Å¼ka', english: 'book', category: 'A1', difficulty: 1 },
  { id: '56', polish: 'szkoÅ‚a', english: 'school', category: 'A1', difficulty: 1 },
  { id: '57', polish: 'praca', english: 'work', category: 'A1', difficulty: 1 },
  { id: '58', polish: 'dzieÅ„', english: 'day', category: 'A1', difficulty: 1 },
  { id: '59', polish: 'noc', english: 'night', category: 'A1', difficulty: 1 },
  { id: '60', polish: 'czas', english: 'time', category: 'A1', difficulty: 1 },
  { id: '61', polish: 'przyjaciel', english: 'friend', category: 'A1', difficulty: 1 },
  { id: '62', polish: 'miasto', english: 'city', category: 'A1', difficulty: 1 },
  { id: '63', polish: 'ulica', english: 'street', category: 'A1', difficulty: 1 },
  { id: '64', polish: 'samochÃ³d', english: 'car', category: 'A1', difficulty: 1 },
  { id: '65', polish: 'telefon', english: 'phone', category: 'A1', difficulty: 1 },
  { id: '66', polish: 'duÅ¼y', english: 'big', category: 'A1', difficulty: 1 },
  { id: '67', polish: 'maÅ‚y', english: 'small', category: 'A1', difficulty: 1 },
  { id: '68', polish: 'dobry', english: 'good', category: 'A1', difficulty: 1 },
  { id: '69', polish: 'zÅ‚y', english: 'bad', category: 'A1', difficulty: 1 },
  { id: '70', polish: 'nowy', english: 'new', category: 'A1', difficulty: 1 },
  { id: '71', polish: 'stary', english: 'old', category: 'A1', difficulty: 1 },
  { id: '72', polish: 'mÅ‚ody', english: 'young', category: 'A1', difficulty: 1 },
  { id: '73', polish: 'gorÄ…cy', english: 'hot', category: 'A1', difficulty: 1 },
  { id: '74', polish: 'zimny', english: 'cold', category: 'A1', difficulty: 1 },
  { id: '75', polish: 'szczÄ™Å›liwy', english: 'happy', category: 'A1', difficulty: 1 },
  { id: '76', polish: 'smutny', english: 'sad', category: 'A1', difficulty: 1 },
  { id: '77', polish: 'jeÅ›Ä‡', english: 'to eat', category: 'A1', difficulty: 1 },
  { id: '78', polish: 'piÄ‡', english: 'to drink', category: 'A1', difficulty: 1 },
  { id: '79', polish: 'spaÄ‡', english: 'to sleep', category: 'A1', difficulty: 1 },
  { id: '80', polish: 'iÅ›Ä‡', english: 'to go', category: 'A1', difficulty: 1 },
  { id: '81', polish: 'mÃ³wiÄ‡', english: 'to speak', category: 'A1', difficulty: 1 },
  { id: '82', polish: 'czytaÄ‡', english: 'to read', category: 'A1', difficulty: 1 },
  { id: '83', polish: 'pisaÄ‡', english: 'to write', category: 'A1', difficulty: 1 },
  { id: '84', polish: 'sÅ‚uchaÄ‡', english: 'to listen', category: 'A1', difficulty: 1 },
  { id: '85', polish: 'rozumieÄ‡', english: 'to understand', category: 'A1', difficulty: 1 },
  { id: '86', polish: 'widzieÄ‡', english: 'to see', category: 'A1', difficulty: 1 },
  { id: '87', polish: 'dzisiaj', english: 'today', category: 'A1', difficulty: 1 },
  { id: '88', polish: 'jutro', english: 'tomorrow', category: 'A1', difficulty: 1 },
  { id: '89', polish: 'wczoraj', english: 'yesterday', category: 'A1', difficulty: 1 },
  { id: '90', polish: 'teraz', english: 'now', category: 'A1', difficulty: 1 },
  { id: '91', polish: 'zawsze', english: 'always', category: 'A1', difficulty: 1 },
  { id: '92', polish: 'nigdy', english: 'never', category: 'A1', difficulty: 1 },
  { id: '93', polish: 'czÄ™sto', english: 'often', category: 'A1', difficulty: 1 },
  { id: '94', polish: 'czasami', english: 'sometimes', category: 'A1', difficulty: 1 },
  { id: '95', polish: 'tutaj', english: 'here', category: 'A1', difficulty: 1 },
  { id: '96', polish: 'tam', english: 'there', category: 'A1', difficulty: 1 },
  { id: '97', polish: 'pieniÄ…dze', english: 'money', category: 'A1', difficulty: 1 },
  { id: '98', polish: 'sklep', english: 'shop', category: 'A1', difficulty: 1 },
  { id: '99', polish: 'pogoda', english: 'weather', category: 'A1', difficulty: 1 },
  { id: '100', polish: 'rok', english: 'year', category: 'A1', difficulty: 1 },
];