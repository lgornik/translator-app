import { useCallback } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_CATEGORIES,
  GET_WORD_COUNT,
  type GetCategoriesData,
  type GetWordCountData,
  type GetWordCountVariables,
  isWordCount,
} from "@/shared/api/operations";
import type { Difficulty } from "@/shared/types";

interface WordCountFilters {
  category: string | null;
  difficulty: Difficulty | null;
}

interface UseQuizCategoriesReturn {
  /** Available quiz categories */
  categories: string[];
  /** Number of words matching current filters */
  availableWordCount: number;
  /** Loading state for categories */
  isLoadingCategories: boolean;
  /** Refetch word count with new filters */
  updateWordCountFilters: (filters: WordCountFilters) => void;
}

/**
 * Manages quiz categories and available word count
 *
 * Responsibilities:
 * - Fetch available categories on mount
 * - Track word count for current filter selection
 * - Provide refetch capability for filter changes
 *
 * @example
 * const { categories, availableWordCount, updateWordCountFilters } = useQuizCategories({
 *   category: selectedCategory,
 *   difficulty: selectedDifficulty,
 * });
 */
export function useQuizCategories(
  initialFilters: WordCountFilters,
): UseQuizCategoriesReturn {
  const { data: categoriesData, loading: isLoadingCategories } =
    useQuery<GetCategoriesData>(GET_CATEGORIES);

  const { data: wordCountData, refetch: refetchWordCount } = useQuery<
    GetWordCountData,
    GetWordCountVariables
  >(GET_WORD_COUNT, {
    variables: {
      category: initialFilters.category,
      difficulty: initialFilters.difficulty,
    },
  });

  const updateWordCountFilters = useCallback(
    (filters: WordCountFilters) => {
      refetchWordCount({
        category: filters.category,
        difficulty: filters.difficulty,
      });
    },
    [refetchWordCount],
  );

  const wordCountResult = wordCountData?.getWordCount;
  const availableWordCount =
    wordCountResult && isWordCount(wordCountResult) ? wordCountResult.count : 0;

  return {
    categories: categoriesData?.getCategories ?? [],
    availableWordCount,
    isLoadingCategories,
    updateWordCountFilters,
  };
}
