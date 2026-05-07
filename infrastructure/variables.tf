variable "environment" {
  type        = string
  description = "Deployment environment (dev or prod)"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}

variable "app_name" {
  type        = string
  default     = "ecommerce"
  description = "Application name prefix for all resources"
}

variable "db_name" {
  type        = string
  description = "PostgreSQL database name"
}

variable "db_username" {
  type        = string
  description = "PostgreSQL master username"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "PostgreSQL master password"
}

variable "backend_image" {
  type        = string
  description = "Docker Hub image URI for backend"
}

variable "frontend_image" {
  type        = string
  description = "Docker Hub image URI for frontend"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "JWT access token signing secret"
}

variable "jwt_refresh_secret" {
  type        = string
  sensitive   = true
  description = "JWT refresh token signing secret"
}

variable "stripe_secret_key" {
  type        = string
  sensitive   = true
  description = "Stripe secret API key"
}

variable "stripe_webhook_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Stripe webhook signing secret"
}

variable "dockerhub_username" {
  type        = string
  default     = ""
  description = "Docker Hub username for pulling images on EC2"
}

variable "dockerhub_token" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Docker Hub access token for pulling images on EC2"
}
