#!/bin/bash

# ETHIndia Environment Setup Script
# This script helps set up the environment files needed for Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  ETHIndia Environment Setup${NC}"
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

check_env_files() {
    local missing_files=()
    
    # Check root .env.local
    if [ ! -f ".env.local" ]; then
        missing_files+=(".env.local")
    fi
    
    # Check Hedera .env
    if [ ! -f "Hedera-OP/my-lz-oapp/.env" ]; then
        missing_files+=("Hedera-OP/my-lz-oapp/.env")
    fi
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_status "All environment files exist ✅"
        return 0
    else
        print_warning "Missing environment files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
}

create_env_files() {
    print_status "Creating environment files from templates..."
    
    # Create root .env.local
    if [ ! -f ".env.local" ]; then
        if [ -f "env.example.root" ]; then
            cp env.example.root .env.local
            print_status "Created .env.local from template"
        else
            print_error "Template file env.example.root not found"
            return 1
        fi
    else
        print_warning ".env.local already exists, skipping..."
    fi
    
    # Create Hedera .env
    if [ ! -f "Hedera-OP/my-lz-oapp/.env" ]; then
        if [ -f "env.example.hedera" ]; then
            cp env.example.hedera Hedera-OP/my-lz-oapp/.env
            print_status "Created Hedera-OP/my-lz-oapp/.env from template"
        else
            print_error "Template file env.example.hedera not found"
            return 1
        fi
    else
        print_warning "Hedera-OP/my-lz-oapp/.env already exists, skipping..."
    fi
    
    echo ""
    print_warning "⚠️  IMPORTANT: Edit the following files with your actual values:"
    echo "   1. .env.local"
    echo "   2. Hedera-OP/my-lz-oapp/.env"
    echo ""
    print_warning "Replace all placeholder values (YOUR_ALCHEMY_KEY, your_private_key_here, etc.)"
}

validate_env_structure() {
    print_status "Validating environment file structure..."
    
    local errors=0
    
    # Check root .env.local
    if [ -f ".env.local" ]; then
        if ! grep -q "PRIVATE_KEY=" .env.local; then
            print_error "Missing PRIVATE_KEY in .env.local"
            errors=$((errors + 1))
        fi
        if ! grep -q "RPC_SEPOLIA=" .env.local; then
            print_error "Missing RPC_SEPOLIA in .env.local"
            errors=$((errors + 1))
        fi
    fi
    
    # Check Hedera .env
    if [ -f "Hedera-OP/my-lz-oapp/.env" ]; then
        if ! grep -q "PRIVATE_KEY=" Hedera-OP/my-lz-oapp/.env; then
            print_error "Missing PRIVATE_KEY in Hedera-OP/my-lz-oapp/.env"
            errors=$((errors + 1))
        fi
        if ! grep -q "RPC_URL_HEDERA=" Hedera-OP/my-lz-oapp/.env; then
            print_error "Missing RPC_URL_HEDERA in Hedera-OP/my-lz-oapp/.env"
            errors=$((errors + 1))
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        print_status "Environment file structure looks good ✅"
        return 0
    else
        print_error "Found $errors validation errors"
        return 1
    fi
}

show_next_steps() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Next Steps${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "1. Edit your environment files with real values:"
    echo "   • .env.local"
    echo "   • Hedera-OP/my-lz-oapp/.env"
    echo ""
    echo "2. Build and start the Docker container:"
    echo "   ./docker-manage.sh build"
    echo "   ./docker-manage.sh start"
    echo ""
    echo "3. Or use docker-compose directly:"
    echo "   docker-compose build"
    echo "   docker-compose up -d"
    echo ""
    echo "4. Check the application:"
    echo "   http://localhost:3000"
    echo "   http://localhost:3000/api/health"
    echo ""
}

main() {
    print_header
    
    if check_env_files; then
        print_status "Environment files already exist. Validating structure..."
        validate_env_structure
    else
        print_status "Setting up environment files..."
        create_env_files
        echo ""
        validate_env_structure
    fi
    
    show_next_steps
}

# Run main function
main "$@"
