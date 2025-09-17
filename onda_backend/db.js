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
  queueLimit: 0,
  charset: 'utf8mb4'
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
        role ENUM('admin', 'user', 'operator') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Table des équipements avec contraintes améliorées
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS equipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45), -- Support IPv6
        status ENUM('Actif', 'Inactif') DEFAULT 'Actif',
        location VARCHAR(200),
        model VARCHAR(100),
        manufacturer VARCHAR(100),
        serial_number VARCHAR(100),
        installation_date DATE,
        last_maintenance DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_service_id (service_id),
        INDEX idx_status (status),
        INDEX idx_name (name),
        INDEX idx_ip_address (ip_address)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Table des logs d'activité
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Créer les triggers pour mise à jour automatique des statuts
    await createStatusUpdateTriggers(connection);
    
    // Insérer des données de test
    await insertTestData(connection);
    
    connection.release();
    console.log('✅ Tables créées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
};

// Fonction pour créer les triggers de mise à jour automatique
const createStatusUpdateTriggers = async (connection) => {
  try {
    // Supprimer les triggers existants s'ils existent
    await connection.execute('DROP TRIGGER IF EXISTS update_service_status_after_equipment_change');
    await connection.execute('DROP TRIGGER IF EXISTS update_service_status_after_equipment_insert');
    await connection.execute('DROP TRIGGER IF EXISTS update_service_status_after_equipment_delete');

    // Trigger après mise à jour d'équipement
    await connection.execute(`
      CREATE TRIGGER update_service_status_after_equipment_change
      AFTER UPDATE ON equipments
      FOR EACH ROW
      BEGIN
        DECLARE service_status VARCHAR(20);
        DECLARE inactive_count INT DEFAULT 0;
        
        -- Compter les équipements inactifs pour ce service
        SELECT COUNT(*) INTO inactive_count
        FROM equipments 
        WHERE service_id = NEW.service_id AND status = 'Inactif';
        
        -- Déterminer le nouveau statut du service
        IF inactive_count > 0 THEN
          SET service_status = 'Inactif';
        ELSE
          SET service_status = 'Actif';
        END IF;
        
        -- Mettre à jour le service seulement si le statut a changé
        UPDATE services 
        SET status = service_status, updated_at = NOW()
        WHERE id = NEW.service_id AND status != service_status;
      END
    `);

    // Trigger après insertion d'équipement
    await connection.execute(`
      CREATE TRIGGER update_service_status_after_equipment_insert
      AFTER INSERT ON equipments
      FOR EACH ROW
      BEGIN
        DECLARE service_status VARCHAR(20);
        DECLARE inactive_count INT DEFAULT 0;
        
        SELECT COUNT(*) INTO inactive_count
        FROM equipments 
        WHERE service_id = NEW.service_id AND status = 'Inactif';
        
        IF inactive_count > 0 THEN
          SET service_status = 'Inactif';
        ELSE
          SET service_status = 'Actif';
        END IF;
        
        UPDATE services 
        SET status = service_status, updated_at = NOW()
        WHERE id = NEW.service_id AND status != service_status;
      END
    `);

    // Trigger après suppression d'équipement
    await connection.execute(`
      CREATE TRIGGER update_service_status_after_equipment_delete
      AFTER DELETE ON equipments
      FOR EACH ROW
      BEGIN
        DECLARE service_status VARCHAR(20);
        DECLARE inactive_count INT DEFAULT 0;
        DECLARE equipment_count INT DEFAULT 0;
        
        -- Compter le nombre total d'équipements restants
        SELECT COUNT(*) INTO equipment_count
        FROM equipments 
        WHERE service_id = OLD.service_id;
        
        -- Si plus d'équipements, le service redevient actif par défaut
        IF equipment_count = 0 THEN
          SET service_status = 'Actif';
        ELSE
          -- Compter les équipements inactifs
          SELECT COUNT(*) INTO inactive_count
          FROM equipments 
          WHERE service_id = OLD.service_id AND status = 'Inactif';
          
          IF inactive_count > 0 THEN
            SET service_status = 'Inactif';
          ELSE
            SET service_status = 'Actif';
          END IF;
        END IF;
        
        UPDATE services 
        SET status = service_status, updated_at = NOW()
        WHERE id = OLD.service_id AND status != service_status;
      END
    `);

    console.log('✅ Triggers de mise à jour automatique créés');
  } catch (error) {
    console.error('❌ Erreur lors de la création des triggers:', error);
    // Les triggers ne sont pas critiques, on continue
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
      const operatorPassword = await bcrypt.hash('operator123', 10);
      
      await connection.execute(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('admin', 'admin@onda.ma', ?, 'admin'),
        ('operator', 'operator@onda.ma', ?, 'operator')
      `, [hashedPassword, operatorPassword]);
      
      console.log('✅ Utilisateurs créés:');
      console.log('   - Admin: admin@onda.ma / admin123');
      console.log('   - Opérateur: operator@onda.ma / operator123');
    }

    // Vérifier si les services existent déjà
    const [services] = await connection.execute('SELECT COUNT(*) as count FROM services');
    if (services[0].count === 0) {
      await connection.execute(`
        INSERT INTO services (name, icon, status, description) VALUES 
        ('WiFi', '📶', 'Actif', 'Réseau sans fil haute vitesse pour passagers et personnel de l\'aéroport'),
        ('Téléphonie', '📞', 'Actif', 'Système de communication téléphonique interne et externe'),
        ('Caméras de Surveillance', '📹', 'Actif', 'Système de vidéosurveillance pour la sécurité de l\'aéroport'),
        ('Messagerie Interne', '✉️', 'Actif', 'Service de messagerie électronique pour le personnel'),
        ('Téléaffichage', '📺', 'Actif', 'Écrans d\'affichage pour informations voyageurs et annonces')
      `);
      
      console.log('✅ Services de test créés');
      
      // Récupérer les IDs des services pour les équipements
      const [servicesList] = await connection.execute('SELECT id, name FROM services ORDER BY id');
      
      // Ajouter des équipements de test avec une répartition réaliste
      const equipments = [
        // WiFi (Service 1) - 1 équipement inactif sur 4
        [servicesList[0].id, 'Routeur Principal WiFi', '192.168.1.1', 'Actif', 'Salle technique Terminal 1', 'Cisco ISR4331', 'Cisco', 'C4331-001', '2023-01-15'],
        [servicesList[0].id, 'Point d\'accès Zone A', '192.168.1.10', 'Actif', 'Terminal 1 - Zone A', 'Ubiquiti UAP-AC-PRO', 'Ubiquiti', 'UAP-001', '2023-02-01'],
        [servicesList[0].id, 'Point d\'accès Zone B', '192.168.1.11', 'Actif', 'Terminal 1 - Zone B', 'Ubiquiti UAP-AC-PRO', 'Ubiquiti', 'UAP-002', '2023-02-01'],
        [servicesList[0].id, 'Routeur Backup', '192.168.1.2', 'Inactif', 'Salle technique Terminal 2', 'Cisco ISR4331', 'Cisco', 'C4331-002', '2023-01-20'],
        
        // Téléphonie (Service 2) - Tous actifs
        [servicesList[1].id, 'Central Téléphonique Principal', '192.168.2.1', 'Actif', 'Salle serveur principale', 'Avaya IP Office 500', 'Avaya', 'IPO-001', '2023-01-10'],
        [servicesList[1].id, 'Passerelle VoIP Terminal 1', '192.168.2.10', 'Actif', 'Terminal 1 - Réception', 'Cisco SPA504G', 'Cisco', 'SPA-001', '2023-01-25'],
        [servicesList[1].id, 'Passerelle VoIP Terminal 2', '192.168.2.11', 'Actif', 'Terminal 2 - Réception', 'Cisco SPA504G', 'Cisco', 'SPA-002', '2023-01-25'],
        
        // Caméras (Service 3) - 1 inactif sur 5
        [servicesList[2].id, 'Caméra Entrée Principale', '192.168.3.1', 'Actif', 'Entrée principale', 'Hikvision DS-2CD2185FWD-I', 'Hikvision', 'HIK-001', '2023-01-05'],
        [servicesList[2].id, 'Caméra Hall Arrivée', '192.168.3.2', 'Actif', 'Hall d\'arrivée', 'Hikvision DS-2CD2185FWD-I', 'Hikvision', 'HIK-002', '2023-01-05'],
        [servicesList[2].id, 'Caméra Hall Départ', '192.168.3.3', 'Actif', 'Hall de départ', 'Hikvision DS-2CD2185FWD-I', 'Hikvision', 'HIK-003', '2023-01-05'],
        [servicesList[2].id, 'Caméra Parking', '192.168.3.4', 'Inactif', 'Parking extérieur', 'Hikvision DS-2CD2185FWD-I', 'Hikvision', 'HIK-004', '2023-01-08'],
        [servicesList[2].id, 'Caméra Piste', '192.168.3.5', 'Actif', 'Vue piste d\'atterrissage', 'Hikvision DS-2CD2185FWD-I', 'Hikvision', 'HIK-005', '2023-01-10'],
        
        // Messagerie (Service 4) - Tous actifs
        [servicesList[3].id, 'Serveur Mail Principal', '192.168.4.1', 'Actif', 'Salle serveur principale', 'Microsoft Exchange 2019', 'Microsoft', 'EXC-001', '2023-01-01'],
        [servicesList[3].id, 'Serveur Mail Backup', '192.168.4.2', 'Actif', 'Salle serveur secondaire', 'Microsoft Exchange 2019', 'Microsoft', 'EXC-002', '2023-01-01'],
        
        // Téléaffichage (Service 5) - 2 inactifs sur 6
        [servicesList[4].id, 'Écran Principal Arrivées', '192.168.5.1', 'Actif', 'Hall d\'arrivée - Central', 'Samsung UH55F-E', 'Samsung', 'SAM-001', '2023-02-01'],
        [servicesList[4].id, 'Écran Principal Départs', '192.168.5.2', 'Actif', 'Hall de départ - Central', 'Samsung UH55F-E', 'Samsung', 'SAM-002', '2023-02-01'],
        [servicesList[4].id, 'Écran Porte A1-A5', '192.168.5.3', 'Actif', 'Zone embarquement A', 'Samsung UH43F-E', 'Samsung', 'SAM-003', '2023-02-05'],
        [servicesList[4].id, 'Écran Porte B1-B5', '192.168.5.4', 'Inactif', 'Zone embarquement B', 'Samsung UH43F-E', 'Samsung', 'SAM-004', '2023-02-05'],
        [servicesList[4].id, 'Écran Bagages Carrousel 1', '192.168.5.5', 'Actif', 'Récupération bagages 1', 'Samsung UH43F-E', 'Samsung', 'SAM-005', '2023-02-10'],
        [servicesList[4].id, 'Écran Bagages Carrousel 2', '192.168.5.6', 'Inactif', 'Récupération bagages 2', 'Samsung UH43F-E', 'Samsung', 'SAM-006', '2023-02-10']
      ];

      for (const equipment of equipments) {
        await connection.execute(`
          INSERT INTO equipments (service_id, name, ip_address, status, location, model, manufacturer, serial_number, installation_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, equipment);
      }
      
      console.log('✅ Équipements de test créés avec statuts réalistes');
      
      // Forcer la mise à jour des statuts des services après insertion
      await updateAllServiceStatuses(connection);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
    throw error;
  }
};

// Fonction pour mettre à jour tous les statuts des services
const updateAllServiceStatuses = async (connection) => {
  try {
    const [services] = await connection.execute('SELECT id FROM services');
    
    for (const service of services) {
      const [equipments] = await connection.execute(
        'SELECT status FROM equipments WHERE service_id = ?',
        [service.id]
      );
      
      let newStatus = 'Actif';
      if (equipments.length > 0) {
        const hasInactiveEquipment = equipments.some(eq => eq.status === 'Inactif');
        if (hasInactiveEquipment) {
          newStatus = 'Inactif';
        }
      }
      
      await connection.execute(
        'UPDATE services SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, service.id]
      );
    }
    
    console.log('✅ Statuts des services mis à jour automatiquement');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des statuts:', error);
  }
};

// Test de connexion amélioré
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Test de la connexion avec une requête simple
    const [result] = await connection.execute('SELECT 1 as test');
    
    if (result[0].test === 1) {
      console.log('✅ Connexion MySQL établie avec succès');
      console.log(`📊 Base de données: ${dbConfig.database}`);
      console.log(`🌐 Serveur: ${dbConfig.host}:${dbConfig.port}`);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    console.error('🔧 Vérifiez votre configuration dans le fichier .env');
    return false;
  }
};

// Fonction utilitaire pour nettoyer les anciens logs
const cleanOldLogs = async (daysToKeep = 30) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysToKeep]
    );
    
    if (result.affectedRows > 0) {
      console.log(`🧹 ${result.affectedRows} anciens logs supprimés`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des logs:', error);
  }
};

module.exports = {
  pool,
  initializeTables,
  testConnection,
  cleanOldLogs,
  dbConfig
};