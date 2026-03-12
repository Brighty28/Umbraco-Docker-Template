#!/bin/bash
# Wait for SQL Server to be ready, then create the database if it doesn't exist.
# This script runs inside the SQL Server container on first startup.

DB_NAME="${UMBRACO_DB:-UmbracoDb}"

echo "Waiting for SQL Server to start..."
for i in {1..30}; do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "SQL Server is ready."
        break
    fi
    sleep 2
done

echo "Ensuring database '$DB_NAME' exists..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_NAME')
BEGIN
    CREATE DATABASE [$DB_NAME];
    PRINT 'Database $DB_NAME created.';
END
ELSE
    PRINT 'Database $DB_NAME already exists.';
"
