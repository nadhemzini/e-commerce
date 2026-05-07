# =============================================================================
# CloudFront Distribution — Frontend (origin: ALB, SSR Next.js)
# =============================================================================

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.app_name}-${var.environment} frontend distribution"
  default_root_object = ""

  origin {
    domain_name = var.alb_dns_name
    origin_id   = "${var.app_name}-${var.environment}-alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.app_name}-${var.environment}-alb-origin"
    viewer_protocol_policy = "redirect-to-https"

    # CachingDisabled managed policy — SSR content must not be cached
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"

    compress = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-frontend-cdn"
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# =============================================================================
# CloudFront Distribution — Static Assets (origin: S3 bucket via OAC)
# =============================================================================

resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "${var.app_name}-${var.environment}-static-oac-${data.aws_caller_identity.current.account_id}"
  description                       = "OAC for ${var.app_name}-${var.environment} static assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.app_name}-${var.environment} static assets distribution"

  origin {
    domain_name              = var.static_bucket_regional_domain
    origin_id                = "${var.app_name}-${var.environment}-s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.app_name}-${var.environment}-s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    # CachingOptimized managed policy — TTL 86400s for static assets
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    compress = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-assets-cdn"
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# =============================================================================
# S3 bucket policy — Allow CloudFront OAC to read static bucket
# =============================================================================

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "cloudfront_oac" {
  bucket = var.static_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${var.static_bucket_name}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.assets.id}"
          }
        }
      }
    ]
  })
}
