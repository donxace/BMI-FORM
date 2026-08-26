import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    // Clear stored auth session
    localStorage.removeItem("authToken");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <nav className="navigation">
          <p className="nav-title">MAIN MENU</p>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/measurement"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>⚖</span>
            Measurement
          </NavLink>

          <NavLink
            to="/personnel"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>♙</span>
            Personnel
          </NavLink>

          <NavLink
            to="/assessments"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▣</span>
            Assessments
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▤</span>
            Reports
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>◔</span>
            Analytics
          </NavLink>

          <p className="nav-title second">SYSTEM</p>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>⚙</span>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="health-status">
            <span className="status-dot" />

            <div>
              <strong>System Online</strong>
              <small>All services operational</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-actions">

            {/* System Branding Section */}
            <div className="topbar-branding">
              <img
                src="/PNP-ITMS-BMI-LOGO.png"
                alt="PNP ITMS BMI Logo"
                className="topbar-logo"
              />

              <div className="branding-text">
                <strong>PNP AUTOMATED BMI SYSTEM</strong>
                <small>PNP - ITMS Department</small>
              </div>
            </div>

            {/* Profile Wrapper */}
            <div className="profile-wrapper">
              <div
                className="profile"
                onClick={() =>
                  setDropdownOpen((prev) => !prev)
                }
              >
                <div className="profile-avatar">
                  AD
                </div>

                <div className="profile-info">
                  <strong>Administrator</strong>
                  <small>Health Service</small>
                </div>

                <span
                  className={`profile-arrow ${
                    dropdownOpen ? "open" : ""
                  }`}
                >
                  ▾
                </span>
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown">
                  <button
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <span>➔</span>
                    Log Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}