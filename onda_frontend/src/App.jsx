import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Login from "./components/Login";            // ton vrai Login.jsx
import Home from "./components/Home";              // ton Home.jsx
import ServiceDetails from "./components/ServiceDetails"; // ton ServiceDetails.jsx
import ServiceForm from "./components/ServiceForm";       // ton ServiceForm.jsx
import ServiceTable from "./components/ServiceTable";     // ton ServiceTable.jsx

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page Login accessible librement */}
          <Route path="/Login" element={<Login />} />

          {/* Page Home protégée */}
          <Route
            path="/Home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Détails d’un service */}
          <Route
            path="/ServiceDetails/:name"
            element={
              <ProtectedRoute>
                <ServiceDetails />
              </ProtectedRoute>
            }
          />

          {/* Formulaire d’ajout/modification de service */}
          <Route
            path=" D:\MGSI2\STAGE\Onda_project\onda_frontend\src\components\ServiceForm.jsx"
            element={
              <ProtectedRoute>
                <ServiceForm />
              </ProtectedRoute>
            }
          />

          {/* Table des services par défaut (quand on va sur "/") */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ServiceTable />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

