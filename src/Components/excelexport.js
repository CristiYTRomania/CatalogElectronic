import * as FileSaver from "file-saver";
import XLSX from "sheetjs-style";

export const exportExcel = (excelData, fileName) => {
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8;";
  const fileExtension = ".xlsx";

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = { Sheets: { "Sheet 1": ws }, SheetNames: ["Sheet 1"] };
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: fileType });
  FileSaver.saveAs(data, fileName + fileExtension);
};
