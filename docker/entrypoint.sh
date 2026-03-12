#!/bin/sh
# ==============================================================================
# Runtime configuration injection
# Replaces placeholder tokens in built HTML/JS with environment variable values.
# This allows the same Docker image to be reconfigured at deployment time
# without rebuilding (useful for feature flags, API URLs, analytics IDs).
# ==============================================================================

set -e

CONFIG_DIR="/usr/share/nginx/html"

echo "[runtime-config] Injecting environment variables..."

# Replace __PLACEHOLDER__ tokens in the runtime config JS file
if [ -f "$CONFIG_DIR/js/runtime-config.js" ]; then
    # Each variable has a build-time placeholder that gets swapped at runtime
    sed -i \
        -e "s|__SITE_TITLE__|${SITE_TITLE:-}|g" \
        -e "s|__ANALYTICS_ID__|${ANALYTICS_ID:-}|g" \
        -e "s|__API_BASE_URL__|${API_BASE_URL:-}|g" \
        -e "s|__FEATURE_FLAGS__|${FEATURE_FLAGS:-}|g" \
        "$CONFIG_DIR/js/runtime-config.js"

    echo "[runtime-config] Injected runtime variables into runtime-config.js"
else
    echo "[runtime-config] No runtime-config.js found, skipping."
fi

echo "[runtime-config] Done."
