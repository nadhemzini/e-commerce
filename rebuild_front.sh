#!/bin/bash
set -e
cd /opt/ecommerce
# Copy the environment file into the frontend directory so Next.js reads it during build
cp .env.prod frontend/.env.production
# Rebuild the frontend with the correct environment variables baked in
/usr/local/bin/docker-compose -f docker-compose.prod.yml build frontend
# Restart the containers
/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d