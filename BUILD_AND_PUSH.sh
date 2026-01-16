#!/bin/bash

# Script pour builder et pusher les images Docker vers GitHub Container Registry
# Usage: ./BUILD_AND_PUSH.sh

set -e

GITHUB_USER="fastus1"
REPO_NAME="pingrid-v2"

echo "🔨 Building Docker images..."

# Build backend
echo "Building backend..."
docker build -t ghcr.io/${GITHUB_USER}/${REPO_NAME}-backend:latest ./backend

# Build frontend
echo "Building frontend..."
docker build -t ghcr.io/${GITHUB_USER}/${REPO_NAME}-frontend:latest ./frontend

echo "✅ Build complete!"
echo ""
echo "📦 Images built:"
echo "  - ghcr.io/${GITHUB_USER}/${REPO_NAME}-backend:latest"
echo "  - ghcr.io/${GITHUB_USER}/${REPO_NAME}-frontend:latest"
echo ""
echo "🔐 To push to GitHub Container Registry:"
echo "  1. Create a Personal Access Token with 'write:packages' permission"
echo "  2. Run: echo \$GITHUB_TOKEN | docker login ghcr.io -u ${GITHUB_USER} --password-stdin"
echo "  3. Run: docker push ghcr.io/${GITHUB_USER}/${REPO_NAME}-backend:latest"
echo "  4. Run: docker push ghcr.io/${GITHUB_USER}/${REPO_NAME}-frontend:latest"
echo ""
echo "Or push now? (y/n)"
read -r PUSH_NOW

if [ "$PUSH_NOW" = "y" ]; then
    echo "Pushing images..."
    docker push ghcr.io/${GITHUB_USER}/${REPO_NAME}-backend:latest
    docker push ghcr.io/${GITHUB_USER}/${REPO_NAME}-frontend:latest
    echo "✅ Images pushed successfully!"
    echo ""
    echo "📝 Update docker-compose.registry.yml and use it in Portainer"
fi
