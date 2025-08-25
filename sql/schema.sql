CREATE DATABASE onda_db;

USE onda_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);
USE onda_db;
SELECT * FROM users;
