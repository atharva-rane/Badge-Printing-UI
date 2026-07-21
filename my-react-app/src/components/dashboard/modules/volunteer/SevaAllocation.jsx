import {
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
  RowSelectionModule,
  QuickFilterModule,
  ColumnAutoSizeModule,
  CellStyleModule,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "../../../../styles/volunteer/SevaAllocation.css";

import AllocationToolbar from "../volunteer/allocationGrid/AllocationToolbar";
import ActionsCellRenderer from "../volunteer/allocationGrid/ActionsCellRenderer";
import QRCellRenderer from "../volunteer/allocationGrid/QRCellRenderer";
import VolunteerFormModal from "../volunteer/allocationGrid/VolunteerFormModal";
import QRDetailsModal from "../volunteer/allocationGrid/QRDetailsModal";
import ConfirmModal from "../../../common/ConfirmModal";
import ResultModal, { buildResultMessage } from "../../../common/ResultModal";
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
// one feature (selection, quick filter, sorting/filtering...)
// silently stop working.
// -----------------------------------------
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  QuickFilterModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  ValidationModule,
]);

const API_URL = import.meta.env.VITE_API_URL;

const ENTITY = "Volunteer";

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
// Blank row template for "Add Volunteer".
// Keep this in sync with columnDefs fields below and with
// VolunteerFormModal's own emptyForm.
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

// Fields that must be filled in for a volunteer row to be considered
// "complete". Rows missing any of these get a red highlight (see
// rowClassRules below) so incomplete data stands out visually.
const REQUIRED_FIELDS = ["kendraName", "sevaName", "shift", "volName", "mobileNo"];

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
// Yes/No column helper (display only - editing now happens through
// the Add/Edit Volunteer form, not in the grid cell).
// -----------------------------------------
const yesNoColumn = (field) => ({
  valueGetter: (params) => (params.data?.[field] ? "Yes" : "No"),
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

  // -----------------------------------------
  // Add / Edit Volunteer modal
  // -----------------------------------------
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingRow, setEditingRow] = useState(null);

  // -----------------------------------------
  // Delete confirmation (single row, via the row's delete icon)
  // -----------------------------------------
  const [rowPendingDelete, setRowPendingDelete] = useState(null);
  const [showDeleteRowModal, setShowDeleteRowModal] = useState(false);

  // -----------------------------------------
  // Save / update / delete success popup
  // -----------------------------------------
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // -----------------------------------------
  // QR details popup
  // -----------------------------------------
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrRow, setQrRow] = useState(null);

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
      // can track selection correctly across re-renders, even if the
      // backend row doesn't include an id, or the id field name varies.
      // This never gets sent back to the server (stripped in
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
  // Selection Changed
  // -----------------------------------------

  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;

    setSelectedRows(gridApi.getSelectedRows());
  }, [gridApi]);

  // -----------------------------------------
  // Add / Edit Volunteer (opens the shared form modal instead of
  // editing grid cells directly)
  // -----------------------------------------

  const openAddForm = useCallback(() => {
    setFormMode("add");
    setEditingRow(null);
    setFormModalOpen(true);
  }, []);

  const openEditForm = useCallback((row) => {
    setFormMode("edit");
    setEditingRow(row);
    setFormModalOpen(true);
  }, []);

  const closeForm = () => {
    setFormModalOpen(false);
    setEditingRow(null);
  };

  const closeSuccessModal = () => setShowSuccessModal(false);

  const handleFormSave = (formValues) => {
    if (formMode === "edit" && editingRow) {
      setRowData((prev) =>
        prev.map((r) =>
          r._rowId === editingRow._rowId ? { ...r, ...formValues } : r,
        ),
      );

      setSuccessMessage(buildResultMessage(ENTITY, "updated", formValues.volName));
    } else {
      const newRow = {
        _rowId: generateTempId(),
        ...BLANK_ROW,
        ...formValues,
      };

      setRowData((prev) => [newRow, ...prev]);

      setSuccessMessage(buildResultMessage(ENTITY, "saved", formValues.volName));
    }

    setUnsavedChanges(true);
    setShowSuccessModal(true);
    closeForm();
  };

  // -----------------------------------------
  // Delete a single row (via its row-level delete icon)
  // -----------------------------------------

  const requestDeleteRow = useCallback((row) => {
    setRowPendingDelete(row);
    setShowDeleteRowModal(true);
  }, []);

  const cancelDeleteRow = () => {
    setShowDeleteRowModal(false);
    setRowPendingDelete(null);
  };

  const confirmDeleteRow = async () => {
    if (!rowPendingDelete) return;

    const deletedName = rowPendingDelete.volName;
    const backendId = getBackendId(rowPendingDelete);

    try {
      setLoading(true);

      if (!USE_MOCK_DATA && backendId !== null) {
        // TODO: confirm the real delete endpoint + request shape with
        // the backend. Common shapes: POST with { ids: [...] }, or
        // DELETE with an id in the query string / body.
        await axios.post(`${API_URL}/DeleteAllocation`, { ids: [backendId] });
      }

      setRowData((prev) =>
        prev.filter((r) => r._rowId !== rowPendingDelete._rowId),
      );

      setShowDeleteRowModal(false);
      setRowPendingDelete(null);

      setSuccessMessage(buildResultMessage(ENTITY, "deleted", deletedName));
      setShowSuccessModal(true);
    } catch (err) {
      console.log(err);
      alert("Failed to delete this volunteer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Delete Selected Rows (bulk, via toolbar / checkbox selection)
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
  // QR Details Popup
  // -----------------------------------------

  const openQrModal = useCallback((row) => {
    setQrRow(row);
    setQrModalOpen(true);
  }, []);

  const closeQrModal = () => {
    setQrModalOpen(false);
    setQrRow(null);
  };

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
      // every save (current behavior) or only changed rows.
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
  // Direct in-cell editing has been removed project-wide for this grid.
  // All add/edit now goes through VolunteerFormModal (see the Actions
  // column below), which is more reliable at this data volume and
  // gives every field proper validation.

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      minWidth: 140,
    }),
    [],
  );
  // -----------------------------------------
  // Column Definitions
  // -----------------------------------------

  const columnDefs = useMemo(
    () => [
      // Dedicated row-selection column, pinned first.
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
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        cellClass: "selection-checkbox-cell",
        headerClass: "selection-checkbox-header",
      },

      // Actions column (2nd column): Edit opens VolunteerFormModal
      // pre-filled with the row; Delete opens the shared confirm popup.
      {
        headerName: "Actions",
        colId: "actions",
        pinned: "left",
        width: 90,
        minWidth: 90,
        maxWidth: 90,
        resizable: false,
        sortable: false,
        filter: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        cellRenderer: ActionsCellRenderer,
      },

      {
        headerName: "Kendra Name",
        field: "kendraName",
        pinned: "left",
        width: 180,
      },

      {
        headerName: "Seva Name",
        field: "sevaName",
        width: 220,
      },

      {
        headerName: "Shift",
        field: "shift",
        width: 120,
      },

      {
        headerName: "Volunteer Name",
        field: "volName",
        width: 220,
      },

      {
        headerName: "Age",
        field: "age",
        filter: "agNumberColumnFilter",
        width: 90,
      },

      {
        headerName: "Gender",
        field: "gender",
        width: 120,
      },

      {
        headerName: "Email ID",
        field: "emailId",
        width: 260,
      },

      {
        headerName: "Mobile No.",
        field: "mobileNo",
        width: 160,
      },

      {
        headerName: "Whatsapp No.",
        field: "whatsappNo",
        width: 170,
      },

      {
        headerName: "Coming to Bapu Since",
        field: "comingToBapuSince",
        width: 180,
      },

      {
        headerName: "Education",
        field: "education",
        width: 180,
      },

      {
        headerName: "Occupation",
        field: "occupation",
        width: 180,
      },

      {
        headerName: "Coming To Thursday Seva",
        field: "comingThursdaySeva",
        ...yesNoColumn("comingThursdaySeva"),
        width: 190,
      },

      {
        headerName: "Badge No.",
        field: "badgeNo",
        width: 150,
      },

      {
        headerName: "Thursday Seva Coordinator",
        field: "thursdayCoordinator",
        ...yesNoColumn("thursdayCoordinator"),
        width: 220,
      },

      {
        headerName: "Utsav Coordinator",
        field: "utsavCoordinator",
        ...yesNoColumn("utsavCoordinator"),
        width: 190,
      },

      // QR column (last): opens QRDetailsModal with the volunteer's
      // actual QR code + name/contact/seva.
      {
        headerName: "QR",
        colId: "qr",
        pinned: "right",
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        resizable: false,
        sortable: false,
        filter: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        cellRenderer: QRCellRenderer,
      },
    ],
    [],
  );

  // Rows missing any required field (Kendra, Seva, Shift, Volunteer
  // Name, Mobile No.) get a red border / mild red background so
  // incomplete data is easy to spot at a glance.
  const rowClassRules = useMemo(
    () => ({
      "allocation-row-incomplete": (params) => {
        const data = params.data;
        if (!data) return false;
        return REQUIRED_FIELDS.some((field) => !data[field]);
      },
    }),
    [],
  );

  // -----------------------------------------
  // Import from Excel / CSV (bulk import - unaffected by the removal
  // of in-grid cell editing, since it's a bulk file operation, not a
  // manual per-cell edit)
  // -----------------------------------------

  const headerMap = useMemo(
    () =>
      columnDefs
        .filter((c) => c.field)
        .map((c) => ({ headerName: c.headerName, field: c.field })),
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

      // No pagination - the grid always shows every row there is (see
      // domLayout="autoHeight" below): 40 rows added -> a 40-row
      // table, 5000 rows added -> a 5000-row table, instead of a
      // small fixed-size scroll window.
      pagination: false,

      rowHeight: 42,

      headerHeight: 45,

      suppressDragLeaveHidesColumns: true,

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
        onAddRow={openAddForm}
        onSave={saveAllocation}
        onDelete={deleteSelectedRows}
        onRefresh={refreshGrid}
        onExport={exportExcel}
        onExportFile={exportAllocationFile}
        onImportFile={importFromExcel}
        onClearFilters={clearFilters}
        unsavedChanges={unsavedChanges}
        selectedRows={selectedRows.length}
        loading={loading}
      />

      {/* ========================================= */}
      {/* GRID CARD */}
      {/* ========================================= */}
      {/* No fixed height on this wrapper - domLayout="autoHeight" on
          the grid below makes the table's height match the data: a
          few rows stay compact, thousands of rows expand and the page
          itself scrolls, instead of a cramped inner scroll window. */}

      <div className="sevaAllocation-card">
        <div
          className="ag-theme-quartz sevaAllocation-grid"
          style={{ width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            gridOptions={gridOptions}
            rowClassRules={rowClassRules}
            domLayout="autoHeight"
            getRowId={getRowId}
            context={{
              onEditRow: openEditForm,
              onDeleteRow: requestDeleteRow,
              onViewQr: openQrModal,
            }}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
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
          Tip: use the ✎ icon to edit a volunteer, 🗑 to delete, and the QR
          icon to view their QR code. Rows outlined in red are missing
          required details.
        </div>
      </div>

      {/* ========================================= */}
      {/* ADD / EDIT VOLUNTEER FORM */}
      {/* ========================================= */}

      <VolunteerFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingRow}
        kendraList={kendraList}
        sevaList={sevaList}
        shiftList={shiftList}
        onSave={handleFormSave}
        onCancel={closeForm}
      />

      {/* ========================================= */}
      {/* QR DETAILS POPUP */}
      {/* ========================================= */}

      <QRDetailsModal open={qrModalOpen} row={qrRow} onClose={closeQrModal} />

      {/* ========================================= */}
      {/* DELETE CONFIRMATION (single row) - entity-aware, shared */}
      {/* ========================================= */}

      <ConfirmModal
        open={showDeleteRowModal}
        action="delete"
        entity={ENTITY}
        recordName={rowPendingDelete?.volName}
        onConfirm={confirmDeleteRow}
        onCancel={cancelDeleteRow}
      />

      {/* ========================================= */}
      {/* SAVE / UPDATE / DELETE SUCCESS - entity-aware, shared */}
      {/* ========================================= */}

      <ResultModal
        open={showSuccessModal}
        message={successMessage}
        onClose={closeSuccessModal}
      />

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
