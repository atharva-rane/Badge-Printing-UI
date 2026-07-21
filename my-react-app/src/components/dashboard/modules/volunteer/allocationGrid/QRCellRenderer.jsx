import { MdQrCode2 } from "react-icons/md";
import "./QRCellRenderer.css";

/**
 * QRCellRenderer
 * -----------------------------------------------------------------------
 * Last column of the Seva Allocation grid. Shows a QR icon; clicking it
 * opens a popup with the volunteer's actual QR code (same one produced
 * by the Volunteer QR Generator) plus their name, contact number and
 * seva name.
 */
const QRCellRenderer = (params) => {
  const { onViewQr } = params.context || {};

  return (
    <div className="allocation-qr-cell">
      <button
        type="button"
        className="allocation-qr-btn"
        title="View QR Code"
        onClick={() => onViewQr && onViewQr(params.data)}
      >
        <MdQrCode2 />
      </button>
    </div>
  );
};

export default QRCellRenderer;
