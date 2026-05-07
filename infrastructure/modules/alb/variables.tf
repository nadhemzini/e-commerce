variable "app_name" {
  type        = string
  description = "Nom de l'application (prefixe pour toutes les ressources)"
}

variable "environment" {
  type        = string
  description = "Environnement de deploiement (dev / prod)"
}

variable "vpc_id" {
  type        = string
  description = "ID du VPC dans lequel deployer l'ALB"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "IDs des sous-reseaux publics (AZ-A + AZ-B) pour l'ALB"
}

variable "sg_alb_id" {
  type        = string
  description = "ID du Security Group ALB (port 80 depuis 0.0.0.0/0)"
}
