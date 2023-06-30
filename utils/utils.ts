import { evaluate } from "mathjs";

export const getCellName = (columnIndex: number, rowIndex: number) => {
  const letter = String.fromCharCode(64 + columnIndex); // TODO handle more than 26 columns
  return letter + rowIndex;
};

const ERROR_RESPONSE = "#ERROR";

export const evaluateExpression = (
  expression: string,
  cellValues?: Record<string, string | number>
) => {
  try {
    // Regular expression to match value references with optional leading zeros
    const valueRefRegex = /[A-Z]+0*([1-9]\d*|0+)/g;

    // Replace value references in the expression with their corresponding values
    const evaluatedExpression = expression.replace(valueRefRegex, (match) => {
      const valueRef = match.replace(/0+/, ""); // Remove leading zeros
      if (cellValues?.[valueRef] === undefined) {
        return ERROR_RESPONSE;
      }
      return String(cellValues?.[valueRef]);
    });

    const result = evaluate(evaluatedExpression, cellValues || {});
    if (typeof result !== "number") {
      return ERROR_RESPONSE;
    }
    return Math.round((result + Number.EPSILON) * 100) / 100; // Round to 2 decimal places https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  } catch (error) {
    return ERROR_RESPONSE;
  }
};
