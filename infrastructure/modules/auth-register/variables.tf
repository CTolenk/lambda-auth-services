variable "name" {
  type = string
}

variable "env" {
  type = string
}

variable "s3_bucket" {
  type = string
}

variable "source_code_hash" {
  type        = string
  description = "Hash del código fuente de la Lambda para asegurar actualización"
}

variable "api_gateway_id" {
  type        = string
  description = "ID of the shared API Gateway"
}

variable "api_execution_arn" {
  type        = string
  description = "Execution ARN of the shared API Gateway"
}

variable "environment_variables" {
  type        = map(string)
  description = "Environment variables to inject into the Lambda function"
  default     = {}
}
