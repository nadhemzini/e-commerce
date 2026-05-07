#!/bin/bash
set -e
mkdir -p /opt/ecommerce
cd /opt/ecommerce
aws s3 cp s3://app-assets-yassine-dev/deploy.zip .
unzip -o deploy.zip
curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
/usr/local/bin/docker-compose -f docker-compose.prod.yml build
/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
