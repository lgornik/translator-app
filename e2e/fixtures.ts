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
    await this.page.locator('button').filter({ hasText: 'TEST' }).click();
  }

  async startTimedQuiz(minutes: number) {
    const section = this.page.locator('.quiz-option').filter({ hasText: 'Na czas' });
    await section.getByRole('spinbutton').fill(String(minutes));
    await section.getByText('Start').click();
  }

  async startCustomQuiz(wordCount: number) {
    const section = this.page.locator('.quiz-option').filter({ hasText: 'Własna liczba' });
    await section.getByRole('spinbutton').fill(String(wordCount));
    await section.getByText('Start').click();
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
}

// Export extended test
export const test = base.extend<QuizFixtures>({
  quizPage: async ({ page }, use) => {
    const quizPage = new QuizPage(page);
    await use(quizPage);
  },
});

export { expect };