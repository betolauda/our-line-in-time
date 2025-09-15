// Validation schemas using Zod

import { z } from 'zod';

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const MemorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  narrative: z.string(),
  dateType: z.enum(['exact', 'approximate', 'range', 'era']),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: GeoPointSchema,
  locationName: z.string().min(1).max(200),
  privacyLevel: z.enum(['public', 'family', 'private']),
  tags: z.array(z.string()),
  familyMembers: z.array(z.string().uuid()),
  createdBy: z.string().uuid(),
  lastModifiedBy: z.string().uuid(),
});

export const MediaItemSchema = z.object({
  id: z.string().uuid(),
  memoryId: z.string().uuid(),
  filename: z.string().min(1),
  mimeType: z.string(),
  fileSize: z.number().positive(),
  storagePath: z.string(),
  thumbnailPath: z.string().optional(),
  extractedMetadata: z.record(z.string(), z.any()),
  uploadedBy: z.string().uuid(),
  capturedAt: z.date().optional(),
  capturedLocation: GeoPointSchema.optional(),
  processingStatus: z.enum(['pending', 'processing', 'complete', 'error']),
});

export const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  dateOfBirth: z.date().optional(),
  role: z.enum(['admin', 'contributor', 'viewer', 'child']),
  generationLevel: z.number().int().min(0),
  isActive: z.boolean(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});