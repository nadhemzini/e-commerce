output "frontend_distribution_domain" {
  description = "Domain name of the frontend CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_distribution_id" {
  description = "ID of the frontend CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "assets_distribution_domain" {
  description = "Domain name of the assets CloudFront distribution"
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "assets_distribution_id" {
  description = "ID of the assets CloudFront distribution"
  value       = aws_cloudfront_distribution.assets.id
}
