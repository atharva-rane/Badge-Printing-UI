import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiBell, FiChevronDown } from "react-icons/fi";
import { MdPrint } from "react-icons/md";
import "../../../styles/Navbar.css";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    // Close popup
    setShowLogoutModal(false);

    // Remove login data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Redirect to login page
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const goTo = (path) => {
    navigate(path);
    setProfileOpen(false);
  };

  return (
    <header className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FiMenu />
        </button>

        <div className="navbar-brand">
          <button className="nav-icon-btn">
            <MdPrint />
          </button>

          <div className="navbar-brand-text">
            <h2 style={{ color: "#2563eb" }}>Utsav</h2>
            <h4>Badge Printing</h4>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="navbar-search">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">
        <button className="nav-icon-btn">
          <FiBell />
          <span className="notification-dot"></span>
        </button>

        {/* PROFILE */}
        <div className="profile" onClick={() => setProfileOpen(!profileOpen)}>
          <img src="https://i.pravatar.cc/40" alt="user" />
          <span>Admin</span>
          <FiChevronDown />
        </div>

        {profileOpen && (
          <div className="profile-dropdown">
            <button onClick={() => goTo("user-profile")}>Profile</button>

            <button onClick={() => setShowLogoutModal(true)}>Logout</button>
          </div>
        )}
      </div>
      {showLogoutModal && (
        <div className="navbar-logout-overlay">
          <div className="navbar-logout-modal">
            <h4>Logout Confirmation</h4>

            <p>Are you sure you want to logout?</p>

            <div className="navbar-logout-buttons">
              <button
                className="navbar-logout-cancel-btn"
                onClick={cancelLogout}
              >
                Cancel
              </button>

              <button
                className="navbar-logout-confirm-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
