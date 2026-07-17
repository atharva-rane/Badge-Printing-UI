import { useCallback, useEffect, useRef } from "react";

// =====================================================================
// useExcelRangeSelection
// ---------------------------------------------------------------------
// ag-grid-COMMUNITY does not ship multi-cell range selection, clipboard,
// or fill-handle behaviour — those are ag-grid-ENTERPRISE-only features
// (CellSelectionModule / ClipboardModule / FillHandle). Rather than
// pulling in Enterprise (paid, needs a license key), this hook
// re-implements the everyday-useful subset of that behaviour on top of
// the free Community grid:
//
//   - click + drag to select a rectangular range of cells
//   - shift + click to extend a range from the last anchor
//   - Ctrl/Cmd + C  -> copy the selected range as tab-separated values
//   - Ctrl/Cmd + V  -> paste tab-separated values starting at the
//                      selection's top-left cell (grows the sheet with
//                      extra rows if the pasted block is taller than
//                      the remaining rows, just like Excel)
//   - Delete / Backspace -> clear the selected range
//   - Ctrl/Cmd + D  -> "fill down": copies the top row of the
//                      selection into every other selected row,
//                      column by column (handy for bulk-assigning the
//                      same Kendra/Seva/Shift to many volunteers)
//
// Selection state is kept in a ref (not React state) and cell
// highlighting is done via ag-grid's own `cellClassRules`, refreshed
// with `api.refreshCells()`. Because ag-grid only ever renders the rows
// currently in the viewport, this stays fast even with ~5000 rows —
// refreshCells() only re-evaluates the handful of cells on screen.
//
// USAGE (see SevaAllocation.jsx):
//
//   const excel = useExcelRangeSelection({
//     getRowNodeById: (id) => gridApi.getRowNode(id),
//     onRangeChanged: () => setUnsavedChanges(true),
//   });
//
//   <div ref={excel.containerRef}>
//     <AgGridReact
//       onGridReady={(p) => excel.setGridApi(p.api)}
//       onCellMouseDown={excel.handleCellMouseDown}
//       onCellMouseOver={excel.handleCellMouseOver}
//       defaultColDef={{ ...otherDefaults, cellClassRules: excel.cellClassRules }}
//     />
//   </div>
// =====================================================================

const isEditableColumn = (colDef) => colDef?.editable !== false;

export default function useExcelRangeSelection({ onRangeChanged } = {}) {
  const containerRef = useRef(null);
  const gridApiRef = useRef(null);

  // { startRow, endRow, startCol, endCol } - all raw (un-normalized)
  // indices into the currently *displayed* rows / columns.
  const selectionRef = useRef(null);
  const isDraggingRef = useRef(false);

  const setGridApi = useCallback((api) => {
    gridApiRef.current = api;
  }, []);

  // -------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------

  const getDisplayedColumns = () =>
    gridApiRef.current ? gridApiRef.current.getAllDisplayedColumns() : [];

  const normalize = (sel) => ({
    rowMin: Math.min(sel.startRow, sel.endRow),
    rowMax: Math.max(sel.startRow, sel.endRow),
    colMin: Math.min(sel.startCol, sel.endCol),
    colMax: Math.max(sel.startCol, sel.endCol),
  });

  const refreshSelectionVisuals = () => {
    const api = gridApiRef.current;
    if (!api) return;
    api.refreshCells({ force: true });
  };

  // -------------------------------------------------------------
  // mouse handlers -> build the selection rectangle
  // -------------------------------------------------------------

  const handleCellMouseDown = useCallback((params) => {
    const mouseEvent = params.event;
    if (mouseEvent?.button !== 0) return; // left button only

    const api = gridApiRef.current;

    // If a cell editor is currently open (e.g. our DropdownEditor),
    // don't treat this mousedown as the start of a new range
    // selection. A click here is almost always the user interacting
    // with the open editor itself (opening the native <select>,
    // clicking an option, etc.) - starting a range selection would
    // call refreshCells({force:true}) below, and `force: true`
    // explicitly redraws the cell even while it's mid-edit, which
    // destroys the editor component before the user's choice commits.
    // That was the root cause of "selecting a dropdown value doesn't
    // stick."
    if (api && api.getEditingCells().length > 0) return;

    const columns = getDisplayedColumns();
    const colIndex = columns.indexOf(params.column);
    if (colIndex === -1) return;

    if (mouseEvent.shiftKey && selectionRef.current) {
      // Shift+click extends the existing selection instead of
      // starting a new one - mirrors Excel's shift-click behaviour.
      selectionRef.current = {
        ...selectionRef.current,
        endRow: params.rowIndex,
        endCol: colIndex,
      };
    } else {
      selectionRef.current = {
        startRow: params.rowIndex,
        endRow: params.rowIndex,
        startCol: colIndex,
        endCol: colIndex,
      };
    }

    isDraggingRef.current = true;
    refreshSelectionVisuals();
  }, []);

  const handleCellMouseOver = useCallback((params) => {
    if (!isDraggingRef.current || !selectionRef.current) return;

    const api = gridApiRef.current;
    if (api && api.getEditingCells().length > 0) return;

    const columns = getDisplayedColumns();
    const colIndex = columns.indexOf(params.column);
    if (colIndex === -1) return;

    selectionRef.current = {
      ...selectionRef.current,
      endRow: params.rowIndex,
      endCol: colIndex,
    };

    refreshSelectionVisuals();
  }, []);

  useEffect(() => {
    const stopDragging = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  // -------------------------------------------------------------
  // cellClassRules entry - highlights any cell inside the current
  // selection rectangle.
  //
  // IMPORTANT: this must keep a STABLE object identity across
  // re-renders. It's read from a ref internally, so it never needs to
  // change - but if it were re-created as a fresh object literal on
  // every render (as it was before), any component that memoizes
  // something off of it (e.g. `defaultColDef` in SevaAllocation.jsx)
  // would see a "changed" dependency on every render, recompute, hand
  // ag-grid a new defaultColDef reference, and ag-grid would reset its
  // column config in response - silently cancelling any cell edit in
  // progress. That was the cause of "selecting a dropdown value
  // doesn't stick": every render (including ones triggered by
  // unrelated state) blew away the editor before its value committed.
  // -------------------------------------------------------------

  const cellClassRulesRef = useRef({
    "excel-cell-selected": (params) => {
      const sel = selectionRef.current;
      if (!sel) return false;

      const columns = getDisplayedColumns();
      const colIndex = columns.indexOf(params.column);
      if (colIndex === -1) return false;

      const { rowMin, rowMax, colMin, colMax } = normalize(sel);
      return (
        params.rowIndex >= rowMin &&
        params.rowIndex <= rowMax &&
        colIndex >= colMin &&
        colIndex <= colMax
      );
    },
  });
  const cellClassRules = cellClassRulesRef.current;

  // -------------------------------------------------------------
  // clipboard: copy
  // -------------------------------------------------------------

  const copySelection = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;
    if (!api || !sel) return;

    const columns = getDisplayedColumns();
    const { rowMin, rowMax, colMin, colMax } = normalize(sel);

    const lines = [];
    for (let r = rowMin; r <= rowMax; r++) {
      const rowNode = api.getDisplayedRowAtIndex(r);
      if (!rowNode) continue;

      const cells = [];
      for (let c = colMin; c <= colMax; c++) {
        const col = columns[c];
        if (!col) continue;
        const value = rowNode.data?.[col.getColDef().field];
        cells.push(value === undefined || value === null ? "" : value);
      }
      lines.push(cells.join("\t"));
    }

    const text = lines.join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        /* clipboard permission denied - silently ignore, native
           browser text-selection copy still works as a fallback */
      });
    }
  }, []);

  // -------------------------------------------------------------
  // clipboard: paste
  // -------------------------------------------------------------

  const pasteAtSelection = useCallback(
    (clipboardText) => {
      const api = gridApiRef.current;
      const sel = selectionRef.current;
      if (!api || !sel || !clipboardText) return;

      const columns = getDisplayedColumns();
      const { rowMin, colMin } = normalize(sel);

      const grid = clipboardText
        .replace(/\r/g, "")
        .split("\n")
        .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ""))
        .map((line) => line.split("\t"));

      grid.forEach((rowValues, rOffset) => {
        const targetRowIndex = rowMin + rOffset;
        const rowNode = api.getDisplayedRowAtIndex(targetRowIndex);

        // Pasting a block taller than the remaining rows simply stops
        // at the last existing row, rather than silently growing the
        // sheet (growing it here would fight with SevaAllocation.jsx's
        // own React-state-driven rowData). For adding many rows at
        // once, use "Add Row" repeatedly or the "Import Excel" button.
        if (!rowNode) return;

        rowValues.forEach((rawValue, cOffset) => {
          const col = columns[colMin + cOffset];
          if (!col) return;

          const colDef = col.getColDef();
          if (!isEditableColumn(colDef)) return;

          let value = rawValue;
          // Coerce common boolean text representations for checkbox
          // columns so pasting from Excel ("TRUE"/"FALSE"/"1"/"0")
          // behaves as expected.
          if (typeof rowNode.data?.[colDef.field] === "boolean") {
            value = /^(true|1|yes)$/i.test(String(rawValue).trim());
          }

          rowNode.setDataValue(colDef.field, value);
        });
      });

      // Move the selection rectangle to cover exactly what was pasted.
      selectionRef.current = {
        startRow: rowMin,
        endRow: rowMin + grid.length - 1,
        startCol: colMin,
        endCol: colMin + Math.max(...grid.map((r) => r.length), 1) - 1,
      };

      refreshSelectionVisuals();
      onRangeChanged?.();
    },
    [onRangeChanged],
  );

  // -------------------------------------------------------------
  // clear selected range (Delete / Backspace)
  // -------------------------------------------------------------

  const clearSelection = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;
    if (!api || !sel) return;

    const columns = getDisplayedColumns();
    const { rowMin, rowMax, colMin, colMax } = normalize(sel);

    for (let r = rowMin; r <= rowMax; r++) {
      const rowNode = api.getDisplayedRowAtIndex(r);
      if (!rowNode) continue;

      for (let c = colMin; c <= colMax; c++) {
        const col = columns[c];
        if (!col) continue;
        const colDef = col.getColDef();
        if (!isEditableColumn(colDef)) continue;

        const isBoolean = typeof rowNode.data?.[colDef.field] === "boolean";
        rowNode.setDataValue(colDef.field, isBoolean ? false : "");
      }
    }

    onRangeChanged?.();
  }, [onRangeChanged]);

  // -------------------------------------------------------------
  // fill down (Ctrl/Cmd + D) - copies the top row of the selection
  // into every other row of the selection, per column. Excel's
  // classic bulk-edit shortcut; very useful for assigning the same
  // Kendra / Seva / Shift to a block of selected volunteers at once.
  // -------------------------------------------------------------

  const fillDown = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;
    if (!api || !sel) return;

    const columns = getDisplayedColumns();
    const { rowMin, rowMax, colMin, colMax } = normalize(sel);
    if (rowMin === rowMax) return; // nothing to fill

    const sourceNode = api.getDisplayedRowAtIndex(rowMin);
    if (!sourceNode) return;

    for (let c = colMin; c <= colMax; c++) {
      const col = columns[c];
      if (!col) continue;
      const colDef = col.getColDef();
      if (!isEditableColumn(colDef)) continue;

      const sourceValue = sourceNode.data?.[colDef.field];

      for (let r = rowMin + 1; r <= rowMax; r++) {
        const rowNode = api.getDisplayedRowAtIndex(r);
        if (!rowNode) continue;
        rowNode.setDataValue(colDef.field, sourceValue);
      }
    }

    onRangeChanged?.();
  }, [onRangeChanged]);

  // -------------------------------------------------------------
  // keyboard + paste wiring, scoped to the grid's container element
  // -------------------------------------------------------------

  const getSelectionSize = useCallback(() => {
    const sel = selectionRef.current;
    if (!sel) return null;
    const { rowMin, rowMax, colMin, colMax } = normalize(sel);
    return { rows: rowMax - rowMin + 1, cols: colMax - colMin + 1 };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const withinGrid = (target) => container.contains(target);

    const handleKeyDown = (e) => {
      if (!withinGrid(document.activeElement)) return;

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "c") {
        copySelection();
      } else if (modifier && e.key.toLowerCase() === "d") {
        e.preventDefault();
        fillDown();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const api = gridApiRef.current;
        const isEditing = api && api.getEditingCells().length > 0;
        if (isEditing) return; // let normal in-cell editing handle it

        // Only intercept Delete/Backspace when a *range* (more than
        // one cell) is selected. A single-cell Delete/Backspace is
        // left to ag-grid's normal editing behaviour.
        const size = getSelectionSize();
        if (size && (size.rows > 1 || size.cols > 1)) {
          e.preventDefault();
          clearSelection();
        }
      }
    };

    const handlePaste = (e) => {
      if (!withinGrid(e.target)) return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      pasteAtSelection(text);
    };

    document.addEventListener("keydown", handleKeyDown);
    container.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("paste", handlePaste);
    };
  }, [copySelection, pasteAtSelection, clearSelection, fillDown, getSelectionSize]);

  return {
    containerRef,
    setGridApi,
    cellClassRules,
    handleCellMouseDown,
    handleCellMouseOver,
    copySelection,
    pasteAtSelection,
    clearSelection,
    fillDown,
    getSelection: () => selectionRef.current,
    normalizeSelection: () =>
      selectionRef.current ? normalize(selectionRef.current) : null,
  };
}
