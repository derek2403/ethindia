#!/bin/bash

# ETHIndia Docker Management Script
# This script helps manage the Docker container for the ETHIndia application

set -e

PROJECT_NAME="ethindia"
CONTAINER_NAME="ethindia-container"
IMAGE_NAME="ethindia-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build the Docker image
build() {
    print_status "Building Docker image..."
    docker-compose build --no-cache
    print_status "Build completed successfully!"
}

# Function to start the application
start() {
    print_status "Starting ETHIndia application..."
    docker-compose up -d
    print_status "Application started successfully!"
    print_status "Application is running at: http://localhost:3000"
    print_status "Health check: http://localhost:3000/api/health"
}

# Function to stop the application
stop() {
    print_status "Stopping ETHIndia application..."
    docker-compose down
    print_status "Application stopped successfully!"
}

# Function to restart the application
restart() {
    print_status "Restarting ETHIndia application..."
    docker-compose restart
    print_status "Application restarted successfully!"
}

# Function to view logs
logs() {
    if [ "$1" == "-f" ] || [ "$1" == "--follow" ]; then
        docker-compose logs -f
    else
        docker-compose logs --tail=50
    fi
}

# Function to check status
status() {
    print_status "Checking application status..."
    docker-compose ps
    
    # Check if container is healthy
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$CONTAINER_NAME.*healthy"; then
        print_status "Container is healthy ✅"
    elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$CONTAINER_NAME"; then
        print_warning "Container is running but health status unknown ⚠️"
    else
        print_error "Container is not running ❌"
    fi
}

# Function to clean up (remove containers, networks, images)
clean() {
    print_warning "This will remove all containers, networks, and images for this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker-compose down --volumes --remove-orphans
        docker rmi $(docker images "${PROJECT_NAME}*" -q) 2>/dev/null || true
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to enter the container shell
shell() {
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_status "Entering container shell..."
        docker exec -it "$CONTAINER_NAME" /bin/bash
    else
        print_error "Container is not running. Start it first with: $0 start"
        exit 1
    fi
}

# Function to show help
help() {
    echo "ETHIndia Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the application"
    echo "  stop      Stop the application"
    echo "  restart   Restart the application"
    echo "  logs      Show application logs (use -f to follow)"
    echo "  status    Check application status"
    echo "  shell     Enter the container shell"
    echo "  clean     Remove all containers, networks, and images"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build && $0 start    # Build and start the application"
    echo "  $0 logs -f              # Follow logs in real-time"
    echo "  $0 status               # Check if everything is running"
}

# Main script logic
main() {
    check_docker
    
    case "$1" in
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs "$2"
            ;;
        status)
            status
            ;;
        shell)
            shell
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            help
            ;;
        "")
            print_error "No command specified."
            help
            exit 1
            ;;
        *)
            print_error "Unknown command: $1"
            help
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@"
