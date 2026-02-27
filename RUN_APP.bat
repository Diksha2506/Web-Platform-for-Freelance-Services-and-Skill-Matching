@echo off
echo ===================================================
echo ⚡ SkillBridge - Startup Script
echo ===================================================

:: Step 1: Check Database Status
echo [1/3] Please ensure PostgreSQL (PgAdmin) is running.
echo      - Create a database named 'freelance_db' in PgAdmin.
echo      - Update .env file with your PostgreSQL password.
echo.

:: Step 2: Start Backend
echo [2/3] Starting Django Backend...
start cmd /k "cd Backend && ..\venv\Scripts\python.exe manage.py runserver 8000"

:: Step 3: Start Frontend
echo [3/3] Starting Frontend Server...
start cmd /k "cd Frontend && npm start"

echo.
echo ===================================================
echo 🚀 Servers are starting in new windows!
echo 📍 Frontend: http://localhost:3000
echo 📍 Backend API: http://localhost:8000/api
echo ===================================================
pause
