import { useState, useMemo } from "react";
import "../../../../styles/masters/ShiftMaster.css";
import AppButton from "../../../common/AppButton";
import SearchBar from "../../../common/SearchBar";
import ConfirmModal from "../../../common/ConfirmModal";
import ResultModal, { buildResultMessage } from "../../../common/ResultModal";

const ENTITY = "Shift";

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

    setSuccessMessage(buildResultMessage(ENTITY, "saved", newShift.shiftName));

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
    const updatedName = shiftName.trim();

    const updatedList = shiftList.map((item) =>
      item.id === selectedId
        ? {
            ...item,
            shiftName: updatedName,
            timeStamp: new Date().toLocaleString("en-GB"),
          }
        : item,
    );

    setShiftList(updatedList);

    setShowUpdateModal(false);

    setSuccessMessage(buildResultMessage(ENTITY, "updated", updatedName));

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
    const deletedName = shiftName;

    setShiftList((prev) => prev.filter((item) => item.id !== selectedId));

    setShowDeleteModal(false);

    setSuccessMessage(buildResultMessage(ENTITY, "deleted", deletedName));

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

        {/* Buttons - shared AppButton component */}

        <div className="shiftMaster-button-group">
          <AppButton variant="save" onClick={handleSave}>
            Save
          </AppButton>
          <AppButton variant="update" onClick={handleUpdate}>
            Update
          </AppButton>
          <AppButton variant="delete" onClick={handleDelete}>
            Delete
          </AppButton>
          <AppButton variant="clear" onClick={handleClear}>
            Clear
          </AppButton>
        </div>
      </div>

      {/* ===============================
      Search Card
================================ */}

      <div className="shiftMaster-search-card">
        <SearchBar
          label="Search Shift"
          placeholder="Search Shift..."
          value={searchText}
          onChange={setSearchText}
        />
      </div>

      {/* ===============================
            Table
      =============================== */}

      <div className="shiftMaster-card">
        <div className="shiftMaster-table-responsive app-table-container">
          <table className="shiftMaster-table app-table">
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
          recordName={shiftName}
          onConfirm={confirmUpdate}
          onCancel={cancelUpdate}
        />

        {/* Delete Confirmation - entity-aware, shared component */}
        <ConfirmModal
          open={showDeleteModal}
          action="delete"
          entity={ENTITY}
          recordName={shiftName}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
};

export default ShiftMaster;
