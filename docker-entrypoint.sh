#!/bin/sh

set -e

# Generate runtime .env file
cat <<EOF > /app/.env
ANALYTICS_PROPERTY_ID=${ANALYTICS_PROPERTY_ID}
BITLY_TOKEN=${BITLY_TOKEN}
GOOGLE_CUSTOM_SEARCH_CX=${GOOGLE_CUSTOM_SEARCH_CX}
GOOGLE_SEARCH_API_KEY=${GOOGLE_SEARCH_API_KEY}
BASE_PATH=${BASE_PATH}
ASSET_PREFIX=${ASSET_PREFIX}
CMS_API=${CMS_API}
EOF

# copy .next files to enable connecting mounted volumes to static
mkdir -p /app/nginx/.next
cp -r /app/.next/. /app/nginx/.next/

# Start Next.js
exec yarn start