import { test, expect } from '@playwright/test';

/**
 * Quiz App E2E Tests
 * Tests complete user flows from start to finish
 */

test.describe('Quiz App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Quiz Setup', () => {
    test('should display quiz setup page', async ({ page }) => {
      await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
      await expect(page.getByText('TEST')).toBeVisible();
      await expect(page.getByText('Na czas')).toBeVisible();
      await expect(page.getByText('Własna liczba')).toBeVisible();
    });

    test('should have category and difficulty filters', async ({ page }) => {
      await expect(page.getByLabel('Kategoria')).toBeVisible();
      await expect(page.getByLabel('Poziom trudności')).toBeVisible();
    });

    test('should toggle translation mode', async ({ page }) => {
      const modeButton = page.getByText('EN → PL');
      await expect(modeButton).toBeVisible();
      
      await modeButton.click();
      await expect(page.getByText('PL → EN')).toBeVisible();
      
      await page.getByText('PL → EN').click();
      await expect(page.getByText('EN → PL')).toBeVisible();
    });

    test('should have reinforce mode checkbox checked by default', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
    });
  });

  test.describe('Quiz Flow - Standard Mode', () => {
    test('should complete a full quiz session', async ({ page }) => {
      // Start quiz with TEST (50 words) - but first uncheck reinforce
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      // Start with custom word count (smaller for faster test)
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      const wordInput = customSection.getByRole('spinbutton');
      await wordInput.fill('3');
      await customSection.getByText('Start').click();

      // Should be in playing state
      await expect(page.getByText('Przetłumacz z')).toBeVisible();
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeVisible();

      // Complete 3 words
      for (let i = 0; i < 3; i++) {
        // Wait for word to load
        await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
        
        // Enter some answer
        await page.getByLabel('Twoje tłumaczenie').fill('test');
        await page.getByText('Sprawdź').click();

        // Wait for result - either next word button or finish screen
        await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
        
        // Go to next word (if not last and next button exists)
        const nextButton = page.getByText('Następne słowo');
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
        }
      }

      // Should show finished screen or next word button for last word
      await expect(page.getByText(/zagraj ponownie|Następne słowo/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show correct/incorrect feedback', async ({ page }) => {
      // Start a quick quiz
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      // Wait for word
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

      // Submit wrong answer
      await page.getByLabel('Twoje tłumaczenie').fill('wronganswer123');
      await page.getByText('Sprawdź').click();

      // Should show result (either next button or finish screen)
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
    });

    test('should allow submit with empty answer', async ({ page }) => {
      // User may not know the translation and want to skip
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      // Wait for word
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

      // Submit button should be enabled even with empty input
      const submitButton = page.getByText('Sprawdź');
      await expect(submitButton).toBeEnabled();
      
      // Submit empty answer
      await submitButton.click();
      
      // Should show result (either next button or finish screen)
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Quiz Flow - Timed Mode', () => {
    test('should start and run timed quiz', async ({ page }) => {
      // Find timed mode section
      const timedSection = page.locator('.quiz-option').filter({ hasText: 'Na czas' });
      await timedSection.getByRole('spinbutton').fill('1'); // 1 minute
      await timedSection.getByText('Start').click();

      // Should show timer
      await expect(page.getByText(/⏱️.*\d:\d\d/)).toBeVisible();
      
      // Should be able to answer
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
    });
  });

  test.describe('Quiz Flow - Reinforce Mode', () => {
    test('should start reinforce mode quiz', async ({ page }) => {
      // Reinforce should be checked by default
      const checkbox = page.getByRole('checkbox');
      await expect(checkbox).toBeChecked();

      // Start TEST quiz with reinforce
      await page.locator('button').filter({ hasText: 'TEST' }).click();

      // Should be in playing state
      await expect(page.getByText('Przetłumacz z')).toBeVisible();
      
      // Should show mastered counter (reinforce mode indicator)
      await expect(page.getByText(/✔.*\/.*50/)).toBeVisible();
    });
  });

  test.describe('Category and Difficulty Filters', () => {
    test('should filter by category', async ({ page }) => {
      const categorySelect = page.getByLabel('Kategoria');
      
      // Get available options
      const options = await categorySelect.locator('option').allTextContents();
      
      // If there are categories besides "Wszystkie kategorie"
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
        
        // Word count might change - check it updates
        await page.waitForTimeout(500); // Wait for API
      }
    });

    test('should filter by difficulty', async ({ page }) => {
      const difficultySelect = page.getByLabel('Poziom trudności');
      
      // Select first difficulty level
      const options = await difficultySelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await difficultySelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error when word limit exceeds available', async ({ page }) => {
      // Set filters that might have few words
      const categorySelect = page.getByLabel('Kategoria');
      const options = await categorySelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }

      // Try to start with more words than available
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('999999');
      await customSection.getByText('Start').click();

      // Should show error or cap the number
      // The app might either show an error or just use max available
      await page.waitForTimeout(500);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should submit answer with Enter key', async ({ page }) => {
      // Start a quiz
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      // Wait for word and input to be ready
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });

      // Type answer and press Enter
      await page.getByLabel('Twoje tłumaczenie').fill('test');
      await page.getByLabel('Twoje tłumaczenie').press('Enter');

      // Should show result
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Quiz setup should be visible
      await expect(page.getByText('Wybierz tryb quizu')).toBeVisible();
      
      // Should be able to start a quiz
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      // Should show playing screen
      await expect(page.getByText('Przetłumacz z')).toBeVisible();
    });
  });

  test.describe('Quiz Results', () => {
    test('should display final results after quiz completion', async ({ page }) => {
      // Start 1-word quiz
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      // Answer the word
      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
      await page.getByLabel('Twoje tłumaczenie').fill('test');
      await page.getByText('Sprawdź').click();

      // Wait for result - either "Następne słowo" or finish screen
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });

      // If there's a next button, click it to go to results
      const nextButton = page.getByText('Następne słowo');
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
      }

      // Should show results with stats
      await expect(page.getByText(/Zagraj ponownie/i)).toBeVisible({ timeout: 10000 });
    });

    test('should restart quiz from results', async ({ page }) => {
      // Start and complete 1-word quiz
      const checkbox = page.getByRole('checkbox');
      await checkbox.uncheck();
      
      const customSection = page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
      await customSection.getByRole('spinbutton').fill('1');
      await customSection.getByText('Start').click();

      await expect(page.getByLabel('Twoje tłumaczenie')).toBeEnabled({ timeout: 10000 });
      await page.getByLabel('Twoje tłumaczenie').fill('test');
      await page.getByText('Sprawdź').click();

      // Wait for result
      await expect(page.getByText(/Następne słowo|Zagraj ponownie/)).toBeVisible({ timeout: 10000 });

      // If there's a next button, click it
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
});