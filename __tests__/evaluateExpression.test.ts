import { evaluateExpression } from "@/utils/utils";

describe("evaluateExpressions", () => {
  test("evaluates basic arithmetic expressions correctly", () => {
    const expressions = ["1 + 2", "3 * 4 - 2", "10 / 5", "2 * 3", "10 % 3"];
    const expectedResults = [3, 10, 2, 6, 1];

    expressions.forEach((expression, index) => {
      const result = evaluateExpression(expression);
      expect(result).toBe(expectedResults[index]);
    });
  });

  test("evaluates value references correctly", () => {
    const expressions = ["A1", "B2 + C3", "D4 - A2", "A1 * 0.15", "B2 / 3"];
    const cellValues = {
      A1: 5,
      B2: 10,
      C3: 2,
      D4: 8,
      A2: 3,
    };
    const expectedResults = [5, 12, 5, 0.75, 3.33];

    expressions.forEach((expression, index) => {
      const result = evaluateExpression(expression, cellValues);
      expect(result).toBe(expectedResults[index]);
    });
  });

  test("evaluates value references padded with zeroes correctly", () => {
    const expressions = ["A01", "B002 + C3"];
    const cellValues = {
      A1: 5,
      B2: 10,
      C3: 2,
      D4: 8,
      A2: 3,
    };
    const expectedResults = [5, 12];

    expressions.forEach((expression, index) => {
      const result = evaluateExpression(expression, cellValues);
      expect(result).toBe(expectedResults[index]);
    });
  });

  test("evaluates brackets", () => {
    const expressions = [
      "1 + 2 * (42.42 / 1)",
      "(A1 + B2) * C3",
      "10 / (5 - A2)",
      "C3 * (D4 - C3 * (B2 - 4))",
    ];
    const cellValues = {
      A1: 5,
      B2: 10,
      C3: 2,
      D4: 8,
      A2: 3,
    };
    const expectedResults = [85.84, 30, 5, -8];

    expressions.forEach((expression, index) => {
      const result = evaluateExpression(expression, cellValues);
      expect(result).toBe(expectedResults[index]);
    });
  });

  test("returns undefined for invalid expressions", () => {
    const expressions = ["1 +", "A", "A1 + B2 + C3", "2 -"];

    expressions.forEach((expression) => {
      const result = evaluateExpression(expression);
      expect(result).toEqual("#ERROR");
    });
  });
});
