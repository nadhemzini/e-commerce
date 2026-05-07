# =============================================================================
# BACKEND ASG — Launch Template + Auto Scaling Group + Scaling Policy
# Exigence prof : EC2 dans subnets PRIVES, ASG min=2 desired=2 max=4
# Images Docker depuis Docker Hub via docker pull (pas d'ECS/Fargate)
# =============================================================================

# -----------------------------------------------------------------------------
# AMI Ubuntu 22.04 LTS (compatible Docker, remplace Amazon Linux 2)
# Ubuntu est prefere pour sa compatibilite Docker et apt-get
# -----------------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu official)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# IAM Instance Profile — LabInstanceProfile (existant AWS Academy)
# NE PAS creer de role custom (CreateRole bloque en AWS Academy Sandbox)
# -----------------------------------------------------------------------------
data "aws_iam_instance_profile" "lab" {
  name = "LabInstanceProfile"
}

# -----------------------------------------------------------------------------
# Launch Template — template de lancement pour les instances backend ASG
# Inclut le script User Data de deploiement automatique
# -----------------------------------------------------------------------------
resource "aws_launch_template" "backend" {
  name_prefix   = "${var.app_name}-${var.environment}-backend-lt-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type # t3.micro pour AWS Academy

  # Security Group backend (port 4000 depuis ALB uniquement)
  vpc_security_group_ids = [var.sg_backend_id]

  # IAM Instance Profile existant AWS Academy
  iam_instance_profile {
    name = data.aws_iam_instance_profile.lab.name
  }

  # Stockage root : 20 Go gp3
  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  # User Data — deploiement automatique au boot de l'instance
  # Exigence prof : docker pull + docker run avec variables d'environnement
  user_data = base64encode(templatefile("${path.module}/user_data_backend.sh.tpl", {
    dockerhub_username    = var.dockerhub_username
    dockerhub_token       = var.dockerhub_token
    backend_image         = var.backend_image
    db_username           = var.db_username
    db_password           = var.db_password
    db_endpoint           = var.db_endpoint
    db_name               = var.db_name
    jwt_secret            = var.jwt_secret
    jwt_refresh_secret    = var.jwt_refresh_secret
    stripe_secret_key     = var.stripe_secret_key
    stripe_webhook_secret = var.stripe_webhook_secret
    aws_region            = var.aws_region
    s3_assets_bucket      = var.s3_assets_bucket
  }))

  # Metadonnees IMDSv2 (securite recommandee)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "optional"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment}-backend"
      Environment = var.environment
      Role        = "backend"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.app_name}-${var.environment}-backend-lt" }
}

# -----------------------------------------------------------------------------
# Auto Scaling Group — deploie les instances backend dans les subnets PRIVES
# Exigence prof : min=2, desired=2, max=4 sur les DEUX subnets prives
# -----------------------------------------------------------------------------
resource "aws_autoscaling_group" "backend" {
  name                = "${var.app_name}-${var.environment}-backend-asg"
  min_size            = 2
  desired_capacity    = 2
  max_size            = 4

  # Subnets PRIVES uniquement (AZ-A + AZ-B) — exigence prof
  vpc_zone_identifier = var.private_subnet_ids

  # Attachment au Target Group ALB via module alb
  target_group_arns = [var.backend_target_group_arn]

  # Remplacer les instances si health check echoue
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  # Attendre que les instances soient healthy dans l'ALB avant de terminer l'apply
  wait_for_capacity_timeout = "10m"

  # Tags propagees aux instances EC2 lancees par l'ASG
  tag {
    key                 = "Name"
    value               = "${var.app_name}-${var.environment}-backend"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Role"
    value               = "backend"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# -----------------------------------------------------------------------------
# Scaling Policy CPU — scale out si CPU > 70% (exigence prof)
# Target Tracking Policy : AWS ajuste automatiquement le nombre d'instances
# -----------------------------------------------------------------------------
resource "aws_autoscaling_policy" "cpu_scale_out" {
  name                   = "${var.app_name}-${var.environment}-backend-cpu-policy"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    # Scale out si CPU moyen de l'ASG depasse 70% — exigence prof
    target_value = 70.0
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group — logs des instances backend
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ec2/${var.app_name}-${var.environment}-backend"
  retention_in_days = 7

  tags = { Name = "${var.app_name}-${var.environment}-backend-logs" }
}
