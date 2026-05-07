#!/bin/bash
sudo yum install -y unzip
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

aws s3 cp s3://app-assets-yassine-dev/deploy.zip .
unzip -o deploy.zip

sudo docker-compose -f docker-compose.prod.yml down
sudo docker-compose -f docker-compose.prod.yml up -d --build
