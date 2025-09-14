// Constants for Our Line in Time

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },
  MEMORIES: {
    BASE: '/api/memories',
    BY_ID: (id: string) => `/api/memories/${id}`,
    SEARCH: '/api/memories/search',
  },
  MEDIA: {
    UPLOAD: '/api/media/upload',
    BY_ID: (id: string) => `/api/media/${id}`,
    THUMBNAIL: (id: string) => `/api/media/${id}/thumbnail`,
  },
  EXPORT: {
    DATA: '/api/export/data',
    BACKUP: '/api/export/backup',
  },
} as const;

export const SUPPORTED_MEDIA_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  VIDEOS: ['video/mp4', 'video/mov', 'video/avi'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/m4a'],
} as const;

export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 50 * 1024 * 1024, // 50MB
} as const;

export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FAMILY: 'family',
  PRIVATE: 'private',
} as const;

export const FAMILY_ROLES = {
  ADMIN: 'admin',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
  CHILD: 'child',
} as const;