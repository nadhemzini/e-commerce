data "aws_region" "current" {}

output "assets_bucket_name" {
  description = "Name of the assets S3 bucket"
  value       = local.assets_bucket
}

output "assets_bucket_arn" {
  description = "ARN of the assets S3 bucket"
  value       = "arn:aws:s3:::${local.assets_bucket}"
}

output "static_bucket_name" {
  description = "Name of the static S3 bucket"
  value       = local.static_bucket
}

output "static_bucket_regional_domain" {
  description = "Regional domain name of the static S3 bucket"
  value       = "${local.static_bucket}.s3.${data.aws_region.current.name}.amazonaws.com"
}
