#!/bin/bash
set -e # Exit on any error

echo "Starting production deployment..."

# Build the project
npm run build

# Deploy to Cloudflare Workers with production environment
npx wrangler deploy --config wrangler.production.jsonc

echo "Production deployment completed successfully!"