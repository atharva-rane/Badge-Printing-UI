import { useState, useMemo, useEffect, useRef } from "react";
import "../../../../styles/masters/SevaMaster.css";
import { FaTrashAlt } from "react-icons/fa";
import Loader from "../../../Loader";

const SevaMaster = () => {
  // =====================
  // States
  // =====================
  const [mode, setMode] = useState("single");

  const [utsav, setUtsav] = useState("");
  const [sevaName, setSevaName] = useState("");
  const [requirement, setRequirement] = useState("0");
  const fileInputRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);

  const [searchSevaQuery, setSearchSevaQuery] = useState("");

  const [file, setFile] = useState(null);

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
    setSelectedId(item.id);
    setSevaName(item.sevaName);
    setRequirement(item.requirement);
    setUtsav(item.utsavName);
  };

  // =====================
  // Add
  // =====================
  // =====================
  // Add
  // =====================

  const handleSave = async () => {
    if (!utsav || !sevaName.trim() || !requirement) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoaderText("Saving Seva...");
      setLoading(true);

      const payload = {
        utsavName: utsav,

        sevaName: sevaName.trim(),

        requirement: Number(requirement),
      };

      const response = await fetch("----- Paste Your Link Here -----", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save Seva.");
      }

      setSuccessMessage("Saved successfully.");

      setShowSuccessModal(true);

      fetchSevaList();

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

    if (!utsav || !sevaName.trim() || !requirement) {
      alert("Please fill all required fields.");
      return;
    }

    const duplicate = sevaList.some(
      (item) =>
        item.id !== selectedId &&
        item.sevaName.toLowerCase() === sevaName.trim().toLowerCase() &&
        item.utsavName === utsav,
    );

    if (duplicate) {
      alert("Another Seva with the same name already exists.");
      return;
    }

    // Show Update Confirmation Popup
    setShowUpdateModal(true);
  };

  const confirmUpdate = () => {
    try {
      setLoaderText("Updating Seva...");
      setLoading(true);

      setTimeout(() => {
        const updatedList = sevaList.map((item) =>
          item.id === selectedId
            ? {
                ...item,

                sevaName: sevaName.trim(),

                requirement: Number(requirement),

                utsavName: utsav,
              }
            : item,
        );

        setSevaList(updatedList);

        setShowUpdateModal(false);

        setLoading(false);

        setSuccessMessage("Updated successfully.");

        setShowSuccessModal(true);

        handleClear();
      }, 800);
    } catch (error) {
      console.error(error);

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

  const confirmDelete = () => {
    try {
      setLoaderText("Deleting Seva...");
      setLoading(true);

      setTimeout(() => {
        setSevaList((prev) => prev.filter((item) => item.id !== selectedId));

        setShowDeleteModal(false);

        setLoading(false);

        setSuccessMessage("Deleted successfully.");

        setShowSuccessModal(true);

        handleClear();
      }, 800);
    } catch (error) {
      console.error(error);

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
    setRequirement("");
    setUtsav("");
  };

  // =====================
  // SEARCH
  // =====================
  const filteredSevaList = useMemo(() => {
    return sevaList.filter((item) =>
      item.sevaName.toLowerCase().includes(searchSevaQuery.toLowerCase()),
    );
  }, [sevaList, searchSevaQuery]);

  // =====================
  // BULK UPLOAD
  // =====================
  const handleUpload = () => {
    if (!file) return alert("Select file first");
    alert("Bulk upload success (backend pending)");
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
        "http://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/GetUtsavList",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Utsav list");
      }

      const data = await response.json();

      console.log("Utsav List:", data);

      setUtsavList(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchSevaList = async () => {
    try {
      const response = await fetch("----- Paste Your Link Here -----");

      if (!response.ok) {
        throw new Error("Failed to fetch Seva List");
      }

      const data = await response.json();

      console.log("Seva List:", data);

      setSevaList(data);
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

              {utsavList.map((item) => (
                <option key={item.utsavID} value={item.utsavName}>
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

          <div className="form-row">
            <label>
              Requirement <span>*</span>
            </label>

            <input
              type="number"
              placeholder="Enter Requirement"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="btn-row">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={handleExport}>Export</button>
            <button onClick={handleClear}>Clear</button>
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

              {utsavList.map((item) => (
                <option key={item.utsavID} value={item.utsavName}>
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
                onChange={(e) => setFile(e.target.files[0])}
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
                    fileInputRef.current.value = "";
                  }}
                  title="Remove File"
                >
                  <FaTrashAlt />
                </button>
              )}
            </div>
          </div>

          <div className="btn-row">
            <button onClick={handleUpload}>Upload</button>
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="SevaMasterSearch-box">
        <label>Search Seva Name</label>

        <input
          id="sevaMasterSearchInput"
          name="sevaMasterSearchInput"
          placeholder="Search Seva Name..."
          value={searchSevaQuery}
          onChange={(e) => setSearchSevaQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Seva Code</th>
              <th>Seva Name</th>
              <th>Requirement</th>
              <th>Utsav</th>
            </tr>
          </thead>

          <tbody>
            {filteredSevaList.length > 0 ? (
              filteredSevaList.map((item) => (
                <tr
                  key={item.id}
                  className={selectedId === item.id ? "active-row" : ""}
                  onClick={() => handleRowSelect(item)}
                >
                  <td>{item.id}</td>
                  <td>{item.sevaCode}</td>
                  <td>{item.sevaName}</td>
                  <td>{item.requirement}</td>
                  <td>{item.utsavName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* ===============================
            Success Popup
        =============================== */}
      {showSuccessModal && (
        <div className="utsavMaster-success-overlay">
          <div className="utsavMaster-success-modal">
            <h4>Success</h4>

            <p>{successMessage}</p>

            <div className="utsavMaster-success-buttons">
              <button
                className="utsavMaster-success-btn"
                onClick={closeSuccessModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
      Update Confirmation Popup
================================ */}
      {showUpdateModal && (
        <div className="utsavMaster-update-overlay">
          <div className="utsavMaster-update-modal">
            <h4>Update Confirmation</h4>

            <p>Are you sure you want to update this Seva?</p>

            <div className="utsavMaster-update-buttons">
              <button
                className="utsavMaster-update-cancel-btn"
                onClick={cancelUpdate}
              >
                Cancel
              </button>

              <button
                className="utsavMaster-update-confirm-btn"
                onClick={confirmUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
      Delete Confirmation Popup
================================ */}
      {showDeleteModal && (
        <div className="utsavMaster-delete-overlay">
          <div className="utsavMaster-delete-modal">
            <h4>Delete Confirmation</h4>

            <p>Are you sure you want to delete this Seva?</p>

            <div className="utsavMaster-delete-buttons">
              <button
                className="utsavMaster-delete-cancel-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                className="utsavMaster-delete-confirm-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SevaMaster;
