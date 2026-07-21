import AppButton from "./AppButton";
import "../../styles/common/Modals.css";

/**
 * ConfirmModal
 * -----------------------------------------------------------------------
 * One shared confirmation popup used everywhere we previously had a
 * page-specific "Are you sure...?" dialog (before delete, before
 * update, etc). It is entity-aware: pass the entity name ("Seva",
 * "Utsav", "Shift", "Coordinator", "Volunteer Allocation"...) and,
 * optionally, the specific record's display name, and the message is
 * built automatically - e.g. "Are you sure you want to delete the
 * Seva "Ganga Aarti"?"
 *
 * Usage:
 *   <ConfirmModal
 *     open={showDeleteModal}
 *     action="delete"
 *     entity="Seva"
 *     recordName={sevaName}
 *     onConfirm={confirmDelete}
 *     onCancel={cancelDelete}
 *   />
 */
const ConfirmModal = ({
  open,
  action = "delete", // "delete" | "update"
  entity = "record",
  recordName,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
}) => {
  if (!open) return null;

  const verb = action === "delete" ? "delete" : "update";
  const title = action === "delete" ? "Delete Confirmation" : "Update Confirmation";

  const defaultMessage = recordName
    ? `Are you sure you want to ${verb} the ${entity} "${recordName}"?`
    : `Are you sure you want to ${verb} this ${entity}?`;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal">
        <h4>{title}</h4>
        <p>{message || defaultMessage}</p>

        <div className="app-modal-buttons">
          <AppButton variant="cancel" onClick={onCancel}>
            Cancel
          </AppButton>

          <AppButton
            variant={action === "delete" ? "delete" : "update"}
            onClick={onConfirm}
          >
            {confirmLabel || (action === "delete" ? "Delete" : "Update")}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
