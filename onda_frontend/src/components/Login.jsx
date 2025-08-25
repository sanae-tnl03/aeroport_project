import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ici tu peux tester un login simple (à remplacer par backend plus tard)
    if (username === "admin" && password === "admin") {
      login(); // change l’état à "authentifié"
      navigate("/home"); // redirection
    } else {
      alert("Identifiants incorrects !");
    }
  };

  return (
    <div className="login-container">
      <img src="/onda.jpg" alt="logo" className="logo" />
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}



