"use client";
import { SaveStatus } from "@/utils/constants";
import { evaluateExpression, getCellName } from "@/utils/utils";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { shallowEqualObjects } from "shallow-equal";

interface SpreadsheetContextProps {
  rowCount: number;
  columnCount: number;
  setRowCount: (rowCount: number) => void;
  setColumnCount: (columnCount: number) => void;
  evaluateAll: () => void;
  saveSpreadsheet: (cellName: string) => void;
  getSpreadsheetAsCSV: () => string;
  cellValues: Record<string, string>;
  setCellValues: (cellValues: Record<string, string>) => void;
  expressions: Record<string, string>;
  setExpressions: (expressions: Record<string, string>) => void;
  saveStatus: Record<string, string>;
  handleCellChange: (
    rowIndex: number,
    columnIndex: number,
    value: string
  ) => void;
}

export const SpreadsheetContext = createContext<SpreadsheetContextProps>(
  {} as SpreadsheetContextProps
);

const BACKEND_URL = "http://localhost:8082";

/**
 * This is the global state of the spreadsheet, and mainly does all the logic
 */
export const SpreadsheetProvider = ({ children }: PropsWithChildren) => {
  const [rowCount, setRowCount] = useState(3);
  const [columnCount, setColumnCount] = useState(3);
  const [cellValues, setCellValues] = useState(
    getInitialCellValues(rowCount, columnCount)
  ); // Cell values stored as { 'A1': 5, 'B2': 10, ... }
  const [expressions, setExpressions] = useState(
    getInitialCellValues(rowCount, columnCount)
  ); // Expressions stored as { 'C3': '=A1 + B2', ... }

  /**
   * Converts the spreadsheet to a CSV string
   * @returns The spreadsheet as a CSV string
   */
  const getSpreadsheetAsCSV = () => {
    const csvRows = [];
    for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
      const rowValues = [];
      for (let columnIndex = 1; columnIndex <= columnCount; columnIndex++) {
        const cellIndex = getCellName(columnIndex, rowIndex);
        rowValues.push(cellValues[cellIndex]);
      }
      csvRows.push(rowValues.join(","));
    }
    return csvRows.join("\n");
  };

  const [lastSave, setLastSave] = useState<string>(getSpreadsheetAsCSV());
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [waiterMap, setWaiterMap] = useState<Record<string, NodeJS.Timeout>>(
    {}
  );
  const [abortControllers, setAbortControllers] = useState<
    Record<string, AbortController>
  >({});

  /**
   * Saves the spreadsheet to the server... kinda
   */
  async function saveSpreadsheet(lastCell: string) {
    try {
      // Check if there are any changes to save only if needed, since our server is busyyyy
      const csv = getSpreadsheetAsCSV();
      if (csv === lastSave) {
        return;
      }
      setLastSave(csv);
      setSaveStatus((curr) => ({ ...curr, [lastCell]: SaveStatus.WAITING }));

      // Abort any previous save requests for this cell and clear the waiter if there were any previous IN_PROGRESS saves
      abortControllers[lastCell]?.abort();
      if (waiterMap[lastCell]) {
        clearTimeout(waiterMap[lastCell]);
      }
      const abortController = new AbortController();
      setAbortControllers((curr) => ({ ...curr, [lastCell]: abortController }));

      const response = await fetch(`${BACKEND_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: csv,
        signal: abortController.signal,
      });

      await validateResponse(response, lastCell);
    } catch (error) {
      console.error("Failed to save spreadsheet:", error);
      if (
        error instanceof DOMException &&
        error.message === "The user aborted a request."
      ) {
      } else {
        setSaveStatus((curr) => ({ ...curr, [lastCell]: SaveStatus.ERROR }));
      }
    }
  }

  const validateResponse = async (response: Response, cell: string) => {
    try {
      if (response.ok) {
        const { status, done_at: doneAt, id } = await response.json();

        if (status === SaveStatus.DONE) {
          console.log("Spreadsheet saved successfully");
          setSaveStatus((curr) => {
            const newSaveStatus = { ...curr } as Record<string, string>;
            newSaveStatus[cell] = SaveStatus.DONE;
            return newSaveStatus;
          });
        } else if (status === SaveStatus.IN_PROGRESS) {
          // if the save is in progress, then we wait for the done_at time and check again
          await new Promise((resolve) => {
            const waiter = setTimeout(resolve, calculateDelay(doneAt));
            setWaiterMap((curr) => ({ ...curr, [cell]: waiter }));
          });
          await checkSaveStatus(id, doneAt, cell);
        }
      } else {
        throw new Error("Failed to check save status");
      }
    } catch (error) {
      console.error("Failed to check save status:", error);
      setSaveStatus((curr) => ({ ...curr, [cell]: SaveStatus.ERROR }));
      // if server error, then we retry the operation, since it is not validation error
      saveSpreadsheet(cell);
    }
  };

  /**
   * Checks the status of the save operation, by fetching the server
   */
  async function checkSaveStatus(id: string, doneAt: string, cell: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/get-status?id=${id}`);

      validateResponse(response, cell);
    } catch (error) {
      console.error("Failed to check save status:", error);
      setSaveStatus((curr) => ({ ...curr, [cell]: SaveStatus.ERROR }));
      // if server error, then we retry the operation, since it is not validation error
      saveSpreadsheet(cell);
    }
  }

  const handleCellChange = (
    rowIndex: number,
    columnIndex: number,
    value: string
  ) => {
    const cellIndex = getCellName(columnIndex, rowIndex);

    if (
      value.startsWith("=") ||
      (value === "" && expressions[cellIndex].length > 0)
    ) {
      setExpressions({ ...expressions, [cellIndex]: value });
      if (value === "" && expressions[cellIndex].length > 0) {
        setCellValues((curr) => ({ ...curr, [cellIndex]: "" }));
      }
    } else {
      setCellValues({ ...cellValues, [cellIndex]: value });
    }
  };

  const evaluateAll = () => {
    // Update the evaluated values for expressions whenever cell values or expressions change
    const updatedValues = {} as any;

    for (const cell in expressions) {
      const expression = expressions[cell];
      if (expression.length === 0) continue;

      const evaluatedValue = evaluateExpression(
        expression.slice(1),
        cellValues
      );
      updatedValues[cell] = evaluatedValue || "";
    }

    const newValues = { ...cellValues, ...updatedValues };

    if (!shallowEqualObjects(newValues, cellValues)) {
      setCellValues(newValues);
    }
  };

  return (
    <SpreadsheetContext.Provider
      value={{
        saveSpreadsheet,
        getSpreadsheetAsCSV,
        rowCount,
        setRowCount,
        columnCount,
        setColumnCount,
        cellValues,
        setCellValues,
        expressions,
        setExpressions,
        handleCellChange,
        evaluateAll,
        saveStatus,
      }}
    >
      {children}
    </SpreadsheetContext.Provider>
  );
};

export const useSpreadsheet = () => useContext(SpreadsheetContext);

const calculateDelay = (doneAt: string) => {
  const now = Date.now();
  const doneAtTime = new Date(doneAt).getTime();
  const delay = Math.max(doneAtTime - now, 0) + 1000; // Give a 1 second buffer to minimize querying the API, since it is very busy apparently
  return delay;
};

/**
 * @returns an object with empty values for spreadsheet initialization
 */
const getInitialCellValues = (rowCount: number, columnCount: number) => {
  const cellValues: Record<string, string> = {};
  for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex++) {
      const cellIndex = getCellName(columnIndex, rowIndex);
      cellValues[cellIndex] = "";
    }
  }
  return cellValues;
};
