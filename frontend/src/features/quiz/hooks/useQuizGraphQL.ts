import { useCallback, useEffect } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  GET_RANDOM_WORD,
  GET_RANDOM_WORDS,
  CHECK_TRANSLATION,
  type GetRandomWordData,
  type GetRandomWordVariables,
  type GetRandomWordsData,
  type GetRandomWordsVariables,
  type CheckTranslationData,
  type CheckTranslationVariables,
  isWordChallenge,
  isWordChallengeList,
  isTranslationResult,
} from "@/shared/api/operations";
import type { WordChallenge, TranslationResult } from "@/shared/types";
import { logger } from "@/shared/utils/logger";

interface FetchWordParams {
  mode: "EN_TO_PL" | "PL_TO_EN";
  category: string | null;
  difficulty: number | null;
}

interface FetchWordsParams {
  mode: "EN_TO_PL" | "PL_TO_EN";
  limit: number;
  category: string | null;
  difficulty: number | null;
}

interface CheckAnswerParams {
  wordId: string;
  userTranslation: string;
  mode: "EN_TO_PL" | "PL_TO_EN";
}

interface UseQuizGraphQLCallbacks {
  onWordLoaded: (word: WordChallenge) => void;
  onPoolLoaded: (words: WordChallenge[]) => void;
  onNoMoreWords: () => void;
  onWordError: (error: string) => void;
  onResultReceived: (result: TranslationResult) => void;
}

interface UseQuizGraphQLReturn {
  fetchWord: (params: FetchWordParams) => void;
  fetchWords: (params: FetchWordsParams) => void;
  checkAnswer: (params: CheckAnswerParams) => void;
  isLoadingWord: boolean;
  isLoadingWords: boolean;
  isCheckingAnswer: boolean;
}

/**
 * Encapsulates all GraphQL operations for the quiz
 * Uses union types with type guards for type-safe error handling
 */
export function useQuizGraphQL({
  onWordLoaded,
  onPoolLoaded,
  onNoMoreWords,
  onWordError,
  onResultReceived,
}: UseQuizGraphQLCallbacks): UseQuizGraphQLReturn {
  // Single word query (for standard and timed modes)
  const [
    fetchWordQuery,
    { loading: isLoadingWord, data: wordData, error: wordError },
  ] = useLazyQuery<GetRandomWordData, GetRandomWordVariables>(GET_RANDOM_WORD, {
    fetchPolicy: "network-only",
  });

  // Handle word query completion with type guard
  useEffect(() => {
    if (wordData?.getRandomWord) {
      const result = wordData.getRandomWord;

      if (isWordChallenge(result)) {
        logger.debug("[useQuizGraphQL] Word loaded", { wordId: result.id });
        onWordLoaded(result as WordChallenge);
      } else {
        // It's an error type
        logger.debug("[useQuizGraphQL] Word query returned error", {
          type: result.__typename,
          message: "message" in result ? result.message : "Unknown error",
        });

        if (result.__typename === "NotFoundError") {
          onNoMoreWords();
        } else {
          onWordError("message" in result ? result.message : "Unknown error");
        }
      }
    }
  }, [wordData, onWordLoaded, onNoMoreWords, onWordError]);

  // Handle network errors
  useEffect(() => {
    if (wordError) {
      logger.error("[useQuizGraphQL] Network error fetching word", {
        error: wordError,
      });
      onWordError(wordError.message);
    }
  }, [wordError, onWordError]);

  // Multiple words query (for reinforcement mode)
  const [
    fetchWordsQuery,
    { loading: isLoadingWords, data: wordsData, error: wordsError },
  ] = useLazyQuery<GetRandomWordsData, GetRandomWordsVariables>(
    GET_RANDOM_WORDS,
    {
      fetchPolicy: "network-only",
    },
  );

  // Handle words pool query with type guard
  useEffect(() => {
    if (wordsData?.getRandomWords) {
      const result = wordsData.getRandomWords;

      if (isWordChallengeList(result)) {
        logger.debug("[useQuizGraphQL] Pool loaded", {
          count: result.words.length,
        });
        onPoolLoaded(result.words as WordChallenge[]);
      } else {
        logger.debug("[useQuizGraphQL] Words query returned error", {
          type: result.__typename,
        });
        onPoolLoaded([]);
      }
    }
  }, [wordsData, onPoolLoaded]);

  useEffect(() => {
    if (wordsError) {
      logger.error("[useQuizGraphQL] Network error fetching words pool", {
        error: wordsError,
      });
      onWordError(wordsError.message);
    }
  }, [wordsError, onWordError]);

  // Check translation mutation
  const [
    checkTranslationMutation,
    { loading: isCheckingAnswer, data: checkData, error: checkError },
  ] = useMutation<CheckTranslationData, CheckTranslationVariables>(
    CHECK_TRANSLATION,
  );

  // Handle translation check with type guard
  useEffect(() => {
    if (checkData?.checkTranslation) {
      const result = checkData.checkTranslation;

      if (isTranslationResult(result)) {
        logger.debug("[useQuizGraphQL] Translation checked", {
          isCorrect: result.isCorrect,
        });
        onResultReceived(result as TranslationResult);
      } else {
        logger.error("[useQuizGraphQL] Translation check returned error", {
          type: result.__typename,
        });
      }
    }
  }, [checkData, onResultReceived]);

  useEffect(() => {
    if (checkError) {
      logger.error("[useQuizGraphQL] Network error checking translation", {
        error: checkError,
      });
    }
  }, [checkError]);

  const fetchWord = useCallback(
    (params: FetchWordParams) => {
      logger.debug("[useQuizGraphQL] Fetching word", params);
      fetchWordQuery({ variables: params });
    },
    [fetchWordQuery],
  );

  const fetchWords = useCallback(
    (params: FetchWordsParams) => {
      logger.debug("[useQuizGraphQL] Fetching words pool", params);
      fetchWordsQuery({ variables: params });
    },
    [fetchWordsQuery],
  );

  const checkAnswer = useCallback(
    (params: CheckAnswerParams) => {
      logger.debug("[useQuizGraphQL] Checking answer", {
        wordId: params.wordId,
        mode: params.mode,
      });
      checkTranslationMutation({ variables: params });
    },
    [checkTranslationMutation],
  );

  return {
    fetchWord,
    fetchWords,
    checkAnswer,
    isLoadingWord,
    isLoadingWords,
    isCheckingAnswer,
  };
}
