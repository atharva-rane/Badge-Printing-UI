import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const VolunteerAttendance = () => {
  const [volunteer, setVolunteer] = useState(null);
  const [scannerStarted, setScannerStarted] = useState(false);

  const scannerRef = useRef(null);

  const processScannedData = async (decodedText) => {
    try {
      const volunteerData = JSON.parse(decodedText);

      setVolunteer(volunteerData);

      new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      ).play();

      await stopScanner();
    } catch (err) {
      alert("Invalid Volunteer QR");
    }
  };

  const startScanner = async () => {
    if (scannerStarted) return;

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        alert("No camera found");
        return;
      }

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        processScannedData,
        () => {},
      );

      setScannerStarted(true);
    } catch (err) {
      console.error(err);
      alert("Unable to start camera");
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (err) {
      console.error(err);
    }

    scannerRef.current = null;
    setScannerStarted(false);
  };

  const handleImageScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopScanner();

      const qr = new Html5Qrcode("reader");
      const decoded = await qr.scanFile(file, true);
      await qr.clear();

      processScannedData(decoded);
    } catch (err) {
      alert("Could not detect a QR Code in this image.");
    }

    e.target.value = "";
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="attendance-wrapper">
      <div className="attendance-card">
        <h2>Volunteer Attendance</h2>

        <div className="btn-group">
          {!scannerStarted ? (
            <button onClick={startScanner}>📷 Open Camera Scanner</button>
          ) : (
            <button onClick={stopScanner}>❌ Close Scanner</button>
          )}
        </div>

        <div className="btn-group">
          <input
            id="uploadQR"
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageScan}
          />

          <label htmlFor="uploadQR" className="upload-btn">
            🖼 Scan QR From Image
          </label>
        </div>

        <div className="scanner-wrapper">
          <div id="reader" className="scanner-box" />
        </div>

        {volunteer && (
          <div className="result-card">
            <h3>Volunteer Details</h3>
            <p>
              <b>Name:</b> {volunteer.VOLUNTEERNAME}
            </p>
            <p>
              <b>Mobile:</b> {volunteer.MOBNO}
            </p>
            <p>
              <b>Seva:</b> {volunteer.SEVA}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerAttendance;
