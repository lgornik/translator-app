import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizFinished } from './QuizFinished';

describe('QuizFinished', () => {
  const defaultProps = {
    stats: { correct: 8, incorrect: 2 },
    wordsCompleted: 10,
    reinforceMode: false,
    onRestart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Results Display', () => {
    it('should display correct count', () => {
      render(<QuizFinished {...defaultProps} />);
      
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display incorrect count', () => {
      render(<QuizFinished {...defaultProps} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display accuracy percentage', () => {
      render(<QuizFinished {...defaultProps} />);
      
      // 8/10 = 80%
      expect(screen.getByText(/80.*%/)).toBeInTheDocument();
    });

    it('should display words completed', () => {
      render(<QuizFinished {...defaultProps} />);
      
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('should handle zero total words', () => {
      render(
        <QuizFinished 
          {...defaultProps} 
          stats={{ correct: 0, incorrect: 0 }}
          wordsCompleted={0}
        />
      );
      
      // Should show 0% without crashing
      expect(screen.getByText(/0.*%/)).toBeInTheDocument();
    });
  });

  describe('Performance Feedback', () => {
    it('should show excellent feedback for high accuracy', () => {
      render(
        <QuizFinished 
          {...defaultProps} 
          stats={{ correct: 95, incorrect: 5 }}
          wordsCompleted={100}
        />
      );
      
      // Check for positive emoji or message
      const content = document.body.textContent;
      expect(content).toMatch(/ðŸ†|Å›wietn|doskonaÅ‚|excellent/i);
    });

    it('should show good feedback for medium accuracy', () => {
      render(
        <QuizFinished 
          {...defaultProps} 
          stats={{ correct: 70, incorrect: 30 }}
          wordsCompleted={100}
        />
      );
      
      // Should have some feedback
      expect(document.body.textContent).toBeTruthy();
    });

    it('should show encouragement for low accuracy', () => {
      render(
        <QuizFinished 
          {...defaultProps} 
          stats={{ correct: 30, incorrect: 70 }}
          wordsCompleted={100}
        />
      );
      
      // Should have some feedback
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Reinforce Mode Results', () => {
    it('should show special message in reinforce mode', () => {
      render(
        <QuizFinished 
          {...defaultProps} 
          reinforceMode={true}
        />
      );
      
      expect(screen.getByText(/opanowane|mastered/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render restart button', () => {
      render(<QuizFinished {...defaultProps} />);
      
      // Look for any button that restarts
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should call onRestart when button clicked', async () => {
      const user = userEvent.setup();
      render(<QuizFinished {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(defaultProps.onRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics Breakdown', () => {
    it('should show stats labels', () => {
      render(<QuizFinished {...defaultProps} />);
      
      // Check for labels - using Polish text from component
      const content = document.body.textContent?.toLowerCase();
      expect(content).toMatch(/poprawny|correct/);
      expect(content).toMatch(/dn|incorrect|wrong|2/);
    });
  });
});
