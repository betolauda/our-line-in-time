# Our Line in Time Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **Our Line in Time**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template Analysis

**Result:** N/A - Greenfield Project

Your PRD indicates this is a greenfield project with self-hosting requirements and family-focused privacy. No existing templates mentioned, but I recommend considering:

- **T3 Stack** (Next.js + tRPC + Prisma + Tailwind) for rapid prototyping
- **Custom Docker-based solution** for better self-hosting control

**Recommendation:** Custom approach to meet self-hosting and privacy requirements.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-13 | 1.0 | Initial architecture design | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

Our Line in Time employs a **privacy-first, self-hosted fullstack architecture** with a React-based Progressive Web App frontend and Node.js backend, utilizing PostgreSQL with PostGIS extensions for multimedia + geographic + temporal data storage. The system follows a **monorepo structure** deployed via Docker containers, enabling family members to collaborate on memory preservation while maintaining complete data sovereignty. Key integration points include real-time WebSocket connections for collaborative editing, S3-compatible object storage for multimedia assets, and OpenStreetMap integration for geographical context, all designed to scale progressively from single-user (Milestone 1) to multi-generational family collaboration (Milestone 8).

### Platform and Infrastructure Choice

**Platform:** Self-Hosted Docker Infrastructure
**Key Services:** Docker, PostgreSQL with PostGIS, Redis, MinIO (S3-compatible), Nginx
**Deployment Host and Regions:** Local/NAS deployment with optional cloud backup

### Repository Structure

**Structure:** Monorepo with shared packages
**Monorepo Tool:** npm workspaces (simple, widely supported)
**Package Organization:** Apps (web, api) + Packages (shared types, UI components, utilities)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Family Network"
        U1[👤 Parent] --> PWA[Web App]
        U2[👤 Child] --> PWA
        U3[👤 Grandparent] --> PWA
        M1[📱 Mobile] --> PWA
    end

    subgraph "Docker Host (Home/NAS)"
        PWA --> LB[Nginx Load Balancer]
        LB --> API[Node.js API Server]
        API --> WS[WebSocket Server]
        API --> DB[(PostgreSQL + PostGIS)]
        API --> REDIS[(Redis Cache)]
        API --> S3[MinIO Object Storage]

        subgraph "Media Processing"
            API --> IMG[Image Processing]
            API --> VID[Video Processing]
            API --> GEO[Geographic Processing]
        end
    end

    subgraph "External Services"
        API --> MAP[OpenStreetMap APIs]
        API --> BACKUP[External Backup Storage]
    end

    subgraph "Data Flows"
        DB --> SPATIAL[Spatial Queries]
        DB --> TEMPORAL[Timeline Queries]
        S3 --> MEDIA[Multimedia Assets]
        REDIS --> COLLAB[Real-time Collaboration]
    end
```

### Architectural Patterns

- **Jamstack + API Architecture:** Static frontend with dynamic API backend - _Rationale:_ Enables offline-first family memories with real-time collaboration when needed
- **Component-Based UI:** Modular React components with TypeScript - _Rationale:_ Supports diverse user interfaces from child-friendly to adult advanced views
- **Repository Pattern:** Abstract data access for multimedia/geographic/temporal data - _Rationale:_ Enables future database migrations and testing of complex spatial queries
- **Event-Driven Collaboration:** WebSocket events for real-time family editing - _Rationale:_ Multiple family members can simultaneously contribute to memory documentation
- **Domain-Driven Design:** Organize code around Memory, Location, Timeline, Family domains - _Rationale:_ Aligns with your PRD's core concepts and milestone progression
- **CQRS for Complex Queries:** Separate read/write models for geographic-temporal queries - _Rationale:_ Optimizes performance for complex "show memories near location X during time period Y" queries

---

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.x | Type-safe frontend development | Essential for shared types across multimedia/geographic data models |
| **Frontend Framework** | Next.js | 14.x | React framework with SSR/SSG | File-based routing, built-in optimization, excellent Docker deployment |
| **UI Component Library** | Shadcn/ui + Radix | Latest | Accessible component system | Unstyled, customizable, excellent for multi-generational UX |
| **State Management** | Zustand | 4.x | Lightweight state management | Simple for solo dev, handles real-time collaboration state |
| **Backend Language** | TypeScript | 5.x | Type-safe backend development | Shared types with frontend, excellent Node.js ecosystem |
| **Backend Framework** | Express.js | 4.x | Minimal Node.js web framework | Battle-tested, extensive middleware, perfect for REST APIs |
| **API Style** | REST + WebSockets | N/A | HTTP APIs + real-time updates | REST for CRUD, WebSockets for collaborative editing |
| **Database** | PostgreSQL + PostGIS | 16.x + 3.4.x | Spatial database with geographic extensions | Best-in-class geographic queries for FamilyAtlas features |
| **Cache** | Redis | 7.x | Session storage + real-time features | WebSocket state, session management, family collaboration |
| **File Storage** | MinIO | Latest | S3-compatible object storage | Self-hosted media storage with family data sovereignty |
| **Authentication** | Passport.js + JWT | Latest | Family-based authentication | Local auth for self-hosting, supports family roles |
| **Frontend Testing** | Vitest + Testing Library | Latest | Unit and integration testing | Fast, modern testing for React components |
| **Backend Testing** | Jest + Supertest | Latest | API and service testing | Comprehensive backend testing with database mocking |
| **E2E Testing** | Playwright | Latest | End-to-end testing | Multi-browser family workflow testing |
| **Build Tool** | npm | 10.x | Package management and scripts | Simple, reliable, excellent workspace support |
| **Bundler** | Next.js built-in | N/A | Frontend bundling and optimization | Integrated with Next.js, optimized for production |
| **IaC Tool** | Docker Compose | 2.x | Container orchestration | Simple multi-container deployment for families |
| **CI/CD** | GitHub Actions | N/A | Automated testing and deployment | Free for open source, excellent Docker integration |
| **Monitoring** | Docker logs + Simple Analytics | N/A | Basic monitoring for families | Lightweight, privacy-focused, sufficient for family use |
| **Logging** | Winston | 3.x | Structured application logging | Configurable, reliable, good Docker integration |
| **CSS Framework** | Tailwind CSS | 3.x | Utility-first styling | Rapid UI development, excellent responsive design |

---

## Data Models

### Memory

**Purpose:** Core entity representing a family memory with multimedia content, geographic location, and temporal context. Supports flexible dating (exact dates, approximate periods, decades) and nested event relationships.

**Key Attributes:**
- `id`: UUID - Unique identifier for cross-generational linking
- `title`: string - Human-readable memory title
- `narrative`: RichText - Rich text story content with formatting
- `dateType`: enum('exact', 'approximate', 'range', 'era') - Flexible temporal precision
- `startDate`: Date - Primary date or range start
- `endDate`: Date? - Optional range end for trips/periods
- `location`: Point (PostGIS) - Geographic coordinates with privacy controls
- `locationName`: string - Human-readable location description
- `privacyLevel`: enum('public', 'family', 'private') - Multi-generational access control
- `createdBy`: UUID - Original author for family attribution
- `lastModifiedBy`: UUID - Latest editor for collaboration tracking

**TypeScript Interface:**
```typescript
interface Memory {
  id: string;
  title: string;
  narrative: RichTextContent;
  dateType: 'exact' | 'approximate' | 'range' | 'era';
  startDate: Date;
  endDate?: Date;
  location: GeoPoint;
  locationName: string;
  privacyLevel: 'public' | 'family' | 'private';
  mediaItems: MediaItem[];
  tags: string[];
  familyMembers: FamilyMember[];
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- One-to-many with MediaItem (photos, videos, audio)
- Many-to-many with FamilyMember (who was involved)
- Hierarchical self-reference (nested events and sub-timelines)

### MediaItem

**Purpose:** Handles all multimedia assets (photos, videos, audio) with metadata preservation, geographic tagging, and family collaboration tracking.

**Key Attributes:**
- `id`: UUID - Unique media identifier
- `filename`: string - Original filename preservation
- `mimeType`: string - File type for proper handling
- `fileSize`: number - Storage management
- `storagePath`: string - MinIO object storage path
- `thumbnailPath`: string - Optimized thumbnail location
- `extractedMetadata`: JSONB - EXIF, GPS, timestamps from file
- `uploadedBy`: UUID - Family member attribution
- `capturedAt`: Date - When photo/video was taken (from EXIF or manual)
- `capturedLocation`: Point? - GPS from EXIF or manual tagging
- `processingStatus`: enum - Thumbnail generation, metadata extraction status

**TypeScript Interface:**
```typescript
interface MediaItem {
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
  processingStatus: 'pending' | 'processing' | 'complete' | 'error';
  createdAt: Date;
}

interface MediaMetadata {
  exif?: Record<string, any>;
  gps?: { lat: number; lng: number; accuracy?: number };
  duration?: number; // for video/audio
  dimensions?: { width: number; height: number };
}
```

**Relationships:**
- Belongs-to Memory
- Belongs-to FamilyMember (uploadedBy)

### FamilyMember

**Purpose:** Represents family members across generations with role-based permissions and multi-generational relationship tracking.

**Key Attributes:**
- `id`: UUID - Unique family member identifier
- `email`: string - Authentication identifier
- `name`: string - Display name
- `dateOfBirth`: Date? - Optional for age-appropriate features
- `role`: enum('admin', 'contributor', 'viewer', 'child') - Permission levels
- `generationLevel`: number - For family tree organization (0=oldest, increasing)
- `isActive`: boolean - Account status for deceased members
- `preferences`: JSONB - UI preferences, privacy settings
- `lastActiveAt`: Date - For collaboration features

**TypeScript Interface:**
```typescript
interface FamilyMember {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: Date;
  role: 'admin' | 'contributor' | 'viewer' | 'child';
  generationLevel: number;
  isActive: boolean;
  preferences: FamilyPreferences;
  relationships: FamilyRelationship[];
  lastActiveAt: Date;
  createdAt: Date;
}

interface FamilyPreferences {
  uiTheme: 'child' | 'adult' | 'senior';
  privacyDefault: 'public' | 'family' | 'private';
  notificationSettings: NotificationConfig;
}
```

**Relationships:**
- Many-to-many with Memory (participants)
- Self-referencing many-to-many for family relationships
- One-to-many with MediaItem (uploaded content)

### Location

**Purpose:** Hierarchical location management for FamilyAtlas features, supporting everything from specific addresses to broad geographic regions with historical context.

**Key Attributes:**
- `id`: UUID - Location identifier
- `name`: string - Human-readable name
- `type`: enum('address', 'city', 'region', 'country', 'custom') - Location granularity
- `coordinates`: Point (PostGIS) - Geographic center point
- `bounds`: Polygon? - Geographic boundary for regions
- `parentLocationId`: UUID? - Hierarchical organization
- `historicalContext`: JSONB - Era-specific information
- `privacyZone`: boolean - Hide exact coordinates for sensitive locations

**TypeScript Interface:**
```typescript
interface Location {
  id: string;
  name: string;
  type: 'address' | 'city' | 'region' | 'country' | 'custom';
  coordinates: GeoPoint;
  bounds?: GeoPolygon;
  parentLocationId?: string;
  historicalContext: HistoricalContext;
  privacyZone: boolean;
  memoriesCount: number;
  createdAt: Date;
}

interface HistoricalContext {
  timesPeriods: TimePeriod[];
  culturalNotes?: string;
  historicalEvents?: HistoricalEvent[];
}
```

**Relationships:**
- One-to-many with Memory
- Self-referencing hierarchy (parent/child locations)
- Many-to-many with TimePeriod for historical context

### Timeline

**Purpose:** Organizational structure for grouping memories into coherent narratives (family vacations, life stages, migration journeys) with collaborative editing support.

**Key Attributes:**
- `id`: UUID - Timeline identifier
- `title`: string - Timeline name
- `description`: string - Timeline purpose/context
- `startDate`: Date - Timeline beginning
- `endDate`: Date? - Timeline end (ongoing if null)
- `type`: enum('personal', 'family', 'event', 'migration') - Timeline category
- `collaborators`: UUID[] - Family members who can edit
- `isPublic`: boolean - Visibility to extended family/guests
- `templateId`: UUID? - Based on milestone templates (child biography, etc.)

**TypeScript Interface:**
```typescript
interface Timeline {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  type: 'personal' | 'family' | 'event' | 'migration';
  collaborators: string[];
  isPublic: boolean;
  templateId?: string;
  memories: Memory[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- One-to-many with Memory
- Many-to-many with FamilyMember (collaborators)
- Belongs-to TimelineTemplate (optional)

---

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Our Line in Time Family Memory API
  version: 1.0.0
  description: REST API for family memory preservation with multimedia, geographic, and temporal features
servers:
  - url: http://localhost:3001/api/v1
    description: Local development server
  - url: https://family-memories.local/api/v1
    description: Self-hosted family server

paths:
  # Authentication & Family Management
  /auth/login:
    post:
      summary: Family member authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                familyCode:
                  type: string
                  description: Optional family identification code
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  familyMember:
                    $ref: '#/components/schemas/FamilyMember'
                  permissions:
                    type: array
                    items:
                      type: string

  /family/members:
    get:
      summary: List family members
      security:
        - bearerAuth: []
      parameters:
        - name: generation
          in: query
          schema:
            type: integer
          description: Filter by generation level
        - name: active
          in: query
          schema:
            type: boolean
          description: Filter by active status
      responses:
        '200':
          description: Family members list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FamilyMember'

  # Memory Management (Core CRUD)
  /memories:
    get:
      summary: Retrieve memories with advanced filtering
      security:
        - bearerAuth: []
      parameters:
        - name: startDate
          in: query
          schema:
            type: string
            format: date
          description: Filter memories from this date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
          description: Filter memories until this date
        - name: location
          in: query
          schema:
            type: string
          description: Geographic bounding box (SW_lat,SW_lng,NE_lat,NE_lng)
        - name: familyMember
          in: query
          schema:
            type: string
          description: Filter by family member ID
        - name: privacyLevel
          in: query
          schema:
            type: string
            enum: [public, family, private]
        - name: hasMedia
          in: query
          schema:
            type: boolean
          description: Filter memories with/without media
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Paginated memories list
          content:
            application/json:
              schema:
                type: object
                properties:
                  memories:
                    type: array
                    items:
                      $ref: '#/components/schemas/Memory'
                  pagination:
                    $ref: '#/components/schemas/PaginationInfo'
                  spatialSummary:
                    $ref: '#/components/schemas/SpatialSummary'

    post:
      summary: Create new memory
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateMemoryRequest'
      responses:
        '201':
          description: Memory created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Memory'

  /memories/{memoryId}:
    get:
      summary: Get specific memory with full details
      security:
        - bearerAuth: []
      parameters:
        - name: memoryId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Memory details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MemoryDetailed'

    put:
      summary: Update memory (supports collaborative editing)
      security:
        - bearerAuth: []
      parameters:
        - name: memoryId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: lastModified
          in: header
          required: true
          schema:
            type: string
            format: date-time
          description: Optimistic locking for collaborative editing
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateMemoryRequest'
      responses:
        '200':
          description: Memory updated successfully
        '409':
          description: Conflict - memory was modified by another family member

  # Geographic Queries (FamilyAtlas)
  /geographic/memories:
    get:
      summary: Advanced geographic memory queries for FamilyAtlas
      security:
        - bearerAuth: []
      parameters:
        - name: center
          in: query
          required: true
          schema:
            type: string
          description: Center point (lat,lng)
        - name: radius
          in: query
          schema:
            type: number
          description: Search radius in kilometers
        - name: bounds
          in: query
          schema:
            type: string
          description: Alternative to center/radius - bounding box
        - name: timeRange
          in: query
          schema:
            type: string
          description: Date range (YYYY-MM-DD,YYYY-MM-DD)
        - name: cluster
          in: query
          schema:
            type: boolean
            default: true
          description: Return clustered results for map display
      responses:
        '200':
          description: Geographic memory data
          content:
            application/json:
              schema:
                type: object
                properties:
                  clusters:
                    type: array
                    items:
                      $ref: '#/components/schemas/MemoryCluster'
                  memories:
                    type: array
                    items:
                      $ref: '#/components/schemas/MemoryGeoSummary'

  /geographic/migration-paths:
    get:
      summary: Family migration route visualization
      security:
        - bearerAuth: []
      parameters:
        - name: familyMember
          in: query
          schema:
            type: string
          description: Specific family member or all if omitted
        - name: generations
          in: query
          schema:
            type: string
          description: Generation levels (0,1,2)
        - name: timeSpan
          in: query
          schema:
            type: string
          description: Decade range (1950,2020)
      responses:
        '200':
          description: Migration path data
          content:
            application/json:
              schema:
                type: object
                properties:
                  paths:
                    type: array
                    items:
                      $ref: '#/components/schemas/MigrationPath'

  # Media Management
  /media/upload:
    post:
      summary: Upload multimedia content with metadata extraction
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
                memoryId:
                  type: string
                  format: uuid
                  description: Associated memory ID
                extractMetadata:
                  type: boolean
                  default: true
                  description: Extract EXIF/GPS data
      responses:
        '201':
          description: Media uploaded successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  mediaItems:
                    type: array
                    items:
                      $ref: '#/components/schemas/MediaItem'
                  processingStatus:
                    type: string
                    enum: [complete, processing, error]

  /media/{mediaId}/thumbnail:
    get:
      summary: Get optimized thumbnail
      security:
        - bearerAuth: []
      parameters:
        - name: mediaId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: size
          in: query
          schema:
            type: string
            enum: [small, medium, large]
            default: medium
      responses:
        '200':
          description: Thumbnail image
          content:
            image/jpeg:
              schema:
                type: string
                format: binary

  # Timeline Management
  /timelines:
    get:
      summary: List accessible timelines
      security:
        - bearerAuth: []
      parameters:
        - name: type
          in: query
          schema:
            type: string
            enum: [personal, family, event, migration]
        - name: collaborator
          in: query
          schema:
            type: boolean
          description: Show only timelines where user is collaborator
      responses:
        '200':
          description: Timelines list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Timeline'

  /timelines/{timelineId}/memories:
    get:
      summary: Get timeline memories in chronological order
      security:
        - bearerAuth: []
      parameters:
        - name: timelineId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Chronologically ordered memories
          content:
            application/json:
              schema:
                type: object
                properties:
                  timeline:
                    $ref: '#/components/schemas/Timeline'
                  memories:
                    type: array
                    items:
                      $ref: '#/components/schemas/Memory'

  # Collaborative Features (REST endpoints for WebSocket setup)
  /collaboration/sessions:
    post:
      summary: Start collaborative editing session
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                resourceType:
                  type: string
                  enum: [memory, timeline]
                resourceId:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Collaboration session created
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessionId:
                    type: string
                  websocketUrl:
                    type: string
                  collaborators:
                    type: array
                    items:
                      $ref: '#/components/schemas/FamilyMember'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    FamilyMember:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, contributor, viewer, child]
        generationLevel:
          type: integer
        isActive:
          type: boolean
        preferences:
          $ref: '#/components/schemas/FamilyPreferences'
        lastActiveAt:
          type: string
          format: date-time

    Memory:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        narrative:
          type: string
        dateType:
          type: string
          enum: [exact, approximate, range, era]
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
        location:
          $ref: '#/components/schemas/GeoPoint'
        locationName:
          type: string
        privacyLevel:
          type: string
          enum: [public, family, private]
        mediaItems:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        familyMembers:
          type: array
          items:
            type: string
            format: uuid
        createdBy:
          type: string
          format: uuid
        lastModifiedBy:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    MediaItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        filename:
          type: string
        mimeType:
          type: string
        fileSize:
          type: integer
        storagePath:
          type: string
        thumbnailPath:
          type: string
          nullable: true
        extractedMetadata:
          type: object
        capturedAt:
          type: string
          format: date-time
          nullable: true
        capturedLocation:
          $ref: '#/components/schemas/GeoPoint'
        processingStatus:
          type: string
          enum: [pending, processing, complete, error]

    GeoPoint:
      type: object
      properties:
        latitude:
          type: number
          format: double
          minimum: -90
          maximum: 90
        longitude:
          type: number
          format: double
          minimum: -180
          maximum: 180
        accuracy:
          type: number
          description: GPS accuracy in meters

    MemoryCluster:
      type: object
      properties:
        center:
          $ref: '#/components/schemas/GeoPoint'
        count:
          type: integer
        bounds:
          type: object
          properties:
            southwest:
              $ref: '#/components/schemas/GeoPoint'
            northeast:
              $ref: '#/components/schemas/GeoPoint'
        timeRange:
          type: object
          properties:
            earliest:
              type: string
              format: date
            latest:
              type: string
              format: date

    MigrationPath:
      type: object
      properties:
        familyMember:
          $ref: '#/components/schemas/FamilyMember'
        path:
          type: array
          items:
            type: object
            properties:
              location:
                $ref: '#/components/schemas/GeoPoint'
              locationName:
                type: string
              timeRange:
                type: object
                properties:
                  start:
                    type: string
                    format: date
                  end:
                    type: string
                    format: date
              memoriesCount:
                type: integer

    Timeline:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
        type:
          type: string
          enum: [personal, family, event, migration]
        collaborators:
          type: array
          items:
            type: string
            format: uuid
        isPublic:
          type: boolean

    FamilyPreferences:
      type: object
      properties:
        uiTheme:
          type: string
          enum: [child, adult, senior]
        privacyDefault:
          type: string
          enum: [public, family, private]
        notificationSettings:
          type: object

    PaginationInfo:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

    SpatialSummary:
      type: object
      properties:
        boundingBox:
          type: object
          properties:
            southwest:
              $ref: '#/components/schemas/GeoPoint'
            northeast:
              $ref: '#/components/schemas/GeoPoint'
        centerPoint:
          $ref: '#/components/schemas/GeoPoint'
        clusters:
          type: array
          items:
            $ref: '#/components/schemas/MemoryCluster'
```

---

---

## Unified Project Structure

```plaintext
our-line-in-time/
├── .github/                      # CI/CD workflows and GitHub configuration
│   ├── workflows/
│   │   ├── ci.yml               # Test and lint on all PRs
│   │   ├── deploy-staging.yml   # Deploy to staging environment
│   │   ├── deploy-production.yml # Deploy to production/family server
│   │   └── backup.yml           # Automated family data backup
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── milestone_epic.md
│   └── pull_request_template.md
├── apps/                         # Application packages
│   ├── web/                     # Next.js frontend application
│   │   ├── public/
│   │   │   ├── icons/           # Family-friendly icons and favicons
│   │   │   ├── images/          # Static images and placeholders
│   │   │   └── manifest.json    # PWA manifest for mobile access
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router structure
│   │   │   │   ├── (dashboard)/ # Protected family dashboard routes
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx # Family dashboard home
│   │   │   │   │   ├── memories/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── edit/page.tsx
│   │   │   │   │   │   └── new/page.tsx
│   │   │   │   │   ├── timeline/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   │   └── create/page.tsx
│   │   │   │   │   ├── map/
│   │   │   │   │   │   └── page.tsx # FamilyAtlas interface
│   │   │   │   │   ├── family/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [memberId]/page.tsx
│   │   │   │   │   │   └── invite/page.tsx
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── privacy/page.tsx
│   │   │   │   │       └── export/page.tsx
│   │   │   │   ├── auth/        # Authentication pages
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── setup/page.tsx
│   │   │   │   ├── api/         # Next.js API routes (proxy to backend)
│   │   │   │   │   ├── auth/route.ts
│   │   │   │   │   ├── upload/route.ts
│   │   │   │   │   └── websocket/route.ts
│   │   │   │   ├── globals.css
│   │   │   │   └── layout.tsx   # Root layout
│   │   │   ├── components/      # React components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── services/        # API client services
│   │   │   ├── stores/          # Zustand state management
│   │   │   ├── utils/           # Frontend utilities
│   │   │   └── styles/          # Tailwind CSS and themes
│   │   ├── tests/               # Frontend tests
│   │   ├── next.config.js       # Next.js configuration
│   │   ├── tailwind.config.js   # Tailwind CSS configuration
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   └── api/                     # Express.js backend application
│       ├── src/                 # Backend source
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── config/
│       │   ├── utils/
│       │   ├── types/
│       │   ├── websocket/
│       │   └── app.ts
│       ├── tests/               # Backend tests
│       ├── migrations/          # Database migrations
│       ├── seeds/               # Database seed data
│       ├── Dockerfile           # Backend container
│       ├── tsconfig.json
│       ├── package.json
│       └── README.md
├── packages/                    # Shared packages
│   ├── shared/                  # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/           # TypeScript interfaces
│   │   │   ├── constants/       # Shared constants
│   │   │   ├── utils/           # Shared utilities
│   │   │   ├── schemas/         # Validation schemas
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   ├── ui/                      # Shared UI components library
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── hooks/           # Shared React hooks
│   │   │   ├── styles/          # Component styles
│   │   │   └── index.ts
│   │   ├── stories/             # Storybook stories
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   └── config/                  # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       ├── jest/
│       ├── tailwind/
│       └── prettier/
├── infrastructure/              # Infrastructure as Code
│   ├── docker/
│   │   ├── docker-compose.yml   # Main family deployment
│   │   ├── docker-compose.dev.yml # Development environment
│   │   ├── docker-compose.prod.yml # Production overrides
│   │   ├── Dockerfile.web       # Frontend container
│   │   ├── Dockerfile.api       # Backend container
│   │   ├── Dockerfile.db        # PostgreSQL + PostGIS
│   │   └── nginx.conf           # Nginx configuration
│   ├── deployment/
│   │   ├── family-setup.sh      # One-click family deployment
│   │   ├── backup-script.sh     # Automated backup
│   │   ├── restore-script.sh    # Disaster recovery
│   │   └── update-script.sh     # Version updates
│   └── scripts/                 # Build and development scripts
├── docs/                       # Documentation
│   ├── prd/                    # Sharded PRD documents
│   ├── architecture/           # Sharded architecture documents
│   ├── api/                    # API documentation
│   ├── user-guides/            # Family member guides
│   ├── developer/              # Development guides
│   ├── family/                 # Family-specific documentation
│   └── README.md
├── tests/                      # End-to-end tests
│   ├── e2e/                    # Playwright E2E tests
│   ├── fixtures/               # Test data
│   ├── utils/                  # Test utilities
│   └── playwright.config.ts
├── .env.example               # Environment variable template
├── .gitignore
├── package.json               # Root package.json with workspaces
├── tsconfig.json              # Root TypeScript configuration
├── LICENSE                    # Open source license
└── README.md                  # Project overview and setup
```

---

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# System requirements
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version # >= 20.0.0
docker-compose --version # >= 2.0.0

# Optional but recommended
git --version   # >= 2.30.0
```

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-family/our-line-in-time.git
cd our-line-in-time

# Install dependencies for all packages
npm install

# Copy environment templates
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Start infrastructure services (PostgreSQL, Redis, MinIO)
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Generate TypeScript types from database schema
npm run db:generate-types
```

#### Development Commands

```bash
# Start all services in development mode
npm run dev

# Start frontend only
npm run dev:web

# Start backend only
npm run dev:api

# Run tests
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests

# Build for production
npm run build             # Build all apps
npm run build:web         # Build frontend only
npm run build:api         # Build backend only

# Database operations
npm run db:migrate        # Run pending migrations
npm run db:rollback       # Rollback last migration
npm run db:reset          # Reset database (dev only)
npm run db:seed           # Seed test data
npm run db:backup         # Create backup
npm run db:restore        # Restore from backup

# Code quality
npm run lint              # ESLint all packages
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript type checking
npm run format            # Prettier formatting
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_MAP_PROVIDER=openstreetmap
NEXT_PUBLIC_ENVIRONMENT=development

# Backend (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://family:password@localhost:5432/ourlineintime
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
JWT_SECRET=your-super-secure-jwt-secret-for-development
SESSION_SECRET=your-super-secure-session-secret-for-development
BCRYPT_ROUNDS=10
UPLOAD_MAX_SIZE=50MB

# Shared
LOG_LEVEL=info
FAMILY_INVITE_SECRET=your-family-invite-secret
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Self-hosted Docker container with Nginx
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/.next`
- **CDN/Edge:** Nginx static file serving with compression

**Backend Deployment:**
- **Platform:** Self-hosted Docker container
- **Build Command:** `npm run build:api`
- **Deployment Method:** Docker Compose with health checks

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ourlineintime_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ourlineintime_test
          REDIS_URL: redis://localhost:6379

      - name: Build applications
        run: npm run build

  e2e-test:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
          npm run db:migrate
          npm run db:seed

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  deploy-staging:
    needs: [test, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging server"
        # Implementation depends on family hosting setup

  deploy-production:
    needs: [test, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Family Release v${{ github.run_number }}
          draft: false
          prerelease: false

      - name: Deploy to production
        run: echo "Deploy to family server"
        # Implementation depends on family hosting setup
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | https://staging.family-memories.local | https://api-staging.family-memories.local | Pre-production testing |
| Production | https://family-memories.local | https://api.family-memories.local | Live family environment |

---

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- XSS Prevention: Content sanitization, React's built-in XSS protection, input validation
- Secure Storage: JWT tokens in httpOnly cookies, sensitive data encrypted in localStorage

**Backend Security:**
- Input Validation: Joi schema validation on all endpoints, SQL injection prevention with parameterized queries
- Rate Limiting: 100 requests per minute per IP, 1000 requests per hour per authenticated user
- CORS Policy: `origin: ['https://family-memories.local'], credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE']`

**Authentication Security:**
- Token Storage: JWT in httpOnly cookies with secure flag, refresh token rotation
- Session Management: Redis-based sessions with 24-hour expiry, automatic logout on inactivity
- Password Policy: Minimum 12 characters, bcrypt hashing with 12 rounds, no common passwords

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 500KB initial load, < 1MB total assets
- Loading Strategy: Progressive loading, image lazy loading, code splitting by route
- Caching Strategy: Service worker caching, API response caching (5 minutes), static asset caching (1 year)

**Backend Performance:**
- Response Time Target: < 200ms for API calls, < 500ms for complex geographic queries
- Database Optimization: PostgreSQL query optimization, PostGIS spatial indexes, connection pooling
- Caching Strategy: Redis caching for frequently accessed data (1 hour TTL), memory caching for static data

---

## Testing Strategy

### Testing Pyramid

```
      E2E Tests (10%)
    /              \
   Integration Tests (30%)
  /                        \
Frontend Unit (30%)    Backend Unit (30%)
```

### Test Organization

#### Frontend Tests

```
apps/web/tests/
├── components/           # Component unit tests
│   ├── memory/
│   │   ├── MemoryCard.test.tsx
│   │   └── MemoryForm.test.tsx
│   ├── map/
│   │   ├── FamilyMap.test.tsx
│   │   └── MemoryCluster.test.tsx
│   └── timeline/
│       └── TimelineView.test.tsx
├── hooks/               # Custom hook tests
│   ├── useAuth.test.ts
│   ├── useMemories.test.ts
│   └── useCollaboration.test.ts
├── services/            # API service tests
│   ├── memory.service.test.ts
│   └── geographic.service.test.ts
├── utils/               # Utility function tests
└── __mocks__/           # Test mocks
```

#### Backend Tests

```
apps/api/tests/
├── unit/                # Service and repository unit tests
│   ├── services/
│   │   ├── memory.service.test.ts
│   │   ├── geographic.service.test.ts
│   │   └── auth.service.test.ts
│   ├── repositories/
│   │   ├── memory.repository.test.ts
│   │   └── location.repository.test.ts
│   └── utils/
├── integration/         # API integration tests
│   ├── auth.integration.test.ts
│   ├── memory.integration.test.ts
│   ├── geographic.integration.test.ts
│   └── collaboration.integration.test.ts
├── fixtures/           # Test data
│   ├── families.ts
│   ├── memories.ts
│   └── locations.ts
└── setup.ts            # Test configuration
```

#### E2E Tests

```
tests/e2e/
├── auth.spec.ts        # Authentication flows
├── memories.spec.ts    # Memory CRUD operations
├── timeline.spec.ts    # Timeline management
├── map.spec.ts         # FamilyAtlas interactions
├── collaboration.spec.ts # Real-time editing
├── family.spec.ts      # Family member management
└── privacy.spec.ts     # Privacy and permissions
```

### Test Examples

#### Frontend Component Test

```typescript
// apps/web/tests/components/memory/MemoryCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { Memory } from '@our-line/shared/types';

const mockMemory: Memory = {
  id: '123',
  title: 'Family Vacation',
  narrative: 'Great time at the beach',
  dateType: 'exact',
  startDate: new Date('2023-07-01'),
  location: { latitude: 40.7128, longitude: -74.0060 },
  locationName: 'New York, NY',
  privacyLevel: 'family',
  mediaItems: [],
  familyMembers: [],
  createdBy: 'user-123',
  lastModifiedBy: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('MemoryCard', () => {
  it('displays memory information correctly', () => {
    render(<MemoryCard memory={mockMemory} />);

    expect(screen.getByText('Family Vacation')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('Great time at the beach')).toBeInTheDocument();
  });

  it('handles edit action when user has permission', () => {
    const onEdit = jest.fn();
    render(<MemoryCard memory={mockMemory} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockMemory);
  });

  it('respects privacy levels in display', () => {
    const privateMemory = { ...mockMemory, privacyLevel: 'private' as const };
    render(<MemoryCard memory={privateMemory} />);

    expect(screen.getByText('private')).toBeInTheDocument();
  });
});
```

#### Backend API Test

```typescript
// apps/api/tests/integration/memory.integration.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';

describe('Memory API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/memories', () => {
    it('creates a new memory with geographic data', async () => {
      const memoryData = {
        title: 'Test Memory',
        narrative: 'Test narrative',
        dateType: 'exact',
        startDate: '2023-07-01',
        location: [40.7128, -74.0060],
        locationName: 'New York, NY',
        privacyLevel: 'family'
      };

      const response = await request(app)
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${testToken}`)
        .send(memoryData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(memoryData.title);
      expect(response.body.location.latitude).toBe(40.7128);
      expect(response.body.location.longitude).toBe(-74.0060);
    });

    it('validates geographic coordinates', async () => {
      const invalidMemoryData = {
        title: 'Test Memory',
        dateType: 'exact',
        startDate: '2023-07-01',
        location: [91, -181], // Invalid coordinates
        privacyLevel: 'family'
      };

      const response = await request(app)
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidMemoryData)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });
  });
});
```

#### E2E Test

```typescript
// tests/e2e/memories.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as family member
    await page.goto('/auth/login');
    await page.fill('[data-testid=email]', 'parent@family.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('creates a memory with photo and location', async ({ page }) => {
    // Navigate to memory creation
    await page.click('[data-testid=create-memory-button]');
    await expect(page).toHaveURL('/memories/new');

    // Fill memory form
    await page.fill('[data-testid=memory-title]', 'Family Beach Day');
    await page.fill('[data-testid=memory-narrative]', 'Amazing day at the beach with the kids');
    await page.selectOption('[data-testid=date-type]', 'exact');
    await page.fill('[data-testid=start-date]', '2023-07-15');

    // Add location
    await page.click('[data-testid=add-location-button]');
    await page.fill('[data-testid=location-search]', 'Santa Monica Beach');
    await page.click('[data-testid=location-result-0]');

    // Upload photo
    await page.setInputFiles('[data-testid=photo-upload]', 'tests/fixtures/beach-photo.jpg');
    await expect(page.locator('[data-testid=upload-progress]')).toBeVisible();
    await expect(page.locator('[data-testid=upload-complete]')).toBeVisible({ timeout: 10000 });

    // Save memory
    await page.click('[data-testid=save-memory-button]');

    // Verify creation
    await expect(page).toHaveURL(/\/memories\/[a-f0-9-]+/);
    await expect(page.locator('[data-testid=memory-title]')).toContainText('Family Beach Day');
    await expect(page.locator('[data-testid=memory-location]')).toContainText('Santa Monica Beach');
    await expect(page.locator('[data-testid=memory-photo]')).toBeVisible();
  });

  test('displays memories on family map', async ({ page }) => {
    // Navigate to FamilyAtlas
    await page.click('[data-testid=family-atlas-nav]');
    await expect(page).toHaveURL('/map');

    // Wait for map to load
    await expect(page.locator('[data-testid=family-map]')).toBeVisible();

    // Verify memory clusters appear
    await expect(page.locator('[data-testid=memory-cluster]')).toHaveCount({ gt: 0 });

    // Click on a cluster
    await page.click('[data-testid=memory-cluster]:first-child');

    // Verify memory popup
    await expect(page.locator('[data-testid=memory-popup]')).toBeVisible();
    await expect(page.locator('[data-testid=memory-popup-title]')).toContainText('Family Beach Day');
  });
});
```

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there - ensures frontend/backend consistency
- **API Calls:** Never make direct HTTP calls - use the service layer for consistent error handling and authentication
- **Environment Variables:** Access only through config objects, never process.env directly - enables proper validation and defaults
- **Error Handling:** All API routes must use the standard error handler - provides consistent error responses and logging
- **State Updates:** Never mutate state directly - use proper state management patterns for predictable updates
- **Database Queries:** Always use parameterized queries - prevents SQL injection and enables query optimization
- **Geographic Data:** Use PostGIS spatial types and functions - ensures accurate geographic calculations and indexing
- **Privacy Enforcement:** Check family member permissions before data access - maintains multi-generational privacy
- **Media Processing:** Handle file uploads asynchronously with status tracking - prevents blocking family interactions
- **Real-time Updates:** Use WebSocket events for collaborative features - enables seamless family collaboration

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `MemoryCard.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| Services | PascalCase classes | PascalCase classes | `MemoryService` |
| API Routes | - | kebab-case | `/api/memories/{memory-id}` |
| Database Tables | - | snake_case | `family_members` |
| Types/Interfaces | PascalCase | PascalCase | `FamilyMember` |
| Constants | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

---

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant API_Gateway
    participant Service
    participant Database

    Client->>API_Gateway: Request with invalid data
    API_Gateway->>API_Gateway: Validation middleware
    API_Gateway-->>Client: 400 Bad Request

    Client->>API_Gateway: Valid request
    API_Gateway->>Service: Process request
    Service->>Database: Query
    Database-->>Service: Database error
    Service->>Service: Handle & log error
    Service-->>API_Gateway: ServiceError
    API_Gateway->>API_Gateway: Error middleware
    API_Gateway-->>Client: 500 Internal Server Error

    Client->>Client: Handle error response
    Client->>Client: Show user-friendly message
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// apps/web/src/utils/errorHandler.ts
export class FamilyErrorHandler {
  static handleApiError(error: ApiError, showToast: boolean = true): string {
    const { code, message, details } = error.error;

    // Family-friendly error messages
    const friendlyMessages: Record<string, string> = {
      'INVALID_COORDINATES': 'Please check the location you entered',
      'EDIT_CONFLICT': 'Another family member is editing this memory',
      'INSUFFICIENT_PERMISSIONS': 'You don\'t have permission for this action',
      'MEMORY_NOT_FOUND': 'This memory couldn\'t be found',
      'UPLOAD_TOO_LARGE': 'This file is too large to upload',
      'INVALID_DATE_RANGE': 'Please check your start and end dates'
    };

    const friendlyMessage = friendlyMessages[code] || 'Something went wrong. Please try again.';

    if (showToast) {
      // Show user-friendly toast notification
      toast.error(friendlyMessage);
    }

    // Log detailed error for debugging
    console.error('API Error:', { code, message, details });

    return friendlyMessage;
  }

  static handleNetworkError(): string {
    const message = 'Unable to connect. Please check your internet connection.';
    toast.error(message);
    return message;
  }

  static handleValidationError(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach(message => {
        toast.error(`${field}: ${message}`);
      });
    });
  }
}
```

### Backend Error Handling

```typescript
// apps/api/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error details
  logger.error('API Error', {
    requestId,
    error: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id,
    timestamp
  });

  // Family-friendly error responses
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';

  const errorResponse = {
    error: {
      code: errorCode,
      message: getPublicErrorMessage(errorCode, error.message),
      details: statusCode >= 500 ? undefined : error.details,
      timestamp,
      requestId
    }
  };

  res.status(statusCode).json(errorResponse);
}

function getPublicErrorMessage(code: string, originalMessage: string): string {
  // Don't expose internal error details to family members
  const publicMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your input and try again',
    'UNAUTHORIZED': 'Please log in to continue',
    'FORBIDDEN': 'You don\'t have permission for this action',
    'NOT_FOUND': 'The requested item could not be found',
    'CONFLICT': 'This item is being edited by another family member',
    'INTERNAL_ERROR': 'Something went wrong on our end. Please try again later.'
  };

  return publicMessages[code] || 'An unexpected error occurred';
}

// Custom error classes for family platform
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  code = 'EDIT_CONFLICT';

  constructor(message: string, public conflicts?: any) {
    super(message);
    this.details = { conflicts };
  }
}

export class PrivacyError extends Error implements AppError {
  statusCode = 403;
  code = 'PRIVACY_VIOLATION';

  constructor(message: string = 'Access denied due to privacy settings') {
    super(message);
  }
}
```

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Simple analytics with privacy focus, React error boundaries, performance metrics
- **Backend Monitoring:** Winston logging, basic health checks, database connection monitoring
- **Error Tracking:** Custom error logging (no external services for family privacy)
- **Performance Monitoring:** Response time tracking, database query performance, memory usage

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and stack traces
- API response times from client perspective
- User interactions (memory creation, map usage, collaboration events)

**Backend Metrics:**
- Request rate and response times by endpoint
- Error rate and error types
- Database query performance and connection pool usage
- Memory and CPU usage for family-scale deployment

```typescript
// Simple family-focused monitoring
export class FamilyMonitor {
  static trackMemoryCreation(memoryId: string, userId: string) {
    logger.info('Family Activity', {
      event: 'memory_created',
      memoryId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static trackCollaboration(sessionId: string, participants: string[]) {
    logger.info('Family Collaboration', {
      event: 'collaboration_session',
      sessionId,
      participantCount: participants.length,
      timestamp: new Date().toISOString()
    });
  }

  static trackPerformance(endpoint: string, duration: number) {
    logger.info('Performance', {
      endpoint,
      duration,
      timestamp: new Date().toISOString()
    });
  }
}
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive full-stack architecture for 8-milestone roadmap", "status": "completed", "activeForm": "Completed comprehensive full-stack architecture document"}, {"content": "Complete remaining architecture sections", "status": "completed", "activeForm": "Finished all architecture sections including development, deployment, security, testing"}]