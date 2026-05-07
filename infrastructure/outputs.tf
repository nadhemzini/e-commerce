# =============================================================================
# Outputs globaux — mis a jour Phase 2
# Refs module.ecs et module.cloudfront supprimes (non conformes)
# =============================================================================

output "alb_dns_name" {
  description = "DNS public de l'ALB backend — utilise par le frontend pour les appels /api/*"
  value       = module.alb.alb_dns_name
}

# output "frontend_public_ip" {
#   description = "IP publique de l'instance EC2 Frontend — disponible apres Phase 4"
#   value       = module.frontend_ec2.public_ip
# }

output "rds_endpoint" {
  description = "Endpoint RDS PostgreSQL (sensible)"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "assets_bucket_name" {
  description = "Nom du bucket S3 pour les images produits"
  value       = module.s3.assets_bucket_name
}

output "static_bucket_name" {
  description = "Nom du bucket S3 pour les assets statiques"
  value       = module.s3.static_bucket_name
}

# output "cloudfront_domain" {
#   description = "Domaine CloudFront (optionnel — desactive par defaut)"
#   value       = module.cloudfront.frontend_distribution_domain
# }