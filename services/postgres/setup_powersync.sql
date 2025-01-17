-- Documentation: https://docs.powersync.com/installation/database-setup#other-self-hosted

-- Check if powersync_role exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'powersync_role') THEN
        CREATE ROLE powersync_role WITH REPLICATION LOGIN PASSWORD 'hola-esto-es-una-contraseña-muy-segura';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO powersync_role;

-- Create powersync publication if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
        CREATE PUBLICATION powersync FOR ALL TABLES;
    END IF;
END
$$;
