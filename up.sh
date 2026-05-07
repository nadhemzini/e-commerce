cd /opt/ecommerce
aws s3 cp s3://app-assets-yassine-dev/.env.prod .env.prod
/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
