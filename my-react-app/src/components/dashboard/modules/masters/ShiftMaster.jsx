import { useState, useMemo } from "react";
import "../../../../styles/masters/ShiftMaster.css";

const ShiftMaster = () => {
  // ==========================================
  // STATES
  // ==========================================

  const [shiftName, setShiftName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Popups

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // SAMPLE DATA
  // ==========================================

  const [shiftList, setShiftList] = useState([
    {
      id: 1,
      shiftCode: "SS001",
      shiftName: "I",
      timeStamp: "08-03-2026 17:21",
    },
    {
      id: 2,
      shiftCode: "SS002",
      shiftName: "II",
      timeStamp: "08-03-2026 17:21",
    },
    {
      id: 3,
      shiftCode: "SS003",
      shiftName: "G",
      timeStamp: "08-03-2026 17:21",
    },
    {
      id: 4,
      shiftCode: "SS004",
      shiftName: "P",
      timeStamp: "08-03-2026 17:21",
    },
  ]);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredShifts = useMemo(() => {
    return shiftList.filter((item) =>
      item.shiftName.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [shiftList, searchText]);

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = () => {
    if (!shiftName.trim()) {
      alert("Please enter Shift Name.");
      return;
    }

    const duplicate = shiftList.some(
      (item) =>
        item.shiftName.trim().toLowerCase() === shiftName.trim().toLowerCase(),
    );

    if (duplicate) {
      alert("Shift already exists.");
      return;
    }

    const newShift = {
      id: Date.now(),

      shiftCode: "SS" + String(shiftList.length + 1).padStart(3, "0"),

      shiftName: shiftName.trim(),

      timeStamp: new Date().toLocaleString("en-GB"),
    };

    setShiftList((prev) => [...prev, newShift]);

    setSuccessMessage("Saved successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  // ==========================================
  // SUCCESS POPUP
  // ==========================================

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

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

  // ==========================================
  // ROW SELECT
  // ==========================================

  const handleRowSelect = (item) => {
    setSelectedId(item.id);
    setShiftName(item.shiftName);
  };

  // ==========================================
  // CLEAR
  // ==========================================

  const handleClear = () => {
    setSelectedId(null);
    setShiftName("");
  };

  // ==========================================
  // UPDATE
  // ==========================================

  const handleUpdate = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    if (!shiftName.trim()) {
      alert("Please enter Shift Name.");
      return;
    }

    const duplicate = shiftList.some(
      (item) =>
        item.id !== selectedId &&
        item.shiftName.trim().toLowerCase() === shiftName.trim().toLowerCase(),
    );

    if (duplicate) {
      alert("Another Shift with this name already exists.");
      return;
    }

    // Open confirmation popup
    setShowUpdateModal(true);
  };

  const confirmUpdate = () => {
    const updatedList = shiftList.map((item) =>
      item.id === selectedId
        ? {
            ...item,
            shiftName: shiftName.trim(),
            timeStamp: new Date().toLocaleString("en-GB"),
          }
        : item,
    );

    setShiftList(updatedList);

    setShowUpdateModal(false);

    setSuccessMessage("Updated successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  const cancelUpdate = () => {
    setShowUpdateModal(false);
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = () => {
    if (selectedId === null) {
      alert("Please select a record.");
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShiftList((prev) => prev.filter((item) => item.id !== selectedId));

    setShowDeleteModal(false);

    setSuccessMessage("Deleted successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="shiftMaster-master">
      {/* ===============================
            Header
      =============================== */}
      <div className="shiftMaster-header">
        <div className="shiftMaster-title">
          <h2>Shift Master</h2>
          <p>Manage Shift Records</p>
        </div>
      </div>

      {/* ===============================
      Form Card
================================ */}

      <div className="shiftMaster-card">
        {/* Shift Name */}

        <div className="shiftMaster-form-group">
          <label className="shiftMaster-label">
            Shift Name
            <span className="shiftMaster-required">*</span>
          </label>

          <input
            type="text"
            className="shiftMaster-input"
            placeholder="Enter Shift Name"
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            onKeyDown={handleEnterKey}
          />
        </div>

        {/* Buttons */}

        <div className="shiftMaster-button-group">
          <button className="shiftMaster-save-btn" onClick={handleSave}>
            Save
          </button>

          <button className="shiftMaster-update-btn" onClick={handleUpdate}>
            Update
          </button>

          <button className="shiftMaster-delete-btn" onClick={handleDelete}>
            Delete
          </button>

          <button className="shiftMaster-clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      {/* ===============================
      Search Card
================================ */}

      {/* Search */}

      <div className="shiftMaster-search-card">
        <div className="shiftMaster-search-container">
          <label className="shiftMaster-search-label">Search Shift</label>

          <input
            type="text"
            className="shiftMaster-search-input"
            placeholder="Search Shift..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* ===============================
            Table
      =============================== */}

      <div className="shiftMaster-card">
        <div className="shiftMaster-table-responsive">
          <table className="shiftMaster-table">
            <thead>
              <tr>
                <th width="80">Sr.</th>
                <th>Shift Code</th>
                <th>Shift Name</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {filteredShifts.length > 0 ? (
                filteredShifts.map((item, index) => (
                  <tr
                    key={item.id}
                    className={
                      selectedId === item.id ? "shiftMaster-selected-row" : ""
                    }
                    onClick={() => handleRowSelect(item)}
                  >
                    <td>{index + 1}</td>
                    <td>{item.shiftCode}</td>
                    <td>{item.shiftName}</td>
                    <td>{item.timeStamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="shiftMaster-no-data">
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

              <p>Are you sure you want to update this Shift?</p>

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
        =============================== */}

        {showDeleteModal && (
          <div className="utsavMaster-delete-overlay">
            <div className="utsavMaster-delete-modal">
              <h4>Delete Confirmation</h4>

              <p>Are you sure you want to delete this Shift?</p>

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
    </div>
  );
};

export default ShiftMaster;
