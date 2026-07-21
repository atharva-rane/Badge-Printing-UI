import "../../styles/common/BulkPreviewTable.css";

/**
 * BulkPreviewTable
 * -----------------------------------------------------------------------
 * Shared "preview what's in the Excel/CSV file before you upload it"
 * table, used by every Masters bulk-upload section (Seva Master, Seva
 * Coordinator Master, ...). It simply renders exactly as many rows as
 * were parsed from the file - 3 names in, 3 rows shown; 300 names in,
 * 300 rows shown - so the table always dynamically matches the file's
 * row count instead of being a fixed-size box.
 *
 * `columns` = [{ key: 'name', label: 'Seva Name' }, ...]
 * `rows`    = parsed row objects, keyed the same way as `columns[].key`
 */
const BulkPreviewTable = ({ columns, rows, emptyText = "No file selected yet." }) => {
  if (!rows || rows.length === 0) {
    return <p className="bulk-preview-empty">{emptyText}</p>;
  }

  return (
    <div className="bulk-preview-wrap app-table-container">
      <div className="bulk-preview-count">
        {rows.length} record{rows.length !== 1 ? "s" : ""} found in file
      </div>
      <table className="app-table bulk-preview-table">
        <thead>
          <tr>
            <th style={{ width: 56 }}>Sr.</th>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key] ?? "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BulkPreviewTable;
