# =============================================================================
# S3 Buckets — AWS Academy Sandbox Compatible
# Provider v4.67 — no Object Lock, no versioning (blocked in Sandbox)
# Bucket names use Account ID suffix for global uniqueness
# =============================================================================

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  assets_bucket = "${var.app_name}-assets-${var.environment}-${local.account_id}"
  static_bucket = "${var.app_name}-static-${var.environment}-${local.account_id}"
}

# ─── Assets Bucket (product images, uploads) ─────────────────────────────────
resource "null_resource" "create_assets_bucket" {
  triggers = {
    bucket_name = local.assets_bucket
  }

  provisioner "local-exec" {
    command = <<-EOT
      if ! aws s3 ls "s3://${local.assets_bucket}" 2>/dev/null; then
        aws s3 mb "s3://${local.assets_bucket}"
        aws s3api put-public-access-block --bucket "${local.assets_bucket}" --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
        aws s3api put-bucket-cors --bucket "${local.assets_bucket}" --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST"],"AllowedOrigins":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]}'
      fi
    EOT
  }
}

# ─── Static Bucket (frontend static files, CDN origin) ───────────────────────
resource "null_resource" "create_static_bucket" {
  triggers = {
    bucket_name = local.static_bucket
  }

  provisioner "local-exec" {
    command = <<-EOT
      if ! aws s3 ls "s3://${local.static_bucket}" 2>/dev/null; then
        aws s3 mb "s3://${local.static_bucket}"
        aws s3api put-public-access-block --bucket "${local.static_bucket}" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
      fi
    EOT
  }
}
