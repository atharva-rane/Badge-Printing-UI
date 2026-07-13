import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import "../../../styles/DashboardLayout.css";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  // 👇 Add it here
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!sidebarOpen) return;

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        (!toggleButtonRef.current ||
          !toggleButtonRef.current.contains(event.target))
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="dashboard-layout">
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleButtonRef={toggleButtonRef}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarRef={sidebarRef}
      />

      <main
        className={`page-content ${
          sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
