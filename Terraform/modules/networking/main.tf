data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main-vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_subnet" "public-subnet" {
  count                   = length(var.public_subnet)
  vpc_id                  = aws_vpc.main-vpc.id
  cidr_block              = var.public_subnet[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    "Name" = "public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private-subnet" {
  count             = length(var.private_subnet)
  vpc_id            = aws_vpc.main-vpc.id
  cidr_block        = var.private_subnet[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    "Name" = "private-subnet-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main-igw" {
  vpc_id = aws_vpc.main-vpc.id
  tags = {
    "Name" = "main-igw"
  }
}

resource "aws_internet_gateway_attachment" "main-igw-attachement" {
  internet_gateway_id = aws_internet_gateway.main-igw.id
  vpc_id              = aws_vpc.main-vpc.id
}

resource "aws_route_table" "public-route-table" {
  vpc_id = aws_vpc.main-vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main-igw.id
  }
  tags = {
    "Name" = "public-route-table"
  }
}

resource "aws_route_table_association" "public-route-table-association" {
  count          = length(var.public_subnet)
  subnet_id      = aws_subnet.public-subnet[count.index].id
  route_table_id = aws_route_table.public-route-table.id
}

resource "aws_eip" "main-eip" {
  domain = "vpc"
  tags = {
    "Name" = "main-eip"
  }
}

resource "aws_nat_gateway" "main-nat" {
  subnet_id = aws_subnet.public-subnet[0].id
  tags = {
    "Name" = "main-nat"
  }
}



