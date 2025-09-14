# Deployment Guide

This document provides detailed instructions for deploying Our Line in Time in various environments.

## 🐳 Docker Deployment (Recommended)

### Prerequisites

- Docker 20.0+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB storage minimum

### Quick Deploy

```bash
# 1. Clone repository
git clone <repository-url>
cd our-line-in-time

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
cd infrastructure/docker
docker-compose up -d

# 4. Run database migrations
docker-compose exec api npm run db:migrate

# 5. Access application
open http://localhost
```

### Service Health Checks

```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Health check endpoints
curl http://localhost:3001/api/health
```

## 🏠 Self-Hosting Options

### Option 1: Home Server / NAS

**Recommended for families**

```bash
# Synology NAS with Docker
1. Install Docker package from Package Center
2. Upload docker-compose.yml via File Station
3. Create stack in Docker app
4. Configure port forwarding (80, 443)
```

**QNAP NAS**
```bash
# Container Station setup
1. Enable Container Station
2. Import docker-compose.yml
3. Configure networking
4. Set up SSL with Let's Encrypt
```

### Option 2: Cloud VPS

**For technical users**

```bash
# Ubuntu 22.04 setup
sudo apt update
sudo apt install docker.io docker-compose-v2

# Security hardening
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Deploy application
git clone <repo>
cd our-line-in-time
docker compose up -d
```

### Option 3: Raspberry Pi

**Minimum: Pi 4 with 4GB RAM**

```bash
# Install Docker on Raspberry Pi OS
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# Deploy (ARM64 compatible)
git clone <repo>
cd our-line-in-time
docker compose up -d
```

## 🔒 Production Configuration

### SSL/HTTPS Setup

**Option A: Let's Encrypt with Caddy**

```bash
# Replace nginx with Caddy in docker-compose.yml
caddy:
  image: caddy:2-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
```

**Caddyfile:**
```
your-domain.com {
  reverse_proxy web:3000
}

api.your-domain.com {
  reverse_proxy api:3001
}
```

**Option B: Manual SSL with nginx**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Hardening

**Production .env:**
```bash
NODE_ENV=production

# Generate strong passwords
DATABASE_URL=postgresql://dbuser:$(openssl rand -base64 32)@db:5432/our_line_in_time
REDIS_URL=redis://:$(openssl rand -base64 32)@redis:6379

# Strong JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# MinIO credentials
MINIO_ACCESS_KEY=$(openssl rand -base64 20)
MINIO_SECRET_KEY=$(openssl rand -base64 40)

# Production API URL
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Backup Strategy

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T db pg_dump -U postgres our_line_in_time > "$BACKUP_DIR/db_$DATE.sql"

# MinIO data backup
docker-compose exec -T minio sh -c 'tar czf - /data' > "$BACKUP_DIR/media_$DATE.tar.gz"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Crontab setup:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## 🔧 Monitoring

### Health Monitoring

**Docker healthchecks:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**External monitoring:**
```bash
# Setup Uptime Kuma or similar
docker run -d --restart=always -p 3002:3001 \
  -v uptime-kuma:/app/data \
  --name uptime-kuma louislam/uptime-kuma:1
```

### Log Management

**Centralized logging:**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Log rotation:**
```bash
# /etc/logrotate.d/docker-containers
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## 🚀 Performance Optimization

### Resource Allocation

**Minimum requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Network: 10Mbps upload

**Recommended for families:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- Network: 50Mbps upload

### Docker Optimizations

```yaml
# docker-compose.prod.yml
services:
  db:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  api:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Database Tuning

**PostgreSQL configuration:**
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## 🔄 Updates and Maintenance

### Update Process

```bash
# 1. Backup current state
./backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Rebuild containers
docker-compose build --no-cache

# 4. Update services
docker-compose up -d

# 5. Run any new migrations
docker-compose exec api npm run db:migrate

# 6. Verify deployment
curl http://localhost:3001/api/health
```

### Maintenance Windows

**Monthly tasks:**
- [ ] Review and rotate logs
- [ ] Check disk space usage
- [ ] Update Docker images
- [ ] Test backup restoration
- [ ] Review security updates

**Quarterly tasks:**
- [ ] Full system backup verification
- [ ] Performance review
- [ ] Security audit
- [ ] Capacity planning

## 🆘 Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose restart service-name
```

**Database connection issues:**
```bash
# Test database connectivity
docker-compose exec api psql $DATABASE_URL -c "SELECT NOW();"

# Reset database
docker-compose down -v
docker-compose up -d db
docker-compose exec api npm run db:migrate
```

**Storage issues:**
```bash
# Check MinIO connectivity
docker-compose exec api curl -f http://minio:9000/minio/health/live

# Reset MinIO buckets
docker-compose exec minio mc rm --recursive --force local/our-line-in-time
docker-compose restart minio
```

### Recovery Procedures

**Database recovery:**
```bash
# Stop services
docker-compose stop api web

# Restore database
docker-compose exec -T db psql -U postgres -d our_line_in_time < backup.sql

# Restart services
docker-compose start api web
```

**Media recovery:**
```bash
# Stop MinIO
docker-compose stop minio

# Restore media files
tar xzf media_backup.tar.gz -C /var/lib/docker/volumes/docker_minio_data/_data/

# Restart MinIO
docker-compose start minio
```

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review Docker and application logs
3. Verify system requirements
4. Check network connectivity and firewall settings
5. Consult the main README.md for additional context

## 🔐 Security Considerations

### Network Security

- Use firewall to restrict access to necessary ports only
- Consider VPN access for remote family members
- Implement fail2ban for SSH protection
- Regular security updates for host system

### Application Security

- Change all default passwords immediately
- Use strong, unique JWT secrets
- Enable HTTPS in production
- Regular backup testing
- Monitor access logs for suspicious activity

### Data Privacy

- All data stored locally (no cloud dependencies)
- User-controlled access permissions
- Geographic data encryption at rest
- Secure media file storage