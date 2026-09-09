import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Scale,
  Users,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
  ScrollText,
  Menu,
  KeyRound,
} from "lucide-react";

// A single shared stroke width keeps every sidebar icon reading as
// one deliberate set instead of whatever each icon's default happens
// to be.
const NAV_ICON_PROPS = { size: 18, strokeWidth: 1.75 };
import "./MainLayout.css";
import { findAuthLogsSession } from "../utils/adminSession";

// Topbar subtitle swaps to name whichever system the current page
// belongs to, rather than always reading "BMI SYSTEM" once other
// domains (like Hardware Inventory) share this same layout.
const SYSTEM_LABELS: { path: string; label: string }[] = [
  { path: "/inventory", label: "COMPUTER HARDWARE INVENTORY SYSTEM" },
  { path: "/pc-info", label: "PC INFORMATION SYSTEM" },
];

const DEFAULT_SYSTEM_LABEL = "PNP AUTOMATED BMI SYSTEM";

function getSystemLabel(pathname: string): string {
  const match = SYSTEM_LABELS.find(({ path }) => pathname.startsWith(path));
  return match?.label ?? DEFAULT_SYSTEM_LABEL;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Below the sidebar's collapse breakpoint (see MainLayout.css), the
  // 240px fixed sidebar becomes an off-canvas drawer toggled by this —
  // without it, a 240px sidebar would eat most of a 375px phone screen.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const systemLabel = getSystemLabel(location.pathname);
  const isInventoryDomain = location.pathname.startsWith("/inventory");
  const isPcInfoDomain = location.pathname.startsWith("/pc-info");
  // Auth Logs is reachable by the literal 'admin' super-role (sees every
  // domain) or by this domain's own "_admin" role (sees just its own
  // domain) — findAuthLogsSession checks all 5 session-key pairs, since
  // 'admin' specifically can be signed in through any one of them.
  const canViewAuthLogs = findAuthLogsSession() !== null;

  const handleLogout = () => {
    // Each domain sharing this layout keeps its own session keys and
    // login page, so logout has to clear the pair for whichever domain
    // is actually active rather than always the BMI ones.
    if (isInventoryDomain) {
      localStorage.removeItem("inventoryAuthToken");
      localStorage.removeItem("inventoryUserRole");
      navigate("/inventory/login");
    } else if (isPcInfoDomain) {
      localStorage.removeItem("pcInfoAuthToken");
      localStorage.removeItem("pcInfoUserRole");
      navigate("/pc-info/login");
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  /*
   * ============================================================
   * SLIDING NAV HIGHLIGHT
   *
   * Measures the active .nav-item's actual position instead of
   * relying on a hardcoded pixel offset per route — so the
   * highlight stays aligned no matter how many menu items exist
   * or get added later.
   * ============================================================
   */

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

  // Close the mobile drawer automatically after navigating, so it
  // doesn't stay open covering the new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout theme-blue">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
        ref={sidebarRef}
      >
        <nav className="navigation">
          {!isInventoryDomain && !isPcInfoDomain && (
            <>
              <p className="nav-title">MAIN MENU</p>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><LayoutDashboard {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/measurement"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><Scale {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Measurement</span>
              </NavLink>

              <NavLink
                to="/personnel"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><Users {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Personnel</span>
              </NavLink>

              <NavLink
                to="/assessments"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><ClipboardCheck {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Assessments</span>
              </NavLink>

              <NavLink
                to="/report"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><FileText {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Reports</span>
              </NavLink>

              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><BarChart3 {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Analytics</span>
              </NavLink>
            </>
          )}

          {isInventoryDomain && (
            <>
              <p className="nav-title">INVENTORY</p>

              <NavLink
                to="/inventory/dashboard"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><LayoutDashboard {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/inventory/personnel"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><Users {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Personnel</span>
              </NavLink>

              <NavLink
                to="/inventory/report"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><FileText {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Reports</span>
              </NavLink>

              <NavLink
                to="/inventory/analytics"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><BarChart3 {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Analytics</span>
              </NavLink>
            </>
          )}

          {isPcInfoDomain && (
            <>
              <p className="nav-title">OVERVIEW</p>

              <NavLink
                to="/pc-info/dashboard"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><LayoutDashboard {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/pc-info/analytics"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><BarChart3 {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Analytics</span>
              </NavLink>

              <NavLink
                to="/pc-info/report"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><FileText {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Reports</span>
              </NavLink>
            </>
          )}

          {!isInventoryDomain && !isPcInfoDomain && (
            <>
              <p className="nav-title second">SYSTEM</p>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><SettingsIcon {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Settings</span>
              </NavLink>
            </>
          )}

          {/* Shown in every domain that uses this layout (BMI, Inventory,
              PC Info) — not just BMI — since the super-admin can land in
              any of them, and each domain's own admin sees it here too. */}
          {canViewAuthLogs && (
            <>
              <p className="nav-title second">ADMIN</p>

              {isPcInfoDomain &&
                (localStorage.getItem("pcInfoUserRole") === "pcinfo_admin" ||
                  localStorage.getItem("pcInfoUserRole") === "admin") && (
                  <NavLink
                    to="/pc-info/registration-keys"
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <span><KeyRound {...NAV_ICON_PROPS} /></span>
                    <span className="nav-label">Registration Keys</span>
                  </NavLink>
                )}

              <NavLink
                to={
                  isInventoryDomain
                    ? "/inventory/auth-logs"
                    : isPcInfoDomain
                    ? "/pc-info/auth-logs"
                    : "/auth-logs"
                }
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span><ScrollText {...NAV_ICON_PROPS} /></span>
                <span className="nav-label">Auth Logs</span>
              </NavLink>
            </>
          )}
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

            {/* Mobile sidebar toggle — hidden above the collapse
                breakpoint, see MainLayout.css */}
            <button
              type="button"
              className="menu-toggle-button"
              aria-label="Toggle navigation menu"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>

            {/* System Branding Section */}
            <div className="topbar-branding">
              <img
                src="/PNP-ITMS-LOGO.png"
                alt="PNP ITMS BMI Logo"
                className="topbar-logo"
              />

            
              <div className="branding-text">
                <strong>PNP - ITMS DEPARTMENT</strong>
                <small>{systemLabel}</small>
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