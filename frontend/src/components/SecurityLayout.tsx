import { useLayoutEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ShieldAlert,
  Thermometer,
  ChevronDown,
  LogOut,
} from "lucide-react";

// Same shared stroke width as the BMI sidebar, so switching between
// the two domains doesn't feel like a different icon set.
const NAV_ICON_PROPS = { size: 18, strokeWidth: 1.75 };
import "./MainLayout.css";
import "./SecurityLayout.css";

/*
 * Layout for the Security & Environment domain (Intrusion Detection,
 * Smoke & Temperature) — kept visually and structurally separate from
 * MainLayout (the BMI domain). Same shared backend/auth, same base
 * sidebar/topbar chrome (reuses MainLayout.css), but its own nav, its
 * own branding, and a distinct accent color (SecurityLayout.css) so
 * it reads as its own section rather than another BMI page.
 */
export default function SecurityLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Intrusion Detection and Environment Monitoring are separate roles
  // and sessions now, even though they still share this one layout's
  // chrome — logout has to clear whichever pair is actually active.
  const isEnvironmentDomain = location.pathname.startsWith(
    "/security/environment-monitoring"
  );

  const handleLogout = () => {
    if (isEnvironmentDomain) {
      localStorage.removeItem("environmentAuthToken");
      localStorage.removeItem("environmentUserRole");
      navigate("/security/environment-login");
    } else {
      localStorage.removeItem("intrusionAuthToken");
      localStorage.removeItem("intrusionUserRole");
      navigate("/security/intrusion-login");
    }
  };

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;

    if (!sidebar) {
      return;
    }

    const activeItem = sidebar.querySelector<HTMLElement>(
      ".nav-item.active"
    );

    if (!activeItem) {
      sidebar.style.setProperty("--nav-indicator-opacity", "0");
      return;
    }

    const sidebarRect = sidebar.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const indicatorHeight = 55;
    const top =
      itemRect.top -
      sidebarRect.top -
      (indicatorHeight - itemRect.height) / 2;

    sidebar.style.setProperty("--nav-indicator-top", `${top}px`);
    sidebar.style.setProperty("--nav-indicator-opacity", "1");
  }, [location.pathname]);

  return (
    <div className="app-layout security-domain">
      {/* Sidebar */}
      <aside className="sidebar security-sidebar" ref={sidebarRef}>
        <nav className="navigation">
          <p className="nav-title">SECURITY &amp; ENVIRONMENT</p>

          <NavLink
            to="/security/intrusion-detection"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span><ShieldAlert {...NAV_ICON_PROPS} /></span>
            <span className="nav-label">Intrusion Detection</span>
          </NavLink>

          <NavLink
            to="/security/environment-monitoring"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span><Thermometer {...NAV_ICON_PROPS} /></span>
            <span className="nav-label">Smoke &amp; Temperature</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="health-status">
            <span className="status-dot" />

            <div>
              <strong>Sensors Online</strong>
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
                src="/PNP-ITMS-LOGO.png"
                alt="PNP ITMS Logo"
                className="topbar-logo"
              />

              <div className="branding-text">
                <strong>FACILITY SECURITY &amp; ENVIRONMENT</strong>
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
                  <ChevronDown size={16} strokeWidth={1.75} />
                </span>
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown">
                  <button
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} strokeWidth={1.75} />
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
