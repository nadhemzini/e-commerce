variable "app_name" {
  type        = string
  description = "Application name prefix for all resources"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev or prod)"
}
