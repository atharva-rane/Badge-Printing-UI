import React, { useState } from "react";
import QRCode from "react-qr-code";
import "../../../../../styles/volunteer/GenerateQR.css";

const GenerateQR = () => {
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    seva: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const qrValue = JSON.stringify(formData);

  return (
    <div className="generate-qr-container">
      <h2>Volunteer QR Generator</h2>

      <div className="qr-form">
        <input
          type="text"
          name="name"
          placeholder="Enter Volunteer Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="contactNumber"
          placeholder="Enter Contact Number"
          value={formData.contactNumber}
          onChange={handleChange}
        />

        <input
          type="text"
          name="seva"
          placeholder="Enter Seva"
          value={formData.seva}
          onChange={handleChange}
        />
      </div>

      {(formData.name || formData.contactNumber || formData.seva) && (
        <>
          <div className="qr-box">
            <QRCode
              value={qrValue}
              size={256}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
              style={{
                width: "2cm",
                height: "2cm",
              }}
            />
          </div>

          <div className="json-preview">
            <h3>QR JSON</h3>

            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default GenerateQR;
