import { useCallback } from 'react';
import { Card } from '@/shared/components/ui';
import { Loading } from '@/shared/components/feedback/Loading';
import { ErrorMessage } from '@/shared/components/feedback/ErrorMessage';
import { useQuiz, QuizSetup, QuizPlaying, QuizFinished } from '@/features/quiz';
import { useEnterKey, useDeferredLoading } from '@/shared/hooks';
import type { Difficulty } from '@/shared/types';

/**
 * Quiz page - main quiz interface
 */
export function QuizPage() {
  const {
    state,
    context,
    isSetup,
    isPlaying,
    isFinished,
    isError,
    isShowingResult,
    categories,
    availableWordCount,
    startQuiz,
    startQuizWithReinforce,
    submitAnswer,
    nextWord,
    updateInput,
    toggleMode,
    reset,
    refetchWordCount,
    loadingWord,
    checkingAnswer,
  } = useQuiz();

  const deferredCheckingAnswer = useDeferredLoading(checkingAnswer, 150);
  const deferredLoadingWord = useDeferredLoading(loadingWord, 150);

  // Handle Enter key for next word
  useEnterKey(
    () => {
      if (isShowingResult) {
        nextWord();
      }
    },
    isShowingResult
  );

  // Handle filter changes - refetch word count
  const handleFiltersChange = useCallback((category: string | null, difficulty: Difficulty | null) => {
    refetchWordCount({
      category,
      difficulty,
    });
  }, [refetchWordCount]);

  // Render based on state
  const renderContent = () => {
    console.log('[QuizPage] Current state:', state, { isSetup, isPlaying, isFinished, isError });
    
    if (isError) {
      return (
        <ErrorMessage
          message={context.error || 'Wystąpił nieoczekiwany błąd'}
          onRetry={reset}
        />
      );
    }

    if (isSetup) {
      return (
        <QuizSetup
          mode={context.mode}
          categories={categories}
          availableWordCount={availableWordCount}
          onStart={startQuiz}
          onStartWithReinforce={startQuizWithReinforce}
          onToggleMode={toggleMode}
          onFiltersChange={handleFiltersChange}
        />
      );
    }

    // Show playing UI for both playing and loading states
    if (isPlaying || state === 'loading') {
      return (
        <QuizPlaying
          mode={context.mode}
          currentWord={context.currentWord}
          userInput={context.userInput}
          result={context.result}
          stats={context.stats}
          wordsCompleted={context.wordsCompleted}
          wordLimit={context.wordLimit}
          timeRemaining={context.timeRemaining}
          reinforceMode={context.reinforceMode}
          masteredCount={context.masteredCount}
          wordsToRepeatCount={context.wordsToRepeat.length}
          noMoreWords={context.noMoreWords}
          loading={deferredLoadingWord || deferredCheckingAnswer || state === 'loading'}
          onInputChange={updateInput}
          onSubmit={submitAnswer}
          onNextWord={nextWord}
          onReset={reset}
        />
      );
    }

    if (isFinished) {
      return (
        <QuizFinished
          stats={context.stats}
          wordsCompleted={
            context.reinforceMode ? context.masteredCount : context.wordsCompleted
          }
          reinforceMode={context.reinforceMode}
          onRestart={reset}
        />
      );
    }

    return <Loading />;
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">Translator</h1>
        <p className="header__subtitle">
          {isFinished
            ? 'Quiz zakończony!'
            : 'Ucz się słówek przez tłumaczenie'}
        </p>
      </header>

      <main>
        <Card>{renderContent()}</Card>
      </main>
    </div>
  );
}
