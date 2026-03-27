#!/usr/bin/env bash
set -o errexit

# Install backend dependencies
pip install -r backend/requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Debug (IMPORTANT - will show in Render logs)
echo "Listing frontend build:"
ls frontend/build
ls frontend/build/static

# Copy frontend build into backend
rm -rf backend/frontend_build
mkdir -p backend/frontend_build
cp -r frontend/build/* backend/frontend_build/

# Debug again
echo "Listing backend/frontend_build:"
ls backend/frontend_build
ls backend/frontend_build/static

# Django setup
cd backend
python manage.py collectstatic --noinput
