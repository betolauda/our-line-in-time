// Core data types for Our Line in Time

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type DateType = 'exact' | 'approximate' | 'range' | 'era';
export type PrivacyLevel = 'public' | 'family' | 'private';
export type FamilyRole = 'admin' | 'contributor' | 'viewer' | 'child';
export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Memory {
  id: string;
  title: string;
  narrative: string; // Will be RichText in future
  dateType: DateType;
  startDate: Date;
  endDate?: Date;
  location: GeoPoint;
  locationName: string;
  privacyLevel: PrivacyLevel;
  mediaItems: MediaItem[];
  tags: string[];
  familyMembers: string[]; // FamilyMember IDs
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  id: string;
  memoryId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  thumbnailPath?: string;
  extractedMetadata: MediaMetadata;
  uploadedBy: string;
  capturedAt?: Date;
  capturedLocation?: GeoPoint;
  processingStatus: ProcessingStatus;
  createdAt: Date;
}

export interface MediaMetadata {
  exif?: Record<string, any>;
  gps?: { lat: number; lng: number; accuracy?: number };
  duration?: number; // for video/audio
  dimensions?: { width: number; height: number };
}

export interface FamilyMember {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: Date;
  role: FamilyRole;
  generationLevel: number;
  isActive: boolean;
  preferences: FamilyPreferences;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface FamilyPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  privacy: {
    showInFamilyTree: boolean;
    allowLocationSharing: boolean;
  };
}

export interface FamilyRelationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: string; // 'parent', 'child', 'spouse', 'sibling', etc.
  createdAt: Date;
}