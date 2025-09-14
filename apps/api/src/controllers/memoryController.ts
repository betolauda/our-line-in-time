import { Request, Response } from 'express';
import { MemoryRepository } from '../repositories/memoryRepository';
import { MediaRepository } from '../repositories/mediaRepository';
import { MemorySchema } from '@our-line-in-time/shared';
import { AuthenticatedRequest } from '../middleware/auth';

const memoryRepository = new MemoryRepository();
const mediaRepository = new MediaRepository();

export const createMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = MemorySchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      mediaItems: true
    }).parse(req.body);

    const memory = await memoryRepository.create({
      ...validatedData,
      createdBy: req.user!.id,
      lastModifiedBy: req.user!.id,
      familyMembers: validatedData.familyMembers || [req.user!.id],
    });

    res.status(201).json({
      message: 'Memory created successfully',
      memory,
    });
  } catch (error) {
    console.error('Create memory error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error });
    }

    res.status(500).json({ error: 'Failed to create memory' });
  }
};

export const getMemories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0, search, location, startDate, endDate } = req.query;

    let memories = await memoryRepository.findByUserId(
      req.user!.id,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    // Apply filters
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      memories = memories.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm) ||
        memory.narrative.toLowerCase().includes(searchTerm) ||
        memory.locationName.toLowerCase().includes(searchTerm) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (startDate || endDate) {
      memories = memories.filter(memory => {
        const memoryDate = new Date(memory.startDate);
        if (startDate && memoryDate < new Date(startDate as string)) return false;
        if (endDate && memoryDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    // Load media items for each memory
    const memoriesWithMedia = await Promise.all(
      memories.map(async (memory) => {
        const mediaItems = await mediaRepository.findByMemoryId(memory.id);
        return { ...memory, mediaItems };
      })
    );

    res.json({
      memories: memoriesWithMedia,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: memoriesWithMedia.length,
      },
    });
  } catch (error) {
    console.error('Get memories error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
};

export const getMemoryById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const memory = await memoryRepository.findById(id);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // TODO: Check if user has permission to view this memory
    // For now, allow access if user is creator or in familyMembers

    // Load media items
    const mediaItems = await mediaRepository.findByMemoryId(memory.id);

    res.json({
      memory: { ...memory, mediaItems },
    });
  } catch (error) {
    console.error('Get memory error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
};

export const updateMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate update data
    const validatedData = MemorySchema.partial().omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      mediaItems: true,
    }).parse(updateData);

    const existingMemory = await memoryRepository.findById(id);
    if (!existingMemory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Check permissions - only creator or admin can edit
    if (existingMemory.createdBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions to edit this memory' });
    }

    const updatedMemory = await memoryRepository.update(id, validatedData, req.user!.id);

    if (!updatedMemory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Load media items
    const mediaItems = await mediaRepository.findByMemoryId(updatedMemory.id);

    res.json({
      message: 'Memory updated successfully',
      memory: { ...updatedMemory, mediaItems },
    });
  } catch (error) {
    console.error('Update memory error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error });
    }

    res.status(500).json({ error: 'Failed to update memory' });
  }
};

export const deleteMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingMemory = await memoryRepository.findById(id);
    if (!existingMemory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Check permissions - only creator or admin can delete
    if (existingMemory.createdBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions to delete this memory' });
    }

    // Delete associated media items first
    const mediaItems = await mediaRepository.findByMemoryId(id);
    // TODO: Delete actual files from MinIO before deleting database records

    const deleted = await memoryRepository.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
};

export const searchMemoriesByLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const memories = await memoryRepository.searchByLocation(
      parseFloat(lat as string),
      parseFloat(lng as string),
      parseFloat(radius as string),
      req.user!.id
    );

    // Load media items for each memory
    const memoriesWithMedia = await Promise.all(
      memories.map(async (memory) => {
        const mediaItems = await mediaRepository.findByMemoryId(memory.id);
        return { ...memory, mediaItems };
      })
    );

    res.json({
      memories: memoriesWithMedia,
      searchParams: {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        radius: parseFloat(radius as string),
      },
    });
  } catch (error) {
    console.error('Search memories by location error:', error);
    res.status(500).json({ error: 'Failed to search memories by location' });
  }
};