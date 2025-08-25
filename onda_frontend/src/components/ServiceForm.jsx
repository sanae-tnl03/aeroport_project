
import axios from 'axios';
import './ServiceForm.css';

import { useState, useEffect } from "react";

export default function ServiceForm({ serviceToEdit }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [status, setStatus] = useState("Actif");

  // ✅ Si on passe un service à modifier → remplir les champs
  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || "");
      setIcon(serviceToEdit.icon || "");
      setStatus(serviceToEdit.status || "Actif");
    }
  }, [serviceToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = serviceToEdit ? "PUT" : "POST";
    const url = serviceToEdit
      ? `http://localhost:5000/services/${serviceToEdit.id}` // update
      : "http://localhost:5000/services"; // add

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon, status }),
    });

    if (response.ok) {
      alert(serviceToEdit ? "✅ Service modifié !" : "✅ Service ajouté !");
    } else {
      alert("❌ Erreur lors de l'enregistrement du service.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{serviceToEdit ? "Modifier le Service" : "Ajouter un Service"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom :</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Icône :</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="ex: 📶"
          />
        </div>

        <div>
          <label>Statut :</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>

        <button type="submit">
          {serviceToEdit ? "Modifier" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
