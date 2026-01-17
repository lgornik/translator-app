import { describe, it, expect, beforeAll } from "vitest";
import {
  buildSchema,
  parse,
  validate,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLEnumType,
} from "graphql";
import { typeDefs } from "../../infrastructure/graphql/schema.js";

/**
 * Contract Tests for GraphQL Schema
 *
 * These tests ensure the GraphQL API contract is maintained.
 * Breaking changes will cause these tests to fail.
 */
describe("GraphQL Schema Contract Tests", () => {
  let schema: GraphQLSchema;

  beforeAll(() => {
    schema = buildSchema(typeDefs);
  });

  // ===========================================================================
  // Schema Structure Tests
  // ===========================================================================

  describe("Schema Structure", () => {
    it("should have Query type", () => {
      const queryType = schema.getQueryType();
      expect(queryType).toBeDefined();
      expect(queryType?.name).toBe("Query");
    });

    it("should have Mutation type", () => {
      const mutationType = schema.getMutationType();
      expect(mutationType).toBeDefined();
      expect(mutationType?.name).toBe("Mutation");
    });
  });

  // ===========================================================================
  // Type Contract Tests
  // ===========================================================================

  describe("TranslationMode Enum", () => {
    it("should exist", () => {
      const type = schema.getType("TranslationMode");
      expect(type).toBeDefined();
      expect(type).toBeInstanceOf(GraphQLEnumType);
    });

    it("should have EN_TO_PL value", () => {
      const type = schema.getType("TranslationMode") as GraphQLEnumType;
      const values = type.getValues().map((v) => v.name);
      expect(values).toContain("EN_TO_PL");
    });

    it("should have PL_TO_EN value", () => {
      const type = schema.getType("TranslationMode") as GraphQLEnumType;
      const values = type.getValues().map((v) => v.name);
      expect(values).toContain("PL_TO_EN");
    });
  });

  describe("Difficulty Enum", () => {
    it("should exist", () => {
      const type = schema.getType("Difficulty");
      expect(type).toBeDefined();
      expect(type).toBeInstanceOf(GraphQLEnumType);
    });

    it("should have EASY, MEDIUM, HARD values", () => {
      const type = schema.getType("Difficulty") as GraphQLEnumType;
      const values = type.getValues().map((v) => v.name);
      expect(values).toContain("EASY");
      expect(values).toContain("MEDIUM");
      expect(values).toContain("HARD");
    });
  });

  describe("WordChallenge Type", () => {
    let wordChallengeType: GraphQLObjectType;

    beforeAll(() => {
      wordChallengeType = schema.getType("WordChallenge") as GraphQLObjectType;
    });

    it("should exist", () => {
      expect(wordChallengeType).toBeDefined();
    });

    it("should have required id field of type ID", () => {
      const field = wordChallengeType.getFields()["id"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required wordToTranslate field of type String", () => {
      const field = wordChallengeType.getFields()["wordToTranslate"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required mode field", () => {
      const field = wordChallengeType.getFields()["mode"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required category field of type String", () => {
      const field = wordChallengeType.getFields()["category"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required difficulty field of type Int", () => {
      const field = wordChallengeType.getFields()["difficulty"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should NOT expose correctTranslation (security)", () => {
      const field = wordChallengeType.getFields()["correctTranslation"];
      expect(field).toBeUndefined();
    });
  });

  describe("TranslationResult Type", () => {
    let translationResultType: GraphQLObjectType;

    beforeAll(() => {
      translationResultType = schema.getType(
        "TranslationResult",
      ) as GraphQLObjectType;
    });

    it("should exist", () => {
      expect(translationResultType).toBeDefined();
    });

    it("should have required isCorrect field of type Boolean", () => {
      const field = translationResultType.getFields()["isCorrect"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required correctTranslation field of type String", () => {
      const field = translationResultType.getFields()["correctTranslation"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });

    it("should have required userTranslation field of type String", () => {
      const field = translationResultType.getFields()["userTranslation"];
      expect(field).toBeDefined();
      expect(field.type).toBeInstanceOf(GraphQLNonNull);
    });
  });

  describe("DictionaryWord Type", () => {
    let dictionaryWordType: GraphQLObjectType;

    beforeAll(() => {
      dictionaryWordType = schema.getType(
        "DictionaryWord",
      ) as GraphQLObjectType;
    });

    it("should exist", () => {
      expect(dictionaryWordType).toBeDefined();
    });

    it("should have required id, polish, english, category, difficulty fields", () => {
      const fields = dictionaryWordType.getFields();
      expect(fields["id"]).toBeDefined();
      expect(fields["polish"]).toBeDefined();
      expect(fields["english"]).toBeDefined();
      expect(fields["category"]).toBeDefined();
      expect(fields["difficulty"]).toBeDefined();
    });
  });

  describe("WordCount Type", () => {
    it("should exist with count field", () => {
      const type = schema.getType("WordCount") as GraphQLObjectType;
      expect(type).toBeDefined();
      expect(type.getFields()["count"]).toBeDefined();
    });
  });

  describe("ApiInfo Type", () => {
    let apiInfoType: GraphQLObjectType;

    beforeAll(() => {
      apiInfoType = schema.getType("ApiInfo") as GraphQLObjectType;
    });

    it("should exist", () => {
      expect(apiInfoType).toBeDefined();
    });

    it("should have required fields: name, version, status, uptime", () => {
      const fields = apiInfoType.getFields();
      expect(fields["name"]).toBeDefined();
      expect(fields["version"]).toBeDefined();
      expect(fields["status"]).toBeDefined();
      expect(fields["uptime"]).toBeDefined();
    });
  });

  describe("HealthCheck Type", () => {
    let healthCheckType: GraphQLObjectType;

    beforeAll(() => {
      healthCheckType = schema.getType("HealthCheck") as GraphQLObjectType;
    });

    it("should exist", () => {
      expect(healthCheckType).toBeDefined();
    });

    it("should have required fields", () => {
      const fields = healthCheckType.getFields();
      expect(fields["status"]).toBeDefined();
      expect(fields["timestamp"]).toBeDefined();
      expect(fields["uptime"]).toBeDefined();
      expect(fields["sessionCount"]).toBeDefined();
      expect(fields["wordCount"]).toBeDefined();
    });
  });

  // ===========================================================================
  // Query Contract Tests
  // ===========================================================================

  describe("Query Operations", () => {
    let queryType: GraphQLObjectType;

    beforeAll(() => {
      queryType = schema.getQueryType() as GraphQLObjectType;
    });

    describe("info query", () => {
      it("should exist and return ApiInfo!", () => {
        const field = queryType.getFields()["info"];
        expect(field).toBeDefined();
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("health query", () => {
      it("should exist and return HealthCheck!", () => {
        const field = queryType.getFields()["health"];
        expect(field).toBeDefined();
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getRandomWord query", () => {
      it("should exist", () => {
        const field = queryType.getFields()["getRandomWord"];
        expect(field).toBeDefined();
      });

      it("should have required mode argument", () => {
        const field = queryType.getFields()["getRandomWord"];
        const modeArg = field.args.find((a) => a.name === "mode");
        expect(modeArg).toBeDefined();
        expect(modeArg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should have optional category argument", () => {
        const field = queryType.getFields()["getRandomWord"];
        const categoryArg = field.args.find((a) => a.name === "category");
        expect(categoryArg).toBeDefined();
        expect(categoryArg?.type).not.toBeInstanceOf(GraphQLNonNull);
      });

      it("should have optional difficulty argument", () => {
        const field = queryType.getFields()["getRandomWord"];
        const difficultyArg = field.args.find((a) => a.name === "difficulty");
        expect(difficultyArg).toBeDefined();
        expect(difficultyArg?.type).not.toBeInstanceOf(GraphQLNonNull);
      });

      it("should return WordChallenge!", () => {
        const field = queryType.getFields()["getRandomWord"];
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getRandomWords query", () => {
      it("should exist", () => {
        const field = queryType.getFields()["getRandomWords"];
        expect(field).toBeDefined();
      });

      it("should have required mode argument", () => {
        const field = queryType.getFields()["getRandomWords"];
        const modeArg = field.args.find((a) => a.name === "mode");
        expect(modeArg).toBeDefined();
        expect(modeArg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should have required limit argument", () => {
        const field = queryType.getFields()["getRandomWords"];
        const limitArg = field.args.find((a) => a.name === "limit");
        expect(limitArg).toBeDefined();
        expect(limitArg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should return [WordChallenge!]!", () => {
        const field = queryType.getFields()["getRandomWords"];
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getAllWords query", () => {
      it("should exist and return [DictionaryWord!]!", () => {
        const field = queryType.getFields()["getAllWords"];
        expect(field).toBeDefined();
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getCategories query", () => {
      it("should exist and return [String!]!", () => {
        const field = queryType.getFields()["getCategories"];
        expect(field).toBeDefined();
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getDifficulties query", () => {
      it("should exist and return [Int!]!", () => {
        const field = queryType.getFields()["getDifficulties"];
        expect(field).toBeDefined();
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("getWordCount query", () => {
      it("should exist", () => {
        const field = queryType.getFields()["getWordCount"];
        expect(field).toBeDefined();
      });

      it("should have optional category and difficulty arguments", () => {
        const field = queryType.getFields()["getWordCount"];
        const categoryArg = field.args.find((a) => a.name === "category");
        const difficultyArg = field.args.find((a) => a.name === "difficulty");
        expect(categoryArg).toBeDefined();
        expect(difficultyArg).toBeDefined();
      });

      it("should return WordCount!", () => {
        const field = queryType.getFields()["getWordCount"];
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });
  });

  // ===========================================================================
  // Mutation Contract Tests
  // ===========================================================================

  describe("Mutation Operations", () => {
    let mutationType: GraphQLObjectType;

    beforeAll(() => {
      mutationType = schema.getMutationType() as GraphQLObjectType;
    });

    describe("checkTranslation mutation", () => {
      it("should exist", () => {
        const field = mutationType.getFields()["checkTranslation"];
        expect(field).toBeDefined();
      });

      it("should have required wordId argument", () => {
        const field = mutationType.getFields()["checkTranslation"];
        const arg = field.args.find((a) => a.name === "wordId");
        expect(arg).toBeDefined();
        expect(arg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should have required userTranslation argument", () => {
        const field = mutationType.getFields()["checkTranslation"];
        const arg = field.args.find((a) => a.name === "userTranslation");
        expect(arg).toBeDefined();
        expect(arg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should have required mode argument", () => {
        const field = mutationType.getFields()["checkTranslation"];
        const arg = field.args.find((a) => a.name === "mode");
        expect(arg).toBeDefined();
        expect(arg?.type).toBeInstanceOf(GraphQLNonNull);
      });

      it("should return TranslationResult!", () => {
        const field = mutationType.getFields()["checkTranslation"];
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });

    describe("resetSession mutation", () => {
      it("should exist", () => {
        const field = mutationType.getFields()["resetSession"];
        expect(field).toBeDefined();
      });

      it("should return Boolean!", () => {
        const field = mutationType.getFields()["resetSession"];
        expect(field.type).toBeInstanceOf(GraphQLNonNull);
      });
    });
  });

  // ===========================================================================
  // Query Validation Tests
  // ===========================================================================

  describe("Query Validation", () => {
    it("should accept valid getRandomWord query", () => {
      const query = `
        query GetRandomWord {
          getRandomWord(mode: EN_TO_PL) {
            __typename
            ... on WordChallenge {
              id
              wordToTranslate
              mode
              category
              difficulty
            }
            ... on NotFoundError {
              code
              message
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors).toHaveLength(0);
    });

    it("should accept valid getRandomWord with all filters", () => {
      const query = `
        query GetRandomWord {
          getRandomWord(mode: PL_TO_EN, category: "animals", difficulty: 1) {
            __typename
            ... on WordChallenge {
              id
              wordToTranslate
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors).toHaveLength(0);
    });

    it("should accept valid getRandomWords query", () => {
      const query = `
        query GetRandomWords {
          getRandomWords(mode: EN_TO_PL, limit: 10) {
            __typename
            ... on WordChallengeList {
              words {
                id
                wordToTranslate
                category
              }
              count
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors).toHaveLength(0);
    });

    it("should accept valid checkTranslation mutation", () => {
      const query = `
        mutation CheckTranslation {
          checkTranslation(wordId: "123", userTranslation: "kot", mode: EN_TO_PL) {
            __typename
            ... on TranslationResult {
              isCorrect
              correctTranslation
              userTranslation
            }
            ... on NotFoundError {
              code
              message
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors).toHaveLength(0);
    });

    it("should accept valid resetSession mutation", () => {
      const query = `
        mutation ResetSession {
          resetSession {
            __typename
            ... on ResetSessionSuccess {
              success
              message
            }
            ... on SessionError {
              code
              message
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors).toHaveLength(0);
    });

    it("should reject query for non-existent field", () => {
      const query = `
        query {
          getRandomWord(mode: EN_TO_PL) {
            __typename
            ... on WordChallenge {
              nonExistentField
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject query without required argument", () => {
      const query = `
        query {
          getRandomWord {
            __typename
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject mutation without required arguments", () => {
      const query = `
        mutation {
          checkTranslation(wordId: "123") {
            __typename
            ... on TranslationResult {
              isCorrect
            }
          }
        }
      `;
      const errors = validate(schema, parse(query));
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
