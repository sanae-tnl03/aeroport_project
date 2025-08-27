import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './ServiceDetails.css';

export default function ServiceDetails() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('id');
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [service, setService] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    ip_address: '',
    status: 'Actif',
    location: '',
    model: ''
  });

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        
        if (!serviceId) {
          setError('ID du service manquant');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/services/${serviceId}`);
        const data = await response.json();

        if (response.ok) {
          setService(data);
          setEquipments(data.equipments || []);
        } else {
          setError(data.message || 'Erreur lors du chargement du service');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          service_id: serviceId,
          ...newEquipment
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Recharger les équipements
        const equipmentsResponse = await fetch(`http://localhost:5000/api/equipments/${serviceId}`);
        const equipmentsData = await equipmentsResponse.json();
        setEquipments(equipmentsData);
        
        // Réinitialiser le formulaire
        setNewEquipment({
          name: '',
          ip_address: '',
          status: 'Actif',
          location: '',
          model: ''
        });
        setShowAddEquipment(false);
        
        alert('Équipement ajouté avec succès !');
      } else {
        alert(data.message || 'Erreur lors de l\'ajout de l\'équipement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleEditService = () => {
    navigate(`/service-form/${serviceId}`);
  };

  if (loading) {
    return <div className="loading">Chargement des détails du service...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/home')} className="back-button">
          🏠 Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="error-container">
        <div className="error-message">Service non trouvé</div>
        <button onClick={() => navigate('/home')} className="back-button">
          🏠 Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="details-container">
      {/* Header avec navigation */}
      <div className="details-header">
        <button onClick={() => navigate('/home')} className="back-button">
          ← Retour
        </button>
        <h1>
          <span className="service-icon">{service.icon}</span>
          {service.name}
        </h1>
        <button onClick={handleEditService} className="btn-edit">
          ✏️ Modifier le service
        </button>
      </div>

      {/* Informations du service */}
      <div className="service-info">
        <div className="info-card">
          <h3>Informations générales</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Nom :</strong> {service.name}
            </div>
            <div className="info-item">
              <strong>Statut :</strong>{' '}
              <span className={service.status === 'Actif' ? 'status-active' : 'status-inactive'}>
                {service.status}
              </span>
            </div>
            <div className="info-item">
              <strong>Description :</strong> {service.description || 'Aucune description'}
            </div>
            <div className="info-item">
              <strong>Créé le :</strong>{' '}
              {new Date(service.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Section équipements */}
      <div className="equipments-section">
        <div className="equipments-header">
          <h2>Équipements ({equipments.length})</h2>
          <button 
            onClick={() => setShowAddEquipment(!showAddEquipment)}
            className="btn-add-equipment"
          >
            {showAddEquipment ? '❌ Annuler' : '➕ Ajouter un équipement'}
          </button>
        </div>

        {/* Formulaire d'ajout d'équipement */}
        {showAddEquipment && (
          <div className="add-equipment-form">
            <h3>Nouvel équipement</h3>
            <form onSubmit={handleAddEquipment}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Nom de l'équipement"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Adresse IP"
                  value={newEquipment.ip_address}
                  onChange={(e) => setNewEquipment({...newEquipment, ip_address: e.target.value})}
                />
                <select
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value})}
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
                <input
                  type="text"
                  placeholder="Emplacement"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Modèle"
                  value={newEquipment.model}
                  onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                  className="full-width"
                />
              </div>
              <button type="submit" className="btn-save">
                💾 Enregistrer l'équipement
              </button>
            </form>
          </div>
        )}

        {/* Liste des équipements */}
        <div className="equipment-list">
          {equipments.length > 0 ? (
            equipments.map((equipment) => (
              <div key={equipment.id} className="equipment-card">
                <div className="equipment-header">
                  <h3>{equipment.name}</h3>
                  <span className={equipment.status === 'Actif' ? 'status-active' : 'status-inactive'}>
                    {equipment.status}
                  </span>
                </div>
                <div className="equipment-details">
                  {equipment.ip_address && (
                    <p><strong>IP :</strong> {equipment.ip_address}</p>
                  )}
                  {equipment.location && (
                    <p><strong>Emplacement :</strong> {equipment.location}</p>
                  )}
                  {equipment.model && (
                    <p><strong>Modèle :</strong> {equipment.model}</p>
                  )}
                  <p><strong>Ajouté le :</strong> {new Date(equipment.created_at).toLocaleDateString()}</p>
                </div>
                <div className="equipment-actions">
                  <button className="btn-equipment-edit">✏️</button>
                  <button className="btn-equipment-delete">🗑️</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-equipment">
              <p>Aucun équipement configuré pour ce service</p>
              <p>Commencez par ajouter votre premier équipement !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
