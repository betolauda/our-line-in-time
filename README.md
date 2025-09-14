# Our Line in Time

A privacy-first, self-hosted family memory preservation platform built with Next.js, Express, PostgreSQL, and Docker.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Git

### Deploy with Docker

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd our-line-in-time
   cp .env.example .env
   ```

2. **Start Services**
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   ```

3. **Run Database Migrations**
   ```bash
   docker-compose exec api npm run db:migrate
   ```

4. **Access the Application**
   - Web App: http://localhost (via Nginx)
   - Direct Web Access: http://localhost:3000
   - API: http://localhost:3001
   - MinIO Console: http://localhost:9001

### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Shared Packages**
   ```bash
   npm run build --workspace=@our-line-in-time/shared
   npm run build --workspace=@our-line-in-time/ui
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: API
   npm run dev --workspace=@our-line-in-time/api

   # Terminal 2: Web
   npm run dev --workspace=@our-line-in-time/web
   ```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16 + PostGIS 3.4
- **Storage**: MinIO (S3-compatible)
- **Cache**: Redis
- **Authentication**: Passport.js + JWT
- **Deployment**: Docker Compose + Nginx

### Project Structure

```
our-line-in-time/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express backend
├── packages/
│   ├── shared/              # Shared types and utilities
│   └── ui/                  # Shared UI components
├── infrastructure/
│   └── docker/              # Docker configuration
└── docs/                    # Documentation
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/our_line_in_time

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Docker Services

- **PostgreSQL + PostGIS**: Geographic database
- **Redis**: Session storage and caching
- **MinIO**: Object storage for media files
- **API**: Express backend server
- **Web**: Next.js frontend server
- **Nginx**: Reverse proxy and load balancer

## 🗄️ Database Schema

### Core Tables

- `family_members`: User accounts and family relationships
- `memories`: Core memory entities with geographic data
- `media_items`: Photos, videos, audio with EXIF metadata
- `memory_family_members`: Many-to-many relationship table

### PostGIS Integration

- Geographic points stored as `GEOMETRY(POINT, 4326)`
- Spatial indexing for location-based queries
- Support for GPS coordinate extraction from EXIF

## 📸 Media Handling

### Supported Formats

- **Images**: JPEG, PNG, WebP, HEIC
- **Videos**: MP4, MOV, AVI
- **Audio**: MP3, WAV, M4A

### Features

- Automatic EXIF metadata extraction
- GPS coordinate parsing and storage
- Thumbnail generation for images
- S3-compatible object storage via MinIO

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing (12 rounds)
- Role-based access control
- Input validation with Zod schemas
- Self-hosted data sovereignty

## 🛠️ Development

### Available Scripts

```bash
# Build all packages
npm run build

# Development mode
npm run dev

# Linting
npm run lint

# Type checking
npm run type-check

# Tests
npm run test
```

### Database Operations

```bash
# Run migrations
npm run db:migrate --workspace=@our-line-in-time/api

# Seed data (when implemented)
npm run db:seed --workspace=@our-line-in-time/api
```

## 🚢 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   cp .env.example .env.production
   # Configure production values
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **SSL/HTTPS Setup**
   - Configure nginx with SSL certificates
   - Update CORS settings for production domain

### Backup Strategy

```bash
# Database backup
docker-compose exec db pg_dump -U postgres our_line_in_time > backup.sql

# MinIO data backup
docker-compose exec minio mc mirror /data /backup-location
```

## 📋 Story 1.1 Implementation Status

### ✅ Completed Features

- [x] Monorepo structure with npm workspaces
- [x] Docker infrastructure with all services
- [x] Authentication system (Passport.js + JWT)
- [x] PostgreSQL database with PostGIS
- [x] Data models with geographic support
- [x] Photo upload with EXIF extraction
- [x] MinIO object storage integration
- [x] Basic web interface structure

### 🚧 In Progress

- [ ] Frontend authentication pages
- [ ] Timeline React component
- [ ] Memory display interface

### 📅 Next Phase

- [ ] Complete frontend authentication
- [ ] Timeline visualization
- [ ] Memory creation workflow
- [ ] Data backup/export functionality

## 🤝 Contributing

This is a family memory preservation platform designed for self-hosting. Contributions welcome for:

- Bug fixes and improvements
- Documentation enhancements
- Feature suggestions
- Security audits

## 📄 License

[License to be determined]

---

**Built with ❤️ for families who want to preserve their memories while maintaining privacy and data sovereignty.**