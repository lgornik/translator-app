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
 * Uses union types with type guards for type-safe error handling
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

  // Use type guard to safely extract count
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
