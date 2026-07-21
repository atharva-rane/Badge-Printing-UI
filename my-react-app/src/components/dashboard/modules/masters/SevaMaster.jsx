import { useState, useMemo, useEffect, useRef } from "react";
import "../../../../styles/masters/SevaMaster.css";
import { FaTrashAlt } from "react-icons/fa";
import Loader from "../../../Loader";
import AppButton from "../../../common/AppButton";
import SearchBar from "../../../common/SearchBar";
import ConfirmModal from "../../../common/ConfirmModal";
import ResultModal, { buildResultMessage } from "../../../common/ResultModal";
import BulkPreviewTable from "../../../common/BulkPreviewTable";
import { importExcelFile } from "../../../../utils/importExcel";

const ENTITY = "Seva";

// Bulk-upload preview columns - dynamically renders as many rows as the
// file contains (see BulkPreviewTable).
const BULK_PREVIEW_COLUMNS = [{ key: "sevaName", label: "Seva Name" }];
const BULK_HEADER_MAP = [{ headerName: "Seva Name", field: "sevaName" }];

const SevaMaster = () => {
  // =====================
  // States
  // =====================
  const [mode, setMode] = useState("single");

  const [utsav, setUtsav] = useState("");
  const [sevaName, setSevaName] = useState("");
  const fileInputRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);

  const [searchSevaQuery, setSearchSevaQuery] = useState("");

  const [file, setFile] = useState(null);
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [utsavList, setUtsavList] = useState([]);

  const [sevaList, setSevaList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loaderText, setLoaderText] = useState("");

  // =====================
  // Select Row
  // =====================
  const handleRowSelect = (item) => {
    setSelectedId(item.sevaID);
    setSevaName(item.sevaName || "");
    setUtsav(item.utsavName || "");
  };
  // =====================
  // Add
  // =====================

  const handleSave = async () => {
    if (!utsav || !sevaName.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoaderText(`Saving ${ENTITY}...`);
      setLoading(true);

      const payload = {
        utsavName: utsav,
        sevaName: sevaName.trim(),
      };

      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/AddSeva",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save Seva.");
      }

      setSuccessMessage(buildResultMessage(ENTITY, "saved", payload.sevaName));

      setShowSuccessModal(true);

      await fetchSevaList();

      handleClear();
    } catch (error) {
      console.error(error);

      alert("Unable to save record.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // =====================
  // UPDATE
  // =====================

  const handleUpdate = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    if (!utsav || !sevaName.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    const duplicate = sevaList.some(
      (item) =>
        item.sevaID !== selectedId &&
        item.sevaName.toLowerCase() === sevaName.trim().toLowerCase() &&
        (item.utsavName || "") === utsav,
    );

    if (duplicate) {
      alert("Another Seva with the same name already exists.");
      return;
    }

    // Show Update Confirmation Popup
    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    try {
      setLoaderText(`Updating ${ENTITY}...`);
      setLoading(true);

      const payload = {
        sevaID: selectedId,
        utsavName: utsav,
        sevaName: sevaName.trim(),
      };

      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/UpdateSeva",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update Seva.");
      }

      fetchSevaList();

      setShowUpdateModal(false);
      setSuccessMessage(buildResultMessage(ENTITY, "updated", payload.sevaName));
      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error(error);
      alert("Unable to update record.");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpdate = () => {
    setShowUpdateModal(false);
  };

  // =====================
  // DELETE
  // =====================

  const handleDelete = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoaderText(`Deleting ${ENTITY}...`);
      setLoading(true);

      const payload = {
        sevaID: selectedId,
      };

      const deletedName = sevaName;

      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/DeleteSeva",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete Seva.");
      }

      fetchSevaList();

      setShowDeleteModal(false);
      setSuccessMessage(buildResultMessage(ENTITY, "deleted", deletedName));
      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error(error);
      alert("Unable to delete record.");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // =====================
  // CLEAR
  // =====================
  const handleClear = () => {
    setSelectedId(null);
    setSevaName("");
    setUtsav("");
  };

  // =====================
  // SEARCH
  // =====================
  const filteredSevaList = useMemo(() => {
    return sevaList.filter((item) =>
      item.sevaName?.toLowerCase().includes(searchSevaQuery.toLowerCase()),
    );
  }, [sevaList, searchSevaQuery]);

  // =====================
  // BULK UPLOAD - file selection builds a live preview that grows
  // dynamically to match however many Seva names are in the file.
  // =====================
  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);

    if (!selectedFile) {
      setBulkPreviewRows([]);
      return;
    }

    try {
      const parsed = await importExcelFile(selectedFile, BULK_HEADER_MAP);
      setBulkPreviewRows(parsed);
    } catch (error) {
      console.error("Preview parse error:", error);
      setBulkPreviewRows([]);
    }
  };

  const handleUpload = async () => {
    if (!utsav) {
      alert("Please select Utsav.");
      return;
    }

    if (!file) {
      alert("Please select Excel file.");
      return;
    }

    try {
      setLoaderText("Uploading Excel File...");
      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("utsavName", utsav);

      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/UploadFile",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Failed to upload file.");
      }

      setSuccessMessage(
        `${bulkPreviewRows.length || ""} ${ENTITY}${
          bulkPreviewRows.length === 1 ? "" : "s"
        } uploaded successfully.`.replace(/\s+/g, " ").trim(),
      );

      setShowSuccessModal(true);

      setFile(null);
      setBulkPreviewRows([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setUtsav("");

      fetchSevaList();
    } catch (error) {
      console.error("Upload Error:", error);

      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // EXPORT
  // =====================
  const handleExport = () => {
    alert("Export feature coming soon");
  };

  // =====================
  // LOAD UTSAV LIST
  // =====================

  useEffect(() => {
    fetchUtsavList();
    fetchSevaList();
  }, []);

  const fetchUtsavList = async () => {
    try {
      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/GetUtsavList",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Utsav list");
      }

      const data = await response.json();

      setUtsavList(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchSevaList = async () => {
    try {
      const response = await fetch(
        "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/GetSevaList",
      );

      const text = await response.text();

      const data = text ? JSON.parse(text) : [];

      setSevaList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (mode === "single") {
        handleSave();
      }
    }
  };

  return (
    <div className="seva-master">
      {/* Loader */}
      <Loader loading={loading} progress={progress} text={loaderText} />

      <h2 className="seva-title">Seva Master</h2>

      {/* Mode Switch */}

      <div className="mode-switch">
        <label>
          <input
            type="radio"
            checked={mode === "single"}
            onChange={() => setMode("single")}
          />
          Single Entry
        </label>

        <label>
          <input
            type="radio"
            checked={mode === "bulk"}
            onChange={() => setMode("bulk")}
          />
          Bulk Upload
        </label>
      </div>

      {/* SINGLE ENTRY */}
      {mode === "single" && (
        <div className="card">
          <div className="form-row">
            <label>
              Select Utsav <span>*</span>
            </label>

            <select
              value={utsav}
              onChange={(e) => setUtsav(e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="">Select Utsav</option>

              {utsavList.map((item, index) => (
                <option
                  key={item.utsavID || item.id || index}
                  value={item.utsavName}
                >
                  {item.utsavName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>
              Seva Name <span>*</span>
            </label>

            <input
              type="text"
              placeholder="Enter Seva Name"
              value={sevaName}
              onChange={(e) => setSevaName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="btn-row">
            <AppButton variant="save" onClick={handleSave}>
              Save
            </AppButton>
            <AppButton variant="update" onClick={handleUpdate}>
              Update
            </AppButton>
            <AppButton variant="delete" onClick={handleDelete}>
              Delete
            </AppButton>
            <AppButton variant="export" onClick={handleExport}>
              Export
            </AppButton>
            <AppButton variant="clear" onClick={handleClear}>
              Clear
            </AppButton>
          </div>
        </div>
      )}

      {/* BULK UPLOAD */}
      {mode === "bulk" && (
        <div className="card">
          <div className="form-row">
            <label>
              Select Utsav <span>*</span>
            </label>

            <select
              value={utsav}
              onChange={(e) => setUtsav(e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="">Select Utsav</option>

              {utsavList.map((item, index) => (
                <option
                  key={item.utsavID || item.id || index}
                  value={item.utsavName}
                >
                  {item.utsavName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row file-upload-row">
            <label>
              Upload Excel File <span>*</span>
            </label>

            <div className="file-upload-container">
              <input
                ref={fileInputRef}
                type="file"
                id="excelFile"
                className="hidden-file-input"
                onChange={(e) => handleFileSelected(e.target.files[0])}
                onKeyDown={handleKeyDown}
              />

              <div
                className="custom-file-box"
                onClick={() => fileInputRef.current.click()}
              >
                <button type="button" className="choose-file-btn">
                  Choose File
                </button>

                <span className="file-name">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>

              {file && (
                <button
                  type="button"
                  className="file-delete-btn"
                  onClick={() => {
                    setFile(null);
                    setBulkPreviewRows([]);
                    fileInputRef.current.value = "";
                  }}
                  title="Remove File"
                >
                  <FaTrashAlt />
                </button>
              )}
            </div>
          </div>

          {/* Preview table dynamically grows to match however many
              Seva names were found in the uploaded file. */}
          <BulkPreviewTable
            columns={BULK_PREVIEW_COLUMNS}
            rows={bulkPreviewRows}
            emptyText="Choose an Excel file to preview the Seva names it contains."
          />

          <div className="btn-row">
            <AppButton variant="upload" onClick={handleUpload}>
              Upload
            </AppButton>
          </div>
        </div>
      )}

      {/* SEARCH */}
      <SearchBar
        label="Search Seva Name"
        placeholder="Search Seva Name..."
        value={searchSevaQuery}
        onChange={setSearchSevaQuery}
        onKeyDown={handleKeyDown}
        id="sevaMasterSearchInput"
        className="SevaMasterSearch-box"
      />

      {/* TABLE - Seva ID and Seva Code columns removed (not needed on
          the frontend); mild dark border via app-table */}
      <div className="table-container app-table-container">
        <table className="app-table">
          <thead>
            <tr>
              <th>Seva Name</th>
              <th>Utsav</th>
            </tr>
          </thead>

          <tbody>
            {filteredSevaList.length > 0 ? (
              filteredSevaList.map((item) => (
                <tr
                  key={item.sevaID}
                  className={selectedId === item.sevaID ? "active-row" : ""}
                  onClick={() => handleRowSelect(item)}
                >
                  <td>{item.sevaName}</td>
                  <td>{item.utsavName ? item.utsavName : "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Success Popup - entity-aware, shared component */}
      <ResultModal
        open={showSuccessModal}
        message={successMessage}
        onClose={closeSuccessModal}
      />

      {/* Update Confirmation - entity-aware, shared component */}
      <ConfirmModal
        open={showUpdateModal}
        action="update"
        entity={ENTITY}
        recordName={sevaName}
        onConfirm={confirmUpdate}
        onCancel={cancelUpdate}
      />

      {/* Delete Confirmation - entity-aware, shared component */}
      <ConfirmModal
        open={showDeleteModal}
        action="delete"
        entity={ENTITY}
        recordName={sevaName}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default SevaMaster;
