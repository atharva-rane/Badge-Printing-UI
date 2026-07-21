import AppButton from "./AppButton";
import "../../styles/common/Modals.css";

/**
 * ResultModal
 * -----------------------------------------------------------------------
 * One shared "Success" (or error/info) popup shown after Save / Update /
 * Delete / Upload, used everywhere instead of a page-specific success
 * popup. Entity-aware helper `buildResultMessage` (below) is what
 * produces messages like:
 *   Seva "Ganga Aarti" saved successfully.
 *   Utsav "Diwali 2026" updated successfully.
 *   Shift "Morning" deleted successfully.
 *
 * Usage:
 *   <ResultModal
 *     open={showSuccessModal}
 *     title="Success"
 *     message={successMessage}
 *     onClose={closeSuccessModal}
 *   />
 */
export const buildResultMessage = (entity, action, recordName) => {
  // action: "saved" | "updated" | "deleted" | "uploaded"
  if (recordName) {
    return `${entity} "${recordName}" ${action} successfully.`;
  }
  return `${entity} ${action} successfully.`;
};

const ResultModal = ({ open, title = "Success", message, onClose, tone = "success" }) => {
  if (!open) return null;

  return (
    <div className="app-modal-overlay">
      <div className={`app-modal app-modal--${tone}`}>
        <h4>{title}</h4>
        <p>{message}</p>

        <div className="app-modal-buttons">
          <AppButton variant={tone === "error" ? "delete" : "update"} onClick={onClose}>
            OK
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
