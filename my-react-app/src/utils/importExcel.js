// =====================================================================
// importExcel.js
// ---------------------------------------------------------------------
// Reads a user-selected .xlsx / .xls / .csv file and turns it into an
// array of row objects shaped like the grid's rowData, so bulk edits
// made in real Excel/Google Sheets can be brought back in.
//
// Dependency: SheetJS
//   npm install xlsx
//
// HEADER MATCHING
// The uploaded file's header row is matched against `headerMap`
// (headerName -> field, sourced from the grid's own columnDefs so it
// never drifts out of sync). Matching is case-insensitive and
// whitespace-tolerant, so "Volunteer Name", "volunteer name", and
// " Volunteer   Name " all resolve to the `volName` field. Unmatched
// columns in the file are ignored; missing columns are left blank.
// =====================================================================

import * as XLSX from "xlsx";

const normalizeHeader = (h) => String(h ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * @param {File} file - from an <input type="file"> change event
 * @param {{headerName: string, field: string}[]} headerMap - typically
 *   derived from columnDefs, e.g. columnDefs.map(c => ({ headerName: c.headerName, field: c.field }))
 * @returns {Promise<object[]>} parsed rows, keyed by field name
 */
export function importExcelFile(file, headerMap) {
  const lookup = new Map(
    headerMap.map(({ headerName, field }) => [normalizeHeader(headerName), field]),
  );

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // header:1 -> array-of-arrays, so we control the header
        // matching ourselves instead of trusting SheetJS's auto keys.
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (rows.length === 0) {
          resolve([]);
          return;
        }

        const [headerRow, ...dataRows] = rows;
        const fieldForColumn = headerRow.map((h) => lookup.get(normalizeHeader(h)) ?? null);

        const parsed = dataRows
          // skip fully-blank trailing rows
          .filter((row) => row.some((cell) => String(cell).trim() !== ""))
          .map((row) => {
            const record = {};
            row.forEach((cell, i) => {
              const field = fieldForColumn[i];
              if (!field) return;

              // Coerce common boolean text back to real booleans for
              // checkbox columns.
              if (/^(true|false)$/i.test(String(cell).trim())) {
                record[field] = /^true$/i.test(String(cell).trim());
              } else {
                record[field] = cell;
              }
            });
            return record;
          });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
