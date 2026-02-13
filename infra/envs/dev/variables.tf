variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "event-platform"
}

variable "env_name" {
  type    = string
  default = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "event_service_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:20-alpine"
}

variable "analytics_api_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:20-alpine"
}

variable "analytics_worker_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:20-alpine"
}

variable "web_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:20-alpine"
}

variable "event_service_port" {
  type    = number
  default = 3001
}

variable "analytics_api_port" {
  type    = number
  default = 3002
}

variable "web_port" {
  type    = number
  default = 3000
}

variable "event_service_cpu" {
  type    = number
  default = 256
}

variable "event_service_memory" {
  type    = number
  default = 512
}

variable "analytics_api_cpu" {
  type    = number
  default = 256
}

variable "analytics_api_memory" {
  type    = number
  default = 512
}

variable "analytics_worker_cpu" {
  type    = number
  default = 256
}

variable "analytics_worker_memory" {
  type    = number
  default = 512
}

variable "web_cpu" {
  type    = number
  default = 256
}

variable "web_memory" {
  type    = number
  default = 512
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type    = string
  default = "postgres"
}

variable "event_db_name" {
  type    = string
  default = "event_service"
}

variable "analytics_db_name" {
  type    = string
  default = "analytics"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "sqs_visibility_timeout" {
  type    = number
  default = 60
}
