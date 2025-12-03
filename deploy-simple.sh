#!/bin/bash

# Deployment script for Sales Proxy Worker

echo "Starting deployment process..."

# Set the Cloudflare API token
export CLOUDFLARE_API_TOKEN=deI-KkieYnGg7OnE2Righ6xE3auk1JV1SHaedkao

# Deploy directly with wrangler using the fixed configuration
echo "Deploying with wrangler..."
npx wrangler deploy --config wrangler-fixed.jsonc

echo "Deployment completed successfully!"
echo "Worker is available at: https://sales-proxy.zd261998.workers.dev"

echo ""
echo "To set your API keys securely, use the following commands:"
echo "npx wrangler secret put DEEPSEEK_API_KEY"
echo "npx wrangler secret put TENCENT_CLOUD_API_KEY"