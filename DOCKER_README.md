# ETHIndia Docker Setup Guide

This guide explains how to containerize and deploy the ETHIndia application using Docker, with proper handling of nested environment variables.

## 🏗️ Architecture Overview

The application has a **nested environment structure**:

```
ethindia/
├── .env.local                          # Main Next.js app environment
├── Hedera-OP/my-lz-oapp/.env          # LayerZero/Hardhat environment
├── docker-compose.yml                 # Docker orchestration
├── Dockerfile                         # Container image definition
└── docker-manage.sh                   # Management script
```

## 📋 Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- Your environment variables properly configured

## 🚀 Quick Start

### 1. Set Up Environment Files

```bash
# Run the automated setup script
./setup-env.sh

# Or manually copy templates
cp env.example.root .env.local
cp env.example.hedera Hedera-OP/my-lz-oapp/.env
```

### 2. Configure Your Environment Variables

Edit **`.env.local`** (root directory):
```env
PRIVATE_KEY=your_main_private_key_here
RELAYER_PRIVKEY=your_relayer_private_key_here
RPC_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
# ... other main app variables
```

Edit **`Hedera-OP/my-lz-oapp/.env`** (LayerZero directory):
```env
PRIVATE_KEY=your_layerzero_private_key_here
RPC_URL_HEDERA=https://testnet.hashio.io/api
RPC_URL_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

### 3. Build and Start

```bash
# Using the management script (recommended)
./docker-manage.sh build
./docker-manage.sh start

# Or using docker-compose directly
docker-compose build
docker-compose up -d
```

### 4. Verify Deployment

```bash
# Check application health
curl http://localhost:3000/api/health

# View logs
./docker-manage.sh logs

# Check container status
./docker-manage.sh status
```

## 🔧 Environment Variable Handling

### How It Works

1. **docker-compose.yml** uses `env_file` to load both environment files:
   ```yaml
   env_file:
     - .env.local                              # Main app environment
     - ./Hedera-OP/my-lz-oapp/.env            # LayerZero environment
   ```

2. **Volume mounting** ensures files are available at runtime:
   ```yaml
   volumes:
     - ./.env.local:/app/.env.local:ro
     - ./Hedera-OP/my-lz-oapp/.env:/app/Hedera-OP/my-lz-oapp/.env:ro
   ```

3. **API endpoint** (`execute-hardhat.js`) reads the Hedera environment dynamically:
   ```javascript
   const envPath = path.join(scriptPath, '.env');
   const envContent = fs.readFileSync(envPath, 'utf8');
   // Parses and applies Hedera-specific environment variables
   ```

### Variable Precedence

When the same variable exists in both files:
1. **Hedera .env** takes precedence for LayerZero operations
2. **Root .env.local** is used for main Next.js app functionality
3. **docker-compose environment** overrides both (if specified)

## 📚 Commands Reference

### Docker Management Script

```bash
./docker-manage.sh build        # Build the Docker image
./docker-manage.sh start        # Start the application
./docker-manage.sh stop         # Stop the application
./docker-manage.sh restart      # Restart the application
./docker-manage.sh logs         # Show logs (add -f to follow)
./docker-manage.sh status       # Check application status
./docker-manage.sh shell        # Enter container shell
./docker-manage.sh clean        # Remove containers and images
./docker-manage.sh help         # Show help
```

### Direct Docker Compose

```bash
docker-compose build --no-cache    # Build with no cache
docker-compose up -d               # Start in detached mode
docker-compose down                # Stop and remove containers
docker-compose logs -f             # Follow logs
docker-compose ps                  # Show running containers
```

## 🔍 Debugging

### Check Environment Variables Inside Container

```bash
# Enter the container
./docker-manage.sh shell

# Check environment variables
env | grep -E "(PRIVATE_KEY|RPC_|NODE_ENV)"

# Check mounted files
ls -la /app/.env.local
ls -la /app/Hedera-OP/my-lz-oapp/.env
```

### View Application Logs

```bash
# Follow logs in real-time
./docker-manage.sh logs -f

# Show last 100 lines
docker-compose logs --tail=100
```

### Test LayerZero Integration

```bash
# Inside container, test the shell script
./docker-manage.sh shell
cd /app/Hedera-OP/my-lz-oapp
./hedera.sh
```

## 🔒 Security Considerations

1. **Never commit environment files** containing real private keys
2. **Use different private keys** for development and production
3. **Limit container resources** (configured in docker-compose.yml)
4. **Run as non-root user** (configured in Dockerfile)
5. **Mount env files as read-only** (`:ro` flag in volumes)

## 🐛 Troubleshooting

### Common Issues

**1. Environment Variables Not Loading**
```bash
# Check if files exist and are readable
ls -la .env.local Hedera-OP/my-lz-oapp/.env
```

**2. LayerZero Transactions Failing**
```bash
# Verify Hedera environment is correct
./docker-manage.sh shell
cat /app/Hedera-OP/my-lz-oapp/.env
```

**3. Application Won't Start**
```bash
# Check build logs
docker-compose build --no-cache
docker-compose logs
```

### Getting Help

1. Check application health: `http://localhost:3000/api/health`
2. View container logs: `./docker-manage.sh logs -f`
3. Inspect running processes: `./docker-manage.sh status`
4. Enter container for debugging: `./docker-manage.sh shell`

## 📦 Deployment to Production

### DockerHub

```bash
# Build and tag for DockerHub
docker build -t your-username/ethindia:latest .

# Push to DockerHub
docker push your-username/ethindia:latest

# Pull and run on production server
docker pull your-username/ethindia:latest
docker-compose up -d
```

### Environment Management

- Use Docker secrets or external secret management for production
- Consider using different compose files for different environments
- Set up monitoring and health checks in production

## 🎯 Next Steps

1. Set up CI/CD pipeline for automated builds
2. Add monitoring and logging aggregation
3. Configure backup strategies for persistent data
4. Set up load balancing for high availability
