import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { ReactNode } from "react";
import { useQuizCategories } from "./useQuizCategories";
import { GET_CATEGORIES, GET_WORD_COUNT } from "@/shared/api/operations";

// Mock responses
const mockCategories = ["Animals", "Food", "Colors"];

const createCategoriesMock = (): MockedResponse => ({
  request: {
    query: GET_CATEGORIES,
  },
  result: {
    data: {
      getCategories: mockCategories,
    },
  },
});

const createWordCountMock = (
  category: string | null,
  difficulty: number | null,
  count: number,
): MockedResponse => ({
  request: {
    query: GET_WORD_COUNT,
    variables: { category, difficulty },
  },
  result: {
    data: {
      getWordCount: { __typename: "WordCount", count },
    },
  },
});

// Wrapper for Apollo Provider
const createWrapper = (mocks: MockedResponse[]) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={true}>
        {children}
      </MockedProvider>
    );
  };
};

describe("useQuizCategories", () => {
  describe("Initial Load", () => {
    it("should fetch categories on mount", async () => {
      const mocks = [
        createCategoriesMock(),
        createWordCountMock(null, null, 100),
      ];

      const { result } = renderHook(
        () => useQuizCategories({ category: null, difficulty: null }),
        { wrapper: createWrapper(mocks) },
      );

      // Initially empty
      expect(result.current.categories).toEqual([]);
      expect(result.current.isLoadingCategories).toBe(true);

      // Wait for data
      await waitFor(() => {
        expect(result.current.categories).toEqual(mockCategories);
      });

      expect(result.current.isLoadingCategories).toBe(false);
    });

    it("should fetch word count with initial filters", async () => {
      const mocks = [
        createCategoriesMock(),
        createWordCountMock("Animals", 1, 50),
      ];

      const { result } = renderHook(
        () => useQuizCategories({ category: "Animals", difficulty: 1 }),
        { wrapper: createWrapper(mocks) },
      );

      await waitFor(() => {
        expect(result.current.availableWordCount).toBe(50);
      });
    });
  });

  describe("Word Count Updates", () => {
    it("should return 0 when no data", () => {
      const mocks = [createCategoriesMock()];

      const { result } = renderHook(
        () => useQuizCategories({ category: null, difficulty: null }),
        { wrapper: createWrapper(mocks) },
      );

      expect(result.current.availableWordCount).toBe(0);
    });

    it("should provide updateWordCountFilters function", async () => {
      const mocks = [
        createCategoriesMock(),
        createWordCountMock(null, null, 100),
        createWordCountMock("Food", null, 25),
      ];

      const { result } = renderHook(
        () => useQuizCategories({ category: null, difficulty: null }),
        { wrapper: createWrapper(mocks) },
      );

      expect(typeof result.current.updateWordCountFilters).toBe("function");

      await waitFor(() => {
        expect(result.current.availableWordCount).toBe(100);
      });

      // Update filters
      result.current.updateWordCountFilters({
        category: "Food",
        difficulty: null,
      });

      await waitFor(() => {
        expect(result.current.availableWordCount).toBe(25);
      });
    });
  });

  describe("Error Handling", () => {
    it("should return empty categories on error", async () => {
      const mocks: MockedResponse[] = [
        {
          request: { query: GET_CATEGORIES },
          error: new Error("Network error"),
        },
        createWordCountMock(null, null, 0),
      ];

      const { result } = renderHook(
        () => useQuizCategories({ category: null, difficulty: null }),
        { wrapper: createWrapper(mocks) },
      );

      await waitFor(() => {
        expect(result.current.isLoadingCategories).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
    });
  });
});
