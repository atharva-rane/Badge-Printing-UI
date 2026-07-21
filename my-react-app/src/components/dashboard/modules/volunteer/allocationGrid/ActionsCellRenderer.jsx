import { FiEdit2, FiTrash2 } from "react-icons/fi";
import "./ActionsCellRenderer.css";

/**
 * ActionsCellRenderer
 * -----------------------------------------------------------------------
 * Replaces "click any cell to edit it in place" with two explicit
 * actions per row: an Edit icon (opens the Add/Edit Volunteer form,
 * pre-filled with this row's data) and a Delete icon (opens the
 * shared delete-confirmation popup).
 *
 * The actual handlers live on the parent (SevaAllocation.jsx) and are
 * passed down via the grid's `context` prop so this stays a small,
 * dumb renderer.
 */
const ActionsCellRenderer = (params) => {
  const { onEditRow, onDeleteRow } = params.context || {};

  return (
    <div className="allocation-actions-cell">
      <button
        type="button"
        className="allocation-action-btn allocation-action-edit"
        title="Edit Volunteer"
        onClick={() => onEditRow && onEditRow(params.data)}
      >
        <FiEdit2 />
      </button>

      <button
        type="button"
        className="allocation-action-btn allocation-action-delete"
        title="Delete Volunteer"
        onClick={() => onDeleteRow && onDeleteRow(params.data)}
      >
        <FiTrash2 />
      </button>
    </div>
  );
};

export default ActionsCellRenderer;
