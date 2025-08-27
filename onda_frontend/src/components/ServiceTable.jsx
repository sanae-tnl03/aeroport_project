import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './ServiceTable.css';

export default function ServiceTable() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Charger les services
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();

      if (response.ok) {
        setServices(data);
      } else {
        setError('Erreur lors du chargement des services');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Tous' || service.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Supprimer un service
  const handleDelete = async (serviceId, serviceName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setServices(services.filter(service => service.id !== serviceId));
        setShowDeleteConfirm(null);
        alert(`Service "${serviceName}" supprimé avec succès !`);
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // Navigation
  const handleEdit = (serviceId) => {
    navigate(`/service-form/${serviceId}`);
  };

  const handleViewDetails = (serviceId, serviceName) => {
    navigate(`/service/${serviceName.toLowerCase()}?id=${serviceId}`);
  };

  const handleAddNew = () => {
    navigate('/service-form');
  };

  if (loading) {
    return <div className="loading">Chargement de la table des services...</div>;
  }

  return (
    <div className="table-container">
      {/* Header */}
      <div className="table-header">
        <div className="header-left">
          <button onClick={() => navigate('/home')} className="back-button">
            ← Retour à l'accueil
          </button>
          <h1>📊 Gestion des Services</h1>
        </div>
        <button onClick={handleAddNew} className="btn-add-new">
          ➕ Nouveau Service
        </button>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">🟢 Actifs uniquement</option>
            <option value="Inactif">🔴 Inactifs uniquement</option>
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-number">{services.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{services.filter(s => s.status === 'Actif').length}</span>
          <span className="stat-label">Actifs</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{services.filter(s => s.status === 'Inactif').length}</span>
          <span className="stat-label">Inactifs</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredServices.length}</span>
          <span className="stat-label">Affichés</span>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && <div className="error-message">{error}</div>}

      {/* Table */}
      <div className="table-wrapper">
        {filteredServices.length > 0 ? (
          <table className="service-table">
            <thead>
              <tr>
                <th>Icône</th>
                <th>Nom du Service</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Équipements</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id} className="service-row">
                  <td className="icon-cell">
                    <span className="service-icon">{service.icon}</span>
                  </td>
                  <td className="name-cell">
                    <strong>{service.name}</strong>
                  </td>
                  <td className="description-cell">
                    {service.description ? (
                      <span className="description-text">
                        {service.description.length > 50 
                          ? `${service.description.substring(0, 50)}...` 
                          : service.description}
                      </span>
                    ) : (
                      <span className="no-description">Aucune description</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${service.status === 'Actif' ? 'status-active' : 'status-inactive'}`}>
                      {service.status === 'Actif' ? '🟢' : '🔴'} {service.status}
                    </span>
                  </td>
                  <td className="equipment-cell">
                    <span className="equipment-count">
                      📱 {service.equipment_count || 0}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(service.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewDetails(service.id, service.name)}
                        className="btn-view"
                        title="Voir les détails"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(service.id)}
                        className="btn-edit"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(service)}
                        className="btn-delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-services">
            {searchTerm || statusFilter !== 'Tous' ? (
              <div>
                <h3>Aucun service trouvé</h3>
                <p>Aucun service ne correspond à vos critères de recherche</p>
                <button onClick={() => { setSearchTerm(''); setStatusFilter('Tous'); }}>
                  🔄 Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div>
                <h3>Aucun service configuré</h3>
                <p>Commencez par ajouter votre premier service</p>
                <button onClick={handleAddNew}>
                  ➕ Créer un service
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmer la suppression</h3>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer le service :</p>
              <div className="service-to-delete">
                <span className="service-icon">{showDeleteConfirm.icon}</span>
                <strong>{showDeleteConfirm.name}</strong>
              </div>
              <p className="warning-text">
                ⚠️ Cette action supprimera également tous les équipements associés et ne peut pas être annulée.
              </p>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-cancel-delete"
              >
                ❌ Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.name)}
                className="btn-confirm-delete"
              >
                🗑️ Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}