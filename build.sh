#!/usr/bin/env bash
set -o errexit

pip install -r backend/requirements.txt

cd frontend
npm ci
npm run build
cd ..

rm -rf backend/frontend_build
mkdir -p backend/frontend_build
cp -r frontend/build/* backend/frontend_build/

cd backend
python manage.py migrate
python manage.py collectstatic --no-input
