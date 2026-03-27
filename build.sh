#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# Build Frontend
cd frontend
npm ci
npm run build
cd ..

# Copy frontend build to backend
rm -rf backend/frontend_build
mkdir -p backend/frontend_build
cp -r frontend/build/* backend/frontend_build/

# Move to backend for Django tasks
cd backend
python manage.py collectstatic --no-input
# python manage.py migrate # Migrations are handled in settings.py or at startup
