#!/bin/bash
set -e # Exit on any error

echo "Starting staging deployment..."

# Build the project
npm run build

# Deploy to Cloudflare Workers with staging environment
npx wrangler deploy --config wrangler.staging.jsonc

echo "Staging deployment completed successfully!"