import QRCode from "react-qr-code";
import AppButton from "../../../../common/AppButton";
import "./QRDetailsModal.css";

/**
 * QRDetailsModal
 * -----------------------------------------------------------------------
 * Opened from the QR column in the Seva Allocation grid. Encodes the
 * same {name, contactNumber, seva} shape already used by the Volunteer
 * QR Generator (see generateQR/GenerateQR.jsx) so the QR this shows is
 * identical in content to the one that gets printed on the badge.
 */
const QRDetailsModal = ({ open, row, onClose }) => {
  if (!open || !row) return null;

  const qrValue = JSON.stringify({
    name: row.volName || "",
    contactNumber: row.mobileNo || "",
    seva: row.sevaName || "",
  });

  return (
    <div className="app-modal-overlay">
      <div className="app-modal qr-details-modal">
        <h4>Volunteer QR Code</h4>

        <div className="qr-details-code">
          <QRCode value={qrValue} size={180} />
        </div>

        <div className="qr-details-info">
          <div>
            <strong>Name:</strong> {row.volName || "-"}
          </div>
          <div>
            <strong>Contact Number:</strong> {row.mobileNo || "-"}
          </div>
          <div>
            <strong>Seva:</strong> {row.sevaName || "-"}
          </div>
        </div>

        <div className="app-modal-buttons">
          <AppButton variant="update" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default QRDetailsModal;
