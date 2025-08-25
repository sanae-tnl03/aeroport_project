@echo off
echo =========================================
echo Importation de la base de données ONDA...
echo =========================================

REM Chemin de mysql.exe
set MYSQL_PATH="D:\xampp\mysql\bin\mysql.exe"

REM Utilisateur MySQL (modifie si besoin)
set USER=root

echo.
echo --- Importation du schema.sql ---
%MYSQL_PATH% -u %USER% -p < sql\schema.sql

echo.
echo --- Importation du seed.sql ---
%MYSQL_PATH% -u %USER% -p < sql\seed.sql

echo.
echo =========================================
echo Importation terminée !
pause
