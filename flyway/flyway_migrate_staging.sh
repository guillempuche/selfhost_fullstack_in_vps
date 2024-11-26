#!/bin/bash

# Define the base directory as the script's location
BASE_DIR="$(dirname "$0")"

# Define the path to .env.local using the base directory
ENV_FILE="$BASE_DIR/.env.local"

# Load environment variables from .env.local
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs) || { echo "Error loading $ENV_FILE"; exit 1; }
	echo "Loaded environment variables:"
  echo "FLYWAY_DB_URL=$FLYWAY_DB_URL"
  echo "FLYWAY_DB_USER=$FLYWAY_DB_USER"
else
  echo ".env.local file not found"
  exit 1
fi

# Set the location for migrations
export FLYWAY_LOCATIONS="filesystem:$BASE_DIR/migrations/common"
echo "Migrations directory: $FLYWAY_LOCATIONS"

# Run Flyway migration using the absolute path to the config file and pass the locations.
flyway -configFiles="$BASE_DIR/flyway.conf" -locations="$FLYWAY_LOCATIONS" migrate
