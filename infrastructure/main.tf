terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  # S3 backend configure dynamiquement via -backend-config dans CI/CD
  # terraform init -backend-config="bucket=ecommerce-terraform-state-{ACCOUNT_ID}" ...
  /*backend "s3" {
    key    = "state/terraform.tfstate"
    region = "us-east-1"
  }*/
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# =============================================================================
# MODULE VPC — Reseau, subnets, Security Groups
# Phase 1 : refactore (sg_backend, sg_frontend, sg_rds)
# =============================================================================
module "vpc" {
  source      = "./modules/vpc"
  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region
}

# =============================================================================
# MODULE S3 — Buckets pour assets et state Terraform
# Conserve tel quel
# =============================================================================
module "s3" {
  source      = "./modules/s3"
  app_name    = var.app_name
  environment = var.environment
}

# =============================================================================
# MODULE RDS — Base de donnees PostgreSQL
# Phase 5 : publicly_accessible = false (a venir)
# =============================================================================
module "rds" {
  source             = "./modules/rds"
  app_name           = var.app_name
  environment        = var.environment
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  sg_rds_id          = module.vpc.sg_rds_id
}

# =============================================================================
# MODULE ALB — Application Load Balancer (backend uniquement)
# Phase 2 : nouveau module (remplace la partie ALB de l'ancien module ecs)
# =============================================================================
module "alb" {
  source            = "./modules/alb"
  app_name          = var.app_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  sg_alb_id         = module.vpc.sg_alb_id
}

# =============================================================================
# MODULE BACKEND ASG — EC2 Auto Scaling Group (instances backend privees)
# Phase 3 : a venir — remplace l'ancien module ecs
# =============================================================================
# module "backend_asg" {
#   source                    = "./modules/backend_asg"
#   app_name                  = var.app_name
#   environment               = var.environment
#   aws_region                = var.aws_region
#   vpc_id                    = module.vpc.vpc_id
#   private_subnet_ids        = module.vpc.private_subnet_ids
#   sg_backend_id             = module.vpc.sg_backend_id
#   backend_target_group_arn  = module.alb.backend_target_group_arn
#   backend_image             = var.backend_image
#   db_endpoint               = module.rds.db_endpoint
#   db_name                   = var.db_name
#   db_username               = var.db_username
#   db_password               = var.db_password
#   jwt_secret                = var.jwt_secret
#   jwt_refresh_secret        = var.jwt_refresh_secret
#   stripe_secret_key         = var.stripe_secret_key
#   stripe_webhook_secret     = var.stripe_webhook_secret
#   s3_assets_bucket          = module.s3.assets_bucket_name
#   dockerhub_username        = var.dockerhub_username
#   dockerhub_token           = var.dockerhub_token
# }

# =============================================================================
# MODULE FRONTEND EC2 — Instance EC2 dedicee frontend (subnet public)
# Phase 4 : a venir
# =============================================================================
# module "frontend_ec2" {
#   source             = "./modules/frontend_ec2"
#   app_name           = var.app_name
#   environment        = var.environment
#   vpc_id             = module.vpc.vpc_id
#   public_subnet_id   = module.vpc.public_subnet_ids[0]
#   sg_frontend_id     = module.vpc.sg_frontend_id
#   frontend_image     = var.frontend_image
#   alb_dns_name       = module.alb.alb_dns_name
#   dockerhub_username = var.dockerhub_username
#   dockerhub_token    = var.dockerhub_token
#   next_public_stripe_publishable_key = var.next_public_stripe_publishable_key
# }

# =============================================================================
# MODULE CLOUDFRONT — CDN (optionnel, desactive par defaut)
# Non requis par le professeur — conserver pour usage futur si besoin
# =============================================================================
# module "cloudfront" {
#   source                        = "./modules/cloudfront"
#   app_name                      = var.app_name
#   environment                   = var.environment
#   alb_dns_name                  = module.alb.alb_dns_name
#   static_bucket_name            = module.s3.static_bucket_name
#   static_bucket_regional_domain = module.s3.static_bucket_regional_domain
# }
