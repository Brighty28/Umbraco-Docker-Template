#!/bin/bash
# Separate init container: wait for SQL Server, create the database, then exit.

DB_NAME="${UMBRACO_DB:-UmbracoDb}"
SA_PASS="${MSSQL_SA_PASSWORD}"
SQL_HOST="${SQL_HOST:-sql}"

echo "init-db: Waiting for SQL Server at $SQL_HOST to accept connections..."
for i in $(seq 1 60); do
    /opt/mssql-tools18/bin/sqlcmd -S "$SQL_HOST" -U sa -P "$SA_PASS" -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "init-db: SQL Server is ready."
        break
    fi
    echo "init-db: Attempt $i - SQL Server not ready yet, retrying in 3s..."
    sleep 3
done

echo "init-db: Creating database '$DB_NAME' if it does not exist..."
/opt/mssql-tools18/bin/sqlcmd -S "$SQL_HOST" -U sa -P "$SA_PASS" -C -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_NAME')
BEGIN
    CREATE DATABASE [$DB_NAME];
    PRINT 'Database $DB_NAME created successfully.';
END
ELSE
    PRINT 'Database $DB_NAME already exists.';
"

if [ $? -eq 0 ]; then
    echo "init-db: Done."
else
    echo "init-db: ERROR - Failed to create database." >&2
    exit 1
fi
