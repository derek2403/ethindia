#!/bin/bash

# ETHIndia DockerHub Deployment Script
# Builds and deploys the application to DockerHub with amd64 architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_REGISTRY="docker.io"
DEFAULT_NAMESPACE="derek2403"
DEFAULT_IMAGE_NAME="ethindia"
DEFAULT_TAG="latest"
PLATFORM="linux/amd64"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  ETHIndia DockerHub Deployment${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get user input with default
get_input() {
    local prompt=$1
    local default=$2
    local result
    
    read -p "$(echo -e "${YELLOW}$prompt${NC} [${default}]: ")" result
    echo "${result:-$default}"
}

# Function to check if Docker is running and buildx is available
check_docker() {
    print_status "Checking Docker environment..."
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if buildx is available
    if ! docker buildx version >/dev/null 2>&1; then
        print_error "Docker buildx is not available. Please update Docker to a newer version."
        exit 1
    fi
    
    print_status "Docker environment OK ✅"
}

# Function to check if user is logged into DockerHub
check_docker_login() {
    print_status "Checking DockerHub authentication..."
    
    if ! docker info | grep -q "Username:"; then
        print_warning "You are not logged into DockerHub."
        echo ""
        echo "Please log in to DockerHub:"
        echo "  docker login"
        echo ""
        read -p "Press Enter after logging in, or Ctrl+C to exit..."
        
        # Check again after login
        if ! docker info | grep -q "Username:"; then
            print_error "DockerHub login required. Please run 'docker login' first."
            exit 1
        fi
    fi
    
    local username=$(docker info | grep "Username:" | awk '{print $2}')
    print_status "Logged in as: $username ✅"
    echo "$username"
}

# Function to validate environment files
validate_environment() {
    print_status "Validating environment files..."
    
    local errors=0
    
    if [ ! -f ".env.local" ]; then
        print_error "Missing .env.local file"
        errors=$((errors + 1))
    fi
    
    if [ ! -f "Hedera-OP/my-lz-oapp/.env" ]; then
        print_error "Missing Hedera-OP/my-lz-oapp/.env file"
        errors=$((errors + 1))
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Environment validation failed. Run './setup-env.sh' first."
        exit 1
    fi
    
    print_status "Environment files OK ✅"
}

# Function to build multi-architecture image
build_image() {
    local full_image_name=$1
    
    print_status "Building Docker image for $PLATFORM architecture..."
    print_status "Image: $full_image_name"
    
    # Create or use existing buildx builder
    if ! docker buildx ls | grep -q "ethindia-builder"; then
        print_status "Creating new buildx builder..."
        docker buildx create --name ethindia-builder --driver docker-container --bootstrap
    fi
    
    # Use the builder
    docker buildx use ethindia-builder
    
    # Build and push the image
    print_status "Building and pushing image..."
    docker buildx build \
        --platform $PLATFORM \
        --tag $full_image_name \
        --push \
        --progress=plain \
        .
        
    print_status "Build and push completed ✅"
}

# Function to verify deployment
verify_deployment() {
    local full_image_name=$1
    
    print_status "Verifying deployment..."
    
    # Pull the image to verify it exists
    if docker pull $full_image_name >/dev/null 2>&1; then
        print_status "Image successfully deployed to DockerHub ✅"
        
        # Get image details
        local image_size=$(docker images $full_image_name --format "table {{.Size}}" | tail -n +2)
        local image_id=$(docker images $full_image_name --format "table {{.ID}}" | tail -n +2 | head -c 12)
        
        echo ""
        echo "📦 Deployment Details:"
        echo "  Image: $full_image_name"
        echo "  Size: $image_size"
        echo "  ID: $image_id"
        echo "  Platform: $PLATFORM"
        
    else
        print_error "Failed to verify deployment"
        exit 1
    fi
}

# Function to show usage instructions
show_usage_instructions() {
    local full_image_name=$1
    
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Usage Instructions${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "🚀 To run your deployed image:"
    echo ""
    echo "1. Pull and run directly:"
    echo "   docker run -d -p 3000:3000 \\"
    echo "     --env-file .env.local \\"
    echo "     --name ethindia-app \\"
    echo "     $full_image_name"
    echo ""
    echo "2. Or update your docker-compose.yml:"
    echo "   services:"
    echo "     ethindia-app:"
    echo "       image: $full_image_name"
    echo "       # ... rest of your configuration"
    echo ""
    echo "3. Then run with docker-compose:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 DockerHub Repository:"
    echo "   https://hub.docker.com/r/$(echo $full_image_name | cut -d'/' -f1-2)"
    echo ""
    echo "📋 Image Details:"
    echo "   Registry: $(echo $full_image_name | cut -d'/' -f1)"
    echo "   Namespace: $(echo $full_image_name | cut -d'/' -f2)"
    echo "   Image: $(echo $full_image_name | cut -d'/' -f3 | cut -d':' -f1)"
    echo "   Tag: $(echo $full_image_name | cut -d':' -f2)"
    echo "   Platform: $PLATFORM"
}

# Function to clean up builder
cleanup() {
    if docker buildx ls | grep -q "ethindia-builder"; then
        print_status "Cleaning up buildx builder..."
        docker buildx rm ethindia-builder
    fi
}

# Main deployment function
main() {
    print_header
    
    # Check prerequisites
    check_docker
    
    # Get DockerHub username
    local dockerhub_username=$(check_docker_login)
    
    # Validate environment
    validate_environment
    
    echo ""
    print_status "Configuring deployment parameters..."
    
    # Get deployment configuration
    local namespace=$(get_input "DockerHub namespace/username" "$dockerhub_username")
    local image_name=$(get_input "Image name" "$DEFAULT_IMAGE_NAME")
    local tag=$(get_input "Image tag" "$DEFAULT_TAG")
    
    # Build full image name
    local full_image_name="$namespace/$image_name:$tag"
    
    echo ""
    print_status "Deployment Configuration:"
    echo "  Platform: $PLATFORM"
    echo "  Full Image Name: $full_image_name"
    echo "  Registry: DockerHub"
    
    echo ""
    read -p "$(echo -e "${YELLOW}Proceed with deployment? (y/N):${NC} ")" -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    # Perform deployment
    echo ""
    print_status "Starting deployment process..."
    
    # Build and push
    build_image "$full_image_name"
    
    # Verify deployment
    verify_deployment "$full_image_name"
    
    # Show usage instructions
    show_usage_instructions "$full_image_name"
    
    # Cleanup
    cleanup
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
