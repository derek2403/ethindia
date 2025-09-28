# ETHIndia DockerHub Deployment Guide

This guide walks you through deploying your ETHIndia application to DockerHub with AMD64 architecture.

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **DockerHub account** created
3. **Environment files** configured
4. **Project built successfully** locally

## 🚀 Quick Deployment

### Step 1: Prepare Environment Files

```bash
# Set up environment files
./setup-env.sh

# Edit with your actual values
nano .env.local
nano Hedera-OP/my-lz-oapp/.env
```

### Step 2: Login to DockerHub

```bash
docker login
# Enter your DockerHub username and password/token
```

### Step 3: Deploy to DockerHub

```bash
# Run the automated deployment script
./deploy-dockerhub.sh
```

The script will:
- ✅ Check Docker and authentication
- ✅ Validate environment files
- ✅ Build for AMD64 architecture
- ✅ Push to DockerHub
- ✅ Verify deployment

## 📖 Manual Deployment Steps

If you prefer manual control:

### 1. Build Multi-Architecture Image

```bash
# Create buildx builder
docker buildx create --name ethindia-builder --driver docker-container --bootstrap
docker buildx use ethindia-builder

# Build and push for AMD64
docker buildx build \
  --platform linux/amd64 \
  --tag your-username/ethindia:latest \
  --push \
  .
```

### 2. Verify Deployment

```bash
# Pull to verify
docker pull your-username/ethindia:latest

# Check image details
docker images your-username/ethindia:latest
```

## 🎯 Using Your Deployed Image

### Option 1: Docker Compose (Recommended)

```bash
# Update image name in docker-compose.production.yml
sed -i 's/your-dockerhub-username/YOUR_ACTUAL_USERNAME/g' docker-compose.production.yml

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

### Option 2: Direct Docker Run

```bash
docker run -d \
  --name ethindia-app \
  -p 3000:3000 \
  --env-file .env.local \
  -v $(pwd)/.env.local:/app/.env.local:ro \
  -v $(pwd)/Hedera-OP/my-lz-oapp/.env:/app/Hedera-OP/my-lz-oapp/.env:ro \
  your-username/ethindia:latest
```

### Option 3: On Remote Server

```bash
# On your production server
docker pull your-username/ethindia:latest

# Copy environment files to server
scp .env.local user@server:~/
scp Hedera-OP/my-lz-oapp/.env user@server:~/hedera.env

# Run container
docker run -d \
  --name ethindia-production \
  -p 3000:3000 \
  --env-file .env.local \
  -v ~/hedera.env:/app/Hedera-OP/my-lz-oapp/.env:ro \
  your-username/ethindia:latest
```

## 🔄 Automated Deployment with GitHub Actions

### Setup CI/CD Pipeline

1. **Add DockerHub secrets to GitHub:**
   ```
   DOCKERHUB_USERNAME: your-dockerhub-username
   DOCKERHUB_TOKEN: your-dockerhub-access-token
   ```

2. **Push to trigger deployment:**
   ```bash
   git add .
   git commit -m "Deploy to DockerHub"
   git push origin main
   ```

3. **Monitor deployment:**
   - Check GitHub Actions tab
   - Verify new image on DockerHub

## 🔍 Troubleshooting

### Common Issues

**1. Authentication Failed**
```bash
# Re-login to DockerHub
docker logout
docker login
```

**2. Platform Architecture Issues**
```bash
# Ensure buildx is available
docker buildx version

# Create new builder if needed
docker buildx create --name ethindia-builder --driver docker-container
```

**3. Environment Variables Not Loading**
```bash
# Verify environment files exist and are readable
ls -la .env.local Hedera-OP/my-lz-oapp/.env

# Test locally first
docker-compose up -d
curl http://localhost:3000/api/health
```

**4. Build Context Too Large**
```bash
# Check .dockerignore is properly configured
cat .dockerignore

# Remove unnecessary files
docker system prune -a
```

### Debugging Commands

```bash
# Check image layers
docker history your-username/ethindia:latest

# Inspect image
docker inspect your-username/ethindia:latest

# Run interactive shell
docker run -it --entrypoint /bin/bash your-username/ethindia:latest

# Check logs
docker logs container-name
```

## 📊 Image Optimization

### Reduce Image Size

1. **Multi-stage builds** (already implemented)
2. **Minimize dependencies** in package.json
3. **Use .dockerignore** effectively
4. **Remove dev dependencies** in production

### Security Best Practices

1. **Use non-root user** (implemented)
2. **Scan for vulnerabilities:**
   ```bash
   docker scout cves your-username/ethindia:latest
   ```
3. **Use specific tags** instead of `latest` in production
4. **Keep base images updated**

## 🚀 Production Deployment Checklist

- [ ] Environment files configured with production values
- [ ] Private keys are secure and production-ready
- [ ] RPC endpoints are production-grade
- [ ] Resource limits configured in docker-compose
- [ ] Health checks enabled
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place
- [ ] SSL certificates configured (if using nginx)
- [ ] Domain DNS configured
- [ ] Load balancer configured (if needed)

## 📈 Monitoring Your Deployment

### Health Checks

```bash
# Basic health check
curl http://your-domain:3000/api/health

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Resource usage
docker stats ethindia-app
```

### Log Monitoring

```bash
# Follow logs
docker logs -f ethindia-app

# Search logs
docker logs ethindia-app 2>&1 | grep "ERROR"

# Export logs
docker logs ethindia-app > app.log 2>&1
```

## 🎉 Success!

Your ETHIndia application is now deployed to DockerHub and ready for production use!

- **DockerHub Repository:** `https://hub.docker.com/r/your-username/ethindia`
- **Production URL:** `http://your-domain:3000`
- **Health Check:** `http://your-domain:3000/api/health`

For support, check the logs or create an issue in your repository.
