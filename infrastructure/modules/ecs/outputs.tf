output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "instance_public_ip" {
  value = aws_instance.app.public_ip
}