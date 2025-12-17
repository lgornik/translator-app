// Dane słownika - w przyszłości łatwo zamienić na wywołania do bazy danych
// Struktura przygotowana pod rozbudowę (kategorie, poziomy trudności, przykłady)

export const dictionary = [
// Opinie & myślenie
{ id: "1", polish: "podjąć decyzję", english: "make a decision", category: "opinions", difficulty: 2 },
{ id: "2", polish: "dojść do wniosku", english: "reach a conclusion", category: "opinions", difficulty: 2 },
{ id: "3", polish: "mieć opinię / pogląd", english: "hold an opinion", category: "opinions", difficulty: 2 },
{ id: "4", polish: "poruszyć problem / kwestię", english: "raise an issue", category: "opinions", difficulty: 2 },
{ id: "5", polish: "wziąć coś pod uwagę", english: "take something into account", category: "opinions", difficulty: 2 },
{ id: "6", polish: "wyrazić zaniepokojenie", english: "express concern", category: "opinions", difficulty: 2 },
{ id: "7", polish: "zwrócić uwagę na", english: "draw attention to", category: "opinions", difficulty: 2 },
{ id: "8", polish: "mieć mieszane uczucia", english: "have mixed feelings", category: "opinions", difficulty: 2 },
{ id: "9", polish: "być pod wrażeniem / sądzić, że", english: "be under the impression", category: "opinions", difficulty: 3 },
{ id: "10", polish: "z mojej perspektywy", english: "from my perspective", category: "opinions", difficulty: 2 },

// Praca & formalny język
{ id: "11", polish: "dotrzymać terminu", english: "meet a deadline", category: "work", difficulty: 2 },
{ id: "12", polish: "wziąć odpowiedzialność za", english: "take responsibility for", category: "work", difficulty: 2 },
{ id: "13", polish: "dojść do porozumienia", english: "come to an agreement", category: "work", difficulty: 2 },
{ id: "14", polish: "przeprowadzić badania", english: "carry out research", category: "work", difficulty: 2 },
{ id: "15", polish: "odgrywać kluczową rolę", english: "play a key role", category: "work", difficulty: 2 },
{ id: "16", polish: "zdobywać doświadczenie", english: "gain experience", category: "work", difficulty: 2 },
{ id: "17", polish: "wysoko wykwalifikowany", english: "highly skilled", category: "work", difficulty: 2 },
{ id: "18", polish: "przewaga konkurencyjna", english: "competitive advantage", category: "work", difficulty: 3 },
{ id: "19", polish: "długoterminowy cel", english: "long-term goal", category: "work", difficulty: 2 },
{ id: "20", polish: "pracować pod presją", english: "work under pressure", category: "work", difficulty: 2 },

// Emocje & relacje
{ id: "21", polish: "budować zaufanie", english: "build trust", category: "emotions", difficulty: 2 },
{ id: "22", polish: "stracić cierpliwość", english: "lose patience", category: "emotions", difficulty: 2 },
{ id: "23", polish: "czuć się swobodnie", english: "feel at ease", category: "emotions", difficulty: 2 },
{ id: "24", polish: "wyrazić wdzięczność", english: "express gratitude", category: "emotions", difficulty: 2 },
{ id: "25", polish: "wzajemny szacunek", english: "mutual respect", category: "emotions", difficulty: 2 },
{ id: "26", polish: "silna więź", english: "strong bond", category: "emotions", difficulty: 2 },
{ id: "27", polish: "poczucie przynależności", english: "sense of belonging", category: "emotions", difficulty: 3 },
{ id: "28", polish: "wsparcie emocjonalne", english: "emotional support", category: "emotions", difficulty: 2 },
{ id: "29", polish: "głęboko zaniepokojony", english: "deeply concerned", category: "emotions", difficulty: 2 },
{ id: "30", polish: "brać coś do siebie", english: "take something personally", category: "emotions", difficulty: 2 },

// Życie codzienne & abstrakcja
{ id: "31", polish: "postarać się / włożyć wysiłek", english: "make an effort", category: "daily", difficulty: 2 },
{ id: "32", polish: "pogodzić się z (czymś)", english: "come to terms with", category: "daily", difficulty: 3 },
{ id: "33", polish: "mieć na uwadze / pamiętać", english: "bear in mind", category: "daily", difficulty: 2 },
{ id: "34", polish: "przypadkiem", english: "by coincidence", category: "daily", difficulty: 2 },
{ id: "35", polish: "na dłuższą metę", english: "in the long run", category: "daily", difficulty: 2 },
{ id: "36", polish: "w krótkim terminie / na ostatnią chwilę", english: "at short notice", category: "daily", difficulty: 3 },
{ id: "37", polish: "do pewnego stopnia", english: "to some extent", category: "daily", difficulty: 2 },
{ id: "38", polish: "ogólnie rzecz biorąc", english: "on the whole", category: "daily", difficulty: 2 },
{ id: "39", polish: "w rzeczywistości / tak naprawdę", english: "as a matter of fact", category: "daily", difficulty: 2 },
{ id: "40", polish: "na razie / tymczasowo", english: "for the time being", category: "daily", difficulty: 2 },

// Argumentowanie
{ id: "41", polish: "nie da się zaprzeczyć, że", english: "there is no denying that", category: "argumentation", difficulty: 3 },
{ id: "42", polish: "oczywiste jest, że", english: "it goes without saying that", category: "argumentation", difficulty: 3 },
{ id: "43", polish: "można by argumentować, że", english: "one could argue that", category: "argumentation", difficulty: 3 },
{ id: "44", polish: "trafny przykład", english: "a case in point", category: "argumentation", difficulty: 3 },
{ id: "45", polish: "rzucić światło na / wyjaśnić", english: "shed light on", category: "argumentation", difficulty: 3 },
{ id: "46", polish: "na podstawie tego, że", english: "on the grounds that", category: "argumentation", difficulty: 3 },
{ id: "47", polish: "z szerszej perspektywy", english: "from a broader perspective", category: "argumentation", difficulty: 3 },
{ id: "48", polish: "być otwartym na zmiany", english: "be open to change", category: "argumentation", difficulty: 2 },
{ id: "49", polish: "stanowić wyzwanie", english: "pose a challenge", category: "argumentation", difficulty: 3 },
{ id: "50", polish: "mieć daleko idące konsekwencje", english: "have far-reaching consequences", category: "argumentation", difficulty: 3 },
];

// Funkcja do łatwego dodawania słów (przygotowanie pod przyszłe API)
export function addWord(word) {
  const newId = String(dictionary.length + 1);
  dictionary.push({ id: newId, ...word });
  return dictionary[dictionary.length - 1];
}
