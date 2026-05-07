# =============================================================================
# ALB — Application Load Balancer (Backend uniquement)
# Exigence prof : ALB dans les 2 subnets publics, redirige vers les instances backend
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# Placé dans les DEUX sous-réseaux publics pour la haute disponibilité
# -----------------------------------------------------------------------------
resource "aws_lb" "backend" {
  name               = "${var.app_name}-${var.environment}-backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.sg_alb_id]
  subnets            = var.public_subnet_ids

  # AWS Academy: pas de deletion protection pour permettre terraform destroy
  enable_deletion_protection = false

  tags = { Name = "${var.app_name}-${var.environment}-backend-alb" }
}

# -----------------------------------------------------------------------------
# Target Group — instances backend (ASG)
# Health check : GET /health → HTTP 200 (exigence prof)
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-${var.environment}-be-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  # Permet au TG d'être remplacé sans downtime lors des updates
  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.app_name}-${var.environment}-be-tg" }
}

# -----------------------------------------------------------------------------
# Listener HTTP port 80 — redirige vers le Target Group backend
# Note: HTTPS non supporté sur ALB en AWS Academy (pas d'ACM)
#       HTTPS disponible via CloudFront (optionnel)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  tags = { Name = "${var.app_name}-${var.environment}-http-listener" }
}
