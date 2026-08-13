import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Measurement from "./pages/Measurement";
import Personnel from "./pages/Personnel"
import Assessment from "./pages/Assessment"

function App() {
  return (
    <BrowserRouter>

      <Routes>

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
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;