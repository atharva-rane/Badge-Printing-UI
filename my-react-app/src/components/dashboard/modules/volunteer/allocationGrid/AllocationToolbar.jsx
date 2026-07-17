import React, { useRef } from "react";
import "./AllocationToolbar.css";

const AllocationToolbar = ({
  searchText,
  setSearchText,
  onAddRow,
  onSave,
  onDelete,
  onRefresh,
  onExport,
  onExportFile,
  onImportFile,
  onClearFilters,
  autoSizeColumns,
  onUndo,
  onRedo,
  onFillDown,
  unsavedChanges,
  selectedRows,
  loading,
}) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (file) onImportFile?.(file);
    // reset so choosing the same file twice in a row still fires onChange
    e.target.value = "";
  };

  return (
    <div className="allocationToolbar">
      {/* Search */}
      <div className="allocationToolbar-search">
        <label>Search</label>

        <input
          type="text"
          placeholder="Search Volunteer, Mobile, Badge, Seva..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Buttons */}

      <div className="allocationToolbar-buttons">
        <button
          className="allocation-add-btn"
          onClick={onAddRow}
          disabled={loading}
        >
          ➕ Add Row
        </button>

        <button
          className="allocation-save-btn"
          onClick={onSave}
          disabled={loading || !unsavedChanges}
        >
          💾 Save Allocation
        </button>

        <button
          className="allocation-delete-btn"
          onClick={onDelete}
          disabled={loading || selectedRows === 0}
        >
          🗑 Delete Selected ({selectedRows})
        </button>

        <span className="allocationToolbar-divider" />

        <button
          className="allocation-undo-btn"
          onClick={onUndo}
          disabled={loading}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>

        <button
          className="allocation-redo-btn"
          onClick={onRedo}
          disabled={loading}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>

        <button
          className="allocation-fill-btn"
          onClick={onFillDown}
          disabled={loading}
          title="Fill the top cell of your selection down through the rest of it (Ctrl+D)"
        >
          ⬇ Fill Down
        </button>

        <span className="allocationToolbar-divider" />

        <button
          className="allocation-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          🔄 Refresh
        </button>

        <button
          className="allocation-import-btn"
          onClick={handleImportClick}
          disabled={loading}
          title="Import volunteers from an Excel/CSV file"
        >
          ⬆ Import Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="allocation-import-input"
          onChange={handleFileChosen}
        />

        <button
          className="allocation-export-btn"
          onClick={onExport}
          disabled={loading}
          title="Download what's currently visible in the grid as .xlsx"
        >
          📄 Export Excel
        </button>

        <button
          className="allocation-export-file-btn"
          onClick={onExportFile}
          disabled={loading}
          title="Ask the server to generate the full export file"
        >
          ⬇ Export File
        </button>

        <button
          className="allocation-clear-btn"
          onClick={onClearFilters}
          disabled={loading}
        >
          ❌ Clear Filters
        </button>

        <button
          className="allocation-autosize-btn"
          onClick={autoSizeColumns}
          disabled={loading}
        >
          ↔ Auto Size
        </button>
      </div>

      {/* Status */}

      <div className="allocationToolbar-status">
        <div className="allocation-status-item">
          <strong>Selected Rows :</strong> {selectedRows}
        </div>

        <div className="allocation-status-item">
          {unsavedChanges ? (
            <span className="allocation-unsaved">● Unsaved Changes</span>
          ) : (
            <span className="allocation-saved">✔ Saved</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocationToolbar;
