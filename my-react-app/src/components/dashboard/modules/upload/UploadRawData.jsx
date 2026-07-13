import React, { useRef, useState } from "react";
import "../../../../styles/masters/UploadRawData.css";
import { FaTrashAlt } from "react-icons/fa";

const UploadRawData = () => {
  const [utsav, setUtsav] = useState("");
  const [fileType, setFileType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!utsav || !fileType || !selectedFile) {
      alert("Please fill all fields.");
      return;
    }

    console.log({
      utsav,
      fileType,
      selectedFile,
    });

    // API Call Here
  };

  const handleClear = () => {
    setUtsav("");
    setFileType("");
    handleRemoveFile();
  };

  return (
    <div className="uploadrawfiles-page">
      <h2 className="uploadrawfiles-title">Upload Raw Files</h2>

      <div className="uploadrawfiles-card">
        <div className="uploadrawfiles-form-grid">
          {/* Utsav */}
          <div className="uploadrawfiles-form-group">
            <label>Select Utsav Name</label>

            <select value={utsav} onChange={(e) => setUtsav(e.target.value)}>
              <option value="">Select Utsav</option>
              <option value="Ramnavmi">Ramnavmi</option>
              <option value="Datta Jayanti">Datta Jayanti</option>
              <option value="Guru Pournima">Guru Pournima</option>
            </select>
          </div>

          {/* File Type */}
          <div className="uploadrawfiles-form-group">
            <label>Select File Type</label>

            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="">Select File Type</option>
              <option value="Center Volunteers">Center Volunteers File</option>
              <option value="One Day Volunteers">
                One Day Volunteers File
              </option>
              <option value="SHGG Volunteers">SHGG Volunteers File</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="uploadrawfiles-file-upload-row">
            <label>Select File</label>

            <div className="uploadrawfiles-file-upload-container">
              <div
                className="uploadrawfiles-custom-file-box"
                onClick={handleChooseFile}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="uploadrawfiles-hidden-file-input"
                  onChange={handleFileChange}
                />

                <div className="uploadrawfiles-choose-file-btn">
                  Choose File
                </div>

                <span className="uploadrawfiles-file-name">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </span>
              </div>

              {selectedFile && (
                <button
                  className="uploadrawfiles-file-delete-btn"
                  onClick={handleRemoveFile}
                >
                  <FaTrashAlt />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="uploadrawfiles-btn-row">
          <button type="button" onClick={handleUpload}>
            Upload
          </button>

          <button type="button" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadRawData;
