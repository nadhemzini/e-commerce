# =============================================================================
# RDS — PostgreSQL 14 — Conforme exigences academiques
# AWS Academy Sandbox : pas de Secrets Manager, password via variable
# =============================================================================

# -----------------------------------------------------------------------------
# DB Subnet Group — PRIVES uniquement (exigence prof)
# La RDS est uniquement accessible depuis les instances backend (subnets prives)
# -----------------------------------------------------------------------------
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${var.app_name}-${var.environment}-db-subnet" }
}

# -----------------------------------------------------------------------------
# Instance RDS PostgreSQL 14
# Exigences prof :
#   - Moteur : PostgreSQL
#   - Instance type : db.t3.micro
#   - DB Subnet Group : subnets PRIVES uniquement
#   - publicly_accessible = false (critique — verifie pendant la demo)
#   - Password via variable d'environnement / secret GitHub (jamais en dur)
# -----------------------------------------------------------------------------
resource "aws_db_instance" "main" {
  identifier     = "${var.app_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "14"

  # Exigence prof : db.t3.micro
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  # Credentials — injectes via GitHub Secrets (jamais en dur dans le code)
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Reseau — subnets PRIVES via DB Subnet Group
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_rds_id]

  # AWS Academy Sandbox : utiliser le parameter group par defaut
  parameter_group_name = "default.postgres14"

  # ==========================================================================
  # CRITIQUE — Exigence prof : RDS NON accessible publiquement
  # Le correcteur verifiera ce parametre pendant la demonstration
  # Aucune connexion depuis internet. Uniquement depuis les instances backend.
  # ==========================================================================
  publicly_accessible = false

  # Pas de Multi-AZ en dev (economie AWS Academy)
  multi_az = false

  # Pas de snapshot final (terraform destroy sans blocage)
  skip_final_snapshot = true
  deletion_protection = false

  # Backup minimal pour la demo
  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  tags = { Name = "${var.app_name}-${var.environment}-db" }
}