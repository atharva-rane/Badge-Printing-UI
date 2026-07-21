import { useEffect, useState } from "react";
import AppButton from "../../../../common/AppButton";
import "./VolunteerFormModal.css";

const YES_NO = ["Yes", "No"];

/**
 * VolunteerFormModal
 * -----------------------------------------------------------------------
 * Replaces "click a grid cell to edit it in place". Used in two modes:
 *   mode="add"  - opened from the toolbar's Add Row button, blank form.
 *   mode="edit" - opened from the row's Edit icon, pre-filled with that
 *                 row's data.
 *
 * On submit, calls onSave(formValues) and lets the parent
 * (SevaAllocation.jsx) decide what to do (insert vs. update the row).
 */
const emptyForm = {
  kendraName: "",
  sevaName: "",
  shift: "",
  volName: "",
  age: "",
  gender: "",
  emailId: "",
  mobileNo: "",
  whatsappNo: "",
  comingToBapuSince: "",
  education: "",
  occupation: "",
  comingThursdaySeva: false,
  badgeNo: "",
  thursdayCoordinator: false,
  utsavCoordinator: false,
};

const VolunteerFormModal = ({
  open,
  mode = "add",
  initialData,
  kendraList = [],
  sevaList = [],
  shiftList = [],
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...(initialData || {}) });
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleYesNoChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value === "Yes" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.kendraName || !form.sevaName || !form.shift || !form.volName.trim()) {
      alert("Please fill Kendra, Seva, Shift and Volunteer Name.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="app-modal-overlay">
      <div className="app-modal volunteer-form-modal">
        <h4>{mode === "edit" ? "Edit Volunteer" : "Add Volunteer"}</h4>

        <form className="volunteer-form-grid" onSubmit={handleSubmit}>
          <div className="volunteer-form-group">
            <label>
              Kendra Name <span>*</span>
            </label>
            <select
              value={form.kendraName}
              onChange={(e) => handleChange("kendraName", e.target.value)}
            >
              <option value="">Select Kendra</option>
              {kendraList.map((item, idx) => (
                <option key={idx} value={item.kendraName}>
                  {item.kendraName}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>
              Seva Name <span>*</span>
            </label>
            <select
              value={form.sevaName}
              onChange={(e) => handleChange("sevaName", e.target.value)}
            >
              <option value="">Select Seva</option>
              {sevaList.map((item, idx) => (
                <option key={idx} value={item.sevaName}>
                  {item.sevaName}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>
              Shift <span>*</span>
            </label>
            <select
              value={form.shift}
              onChange={(e) => handleChange("shift", e.target.value)}
            >
              <option value="">Select Shift</option>
              {shiftList.map((item, idx) => (
                <option key={idx} value={item.shiftName}>
                  {item.shiftName}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>
              Volunteer Name <span>*</span>
            </label>
            <input
              type="text"
              value={form.volName}
              onChange={(e) => handleChange("volName", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => handleChange("age", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Gender</label>
            <select
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>Email ID</label>
            <input
              type="email"
              value={form.emailId}
              onChange={(e) => handleChange("emailId", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>
              Mobile No. <span>*</span>
            </label>
            <input
              type="text"
              maxLength="10"
              value={form.mobileNo}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  handleChange("mobileNo", e.target.value);
                }
              }}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Whatsapp No.</label>
            <input
              type="text"
              maxLength="10"
              value={form.whatsappNo}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  handleChange("whatsappNo", e.target.value);
                }
              }}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Coming to Bapu Since</label>
            <input
              type="text"
              value={form.comingToBapuSince}
              onChange={(e) =>
                handleChange("comingToBapuSince", e.target.value)
              }
            />
          </div>

          <div className="volunteer-form-group">
            <label>Education</label>
            <input
              type="text"
              value={form.education}
              onChange={(e) => handleChange("education", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Occupation</label>
            <input
              type="text"
              value={form.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Coming To Thursday Seva</label>
            <select
              value={form.comingThursdaySeva ? "Yes" : "No"}
              onChange={(e) =>
                handleYesNoChange("comingThursdaySeva", e.target.value)
              }
            >
              {YES_NO.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>Badge No.</label>
            <input
              type="text"
              value={form.badgeNo}
              onChange={(e) => handleChange("badgeNo", e.target.value)}
            />
          </div>

          <div className="volunteer-form-group">
            <label>Thursday Seva Coordinator</label>
            <select
              value={form.thursdayCoordinator ? "Yes" : "No"}
              onChange={(e) =>
                handleYesNoChange("thursdayCoordinator", e.target.value)
              }
            >
              {YES_NO.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-group">
            <label>Utsav Coordinator</label>
            <select
              value={form.utsavCoordinator ? "Yes" : "No"}
              onChange={(e) =>
                handleYesNoChange("utsavCoordinator", e.target.value)
              }
            >
              {YES_NO.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="volunteer-form-buttons">
            <AppButton variant="cancel" type="button" onClick={onCancel}>
              Cancel
            </AppButton>
            <AppButton variant={mode === "edit" ? "update" : "save"} type="submit">
              {mode === "edit" ? "Update Volunteer" : "Save Volunteer"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerFormModal;
