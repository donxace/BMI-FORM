import { NavLink, Outlet } from "react-router-dom";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <div className="app-layout">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            PNP
          </div>

          <div>
            <h2>BMI System</h2>
            <span>Health Service</span>
          </div>
        </div>

        <nav className="navigation">

          <p className="nav-title">
            MAIN MENU
          </p>

          <NavLink
            to="/"
            className="nav-item"
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/measurement"
            className="nav-item"
          >
            <span>⚖</span>
            Measurement
          </NavLink>

          <NavLink
            to="/personnel"
            className="nav-item"
          >
            <span>♙</span>
            Personnel
          </NavLink>

          <NavLink
            to="/assessments"
            className="nav-item"
          >
            <span>▣</span>
            Assessments
          </NavLink>

          <NavLink
            to="/reports"
            className="nav-item"
          >
            <span>▤</span>
            Reports
          </NavLink>

          <NavLink
            to="/analytics"
            className="nav-item"
          >
            <span>◔</span>
            Analytics
          </NavLink>

          <p className="nav-title second">
            SYSTEM
          </p>

          <NavLink
            to="/settings"
            className="nav-item"
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

      <div className="app-main">

        <header className="topbar">

          <div className="page-heading">
            <h1>BMI Monitoring System</h1>
            <p>Health Service</p>
          </div>

          <div className="topbar-actions">

            <button className="notification-button">
              🔔
            </button>

            <div className="profile">

              <div className="profile-avatar">
                AD
              </div>

              <div className="profile-info">
                <strong>Administrator</strong>
                <small>Health Service</small>
              </div>

              <span className="profile-arrow">
                ▾
              </span>

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