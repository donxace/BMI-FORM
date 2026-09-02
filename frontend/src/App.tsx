import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./components/MainLayout";
import SecurityLayout from "./components/SecurityLayout";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- Import ProtectedRoute
import SecurityProtectedRoute from "./components/SecurityProtectedRoute";
import PersonnelProtectedRoute from "./components/PersonnelProtectedRoute";
import PersonnelLayout from "./components/PersonnelLayout";

import Dashboard from "./pages/Dashboard";
import Measurement from "./pages/Measurement";
import Personnel from "./pages/Personnel";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import Analytics from "./pages/Analytics";
import IntrusionDetection from "./pages/IntrusionDetection";
import EnvironmentMonitoring from "./pages/EnvironmentMonitoring";
import SettingsPage from "./pages/SettingsPage";
import Login from "./pages/Login";
import SecurityLogin from "./pages/SecurityLogin";
import MyRecords from "./pages/MyRecords";
import MyMeasurement from "./pages/MyMeasurement";
import Kiosk from "./pages/Kiosk";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Public, unattended touch kiosk — tap RFID to measure */}
        <Route
          path="/kiosk"
          element={<Kiosk />}
        />

        {/* =====================================================
            PROTECTED ROUTES (Requires valid login token)
        ====================================================== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/measurement"
              element={<Measurement />}
            />

            <Route
              path="/personnel"
              element={<Personnel />}
            />

            <Route
              path="/assessments"
              element={<Assessment />}
            />

            <Route
              path="/report"
              element={<Report />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Route>
        </Route>

        {/* =====================================================
            SECURITY & ENVIRONMENT DOMAIN
            Fully separate authentication from the BMI system above —
            its own login page and its own session/token, even though
            it shares the same backend and account table for now.
        ====================================================== */}
        <Route
          path="/security/login"
          element={<SecurityLogin />}
        />

        <Route element={<SecurityProtectedRoute />}>
          <Route element={<SecurityLayout />}>

            <Route
              path="/security"
              element={<Navigate to="/security/intrusion-detection" replace />}
            />

            <Route
              path="/security/intrusion-detection"
              element={<IntrusionDetection />}
            />

            <Route
              path="/security/environment-monitoring"
              element={<EnvironmentMonitoring />}
            />

          </Route>
        </Route>

        {/* =====================================================
            PERSONNEL SELF-SERVICE ROUTES (RFID + PIN login)
        ====================================================== */}
        <Route element={<PersonnelProtectedRoute />}>
          <Route element={<PersonnelLayout />}>

            <Route
              path="/my/records"
              element={<MyRecords />}
            />

            <Route
              path="/my/measurement"
              element={<MyMeasurement />}
            />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;