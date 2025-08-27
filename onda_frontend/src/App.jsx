import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Login from "./components/Login";
import Home from "./components/Home";
import ServiceDetails from "./components/ServiceDetails";
import ServiceForm from "./components/ServiceForm";
import ServiceTable from "./components/ServiceTable";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirection de la racine vers login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Page Login accessible librement */}
          <Route path="/login" element={<Login />} />

          {/* Page Home protégée */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Détails d'un service */}
          <Route
            path="/service/:name"
            element={
              <ProtectedRoute>
                <ServiceDetails />
              </ProtectedRoute>
            }
          />

          {/* Formulaire d'ajout/modification de service */}
          <Route
            path="/service-form"
            element={
              <ProtectedRoute>
                <ServiceForm />
              </ProtectedRoute>
            }
          />
          
          {/* Edition d'un service */}
          <Route
            path="/service-form/:id"
            element={
              <ProtectedRoute>
                <ServiceForm />
              </ProtectedRoute>
            }
          />

          {/* Table des services */}
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <ServiceTable />
              </ProtectedRoute>
            }
          />

          {/* Route catch-all pour les pages non trouvées */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
