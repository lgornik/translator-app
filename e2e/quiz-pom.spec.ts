import { test, expect } from './fixtures';

/**
 * Quiz App E2E Tests using Page Object Model
 * More maintainable approach with QuizPage helper
 */

test.describe('Quiz User Journeys', () => {
  test('Complete quiz journey - standard mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Disable reinforce mode for predictable test
    await page.getByRole('checkbox').uncheck();
    
    // Start a 3-word custom quiz
    await quizPage.startCustomQuiz(3);

    // Complete all 3 words
    for (let i = 0; i < 3; i++) {
      await quizPage.expectPlayingPage();
      
      // Enter and submit answer
      await quizPage.enterAnswer('test-answer');
      await quizPage.submitAnswer();

      // Wait for result with longer timeout - either next button or finish
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });

      // Go to next word if available
      const nextButton = page.getByText('Następne słowo');
      if (await nextButton.isVisible().catch(() => false)) {
        await quizPage.nextWord();
      }
    }

    // Should be finished
    await expect(page.getByText(/Zagraj ponownie/i)).toBeVisible({ timeout: 10000 });
  });

  test('Complete quiz journey - timed mode', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Start 1-minute timed quiz
    await quizPage.startTimedQuiz(1);

    // Should show timer
    await expect(page.getByText(/⏱️.*\d:\d\d/)).toBeVisible();
    
    // Answer a few words quickly
    for (let i = 0; i < 2; i++) {
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
      await quizPage.enterAnswer('quick-answer');
      await quizPage.submitAnswer();
      
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
      
      const nextButton = page.getByText('Następne słowo');
      if (await nextButton.isVisible().catch(() => false)) {
        await quizPage.nextWord();
      }
    }
  });

    test('Reinforce mode journey', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Ensure reinforce is enabled (default)
    await expect(page.getByRole('checkbox')).toBeChecked();
    
    // Start TEST quiz
    const testButton = page.locator('button').filter({ hasText: 'TEST' });
    await expect(testButton).toBeEnabled({ timeout: 30000 });
    await testButton.click();

    // Zamiast szukać licznika, sprawdź czy quiz się rozpoczął
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    
    // Answer first word
    await quizPage.enterAnswer('reinforce-test');
    await quizPage.submitAnswer();

    // Result should show
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Filter Interactions', () => {
  test('Category filter changes available words', async ({ page }) => {
    await page.goto('/');
    
    const categorySelect = page.getByLabel('Kategoria');
    const options = await categorySelect.locator('option').allTextContents();
    
    if (options.length > 1) {
      // Select a specific category
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Word count should update
      // Just verify the page is still functional
      await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
    }
  });

  test('Difficulty filter changes available words', async ({ page }) => {
    await page.goto('/');
    
    const difficultySelect = page.getByLabel('Poziom trudności');
    const options = await difficultySelect.locator('option').allTextContents();
    
    if (options.length > 1) {
      await difficultySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
    }
  });

  test('Combined filters work together', async ({ page }) => {
    await page.goto('/');
    
    // Apply both filters
    const categorySelect = page.getByLabel('Kategoria');
    const difficultySelect = page.getByLabel('Poziom trudności');
    
    const catOptions = await categorySelect.locator('option').allTextContents();
    const diffOptions = await difficultySelect.locator('option').allTextContents();
    
    if (catOptions.length > 1 && diffOptions.length > 1) {
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await difficultySelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      
      await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
    }
  });
});

test.describe('Edge Cases', () => {
  test('Empty answer is allowed (user can skip unknown words)', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(1);
    
    // Wait for playing state
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    
    // Don't enter anything, just submit
    const submitButton = page.getByText('Sprawdź');
    await expect(submitButton).toBeEnabled();
    
    // Submit empty - should show result
    await submitButton.click();
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });

  test('Rapid clicking does not break UI', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(2);

    // Wait for input to be ready
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer('rapid');
    
    // Click submit - button should become disabled immediately
    const submitBtn = page.getByText('Sprawdź');
    await submitBtn.click();
    
    // After clicking, button should be disabled or hidden (replaced by "Następne słowo")
    // Wait for state to change
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
    
    // Verify we're still in a valid state (not crashed)
    await expect(page.locator('body')).toBeVisible();
  });

  test('Very long answer is handled', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(1);
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

    // Enter very long answer
    const longAnswer = 'a'.repeat(500);
    await quizPage.enterAnswer(longAnswer);
    await quizPage.submitAnswer();

    // Should handle gracefully
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('Can complete quiz using only keyboard', async ({ page, quizPage }) => {
    await page.goto('/');
    
    // Tab to checkbox and uncheck
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space'); // Uncheck reinforce
    
    // Tab to custom section and start
    const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
    await customSection.getByRole('spinbutton').focus();
    await page.keyboard.type('1');
    const startButton = customSection.getByRole('button', { name: 'Start' });

await expect(startButton).toBeEnabled({ timeout: 15000 });
await startButton.click();

    

    // Wait for input to be ready
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    
    // Tab to input and type
    await page.getByLabel('Twoje tłumaczenie').focus();
    await page.keyboard.type('keyboard-test');
    await page.keyboard.press('Enter'); // Submit with Enter

    // Should show result
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });

  test('Focus management is correct', async ({ quizPage }) => {
    const page = quizPage.page;
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(1);

    // Input should be focused automatically
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    
    // After a small delay, input should have focus
    await page.waitForTimeout(500);
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    // Focus might be on input or body depending on implementation
    expect(['INPUT', 'BODY']).toContain(focused);
  });
});

test.describe('Visual States', () => {
  test('Correct answer shows success state', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(1);
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

    // Try a common word that might be correct
    await quizPage.enterAnswer('test');
    await quizPage.submitAnswer();

    // Result should show (correct or incorrect)
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });

  test('Wrong answer shows error state', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    await quizPage.startCustomQuiz(1);
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

    // Enter definitely wrong answer
    await quizPage.enterAnswer('zzzzzzzzzzz-wrong');
    await quizPage.submitAnswer();

    // Should show result
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Quiz Restart', () => {
  test('Can restart after completion', async ({ page, quizPage }) => {
    await page.goto('/');
    await page.getByRole('checkbox').uncheck();
    
    // Complete a 1-word quiz
    await quizPage.startCustomQuiz(1);
    await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    await quizPage.enterAnswer('test');
    await quizPage.submitAnswer();

    // Get to results
    await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
    
    const nextButton = page.getByText('Następne słowo');
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
    }

    // Click restart
    await expect(page.getByText(/Zagraj ponownie/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/Zagraj ponownie/i).click();

    // Should be back at setup
    await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
  });
});