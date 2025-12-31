import { test, expect } from './fixtures';

/**
 * E2E Tests for Reinforce Mode (Tryb utrwalania)
 * Tests the new pool collection and word repetition features
 */

test.describe('Reinforce Mode - Pool Collection', () => {
  test('should show collecting pool screen when starting reinforce mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Ensure reinforce mode is enabled
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    // Start custom quiz with small word count
    await quizPage.startCustomQuiz(5);
    
    // Should show pool collection screen
    await expect(page.getByText('Przygotowywanie słów do nauki')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText(/\d+ \/ 5 słów/)).toBeVisible();
  });

  test('should allow canceling during pool collection', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(10);
    
    // Wait for collection screen
    await expect(page.getByText('Przygotowywanie słów do nauki')).toBeVisible({ timeout: 5000 });
    
    // Click cancel
    await page.getByRole('button', { name: 'Anuluj' }).click();
    
    // Should return to setup
    await quizPage.expectSetupPage();
  });

  test('should transition to playing after pool is collected', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(3);
    
    // Wait for quiz to start (pool collected)
    await quizPage.expectPlayingPage();
    
    // Should show mastered counter
    await expect(page.getByText(/✓.*0.*\/.*3/)).toBeVisible();
  });
});

test.describe('Reinforce Mode - Word Repetition Logic', () => {
  test('should show repeat indicator on wrong answer', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(2);
    await quizPage.expectPlayingPage();
    
    // Answer incorrectly
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer('definitely-wrong-answer-xyz');
    await quizPage.submitAnswer();
    
    // Should show incorrect feedback
    await expect(page.getByText(/Niestety|Poprawna odpowiedź/)).toBeVisible({ timeout: 10000 });
    
    // Go to next word
    await quizPage.nextWord();
    
    // Should show repeat indicator
    await expect(page.getByText(/🔄.*do powtórki/)).toBeVisible({ timeout: 5000 });
  });

  test('should repeat wrong words until mastered', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    // Start with just 1 word for easier testing
    await quizPage.startCustomQuiz(1);
    await quizPage.expectPlayingPage();
    
    // Remember the word
    const firstWord = await quizPage.getCurrentWord();
    
    // Answer incorrectly
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer('wrong-answer');
    await quizPage.submitAnswer();
    
    await expect(page.getByText(/Niestety|Poprawna odpowiedź/)).toBeVisible({ timeout: 10000 });
    await quizPage.nextWord();
    
    // Same word should appear again
    const secondWord = await quizPage.getCurrentWord();
    expect(secondWord).toBe(firstWord);
  });

  test('should finish quiz when all words mastered', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(1);
    await quizPage.expectPlayingPage();
    
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    
    // First, answer wrong to see correct answer
    await quizPage.enterAnswer('wrong');
    await quizPage.submitAnswer();
    
    // Get correct answer from feedback
    const resultText = await page.locator('.result__answer').textContent();
    const correctAnswer = resultText?.replace('Poprawna odpowiedź:', '').trim() || '';
    
    await quizPage.nextWord();
    
    // Now answer correctly
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer(correctAnswer);
    await quizPage.submitAnswer();
    
    // Should finish the quiz
    await quizPage.expectResultsPage();
  });
});

test.describe('Reinforce Mode - TEST Quiz', () => {
  test('should collect 50 words for TEST in reinforce mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    // Start TEST quiz
    await quizPage.startTestQuiz();
    
    // Should show collection screen first
    await expect(page.getByText('Przygotowywanie słów do nauki')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/\d+ \/ 50 słów/)).toBeVisible();
    
    // Wait for quiz to start
    await quizPage.expectPlayingPage();
    
    // Should show 50 as target
    await expect(page.getByText(/✓.*\/.*50/)).toBeVisible();
  });
});

test.describe('Reinforce Mode - Progress Display', () => {
  test('should show correct progress format', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(5);
    await quizPage.expectPlayingPage();
    
    // Should show mastered counter with checkmark
    await expect(page.getByText(/✓/)).toBeVisible();
    
    // Format: "✓ X / Y"
    await expect(page.locator('.quiz-progress__counter')).toContainText(/\d+ \/ \d+/);
  });

  test('should update progress after correct answer', async ({ page, quizPage }) => {
    await page.goto('/');
    
    const checkbox = page.getByRole('checkbox');
    if (!await checkbox.isChecked()) {
      await checkbox.check();
    }
    
    await quizPage.startCustomQuiz(3);
    await quizPage.expectPlayingPage();
    
    // Get initial mastered count
    const initialText = await page.locator('.quiz-progress__counter').textContent();
    const initialCount = parseInt(initialText?.match(/(\d+) \//)?.[1] || '0');
    
    // Answer a word
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer('test');
    await quizPage.submitAnswer();
    
    await expect(page.getByText(/Następne słowo/)).toBeVisible({ timeout: 10000 });
    
    // Check if answer was correct
    const wasCorrect = await page.getByText(/Świetnie/).isVisible().catch(() => false);
    
    if (wasCorrect) {
      await quizPage.nextWord();
      
      // Mastered count should have increased
      const newText = await page.locator('.quiz-progress__counter').textContent();
      const newCount = parseInt(newText?.match(/(\d+) \//)?.[1] || '0');
      
      expect(newCount).toBe(initialCount + 1);
    }
  });
});

test.describe('Standard Mode vs Reinforce Mode', () => {
  test('should NOT show collection screen in standard mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Disable reinforce mode
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    
    await quizPage.startCustomQuiz(3);
    
    // Should go directly to playing (no collection screen)
    await quizPage.expectPlayingPage();
    
    // Should show simple counter (X / Y), not mastered counter with checkmark
    await expect(page.getByText(/✓/)).not.toBeVisible();
  });

  test('should show different progress format in each mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Test standard mode first
    const checkbox = page.getByRole('checkbox');
    await checkbox.uncheck();
    
    await quizPage.startCustomQuiz(2);
    await quizPage.expectPlayingPage();
    
    // Standard mode: no checkmark
    const standardProgress = await page.locator('.quiz-progress__counter').textContent();
    expect(standardProgress).not.toContain('✓');
    
    // End quiz
    await quizPage.endQuiz();
    await quizPage.expectSetupPage();
    
    // Now test reinforce mode
    await checkbox.check();
    
    await quizPage.startCustomQuiz(2);
    await quizPage.expectPlayingPage();
    
    // Reinforce mode: has checkmark
    await expect(page.getByText(/✓/)).toBeVisible();
  });
});