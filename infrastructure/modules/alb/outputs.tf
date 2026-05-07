# =============================================================================
# ALB Outputs — exposes aux modules backend_asg et main.tf
# =============================================================================

output "alb_dns_name" {
  description = "DNS public de l'ALB backend (utilise par le frontend pour les appels API)"
  value       = aws_lb.backend.dns_name
}

output "alb_arn" {
  description = "ARN de l'ALB backend"
  value       = aws_lb.backend.arn
}

output "backend_target_group_arn" {
  description = "ARN du Target Group backend - utilise par l'Auto Scaling Group pour l'attachment"
  value       = aws_lb_target_group.backend.arn
}

output "http_listener_arn" {
  description = "ARN du listener HTTP 80 de l'ALB"
  value       = aws_lb_listener.http.arn
}
