# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
# Install dependencies
npm install

# Development mode (all services)
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
npm run test:coverage

# Linting and type checking
npm run lint
npm run type-check
```

### Workspace-Specific Commands
```bash
# API development
npm run dev --workspace=@our-line-in-time/api
npm run db:migrate --workspace=@our-line-in-time/api

# Web development
npm run dev --workspace=@our-line-in-time/web

# Build shared packages (required before development)
npm run build --workspace=@our-line-in-time/shared
npm run build --workspace=@our-line-in-time/ui
```

### Docker Operations
```bash
# Start all services with Docker
cd infrastructure/docker
docker-compose up -d

# Run database migrations in Docker
docker-compose exec api npm run db:migrate

# Database backup
docker-compose exec db pg_dump -U postgres our_line_in_time > backup.sql
```

## Architecture Overview

This is a **monorepo family memory preservation platform** with the following structure:

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Passport.js + JWT
- **Database**: PostgreSQL 16 + PostGIS (geographic data)
- **Storage**: MinIO (S3-compatible object storage)
- **Cache**: Redis
- **Build**: Turbo (monorepo build system)
- **Deployment**: Docker Compose + Nginx

### Workspace Structure
```
apps/
├── api/           # Express backend with authentication, media handling, PostgreSQL
├── web/           # Next.js frontend with React components and Zustand state

packages/
├── shared/        # Common types, schemas (Zod), utilities
├── ui/            # Shared React components (Radix UI + Tailwind)

infrastructure/
├── docker/        # PostgreSQL, Redis, MinIO, Nginx configuration
```

### Key Architectural Patterns

**Data Models**: All core types defined in `packages/shared/src/types/index.ts` including:
- `Memory`: Core entity with geographic data (PostGIS GEOMETRY points)
- `MediaItem`: Photos/videos with EXIF metadata extraction
- `FamilyMember`: User accounts with role-based access

**Authentication**: JWT-based with Passport.js strategies in `apps/api/src/config/passport.ts`

**Media Handling**:
- Upload via Multer → EXIF extraction with `exifr` → MinIO storage
- Geographic coordinates extracted from EXIF and stored as PostGIS points
- Image processing with Sharp for thumbnails

**Database**:
- PostgreSQL with PostGIS extension for geographic queries
- Migrations in `apps/api/src/scripts/migrate.ts`
- Connection pooling via `pg` library

**State Management**:
- Frontend uses Zustand for state management
- API responses follow consistent schemas defined in shared package

### Development Dependencies

**Prerequisites**:
- Node.js 18+
- Docker & Docker Compose for full stack development
- PostgreSQL with PostGIS extension

**Shared Package Dependencies**: Always build shared packages before API/web development:
1. `@our-line-in-time/shared` (types, schemas, utilities)
2. `@our-line-in-time/ui` (React components)

### Environment Configuration

Copy `.env.example` to `.env` with these key variables:
- `DATABASE_URL`: PostgreSQL connection with PostGIS
- `REDIS_URL`: Redis for session storage
- `MINIO_*`: Object storage configuration
- `JWT_SECRET`: Authentication tokens
- `NEXT_PUBLIC_API_URL`: Frontend→API communication

### Testing Strategy

- **API**: Jest with Supertest for integration tests
- **Web**: Vitest with Testing Library for component tests
- **Shared**: Unit tests for utilities and schemas
- Run `npm run test:coverage` for coverage reports

### Performance Monitoring

Custom performance middleware in `apps/api/src/middleware/performance.ts` tracks:
- Request timing and memory usage
- Metrics available at `/api/performance` endpoint
- Check with: `npm run performance:check`