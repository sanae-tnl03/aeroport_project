const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initializeTables, testConnection } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware de logging
const logActivity = async (userId, action, details, ipAddress) => {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details, ipAddress]
    );
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error);
  }
};

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log de l'activité
    await logActivity(user.id, 'LOGIN', `Connexion réussie`, req.ip);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Routes des services
app.get('/api/services', async (req, res) => {
  try {
    const [services] = await pool.execute(`
      SELECT s.*, COUNT(e.id) as equipment_count 
      FROM services s 
      LEFT JOIN equipments e ON s.id = e.service_id 
      GROUP BY s.id 
      ORDER BY s.created_at DESC
    `);
    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [services] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);
    
    if (services.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    // Récupérer les équipements associés
    const [equipments] = await pool.execute(
      'SELECT * FROM equipments WHERE service_id = ? ORDER BY name',
      [id]
    );

    res.json({
      ...services[0],
      equipments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.post('/api/services', authenticateToken, async (req, res) => {
  try {
    const { name, icon, status, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Le nom du service est requis' });
    }

    const [result] = await pool.execute(
      'INSERT INTO services (name, icon, status, description) VALUES (?, ?, ?, ?)',
      [name, icon || '⚙️', status || 'Actif', description || '']
    );

    // Log de l'activité
    await logActivity(req.user.id, 'CREATE_SERVICE', `Service créé: ${name}`, req.ip);

    res.status(201).json({
      message: 'Service créé avec succès',
      serviceId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.put('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, status, description } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE services SET name = ?, icon = ?, status = ?, description = ? WHERE id = ?',
      [name, icon, status, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    // Log de l'activité
    await logActivity(req.user.id, 'UPDATE_SERVICE', `Service modifié: ${name}`, req.ip);

    res.json({ message: 'Service mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.delete('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le nom du service avant suppression
    const [services] = await pool.execute('SELECT name FROM services WHERE id = ?', [id]);
    
    if (services.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    const [result] = await pool.execute('DELETE FROM services WHERE id = ?', [id]);

    // Log de l'activité
    await logActivity(req.user.id, 'DELETE_SERVICE', `Service supprimé: ${services[0].name}`, req.ip);

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Routes des équipements
app.get('/api/equipments/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const [equipments] = await pool.execute(
      'SELECT * FROM equipments WHERE service_id = ? ORDER BY name',
      [serviceId]
    );
    res.json(equipments);
  } catch (error) {
    console.error('Erreur lors de la récupération des équipements:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.post('/api/equipments', authenticateToken, async (req, res) => {
  try {
    const { service_id, name, ip_address, status, location, model } = req.body;
    
    if (!service_id || !name) {
      return res.status(400).json({ message: 'ID du service et nom requis' });
    }

    const [result] = await pool.execute(
      'INSERT INTO equipments (service_id, name, ip_address, status, location, model) VALUES (?, ?, ?, ?, ?, ?)',
      [service_id, name, ip_address, status || 'Actif', location, model]
    );

    // Log de l'activité
    await logActivity(req.user.id, 'CREATE_EQUIPMENT', `Équipement ajouté: ${name}`, req.ip);

    res.status(201).json({
      message: 'Équipement ajouté avec succès',
      equipmentId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route de statistiques
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Compter les services
    const [servicesCount] = await pool.execute('SELECT COUNT(*) as count FROM services');
    const [servicesActive] = await pool.execute('SELECT COUNT(*) as count FROM services WHERE status = "Actif"');
    
    // Compter les équipements
    const [equipmentsCount] = await pool.execute('SELECT COUNT(*) as count FROM equipments');
    const [equipmentsActive] = await pool.execute('SELECT COUNT(*) as count FROM equipments WHERE status = "Actif"');
    
    // Activités récentes
    const [recentActivities] = await pool.execute(`
      SELECT al.*, u.username 
      FROM activity_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.created_at DESC 
      LIMIT 10
    `);

    res.json({
      services: {
        total: servicesCount[0].count,
        active: servicesActive[0].count
      },
      equipments: {
        total: equipmentsCount[0].count,
        active: equipmentsActive[0].count
      },
      recentActivities
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API ONDA Services fonctionne correctement!' });
});

// Initialiser la base de données au démarrage
const startServer = async () => {
  try {
    await testConnection();
    await initializeTables();
    app.get('/', (req, res) => {
  res.json({
    message: 'API ONDA Services',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      services: '/api/services',
      auth: '/api/auth/login',
      dashboard: '/api/dashboard/stats'
    },
    status: 'Serveur fonctionnel ✅'
  });
});
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Base de données MySQL connectée`);
      console.log(`🌐 API accessible sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
