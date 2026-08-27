import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- Import ProtectedRoute

import Dashboard from "./pages/Dashboard";
import Measurement from "./pages/Measurement";
import Personnel from "./pages/Personnel";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import Analytics from "./pages/Analytics";
import IntrusionDetection from "./pages/IntrusionDetection";
import SettingsPage from "./pages/SettingsPage";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route
          path="/login"
          element={<Login />}
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
              path="/intrusion-detection"
              element={<IntrusionDetection />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;