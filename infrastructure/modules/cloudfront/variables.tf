variable "app_name" {
  type        = string
  description = "Application name prefix for all resources"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev or prod)"
}

variable "alb_dns_name" {
  type        = string
  description = "DNS name of the Application Load Balancer (frontend origin)"
}

variable "static_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for static assets"
}

variable "static_bucket_regional_domain" {
  type        = string
  description = "Regional domain name of the S3 static bucket"
}
