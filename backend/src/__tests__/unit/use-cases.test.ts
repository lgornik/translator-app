import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetRandomWordUseCase } from "../../application/use-cases/GetRandomWordUseCase.js";
import { GetRandomWordsUseCase } from "../../application/use-cases/GetRandomWordsUseCase.js";
import { CheckTranslationUseCase } from "../../application/use-cases/CheckTranslationUseCase.js";
import { GetCategoriesUseCase } from "../../application/use-cases/GetCategoriesUseCase.js";
import { GetDifficultiesUseCase } from "../../application/use-cases/GetDifficultiesUseCase.js";
import { GetWordCountUseCase } from "../../application/use-cases/GetWordCountUseCase.js";
import { GetAllWordsUseCase } from "../../application/use-cases/GetAllWordsUseCase.js";
import { ResetSessionUseCase } from "../../application/use-cases/ResetSessionUseCase.js";
import { Word } from "../../domain/entities/Word.js";
import { Session } from "../../domain/entities/Session.js";
import { WordId } from "../../domain/value-objects/WordId.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { IWordRepository } from "../../domain/repositories/IWordRepository.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { RandomWordPicker } from "../../domain/services/RandomWordPicker.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";
import { NullLogger } from "../../infrastructure/logging/Logger.js";
import {
  ISessionMutex,
  LockResult,
} from "../../infrastructure/persistence/SessionMutex.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestWord(
  overrides: {
    id?: string;
    polish?: string;
    english?: string;
    category?: string;
    difficulty?: number;
  } = {},
): Word {
  const result = Word.create({
    id: overrides.id ?? "word-1",
    polish: overrides.polish ?? "kot",
    english: overrides.english ?? "cat",
    category: overrides.category ?? "animals",
    difficulty: overrides.difficulty ?? 1,
  });
  if (!result.ok)
    throw new Error(`Failed to create test word: ${result.error.message}`);
  return result.value;
}

function createMockWordRepository(words: Word[] = []): IWordRepository {
  return {
    findById: vi.fn(
      async (id: WordId) => words.find((w) => w.id.equals(id)) ?? null,
    ),
    findByFilters: vi.fn(
      async (filters?: {
        category?: { name: string } | null;
        difficulty?: { value: number } | null;
      }) => {
        let filtered = words;
        if (filters?.category) {
          filtered = filtered.filter(
            (w) => w.category.name === filters.category!.name,
          );
        }
        if (filters?.difficulty) {
          filtered = filtered.filter(
            (w) => w.difficulty.value === filters.difficulty!.value,
          );
        }
        return filtered;
      },
    ),
    findAll: vi.fn(async () => words),
    count: vi.fn(
      async (filters?: {
        category?: { name: string } | null;
        difficulty?: { value: number } | null;
      }) => {
        let filtered = words;
        if (filters?.category) {
          filtered = filtered.filter(
            (w) => w.category.name === filters.category!.name,
          );
        }
        if (filters?.difficulty) {
          filtered = filtered.filter(
            (w) => w.difficulty.value === filters.difficulty!.value,
          );
        }
        return filtered.length;
      },
    ),
    getCategories: vi.fn(async () => {
      const categories = [...new Set(words.map((w) => w.category.name))];
      return categories.map((name) => ({
        name,
        count: words.filter((w) => w.category.name === name).length,
      }));
    }),
    getDifficulties: vi.fn(async () => {
      const difficulties = [...new Set(words.map((w) => w.difficulty.value))];
      return difficulties.map((value) => ({
        value,
        count: words.filter((w) => w.difficulty.value === value).length,
      }));
    }),
  };
}

function createMockSessionRepository(session?: Session): ISessionRepository {
  const sessions = new Map<string, Session>();
  if (session) {
    sessions.set(session.id.value, session);
  }

  return {
    findById: vi.fn(async (id: SessionId) => sessions.get(id.value) ?? null),
    findOrCreate: vi.fn(async (id: SessionId) => {
      let existing = sessions.get(id.value);
      if (!existing) {
        existing = Session.create(id);
        sessions.set(id.value, existing);
      }
      return existing;
    }),
    save: vi.fn(async (s: Session) => {
      sessions.set(s.id.value, s);
    }),
    delete: vi.fn(async (id: SessionId) => {
      sessions.delete(id.value);
    }),
    count: vi.fn(async () => sessions.size),
    deleteExpired: vi.fn(async () => 0),
  };
}

function createMockMutex(): ISessionMutex {
  return {
    acquire: vi.fn(
      async (): Promise<LockResult> => ({
        acquired: true,
        release: vi.fn(),
      }),
    ),
    withLock: vi.fn(async <T>(sessionId: string, fn: () => Promise<T>) => fn()),
  };
}

const logger = new NullLogger();

// ============================================================================
// GetRandomWordUseCase Tests
// ============================================================================

describe("GetRandomWordUseCase", () => {
  let useCase: GetRandomWordUseCase;
  let wordRepo: IWordRepository;
  let sessionRepo: ISessionRepository;
  let randomPicker: RandomWordPicker;
  let mutex: ISessionMutex;

  const testWords = [
    createTestWord({
      id: "w1",
      polish: "kot",
      english: "cat",
      category: "animals",
      difficulty: 1,
    }),
    createTestWord({
      id: "w2",
      polish: "pies",
      english: "dog",
      category: "animals",
      difficulty: 1,
    }),
    createTestWord({
      id: "w3",
      polish: "dom",
      english: "house",
      category: "home",
      difficulty: 2,
    }),
  ];

  beforeEach(() => {
    wordRepo = createMockWordRepository(testWords);
    sessionRepo = createMockSessionRepository();
    randomPicker = new RandomWordPicker();
    mutex = createMockMutex();
    useCase = new GetRandomWordUseCase(
      wordRepo,
      sessionRepo,
      randomPicker,
      logger,
      mutex,
    );
  });

  it("should return a random word for valid input", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("id");
      expect(result.value).toHaveProperty("wordToTranslate");
      expect(result.value).toHaveProperty("correctTranslation");
      expect(result.value.mode).toBe("EN_TO_PL");
    }
  });

  it("should return word in EN_TO_PL mode with english as wordToTranslate", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(["cat", "dog", "house"]).toContain(result.value.wordToTranslate);
    }
  });

  it("should return word in PL_TO_EN mode with polish as wordToTranslate", async () => {
    const result = await useCase.execute({
      mode: "PL_TO_EN",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(["kot", "pies", "dom"]).toContain(result.value.wordToTranslate);
    }
  });

  it("should filter by category", async () => {
    (wordRepo.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      testWords.filter((w) => w.category.name === "animals"),
    );

    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      category: "animals",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe("animals");
    }
  });

  it("should filter by difficulty", async () => {
    (wordRepo.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      testWords.filter((w) => w.difficulty.value === 2),
    );

    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      difficulty: 2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.difficulty).toBe(2);
    }
  });

  it("should fail with invalid mode", async () => {
    const result = await useCase.execute({
      mode: "INVALID_MODE" as "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should fail when no words available", async () => {
    (wordRepo.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      [],
    );

    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NO_WORDS_AVAILABLE");
    }
  });

  it("should use mutex when provided", async () => {
    await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(mutex.withLock).toHaveBeenCalledWith(
      "session-123",
      expect.any(Function),
    );
  });

  it("should work without mutex", async () => {
    const useCaseNoMutex = new GetRandomWordUseCase(
      wordRepo,
      sessionRepo,
      randomPicker,
      logger,
      undefined,
    );

    const result = await useCaseNoMutex.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
  });

  it("should track used words in session", async () => {
    // Get first word
    await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(sessionRepo.save).toHaveBeenCalled();
  });
});

// ============================================================================
// GetRandomWordsUseCase Tests
// ============================================================================

describe("GetRandomWordsUseCase", () => {
  let useCase: GetRandomWordsUseCase;
  let wordRepo: IWordRepository;
  let sessionRepo: ISessionRepository;
  let randomPicker: RandomWordPicker;
  let mutex: ISessionMutex;

  const testWords = [
    createTestWord({ id: "w1", polish: "kot", english: "cat" }),
    createTestWord({ id: "w2", polish: "pies", english: "dog" }),
    createTestWord({ id: "w3", polish: "dom", english: "house" }),
    createTestWord({ id: "w4", polish: "auto", english: "car" }),
    createTestWord({ id: "w5", polish: "drzewo", english: "tree" }),
  ];

  beforeEach(() => {
    wordRepo = createMockWordRepository(testWords);
    sessionRepo = createMockSessionRepository();
    randomPicker = new RandomWordPicker();
    mutex = createMockMutex();
    useCase = new GetRandomWordsUseCase(
      wordRepo,
      sessionRepo,
      randomPicker,
      logger,
      mutex,
    );
  });

  it("should return multiple random words", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      limit: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words.length).toBe(3);
    }
  });

  it("should return fewer words if not enough available", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      limit: 10, // More than available
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words.length).toBe(5); // All available words
    }
  });

  it("should return unique words", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      limit: 5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.value.words.map((w) => w.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ids.length);
    }
  });

  it("should cap limit to minimum 1", async () => {
    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      limit: 0,
    });

    // Limit 0 gets capped to 1, so it should succeed
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words.length).toBe(1);
    }
  });

  it("should return empty array when no words available", async () => {
    (wordRepo.findByFilters as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      [],
    );

    const result = await useCase.execute({
      mode: "EN_TO_PL",
      sessionId: "session-123",
      limit: 5,
    });

    // Returns empty array instead of error
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words).toHaveLength(0);
    }
  });
});

// ============================================================================
// CheckTranslationUseCase Tests
// ============================================================================

describe("CheckTranslationUseCase", () => {
  let useCase: CheckTranslationUseCase;
  let wordRepo: IWordRepository;
  let translationChecker: TranslationChecker;

  const testWord = createTestWord({ id: "w1", polish: "kot", english: "cat" });

  beforeEach(() => {
    wordRepo = createMockWordRepository([testWord]);
    translationChecker = new TranslationChecker();
    useCase = new CheckTranslationUseCase(wordRepo, translationChecker, logger);
  });

  it("should return correct for matching translation (EN_TO_PL)", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "kot",
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCorrect).toBe(true);
      expect(result.value.correctTranslation).toBe("kot");
    }
  });

  it("should return correct for matching translation (PL_TO_EN)", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "cat",
      mode: "PL_TO_EN",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCorrect).toBe(true);
      expect(result.value.correctTranslation).toBe("cat");
    }
  });

  it("should return incorrect for wrong translation", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "pies",
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCorrect).toBe(false);
    }
  });

  it("should be case-insensitive", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "KOT",
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCorrect).toBe(true);
    }
  });

  it("should trim whitespace", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "  kot  ",
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCorrect).toBe(true);
    }
  });

  it("should fail for non-existent word", async () => {
    const result = await useCase.execute({
      wordId: "non-existent",
      userTranslation: "kot",
      mode: "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("should fail for invalid mode", async () => {
    const result = await useCase.execute({
      wordId: "w1",
      userTranslation: "kot",
      mode: "INVALID" as "EN_TO_PL",
      sessionId: "session-123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

// ============================================================================
// GetCategoriesUseCase Tests
// ============================================================================

describe("GetCategoriesUseCase", () => {
  it("should return all categories", async () => {
    const testWords = [
      createTestWord({ category: "animals" }),
      createTestWord({ category: "animals", id: "w2" }),
      createTestWord({ category: "home", id: "w3" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetCategoriesUseCase(wordRepo);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categories).toHaveLength(2);
      expect(result.value.categories).toContain("animals");
      expect(result.value.categories).toContain("home");
    }
  });

  it("should return unique categories", async () => {
    const testWords = [
      createTestWord({ category: "animals", id: "w1" }),
      createTestWord({ category: "animals", id: "w2" }),
      createTestWord({ category: "home", id: "w3" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetCategoriesUseCase(wordRepo);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should have 2 unique categories, not 3
      expect(result.value.categories).toHaveLength(2);
    }
  });
});

// ============================================================================
// GetDifficultiesUseCase Tests
// ============================================================================

describe("GetDifficultiesUseCase", () => {
  it("should return all difficulties", async () => {
    const testWords = [
      createTestWord({ difficulty: 1, id: "w1" }),
      createTestWord({ difficulty: 2, id: "w2" }),
      createTestWord({ difficulty: 3, id: "w3" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetDifficultiesUseCase(wordRepo);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.difficulties).toContain(1);
      expect(result.value.difficulties).toContain(2);
      expect(result.value.difficulties).toContain(3);
    }
  });
});

// ============================================================================
// GetWordCountUseCase Tests
// ============================================================================

describe("GetWordCountUseCase", () => {
  it("should return total word count without filters", async () => {
    const testWords = [
      createTestWord({ id: "w1" }),
      createTestWord({ id: "w2" }),
      createTestWord({ id: "w3" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetWordCountUseCase(wordRepo);

    const result = await useCase.execute({});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.count).toBe(3);
    }
  });

  it("should return filtered count with category", async () => {
    const testWords = [
      createTestWord({ category: "animals", id: "w1" }),
      createTestWord({ category: "animals", id: "w2" }),
      createTestWord({ category: "home", id: "w3" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetWordCountUseCase(wordRepo);

    const result = await useCase.execute({ category: "animals" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.count).toBe(2);
    }
  });
});

// ============================================================================
// GetAllWordsUseCase Tests
// ============================================================================

describe("GetAllWordsUseCase", () => {
  it("should return all words", async () => {
    const testWords = [
      createTestWord({ id: "w1", polish: "kot", english: "cat" }),
      createTestWord({ id: "w2", polish: "pies", english: "dog" }),
    ];
    const wordRepo = createMockWordRepository(testWords);
    const useCase = new GetAllWordsUseCase(wordRepo);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words).toHaveLength(2);
      expect(result.value.words[0]).toHaveProperty("polish");
      expect(result.value.words[0]).toHaveProperty("english");
    }
  });
});

// ============================================================================
// ResetSessionUseCase Tests
// ============================================================================

describe("ResetSessionUseCase", () => {
  it("should delete existing session", async () => {
    const sessionId = SessionId.create("session-123");
    if (!sessionId.ok) throw new Error("Invalid session ID");

    const session = Session.create(sessionId.value);
    const sessionRepo = createMockSessionRepository(session);
    const useCase = new ResetSessionUseCase(sessionRepo, logger);

    const result = await useCase.execute({ sessionId: "session-123" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
    }
    expect(sessionRepo.delete).toHaveBeenCalled();
  });

  it("should succeed even if session does not exist", async () => {
    const sessionRepo = createMockSessionRepository();
    const useCase = new ResetSessionUseCase(sessionRepo, logger);

    const result = await useCase.execute({ sessionId: "non-existent" });

    expect(result.ok).toBe(true);
  });
});
