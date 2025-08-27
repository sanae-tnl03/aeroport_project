import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './ServiceForm.css';

export default function ServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAuthHeaders } = useAuth();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    icon: '⚙️',
    status: 'Actif',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Icônes prédéfinies
  const availableIcons = [
    '📶', '📞', '📹', '✉️', '📺', '⚙️', '💻', '📡', 
    '🔒', '🌐', '📊', '🖥️', '📱', '⚡', '🔧', '📋'
  ];

  // Charger les données du service si en mode édition
  useEffect(() => {
    if (isEditing && id) {
      const fetchService = async () => {
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:5000/api/services/${id}`);
          const data = await response.json();

          if (response.ok) {
            setFormData({
              name: data.name || '',
              icon: data.icon || '⚙️',
              status: data.status || 'Actif',
              description: data.description || ''
            });
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

      fetchService();
    }
  }, [isEditing, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleIconSelect = (icon) => {
    setFormData(prev => ({
      ...prev,
      icon: icon
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom du service est obligatoire');
      setLoading(false);
      return;
    }

    try {
      const url = isEditing 
        ? `http://localhost:5000/api/services/${id}`
        : 'http://localhost:5000/api/services';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditing 
            ? 'Service modifié avec succès !' 
            : 'Service créé avec succès !'
        );
        
        // Redirection après 1.5 secondes
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/home');
  };

  if (loading && isEditing) {
    return <div className="loading">Chargement du service...</div>;
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <button onClick={handleCancel} className="back-button">
            ← Retour
          </button>
          <h1>
            {isEditing ? '✏️ Modifier le Service' : '➕ Nouveau Service'}
          </h1>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="service-form">
          {/* Nom du service */}
          <div className="form-group">
            <label htmlFor="name">
              <strong>Nom du service *</strong>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: WiFi, Téléphonie, Caméras..."
              required
              disabled={loading}
            />
          </div>

          {/* Sélection d'icône */}
          <div className="form-group">
            <label>
              <strong>Icône</strong>
            </label>
            <div className="icon-preview">
              Icône sélectionnée : <span className="selected-icon">{formData.icon}</span>
            </div>
            <div className="icon-selector">
              {availableIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => handleIconSelect(icon)}
                  disabled={loading}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div className="form-group">
            <label htmlFor="status">
              <strong>Statut</strong>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="Actif">🟢 Actif</option>
              <option value="Inactif">🔴 Inactif</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">
              <strong>Description</strong>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description détaillée du service..."
              rows={4}
              disabled={loading}
            />
            <small className="form-help">
              Décrivez brièvement ce service et son rôle dans l'aéroport
            </small>
          </div>

          {/* Boutons d'action */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={loading}
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading 
                ? '⏳ Enregistrement...' 
                : isEditing 
                  ? '💾 Modifier' 
                  : '💾 Créer'
              }
            </button>
          </div>
        </form>

        {/* Aperçu du service */}
        <div className="service-preview">
          <h3>Aperçu du service</h3>
          <div className="preview-card">
            <div className="preview-icon">{formData.icon}</div>
            <h4>{formData.name || 'Nom du service'}</h4>
            <p>{formData.description || 'Description du service'}</p>
            <span className={`preview-status ${formData.status === 'Actif' ? 'active' : 'inactive'}`}>
              {formData.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}