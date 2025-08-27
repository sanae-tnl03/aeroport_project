import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/home";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src="/onda.jpg" alt="logo" className="logo" />
      <h1>Connexion ONDA</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Nom d'utilisateur ou email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      
      <div className="demo-info">
        <p><strong>Comptes de démonstration :</strong></p>
        <p>Utilisateur : <code>admin</code></p>
        <p>Mot de passe : <code>admin123</code></p>
      </div>
    </div>
  );
}



