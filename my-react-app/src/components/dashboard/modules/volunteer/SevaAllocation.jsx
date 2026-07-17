import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import axios from "axios";

import { AgGridReact } from "ag-grid-react";

import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  ValidationModule,
  PaginationModule,
  RowSelectionModule,
  QuickFilterModule,
  TextEditorModule,
  CheckboxEditorModule,
  CustomEditorModule,
  UndoRedoEditModule, // needed for undoRedoCellEditing
  ColumnAutoSizeModule, // needed for sizeColumnsToFit / autoSizeColumns
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "../../../../styles/volunteer/SevaAllocation.css";

import AllocationToolbar from "../volunteer/allocationGrid/AllocationToolbar";
import DropdownEditor from "../volunteer/allocationGrid/DropdownEditor";
import useExcelRangeSelection from "../volunteer/allocationGrid/useExcelRangeSelection";
import {
  KENDRA_LIST as MOCK_KENDRA_LIST,
  SEVA_LIST as MOCK_SEVA_LIST,
  SHIFT_LIST as MOCK_SHIFT_LIST,
  FIXED_MOCK_ROWS,
  generateMockAllocationData,
} from "../volunteer/allocationGrid/mockData";

import { exportGridToExcel } from "../../../../utils/exportExcel";
import { importExcelFile } from "../../../../utils/importExcel";

// -----------------------------------------
// Register every module the grid actually uses.
// Missing a module here doesn't crash the app - it just makes that
// one feature (pagination, selection, quick filter, editing...)
// silently stop working.
// -----------------------------------------
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
  RowSelectionModule,
  QuickFilterModule,
  TextEditorModule, // needed for default editable text cells
  CheckboxEditorModule, // needed for agCheckboxCellEditor
  CustomEditorModule, // needed for the custom DropdownEditor
  UndoRedoEditModule, // needed for undoRedoCellEditing
  ColumnAutoSizeModule, // needed for sizeColumnsToFit / autoSizeColumns
  ValidationModule, // dev-only: keep out of prod bundle if bundle size matters
]);

const API_URL = import.meta.env.VITE_API_URL;

// -----------------------------------------
// MOCK DATA SWITCH
// -----------------------------------------
// Flip this to `false` once GetAllocationList / GetKendraList /
// GetSevaList / GetShiftList are ready on the backend. Nothing else in
// this file needs to change - the axios calls are already written
// below and will simply take over.
//
// MOCK_RECORD_COUNT controls how many synthetic rows are generated:
//   - 10   -> fast, realistic-looking data for everyday development
//   - 5000 -> load-test the grid at the real expected scale
const USE_MOCK_DATA = true;
const MOCK_RECORD_COUNT = 10;

// -----------------------------------------
// Blank row template for "Add Row".
// Keep this in sync with columnDefs fields below.
// -----------------------------------------
const BLANK_ROW = {
  kendraName: "",
  sevaName: "",
  shift: "",
  volName: "",
  age: "",
  gender: "",
  emailId: "",
  mobileNo: "",
  whatsappNo: "",
  comingToBapuSince: "",
  education: "",
  occupation: "",
  comingThursdaySeva: false,
  badgeNo: "",
  thursdayCoordinator: false,
  utsavCoordinator: false,
};

// A client-side-only id generator, used for rows that don't have a
// backend-assigned id yet (freshly added rows, or rows whose API
// response didn't include one). Never sent to the server.
const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// TODO: confirm the actual primary-key field name your backend uses
// for an allocation record (commonly "id" or "allocationId"). Update
// this single helper and everything below (getRowId, delete, save)
// stays correct.
const getBackendId = (row) => row?.id ?? row?.allocationId ?? null;

// -----------------------------------------
// Yes/No column helper
// -----------------------------------------
// Boolean fields (comingThursdaySeva, thursdayCoordinator,
// utsavCoordinator) display and edit as "Yes"/"No" instead of a
// checkbox. valueGetter/valueSetter do the boolean <-> text
// conversion so the underlying data stays a real boolean (important
// if the backend expects true/false rather than the strings). No
// custom cellRenderer here on purpose - it renders as plain text via
// ag-grid's default renderer, same as every other column.
const YES_NO_VALUES = ["Yes", "No"];

const yesNoColumn = (field) => ({
  valueGetter: (params) => (params.data?.[field] ? "Yes" : "No"),
  valueSetter: (params) => {
    params.data[field] = params.newValue === "Yes";
    return true;
  },
  cellEditor: DropdownEditor,
  cellEditorParams: { values: YES_NO_VALUES },
});

const SevaAllocation = () => {
  const gridRef = useRef();

  const [loading, setLoading] = useState(false);

  const [rowData, setRowData] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [kendraList, setKendraList] = useState([]);

  const [sevaList, setSevaList] = useState([]);

  const [shiftList, setShiftList] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [gridApi, setGridApi] = useState(null);

  // NOTE: columnApi is gone as of AG Grid v31+ - all column operations
  // (autoSizeColumns, getColumns, etc.) now live on the regular grid `api`.
  // A separate columnApi state is no longer needed.

  // -----------------------------------------
  // Excel-like range select / copy / paste / fill-down.
  // See useExcelRangeSelection.js for the full behaviour breakdown.
  // -----------------------------------------
  const excel = useExcelRangeSelection({
    onRangeChanged: () => setUnsavedChanges(true),
  });

  // -----------------------------------------
  // Warn before leaving the tab with unsaved edits
  // -----------------------------------------

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!unsavedChanges) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges]);

  // -----------------------------------------
  // Fetch Dropdowns
  // -----------------------------------------

  const loadDropdowns = async () => {
    if (USE_MOCK_DATA) {
      setKendraList(MOCK_KENDRA_LIST);
      setSevaList(MOCK_SEVA_LIST);
      setShiftList(MOCK_SHIFT_LIST);
      return;
    }

    try {
      const [kendraRes, sevaRes, shiftRes] = await Promise.all([
        axios.get(`${API_URL}/GetKendraList`),
        axios.get(`${API_URL}/GetSevaList`),
        axios.get(`${API_URL}/GetShiftList`),
      ]);

      // Defensive: only accept real arrays. If an endpoint returns
      // something else (e.g. an error payload, or a wrapped object like
      // { data: [...] } instead of a bare array), fall back to [] instead
      // of letting a non-array leak into state and crash `.map()` in
      // columnDefs.
      setKendraList(Array.isArray(kendraRes.data) ? kendraRes.data : []);
      setSevaList(Array.isArray(sevaRes.data) ? sevaRes.data : []);
      setShiftList(Array.isArray(shiftRes.data) ? shiftRes.data : []);

      if (!Array.isArray(kendraRes.data)) {
        console.warn("GetKendraList did not return an array:", kendraRes.data);
      }
      if (!Array.isArray(sevaRes.data)) {
        console.warn("GetSevaList did not return an array:", sevaRes.data);
      }
      if (!Array.isArray(shiftRes.data)) {
        console.warn("GetShiftList did not return an array:", shiftRes.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // -----------------------------------------
  // Fetch Allocation List
  // -----------------------------------------

  const loadAllocationList = async () => {
    if (USE_MOCK_DATA) {
      setLoading(true);
      // small artificial delay so the loading overlay/spinner path
      // still gets exercised during development
      setTimeout(() => {
        const data =
          MOCK_RECORD_COUNT <= FIXED_MOCK_ROWS.length
            ? FIXED_MOCK_ROWS.slice(0, MOCK_RECORD_COUNT)
            : generateMockAllocationData(MOCK_RECORD_COUNT);

        setRowData(
          data.map((row) => ({
            _rowId: getBackendId(row) ?? generateTempId(),
            ...row,
          })),
        );
        setLoading(false);
      }, 250);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/GetAllocationList`);

      const data = Array.isArray(response.data) ? response.data : [];

      if (!Array.isArray(response.data)) {
        console.warn(
          "GetAllocationList did not return an array:",
          response.data,
        );
      }

      // Give every row a stable client-side identity (_rowId) so ag-grid
      // can track selection/edits correctly across re-renders, even if
      // the backend row doesn't include an id, or the id field name
      // varies. This never gets sent back to the server (stripped in
      // saveAllocation).
      const normalized = data.map((row) => ({
        _rowId: getBackendId(row) ?? generateTempId(),
        ...row,
      }));

      setRowData(normalized);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdowns();
    loadAllocationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  // Grid Ready
  // -----------------------------------------

  const onGridReady = (params) => {
    setGridApi(params.api);
    excel.setGridApi(params.api);

    params.api.sizeColumnsToFit();
  };

  // -----------------------------------------
  // Stable row identity for ag-grid
  // -----------------------------------------

  const getRowId = useCallback((params) => String(params.data._rowId), []);

  // -----------------------------------------
  // Global Search
  // -----------------------------------------

  useEffect(() => {
    if (!gridApi) return;

    gridApi.setGridOption("quickFilterText", searchText);
  }, [searchText, gridApi]);

  // -----------------------------------------
  // Cell Changed
  // -----------------------------------------

  const onCellValueChanged = useCallback(() => {
    setUnsavedChanges(true);
  }, []);

  // -----------------------------------------
  // Selection Changed
  // -----------------------------------------

  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;

    setSelectedRows(gridApi.getSelectedRows());
  }, [gridApi]);

  // -----------------------------------------
  // Add Row
  // -----------------------------------------

  const addNewRow = useCallback(() => {
    const newRow = {
      _rowId: generateTempId(),
      ...BLANK_ROW,
    };

    setRowData((prev) => [newRow, ...prev]);
    setUnsavedChanges(true);
  }, []);

  // -----------------------------------------
  // Delete Selected Rows
  // -----------------------------------------

  const deleteSelectedRows = useCallback(async () => {
    if (!gridApi) return;

    const rows = gridApi.getSelectedRows();

    if (rows.length === 0) {
      alert("Select at least one row to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${rows.length} selected row(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    // Rows that already exist on the server need an API call.
    // Rows that only exist client-side (just added, never saved) can be
    // dropped locally with no request.
    const persistedIds = rows
      .map((r) => getBackendId(r))
      .filter((id) => id !== null);

    try {
      setLoading(true);

      if (!USE_MOCK_DATA && persistedIds.length > 0) {
        // TODO: confirm the real delete endpoint + request shape with
        // the backend. Common shapes: POST with { ids: [...] }, or
        // DELETE with ids in the query string / body.
        await axios.post(`${API_URL}/DeleteAllocation`, {
          ids: persistedIds,
        });
      }

      const deletedRowIds = new Set(rows.map((r) => r._rowId));
      setRowData((prev) => prev.filter((r) => !deletedRowIds.has(r._rowId)));
      setSelectedRows([]);
    } catch (err) {
      console.log(err);
      alert("Failed to delete selected rows. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [gridApi]);

  // -----------------------------------------
  // Save Allocation
  // -----------------------------------------

  const saveAllocation = async () => {
    if (USE_MOCK_DATA) {
      // Nothing to persist yet - just clear the "unsaved" flag so the
      // rest of the UI (toolbar, status bar) behaves the way it will
      // once the real endpoint is wired in.
      setUnsavedChanges(false);
      alert(
        "Mock mode: changes are kept in memory only (not sent anywhere yet). Flip USE_MOCK_DATA to false once the API is ready.",
      );
      return;
    }

    try {
      setLoading(true);

      // Strip the client-only _rowId before sending to the server.
      const payload = rowData.map(({ _rowId, ...rest }) => rest);

      // TODO: confirm whether the backend wants the full row list on
      // every save (current behavior) or only changed rows. If only
      // changed rows, track dirty row ids in onCellValueChanged and
      // filter payload down to those before posting.
      await axios.post(`${API_URL}/SaveAllocation`, payload);

      setUnsavedChanges(false);

      alert("Allocation Saved Successfully");
    } catch (err) {
      console.log(err);
      alert("Failed to save allocation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Ctrl/Cmd + S -> Save
  // -----------------------------------------
  // Kept as a ref so the listener can be attached once on mount
  // instead of being torn down/re-added on every render (saveAllocation
  // isn't wrapped in useCallback, so its reference changes each render).
  const saveAllocationRef = useRef(saveAllocation);
  saveAllocationRef.current = saveAllocation;

  useEffect(() => {
    const handleSaveShortcut = (e) => {
      const isSaveCombo =
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSaveCombo) return;

      e.preventDefault(); // stop the browser's "Save Page" dialog
      saveAllocationRef.current();
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, []);

  // -----------------------------------------
  // Delete key -> delete selected row(s)
  // -----------------------------------------
  // Mirrors the toolbar's Delete button (same confirm dialog, same
  // deleteSelectedRows call) but triggered by pressing the keyboard
  // Delete key once one or more rows are checkbox-selected.
  //
  // This is intentionally attached in the CAPTURE phase so it runs
  // before useExcelRangeSelection's own Delete-key handler (which
  // clears the contents of a selected *cell range* - a different
  // feature). Capture-phase listeners always run before bubble-phase
  // ones for the same event, so when a whole row is selected, this
  // wins and stops the event from reaching that other handler.
  useEffect(() => {
    const handleDeleteRowShortcut = (e) => {
      if (e.key !== "Delete") return;
      if (!gridApi) return;

      // Don't hijack Delete while the user is actively typing/editing
      // inside a cell - let normal in-cell editing behaviour handle it.
      if (gridApi.getEditingCells().length > 0) return;

      const selected = gridApi.getSelectedRows();
      if (selected.length === 0) return; // nothing row-selected: leave the key alone

      e.preventDefault();
      e.stopPropagation();
      deleteSelectedRows(); // already shows a confirm dialog before deleting
    };

    window.addEventListener("keydown", handleDeleteRowShortcut, true); // capture phase
    return () =>
      window.removeEventListener("keydown", handleDeleteRowShortcut, true);
  }, [gridApi, deleteSelectedRows]);

  // -----------------------------------------
  // Refresh
  // -----------------------------------------

  const refreshGrid = () => {
    if (unsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes that will be lost. Refresh anyway?",
      );
      if (!confirmed) return;
    }

    loadAllocationList();
  };

  // -----------------------------------------
  // Export (client-side, current grid view -> Excel)
  // -----------------------------------------

  const exportExcel = () => {
    exportGridToExcel(gridRef);
  };

  // -----------------------------------------
  // Export File (server-generated file download)
  // -----------------------------------------

  const exportAllocationFile = async () => {
    if (USE_MOCK_DATA) {
      alert(
        'This downloads a file generated by the server. It\'ll work once the real API is connected - use "Export Excel" for a client-side export in the meantime.',
      );
      return;
    }

    try {
      setLoading(true);

      // TODO: confirm the real export endpoint, any query params
      // (filters/date range/kendra), and response content type with
      // the backend. Assumes it streams back a binary file (xlsx/pdf/csv).
      const response = await axios.get(`${API_URL}/ExportAllocationFile`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `SevaAllocation_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
      alert("Failed to export allocation file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Default Column
  // -----------------------------------------

  const defaultColDef = useMemo(
    () => ({
      editable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      singleClickEdit: true,
      minWidth: 150,
      // Highlights every cell that falls inside the current
      // click-and-drag Excel-style selection - see
      // useExcelRangeSelection.js.
      cellClassRules: excel.cellClassRules,
    }),
    [excel.cellClassRules],
  );
  // -----------------------------------------
  // Column Definitions
  // -----------------------------------------

  const columnDefs = useMemo(
    () => [
      // Dedicated row-selection column, pinned first. rowSelection's
      // auto-checkbox (gridOptions.rowSelection.checkboxes) is turned
      // off below specifically so it doesn't also try to inject a
      // checkbox on whatever it thinks is the "first" column - that's
      // what was causing the stray checkbox to show up inside the
      // Seva Name column instead of here.
      {
        headerName: "",
        colId: "rowSelectionCheckbox",
        pinned: "left",
        width: 46,
        minWidth: 46,
        maxWidth: 46,
        resizable: false,
        sortable: false,
        filter: false,
        editable: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        cellClass: "selection-checkbox-cell",
        headerClass: "selection-checkbox-header",
      },

      {
        headerName: "Kendra Name",
        field: "kendraName",
        editable: true,
        cellEditor: DropdownEditor,
        cellEditorParams: {
          values: (Array.isArray(kendraList) ? kendraList : []).map(
            (x) => x.kendraName,
          ),
        },
        pinned: "left",
        width: 180,
      },

      {
        headerName: "Seva Name",
        field: "sevaName",
        editable: true,
        cellEditor: DropdownEditor,
        cellEditorParams: {
          values: (Array.isArray(sevaList) ? sevaList : []).map(
            (x) => x.sevaName,
          ),
        },
        width: 220,
      },

      {
        headerName: "Shift",
        field: "shift",
        editable: true,
        cellEditor: DropdownEditor,
        cellEditorParams: {
          values: (Array.isArray(shiftList) ? shiftList : []).map(
            (x) => x.shiftName,
          ),
        },
        width: 120,
      },

      {
        headerName: "Volunteer Name",
        field: "volName",
        editable: true,
        width: 220,
      },

      {
        headerName: "Age",
        field: "age",
        editable: true,
        filter: "agNumberColumnFilter",
        width: 90,
      },

      {
        headerName: "Gender",
        field: "gender",
        editable: true,
        width: 120,
      },

      {
        headerName: "Email ID",
        field: "emailId",
        editable: true,
        width: 260,
      },

      {
        headerName: "Mobile No.",
        field: "mobileNo",
        editable: true,
        width: 160,
      },

      {
        headerName: "Whatsapp No.",
        field: "whatsappNo",
        editable: true,
        width: 170,
      },

      {
        headerName: "Coming to Bapu Since",
        field: "comingToBapuSince",
        editable: true,
        width: 180,
      },

      {
        headerName: "Education",
        field: "education",
        editable: true,
        width: 180,
      },

      {
        headerName: "Occupation",
        field: "occupation",
        editable: true,
        width: 180,
      },

      {
        headerName: "Coming To Thursday Seva",
        field: "comingThursdaySeva",
        editable: true,
        ...yesNoColumn("comingThursdaySeva"),
        width: 190,
      },

      {
        headerName: "Badge No.",
        field: "badgeNo",
        editable: true,
        width: 150,
      },

      {
        headerName: "Thursday Seva Coordinator",
        field: "thursdayCoordinator",
        editable: true,
        ...yesNoColumn("thursdayCoordinator"),
        width: 220,
      },

      {
        headerName: "Utsav Coordinator",
        field: "utsavCoordinator",
        editable: true,
        ...yesNoColumn("utsavCoordinator"),
        width: 190,
      },
    ],
    [kendraList, sevaList, shiftList],
  );

  // -----------------------------------------
  // Import from Excel / CSV
  // -----------------------------------------

  const headerMap = useMemo(
    () => columnDefs.map((c) => ({ headerName: c.headerName, field: c.field })),
    [columnDefs],
  );

  const importFromExcel = useCallback(
    async (file) => {
      try {
        setLoading(true);

        const parsedRows = await importExcelFile(file, headerMap);

        if (parsedRows.length === 0) {
          alert("No rows were found in that file.");
          return;
        }

        const replace = window.confirm(
          `Found ${parsedRows.length} row(s) in "${file.name}".\n\nPress OK to REPLACE the current data, or Cancel to APPEND to it.`,
        );

        const withIds = parsedRows.map((row) => ({
          _rowId: generateTempId(),
          ...BLANK_ROW,
          ...row,
        }));

        setRowData((prev) => (replace ? withIds : [...withIds, ...prev]));
        setUnsavedChanges(true);
      } catch (err) {
        console.log(err);
        alert(
          "Couldn't read that file. Make sure it's a valid .xlsx, .xls, or .csv export.",
        );
      } finally {
        setLoading(false);
      }
    },
    [headerMap],
  );

  // -----------------------------------------
  // Auto Size Columns
  // -----------------------------------------

  const autoSizeAll = () => {
    if (!gridApi) return;

    const columns = gridApi.getColumns();

    if (!columns) return;

    gridApi.autoSizeColumns(columns.map((col) => col.getColId()));
  };

  // -----------------------------------------
  // Undo / Redo / Fill Down
  // (undo+redo use ag-grid's own history stack, already enabled via
  // undoRedoCellEditing in gridOptions below; fillDown is the custom
  // Excel-style bulk-edit helper from useExcelRangeSelection.js)
  // -----------------------------------------

  const undo = () => gridApi?.undoCellEditing();
  const redo = () => gridApi?.redoCellEditing();
  const fillDown = () => excel.fillDown();

  // -----------------------------------------
  // Clear Filters
  // -----------------------------------------

  const clearFilters = () => {
    if (!gridApi) return;

    gridApi.setFilterModel(null);
    gridApi.setGridOption("quickFilterText", "");
    setSearchText("");
  };

  // -----------------------------------------
  // Grid Options
  // (single source of truth, memoized so it isn't rebuilt every render)
  // -----------------------------------------

  const gridOptions = useMemo(
    () => ({
      // v33+ defaults to the new Theming API, which conflicts with the
      // ag-grid.css / ag-theme-quartz.css file-based theme imported above
      // (error #239). "legacy" tells the grid to defer to those CSS files.
      theme: "legacy",

      rowSelection: {
        mode: "multiRow",
        enableClickSelection: false,
        // We render our own checkbox column (see columnDefs) pinned
        // as column 1, so switch off ag-grid's automatic checkbox
        // placement to avoid a second, oddly-positioned one.
        checkboxes: false,
        headerCheckbox: false,
      },

      animateRows: true,

      pagination: true,

      paginationPageSize: 50,

      // 50 isn't in the grid's default page-size options ([20, 50, 100]),
      // so list every option explicitly to avoid warnings #94/#95.
      // 5000 friendly ranges are here too, for when the full mock/live
      // data set is loaded.
      paginationPageSizeSelector: [25, 50, 100, 250, 500],

      rowHeight: 42,

      headerHeight: 45,

      // Rows outside the viewport are not rendered - this is what keeps
      // ~5000 rows smooth. Raising the row buffer slightly makes fast
      // scrolling feel less "blank" at the cost of a bit more DOM work.
      rowBuffer: 15,

      suppressDragLeaveHidesColumns: true,

      undoRedoCellEditing: true,

      undoRedoCellEditingLimit: 100,

      enableCellTextSelection: true,

      ensureDomOrder: true,

      tooltipShowDelay: 200,

      tooltipHideDelay: 3000,

      overlayLoadingTemplate: `
        <span class="ag-overlay-loading-center">
          Loading Allocation...
        </span>
      `,

      overlayNoRowsTemplate: `
        <span class="ag-overlay-loading-center">
          No Allocation Found
        </span>
      `,
    }),
    [],
  );

  // NOTE on cell/range selection:
  // ag-grid-ENTERPRISE ships a built-in range-selection + clipboard +
  // fill-handle feature set (CellSelectionModule / ClipboardModule),
  // which needs a paid license key. Since this file only imports from
  // ag-grid-community, that path isn't available - the Excel-style
  // click-drag select, copy/paste, delete, and fill-down behaviour used
  // here is instead implemented for free in useExcelRangeSelection.js.
  // If ag-grid-enterprise is added later, that hook can be swapped out
  // for the native `cellSelection` grid option with no change to the
  // rest of this file.

  return (
    <div className="sevaAllocation-master">
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="sevaAllocation-header">
        <div className="sevaAllocation-title">
          <h2>Seva Allocation</h2>
          <p>Allocate Volunteers to Seva</p>
        </div>
      </div>

      {/* ========================================= */}
      {/* TOOLBAR */}
      {/* ========================================= */}

      <AllocationToolbar
        searchText={searchText}
        setSearchText={setSearchText}
        onAddRow={addNewRow}
        onSave={saveAllocation}
        onDelete={deleteSelectedRows}
        onRefresh={refreshGrid}
        onExport={exportExcel}
        onExportFile={exportAllocationFile}
        onImportFile={importFromExcel}
        onClearFilters={clearFilters}
        autoSizeColumns={autoSizeAll}
        onUndo={undo}
        onRedo={redo}
        onFillDown={fillDown}
        unsavedChanges={unsavedChanges}
        selectedRows={selectedRows.length}
        loading={loading}
      />

      {/* ========================================= */}
      {/* GRID CARD */}
      {/* ========================================= */}

      <div className="sevaAllocation-card">
        <div
          ref={excel.containerRef}
          className="ag-theme-quartz sevaAllocation-grid"
          style={{
            width: "100%",
            height: "72vh",
          }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            gridOptions={gridOptions}
            getRowId={getRowId}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            onCellMouseDown={excel.handleCellMouseDown}
            onCellMouseOver={excel.handleCellMouseOver}
          />
        </div>
      </div>

      {/* ========================================= */}
      {/* STATUS BAR */}
      {/* ========================================= */}

      <div className="sevaAllocation-status">
        <div>
          <strong>Total Records :</strong> {rowData.length}
        </div>

        <div>
          <strong>Selected :</strong> {selectedRows.length}
        </div>

        <div>
          {unsavedChanges ? (
            <span className="status-unsaved">● Unsaved Changes</span>
          ) : (
            <span className="status-saved">✔ All Changes Saved</span>
          )}
        </div>

        <div className="sevaAllocation-hint">
          Tip: click-drag to select a range, then Ctrl+C / Ctrl+V to copy-paste
          like Excel, or Ctrl+D to fill down.
        </div>
      </div>

      {/* ========================================= */}
      {/* LOADING OVERLAY */}
      {/* ========================================= */}

      {loading && (
        <div className="sevaAllocation-loading-overlay">
          <div className="sevaAllocation-loader-card">
            <div className="loader"></div>

            <p>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SevaAllocation;
