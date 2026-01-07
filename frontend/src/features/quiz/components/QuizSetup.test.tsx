import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizSetup } from './QuizSetup';

describe('QuizSetup', () => {
  const defaultProps = {
    mode: 'EN_TO_PL' as const,
    categories: ['Animals', 'Food', 'Colors'],
    availableWordCount: 100,
    onStart: vi.fn(),
    onStartWithReinforce: vi.fn(),
    onToggleMode: vi.fn(),
    onFiltersChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render title', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('Wybierz tryb quizu')).toBeInTheDocument();
    });

    it('should render category select with all options', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('Wszystkie kategorie')).toBeInTheDocument();
      defaultProps.categories.forEach(cat => {
        expect(screen.getByText(cat)).toBeInTheDocument();
      });
    });

    it('should render difficulty select', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('Wszystkie poziomy')).toBeInTheDocument();
    });

    it('should render quiz options', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('TEST')).toBeInTheDocument();
      expect(screen.getByText('Na czas')).toBeInTheDocument();
      expect(screen.getByText('Własna liczba')).toBeInTheDocument();
    });

    it('should render mode toggle button', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('EN → PL')).toBeInTheDocument();
    });

    it('should render reinforce mode checkbox checked by default', () => {
      render(<QuizSetup {...defaultProps} />);

      expect(screen.getByText('Tryb utrwalania')).toBeInTheDocument();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Mode Toggle', () => {
    it('should display correct mode label for EN_TO_PL', () => {
      render(<QuizSetup {...defaultProps} mode="EN_TO_PL" />);

      expect(screen.getByText('EN → PL')).toBeInTheDocument();
    });

    it('should display correct mode label for PL_TO_EN', () => {
      render(<QuizSetup {...defaultProps} mode="PL_TO_EN" />);

      expect(screen.getByText('PL → EN')).toBeInTheDocument();
    });

    it('should call onToggleMode when clicked', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} />);

      await user.click(screen.getByText('EN → PL'));

      expect(defaultProps.onToggleMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filters', () => {
    it('should call onFiltersChange when category changes', () => {
      render(<QuizSetup {...defaultProps} />);
      
      const categorySelect = screen.getByLabelText('Kategoria');
      fireEvent.change(categorySelect, { target: { value: 'Animals' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    });

    it('should call onFiltersChange when difficulty changes', () => {
      render(<QuizSetup {...defaultProps} />);

      const difficultySelect = screen.getByLabelText('Poziom trudności');
      fireEvent.change(difficultySelect, { target: { value: '1' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    });

    it('should reset to null when "all" option selected', () => {
      render(<QuizSetup {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Kategoria');

      // Select a category first
      fireEvent.change(categorySelect, { target: { value: 'Animals' } });
      vi.clearAllMocks();

      // Select "all" option (empty value)
      fireEvent.change(categorySelect, { target: { value: '' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    });
  });

  describe('Start Quiz', () => {
    it('should call onStartWithReinforce for TEST button when reinforce is checked', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} />);

      const testButton = screen.getByText('TEST').closest('button') as HTMLElement;
      await user.click(testButton);

      expect(defaultProps.onStartWithReinforce).toHaveBeenCalledWith(
        expect.objectContaining({
          wordLimit: 50,
          category: null,
          difficulty: null,
          mode: 'EN_TO_PL',
        })
      );
    });

    it('should call onStart for TEST button when reinforce is unchecked', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} />);

      // Uncheck reinforce mode
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Click TEST button
      const testButton = screen.getByText('TEST').closest('button') as HTMLElement;
      await user.click(testButton);

      expect(defaultProps.onStart).toHaveBeenCalled();
      expect(defaultProps.onStartWithReinforce).not.toHaveBeenCalled();
    });

    it('should start timed quiz with correct settings', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} />);

      const timedSection = screen.getByText('Na czas').closest('.quiz-option') as HTMLElement;
      const timeInput = within(timedSection).getByRole('spinbutton');
      const startButton = within(timedSection).getByText('Start');

      // Use fireEvent for input changes (more reliable)
      fireEvent.change(timeInput, { target: { value: '10' } });
      await user.click(startButton);

      expect(defaultProps.onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          timeLimit: 600, // 10 * 60 seconds
        })
      );
    });

    it('should start custom word count quiz', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} />);

      const customSection = screen.getByText('Własna liczba').closest('.quiz-option') as HTMLElement;
      const wordInput = within(customSection).getByRole('spinbutton');
      const startButton = within(customSection).getByText('Start');

      // Use fireEvent for input changes
      fireEvent.change(wordInput, { target: { value: '25' } });

      // Uncheck reinforce to test onStart
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await user.click(startButton);

      expect(defaultProps.onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          wordLimit: 25,
        })
      );
    });
  });

  describe('Validation', () => {
    it('should show error when word limit exceeds available words', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} availableWordCount={10} />);

      const testButton = screen.getByText('TEST').closest('button') as HTMLElement;
      await user.click(testButton);

      expect(screen.getByText(/Dostępnych jest tylko 10 słów/)).toBeInTheDocument();
      expect(defaultProps.onStart).not.toHaveBeenCalled();
      expect(defaultProps.onStartWithReinforce).not.toHaveBeenCalled();
    });

    it('should clear error when filters change', async () => {
      const user = userEvent.setup();
      render(<QuizSetup {...defaultProps} availableWordCount={10} />);

      // Trigger error
      const testButton = screen.getByText('TEST').closest('button') as HTMLElement;
      await user.click(testButton);

      expect(screen.getByText(/Dostępnych jest tylko 10 słów/)).toBeInTheDocument();

      // Change category using fireEvent
      const categorySelect = screen.getByLabelText('Kategoria');
      fireEvent.change(categorySelect, { target: { value: 'Animals' } });

      expect(screen.queryByText(/Dostępnych jest tylko/)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable TEST button when no words available', () => {
      render(<QuizSetup {...defaultProps} availableWordCount={0} />);

      const testButton = screen.getByText('TEST').closest('button');
      expect(testButton).toBeDisabled();
    });

    it('should disable Start buttons when no words available', () => {
      render(<QuizSetup {...defaultProps} availableWordCount={0} />);

      const startButtons = screen.getAllByText('Start');
      startButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Custom Input Limits', () => {
    it('should clamp word count to max limit', () => {
      render(<QuizSetup {...defaultProps} />);

      const customSection = screen.getByText('Własna liczba').closest('.quiz-option') as HTMLElement;
      const wordInput = within(customSection).getByRole('spinbutton') as HTMLInputElement;

      fireEvent.change(wordInput, { target: { value: '9999' } });

      // Should be clamped to MAX_WORDS
      expect(Number(wordInput.value)).toBeLessThanOrEqual(500);
    });
  });
});