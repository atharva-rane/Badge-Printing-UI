import { useState, useEffect } from "react";
import Loader from "../../../Loader";
import AppButton from "../../../common/AppButton";
import SearchBar from "../../../common/SearchBar";
import ConfirmModal from "../../../common/ConfirmModal";
import ResultModal, { buildResultMessage } from "../../../common/ResultModal";
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

const ENTITY = "Utsav";

// ===============================
// COMPONENT
// ===============================

const UtsavMaster = () => {
  // ===============================
  // STATES
  // ===============================

  const [utsavName, setUtsavName] = useState("");

  const [searchText, setSearchText] = useState("");

  const [selectedId, setSelectedId] = useState(null);

  const [utsavList, setUtsavList] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loaderText, setLoaderText] = useState("");

  // ===============================
  // MODAL STATES
  // ===============================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ===============================
  // GENERIC API REQUEST
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
      console.error("API Error:", error);

      throw error;
    }
  };
  // ===============================
  // GET UTSAV LIST
  // ===============================

  const getUtsavList = async () => {
    try {
      setLoading(true);

      const response = await fetch(GET_API);

      if (!response.ok) {
        throw new Error("Failed to fetch data.");
      }

      const data = await response.json();

      setUtsavList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching Utsav List :", error);

      setUtsavList([]);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // INITIAL LOAD
  // ===============================

  useEffect(() => {
    getUtsavList();
  }, []);

  // ===============================
  // SEARCH
  // ===============================

  const filteredUtsavs = utsavList.filter((item) =>
    item.utsavName.toLowerCase().includes(searchText.toLowerCase()),
  );

  // ===============================
  // SAVE
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
      setLoaderText(`Saving ${ENTITY}...`);
      setLoading(true);

      await apiRequest(ADD_API, "POST", payload);

      await getUtsavList();

      setSuccessMessage(buildResultMessage(ENTITY, "saved", payload.utsavName));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error(error);

      alert("Error while saving Utsav.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };
  // ===============================
  // ENTER KEY
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
  // ROW SELECTION
  // ===============================

  const handleRowSelect = (item) => {
    setSelectedId(item.utsavID);

    setUtsavName(item.utsavName);
  };

  // ===============================
  // UPDATE
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

  // ===============================
  // CONFIRM UPDATE
  // ===============================

  const confirmUpdate = async () => {
    try {
      setLoaderText(`Updating ${ENTITY}...`);
      setLoading(true);

      const payload = {
        utsavID: selectedId,

        utsavName: utsavName.trim(),
      };

      await apiRequest(UPDATE_API, "PUT", payload);

      await getUtsavList();

      setShowUpdateModal(false);

      setSuccessMessage(buildResultMessage(ENTITY, "updated", payload.utsavName));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error(error);

      alert("Error while updating Utsav.");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpdate = () => {
    setShowUpdateModal(false);
  };
  // ===============================
  // DELETE
  // ===============================

  const handleDelete = () => {
    if (selectedId === null) {
      alert("Please select a record.");

      return;
    }

    setShowDeleteModal(true);
  };

  // ===============================
  // CONFIRM DELETE
  // ===============================

  const confirmDelete = async () => {
    try {
      setLoaderText(`Deleting ${ENTITY}...`);
      setLoading(true);

      const payload = {
        utsavID: selectedId,
      };

      const deletedName = utsavName;

      await apiRequest(DELETE_API, "DELETE", payload);

      await getUtsavList();

      setShowDeleteModal(false);

      setSuccessMessage(buildResultMessage(ENTITY, "deleted", deletedName));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error(error);

      alert("Error while deleting Utsav.");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // ===============================
  // CLEAR
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
      {/* LOADER */}
      <Loader loading={loading} text={loaderText} />

      {/* HEADER */}
      <div className="utsavMaster-header">
        <div className="utsavMaster-title">
          <h2>Utsav Master</h2>
          <p>Manage Utsav Records</p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="utsavMaster-card">
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

        {/* BUTTONS - shared AppButton component */}
        <div className="utsavMaster-button-group">
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

      {/* SEARCH CARD - shared SearchBar component */}
      <div className="utsavMaster-card">
        <SearchBar
          label="Search Utsav"
          placeholder="Search by Utsav Name..."
          value={searchText}
          onChange={setSearchText}
        />
      </div>

      {/* TABLE */}
      <div className="utsavMaster-card">
        <div className="utsavMaster-table-responsive app-table-container">
          <table className="utsavMaster-table app-table">
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

        {/* SUCCESS POPUP - entity-aware, shared component */}
        <ResultModal
          open={showSuccessModal}
          message={successMessage}
          onClose={closeSuccessModal}
        />

        {/* UPDATE CONFIRMATION - entity-aware, shared component */}
        <ConfirmModal
          open={showUpdateModal}
          action="update"
          entity={ENTITY}
          recordName={utsavName}
          onConfirm={confirmUpdate}
          onCancel={cancelUpdate}
        />

        {/* DELETE CONFIRMATION - entity-aware, shared component */}
        <ConfirmModal
          open={showDeleteModal}
          action="delete"
          entity={ENTITY}
          recordName={utsavName}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
};

export default UtsavMaster;
