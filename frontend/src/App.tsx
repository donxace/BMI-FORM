import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./components/MainLayout";

import Dashboard from "./pages/Dashboard";
import Measurement from "./pages/Measurement";
import Personnel from "./pages/Personnel";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            MAIN LAYOUT
        ====================================================== */}

        <Route element={<MainLayout />}>

          {/* Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Measurement */}
          <Route
            path="/measurement"
            element={<Measurement />}
          />

          {/* Personnel */}
          <Route
            path="/personnel"
            element={<Personnel />}
          />

          {/* Assessments */}
          <Route
            path="/assessments"
            element={<Assessment />}
          />

          {/* Reports */}
          <Route
            path="/report"
            element={<Report />}
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;