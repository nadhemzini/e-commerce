#!/bin/bash
set -e
mkdir -p /opt/ecommerce
cd /opt/ecommerce

echo "Installing docker-compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Downloading deployment files..."
aws s3 cp s3://app-assets-nadhem-new/deploy.zip .
aws s3 cp s3://app-assets-nadhem-new/.env.prod .

echo "Extracting..."
unzip -o deploy.zip || true

echo "Starting containers..."
/usr/local/bin/docker-compose -f docker-compose.prod.yml down || true
/usr/local/bin/docker-compose -f docker-compose.prod.yml up --build -d

echo "Waiting 15s for DB connection..."
sleep 15

echo "Seeding DB..."
docker cp ./scripts ecommerce_backend:/app/scripts
docker exec ecommerce_backend mkdir -p /app/backend
docker cp ./backend/tsconfig.json ecommerce_backend:/app/backend/tsconfig.json
docker exec ecommerce_backend npx ts-node /app/scripts/seed.ts
echo "Deployment successful!"