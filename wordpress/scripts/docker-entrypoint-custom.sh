#!/bin/bash
set -e

# Run the original WordPress entrypoint first
docker-entrypoint.sh "$@" &
WP_PID=$!

# Wait a bit for WordPress to initialize
sleep 5

# Configure JWT
/usr/local/bin/configure-jwt.sh

# Wait for the WordPress process
wait $WP_PID
