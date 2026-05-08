#!/bin/bash
set -e
cd /opt/ecommerce
aws s3 cp s3://app-assets-nadhem-dev/deploy.zip .
unzip -o deploy.zip
/usr/local/bin/docker-compose -f docker-compose.prod.yml build backend
/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d