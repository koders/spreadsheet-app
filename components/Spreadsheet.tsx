"use client";
import { times } from "lodash";
import SpreadsheetRow from "./SpreadsheetRow";
import { useSpreadsheet } from "@/contexts/SpreadsheetContext";
import { CELL_WIDTHS } from "@/utils/constants";

const Spreadsheet = () => {
  const { rowCount } = useSpreadsheet();

  return (
    <div className="w-[615px]">
      {/* useless search? */}
      {/* <div className="relative">
        <Image
          src="/magGlass.svg"
          alt="?"
          className="absolute left-[7px] top-[8px]"
          width={13}
          height={13}
        />
        <input
          className="w-full pl-[32px] mb-6 h-[29px] text-xs rounded bg-[#F3F3F3] focus:outline-none"
          placeholder="Type a search query to filter"
        />
      </div> */}
      <div className="w-full">
        <div className="flex items-center h-[32px] bg-[#EFEFEF] rounded mb-4">
          <div className="flex text-center w-full font-medium">
            <div className={`w-${CELL_WIDTHS[0]} rounded-l`}>A</div>
            <div className={`w-${CELL_WIDTHS[1]}`}>B</div>
            <div className={`w-${CELL_WIDTHS[2]} rounded-r`}>C</div>
          </div>
        </div>
        <div className="w-full">
          {times(rowCount, (index) => (
            <SpreadsheetRow key={index} rowIndex={index + 1} />
          ))}
        </div>
      </div>
      {/* If we need the possibility to add rows */}
      {/* <div className="w-full text-center mt-4">
        <button
          onClick={() => {
            setRowCount(rowCount + 1);
          }}
          className="px-8 py-1 bg-green-500 text-white"
        >
          +
        </button>
      </div> */}
    </div>
  );
};

export default Spreadsheet;
