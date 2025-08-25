import './ServiceDetails.css';
import { useParams } from 'react-router-dom';

export default function ServiceDetails() {
  const { name } = useParams();

  // Exemple statique d'équipements — à remplacer plus tard par un `fetch` vers ton API
  const equipmentList = [
    { id: 1, nom: 'Routeur A1', statut: 'Actif', ip: '192.168.0.1' },
    { id: 2, nom: 'Routeur A2', statut: 'Inactif', ip: '192.168.0.2' },
    { id: 3, nom: 'Routeur B1', statut: 'Actif', ip: '192.168.0.3' },
  ];

  return (
    <div className="details-container">
      <h1>Détails du service : {name}</h1>

      <div className="equipment-list">
        {equipmentList.map((equipement) => (
          <div key={equipement.id} className="equipment-card">
            <h3>{equipement.nom}</h3>
            <p>IP : {equipement.ip}</p>
            <p>
              Statut :{' '}
              <span
                className={
                  equipement.statut === 'Actif' ? 'status-active' : 'status-inactive'
                }
              >
                {equipement.statut}
              </span>
            </p>
          </div>
        ))}
      </div>

      <button className="btn-edit">Modifier le service</button>
    </div>
  );
}
