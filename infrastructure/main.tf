provider "aws" {
  region = var.aws_region
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "central-api-${var.env}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

module "auth_login" {
  source            = "./modules/auth-login"
  name              = "auth-login"
  env               = var.env
  s3_bucket         = var.s3_bucket
  source_code_hash  = var.source_code_hash_auth_login
  api_gateway_id    = aws_apigatewayv2_api.http_api.id
  api_execution_arn = aws_apigatewayv2_api.http_api.execution_arn
}

module "auth_register" {
  source            = "./modules/auth-register"
  name              = "auth-register"
  env               = var.env
  s3_bucket         = var.s3_bucket
  source_code_hash  = var.source_code_hash_auth_register
  api_gateway_id    = aws_apigatewayv2_api.http_api.id
  api_execution_arn = aws_apigatewayv2_api.http_api.execution_arn
}
