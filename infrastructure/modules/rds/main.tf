# =============================================================================
# RDS — Compatible AWS Academy Sandbox
# Uses user-provided password (no Secrets Manager — blocked in Sandbox)
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${var.app_name}-${var.environment}-db-subnet" }
}

resource "aws_db_instance" "main" {
  identifier              = "${var.app_name}-${var.environment}-db"
  engine                  = "postgres"
  engine_version          = "14"
  instance_class          = var.environment == "prod" ? "db.t3.medium" : "db.t3.micro"
  allocated_storage       = var.environment == "prod" ? 50 : 20
  storage_type            = "gp3"
  storage_encrypted       = true

  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_rds_id]
  parameter_group_name   = "default.postgres14"

  multi_az                = false
  publicly_accessible     = true
  skip_final_snapshot     = true
  deletion_protection     = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  tags = { Name = "${var.app_name}-${var.environment}-db" }
}