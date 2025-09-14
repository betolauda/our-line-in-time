import { Request, Response } from 'express';
import { MediaService } from '../services/mediaService';
import { MediaRepository } from '../repositories/mediaRepository';
import { AuthenticatedRequest } from '../middleware/auth';

const mediaService = new MediaService();
const mediaRepository = new MediaRepository();

export const uploadMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memoryId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }

    // TODO: Verify user has permission to upload to this memory

    const mediaItem = await mediaService.uploadMedia(file, memoryId, req.user!.id);
    const mediaUrl = await mediaService.getMediaUrl(mediaItem);
    const thumbnailUrl = await mediaService.getThumbnailUrl(mediaItem);

    res.status(201).json({
      message: 'Media uploaded successfully',
      mediaItem: {
        ...mediaItem,
        url: mediaUrl,
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({
      error: 'Failed to upload media',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const uploadMultipleMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memoryId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }

    // Upload all files
    const uploadPromises = files.map(file =>
      mediaService.uploadMedia(file, memoryId, req.user!.id)
    );

    const mediaItems = await Promise.all(uploadPromises);

    // Get URLs for all media items
    const mediaWithUrls = await Promise.all(
      mediaItems.map(async (item) => ({
        ...item,
        url: await mediaService.getMediaUrl(item),
        thumbnailUrl: await mediaService.getThumbnailUrl(item),
      }))
    );

    res.status(201).json({
      message: `${mediaItems.length} media files uploaded successfully`,
      mediaItems: mediaWithUrls,
    });
  } catch (error) {
    console.error('Multiple media upload error:', error);
    res.status(500).json({
      error: 'Failed to upload media files',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getMediaById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mediaItem = await mediaRepository.findById(id);

    if (!mediaItem) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // TODO: Check if user has permission to view this media

    const mediaUrl = await mediaService.getMediaUrl(mediaItem);
    const thumbnailUrl = await mediaService.getThumbnailUrl(mediaItem);

    res.json({
      ...mediaItem,
      url: mediaUrl,
      thumbnailUrl,
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to retrieve media' });
  }
};

export const getMediaByMemoryId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memoryId } = req.params;
    const mediaItems = await mediaRepository.findByMemoryId(memoryId);

    // TODO: Check if user has permission to view this memory's media

    const mediaWithUrls = await Promise.all(
      mediaItems.map(async (item) => ({
        ...item,
        url: await mediaService.getMediaUrl(item),
        thumbnailUrl: await mediaService.getThumbnailUrl(item),
      }))
    );

    res.json({ mediaItems: mediaWithUrls });
  } catch (error) {
    console.error('Get memory media error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory media' });
  }
};

export const deleteMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mediaItem = await mediaRepository.findById(id);

    if (!mediaItem) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // TODO: Check if user has permission to delete this media
    // For now, only allow the uploader or admin to delete
    if (mediaItem.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions to delete this media' });
    }

    await mediaService.deleteMedia(mediaItem);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};