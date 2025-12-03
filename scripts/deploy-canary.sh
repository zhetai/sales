#!/bin/bash
set -e # Exit on any error

echo "Starting canary deployment..."

# Build the project
npm run build

# Deploy to Cloudflare Workers with canary environment
npx wrangler deploy --config wrangler.canary.jsonc

echo "Canary deployment completed successfully!"