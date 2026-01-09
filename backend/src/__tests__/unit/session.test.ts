import { describe, it, expect, beforeEach } from "vitest";
import { Session } from "../../domain/entities/Session.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { WordId } from "../../domain/value-objects/WordId.js";

describe("Session Entity", () => {
  let session: Session;
  let sessionId: SessionId;

  beforeEach(() => {
    const result = SessionId.create("test-session-123");
    if (!result.ok) throw new Error("Failed to create session ID");
    sessionId = result.value;
    session = Session.create(sessionId);
  });

  describe("create", () => {
    it("should create session with given ID", () => {
      expect(session.id.equals(sessionId)).toBe(true);
    });

    it("should create session with empty used words", () => {
      expect(session.usedWordCount).toBe(0);
    });

    it("should set createdAt to current time", () => {
      const now = new Date();
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(session.createdAt.getTime()).toBeGreaterThan(now.getTime() - 1000);
    });

    it("should set lastAccessedAt to current time", () => {
      const now = new Date();
      expect(session.lastAccessedAt.getTime()).toBeLessThanOrEqual(
        now.getTime(),
      );
    });
  });

  describe("markWordAsUsed", () => {
    it("should mark word as used", () => {
      const wordIdResult = WordId.create("word-1");
      if (!wordIdResult.ok) throw new Error("Failed to create word ID");
      const wordId = wordIdResult.value;

      session.markWordAsUsed(wordId);

      expect(session.hasUsedWord(wordId)).toBe(true);
      expect(session.usedWordCount).toBe(1);
    });

    it("should update lastAccessedAt", async () => {
      const wordIdResult = WordId.create("word-1");
      if (!wordIdResult.ok) throw new Error("Failed to create word ID");
      const wordId = wordIdResult.value;

      const before = session.lastAccessedAt;
      await new Promise((r) => setTimeout(r, 10));
      session.markWordAsUsed(wordId);

      expect(session.lastAccessedAt.getTime()).toBeGreaterThan(
        before.getTime(),
      );
    });

    it("should not duplicate words", () => {
      const wordIdResult = WordId.create("word-1");
      if (!wordIdResult.ok) throw new Error("Failed to create word ID");
      const wordId = wordIdResult.value;

      session.markWordAsUsed(wordId);
      session.markWordAsUsed(wordId);

      expect(session.usedWordCount).toBe(1);
    });

    it("should track multiple different words", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");
      const word3 = WordId.create("word-3");

      if (!word1.ok || !word2.ok || !word3.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);
      session.markWordAsUsed(word2.value);
      session.markWordAsUsed(word3.value);

      expect(session.usedWordCount).toBe(3);
      expect(session.hasUsedWord(word1.value)).toBe(true);
      expect(session.hasUsedWord(word2.value)).toBe(true);
      expect(session.hasUsedWord(word3.value)).toBe(true);
    });
  });

  describe("hasUsedWord", () => {
    it("should return false for unused word", () => {
      const wordIdResult = WordId.create("word-1");
      if (!wordIdResult.ok) throw new Error("Failed to create word ID");

      expect(session.hasUsedWord(wordIdResult.value)).toBe(false);
    });

    it("should return true for used word", () => {
      const wordIdResult = WordId.create("word-1");
      if (!wordIdResult.ok) throw new Error("Failed to create word ID");
      const wordId = wordIdResult.value;

      session.markWordAsUsed(wordId);

      expect(session.hasUsedWord(wordId)).toBe(true);
    });
  });

  describe("resetWords", () => {
    it("should reset specified words", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");
      const word3 = WordId.create("word-3");

      if (!word1.ok || !word2.ok || !word3.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);
      session.markWordAsUsed(word2.value);
      session.markWordAsUsed(word3.value);

      // Reset only word1 and word2
      session.resetWords([word1.value, word2.value]);

      expect(session.hasUsedWord(word1.value)).toBe(false);
      expect(session.hasUsedWord(word2.value)).toBe(false);
      expect(session.hasUsedWord(word3.value)).toBe(true);
      expect(session.usedWordCount).toBe(1);
    });

    it("should handle reset of all words", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");

      if (!word1.ok || !word2.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);
      session.markWordAsUsed(word2.value);

      session.resetWords([word1.value, word2.value]);

      expect(session.usedWordCount).toBe(0);
    });

    it("should handle reset of non-existent words", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");

      if (!word1.ok || !word2.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);

      // Try to reset word that was never used
      session.resetWords([word2.value]);

      expect(session.usedWordCount).toBe(1);
      expect(session.hasUsedWord(word1.value)).toBe(true);
    });

    it("should update lastAccessedAt", async () => {
      const word1 = WordId.create("word-1");
      if (!word1.ok) throw new Error("Failed to create word ID");

      session.markWordAsUsed(word1.value);
      const before = session.lastAccessedAt;

      await new Promise((r) => setTimeout(r, 10));
      session.resetWords([word1.value]);

      expect(session.lastAccessedAt.getTime()).toBeGreaterThan(
        before.getTime(),
      );
    });
  });

  describe("reset", () => {
    it("should reset all used words", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");

      if (!word1.ok || !word2.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);
      session.markWordAsUsed(word2.value);

      session.reset();

      expect(session.usedWordCount).toBe(0);
      expect(session.hasUsedWord(word1.value)).toBe(false);
      expect(session.hasUsedWord(word2.value)).toBe(false);
    });
  });

  describe("usedWordIds", () => {
    it("should return empty set for new session", () => {
      expect(session.usedWordIds.size).toBe(0);
    });

    it("should return all used word IDs", () => {
      const word1 = WordId.create("word-1");
      const word2 = WordId.create("word-2");

      if (!word1.ok || !word2.ok) {
        throw new Error("Failed to create word IDs");
      }

      session.markWordAsUsed(word1.value);
      session.markWordAsUsed(word2.value);

      expect(session.usedWordIds.size).toBe(2);
      expect(session.usedWordIds.has("word-1")).toBe(true);
      expect(session.usedWordIds.has("word-2")).toBe(true);
    });
  });

  describe("isExpired", () => {
    it("should return false for fresh session", () => {
      // 24 hours in ms
      expect(session.isExpired(24 * 60 * 60 * 1000)).toBe(false);
    });

    it("should return true for old session", () => {
      // Create session with old dates using fromData
      const oldData = {
        id: "old-session",
        usedWordIds: [],
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        lastAccessedAt: new Date(
          Date.now() - 25 * 60 * 60 * 1000,
        ).toISOString(),
      };
      const oldSession = Session.fromData(oldData);

      // 24 hours in ms
      expect(oldSession.isExpired(24 * 60 * 60 * 1000)).toBe(true);
    });

    it("should use lastAccessedAt for expiration check", () => {
      const oldCreated = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      const recentActivity = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const sessionData = {
        id: "mixed-session",
        usedWordIds: [],
        createdAt: oldCreated.toISOString(),
        lastAccessedAt: recentActivity.toISOString(),
      };
      const mixedSession = Session.fromData(sessionData);

      // Should not be expired because lastAccessedAt is recent (24 hours threshold)
      expect(mixedSession.isExpired(24 * 60 * 60 * 1000)).toBe(false);
    });
  });

  describe("fromData", () => {
    it("should restore session with all data", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const lastAccessedAt = new Date("2024-01-02T00:00:00Z");
      const usedWordIds = ["word-1", "word-2"];

      const data = {
        id: "restored-session",
        usedWordIds,
        createdAt: createdAt.toISOString(),
        lastAccessedAt: lastAccessedAt.toISOString(),
      };

      const restored = Session.fromData(data);

      expect(restored.id.value).toBe("restored-session");
      expect(restored.usedWordCount).toBe(2);
      expect(restored.createdAt.toISOString()).toBe(createdAt.toISOString());
      expect(restored.lastAccessedAt.toISOString()).toBe(
        lastAccessedAt.toISOString(),
      );
    });

    it("should properly track restored used words", () => {
      const word1 = WordId.create("word-1");
      if (!word1.ok) throw new Error("Failed to create word ID");

      const data = {
        id: "restored-session",
        usedWordIds: ["word-1"],
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      };

      const restored = Session.fromData(data);

      expect(restored.hasUsedWord(word1.value)).toBe(true);
    });
  });

  describe("toData", () => {
    it("should serialize session to data", () => {
      const word1 = WordId.create("word-1");
      if (!word1.ok) throw new Error("Failed to create word ID");

      session.markWordAsUsed(word1.value);

      const data = session.toData();

      expect(data.id).toBe("test-session-123");
      expect(data.usedWordIds).toContain("word-1");
      expect(data.createdAt).toBeDefined();
      expect(data.lastAccessedAt).toBeDefined();
    });
  });

  describe("touch", () => {
    it("should update lastAccessedAt", async () => {
      const before = session.lastAccessedAt;
      await new Promise((r) => setTimeout(r, 10));

      session.touch();

      expect(session.lastAccessedAt.getTime()).toBeGreaterThan(
        before.getTime(),
      );
    });
  });
});
