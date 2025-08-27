const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'onda_services',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour initialiser les tables
const initializeTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Table des utilisateurs
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Table des services
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) DEFAULT '⚙️',
        status ENUM('Actif', 'Inactif') DEFAULT 'Actif',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Table des équipements
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS equipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        ip_address VARCHAR(15),
        status ENUM('Actif', 'Inactif') DEFAULT 'Actif',
        location VARCHAR(100),
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);

    // Table des logs d'activité
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(15),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Insérer des données de test
    await insertTestData(connection);
    
    connection.release();
    console.log('✅ Tables créées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
  }
};

// Fonction pour insérer des données de test
const insertTestData = async (connection) => {
  try {
    // Vérifier si l'admin existe déjà
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('admin', 'admin@onda.ma', ?, 'admin')
      `, [hashedPassword]);
      console.log('✅ Utilisateur admin créé');
    }

    // Vérifier si les services existent déjà
    const [services] = await connection.execute('SELECT COUNT(*) as count FROM services');
    if (services[0].count === 0) {
      await connection.execute(`
        INSERT INTO services (name, icon, status, description) VALUES 
        ('WiFi', '📶', 'Actif', 'Réseau WiFi de l\'aéroport'),
        ('Téléphonie', '📞', 'Actif', 'Services téléphoniques'),
        ('Caméras', '📹', 'Inactif', 'Système de surveillance'),
        ('Messagerie', '✉️', 'Actif', 'Service de messagerie interne'),
        ('Téléaffichage', '📺', 'Inactif', 'Écrans d\'affichage public')
      `);
      console.log('✅ Services de test ajoutés');
      
      // Ajouter des équipements de test
      await connection.execute(`
        INSERT INTO equipments (service_id, name, ip_address, status, location, model) VALUES 
        (1, 'Routeur WiFi A1', '192.168.1.1', 'Actif', 'Terminal 1', 'Cisco ISR4331'),
        (1, 'Routeur WiFi A2', '192.168.1.2', 'Inactif', 'Terminal 2', 'Cisco ISR4331'),
        (1, 'Point d\'accès B1', '192.168.1.10', 'Actif', 'Salle d\'attente', 'Ubiquiti UAP-AC-PRO'),
        (2, 'Central téléphonique', '192.168.2.1', 'Actif', 'Salle technique', 'Avaya IP Office'),
        (3, 'Caméra Entrée 1', '192.168.3.1', 'Actif', 'Entrée principale', 'Hikvision DS-2CD2185FWD-I'),
        (3, 'Caméra Hall A', '192.168.3.2', 'Inactif', 'Hall d\'arrivée', 'Hikvision DS-2CD2185FWD-I')
      `);
      console.log('✅ Équipements de test ajoutés');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
  }
};

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error);
  }
};

module.exports = {
  pool,
  initializeTables,
  testConnection
};

