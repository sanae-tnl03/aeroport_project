import express from "express";
import mysql from "mysql2";
import cors from "cors";

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Route Login
app.post("/Login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ? AND password = ?", 
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Erreur serveur" });
      }
      if (results.length > 0) {
        res.json({ success: true, user: results[0] });
      } else {
        res.status(401).json({ success: false, message: "Identifiants invalides" });
      }
    }
  );
});

app.listen(5000, () => {
  console.log("🚀 Backend sur http://localhost:5000");
});

