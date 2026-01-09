import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { quizMachine } from "../features/quiz/machines/quizMachine";
import { TranslationMode, Difficulty } from "../shared/types";
import type { WordChallenge } from "../shared/types";

describe("Quiz Machine", () => {
  const createQuizActor = () => createActor(quizMachine);

  const createTestWord = (
    overrides: Partial<WordChallenge> = {},
  ): WordChallenge => ({
    id: "1",
    wordToTranslate: "cat",
    mode: TranslationMode.EN_TO_PL,
    category: "Animals",
    difficulty: Difficulty.EASY,
    ...overrides,
  });

  describe("Initial State", () => {
    it("should start in setup state", () => {
      const actor = createQuizActor();
      actor.start();

      expect(actor.getSnapshot().value).toBe("setup");
    });

    it("should have default context values", () => {
      const actor = createQuizActor();
      actor.start();

      const { context } = actor.getSnapshot();
      expect(context.mode).toBe(TranslationMode.EN_TO_PL);
      expect(context.wordLimit).toBe(50);
      expect(context.stats).toEqual({ correct: 0, incorrect: 0 });
    });
  });

  describe("START Event", () => {
    it("should transition to loading state", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({
        type: "START",
        settings: { wordLimit: 10 },
      });

      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("should apply settings to context", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({
        type: "START",
        settings: {
          wordLimit: 25,
          category: "Animals",
          mode: TranslationMode.PL_TO_EN,
        },
      });

      const { context } = actor.getSnapshot();
      expect(context.wordLimit).toBe(25);
      expect(context.category).toBe("Animals");
      expect(context.mode).toBe(TranslationMode.PL_TO_EN);
    });
  });

  describe("WORD_LOADED Event", () => {
    it("should transition to playing.waitingForInput", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });

      expect(actor.getSnapshot().value).toEqual({ playing: "waitingForInput" });
    });

    it("should set current word in context", () => {
      const actor = createQuizActor();
      actor.start();

      const testWord = createTestWord();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: testWord });

      const { context } = actor.getSnapshot();
      expect(context.currentWord).toEqual(testWord);
    });
  });

  describe("INPUT_CHANGE Event", () => {
    it("should update userInput in context", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });
      actor.send({ type: "INPUT_CHANGE", value: "test" });

      expect(actor.getSnapshot().context.userInput).toBe("test");
    });
  });

  describe("RESULT_RECEIVED Event", () => {
    it("should update stats for correct answer", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });
      actor.send({ type: "SUBMIT" });
      actor.send({
        type: "RESULT_RECEIVED",
        result: {
          isCorrect: true,
          correctTranslation: "kot",
          userTranslation: "kot",
        },
      });

      const { context } = actor.getSnapshot();
      expect(context.stats.correct).toBe(1);
      expect(context.stats.incorrect).toBe(0);
    });

    it("should update stats for incorrect answer", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });
      actor.send({ type: "SUBMIT" });
      actor.send({
        type: "RESULT_RECEIVED",
        result: {
          isCorrect: false,
          correctTranslation: "kot",
          userTranslation: "pies",
        },
      });

      const { context } = actor.getSnapshot();
      expect(context.stats.correct).toBe(0);
      expect(context.stats.incorrect).toBe(1);
    });
  });

  describe("TOGGLE_MODE Event", () => {
    it("should toggle translation mode", () => {
      const actor = createQuizActor();
      actor.start();

      expect(actor.getSnapshot().context.mode).toBe(TranslationMode.EN_TO_PL);

      actor.send({ type: "TOGGLE_MODE" });
      expect(actor.getSnapshot().context.mode).toBe(TranslationMode.PL_TO_EN);

      actor.send({ type: "TOGGLE_MODE" });
      expect(actor.getSnapshot().context.mode).toBe(TranslationMode.EN_TO_PL);
    });
  });

  describe("RESET Event", () => {
    it("should return to setup state", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: {} });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });

      actor.send({ type: "RESET" });

      expect(actor.getSnapshot().value).toBe("setup");
    });

    it("should reset context to initial values", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: { wordLimit: 10 } });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });
      actor.send({ type: "SUBMIT" });
      actor.send({
        type: "RESULT_RECEIVED",
        result: {
          isCorrect: true,
          correctTranslation: "kot",
          userTranslation: "kot",
        },
      });

      actor.send({ type: "RESET" });

      const { context } = actor.getSnapshot();
      expect(context.stats).toEqual({ correct: 0, incorrect: 0 });
      expect(context.currentWord).toBeNull();
      expect(context.wordsCompleted).toBe(0);
    });
  });

  describe("Quiz Completion", () => {
    it("should transition to finished when word limit reached", () => {
      const actor = createQuizActor();
      actor.start();

      actor.send({ type: "START", settings: { wordLimit: 1 } });
      actor.send({ type: "WORD_LOADED", word: createTestWord() });
      actor.send({ type: "SUBMIT" });
      actor.send({
        type: "RESULT_RECEIVED",
        result: {
          isCorrect: true,
          correctTranslation: "kot",
          userTranslation: "kot",
        },
      });

      expect(actor.getSnapshot().value).toBe("finished");
    });
  });
});
