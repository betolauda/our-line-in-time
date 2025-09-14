-- Initialize Our Line in Time database with PostGIS extensions

-- Enable PostGIS extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create initial database schema
CREATE SCHEMA IF NOT EXISTS our_line_in_time;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA our_line_in_time TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA our_line_in_time TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA our_line_in_time TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA our_line_in_time TO postgres;