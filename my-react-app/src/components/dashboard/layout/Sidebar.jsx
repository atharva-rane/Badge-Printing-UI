import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiDatabase,
  FiUploadCloud,
  FiUsers,
  FiMail,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";

import "../../../styles/Sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen, sidebarRef }) => {
  // ============================
  // STATES
  // ============================

  const [expandedMenu, setExpandedMenu] = useState("masters");
  const [pendingMenu, setPendingMenu] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [tooltip, setTooltip] = useState({
    show: false,
    text: "",
    x: 0,
    y: 0,
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isCollapsed = !sidebarOpen;

  // ============================
  // LOGOUT
  // ============================

  const handleLogout = () => {
    setShowLogoutModal(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // ============================
  // EXPANDABLE MENU
  // ============================

  const handleExpandableMenu = (menu) => {
    if (!sidebarOpen) {
      setPendingMenu(menu);
      setSidebarOpen(true);
      return;
    }

    setExpandedMenu((prev) => (prev === menu ? null : menu));
  };

  useEffect(() => {
    if (!sidebarOpen || !pendingMenu) return;

    setExpandedMenu(pendingMenu);
    setPendingMenu(null);
  }, [sidebarOpen, pendingMenu]);

  // ============================
  // ACTIVE STATES
  // ============================

  const mastersActive =
    location.pathname.includes("/utsav-master") ||
    location.pathname.includes("/seva-master") ||
    location.pathname.includes("/seva-coordinator-master") ||
    location.pathname.includes("/shift-master") ||
    location.pathname.includes("/center-master");

  const volunteerActive =
    location.pathname.includes("/seva-allocation") ||
    location.pathname.includes("/badge-generation") ||
    location.pathname.includes("/mark-attendance");

  const subMenuClass = ({ isActive }) =>
    isActive ? "submenu-item active" : "submenu-item";

  // ============================
  // TOOLTIP
  // ============================

  const handleMouseMove = (e, label) => {
    if (isCollapsed) {
      setTooltip({
        show: true,
        text: label,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({
      ...prev,
      show: false,
    }));
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}
    >
      <div className="sidebar-menu">
        {/* ================= DASHBOARD ================= */}

        <NavLink
          to="/home"
          end
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          onMouseMove={(e) => handleMouseMove(e, "Dashboard")}
          onMouseLeave={hideTooltip}
        >
          <FiHome className="menu-icon" />
          {sidebarOpen && <span>Dashboard</span>}
        </NavLink>

        {/* ================= MASTERS ================= */}

        <div
          className={`menu-item ${mastersActive ? "active" : ""}`}
          onClick={() => handleExpandableMenu("masters")}
          onMouseMove={(e) => handleMouseMove(e, "Masters")}
          onMouseLeave={hideTooltip}
        >
          <div className="menu-left">
            <FiDatabase className="menu-icon" />
            {sidebarOpen && <span>Masters</span>}
          </div>

          {sidebarOpen &&
            (expandedMenu === "masters" ? (
              <FiChevronDown />
            ) : (
              <FiChevronRight />
            ))}
        </div>

        {expandedMenu === "masters" && (
          <div className="submenu">
            <NavLink to="/home/utsav-master" className={subMenuClass}>
              Utsav Master
            </NavLink>

            <NavLink to="/home/seva-master" className={subMenuClass}>
              Seva Master
            </NavLink>

            <NavLink
              to="/home/seva-coordinator-master"
              className={subMenuClass}
            >
              Seva Coordinator Master
            </NavLink>

            <NavLink to="/home/shift-master" className={subMenuClass}>
              Shift Master
            </NavLink>

            <NavLink to="/home/center-master" className={subMenuClass}>
              Center Master
            </NavLink>
          </div>
        )}

        {/* ================= UPLOAD ================= */}

        <NavLink
          to="/home/upload-raw-data"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          onMouseMove={(e) => handleMouseMove(e, "Upload")}
          onMouseLeave={hideTooltip}
        >
          <FiUploadCloud className="menu-icon" />
          {sidebarOpen && <span>Upload</span>}
        </NavLink>
        {/* ================= VOLUNTEER ================= */}

        <div
          className={`menu-item ${volunteerActive ? "active" : ""}`}
          onClick={() => handleExpandableMenu("volunteer")}
          onMouseMove={(e) => handleMouseMove(e, "Volunteer Activities")}
          onMouseLeave={hideTooltip}
        >
          <div className="menu-left">
            <FiUsers className="menu-icon" />
            {sidebarOpen && <span>Volunteer Activities</span>}
          </div>

          {sidebarOpen &&
            (expandedMenu === "volunteer" ? (
              <FiChevronDown />
            ) : (
              <FiChevronRight />
            ))}
        </div>

        {expandedMenu === "volunteer" && (
          <div className="submenu">
            <NavLink to="/home/seva-allocation" className={subMenuClass}>
              Seva Allocation
            </NavLink>

            <NavLink to="/home/badge-generation" className={subMenuClass}>
              Badge Generation
            </NavLink>

            <NavLink to="/home/mark-attendance" className={subMenuClass}>
              Mark Attendance
            </NavLink>
          </div>
        )}

        {/* ================= OTHERS ================= */}

        <NavLink
          to="/home/alert-mails"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          onMouseMove={(e) => handleMouseMove(e, "Alert Mails")}
          onMouseLeave={hideTooltip}
        >
          <FiMail className="menu-icon" />
          {sidebarOpen && <span>Alert Mails</span>}
        </NavLink>

        <NavLink
          to="/home/attendance-report"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          onMouseMove={(e) => handleMouseMove(e, "Attendance Report")}
          onMouseLeave={hideTooltip}
        >
          <FiBarChart2 className="menu-icon" />
          {sidebarOpen && <span>Attendance Report</span>}
        </NavLink>

        <NavLink
          to="/home/settings"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          onMouseMove={(e) => handleMouseMove(e, "Settings")}
          onMouseLeave={hideTooltip}
        >
          <FiSettings className="menu-icon" />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>

      {/* ================= LOGOUT ================= */}

      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={() => setShowLogoutModal(true)}
          onMouseMove={(e) => handleMouseMove(e, "Logout")}
          onMouseLeave={hideTooltip}
        >
          <FiLogOut className="menu-icon logout-icon" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* ================= TOOLTIP ================= */}

      {tooltip.show && (
        <div
          className="cursor-tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* ================= LOGOUT MODAL ================= */}

      {showLogoutModal && (
        <div className="sidebar-logout-overlay">
          <div className="sidebar-logout-modal">
            <h4>Logout Confirmation</h4>

            <p>Are you sure you want to logout?</p>

            <div className="sidebar-logout-buttons">
              <button
                className="sidebar-logout-cancel-btn"
                onClick={cancelLogout}
              >
                Cancel
              </button>

              <button
                className="sidebar-logout-confirm-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
