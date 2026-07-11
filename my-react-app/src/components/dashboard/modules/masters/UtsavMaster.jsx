import { useState, useEffect } from "react";
import "../../../../styles/masters/UtsavMaster.css";

// ===============================
// API URLs
// ===============================

const ADD_API =
  "https://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/AddUtsav";

const UPDATE_API =
  "https://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/UpdateUtsav";

const DELETE_API =
  "https://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/DeleteUtsav";

const GET_API =
  "https://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/GetUtsavList";

const UtsavMaster = () => {
  // ===============================
  // States
  // ===============================

  const [utsavName, setUtsavName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [utsavList, setUtsavList] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ===============================
  // Generic API Request
  // ===============================

  const apiRequest = async (url, method = "POST", data = null) => {
    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP Error : ${response.status}`);
      }

      const text = await response.text();

      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // ===============================
  // Get Utsav List
  // ===============================

  const getUtsavList = async () => {
    try {
      const response = await fetch(GET_API);

      if (!response.ok) {
        throw new Error("Failed to fetch data.");
      }

      const data = await response.json();

      setUtsavList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching Utsav List :", error);
      setUtsavList([]);
    }
  };

  // ===============================
  // Initial Load
  // ===============================

  useEffect(() => {
    getUtsavList();
  }, []);

  // ===============================
  // Search
  // ===============================

  const filteredUtsavs = utsavList.filter((item) =>
    item.utsavName.toLowerCase().includes(searchText.toLowerCase()),
  );
  // ===============================
  // Save
  // ===============================

  const handleSave = async () => {
    if (!utsavName.trim()) {
      alert("Please enter Utsav Name.");
      return;
    }

    const duplicate = utsavList.some(
      (item) =>
        item.utsavName.trim().toLowerCase() === utsavName.trim().toLowerCase(),
    );

    if (duplicate) {
      alert("Utsav already exists.");
      return;
    }

    const payload = {
      utsavName: utsavName.trim(),
    };

    try {
      await apiRequest(ADD_API, "POST", payload);

      await getUtsavList();

      handleClear();

      setSuccessMessage("Saved successfully.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert("Error while saving Utsav.");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // ===============================
  // Enter Key
  // ===============================

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (selectedId === null) {
        handleSave();
      } else {
        handleUpdate();
      }
    }
  };

  // ===============================
  // Row Selection
  // ===============================

  const handleRowSelect = (item) => {
    setSelectedId(item.utsavID);
    setUtsavName(item.utsavName);
  };

  // ===============================
  // Update
  // ===============================

  const handleUpdate = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    if (!utsavName.trim()) {
      alert("Please enter Utsav Name.");
      return;
    }

    const duplicate = utsavList.some(
      (item) =>
        item.utsavID !== selectedId &&
        item.utsavName.trim().toLowerCase() === utsavName.trim().toLowerCase(),
    );

    if (duplicate) {
      alert("Another Utsav with this name already exists.");
      return;
    }

    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    try {
      const payload = {
        utsavID: selectedId,
        utsavName: utsavName.trim(),
      };

      await apiRequest(UPDATE_API, "PUT", payload);

      await getUtsavList();

      setShowUpdateModal(false);

      handleClear();

      setSuccessMessage("Updated successfully.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert("Error while updating Utsav.");
    }
  };

  const cancelUpdate = () => {
    setShowUpdateModal(false);
  };

  // ===============================
  // Delete
  // ===============================

  const handleDelete = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const payload = {
        utsavID: selectedId,
      };

      await apiRequest(DELETE_API, "DELETE", payload);

      await getUtsavList();

      setShowDeleteModal(false);

      handleClear();

      setSuccessMessage("Deleted successfully.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert("Error while deleting Utsav.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // ===============================
  // Clear
  // ===============================

  const handleClear = () => {
    setSelectedId(null);
    setUtsavName("");
  };
  // ===============================
  // UI
  // ===============================

  return (
    <div className="utsavMaster-master">
      {/* ===============================
          Header
      =============================== */}

      <div className="utsavMaster-header">
        <div className="utsavMaster-title">
          <h2>Utsav Master</h2>
          <p>Manage Utsav Records</p>
        </div>
      </div>

      {/* ===============================
          Form Card
      =============================== */}

      <div className="utsavMaster-card">
        {/* Utsav Name */}

        <div className="utsavMaster-form-group">
          <label className="utsavMaster-label">
            Utsav Name
            <span className="utsavMaster-required">*</span>
          </label>

          <input
            type="text"
            className="utsavMaster-input"
            placeholder="Enter Utsav Name"
            value={utsavName}
            onChange={(e) => setUtsavName(e.target.value)}
            onKeyDown={handleEnterKey}
            autoComplete="off"
          />
        </div>

        {/* Buttons */}

        <div className="utsavMaster-button-group">
          <button
            type="button"
            className="utsavMaster-save-btn"
            onClick={handleSave}
          >
            Save
          </button>

          <button
            type="button"
            className="utsavMaster-update-btn"
            onClick={handleUpdate}
          >
            Update
          </button>

          <button
            type="button"
            className="utsavMaster-delete-btn"
            onClick={handleDelete}
          >
            Delete
          </button>

          <button
            type="button"
            className="utsavMaster-clear-btn"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ===============================
    Search Card
=============================== */}

      <div className="utsavMaster-card">
        <div className="utsavMaster-search-container">
          <label className="utsavMaster-search-label">Search Utsav</label>

          <input
            type="text"
            className="utsavMaster-search-input"
            placeholder="Search by Utsav Name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* ===============================
    Table
=============================== */}

      <div className="utsavMaster-card">
        <div className="utsavMaster-table-responsive">
          <table className="utsavMaster-table">
            <thead>
              <tr>
                <th width="80">Sr.</th>
                <th>Utsav Name</th>
              </tr>
            </thead>

            <tbody>
              {filteredUtsavs.length > 0 ? (
                filteredUtsavs.map((item, index) => (
                  <tr
                    key={item.utsavID}
                    onClick={() => handleRowSelect(item)}
                    className={
                      selectedId === item.utsavID
                        ? "utsavMaster-selected-row"
                        : ""
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>{index + 1}</td>

                    <td>{item.utsavName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="utsavMaster-no-data">
                    No records found.
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
                  type="button"
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
        =============================== */}

        {showUpdateModal && (
          <div className="utsavMaster-update-overlay">
            <div className="utsavMaster-update-modal">
              <h4>Update Confirmation</h4>

              <p>Are you sure you want to update this Utsav?</p>

              <div className="utsavMaster-update-buttons">
                <button
                  type="button"
                  className="utsavMaster-update-cancel-btn"
                  onClick={cancelUpdate}
                >
                  Cancel
                </button>

                <button
                  type="button"
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
        =============================== */}

        {showDeleteModal && (
          <div className="utsavMaster-delete-overlay">
            <div className="utsavMaster-delete-modal">
              <h4>Delete Confirmation</h4>

              <p>Are you sure you want to delete this Utsav?</p>

              <div className="utsavMaster-delete-buttons">
                <button
                  type="button"
                  className="utsavMaster-delete-cancel-btn"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>

                <button
                  type="button"
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
    </div>
  );
};

export default UtsavMaster;
