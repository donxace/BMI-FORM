import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./PersonnelLayout.css";

export default function PersonnelLayout() {
  const navigate = useNavigate();

  const personnelName =
    localStorage.getItem("personnelName") || "Personnel";

  const handleLogout = () => {
    localStorage.removeItem("personnelAuthToken");
    localStorage.removeItem("personnelUserRole");
    localStorage.removeItem("personnelName");

    navigate("/login");
  };

  return (
    <div className="personnel-layout">
      <header className="personnel-topbar">
        <div className="personnel-branding">
          <img
            src="/PNP-ITMS-LOGO.png"
            alt="PNP ITMS BMI Logo"
            className="personnel-logo"
          />

          <div>
            <strong>My BMI Portal</strong>
            <small>PNP - ITMS Department</small>
          </div>
        </div>

        <div className="personnel-profile">
          <span>{personnelName}</span>

          <button className="personnel-logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <nav className="personnel-tabs">
        <NavLink
          to="/my/records"
          className={({ isActive }) =>
            `personnel-tab ${isActive ? "active" : ""}`
          }
        >
          My Records
        </NavLink>

        <NavLink
          to="/my/measurement"
          className={({ isActive }) =>
            `personnel-tab ${isActive ? "active" : ""}`
          }
        >
          My Measurement
        </NavLink>
      </nav>

      <main className="personnel-content">
        <Outlet />
      </main>
    </div>
  );
}
