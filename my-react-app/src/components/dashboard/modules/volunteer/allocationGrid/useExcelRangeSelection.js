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
//                      selection's top-left cell
//   - Delete / Backspace -> clear the selected range (any size)
//   - Ctrl/Cmd + X  -> cut (copy + clear)
//   - Ctrl/Cmd + D  -> "fill down": copies the top row of the
//                      selection into every other selected row
//   - Ctrl/Cmd + R  -> "fill right": copies the left-most column of
//                      the selection into every other selected column
//   - Ctrl/Cmd + Z / Y -> undo / redo (ag-grid's own history stack)
//   - Ctrl/Cmd + A  -> select all cells
//   - Shift + Space / Ctrl+Space -> select entire row / column
//   - Tab / Shift+Tab, Enter / Shift+Enter -> move selection
//   - Shift + Arrow -> extend selection; Ctrl+Arrow -> jump to edge
//   - F2 / Alt+ArrowDown -> start editing the active cell
//   - Escape -> cancel an in-progress edit
//
// IMPORTANT (single-click vs edit): this hook assumes the grid's
// defaultColDef has `singleClickEdit: false`. A single click should
// SELECT a cell, not open its editor — otherwise every click puts the
// grid into "editing" state, and this hook deliberately backs off
// while editing (so it doesn't hijack normal typing), which silently
// swallows every shortcut below.
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
//     onRangeChanged: () => setUnsavedChanges(true),
//   });
//
//   <div ref={excel.containerRef}>
//     <AgGridReact
//       onGridReady={(p) => excel.setGridApi(p.api)}
//       onCellMouseDown={excel.handleCellMouseDown}
//       onCellMouseOver={excel.handleCellMouseOver}
//       defaultColDef={{ ...otherDefaults, singleClickEdit: false, cellClassRules: excel.cellClassRules }}
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

  const selectEntireRow = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();
    const { rowMin } = normalize(sel);

    selectionRef.current = {
      startRow: rowMin,
      endRow: rowMin,
      startCol: 0,
      endCol: columns.length - 1,
    };

    refreshSelectionVisuals();
  }, []);

  const selectEntireColumn = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();

    const { colMin } = normalize(sel);

    selectionRef.current = {
      startRow: 0,
      endRow: api.getDisplayedRowCount() - 1,
      startCol: colMin,
      endCol: colMin,
    };

    refreshSelectionVisuals();
  }, []);

  const extendSelection = useCallback((rowOffset, colOffset) => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();

    const rowCount = api.getDisplayedRowCount();

    let newRow = sel.endRow + rowOffset;
    let newCol = sel.endCol + colOffset;

    newRow = Math.max(0, Math.min(rowCount - 1, newRow));
    newCol = Math.max(0, Math.min(columns.length - 1, newCol));

    selectionRef.current = {
      ...sel,
      endRow: newRow,
      endCol: newCol,
    };

    refreshSelectionVisuals();
  }, []);

  const jumpSelection = useCallback((direction) => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();

    const rowCount = api.getDisplayedRowCount();

    const { rowMin, colMin } = normalize(sel);

    let row = rowMin;
    let col = colMin;

    switch (direction) {
      case "left":
        col = 0;
        break;

      case "right":
        col = columns.length - 1;
        break;

      case "up":
        row = 0;
        break;

      case "down":
        row = rowCount - 1;
        break;

      default:
        return;
    }

    selectionRef.current = {
      startRow: row,
      endRow: row,
      startCol: col,
      endCol: col,
    };

    refreshSelectionVisuals();

    api.ensureIndexVisible(row);
    api.ensureColumnVisible(columns[col]);

    api.setFocusedCell(row, columns[col].getColId());
  }, []);

  // -------------------------------------------------------------
  // cellClassRules entry - highlights any cell inside the current
  // selection rectangle.
  //
  // IMPORTANT: this must keep a STABLE object identity across
  // re-renders. It's read from a ref internally, so it never needs to
  // change - but if it were re-created as a fresh object literal on
  // every render, any component that memoizes something off of it
  // (e.g. `defaultColDef` in SevaAllocation.jsx) would see a "changed"
  // dependency on every render, recompute, hand ag-grid a new
  // defaultColDef reference, and ag-grid would reset its column config
  // in response - silently cancelling any cell edit in progress.
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

    const fallbackCopy = () => {
      // navigator.clipboard is missing (insecure context) or was
      // rejected (some sandboxed dev-preview iframes block
      // clipboard-write via permissions-policy). Fall back to the
      // classic hidden-textarea + execCommand trick.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing more we can do */
      } finally {
        document.body.removeChild(textarea);
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(fallbackCopy);
    } else {
      fallbackCopy();
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
  // clear selected range (Delete / Backspace) - works for a single
  // selected cell too, not just multi-cell ranges.
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
  // into every other row of the selection, per column.
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
  // fill right (Ctrl/Cmd + R) - copies the left-most column of the
  // selection into every other selected column.
  // -------------------------------------------------------------

  const fillRight = useCallback(() => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();
    const { rowMin, rowMax, colMin, colMax } = normalize(sel);

    if (colMin === colMax) return;

    for (let r = rowMin; r <= rowMax; r++) {
      const rowNode = api.getDisplayedRowAtIndex(r);
      if (!rowNode) continue;

      const sourceCol = columns[colMin];
      const sourceField = sourceCol.getColDef().field;
      const sourceValue = rowNode.data[sourceField];

      for (let c = colMin + 1; c <= colMax; c++) {
        const targetCol = columns[c];
        if (!targetCol) continue;

        const colDef = targetCol.getColDef();

        if (!isEditableColumn(colDef)) continue;

        rowNode.setDataValue(colDef.field, sourceValue);
      }
    }

    onRangeChanged?.();
  }, [onRangeChanged]);

  const moveSelection = useCallback((rowOffset, colOffset) => {
    const api = gridApiRef.current;
    const sel = selectionRef.current;

    if (!api || !sel) return;

    const columns = getDisplayedColumns();

    const rowCount = api.getDisplayedRowCount();
    const colCount = columns.length;

    const { rowMin, colMin } = normalize(sel);

    let newRow = rowMin + rowOffset;
    let newCol = colMin + colOffset;

    newRow = Math.max(0, Math.min(rowCount - 1, newRow));
    newCol = Math.max(0, Math.min(colCount - 1, newCol));

    selectionRef.current = {
      startRow: newRow,
      endRow: newRow,
      startCol: newCol,
      endCol: newCol,
    };

    refreshSelectionVisuals();

    api.ensureIndexVisible(newRow);
    api.ensureColumnVisible(columns[newCol]);

    api.setFocusedCell(newRow, columns[newCol].getColId());
  }, []);

  // -------------------------------------------------------------
  // keyboard wiring, scoped to the grid's container element
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

      const api = gridApiRef.current;
      const isEditing = !!(api && api.getEditingCells().length > 0);

      // While a cell editor is open, this handler only steps in for
      // Escape / Enter / Tab (commit-and-move, like Excel). Every
      // other combo below is a *cell selection* shortcut - letting it
      // run during editing would hijack normal typing (e.g. Ctrl+A
      // would select the whole grid instead of the text in the input;
      // Shift+Arrow would move the cell range instead of the text
      // cursor).
      if (isEditing) {
        if (e.key === "Escape") {
          api.stopEditing(true); // discard the in-progress edit
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          api.stopEditing(false); // commit
          moveSelection(e.shiftKey ? -1 : 1, 0);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          api.stopEditing(false); // commit
          moveSelection(0, e.shiftKey ? -1 : 1);
          return;
        }
        return; // anything else: let the editor handle its own keys
      }

      if (modifier && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelection();
      } else if (modifier && e.key.toLowerCase() === "v") {
        // Read the clipboard directly instead of relying on a native
        // 'paste' DOM event - a selected-but-not-editing cell is a
        // plain div, and browsers only dispatch 'paste' to editable
        // elements, so that event never fires for "select range, then
        // paste." Reading the clipboard on keydown works regardless.
        e.preventDefault();
        navigator.clipboard
          ?.readText()
          .then((text) => {
            if (text) pasteAtSelection(text);
          })
          .catch(() => {
            /* clipboard-read blocked/denied (permissions, insecure
               context, etc.) - nothing more we can do here */
          });
      } else if (modifier && e.key.toLowerCase() === "x") {
        e.preventDefault();
        copySelection();
        clearSelection();
      } else if (modifier && e.key.toLowerCase() === "d") {
        e.preventDefault();
        fillDown();
      } else if (modifier && e.key.toLowerCase() === "r") {
        e.preventDefault();
        fillRight();
      } else if (modifier && e.key.toLowerCase() === "z") {
        // Ctrl/Cmd + Z -> undo. Uses ag-grid's own undo stack
        // (already enabled via undoRedoCellEditing in gridOptions),
        // same one the toolbar's Undo button calls.
        e.preventDefault();
        api?.undoCellEditing();
      } else if (modifier && e.key.toLowerCase() === "y") {
        // Ctrl/Cmd + Y -> redo.
        e.preventDefault();
        api?.redoCellEditing();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // isEditing is already handled above (early return), so any
        // selection here - single cell or a range - gets cleared,
        // matching Excel's behaviour.
        if (!selectionRef.current) return;
        e.preventDefault();
        clearSelection();
      } else if (modifier && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (!api) return;
        const columns = getDisplayedColumns();
        selectionRef.current = {
          startRow: 0,
          endRow: api.getDisplayedRowCount() - 1,
          startCol: 0,
          endCol: columns.length - 1,
        };
        refreshSelectionVisuals();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === "Enter" && !modifier) {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        moveSelection(0, 1);
      } else if (e.key === "F2") {
        e.preventDefault();
        const sel = selectionRef.current;
        if (!api || !sel) return;
        const columns = getDisplayedColumns();
        const { rowMin, colMin } = normalize(sel);
        api.startEditingCell({
          rowIndex: rowMin,
          colKey: columns[colMin].getColId(),
        });
      } else if (e.key === "Escape") {
        api?.stopEditing(true);
      } else if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        const sel = selectionRef.current;
        if (!api || !sel) return;
        const columns = getDisplayedColumns();
        const { rowMin, colMin } = normalize(sel);
        api.startEditingCell({
          rowIndex: rowMin,
          colKey: columns[colMin].getColId(),
        });
      } else if (modifier && e.code === "Space") {
        e.preventDefault();
        selectEntireColumn();
      } else if (e.shiftKey && e.code === "Space") {
        e.preventDefault();
        selectEntireRow();
      } else if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        extendSelection(0, 1);
      } else if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        extendSelection(0, -1);
      } else if (e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        extendSelection(-1, 0);
      } else if (e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        extendSelection(1, 0);
      } else if (modifier && e.key === "ArrowLeft") {
        e.preventDefault();
        jumpSelection("left");
      } else if (modifier && e.key === "ArrowRight") {
        e.preventDefault();
        jumpSelection("right");
      } else if (modifier && e.key === "ArrowUp") {
        e.preventDefault();
        jumpSelection("up");
      } else if (modifier && e.key === "ArrowDown") {
        e.preventDefault();
        jumpSelection("down");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    copySelection,
    pasteAtSelection,
    clearSelection,
    fillDown,
    fillRight,
    moveSelection,
    selectEntireRow,
    selectEntireColumn,
    extendSelection,
    jumpSelection,
    getSelectionSize,
  ]);

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
    fillRight,
    selectEntireRow,
    selectEntireColumn,
    getSelection: () => selectionRef.current,
    normalizeSelection: () =>
      selectionRef.current ? normalize(selectionRef.current) : null,
  };
}
