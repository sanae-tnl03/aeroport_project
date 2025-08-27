import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les services et statistiques
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les services
        const servicesResponse = await fetch('http://localhost:5000/api/services');
        const servicesData = await servicesResponse.json();
        
        // Récupérer les statistiques
        const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: getAuthHeaders()
        });
        const statsData = await statsResponse.json();
        
        setServices(servicesData);
        setStats(statsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAuthHeaders]);

  const openServiceDetails = (serviceId, serviceName) => {
    navigate(`/service/${serviceName.toLowerCase()}?id=${serviceId}`);
  };

  const openServiceForm = () => {
    navigate('/service-form');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  return (
    <div className="home-container">
      {/* Header avec navigation */}
      <header className="header">
        <div className="logo-container">
          <img src="/onda.jpg" alt="ONDA" className="logo" />
        </div>
        <h1>Gestion des Services Aéroportuaires</h1>
        <div className="user-info">
          <span>Bienvenue, {user?.username}</span>
          <div className="nav-buttons">
            <button 
              className="nav-btn"
              onClick={() => navigate('/services')}
            >
              📊 Table des Services
            </button>
            <button 
              className="nav-btn logout-btn"
              onClick={handleLogout}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Statistiques en temps réel */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Services</h3>
            <p className="stat-number">{stats.services?.total || 0}</p>
            <small>{stats.services?.active || 0} actifs</small>
          </div>
          <div className="stat-card">
            <h3>Équipements</h3>
            <p className="stat-number">{stats.equipments?.total || 0}</p>
            <small>{stats.equipments?.active || 0} actifs</small>
          </div>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Liste des services */}
      <div className="services-container">
        {services.length > 0 ? (
          services.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => openServiceDetails(service.id, service.name)}
            >
              <div className="service-icon">{service.icon}</div>
              <h2>{service.name}</h2>
              <p className="service-description">{service.description}</p>
              <p>
                Statut:{' '}
                <span className={service.status === 'Actif' ? 'status-active' : 'status-inactive'}>
                  {service.status}
                </span>
              </p>
              {service.equipment_count !== undefined && (
                <p className="equipment-count">
                  📱 {service.equipment_count} équipement(s)
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="no-services">
            <p>Aucun service trouvé</p>
            <p>Commencez par ajouter votre premier service !</p>
          </div>
        )}
      </div>

      {/* Bouton d'ajout */}
      <button className="add-button" onClick={openServiceForm}>
        ➕ Ajouter un Service
      </button>

      {/* Activités récentes */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <div className="recent-activities">
          <h3>Activités récentes</h3>
          <div className="activities-list">
            {stats.recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-user">{activity.username || 'Système'}</span>
                <span className="activity-action">{activity.action}</span>
                <span className="activity-time">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
