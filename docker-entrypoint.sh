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

# also place runtime-config.js in the static volume so nginx can serve it
# at /_next/static/runtime-config.js without needing a dedicated nginx location rule
mkdir -p /app/nginx/.next/static
cp /app/public/runtime-config.js /app/nginx/.next/static/runtime-config.js

# Start Next.js
exec yarn start