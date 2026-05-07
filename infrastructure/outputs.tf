output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "ec2_public_ip" {
  description = "Public IP of the EC2 app server"
  value       = module.ecs.instance_public_ip
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "assets_bucket_name" {
  description = "S3 bucket name for product images"
  value       = module.s3.assets_bucket_name
}

output "static_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = module.s3.static_bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.frontend_distribution_domain
}