const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",   // adapte si ton mot de passe est différent
  database: "onda_db"
});

connection.connect((err) => {
  if (err) {
    console.error("Erreur connexion DB:", err);
    return;
  }
  console.log("✅ Connecté à MySQL");
});

module.exports = connection;

