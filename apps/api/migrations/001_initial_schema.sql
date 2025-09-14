-- Initial schema for Our Line in Time
-- Enable PostGIS extensions (already done in init-db.sql)

-- Family Members table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer', 'child')),
    generation_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Family Relationships table
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(from_member_id, to_member_id, relationship_type)
);

-- Memories table
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    narrative TEXT NOT NULL DEFAULT '',
    date_type VARCHAR(20) NOT NULL CHECK (date_type IN ('exact', 'approximate', 'range', 'era')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    location_name VARCHAR(500) NOT NULL,
    privacy_level VARCHAR(20) NOT NULL CHECK (privacy_level IN ('public', 'family', 'private')),
    tags TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES family_members(id),
    last_modified_by UUID NOT NULL REFERENCES family_members(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Memory Family Members junction table (many-to-many)
CREATE TABLE memory_family_members (
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (memory_id, family_member_id)
);

-- Media Items table
CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    thumbnail_path VARCHAR(1000),
    extracted_metadata JSONB NOT NULL DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES family_members(id),
    captured_at TIMESTAMP WITH TIME ZONE,
    captured_location GEOMETRY(POINT, 4326),
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'complete', 'error')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_active ON family_members(is_active);
CREATE INDEX idx_memories_created_by ON memories(created_by);
CREATE INDEX idx_memories_start_date ON memories(start_date);
CREATE INDEX idx_memories_privacy_level ON memories(privacy_level);
CREATE INDEX idx_memories_location ON memories USING GIST(location);
CREATE INDEX idx_media_items_memory_id ON media_items(memory_id);
CREATE INDEX idx_media_items_uploaded_by ON media_items(uploaded_by);
CREATE INDEX idx_media_items_processing_status ON media_items(processing_status);
CREATE INDEX idx_media_items_captured_location ON media_items USING GIST(captured_location);

-- Update triggers for memories
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_update_trigger
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();