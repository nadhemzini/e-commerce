output "asg_name" {
  description = "Nom de l'Auto Scaling Group backend"
  value       = aws_autoscaling_group.backend.name
}

output "launch_template_id" {
  description = "ID du Launch Template backend"
  value       = aws_launch_template.backend.id
}

output "asg_arn" {
  description = "ARN de l'Auto Scaling Group backend"
  value       = aws_autoscaling_group.backend.arn
}
