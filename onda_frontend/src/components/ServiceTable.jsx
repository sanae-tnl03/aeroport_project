import { useEffect, useState } from 'react';
import axios from 'axios';
import './ServiceTable.css';

export default function ServiceTable() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/services')
      .then((res) => {
        setServices(res.data);
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des services :', err);
      });
  }, []);

  return (
    <div className="table-container">
      <h2>Liste des Services</h2>
      <table className="service-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={index}>
              <td>{service.nom}</td>
              <td className={service.statut === 'Actif' ? 'status-active' : 'status-inactive'}>
                {service.statut}
              </td>
              <td>
                <button className="btn-edit">Modifier</button>
                <button className="btn-delete">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

