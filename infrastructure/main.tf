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
  # S3 backend is configured dynamically via -backend-config in CI/CD
  # terraform init -backend-config="bucket=ecommerce-terraform-state-{ACCOUNT_ID}" ...
  backend "s3" {
    key    = "state/terraform.tfstate"
    region = "us-east-1"
  }
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

module "vpc" {
  source      = "./modules/vpc"
  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region
}

module "s3" {
  source      = "./modules/s3"
  app_name    = var.app_name
  environment = var.environment
}

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

module "ecs" {
  source                = "./modules/ecs"
  app_name              = var.app_name
  environment           = var.environment
  aws_region            = var.aws_region
  backend_image         = var.backend_image
  frontend_image        = var.frontend_image
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  sg_alb_id             = module.vpc.sg_alb_id
  sg_ecs_id             = module.vpc.sg_ecs_id
  s3_assets_bucket      = module.s3.assets_bucket_name
  db_endpoint           = module.rds.db_endpoint
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = module.rds.db_password
  jwt_secret            = var.jwt_secret
  jwt_refresh_secret    = var.jwt_refresh_secret
  stripe_secret_key     = var.stripe_secret_key
  stripe_webhook_secret = var.stripe_webhook_secret
  dockerhub_username    = var.dockerhub_username
  dockerhub_token       = var.dockerhub_token
}

module "cloudfront" {
  source                        = "./modules/cloudfront"
  app_name                      = var.app_name
  environment                   = var.environment
  alb_dns_name                  = module.ecs.alb_dns_name
  static_bucket_name            = module.s3.static_bucket_name
  static_bucket_regional_domain = module.s3.static_bucket_regional_domain
}
