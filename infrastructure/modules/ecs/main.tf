# =============================================================================
# EC2 — Replacement for ECS Fargate (blocked in AWS Academy Sandbox)
# Frontend + Backend run on a single EC2 instance via Docker
# =============================================================================

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.medium"
  subnet_id              = var.public_subnet_ids[0]
  vpc_security_group_ids = [var.sg_ecs_id]
  iam_instance_profile   = "LabInstanceProfile"

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # ── System Setup ──────────────────────────────────────────────────────
    yum update -y
    yum install -y docker jq
    service docker start
    systemctl enable docker
    usermod -a -G docker ec2-user

    # ── Docker Hub Login ──────────────────────────────────────────────────
    echo "${var.dockerhub_token}" | docker login -u "${var.dockerhub_username}" --password-stdin

    # ── Pull Images ───────────────────────────────────────────────────────
    docker pull ${var.backend_image}
    docker pull ${var.frontend_image}

    # ── Database Connection String ────────────────────────────────────────
    DB_URL="postgresql://${var.db_username}:${var.db_password}@${var.db_endpoint}/${var.db_name}"

    # ── Run Prisma Migrations ─────────────────────────────────────────────
    docker run --rm \
      -e DATABASE_URL="$DB_URL" \
      ${var.backend_image} \
      npx prisma migrate deploy --schema=src/prisma/schema.prisma || true

    # ── Run Backend Container ─────────────────────────────────────────────
    docker run -d \
      --name backend \
      --restart always \
      -p 4000:4000 \
      -e NODE_ENV=production \
      -e PORT=4000 \
      -e DATABASE_URL="$DB_URL" \
      -e JWT_SECRET="${var.jwt_secret}" \
      -e JWT_REFRESH_SECRET="${var.jwt_refresh_secret}" \
      -e STRIPE_SECRET_KEY="${var.stripe_secret_key}" \
      -e STRIPE_WEBHOOK_SECRET="${var.stripe_webhook_secret}" \
      -e AWS_REGION="${var.aws_region}" \
      -e AWS_S3_BUCKET="${var.s3_assets_bucket}" \
      -e FRONTEND_URL="*" \
      -e TRUST_PROXY=1 \
      ${var.backend_image}

    # ── Internal IP for SSR ───────────────────────────────────────────────
    LOCAL_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

    # ── Run Frontend Container ────────────────────────────────────────────
    docker run -d \
      --name frontend \
      --restart always \
      -p 3000:3000 \
      -e NODE_ENV=production \
      -e PORT=3000 \
      -e HOSTNAME="0.0.0.0" \
      -e INTERNAL_API_URL="http://$LOCAL_IP:4000" \
      ${var.frontend_image}

    # ── Health Check Loop ─────────────────────────────────────────────────
    for i in $(seq 1 30); do
      if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
        echo "Backend is healthy"
        break
      fi
      echo "Waiting for backend... attempt $i/30"
      sleep 10
    done
  EOF

  tags = { Name = "${var.app_name}-${var.environment}-app-server" }
}

# =============================================================================
# ALB — Application Load Balancer
# =============================================================================

resource "aws_lb" "main" {
  name               = "${var.app_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.sg_alb_id]
  subnets            = var.public_subnet_ids

  tags = { Name = "${var.app_name}-${var.environment}-alb" }
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.app_name}-${var.environment}-fe-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.app_name}-${var.environment}-fe-tg" }
}

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

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.app_name}-${var.environment}-be-tg" }
}

resource "aws_lb_target_group_attachment" "frontend" {
  target_group_arn = aws_lb_target_group.frontend.arn
  target_id        = aws_instance.app.id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "backend" {
  target_group_arn = aws_lb_target_group.backend.arn
  target_id        = aws_instance.app.id
  port             = 4000
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = { Name = "${var.app_name}-${var.environment}-http-listener" }
}

resource "aws_lb_listener_rule" "backend_api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }
}

# =============================================================================
# CloudWatch Log Group
# =============================================================================

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ec2/${var.app_name}-${var.environment}-backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ec2/${var.app_name}-${var.environment}-frontend"
  retention_in_days = 30
}