#!/bin/bash
# One-shot init container: create the Umbraco database then exit.
# Retries the CREATE DATABASE command to handle SQL Server still initializing.

DB_NAME="${UMBRACO_DB:-UmbracoDb}"
SA_PASS="${MSSQL_SA_PASSWORD}"
SQL_HOST="${SQL_HOST:-sql}"

echo "init-db: Creating database '$DB_NAME' on $SQL_HOST..."

for i in $(seq 1 30); do
    /opt/mssql-tools18/bin/sqlcmd \
        -S "$SQL_HOST" -U sa -P "$SA_PASS" -C \
        -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_NAME') CREATE DATABASE [$DB_NAME];" \
        2>&1

    if [ $? -eq 0 ]; then
        echo "init-db: Database '$DB_NAME' is ready."
        exit 0
    fi

    echo "init-db: Attempt $i failed, retrying in 3s..."
    sleep 3
done

echo "init-db: ERROR - Could not create database after 30 attempts." >&2
exit 1
