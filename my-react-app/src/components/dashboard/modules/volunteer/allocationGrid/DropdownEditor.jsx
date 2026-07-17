import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import "./DropdownEditor.css";

const DropdownEditor = forwardRef((props, ref) => {
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    // Read the value straight off the live DOM element rather than
    // out of React state. Picking an option calls stopEditing()
    // synchronously (see handleChange below), and ag-grid calls
    // getValue() right away as part of that - if this read from a
    // useState value instead, it could read a stale, not-yet-
    // re-rendered value and silently commit the OLD selection. The
    // DOM's .value is always current, so there's no race.
    getValue() {
      return selectRef.current ? selectRef.current.value : props.value;
    },

    afterGuiAttached() {
      if (selectRef.current) {
        selectRef.current.focus();
      }
    },

    isPopup() {
      return false;
    },
  }));

  // A native <select> fires "change" the moment an option is picked,
  // but does NOT fire "blur" - the element stays focused and the
  // dropdown just closes. The previous version only called
  // stopEditing() on blur, so picking a value did nothing visible
  // until you happened to click some other cell afterward. Committing
  // on change instead makes a selection take effect immediately, the
  // way it would in Excel/Google Sheets.
  const handleChange = () => {
    props.stopEditing();
  };

  return (
    <select
      ref={selectRef}
      defaultValue={props.value || ""}
      className="allocation-dropdown-editor"
      onChange={handleChange}
    >
      <option value="">-- Select --</option>

      {(props.values || []).map((item, index) => (
        <option key={index} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
});

DropdownEditor.displayName = "DropdownEditor";

export default DropdownEditor;
