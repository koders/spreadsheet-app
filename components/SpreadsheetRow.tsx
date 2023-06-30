import classNames from "classnames";
import { times } from "lodash";
import { useState } from "react";

import { useSpreadsheet } from "@/contexts/SpreadsheetContext";
import { CELL_WIDTHS, SaveStatus } from "@/utils/constants";
import { getCellName } from "@/utils/utils";
import { Spinner } from "./Spinner";

interface SpreadsheetRowProps {
  rowIndex: number;
}

const SpreadsheetRow = ({ rowIndex }: SpreadsheetRowProps) => {
  const {
    columnCount,
    handleCellChange,
    evaluateAll,
    saveSpreadsheet,
    expressions,
    cellValues,
    saveStatus,
  } = useSpreadsheet();

  const [focusedInputs, setFocusedInputs] = useState(
    Array(columnCount).fill(false)
  );
  const handleInputFocus = (index: number) => {
    // Update the focusedInputs, to highlight the row
    const updatedFocusedInputs = [...focusedInputs];
    updatedFocusedInputs[index] = true;
    setFocusedInputs(updatedFocusedInputs);
  };

  const handleInputBlur = (index: number) => {
    const updatedFocusedInputs = [...focusedInputs];
    updatedFocusedInputs[index] = false;
    setFocusedInputs(updatedFocusedInputs);

    // Do evaluations and save the spreadsheet on blur
    evaluateAll();
    const cellName = getCellName(index + 1, rowIndex);
    saveSpreadsheet(cellName);
  };

  const isFocused = focusedInputs.includes(true);
  return (
    <div
      className={classNames(
        `flex mb-2 rounded bg-[#FAFAFA] transition-all border border-[#fafafa]`,
        {
          "shadow-[0_0_6px_0px_rgba(0,0,0,0.3)]": isFocused,
        }
      )}
    >
      {times(columnCount, (index) => {
        const isLastCell = index === columnCount - 1;
        const cellName = getCellName(index + 1, rowIndex);
        const value = isFocused
          ? expressions[cellName] || cellValues[cellName]
          : cellValues[cellName];
        // We do retry on error, so no point in showing it to the user
        const isError = saveStatus[cellName] === SaveStatus.ERROR;
        const isDone = saveStatus[cellName] === SaveStatus.DONE;
        const isSaving =
          saveStatus[cellName] === SaveStatus.WAITING ||
          saveStatus[cellName] === SaveStatus.IN_PROGRESS;
        return (
          <div
            key={index}
            className={classNames(`relative w-${CELL_WIDTHS[index]}`, {
              "border-r border-[rgba(0, 0, 0, 0.5)]": !isLastCell,
            })}
          >
            <div
              className={classNames(`absolute top-2 right-2 opacity-[0.001]`, {
                "fade-in": isSaving,
                "fade-out": isDone,
              })}
            >
              <Spinner />
            </div>
            <input
              type="text"
              className={`p-2 text-center focus:outline-none bg-transparent`}
              value={value}
              onChange={(e) =>
                handleCellChange(rowIndex, index + 1, e.target.value)
              }
              onFocus={() => {
                handleInputFocus(index);
              }}
              onBlur={() => handleInputBlur(index)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SpreadsheetRow;
