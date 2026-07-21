import "../../styles/common/AppButton.css";

/**
 * AppButton
 * -----------------------------------------------------------------------
 * Single, reusable button used across every module (Masters, Volunteer
 * Activities, etc.) so we stop re-writing the same Save/Update/Delete/
 * Clear/Export button markup + CSS on every page.
 *
 * `variant` maps to the SAME colors that were already used across the
 * project (green Save, blue Update, red Delete, grey Clear, amber
 * Export) so the visual language doesn't change - only the code that
 * produces it.
 *
 * Usage:
 *   <AppButton variant="save" onClick={handleSave}>Save</AppButton>
 *   <AppButton variant="delete" onClick={handleDelete}>Delete</AppButton>
 */
const AppButton = ({
  variant = "default",
  children,
  onClick,
  type = "button",
  disabled = false,
  icon = null,
  className = "",
  title,
}) => {
  return (
    <button
      type={type}
      className={`app-btn app-btn--${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon && <span className="app-btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default AppButton;
