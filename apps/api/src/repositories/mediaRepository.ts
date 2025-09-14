import { Pool } from 'pg';
import { MediaItem, GeoPoint } from '@our-line-in-time/shared';
import { pool } from '../config/database';

export class MediaRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(mediaData: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
    const query = `
      INSERT INTO media_items (
        memory_id, filename, mime_type, file_size, storage_path,
        thumbnail_path, extracted_metadata, uploaded_by, captured_at,
        captured_location, processing_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        ${mediaData.capturedLocation ? 'ST_SetSRID(ST_MakePoint($11, $10), 4326)' : 'NULL'}, $12
      ) RETURNING
        id, memory_id, filename, mime_type, file_size, storage_path,
        thumbnail_path, extracted_metadata, uploaded_by, captured_at,
        ${mediaData.capturedLocation ? 'ST_X(captured_location) as lng, ST_Y(captured_location) as lat,' : 'NULL as lng, NULL as lat,'}
        processing_status, created_at
    `;

    const values = [
      mediaData.memoryId,
      mediaData.filename,
      mediaData.mimeType,
      mediaData.fileSize,
      mediaData.storagePath,
      mediaData.thumbnailPath,
      JSON.stringify(mediaData.extractedMetadata),
      mediaData.uploadedBy,
      mediaData.capturedAt,
      ...(mediaData.capturedLocation ? [mediaData.capturedLocation.lat, mediaData.capturedLocation.lng] : []),
      mediaData.processingStatus,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToMediaItem(result.rows[0]);
  }

  async findById(id: string): Promise<MediaItem | null> {
    const query = `
      SELECT
        id, memory_id, filename, mime_type, file_size, storage_path,
        thumbnail_path, extracted_metadata, uploaded_by, captured_at,
        ST_X(captured_location) as lng, ST_Y(captured_location) as lat,
        processing_status, created_at
      FROM media_items
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    return this.mapRowToMediaItem(result.rows[0]);
  }

  async findByMemoryId(memoryId: string): Promise<MediaItem[]> {
    const query = `
      SELECT
        id, memory_id, filename, mime_type, file_size, storage_path,
        thumbnail_path, extracted_metadata, uploaded_by, captured_at,
        ST_X(captured_location) as lng, ST_Y(captured_location) as lat,
        processing_status, created_at
      FROM media_items
      WHERE memory_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.pool.query(query, [memoryId]);
    return result.rows.map(this.mapRowToMediaItem);
  }

  async updateProcessingStatus(id: string, status: 'pending' | 'processing' | 'complete' | 'error'): Promise<void> {
    await this.pool.query(
      'UPDATE media_items SET processing_status = $1 WHERE id = $2',
      [status, id]
    );
  }

  async updateThumbnailPath(id: string, thumbnailPath: string): Promise<void> {
    await this.pool.query(
      'UPDATE media_items SET thumbnail_path = $1 WHERE id = $2',
      [thumbnailPath, id]
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM media_items WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async findPendingProcessing(limit = 10): Promise<MediaItem[]> {
    const query = `
      SELECT
        id, memory_id, filename, mime_type, file_size, storage_path,
        thumbnail_path, extracted_metadata, uploaded_by, captured_at,
        ST_X(captured_location) as lng, ST_Y(captured_location) as lat,
        processing_status, created_at
      FROM media_items
      WHERE processing_status = 'pending'
      ORDER BY created_at ASC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(this.mapRowToMediaItem);
  }

  private mapRowToMediaItem(row: any): MediaItem {
    const capturedLocation: GeoPoint | undefined =
      row.lat && row.lng ? { lat: parseFloat(row.lat), lng: parseFloat(row.lng) } : undefined;

    return {
      id: row.id,
      memoryId: row.memory_id,
      filename: row.filename,
      mimeType: row.mime_type,
      fileSize: parseInt(row.file_size),
      storagePath: row.storage_path,
      thumbnailPath: row.thumbnail_path,
      extractedMetadata: row.extracted_metadata || {},
      uploadedBy: row.uploaded_by,
      capturedAt: row.captured_at ? new Date(row.captured_at) : undefined,
      capturedLocation,
      processingStatus: row.processing_status,
      createdAt: new Date(row.created_at),
    };
  }
}