import { useState, useMemo, useEffect, useRef } from "react";
import "../../../../styles/masters/SevaCoordinatorMaster.css";
import { FaTrashAlt } from "react-icons/fa";

const SevaCoordinatorMaster = () => {
  // ==========================
  // MODE
  // ==========================

  const [mode, setMode] = useState("single");

  // ==========================
  // FORM INITIAL STATE
  // ==========================

  const initialForm = {
    utsavId: "",
    sevaId: "",
    coordinator1Name: "",
    coordinator1Contact: "",
    coordinator2Name: "",
    coordinator2Contact: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const [selectedId, setSelectedId] = useState(null);

  const fileInputRef = useRef(null);

  const [searchText, setSearchText] = useState("");

  const [file, setFile] = useState(null);

  // ==========================
  // MODALS
  // ==========================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================
  // DROPDOWN STATES
  // ==========================

  const [utsavOptions, setUtsavOptions] = useState([]);

  const [allSevaList, setAllSevaList] = useState([]);

  const [sevaOptions, setSevaOptions] = useState([]);

  // ==========================
  // API URLS
  // ==========================

  const UTSAV_API =
    "http://TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/GetUtsavList";

  const SEVA_API =
    "http://TBATCHAPI.somee.com/batchprinting/api/SevaMaster/GetSevaList";

  // ==========================
  // SAMPLE DATA
  // ==========================

  const [coordinatorList, setCoordinatorList] = useState([
    {
      id: 10,
      recId: "SC010",
      utsavId: 4,
      sevaId: 10,
      coordinator1Name: "Aniket Sawant",
      coordinator1Contact: "9988001122",
      coordinator2Name: "",
      coordinator2Contact: "",
    },

    {
      id: 11,
      recId: "SC011",
      utsavId: 4,
      sevaId: 11,
      coordinator1Name: "Sagar Chavan",
      coordinator1Contact: "9876123456",
      coordinator2Name: "Mahesh Naik",
      coordinator2Contact: "9765987456",
    },

    {
      id: 12,
      recId: "SC012",
      utsavId: 4,
      sevaId: 12,
      coordinator1Name: "Nitin Gawade",
      coordinator1Contact: "9890011223",
      coordinator2Name: "",
      coordinator2Contact: "",
    },

    {
      id: 13,
      recId: "SC013",
      utsavId: 5,
      sevaId: 13,
      coordinator1Name: "Deepak Khot",
      coordinator1Contact: "9822003344",
      coordinator2Name: "Rohit Patankar",
      coordinator2Contact: "9811002233",
    },

    {
      id: 14,
      recId: "SC014",
      utsavId: 5,
      sevaId: 14,
      coordinator1Name: "Swapnil Mane",
      coordinator1Contact: "9870012345",
      coordinator2Name: "",
      coordinator2Contact: "",
    },

    {
      id: 15,
      recId: "SC015",
      utsavId: 5,
      sevaId: 15,
      coordinator1Name: "Ketan Joshi",
      coordinator1Contact: "9988997766",
      coordinator2Name: "Vijay Patil",
      coordinator2Contact: "9876655443",
    },
  ]);

  // ==========================
  // LOAD UTSAV LIST
  // ==========================

  const loadUtsavList = async () => {
    try {
      const response = await fetch(UTSAV_API);

      if (!response.ok) {
        throw new Error(`Utsav API Error : ${response.status}`);
      }

      const result = await response.json();

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      setUtsavOptions(list);
    } catch (error) {
      console.error("Error loading Utsav:", error);

      setUtsavOptions([]);
    }
  };

  // ==========================
  // LOAD SEVA LIST
  // ==========================

  const loadSevaList = async () => {
    try {
      const response = await fetch(SEVA_API);

      if (!response.ok) {
        throw new Error(`Seva API Error : ${response.status}`);
      }

      const result = await response.json();

      console.log("Seva API Response:", result);

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      setAllSevaList(list);
    } catch (error) {
      console.error("Error loading Seva:", error);

      setAllSevaList([]);
    }
  };

  // ==========================
  // INITIAL API LOAD
  // ==========================

  useEffect(() => {
    loadUtsavList();

    loadSevaList();
  }, []);

  // ==========================
  // FILTER SEVA BY UTSAV
  // ==========================

  useEffect(() => {
    if (!formData.utsavId) {
      setSevaOptions([]);

      return;
    }

    const filtered = allSevaList.filter(
      (item) =>
        String(item.utsavID ?? item.utsavId) === String(formData.utsavId),
    );

    setSevaOptions(filtered);
  }, [formData.utsavId, allSevaList]);

  // ==========================
  // GET DISPLAY NAMES
  // ==========================

  const getUtsavName = (id) => {
    const item = utsavOptions.find(
      (x) => String(x.utsavID ?? x.utsavId) === String(id),
    );

    return item?.utsavName || "";
  };

  const getSevaName = (id) => {
    const item = allSevaList.find((x) => String(x.sevaId) === String(id));

    return item?.sevaName || "";
  };

  // ==========================
  // HANDLE INPUT CHANGE
  // ==========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Contact validation
    if (name === "coordinator1Contact" || name === "coordinator2Contact") {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,

      // Clear Seva when Utsav changes
      ...(name === "utsavId" ? { sevaId: "" } : {}),
    }));
  };

  // ==========================
  // ROW SELECT
  // ==========================

  const handleRowSelect = (item) => {
    setSelectedId(item.id);

    setFormData({
      utsavId: item.utsavId ?? item.utsavID ?? "",

      sevaId: item.sevaId ?? "",

      coordinator1Name: item.coordinator1Name ?? "",

      coordinator1Contact: item.coordinator1Contact ?? "",

      coordinator2Name: item.coordinator2Name ?? "",

      coordinator2Contact: item.coordinator2Contact ?? "",
    });
  };

  // ==========================
  // CLEAR FORM
  // ==========================

  const handleClear = () => {
    setSelectedId(null);

    setFormData(initialForm);

    setSevaOptions([]);
  };

  // ==========================
  // SAVE RECORD
  // ==========================

  const handleSave = () => {
    if (!formData.utsavId || !formData.sevaId || !formData.coordinator1Name) {
      alert("Please fill required fields.");

      return;
    }

    const duplicate = coordinatorList.some(
      (item) =>
        String(item.utsavId) === String(formData.utsavId) &&
        String(item.sevaId) === String(formData.sevaId),
    );

    if (duplicate) {
      alert("This Seva Coordinator already exists.");

      return;
    }

    const newRecord = {
      id: Date.now(),

      recId: "SC" + String(coordinatorList.length + 1).padStart(3, "0"),

      ...formData,
    };

    setCoordinatorList((prev) => [...prev, newRecord]);

    setSuccessMessage("Saved successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // ==========================
  // UPDATE
  // ==========================

  const handleUpdate = () => {
    if (selectedId === null) {
      alert("Please select a record.");

      return;
    }

    if (!formData.utsavId || !formData.sevaId || !formData.coordinator1Name) {
      alert("Please fill required fields.");

      return;
    }

    setShowUpdateModal(true);
  };

  const confirmUpdate = () => {
    const updatedList = coordinatorList.map((item) =>
      item.id === selectedId
        ? {
            ...item,
            ...formData,
          }
        : item,
    );

    setCoordinatorList(updatedList);

    setShowUpdateModal(false);

    setSuccessMessage("Updated successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  const cancelUpdate = () => {
    setShowUpdateModal(false);
  };

  // ==========================
  // DELETE
  // ==========================

  const handleDelete = () => {
    if (selectedId === null) {
      alert("Please select a record.");

      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setCoordinatorList((prev) => prev.filter((item) => item.id !== selectedId));

    setShowDeleteModal(false);

    setSuccessMessage("Deleted successfully.");

    setShowSuccessModal(true);

    handleClear();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // ==========================
  // SEARCH FILTER
  // ==========================

  const filteredList = useMemo(() => {
    const search = searchText.toLowerCase();

    return coordinatorList.filter((item) => {
      const utsav = getUtsavName(item.utsavId).toLowerCase();

      const seva = getSevaName(item.sevaId).toLowerCase();

      return (
        utsav.includes(search) ||
        seva.includes(search) ||
        item.coordinator1Name.toLowerCase().includes(search) ||
        item.coordinator2Name.toLowerCase().includes(search)
      );
    });
  }, [searchText, coordinatorList, utsavOptions, allSevaList]);

  // ==========================
  // EXPORT CSV
  // ==========================

  const handleExport = () => {
    const header = [
      "Rec ID",

      "Utsav",

      "Seva",

      "Coordinator 1",

      "Contact 1",

      "Coordinator 2",

      "Contact 2",
    ];

    const rows = coordinatorList.map((item) => [
      item.recId,

      getUtsavName(item.utsavId),

      getSevaName(item.sevaId),

      item.coordinator1Name,

      item.coordinator1Contact,

      item.coordinator2Name,

      item.coordinator2Contact,
    ]);

    const csvContent = [header, ...rows]

      .map((row) => row.join(","))

      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "SevaCoordinatorMaster.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  // ==========================
  // BULK CSV UPLOAD
  // ==========================

  const handleUpload = () => {
    if (!file) {
      alert("Select CSV File");

      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const rows = e.target.result.trim().split("\n").slice(1);

      const data = rows.map((row, index) => {
        const col = row.split(",");

        return {
          id: Date.now() + index,

          recId: col[0],

          utsavId: col[1],

          sevaId: col[2],

          coordinator1Name: col[3],

          coordinator1Contact: col[4],

          coordinator2Name: col[5] || "",

          coordinator2Contact: col[6] || "",
        };
      });

      setCoordinatorList((prev) => [...data, ...prev]);

      setSuccessMessage(`${data.length} records uploaded successfully.`);

      setShowSuccessModal(true);

      setFile(null);
    };

    reader.readAsText(file);
  };

  return (
    <div className="sevacoordinatormaster-page">
      <h2 className="sevacoordinatormaster-title">Seva Coordinator Master</h2>

      {/* ==========================
          MODE SWITCH
      ========================== */}

      <div className="sevacoordinatormaster-mode-switch">
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

      {/* ==========================
          SINGLE ENTRY
      ========================== */}

      {mode === "single" && (
        <div className="sevacoordinatormaster-card">
          <div className="sevacoordinatormaster-form-grid">
            {/* UTSAV */}

            <div className="sevacoordinatormaster-form-group">
              <label>
                Select Utsav <span>*</span>
              </label>

              <select
                name="utsavId"
                value={formData.utsavId}
                onChange={handleChange}
              >
                <option value="">Select Utsav</option>

                {utsavOptions.map((item) => (
                  <option
                    key={item.utsavID ?? item.utsavId}
                    value={item.utsavID ?? item.utsavId}
                  >
                    {item.utsavName}
                  </option>
                ))}
              </select>
            </div>

            {/* SEVA */}

            <div className="sevacoordinatormaster-form-group">
              <label>
                Select Seva <span>*</span>
              </label>

              <select
                name="sevaId"
                value={formData.sevaId}
                onChange={handleChange}
              >
                <option value="">Select Seva</option>

                {sevaOptions.map((item) => (
                  <option key={item.sevaId} value={item.sevaId}>
                    {item.sevaName}
                  </option>
                ))}
              </select>
            </div>

            {/* COORDINATOR 1 NAME */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 1 Name</label>

              <input
                type="text"
                name="coordinator1Name"
                placeholder="Enter Coordinator Name"
                value={formData.coordinator1Name}
                onChange={handleChange}
              />
            </div>

            {/* COORDINATOR 1 CONTACT */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 1 Contact</label>

              <input
                type="text"
                maxLength="10"
                name="coordinator1Contact"
                placeholder="Enter Contact Number"
                value={formData.coordinator1Contact}
                onChange={handleChange}
              />
            </div>

            {/* COORDINATOR 2 NAME */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 2 Name</label>

              <input
                type="text"
                name="coordinator2Name"
                placeholder="Enter Coordinator Name"
                value={formData.coordinator2Name}
                onChange={handleChange}
              />
            </div>

            {/* COORDINATOR 2 CONTACT */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 2 Contact</label>

              <input
                type="text"
                maxLength="10"
                name="coordinator2Contact"
                placeholder="Enter Contact Number"
                value={formData.coordinator2Contact}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* BUTTONS */}

          <div className="sevacoordinatormaster-btn-row">
            <button type="button" onClick={handleSave}>
              Save
            </button>

            <button type="button" onClick={handleUpdate}>
              Update
            </button>

            <button type="button" onClick={handleDelete}>
              Delete
            </button>

            <button type="button" onClick={handleExport}>
              Export
            </button>

            <button type="button" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ==========================
          BULK UPLOAD
      ========================== */}

      {mode === "bulk" && (
        <div className="sevacoordinatormaster-card">
          <div className="sevacoordinatormaster-form-grid">
            {/* UTSAV SELECT */}

            <div className="sevacoordinatormaster-form-group">
              <label>
                Select Utsav <span>*</span>
              </label>

              <select
                name="utsavId"
                value={formData.utsavId}
                onChange={handleChange}
              >
                <option value="">Select Utsav </option>

                {utsavOptions.map((item) => (
                  <option
                    key={item.utsavID ?? item.utsavId}
                    value={item.utsavID ?? item.utsavId}
                  >
                    {item.utsavName}
                  </option>
                ))}
              </select>
            </div>

            {/* Excel FILE */}

            <div className="sevacoordinatormaster-form-group sevacoordinatormaster-file-upload-row">
              <label>
                Upload Excel File <span>*</span>
              </label>

              <div className="sevacoordinatormaster-file-upload-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="sevacoordinatormaster-hidden-file-input"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <div
                  className="sevacoordinatormaster-custom-file-box"
                  onClick={() => fileInputRef.current.click()}
                >
                  <button
                    type="button"
                    className="sevacoordinatormaster-choose-file-btn"
                  >
                    Choose File
                  </button>

                  <span className="sevacoordinatormaster-file-name">
                    {file ? file.name : "No file chosen"}
                  </span>
                </div>

                {file && (
                  <button
                    type="button"
                    className="sevacoordinatormaster-file-delete-btn"
                    onClick={() => {
                      setFile(null);
                      fileInputRef.current.value = "";
                    }}
                  >
                    <FaTrashAlt />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sevacoordinatormaster-btn-row">
            <button type="button" onClick={handleUpload}>
              Upload
            </button>
          </div>
        </div>
      )}

      {/* ==========================
          SEARCH
      ========================== */}

      <div className="sevacoordinatormaster-search-container">
        <label className="sevacoordinatormaster-search-label">
          Search Seva / Coordinator
        </label>

        <input
          type="text"
          className="sevacoordinatormaster-search-input"
          placeholder="Search Seva / Coordinator..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* ==========================
          TABLE
      ========================== */}

      <div className="sevacoordinatormaster-table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>

              <th>Rec ID</th>

              <th>Utsav</th>

              <th>Seva Name</th>

              <th>Coordinator 1</th>

              <th>Contact 1</th>

              <th>Coordinator 2</th>

              <th>Contact 2</th>
            </tr>
          </thead>

          <tbody>
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <tr
                  key={item.id}
                  className={
                    selectedId === item.id
                      ? "sevacoordinatormaster-active-row"
                      : ""
                  }
                  onClick={() => handleRowSelect(item)}
                >
                  <td>{item.id}</td>

                  <td>{item.recId}</td>

                  <td>{getUtsavName(item.utsavId)}</td>

                  <td>{getSevaName(item.sevaId)}</td>

                  <td>{item.coordinator1Name}</td>

                  <td>{item.coordinator1Contact}</td>

                  <td>{item.coordinator2Name}</td>

                  <td>{item.coordinator2Contact}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",

                    padding: "20px",
                  }}
                >
                  No Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===============================
          SUCCESS POPUP
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
          UPDATE CONFIRMATION POPUP
      =============================== */}

      {showUpdateModal && (
        <div className="utsavMaster-update-overlay">
          <div className="utsavMaster-update-modal">
            <h4>Update Confirmation</h4>

            <p>Are you sure you want to update this Seva Coordinator?</p>

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
          DELETE CONFIRMATION POPUP
      =============================== */}

      {showDeleteModal && (
        <div className="utsavMaster-delete-overlay">
          <div className="utsavMaster-delete-modal">
            <h4>Delete Confirmation</h4>

            <p>Are you sure you want to delete this Seva Coordinator?</p>

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

export default SevaCoordinatorMaster;
