import { useState, useMemo, useEffect, useRef } from "react";
import "../../../../styles/masters/SevaCoordinatorMaster.css";
import Loader from "../../../Loader";
import AppButton from "../../../common/AppButton";
import SearchBar from "../../../common/SearchBar";
import ConfirmModal from "../../../common/ConfirmModal";
import ResultModal, { buildResultMessage } from "../../../common/ResultModal";
import BulkPreviewTable from "../../../common/BulkPreviewTable";
import { importExcelFile } from "../../../../utils/importExcel";

const ENTITY = "Seva Coordinator";

// Bulk-upload preview columns - dynamically renders as many rows as the
// CSV/Excel file contains (see BulkPreviewTable). Header names match
// the same labels used by the Export CSV below; adjust here if the
// backend's real upload template uses different column headers.
const BULK_PREVIEW_COLUMNS = [
  { key: "utsav", label: "Utsav" },
  { key: "seva", label: "Seva" },
  { key: "coordinator1Name", label: "Coordinator 1" },
  { key: "coordinator1Contact", label: "Contact 1" },
  { key: "coordinator2Name", label: "Coordinator 2" },
  { key: "coordinator2Contact", label: "Contact 2" },
];

const BULK_HEADER_MAP = [
  { headerName: "Utsav", field: "utsav" },
  { headerName: "Seva", field: "seva" },
  { headerName: "Coordinator 1", field: "coordinator1Name" },
  { headerName: "Contact 1", field: "coordinator1Contact" },
  { headerName: "Coordinator 2", field: "coordinator2Name" },
  { headerName: "Contact 2", field: "coordinator2Contact" },
];

const SevaCoordinatorMaster = () => {
  // ==========================
  // MODE
  // ==========================

  const [mode, setMode] = useState("single");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loaderText, setLoaderText] = useState("");

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
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);

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
    "https:TBATCHAPI.somee.com/batchprinting/api/UtsavMaster/GetUtsavList";

  const SEVA_API =
    "https:TBATCHAPI.somee.com/batchprinting/api/SevaMaster/GetSevaList";

  // NOTE: you gave Add / Update / Delete / Upload endpoints but not
  // a "get list" endpoint. Following the same naming pattern as
  // UTSAV_API / SEVA_API, this assumes the list endpoint is
  // GetSevaCoordinatorList — update this if the real path differs.
  const COORDINATOR_API =
    "https://TBATCHAPI.somee.com/batchprinting/api/SevaCoordinator/GetSevaCoordinatorList";

  const ADD_COORDINATOR_API =
    "https://TBATCHAPI.somee.com/batchprinting/api/SevaCoordinator/AddSevaCoordinator";

  const UPDATE_COORDINATOR_API =
    "https://TBATCHAPI.somee.com/batchprinting/api/SevaCoordinator/UpdateSevaCoordinator";

  const DELETE_COORDINATOR_API =
    "https://TBATCHAPI.somee.com/batchprinting/api/SevaCoordinator/DeleteSevaCoordinator";

  const UPLOAD_COORDINATOR_API =
    "https://TBATCHAPI.somee.com/batchprinting/api/SevaCoordinator/UploadFile";

  // ==========================
  // LIST STATES
  // ==========================

  const [coordinatorList, setCoordinatorList] = useState([]);

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
  // GET DISPLAY NAMES
  // ==========================

  const getUtsavName = (id) => {
    const item = utsavOptions.find((x) => String(x.utsavID) === String(id));

    return item?.utsavName || "";
  };

  const getSevaName = (id) => {
    const item = allSevaList.find(
      (x) => String(x.sevaID ?? x.sevaId) === String(id),
    );

    return item?.sevaName || "";
  };

  // ==========================
  // HANDLE INPUT CHANGE
  // ==========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "coordinator1Contact" || name === "coordinator2Contact") {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,

      [name]: value,

      ...(name === "utsavId" ? { sevaId: "" } : {}),
    }));
  };

  // ==========================
  // ROW SELECT
  // ==========================

  const handleRowSelect = (item) => {
    setSelectedId(item.id);

    setFormData({
      utsavId: item.utsavID ?? "",

      sevaId: item.sevaID ?? "",

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

  // A short display label for the currently selected/entered record,
  // used to build entity-aware "Coordinator X saved/updated/deleted"
  // popup messages.
  const currentRecordLabel = () => {
    const seva = getSevaName(formData.sevaId);
    return (
      [formData.coordinator1Name, seva].filter(Boolean).join(" - ") || null
    );
  };

  // ==========================
  // SAVE RECORD (ADD API)
  // ==========================

  const handleSave = async () => {
    if (!formData.utsavId || !formData.sevaId || !formData.coordinator1Name) {
      alert("Please fill required fields.");

      return;
    }

    const duplicate = coordinatorList.some(
      (item) =>
        String(item.utsavID) === String(formData.utsavId) &&
        String(item.sevaID) === String(formData.sevaId),
    );

    if (duplicate) {
      alert("This Seva Coordinator already exists.");

      return;
    }

    setLoaderText(`Saving ${ENTITY}...`);

    setLoading(true);

    try {
      const payload = {
        Utsav_Name: getUtsavName(formData.utsavId),
        SevaName: getSevaName(formData.sevaId),
        Coordinator_1_Name: formData.coordinator1Name,
        Coordinator_1_ContactNo: formData.coordinator1Contact,
        Coordinator_2_Name: formData.coordinator2Name,
        Coordinator_2_ContactNo: formData.coordinator2Contact,
      };

      const recordLabel = currentRecordLabel();

      const response = await fetch(ADD_COORDINATOR_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Add Coordinator API Error : ${response.status}`);
      }

      await response.json();

      await loadCoordinatorList();

      setSuccessMessage(buildResultMessage(ENTITY, "saved", recordLabel));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error("Error saving Coordinator:", error);

      alert("Failed to save Seva Coordinator. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const confirmUpdate = async () => {
    setLoaderText(`Updating ${ENTITY}...`);

    setLoading(true);

    try {
      const selectedRecord = coordinatorList.find(
        (item) => item.id === selectedId,
      );

      const payload = {
        id: selectedId,
        recId: selectedRecord?.recId,
        Utsav_Name: getUtsavName(formData.utsavId),
        SevaName: getSevaName(formData.sevaId),
        Coordinator_1_Name: formData.coordinator1Name,
        Coordinator_1_ContactNo: formData.coordinator1Contact,
        Coordinator_2_Name: formData.coordinator2Name,
        Coordinator_2_ContactNo: formData.coordinator2Contact,
      };

      const recordLabel = currentRecordLabel();

      const response = await fetch(UPDATE_COORDINATOR_API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Update Coordinator API Error : ${response.status}`);
      }

      await response.json();

      await loadCoordinatorList();

      setShowUpdateModal(false);

      setSuccessMessage(buildResultMessage(ENTITY, "updated", recordLabel));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error("Error updating Coordinator:", error);

      setShowUpdateModal(false);

      alert("Failed to update Seva Coordinator. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const confirmDelete = async () => {
    setLoaderText(`Deleting ${ENTITY}...`);

    setLoading(true);

    try {
      const recordLabel = currentRecordLabel();

      const response = await fetch(
        `${DELETE_COORDINATOR_API}?id=${selectedId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`Delete Coordinator API Error : ${response.status}`);
      }

      await loadCoordinatorList();

      setShowDeleteModal(false);

      setSuccessMessage(buildResultMessage(ENTITY, "deleted", recordLabel));

      setShowSuccessModal(true);

      handleClear();
    } catch (error) {
      console.error("Error deleting Coordinator:", error);

      setShowDeleteModal(false);

      alert("Failed to delete Seva Coordinator. Please try again.");
    } finally {
      setLoading(false);
    }
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
      const utsav = getUtsavName(item.utsavID).toLowerCase();

      const seva = getSevaName(item.sevaID).toLowerCase();

      return (
        utsav.includes(search) ||
        seva.includes(search) ||
        item.coordinator1Name?.toLowerCase().includes(search) ||
        item.coordinator2Name?.toLowerCase().includes(search)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, coordinatorList, utsavOptions, allSevaList]);

  // ==========================
  // EXPORT CSV
  // ==========================

  const handleExport = () => {
    const header = [
      "Utsav",
      "Seva",
      "Coordinator 1",
      "Contact 1",
      "Coordinator 2",
      "Contact 2",
    ];

    const rows = coordinatorList.map((item) => [
      getUtsavName(item.utsavID),

      getSevaName(item.sevaID),

      item.coordinator1Name,

      item.coordinator1Contact,

      item.coordinator2Name,

      item.coordinator2Contact,
    ]);

    const csvContent = [header, ...rows].map((row) => row.join(",")).join("\n");

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
  // BULK CSV UPLOAD (UPLOAD API) - preview grows dynamically to match
  // however many coordinator rows are in the file.
  // ==========================

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
    if (!file) {
      alert("Select CSV File");

      return;
    }

    setLoaderText(`Uploading ${ENTITY}s...`);

    setLoading(true);

    try {
      const formPayload = new FormData();

      formPayload.append("file", file);

      const response = await fetch(UPLOAD_COORDINATOR_API, {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) {
        throw new Error(`Upload Coordinator API Error : ${response.status}`);
      }

      const result = await response.json();

      await loadCoordinatorList();

      setSuccessMessage(
        result?.message ||
          `${bulkPreviewRows.length || ""} ${ENTITY}${
            bulkPreviewRows.length === 1 ? "" : "s"
          } uploaded successfully.`
            .replace(/\s+/g, " ")
            .trim(),
      );

      setShowSuccessModal(true);

      setFile(null);
      setBulkPreviewRows([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading Coordinator file:", error);

      alert("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // LOAD COORDINATOR LIST
  // ==========================

  const loadCoordinatorList = async () => {
    try {
      const response = await fetch(COORDINATOR_API);

      if (!response.ok) {
        throw new Error(`Coordinator API Error : ${response.status}`);
      }

      const result = await response.json();

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      // Normalize field names in case the backend uses different
      // casing/keys than the client (e.g. sevaCoordinatorID vs id).
      const normalizedList = list.map((item) => ({
        ...item,
        id: item.id ?? item.sevaCoordinatorID ?? item.recId,
        recId: item.recId ?? item.sevaCoordinatorID ?? item.id,
        utsavID: item.utsavID ?? item.utsavId,
        sevaID: item.sevaID ?? item.sevaId,
      }));

      setCoordinatorList(normalizedList);
    } catch (error) {
      console.error("Error loading Coordinator:", error);

      setCoordinatorList([]);
    }
  };

  // ==========================
  // ENTER KEY SAVE
  // ==========================

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (mode !== "single") return;

    if (showDeleteModal || showUpdateModal || showSuccessModal) return;

    handleSave();
  };

  // ==========================
  // INITIAL LOAD
  // ==========================

  useEffect(() => {
    loadUtsavList();

    loadSevaList();

    loadCoordinatorList();
  }, []);

  // ==========================
  // FILTER SEVA BY UTSAV
  // ==========================
  //
  // NOTE: The Seva API does NOT return a `utsavID` field on each
  // seva record — it only returns `utsavName`. So we can't match
  // by ID here. Instead we resolve the selected Utsav's name from
  // utsavOptions, then filter allSevaList by that name.

  useEffect(() => {
    if (!formData.utsavId) {
      setSevaOptions([]);
      return;
    }

    const selectedUtsav = utsavOptions.find(
      (x) => String(x.utsavID) === String(formData.utsavId),
    );

    if (!selectedUtsav) {
      setSevaOptions([]);
      return;
    }

    const normalize = (str) =>
      String(str ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const targetName = normalize(selectedUtsav.utsavName);

    const filtered = allSevaList.filter(
      (item) => normalize(item.utsavName) === targetName,
    );

    setSevaOptions(filtered);
  }, [formData.utsavId, utsavOptions, allSevaList]);

  return (
    <div className="sevacoordinatormaster-page">
      <Loader loading={loading} progress={progress} text={loaderText} />

      <h2 className="sevacoordinatormaster-title">Seva Coordinator Master</h2>

      {/* MODE SWITCH */}

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

      {/* SINGLE ENTRY */}

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
                onKeyDown={handleKeyDown}
              >
                <option value="">Select Utsav</option>

                {utsavOptions.map((item) => (
                  <option key={item.utsavID} value={item.utsavID}>
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
                onKeyDown={handleKeyDown}
              >
                <option value="">Select Seva</option>

                {sevaOptions.map((item, index) => (
                  <option
                    key={item.sevaID ?? item.sevaId ?? index}
                    value={item.sevaID ?? item.sevaId}
                  >
                    {item.sevaName}
                  </option>
                ))}
              </select>
            </div>

            {/* COORDINATOR 1 */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 1 Name</label>

              <input
                type="text"
                name="coordinator1Name"
                placeholder="Enter Coordinator Name"
                value={formData.coordinator1Name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 1 Contact</label>

              <input
                type="text"
                maxLength="10"
                name="coordinator1Contact"
                placeholder="Enter Contact Number"
                value={formData.coordinator1Contact}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* COORDINATOR 2 */}

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 2 Name</label>

              <input
                type="text"
                name="coordinator2Name"
                placeholder="Enter Coordinator Name"
                value={formData.coordinator2Name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="sevacoordinatormaster-form-group">
              <label>Coordinator 2 Contact</label>

              <input
                type="text"
                maxLength="10"
                name="coordinator2Contact"
                placeholder="Enter Contact Number"
                value={formData.coordinator2Contact}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div className="sevacoordinatormaster-btn-row">
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
        <div className="sevacoordinatormaster-card">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={(e) => handleFileSelected(e.target.files[0])}
          />

          {/* Preview table dynamically grows to match however many
              coordinator rows were found in the uploaded file. */}
          <BulkPreviewTable
            columns={BULK_PREVIEW_COLUMNS}
            rows={bulkPreviewRows}
            emptyText="Choose a CSV file to preview the Seva Coordinators it contains."
          />

          <div className="sevacoordinatormaster-btn-row">
            <AppButton variant="upload" onClick={handleUpload}>
              Upload
            </AppButton>
          </div>
        </div>
      )}

      {/* SEARCH */}

      <SearchBar
        label="Search Seva / Coordinator"
        placeholder="Search Seva / Coordinator..."
        value={searchText}
        onChange={setSearchText}
        className="sevacoordinatormaster-search-container"
      />

      {/* TABLE - ID and Rec ID columns removed (not needed on the
          frontend); mild dark border via app-table */}

      <div className="sevacoordinatormaster-table-container app-table-container">
        <table className="app-table">
          <thead>
            <tr>
              <th>Utsav</th>

              <th>Seva</th>

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
                  onClick={() => handleRowSelect(item)}
                  className={
                    selectedId === item.id
                      ? "sevacoordinatormaster-active-row"
                      : ""
                  }
                >
                  <td>{getUtsavName(item.utsavID)}</td>

                  <td>{getSevaName(item.sevaID)}</td>

                  <td>{item.coordinator1Name}</td>

                  <td>{item.coordinator1Contact}</td>

                  <td>{item.coordinator2Name}</td>

                  <td>{item.coordinator2Contact}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRM MODAL - entity-aware, shared component */}
      <ConfirmModal
        open={showDeleteModal}
        action="delete"
        entity={ENTITY}
        recordName={currentRecordLabel()}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* UPDATE CONFIRM MODAL - entity-aware, shared component */}
      <ConfirmModal
        open={showUpdateModal}
        action="update"
        entity={ENTITY}
        recordName={currentRecordLabel()}
        onConfirm={confirmUpdate}
        onCancel={cancelUpdate}
      />

      {/* SUCCESS MODAL - entity-aware, shared component */}
      <ResultModal
        open={showSuccessModal}
        message={successMessage}
        onClose={closeSuccessModal}
      />
    </div>
  );
};

export default SevaCoordinatorMaster;
