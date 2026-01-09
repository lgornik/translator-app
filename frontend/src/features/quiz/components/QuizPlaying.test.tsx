import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizPlaying } from "./QuizPlaying";
import { TranslationMode, Difficulty } from "@/shared/types";
import type { WordChallenge } from "@/shared/types";

describe("QuizPlaying", () => {
  const createMockWord = (
    overrides: Partial<WordChallenge> = {},
  ): WordChallenge => ({
    id: "1",
    wordToTranslate: "cat",
    mode: TranslationMode.EN_TO_PL,
    category: "Animals",
    difficulty: Difficulty.EASY,
    ...overrides,
  });

  const createMockResult = (isCorrect: boolean) => ({
    isCorrect,
    correctTranslation: "kot",
    userTranslation: isCorrect ? "kot" : "pies",
  });

  const defaultProps = {
    mode: TranslationMode.EN_TO_PL,
    currentWord: createMockWord(),
    userInput: "",
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

  describe("Word Display", () => {
    it("should display the word to translate", () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByText("cat")).toBeInTheDocument();
    });

    it("should display language info", () => {
      render(<QuizPlaying {...defaultProps} />);

      expect(screen.getByText(/angielski/)).toBeInTheDocument();
      expect(screen.getByText(/polski/)).toBeInTheDocument();
    });

    it("should show no more words message when noMoreWords is true", () => {
      render(
        <QuizPlaying {...defaultProps} noMoreWords={true} currentWord={null} />,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("should call onInputChange when typing", async () => {
      render(<QuizPlaying {...defaultProps} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "k" } });

      expect(defaultProps.onInputChange).toHaveBeenCalledWith("k");
    });

    it("should display current userInput value", () => {
      render(<QuizPlaying {...defaultProps} userInput="ko" />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("ko");
    });

    it("should disable input when loading", () => {
      render(<QuizPlaying {...defaultProps} loading={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });

  describe("Submit Button", () => {
    it("should show submit button when no result", () => {
      render(<QuizPlaying {...defaultProps} />);

      const submitBtn = screen.getByRole("button", { name: /sprawdź/i });
      expect(submitBtn).toBeInTheDocument();
    });

    it("should call onSubmit when submit button is clicked", async () => {
      render(<QuizPlaying {...defaultProps} userInput="kot" />);

      const submitBtn = screen.getByRole("button", { name: /sprawdź/i });
      await userEvent.click(submitBtn);

      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it("should call onSubmit on Enter key press", () => {
      render(<QuizPlaying {...defaultProps} userInput="kot" />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  describe("Result Display", () => {
    it("should show correct result styling when answer is correct", () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      expect(screen.getByText(/świetnie/i)).toBeInTheDocument();
    });

    it("should show incorrect result with correct answer when wrong", () => {
      render(
        <QuizPlaying {...defaultProps} result={createMockResult(false)} />,
      );

      expect(screen.getByText("kot")).toBeInTheDocument();
    });

    it("should show next word button after result", () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      const nextBtn = screen.getByRole("button", { name: /następne/i });
      expect(nextBtn).toBeInTheDocument();
    });

    it("should call onNextWord when clicking next button", async () => {
      render(<QuizPlaying {...defaultProps} result={createMockResult(true)} />);

      const nextBtn = screen.getByRole("button", { name: /następne/i });
      await userEvent.click(nextBtn);

      expect(defaultProps.onNextWord).toHaveBeenCalled();
    });
  });

  describe("Progress Display", () => {
    it("should show word count progress", () => {
      render(
        <QuizPlaying {...defaultProps} wordsCompleted={7} wordLimit={50} />,
      );

      expect(screen.getByText("7 / 50")).toBeInTheDocument();
    });

    it("should show timer when timeRemaining is set", () => {
      render(
        <QuizPlaying {...defaultProps} timeRemaining={125} wordLimit={999} />,
      );

      // formatTime(125) should be "2:05"
      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });
  });

  describe("Reinforce Mode", () => {
    it("should show mastered count in reinforce mode", () => {
      render(
        <QuizPlaying
          {...defaultProps}
          reinforceMode={true}
          masteredCount={3}
          wordLimit={10}
        />,
      );

      expect(screen.getByText("3 / 10")).toBeInTheDocument();
    });

    it("should show words to repeat count", () => {
      render(
        <QuizPlaying
          {...defaultProps}
          reinforceMode={true}
          wordsToRepeatCount={5}
        />,
      );

      expect(screen.getByText(/5 do powtórki/)).toBeInTheDocument();
    });
  });

  describe("Stats Display", () => {
    it("should display correct answer count", () => {
      render(
        <QuizPlaying {...defaultProps} stats={{ correct: 5, incorrect: 2 }} />,
      );

      const statsRegion = screen.getByRole("region", { name: /statystyki/i });
      expect(statsRegion).toHaveTextContent("5");
    });

    it("should display incorrect answer count", () => {
      render(
        <QuizPlaying {...defaultProps} stats={{ correct: 5, incorrect: 2 }} />,
      );

      const statsRegion = screen.getByRole("region", { name: /statystyki/i });
      expect(statsRegion).toHaveTextContent("2");
    });

    it("should display accuracy percentage", () => {
      render(
        <QuizPlaying {...defaultProps} stats={{ correct: 7, incorrect: 3 }} />,
      );

      // 7/(7+3) = 70%
      expect(screen.getByText("70%")).toBeInTheDocument();
    });

    it("should handle zero stats", () => {
      render(
        <QuizPlaying {...defaultProps} stats={{ correct: 0, incorrect: 0 }} />,
      );

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Reset/End Button", () => {
    it("should have end button in header", () => {
      render(<QuizPlaying {...defaultProps} />);

      const endBtn = screen.getByRole("button", { name: /zakończ quiz/i });
      expect(endBtn).toBeInTheDocument();
    });

    it("should call onReset when end button clicked", async () => {
      render(<QuizPlaying {...defaultProps} />);

      const endBtn = screen.getByRole("button", { name: /zakończ quiz/i });
      await userEvent.click(endBtn);

      expect(defaultProps.onReset).toHaveBeenCalled();
    });

    it("should show end quiz button when noMoreWords is true", () => {
      render(
        <QuizPlaying {...defaultProps} noMoreWords={true} currentWord={null} />,
      );

      const buttons = screen.getAllByRole("button", { name: /zakończ quiz/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should call onReset when main end button clicked in noMoreWords state", async () => {
      render(
        <QuizPlaying {...defaultProps} noMoreWords={true} currentWord={null} />,
      );

      const buttons = screen.getAllByRole("button", { name: /zakończ quiz/i });
      const mainButton = buttons[buttons.length - 1]; // Last one is the main action
      await userEvent.click(mainButton!);

      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  describe("Mode Display", () => {
    it("should show EN to PL mode correctly", () => {
      render(<QuizPlaying {...defaultProps} mode={TranslationMode.EN_TO_PL} />);

      expect(screen.getByText(/angielski/)).toBeInTheDocument();
      expect(screen.getByText(/polski/)).toBeInTheDocument();
    });

    it("should show PL to EN mode correctly", () => {
      render(<QuizPlaying {...defaultProps} mode={TranslationMode.PL_TO_EN} />);

      const text = screen.getByText(/przetłumacz z/i);
      expect(text).toHaveTextContent(/polski/);
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when loading", () => {
      render(
        <QuizPlaying {...defaultProps} loading={true} currentWord={null} />,
      );

      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("should disable submit button when loading", () => {
      render(<QuizPlaying {...defaultProps} loading={true} />);

      const submitBtn = screen.getByRole("button", { name: /sprawdź/i });
      expect(submitBtn).toBeDisabled();
    });
  });
});
