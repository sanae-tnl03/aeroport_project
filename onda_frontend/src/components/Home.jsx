import './Home.css'; 
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const openServiceDetails = (serviceName) => {
    navigate(`/ServiceDetails/${serviceName}`);
  };

  const openServiceForm = () => {
    navigate('/ServiceForm');

  };

  const services = [
    { name: 'WiFi', icon: '📶', status: 'Actif' },
    { name: 'Téléphonie', icon: '📞', status: 'Actif' },
    { name: 'Caméras', icon: '📹', status: 'Inactif' },
    { name: 'Messagerie', icon: '✉', status: 'Actif' },
    { name: 'Téléaffichage', icon: '📺', status: 'Inactif' },
  ];

  return (
    <div>
      <header>
      <div className="logo-container">
        <img src="/onda.jpg" alt="ONDA" className="logo" />
      </div>
        <h1>Gestion des Services Aéroportuaires</h1>
      </header>
      <div className="services-container">
        {services.map((service) => (
          <div
            key={service.name}
            className="service-card"
            onClick={() => openServiceDetails(service.name.toLowerCase())}
          >
            <div className="service-icon">{service.icon}</div>
            <h2>{service.name}</h2>
            <p>
              Statut:{' '}
              <span className={service.status === 'Actif' ? 'status-active' : 'status-inactive'}>
                {service.status}
              </span>
            </p>
          </div>
        ))}
      </div>
      <button className="add-button" onClick={openServiceForm}>
        + Ajouter un Service
      </button>
    </div>
  );
}
