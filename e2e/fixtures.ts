import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixtures for Quiz App
 */

// Custom fixtures
interface QuizFixtures {
  quizPage: QuizPage;
}

// Page Object Model for Quiz
class QuizPage {
  constructor(public page: any) {}

  // Navigation
  async goto() {
    await this.page.goto('/');
  }

  // Setup page actions
  async selectCategory(category: string) {
    await this.page.getByLabel('Kategoria').selectOption(category);
  }

  async selectDifficulty(difficulty: string) {
    await this.page.getByLabel('Poziom trudności').selectOption(difficulty);
  }

  async toggleMode() {
    const button = this.page.getByText(/EN → PL|PL → EN/);
    await button.click();
  }

  async toggleReinforceMode() {
    await this.page.getByRole('checkbox').click();
  }

  async startTestQuiz() {
    const testButton = this.page.locator('button').filter({ hasText: 'TEST' });
    await expect(testButton).toBeEnabled({ timeout: 15000 });
    await testButton.click();
  }

  async startTimedQuiz(minutes: number) {
    const section = this.page.locator('.quiz-option').filter({ hasText: 'Na czas' });
    await section.getByRole('spinbutton').fill(String(minutes));
    const startButton = section.getByText('Start');
    await expect(startButton).toBeEnabled({ timeout: 15000 });
    await startButton.click();
  }

  async startCustomQuiz(wordCount: number) {
    const section = this.page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
    await section.getByRole('spinbutton').fill(String(wordCount));
    const startButton = section.getByText('Start');
    await expect(startButton).toBeEnabled({ timeout: 15000 });
    await startButton.click();
  }

  // Playing page actions
  async enterAnswer(answer: string) {
    await this.page.getByLabel('Twoje tłumaczenie').fill(answer);
  }

  async submitAnswer() {
    await this.page.getByText('Sprawdź').click();
  }

  async submitAnswerWithEnter() {
    await this.page.getByLabel('Twoje tłumaczenie').press('Enter');
  }

  async nextWord() {
    await this.page.getByText('Następne słowo').click();
  }

  async endQuiz() {
    await this.page.getByText(/✕ Zakończ/).click();
  }

  // Results page actions
  async restartQuiz() {
    await this.page.getByText(/zagraj ponownie/i).click();
  }

  // Assertions helpers
  async expectSetupPage() {
    await expect(this.page.getByText('Wybierz tryb quizu')).toBeVisible();
  }

  async expectPlayingPage() {
    await expect(this.page.getByText('Przetłumacz z')).toBeVisible();
  }

  async expectResultsPage() {
    await expect(this.page.getByText(/zagraj ponownie/i)).toBeVisible();
  }

  async expectCorrectAnswer() {
    await expect(this.page.getByText(/Świetnie/)).toBeVisible();
  }

  async expectIncorrectAnswer() {
    await expect(this.page.getByText(/Niestety/)).toBeVisible();
  }

  // Get current word
  async getCurrentWord() {
    const wordDisplay = this.page.locator('.word-display__word');
    return await wordDisplay.textContent();
  }

  // Get stats
  async getStats() {
    const correct = await this.page.locator('.stats__value--correct').textContent();
    const incorrect = await this.page.locator('.stats__value--incorrect').textContent();
    return {
      correct: parseInt(correct || '0'),
      incorrect: parseInt(incorrect || '0'),
    };
  }

  // Pool collection helpers
  async expectCollectingPoolScreen() {
    await expect(this.page.getByText('Przygotowywanie słów do nauki')).toBeVisible();
  }

  async cancelPoolCollection() {
    await this.page.getByRole('button', { name: 'Anuluj' }).click();
  }

  async getPoolProgress() {
    const progressText = await this.page.getByText(/\d+ \/ \d+ słów/).textContent();
    const match = progressText?.match(/(\d+) \/ (\d+)/);
    return {
      collected: parseInt(match?.[1] || '0'),
      target: parseInt(match?.[2] || '0'),
    };
  }

  // Reinforce mode helpers
  async getMasteredCount() {
    const counterText = await this.page.locator('.quiz-progress__counter').textContent();
    const match = counterText?.match(/(\d+) \/ (\d+)/);
    return {
      mastered: parseInt(match?.[1] || '0'),
      total: parseInt(match?.[2] || '0'),
    };
  }

  async getRepeatCount() {
    const repeatText = await this.page.locator('.quiz-progress__repeat').textContent();
    const match = repeatText?.match(/(\d+)/);
    return parseInt(match?.[1] || '0');
  }

  async isReinforceMode() {
    return await this.page.getByText(/✔/).isVisible().catch(() => false);
  }

  async hasRepeatIndicator() {
    return await this.page.getByText(/🔄.*do powtórki/).isVisible().catch(() => false);
  }

  // Assertions
  async expectReinforceProgress(mastered: number, total: number) {
    await expect(this.page.getByText(new RegExp(`✔.*${mastered}.*\\/.*${total}`))).toBeVisible();
  }

  async expectRepeatIndicator(count?: number) {
    if (count !== undefined) {
      await expect(this.page.getByText(new RegExp(`🔄.*${count}.*do powtórki`))).toBeVisible();
    } else {
      await expect(this.page.getByText(/🔄.*do powtórki/)).toBeVisible();
    }
  }
}

// Export extended test
export const test = base.extend<QuizFixtures>({
  quizPage: async ({ page }, use) => {
    const quizPage = new QuizPage(page);
    await use(quizPage);
  },
});

export { expect };