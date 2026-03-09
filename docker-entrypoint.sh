#!/bin/sh

set -e

cat <<EOF > /app/public/runtime-config.js
window.RUNTIME_CONFIG = {
  CMS_API: "${CMS_API}",
  ANALYTICS_PROPERTY_ID: "${ANALYTICS_PROPERTY_ID}",
  BASE_PATH: "${BASE_PATH}"
};
EOF

# copy .next files to enable connecting mounted volumes to static
mkdir -p /app/nginx/.next
cp -r /app/.next/. /app/nginx/.next/

# Start Next.js
exec yarn start