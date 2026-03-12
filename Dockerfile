# ==============================================================================
# Multi-stage Dockerfile for configurable client website package
# Designed for Azure App Service deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build – compile SCSS, bundle JS, generate static assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source files
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Accept build-time client configuration
ARG CLIENT_ID=default
ARG ENVIRONMENT=production

ENV CLIENT_ID=${CLIENT_ID}
ENV ENVIRONMENT=${ENVIRONMENT}

# Run the build pipeline:
#   1. Merge base config with client overrides
#   2. Compile SCSS with client theme variables
#   3. Bundle and minify JS
#   4. Render HTML templates with client content
RUN node scripts/build.js --client=${CLIENT_ID} --env=${ENVIRONMENT}

# ------------------------------------------------------------------------------
# Stage 2: Production – lightweight Nginx serving static assets
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Labels for Azure App Service & container registry
LABEL maintainer="platform-team"
LABEL com.azure.app-service.compatible="true"

# Install envsubst for runtime config injection
RUN apk add --no-cache gettext

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copy built assets from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy runtime configuration script
COPY docker/entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Azure App Service expects port 80 (or 8080 via WEBSITES_PORT)
EXPOSE 80

# Health check for Azure App Service
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

# Nginx base image entrypoint handles template substitution + startup
CMD ["nginx", "-g", "daemon off;"]
