# Homeopathic Telemedicine Web Application

## Overview

A scalable homeopathic consultation web application designed for Indian patients. The platform enables OTP-based authentication (mobile/email), patient registration with comprehensive health profiles, and audio consultation capabilities. Built as a full-stack TypeScript application with React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON APIs under `/api` prefix
- **Session Management**: Express session with PostgreSQL session store (connect-pg-simple)
- **File Uploads**: Multer for audio file handling with disk storage
- **Build System**: Custom esbuild script that bundles server dependencies for optimized cold starts

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Tables**:
  - `patients`: User profiles with health information
  - `otpSessions`: OTP codes for authentication
  - `consultations`: Audio consultation records with transcripts
- **Migrations**: Drizzle Kit with push-based schema sync (`db:push`)

### Authentication Flow
- OTP-based authentication (no passwords)
- Supports both mobile number and email as identifiers
- 6-digit OTP codes with expiration and attempt limiting
- Session-based authentication after OTP verification
- Protected routes check session validity via `/api/auth/me`

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (shadcn/ui)
    pages/        # Route pages (login, register, dashboard)
    lib/          # Utilities, auth context, query client
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between frontend/backend
  schema.ts       # Drizzle schema and Zod validators
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

### UI Framework
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-built component library using Radix + Tailwind
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type safety across the full stack
- **Zod**: Runtime schema validation shared between client/server

### File Storage
- Audio consultations stored locally in `uploads/` directory
- Multer handles multipart form uploads with size limits (50MB)
- Supports WebM, WAV, MP3, MPEG, and OGG audio formats