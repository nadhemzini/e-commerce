variable "app_name" {
  type        = string
  description = "Nom de l'application"
}

variable "environment" {
  type        = string
  description = "Environnement (dev / prod)"
}

variable "aws_region" {
  type        = string
  description = "Region AWS"
}

variable "vpc_id" {
  type        = string
  description = "ID du VPC"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "IDs des subnets PRIVES pour l'ASG (AZ-A + AZ-B)"
}

variable "sg_backend_id" {
  type        = string
  description = "ID du Security Group backend (port 4000 depuis ALB uniquement)"
}

variable "backend_target_group_arn" {
  type        = string
  description = "ARN du Target Group ALB — l'ASG s'y attache pour recevoir le trafic"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "Type d'instance EC2 pour les instances backend (t3.micro pour AWS Academy)"
}

variable "backend_image" {
  type        = string
  description = "Image Docker Hub backend (ex: nadhemz/shopvault-backend:latest)"
}

variable "db_endpoint" {
  type        = string
  description = "Endpoint RDS PostgreSQL (host:port)"
}

variable "db_name" {
  type        = string
  description = "Nom de la base de donnees PostgreSQL"
}

variable "db_username" {
  type        = string
  description = "Nom d'utilisateur PostgreSQL"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Mot de passe PostgreSQL (ne jamais mettre en dur)"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "Secret JWT access token"
}

variable "jwt_refresh_secret" {
  type        = string
  sensitive   = true
  description = "Secret JWT refresh token"
}

variable "stripe_secret_key" {
  type        = string
  sensitive   = true
  description = "Cle secrete Stripe"
}

variable "stripe_webhook_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Secret webhook Stripe"
}

variable "s3_assets_bucket" {
  type        = string
  description = "Nom du bucket S3 pour les assets produits"
}

variable "dockerhub_username" {
  type        = string
  description = "Nom d'utilisateur Docker Hub pour docker pull"
}

variable "dockerhub_token" {
  type        = string
  sensitive   = true
  description = "Token Docker Hub pour docker pull"
}
