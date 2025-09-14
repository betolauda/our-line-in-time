import { Readable } from 'stream';
import sharp from 'sharp';
import exifr from 'exifr';
import { minioClient, BUCKET_NAME } from '../config/storage';
import { MediaRepository } from '../repositories/mediaRepository';
import { MediaItem, MediaMetadata, GeoPoint } from '@our-line-in-time/shared';
import { generateId, sanitizeFilename } from '@our-line-in-time/shared';

export class MediaService {
  private mediaRepository: MediaRepository;

  constructor() {
    this.mediaRepository = new MediaRepository();
  }

  async uploadMedia(
    file: Express.Multer.File,
    memoryId: string,
    uploadedBy: string
  ): Promise<MediaItem> {
    const mediaId = generateId();
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const storagePath = `media/${mediaId}/${sanitizedFilename}`;

    try {
      // Extract metadata and EXIF data
      const metadata = await this.extractMetadata(file.buffer, file.mimetype);

      // Upload original file to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        storagePath,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      // Create thumbnail for images
      let thumbnailPath: string | undefined;
      if (file.mimetype.startsWith('image/')) {
        thumbnailPath = await this.createThumbnail(file.buffer, mediaId, sanitizedFilename);
      }

      // Extract GPS coordinates from EXIF
      const capturedLocation = this.extractGPSFromMetadata(metadata);
      const capturedAt = this.extractDateFromMetadata(metadata);

      // Save to database
      const mediaItem = await this.mediaRepository.create({
        memoryId,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath,
        thumbnailPath,
        extractedMetadata: metadata,
        uploadedBy,
        capturedAt,
        capturedLocation,
        processingStatus: 'complete',
      });

      return mediaItem;
    } catch (error) {
      // Mark as error if processing failed
      try {
        await this.mediaRepository.create({
          memoryId,
          filename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storagePath,
          extractedMetadata: {},
          uploadedBy,
          processingStatus: 'error',
        });
      } catch (dbError) {
        console.error('Failed to save error state to database:', dbError);
      }

      throw error;
    }
  }

  async getMediaUrl(mediaItem: MediaItem): Promise<string> {
    return await minioClient.presignedGetObject(BUCKET_NAME, mediaItem.storagePath, 24 * 60 * 60); // 24 hours
  }

  async getThumbnailUrl(mediaItem: MediaItem): Promise<string | null> {
    if (!mediaItem.thumbnailPath) return null;
    return await minioClient.presignedGetObject(BUCKET_NAME, mediaItem.thumbnailPath, 24 * 60 * 60);
  }

  async deleteMedia(mediaItem: MediaItem): Promise<void> {
    try {
      // Delete from MinIO
      await minioClient.removeObject(BUCKET_NAME, mediaItem.storagePath);
      if (mediaItem.thumbnailPath) {
        await minioClient.removeObject(BUCKET_NAME, mediaItem.thumbnailPath);
      }

      // Delete from database
      await this.mediaRepository.delete(mediaItem.id);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  private async extractMetadata(buffer: Buffer, mimeType: string): Promise<MediaMetadata> {
    const metadata: MediaMetadata = {};

    try {
      if (mimeType.startsWith('image/')) {
        // Extract EXIF data
        const exifData = await exifr.parse(buffer);
        metadata.exif = exifData;

        // Extract image dimensions
        const imageInfo = await sharp(buffer).metadata();
        metadata.dimensions = {
          width: imageInfo.width || 0,
          height: imageInfo.height || 0,
        };

        // Extract GPS data if available
        if (exifData?.latitude && exifData?.longitude) {
          metadata.gps = {
            lat: exifData.latitude,
            lng: exifData.longitude,
            accuracy: exifData.GPSHPositioningError,
          };
        }
      }
      // TODO: Add video/audio metadata extraction using ffprobe
    } catch (error) {
      console.warn('Failed to extract metadata:', error);
    }

    return metadata;
  }

  private async createThumbnail(
    buffer: Buffer,
    mediaId: string,
    filename: string
  ): Promise<string> {
    const thumbnailPath = `thumbnails/${mediaId}/thumb_${filename}`;

    try {
      // Create thumbnail using Sharp
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload thumbnail to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        thumbnailPath,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { 'Content-Type': 'image/jpeg' }
      );

      return thumbnailPath;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      throw error;
    }
  }

  private extractGPSFromMetadata(metadata: MediaMetadata): GeoPoint | undefined {
    if (metadata.gps?.lat && metadata.gps?.lng) {
      return {
        lat: metadata.gps.lat,
        lng: metadata.gps.lng,
      };
    }
    return undefined;
  }

  private extractDateFromMetadata(metadata: MediaMetadata): Date | undefined {
    if (metadata.exif?.DateTimeOriginal) {
      return new Date(metadata.exif.DateTimeOriginal);
    }
    if (metadata.exif?.DateTime) {
      return new Date(metadata.exif.DateTime);
    }
    return undefined;
  }
}