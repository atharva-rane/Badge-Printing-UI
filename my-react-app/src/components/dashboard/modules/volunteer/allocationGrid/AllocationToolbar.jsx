import React from "react";
import "./AllocationToolbar.css";

const AllocationToolbar = ({
  searchText,
  setSearchText,
  onAddRow,
  onSave,
  onDelete,
  onExport,
  onExportFile,
  onClearFilters,
  unsavedChanges,
  selectedRows,
  loading,
}) => {
  return (
    <div className="allocationToolbar">
      {/* Row 1 */}
      <div className="allocationToolbar-search">
        <label>Search:</label>

        <input
          type="text"
          placeholder="Search Volunteer, Mobile, Badge, Seva..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Row 2 */}
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

        <button
          className="allocation-export-btn"
          onClick={onExport}
          disabled={loading}
        >
          📄 Export Excel
        </button>

        <button
          className="allocation-export-file-btn"
          onClick={onExportFile}
          disabled={loading}
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
      </div>

      {/* Row 3 */}
      <div className="allocationToolbar-status">
        <div className="allocation-status-item">
          <strong>Selected Rows:</strong> {selectedRows}
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
