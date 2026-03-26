#!/bin/bash
# Entrypoint script for Umbraco Docker container
# Generates a dev HTTPS certificate on first run (persisted to /app/certs volume)

CERT_DIR="/app/certs"
CERT_PATH="$CERT_DIR/devcert.pfx"
CERT_PASSWORD="${CERT_PASSWORD:-devcert}"

mkdir -p "$CERT_DIR"

# Generate a self-signed cert if one doesn't already exist (or if user hasn't mounted their own)
if [ ! -f "$CERT_PATH" ]; then
    echo "Generating HTTPS development certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/devcert.key" \
        -out "$CERT_DIR/devcert.crt" \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

    # Create a PFX bundle that .NET Kestrel can use directly
    openssl pkcs12 -export -out "$CERT_PATH" \
        -inkey "$CERT_DIR/devcert.key" \
        -in "$CERT_DIR/devcert.crt" \
        -passout "pass:$CERT_PASSWORD"

    echo "Certificate generated at $CERT_PATH"
    echo ""
    echo "To trust this certificate on your host machine:"
    echo "  1. Copy it out:  docker cp \$(docker compose ps -q umbraco):/app/certs/devcert.crt ./devcert.crt"
    echo "  2. Windows:      certutil -addstore -user Root devcert.crt"
    echo "  3. macOS:        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain devcert.crt"
    echo "  4. Linux:        sudo cp devcert.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
    echo ""
else
    echo "Using existing HTTPS certificate at $CERT_PATH"
fi

# Export cert path and password for Kestrel
export CERT_PATH
export CERT_PASSWORD

exec dotnet UmbracoSite.dll "$@"
