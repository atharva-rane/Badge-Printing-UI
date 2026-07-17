import React from "react";

import "./YesNoRenderer.css";

// Renders whatever the column's valueGetter produced ("Yes" / "No") as
// a small colored badge. Pairs with DropdownEditor (values: ["Yes","No"])
// for editing - see the column defs in SevaAllocation.jsx for the
// valueGetter/valueSetter that convert to/from the underlying boolean.
const YesNoRenderer = (params) => {
  return <span className="yesno-badge">{params.value || "No"}</span>;
};

export default YesNoRenderer;
