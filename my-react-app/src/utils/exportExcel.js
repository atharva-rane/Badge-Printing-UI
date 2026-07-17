// =====================================================================
// exportExcel.js
// ---------------------------------------------------------------------
// Turns the grid's *currently displayed* rows (i.e. respecting active
// filters and sort order, same as what the user sees on screen) into a
// real .xlsx file, fully client-side - no backend round trip.
//
// Dependency: SheetJS
//   npm install xlsx
//
// This is intentionally separate from `exportAllocationFile` in
// SevaAllocation.jsx, which calls a server endpoint instead (useful
// once the backend wants to apply its own formatting/branding, or
// export something the client doesn't have, like historical records).
// =====================================================================

import * as XLSX from "xlsx";

/**
 * @param {React.RefObject} gridRef - ref to the <AgGridReact /> instance
 * @param {string} [fileName] - defaults to SevaAllocation_<date>.xlsx
 */
export function exportGridToExcel(gridRef, fileName) {
  const api = gridRef?.current?.api;
  if (!api) {
    console.warn("exportGridToExcel: grid api not ready yet.");
    return;
  }

  const columns = api
    .getAllDisplayedColumns()
    .filter((col) => col.getColDef().field); // skip any non-data columns

  const headerRow = columns.map((col) => col.getColDef().headerName ?? col.getColDef().field);

  const dataRows = [];
  api.forEachNodeAfterFilterAndSort((node) => {
    const row = columns.map((col) => {
      const field = col.getColDef().field;
      const value = node.data?.[field];
      if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
      return value ?? "";
    });
    dataRows.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Reasonable default column widths so the export doesn't look
  // cramped when opened in Excel.
  worksheet["!cols"] = columns.map((col) => ({
    wch: Math.max(12, (col.getColDef().headerName ?? "").length + 2),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Seva Allocation");

  const finalName =
    fileName ?? `SevaAllocation_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, finalName);
}
