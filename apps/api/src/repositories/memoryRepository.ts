import { Pool } from 'pg';
import { Memory, GeoPoint } from '@our-line-in-time/shared';
import { pool } from '../config/database';

export class MemoryRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'mediaItems'>): Promise<Memory> {
    const query = `
      INSERT INTO memories (
        title, narrative, date_type, start_date, end_date,
        location, location_name, privacy_level, tags,
        created_by, last_modified_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10,
        $11, $12
      ) RETURNING
        id, title, narrative, date_type, start_date, end_date,
        ST_X(location) as lng, ST_Y(location) as lat,
        location_name, privacy_level, tags,
        created_by, last_modified_by, created_at, updated_at
    `;

    const values = [
      memoryData.title,
      memoryData.narrative,
      memoryData.dateType,
      memoryData.startDate,
      memoryData.endDate,
      memoryData.location.lng,
      memoryData.location.lat,
      memoryData.locationName,
      memoryData.privacyLevel,
      memoryData.tags,
      memoryData.createdBy,
      memoryData.lastModifiedBy,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToMemory(result.rows[0]);
  }

  async findById(id: string): Promise<Memory | null> {
    const query = `
      SELECT
        id, title, narrative, date_type, start_date, end_date,
        ST_X(location) as lng, ST_Y(location) as lat,
        location_name, privacy_level, tags,
        created_by, last_modified_by, created_at, updated_at
      FROM memories
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    return this.mapRowToMemory(result.rows[0]);
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Memory[]> {
    const query = `
      SELECT
        m.id, m.title, m.narrative, m.date_type, m.start_date, m.end_date,
        ST_X(m.location) as lng, ST_Y(m.location) as lat,
        m.location_name, m.privacy_level, m.tags,
        m.created_by, m.last_modified_by, m.created_at, m.updated_at
      FROM memories m
      WHERE m.created_by = $1 OR m.id IN (
        SELECT memory_id FROM memory_family_members WHERE family_member_id = $1
      )
      ORDER BY m.start_date DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.map(this.mapRowToMemory);
  }

  async update(id: string, updateData: Partial<Memory>, modifiedBy: string): Promise<Memory | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        if (key === 'location') {
          updates.push(`location = ST_SetSRID(ST_MakePoint($${paramCount + 1}, $${paramCount}), 4326)`);
          values.push((value as GeoPoint).lat, (value as GeoPoint).lng);
          paramCount += 2;
        } else {
          updates.push(`${this.camelToSnake(key)} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`last_modified_by = $${paramCount}`);
    values.push(modifiedBy);
    paramCount++;

    values.push(id); // Add id for WHERE clause

    const query = `
      UPDATE memories
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING
        id, title, narrative, date_type, start_date, end_date,
        ST_X(location) as lng, ST_Y(location) as lat,
        location_name, privacy_level, tags,
        created_by, last_modified_by, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;

    return this.mapRowToMemory(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM memories WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async searchByLocation(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    userId?: string
  ): Promise<Memory[]> {
    let query = `
      SELECT
        id, title, narrative, date_type, start_date, end_date,
        ST_X(location) as lng, ST_Y(location) as lat,
        location_name, privacy_level, tags,
        created_by, last_modified_by, created_at, updated_at
      FROM memories
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const values: any[] = [centerLng, centerLat, radiusKm * 1000]; // Convert km to meters

    if (userId) {
      query += ` AND (privacy_level = 'public' OR created_by = $4 OR id IN (
        SELECT memory_id FROM memory_family_members WHERE family_member_id = $4
      ))`;
      values.push(userId);
    } else {
      query += ` AND privacy_level = 'public'`;
    }

    query += ` ORDER BY start_date DESC`;

    const result = await this.pool.query(query, values);
    return result.rows.map(this.mapRowToMemory);
  }

  private mapRowToMemory(row: any): Memory {
    return {
      id: row.id,
      title: row.title,
      narrative: row.narrative,
      dateType: row.date_type,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      location: { lat: parseFloat(row.lat), lng: parseFloat(row.lng) },
      locationName: row.location_name,
      privacyLevel: row.privacy_level,
      tags: row.tags || [],
      familyMembers: [], // Will be populated by service layer
      mediaItems: [], // Will be populated by service layer
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}