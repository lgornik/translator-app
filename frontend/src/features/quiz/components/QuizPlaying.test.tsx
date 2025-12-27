import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizPlaying } from './QuizPlaying';
import { TranslationMode } from '@/shared/types';

describe('QuizPlaying', () => {
  const createMockWord = (overrides = {}) => ({
    id: '1',
    wordToTranslate: 'cat',
    mode: TranslationMode.EN_TO_PL,
    category: 'Animals',
    difficulty: 1,
    ...overrides,
  });

  const createMockResult = (isCorrect: boolean) => ({
    isCorrect,
    correctTranslation: 'kot',
    userTranslation: isCorrect ? 'kot' : 'pies',
  });

  const defaultProps = {
    mode: TranslationMode.EN_TO_PL,
    currentWord: createMockWord(),
    userInput: '',
    result: null,
    stats: { correct: 5, incorrect: 2 },
    wordsCompleted: 7,
    wordLimit: 50,
    timeRemaining: 0,
    reinforceMode: false,
    masteredCount: 0,
    wordsToRepeatCount: 0,
    noMoreWords: false,
    loading: false,
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
    onNextWord: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Word Display', () => {
    it('should display the word to translate', () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByText('cat')).toBeInTheDocument();
    });

    it('should display category', () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByText('Animals')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<QuizPlaying {...defaultProps} currentWord={null} loading={true} />);

      // Loading component should be visible
      expect(document.querySelector('.loading')).toBeInTheDocument();
    });

    it('should show no more words message', () => {
      render(<QuizPlaying {...defaultProps} noMoreWords={true} />);

      expect(screen.getByText(/Brak więcej słów/)).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should render input field', () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByLabelText('Twoje tłumaczenie')).toBeInTheDocument();
    });

    it('should call onInputChange when typing', () => {
      render(<QuizPlaying {...defaultProps} />);

      const input = screen.getByLabelText('Twoje tłumaczenie');
      fireEvent.change(input, { target: { value: 'kot' } });

      expect(defaultProps.onInputChange).toHaveBeenCalledWith('kot');
    });

    it('should display current userInput value', () => {
      render(<QuizPlaying {...defaultProps} userInput="ko" />);

      const input = screen.getByLabelText('Twoje tłumaczenie') as HTMLInputElement;
      expect(input.value).toBe('ko');
    });

    it('should disable input when loading', () => {
      render(<QuizPlaying {...defaultProps} loading={true} />);

      const input = screen.getByLabelText('Twoje tłumaczenie');
      expect(input).toBeDisabled();
    });

    it('should disable input when result is shown', () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      const input = screen.getByLabelText('Twoje tłumaczenie');
      expect(input).toBeDisabled();
    });

    it('should hide input when no more words', () => {
      render(<QuizPlaying {...defaultProps} noMoreWords={true} />);

      expect(screen.queryByLabelText('Twoje tłumaczenie')).not.toBeInTheDocument();
    });
  });

  describe('Submit Behavior', () => {
    it('should call onSubmit when Sprawdź button clicked', async () => {
      const user = userEvent.setup();
      render(<QuizPlaying {...defaultProps} userInput="kot" />);

      await user.click(screen.getByText('Sprawdź'));

      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit when Enter pressed', () => {
      render(<QuizPlaying {...defaultProps} userInput="kot" />);

      const input = screen.getByLabelText('Twoje tłumaczenie');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('should disable Sprawdź button when no current word', () => {
      render(<QuizPlaying {...defaultProps} currentWord={null} />);

      expect(screen.getByText('Sprawdź')).toBeDisabled();
    });

    it('should disable Sprawdź button when loading', () => {
      render(<QuizPlaying {...defaultProps} loading={true} />);

      expect(screen.getByText('Sprawdź')).toBeDisabled();
    });
  });

  describe('Result Display', () => {
    it('should show correct result message', () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      expect(screen.getByText(/Świetnie/)).toBeInTheDocument();
    });

    it('should show incorrect result with correct answer', () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(false)} />);

      expect(screen.getByText(/Niestety/)).toBeInTheDocument();
      expect(document.querySelector('.result__answer')).toBeInTheDocument();

    });

    it('should show Następne słowo button when result shown', () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      expect(screen.getByText(/Następne słowo/)).toBeInTheDocument();
    });

    it('should call onNextWord when Następne słowo clicked', async () => {
      const user = userEvent.setup();
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      await user.click(screen.getByText(/Następne słowo/));

      expect(defaultProps.onNextWord).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Display', () => {
    it('should show word count progress in normal mode', () => {
      render(<QuizPlaying {...defaultProps} wordsCompleted={7} wordLimit={50} />);

      expect(screen.getByText('7 / 50')).toBeInTheDocument();
    });

    it('should show timer in timed mode', () => {
      render(<QuizPlaying {...defaultProps} timeRemaining={125} />);

      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });

    it('should show mastered count in reinforce mode', () => {
      render(
        <QuizPlaying
          {...defaultProps}
          reinforceMode={true}
          masteredCount={3}
          wordLimit={10}
        />
      );

      expect(screen.getByText(/3.*\/.*10/)).toBeInTheDocument();
    });

    it('should show words to repeat in reinforce mode', () => {
      render(
        <QuizPlaying
          {...defaultProps}
          reinforceMode={true}
          wordsToRepeatCount={2}
        />
      );

      expect(screen.getByText(/2 do powtórki/)).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should show correct count', () => {
      render(<QuizPlaying {...defaultProps} stats={{ correct: 5, incorrect: 2 }} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Poprawne')).toBeInTheDocument();
    });

    it('should show incorrect count', () => {
      render(<QuizPlaying {...defaultProps} stats={{ correct: 5, incorrect: 2 }} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Błędne')).toBeInTheDocument();
    });

    it('should calculate accuracy percentage', () => {
      render(<QuizPlaying {...defaultProps} stats={{ correct: 7, incorrect: 3 }} />);

      // 7/10 = 70%
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should show 0% when no answers', () => {
      render(<QuizPlaying {...defaultProps} stats={{ correct: 0, incorrect: 0 }} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Reset/End Quiz', () => {
    it('should show Zakończ button', () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByText(/Zakończ/)).toBeInTheDocument();
    });

    it('should call onReset when Zakończ clicked', async () => {
      const user = userEvent.setup();
      render(<QuizPlaying {...defaultProps} />);

      await user.click(screen.getByText(/Zakończ/));

      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should show Zakończ quiz button when no more words', async () => {
      const user = userEvent.setup();
      render(<QuizPlaying {...defaultProps} noMoreWords={true} />);

      const button = screen.getByText('Zakończ quiz');
      await user.click(button);

      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  describe('Language Labels', () => {
    it('should show correct labels for EN_TO_PL mode', () => {
      render(<QuizPlaying {...defaultProps} mode={TranslationMode.EN_TO_PL} />);

      expect(screen.getByText(/z angielski.*na polski/i)).toBeInTheDocument();
    });

    it('should show correct labels for PL_TO_EN mode', () => {
      render(<QuizPlaying {...defaultProps} mode={TranslationMode.PL_TO_EN} />);

      expect(screen.getByText(/z polski.*na angielski/i)).toBeInTheDocument();
    });
  });
});