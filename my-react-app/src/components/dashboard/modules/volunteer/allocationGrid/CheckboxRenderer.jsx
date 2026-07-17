import React from "react";

import "./CheckboxRenderer.css";

const CheckboxRenderer = (props) => {
  const handleChange = (e) => {
    const checked = e.target.checked;

    props.node.setDataValue(props.column.colId, checked);

    if (props.api) {
      props.api.refreshCells({
        rowNodes: [props.node],
        columns: [props.column.colId],
        force: true,
      });
    }
  };

  return (
    <div
      className="allocation-checkbox-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <input
        type="checkbox"
        checked={!!props.value}
        onChange={handleChange}
        className="allocation-checkbox"
      />
    </div>
  );
};

export default CheckboxRenderer;
