variable "app_name" {
  type        = string
  description = "Nom de l'application (prefixe pour toutes les ressources)"
}

variable "environment" {
  type        = string
  description = "Environnement de deploiement (dev / prod)"
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
  description = "Mot de passe PostgreSQL — injected via GitHub Secret DB_PASSWORD"
}

variable "vpc_id" {
  type        = string
  description = "ID du VPC"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "IDs des subnets PRIVES pour le DB Subnet Group (AZ-A + AZ-B)"
}

# NOTE : public_subnet_ids supprime — la RDS n'est jamais dans un subnet public
# publicly_accessible = false est obligatoire (exigence prof)

variable "sg_rds_id" {
  type        = string
  description = "ID du Security Group RDS (port 5432 depuis sg_backend uniquement)"
}
